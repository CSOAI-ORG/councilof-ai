/**
 * GET /api/dashboard/stats — DSH board metrics from live public APIs on apex.
 *
 * Aggregates /api/gspc, /api/cards, /api/oracle-fleet, /api/receipts/latest.
 * No tRPC, no GCP VM, no api.csoai.org.
 *
 * ABSENT IS NOT ZERO. Every aggregate here used to be coalesced with `?? 0`, so
 * an unreadable source became a hard number: a failed /api/gspc published
 * `measured_axes: 0` when the board carries 22. `fleet.online` was derived from
 * `.online ?? .nodes?.length ?? 0` — two fields /api/oracle-fleet has never
 * emitted — so it reported 0 nodes online while the fleet answered 200 with a
 * host at 26.9 days uptime. That was live and wrong on 2026-09-05.
 *
 * So: a value is a number only when a source that answered actually carried it.
 * Otherwise it is null, and `sources` says which upstream failed and how. A
 * zero here always means someone measured zero. Null means we do not know.
 */

export const onRequestGet: PagesFunction = async ({ request }) => {
  const origin = new URL(request.url).origin;
  const u = (p: string) => new URL(p, origin).toString();

  /** A source either answered and parsed, or it did not — and we say which. */
  type Source = { ok: true; value: any; state: "ok" } | { ok: false; value: null; state: string };

  const read = async (path: string): Promise<Source> => {
    try {
      const r = await fetch(u(path), { headers: { accept: "application/json" } });
      if (!r.ok) return { ok: false, value: null, state: `http ${r.status}` };
      const value = await r.json().catch(() => undefined);
      if (value === undefined) return { ok: false, value: null, state: "unparseable json" };
      return { ok: true, value, state: "ok" };
    } catch (e) {
      return { ok: false, value: null, state: `fetch failed: ${(e as Error)?.message ?? "unknown"}` };
    }
  };

  const [gspcSrc, cardsSrc, fleetSrc, receiptsSrc] = await Promise.all([
    read("/api/gspc"),
    read("/api/cards"),
    read("/api/oracle-fleet"),
    read("/api/receipts/latest"),
  ]);

  const gspc = gspcSrc.value;
  const cards = cardsSrc.value;
  const fleet = fleetSrc.value;
  const receipts = receiptsSrc.value;

  /** A number only if the source answered AND carried the field. Never a default. */
  const num = (src: Source, pick: (v: any) => unknown): number | null => {
    if (!src.ok) return null;
    const v = pick(src.value);
    return typeof v === "number" ? v : null;
  };

  const measuredAxes = num(gspcSrc, (v) => v?.totals?.measured_axes);
  const quotableAxes = num(gspcSrc, (v) => v?.totals?.quotable_axes);
  const signedCards = num(cardsSrc, (v) => v?.cards?.signed ?? v?.signed);
  const cardCount = num(cardsSrc, (v) => v?.cards?.count ?? v?.count);

  // /api/oracle-fleet reports a single host's health and carries no `online` and
  // no `nodes`. Deriving 0 from their absence asserted "no nodes online", which
  // is a claim the fleet endpoint never made. Absent stays null, with the reason.
  const fleetOnline =
    fleetSrc.ok && fleet && typeof fleet === "object" && !("error" in fleet)
      ? typeof (fleet as { online?: unknown }).online === "number"
        ? ((fleet as { online: number }).online)
        : Array.isArray((fleet as { nodes?: unknown[] }).nodes)
          ? ((fleet as { nodes: unknown[] }).nodes.length)
          : null
      : null;

  const fleetOnlineNote =
    fleetOnline === null
      ? fleetSrc.ok
        ? "/api/oracle-fleet answered but reports neither `online` nor `nodes`, so no online count is asserted. Absent is not zero."
        : `/api/oracle-fleet unread (${fleetSrc.state}), so no online count is asserted. Absent is not zero.`
      : null;

  return Response.json(
    {
      schema: "csoai.dashboard.stats/0.2",
      source: "pages-functions",
      sources: {
        gspc: gspcSrc.state,
        cards: cardsSrc.state,
        fleet: fleetSrc.state,
        receipts: receiptsSrc.state,
      },
      null_means: "A null is an unread or absent value, never a measured zero. Any source not reading 'ok' above is why.",
      complianceScore: null,
      totalSystems: 0,
      pendingReviews: 0,
      trend: [],
      gspc: {
        measured_axes: measuredAxes,
        quotable_axes: quotableAxes,
        public_count: gspc?.totals?.public_count ?? null,
        separated_leads: gspc?.totals?.separated_leads ?? null,
      },
      cards: { count: cardCount, signed: signedCards },
      fleet: {
        online: fleetOnline,
        online_note: fleetOnlineNote,
        raw: fleet?.error ? { status: "offline" } : fleet,
      },
      receipts: {
        status: receiptsSrc.ok ? (receipts?.status ?? "unknown") : "UNREAD",
        count: num(receiptsSrc, (v) => v?.count),
      },
      council: {
        totalSessions: 0,
        pendingReview: 0,
        consensusReached: 0,
        state: "NOT_LIVE",
        note: "33 seats are designed with a 23/33 target. No session, vote, independence, or fault tolerance is recorded here.",
      },
      watchdog: { count: 0, reports: [] },
      pdca: {
        totalCycles: 0,
        activeCycles: 0,
        completedCycles: 0,
        pausedCycles: 0,
        phaseDistribution: {
          plan: 0,
          do: 0,
          check: 0,
          act: 0,
        },
        state: "UNMEASURED",
        note: "GSPC axes, cards, and fleet nodes are not account PDCA cycles.",
      },
      loi: { total: 0, count: 0 },
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "public, max-age=30",
      },
    },
  );
};
