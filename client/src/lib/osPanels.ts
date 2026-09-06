/**
 * osPanels — derive the Council OS panel figures from the endpoints that own them.
 *
 * THE RULE THIS ENFORCES: every visible number on the OS names its endpoint. Not "26 banks"
 * but "26 — GET /api/bank-complete → total_banks". A figure whose source cannot be named is a
 * figure nobody can re-check, and this estate has already shipped several.
 *
 * WHY A DERIVE LAYER RATHER THAN FETCHING IN THE COMPONENT: these are the numbers most likely
 * to be typed in by hand next time someone edits a pane. Putting the derivation here, with
 * tests that pin each figure to its endpoint's own field, makes typing one a test failure.
 *
 * NOTHING HERE INVENTS A VALUE. Every function returns `null` when the endpoint did not
 * answer or did not carry the field — never 0, never a placeholder. Absent is not zero, and
 * on a measurement surface the difference is the whole product.
 *
 * Measured 2026-09-06, so the tests have real shapes to hold:
 *   GET /api/xrpl              n 16, assets[] 16
 *   GET /api/swift             n 26 = n_live 3 + n_committed 9 + n_discovered 14, n_measured 0
 *   GET /api/bank-complete     total_banks 26, total_records 4000, status READER
 *   GET /.well-known/agent-card.json   skills[] 7
 *   GET /api/rwa/evidence?asset=…      402 — a metered door, not a free reader
 */

/** A figure that knows where it came from. `value: null` means the source did not say. */
export interface SourcedNumber {
  value: number | null;
  endpoint: string;
  field: string;
  /** Why the value is null, when it is. Rendered instead of a number. */
  unavailable?: string;
}

const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

const sourced = (
  doc: unknown,
  endpoint: string,
  field: string,
  pick: (d: Record<string, unknown>) => unknown,
): SourcedNumber => {
  if (!doc || typeof doc !== "object") {
    return { value: null, endpoint, field, unavailable: `${endpoint} did not answer` };
  }
  const value = num(pick(doc as Record<string, unknown>));
  return value === null
    ? { value: null, endpoint, field, unavailable: `${endpoint} answered without ${field}` }
    : { value, endpoint, field };
};

/** Finance: the free reader is /api/xrpl. /api/rwa/evidence is metered and answers 402. */
export function financePanel(xrpl: unknown) {
  return {
    assets: sourced(xrpl, "GET /api/xrpl", "n", (d) => d.n),
    assetsListed: sourced(xrpl, "GET /api/xrpl", "assets[].length", (d) =>
      Array.isArray(d.assets) ? d.assets.length : undefined,
    ),
    evidenceDoor: {
      endpoint: "GET /api/rwa/evidence?asset=…",
      state: "METERED",
      note: "Per-asset evidence is a paid door: it answers 402 with the terms. Pay-as-you-go x402 at the 402.",
    },
  };
}

/**
 * SWIFT ladder. The rungs must sum to the total — if they do not, the endpoint is
 * inconsistent and the panel says so rather than rendering a ladder that does not add up.
 */
export function swiftLadder(swift: unknown) {
  const e = "GET /api/swift";
  const total = sourced(swift, e, "n", (d) => d.n);
  const rungs = {
    measured: sourced(swift, e, "n_measured", (d) => d.n_measured),
    live: sourced(swift, e, "n_live", (d) => d.n_live),
    committed: sourced(swift, e, "n_committed", (d) => d.n_committed),
    discovered: sourced(swift, e, "n_discovered", (d) => d.n_discovered),
  };
  const parts = [rungs.live.value, rungs.committed.value, rungs.discovered.value];
  const sum = parts.every((p) => p !== null) ? (parts as number[]).reduce((a, b) => a + b, 0) : null;
  return {
    total,
    rungs,
    /** live + committed + discovered. `measured` is the top rung and is counted separately. */
    rungSum: sum,
    consistent: sum !== null && total.value !== null ? sum === total.value : null,
    legend:
      "discovered → committed → live → measured. Only MEASURED means a run against a frozen bank; " +
      "the rungs below it record what was found, said, or shipped — never a grade.",
  };
}

/** Banks: two different counts that must never be conflated. */
export function banksPanel(bank: unknown) {
  const e = "GET /api/bank-complete";
  return {
    banks: sourced(bank, e, "total_banks", (d) => d.total_banks),
    banksListed: sourced(bank, e, "banks[].length", (d) =>
      Array.isArray(d.banks) ? d.banks.length : undefined,
    ),
    records: sourced(bank, e, "total_records", (d) => d.total_records),
    status: typeof (bank as Record<string, unknown>)?.status === "string"
      ? String((bank as Record<string, unknown>).status)
      : null,
    note: "total_records counts rows read, total_banks counts institutions. They are different things.",
  };
}

/** A2A: the skills count comes from the SERVED card, not from the route that points at it. */
export function a2aPanel(agentCard: unknown, a2aRoute: unknown) {
  const cardEndpoint = "GET /.well-known/agent-card.json";
  const skills = sourced(agentCard, cardEndpoint, "skills[].length", (d) =>
    Array.isArray(d.skills) ? d.skills.length : undefined,
  );
  const cardVersion =
    agentCard && typeof agentCard === "object"
      ? ((agentCard as Record<string, unknown>).protocolVersion as string | undefined) ?? null
      : null;
  const routeVersion =
    a2aRoute && typeof a2aRoute === "object"
      ? ((a2aRoute as Record<string, unknown>).protocolVersion as string | undefined) ?? null
      : null;
  return {
    skills,
    cardVersion,
    routeVersion,
    /** True when the two surfaces disagree about the protocol version — including by silence. */
    versionMismatch: cardVersion !== routeVersion,
    mismatchNote:
      cardVersion === null && routeVersion !== null
        ? `GET /api/a2a reports protocolVersion ${routeVersion}; the served card declares none. A consumer reads the card.`
        : null,
  };
}
