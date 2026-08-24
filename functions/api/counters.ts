// function: /api/counters — Wave-1 public-utility counters (EXP 005).
// Honest aggregate-only: verify-page executions + watch-desk reads.
// NO telemetry, NO per-user data, NO fabricated counts. If a counter has no data source
// bound, it renders UNPUBLISHED count:0 — the same honesty as the cards endpoint.
export const onRequestGet = async () => {
  // The counters are aggregate-only by design. Until a KV/binding counter is wired,
  // render the honest zero state: the counter is real, its value is not invented.
  const counters = {
    schema: "csoai.wave1-counters/0.1",
    wave: 1,
    counters: [
      { id: "verify_page_executions", name: "Verify-page executions (free, zero-auth)", count: null, status: "UNPUBLISHED" },
      { id: "verify_leaderboard_verifies", name: "Verify-this-leaderboard verifies", count: null, status: "UNPUBLISHED" },
      { id: "watch_desk_reads", name: "Watch-desk reads", count: null, status: "UNPUBLISHED" },
      { id: "claimguard_runs", name: "ClaimGuard audit runs", count: null, status: "UNPUBLISHED" },
    ],
    note: "Aggregate-only. Zero-auth, zero-fee, stranger-runnable (Wave-1 public utility). " +
          "An UNPUBLISHED counter is honest — no fabrication, no implied traction. " +
          "Measurement, not a ranking.",
    generated: new Date().toISOString(),
  };
  return new Response(JSON.stringify(counters, null, 1), {
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
};
