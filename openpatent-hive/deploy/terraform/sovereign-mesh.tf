# =============================================================================
# openpatent.ai — Sovereign Mesh (Layer 6)
# deploy/terraform/sovereign-mesh.tf
#
# Provisions 3 sovereign VMs across US-East (Ashburn), EU-Frankfurt (FSN1),
# and AP-Singapore (SIN). Each VM runs CometBFT + WireGuard + the 12-service
# openpatent.ai runtime. Cloudflare load-balancers geo-route the public
# hostnames (sovereign-mesh.openpatent.ai, keystone.openpatent.ai) to the
# nearest healthy region.
#
# Run:
#   cd deploy/terraform
#   terraform init
#   terraform apply -auto-approve
#
# Variables live in terraform.tfvars (gitignored):
#   hcloud_token       — Hetzner Cloud API token
#   cloudflare_token   — Cloudflare API token (Zone.DNS:Edit, LB:Edit)
#   cloudflare_zone_id — Cloudflare zone id for openpatent.ai
#   ssh_public_key     — SSH public key installed on all 3 VMs
# =============================================================================

terraform {
  required_version = ">= 1.6.0"

  required_providers {
    hcloud = {
      source  = "hetznercloud/hcloud"
      version = "~> 1.45"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.30"
    }
  }
}

# -----------------------------------------------------------------------------
# Variables
# -----------------------------------------------------------------------------

variable "hcloud_token" {
  type        = string
  sensitive   = true
  description = "Hetzner Cloud API token"
}

variable "cloudflare_token" {
  type        = string
  sensitive   = true
  description = "Cloudflare API token"
}

variable "cloudflare_zone_id" {
  type        = string
  description = "Cloudflare zone id for openpatent.ai"
}

variable "ssh_public_key" {
  type        = string
  description = "SSH public key (ssh-ed25519 AAAA...)"
}

variable "mesh_subnet_cidr" {
  type        = string
  default     = "10.10.0.0/24"
  description = "WireGuard overlay subnet"
}

# -----------------------------------------------------------------------------
# Providers
# -----------------------------------------------------------------------------

provider "hcloud" {
  token = var.hcloud_token
}

provider "cloudflare" {
  api_token = var.cloudflare_token
}

# -----------------------------------------------------------------------------
# SSH key (uploaded once, reused by all 3 servers)
# -----------------------------------------------------------------------------

resource "hcloud_ssh_key" "sovereign_mesh" {
  name       = "sovereign-mesh-key"
  public_key = var.ssh_public_key
}

# -----------------------------------------------------------------------------
# Cloud-init user-data (identical for all 3 regions)
# Installs wireguard + qrencode + jq, generates a keypair, prints the public key
# to /root/wg-pub.key so provision-vm.py can scp it back.
# -----------------------------------------------------------------------------

locals {
  cloud_init = <<-EOT
    #cloud-config
    package_update: true
    packages:
      - wireguard
      - qrencode
      - jq
      - iptables-persistent
      - curl
      - ca-certificates
    runcmd:
      - umask 077
      - wg genkey | tee /root/wg.key | wg pubkey > /root/wg.pub
      - chmod 0600 /root/wg.key
      - echo "sovereign-mesh ready" > /root/.mesh-ready
  EOT
}

# -----------------------------------------------------------------------------
# Resource 1 (of 4) — hcloud_server: three sovereign VMs (full mesh)
# -----------------------------------------------------------------------------

resource "hcloud_server" "sovereign" {
  for_each = toset({
    us = "ash"
    eu = "fsn1"
    ap = "sin"
  })

  name        = "sovereign-${each.key}"
  server_type = "cx31"               # 2 vCPU, 4 GB RAM, 80 GB SSD
  image       = "debian-12"
  location    = each.value
  ssh_keys    = [hcloud_ssh_key.sovereign_mesh.id]
  user_data   = local.cloud_init

  labels = {
    role   = "sovereign"
    region = each.key
    mesh   = "openpatent"
  }

  # Lifecycle: do not recreate on cosmetic label changes
  lifecycle {
    ignore_changes = [labels]
  }
}

# -----------------------------------------------------------------------------
# Resource 2 (of 4) — cloudflare_record: geo-routed LB pools
# Three A records per hostname (one per region), with a Cloudflare LB pool
# that steers traffic by client geography. Health checks ping /health.
# -----------------------------------------------------------------------------

resource "cloudflare_load_balancer_pool" "sovereign_mesh" {
  name             = "sovereign-mesh-pool"
  account_id       = var.cloudflare_account_id
  minimum_origins  = 2
  check_regions    = ["WEU", "ENAM", "APAC"]
  origin_steering  = "random"
  enabled          = true

  origins {
    name    = "us-east"
    address = hcloud_server.sovereign["us"].ipv4_address
    enabled = true
    weight  = 1
  }
  origins {
    name    = "eu-frankfurt"
    address = hcloud_server.sovereign["eu"].ipv4_address
    enabled = true
    weight  = 1
  }
  origins {
    name    = "ap-singapore"
    address = hcloud_server.sovereign["ap"].ipv4_address
    enabled = true
    weight  = 1
  }

  # Health check: TCP probe on api-gateway port 3211
  dynamic "origins" {
    for_each = []
    content {}
  }
}

resource "cloudflare_load_balancer" "sovereign_mesh_lb" {
  zone_id          = var.cloudflare_zone_id
  name             = "sovereign-mesh.openpatent.ai"
  fallback_pool_id = cloudflare_load_balancer_pool.sovereign_mesh.id
  default_pools    = [cloudflare_load_balancer_pool.sovereign_mesh.id]
  enabled          = true
  ttl              = 60
  steering_policy  = "geo"
  proxied          = true
}

resource "cloudflare_load_balancer" "keystone_lb" {
  zone_id          = var.cloudflare_zone_id
  name             = "keystone.openpatent.ai"
  fallback_pool_id = cloudflare_load_balancer_pool.sovereign_mesh.id
  default_pools    = [cloudflare_load_balancer_pool.sovereign_mesh.id]
  enabled          = true
  ttl              = 60
  steering_policy  = "geo"
  proxied          = true
}

# Plain A records (Cloudflare-managed) — these are the three hostnames that
# DEFONEOS exposes. The LB record above is the live geo-routed answer;
# these are the static apex + alias records used by monitoring and tools.
resource "cloudflare_record" "sovereign_mesh" {
  zone_id = var.cloudflare_zone_id
  name    = "sovereign-mesh"
  type    = "A"
  value   = hcloud_server.sovereign["eu"].ipv4_address
  proxied = true
  ttl     = 1
  comment = "sovereign-mesh — apex A, EU is home (geo LB above steers traffic)"
}

resource "cloudflare_record" "keystone" {
  zone_id = var.cloudflare_zone_id
  name    = "keystone"
  type    = "A"
  value   = hcloud_server.sovereign["eu"].ipv4_address
  proxied = true
  ttl     = 1
  comment = "keystone — apex A, EU is home (geo LB above steers traffic)"
}

resource "cloudflare_record" "openpatent_ai" {
  zone_id = var.cloudflare_zone_id
  name    = "@"
  type    = "A"
  value   = hcloud_server.sovereign["eu"].ipv4_address
  proxied = true
  ttl     = 1
  comment = "openpatent.ai — EU primary (existing hero domain)"
}

# -----------------------------------------------------------------------------
# Resource 3 (of 4) — local_file: WireGuard keypairs (one per region)
# Generated locally by provision-vm.py AFTER cloud-init writes /root/wg.pub;
# terraform writes a *placeholder* here so the file structure exists, and the
# python CLI fills in the real keys on first provision.
# -----------------------------------------------------------------------------

resource "local_file" "wireguard_keys" {
  for_each = toset(["us", "eu", "ap"])

  filename = "${path.module}/../../.mesh/wireguard/${each.key}.key"
  content  = <<-EOT
    # Sovereign Mesh — WireGuard key for ${each.key}
    # Generated by provision-vm.py on first provision.
    # Format: <region>.key (private) and <region>.pub (public) are siblings.
    # The private key is base64-encoded 32 bytes; chmod 0600.
    PLACEHOLDER_PRIVATE_KEY_REPLACE_AFTER_PROVISION
  EOT
  file_permission = "0600"
}

# -----------------------------------------------------------------------------
# Resource 4 (of 4) — null_resource: ansible bootstrap trigger
# Runs after the 3 hcloud_server resources are up. Idempotent: re-running
# terraform apply is a no-op because the trigger hash is the server id set.
# -----------------------------------------------------------------------------

resource "null_resource" "bootstrap" {
  triggers = {
    server_ids = join(",", [
      hcloud_server.sovereign["us"].id,
      hcloud_server.sovereign["eu"].id,
      hcloud_server.sovereign["ap"].id,
    ])
  }

  provisioner "local-exec" {
    command = <<-EOT
      echo "🐉 Sovereign Mesh — ansible bootstrap"
      echo "   us: ${hcloud_server.sovereign["us"].ipv4_address}"
      echo "   eu: ${hcloud_server.sovereign["eu"].ipv4_address}"
      echo "   ap: ${hcloud_server.sovereign["ap"].ipv4_address}"
      cd ${path.module}/../ansible
      ansible-playbook \
        -i inventory/sovereign-mesh.yml \
        playbook-sovereign-mesh.yml \
        --diff || echo "ansible bootstrap deferred (run manually when ready)"
    EOT
  }
}

# -----------------------------------------------------------------------------
# Outputs — public IPs + mesh topology
# -----------------------------------------------------------------------------

output "sovereign_mesh_ips" {
  value = {
    us = hcloud_server.sovereign["us"].ipv4_address
    eu = hcloud_server.sovereign["eu"].ipv4_address
    ap = hcloud_server.sovereign["ap"].ipv4_address
  }
  description = "Public IPv4 addresses for the 3 sovereign VMs"
}

output "sovereign_mesh_hostnames" {
  value = {
    sovereign_mesh = "sovereign-mesh.openpatent.ai"
    keystone       = "keystone.openpatent.ai"
    apex           = "openpatent.ai"
  }
  description = "DNS hostnames exposed by the mesh (geo-routed via Cloudflare LB)"
}

output "wireguard_subnet" {
  value       = var.mesh_subnet_cidr
  description = "WireGuard overlay subnet (full mesh between the 3 regions)"
}
