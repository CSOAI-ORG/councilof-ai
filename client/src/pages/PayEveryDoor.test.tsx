import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { Router } from "wouter";
import { describe, expect, it } from "vitest";
import PayEveryDoor, { DoorCard, Index402Cell, OutcomeLine, SettleCell } from "./PayEveryDoor";
import {
  DELIST_RISK_DAYS,
  THE_LINE,
  challengeFromPaymentRequired,
  doorsFromManifest,
  index402For,
  settleFor,
  type Door,
  type DoorSettlesReading,
  type Index402Reading,
} from "@/lib/payEveryDoor";
import { PRIMARY_PATHS } from "@/data/library-ia";
import { ROUTE_MANIFEST } from "@/data/route-manifest";
import { ROUTE_HEAD, DESCRIPTION_MAX, DESCRIPTION_MIN, TITLE_MAX } from "@/lib/seoHead";

/**
 * The page is rendered statically: effects do not run, so what is judged here is the copy the
 * page ships before any door answers, plus every outcome state rendered on its own. No banned
 * display string, no typed amount, no typed door count — those come from the live manifest and
 * each door's live 402, or they do not appear.
 */

const ROOT = resolve(__dirname, "../../..");
const pageSource = readFileSync(resolve(__dirname, "PayEveryDoor.tsx"), "utf8");
const libSource = readFileSync(resolve(__dirname, "../lib/payEveryDoor.ts"), "utf8");
const appSource = readFileSync(resolve(ROOT, "client/src/App.tsx"), "utf8");
const prerenderSource = readFileSync(resolve(ROOT, "scripts/prerender.mjs"), "utf8");

// Banned as OUR claim on a public surface — brand-gate's list, plus the two doctrine bans this
// page must never need a retraction form for.
const BANNED = [/certif/i, /\bsovereign\b/i, /\bBFT\b/, /byzantine/i, /defoneos/i];
// A typed price, in any spelling this estate has caught before.
const TYPED_AMOUNT = [/[£$€]\s?\d/, /\d\s?USDC\b/i, /USDC\s?\d/i, /\b\d+\s+atomic units\b/];
// A typed door count.
const TYPED_COUNT = /\b(?:eleven|11|nine|9|ten|10|twelve|12)\s+doors?\b/i;

const doors: Door[] = doorsFromManifest({
  resources: [
    { method: "GET", url: "https://councilof.ai/api/free-door", paid_for: null, description: "the free door" },
    { method: "GET", url: "https://councilof.ai/api/proof?bundle=1", paid_for: "assembly", description: "a proof bundle" },
    { method: "GET", url: "https://councilof.ai/api/pop/stablecoins", paid_for: "issuance", description: "a population door", free_preview: "https://councilof.ai/api/pop/stablecoins?preview=1" },
  ],
});
const NOW = Date.parse("2026-09-22T14:00:00.000Z");
const DAY = 24 * 60 * 60 * 1000;
const iso = (msAgo: number) => new Date(NOW - msAgo).toISOString();
const INDEX402: Index402Reading = {
  kind: "MEASURED",
  as_of: "2026-09-22T14:08:21Z",
  index: { name: "402 Index", url: "https://402index.io/api/v1/services", query: "councilof.ai" },
  declared_total: 112,
  scanned: 112,
  absence_determinate: true,
  rows: [{ url: "https://councilof.ai/api/proof?bundle=1", route_key: "https://councilof.ai/api/proof", health_status: "healthy", last_checked: "2026-09-22 08:35:46", domain_verified: false }],
  reason: null,
};
const SETTLES: DoorSettlesReading = {
  kind: "MEASURED",
  as_of: "2026-09-22T14:08:21Z",
  rows: [
    { resource: "https://councilof.ai/api/proof?bundle=1", last_settle: iso(3 * DAY), tx: `0x${"ab".repeat(32)}`, network: "eip155:8453", self: true, settles: 2 },
    { resource: "https://councilof.ai/api/pop/stablecoins", last_settle: iso(25 * DAY), tx: null, network: null, self: false, settles: 1 },
  ],
  reason: null,
};
const challenge = challengeFromPaymentRequired({
  x402Version: 2,
  resource: { url: doors[1].url, description: "a proof bundle", mimeType: "application/json" },
  accepts: [
    {
      scheme: "exact",
      network: "eip155:8453",
      amount: "20000",
      asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      payTo: "0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31",
      maxTimeoutSeconds: 300,
      extra: { name: "USD Coin", version: "2", decimals: 6, symbol: "USDC" },
    },
  ],
})!;

const strip = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

describe("/pay-all ships clean copy", () => {
  const page = renderToStaticMarkup(
    <Router ssrPath="/pay-all">
      <PayEveryDoor />
    </Router>,
  );

  it("carries the one line verbatim", () => {
    expect(THE_LINE).toBe(
      "A successful payment can create a facilitator settlement record. PayAI and 402 Index listings are checked separately. This page never holds a key.",
    );
    expect(page.replace(/&#x27;/g, "'")).toContain(THE_LINE);
  });

  it("renders no banned string, no typed amount and no typed door count", () => {
    for (const re of BANNED) {
      expect(page, `page: ${re}`).not.toMatch(re);
      expect(strip(pageSource), `source: ${re}`).not.toMatch(re);
      expect(strip(libSource), `lib: ${re}`).not.toMatch(re);
    }
    for (const re of TYPED_AMOUNT) {
      expect(page, `page: ${re}`).not.toMatch(re);
      expect(strip(pageSource), `source: ${re}`).not.toMatch(re);
      expect(strip(libSource), `lib: ${re}`).not.toMatch(re);
    }
    expect(page).not.toMatch(TYPED_COUNT);
    expect(strip(pageSource)).not.toMatch(TYPED_COUNT);
  });

  it("never asks for or names a private key or seed phrase as an input", () => {
    expect(strip(pageSource)).not.toMatch(/private[_ -]?key\s*[:=]|seed phrase\s*[:=]|<input/i);
    expect(strip(libSource)).not.toMatch(/privateKey|private_key|mnemonic/);
  });

  it("reads the manifest and the index live rather than importing a list", () => {
    expect(strip(pageSource)).toContain("fetch(MANIFEST_PATH");
    expect(strip(pageSource)).toContain("fetch(LISTING_PATH");
    expect(strip(pageSource)).not.toMatch(/import .*x402\.json/);
  });

  it("names the wallet path it shares with X402PayButton, function for function", () => {
    expect(strip(libSource)).toContain("buildTypedData(challenge, PREFLIGHT_SIGNER)");
    expect(strip(libSource)).toContain("signX402Challenge(provider, challenge)");
    expect(strip(libSource)).toContain("classifyPayError(error)");
    expect(strip(pageSource)).toContain("discoverEIP6963()");
  });
});

describe("every outcome renders as itself", () => {
  const card = (state: Parameters<typeof OutcomeLine>[0]["state"]) =>
    renderToStaticMarkup(
      <DoorCard
        door={doors[1]}
        quote={{ kind: "challenge", http: 402, challenge, body: {} }}
        state={state}
        listing={{ status: "LISTED", lastUpdated: "2026-09-07T04:58:52.174Z", asOf: "2026-09-22T13:00:00Z", amount: "20000", maxTimeoutSeconds: 600 }}
        index402={index402For(doors[1], INDEX402)}
        settle={settleFor(doors[1], SETTLES)}
        now={NOW}
        busy={false}
        onPay={() => {}}
      />,
    );

  it("shows the live challenge's terms as the challenge states them", () => {
    const html = card({ kind: "idle" });
    expect(html).toContain("0.02 USDC (20000 atomic units)");
    expect(html).toContain("eip155:8453");
    expect(html).toContain("(chain 8453)");
    expect(html).toContain("0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31");
    expect(html).toContain('data-testid="pay-with-wallet"');
    expect(html).toContain("LISTED");
    expect(html).toContain("2026-09-07T04:58:52.174Z");
  });

  it("UNSETTLED quotes the facilitator's reason verbatim", () => {
    const reason = "facilitator settle failed: invalid_exact_evm_insufficient_balance";
    const html = card({ kind: "unsettled", reason });
    expect(html).toContain("UNSETTLED.");
    expect(html).toContain("answered 402 again");
    expect(html).toContain(reason);
  });

  it("REJECTED says nothing was charged and still offers the button, not a retry", () => {
    const html = card({ kind: "rejected", detail: "You declined the signature in your wallet. Nothing was sent and nothing was charged." });
    expect(html).toContain("REJECTED.");
    expect(html).toContain("nothing was charged");
    expect(html).toContain('data-testid="pay-with-wallet"');
    expect(html).not.toMatch(/retry(?:ing)?\b/i);
  });

  it("DELIVERED shows the settle reference the door echoed, and says when it echoed none", () => {
    const tx = `0x${"ef".repeat(32)}`;
    const withReceipt = card({
      kind: "delivered",
      paymentResponse: "opaque",
      settlement: { transaction: tx, network: "eip155:8453", payer: "0x4dB7ff00ff00ff00ff00ff00ff00ff00ff0002B7", success: true },
    });
    expect(withReceipt).toContain("DELIVERED.");
    expect(withReceipt).toContain(`https://basescan.org/tx/${tx}`);
    expect(withReceipt).toContain("verified by nothing on this page");
    expect(withReceipt).not.toContain('data-testid="pay-with-wallet"');
    const without = card({ kind: "delivered", paymentResponse: null, settlement: null });
    expect(without).toContain("Delivery is not proof of settlement");
  });

  it("DELIVERED keeps what was bought: the signed record's id, a download, the free check and My results", () => {
    const sha = "ab".repeat(32);
    const html = card({
      kind: "delivered",
      paymentResponse: null,
      settlement: null,
      body: { schema: "csoai.art50.marking-evidence/0.1", card: { payload: { kind: "k" }, sha256: sha, sig_ed25519: "cd".repeat(64) } },
    });
    expect(html).toContain('data-testid="pay-delivered-record"');
    expect(html).toContain("a signed record, id");
    expect(html).toContain(sha);
    expect(html).toContain("Download what was delivered (JSON)");
    expect(html).toContain('href="/gspc-verify?seed=mine"');
    expect(html).toContain('href="/dashboard?tab=mine"');
    // a body with no signed record says so instead of inventing one
    const plain = card({ kind: "delivered", paymentResponse: null, settlement: null, body: { totals: {} } });
    expect(plain).toContain("carries no signed record to check");
    expect(plain).not.toContain("gspc-verify?seed=mine");
  });

  it("WRONG NETWORK names the chain the challenge requires", () => {
    const html = card({ kind: "wrong-network", detail: "x402Wallet: wallet stayed on chain 1; the 402 requires 8453" });
    expect(html).toContain("WRONG NETWORK.");
    expect(html).toContain("the 402 requires 8453");
  });

  it("a door with no challenge, or an unread index, says so instead of 0", () => {
    const html = renderToStaticMarkup(
      <DoorCard
        door={doors[0]}
        quote={{ kind: "no-challenge", http: 200, detail: "the door answered without a payment challenge — there is nothing here to settle" }}
        state={{ kind: "idle" }}
        listing={{ status: "UNCHECKABLE", reason: "the index was not read in full; absence would be a guess" }}
        index402={index402For(doors[0], null)}
        settle={settleFor(doors[0], null)}
        now={NOW}
        busy={false}
        onPay={() => {}}
      />,
    );
    expect(html).toContain("NO CHALLENGE");
    expect(html).toContain("UNCHECKABLE");
    expect(html).toContain("absence would be a guess");
    expect(html).toContain("disabled");
  });
});

describe("the status column: three cells per door, each from its own reader", () => {
  const row = (door: Door, over: { index402?: Index402Reading | null; settles?: DoorSettlesReading | null; state?: Parameters<typeof OutcomeLine>[0]["state"] } = {}) =>
    renderToStaticMarkup(
      <DoorCard
        door={door}
        quote={{ kind: "challenge", http: 402, challenge, body: {} }}
        state={over.state ?? { kind: "idle" }}
        listing={{ status: "NOT_LISTED", asOf: "2026-09-22T13:00:00Z", scanned: 5000, declared: 5000 }}
        index402={index402For(door, over.index402 === undefined ? INDEX402 : over.index402)}
        settle={settleFor(door, over.settles === undefined ? SETTLES : over.settles)}
        now={NOW}
        busy={false}
        onPay={() => {}}
      />,
    );
  const cell = (html: string, id: string) => {
    const m = html.match(new RegExp(`<p[^>]*data-testid="${id}"[^>]*>[\\s\\S]*?</p>`));
    expect(m, id).toBeTruthy();
    return m![0];
  };

  it("renders the three cells for a manifest door, a population door included, in a three-column strip", () => {
    for (const d of [doors[1], doors[2]]) {
      const html = row(d);
      expect(html).toContain('data-testid="pay-status"');
      expect(html).toContain("sm:grid-cols-3");
      expect(html).toContain('data-testid="pay-listing"');
      expect(html).toContain('data-testid="pay-status-402index"');
      expect(html).toContain('data-testid="pay-status-settle"');
      expect(html).toContain("PayAI indexed");
      expect(html).toContain("402 Index listed");
      expect(html).toContain("Last settle");
    }
  });

  it("PayAI: yes / no / UNVERIFIED, with the row's last_updated when yes", () => {
    const yes = renderToStaticMarkup(
      <DoorCard door={doors[1]} quote="reading" state={{ kind: "idle" }} listing={{ status: "LISTED", lastUpdated: "2026-09-07T04:58:52.174Z", asOf: "x", amount: null, maxTimeoutSeconds: null }} index402={index402For(doors[1], INDEX402)} settle={settleFor(doors[1], SETTLES)} now={NOW} busy={false} onPay={() => {}} />,
    );
    expect(cell(yes, "pay-listing")).toMatch(/data-status="yes"[\s\S]*Yes[\s\S]*last updated 2026-09-07T04:58:52.174Z/);
    expect(cell(row(doors[1]), "pay-listing")).toMatch(/data-status="no"[\s\S]*No[\s\S]*NOT LISTED/);
    const unverified = renderToStaticMarkup(
      <DoorCard door={doors[1]} quote="reading" state={{ kind: "idle" }} listing={{ status: "UNCHECKABLE", reason: "index answered HTTP 502 at offset 2" }} index402={index402For(doors[1], INDEX402)} settle={settleFor(doors[1], SETTLES)} now={NOW} busy={false} onPay={() => {}} />,
    );
    expect(cell(unverified, "pay-listing")).toMatch(/data-status="unverified"[\s\S]*UNVERIFIED[\s\S]*HTTP 502 at offset 2/);
  });

  it("402 Index: listed with the index's health word and probe time; not listed only when read in full; UNVERIFIED otherwise", () => {
    expect(cell(row(doors[1]), "pay-status-402index")).toMatch(/data-status="yes"[\s\S]*health[\s\S]*healthy[\s\S]*last checked 2026-09-22 08:35:46/);
    expect(cell(row(doors[2]), "pay-status-402index")).toMatch(/data-status="no"[\s\S]*not listed in the 402 Index[\s\S]*112 of 112 rows/);
    const short = cell(row(doors[2], { index402: { ...INDEX402, absence_determinate: false, reason: "index answered HTTP 503 at offset 100" } }), "pay-status-402index");
    expect(short).toMatch(/data-status="unverified"[\s\S]*UNVERIFIED[\s\S]*HTTP 503 at offset 100/);
    const down = cell(row(doors[1], { index402: { ...INDEX402, rows: [{ ...INDEX402.rows[0], health_status: "down" }] } }), "pay-status-402index");
    expect(down).toContain("down");
    expect(down).toContain("text-amber-800");
  });

  it("last settle: a fresh settle is green with its date and tx; 25 days is red with the words delist risk", () => {
    const fresh = cell(row(doors[1]), "pay-status-settle");
    expect(fresh).toContain('data-risk="false"');
    expect(fresh).toContain(iso(3 * DAY).slice(0, 10));
    expect(fresh).toContain("3 days ago");
    expect(fresh).toContain(`https://basescan.org/tx/0x${"ab".repeat(32)}`);
    expect(fresh).toContain("self-funded heartbeat");
    expect(fresh).not.toMatch(/delist risk/i);
    expect(fresh).not.toContain("text-red-800");

    const boundary = cell(row(doors[2]), "pay-status-settle");
    expect(boundary).toContain('data-risk="true"');
    expect(boundary).toContain("text-red-800");
    expect(boundary).toMatch(/delist risk/i);
    expect(boundary).toContain(`${DELIST_RISK_DAYS} days ago`);
    expect(boundary).toContain("no transaction on the record");

    const almost = cell(row(doors[2], { settles: { ...SETTLES, rows: [{ resource: doors[2].url, last_settle: iso(25 * DAY - 1) }] } }), "pay-status-settle");
    expect(almost).toContain('data-risk="false"');
    expect(almost).not.toMatch(/delist risk/i);
  });

  it("last settle: null is UNMEASURED and red — none on record, records unread, or a store that is not bound", () => {
    const none = cell(row(doors[0]), "pay-status-settle");
    expect(none).toContain('data-risk="true"');
    expect(none).toContain("None on record");
    expect(none).toContain("UNMEASURED");
    expect(none).toMatch(/delist risk/i);
    expect(none).toContain("nothing is inferred from a listing");

    const unread = cell(row(doors[1], { settles: null }), "pay-status-settle");
    expect(unread).toContain('data-risk="true"');
    expect(unread).toContain("UNMEASURED");
    expect(unread).toMatch(/delist risk/i);

    const unbound = cell(row(doors[1], { settles: { kind: "UNMEASURED", as_of: "x", rows: [], reason: "no REVENUE_KV bound — nothing is recorded, so no door has a last settle here" } }), "pay-status-settle");
    expect(unbound).toContain("no REVENUE_KV bound");
    expect(unbound).toMatch(/delist risk/i);
  });

  it("a door DELIVERED on this page shows that settle and is not at risk, whatever the records say", () => {
    const html = row(doors[0], { state: { kind: "delivered", paymentResponse: "x", settlement: { transaction: `0x${"cd".repeat(32)}`, network: "eip155:8453", payer: null, success: true } } });
    const c = cell(html, "pay-status-settle");
    expect(c).toContain('data-risk="false"');
    expect(c).toContain("Settled this session");
    expect(c).toContain("0xcdcdcd…cdcdcd");
    expect(c).not.toMatch(/delist risk/i);
  });

  it("the cells never type a price, a door count, or a banned string", () => {
    const html = row(doors[1]) + row(doors[0], { settles: null, index402: null });
    for (const re of BANNED) expect(html).not.toMatch(re);
    for (const re of TYPED_AMOUNT.slice(0, 1)) expect(cell(html, "pay-status-settle")).not.toMatch(re);
    expect(html).not.toMatch(TYPED_COUNT);
    expect(renderToStaticMarkup(<Index402Cell listing={{ status: "UNCHECKABLE", reason: "r" }} />)).toContain("UNVERIFIED");
    expect(renderToStaticMarkup(<SettleCell settle={{ status: "NONE_ON_RECORD", lastSettle: null, asOf: "x" }} state={{ kind: "idle" }} now={NOW} />)).toMatch(/delist risk/i);
  });
});

describe("Settle all is the monthly heartbeat, on one page", () => {
  const page = renderToStaticMarkup(
    <Router ssrPath="/pay-all">
      <PayEveryDoor />
    </Router>,
  );

  it("renders the Settle-all control before any door answers, disabled until the manifest is read, and the legend for the three cells", () => {
    expect(page).toMatch(/<button[^>]*data-testid="settle-all"[^>]*disabled[^>]*>Settle all<\/button>/);
    expect(page).toContain('data-testid="pay-status-legend"');
    expect(page.replace(/&#x27;/g, "'")).toContain(`${DELIST_RISK_DAYS} days, or when there is nothing on record`);
    expect(page).toContain("one wallet confirmation per door");
    expect(page).toContain("self-settlement, never as a buyer");
    expect(page).toContain("That flag is a heuristic, not an index");
    expect(page).toContain("neither listing proves an independent buyer");
    // the tally appears only once a walk has queued doors
    expect(page).not.toContain('data-testid="settle-all-tally"');
  });

  it("walks every door with a live challenge through payOne, one confirmation each, and tallies from the door states", () => {
    const src = strip(pageSource);
    expect(src).toContain("const queue = remainingDoors(visible, quotes, states);");
    expect(src).toContain("setWalkQueue(queue.map((d) => d.url));");
    expect(src).toContain("const final = await payOne(queue[i]);");
    expect(src).toContain("walkTally(walkQueue, states)");
    expect(src).toMatch(/tally\.delivered\} settled · \{tally\.unsettled\} unsettled · \{tally\.rejected\} declined/);
    // one settle path: the walk calls payOne, which calls payDoor — never a second signing path
    expect(src.match(/payDoor\(/g)).toHaveLength(1);
    expect(src).not.toMatch(/Promise\.all\(\s*queue/);
  });

  it("reads the three readers live: manifest, PayAI listing, 402 Index listing, settlement records", () => {
    const src = strip(pageSource);
    expect(src).toContain("fetch(MANIFEST_PATH");
    expect(src).toContain("fetch(LISTING_PATH");
    expect(src).toContain("fetch(FOUR02_LISTING_PATH");
    expect(src).toContain("fetch(DOOR_SETTLES_PATH");
    expect(src).not.toMatch(/import .*402index.*\.json/);
  });
});

describe("/pay-all is wired like every other current page", () => {
  it("has the route, the PRIMARY_PATHS entry, the manifest row, the head entry and a prerendered snapshot", () => {
    expect(appSource).toContain('<Route path="/pay-all" component={PayEveryDoor} />');
    expect(PRIMARY_PATHS.has("/pay-all")).toBe(true);
    expect(ROUTE_MANIFEST.some((r) => r.path === "/pay-all" && r.comp === "PayEveryDoor")).toBe(true);
    const head = ROUTE_HEAD["/pay-all"];
    expect(head).toBeTruthy();
    expect(head.title.length).toBeLessThanOrEqual(TITLE_MAX);
    expect(head.description.length).toBeGreaterThanOrEqual(DESCRIPTION_MIN);
    expect(head.description.length).toBeLessThanOrEqual(DESCRIPTION_MAX);
    for (const re of BANNED) expect(`${head.title} ${head.description}`).not.toMatch(re);
    expect(prerenderSource).toMatch(/CLIENT_ONLY_FUNCTION_ROUTES = new Set\(\[[\s\S]*?"\/pay-all",/);
  });

  it("deep-links one door with ?door= and explains a door the manifest does not declare", () => {
    const one = renderToStaticMarkup(
      <Router ssrPath="/pay-all" ssrSearch={`door=${encodeURIComponent(doors[1].url)}`}>
        <PayEveryDoor />
      </Router>,
    );
    // Effects do not run in a static render, so the manifest is unread here; the page must not
    // claim the door is missing before it has read the list.
    expect(one).not.toContain('data-testid="pay-deep-link"');
    // doorForLink (lib/payEveryDoor) is selectDoor plus "a declared route with its own query pays that
    // resource"; a route the manifest does not declare still selects nothing (payEveryDoor.test.ts).
    expect(strip(pageSource)).toContain("doorForLink(doors, wanted)");
    expect(strip(pageSource)).toContain("Show every door");
    expect(strip(pageSource)).toContain("the manifest does not declare");
  });
});
