// MCP Registry entry texts for ai.councilof/gspc and ai.councilof/gspc-free (render.mjs, section 1).
//
// A registry entry is frozen once it is published: "Once published, the version string (and other
// metadata) cannot be changed" (https://modelcontextprotocol.io/registry/versioning). A tool count or a
// list of tool names in an entry is therefore true only until the next tool change. ai.councilof/gspc
// 1.4.4 said "19 tools (14 free, 5 x402-metered)" from 2026-09-30 until 2026-11-21, while the door grew
// to 54 tools under that same version.
//
// From the version after 1.5.0, the entries name kinds of tool, with no number and no list, and point at
// tools/list. 1.5.0 itself was published with counts and a name list on 2026-11-21, and the owner ruled
// the same day that the count-free texts start with the next gateway version ("Next version + entry").
// While the version is still 1.5.0, registryEntryText() returns what was published as 1.5.0, so the
// repository never holds a 1.5.0 entry that differs from the registry's and could not be published.
export const PUBLISHED_WITH_COUNTS = "1.5.0";

export const TOOLS_POINTER =
  "This entry states no tool count and no tool list. Call tools/list on the remote for the current set.";

export const COUNT_FREE_TEXT = Object.freeze({
  gspc: "Signed AI measurements over MCP: board and axis readers, free card verify, x402-metered evidence.",
  gspcFree: "Free read-only tools: GSPC board, per-axis readers, signed card and capsule verify, Merkle proofs.",
});

// Ed25519 and x402 are names. Any other digit in a description is a count or a version.
export const namesNoNumber = (text) => !/\d/.test(text.replace(/\bEd25519\b|\bx402\b/gi, ""));

const MAX_DESCRIPTION = 100; // ServerDetail.description.maxLength in the 2025-12-11 schema
const fit = (label, text) => {
  if (text.length > MAX_DESCRIPTION) throw new Error(`${label} is ${text.length} chars; the 2025-12-11 schema allows ${MAX_DESCRIPTION}`);
  return text;
};

export function registryEntryText(version, { fleetLine, freeIds, paidIds, servedFree }) {
  if (version === PUBLISHED_WITH_COUNTS) {
    return {
      gspc: {
        description: fit("registry description", `${fleetLine}: GSPC board, evidence, Ed25519 card verify. Measurement only.`),
        tools: { "ai.councilof/fleet": { free: freeIds, paid: paidIds } },
      },
      gspcFree: {
        description: fit("free registry description",
          `${servedFree.length} free read-only tools: GSPC board, signed card and capsule verify, Merkle proofs, route.`),
        tools: { "ai.councilof/fleet": { free: servedFree, paid: [] } },
      },
    };
  }
  for (const [name, text] of Object.entries(COUNT_FREE_TEXT)) {
    fit(`${name} registry description`, text);
    if (!namesNoNumber(text)) throw new Error(`${name} registry description names a number: ${text}`);
  }
  return {
    gspc: { description: COUNT_FREE_TEXT.gspc, tools: { "ai.councilof/tools": TOOLS_POINTER } },
    gspcFree: { description: COUNT_FREE_TEXT.gspcFree, tools: { "ai.councilof/tools": TOOLS_POINTER } },
  };
}
