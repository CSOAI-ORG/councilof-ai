// functions/api/_chatLobby.ts - published answers for Council OS seeded asks.
// Phrase-matched, no model. Do not type GSPC slot counts or prices here.

function cite(src: string): string {
  return `

_Grounded in ${src}, not by a model._`;
}

const GET_MEASURED =
  `Get measured starts at /assess. You describe the system - purpose, domain, or a URL recorded as text. The assess function is a deterministic EU AI Act keyword classifier (Annex III / Art 5). It does not fetch or probe an endpoint and it is not a GSPC bench run.

You get back a signed card: tier, gaps against the fixed Art 9-15/50 control set, and what we could not measure. Empty cells stay empty. The first measurement costs nothing. Re-measuring after the description or the law changes is the normal case, not an upsell.

The card is not a certificate, not a conformity mark, and not legal advice. We do not remediate. We measure, sign, and publish what we cannot measure.

The living GSPC board is a separate published artefact at GET /api/gspc. Verify any signed record at /gspc-verify - no account, no fee.

Start at /assess, or open Get measured in Council OS.` +
  cite("the published FAQ and /assess");

const VERIFY_CARD =
  `Verification runs in your browser. Canonicalise the record (sorted keys, no whitespace), drop content_id and signature, take SHA-256 - that hash is the card's identity. Then check the Ed25519 signature against the public key at /.well-known/did.json (did:web:csoai.org). It matches or it does not.

No account, no fee, nothing you check is sent to us. There is no RFC-3161 timestamp authority and no blockchain anchor; records say timestamp_authority: none.

Open /gspc-verify.` +
  cite("the published verify FAQ");

const WATCHDOG =
  `Watchdog is an incident desk, not a certification pipeline. You file a report (system, description, severity) on /watchdog or /watchdog-map. Reports are anonymous by default; the published page says the team reviews them and recent reports can be listed.

Filing a report does not measure the system, does not issue a signed card, and does not trigger remediation by us.` +
  cite("the published Watchdog incident page");

const HUMAN_BASELINES =
  `MEASURED, UNMEASURED, and REPORTED are never merged. MEASURED is our own frozen-instrument run, signed. UNMEASURED is an honest empty cell. REPORTED is a third-party figure, cited and dated, unsigned.

Human-performance baselines beside AI figures are REPORTED aggregates from other people's studies, not our collection. A REPORTED number never enters the board and is never averaged with a MEASURED one.` +
  cite("the published FAQ on MEASURED / UNMEASURED / REPORTED");

const HONESTY =
  `Corrections are appended at GET /api/corrections and never silently edited. The honesty page (/honesty) publishes results that embarrass us, including that our own council fine-tunes lose to base models in our own arena.

Who checks our numbers: you do. Recompute a card at /gspc-verify; read the board at GET /api/gspc. The hardest retraction on the record is DR-0007: a consensus guarantee that did not hold is labelled a design figure, not a live property.` +
  cite("/honesty and GET /api/corrections");

const REGULATOR =
  `Regulators get a behavioural record they can recompute, not a supplier's assurance about its own product. A GSPC grade is measurement, not a decision: the Council does not approve, ban, fine, or clear any system.

Each provision is traceable from statute text to the items that test it. Empty slots tell a supervisor where evidence does not yet exist. The card is signed so its provenance survives being forwarded.

See /regulators, /crosswalk, GET /api/gspc, and GET /api/regulation.` +
  cite("the published regulator FAQ");

const INSURER =
  `A measurement card is an observed behavioural sample with a stated n and interval - not a signal that a system is safe to underwrite. We do not tell an insurer what to charge, and we take no share of anything written on the back of a card.

Empty cells stay empty. Ties stay ties. Live counts: GET /api/gspc. Verify free at /gspc-verify.` +
  cite("the published insurer FAQ");

const CROSSWALK =
  `The published crosswalk at /crosswalk maps named AI-governance and adjacent frameworks to a shared control set so one control can evidence several obligations. It is a map, not a signed score and not a certificate. Determination stays with authorities.

East-West flagship: /east-west. Machine-readable v1: /crosswalk/east-west-v1.json. Challenge a mapping: /challenge.

The live list is on that page. We do not treat a crosswalk row as a GSPC measurement. Signed article-level output, when it exists, is a separate artefact you can verify.` +
  cite("/crosswalk");

const TOOLS =
  `Published tooling and MCP servers are listed at /tools. You can connect and run them inside Council OS. A tool is not a certificate: running one does not certify a system and does not fill an empty board cell.` +
  cite("the Tools pane");

const RESULTS =
  `The Results pane (/benchmarks) shows measured figures that name a published artefact. Losses stay on the page. Empty or unearned rows stay empty - we do not invent a score to complete a table.

Live board counts: GET /api/gspc.` +
  cite("the Results pane");

const WORKBENCH =
  `The workbench (/workbench) is an analyst desk: skills and signed artefacts. Council review is a designed layer (DR-0007), not a live certification pipeline. It does not certify, accredit, or clear a system.` +
  cite("/workbench");

const FOUR_LENSES =
  `The instrument (/instrument) is one surface with four lenses - governance, safety, provenance, continuity. Each lens asks a published question and points at a named artefact. Battle votes stay out of the verdict path: they are never merged into the benchmark.

Counts and intervals live on the page and on GET /api/gspc; this answer does not type them.` +
  cite("/instrument");

const SYSTEM_CARD =
  `A system card is a signed measurement record you can verify offline: recompute the hash and check Ed25519 against did:web:csoai.org. Demo or synthetic rows on /system-card say so when they are not a live subject measurement.

It attests what was run on a stated date. It is not a conformity mark. Verify at /gspc-verify.` +
  cite("/system-card and /gspc-verify");

const FLEET =
  `The published fleet manifest at /mcp-fleet lists servers by hive. It is a catalogue, not a marketplace: listing a server does not sell access, does not certify the server, and does not put a grade up for sale.

Live registry, when the gateway answers, is GET /api/mcp.` +
  cite("/mcp-fleet");

const REG_FEED =
  `GET /api/regulation is a dated deadline feed. Every entry cites its legal basis. Corrections are appended, never silently edited. The feed is statements of law as published, not a measurement score.

Open /feed or GET /api/regulation for what moved and the verified_as_of stamp.` +
  cite("GET /api/regulation");

const METHOD =
  `A figure is graded by deterministic predicates against gold labels - exact match, refusal, forbidden action, manifest validity, signature algorithm. No model judges another model. Nothing is quoted below usable n >= 30. Unparsed answers are counted incorrect. Hedges (n, interval, INCOMPLETE) stay on the surface.

See /methodology.` +
  cite("/methodology");

const HIVE =
  `The hive (/hive) publishes named frameworks and groups. What is not named stays unnamed - we do not invent a framework to complete a list. A hive page is a map, not a signed GSPC score.` +
  cite("/hive");

const FINANCE =
  `Finance teams start the same way as anyone else: send the system, get a signed card, verify it yourself. The card is evidence for governance files, not a certificate that a control framework is satisfied.

Do not treat an empty cell as a pass. Live counts: GET /api/gspc.` +
  cite("the published measurement FAQ");

/** Seeded Council OS asks and the published FAQ doors they open. */
export function lobbyGround(q: string): string | null {
  const t = q.toLowerCase();

  if (
    /want .{0,80}measured against the rules/i.test(q) ||
    /getting measured actually run/i.test(q) ||
    /what does the assessment actually (run|measure)/i.test(q) ||
    (/assessment/.test(t) && /actually measur/.test(t)) ||
    (/enterprise team/.test(t) && /measur/.test(t)) ||
    /how does a (company|team) get measured/.test(t) ||
    (/what do i send/.test(t) && /measur/.test(t)) ||
    t.includes("get measured") ||
    /how (do (i|we|you)|does .{0,40}) get .{0,20}measur/.test(t)
  ) {
    return GET_MEASURED;
  }

  if (
    (
      /verify a (measurement |signed )?(card|report)/i.test(q) ||
      /recompute its hash/i.test(q) ||
      /ed25519 signature/i.test(q) ||
      (/how do i verify/.test(t) && /signed|report|card|hash/.test(t)) ||
      (/verify/.test(t) && /signed (report|card)/.test(t))
    ) &&
    !/how many|board/.test(t)
  ) {
    return VERIFY_CARD;
  }

  if (t.includes("watchdog") && /incident|report/.test(t)) return WATCHDOG;

  if (/human baselines|reported third-party/.test(t)) return HUMAN_BASELINES;

  if (
    /honesty page/.test(t) ||
    /corrections ledger|corrections, refusals/.test(t) ||
    /who checks the council/.test(t) ||
    /council.s own numbers/.test(t) ||
    /what the council got wrong/.test(t)
  ) {
    return HONESTY;
  }

  if ((t.includes("regulator") || t.includes("regulators")) && /gspc|grade|crosswalk|frozen|what (should|does|is published)/.test(t)) {
    return REGULATOR;
  }

  if (t.includes("insurer") || /underwrit/.test(t)) return INSURER;

  if (/crosswalk/.test(t) || /frameworks are crosswalked/.test(t)) return CROSSWALK;

  if (/tooling is published|treating a tool as a certificate/.test(t)) return TOOLS;

  if (/measured results name a published artefact/.test(t) || /rows are empty or a loss/.test(t)) {
    return RESULTS;
  }

  if (/workbench/.test(t) && /run today|not certify|certif/.test(t)) return WORKBENCH;

  if (/four lenses/.test(t)) return FOUR_LENSES;

  if (/system card/.test(t) && /attest|verify|offline/.test(t)) return SYSTEM_CARD;

  if (/fleet manifest/.test(t) || (/marketplace/.test(t) && /fleet/.test(t))) return FLEET;

  if (/regulation feed|reg feed/.test(t)) return REG_FEED;

  if (/gold labels/.test(t) && /minimum n|figure graded|verdict/.test(t)) return METHOD;

  if (/published in the hive/.test(t) || (t.includes("hive") && /frameworks and groups/.test(t))) {
    return HIVE;
  }

  if (t.includes("finance") && /governance|signed evidence/.test(t)) return FINANCE;

  return null;
}
