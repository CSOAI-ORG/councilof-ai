#!/usr/bin/env bash
# MEOK — GCP VM bootstrap. Run AFTER `gcloud init` + project set.
# Creates a Spot VM, opens minimal firewall, provisions Ollama+SOV3+Caddy with an API key.
# Usage:  bash meok_gcp_bootstrap.sh YOUR_PROJECT_ID
set -euo pipefail

PROJECT="${1:?Usage: bash meok_gcp_bootstrap.sh <PROJECT_ID>}"
ZONE="europe-west2-a"          # London
NAME="meok-backend"
MACHINE="e2-standard-4"        # 4 vCPU / 16GB — SOV3 + Postgres + qwen3:0.6b
API_KEY="$(openssl rand -hex 24)"   # the header key Caddy will require

echo "==> project=$PROJECT zone=$ZONE machine=$MACHINE (SPOT)"
gcloud config set project "$PROJECT"
echo "==> enabling Compute Engine API (one-time, ~1 min)…"
gcloud services enable compute.googleapis.com

echo "==> creating Spot VM '$NAME'…"
gcloud compute instances create "$NAME" \
  --zone="$ZONE" --machine-type="$MACHINE" \
  --provisioning-model=SPOT --instance-termination-action=STOP \
  --image-family=ubuntu-2204-lts --image-project=ubuntu-os-cloud \
  --boot-disk-size=50GB --boot-disk-type=pd-balanced \
  --tags=meok-backend

echo "==> firewall: allow :443 (HTTPS) + :22 (SSH)…"
gcloud compute firewall-rules create meok-https --allow=tcp:443 --target-tags=meok-backend 2>/dev/null || echo "   (https rule exists)"
gcloud compute firewall-rules create meok-ssh   --allow=tcp:22  --target-tags=meok-backend 2>/dev/null || echo "   (ssh rule exists)"

echo "==> waiting 30s for the VM to boot…"; sleep 30

echo "==> provisioning the box (Ollama + qwen3:0.6b + Caddy)…"
gcloud compute ssh "$NAME" --zone="$ZONE" --command="
  set -e
  sudo apt-get update -y
  sudo apt-get install -y python3.11 python3.11-venv postgresql postgresql-contrib debian-keyring debian-archive-keyring apt-transport-https curl
  # Ollama
  curl -fsSL https://ollama.com/install.sh | sh
  sudo systemctl enable --now ollama
  ollama pull qwen3:0.6b
  # Caddy (reverse proxy w/ auto-HTTPS)
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
  sudo apt-get update -y && sudo apt-get install -y caddy
  # Caddy config: require an API key header, proxy /llm -> Ollama (localhost only)
  sudo tee /etc/caddy/Caddyfile >/dev/null <<EOF
:443 {
  tls internal
  @authed header X-MEOK-Key \"$API_KEY\"
  handle /llm/* {
    @ok header X-MEOK-Key \"$API_KEY\"
    handle @ok { uri strip_prefix /llm; reverse_proxy 127.0.0.1:11434 }
    respond 401
  }
  respond \"MEOK backend\" 200
}
EOF
  sudo systemctl restart caddy
  echo 'PROVISION_OK'
"

IP="$(gcloud compute instances describe "$NAME" --zone="$ZONE" --format='get(networkInterfaces[0].accessConfigs[0].natIP)')"
echo ""
echo "================ DONE ================"
echo " VM:        $NAME ($MACHINE, SPOT) in $ZONE"
echo " PUBLIC IP: $IP"
echo " API KEY:   $API_KEY"
echo " Test:      curl -k -H 'X-MEOK-Key: $API_KEY' https://$IP/llm/api/tags"
echo " Save these — I'll wire MEOK ONE's router at https://$IP/llm with this key (+ local fallback)."
echo " Stop to save money: gcloud compute instances stop $NAME --zone=$ZONE"
echo "======================================"
