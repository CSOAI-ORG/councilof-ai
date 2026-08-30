/**
 * Bloomberg-for-governance — what to steal, what we forgot, what the moat is.
 *
 * Bloomberg’s moat is dated exclusive data, keyboard functions, watchlists,
 * citations, and habit. ASKB sits on that data; they do not publish an
 * external trust score for their own AI. GRC vendors (Credo, IBM TRiSM)
 * sell inventory plus policy stamps. We do not become them.
 *
 * Learn backends: Hugging Face list + blobs=true; Bloomberg mnemonics and
 * reproducible queries; our own verify script as the BQL. Do not learn
 * fused “trust scores” or ISO 42001 as the product.
 */

export type TerminalRow = {
  id: string;
  kind: "moat" | "forgot" | "steal" | "never";
  title: string;
  does: string;
};

export const TERMINAL_RULING =
  "The terminal is a keyboard on the signed chart. The moat is the chart, not the chrome.";

export const TERMINAL_PITCH =
  "A Bloomberg-style pane for AI governance: type a function, get a dated vital sign, verify it offline. Not a trust-score terminal.";

export const TERMINAL_ROWS: TerminalRow[] = [
  {
    id: "moat-corrections",
    kind: "moat",
    title: "Corrections ledger",
    does: "Thirty dated addenda. A competitor cannot fake having been wrong in public.",
  },
  {
    id: "moat-empty",
    kind: "moat",
    title: "Empty slots published",
    does: "Seven deferred systems on a 22-slot chart. Most GRC tools hide the gap.",
  },
  {
    id: "moat-verify",
    kind: "moat",
    title: "Offline verify",
    does: "Stranger, no login, did:web pin. Bloomberg cites a source; we let them recompute it.",
  },
  {
    id: "moat-mcp",
    kind: "moat",
    title: "Already in the hosts",
    does: "Four tools in Claude, Cursor, Kimi, Grok. The terminal is already where agents work.",
  },
  {
    id: "moat-census",
    kind: "moat",
    title: "Census of millions without weights",
    does: "Hub list + blobs=true. DISCOVERED coverage they cannot honestly claim as scores.",
  },
  {
    id: "forgot-mnemonics",
    kind: "forgot",
    title: "Keyboard functions",
    does: "Home and /os boxes read VERIFY · BOARD · AXIS · CENSUS · CORRECT · WATCH. One line, like DES or GP.",
  },
  {
    id: "forgot-watchlist",
    kind: "forgot",
    title: "Vendor watchlist + digest alerts",
    does: "/tools watchlist: paste owner/name ids, compare Hub sha256 locally. DISCOVERED only.",
  },
  {
    id: "forgot-one-box",
    kind: "forgot",
    title: "One paste box",
    does: "The home box accepts card JSON or owner/name. Chart or census row. Same functions on /os.",
  },
  {
    id: "forgot-bind-did",
    kind: "forgot",
    title: "Sign the agent-card and mcp.json",
    does: "Bind well-known discovery to planted did:web. Hosts can tell Council from a spoof.",
  },
  {
    id: "forgot-stale-copy",
    kind: "forgot",
    title: "Stale inner copy",
    does: "Source pack no longer types a 13-axis product; cite GET /api/gspc. mcp.json measured and planted both name board_totals · get_axis · verify_card · list_cards.",
  },
  {
    id: "forgot-settle",
    kind: "forgot",
    title: "Custody / assemble",
    does: "x402 names assembly. pack assemble is 404. payTo is absent. Do not invent a receiver.",
  },
  {
    id: "forgot-card-v2",
    kind: "forgot",
    title: "Card v2 + signed census + sandbox + signer",
    does: "The 100/100 gate. Without these the terminal has nothing new to show.",
  },
  {
    id: "steal-hf",
    kind: "steal",
    title: "Hugging Face backend",
    does: "Cursor pagination, blobs=true sha256, siblings. That is Speed 0. Already the census rail.",
  },
  {
    id: "steal-bberg",
    kind: "steal",
    title: "Bloomberg habit",
    does: "Functions, watchlists, citations, reproducible query. ASKB sits on data — it is not the moat. Chat is a skin.",
  },
  {
    id: "steal-bql",
    kind: "steal",
    title: "BQL analogue",
    does: "Our /signed/verify-card.mjs and how-to-verify. Every number ships with the command that rechecks it.",
  },
  {
    id: "steal-inventory",
    kind: "steal",
    title: "GRC inventory, not their stamp",
    does: "Credo/IBM sell agent registries and ISO maps. Steal the inventory habit. Keep east-west as a pair-gap. Do not sell ISO 42001.",
  },
  {
    id: "never-trust-score",
    kind: "never",
    title: "Trust-score terminal",
    does: "A NEWS/TRiSM pane that averages vital signs into ‘healthy 0.8’. That is the product we refuse.",
  },
];

export function rowsByKind(kind: TerminalRow["kind"]): TerminalRow[] {
  return TERMINAL_ROWS.filter((r) => r.kind === kind);
}
