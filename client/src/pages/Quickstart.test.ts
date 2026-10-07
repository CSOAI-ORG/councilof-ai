import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const page = readFileSync(resolve(__dirname, "Quickstart.tsx"), "utf8");
const app = readFileSync(resolve(__dirname, "../App.tsx"), "utf8");
const nav = readFileSync(resolve(__dirname, "../components/HeaderNav.tsx"), "utf8");
const library = readFileSync(resolve(__dirname, "../data/library-ia.ts"), "utf8");
const ROOT = resolve(__dirname, "../../..");
const prerender = readFileSync(resolve(ROOT, "scripts/prerender.mjs"), "utf8");
const companion = JSON.parse(readFileSync(resolve(ROOT, "public/quickstart.json"), "utf8"));
const llmsTmpl = readFileSync(resolve(ROOT, "scripts/llms/llms.txt.tmpl"), "utf8");
const VERIFIER = resolve(ROOT, "public/verifier/card-v0-verify.mjs");
const DID = resolve(ROOT, "public/.well-known/did.json");
const SIGNED_LEAF = resolve(ROOT, "public/cards/090963760060e3ee.json");

describe("/quickstart — the public evidence path before an optional commission", () => {
  it("carries all four wirings a new page needs (route, title, prerender MUST, PRIMARY_PATHS) and a nav entry", () => {
    expect(app).toContain('const Quickstart = lazy(() => import("./pages/Quickstart"))');
    expect(app).toContain('<Route path="/quickstart" component={Quickstart} />');
    // Titles live in client/src/data/seo-head.json since 2026-09-16 (one producer, see lib/seoHead.ts).
    expect(JSON.parse(readFileSync(resolve(__dirname, "../data/seo-head.json"), "utf8")).routes["/quickstart"]?.title).toMatch(/^Agent quickstart/);
    expect(prerender).toContain('"/quickstart"');
    expect(library).toContain('"/quickstart"');
    expect(nav).toContain("href: '/quickstart'");
  });

  it("keeps the trailing-slash canonical constant and leaves the canonical tag to the central writer", () => {
    expect(page).toContain('const CANONICAL = "https://councilof.ai/quickstart/"');
    expect(page).not.toMatch(/rel=["']canonical["']/);
  });

  it("reads doors, tool names and the verify route from the live manifest — none are typed", () => {
    expect(page).toContain('const MANIFEST = "/.well-known/x402.json"');
    expect(page).toContain("manifest?.mcp?.free_tools");
    expect(page).toContain("manifest?.mcp?.paid_tools");
    expect(page).not.toMatch(/board_totals|commission_card|rwa_evidence/); // tool names come from the manifest, not the page
  });

  it("types no price, no count and no verdict — the amount lives only in the 402", () => {
    expect(page).not.toMatch(/\$\s?\d/);
    expect(page).not.toMatch(/\b\d+(\.\d+)?\s?USDC\b/);
    expect(page).not.toMatch(/"(amount|maxAmountRequired)":\s*"\d/); // observed shapes use a placeholder
    expect(page).not.toMatch(/\b(compliant|compliance|certified|approved|guaranteed?)\b/i); // "never certification" is the disclaimer, not a claim
    expect(page).not.toMatch(/(?<!UN)MEASURED\b/);
    expect(page).not.toMatch(/\b\d+ (doors|cards|axes|payers)\b/);
  });

  it("walks the evidence hierarchy before the optional commission and correction", () => {
    for (const s of ["1 · Explore measurements", "2 · See what changed", "3 · Verify evidence", "4 · Access supported feeds", "5 · Optional: commission an output", "6 · Correct"]) expect(page).toContain(s);
    expect(page.indexOf("4 · Access supported feeds")).toBeLessThan(page.indexOf("5 · Optional: commission an output"));
    expect(page).toContain("A settlement of zero is not a purchase");
    // A signature or root protects the record, never the truth of the measurement.
    expect(page).toContain("not the truth of a measurement");
    expect(page).toContain("Measurement, never certification");
  });
});

describe("/quickstart — the paid path is complete: discover → request → 402 → settle → receive → verify", () => {
  const order = ["Step 1 · Discover", "Step 2 · Request", "Step 3 · Read the 402", "Step 4 · Settle from your own wallet", "Step 5 · Receive", "Step 6 · Verify offline"];

  it("shows all six steps, in order", () => {
    let last = -1;
    for (const s of order) {
      const i = page.indexOf(s);
      expect(i, s).toBeGreaterThan(last);
      last = i;
    }
  });

  const between = (a: string, b?: string) => page.slice(page.indexOf(a), b ? page.indexOf(b) : undefined);

  it("discover: a command against the manifest and the observed shape", () => {
    const s = between(order[0], order[1]);
    expect(s).toContain("curl -s https://councilof.ai/.well-known/x402.json");
    expect(s).toContain("# observed 200");
    for (const f of ['"x402Version": 2', '"network": "eip155:8453"', '"payTo":', '"resources"']) expect(s).toContain(f);
  });

  it("request: the worked door with a subject, and the free preview", () => {
    expect(page).toContain('const EXAMPLE_DOOR = "/api/request-attestation?subject=');
    const s = between(order[1], order[2]);
    expect(s).toContain("${EXAMPLE_DOOR}");
    expect(s).toContain(".csoai.preview");
    expect(s).toContain('"signed_cards_on_file"');
  });

  it("402: the real challenge fields, the header, and an offline offer check", () => {
    const s = between(order[2], order[3]);
    for (const f of ["PAYMENT-REQUIRED", '"x402Version": 2', '"scheme": "exact"', '"network": "eip155:8453"', '"asset": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"', '"payTo": "0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31"', '"amount"', '"maxAmountRequired"'])
      expect(s).toContain(f);
    expect(s).toContain("verify_receipt.py --url");
    expect(page).toContain("readChallenge(EXAMPLE_DOOR");
    expect(page).toMatch(/r\.status !== 402/);
  });

  it("settle: the public x402 client, the caller's own wallet, and no claim that a settlement happened", () => {
    const s = between(order[3], order[4]);
    expect(s).toContain('from "@x402/fetch"');
    expect(s).toContain("wrapFetchWithPaymentFromConfig");
    expect(s).toContain("ExactEvmScheme");
    expect(s).toContain("You pay from your own wallet");
    expect(s).toContain("does not claim any settlement happened");
    expect(s).not.toMatch(/0x[0-9a-fA-F]{64}/); // no key material, ever
  });

  it("receive: labelled from source, with the card-v0 fields the function returns", () => {
    const s = between(order[4], order[5]);
    expect(s).toContain("from source");
    expect(s).toContain("functions/api/request-attestation.ts");
    for (const f of ['"surface": "ras.commission"', '"settle"', '"sig_ed25519"', "x-payment-response", '"unmeasured"']) expect(s).toContain(f);
  });

  it("verify: an offline command against the published DID document", () => {
    const s = between(order[5], "6 · Correct");
    expect(s).toContain("https://councilof.ai/verifier/card-v0-verify.mjs");
    expect(s).toContain("https://csoai.org/.well-known/did.json");
    expect(s).toContain("gspc-verify.mjs --did-document did.json");
  });

  it("states the self-payment exclusion and links the revenue contract", () => {
    expect(page).toContain("Payments from the operator's own wallets are recorded as self-tests and never counted as revenue");
    expect(page).toContain('href="/api/revenue"');
  });
});

describe("/quickstart.json — the machine-readable companion", () => {
  it("lists the six steps with an endpoint and a method, and types no amount", () => {
    expect(companion.human).toBe("https://councilof.ai/quickstart/");
    expect(companion.steps.map((s: { name: string }) => s.name)).toEqual(["discover", "request", "402", "settle", "receive", "verify"]);
    for (const s of companion.steps) {
      expect(typeof s.endpoint).toBe("string");
      expect(typeof s.method).toBe("string");
    }
    expect(companion.steps.find((s: { name: string }) => s.name === "receive").observed).toBe(false);
    const raw = JSON.stringify(companion);
    expect(raw).not.toMatch(/\b(compliant|compliance|certified)\b/i);
    expect(raw).not.toMatch(/"amount"\s*:\s*"\d/);
    expect(companion.revenue_contract).toBe("https://councilof.ai/api/revenue");
  });

  it("is linked from the llms.txt template, not a hand-edited output", () => {
    expect(llmsTmpl).toContain("https://councilof.ai/quickstart.json");
  });
});

describe("public/verifier/card-v0-verify.mjs — the offline checker the verify step names", () => {
  const run = (card: string) => spawnSync(process.execPath, [VERIFIER, card, DID], { encoding: "utf8" });

  it("says VALID for a published signed card-v0 leaf", () => {
    const r = run(SIGNED_LEAF);
    expect(r.stdout).toMatch(/^VALID/);
    expect(r.status).toBe(0);
  });

  it("says INVALID when one payload byte changes (the check can fail)", () => {
    const leaf = JSON.parse(readFileSync(SIGNED_LEAF, "utf8"));
    const card = leaf.card ?? leaf;
    const k = Object.keys(card.payload).sort()[0];
    card.payload[k] = `${String(card.payload[k])}x`;
    const f = join(mkdtempSync(join(tmpdir(), "cardv0-")), "tampered.json");
    writeFileSync(f, JSON.stringify(leaf));
    const r = run(f);
    expect(r.stdout).toMatch(/^INVALID/);
    expect(r.status).toBe(1);
  });

  it("says UNCHECKABLE for an unsigned card instead of guessing", () => {
    const leaf = JSON.parse(readFileSync(SIGNED_LEAF, "utf8"));
    const card = leaf.card ?? leaf;
    card.sig_ed25519 = null;
    const f = join(mkdtempSync(join(tmpdir(), "cardv0-")), "unsigned.json");
    writeFileSync(f, JSON.stringify(leaf));
    const r = run(f);
    expect(r.stdout).toMatch(/^UNCHECKABLE/);
    expect(r.status).toBe(2);
  });
});
