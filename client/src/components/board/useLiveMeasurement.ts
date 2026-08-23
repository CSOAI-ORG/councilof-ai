/**
 * useLiveMeasurement — the live read of GET /api/cards + /api/axis-register for
 * the Council OS surface. Mirrors useGspcBoard: one shared read, no invented
 * fields, no fallback payload — if an endpoint does not answer, `error` is set
 * and the UI says so in words. Counts come from the API payload, never a const.
 */
import { useEffect, useState } from "react";

export interface LiveMeasurement {
  signedCards: number | null;     // from /api/cards -> cards.signed
  cardCount: number | null;       // from /api/cards -> cards.count
  registryAxes: number | null;    // from /api/axis-register -> sets.public_board.count
  axesServed: number | null;      // from /api/gspc -> axes.length (live measured rows)
  measuredOn: string | null;      // from /api/cards -> measured_on
}

export function useLiveMeasurement() {
  const [data, setData] = useState<LiveMeasurement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [cardsRes, axisRes, gspcRes] = await Promise.all([
          fetch("/api/cards").then((r) => (r.ok ? r.json() : null)),
          fetch("/api/axis-register").then((r) => (r.ok ? r.json() : null)),
          fetch("/api/gspc").then((r) => (r.ok ? r.json() : null)),
        ]);
        if (!alive) return;
        const cards = cardsRes;
        const axis = axisRes;
        const gspc = gspcRes;
        if (!cards || !axis) {
          setError("one or more measurement endpoints did not answer");
        } else {
          // Aligned to the sibling's register (sets.public_board.count) + /api/gspc measured rows.
          setData({
            signedCards: cards?.cards?.signed ?? null,
            cardCount: cards?.cards?.count ?? null,
            registryAxes: axis?.sets?.public_board?.count ?? null,
            axesServed: gspc?.axes?.length ?? null,
            measuredOn: cards?.measured_on ?? null,
          });
        }
      } catch (e) {
        if (alive) setError(String(e));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return { data, error, loading };
}
