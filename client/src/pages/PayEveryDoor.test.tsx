import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { Router } from "wouter";
import { describe, expect, it } from "vitest";
import PayEveryDoor, { DoorCard, OutcomeLine } from "./PayEveryDoor";
import { THE_LINE, doorsFromManifest, challengeFromPaymentRequired, type Door } from "@/lib/payEveryDoor";
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
  ],
});
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

describe("/pay ships clean copy", () => {
  const page = renderToStaticMarkup(
    <Router ssrPath="/pay">
      <PayEveryDoor />
    </Router>,
  );

  it("carries the one line verbatim", () => {
    expect(THE_LINE).toBe(
      "Each payment is one settle through the estate's facilitator; an index catalogues a door only after that. This page never holds a key.",
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

describe("/pay is wired like every other current page", () => {
  it("has the route, the PRIMARY_PATHS entry, the manifest row, the head entry and the prerender skip", () => {
    expect(appSource).toContain('<Route path="/pay" component={PayEveryDoor} />');
    expect(PRIMARY_PATHS.has("/pay")).toBe(true);
    expect(ROUTE_MANIFEST.some((r) => r.path === "/pay" && r.comp === "PayEveryDoor")).toBe(true);
    const head = ROUTE_HEAD["/pay"];
    expect(head).toBeTruthy();
    expect(head.title.length).toBeLessThanOrEqual(TITLE_MAX);
    expect(head.description.length).toBeGreaterThanOrEqual(DESCRIPTION_MIN);
    expect(head.description.length).toBeLessThanOrEqual(DESCRIPTION_MAX);
    for (const re of BANNED) expect(`${head.title} ${head.description}`).not.toMatch(re);
    expect(prerenderSource).toMatch(/CLIENT_ONLY_FUNCTION_ROUTES = new Set\(\[[\s\S]*?"\/pay",/);
  });

  it("deep-links one door with ?door= and explains a door the manifest does not declare", () => {
    const one = renderToStaticMarkup(
      <Router ssrPath="/pay" ssrSearch={`door=${encodeURIComponent(doors[1].url)}`}>
        <PayEveryDoor />
      </Router>,
    );
    // Effects do not run in a static render, so the manifest is unread here; the page must not
    // claim the door is missing before it has read the list.
    expect(one).not.toContain('data-testid="pay-deep-link"');
    expect(strip(pageSource)).toContain("selectDoor(doors, wanted)");
    expect(strip(pageSource)).toContain("Show every door");
    expect(strip(pageSource)).toContain("the manifest does not declare");
  });
});
