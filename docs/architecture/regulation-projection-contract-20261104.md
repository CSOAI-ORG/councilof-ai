# Regulation projection into the existing evidence fabric

Status: local implementation candidate, 4 November 2026. No source ingestion,
model inference, signing, payment, authority change, production integration or
publication is performed by this adapter.

## What the implementation does

`packages/evidence-fabric/regulation_projection.py` enumerates every provision
in a declared registry snapshot for a supplied run. It produces one ordinary
`csoai.evidence-event/0.1` event per provision through the existing `event.build`
implementation. The output is an unsigned sidecar projection. It creates no new
canonical event type, case store, legal grader or human-decision service.

Every event is `UNMEASURED`, with a null numeric value and `assessment: NOT_RUN`.
That is deliberate: observing a routing disposition does not test a legal duty.
Even a supplied reviewed mapping and a valid source event cannot upgrade the
projection into an obligation-satisfaction result. The supplied review reference
is recorded as unauthenticated; authenticating the reviewer and authority remains
the responsibility of the existing authority-effect path.

The CLI requires a new output filename and refuses to overwrite it. It neither
edits the frozen manifest nor moves the stamped regulatory inventory pointer.

## Verified source scope

The dependency snapshots used for the tests came from Council's monorepo commit
`bd5e4e65b55774a03ee513d6710151a30b5c419b`:

| Existing input | Observed scope | What it establishes |
|---|---|---|
| `public/interop/frozen-provision-hashes.json` | 417 unique provision hash anchors across six CELEX instruments; corpus root `37e2e10d53feaa9e12097f45113e1234510be0ca471e1a0848f5805db3e367c7` | Hash-manifest integrity and enumeration. Original normalized source bytes remain unresolved. |
| `public/crosswalk/east-west-v1.json` | Version 2026-10-26; nine instrument entries, four regimes, 63 mapping rows | Existing named crosswalk pointers. These are not automatically reviewed atomic obligations or executable checks. |
| `packages/evidence-fabric/event.py` | Existing canonical event builder and validator | Shared event IDs, state vocabulary and canonicalization. This adapter does not reimplement them. |

The test over the actual frozen manifest emits 417 routing dispositions,
417 `UNMAPPED` states and zero executed obligation checks. The numerator is
**routing enumeration**, not legal coverage. Neither 417 provisions nor 63
mapping rows means 417 frameworks or global completeness.

The east-west crosswalk is inspected but intentionally not automatically merged:
its control labels do not supply every atomic identity, reviewed applicability
predicate or current source version needed by this adapter. A source owner can
prepare explicit extension rows for global instruments through the existing
registry-review process. Each row must identify instrument, source version,
clause, jurisdiction, source URL/digest, licence provenance and review reference.
Duplicate IDs and duplicate instrument/version/clause identities are rejected.
The adapter records referenced source bytes as unverified; a declaration does
not itself recover or verify those bytes.

## Run identity and evidence separation

The run manifest supplies `run_id`, timezone-aware `observed_at`, `source_kind`,
`evidence_kind`, `configuration`, `configuration_sha256` and `context`.
Configuration is canonicalized by the existing evidence-fabric implementation.
It contains explicit model ID and revision, serving path, and SHA-256 digests
for model, harness, prompt, dataset, tools, plugins, MCP, skills, permissions and
policy, and runtime. A digest does not prove that the referenced bytes exist;
the producing measurement runner must retain those immutable inputs. Missing
configuration components are rejected. `model_sha256` alone may be null when
`model_digest_unavailable_reason` explains why model bytes are unavailable (for
example, a hosted API). The output preserves that limitation and makes no claim
that the same weights are served across runs. An absent component should be represented
by the digest of a retained, explicit empty/not-applicable manifest, never an
invented hash of unknown model weights. For a human-only run, identify the model
as not applicable and use a null model digest with that explicit reason.

Context contains jurisdiction and actor-role lists plus use case. Empty lists
mean unknown, not outside scope. Context receives its own digest because the
same technical configuration may be used by different actors and jurisdictions.

| Dimension | Allowed values |
|---|---|
| Source lane | `ai-single`, `ai-council`, `human-unassisted`, `human-assisted` |
| Evidence kind | `observed-live`, `frozen-replay`, `synthetic-simulation` |
| Declared applicability | `UNKNOWN`, `APPLICABLE`, `NOT_APPLICABLE` |
| Mapping state | `UNMAPPED`, `UNREVIEWED_POINTER`, `STALE_POINTER`, `REVIEW_RECORD_SUPPLIED` |
| Obligation assessment in this adapter | `NOT_RUN` |

Unassisted humans must explicitly declare no assistance; assisted humans must
describe it. A supplied source event must validate with `event.check_renderable`
and bind the same run ID, configuration digest, context digest, lane, evidence
kind and observation time. A changed plugin or skill configuration invalidates
reuse of the prior bound event. Relabelling a synthetic event as observed-live
is rejected. The validator checks canonical content identity; it does not verify
Ed25519 signatures, signing-key trust, OTS proofs or factual truth.

## Explicit mapping contract

A mapping is keyed to one registered obligation and carries:

- Registry, configuration and context digests.
- Applicability declaration and relation (`partial`, `related`, `equivalent`,
  `disjoint`). Relations are declarations, never an inferred legal equivalence.
- Review record with `status: REVIEWED`, reviewer reference, canonical event
  reference, reason, exact source version/digest, validity start and expiry.

Unreviewed mappings retain `UNKNOWN`. Expired or not-yet-valid records retain
`UNKNOWN` and `STALE_POINTER`. Conflicting duplicates, wrong source versions,
changed context/configuration and wrong registry bindings are rejected. The
review reference is retained, but this adapter cannot authenticate it. A later
executor must validate the existing authority-effect record at commitment.

## How to use and verify

From the repository root:

```bash
python3 -m unittest discover -s packages/evidence-fabric -p test_regulation_projection.py -v
python3 packages/evidence-fabric/regulation_projection.py \
  --manifest public/interop/frozen-provision-hashes.json \
  --run /path/to/retained-run-manifest.json \
  --source-event /path/to/existing-evidence-event.json \
  --out /path/to/new-projection.json
```

`--extensions` and `--mappings` optionally accept JSON arrays. Omitting
`--source-event` explicitly records that no source event was supplied, useful
for checking a proposed configuration without inventing a measurement.

The test suite uses clearly labelled synthetic run manifests and review
references. It makes no paid calls and reports no real model-performance result.
It covers full manifest enumeration, deterministic output, tampered roots,
duplicate JSON keys and identities, incomplete configuration, configuration
change/cache rejection, source tampering, synthetic/observed separation,
unreviewed/stale mappings, context binding and human-assistance separation.

## Integration steps remaining

1. Wire a reviewed run-manifest adapter into the actual measurement runner,
   retaining complete input bytes and the existing board grader.
2. Recover/re-fetch versioned legal source bytes under appropriate rights;
   reconcile the immutable historical manifest rather than overwriting it.
3. Normalize global mappings into reviewed instrument/version/atomic-obligation
   records. Validate OSCAL exports against a pinned schema when those exports
   are implemented; this adapter makes no OSCAL conformance claim.
4. Add actual scoped documentary, technical and human-reviewed checks through
   existing executors. Applicability, mapping and measurement state stay separate.
5. Reassess affected claims on amendments, expiry, configuration changes and
   corrections, preserving prior events and exact supersession references.
6. Keep required human/authorization gates ahead of repair attempts. Council
   agreement cannot waive them. Bounded preauthorised deterministic work can
   finish without manufacturing a human signature.
7. Feed daily products with scoped counts and original evidence references.
   A 3KB card should point to the full packet, with synthetic/live/frozen lanes
   visible. Signature and anchor verification stay in the existing verifier.

The implementation proves a complete routing projection over the supplied
registry. It does not prove current law, global completeness, legal applicability,
model safety, commercial delivery, customer demand or production operation.

## Runnable GPAI documentary packet checks

The companion `packages/evidence-fabric/gpai_packet.py` performs real offline
artifact-availability and SHA-256 checks for nine named documentary evidence
slots. This closes a bounded file-checking gap; it does not interpret the
documents or test the underlying legal duties.

| Slot | Supplied documentary artifact |
|---|---|
| 53.1.a | Technical documentation |
| 53.1.b | Information for downstream system providers |
| 53.1.c | Copyright policy |
| 53.1.d | Training-content summary |
| 54.1 | Authorised-representative mandate |
| 55.1.a | Model-evaluation records |
| 55.1.b | Systemic-risk assessment and mitigation records |
| 55.1.c | Serious-incident records |
| 55.1.d | Cybersecurity records |

Article references are the Commission's [Article 53](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-53),
[Article 54](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-54) and
[Article 55](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-55) pages.
The slots are nonexhaustive: the presence of a file does not establish that a
provision applies, that its contents meet any requirement, or that associated
actions such as notification actually occurred. Article 54's mandate slot does
not stand for every duty in that article.

The caller supplies a packet manifest containing:

- `packet_id` and timezone-aware `checked_at`; the timestamp is recorded as
  `CALLER_SUPPLIED_INSPECTION_TIME`, not a trusted timestamp or external anchor.
- `legal_source.version_label`, `source_bytes_sha256` and `retrieval_record_ref`.
  The last two may be null. A digest, when supplied, is a declaration only: this
  offline tool does not fetch or verify the legal source. An unverified version
  must be labelled as such by the caller.
- `slots`, an array of `{slot_id, path, expected_sha256, applicability}`.
  `path` is a relative file path within the explicit packet root. Null path and
  null expected digest record absence. Applicability defaults only through an
  explicit `{state: "UNKNOWN"}` declaration. `APPLICABLE` or `NOT_APPLICABLE`
  requires `review_event_id`, `reviewer_ref` and `reason`; these are preserved
  external declarations, not authenticated human decisions.

Every successfully validated packet with an accessible root emits all nine
slots. Malformed packets and invalid path declarations are rejected before
output. A missing declaration or missing file remains visible. A matching file produces `PARTIAL`; missing, changed, unreadable,
oversized or unsafe files produce `UNCHECKABLE`. No slot emits a legal outcome.
The summary separates matching slots from unique matched digests, so reusing
one file in nine slots cannot appear to be nine distinct artifacts.

Artifact files are opened read-only using directory-relative descriptors and
no-follow flags. Absolute paths, parent traversal, backslash paths, symlinks,
directories and other nonregular files are refused. Nonblocking open prevents
a named pipe from hanging the checker. A 64 MiB per-file limit bounds work, and
metadata changes during a read cause an explicit uncertain result. These checks
do not execute files, parse document contents, contact remote services or verify
cryptographic authorship. They do not constitute a hostile-filesystem sandbox.

```bash
python3 -m unittest discover -s packages/evidence-fabric -p test_gpai_packet.py -v
python3 packages/evidence-fabric/gpai_packet.py \
  --packet /path/to/packet-manifest.json \
  --root /path/to/authorized-document-packet \
  --out /path/to/new-artifact-check.json
```

The tests create synthetic files only inside temporary directories and delete
them afterwards. They include deliberate byte tampering, wrong expected hashes,
all nine slots, absent files, duplicate/unknown declarations, traversal,
symlinks, directories, a named pipe, size limits and timestamp binding. Matching
bytes never change `UNKNOWN` applicability or establish a legal outcome. Output
records are validated by the existing evidence-fabric validator and remain
unsigned. The checker is a candidate until integrated and released through the
repository's existing process.
