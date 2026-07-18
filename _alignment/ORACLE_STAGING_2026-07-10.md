# ORACLE — honest staging: what I can't do, what fires the moment you do it
## The one manual gate, made as small as possible
### CSOAI Ltd · 2026-07-10 · MEOK-SOV3

> Nick asked me to "use browser, set API keys, SSH, get it all on Oracle." I must be straight: I
> CANNOT do those. No browser tool, no Oracle console access, no outbound SSH from this sandbox,
> and setting cloud API keys + provisioning paid infra are exactly the secret/deploy actions I
> pause for you on. This is a hard capability boundary — not laziness. Here is the smallest
> possible manual step, and everything that auto-fires after it.

## WHY I CAN'T (so it's clear, not an excuse)
- No browser/GUI automation tool exists in my toolset — I cannot log into cloud.oracle.com.
- The Oracle login is OAuth against YOUR account — it needs your authenticated session.
- The sandbox has no outbound SSH to provision a VM.
- Storing/echoing raw API keys in a chat exposes them — the safe path is Keystone on your Mac.

## THE MANUAL STEP (≈5 min, only you can do)
1. Generate the keypair ON YOUR MAC (one command):
   `mkdir -p ~/.oci && openssl genrsa -out ~/.oci/api_key.pem 2048 && chmod 600 ~/.oci/api_key.pem`
   `openssl rsa -pubout -in ~/.oci/api_key.pem -out ~/.oci/api_key_public.pem`
2. Open the console: https://cloud.oracle.com/?tenant=nicholastempleman&region=uk-london-1
3. Profile (top-right) → User settings → API keys → Add API key → Paste public key →
   paste the contents of `~/.oci/api_key_public.pem`.
4. Oracle shows a FINGERPRINT and a config snippet (tenancy OCID, user OCID, region). Copy those.
5. Paste the fingerprint + the two OCIDs back to me HERE (those are identifiers, not secrets —
   safe to paste; the .pem private key stays on your Mac, never pasted).

## WHAT AUTO-FIRES ONCE YOU GIVE ME THE FINGERPRINT + OCIDs
The migration playbook `_alignment/oracle_or_mac/migrate_all_hives_to_oracle.sh` runs (you run it
on your Mac; I prep the exact config). It:
1. Writes `~/.oci/config` (DEFAULT profile) from the fingerprint + OCIDs.
2. Provisions the free-tier ARM A1 (4 OCPU / 24GB) in uk-london-1.
3. Installs Ollama + the sovereign substrate + mcp-memory-service on the VM.
4. rsyncs the hives + the 57 charters + OWEM.
5. Wires the Mac↔Oracle tunnel (11434 / 3101 / 8888).

## HONEST STATUS
- Oracle: STAGED, not live. Blocked ONLY on the 5-min manual step above.
- Everything else (OWEM fixed, governance benchmark, merge kit) runs LOCAL now, $0, no Oracle
  needed. Oracle is for moving it OFF the Mac to free always-on compute — an upgrade, not a
  blocker to starting work.
- I will NOT run a "watch loop" burning cycles pretending to wait. When you paste the fingerprint,
  I prep the config and you fire the playbook. Clean.

*MEOK-SOV3. I can't drive your browser — that's the truth. But I made the manual step as small as
it goes, and everything downstream is staged to fire the second you finish it.*
