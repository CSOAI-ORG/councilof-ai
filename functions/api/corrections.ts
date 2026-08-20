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
      what_was_wrong: "The public board API payload carried internal specialist identifiers (sov6-*) \u2014 a banned-vocabulary string inside a machine contract, not just a human page.",
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
      what_was_wrong: "Two open-source repos (carder, codabench-gspc) shipped with no LICENSE file, and the board API payload stated no licence \u2014 while the estate claims openness.",
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
      what_was_wrong: "An hourly API guard asserted endpoints (/api/tools, /api/mcp) that never existed in the repository's functions tree \u2014 a ghost from an older deployment \u2014 so it failed forever.",
      how_caught: "Reading the failing run rather than trusting the guard's own claim.",
      fix: "Rewritten to assert the endpoints the deployment actually ships (/api/health, /api/leaderboard).",
      status: "FIXED",
    },
    {
      id: "C-2026-0819-07",
      date: "2026-08-19",
      what_was_wrong: "A banned brand string shipped live on /library as 'CEASAITraining' because a word-boundary regex (\\bCEASAI\\b) missed the CamelCase concatenation. Two priced strings ($0.005/card, a per-hour range) also shipped, against the no-pricing rule.",
      how_caught: "A full front-end QA sweep.",
      fix: "The brand gate's CEASAI pattern dropped its trailing boundary; a pricing-leak pattern was added so a currency amount bound to a subscription or per-unit cadence is now a hard build-fail.",
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
      fix: "Flagged for the owner to set private \u2014 the platform gates dataset visibility behind the account login.",
      status: "OPEN",
    },
    {
      id: "C-2026-0819-10",
      date: "2026-08-19",
      what_was_wrong: "The estate's own date-correction fix (C-08) initially ALSO mis-stated the GPAI date \u2014 a follow-on error that moved GPAI duties from 2 Aug 2025 to 2026 while correcting the high-risk date. A correction that introduces a new error is the worst kind.",
      how_caught: "Self-audit of the fix against the EU official page (digital-strategy.ec.europa.eu) \u2014 the estate caught its own owner mid-correction.",
      fix: "GPAI 2 Aug 2025 restored; Article 50 2 Aug 2026 and high-risk 2 Dec 2027 (Annex III) / 2 Aug 2028 (Annex I) stated distinctly. This entry is that admission, appended not edited.",
      status: "FIXED",
    },
    {
      id: "C-2026-0819-11",
      date: "2026-08-19",
      what_was_wrong: "mcp.json advertised three server URLs on csoai.org/api/* \u2014 every one returned 404 because the API is served from councilof.ai, and one route (corpus-watch) pointed at a non-existent path.",
      how_caught: "End-user MCP handshake test \u2014 a real JSON-RPC initialize probe against the advertised endpoints.",
      fix: "mcp.json now advertises councilof.ai URLs and the real /api/corpus-watch/status route; the advertised endpoints were verified 200/JSON-RPC-responsive after the fix.",
      status: "FIXED",
    },
    {
      id: "C-2026-0819-12",
      date: "2026-08-19",
      what_was_wrong: "A measurement wave was queued with sample=24, below the harness's 30-usable-item threshold \u2014 all 8 jobs returned UNMEASURED (honestly, but wasted a full wave).",
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
  ],
  signature: {
    id: "394da31f95546e47f472b7a168b67e03689eaa1ae5c7a2ba93cc866e9d36f641",
    signer: "d4cb0eaa16d5f50bf7633a36aa34fe09a55e124b9316ded2abdb122bb9c37e38",
    signature: "8a0ac16dc799ff7b7171ce49bc8bf2d17c637702df6325356f5433dc34ef68ef6727e3a80adccb1171d34fe52b680835dfe08d48fb4d7ec6c884f71a647e0706",
    sig_input: "sha256(canonical LEDGER minus signature fields, sort_keys)",
    key_source: "did:web:csoai.org (estate signing key d4cb0eaa)",
    note: "SIGNED 2026-08-20 (14-entry body) - verify by recomputing canonical JSON and checking Ed25519 against did.json. Every append re-issues the signature.",
  },
};

export const onRequestGet: PagesFunction = async () => {
  return new Response(JSON.stringify(LEDGER, null, 2), {
    headers: {
      "content-type": "application/json",
      "cache-control": "public, max-age=3600",
      "access-control-allow-origin": "*",
    },
  });
};
