"""Build a self-contained macOS ZIP from the reviewed allowlist."""
from pathlib import Path
import hashlib
import json
import subprocess
import sys
import zipfile

root = Path(__file__).resolve().parents[1]
version = json.loads((root / 'package.json').read_text(encoding='utf-8'))['version']
subprocess.run([sys.executable, str(root / 'build.py')], check=True)
subprocess.run([sys.executable, str(root / 'scripts/build_native.py')], check=True)

files = {
    'agent.cjs': 'agent.cjs',
    'manage.cjs': 'manage.cjs',
    'macos/shortcuts.cjs': 'macos/shortcuts.cjs',
    'macos/startup/bridge': '.devtools/macos-startup-bridge',
    'macos/startup/controller.cjs': 'macos/startup/controller.cjs',
    'macos/startup/watch.cjs': 'macos/startup/watch.cjs',
    'updater/core.cjs': 'updater/core.cjs',
    'updater/worker.cjs': 'updater/worker.cjs',
    'updater/run.sh': 'updater/run.sh',
    'scripts/mac-entry.sh': 'scripts/mac-entry.sh',
    'README.md': 'README.md',
    'LICENSE': 'LICENSE',
    'NOTICE.md': 'NOTICE.md',
    'SECURITY.md': 'SECURITY.md',
    'CHANGELOG.md': 'CHANGELOG.md',
}
if f"const VERSION='{version}';" not in (root / 'manage.cjs').read_text(encoding='utf-8'):
    raise SystemExit('Installer version differs from package.json')

payload = {name: (root / source).read_bytes() for name, source in files.items()}
for name, action in [('安装.command', 'install'), ('诊断.command', 'status'), ('卸载.command', 'uninstall')]:
    payload[name] = f'#!/bin/bash\nexec /bin/bash "$(dirname "$0")/scripts/mac-entry.sh" {action}\n'.encode()
payload['SHA256SUMS.txt'] = ''.join(
    f'{hashlib.sha256(content).hexdigest()}  {name}\n'
    for name, content in sorted(payload.items())
).encode()

dist = root / 'dist'
dist.mkdir(exist_ok=True)
name = f'CodexUsage2Rings-macOS-{version}'
archive = dist / f'{name}.zip'
with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as output:
    for filename, content in sorted(payload.items()):
        mode = 0o755 if filename.endswith('.command') or filename in {
            'macos/startup/bridge', 'scripts/mac-entry.sh', 'updater/run.sh'
        } else 0o644
        info = zipfile.ZipInfo(f'{name}/{filename}', date_time=(2026, 10, 29, 0, 0, 0))
        info.create_system = 3
        info.external_attr = (0o100000 | mode) << 16
        info.compress_type = zipfile.ZIP_DEFLATED
        output.writestr(info, content)
(dist / 'SHA256SUMS.txt').write_text(f'{hashlib.sha256(archive.read_bytes()).hexdigest()}  {archive.name}\n')
print(archive)
