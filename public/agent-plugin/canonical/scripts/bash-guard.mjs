#!/usr/bin/env node
/**
 * PreToolUse(bash) guard.
 *
 * It enforces two binding rules that belong to the code, not to a human's memory:
 *   1. Nobody reduces checks and nobody merges with --admin.
 *   2. Outward actions in the owner's name are gated.
 *
 * Rule 1 is a hard DENY. Rule 2 is context only — it reminds, it never blocks, because the owner
 * is the only one who may send, publish or merge.
 *
 * It never sends, publishes, merges or spends anything.
 */
"use strict";

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

// Rule 1 — hard deny. Bypassing the required checks is never allowed.
const DENY_RULES = [
  {
    id: "no-admin-merge",
    test: (cmd) => /gh\s+pr\s+merge\b/i.test(cmd) && /(^|\s)--admin(\s|$|=)/i.test(cmd),
    reason:
      "Blocked: merging with --admin bypasses the required checks on master. Production changes land by a gated PR with the four required checks green. Open the PR and let the checks run.",
  },
  {
    id: "no-check-removal",
    test: (cmd) =>
      /gh\s+api\b/i.test(cmd) &&
      /required_status_checks|branch[_/]protection/i.test(cmd) &&
      /(-X\s*DELETE|\bmethod:\s*DELETE\b|\bDELETE\b)/i.test(cmd),
    reason:
      "Blocked: deleting required status checks or branch protection reduces the gate. Nobody reduces checks. Add a check or change the workflow, never the protection.",
  },
];

// Rule 2 — context only.
const OUTWARD_PATTERNS = [
  /\bhimalaya\b[\s\S]*\bsend\b/i,
  /\bgh\s+pr\s+merge\b/i,
  /\bgit\s+push\b/i,
  /\bnpm\s+publish\b/i,
  /\bwrangler\s+(publish|deploy)\b/i,
  /\b(website_deploy|publish_site|deploy_site)\b/i,
  /\bcurl\b[\s\S]*\b(-X\s*POST\b|--data|-d\s)[\s\S]*\b(publish|send|attest|request-attestation)\b/i,
];

async function main() {
  const input = await readStdin();
  const eventName = input.hook_event_name || "PreToolUse";
  const toolInput = input.tool_input || {};
  const command = typeof toolInput.command === "string" ? toolInput.command : "";
  if (!command) {
    process.exit(0);
  }

  for (const rule of DENY_RULES) {
    if (rule.test(command)) {
      process.stdout.write(
        JSON.stringify({
          hookSpecificOutput: {
            hookEventName: eventName,
            permissionDecision: "deny",
            permissionDecisionReason: rule.reason,
          },
        }) + "\n"
      );
      process.exit(0);
    }
  }

  if (OUTWARD_PATTERNS.some((pattern) => pattern.test(command))) {
    process.stdout.write(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: eventName,
          additionalContext:
            "This command looks outward-facing (send, publish, merge or deploy). The gate applies: agents draft, the owner sends. Production changes land by a gated PR to master with the four required checks green, never --admin. Nothing leaves in the owner's name without the outward gate and a line in the sent log. Confirm before running, and say plainly what will leave and where.",
        },
      }) + "\n"
    );
  }
  process.exit(0);
}

main().catch(() => process.exit(0));
