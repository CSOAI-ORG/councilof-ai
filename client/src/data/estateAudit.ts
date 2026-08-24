/**
 * Living estate audit — crown jewels we have, gaps we have not built,
 * and every competing front end that still renders.
 *
 * Keep this file honest. If a surface is DESIGN or 503, say so here.
 */

export type Register = "LIVE" | "DEMO" | "DESIGN" | "FROZEN" | "COMPETING";

export type EstateRow = {
  id: string;
  title: string;
  href: string;
  register: Register;
  note: string;
};

export const CROWN_JEWELS: EstateRow[] = [
  {
    id: "gspc-board",
    title: "Signed GSPC board",
    href: "/gspc-scoreboard",
    register: "LIVE",
    note: "Measured axes with empty cells left empty. Verify in-browser.",
  },
  {
    id: "receipt-spec",
    title: "RECEIPT-SPEC measurement cards",
    href: "/receipt-spec",
    register: "LIVE",
    note: "Ed25519 envelope. Strangers check without trusting us — when the board key is live.",
  },
  {
    id: "instruments",
    title: "Instruments / Eunomia catalog",
    href: "/instruments",
    register: "LIVE",
    note: "Governance instruments, not LLM providers. Try-in-chat seeds a typed prompt.",
  },
  {
    id: "council-os",
    title: "Council OS dock",
    href: "/os",
    register: "LIVE",
    note: "OpenRouter-style workspace. Conversion CTAs call openLobby. Prompts are typed, never auto-sent.",
  },
  {
    id: "product-chrome",
    title: "Product header + estate bar",
    href: "/",
    register: "LIVE",
    note: "Top: Search, Home, Models, Benchmarks, Chat, Rankings, Apps, Enterprise, Docs. Bottom: the old mega-menu. Nothing dropped.",
  },
  {
    id: "live-training",
    title: "Frozen to fluid Art. 4 sim",
    href: "/live-training",
    register: "DEMO",
    note: "Verified training-outcome records, hash-chained locally. UNSIGNED until the board-attestation key signs. Never a certificate.",
  },
  {
    id: "training-loop-api",
    title: "Training-loop public JSON",
    href: "/api/training-loop",
    register: "LIVE",
    note: "Grammar, change-cards, bundles. Unsigned unless BOARD_SIGN_KEY_PKCS8_B64 is set.",
  },
  {
    id: "mcp-catalogue",
    title: "MCP catalogue API",
    href: "/api/mcp",
    register: "LIVE",
    note: "Static snapshot of first-party tool groups. Not a live MCP session inside chat.",
  },
  {
    id: "well-known-mcp",
    title: ".well-known/mcp.json",
    href: "/.well-known/mcp.json",
    register: "DESIGN",
    note: "Honest empty servers list until a first-party MCP endpoint is redeployed. Does not advertise a dead worker.",
  },
];

export const GAPS: EstateRow[] = [
  {
    id: "ed25519-training",
    title: "Ed25519 on training-outcome cards",
    href: "/live-training",
    register: "DESIGN",
    note: "Same posture as /api/regulation: no key, no signature field. Hash chain is integrity, not attestation.",
  },
  {
    id: "signed-replay",
    title: "Signed game replay",
    href: "/live-training",
    register: "DESIGN",
    note: "IK whitespace: append-only action log + seed + predicate. Not shipped.",
  },
  {
    id: "change-card-notify",
    title: "Corpus to change-card to stale-record notify",
    href: "/api/training-loop",
    register: "DESIGN",
    note: "AG-UI should tell named learners which record is stale. Feed describes the loop; it does not push yet.",
  },
  {
    id: "agui-wire",
    title: "AG-UI wire inside Council OS chat",
    href: "/api/agui/session",
    register: "DESIGN",
    note: "POST /api/agui/session returns 503 until AGUI_WIRE_URL is set on Pages. Consent checkpoints stay visible when live.",
  },
  {
    id: "mcp-in-chat",
    title: "MCP tools callable from AG-UI chat",
    href: "/mcp-fleet",
    register: "DESIGN",
    note: "Instrument cards exist. Other platforms cannot load Council as MCP until well-known advertises a live server.",
  },
  {
    id: "cesium-a2a",
    title: "Cesium 3D and A2A inside AG-UI",
    href: "/gspc-arena",
    register: "DESIGN",
    note: "Arena and globe pages exist as site routes. They are not in-chat AG-UI widgets yet.",
  },
  {
    id: "one-trust-root",
    title: "One trust-root for training copy",
    href: "/estate",
    register: "FROZEN",
    note: "/training, /certification, /training-hub still sell LMS/credential language. Banners point at /live-training.",
  },
  {
    id: "meok-firewall-copy",
    title: "MEOK delivers / Council measures — on every training surface",
    href: "/live-training",
    register: "DEMO",
    note: "Live-training page states the firewall. Frozen rails need the same sentence, not a certificate CTA.",
  },
];

export const FRONT_ENDS: EstateRow[] = [
  { id: "home", title: "Canonical home", href: "/", register: "LIVE", note: "NewHome-v3. Conversion CTAs open Council OS." },
  { id: "home-v2", title: "Home v2", href: "/home-v2", register: "COMPETING", note: "Kept. Do not delete. Prefer / for new links." },
  { id: "welcome", title: "Welcome", href: "/welcome", register: "COMPETING", note: "Enter-your-OS still opens the dock. Kept as an onboarding rail." },
  { id: "marketing", title: "Marketing home", href: "/marketing", register: "COMPETING", note: "Legacy marketing shell. Footer map still lists the estate." },
  { id: "public", title: "Public home", href: "/public", register: "COMPETING", note: "Public dashboard twin. Not the canonical story." },
  { id: "os", title: "Council OS Refinery", href: "/os", register: "LIVE", note: "Opens the dock; site column is the product map." },
  { id: "demo", title: "Demo OS", href: "/demo", register: "LIVE", note: "Full-screen demo. /os-demo redirects here or to /os." },
  { id: "academy", title: "Sovereign Academy", href: "/academy", register: "FROZEN", note: "Journey UI. Living product is /live-training." },
  { id: "training", title: "Training v2", href: "/training", register: "FROZEN", note: "Free LMS catalogue. Banner to live sim." },
  { id: "certification", title: "Certification v2", href: "/certification", register: "FROZEN", note: "Completion records, not conformity marks. Banner to live sim." },
  { id: "training-hub", title: "Training hub games", href: "/training-hub", register: "FROZEN", note: "Includes Council City. Player counts must stay honest or empty." },
];
