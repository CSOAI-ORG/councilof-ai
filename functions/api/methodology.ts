// /api/methodology — the measurement methodology for every instrument, in one
// signed, deterministic document (the LMArena-paper / Artificial-Analysis-index
// analog). Every instrument states how it measures, its honesty rules, and
// what it will NOT claim. Signed at the edge with did:web:csoai.org#board-attestation-1.
//
// CC-BY-4.0. Council of AI (CSOAI Ltd, UK Companies House 16939677).

const FEED = {
  schema: "csoai.methodology/0.1",
  what: "The measurement methodology — how each instrument measures, its honesty rules, and the claims it refuses to make. Measurement, never certification.",
  verified_as_of: "2026-08-22",
  license: "CC-BY-4.0",
  publisher: "Council of AI (CSOAI Ltd, UK Companies House 16939677)",
  instruments: [
    {
      id: "gspc-board",
      what: "16-axis GSPC battery (Governance/Safety/Provenance/Continuity) over our own model fleet + published systems.",
      method: "Deterministic probes on frozen instruments; per-axis score + sample size; McNemar test on disagreements; ties are ties, point-estimate leads are not wins.",
      honesty: "MEASURED only (ran it ourselves). REPORTED figures cited + unsigned, never blended into MEASURED. UNMEASURED stays honest. 13 measured of 14 public.",
      refuses: "No certification, no conformity mark, no legal advice, no ranking of named regulators in a league table.",
    },
    {
      id: "regulation",
      what: "Verified regulation-deadline feed (cited, dated, quarterly re-verified).",
      method: "Deadlines verified against primary law; each entry carries legal basis + penalty exposure; corrected by appended corrections, never silent edits.",
      honesty: "Statements OF law cited to the instrument. Disputed items recorded, not resolved silently.",
      refuses: "No 'is this law good' judgement. No ranking of regulators.",
    },
    {
      id: "clarity",
      what: "Machine-readability & clarity record — binary process facts about how regimes publish guidance.",
      method: "Predicates over public artifacts (URL probed, content-negotiated); every YES backed by its probe; UNMEASURED left honest.",
      honesty: "No score, no opinion. Benchmark against each regime's OWN stated commitments.",
      refuses: "No ranked league table, no named-individual findings, no composite quality score, no payment from the measured.",
    },
    {
      id: "games",
      what: "Deterministic agent-vs-agent games with signed replays + Elo.",
      method: "Seeded episodes via the games runner; double-run determinism gate; Ed25519-receipt the replay reproduces; Bradley-Terry Elo (K=32) over SIGNED outcomes only.",
      honesty: "A replay the runner cannot reproduce twice is never signed (UNSEALED). Elo moves only on signed outcomes.",
      refuses: "No private testing lanes; uniform disclosed rules; no blend of unsealed into the rated board.",
    },
    {
      id: "human-vs-ai",
      what: "Human-vs-AI play on turn-based games, scored on the game's GSPC axis.",
      method: "Deterministic human-play-quality (win/threat/block/center signals) per move; aggregate win/ai/draw rates with Wilson 95% CI per game.",
      honesty: "Human play is not deterministic → UNSEALED never signed. Reported as context, not the signed rail.",
      refuses: "Does not certify human ability; does not blend human (unsealed) into the signed AI-vs-AI Elo.",
    },
    {
      id: "jail",
      what: "Containment / sandbox-escape refusal measurement.",
      method: "Deterministic attack bank (fam58 expanded) + refusal rubric (hedge/refuse); dual-walk generation (draft + check); per-model refusal rate.",
      honesty: "Refusals are measured, not certified safety. External sweep on estate pod is OUR instrument (MEASURED via our bank).",
      refuses: "Never claims a model is 'safe'; no certification; no guarantee of future jailbreak-resistance.",
    },
    {
      id: "arena",
      what: "Headless coordination benchmark (munder-difflin mechanics ported, seeded, mock agents).",
      method: "Deterministic seeded offices; composite of 6 axes (efficiency/coordination/governance/transparency/continuity/accountability); messages = coordination cost; same seed → same outcome.",
      honesty: "Runs reproducible; composite CI shown (seed variation, not noise); mock agents — coordination measurement, not agent-quality certification.",
      refuses: "Does not claim real-LLM agent quality; the mock is a coordination-mechanics instrument.",
    },
  ],
  aggregation: {
    what: "How axis scores roll up — and where the estate refuses to roll them up. Every aggregate is a declared weighted function, never a black-box index.",
    policy: "The 16-axis GSPC battery reports each axis as its own score + 95% CI (with sample size n). There is NO single opaque 'intelligence index': a model's GSPC record is the vector of per-axis cells, each with CI + n, so a reader sees spread, not one lulling number.",
    declared_weights: {
      gspc_board: { kind: "per-axis vector", note: "no blended scalar; each axis equi-weighted only in the optional display mean, which is labelled 'mean (equal weight, per-axis)' and always shown with sd/se/ci95." },
      arena: { kind: "equal-weight composite of 6 axes", axes: ["efficiency", "coordination", "governance", "transparency", "continuity", "accountability"], weights: "1/6 each (declared)", note: "composite CI shown from seed variation; reproducible same-seed." },
      human_vs_ai: { kind: "per-game Wilson 95% CI", note: "win/ai/draw rates with Wilson CI per game; never blended into the signed AI-vs-AI Elo." },
    },
    refuses: "No unweighted average is presented as an index; no single 'score' is claimed to rank models; a composite is only shown where its weights are published and its CI is shown.",
  },
  honesty_rules: [
    "MEASURED / REPORTED / UNMEASURED are three kinds of claim — never merged.",
    "UNMEASURED is a disclosure about us, not a failing grade for the system.",
    "Nobody we measure pays for a place, a score, or a removal.",
    "No ranked league table of named regulator bodies (Doing Business lesson).",
    "No adverse finding attached to any named individual (Derbyshire-shield limits).",
    "Signing key never travels; one genuine PR per upstream.",
    "A wrong fact is a corrections-ledger event: appended, never silently edited.",
  ],
  verification: "Every feed signs with did:web:csoai.org#board-attestation-1; a stranger can fetch /.well-known/did.json and verify without trusting us. Verification stays free and loginless.",
};

export const onRequestGet: PagesFunction = async (context) => {
  const body: Record<string, unknown> = { ...FEED };
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
      const signedBytes = canonical(body);
      const der = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const key = await crypto.subtle.importKey("pkcs8", der, { name: "Ed25519" }, true, ["sign"]);
      const sig = hex(await crypto.subtle.sign("Ed25519", key, new TextEncoder().encode(signedBytes)));
      const jwk = (await crypto.subtle.exportKey("jwk", key)) as JsonWebKey;
      body.signature = {
        attests: "integrity of this methodology feed as published by the site",
        signer: "did:web:csoai.org#board-attestation-1",
        alg: "Ed25519",
        sig,
        public_key_x: jwk.x,
        sig_input: "canonical JSON (recursively sorted keys, no whitespace) of this feed with the signature field removed",
        verify: "fetch /.well-known/did.json → #board-attestation-1 public key → recompute canonical JSON and verify Ed25519 against did.json",
      };
    } catch {
      body.signature = { error: "signing key present but unusable — operations must fix; no signature emitted" };
    }
  }
  return new Response(JSON.stringify(body, null, 2), {
    headers: { "content-type": "application/json", "cache-control": "public, max-age=3600", "access-control-allow-origin": "*" },
  });
};
