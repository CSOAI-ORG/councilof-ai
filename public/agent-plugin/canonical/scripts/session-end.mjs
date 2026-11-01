#!/usr/bin/env node
/**
 * SessionEnd hook — observation only.
 *
 * Records one line per ended session into the plugin's own writable state directory. It writes no
 * stdout, touches nothing outside PLUGIN_DATA, and never sends or publishes anything.
 */
"use strict";

import fs from "node:fs";
import path from "node:path";

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
  const dataDir = process.env.PLUGIN_DATA || process.env.MINIMAX_PLUGIN_DATA;
  if (!dataDir) {
    process.exit(0);
  }
  const input = await readStdin();
  const record = {
    ts: new Date().toISOString(),
    event: input.hook_event_name || "SessionEnd",
    reason: input.reason || null,
    cwd: input.cwd || null,
    session_id: input.session_id || null,
  };
  try {
    fs.mkdirSync(dataDir, { recursive: true });
    fs.appendFileSync(path.join(dataDir, "sessions.jsonl"), JSON.stringify(record) + "\n");
  } catch {
    // Observation only; a failed write must not break anything.
  }
  process.exit(0);
}

main().catch(() => process.exit(0));
