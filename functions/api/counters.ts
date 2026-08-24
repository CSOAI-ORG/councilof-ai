// function: /api/counters — Wave-1 public-utility counters (EXP 005).
// Honest aggregate-only: binds live board counts where a public API exists.
// NO telemetry, NO per-user data, NO fabricated counts. UNPUBLISHED = honest.
export const onRequestGet: PagesFunction = async (context) => {
  const origin = new URL(context.request.url).origin;
  let measuredAxes: number | null = null;
  let axisSlots: number | null = null;
  let registerRows: number | null = null;

  try {
    const gspc = await fetch(`${origin}/api/gspc`, { headers: { "user-agent": "csoai-counters/0.1" } });
    if (gspc.ok) {
      const j = (await gspc.json()) as { totals?: { measured_axes?: number; axes?: number } };
      measuredAxes = j.totals?.measured_axes ?? null;
      axisSlots = j.totals?.axes ?? null;
    }
  } catch { /* honest null */ }

  try {
    const reg = await fetch(`${origin}/api/axis-register`, { headers: { "user-agent": "csoai-counters/0.1" } });
    if (reg.ok) {
      const j = (await reg.json()) as { axes?: unknown[]; register?: unknown[] };
      const rows = j.axes ?? j.register;
      if (Array.isArray(rows)) registerRows = rows.length;
    }
  } catch { /* honest null */ }

  const counters = {
    schema: "csoai.wave1-counters/0.1",
    wave: 1,
    counters: [
      {
        id: "gspc_measured_axes",
        name: "GSPC measured axes (live board)",
        count: measuredAxes,
        status: measuredAxes != null ? "LIVE" : "UNPUBLISHED",
      },
      {
        id: "gspc_axis_slots",
        name: "GSPC quotable axis slots",
        count: axisSlots,
        status: axisSlots != null ? "LIVE" : "UNPUBLISHED",
      },
      {
        id: "axis_register_rows",
        name: "Signed axis register rows",
        count: registerRows,
        status: registerRows != null ? "LIVE" : "UNPUBLISHED",
      },
      {
        id: "verify_page_executions",
        name: "Verify-page executions (free, zero-auth)",
        count: null,
        status: "UNPUBLISHED",
      },
      {
        id: "watch_desk_reads",
        name: "Watch-desk reads",
        count: null,
        status: "UNPUBLISHED",
      },
    ],
    note:
      "Aggregate-only. LIVE counters bind to public APIs (/api/gspc, /api/axis-register). " +
      "UNPUBLISHED = no fabrication. Measurement, not a ranking.",
    generated: new Date().toISOString(),
  };
  return new Response(JSON.stringify(counters, null, 1), {
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
};
