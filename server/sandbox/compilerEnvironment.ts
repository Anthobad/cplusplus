import { createHash } from 'node:crypto';
import { supervisorSource } from './supervisor.js';

export const provisioningPolicy = { allow: ['archive.ubuntu.com', 'security.ubuntu.com'] };
export const provisionCommand = `set -eu
sed -i 's|http://|https://|g' /etc/apt/sources.list.d/ubuntu.sources
export DEBIAN_FRONTEND=noninteractive
apt-get -o Acquire::Retries=1 -o Acquire::https::Timeout=15 update
apt-get -o Acquire::Retries=1 -o Acquire::https::Timeout=15 install -y --no-install-recommends g++-15 binutils libjansson4 python3 procps
ln -sf /usr/bin/g++-15 /usr/local/bin/g++
g++ --version
ld --version
install -d -m 700 /opt/cpp-runner
apt-get clean
rm -rf /var/lib/apt/lists/*`;
export const compilerVersion = createHash('sha256').update('cpp-toolchain-v1\n' + provisionCommand + supervisorSource).digest('hex');
export const snapshotExpirationMs = 7 * 24 * 60 * 60 * 1000;
export const snapshotMaxAgeMs = 7 * 24 * 60 * 60 * 1000;
export const setupCommand = 'mv /vercel/supervisor.py /opt/cpp-runner/supervisor.py && mv /vercel/compiler-version /opt/cpp-runner/version && chown -R root:root /opt/cpp-runner && chmod -R go-rwx /opt/cpp-runner';
export const environmentFiles = () => [
  { path: '/vercel/supervisor.py', content: Buffer.from(supervisorSource) },
  { path: '/vercel/compiler-version', content: Buffer.from(compilerVersion) },
];
