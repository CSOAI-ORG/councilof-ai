// Private module — AxisScore type + MEASURED_ON.
// Schema notes (not an axis): overlay ARC-AGI UNMEASURED until a frozen gold bank
// exists; not a 23rd axis. Public GET https://councilof.ai/api/gspc slot count is 22; measured_axes is derived.
// Do not bump the board to 23. Do not add an axis here, in gspc.ts, /api/gspc, or
// board_living.json. See public/gspc-overlays.json.
// Restored from blob b4b3ab1788ec044156da0d4962189fe5f4dd975f (pre-PR#425).
export interface AxisScore {
  axis: string;
  bench: string;
  task: string;

  // ── family + measurement kind (added 2026-08-26, ADR-001 22-axis sweep) ──────
  // The board carries TWO families of axis measured by TWO different kinds of
  // instrument. Conflating them is how a count goes wrong, so both are explicit
  // in the data rather than inferred from the id.
  //
  //   family "gspc"      — the 14 behavioural axes (Governance/Safety/Provenance/
  //                        Continuity). A model fleet answers a frozen bank.
  //   family "financial" — the 8 financial/domain axes. Not a model fleet.
  //
  //   kind "model-comparison"   — an accuracy against a bank, with a LEADER and a
  //                               separation determination. Only these axes may
  //                               contribute to separation stats or to any mean.
  //   kind "deterministic-facts"— facts read off a public source (e.g. on-chain
  //                               issuer flags). No fleet, no leader, no accuracy,
  //                               and therefore NO separation test is applicable.
  //                               Absent fields are honest absence, never a zero.
  //   kind "declared-slot"      — the slot is published so the gap is public. No
  //                               measurement exists. status is UNMEASURED.
  family: "gspc" | "financial";
  kind: "model-comparison" | "deterministic-facts" | "declared-slot";

  // n is the size of whatever was actually measured (items, or instruments for a
  // deterministic-facts axis). 0 on a declared-slot axis means "nothing measured",
  // which is the literal truth and is never averaged into anything.
  n: number;
  n_note?: string;            // set-name caveat (e.g. swarm instances-vs-prompts)
  n_unit?: string;            // what an n counts, when it is not bank items

  // OPTIONAL from 2026-08-26. A deterministic-facts or declared-slot axis has no
  // leader and no accuracy. Emitting 0 / "n/a" would be a fabricated measurement,
  // so the field is simply absent. Consumers must treat absence as UNMEASURED.
  accuracy?: number;          // the board LEADER's accuracy (whoever leads — tuned or base)
  accuracy_is?: string;       // set when accuracy is NOT a point estimate (e.g. a stated Wilson lower bound)
  leader?: string;            // which model holds the point-estimate lead
  // UNTESTED = no McNemar separation test has been run on this bank yet (living-stamp axes).
  // Absent  = no separation test is APPLICABLE (no fleet to compare). Different facts.
  separation?: "SEPARATED" | "TIE" | "UNTESTED";
  separation_p?: number;      // McNemar exact p on discordant pairs (leader vs best base)
  separation_basis?: string;  // stated when the determination is not McNemar (e.g. Wilson-bound non-overlap)
  interval?: [number, number];   // Wilson 95% CI on the leader — present ONLY where the n is honestly independent
  fleet_mean?: number;        // mean accuracy across the measured fleet — the linear aggregator; absent where the fleet mean is not in the signed source
  fleet?: string;             // which fleet this axis was measured on, when NOT the 19-model board fleet
  mean_harm?: number;         // (1 - item pass rate) x severity, fleet-level, mean — board-v2 axes only
  cvar05_harm?: number | null;   // mean of the WORST 5% of item harms — only where n>=100 (BV floor)
  macro_f1?: number;          // board-v2 axes only — never invented for living-stamp axes
  unparsed_rate?: number;     // board-v2 axes only
  per_model?: Record<string, Record<string, number | null>>; // living-stamp axes: verbatim per-model rows
  status: "MEASURED" | "UNMEASURED" | "DRAFT" | "SPEC" | "PLANNED";

  // dataset is the frozen HF bank slug; it is resolved to dataset_url against
  // BANK_HOST. A financial axis has no HF bank, so it carries evidence_url — an
  // absolute-on-site path to the signed run or the declaration — instead. An
  // axis with neither carries no link, which is the honest state of a slot that
  // has no evidence to point at.
  //
  // dataset MUST be a bare identifier — "<owner>/<name>" — and nothing else. It is
  // concatenated onto BANK_HOST, so any prose in it mints a malformed URL. That is
  // not hypothetical: until 2026-08-26 the jail axis carried a whole sentence here
  // and published a dataset_url curl refuses to parse. Prose belongs in dataset_note.
  // gspc.ts now validates the slug and marks it UNRESOLVABLE rather than concatenating
  // blind, so the same mistake can degrade honestly but never publish a broken link
  // under a note claiming every link resolves.
  dataset?: string;
  dataset_note?: string;
  evidence_url?: string;

  // How to read a null in per_model. null and 0.0 are different facts (undefined vs
  // measured-zero) and an axis that carries both states which is which.
  null_grammar?: string;

  // How much of the axis's own declared universe was actually covered, and on what
  // rail. An axis that measured 6 of 16 named instruments has NOT measured the
  // other 10, and a fact read from mainnet is not the same as a fact attested on
  // mainnet. Both are stated on the axis rather than left for a reader to assume.
  coverage?: string;
  coverage_note?: string;
  carrier?: string;
  colour: string;   // globe layer colour
  hue: number;      // 0-360, for procedural ramps
  note?: string;
}

// Pages nudge 2026-08-25T18:47Z — ensure measured_on.note TIE ships past sticky storm
export const MEASURED_ON = {
  model: "The 14 behavioural (model-comparison) axes: 19-model fleet (8 tuned council specialists + " +
    "6 base models + frontier cross-lab models). Jail (slot 14): 7-model fleet — smaller, stated on " +
    "the axis, never conflated with the board fleet. The 8 financial/domain axes are not a model " +
    "comparison: they are measured as deterministic facts (issuer-account reads + public series), " +
    "with no fleet, no leader and no accuracy.",
  endpoint: "A100 · local Ollama (board v2) · OpenRouter (cross-lab models) · 3090 pod (jail)",
  date: "behavioural axes 2026-08-12 · jail 2026-08-18 · financial-fact axes 2026-08-25",
  grading: "deterministic grading on 15,580 per-item rows (0 transport errors) — reproducible from csoai-static-deploy2 bb15589c with agents-repo/agents/board_v2.py",
  note: "GSPC (Governance · Safety · Provenance · Continuity) board. Slot counts live in totals " +
    "(public_count, measured_axes, quotable_axes) and are derived, never typed. " +
    "The measured canonical axes used the same fleet, same rows, same grader. " +
    "Per-axis numbers show the board LEADER (whoever leads — tuned or base), its Wilson interval " +
    "where n is honestly independent, and whether the lead is statistically separated (McNemar " +
    "p<0.05) or a TIE. fleet_mean and mean_harm show the fleet, not the leader. Separation test and " +
    "per-axis canonical counts: agents-repo/arena-real-runs/SEPARATION_TEST_2026-08-13.md and " +
    "GSPC_AXIS_REGISTRY.json v2. Jail carries its per-model rows verbatim from the signed living " +
    "board; its separation is TIE (determined 2026-08-25) — a TIE is not a separated leader. " +
    "slot15 and human-vs-ai are measured in-lane only — see measured_in_lane, not the board.",
  // ── living_stamp: PRESENTED AS UNVERIFIABLE, ON PURPOSE ──────────────────────
  // Until 2026-08-26 this block carried `signed: true` and a `sig_input` recipe and
  // nothing else — i.e. it rendered exactly like the two attestations on this site
  // that DO verify (#card-attestation-1 over the 150 cards, #board-attestation-1 over
  // this payload). It does not verify. An outside SCITT/COSE audit could not reproduce
  // it under ~50 readings; a re-run in this lane on 2026-08-26 could not reproduce it
  // under 58,184 (2 candidate signatures × 5 published keys × 9 candidate payloads ×
  // {raw bytes, sha256 digest, sha256 hex, sha256 HEX} × {ensure_ascii True, False} ×
  // every drop-set of up to 3 fields). Zero verified. Three separate faults:
  //
  //   1. TWO SIGNATURES EXIST for one stamp. /signed/board_living.json carries
  //      53aa09fa…; this block carried bd199fd3…. Same signer, same `updated`.
  //      At most one of them can be over the bytes the other is over.
  //   2. THE SIGNER IS NOT ANCHORED. 8f9a00a2… is in none of the four verification
  //      methods in /.well-known/did.json, so even a reproducing preimage would only
  //      prove self-consistency — the exact unfalsifiable shape HOW-TO-VERIFY step 1
  //      tells strangers to refuse.
  //   3. THE SIGNED BYTES NO LONGER EXIST IN PUBLISHED FORM. board_living.json says
  //      its own axes are an "axes snapshot from live /api/gspc at package time"
  //      (packaged 2026-08-24) while the signature is dated 2026-08-18. Whatever was
  //      signed is not what is published, so no published bytes can reproduce it.
  //
  // We cannot say the stamp is invalid; we can only say nobody can check it, which on
  // a site whose thesis is "check it without our permission" is the same outcome. So
  // it is marked UNVERIFIABLE and it is NOT removed: a row that says "we published
  // this and it does not check out" is worth more than a quietly deleted one. The
  // bytes are left exactly as they are — if a preimage rule is ever recovered, it must
  // still verify against them.
  //
  // TO CLOSE THIS: anchor 8f9a00a2… in did.json (e.g. #living-stamp-1), publish the
  // exact preimage (which fields are "signature fields"; raw bytes vs digest;
  // ensure_ascii), and publish ONE signature. Owner-gated: this lane does not hold
  // the key. Tracked at /api/corrections C-2026-0826-08.
  living_stamp: {
    source: "board_living.json (csoai.gspc-living/0.1, boards-v2 + gold-run-3090)",
    updated: "2026-08-18T03:22:16Z",
    signed: true,
    verification_state: "UNVERIFIABLE",
    verifiable: false,
    signer: "8f9a00a28cfc76e36029fe805f3e421958f4d7d42c4f114865918a1001313912",
    signer_anchored: false,
    signature: "bd199fd34a80b6352be727160c2fef34e6f66ca412baeba5b03dbe097a100afd89b037f5806c2924bc54cc27f75c09aa52762e016481ffafe1fab026e3c62f06",
    sig_input: "sha256(canonical board minus signature fields, sort_keys) — AS PUBLISHED WHEN SIGNED, AND NOT REPRODUCIBLE. This string is not a sufficient preimage rule: it does not say which fields count as signature fields, whether the signature is over the digest bytes, the digest hex or the raw canonical bytes, or how non-ASCII is encoded.",
    unverifiable_note:
      "DO NOT TREAT THIS AS A VALID ATTESTATION. This stamp was signed, but no published bytes " +
      "reproduce it: 58,184 readings were attempted on 2026-08-26 across both published signatures, " +
      "all five published keys, nine candidate payloads, raw/digest/hex message forms, both " +
      "ensure_ascii settings and every drop-set of up to three fields. None verified. Two different " +
      "signatures are published for this one stamp (53aa09fa… in /signed/board_living.json, " +
      "bd199fd3… here), the signer is not among the verification methods in /.well-known/did.json, " +
      "and board_living.json's own note says its axes were re-snapshotted from the live board six " +
      "days after the signature date — so the signed bytes are not the published bytes. Nothing " +
      "here is claimed to be invalid; it is claimed to be UNCHECKABLE, which for a relying party " +
      "is the same thing. The two attestations on this site that DO verify are the 150 measurement " +
      "cards under #card-attestation-1 and site_attestation on this payload under " +
      "#board-attestation-1; check those instead.",
    supersedes_note:
      "site_attestation on this payload signs this whole body, including this block. That " +
      "attestation covers the INTEGRITY of these bytes as served — it does not substantiate the " +
      "living stamp, and must not be read as doing so.",
    reproduction_attempts: 58184,
    reproduction_verified: 0,
    tracked_as: "/api/corrections C-2026-0826-08",
  },
};
