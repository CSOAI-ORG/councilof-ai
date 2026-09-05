/**
 * useHubCards — the single live read of GET /api/hub-cards.
 *
 * WHAT THIS POPULATION IS. Third-party models published on the Hugging Face Hub,
 * projected from huggingface.co/datasets/csoai/gspc-hub-cards. It is NOT the 22-axis
 * board and NOT the CSOAI fleet. The endpoint says both in its own `honesty` block,
 * and this module passes those sentences through verbatim rather than paraphrasing
 * them, because a paraphrase is where the qualifier goes missing.
 *
 * THE TRAP THIS FILE EXISTS TO CLOSE. A cell can carry `status: "UNMEASURED"` and an
 * `accuracy` at the same time. Measured 2026-09-05: 70 of 699 cells are UNMEASURED,
 * every one of them still carries a number (0.7333, 0.4, …), an `n`, and
 * `signed: true`, held back by an `unmeasured` reason such as "signed-pending-verify".
 * Rendering that number is how a pending cell becomes a published result.
 *
 * So `displayAccuracy` is null unless status is exactly "MEASURED". Callers that want
 * the raw figure must reach for `cell.accuracy` deliberately and say what it is. The
 * endpoint's own words: "A valid signature over a body that says UNMEASURED means the
 * cell is UNMEASURED."
 *
 * SIGNED IS NOT VERIFIED. Every cell in this population is `signed: true`. That says a
 * signature exists over the card bytes; it says nothing about whether anyone checked
 * it, and nothing about the verdict inside. Nothing here derives a verification state.
 */
import { useEffect, useState } from "react";

export interface HubCell {
  model: string;
  axis: string;
  /** Exactly as published. Never upgraded, never inferred. */
  status?: "MEASURED" | "UNMEASURED" | string;
  /** Present even when status is UNMEASURED — see `displayAccuracy`. */
  accuracy?: number;
  n?: number;
  card_sha256?: string;
  card_url?: string;
  /** A signature exists over the card bytes. NOT a verification verdict. */
  signed?: boolean;
  /** Why this cell is not MEASURED, in the producer's words. Empty when measured. */
  unmeasured?: string[];
  index?: string;
}

export interface HubCards {
  schema?: string;
  as_of?: string;
  source?: string;
  population?: string;
  honesty?: Record<string, string>;
  counts?: {
    measured?: number;
    unmeasured?: number;
    other?: number;
    cells?: number;
    indexes_read?: number;
    indexes_total?: number;
  };
  cells?: HubCell[];
}

/**
 * The figure that may be shown as a result, or null.
 *
 * Null for every cell whose status is not exactly "MEASURED", regardless of what
 * `accuracy` holds. This is the whole point of the module.
 */
export function displayAccuracy(cell: HubCell): number | null {
  if (cell.status !== "MEASURED") return null;
  return typeof cell.accuracy === "number" ? cell.accuracy : null;
}

/** Distinct axis ids present in the payload, sorted. Never a hardcoded list. */
export function axesIn(cells: HubCell[]): string[] {
  return [...new Set(cells.map((c) => c.axis).filter(Boolean))].sort();
}

/** Distinct statuses present, sorted. Derived, so a new status cannot go unlisted. */
export function statusesIn(cells: HubCell[]): string[] {
  return [...new Set(cells.map((c) => c.status).filter(Boolean) as string[])].sort();
}

let cached: Promise<HubCards> | null = null;

function load(): Promise<HubCards> {
  if (!cached) {
    cached = fetch("/api/hub-cards")
      .then((r) => {
        if (!r.ok) throw new Error(`/api/hub-cards HTTP ${r.status}`);
        return r.json();
      })
      .catch((e) => {
        // Do not memoise a failure: a later mount should retry rather than
        // inherit one bad network moment forever.
        cached = null;
        throw e;
      });
  }
  return cached;
}

export function useHubCards(): {
  data: HubCards | null;
  error: string | null;
  loading: boolean;
} {
  const [data, setData] = useState<HubCards | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    load()
      .then((d) => {
        if (!live) return;
        setData(d);
        setLoading(false);
      })
      .catch((e) => {
        if (!live) return;
        // In words, not as a blank panel. There is no placeholder payload.
        setError(e instanceof Error ? e.message : String(e));
        setLoading(false);
      });
    return () => {
      live = false;
    };
  }, []);

  return { data, error, loading };
}
