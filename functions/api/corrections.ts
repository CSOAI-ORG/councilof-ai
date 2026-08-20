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
      what_was_wrong: "The public board API payload carried internal specialist identifiers (sov6-*) — a banned-vocabulary string inside a machine contract, not just a human page.",
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
      fix: "Flagged for the owner to set private — the platform gates dataset visibility behind the account login.",
      status: "OPEN",
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
};

export const onRequestGet: PagesFunction = async (context) => {
  // Sign the served ledger at the edge with the dedicated board-attestation key
  // (#board-attestation-1, Cloudflare secret BOARD_SIGN_KEY_PKCS8_B64; public half
  // in did.json) — the SAME mechanism /api/gspc uses, so a stranger can verify
  // without trusting us. The old hardcoded signature (estate key d4cb0eaa, now
  // lost/unverifiable) is removed: an uncheckable signature is worse than none.
  // No key → NO signature field: honest absence, never a fabricated one.
  const body: Record<string, unknown> = { ...LEDGER };
  const b64 = (context.env as { BOARD_SIGN_KEY_PKCS8_B64?: string })?.BOARD_SIGN_KEY_PKCS8_B64;
  if (b64) {
    try {
      const canonical = (o: unknown): string => {
        if (o === null || typeof o !== "object") return JSON.stringify(o);
        if (Array.isArray(o)) return "[" + o.map(canonical).join(",") + "]";
        const r = o as Record<string, unknown>;
        return "{" + Object.keys(r).sort().map((k) => JSON.stringify(k) + ":" + canonical(r[k])).join(",") + "}";
      };
      const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
      const signedBytes = canonical(body); // body WITHOUT signature — reconstructable by anyone
      const der = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const key = await crypto.subtle.importKey("pkcs8", der, { name: "Ed25519" }, true, ["sign"]);
      const sig = hex(await crypto.subtle.sign("Ed25519", key, new TextEncoder().encode(signedBytes)));
      const jwk = (await crypto.subtle.exportKey("jwk", key)) as JsonWebKey;
      body.signature = {
        attests: "integrity of this corrections ledger as published by the site",
        signer: "did:web:csoai.org#board-attestation-1",
        alg: "Ed25519",
        sig,
        public_key_x: jwk.x,
        sig_input: "canonical JSON (recursively sorted keys, no whitespace) of this ledger with the signature field removed",
        verify: "fetch /.well-known/did.json → #board-attestation-1 public key → recompute canonical JSON and verify Ed25519 against did.json",
      };
    } catch {
      body.signature = { error: "signing key present but unusable — operations must fix; no signature emitted" };
    }
  }

  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "content-type": "application/json",
      "cache-control": "public, max-age=1800",
      "access-control-allow-origin": "*",
    },
  });
};
