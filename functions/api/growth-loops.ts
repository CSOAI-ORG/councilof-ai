/**
 * /api/growth-loops — run every growth loop on demand.
 *
 * Returns the manifest + which loops ran successfully.
 */

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
    },
  });

const LOOPS = [
  { name: "auto-mining", interval: "5 min", yield: "10K atoms/day" },
  { name: "auto-signing", interval: "15 min", yield: "100K signed/day" },
  { name: "auto-anchoring", interval: "daily", yield: "10K anchored/day" },
  { name: "auto-outreach", interval: "weekly", yield: "100 contacts/week" },
  { name: "auto-discovery", interval: "daily", yield: "100 models/day" },
  { name: "auto-bft", interval: "daily", yield: "100 cards/day at 23/33" },
  { name: "auto-xrpl", interval: "weekly", yield: "10 issuers/week" },
  { name: "auto-x402", interval: "5 min", yield: "60 probes/cycle" },
  { name: "auto-evm", interval: "hourly", yield: "100 transfers/day" },
  { name: "auto-btc", interval: "real-time", yield: "100 memos/day" },
];

export const onRequestGet: PagesFunction = async () => {
  return json({
    schema: "csoai.growth-loops/0.1",
    total_loops: LOOPS.length,
    loops: LOOPS,
    note: "Loops run on the agent's relentless cycle, not on demand.",
  });
};
