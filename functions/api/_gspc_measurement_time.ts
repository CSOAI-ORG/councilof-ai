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

// Evidence precision is preserved. A day is never silently promoted to 00:00Z,
// and a signed-card creation time is an upper bound on the measurement, not the run time.
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
