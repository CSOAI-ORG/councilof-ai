/**
 * useArenaDoors — the living door mechanic for Council Space (/gspc-arena).
 *
 * Room doors are gated by GET /api/gspc:
 *   - OPEN: MEASURED model-comparison axes (except jail)
 *   - CLOSED: UNMEASURED / PLANNED / DRAFT / SPEC axes
 *   - FLOOR: jail (measured, but not a scored door — it's the floor)
 *
 * HONESTY RULES:
 *   - Empty stays empty. No invented doors.
 *   - Jail is MEASURED but is the floor, never a room door.
 *   - No typed counts. Everything comes from GET /api/gspc.
 *   - A door only opens when its axis is MEASURED with n > 0.
 */

import { useEffect, useState } from "react";
import { fetchAxes, quotable, type Axis, type AxesSource } from "@/lib/gspcAxes";

export type DoorState = "open" | "closed" | "floor";

export interface ArenaDoor {
  axis: string;
  bench: string;
  state: DoorState;
  n: number;
  accuracy: number | null;
  reason: string;
}

export interface ArenaDoorState {
  doors: ArenaDoor[];
  openCount: number;
  closedCount: number;
  floorAxis: ArenaDoor | null;
  source: AxesSource;
  publicCount: string;
  loading: boolean;
  error?: string;
}

function axisToDoor(a: Axis): ArenaDoor {
  if (a.axis === "jail") {
    return {
      axis: a.axis,
      bench: a.bench,
      state: "floor",
      n: a.n,
      accuracy: a.accuracy,
      reason: "Jail is the measured floor, not a scored door. Separation is TIE.",
    };
  }

  if (quotable(a)) {
    return {
      axis: a.axis,
      bench: a.bench,
      state: "open",
      n: a.n,
      accuracy: a.accuracy,
      reason: `MEASURED with n=${a.n}. Door is open for model comparison.`,
    };
  }

  return {
    axis: a.axis,
    bench: a.bench,
    state: "closed",
    n: a.n,
    accuracy: a.accuracy,
    reason: a.status === "UNMEASURED"
      ? "UNMEASURED — empty stays empty. No invented score."
      : `${a.status} — not yet measured. Door is closed.`,
  };
}

const INITIAL_STATE: ArenaDoorState = {
  doors: [],
  openCount: 0,
  closedCount: 0,
  floorAxis: null,
  source: "snapshot",
  publicCount: "Loading from GET /api/gspc…",
  loading: true,
};

/**
 * useArenaDoors — fetch the live board and derive door states.
 *
 * The mechanic: a door opens only when its axis is MEASURED and quotable.
 * Jail is always floor. Empty stays empty.
 */
export function useArenaDoors(): ArenaDoorState {
  const [state, setState] = useState<ArenaDoorState>(INITIAL_STATE);

  useEffect(() => {
    const ac = new AbortController();

    fetchAxes(ac.signal).then((result) => {
      const doors = result.axes.map(axisToDoor);
      const floorAxis = doors.find((d) => d.state === "floor") ?? null;
      const openCount = doors.filter((d) => d.state === "open").length;
      const closedCount = doors.filter((d) => d.state === "closed").length;

      setState({
        doors,
        openCount,
        closedCount,
        floorAxis,
        source: result.source,
        publicCount: result.publicCount ?? "Counts from GET /api/gspc",
        loading: false,
        error: result.error,
      });
    });

    return () => ac.abort();
  }, []);

  return state;
}

/**
 * Check if a specific axis door is open for play.
 */
export function isDoorOpen(doors: ArenaDoor[], axis: string): boolean {
  const door = doors.find((d) => d.axis === axis);
  return door?.state === "open";
}

/**
 * Get all open doors (MEASURED model-comparison axes, excluding jail).
 */
export function getOpenDoors(doors: ArenaDoor[]): ArenaDoor[] {
  return doors.filter((d) => d.state === "open");
}
