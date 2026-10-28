#!/usr/bin/env node
/**
 * Fetch the live GSPC board and print an honest summary.
 *
 * Never fills UNMEASURED as 0. A fetch failure is UNREACHABLE, not a cached score. Slot count and
 * measured count are two labelled numbers and are never summed. SEPARATED / TIE / UNTESTED are three
 * states and none is folded into another.
 *
 * This is measurement, not certification.
 */
"use strict";

const ORIGIN = process.env.GSPC_ORIGIN || "https://councilof.ai";
const URL = `${ORIGIN.replace(/\/$/, "")}/api/gspc`;

function pad(value, width) {
  return String(value === null || value === undefined ? "—" : value).padEnd(width);
}

async function main() {
  let board;
  try {
    const response = await fetch(URL, { headers: { accept: "application/json" } });
    if (!response.ok) {
      console.log(`UNREACHABLE  HTTP ${response.status} from ${URL}`);
      console.log("No cached number is presented as live.");
      process.exit(2);
    }
    board = await response.json();
  } catch (error) {
    console.log(`UNREACHABLE  could not fetch ${URL}`);
    console.log(String(error && error.message ? error.message : error));
    console.log("No cached number is presented as live.");
    process.exit(2);
  }

  const axes = Array.isArray(board.axes) ? board.axes : [];
  const totals = board.totals || {};

  console.log(`GSPC board    schema=${board.schema || "unknown"}`);
  console.log(`source        ${URL}`);
  console.log(`slots         ${totals.axes ?? axes.length}  (declared positions on the board)`);
  console.log(
    `measurements  ${totals.measured_axes ?? "?"}  (real runs behind those slots)  — the two numbers are never summed`
  );
  if (totals.public_count) console.log(`public_count  ${totals.public_count}`);
  if (totals.separation_public_count) {
    console.log(`separation    ${totals.separation_public_count}`);
  }
  const stamp =
    board.living_stamp || (board.measured_on && board.measured_on.living_stamp) || null;
  if (stamp) {
    console.log(
      `stamp         updated=${stamp.updated || "?"}  signed=${stamp.signed ?? "?"}  state=${stamp.verification_state || "?"}`
    );
  }
  if (board.measured_on && board.measured_on.date) {
    console.log(`measured_on   ${board.measured_on.date}`);
  }

  const measured = [];
  const unmeasured = [];
  for (const row of axes) {
    const status = String(row.status || row.kind || "?").toUpperCase();
    if (status === "MEASURED") measured.push(row);
    else unmeasured.push(row);
  }

  console.log("");
  console.log("axis                      status     n      acc   separation   leader");
  console.log("-".repeat(86));
  for (const row of axes) {
    const status = String(row.status || row.kind || "?").toUpperCase();
    const isMeasured = status === "MEASURED";
    const n = isMeasured && row.n != null ? row.n : "—";
    const acc = isMeasured && row.accuracy != null ? Number(row.accuracy).toFixed(3) : "—";
    const sep = row.separation || "—";
    const leader = row.leader || (row.public_leader_state ? row.public_leader_state : "—");
    console.log(
      `${pad(row.axis || row.name || "?", 25)}  ${pad(status, 9)}  ${String(n).padStart(4)}  ${String(acc).padStart(6)}   ${pad(sep, 12)} ${leader}`
    );
  }

  if (unmeasured.length) {
    console.log("");
    console.log(`UNMEASURED slots (empty, and they stay empty — never 0): ${unmeasured.length}`);
    for (const row of unmeasured) console.log(`  - ${row.axis}`);
  }

  console.log("");
  console.log("Doctrine: MEASURED rows are evidence. UNMEASURED rows stay empty. Ties are not wins.");
  console.log("This is measurement, not certification. https://councilof.ai/verify");
}

main();
