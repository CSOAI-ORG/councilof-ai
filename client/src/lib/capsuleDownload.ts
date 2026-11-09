import type { Check, ShardCapsule } from "./serverLookup";

/** Keep the original text: parsing and reserialising it can change numeric lexemes. */
export function capsuleDownload(capsule: ShardCapsule, check: Check | null, exportedAt: string) {
  if (typeof capsule.capsule_json !== "string" || !capsule.capsule_json.trim()) {
    throw new Error("This listing has no original capsule text to save.");
  }
  if (!/^[a-f0-9]{64}$/.test(capsule.capsule_id)) {
    throw new Error("This listing has no valid capsule identifier.");
  }
  const payload = {
    schema: "csoai.capsule-download/1",
    unsigned: true,
    scope: "Local export of original capsule text and an optional browser check. The export and its clock are not signed. It is not a new measurement, approval, or self-contained offline proof.",
    exported_at_browser_clock: exportedAt,
    capsule_id: capsule.capsule_id,
    capsule_json: capsule.capsule_json,
    browser_check: check ?? null,
    browser_check_state: check ? check.outcome : "NOT_RUN",
    recheck: {
      tool: "verify_capsule",
      endpoint: "https://councilof.ai/mcp/free",
      instruction: "Pass the exact capsule_json string to verify_capsule. Rechecking inclusion and the index signature needs the published proof material; this export does not retain that material.",
    },
  };
  return {
    filename: `capsule-${capsule.capsule_id}.json`,
    text: JSON.stringify(payload, null, 2),
  };
}
