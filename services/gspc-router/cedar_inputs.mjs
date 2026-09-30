#!/usr/bin/env node
// Emits, for every golden case (fixtures/route-golden/cases.json), the Cedar the core evaluated and what the
// core decided per candidate, so test_route_service.py can re-run the SAME Cedar with `cedar authorize`.
// Candidates the core found UNCHECKABLE are listed with expect=false and cedar=null: they are refused
// before any policy runs and have no faithful Cedar entity.
import fs from "node:fs";
import path from "node:path";
import { route, buildCandidates, callerPolicy, renderCedar, cedarEntity, CEDAR_SCHEMA, FLOOR_CEDAR } from "./dist/route-core.mjs";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const GOLD = path.join(HERE, "..", "..", "fixtures", "route-golden");
const cases = JSON.parse(fs.readFileSync(path.join(GOLD, "cases.json"), "utf8"));
const board = JSON.parse(fs.readFileSync(path.join(GOLD, "board-2026-09-30.json"), "utf8"));
const out = { schema: CEDAR_SCHEMA, cases: [] };
for (const c of cases.cases) {
  const b = structuredClone(board);
  if (c.board === "planted-separated") for (const r of b.axes) if (r.axis === "governance") r.separation = "SEPARATED";
  const fetchBoard = c.board === "unreachable" ? async () => { throw new Error("HTTP 503"); } : async () => b;
  const r = await route(structuredClone(c.args), { fetchBoard, now: () => new Date(cases.read_at), uuid: () => cases.uuid });
  const pol = callerPolicy(c.args.policy);
  const { candidates } = buildCandidates(structuredClone(c.args.candidates));
  const considered = r.record.observed.considered;
  const dc = c.args.data_class ?? "public";
  out.cases.push({
    name: c.name,
    policies: `${FLOOR_CEDAR}\n${renderCedar(pol.rules)}`,
    context: { confirm: pol.confirm, caller_wallet: pol.caller_wallet, data_class: dc },
    requests: candidates.map((cand) => {
      const row = considered.find((x) => x.id === cand.id);
      const measured = (row.measurements[0] || {}).state === "MEASURED";
      return { id: cand.id, expect: row.permit, entity: cand.uncheckable.length ? null : cedarEntity(cand, { measured_on_axis: measured }) };
    }),
  });
}
process.stdout.write(JSON.stringify(out, null, 1));
