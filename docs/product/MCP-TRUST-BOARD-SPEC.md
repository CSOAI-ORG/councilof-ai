# MCP Trust Board — specification v0.1

**Document class:** product/engineering specification. **No implementation
code.** The probe machinery already exists in this repo; this spec defines
how it is extended to a new population.
**Status:** IMPLEMENTED 2026-09-11 (census #1: 500 hosts) · **Date:** 2026-09-10.
Implementation: `scripts/mcp-trust-round.py` (+ `--selftest`), cadence
`.github/workflows/mcp-trust-board-round.yml`, artefacts `public/interop/mcp-trust/`,
board page `/trust` (alias `/boards/mcp`), offer `docs/product/OFFER-mcp-trust-board.md`.
One deviation from §3: the probe UA names `+https://councilof.ai/trust` (the board
itself) rather than the x402-trust path, so an operator reading their logs lands on
the methodology of the thing that probed them.

---

## 0. Doctrine (binding, inherited)

Everything in this spec is downstream of the estate's census doctrine:

- **Measurement, never certification.** A bucket is never a grade, a rank, or
  a certificate.
- **A 402 is an invoice, not delivery.** An auth challenge is a term sheet,
  not a property of the goods.
- **A 404 is a catalog row that does not exist.** Phantom rows are counted as
  phantom rows.
- **UNREACHABLE is never FAIL.** DNS/TLS/timeout/refusal says nothing about
  the server's quality; it says only that we could not observe it from here,
  at that moment.
- **Counts-only public artifacts.** Host details are withheld by design — a
  public named list would name non-conformant parties, and naming is not the
  product. Counts are derived, never typed.
- **Unmeasured cells stay visible.** A population slice we did not probe is
  published as unmeasured, with its `n` and limits, never interpolated.

## 1. Purpose

Extend the existing x402 catalog trust census — currently
`scripts/catalog-trust-round.py` and `scripts/census/x402-bazaar-conformance.py`,
publishing counts-only to `https://councilof.ai/interop/x402-trust/latest.json` —
to a second population: **internet-facing MCP (Model Context Protocol)
servers**.

The board answers one question per round: *how many publicly reachable MCP
servers answer a correct protocol handshake, and under what authentication
posture?* Nothing more. Never server quality, never safety, never a trust
score.

### 1.1 External context (third-party claims, not our measurements)

The security study **"Exposed by Design"** reportedly identified **~21,000
internet-facing MCP servers, 91.8% without OAuth**. These figures are cited
here as **third-party claims** to size the population and motivate the board.
They are **not** CSOAI measurements, are not reproduced by our method, and
must never be quoted from our artifacts as if they were. Our board publishes
only what our own probes observe.

## 2. Population and enumeration

| Field | Specification |
|---|---|
| Population name | `mcp-internet-facing` |
| Enumeration sources | Public MCP registries/directories that list server endpoints; deduplicated by host. The enumeration set per round is recorded in the round artifact (source names and row counts, never host lists). |
| Enumeration honesty | Mirrors `x402-bazaar-conformance.py`: if an index paginates short of its stated total, the shortfall is recorded (`complete: false`), never passed off as complete. |
| Deduplication | One row per distinct host (netloc, lowercase), first advertised endpoint per host — the same rule the bazaar census uses. |
| Cap | Exactly one probe per host per round; probe count ≤ enumerated host count. No retries beyond the failure-handling rules in §6. |

**UNMEASURED by design:** servers not listed in any public enumeration source.
The board measures the *enumerable* population and says so; the true
internet-facing population (the ~21K figure above is a third-party estimate
of it) is larger and stays an open cell.

## 3. Probe method (dry, zero side effect)

Reuse of existing machinery: the transport layer (identifiable UA, bounded
concurrency, one request per row, error-typed failures) is the one already
proven in `catalog-trust-round.py` (12 workers, 14 s timeout, template
substitution) and `x402-bazaar-conformance.py` (24 concurrent, 12 s timeout,
exception-typed rows). The MCP board adopts the same pattern with an
MCP-shaped probe body:

1. **Transport reachability** — one POST to the server's MCP endpoint with the
   board's identifiable User-Agent
   (`csoai-mcp-trust/0.1 (+https://councilof.ai/interop/x402-trust/)`).
   Connection failure (DNS, TLS, timeout, refused) is recorded as
   `unreachable` with the exception *type* only — never a grade.
2. **`initialize` handshake** — a protocol-correct MCP `initialize` request
   (protocol version, client info naming the board). Nothing beyond
   `initialize`: no session use, no subscriptions.
3. **Auth detection** — read the response:
   - HTTP 401/403 with `WWW-Authenticate` → auth-challenged; record the auth
     *scheme family* (e.g. bearer/OAuth-indicating vs other) as a count
     dimension. A challenge is a term sheet — **an invoice, not delivery.**
   - HTTP 402 → x402-challenged (payment-gated MCP); recorded distinctly —
     same doctrine as the x402 census: an invoice, not delivery.
   - Successful `initialize` → the server answered the handshake without
     authentication at the transport layer.
4. **`tools/list` enumeration** — if and only if `initialize` succeeded, one
   `tools/list` request. **Tools are listed, never called.** The artifact
   records tool *counts* only — never tool names, never schemas, never
   descriptions (those can carry prompt-injection payloads and identifying
   detail; both are withheld by doctrine).

Per-round cost caps held by construction: one initialize + at most one
tools/list per host; no tool invocation ever; no authentication attempted
(no credentials exist to try); nothing signed, nothing paid.

## 4. Bucket taxonomy (extending the existing one)

The existing x402-trust buckets are the parent taxonomy. The MCP board
extends, never renames:

| Bucket | Meaning | Parent bucket |
|---|---|---|
| `initialize_ok_open` | `initialize` answered, no auth challenge | ≈ `serves_200` |
| `initialize_ok_tools_listed` | handshake ok AND `tools/list` returned a tool count | (sub-bucket of the above; counts only) |
| `auth_challenged_401_403` | HTTP 401/403 with auth challenge | ≈ `challenge_402` (term sheet, not delivery) |
| `x402_challenged_402` | HTTP 402 payment challenge | `challenge_402` exactly |
| `alive_not_mcp` | HTTP 200/4xx but no protocol-valid MCP reply (alive, speaks something else or needs different input) | ≈ `alive_needs_input` |
| `listed_no_reply` | enumerated host, endpoint template or transport gave no usable response | ≈ `template_no_reply` |
| `dead_404_or_unreachable` | 404, DNS/TLS/timeout/refused | `dead_404_or_unreachable` — **never FAIL** |
| `other_error` | anything else | `other_error` |

A host occupies exactly one bucket per round. Buckets are mutually exclusive,
collectively exhaustive over probed hosts. Counts are derived from rows,
never typed into the artifact by hand — enforced the same way
`counts_have_no_hosts()` guards the existing artifact: no URLs, no host
strings, snake-case keys, numeric values only.

## 5. Public artifacts

### 5.1 Counts-only snapshot (free)

- Path: `public/interop/mcp-trust/latest.json` + dated snapshots, mirroring
  the x402-trust layout and the `latest.json` stable-pointer convention.
- Schema: `csoai.mcp-trust-snapshot/0.1`, carrying: `population`
  (enumeration source names + row counts), `as_of`, `counts` (bucket counts +
  `total` + auth-scheme-family counts + aggregate tool-count statistics:
  total tools listed across the population, median per answering server —
  aggregates only), `method` (the §3 method string), `doctrine` (§0 verbatim
  condensed), and a `not:` field stating what the snapshot does not measure
  (server quality, safety of any tool, whether a listed tool does what its
  name claims — the bazaar census's `not` field is the model).
- **Host details are never in the public artifact.** The per-host row file is
  retained privately for diffing, exactly as the bazaar census keeps its
  jsonl.

### 5.2 Diffs (free)

Round-to-round diff (hosts added/dropped, bucket migrations) in the same
shape as the bazaar census's `diff-<date>.json` — counts plus capped detail,
published after two complete rounds exist. A single observation is a
snapshot; the delta is the board.

### 5.3 The board page (free)

A public page rendering the counts over time — same visual doctrine as the
x402 trust board: buckets, trends, the `not:` field visible on the page.

## 6. Failure handling

| Condition | Rule |
|---|---|
| DNS/TLS/timeout/refused | Bucket `dead_404_or_unreachable` (or `unreachable` sub-count), exception type recorded. **Never FAIL, never retried within the round.** |
| Empty/short enumeration page | Recorded (`complete: false`); never treated as population shrinkage. |
| Partial run (smoke cap) | Artifact marked `partial: true`; diff suppresses `hosts_dropped` (a partial probe cannot say a host left) — the bazaar census's rule, verbatim. |
| Previous snapshot unreadable | Diff is `UNCHECKABLE` with reason — never silently rebased. |
| Malformed MCP reply | `alive_not_mcp` or `other_error`; the raw reply is never stored in the public artifact. |
| Rate limiting observed | Back off, record `other_error`; the board never retries into a rate limit. |
| Auth challenge | Recorded. Never answered — the board holds no credentials and never will. |

## 7. Cadence

| Artifact | Cadence |
|---|---|
| Probe round | Weekly (the population is ~200× the 100-row x402 catalog; weekly keeps per-host load at one handshake per week). |
| `latest.json` repoint | Each completed round. |
| Diff publication | Weekly, once ≥2 complete rounds exist. |
| Enumeration source review | Quarterly: sources added/removed are logged in the round artifact. |

## 8. Free vs metered

| Surface | Terms |
|---|---|
| Counts, snapshots, diffs, board page | **Free, public, forever.** Counts-only, reproducible method published. |
| Per-server signed card | **Metered.** A named party may request a signed attestation card for *their own* server (handshake result, auth posture observed, timestamp, Ed25519 signature, Merkle-anchored) via the existing `POST /api/request-attestation` paid door. The card attests what we observed, when — it is a signed measurement, never a certificate, never a grade. |
| Host-level data about *other* parties' servers | **Not for sale at any price.** Withholding host details is doctrine, not a pricing tier. |

## 9. Non-goals (explicit)

- No tool invocation, ever. No payload testing, no injection probing, no
  vulnerability scanning. The board is a handshake census, not a scanner.
- No ranking, scoring, certification, or "trust score" — the name
  "Trust Board" names the *question* (who answers, under what terms), not a
  verdict.
- No claim about the ~21K third-party population estimate beyond citing it
  as third-party context.
- No compliance claim against MCP authorization specifications or any
  regulation. Alignment tracking only, and only where separately mapped.

## 10. Relationship to existing artifacts

| Existing | Relationship |
|---|---|
| `scripts/catalog-trust-round.py` | Probe/bucket method reused: one dry probe per row, identifiable UA, counts-only artifact, `counts_have_no_hosts` guard, `latest.json` pointer. |
| `scripts/census/x402-bazaar-conformance.py` | Enumeration honesty (short-read recording), per-host jsonl + summary + diff trio, `partial` semantics, `UNCHECKABLE` diffs, `not:` field. |
| `/interop/x402-trust/latest.json` | Sibling artifact; the MCP board gets the parallel path `/interop/mcp-trust/latest.json`, never mixed into the x402 pointer. |
| `/api/request-attestation` | The metered per-server card door (§8). No new payment surface is created by this spec. |

*Measurement, not certification. A 401 is a term sheet. UNREACHABLE is never
FAIL. The gaps stay on the page.*
