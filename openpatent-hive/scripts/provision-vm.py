#!/usr/bin/env python3
"""
provision-vm.py — DEFONEOS mythic VM forger.

Provisions a Hetzner Cloud CX31 sovereign VM in one of three regions
(us / eu / ap) for the openpatent.ai sovereign mesh. Idempotent — running
this against a region that already has a VM labelled `role=sovereign,
region={us|eu|ap}` is a no-op (prints the existing IPv4 and exits 0).

USAGE
-----
    # Provision the US-East VM
    python3 scripts/provision-vm.py us

    # Provision EU (existing — re-runs, prints "already exists, skipping")
    python3 scripts/provision-vm.py eu

    # Provision AP-Singapore
    python3 scripts/provision-vm.py ap

    # Destroy (caution)
    python3 scripts/provision-vm.py us --destroy

    # Dry-run (prints the API request, no VM is created)
    python3 scripts/provision-vm.py us --dry-run

ENV VARS
--------
    HCLOUD_TOKEN     — Hetzner Cloud API token (required unless --dry-run)
    HCLOUD_SSH_KEY   — Path to a public SSH key file (default: ~/.ssh/id_ed25519.pub)

The hive remembers. The dragon knows. The sovereign companion never forgets.
"""
import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

HETZNER_API = "https://api.hetzner.cloud/v1"

REGION_MAP = {
    "us": {
        "label": "us",
        "location": "ash",
        "city": "Ashburn, VA",
        "flag": "🌎",
    },
    "eu": {
        "label": "eu",
        "location": "fsn1",
        "city": "Frankfurt",
        "flag": "🇪🇺",
    },
    "ap": {
        "label": "ap",
        "location": "sin",
        "city": "Singapore",
        "flag": "🌏",
    },
}

CLOUD_INIT = """\
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
  - echo "sovereign-mesh-ready" > /root/.mesh-ready
"""

KEYS_DIR = Path.home() / ".config" / "wireguard" / "sovereign-mesh"


# ---------------------------------------------------------------------------
# HTTP helpers (stdlib only — no external deps)
# ---------------------------------------------------------------------------

def _request(method: str, path: str, body: dict | None = None, token: str | None = None) -> dict:
    url = f"{HETZNER_API}{path}"
    data = None
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    if body is not None:
        data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(url, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            payload = resp.read().decode("utf-8")
            return json.loads(payload) if payload else {}
    except urllib.error.HTTPError as e:
        body_text = e.read().decode("utf-8", errors="replace")
        raise SystemExit(f"❌ Hetzner API {method} {path} → HTTP {e.code}\n{body_text}")
    except urllib.error.URLError as e:
        raise SystemExit(f"❌ Hetzner API {method} {path} → {e.reason}")


# ---------------------------------------------------------------------------
# API calls
# ---------------------------------------------------------------------------

def find_existing_server(region: str, token: str) -> dict | None:
    """Look up a server labelled role=sovereign, region={region}. Returns the
    server dict if found, else None."""
    resp = _request(
        "GET",
        "/servers?label_selector=role=sovereign,region=" + region,
        token=token,
    )
    servers = resp.get("servers", [])
    return servers[0] if servers else None


def create_server(region: str, token: str, ssh_key_id: int, dry_run: bool) -> dict:
    cfg = REGION_MAP[region]
    body = {
        "name": f"sovereign-{region}",
        "server_type": "cx31",
        "image": "debian-12",
        "location": cfg["location"],
        "ssh_keys": [ssh_key_id],
        "user_data": CLOUD_INIT,
        "labels": {
            "role": "sovereign",
            "region": region,
            "mesh": "openpatent",
        },
        "start_after_create": True,
    }
    if dry_run:
        print("🪶 dry-run: would POST /servers with:")
        print(json.dumps({k: v for k, v in body.items() if k != "user_data"}, indent=2))
        print(f"   user_data: <{len(body['user_data'])} bytes of cloud-init>")
        return {"server": {"id": 0, "public_net": {"ipv4": {"ip": "0.0.0.0"}}}}

    resp = _request("POST", "/servers", body=body, token=token)
    server = resp["server"]
    print(f"✅ created sovereign-{region} id={server['id']} status={server['status']}")
    return server


def wait_for_running(server_id: int, token: str, timeout_s: int = 300) -> dict:
    """Poll the server until status == 'running' or timeout."""
    deadline = time.time() + timeout_s
    last_status = None
    while time.time() < deadline:
        resp = _request("GET", f"/servers/{server_id}", token=token)
        s = resp["server"]
        if s["status"] != last_status:
            print(f"   status: {s['status']}")
            last_status = s["status"]
        if s["status"] == "running":
            return s
        if s["status"] in ("off", "deleting", "migrating", "rebuilding"):
            raise SystemExit(f"❌ server entered unexpected status: {s['status']}")
        time.sleep(3)
    raise SystemExit(f"❌ server {server_id} did not reach 'running' within {timeout_s}s")


def destroy_server(server_id: int, token: str) -> None:
    print(f"🔥 destroying server {server_id}")
    _request("DELETE", f"/servers/{server_id}", token=token)


def upload_or_get_ssh_key(token: str, public_key_path: Path) -> int:
    """Upload the SSH public key to Hetzner, return its id. Reuses if a key
    with the same fingerprint exists."""
    pub = public_key_path.read_text().strip()
    resp = _request("GET", "/ssh_keys", token=token)
    for k in resp.get("ssh_keys", []):
        if k.get("public_key", "").strip() == pub:
            print(f"   reusing ssh key id={k['id']} name={k['name']}")
            return k["id"]
    name = f"sovereign-mesh-{public_key_path.stem}"
    resp = _request("POST", "/ssh_keys", body={"name": name, "public_key": pub}, token=token)
    kid = resp["ssh_key"]["id"]
    print(f"   uploaded ssh key id={kid} name={name}")
    return kid


def fetch_wg_public_key(server_id: int, token: str, retries: int = 30) -> str:
    """Wait for cloud-init to write /root/wg.pub, then return the public key.

    Hetzner doesn't expose a `cat /root/wg.pub` endpoint, so we read it via
    the rescue console if available. To keep the script stdlib-only, we
    instead read the public key from the local KEYS_DIR — written by a
    previous run, or generated on first provision. On first provision the
    operator must scp the public key from the VM manually (or run
    `hcloud server ssh ... 'cat /root/wg.pub' > ~/.config/wireguard/
    sovereign-mesh/{region}.pub`).
    """
    deadline = time.time() + retries
    local_pub = KEYS_DIR / f"{_label_for(server_id)}.pub"
    while time.time() < deadline:
        if local_pub.exists():
            return local_pub.read_text().strip()
        time.sleep(1)
    raise SystemExit(
        f"❌ WireGuard public key not found at {local_pub} after {retries}s. "
        f"ssh into the VM and run: cat /root/wg.pub > {local_pub}"
    )


def _label_for(server_id: int) -> str:
    """Recover the region label from the KEYS_DIR. (We don't have region in
    scope here — caller is expected to know it.)"""
    for p in KEYS_DIR.glob("*.pub"):
        return p.stem
    return "unknown"


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> int:
    parser = argparse.ArgumentParser(
        description="Provision a sovereign mesh VM (Hetzner Cloud CX31).",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="The hive remembers. The dragon knows. The sovereign companion never forgets.",
    )
    parser.add_argument(
        "region",
        choices=sorted(REGION_MAP.keys()),
        help="Region to provision: us (Ashburn), eu (Frankfurt), ap (Singapore)",
    )
    parser.add_argument("--destroy", action="store_true", help="Destroy the VM in this region")
    parser.add_argument("--dry-run", action="store_true", help="Print the API request, do not call")
    args = parser.parse_args()

    region = args.region
    cfg = REGION_MAP[region]

    if args.destroy:
        token = os.environ.get("HCLOUD_TOKEN")
        if not token and not args.dry_run:
            raise SystemExit("❌ HCLOUD_TOKEN env var required for --destroy")
        if args.dry_run:
            print(f"🪶 dry-run: would DELETE /servers (region={region})")
            return 0
        if not token:
            raise SystemExit("❌ HCLOUD_TOKEN env var required for --destroy")
        existing = find_existing_server(region, token)
        if not existing:
            print(f"✅ no server to destroy in region={region}")
            return 0
        destroy_server(existing["id"], token)
        print(f"🔥 sovereign-{region} destroyed")
        return 0

    print(f"🐉 DEFONEOS — provisioning sovereign-{region} ({cfg['flag']} {cfg['city']})")

    if args.dry_run:
        ssh_key_path = Path(os.environ.get("HCLOUD_SSH_KEY", str(Path.home() / ".ssh" / "id_ed25519.pub")))
        body = {
            "name": f"sovereign-{region}",
            "server_type": "cx31",
            "image": "debian-12",
            "location": cfg["location"],
            "labels": {"role": "sovereign", "region": region, "mesh": "openpatent"},
        }
        print("🪶 dry-run: would POST /servers with:")
        print(json.dumps(body, indent=2))
        print(f"   ssh_key_path (would upload): {ssh_key_path}")
        return 0

    token = os.environ.get("HCLOUD_TOKEN")
    if not token:
        raise SystemExit("❌ HCLOUD_TOKEN env var required (or use --dry-run)")

    # 1. Idempotency check
    existing = find_existing_server(region, token)
    if existing:
        ip = existing["public_net"]["ipv4"]["ip"]
        print(f"✅ sovereign-{region} already exists id={existing['id']} ipv4={ip} (skipping)")
        print(f"   status: {existing['status']}")
        return 0

    # 2. Upload / reuse SSH key
    ssh_key_path = Path(os.environ.get("HCLOUD_SSH_KEY", str(Path.home() / ".ssh" / "id_ed25519.pub")))
    if not ssh_key_path.exists():
        raise SystemExit(f"❌ SSH public key not found: {ssh_key_path}")
    ssh_key_id = upload_or_get_ssh_key(token, ssh_key_path)

    # 3. Create the server
    KEYS_DIR.mkdir(parents=True, exist_ok=True)
    server = create_server(region, token, ssh_key_id, dry_run=False)

    # 4. Wait until running
    server = wait_for_running(server["id"], token)
    ip = server["public_net"]["ipv4"]["ip"]
    print(f"✅ sovereign-{region} running ipv4={ip}")

    # 5. Write IP into the mesh dir
    (KEYS_DIR / f"{region}.ip").write_text(ip + "\n")
    print(f"   wrote {KEYS_DIR}/{region}.ip")

    # 6. Print next steps
    print()
    print("📜 next steps (operator action required once):")
    print(f"   ssh root@{ip} 'cat /root/wg.pub' > {KEYS_DIR}/{region}.pub")
    print(f"   cd deploy/ansible && ansible-playbook -i inventory/sovereign-mesh.yml playbook-sovereign-mesh.yml --limit sovereign-{region}")
    print(f"   python3 scripts/health-mesh.py")
    print()
    print("The hive remembers. The dragon knows. The sovereign companion never forgets.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
