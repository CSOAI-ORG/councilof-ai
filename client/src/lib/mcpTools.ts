/**
 * The tool list the /mcp door actually serves, DERIVED from the two files the door reads.
 *
 * WHY THIS EXISTS (2026-09-05). /products and /mcp-fleet each carried the string
 * "board_totals · get_axis · verify_card · list_cards" typed by hand. The door serves ELEVEN
 * tools — seven free and four x402-metered — so both pages understated our own surface by
 * seven, and neither mentioned that a paid surface exists at all. A buyer reading /products to
 * decide whether to call us saw a third of what is there.
 *
 * This is the same defect the Smithery listing has (four of its eight names are tools the door
 * refuses), except that one belongs to a third party and this one was ours to fix. The standing
 * rule is that every number is derived at run time; a typed tool list is a number typed by hand.
 */
import freeTools from "../../../functions/mcp/gspc-tools.json";
import paidTools from "../../../functions/mcp/paid-tools.json";

type ToolDef = { name: string };

export const FREE_TOOL_NAMES: string[] = (freeTools as { tools: ToolDef[] }).tools.map((t) => t.name);
export const PAID_TOOL_NAMES: string[] = (paidTools as { tools: ToolDef[] }).tools.map((t) => t.name);
export const ALL_TOOL_NAMES: string[] = [...FREE_TOOL_NAMES, ...PAID_TOOL_NAMES];

/** The free tools with their titles, in tools/list order (functions/mcp/gspc-tools.json). */
export const FREE_TOOLS: { name: string; title: string | null }[] = (
  freeTools as { tools: { name: string; title?: string }[] }
).tools.map((t) => ({ name: t.name, title: t.title ?? null }));

/**
 * The ONE sentence for tool counts (public audit fix #19, 2026-09-28). /connect-gspc/ said 7 and
 * 13, the home page 16, /connect/claude/ 12 — each true of something, none saying of what. Every
 * number here is an array length of the files the doors serve; functions/mcp/[[path]].ts builds the
 * same sentence for GET /mcp (functions/mcp/tool-counts.test.ts holds the two equal).
 */
export const TOOL_COUNT_SENTENCE = `${FREE_TOOL_NAMES.length} free tools at /mcp/free; ${ALL_TOOL_NAMES.length} at /mcp (${FREE_TOOL_NAMES.length} free + ${PAID_TOOL_NAMES.length} metered). The npm package is versioned separately.`;

/** A short line for a card: the first few names, then an honest count of the rest. */
export function toolSummary(shown = 4): string {
  const head = FREE_TOOL_NAMES.slice(0, shown).join(" · ");
  const rest = ALL_TOOL_NAMES.length - shown;
  return rest > 0 ? `${head} + ${rest} more (${PAID_TOOL_NAMES.length} x402-metered)` : head;
}
