/**
 * Permissionless revenue — sell work, never rank.
 *
 * Agents already reach the board. Enterprise already has a RAS pack schema.
 * x402 already names the charge: assembly. The missing piece is custody
 * (payTo), not a new token, not a mined coin, not a fused SOV grade.
 *
 * Live 2026-08-30: x402 card has no payTo. pack.councilof.ai/v1/pack/assemble
 * is 404. A2A agent-card is live; task service is not. npm csoai-gspc-mcp
 * 0.1.0. Official MCP id io.github.CSOAI-ORG/gspc. Evidence pack
 * csoai.insurability-evidence-pack/0.1 is 200. 100 free calls/day is the
 * typed allowance. Machine-access pricing is pending a published ruling.
 */

export type EarnWhen = "now" | "after-payto" | "after-100" | "never";

export type Opening = {
  id: string;
  when: EarnWhen;
  title: string;
  eats: string;
  never: string;
  feed: string;
  href: string;
};

export const EARN_RULING =
  "Earn by assembling and licensing work. Do not mint, mine or coupon a grade.";

export const EARN_WEDGE =
  "Every host that can verify is a cash register for assembly the moment settlement exists. Until then, the same assembly invoices on enquiry.";

export const OPEN_SDKS = [
  { id: "mcp-http", href: "https://councilof.ai/mcp", eats: "Four read tools in Claude, Cursor, Kimi, Grok." },
  { id: "npm", href: "https://www.npmjs.com/package/csoai-gspc-mcp", eats: "stdio SDK. Latest 0.1.0. Same four tools." },
  { id: "registry", href: "https://registry.modelcontextprotocol.io", eats: "Official id io.github.CSOAI-ORG/gspc v1.0.3." },
  { id: "plugin", href: "https://github.com/CSOAI-ORG/councilof-ai/tree/master/plugins/gspc", eats: "Grok / Cursor plugin. Consent first." },
  { id: "embed", href: "https://councilof.ai/embed.js", eats: "Partner pages read the live count. Never says certified." },
  { id: "badge", href: "https://councilof.ai/api/badge?style=hf&size=md", eats: "README flag. Measurement state, not a stamp." },
  { id: "a2a-card", href: "https://councilof.ai/.well-known/agent-card.json", eats: "Discovery. Four skills. Task service still planned." },
  { id: "x402-card", href: "https://councilof.ai/.well-known/x402.json", eats: "Agents already speak 402. Charge assembly. Board stays free." },
  { id: "ras-pack", href: "https://councilof.ai/api/evidence-pack", eats: "csoai.insurability-evidence-pack/0.1 — four-class mapping, live." },
  { id: "eunomia", href: "https://councilof.ai/eunomia-data", eats: "Data-only lane: enforcement record and deadlines. Never scores." },
  { id: "index", href: "https://councilof.ai/signals/sov-signal.signed.json", eats: "Row-count index. Licence the SLA, not a coupon." },
  { id: "hf-record", href: "https://huggingface.co/csoai", eats: "76 listed datasets, 34 Spaces. Append Parquet. Do not spray repos." },
] as const;

export const OPENINGS: Opening[] = [
  {
    id: "enquiry-skus",
    when: "now",
    title: "Invoice the four SKUs",
    eats: "Run / re-attest, Ledger packs, Data licences. Verify stays free and pulls the queue.",
    never: "A purchased public rank. A fifth SKU.",
    feed: "Open SDKs + /products + /licensing-agreement",
    href: "/licensing-agreement",
  },
  {
    id: "ras-refresh",
    when: "now",
    title: "Refresh the RAS pack",
    eats: "The four-class insurability pack is already public. Enterprises pay for a dated refresh when the subject or the law moves.",
    never: "A parametric trigger. An underwrite. A share of a card.",
    feed: "GET /api/evidence-pack + /insurers",
    href: "/api/evidence-pack",
  },
  {
    id: "census-data",
    when: "now",
    title: "Sell the census, not two million scores",
    eats: "Speed 0 Hub walk: DISCOVERED ids, eligibility, digest collisions. Procurement and insurers buy coverage of their vendor list.",
    never: "Stamping hub-queue MEASURED. Claiming we scored the Hub.",
    feed: "Hub list_models + blobs=true. Write to the HF corpus after Card v2.",
    href: "https://huggingface.co/datasets/csoai/hub-queue",
  },
  {
    id: "corrections-sla",
    when: "now",
    title: "Licence the honesty feed",
    eats: "Corrections + EUNOMIA deadlines as a webhook / SLA. Competitors cannot fake a retraction history.",
    never: "A GSPC score. A highlight reel.",
    feed: "GET /api/corrections · /eunomia-data",
    href: "/api/corrections",
  },
  {
    id: "sdk-funnel",
    when: "now",
    title: "Feed every open SDK we already planted",
    eats: "npm, MCP HTTP, official registry, plugin, embed, badge, agent-card. Free verify in the host. Paid work is assemble / re-attest / data.",
    never: "A second first-party MCP product. Chat harvest.",
    feed: OPEN_SDKS.map((s) => s.id).join(" · "),
    href: "/tools",
  },
  {
    id: "x402-assemble",
    when: "after-payto",
    title: "Settle x402 for pack assembly",
    eats: "Agents pay USDC on Base to assemble a pack. 100 free calls/day stay free. Machine-access pricing waits for a published ruling.",
    never: "pay-to-pass. A score. An invented payTo from this VM.",
    feed: "csoai.x402/0.1 · resource pack assemble (today 404 until custody)",
    href: "https://councilof.ai/.well-known/x402.json",
  },
  {
    id: "a2a-tasks",
    when: "after-payto",
    title: "A2A paid tasks",
    eats: "Turn the live agent-card into real tasks: assemble pack, re-attest digest, fetch a dated census slice.",
    never: "Certification as a skill. MCP listed as if it were the task service.",
    feed: "/.well-known/agent-card.json — four skills, no streaming, no push.",
    href: "https://councilof.ai/.well-known/agent-card.json",
  },
  {
    id: "flags-after-100",
    when: "after-100",
    title: "Permissionless flags after 100/100 A+++",
    eats: "Same receipts on Kaggle, ModelScope, Zenodo, GHCR. More hosts, more verify, more assembly.",
    never: "A 2-million-model inference sweep.",
    feed: "/tools hundred-gate",
    href: "/tools",
  },
  {
    id: "rerun-work",
    when: "after-100",
    title: "Sell independent reruns",
    eats: "A stranger pays for a second-provider rerun of a signed digest. Work, not a new rank.",
    never: "Shared Kaggle / Colab / ZeroGPU quotas.",
    feed: "Card v2 + GHCR harness pin + labelled Council-run vs reproduced",
    href: "/assess",
  },
  {
    id: "attester-not-issuer",
    when: "after-payto",
    title: "Be the attester others mint against",
    eats: "T-REX / XRPL partners may point a token at a digest we already signed. We take an attester fee for the pointer, never the coupon.",
    never: "Council as issuer, miner, or SOV token house.",
    feed: "/xrpl-attest DEVNET now. Partner issuer later. No invented r-address.",
    href: "/xrpl-attest",
  },
  {
    id: "mint-sov",
    when: "never",
    title: "Mint or mine a SOV / GAT / release-bond token",
    eats: "Nothing. A weighted average of scores is not a market we issue.",
    never: "XRP mining, score coupons, on-chain MEASURED, invented payTo.",
    feed: "csoai.sov-signal-index/1 counts rows.",
    href: "https://councilof.ai/signals/sov-signal.signed.json",
  },
];

export function openingsWhen(when: EarnWhen): Opening[] {
  return OPENINGS.filter((o) => o.when === when);
}

export function earnableNow(): Opening[] {
  return openingsWhen("now");
}
