/**
 * Signed Council agent vs signed subjects — two different permissions.
 *
 * Agreed: one Council identity, many N-site drop points. Hosts do not ask
 * us to paste https://councilof.ai/mcp. We do not ask each host for a
 * partnership to list that URL. The same badge, embed, agent-card and
 * verify door travel as we scale.
 *
 * Better: bind the discovery JSON to the planted did:web so a stranger
 * can tell Council from a spoof. Today the agent-card and mcp.json are
 * unsigned fetches. Cards already pin did:web:csoai.org#card-attestation-1.
 * Do not invent a key. Do not put MCP back on the DID until the live
 * door is the one we advertise (the worker service was removed 2026-08-19
 * because GET returned 404).
 *
 * Not agreed: auto-sign every discovered Hub agent or model. Speed 0
 * auto-lists DISCOVERED. MEASURED is never automatic.
 */

export type TravelLane = {
  id: string;
  title: string;
  auto: boolean;
  needs_permission: boolean;
  does: string;
  never: string;
};

export const AGENT_TRAVEL_RULING =
  "Sign Council once. Plant the same agent everywhere. Do not auto-sign the subjects we discover.";

export const AGENT_TRAVEL_AGREED =
  "N-sites scale is permissionless for our signed receipts. Any host may add the MCP URL. We auto-walk listings as DISCOVERED and auto-drop the same flags. We do not auto-MEASURED.";

export const AGENT_TRAVEL_BETTER =
  "Bind /.well-known/agent-card.json and /.well-known/mcp.json to did:web:csoai.org so the agent itself verifies, the way a 3 KB card already does. Use a planted key. Do not mint a per-site agent.";

export const PLANTED_IDENTITY = {
  did: "did:web:csoai.org",
  card_pin: "did:web:csoai.org#card-attestation-1",
  mcp: "https://councilof.ai/mcp",
  agent_card: "https://councilof.ai/.well-known/agent-card.json",
  mcp_well_known: "https://councilof.ai/.well-known/mcp.json",
  agent_card_signed: false,
  mcp_json_signed: false,
  did_advertises_mcp: false,
  did_mcp_note:
    "MCP was removed from the DID on 2026-08-19 after the advertised worker 404ed. It returns only with a live door.",
} as const;

export const TRAVEL_LANES: TravelLane[] = [
  {
    id: "council-agent",
    title: "Council agent identity",
    auto: true,
    needs_permission: false,
    does: "One did:web. Same MCP URL, agent-card, badge and embed on every new surface.",
    never: "A new agent repo or a new key per host.",
  },
  {
    id: "host-paste",
    title: "Host adds gspc",
    auto: false,
    needs_permission: false,
    does: "Claude, Cursor, Kimi, Grok paste the URL. Consent is the user’s, not a Council licence.",
    never: "A partnership ticket before the snippet works.",
  },
  {
    id: "census",
    title: "Speed 0 census",
    auto: true,
    needs_permission: false,
    does: "Hub API walk. Eligibility state. Listings stay DISCOVERED.",
    never: "An automatic MEASURED stamp on a discovered agent.",
  },
  {
    id: "flags",
    title: "N-site flags after 100/100",
    auto: true,
    needs_permission: false,
    does: "Plant the same receipts on the next host. No second product meeting.",
    never: "Mass-PR or auto-email to every model author.",
  },
  {
    id: "subject-cell",
    title: "Sign a subject",
    auto: false,
    needs_permission: true,
    does: "Intake, practice screen, bolted instrument, separate signer. Then a cell.",
    never: "Auto-signing every agent the census sees.",
  },
  {
    id: "publisher",
    title: "Publisher thread",
    auto: false,
    needs_permission: true,
    does: "Optional discussion on the exact revision after a real cell.",
    never: "A bot that signs their README because we listed them.",
  },
];

export function autoWithoutPermission(): TravelLane[] {
  return TRAVEL_LANES.filter((l) => l.auto && !l.needs_permission);
}

export function mustStayGated(): TravelLane[] {
  return TRAVEL_LANES.filter((l) => !l.auto || l.needs_permission);
}
