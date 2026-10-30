#!/usr/bin/env node
/**
 * UserPromptSubmit hook — a nudge, never a block.
 *
 * When a prompt looks like it is about to put something into the world in the owner's name, this
 * injects the gate as context. It never blocks a user instruction and never rewrites a prompt.
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

const OUTWARD = [
  /\bsend\b/i,
  /\bpublish\b/i,
  /\bannounce\b/i,
  /\btweet\b/i,
  /\bmerge\b/i,
  /\bdeploy\b/i,
  /\binvoice\b/i,
  /\bcharge\b/i,
  /\bsettle\b/i,
  /\bx402\b/i,
  /\bgo public\b/i,
  /\bmake (it|the) public\b/i,
];

async function main() {
  const input = await readStdin();
  const eventName = input.hook_event_name || "UserPromptSubmit";
  const prompt = typeof input.prompt === "string" ? input.prompt : "";
  if (!prompt || !OUTWARD.some((pattern) => pattern.test(prompt))) {
    process.exit(0);
  }
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: eventName,
        additionalContext:
          "Outward-gate reminder: agents draft, the owner sends. Nothing leaves in the owner's name without the outward gate at 100% and a line in the sent log. Production changes land by a gated PR to CSOAI-ORG/councilof-ai master with the four required checks green — never --admin, never fewer checks. No public prices. If the request is to publish, send, merge or charge, stage it and say exactly what would leave, where, and in what form.",
      },
    }) + "\n"
  );
  process.exit(0);
}

main().catch(() => process.exit(0));
