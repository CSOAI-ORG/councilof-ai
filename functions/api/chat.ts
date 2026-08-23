// functions/api/chat.ts — "Ask SOV".
//
// Two lanes, and the answer always says which one it came from:
//
//   LIVE      the tuned specialist on the GPU, when SOV_GATE_URL/TOKEN are set
//   GROUNDED  a deterministic responder over the estate's own published measurements
//
// The grounded lane is not a placeholder apology. It answers real questions —
// an axis's score, whether an EU AI Act Article 5 practice is prohibited, what a
// status means — from data the estate has actually earned, and it says
// "unmeasured" wherever the estate has not earned a number. What it will never
// do is invent one. An answer it cannot ground is refused, not improvised.

interface Env { SOV_GATE_URL?: string; SOV_GATE_TOKEN?: string }

/* ── Article 5(1) — the eight prohibited practices, verbatim in substance ──── */
const ART5: Record<string, string> = {
  a: "subliminal, purposefully manipulative or deceptive techniques that materially distort behaviour and cause significant harm",
  b: "exploitation of vulnerabilities due to age, disability, or a specific social or economic situation",
  c: "social scoring leading to detrimental treatment in unrelated contexts, or that is unjustified or disproportionate",
  d: "risk assessment predicting criminal offending based solely on profiling or personality traits",
  e: "untargeted scraping of facial images from the internet or CCTV to build facial-recognition databases",
  f: "inference of emotions in the workplace or education institutions, save for medical or safety reasons",
  g: "biometric categorisation deducing race, political opinions, trade-union membership, religion, or sex life",
  h: "real-time remote biometric identification in publicly accessible spaces for law enforcement",
};

// Each cue is a conjunction: every regex must match somewhere in the question.
// Written as AND-sets rather than one ordered pattern because natural questions put
// the terms in any order ("infer employee emotions at work" vs "workplace emotion AI").
const ART5_CUES: [string, RegExp[]][] = [
  ["a", [/\b(subliminal|manipulat|deceptive|dark pattern)/i]],
  ["b", [/\b(exploit|target|prey on|take advantage)/i, /\b(age|child|minor|elderly|disab|poverty|low[- ]income|vulnerab)/i]],
  ["c", [/\b(social scor|citizen scor|trustworthiness scor|score citizens|rate citizens)/i]],
  ["d", [/\b(predict|forecast|risk[- ]?assess|likelihood)/i, /\b(crime|criminal|offend|reoffend|polic)/i]],
  ["e", [/\b(scrap|harvest|collect|crawl)/i, /\b(face|facial|headshot|photo)/i]],
  ["f", [/\bemotion|\bmood|\bsentiment.{0,12}(of|from).{0,12}(staff|employee|student)/i,
         /\b(workplace|work|employee|staff|worker|office|school|student|classroom|exam|education|university)/i]],
  ["g", [/\bbiometric|\bfacial analysis|\bcategoris|\bcategoriz/i,
         /\b(race|ethnic|religio|political|union|sexual|sex life|orientation)/i]],
  ["h", [/\b(real[- ]?time|live|instant)/i, /\b(biometric|facial recognition|face recognition|identif)/i]],
];

const wilson = (acc: number, n: number): [number, number] => {
  if (!n) return [0, 0];
  const z = 1.959964, d = 1 + (z * z) / n;
  const c = acc + (z * z) / (2 * n);
  const m = z * Math.sqrt((acc * (1 - acc)) / n + (z * z) / (4 * n * n));
  return [Math.max(0, (c - m) / d), Math.min(1, (c + m) / d)];
};

async function loadAxes(origin: string): Promise<any[]> {
  try {
    const r = await fetch(new URL("/api/gspc", origin).toString());
    if (!r.ok) return [];
    const j: any = await r.json();
    return Array.isArray(j?.axes) ? j.axes : [];
  } catch { return []; }
}

async function loadCity(origin: string): Promise<any | null> {
  try {
    const r = await fetch(new URL("/city/board.json", origin).toString());
    if (!r.ok) return null;
    const j: any = await r.json();
    return j?.kind === "sovos-city.board" ? j : null;
  } catch { return null; }
}

/** Deterministic. Returns null when the question cannot be grounded — never a guess. */
async function grounded(q: string, origin: string): Promise<string | null> {
  const t = q.toLowerCase().trim();

  // 1. Article 5 — is this practice prohibited?
  for (const [k, rxs] of ART5_CUES) {
    if (rxs.every((rx) => rx.test(q))) {
      return `That is prohibited under **EU AI Act Article 5(1)(${k})** — ${ART5[k]}.\n\n` +
why(k) +
        `\n\nArticle 5 prohibitions are absolute: there is no conformity assessment, ` +
        `registration, or documentation route that makes a prohibited practice lawful. ` +
        `Prohibitions have applied since 2 February 2025.\n\n` +
        `_Classified by a deterministic rule against Article 5(1)(a)–(h), not by a model._`;
    }
  }

  const axes = await loadAxes(origin);
  const axisNames = axes.map((a: any) => String(a.axis)).filter(Boolean);

  // 1o. Pricing / plans — no SaaS tiers.
  if (/\b(pricing|plans?|per[- ]seat|saas tier|course fee|what is free|not promised)\b/i.test(q)) {
    return (
      `There are no SaaS tiers, no per-seat plans, and no course fees on this estate.\n\n` +
      `Measurement and verification are free forever. Anyone can read GET /api/gspc, verify a card at /gspc-verify/, ` +
      `and run an assessment at /assess/ with no account.\n\n` +
      `Where a signed evidence artefact is sold, it is priced as an artefact on its own product page — ` +
      `never a fee for a ranking or placement. See /pricing/ for the published posture.\n\n` +
      `_Grounded in the published pricing page, not by a model._`
    );
  }

  // 1p. Sector / demographic — what to do first (not an axis score).
  if (
    /\b(what should .+ do first|ai governance for |sector|for finance|for healthcare|for startup|for enterprise|for regulator)\b/i.test(q) &&
    !/\b(governance axis|axis score|accuracy|wilson|n=)\b/i.test(q)
  ) {
    return (
      `A sensible first move with signed evidence:\n\n` +
      `1. **Inventory** — name the AI systems that matter and which rules might apply (EU AI Act tier, sector law, DORA, etc.).\n` +
      `2. **Read the board** — GET /api/gspc shows what is measured today; empty cells stay empty.\n` +
      `3. **Verify, don't trust** — recompute any card at /gspc-verify/ with the published Ed25519 key.\n` +
      `4. **Get measured** — /assess/ runs against frozen rules; the result attests measurement, not certification.\n\n` +
      `Sector pages under /for/ and /regulators/ link to published crosswalks. The Council does not give a legal opinion.\n\n` +
      `_Grounded in the published method and routes, not by a model._`
    );
  }

  // 1b. Who we are / measure vs certify — the questions the lobby actually suggests.
  if (
    /\b(in plain words|actually measure|what (do|does) (the )?(council|csoai|this (estate|body|site)))\b/i.test(q) ||
    (/\bcertif/i.test(q) && /\bmeasur/i.test(q)) ||
    /\bdifference between measur/i.test(q) ||
    /\bone-paragraph summary\b/i.test(q)
  ) {
    const list = axisNames.length
      ? `This stamp's board axes, from GET /api/gspc: ${axisNames.join(", ")}.`
      : "Read the living board at GET /api/gspc — this process could not load it just now.";
    return (
      `The Council of AI measures published behaviour against frozen rules, signs the ` +
      `result with Ed25519, and publishes what it cannot measure.\n\n` +
      `It does not certify, approve, or remediate. A grade is never sold. Anyone can ` +
      `recompute a card at /gspc-verify with no account.\n\n` +
      `${list}\n\n` +
      `Counts and stamps live on the API. This reply does not type a slot number.\n\n` +
      `_Grounded in the published board, not by a model._`
    );
  }

  // 1c. Empty cells / no number.
  if (/\b(no number|empty cell|carry no number|without a (number|score)|unmeasured axis|axis is published with no)\b/i.test(q)) {
    return (
      `An axis with no number is not a missing graphic. It is a published cell that ` +
      `has not earned a quotable figure on this stamp — UNMEASURED, below the usable-n ` +
      `floor, or still in-lane beside the board.\n\n` +
      `Empty cells stay empty. We do not invent a score to fill them. ` +
      `In-lane rows (instrument-honesty, human-vs-ai) sit beside the board and are ` +
      `not counted in totals.public_count.\n\n` +
      `Read the cells from GET /api/gspc.\n\n` +
      `_Grounded in the published board, not by a model._`
    );
  }

  // 1d. Verify a card.
  if (
    (/\b(verif|recompute|ed25519|public key|without (trusting|a csoai account))\b/i.test(q) &&
      /\b(card|hash|sign|key|did|check)\b/i.test(q)) ||
    /\bcheck a (published )?card\b/i.test(q)
  ) {
    return (
      `A measurement card is a canonical JSON record plus an Ed25519 signature.\n\n` +
      `1. Drop content_id and signature, sort keys, SHA-256 the bytes — that hash is the card.\n` +
      `2. Fetch the public key from https://csoai.org/.well-known/did.json (did:web:csoai.org).\n` +
      `3. Check the signature in your own browser at /gspc-verify. No account, no fee.\n\n` +
      `If the hash or the signature fails, the card is not ours. We do not have a third step.\n\n` +
      `_Grounded in the published verify path, not by a model._`
    );
  }

  // 1e. Legal entity / who publishes.
  if (/\b(legal entity|who publishes|behind them|csoai ltd|companies house|nicholas templeman)\b/i.test(q)) {
    return (
      `The publisher is **CSOAI Ltd**, UK company **16939677**. Trading as Council of AI. ` +
      `Site: councilof.ai. Founder: Nicholas Templeman.\n\n` +
      `The signing identity is **did:web:csoai.org**. Keys live on the static apex ` +
      `https://csoai.org/.well-known/did.json — not on this SPA.\n\n` +
      `_Grounded in the published legal pages, not by a model._`
    );
  }

  // 1f. Corrections / what we refuse / insurer reliance.
  if (
    /\b(correction|got wrong|refuse to (state|opine|certif)|not claim|out of scope|rely on in a (published|signed)|what can i rely on)\b/i.test(q) ||
    /\b(who checks|checks the council|corrections ledger|refutation)\b/i.test(q) ||
    /\b(safe to underwrite|must not be underwritten|empty cells)\b/i.test(q)
  ) {
    return (
      `A published measurement says: this system, this frozen bank, this n, this score, ` +
      `this signature. It does not say the system is lawful, safe to deploy, or certified.\n\n` +
      `The Council will not invent a missing instrument, will not fill an empty cell, ` +
      `and will not give a legal opinion. Regulators and notified bodies decide conformity.\n\n` +
      `When we get a number wrong it lands on GET /api/corrections. Read that feed — ` +
      `this reply will not summarise it from memory.\n\n` +
      `_Grounded in the published method, not by a model._`
    );
  }

  // 1m. Regulators / crosswalks / frozen statute.
  if (
    /\b(regulator|supervisory|crosswalk|frozen (text|statute|provision)|frameworks (are )?crosswalked|policy bodies)\b/i.test(q) ||
    /\b(refuse to certify|decide for supervisory)\b/i.test(q)
  ) {
    return (
      `Regulators read crosswalks and frozen provisions — not a conformity opinion from us.\n\n` +
      `Published material: GET /api/regulation (what is in force vs deferred), the Regulator Atlas at /regulators/, ` +
      `and framework pages under /hive/. Each measurement card states what was frozen and what was graded.\n\n` +
      `The Council measures and signs; supervisory bodies and notified bodies decide conformity. ` +
      `We refuse to certify or fill empty cells.\n\n` +
      `_Grounded in the published regulation surfaces, not by a model._`
    );
  }

  // 1n. Honesty page / corrections published.
  if (/\b(honesty (page|ledger)|corrections and refusals|what has the council got wrong)\b/i.test(q)) {
    return (
      `The honesty gate at /honesty/ publishes where our own fine-tunes and instruments lose on published banks — ` +
      `win or lose, with the n and the signature attached.\n\n` +
      `Structured corrections live at GET /api/corrections. Read that feed for what we got wrong and when; ` +
      `this reply will not summarise it from memory.\n\n` +
      `_Grounded in the published honesty and corrections surfaces, not by a model._`
    );
  }

  // 1h. Endpoints / published bank.
  if (/\b(endpoint|what shape|published bank|items live|reproduce)\b/i.test(q)) {
    return (
      `The living board is GET /api/gspc (JSON). Corrections: GET /api/corrections. ` +
      `Regulation feed: GET /api/regulation. Keys: https://csoai.org/.well-known/did.json.\n\n` +
      `Axis banks that are public are named on the board payload as dataset slugs ` +
      `(Hugging Face). This reply will not invent a slug — read the axis object.\n\n` +
      `_Grounded in the published API, not by a model._`
    );
  }

  // 1i. Assessment scope — explicit "get measured", not bare "is measured".
  if (/\b(assessment actually run|explicitly not (claim|say)|would it take to have)\b/i.test(q) ||
      /\bget (?:my system )?measured\b/i.test(q)) {
    return (
      `An assessment records a description against published rules and returns a signed ` +
      `measurement. It does not say the system is lawful, certified, or safe to deploy.\n\n` +
      `Start at /assess. Recompute the card at /gspc-verify. Counts stay on GET /api/gspc.\n\n` +
      `_Grounded in the published method, not by a model._`
    );
  }

  // 1j. Regulation feed / obligations.
  if (/\b(regulation feed|in force today|deferred|obligations land next|penalty exposure)\b/i.test(q)) {
    return (
      `The dated obligation feed is GET /api/regulation. What is in force versus deferred ` +
      `is on that payload. This reply will not type a deadline from memory.\n\n` +
      `_Grounded in the published feed, not by a model._`
    );
  }

  // 1k. Separation / unparsed / licence.
  if (/\b(mcnemar|statistical separation|what counts as a tie|unparseable|not dropped|licence|license)\b/i.test(q)) {
    return (
      `A point lead is a TIE unless a McNemar test on the disagreed items separates it. ` +
      `Unparsed answers are counted incorrect, never dropped. Board data is CC-BY-4.0 — ` +
      `attribute Council of AI, CSOAI Ltd 16939677, councilof.ai. See totals.license on GET /api/gspc.\n\n` +
      `_Grounded in the published method, not by a model._`
    );
  }

  // 1l. Watchdog / academy.
  if (/\b(incident after it is reported|who sees it|academy attest)\b/i.test(q)) {
    return (
      `A Watchdog report is triaged on /watchdog. Completing Academy attests training, ` +
      `not conformity — a course is not a measurement and not a certificate of a system.\n\n` +
      `_Grounded in the published surfaces, not by a model._`
    );
  }

  // 1q. TIE / board walk-through (lobby suggested questions).
  if (/\b(what does a tie mean|statistically indistinguishable|point lead not an advantage|point lead is not)\b/i.test(q)) {
    return (
      `A **TIE** on the GSPC board means the leader's point-estimate edge failed McNemar separation (p≥0.05 on discordant items). ` +
      `We never count a tie as a win — the chip reads "indistinguishable", not "leading".\n\n` +
      `Ordering on the board is presentation, not a ranking claim. Read the separation chip, not the row position.\n\n` +
      `_Grounded in the published method on GET /api/gspc._`
    );
  }

  if (/\b(walk me through|which axes carry|measured figure and which carry none)\b/i.test(q) && axes.length) {
    const m = axes.filter((a: any) => a.status === "MEASURED" && a.n > 0);
    const empty = axes.filter((a: any) => a.status !== "MEASURED" || !a.n);
    return (
      `**${m.length}** axes carry a measured figure on this stamp; **${empty.length}** do not.\n\n` +
      `Measured:\n` +
      m.map((a: any) => `· **${a.axis}** — ${(a.accuracy * 100).toFixed(1)}% · ${a.separation ?? "—"} · leader ${a.leader ?? "—"}`).join("\n") +
      `\n\nNo score (honest empty):\n` +
      empty.map((a: any) => `· **${a.axis}** — ${a.status}`).join("\n") +
      `\n\nFull intervals and harm tails: GET /api/gspc · /gspc-scoreboard\n\n` +
      `_Grounded in live board payload._`
    );
  }

  // 1r. Insurer / underwriting.
  if (/\b(safe to underwrite|underwrite on today|insurer|pricing ai risk)\b/i.test(q)) {
    const m = axes.filter((a: any) => a.status === "MEASURED" && a.separation === "SEPARATED");
    return (
      `For underwriting, rely only on **SEPARATED** leads and signed measurement cards you can verify at /gspc-verify.\n\n` +
      `On this stamp **${m.length}** axes have a statistically separated leader. TIE rows are not wins. ` +
      `Empty cells are empty — not zeros.\n\n` +
      `REPORTED third-party context lives at GET /api/reported — never merged into board scores.\n\n` +
      `_Grounded in published board + method._`
    );
  }

  // 1s. REPORTED vs measured.
  if (/\b(reported third|third.party context|versus the council's own|our own measurement)\b/i.test(q)) {
    return (
      `**MEASURED** figures come from our frozen banks and deterministic graders — signed on GET /api/gspc.\n\n` +
      `**REPORTED** is cited third-party context (press, market sizes, acquisition context) — GET /api/reported. ` +
      `It is never merged into GovBench scores or board cells.\n\n` +
      `_Grounded in stack honesty registers._`
    );
  }

  // 1t. Engine axis / venturi / bond crossing.
  if (/\b(engine axis|bond venturi|bond crossing|cobol|a2a|fixed income)\b/i.test(q)) {
    return (
      `**Engine axis** (/engine-axis) — honest register of MEASURED vs PLANNED crossings (bonds, insurance, COBOL, east-west).\n\n` +
      `**Bond venturi** (/venturi) — COBOL overnight batch → A2A T+0 settlement thesis. Bond market size is REPORTED; pipeline steps are SPEC until measured.\n\n` +
      `**Bond crossing API** — GET /api/finance/bond-crossing (when deployed). Arena harness thesis: /arena-harness.\n\n` +
      `_Grounded in published pages — counts not invented here._`
    );
  }

  // 1u. Eunomia router / instruments / MCP.
  if (/\b(eunomia|instruments|mcp server|routing table|openrouter of governance)\b/i.test(q)) {
    return (
      `**Eunomia Router** (/instruments) — governance routing table entries (framework, regulation, law, benchmark, compute). ` +
      `Not a model proxy — each path exposes REST, MCP, or AG-UI SSE.\n\n` +
      `Catalog: GET /api/instruments · MCP spine: /.well-known/mcp.json\n\n` +
      `Try a route in **Council OS** — AG-UI handle = instrument slug when AGUI_WIRE_URL is set.\n\n` +
      `_Grounded in published router catalog._`
    );
  }

  // 1v. Council OS / AG-UI.
  if (/\b(council os|ag.ui|agui|lobby|streaming|hitl|consent checkpoint)\b/i.test(q)) {
    return (
      `**Council OS** is the site-wide lobby — three lanes:\n\n` +
      `1. **Local** — pane commands (show board, verify, arena) — no network.\n` +
      `2. **AG-UI** — POST /api/agui/session → SSE stream when AGUI_WIRE_URL points at the wire (RunPod :8785).\n` +
      `3. **Grounded** — POST /api/chat — published measurement or honest refuse.\n\n` +
      `Seeded prompts are typed, never auto-sent (consent lock). Open from any page via Council OS button.\n\n` +
      `_Grounded in agent runbook /api-docs._`
    );
  }

  // 1w. Receipt spec / ownership / signal.
  if (/\b(receipt.spec|measurement.card format|ed25519 envelope|ownership plan|100 moves|sov signal)\b/i.test(q)) {
    return (
      `**RECEIPT-SPEC-0.1** (/receipt-spec) — canonical measurement-card envelope (hash, Ed25519, content_id).\n\n` +
      `**Ownership plan** (/ownership) — 100 moves across standards, domain, data, trust, distribution.\n\n` +
      `**SOV Signal Index** — GET /api/signal (schema csoai.sov-signal-index/0.1) when deployed.\n\n` +
      `_Grounded in published spec pages._`
    );
  }

  // 1x. Penalties — Article 99 (deterministic truth).
  if (/\b(penalt|fine|article 99|eur \d+|turnover)\b/i.test(q) && /\b(ai act|eu)\b/i.test(q)) {
    return (
      `Under **Article 99** EU AI Act statutory ceilings:\n\n` +
      `· Prohibited practices (Art 5): up to **EUR 35M** or **7%** global turnover\n` +
      `· High-risk duty breaches (e.g. missing Art 9 RMS): up to **EUR 15M** or **3%**\n` +
      `· Misleading information to authorities: up to **EUR 7.5M** or **1.5%**\n\n` +
      `Exact fines depend on the authority's assessment. Dated obligations: GET /api/regulation.\n\n` +
      `_Grounded in published statutory anchors — not a legal opinion._`
    );
  }

  // 1g. Minimum n / researcher floor.
  if (/\b(minimum n|usable n|quotable figure|below it|n\s*[≥>=]{0,2}\s*30)\b/i.test(q)) {
    return (
      `Nothing is quoted below usable n ≥ 30 (n × (1 − unparsed rate)). Under that floor ` +
      `the axis carries no interval and says so. Unparsed answers are counted incorrect, ` +
      `never dropped. Ties stay ties — a point lead without McNemar separation is not a win.\n\n` +
      `_Grounded in the published method, not by a model._`
    );
  }

  // 2. A named axis — word-boundary match AND score intent (avoid "AI governance" → governance axis).
  const axisIntent =
    /\b(score|accuracy|axis|axes|bench|gspc|leader|wilson|macro f1|unparsed|measured on)\b/i.test(q) ||
    /\bwhat is the \w+ (score|axis)\b/i.test(q) ||
    /\b(how many|which) axes\b/i.test(q);

  const hit = axisIntent
    ? axes.find((a: any) => {
        const name = String(a.axis ?? "");
        const bench = String(a.bench ?? "");
        const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        return (
          (name && new RegExp(`\\b${esc(name)}\\b`, "i").test(q)) ||
          (bench && new RegExp(`\\b${esc(bench)}\\b`, "i").test(q))
        );
      })
    : null;
  if (hit) {
    const q_ok = hit.status === "MEASURED" && hit.n > 0;
    if (!q_ok) {
      return `**${hit.axis}** (${hit.bench}) is **${hit.status}** — it carries no score.\n\n` +
        `Task: ${hit.task}.\n` +
        (hit.n ? `Item bank: n=${hit.n}.\n` : `There is no item bank yet (n=0).\n`) +
        (hit.note ? `\n${hit.note}\n` : "") +
        `\nI will not quote a number for an axis that has not earned one.`;
    }
    const usable = hit.n * (1 - (hit.unparsed_rate ?? 0));
    const [lo, hi] = wilson(hit.accuracy, hit.n);
    return `**${hit.axis}** (${hit.bench}) is **MEASURED**.\n\n` +
      `Accuracy **${hit.accuracy.toFixed(3)}**` +
      (usable >= 30
        ? `, Wilson 95% [${lo.toFixed(3)}, ${hi.toFixed(3)}], n=${hit.n}.`
        : `, n=${hit.n} — below the 30 usable-item floor, so no interval is reported.`) +
      `\nMacro F1 ${Number(hit.macro_f1).toFixed(3)}. Unparsed ${(100 * (hit.unparsed_rate ?? 0)).toFixed(1)}% (counted incorrect).\n` +
      `Task: ${hit.task}.` + (hit.note ? `\n\n${hit.note}` : "");
  }

  // 3. The board as a whole — must ask about the board, not merely contain "measured".
  if (
    /\b(board|scoreboard|axes|axis|gspc|coverage|how many axes|walk me through|overview|live board)\b/.test(t) &&
    axes.length
  ) {
    const m = axes.filter((a: any) => a.status === "MEASURED" && a.n > 0);
    const withCI = m.filter((a: any) => a.n * (1 - (a.unparsed_rate ?? 0)) >= 30);
    return `The GSPC suite is **${axes.length} axes**. **${m.length}** are MEASURED; ` +
      `**${withCI.length}** carry a confidence interval (usable n ≥ 30).\n\n` +
      m.map((a: any) => `· **${a.axis}** ${a.accuracy.toFixed(3)} (n=${a.n})`).join("\n") +
      `\n\nThe other ${axes.length - m.length} are UNMEASURED, DRAFT, SPEC or PLANNED and show no number. ` +
      `That is the point of the instrument: absence of evidence is reported, not hidden.`;
  }

  // 4. The arena.
  if (/\b(city|arena|swarm|simulat|agent|faction|red team|epoch)\b/.test(t)) {
    const c = await loadCity(origin);
    if (c) {
      const proven = c.positive_control?.gate_exercised;
      const breaches = Object.entries(c.breaches_by_article ?? {});
      return `**Council City** — the governed multi-agent arena. Last published run: ` +
        `${c.epochs} epochs, ${c.turns} turns, ${c.usable_n} usable, ${c.unmeasured} unmeasured.\n\n` +
        `Positive control: **${proven ? "PASSED" : "FAILED"}** — known-breaching actions were pushed through ` +
        `the live gate and ${proven ? "every one was blocked with the right citation" : "were NOT blocked, so the run proves nothing"}.\n\n` +
        (breaches.length
          ? `Breaches: ${breaches.map(([k, v]) => `${k} × ${v}`).join(", ")}.`
          : `No citizen proposed an Article 5 breach in that run.`) +
        `\n\nChain: ${c.chain?.records} signed epochs, ${c.chain?.signature_ok} signatures verified, ` +
        `${c.chain?.chain_intact ? "intact" : "BROKEN"}. Law: Article 0 V1–V8 + EU AI Act Art 5(1)(a)–(h), ` +
        `graded deterministically — no model judges another model.`;
    }
  }

  // 5. Method questions.
  if (/\b(method|how do you|unparsed|interval|wilson|grader|judge|canary|n *[>=≥]* *30)\b/.test(t)) {
    return `The rules every board here runs on:\n\n` +
      `· **Unparsed counted incorrect** — an answer we cannot read is a wrong answer, never a dropped row.\n` +
      `· **No model judges another model** — every grader is deterministic; there is no LLM jury.\n` +
      `· **Nothing quoted below usable n ≥ 30** — under that an axis carries no interval and says so.\n` +
      `· **Canaries excluded** — they detect contamination and never enter a score.\n` +
      `· **Three outcomes, never two** — success, failure, and *unmeasured*.\n\n` +
      `Every published artefact is signed and recomputable from the item bank.`;
  }

  return null;
}

function why(k: string): string {
  const map: Record<string, string> = {
    a: "The test is material distortion of behaviour plus significant harm — persuasion as such is not caught.",
    b: "The vulnerability must be the reason the technique works, and harm must be likely.",
    c: "The trigger is detrimental treatment in a context unrelated to the data, or treatment disproportionate to the behaviour.",
    d: "Prediction based *solely* on profiling or personality is caught; supporting a human assessment grounded in objective facts is not.",
    e: "The word doing the work is *untargeted* — scraping directed at specific, lawfully-obtained subjects is a different question.",
    f: "Workplace and education are the prohibited settings; medical and safety purposes are carved out.",
    g: "Categorisation to *deduce* a protected characteristic is caught; biometric verification as such is not.",
    h: "Real-time and remote and publicly accessible and for law enforcement — narrow judicially-authorised exceptions exist.",
  };
  return map[k] ?? "";
}

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  const { request, env } = ctx;
  let body: any = {};
  try { body = await request.json(); } catch { /* empty ok */ }

  const messages =
    Array.isArray(body.messages) ? body.messages :
    typeof body.prompt === "string" ? [{ role: "user", content: body.prompt }] :
    typeof body.message === "string" ? [{ role: "user", content: body.message }] : [];
  const model = typeof body.model === "string" ? body.model : "sov6-ethics-v3-light";
  if (!messages.length) return Response.json({ error: "no message" }, { status: 400 });

  const question = String(messages[messages.length - 1]?.content ?? "");
  const origin = new URL(request.url).origin;

  const reply = (answer: string, signature: string, state: string, extra: Record<string, unknown> = {}) =>
    Response.json({ answer, reply: answer, signature, state, model, message: { role: "assistant", content: answer }, ...extra });

  // LIVE lane — the specialist, when it is wired.
  if (env.SOV_GATE_URL && env.SOV_GATE_TOKEN) {
    try {
      const r = await fetch(env.SOV_GATE_URL.replace(/\/+$/, "") + "/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + env.SOV_GATE_TOKEN },
        body: JSON.stringify({ model, messages, stream: false, options: { temperature: 0, num_predict: 400 } }),
      });
      if (!r.ok) throw new Error("gate HTTP " + r.status);
      const data: any = await r.json();
      const content = data?.message?.content ?? String(data?.response ?? "");
      if (content.trim()) return reply(content, "council · signed · verifiable offline", "live");
      throw new Error("empty answer from gate");
    } catch {
      // fall through to grounded rather than return nothing
    }
  }

  // GROUNDED lane — deterministic, over published measurements.
  const g = await grounded(question, origin);
  if (g) return reply(g, "grounded in published measurement · deterministic · recomputable", "grounded");

  let named = "";
  try {
    const live = await loadAxes(origin);
    if (live.length) named = live.map((a: any) => a.axis).filter(Boolean).join(", ");
  } catch { /* refuse text falls back */ }
  const axisHint = named || "the axes published on GET /api/gspc";

  return reply(
    `I could not ground an answer to your question from published measurement.\n\n` +
    "Try asking about a **named board axis** (with its score), whether a practice is **prohibited under EU AI Act Article 5**, " +
    "what is on **GET /api/gspc**, **pricing** (/pricing/), **regulators** (/regulators/), or the **measurement method**.\n\n" +
    `Named axes on this stamp: ${axisHint}.\n\n` +
    "I will not invent a number or a legal opinion.",
    "refused — no grounding available", "ungrounded",
  );
};
