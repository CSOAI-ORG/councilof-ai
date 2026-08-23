// functions/api/arena/elo.ts — OUR deterministic arena Elo leaderboard with CIs.
// Bradley-Terry Elo, K=32, Wilson 95% CI on win-rate (n>=5). Computed from our
// referee-based rounds (grok_referee + reborn). MEASURED (deterministic) —
// LMArena's human-vote Elo is REPORTED context, never fused into these cells.
import { readFileSync } from "node:fs";

export const onRequestGet: PagesFunction = async () => {
  let leaderboard = [];
  try {
    const raw = readFileSync(new URL("../../../../_data/elo_leaderboard.json", import.meta.url), "utf8");
    leaderboard = JSON.parse(raw).leaderboard || [];
  } catch (e) {
    // fallback: minimal empty with honest note
  }
  return Response.json({
    schema: "csoai.arena-elo/0.1",
    method: "Bradley-Terry Elo, K=32, Wilson 95% CI on win-rate, n>=5",
    register: "MEASURED (referee-based, deterministic) — LMArena human-vote is REPORTED context",
    not_a_certification: true,
    leaderboard,
    note: leaderboard.length ? "live from pod arena rounds" : "leaderboard not yet synced — see /workspace/arena-24x7/elo_leaderboard.json",
  }, { headers: { "content-type": "application/json; charset=utf-8" } });
};
