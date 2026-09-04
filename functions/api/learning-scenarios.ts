// /api/learning-scenarios — deterministic, read-only material for the 22-axis UI.
//
// This endpoint does not generate findings. It joins three already-published sources:
//   * /api/gspc                         — board measurement context;
//   * /signed/findings_index.json       — locally verified published cards and crosswalk pointers;
//   * /api/regulation                   — regulation/deadline context.
//
// The layers remain distinct. A board measurement is not silently called published evidence,
// a published measurement is not silently called independent admission or a regulatory determination, and regulation
// context is not a finding. No write, training, repair, or board-promotion path exists here.

type JsonObject = Record<string, unknown>;

const BOARD_SCHEMA = "csoai.gspc-axes/0.5";
const FINDINGS_SCHEMA = "csoai.regulation-findings-index/0.2";
const REGULATION_SCHEMA = "csoai.regulation-deadlines/0.1";
const OUTPUT_SCHEMA = "csoai.learning-scenarios/0.1";
const CARD_ID = /^[a-f0-9]{64}$/;
const AXIS_ID = /^[a-z0-9][a-z0-9-]*$/;
const BOARD_STATUSES = new Set([
  "MEASURED",
  "UNMEASURED",
  "DRAFT",
  "SPEC",
  "PLANNED",
]);

// These are the two irregular identities already published by the current board/card
// crosswalk. Everything else is matched only by exact id or exact `gspc-${axis}`. Unknown
// names remain UNMAPPED; no fuzzy/semantic join is allowed to manufacture regulation context.
const DECLARED_CROSSWALK_ALIASES: Record<string, string> = {
  jail: "jail-escape-detection",
  swarm: "swarm-candidates",
};

const HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "access-control-allow-origin": "*",
  "cache-control": "public, max-age=300",
};

const isObject = (value: unknown): value is JsonObject =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const nonEmpty = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;
const finite = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

async function fetchObject(
  request: Request,
  path: string,
): Promise<JsonObject | null> {
  try {
    const response = await fetch(new URL(path, request.url), {
      method: "GET",
      headers: { accept: "application/json" },
    });
    if (!response.ok) return null;
    const value: unknown = await response.json();
    return isObject(value) ? value : null;
  } catch {
    return null;
  }
}

type BoardAxis = JsonObject & {
  axis: string;
  family: "gspc" | "financial";
  kind: "model-comparison" | "deterministic-facts" | "declared-slot";
  status: string;
  bench: string;
  task: string;
  n: number;
};

function validBoardAxis(value: unknown): value is BoardAxis {
  if (!isObject(value)) return false;
  if (!nonEmpty(value.axis) || !AXIS_ID.test(value.axis)) return false;
  if (value.family !== "gspc" && value.family !== "financial") return false;
  if (
    value.kind !== "model-comparison" &&
    value.kind !== "deterministic-facts" &&
    value.kind !== "declared-slot"
  )
    return false;
  if (!nonEmpty(value.status) || !BOARD_STATUSES.has(value.status))
    return false;
  if (!nonEmpty(value.bench) || !nonEmpty(value.task)) return false;
  if (!Number.isInteger(value.n) || (value.n as number) < 0) return false;
  if (
    value.accuracy !== undefined &&
    (!finite(value.accuracy) || value.accuracy < 0 || value.accuracy > 1)
  )
    return false;
  if (
    value.separation !== undefined &&
    !["SEPARATED", "TIE", "UNTESTED"].includes(String(value.separation))
  )
    return false;
  return true;
}

function boardAxes(board: JsonObject): BoardAxis[] | null {
  if (
    board.schema !== BOARD_SCHEMA ||
    !Array.isArray(board.axes) ||
    board.axes.length !== 22
  )
    return null;
  if (!board.axes.every(validBoardAxis)) return null;
  const axes = board.axes as BoardAxis[];
  if (new Set(axes.map((axis) => axis.axis)).size !== axes.length) return null;
  if (!isObject(board.totals)) return null;
  const measured = axes.filter((axis) => axis.status === "MEASURED").length;
  if (
    board.totals.axes !== axes.length ||
    board.totals.measured_axes !== measured
  )
    return null;
  return axes;
}

type RegulationPointer = {
  regulator: string;
  regulator_name: string;
  relation: "relevant-to";
  obligation: string;
  statutory_maximum: string | null;
  fine_cited_to: string | null;
  fine_applies_to: string | null;
  tier: string;
  no_fine_asserted_owed: true;
};

function validPointer(value: unknown): value is RegulationPointer {
  if (!isObject(value)) return false;
  return (
    nonEmpty(value.regulator) &&
    nonEmpty(value.regulator_name) &&
    value.relation === "relevant-to" &&
    nonEmpty(value.obligation) &&
    (value.statutory_maximum === null || nonEmpty(value.statutory_maximum)) &&
    (value.fine_cited_to === null || nonEmpty(value.fine_cited_to)) &&
    (value.fine_applies_to === null || nonEmpty(value.fine_applies_to)) &&
    nonEmpty(value.tier) &&
    value.no_fine_asserted_owed === true
  );
}

type CrosswalkAxis = JsonObject & {
  axis: string;
  pointers: RegulationPointer[];
};

type VerifiedPublishedFinding = JsonObject & {
  model: string;
  axis: string;
  measurement: JsonObject & {
    accuracy: number;
    status: "DISCOVERED";
    card: string;
    card_url: string;
    signed: true;
    signature_verified: true;
    admitted: false;
    evidence_state: "PUBLISHED_VERIFIED";
  };
  crosswalk: JsonObject & { pointers: RegulationPointer[] };
};

function cardUrlMatches(card: string, value: unknown): boolean {
  if (value === `/signed/cards/${card}.json`) return true;
  if (typeof value !== "string") return false;
  const mill = value.match(
    /^\/interop\/mill-cards-signed\/signed-[a-z0-9-]+-([a-f0-9]{12})\.json$/,
  );
  return mill?.[1] === card.slice(0, 12);
}

function verifiedPublishedFinding(
  value: unknown,
): value is VerifiedPublishedFinding {
  if (
    !isObject(value) ||
    !nonEmpty(value.model) ||
    !nonEmpty(value.axis) ||
    !AXIS_ID.test(value.axis)
  )
    return false;
  if (
    !isObject(value.measurement) ||
    !isObject(value.crosswalk) ||
    !Array.isArray(value.crosswalk.pointers)
  )
    return false;
  const measurement = value.measurement;
  const card = typeof measurement.card === "string" ? measurement.card : "";
  return (
    finite(measurement.accuracy) &&
    measurement.accuracy >= 0 &&
    measurement.accuracy <= 1 &&
    measurement.status === "DISCOVERED" &&
    CARD_ID.test(card) &&
    cardUrlMatches(card, measurement.card_url) &&
    measurement.signed === true &&
    measurement.signature_verified === true &&
    measurement.admitted === false &&
    measurement.evidence_state === "PUBLISHED_VERIFIED" &&
    value.crosswalk.pointers.every(validPointer)
  );
}

function findingsParts(
  index: JsonObject,
): { axes: CrosswalkAxis[]; findings: VerifiedPublishedFinding[] } | null {
  if (
    index.schema !== FINDINGS_SCHEMA ||
    !Array.isArray(index.axes) ||
    !Array.isArray(index.findings)
  )
    return null;
  if (
    !isObject(index.counts) ||
    index.counts.findings !== index.findings.length
  )
    return null;
  const axes: CrosswalkAxis[] = [];
  const ids = new Set<string>();
  for (const value of index.axes) {
    if (
      !isObject(value) ||
      !nonEmpty(value.axis) ||
      !AXIS_ID.test(value.axis) ||
      ids.has(value.axis)
    )
      return null;
    if (!Array.isArray(value.pointers) || !value.pointers.every(validPointer))
      return null;
    ids.add(value.axis);
    axes.push(value as CrosswalkAxis);
  }
  if (!index.findings.every(verifiedPublishedFinding)) return null;
  return {
    axes,
    findings: index.findings as VerifiedPublishedFinding[],
  };
}

type Deadline = {
  date: string;
  instrument: string;
  what: string;
  basis: string;
  status: string;
  penalty_exposure: string;
};

function validDeadline(value: unknown): value is Deadline {
  if (!isObject(value)) return false;
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(String(value.date ?? "")) &&
    nonEmpty(value.instrument) &&
    nonEmpty(value.what) &&
    nonEmpty(value.basis) &&
    nonEmpty(value.status) &&
    nonEmpty(value.penalty_exposure)
  );
}

function regulationDeadlines(regulation: JsonObject): Deadline[] | null {
  if (
    regulation.schema !== REGULATION_SCHEMA ||
    !/^\d{4}-\d{2}-\d{2}$/.test(String(regulation.verified_as_of ?? "")) ||
    !Array.isArray(regulation.deadlines) ||
    !regulation.deadlines.every(validDeadline)
  )
    return null;
  return regulation.deadlines as Deadline[];
}

function pointerView(pointer: RegulationPointer) {
  return {
    regulator: pointer.regulator,
    regulator_name: pointer.regulator_name,
    relation: "relevant-to" as const,
    obligation: pointer.obligation,
    statutory_maximum: pointer.statutory_maximum,
    fine_cited_to: pointer.fine_cited_to,
    fine_applies_to: pointer.fine_applies_to,
    tier: pointer.tier,
    no_fine_asserted_owed: true,
  };
}

function crosswalkFor(axis: string, byId: Map<string, CrosswalkAxis>) {
  if (byId.has(axis)) return { sourceAxis: axis, match: "EXACT" as const };
  const prefixed = `gspc-${axis}`;
  if (byId.has(prefixed))
    return { sourceAxis: prefixed, match: "PREFIXED_EXACT" as const };
  const declared = DECLARED_CROSSWALK_ALIASES[axis];
  if (declared && byId.has(declared))
    return { sourceAxis: declared, match: "DECLARED_ALIAS" as const };
  return null;
}

function boardContext(axis: BoardAxis) {
  const optional = [
    "n_note",
    "n_unit",
    "accuracy",
    "accuracy_is",
    "leader",
    "separation",
    "separation_p",
    "separation_basis",
    "interval",
    "fleet_mean",
    "fleet",
    "mean_harm",
    "cvar05_harm",
    "macro_f1",
    "unparsed_rate",
    "dataset",
    "dataset_url",
    "dataset_url_state",
    "evidence_url",
    "coverage",
    "coverage_note",
    "carrier",
    "note",
    "public_leader_state",
  ];
  const measured: JsonObject = {
    classification: "BOARD_MEASUREMENT_CONTEXT",
    source: "/api/gspc",
    status: axis.status,
    family: axis.family,
    kind: axis.kind,
    bench: axis.bench,
    task: axis.task,
    n: axis.n,
  };
  for (const key of optional)
    if (axis[key] !== undefined) measured[key] = axis[key];
  return measured;
}

function unavailable(errors: string[]) {
  return new Response(
    JSON.stringify(
      {
        schema: OUTPUT_SCHEMA,
        state: "UNCHECKABLE",
        errors,
        canonical_axis_count: 22,
        scenario_count: 0,
        scenarios: [],
        writes_board: false,
        model_training: false,
        automatic_fixing: false,
      },
      null,
      2,
    ),
    { status: 503, headers: HEADERS },
  );
}

export async function onRequestGet({ request }: { request: Request }) {
  const [board, index, regulation] = await Promise.all([
    fetchObject(request, "/api/gspc"),
    fetchObject(request, "/signed/findings_index.json"),
    fetchObject(request, "/api/regulation"),
  ]);

  const axes = board ? boardAxes(board) : null;
  const findings = index ? findingsParts(index) : null;
  const deadlines = regulation ? regulationDeadlines(regulation) : null;
  const errors = [
    ...(!axes ? ["GSPC_SOURCE_UNAVAILABLE_OR_INVALID"] : []),
    ...(!findings ? ["FINDINGS_SOURCE_UNAVAILABLE_OR_INVALID"] : []),
    ...(!deadlines ? ["REGULATION_SOURCE_UNAVAILABLE_OR_INVALID"] : []),
  ];
  if (!board || !index || !regulation || !axes || !findings || !deadlines)
    return unavailable(errors);

  const crosswalkById = new Map(findings.axes.map((axis) => [axis.axis, axis]));
  const scenarios = axes.map((axis, indexInBoard) => {
    const link = crosswalkFor(axis.axis, crosswalkById);
    const sourceAxis = link?.sourceAxis ?? null;
    // New mill cards use the board axis id directly; historical cards often use
    // the crosswalk's benchmark-axis id. Both are exact identities. No other
    // spelling is accepted.
    const evidenceAxisIds = new Set([
      axis.axis,
      ...(sourceAxis ? [sourceAxis] : []),
    ]);
    const published = findings.findings.filter((finding) =>
      evidenceAxisIds.has(finding.axis),
    );
    const crosswalk = sourceAxis
      ? (crosswalkById.get(sourceAxis) ?? null)
      : null;
    const pointers = (crosswalk?.pointers ?? [])
      .map(pointerView)
      .sort(
        (a, b) =>
          a.regulator.localeCompare(b.regulator) ||
          a.obligation.localeCompare(b.obligation),
      );
    const publishedEvidence = published
      .map((finding) => ({
        classification: "VERIFIED_PUBLISHED_EVIDENCE" as const,
        state: "PUBLISHED_VERIFIED" as const,
        source: "/signed/findings_index.json",
        subject: { kind: "model", id: finding.model, digest: null },
        source_axis: finding.axis,
        accuracy: finding.measurement.accuracy,
        measured_on:
          typeof finding.measurement.measured_on === "string"
            ? finding.measurement.measured_on
            : null,
        card: finding.measurement.card,
        card_url: finding.measurement.card_url,
        signature_verified: true,
        independently_admitted: false,
      }))
      .sort((a, b) => a.card.localeCompare(b.card));
    const candidateFindings = published
      .filter((finding) => finding.crosswalk.pointers.length > 0)
      .map((finding) => ({
        classification: "CANDIDATE_FINDING" as const,
        state: "CANDIDATE_FINDING" as const,
        source: "/signed/findings_index.json",
        derived_from_verified_card: finding.measurement.card,
        subject: { kind: "model", id: finding.model, digest: null },
        source_axis: finding.axis,
        regulation_pointers: finding.crosswalk.pointers
          .map(pointerView)
          .sort(
            (a, b) =>
              a.regulator.localeCompare(b.regulator) ||
              a.obligation.localeCompare(b.obligation),
          ),
        legal_review_required: true,
        writes_board: false,
        note: "Relevant-to pointers only; not a compliance, breach, safety, approval, or fine determination.",
      }))
      .sort((a, b) =>
        a.derived_from_verified_card.localeCompare(
          b.derived_from_verified_card,
        ),
      );

    return {
      scenario_id: `gspc-axis:${axis.axis}`,
      ordinal: indexInBoard + 1,
      axis: axis.axis,
      board_measurement: boardContext(axis),
      evidence: {
        published_state: publishedEvidence.length
          ? "PUBLISHED_VERIFIED"
          : "NONE_PUBLISHED",
        independently_admitted: false,
        published_measurements: publishedEvidence,
        candidate_state: candidateFindings.length
          ? "CANDIDATE_FINDING"
          : "NO_CANDIDATE_FINDING",
        candidate_findings: candidateFindings,
      },
      regulation_context: {
        classification: "REGULATION_CONTEXT",
        state: crosswalk ? "CROSSWALK_POINTERS" : "UNMAPPED",
        source: "/signed/findings_index.json",
        source_axis: sourceAxis,
        match: link?.match ?? null,
        pointers,
        note: crosswalk
          ? "Published relevant-to pointers only; legal effect requires independent legal review."
          : "No exact published crosswalk identity was available; no mapping was guessed.",
      },
      controls: {
        read_only: true,
        writes_board: false,
        model_training: false,
        automatic_fixing: false,
        automatic_promotion: false,
      },
    };
  });

  const requestedAxis =
    new URL(request.url).searchParams.get("axis")?.trim() || null;
  const selected = requestedAxis
    ? scenarios.filter((scenario) => scenario.axis === requestedAxis)
    : scenarios;
  if (requestedAxis && selected.length === 0) {
    return new Response(
      JSON.stringify(
        {
          schema: OUTPUT_SCHEMA,
          error: "unknown axis",
          axis: requestedAxis,
          known_axes: axes.map((axis) => axis.axis),
          scenarios: [],
        },
        null,
        2,
      ),
      { status: 404, headers: HEADERS },
    );
  }

  const regulationContext = deadlines
    .map((deadline) => ({
      classification: "REGULATION_CONTEXT" as const,
      source: "/api/regulation",
      ...deadline,
    }))
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        a.instrument.localeCompare(b.instrument) ||
        a.what.localeCompare(b.what),
    );
  const publishedCount = selected.reduce(
    (sum, scenario) => sum + scenario.evidence.published_measurements.length,
    0,
  );
  const candidateCount = selected.reduce(
    (sum, scenario) => sum + scenario.evidence.candidate_findings.length,
    0,
  );

  return new Response(
    JSON.stringify(
      {
        schema: OUTPUT_SCHEMA,
        state: "READY",
        purpose:
          "Deterministic human-guided inspection and replay planning for the 22-axis GSPC UI.",
        classification_enum: [
          "BOARD_MEASUREMENT_CONTEXT",
          "VERIFIED_PUBLISHED_EVIDENCE",
          "CANDIDATE_FINDING",
          "REGULATION_CONTEXT",
        ],
        source_snapshot: {
          board: {
            url: "/api/gspc",
            schema: board.schema,
            axes: axes.length,
            measured_on: board.measured_on ?? null,
          },
          findings: {
            url: "/signed/findings_index.json",
            schema: index.schema,
            as_of: index.as_of ?? null,
            verified_published_findings: findings.findings.length,
            independently_admitted_findings: 0,
            legacy_unadjudicated_records: isObject(index.counts)
              ? (index.counts.legacy_unadjudicated_records ?? null)
              : null,
          },
          regulation: {
            url: "/api/regulation",
            schema: regulation.schema,
            verified_as_of: regulation.verified_as_of,
            deadlines: deadlines.length,
          },
        },
        policy: {
          read_only: true,
          writes_board: false,
          model_training: false,
          automatic_fixing: false,
          automatic_promotion: false,
          candidate_submission_endpoint: "/api/evidence-intake",
          candidate_submission_requires_explicit_consent: true,
          note: "This endpoint never submits a candidate. Published-card verification is not independent admission. Evidence intake remains a separate authenticated, explicit-consent POST and never auto-promotes to GSPC.",
        },
        canonical_axis_count: axes.length,
        scenario_count: selected.length,
        counts: {
          verified_published_measurements: publishedCount,
          independently_admitted_measurements: 0,
          candidate_findings: candidateCount,
          regulation_deadlines: regulationContext.length,
        },
        regulation_context: regulationContext,
        scenarios: selected,
      },
      null,
      2,
    ),
    { status: 200, headers: HEADERS },
  );
}
