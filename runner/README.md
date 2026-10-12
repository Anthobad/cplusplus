# Isolated C++ Sandbox Runner

This service provides an isolated microservice for compiling and executing untrusted student C++ code.

## Architecture

```
[ Frontend Browser ]
       ↓
[ Authoritative Web Server (server.ts / evaluateSubmission.ts) ]
       ↓ (HTTP POST /evaluate with Google OIDC ID Token)
[ Google Cloud Run IAM Proxy (--no-allow-unauthenticated) ]
       ↓
[ Isolated Runner Service (runner/server.ts) ]
       ↓
[ Linux Kernel Sandbox Boundary ]
  ├── prlimit (Memory: 256MB AS, Processes: 16 nproc, File write: 10MB)
  ├── unshare --net (Network namespace dropped, zero socket access)
  ├── Process Group SIGKILL on timeout
  ├── Strict 64KB stdout/stderr buffer slice
  ├── Transient /tmp/sandbox_cpp_<uuid> workspace (deleted in finally)
  └── Scrubbed environment (no website secrets or API keys)
```

## Security & Isolation Controls

| Security Layer | Mechanism | Protection Provided |
| :--- | :--- | :--- |
| **Authentication** | Google Cloud IAM / OIDC ID Token (`roles/run.invoker`) | Blocks unauthenticated public access. Only the authorized website can invoke the runner. |
| **Network Isolation** | `unshare --net` | Drops network access entirely. Student C++ cannot create sockets, make outbound HTTP requests, or scan ports. |
| **Memory Limit** | `prlimit --as=268435456` (256MB) | Memory exhaustion allocations fail with `std::bad_alloc` / `ENOMEM`. |
| **Fork-Bomb Protection** | `prlimit --nproc=16` | Thread/process fork attacks fail with `EAGAIN` after 16 processes. |
| **Disk Protection** | `prlimit --fsize=10485760` (10MB) | File writing attacks terminate with `SIGXFSZ`. |
| **Process Termination** | Process Group `SIGKILL` | Runaway processes and all child forks are terminated immediately on timeout. |
| **Time Limits** | 8000ms compilation / 2500ms per test | Halts infinite loops and heavy computational stalls. |
| **Buffer Cap** | 64KB stdout/stderr slice | Prevents output flooding attacks (`while(true) cout << 'a'`). |
| **Secret Sanitization** | Stripped environment (`PATH`, `TMPDIR` only) | Application secrets (`GEMINI_API_KEY`, etc.) are never present in the runner process. |
| **Ephemeral Filesystem** | Per-request UUID temp dir unlinked in `finally` | Zero persistence of student source code or compiled binaries. |
| **Host Segregation** | Separate Cloud Run container | In production, student code is never executed inside the website container. |

## Google Cloud Run (Free Tier) Deployment

The runner is configured to scale to zero (`minScale: 0`), incurring **$0.00** when not actively processing code evaluations:

```bash
./runner/deploy.sh <GCP_PROJECT_ID> <REGION> <WEBSITE_SERVICE_ACCOUNT>
```

Example:
```bash
./runner/deploy.sh concentrated-fusion-tdw25 us-central1 588239623600-compute@developer.gserviceaccount.com
```

Once deployed, set the Cloud Run URL in your AI Studio or production environment variables:
```env
ISOLATED_RUNNER_ENDPOINT=https://cpp-isolated-runner-<hash>-uc.a.run.app
```

## Zero-Billing Production Architecture (Wandbox Provider)

When deploying on Google AI Studio without a Google Cloud billing account or credit card:
- If `ISOLATED_RUNNER_ENDPOINT` is omitted in production, the application automatically selects `WandboxCodeRunner`.
- C++ compilation and execution are delegated to the public Wandbox execution service (using GCC C++20).
- Zero user data, credentials, or hidden tests leave our backend: only the necessary C++ source code and test input are sent.
- Our authoritative backend remains solely responsible for pass/fail evaluation, scoring, and sanitizing hidden test cases.
- If Google Cloud billing becomes available later, deploying the Cloud Run runner and configuring `ISOLATED_RUNNER_ENDPOINT` automatically switches the app back to the private isolated runner.
