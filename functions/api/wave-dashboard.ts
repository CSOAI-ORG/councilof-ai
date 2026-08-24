// GET /api/wave-dashboard — live Wave 0–5 aggregates from public APIs (unsigned runtime view).
// Signed canonical: /signals/wave-dashboard.signed.json (POD-signed, emit_wave_dashboard.py).
export const onRequestGet: PagesFunction = async (context) => {
  const origin = new URL(context.request.url).origin;
  const hdrs = { "user-agent": "csoai-wave-dashboard/0.1" };

  let measuredAxes: number | null = null;
  let axisSlots: number | null = null;
  let registerRows: number | null = null;
  let receiptCount = 0;
  let receiptStatus = "UNPUBLISHED";

  try {
    const gspc = await fetch(`${origin}/api/gspc`, { headers: hdrs });
    if (gspc.ok) {
      const j = (await gspc.json()) as { totals?: { measured_axes?: number; axes?: number } };
      measuredAxes = j.totals?.measured_axes ?? null;
      axisSlots = j.totals?.axes ?? null;
    }
  } catch { /* honest null */ }

  try {
    const reg = await fetch(`${origin}/api/axis-register`, { headers: hdrs });
    if (reg.ok) {
      const j = (await reg.json()) as { axes?: unknown[]; register?: unknown[] };
      const rows = j.axes ?? j.register;
      if (Array.isArray(rows)) registerRows = rows.length;
    }
  } catch { /* honest null */ }

  try {
    const rcpt = await fetch(`${origin}/api/receipts/latest`, { headers: hdrs });
    if (rcpt.ok) {
      const j = (await rcpt.json()) as { count?: number; status?: string };
      receiptCount = j.count ?? 0;
      receiptStatus = j.status ?? "UNPUBLISHED";
    }
  } catch { /* honest null */ }

  const waves = [
    { wave: 0, name: "The signed spine works", register: measuredAxes != null ? "MEASURED" : "UNVERIFIED", count: measuredAxes ?? 0, evidence: "live /api/gspc board + axis register" },
    { wave: 1, name: "Verification as a free public utility", register: "MEASURED", count: 3, evidence: "gspc-verify + verify-leaderboard + Article 50 passport surfaces" },
    { wave: 2, name: "Third parties build on the rail", register: receiptCount > 0 ? "MEASURED" : "UNVERIFIED", count: receiptCount, evidence: receiptStatus === "UNPUBLISHED" ? "no settlement receipts published yet" : "receipts/latest" },
    { wave: 3, name: "Network effects / court of record", register: "UNVERIFIED", count: 0, evidence: "POST /api/challenge receipts; no external dispute hosted yet" },
    { wave: 4, name: "Sector/axis replication", register: registerRows != null ? "MEASURED" : "UNVERIFIED", count: registerRows ?? 0, evidence: "axis register rows from /api/axis-register" },
    { wave: 5, name: "Load-bearing infrastructure", register: "UNVERIFIED", count: 0, evidence: "procurement-default + regulation-reference criteria not met" },
  ];

  return Response.json(
    {
      schema: "csoai.wave-dashboard.runtime/0.1",
      doctrine: "Runtime aggregates from live APIs. Empty waves render honestly. Signed canon: /signals/wave-dashboard.signed.json",
      waves,
      gspc: { measured_axes: measuredAxes, axis_slots: axisSlots },
      receipts: { status: receiptStatus, count: receiptCount },
      not_a_certification: true,
      generated: new Date().toISOString(),
    },
    { headers: { "content-type": "application/json", "cache-control": "public, max-age=120" } },
  );
};
