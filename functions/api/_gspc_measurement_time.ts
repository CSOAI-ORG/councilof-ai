import type { AxisScore } from "./_gspc_types";

export type MeasurementTime =
  | {
      state: "EXACT";
      precision: "instant";
      observed_at: string;
      source: string;
      source_field: string;
      note?: string;
    }
  | {
      state: "DAY";
      precision: "day";
      observed_on: string;
      source: string;
      source_field: string;
      note?: string;
    }
  | {
      state: "NOT_AFTER";
      precision: "instant-upper-bound";
      not_after: string;
      source: string;
      source_field: string;
      note: string;
    }
  | {
      state: "UNCHECKABLE";
      precision: "unknown";
      source: string;
      source_field: string;
      note: string;
    };

const BOARD_V2_MEASURED_ON = "2026-08-12";
const JAIL_GOLD_RUN = "2026-08-18T03:22:16Z";
const SWARM_CARD_CREATED = "2026-08-19T09:24:39.162060+00:00";

export type TimedAxis<T extends AxisScore = AxisScore> = T & { measurement_time: MeasurementTime };

export function withMeasurementTime<T extends AxisScore>(axis: T): TimedAxis<T> {
  if (typeof axis.facts_as_of === "string" && axis.facts_as_of) {
    return {
      ...axis,
      measurement_time: {
        state: "EXACT",
        precision: "instant",
        observed_at: axis.facts_as_of,
        source: axis.evidence_url || "/api/gspc producer state",
        source_field: "facts_as_of",
        note: "Exact producer/run as_of. Serve, build and deploy time do not refresh it.",
      },
    };
  }

  if (axis.axis === "jail") {
    return {
      ...axis,
      measurement_time: {
        state: "EXACT",
        precision: "instant",
        observed_at: JAIL_GOLD_RUN,
        source: "/signed/board_living.json",
        source_field: "updated / gold_run",
        note: "Gold-run timestamp carried by the published board record; later separation analysis does not refresh the measurement.",
      },
    };
  }

  if (axis.axis === "swarm") {
    return {
      ...axis,
      measurement_time: {
        state: "NOT_AFTER",
        precision: "instant-upper-bound",
        not_after: SWARM_CARD_CREATED,
        source: "/signed/cards/b44335819f7720966b41e2ee26f5798892b0eb8d2571c71e0c9090506f1ff823.json",
        source_field: "body.created",
        note: "The active wave-2b card proves the measurement existed by this instant; it does not prove the run happened exactly then. Freshness must fail closed when that distinction matters.",
      },
    };
  }

  if (axis.kind === "model-comparison") {
    return {
      ...axis,
      measurement_time: {
        state: "DAY",
        precision: "day",
        observed_on: BOARD_V2_MEASURED_ON,
        source: "csoai/gspc-peritem-rows-2026-08-12 MANIFEST.json",
        source_field: "measured",
        note: "The source publishes day precision only. No midnight timestamp is invented.",
      },
    };
  }

  return {
    ...axis,
    measurement_time: {
      state: "UNCHECKABLE",
      precision: "unknown",
      source: axis.evidence_url || "/api/gspc",
      source_field: "none",
      note: "No structured measurement time is available; CURRENT admission must fail closed.",
    },
  };
}

export type FreshnessResult = {
  state: "CURRENT" | "STALE" | "UNCHECKABLE";
  reason: string;
  evaluated_at: string;
  max_age_seconds: number;
  age_seconds?: number;
  age_lower_bound_seconds?: number;
  age_upper_bound_seconds?: number;
};

const parseInstant = (value: string): number | null => {
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : null;
};

export function evaluateMeasurementFreshness(
  measurement: MeasurementTime,
  evaluatedAt: string,
  maxAgeSeconds: number,
): FreshnessResult {
  const now = parseInstant(evaluatedAt);
  const base = { evaluated_at: evaluatedAt, max_age_seconds: maxAgeSeconds };
  if (now === null || !Number.isFinite(maxAgeSeconds) || maxAgeSeconds < 0) {
    return { ...base, state: "UNCHECKABLE", reason: "INVALID_EVALUATION_INPUT" };
  }
  const maxMs = maxAgeSeconds * 1000;

  if (measurement.state === "EXACT") {
    const observed = parseInstant(measurement.observed_at);
    if (observed === null || observed > now) {
      return { ...base, state: "UNCHECKABLE", reason: observed === null ? "INVALID_MEASUREMENT_TIME" : "MEASUREMENT_IN_FUTURE" };
    }
    const ageMs = now - observed;
    return {
      ...base,
      state: ageMs <= maxMs ? "CURRENT" : "STALE",
      reason: ageMs <= maxMs ? "AGE_WITHIN_BOUND" : "AGE_EXCEEDS_BOUND",
      age_seconds: ageMs / 1000,
    };
  }

  if (measurement.state === "DAY") {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(measurement.observed_on)) {
      return { ...base, state: "UNCHECKABLE", reason: "INVALID_MEASUREMENT_DAY" };
    }
    const start = Date.parse(measurement.observed_on + "T00:00:00Z");
    const end = start + 86400000 - 1;
    if (!Number.isFinite(start) || start > now) {
      return { ...base, state: "UNCHECKABLE", reason: start > now ? "MEASUREMENT_DAY_IN_FUTURE" : "INVALID_MEASUREMENT_DAY" };
    }
    const lowerAge = Math.max(0, now - Math.min(end, now));
    const upperAge = now - start;
    if (upperAge <= maxMs) {
      return { ...base, state: "CURRENT", reason: "WHOLE_DAY_WITHIN_BOUND", age_lower_bound_seconds: lowerAge / 1000, age_upper_bound_seconds: upperAge / 1000 };
    }
    if (lowerAge > maxMs) {
      return { ...base, state: "STALE", reason: "WHOLE_DAY_EXCEEDS_BOUND", age_lower_bound_seconds: lowerAge / 1000, age_upper_bound_seconds: upperAge / 1000 };
    }
    return { ...base, state: "UNCHECKABLE", reason: "DAY_PRECISION_STRADDLES_BOUND", age_lower_bound_seconds: lowerAge / 1000, age_upper_bound_seconds: upperAge / 1000 };
  }

  if (measurement.state === "NOT_AFTER") {
    const bound = parseInstant(measurement.not_after);
    if (bound === null || bound > now) {
      return { ...base, state: "UNCHECKABLE", reason: bound === null ? "INVALID_NOT_AFTER" : "NOT_AFTER_IN_FUTURE" };
    }
    const lowerAge = now - bound;
    if (lowerAge > maxMs) {
      return { ...base, state: "STALE", reason: "NOT_AFTER_ALREADY_EXCEEDS_BOUND", age_lower_bound_seconds: lowerAge / 1000 };
    }
    return { ...base, state: "UNCHECKABLE", reason: "NOT_AFTER_CANNOT_PROVE_CURRENT", age_lower_bound_seconds: lowerAge / 1000 };
  }

  return { ...base, state: "UNCHECKABLE", reason: "NO_STRUCTURED_MEASUREMENT_TIME" };
}
