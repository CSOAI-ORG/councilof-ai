#!/usr/bin/env bash
# Provision a fresh GCP VM for the OpenPatent.ai hive.
#
# Prereqs:
#   - gcloud CLI installed and authenticated (gcloud auth login)
#   - A GCP project with billing enabled
#   - Compute Engine API enabled
#
# Usage:
#   ./deploy/gcp/provision.sh my-project-id us-central1-a
#
# This creates:
#   - e2-standard-4 VM (4 vCPU, 16 GB RAM, 100 GB SSD)
#   - Debian 12 image
#   - Static external IP "openpatent-ip"
#   - Firewall rules for 80, 443, 22
#   - SSH key from current user
#
# Then SSH in and run:
#   curl -sSL https://raw.githubusercontent.com/CSOAI-ORG/openpatent-hive/main/deploy/gcp/bootstrap.sh | bash
#
# This script is IDEMPOTENT. Re-run it; it won't recreate existing resources.

set -euo pipefail

PROJECT="${1:-$(gcloud config get-value project)}"
ZONE="${2:-us-central1-a}"
REGION="${ZONE%-*}"
VM_NAME="openpatent-hive"
MACHINE_TYPE="e2-standard-4"   # 4 vCPU, 16 GB RAM
DISK_SIZE="100GB"
IMAGE_FAMILY="debian-12"
IMAGE_PROJECT="debian-cloud"
TAGS=("http-server" "https-server" "openpatent-hive")

echo "━━━ provisioning openpatent.ai hive on GCP ━━━"
echo "  project: $PROJECT"
echo "  zone:    $ZONE"
echo "  vm:      $VM_NAME ($MACHINE_TYPE, $DISK_SIZE, debian-12)"
echo ""

# 1. Enable required APIs
echo "→ enabling Compute Engine API"
gcloud services enable compute.googleapis.com --project="$PROJECT" --quiet

# 2. Create firewall rules (idempotent: they may already exist)
echo "→ creating firewall rules"
if ! gcloud compute firewall-rules describe openpatent-allow-web --project="$PROJECT" >/dev/null 2>&1; then
  gcloud compute firewall-rules create openpatent-allow-web \
    --project="$PROJECT" \
    --direction=INGRESS \
    --action=ALLOW \
    --rules=tcp:80,tcp:443 \
    --source-ranges=0.0.0.0/0 \
    --target-tags=openpatent-hive \
    --description="Allow HTTP/HTTPS to openpatent.ai hive" \
    --quiet
fi

# 3. Reserve static IP (idempotent)
echo "→ reserving static IP"
if ! gcloud compute addresses describe openpatent-ip --project="$PROJECT" --region="$REGION" >/dev/null 2>&1; then
  gcloud compute addresses create openpatent-ip \
    --project="$PROJECT" \
    --region="$REGION" \
    --description="Static IP for openpatent.ai hive" \
    --quiet
fi

STATIC_IP="$(gcloud compute addresses describe openpatent-ip --project="$PROJECT" --region="$REGION" --format='get(address)')"
echo "  static IP: $STATIC_IP"

# 4. Create VM (idempotent: fails if exists, we catch)
echo "→ creating VM ($VM_NAME)"
if ! gcloud compute instances describe "$VM_NAME" --project="$PROJECT" --zone="$ZONE" >/dev/null 2>&1; then
  gcloud compute instances create "$VM_NAME" \
    --project="$PROJECT" \
    --zone="$ZONE" \
    --machine-type="$MACHINE_TYPE" \
    --image-family="$IMAGE_FAMILY" \
    --image-project="$IMAGE_PROJECT" \
    --boot-disk-size="$DISK_SIZE" \
    --boot-disk-type=pd-ssd \
    --address=openpatent-ip \
    --tags="$TAGS" \
    --labels="hive=openpatent,environment=production" \
    --metadata="hive-role=openpatent,hive-version=1.0.0" \
    --scopes=https://www.googleapis.com/auth/cloud-platform \
    --quiet

  echo "  VM created. Waiting for it to be ready..."
  sleep 15
else
  echo "  VM already exists, skipping create"
fi

# 5. Print the next steps
echo ""
echo "✓ openpatent.ai hive VM provisioned"
echo ""
echo "  VM name:    $VM_NAME"
echo "  zone:       $ZONE"
echo "  public IP:  $STATIC_IP"
echo "  SSH:        gcloud compute ssh $VM_NAME --project=$PROJECT --zone=$ZONE"
echo ""
echo "━━━ next steps ━━━"
echo ""
echo "  1. SSH in:"
echo "     gcloud compute ssh $VM_NAME --project=$PROJECT --zone=$ZONE"
echo ""
echo "  2. As root, bootstrap the hive:"
echo "     sudo -i"
echo "     cd /opt && git clone https://github.com/CSOAI-ORG/openpatent-hive.git"
echo "     cd openpatent-hive && ./scripts/bring-up.sh"
echo ""
echo "  3. Configure DNS at Namecheap (run from local):"
echo "     NAMECHEAP_API_KEY=*** ./deploy/namecheap/dns-setup.sh $STATIC_IP"
echo ""
echo "  4. Configure TLS (Let's Encrypt) on the VM:"
echo "     sudo certbot --nginx -d openpatent.ai -d '*.openpatent.ai'"
echo ""
echo "  5. Smoke test:"
echo "     ./scripts/smoke-test.sh"
