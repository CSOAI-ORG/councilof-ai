#!/bin/bash
# sovos-vm-boot — provision a fresh RunPod pod as a SOVOS backend VM (idempotent).
# Usage: VM_SSH="ssh -F /dev/null -p 23243 -i ~/.runpod/ssh/runpodctl-ssh-key root@194.26.196.156" \
#        VM_WORKSPACE=/workspace/sovos-agent bash sovos-vm-boot.sh
set -e
VM_SSH=${VM_SSH:?set VM_SSH}
VM_WORKSPACE=${VM_WORKSPACE:-/workspace/sovos-agent}
HARNESS_NAME=$(basename "$VM_WORKSPACE")

# 1) packages + node22
$VM_SSH 'export DEBIAN_FRONTEND=noninteractive
apt-get update -qq >/dev/null 2>&1; apt-get install -y -qq rsync git curl >/dev/null 2>&1
if ! command -v node >/dev/null 2>&1; then
  cd /tmp && curl -fsSL -o n.txz https://nodejs.org/dist/v22.14.0/node-v22.14.0-linux-x64.tar.xz && tar -xJf n.txz
  mv node-v22.14.0-linux-x64 /usr/local/node 2>/dev/null || true
  ln -sf /usr/local/node/bin/node /usr/local/bin/node; ln -sf /usr/local/node/bin/npm /usr/local/bin/npm
  ln -sf /usr/local/node/bin/npx /usr/local/bin/npx
fi
node --version'

# 2) DSH (the harness agent runtime)
$VM_SSH 'npm install -g @deepseek-ai/dsh@0.1.1-rc.2 >/tmp/dsh-install.log 2>&1 && echo DSH_RC2_OK'

# 3) env keys (secret-adjacent; from the Mac .dsh)
scp -q -P $(echo "$VM_SSH" | grep -oP '(?<=-p )\d+' | head -1) \
  -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
  $(echo "$VM_SSH" | grep -oP '(?<=-i )\S+' | head -1) 2>/dev/null || true
($VM_SSH 'mkdir -p /root/.dsh') 2>/dev/null
# (copy .env from Mac — caller does scp of ~/.dsh to /root/.dsh if secret present)

# 4) monorepo
$VM_SSH "mkdir -p /workspace && cd /workspace && [ -d $HARNESS_NAME ] || echo missing"

# 5) gateway service (idempotent)
$VM_SSH "cd $VM_WORKSPACE && (pkill -f eunomia-gateway-v2.cjs 2>/dev/null || true); sleep 1; nohup node eunomia-gateway-v2.cjs > /tmp/gateway.log 2>&1 & sleep 4; curl -s -m 6 http://127.0.0.1:8878/v1/models -o /dev/null -w 'gateway:%{http_code}\n'"
echo "VM_BOOT_DONE"
