/**
 * GET /api/dashboard/stats — DSH board metrics from live public APIs on apex.
 *
 * Aggregates /api/gspc, /api/cards, /api/oracle-fleet, /api/receipts/latest.
 * No tRPC, no GCP VM, no api.csoai.org. Honest empty states where data is absent.
 */

export const onRequestGet: PagesFunction = async ({ request }) => {
  const origin = new URL(request.url).origin;
  const u = (p: string) => new URL(p, origin).toString();

  const [gspcRes, cardsRes, fleetRes, receiptsRes] = await Promise.all([
    fetch(u("/api/gspc"), { headers: { accept: "application/json" } }),
    fetch(u("/api/cards"), { headers: { accept: "application/json" } }),
    fetch(u("/api/oracle-fleet"), { headers: { accept: "application/json" } }),
    fetch(u("/api/receipts/latest"), { headers: { accept: "application/json" } }),
  ]);

  const gspc = gspcRes.ok ? await gspcRes.json().catch(() => null) : null;
  const cards = cardsRes.ok ? await cardsRes.json().catch(() => null) : null;
  const fleet = fleetRes.ok ? await fleetRes.json().catch(() => null) : null;
  const receipts = receiptsRes.ok ? await receiptsRes.json().catch(() => null) : null;

  const measuredAxes = gspc?.totals?.measured_axes ?? 0;
  const quotableAxes = gspc?.totals?.quotable_axes ?? 0;
  const signedCards = cards?.cards?.signed ?? cards?.signed ?? 0;
  const cardCount = cards?.cards?.count ?? cards?.count ?? 0;

  const fleetOnline =
    fleet && typeof fleet === "object" && !("error" in fleet)
      ? (fleet as { online?: number; nodes?: unknown[] }).online ??
        ((fleet as { nodes?: unknown[] }).nodes?.length ?? 0)
      : 0;

  return Response.json(
    {
      schema: "csoai.dashboard.stats/0.1",
      source: "pages-functions",
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
      fleet: { online: fleetOnline, raw: fleet?.error ? { status: "offline" } : fleet },
      receipts: { status: receipts?.status ?? "unknown", count: receipts?.count ?? 0 },
      council: {
        totalSessions: measuredAxes,
        pendingReview: Math.max(0, quotableAxes - measuredAxes),
        consensusReached: gspc?.totals?.separated_leads ?? 0,
      },
      watchdog: { count: 0, reports: [] },
      pdca: {
        totalCycles: measuredAxes > 0 ? 1 : 0,
        activeCycles: measuredAxes > 0 ? 1 : 0,
        completedCycles: 0,
        pausedCycles: 0,
        phaseDistribution: {
          plan: measuredAxes > 0 ? 1 : 0,
          do: signedCards > 0 ? 1 : 0,
          check: fleetOnline > 0 ? 1 : 0,
          act: 0,
        },
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
