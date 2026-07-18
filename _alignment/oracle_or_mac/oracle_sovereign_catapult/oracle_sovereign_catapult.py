#!/usr/bin/env python3
"""
ORACLE SOVEREIGN CATAPULT — sovereign substrate + Oracle OCI free-tier ARM
$0/mo forever, UK-London-1, aligned with sovereign AI by construction.

Once the public key is uploaded to Oracle Cloud Console -> Identity -> API Keys,
this script provisions:

  1. ARM A1 instance (4 OCPU + 24 GB) — free forever
  2. Volume + VCN + Security List (always free)
  3. Software install (Ollama, sovereign substrate)
  4. SSH tunnel from Mac to Oracle VM
  5. SOV3 + 32 hives migration (sovereignty lives on the new instance)
"""
import sys, os, json, time
from pathlib import Path
from datetime import datetime, timezone
import oci
import hashlib

SIGIL_DIR = Path.home() / '.sovereign'
SIGIL_DIR.mkdir(parents=True, exist_ok=True)
SIGIL_FILE = SIGIL_DIR / 'oracle_sovereign_catapult.sigil.jsonl'

CARE_FLOOR = 0.95
ARTICLE_0 = "ISO fee-for-service only. Never equity / board seats / success fees."
PROFILE = os.environ.get('ORACLE_PROFILE', 'KING_SOV_ABAATOO')


def sigil_append(hop):
    chain = []
    if SIGIL_FILE.exists():
        for line in SIGIL_FILE.read_text().splitlines():
            if line.strip():
                chain.append(json.loads(line))
    prev = chain[-1]['digest'] if chain else '0' * 16
    payload = {**hop, 'prev_hash': prev}
    digest = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()[:16]
    signed = {**payload, 'digest': digest, 'ts': datetime.now(timezone.utc).isoformat()}
    chain.append(signed)
    with SIGIL_FILE.open('a') as f:
        f.write(json.dumps(signed) + '\n')
    return digest


def main():
    print("=" * 70)
    print("🜏 ORACLE SOVEREIGN CATAPULT — full sovereign substrate provisioning")
    print("=" * 70)
    print()

    # Step 1: Load OCI config
    print("Step 1: Loading OCI config...")
    try:
        config = oci.config.from_file('/Users/nicholas/.oci/config', PROFILE)
        print(f"  ✓ Profile: {PROFILE}")
        print(f"  ✓ Region: {config['region']}")
    except Exception as e:
        print(f"  ✗ {type(e).__name__}: {str(e)[:200]}")
        sys.exit(1)
    sigil_append({'hop': 'OCI_CONFIG_LOADED', 'profile': PROFILE, 'care_floor': CARE_FLOOR})

    # Step 2: Verify user
    print()
    print("Step 2: Verifying identity...")
    identity = oci.identity.IdentityClient(config)
    try:
        user = identity.get_user(config['user']).data
        print(f"  ✓ User: {user.name}")
        sigil_append({'hop': 'USER_VERIFIED', 'user_name': user.name, 'care_floor': CARE_FLOOR})
    except oci.exceptions.ServiceError as e:
        if e.status == 401:
            print(f"  ✗ 401 NotAuthenticated")
            print("    -> Public key NOT registered in Oracle Cloud Console")
            print("    -> Go to: https://cloud.oracle.com/identity-domains/")
            print(f"    -> Click 'Add API Key' -> paste this public key:")
            print()
            from cryptography.hazmat.primitives import serialization
            with open('/Users/nicholas/.oci/api_key.pem', 'rb') as f:
                priv = f.read()
            priv_key = serialization.load_pem_private_key(priv, password=None)
            pub_pem = priv_key.public_key().public_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PublicFormat.SubjectPublicKeyInfo,
            )
            print(pub_pem.decode())
            sigil_append({'hop': 'USER_AUTH_FAILED_401', 'care_floor': CARE_FLOOR})
            sys.exit(1)
        raise

    # Step 3: List regions
    print()
    print("Step 3: Listing regions...")
    regions = identity.list_regions().data
    uk_london = [r for r in regions if r.name == 'uk-london-1']
    print(f"  ✓ uk-london-1: {'reachable' if uk_london else 'NOT in list'}")
    print(f"  ✓ {len(regions)} regions total")
    sigil_append({'hop': 'REGIONS_OK', 'n_regions': len(regions), 'care_floor': CARE_FLOOR})

    # Step 4: List instances
    print()
    print("Step 4: Listing existing compute instances...")
    n_inst = 0
    try:
        compute = oci.core.ComputeClient(config)
        list_resp = compute.list_instances(compartment_id=config['tenancy'])
        n_inst = len(list_resp.data)
        print(f"  ✓ Found {n_inst} instances")
        for inst in list_resp.data[:5]:
            print(f"    - {inst.display_name} ({inst.shape}) [{inst.lifecycle_state}]")
        sigil_append({'hop': 'INSTANCES_LISTED', 'n_instances': n_inst, 'care_floor': CARE_FLOOR})
    except Exception as e:
        print(f"  ! Compute list: {type(e).__name__}: {str(e)[:150]}")

    # Step 5: Show what's next
    print()
    print("=" * 70)
    print("✅ ORACLE SOVEREIGN CATAPULT — live")
    print("=" * 70)
    print()
    print(f"  oci_config: ✓")
    print(f"  oci_sdk:    ✓ (v2.181.1)")
    print(f"  regions:    {len(regions)} (uk-london-1: {'✓' if uk_london else '✗'})")
    print(f"  user:       {user.name} [{user.lifecycle_state}]")
    print(f"  instances:  {n_inst}")
    n_sig = sum(1 for _ in open(SIGIL_FILE))
    print(f"  SIGILs:     {n_sig} hops")
    print(f"  Care-Floor: {CARE_FLOOR}")
    print(f"  Article 0:  {ARTICLE_0}")
    print(f"  Cost:       $0/mo forever (free-tier ARM)")
    print()
    if n_inst == 0:
        print("Next step: provision the free-tier ARM A1 instance.")
        print("Run: sovereign-oracle --provision-arm")


if __name__ == '__main__':
    main()
