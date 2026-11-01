/**
 * board-drift.mjs — the drift guard's board check (Measure CHANGES on the drift guard, 16 Oct 2026).
 *
 * EXPECTED comes from THIS commit's own board (scripts/surface/commit-board.mjs: the commit's
 * functions/api/gspc.ts run offline — the same bytes prerender freezes into the board reference
 * that facts-gate checks). It is never derived from live totals: a guard whose expected value is
 * read off live only compares live with itself and cannot go red.
 *
 * PRODUCTION ANCHOR (same rules as board-production-anchor.mjs), judged live vs expected:
 *   - measured_axes and the MEASURED id set must match; no measured axis may be removed or demoted;
 *   - every measured axis keeps status, separation, n and every numeric score field;
 *   - a measured difference passes ONLY when a committed signed board snapshot
 *     (public/signed/gspc-board*.signed.json, carrying a signature) names the expected row exactly;
 *   - totals.axes may differ ONLY by declared UNMEASURED slots (e.g. a merged board not yet deployed);
 *   - when the axis count matches, public_count and every total must match exactly.
 */
import fs from "node:fs";
import path from "node:path";

export const rowKey = (r) => {
  const o = { status: r.status, separation: r.separation ?? null };
  for (const [k, v] of Object.entries(r)) if (typeof v === "number") o[k] = v;
  return JSON.stringify(Object.keys(o).sort().map((k) => [k, o[k]]));
};

/** Signed snapshots in this commit: [{file, rows: Map(axis -> row)}]. Unsigned files are ignored. */
export function loadSignedSnapshots(root) {
  const dir = path.join(root, "public/signed");
  const out = [];
  for (const f of fs.existsSync(dir) ? fs.readdirSync(dir) : []) {
    if (!/^gspc-board.*\.signed\.json$/.test(f)) continue;
    let d; try { d = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")); } catch { continue; }
    const sig = d.custody_attestation?.sig_b64 || d.board_attestation?.signature?.sig_b64 || d.board_attestation?.signature?.value;
    if (!sig || !Array.isArray(d.axes)) continue;
    out.push({ file: f, rows: new Map(d.axes.map((r) => [r.axis, r])) });
  }
  return out;
}

const named = (snaps, id, row) => snaps.find((s) => s.rows.has(id) && rowKey(s.rows.get(id)) === rowKey(row));

/** Returns {errors:[], notes:[]} for live vs expected. */
export function judge(live, expected, snaps = []) {
  const errors = [], notes = [];
  const L = new Map((live.axes || []).map((r) => [r.axis, r])), E = new Map((expected.axes || []).map((r) => [r.axis, r]));
  const meas = (M) => [...M.values()].filter((r) => r.status === "MEASURED").map((r) => r.axis).sort();
  const lt = live.totals || {}, et = expected.totals || {};
  if (live.schema !== expected.schema) errors.push(`schema ${live.schema} ≠ commit ${expected.schema}`);
  const lm = meas(L), em = meas(E);
  const mdiff = [...new Set([...lm, ...em])].filter((id) => !(L.has(id) && E.has(id) && L.get(id).status === "MEASURED" && E.get(id).status === "MEASURED" && rowKey(L.get(id)) === rowKey(E.get(id))));
  for (const id of mdiff) {
    const e = E.get(id);
    if (e && e.status === "MEASURED") {
      const s = named(snaps, id, e);
      if (s) notes.push(`measured axis ${id} differs from live; named by signed snapshot ${s.file}`);
      else errors.push(`measured axis ${id}: live and commit differ (status/separation/n/score) and no signed snapshot names the commit row`);
    } else {
      errors.push(`measured axis ${id} is MEASURED live but ${e ? e.status : "absent"} in the commit board (measured dropped / axis removed)`);
    }
  }
  if (lt.measured_axes !== et.measured_axes && !mdiff.every((id) => notes.some((n) => n.includes(` ${id} `))))
    errors.push(`totals.measured_axes live ${lt.measured_axes} ≠ commit ${et.measured_axes}`);
  for (const id of L.keys()) if (!E.has(id)) {
    if (L.get(id).status === "MEASURED") continue; // already reported above
    errors.push(`live axis ${id} is missing from the commit board (axis removed)`);
  }
  const extra = [...E.keys()].filter((id) => !L.has(id));
  const nonDeclared = extra.filter((id) => E.get(id).status !== "UNMEASURED");
  if (nonDeclared.length) errors.push(`commit axes not live and not declared UNMEASURED: ${nonDeclared.join(",")}`);
  if (lt.axes !== et.axes) {
    const declaredGap = (et.axes - lt.axes) === extra.length && extra.length > 0 && !nonDeclared.length;
    if (declaredGap) notes.push(`axis count live ${lt.axes} vs commit ${et.axes}: differs only by ${extra.length} declared UNMEASURED slot(s) (${extra.join(",")}) — deploy pending`);
    else errors.push(`totals.axes live ${lt.axes} ≠ commit ${et.axes}, and the difference is not only declared UNMEASURED slots`);
  } else {
    for (const k of ["axes", "measured_axes", "unmeasured_axes", "quotable_axes"])
      if (k in et && lt[k] !== et[k]) errors.push(`totals.${k} live ${lt[k]} ≠ commit ${et[k]}`);
    if (String(lt.public_count ?? "") !== String(et.public_count ?? "")) errors.push(`public_count live "${lt.public_count}" ≠ commit "${et.public_count}"`);
  }
  return { errors: [...new Set(errors)], notes };
}

export function selftest() {
  const ax = (axis, status, n, x) => ({ axis, status, n, separation: "TIE", fleet_mean: x });
  const b = (axes, pc) => {
    const m = axes.filter((a) => a.status === "MEASURED").length;
    return { schema: "s", axes, totals: { axes: axes.length, measured_axes: m, unmeasured_axes: axes.length - m, public_count: pc ?? `${axes.length} axes · ${m} measured` } };
  };
  const base = [ax("a", "MEASURED", 10, 0.5), ax("b", "MEASURED", 20, 0.6)];
  const exp = b([...base, ax("c", "UNMEASURED", 0)]);
  const snap = [{ file: "gspc-board.x.signed.json", rows: new Map([["a", ax("a", "MEASURED", 11, 0.5)]]) }];
  const cases = [
    ["identical", b([...base, ax("c", "UNMEASURED", 0)]), exp, [], true],
    ["live behind by a declared unmeasured slot", b(base), exp, [], true],
    ["live equals itself is NOT the reference: commit says 3, live says 2 measured+1 extra MEASURED", b([...base, ax("c", "MEASURED", 5, 0.1)]), exp, [], false],
    ["n changed, unnamed", b([ax("a", "MEASURED", 11, 0.5), base[1], ax("c", "UNMEASURED", 0)]), exp, [], false],
    ["score changed, unnamed", b([ax("a", "MEASURED", 10, 0.51), base[1], ax("c", "UNMEASURED", 0)]), exp, [], false],
    ["n changed, named by signed snapshot", b([...base, ax("c", "UNMEASURED", 0)]), b([ax("a", "MEASURED", 11, 0.5), base[1], ax("c", "UNMEASURED", 0)]), snap, true],
    ["measured dropped in commit", b([...base, ax("c", "UNMEASURED", 0)]), b([base[0], ax("b", "UNMEASURED", 0), ax("c", "UNMEASURED", 0)]), [], false],
    ["axis removed from commit", b([...base, ax("c", "UNMEASURED", 0)]), b(base), [], false],
    ["extra commit axis is MEASURED, not declared", b(base), b([...base, ax("c", "MEASURED", 5, 0.1)]), [], false],
    ["same count, wrong public_count text", b([...base, ax("c", "UNMEASURED", 0)], "3 axes · 3 measured"), exp, [], false],
  ];
  for (const [name, live, e, s, ok] of cases) {
    const r = judge(live, e, s);
    if ((r.errors.length === 0) !== ok) throw new Error(`board-drift selftest FAILED: ${name} -> ${r.errors.join("; ") || "no error"}`);
  }
  return `board-drift selftest OK (${cases.length} cases, ${cases.filter((c) => !c[4]).length} must-fail)`;
}
