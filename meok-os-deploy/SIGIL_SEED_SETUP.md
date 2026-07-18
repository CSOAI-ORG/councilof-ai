# SIGIL_SEED — pin your sovereign signing identity (owner step)

Every signed artifact (System Card, Model Card, Registry manifest, `/api/sign`) is signed with an
Ed25519 key **derived deterministically from `SIGIL_SEED`**. Until you set it, everything uses a
**public demo seed**, so the fingerprint is the well-known `SOV:D78A-DC19-…` (fine for demos, NOT
for a named engagement).

Set `SIGIL_SEED` once → the public key, fingerprint (`SOV:…`) and every signature become **your
permanent sovereign identity**, and buyers can pin it.

## Set it (Vercel)
```bash
# a long, secret, high-entropy phrase you control (store it in your password manager / KMS)
vercel env add SIGIL_SEED production --scope niks-projects-0a2ef942
# paste the secret when prompted, then redeploy:
vercel deploy --prod --yes --scope niks-projects-0a2ef942
```
Verify it took:
```bash
curl -s https://os.meok.ai/api/systemcard | python3 -c "import sys,json;d=json.load(sys.stdin);print(d['fingerprint'],'seeded=',d['seeded'])"
# expect: seeded= True  and a NEW SOV:… fingerprint that is now YOURS
```
Publish that fingerprint (e.g. on /verify.html, your site footer, email signature) so anyone can
confirm a card was signed by *you*.

## Rules
- **Secret & backed up.** Losing `SIGIL_SEED` = losing the identity (old cards still verify against the
  old public key; new cards would sign under a new key). Treat it like a root key.
- **Rotation.** To rotate: set a new `SIGIL_SEED`, re-issue current cards (they get new signatures +
  a new fingerprint), and publish a short note mapping old→new fingerprint. Old signed cards remain
  independently verifiable forever against the old public key — that's the point.
- **Post-quantum.** Ed25519 is the interop baseline; ML-DSA-65 (PQC) archival signing is the SOV33
  substrate's job — layer it on top for long-term (decades) integrity, don't replace Ed25519.
- **Never commit the seed.** It lives only in the deployment env / your KMS.
