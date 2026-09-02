# HARNESS — cedulon-recon consumer

Wire the measure path so it can read this bank and emit an **unsigned**
`cedulon.recon` card-v0. Harness authority stays on M4:

```text
~/.grokbot/harness/run.sh measure
```

Clients / plugins do **not** mint MEASURED. This leaf is bank → unsigned card only.

## Atom

```text
public/interop/cedulon-recon/bank/*
  → scripts/interop/cedulon_recon_consumer.py
  → unsigned card-v0 (surface=cedulon.recon, sig_ed25519=null)
  → (later n≥30 + 4way + keystone) → root witness only
```

## Run (repo consumer)

From repo root:

```bash
python3 scripts/interop/cedulon_recon_consumer.py
# or
python3 scripts/interop/cedulon_recon_consumer.py --stdout
```

Default output: `public/interop/cedulon-recon/card-unsigned.consumer.json`.

Inputs (required):

| Path | Role |
| --- | --- |
| `bank/class-counts-expected.json` | Part-1 class_counts + probe pin |
| `bank/conservation-fixtures.jsonl` | MCC / exclusion fixture rows |
| `bank/probe-pin.json` | source_urls + npm / sha256 pin |

## Measure dept hook (M4)

Harness lives at `~/.grokbot/harness` (not vendored into this repo). Point the
measure dept at the repo script:

```bash
# illustrative — actual run.sh dept wiring is on M4
~/.grokbot/harness/run.sh measure -- \
  python3 "$REPO/scripts/interop/cedulon_recon_consumer.py" \
    --repo-root "$REPO"
```

The harness may copy the emitted unsigned card into its local card inbox; it
must **not** sign here, **not** call wrangler, and **not** touch `/api/gspc`.

## Locks

| Lock | Value |
| --- | --- |
| Signature | `sig_ed25519` always `null` in this consumer |
| Board | Never a GSPC axis fill; no `/api/gspc` edits |
| Deploy | Never wrangler |
| Certify | Forbidden |
| TS | CSOAI is **not** a Transparency Service |

See also: `README.md`, `card-unsigned.example.json`.
