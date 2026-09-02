# HARNESS — scrapi-ccf consumer

Pin-verify `pinned-vectors.json` digests and emit an **unsigned** `eval.delta`
card. Harness authority stays on M4:

```text
~/.grokbot/harness/run.sh measure
```

## Atom

```text
public/interop/scrapi-ccf/pinned-vectors.json
  → scripts/interop/scrapi_ccf_consumer.py [--fetch]
  → unsigned card-v0 (surface=eval.delta, sig_ed25519=null)
  → assert: no scitt-keys added anywhere under public/
```

## Run (repo consumer)

```bash
python3 scripts/interop/scrapi_ccf_consumer.py
python3 scripts/interop/scrapi_ccf_consumer.py --fetch   # re-hash raw.githubusercontent.com pins
```

Default output: `public/interop/scrapi-ccf/card-unsigned.consumer.json`.

`--fetch` only hits `raw.githubusercontent.com` URLs already listed in the pin
file. Tree URLs / nested `files{}` without raw URLs are shape-checked and
skipped (recorded in `payload.pin_verify`).

## scitt-keys assertion

The consumer **fails** if any of these appear:

- `public/.well-known/scitt-keys`
- `public/.well-known/scitt-keys.json`
- any `*scitt-keys*` path under `public/`

`/.well-known/scitt-keys` on councilof.ai stays **404 by design**. CSOAI is
not a Transparency Service.

## Measure dept hook (M4)

```bash
~/.grokbot/harness/run.sh measure -- \
  python3 "$REPO/scripts/interop/scrapi_ccf_consumer.py" \
    --repo-root "$REPO"
```

## Locks

| Lock | Value |
| --- | --- |
| Role | Fixture consumer only — never a TS |
| Signature | `sig_ed25519` always `null` |
| Board | No `/api/gspc` edits |
| Deploy | Never wrangler |
| Certify / mint receipts | Forbidden |
| `scitt-keys` in-repo | Must stay absent |

See also: `README.md`, `FIXTURES.md`, `pinned-vectors.json`.
