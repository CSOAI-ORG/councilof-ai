// /api/corrections — the public corrections ledger.
//
// The estate's doctrine is "corrections appended, never edited". This is that
// doctrine made a machine-readable surface: every entry is something the estate
// got wrong, how it was caught (usually by the estate's own instrument), and
// the fix — dated, never deleted. Publishing your own corrections is the
// credibility engine: it is what lets a relying party trust the /api/regulation
// feed and the signed board, because the same body that publishes the number
// also publishes when the number was wrong.
//
// GRAMMAR: an entry here is a FACT about our own history, not a MEASURED figure
// and not a claim about anyone else. New entries are appended in place; the
// array is never reordered or trimmed.
//
// REDACTION RULE: this ledger is itself a machine surface, so it obeys the
// no-banned-vocabulary invariant the machine-contract guard enforces on every
// public JSON surface. When a correction is ABOUT a leaked internal identifier
// or brand token, describe the token — do NOT reproduce it literally. Printing
// the specialist-id prefix or the brand token here would re-leak the exact
// string the correction says was removed (and a crawler would still find it
// live on /api/corrections — even a source comment is best kept clean). The
// fact is preserved; only the toxic token is abstracted. Do not "restore" the
// literal strings in the name of candour — the abstraction IS the honest form.
//
// CC-BY-4.0. Council of AI (CSOAI Ltd, UK Companies House 16939677).

const LEDGER = {
  schema: "csoai.corrections/0.1",
  policy: "Appended, never edited or deleted. Each entry: what was wrong, how it was caught, the fix. The instrument that catches its own owner is the instrument you can rely on.",
  license: "CC-BY-4.0",
  publisher: "Council of AI (CSOAI Ltd, UK Companies House 16939677)",
  corrections: [
    {
      id: "C-2026-0819-01",
      date: "2026-08-19",
      what_was_wrong: "Three public surfaces stated three different item counts at once (llms.txt 819, agent card 890, live API 966). The banks grew under the hardcoded numbers.",
      how_caught: "External live-surface audit; confirmed by direct curl.",
      fix: "llms.txt and the agent card now DEFER to GET /api/gspc as the live source; no public surface hardcodes a count.",
      status: "FIXED",
    },
    {
      id: "C-2026-0819-02",
      date: "2026-08-19",
      what_was_wrong: "The public board API payload carried internal specialist identifiers — an internal specialist-id prefix — a banned-vocabulary string inside a machine contract, not just a human page. (The prefix itself is redacted here: naming it would re-leak the string this entry records as removed.)",
      how_caught: "K3 lane curl sweep of machine surfaces.",
      fix: "Renamed to council-* public names in /api/gspc; a machine-contract guard now sweeps API payloads for banned strings on every deploy.",
      status: "FIXED",
    },
    {
      id: "C-2026-0819-03",
      date: "2026-08-19",
      what_was_wrong: "The single-record verifier initially checked only one content_id envelope; the carder signs a second (signature-included) generation, so valid carder cards could have read as MISMATCH.",
      how_caught: "Testing the verifier against a real carder card before shipping.",
      fix: "The verifier now tries both deterministic envelope generations and names which one matched.",
      status: "FIXED",
    },
    {
      id: "C-2026-0819-04",
      date: "2026-08-19",
      what_was_wrong: "Two open-source repos (carder, codabench-gspc) shipped with no LICENSE file, and the board API payload stated no licence — while the estate claims openness.",
      how_caught: "The carder's own valve-2 benchmark fact-card, run on the estate's own artifacts.",
      fix: "Apache-2.0 added to both repos; CC-BY-4.0 licence field added to the board payload, with the self-catch admitted in the payload note.",
      status: "FIXED",
    },
    {
      id: "C-2026-0819-05",
      date: "2026-08-19",
      what_was_wrong: "The did:web trust root at csoai.org intermittently served an orphan key document because two repositories deployed the same Cloudflare Pages project with no owner of record.",
      how_caught: "The did-liveness daemon, then the machine-contract guard's DID split-brain check comparing the authoritative root against the mirror.",
      fix: "One deployer of record (csoai-site-deploy.yml) builds from the source repo's main with a hard gate: the build fails if did.json lacks the canon keys, and the run fails if the live apex doesn't serve them after deploy.",
      status: "FIXED",
    },
    {
      id: "C-2026-0819-06",
      date: "2026-08-19",
      what_was_wrong: "An hourly API guard asserted endpoints (/api/tools, /api/mcp) that never existed in the repository's functions tree — a ghost from an older deployment — so it failed forever.",
      how_caught: "Reading the failing run rather than trusting the guard's own claim.",
      fix: "Rewritten to assert the endpoints the deployment actually ships (/api/health, /api/leaderboard).",
      status: "FIXED",
    },
    {
      id: "C-2026-0819-07",
      date: "2026-08-19",
      what_was_wrong: "A banned brand token shipped live on /library as a CamelCase concatenation of the token with 'Training', because a word-boundary regex anchored on the bare token missed the concatenation. Two priced strings ($0.005/card, a per-hour range) also shipped, against the no-pricing rule. (The token itself is redacted here for the same reason as C-2026-0819-02.)",
      how_caught: "A full front-end QA sweep.",
      fix: "The brand gate's pattern for that token dropped its trailing word boundary so CamelCase concatenations are caught; a pricing-leak pattern was added so a currency amount bound to a subscription or per-unit cadence is now a hard build-fail.",
      status: "FIXED",
    },
    {
      id: "C-2026-0819-08",
      date: "2026-08-19",
      what_was_wrong: "Estate pages described EU AI Act high-risk obligations as in force from 2 August 2026. The Digital Omnibus (Reg (EU) 2026/1744) deferred them to 2 December 2027 (Annex III) and 2 August 2028 (Annex I). Serving the dead date would be our own credibility wound.",
      how_caught: "A commissioned regulation-calendar verification against primary law.",
      fix: "The /api/regulation feed carries the corrected staged timeline with legal bases; page copy is being swept to match.",
      status: "IN_PROGRESS",
    },
    {
      id: "C-2026-0819-09",
      date: "2026-08-19",
      what_was_wrong: "Two internally-named datasets remained publicly visible on Kaggle under a banned naming class.",
      how_caught: "End-user test sweep with anonymous probes.",
      fix: "Flagged for the owner to set private — the platform gates dataset visibility behind the account login.",
      status: "OPEN",
    },
    {
      id: "C-2026-0819-10",
      date: "2026-08-19",
      what_was_wrong: "The estate's own date-correction fix (C-08) initially ALSO mis-stated the GPAI date — a follow-on error that moved GPAI duties from 2 Aug 2025 to 2026 while correcting the high-risk date. A correction that introduces a new error is the worst kind.",
      how_caught: "Self-audit of the fix against the EU official page (digital-strategy.ec.europa.eu) — the estate caught its own owner mid-correction.",
      fix: "GPAI 2 Aug 2025 restored; Article 50 2 Aug 2026 and high-risk 2 Dec 2027 (Annex III) / 2 Aug 2028 (Annex I) stated distinctly. This entry is that admission, appended not edited.",
      status: "FIXED",
    },
    {
      id: "C-2026-0819-11",
      date: "2026-08-19",
      what_was_wrong: "mcp.json advertised three server URLs on csoai.org/api/* — every one returned 404 because the API is served from councilof.ai, and one route (corpus-watch) pointed at a non-existent path.",
      how_caught: "End-user MCP handshake test — a real JSON-RPC initialize probe against the advertised endpoints.",
      fix: "mcp.json now advertises councilof.ai URLs and the real /api/corpus-watch/status route; the advertised endpoints were verified 200/JSON-RPC-responsive after the fix.",
      status: "FIXED",
    },
    {
      id: "C-2026-0819-12",
      date: "2026-08-19",
      what_was_wrong: "A measurement wave was queued with sample=24, below the harness's 30-usable-item threshold — all 8 jobs returned UNMEASURED (honestly, but wasted a full wave).",
      how_caught: "Reading the signed board's status_note ('no model reached 30 usable items') rather than assuming the bank size was the constraint.",
      fix: "Requeued at sample=30; all 8/8 came back MEASURED and signed. The threshold is now documented in the job-spec contract.",
      status: "FIXED",
    },
    {
      id: "C-2026-0819-13",
      date: "2026-08-19",
      what_was_wrong: "Two measure-chain daemons ran simultaneously after a restart race, double-logging jobs; the restart script's pkill pattern matched its own command line and killed its own launch.",
      how_caught: "Duplicate 'daemon start' markers in the log; the self-kill was traced to the unanchored pkill pattern.",
      fix: "Anchored process pattern (^python3 /workspace/measure_chain.py) in the restart script; single-daemon verified after relaunch.",
    },
    {
      id: "C-2026-0820-01",
      date: "2026-08-20",
      what_was_wrong: "Multiple live public surfaces (index.html JSON-LD, GSPCVerify, Insurers, AgentRegistry, Methodology, Agents, ProvBench, measure.html, and the provbench pack) stated measurement cards are 'anchored with OpenTimestamps' / RFC-3161 / 'Bitcoin block 954857, independently verifiable' as a present capability. The only anchor implemented is Ed25519 + SHA-256 hash-chain; verify.ts checks no timestamp proof and no .ots/Rekor artifact exists.",
      how_caught: "Internal honesty audit of anchoring claims vs implementation.",
      fix: "OTS/RFC-3161/Bitcoin claims demoted to roadmap wording across all surfaces; provbench pack corrected; the ML-DSA 'built, not shipped' discipline applied to OpenTimestamps.",
      status: "FIXED",
    },
    {
      id: "C-2026-0822-01",
      date: "2026-08-22",
      what_was_wrong: "The homepage industry grid still said '15-slot instrument' while the scoreboard, API and canon say '14-slot board, 13 measured of 14' (16 GSPC axes, 13 quotable + jail floor per the GSPC ruling). A crawler reading the grid would see 15 slots — the exact internal-count inconsistency the count-gating canon exists to prevent.",
      how_caught: "Text audit of live surfaces against canon (machine-contract style sweep of the homepage and fleet-sweep pages).",
      fix: "Killed both stale 15-slot references in NewHome-v3 (section comment + industry-grid subtitle) to '14-slot / 13 measured of 14'; verified 0 x '15-slot' remains. (PR #284.)",
      status: "FIXED",
    },
    {
      id: "C-2026-0825-01",
      date: "2026-08-25",
      topic: "index-method-errata",
      surfaces: ["/indices", "docs/SOVOS/INDEX-METHOD-0.1.md", "GET /api/indices"],
      what_was_wrong: "Risk that empty labour / AI-economy indices would be treated as product failure or filled with invented MEASURED floats (TVL/ARR/wage %) via GPU overnight — conflating UNMEASURED honesty with a missing grade.",
      how_caught: "Ownership register + INDEX-METHOD-0.1 firewall review; refuse-measured-labour skill.",
      fix: "Public FAQ on /indices; corrections topic index-method-errata; refutation ledger index-claim row; RunPod policy bans labour MEASURED invention. measured_score remains null. Signature re-issue pending (append makes signature_state STALE until re-signed — published defect, not silent edit).",
      status: "FIXED",
    },
  ],
  signature: {
    id: "aa7a8211d3671330e0dcacf1a719125f9cb09dd4ba80272fc1fac617e652f367",
    signer: "d4cb0eaa16d5f50bf7633a36aa34fe09a55e124b9316ded2abdb122bb9c37e38",
    signature: "dff4ab2c4e1c8d80c9022330343f43145af4673a0a214cf24c9e2964d204f917aa8bdcbf6bc76fec8db0ff828524f057078e087fa53d4281b448bbce44e5ac00",
    sig_input: "sha256(Python json.dumps(canonical LEDGER minus signature fields, sort_keys=True, separators=(',',':')) — ensure_ascii escapes non-ASCII as \\uXXXX)",
    key_source: "did:web:csoai.org (estate signing key d4cb0eaa)",
    note: "SIGNED 2026-08-22 (re-issue: 15th entry — 15-slot canon fix) - verify by recomputing canonical JSON and checking Ed25519 against did.json. Every append re-issues the signature; a stale signature is a published defect, never a silent edit. C-2026-0825-01 appended 2026-08-25 — expect signature_state STALE until re-issue.",
  },
};

// Serve-time staleness guard: recompute content_id of the committed body; if it
// does not match the embedded signature's id, serve with a VISIBLE flag rather
// than silently serving a broken signature. Doctrine: a stale signature is a
// published defect, never a silent edit.
// NOTE: the canonical MUST match the off-chain signer exactly. The estate signs
// with Python json.dumps(body, sort_keys=True, separators=(",",":")) — recursive
// key sort, compact separators, and ensure_ascii=True (every non-ASCII char as
// \uXXXX). (An earlier version used an array-replacer JSON.stringify which emits
// a top-level-only key whitelist and serializes every nested entry as {} — a
// hash no signer could ever reproduce, so the guard flagged VALID ledgers as
// STALE forever. Fix: reproduce the signer's canonical byte-for-byte.)
function canonJson(obj: unknown): string {
  const j = (o: unknown): string => {
    if (Array.isArray(o)) return "[" + o.map(j).join(",") + "]";
    if (o !== null && typeof o === "object") {
      const r: Record<string, unknown> = {};
      for (const k of Object.keys(o as Record<string, unknown>).sort()) r[k] = (o as Record<string, unknown>)[k];
      return "{" + Object.keys(r).map((k) => JSON.stringify(k) + ":" + j(r[k])).join(",") + "}";
    }
    return JSON.stringify(o);
  };
  // ensure_ascii=True: escape every non-ASCII char as \uXXXX (4-digit lowercase hex)
  return j(obj).replace(/[\u0080-\uffff]/g, (c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0"));
}

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const onRequestGet: PagesFunction = async () => {
  const body = { ...LEDGER } as Record<string, unknown>;
  delete body.signature;
  const canonical = canonJson(body);
  const cid = await sha256Hex(canonical);
  const embeddedId = (LEDGER.signature as { id?: string } | undefined)?.id ?? null;
  const signatureState = embeddedId && cid === embeddedId ? "VALID" : "STALE";
  const out = signatureState === "VALID"
    ? LEDGER
    : { ...LEDGER, signature_state: "STALE", note: "Signature is stale because the ledger was appended after signing. Re-issue the signature (gen-reg-feed.mjs) - a stale signature is a published defect, never a silent edit." };
  return new Response(JSON.stringify(out, null, 2), {
    headers: {
      "content-type": "application/json",
      "cache-control": "public, max-age=60",
      "access-control-allow-origin": "*",
    },
  });
};
