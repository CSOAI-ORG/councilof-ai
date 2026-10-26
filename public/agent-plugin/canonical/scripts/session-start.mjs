#!/usr/bin/env node
/**
 * SessionStart hook — inject the LIVE GSPC board state as session context.
 *
 * Doctrine this script is built around:
 *  - A fetch failure is UNREACHABLE. A cached number is NEVER presented as live.
 *  - Slot count and measured count are two labelled numbers and are never summed.
 *  - SEPARATED / TIE / UNTESTED are three states; none is folded into another.
 *  - We measure; we never certify.
 *
 * It never blocks. It never sends. It prints one JSON object on stdout and exits 0.
 */
"use strict";

const ORIGIN = process.env.GSPC_ORIGIN || "https://councilof.ai";
const URL = `${ORIGIN.replace(/\/$/, "")}/api/gspc`;
const TIMEOUT_MS = 4000;

function doctrine() {
  return [
    "Council of AI is an independent measurement body: we measure, we do not certify.",
    "MEASURED is a run behind a slot. UNMEASURED is a declared slot with no run — it is an answer, not a failure, and never 0.",
    "SEPARATED / TIE / UNTESTED are three states. A TIE is not a win and UNTESTED is not a tie.",
    "Verification is free: https://councilof.ai/verify",
  ].join(" ");
}

async function readStdin() {
  if (process.stdin.isTTY) return {};
  const chunks = [];
  let size = 0;
  for await (const chunk of process.stdin) {
    size += chunk.length;
    if (size > 1024 * 1024) break;
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) || {};
  } catch {
    return {};
  }
}

async function main() {
  let board = null;
  let unreachable = null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(URL, {
      headers: { accept: "application/json" },
      signal: controller.signal,
    });
    if (!response.ok) {
      unreachable = `HTTP ${response.status}`;
    } else {
      board = await response.json();
    }
  } catch (error) {
    unreachable = error && error.name === "AbortError" ? "timeout" : "network error";
  } finally {
    clearTimeout(timer);
  }

  let context;
  if (!board) {
    context = [
      `GSPC board: UNREACHABLE (${unreachable}) — no number is presented, and no cached count stands in for a live one.`,
      doctrine(),
    ].join("\n");
  } else {
    const totals = board.totals || {};
    const axes = Array.isArray(board.axes) ? board.axes : [];
    const measured = axes.filter((a) => String(a.status).toUpperCase() === "MEASURED");
    const unmeasured = axes.filter((a) => String(a.status).toUpperCase() !== "MEASURED");
    const separation = totals.separation_public_count || "not stated by this payload";
    context = [
      `GSPC board (live, fetched now) — schema ${board.schema || "unknown"} · source ${URL}`,
      `${totals.public_count || `${axes.length} axes · ${measured.length} measured`} — the first number is slots, the second is measurements; they are never summed.`,
      `Separation: ${separation}`,
      `MEASURED axes: ${measured.map((a) => a.axis).join(", ") || "none"}`,
      `UNMEASURED axes (empty slots, still empty): ${unmeasured.map((a) => a.axis).join(", ") || "none"}`,
      doctrine(),
    ].join("\n");
  }

  const input = await readStdin();
  const eventName = input.hook_event_name || "SessionStart";
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: eventName,
        additionalContext: context,
      },
    }) + "\n"
  );
  process.exit(0);
}

main().catch(() => {
  // Fail open. A hook that cannot speak must not break the session.
  process.exit(0);
});
