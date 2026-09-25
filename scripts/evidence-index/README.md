# scripts/evidence-index — the CSOAI evidence index (csoai.evidence-index/0.1)

One public, signed, machine-readable index of the evidence CSOAI has published, so a person or an
agent can discover it and verify it in one place. Published copy: Hugging Face dataset
`csoai/evidence-index`; staged copy for the site: `public/evidence/` (served at `/evidence/index.json`,
`/evidence/index.md`, `/evidence/verify.py`). The SPA route `/evidence` (ContentReviewNotice) is
unaffected: only files under the directory are added, no `index.html`.

    python3 build_evidence_index.py build --out OUT --owners OUT/enumeration/owners.json
    python3 build_evidence_index.py sign  --out OUT      # POST /api/board-sign, pod caller token
    python3 build_evidence_index.py ots   --out OUT      # three OpenTimestamps calendars
    python3 verify.py --index OUT | tee OUT/verify.log   # the stranger's verifier, same code the build uses
    python3 render_evidence_index.py --out OUT          # index.md + README.md, no hand-typed figures

Rules the code holds:
- Packages are included by OWNERSHIP, never by name (rule v2, 2026-09-25). The name filter (csoai/gspc) only proposes
  candidates; `ownership()` in build_evidence_index.py includes a package only when the registry bytes name CSOAI as its
  publisher (declared author/maintainer, or a source repo under github.com/CSOAI-ORG) and name no other estate entity.
  The PyPI and npm accounts are shared by CSOAI, MEOK and CSGA Global, so the account alone decides nothing; npm scopes
  @meok-labs (MEOK) and @csgaglobal (CSGA Global) are other organisations. Every decision is published in
  index.json enumeration.package_ownership and rendered in index.md. v1 (index sha256 3350549e..., 19 packages incl.
  @meok-labs/csoai) is kept, signed and unpublished, under superseded/.
- Enumeration is ANONYMOUS. An authenticated Hugging Face listing also returns the org's private repos;
  they must never enter a public tree. `hf_item` re-reads each repo anonymously and fails closed.
- Every sha256 is computed from bytes fetched in the run; every signature state is a check run in the
  run (`verify.verify_signed_doc`), pinned to keys from https://csoai.org/.well-known/did.json.
- PRESENT_NOT_VERIFIED means the preimage rule could not be recovered — it is not a claim the signature
  is bad. FAILED is used only when a rule the file itself states was applied and returned false.
- Live surfaces are pinned only to the build's fetch; verify.py reports changed bytes as DRIFTED, never PASS.
- A pending OpenTimestamps proof is a calendar commitment, never described as a Bitcoin attestation.
- Item counts are counts of published objects, not measurements; never add them to any other CSOAI count.

Licences: index data CC-BY-4.0; these scripts Apache-2.0; each item keeps its own licence.
