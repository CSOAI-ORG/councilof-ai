# CSOAI — MASTER CATALOGUE OF ALL JEWELS · 2026-11-01

**Published:** 2026-11-01T04:44:45.308Z · **Page:** `/jewels/master-catalogue/` · **JSON:** `/jewels/master-catalogue/index.json`
**Supersedes as a page:** `docs/GSPC-MASTER-CATALOG-OF-ALL-JEWELS-2026-10-27.md` (merged in PR #3531 on 2026-10-29T03:56:52Z,
never published as a page a reader could reach).

Three laws govern every line, and they are the estate's own, not mine:

1. **A signed artefact is not a true artefact.** Signature and presence prove where bytes came from. They never prove the
   number inside.
2. **The measurement must not manufacture the evidence it measures.** Where the only way to "finish" a jewel would be to
   mint the evidence, the jewel stays open and the blocker is named.
3. **Absence is a state.** A refused URL, an unreachable endpoint, an unmeasured axis: each is recorded in its own state
   and never converted to a zero, a failure, or a score.

---

## 1. What this edition adds to the 2026-10-27 document

| | 2026-10-27 document | this edition |
|---|---|---|
| Reachability | a document in the repository | **a published page** and a published JSON |
| Live read | read 2026-10-27 | **re-read 2026-11-01T04:32:57.274Z** |
| Level of read | status + bytes | **status + bytes + visible-text digest** |
| Text-level delta | not possible | **27 of 126 URLs changed visible text; 0 changed status** |
| Board | 33 axes · 23 measured · 10 unmeasured | **33 axes · 23 measured · 10 unmeasured** (read today) |
| Public root | 325 leaves @ 2026-10-26 | **331 leaves @ 2026-10-31T17:48:12Z** |
| Agent Skills | 12 published | **14 published**; `meok-canonical` still not among them |
| Open PRs | 182 | **134** |

## 2. What this edition is pinned to

| Artefact | Path | Bytes | sha256 |
|---|---|---|---|
| State table (dated 2026-10-27) | `docs/GSPC-JEWEL-STATE-TABLE-2026-10-27.md` | 55915 | `edace4852ff257217d216f2731bb2cfcefe4f379bfc63be617a9f664eeb74d2d` |
| Re-read, status level | `out/docket-row-reread-20261030.json` | — | `0ff108177dba6c7c4e00e3d79214e7a9acba513ea10595438645f5e2e012a39f` |
| Re-read, status + digest | `out/docket-row-reread-20261101.json` | — | `4f8c4fab13c8db00d0eb65bca69f7ee6a5bdcba3493b920a84c01f8392a8a4f8` |

**The extractor is the estate's own.** `scripts/claim-capture.mjs`, sha256 `10432c76c61b34ff9b726d2341844833b3e9a7fef19e5b77e5e545c45483559d`, matched
against the sha256 pinned in the published spec manifest
(`public/spec/claim-maintenance/v0.2/reference/manifest.json`). The run refuses to measure if the pin does not match.

**The reader is the estate's.** Node fetch, not Python urllib: councilof.ai returns 200 to Node/curl and 403 to urllib
under the Cloudflare rule `public-data: no BIC`.

**The negative control.** `https://councilof.ai/__csoai-negative-control-never-exists__/` was read first and returned 404
(unreachable, as required). A reader that cannot fail cannot measure.

## 3. Counts

- **130 jewel rows** · 126 distinct URLs · **89 read successfully** · 37 unreachable.
- **6 status changes** against the 2026-10-27 baseline.
- **27 visible-text changes** against the 2026-10-30 read — the first
  text-level delta this estate can produce.
- By state (2026-10-27): **31 VERIFIED_CURRENT** · **12 CONTRADICTED** · **11 OWNER_GATED** · **36 UNVERIFIED** · **1 DEAD** · **13 VERIFIED_STALE** · **20 OPEN_VERIFIED** · **3 CLOSING_SOON** · **3 CLOSED**.

## 4. The text-level delta — the new measurement

27 of 126 URLs changed their visible text between 2026-10-30T04:17:46.700Z and 2026-11-01T04:32:57.274Z,
while **0 changed HTTP status**. A surface can change what it says without changing its status code, and a
status-level reading cannot see it. The 2026-10-30 receipt said the next read of this table would carry a digest baseline
and could therefore be text-level; this read is that one.

The full entries — both digests, both byte counts, both statuses, the row each URL belongs to — are in the published JSON
under `text_level_delta_since_2026_10_30.entries`.

## 5. Owner gates — what only the human can close

1. **Sign the wave-2 card and the five subject-axis banks** — signing mints public evidence; the estate's own rule leaves it to the owner. *(minutes once reviewed)*
2. **Adjudicate materiality for the candidate claim deltas** — a byte delta triggers human materiality adjudication and is never an automated compliance verdict. *(one sitting)*
3. **Promote the claim-maintenance axis to MEASURED** — the method is frozen and sha-pinned and n_valid meets the threshold, but the promotion is the owner's ruling and this catalogue does not pre-empt it. *(one ruling)*
4. **Declare each subject axis's sampling frame** — a governance decision about what the estate claims to speak about. *(one page per axis)*
5. **Publish the product Agent Skill (meok-canonical)** — the site publishes 14 skills and that one is not among them. *(small)*
6. **Outward sends: I-D submissions, staged standards comments, the Zenodo appeal, grant applications, trademark filing** — each carries the owner's name, signature, legal undertaking or payment. *(see the rows)*

## 6. Reproducibility

```bash
# the pinned baseline
curl -s https://raw.githubusercontent.com/CSOAI-ORG/councilof-ai/master/docs/GSPC-JEWEL-STATE-TABLE-2026-10-27.md | shasum -a 256

# the read (refuses to measure if the extractor's pin does not match)
node ~/jewel-audit-20261027/re-read-docket-rows.mjs /tmp/st.md out/docket-row-reread-20261101.json

# this catalogue's machine-readable form
curl -s https://councilof.ai/jewels/master-catalogue/index.json | jq .counts
```

**Not a certification.** This catalogue counts and quotes. It decides nothing about whether any measured claim is true,
and it grants no status to any subject. Measurement, never a certification.
