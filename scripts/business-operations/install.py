#!/usr/bin/env python3
"""Install a versioned observer on an existing Linux pod; preserve unrelated cron jobs."""
import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import shlex
import shutil
import subprocess

MARKER = '# CSOAI BUSINESS OBSERVER'
FILES = ('observe.py', 'calendar.json', 'test_observe.py', 'install.py', 'README.md')


def crontab():
    result = subprocess.run(['crontab', '-l'], capture_output=True, text=True)
    if result.returncode and 'no crontab' not in result.stderr:
        raise RuntimeError('Cannot read crontab: ' + result.stderr)
    return result.stdout


def render_cron(old, command, retired=(), watchdog=None):
    lines = []
    for line in old.splitlines():
        if MARKER in line:
            continue
        if line and not line.lstrip().startswith('#') and any(line.split(None, 5)[-1] == item for item in retired):
            lines.append('# retired by CSOAI observer: ' + line)
        elif watchdog and line.endswith(' ' + watchdog) and 'OLLAMA_MODELS=' not in line:
            lines.append(line[:-len(watchdog)] + 'OLLAMA_MODELS=/workspace/ollama-models ' + watchdog)
        else:
            lines.append(line)
    return '\n'.join(lines + ['*/15 * * * * ' + command + ' ' + MARKER]) + '\n'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base', type=Path, default=Path('/workspace/csoai-operations'))
    parser.add_argument('--retire-command', action='append', default=[])
    parser.add_argument('--watchdog', help='Existing watchdog cron command to inherit the persistent Ollama model directory; its file is untouched')
    parser.add_argument('--apply', action='store_true')
    args = parser.parse_args()
    here = Path(__file__).resolve().parent
    hashes = {name: hashlib.sha256((here / name).read_bytes()).hexdigest() for name in FILES}
    revision = hashlib.sha256(json.dumps(hashes, sort_keys=True).encode()).hexdigest()[:16]
    release = args.base / 'releases' / revision
    command = '/usr/bin/python3 ' + shlex.quote(str(release / 'observe.py')) + ' --mill --state ' + shlex.quote(str(args.base / 'state')) + ' > /dev/null 2>&1'
    before = crontab()
    after = render_cron(before, command, args.retire_command, args.watchdog)
    if not args.apply:
        print(after)
        return
    if not str(args.base.resolve()).startswith('/workspace/'):
        raise ValueError('Install only in persistent /workspace')
    subprocess.run(['/usr/bin/python3', '-m', 'unittest', 'discover', '-s', str(here), '-p', 'test_*.py'], check=True)
    release.mkdir(parents=True, exist_ok=True)
    for name in FILES:
        dest = release / name
        if dest.exists() and hashlib.sha256(dest.read_bytes()).hexdigest() != hashes[name]:
            raise RuntimeError('Existing release has changed; refusing overwrite')
        if not dest.exists():
            shutil.copyfile(here / name, dest)
    backup = args.base / ('crontab-before-' + datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ') + '.txt')
    backup.write_text(before)
    backup.chmod(0o600)
    if crontab() != before:
        raise RuntimeError('Concurrent crontab change; inspect and retry')
    subprocess.run(['crontab', '-'], input=after, text=True, check=True)
    if crontab() != after:
        raise RuntimeError('Installed crontab differs from reviewed content')
    receipt = {'revision': revision, 'release': str(release), 'file_sha256': hashes, 'cron_backup': str(backup), 'cron_sha256': hashlib.sha256(after.encode()).hexdigest(), 'installed_at': datetime.now(timezone.utc).isoformat(), 'interval_minutes': 15}
    (args.base / 'install-receipt.json').write_text(json.dumps(receipt, indent=2) + '\n')
    print(json.dumps(receipt, indent=2))


if __name__ == '__main__':
    main()
