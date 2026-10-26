# OpenShell capture → OTel collector readback (reproducible example)

This example takes one retained OpenShell capture, renders it as OpenTelemetry log events with the
existing evidence-fabric code, sends it to a stock OpenTelemetry Collector on loopback, and checks that
what the collector writes back is identical to what was sent, with checksums at each step.

It is a local engineering check that we ran ourselves. It is not a joint project with NVIDIA or the
OpenTelemetry project, and nobody outside CSOAI has reviewed it.

## Input

- `harness/openshell-adapter/capture-2026-09-28/out/rows.json`
  (sha256 `a1ec6b93c6c0cbede52bdefcba59fbc0ff00dc656ec050115c01dd36f580f641`): one real capture,
  OpenShell v0.1.2, network-proxy role on our build pod, 2026-09-28 13:42:33–13:42:47 UTC. 3 rows:
  2 matched the declared policy effect, 1 diverged (`DENY_DECLARED_AUDIT_PASSTHROUGH` on example.com).

## Steps (run from `packages/evidence-fabric/`)

```sh
X=examples/openshell-otel
python3 ingest/openshell_in.py ../../harness/openshell-adapter/capture-2026-09-28/out/rows.json \
  --read-at 2026-09-28T13:43:00Z --control DIVERGENT \
  --subject urn:example:openshell-network-proxy:capture-2026-09-28 > $X/out/openshell.events.jsonl
python3 render/otel.py $X/out/openshell.events.jsonl > $X/out/openshell.otlp.json
# in $X: otelcol-contrib v0.162.0 with the config here (loopback only, file exporter)
(cd $X && mkdir -p out && otelcol-contrib --config otelcol.yaml) &
curl -s -X POST http://127.0.0.1:14318/v1/logs -H 'Content-Type: application/json' \
  --data-binary @$X/out/openshell.otlp.json
python3 $X/check.py $X/out/openshell.otlp.json $X/out/readback.jsonl
```

`check.py` uses only the Python standard library and exits non-zero on any difference.
Running it with no arguments checks the retained files in `data/`.

## Retained result (14 Oct 2026)

| File | sha256 |
|---|---|
| `data/openshell.events.jsonl` (3 events) | `f62a7d50a0c0b8b3415d3342737f7347af15e0ee5e52041baba7f859ae4ef5bf` |
| `data/openshell.otlp.json` (sent) | `619aa1ad4b36e8b65e8d61bb73e85b7344ce68b28116a861eb28a7f571dbef20` |
| `data/readback-otelcol-contrib-v0.162.0.jsonl` (written back) | `50f285547fa91384eb722c89f4c33774d664da2cbd1021fa8a79143c31935241` |

3 of 3 records read back with identical `eventName` (`gen_ai.evaluation.result`), timestamp and every
attribute, including the state label (CONSISTENT / DIVERGENT), `csoai.limits` and the declared/observed
hashes. See `SHA256SUMS`.

## Limits

- One capture, one run. The network-proxy role ran without isolation (no network namespace or
  capabilities), and the "observed" side is our own flow observation, not an independent party.
- The events are unsigned; the issuer `did:web:issuer.example` is a test identifier.
- The original run sent 10 records: these 3 plus 7 synthetic fixtures used only to test that
  non-measured states are not turned into numbers. The files in `data/` keep only the 3 OpenShell
  records, so they are not byte-identical to the raw collector output (raw readback sha256
  `27f71274fca9f8ef6eacffcd363bab868a61edab562ca52ef141dd80ecb68ccf`). The comparison is the same.
- An older collector (otelcol-contrib v0.111.0) dropped `eventName`; v0.162.0 keeps it.
- **Known gap:** the policy's own reference and hash (`subject.declared_by`) is not carried as an OTel
  attribute; only `csoai.declared_sha256` (a hash of the declared effect) is. A reader of the
  telemetry alone cannot tell which policy version produced the declared effect.
- This shows the collector preserves the records. It says nothing about any SIEM or backend ingesting
  them, and nothing about whether OpenShell's enforcement is correct.
