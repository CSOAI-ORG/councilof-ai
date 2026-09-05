// functions/api/regulator-findings.ts — read-only regulatory crosswalk over exact evidence.
//
// A deployment description is context, not subject identity. This endpoint must never take a
// fleet leader from GET /api/gspc and relabel that score as the caller's deployment. Scores are
// exposed only when the caller supplies an exact `subject` (published model id), an exact signed
// `card` id, or both, and that selector resolves in /signed/findings_index.json. Even then the
// regulatory mapping is only a CANDIDATE_FINDING: a signed axis measurement is not an EU AI Act
// determination and the legacy cards do not bind a deployment-artifact digest.
//
// GET /api/regulator-findings?deployment=<description>[&subject=<exact-model-id>][&card=<sha256>]
//                                      [&sector=insurance|bond|cobol][&by=article]

const AXIS_TO_OBLIGATION: Record<string, { obligation: string; tier: string }> =
  {
    governance: {
      obligation: "Article 5 prohibited practices",
      tier: "prohibited_practices",
    },
    safety: {
      obligation: "Article 5 + Annex III high-risk",
      tier: "prohibited_practices",
    },
    provenance: {
      obligation: "Article 50 transparency + GPAI",
      tier: "most_obligations_incl_art50_and_gpai",
    },
    continuity: {
      obligation: "Article 14 risk management",
      tier: "most_obligations_incl_art50_and_gpai",
    },
    conformance: {
      obligation: "Article 13 conformity",
      tier: "most_obligations_incl_art50_and_gpai",
    },
    openness: {
      obligation: "Article 53 GPAI transparency",
      tier: "most_obligations_incl_art50_and_gpai",
    },
    "jailbreak-resistance": {
      obligation: "Article 5 prohibited practices",
      tier: "prohibited_practices",
    },
    care: {
      obligation: "Article 5 + proportionality",
      tier: "most_obligations_incl_art50_and_gpai",
    },
    affect: {
      obligation: "Article 5 emotion-recognition",
      tier: "prohibited_practices",
    },
    det: {
      obligation: "Article 5 social-scoring",
      tier: "prohibited_practices",
    },
    mcp: {
      obligation: "Article 50 AI systems output",
      tier: "most_obligations_incl_art50_and_gpai",
    },
    xsr: {
      obligation: "Article 5 biometric-categorisation",
      tier: "prohibited_practices",
    },
    agi: {
      obligation: "Article 5 + systemic-risk",
      tier: "most_obligations_incl_art50_and_gpai",
    },
  };

const SECTOR_FRAMEWORKS: Record<string, string[]> = {
  insurance: [
    "EU AI Act Art 5 + high-risk",
    "Solvency II (AI-risk)",
    "EIOPA AI principles",
    "FCA AI guidance",
  ],
  bond: [
    "EU AI Act high-risk (credit-scoring)",
    "ESMA AI governance",
    "CRA regulation (AI models)",
    "Basel Pillar 3 (model-risk)",
  ],
  cobol: [
    "EU AI Act (where applicable)",
    "Defence AI doctrine",
    "AUKUS interoperability",
    "Ethical AI (weapon-control) prohibition",
  ],
};

const ARTICLE_TO_AXES: Record<
  string,
  { title: string; axes: string[]; tier: string }
> = {
  "Article 4": {
    title: "AI literacy",
    axes: ["governance"],
    tier: "most_obligations_incl_art50_and_gpai",
  },
  "Article 5": {
    title: "Prohibited AI practices",
    axes: ["safety", "affect", "det", "jailbreak-resistance", "art5-safeguard"],
    tier: "prohibited_practices",
  },
  "Article 6": {
    title: "High-risk classification",
    axes: ["governance", "safety", "conformance"],
    tier: "most_obligations_incl_art50_and_gpai",
  },
  "Article 9": {
    title: "Risk management system",
    axes: ["governance", "continuity"],
    tier: "most_obligations_incl_art50_and_gpai",
  },
  "Article 13": {
    title: "Transparency to deployers",
    axes: ["conformance", "provenance"],
    tier: "most_obligations_incl_art50_and_gpai",
  },
  "Article 14": {
    title: "Human oversight",
    axes: ["continuity", "governance"],
    tier: "most_obligations_incl_art50_and_gpai",
  },
  "Article 50": {
    title: "Transparency to end-users",
    axes: ["provenance", "openness"],
    tier: "most_obligations_incl_art50_and_gpai",
  },
  "Article 53": {
    title: "GPAI model obligations",
    axes: ["openness", "provenance"],
    tier: "most_obligations_incl_art50_and_gpai",
  },
  "Article 55": {
    title: "Systemic-risk GPAI",
    axes: ["governance", "safety"],
    tier: "most_obligations_incl_art50_and_gpai",
  },
};

// The signed-card corpus uses card-axis ids, not the living board's display ids. This is an
// explicit crosswalk; never guess by prefixing a string. An unmapped axis stays UNMEASURED.
const CARD_AXES_BY_FINDING_AXIS: Record<string, string[]> = {
  governance: ["gspc-governance"],
  safety: ["gspc-safety"],
  provenance: ["gspc-provenance"],
  continuity: ["gspc-continuity"],
  conformance: ["gspc-conformance"],
  openness: ["gspc-openness"],
  "jailbreak-resistance": ["jail-escape-detection"],
  care: ["care"],
};

type JsonObject = Record<string, unknown>;

type SignedFinding = {
  model: string;
  axis: string;
  measurement: {
    accuracy: number;
    card: string;
    card_url: string;
    signed: true;
    alg?: string;
    pubkey?: string;
    measured_on?: string;
  };
};

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "public, max-age=300",
  "access-control-allow-origin": "*",
};

const CARD_ID = /^[a-f0-9]{64}$/i;
const normaliseCard = (value: string | null | undefined) =>
  (value || "").trim().toLowerCase();
const isJsonObject = (value: unknown): value is JsonObject =>
  value !== null && typeof value === "object" && !Array.isArray(value);

async function fetchJson(
  request: Request,
  path: string,
): Promise<JsonObject | null> {
  try {
    const response = await fetch(new URL(path, request.url), {
      headers: { accept: "application/json" },
    });
    if (!response.ok) return null;
    const value = await response.json();
    return isJsonObject(value) ? value : null;
  } catch {
    return null;
  }
}

function sectorKeys(sector: string): string[] {
  const map: Record<string, string[]> = {
    insurance: ["governance", "safety", "provenance", "continuity", "care"],
    bond: [
      "governance",
      "conformance",
      "provenance",
      "continuity",
      "det",
      "care",
    ],
    cobol: ["governance", "safety", "jailbreak-resistance"],
  };
  return map[sector] || Object.keys(AXIS_TO_OBLIGATION);
}

function isSignedFinding(value: unknown): value is SignedFinding {
  if (!value || typeof value !== "object") return false;
  const finding = value as JsonObject;
  const measurement = finding.measurement;
  if (!isJsonObject(measurement)) return false;
  const card = typeof measurement.card === "string" ? measurement.card : "";
  return (
    typeof finding.model === "string" &&
    finding.model.trim().length > 0 &&
    typeof finding.axis === "string" &&
    finding.axis.trim().length > 0 &&
    typeof measurement.accuracy === "number" &&
    Number.isFinite(measurement.accuracy) &&
    measurement.accuracy >= 0 &&
    measurement.accuracy <= 1 &&
    measurement.signed === true &&
    CARD_ID.test(card) &&
    measurement.card_url === `/signed/cards/${card}.json`
  );
}

function resolveSignedEvidence(
  index: JsonObject | null,
  subjectSelector: string | null,
  cardSelector: string | null,
): SignedFinding[] {
  if (!subjectSelector && !cardSelector) return [];
  if (cardSelector && !CARD_ID.test(cardSelector)) return [];

  const rows = Array.isArray(index?.findings)
    ? index.findings.filter(isSignedFinding)
    : [];
  return rows.filter((row) => {
    // Subject ids are case-sensitive opaque identifiers. Only surrounding whitespace is
    // normalised; a case-insensitive/fuzzy join could bind evidence to a different subject.
    if (subjectSelector && row.model !== subjectSelector.trim()) return false;
    if (
      cardSelector &&
      normaliseCard(row.measurement.card) !== normaliseCard(cardSelector)
    )
      return false;
    return true;
  });
}

function evidenceForAxis(
  rows: SignedFinding[],
  axis: string,
): SignedFinding | null {
  const cardAxes = CARD_AXES_BY_FINDING_AXIS[axis] || [];
  const matches = rows.filter((row) => cardAxes.includes(row.axis));
  // More than one card for the same subject/axis is ambiguous without a revision selector. Do
  // not silently select the newest, highest, or first score.
  return matches.length === 1 ? matches[0] : null;
}

function evidenceRef(row: SignedFinding) {
  return {
    subject: { kind: "model", id: row.model, digest: null },
    axis: row.axis,
    card: row.measurement.card,
    card_url: row.measurement.card_url,
    signed: true,
    alg: row.measurement.alg ?? null,
    pubkey: row.measurement.pubkey ?? null,
    measured_on: row.measurement.measured_on ?? null,
    instrument_version: null,
    limitation:
      "This legacy card does not carry a deployment-artifact digest or instrument version.",
  };
}

function statutoryMaximum(penalties: JsonObject, tier: string): unknown {
  return penalties[tier] ?? "see /api/regulation";
}

function limitations(
  index: JsonObject | null,
  subjectSelector: string | null,
  cardSelector: string | null,
  rows: SignedFinding[],
  hasMappedEvidence: boolean,
): string[] {
  const out = [
    "`deployment` is descriptive context only. It is never used as measurement identity and no fleet-leader score is attached to it.",
    "Regulatory crosswalks are relevant-to pointers, not findings of compliance, breach, safety, approval, or a fine owed.",
    "A signed axis card is one measurement on one bank and date. It is not an article-level conclusion.",
    "Published legacy cards do not bind a deployment-artifact digest or instrument version, so deployment identity remains UNCHECKABLE.",
    "This endpoint is read-only and never writes a GSPC board cell.",
  ];
  if (!index)
    out.unshift(
      "The signed findings index was unavailable, so every measurement remains UNMEASURED.",
    );
  else if (!subjectSelector && !cardSelector) {
    out.unshift(
      "No exact `subject` or `card` selector was supplied, so every measurement remains UNMEASURED.",
    );
  } else if (cardSelector && !CARD_ID.test(cardSelector)) {
    out.unshift(
      "The supplied `card` is not a 64-hex digest, so every measurement remains UNMEASURED.",
    );
  } else if (!rows.length) {
    out.unshift(
      "No signed measurement card exactly matched the supplied selector(s), so every measurement remains UNMEASURED.",
    );
  } else if (!hasMappedEvidence) {
    out.unshift(
      "Signed cards matched the selector, but none resolved to one unambiguous axis used by this crosswalk, so every derived finding remains UNMEASURED.",
    );
  }
  return out;
}

function responseContext(
  deployment: string,
  subjectSelector: string | null,
  cardSelector: string | null,
  index: JsonObject | null,
  rows: SignedFinding[],
  hasMappedEvidence: boolean,
) {
  const subjects = [...new Set(rows.map((row) => row.model))];
  const resolvedSubject = subjects.length === 1 ? subjects[0] : null;
  return {
    deployment,
    selectors: { subject: subjectSelector, card: cardSelector },
    measured_subject: resolvedSubject
      ? { kind: "model", id: resolvedSubject, digest: null }
      : null,
    source_evidence_state: rows.length ? "SIGNED" : "UNMEASURED",
    derived_findings_state: hasMappedEvidence
      ? "CANDIDATE_FINDING"
      : "UNMEASURED",
    deployment_binding_state: rows.length ? "UNCHECKABLE" : "UNMEASURED",
    legal_review_required: true,
    writes_board: false,
    evidence_source: {
      url: "/signed/findings_index.json",
      as_of: typeof index?.as_of === "string" ? index.as_of : null,
      matched_signed_cards: rows.length,
    },
    limitations: limitations(
      index,
      subjectSelector,
      cardSelector,
      rows,
      hasMappedEvidence,
    ),
  };
}

export async function onRequestGet({ request }: { request: Request }) {
  const url = new URL(request.url);
  const deployment =
    url.searchParams.get("deployment")?.trim() || "unspecified AI deployment";
  const subjectSelector = url.searchParams.get("subject")?.trim() || null;
  const cardSelector = url.searchParams.get("card")?.trim() || null;
  const sector = url.searchParams.get("sector");

  const [regulation, index] = await Promise.all([
    fetchJson(request, "/api/regulation"),
    fetchJson(request, "/signed/findings_index.json"),
  ]);
  const penaltyTiers = regulation?.penalty_tiers_eu_ai_act;
  const penalties = isJsonObject(penaltyTiers) ? penaltyTiers : {};
  const signedRows = resolveSignedEvidence(
    index,
    subjectSelector,
    cardSelector,
  );
  const articleMode = url.searchParams.get("by") === "article";
  const keys = sector ? sectorKeys(sector) : Object.keys(AXIS_TO_OBLIGATION);
  const requestedAxes = articleMode
    ? [
        ...new Set(
          Object.values(ARTICLE_TO_AXES).flatMap(
            (definition) => definition.axes,
          ),
        ),
      ]
    : keys;
  const hasMappedEvidence = requestedAxes.some(
    (axis) => evidenceForAxis(signedRows, axis) !== null,
  );
  const context = responseContext(
    deployment,
    subjectSelector,
    cardSelector,
    index,
    signedRows,
    hasMappedEvidence,
  );

  const findings = keys.map((axis) => {
    const { obligation, tier } = AXIS_TO_OBLIGATION[axis];
    const evidence = evidenceForAxis(signedRows, axis);
    const hasEvidence = evidence !== null;
    return {
      axis,
      obligation,
      measured: evidence?.measurement.accuracy ?? null,
      n: null,
      grade: hasEvidence ? "CANDIDATE_FINDING" : "UNMEASURED",
      measurement_state: hasEvidence ? "SIGNED" : "UNMEASURED",
      finding_state: hasEvidence ? "CANDIDATE_FINDING" : "UNMEASURED",
      note: hasEvidence
        ? "Exact-subject signed axis evidence exists. The obligation mapping is relevant-to only and requires independent replay plus legal review."
        : "No single signed card for the exact selected subject and mapped axis — not a ranking or regulatory conclusion.",
      evidence_ref: evidence ? evidenceRef(evidence) : null,
      penalty_exposure: statutoryMaximum(penalties, tier),
      penalty_is_statutory_maximum: true,
      no_fine_asserted_owed: true,
      writes_board: false,
    };
  });

  if (articleMode) {
    const articles = Object.entries(ARTICLE_TO_AXES).map(
      ([article, definition]) => {
        const axisEvidence = Object.fromEntries(
          definition.axes.map((axis) => {
            const evidence = evidenceForAxis(signedRows, axis);
            return [
              axis,
              evidence
                ? {
                    measurement_state: "SIGNED",
                    measured: evidence.measurement.accuracy,
                    evidence_ref: evidenceRef(evidence),
                  }
                : {
                    measurement_state: "UNMEASURED",
                    measured: null,
                    evidence_ref: null,
                  },
            ];
          }),
        );
        const hasAxisEvidence = Object.values(axisEvidence).some(
          (value) => value.measurement_state === "SIGNED",
        );
        return {
          article,
          title: definition.title,
          axes: definition.axes,
          axis_evidence: axisEvidence,
          worst_measured: null,
          aggregation_state: "UNMEASURED",
          grade: hasAxisEvidence ? "CANDIDATE_FINDING" : "UNMEASURED",
          finding_state: hasAxisEvidence ? "CANDIDATE_FINDING" : "UNMEASURED",
          note: hasAxisEvidence
            ? "Signed evidence exists for one or more mapped axes, but no signed article-level procedure converts those scores into an EU AI Act conclusion."
            : "No signed evidence for the exact selected subject on the mapped axes; the article remains UNMEASURED.",
          penalty_exposure: statutoryMaximum(penalties, definition.tier),
          penalty_is_statutory_maximum: true,
          no_fine_asserted_owed: true,
          legal_review_required: true,
          writes_board: false,
        };
      },
    );

    return new Response(
      JSON.stringify(
        {
          schema: "csoai.white-label-article-findings/0.2",
          ts: new Date().toISOString(),
          ...context,
          note: "Article mappings are candidate pointers only. Axis cards never become article-level compliance findings by aggregation.",
          articles,
          penalty_tiers: penalties,
          verify_path: "/gspc-verify",
        },
        null,
        2,
      ),
      { status: 200, headers: JSON_HEADERS },
    );
  }

  return new Response(
    JSON.stringify(
      {
        schema: "csoai.white-label-regulator-findings/0.2",
        ts: new Date().toISOString(),
        ...context,
        sector: sector ? (SECTOR_FRAMEWORKS[sector] ?? null) : null,
        note: "Exact signed axis evidence may support a candidate regulatory crosswalk. Measurement, not certification; no exact card match means UNMEASURED.",
        findings,
        penalty_tiers: penalties,
        verify_path: "/gspc-verify",
      },
      null,
      2,
    ),
    { status: 200, headers: JSON_HEADERS },
  );
}
