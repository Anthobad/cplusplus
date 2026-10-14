/** Root-owned supervisor. Students cannot write its result or access its input/config. */
export const supervisorSource = String.raw`
import ctypes, json, math, os, resource, selectors, signal, subprocess, sys, tempfile, time

config = json.load(sys.stdin)
phase = config['phase']
if phase not in ('compile', 'run'):
    raise ValueError('Invalid phase')
uid = 20000 if phase == 'compile' else 20001 + config['index']
work = tempfile.mkdtemp(prefix='cpp-')
os.chown(work, uid, uid)
os.chmod(work, 0o700)
if phase == 'compile':
    with open('/opt/cpp-runner/source.cpp', 'rb') as source:
        data = source.read()
    with open(work + '/source.cpp', 'wb') as source:
        source.write(data)
    os.chown(work + '/source.cpp', uid, uid)
    command = ['g++', '-std=c++20', '-O2', '-Wall', '-Wextra', '-pthread', work + '/source.cpp', '-o', work + '/solution']
else:
    command = ['/opt/cpp-binary/solution']

def restrict():
    os.setgroups([])
    os.setgid(uid)
    os.setuid(uid)
    # Prevent exec of setuid binaries (including sudo) from regaining privileges.
    if ctypes.CDLL(None).prctl(38, 1, 0, 0, 0) != 0:
        os._exit(125)
    resource.setrlimit(resource.RLIMIT_CORE, (0, 0))
    resource.setrlimit(resource.RLIMIT_AS, (config['memoryBytes'], config['memoryBytes']))
    resource.setrlimit(resource.RLIMIT_NPROC, (32, 32))
    resource.setrlimit(resource.RLIMIT_NOFILE, (64, 64))
    resource.setrlimit(resource.RLIMIT_FSIZE, (8*1024*1024, 8*1024*1024))
    cpu = max(1, math.ceil(config['timeoutMs']/1000))
    resource.setrlimit(resource.RLIMIT_CPU, (cpu, cpu))

started = time.monotonic()
proc = subprocess.Popen(command, cwd=work, env={'PATH':'/usr/local/bin:/usr/bin:/bin', 'HOME':work, 'LANG':'C.UTF-8'}, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, start_new_session=True, preexec_fn=restrict)
selector = selectors.DefaultSelector()
for stream, name in ((proc.stdout, 'stdout'), (proc.stderr, 'stderr')):
    os.set_blocking(stream.fileno(), False)
    selector.register(stream, selectors.EVENT_READ, name)
input_data = config.get('input', '').encode()
if input_data:
    os.set_blocking(proc.stdin.fileno(), False)
    selector.register(proc.stdin, selectors.EVENT_WRITE, 'stdin')
else:
    proc.stdin.close()
output = {'stdout':bytearray(), 'stderr':bytearray()}
timed_out = False
output_limited = False

def kill_students():
    # Kill the UID as well as the group: descendants may call setsid().
    subprocess.run(['/usr/bin/pkill', '-KILL', '-u', str(uid)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        os.killpg(proc.pid, signal.SIGKILL)
    except ProcessLookupError:
        pass

try:
    while selector.get_map():
        if (time.monotonic()-started)*1000 > config['timeoutMs']:
            timed_out = True
            break
        for key, events in selector.select(0.01):
            if key.data == 'stdin':
                try:
                    count = os.write(key.fileobj.fileno(), input_data)
                    input_data = input_data[count:]
                except BrokenPipeError:
                    input_data = b''
                if not input_data:
                    selector.unregister(key.fileobj)
                    key.fileobj.close()
                continue
            chunk = os.read(key.fileobj.fileno(), 8192)
            if not chunk:
                selector.unregister(key.fileobj)
                key.fileobj.close()
                continue
            remaining = config['outputBytes'] - sum(len(x) for x in output.values())
            output[key.data].extend(chunk[:max(0, remaining)])
            if len(chunk) > remaining:
                output_limited = True
                break
        if output_limited:
            break
    if not timed_out and not output_limited:
        remaining_time = max(0.001, config['timeoutMs']/1000 - (time.monotonic()-started))
        try:
            proc.wait(timeout=remaining_time)
        except subprocess.TimeoutExpired:
            timed_out = True
finally:
    kill_students()
    proc.wait()
    selector.close()

elapsed = (time.monotonic()-started)*1000
if proc.returncode == -signal.SIGXCPU:
    timed_out = True
if phase == 'compile' and proc.returncode == 0 and not timed_out and not output_limited:
    os.makedirs('/opt/cpp-binary', mode=0o755, exist_ok=True)
    # Root takes ownership; subsequent test UIDs cannot alter the executable.
    os.rename(work + '/solution', '/opt/cpp-binary/solution')
    os.chown('/opt/cpp-binary/solution', 0, 0)
    os.chmod('/opt/cpp-binary/solution', 0o555)
result = {key: value.decode('utf-8', errors='replace') for key, value in output.items()}
result.update(exitCode=proc.returncode, executionTimeMs=elapsed, timedOut=timed_out, outputLimited=output_limited)
# Never trust stdout from student processes as supervisor JSON.
with open('/opt/cpp-runner/result.json', 'w') as report:
    json.dump(result, report)
os.chmod('/opt/cpp-runner/result.json', 0o600)
`;
