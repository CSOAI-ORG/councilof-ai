#!/bin/bash
M4_IP="192.168.50.105"
M4_USER="nicholas"
MOUNT_POINT="/Users/iokfarm/m4"

if mount | grep -q "on $MOUNT_POINT"; then
  echo "M4 already mounted"
  exit 0
fi

mkdir -p "$MOUNT_POINT"

python3 -c "
import subprocess, urllib.parse, os, sys

ip = os.environ.get('M4_IP', '$M4_IP')
user = os.environ.get('M4_USER', '$M4_USER')
mp = os.environ.get('MOUNT_POINT', '$MOUNT_POINT')

result = subprocess.run(
    ['security', 'find-internet-password', '-a', user, '-s', ip, '-r', 'smb ', '-w'],
    capture_output=True, text=True
)
if result.returncode != 0:
    print('ERROR: No keychain entry')
    sys.exit(1)

pwd = result.stdout.strip()
enc_pwd = urllib.parse.quote(pwd, safe='')
url = f'//{user}:{enc_pwd}@{ip}/{user}'

mnt = subprocess.run(['mount_smbfs', url, mp], capture_output=True, text=True, timeout=15)
if mnt.returncode == 0:
    print('M4 mounted successfully')
else:
    print(f'ERROR: mount failed: {mnt.stderr.strip()[:100]}')
    sys.exit(1)
"
