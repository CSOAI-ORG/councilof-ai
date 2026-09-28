/**
 * ONE SOURCE FOR EVERY DOOR DESCRIPTION (2026-09-28) — the prerequisite for the CDP Bazaar listing.
 *
 * CDP search is text search over `description`, and a Bazaar record is written from the settle's
 * echo of the door's own 402 (resource.description + extensions.bazaar). Before this, a door had up
 * to four different texts: its 402's, the manifest's, capabilities.json's (so llms.txt and
 * openapi.json) and the catalogue's. This pins them to ONE: functions/api/x402-descriptions.json.
 *
 * And the text itself: each says what is read or measured, which states the door can return, and
 * that verification is free — never a price, a grade or a score.
 */
import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { onRequestGet as manifest } from "../.well-known/x402.json";
import { descriptionForPath } from "./_x402_descriptions";
import { offlineEvmFetch } from "./__fixtures__/offline-evm-fetch";
import descriptions from "./x402-descriptions.json";
import REGISTRY from "../../council-os/capabilities.json";

const ORIGIN = "https://councilof.ai";
const moduleFor = (pathname: string) => `.${pathname.replace(/^\/api/, "")}`;
type Resource = { url: string; description: string; accepts: { description: string }[]; asset?: string };

async function resources(): Promise<Resource[]> {
  const r = await (manifest as unknown as (c: unknown) => Promise<Response>)({ request: new Request(`${ORIGIN}/.well-known/x402.json`), env: {} });
  return ((await r.json()) as { resources: Resource[] }).resources;
}

const BANNED = /\b(grade[sd]?|grading|scor(?:e|es|ed|ing)|rank(?:s|ed|ing)?|rating|rated|certif\w*|verdict|guarantee[sd]?)\b/i;
const PRICE = /(?:£|\$|€)\s?\d|\b\d+(?:\.\d+)?\s?(?:usd|usdc|gbp|eur|cents?)\b/i;

describe("x402 door descriptions — the text", () => {
  it("every canonical text names what is read, the states it returns, and that verification is free — no price, grade or score", () => {
    for (const [key, text] of Object.entries(descriptions as Record<string, string>)) {
      expect(text.length, key).toBeLessThanOrEqual(500); // buildPaymentRequiredV2 clips resource.description at 500
      expect(text.split(". ")[0].length, `${key}: the Bazaar keeps 120 chars; the first sentence must fit`).toBeLessThanOrEqual(120);
      expect(text, `${key} must name its states`).toMatch(/\bStates\b/);
      expect(text, `${key} must say verification is free`).toMatch(/verification is free/i);
      expect(text, key).not.toMatch(BANNED);
      expect(text, key).not.toMatch(PRICE);
    }
  });
});

describe("x402 door descriptions — one source, every surface", () => {
  it("the manifest row, its accepts[0] and the door's own 402 all carry the canonical text", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockImplementation(offlineEvmFetch);
    const failures: string[] = [];
    try {
      for (const r of await resources()) {
        const url = new URL(r.url);
        const want = descriptionForPath(url.pathname, r.asset);
        if (!want) { failures.push(`${url.pathname}: no canonical description`); continue; }
        if (r.description !== want) failures.push(`${url.pathname}: manifest description differs`);
        if (r.accepts?.[0]?.description !== want) failures.push(`${url.pathname}: manifest accepts[0].description differs`);
        const mod = (await import(/* @vite-ignore */ moduleFor(url.pathname))) as { onRequestGet: (c: unknown) => Promise<Response> };
        const resp = await mod.onRequestGet({ request: new Request(url.toString()), env: {}, params: {} });
        if (resp.status !== 402) { failures.push(`${url.pathname}: answered ${resp.status}, not 402`); continue; }
        const body = (await resp.json()) as { resource?: { description?: string }; accepts?: { description?: string }[] };
        if (body.resource?.description !== want) failures.push(`${url.pathname}: the 402's resource.description (what the Bazaar catalogues) differs`);
        if (body.accepts?.[0]?.description !== want) failures.push(`${url.pathname}: the 402's accepts[0].description differs`);
      }
    } finally {
      spy.mockRestore();
    }
    expect(failures, `\n  ${failures.join("\n  ")}\n`).toEqual([]);
  });

  it("council-os/capabilities.json (and so openapi.json) and llms.txt carry the same text for every door", async () => {
    const caps = (REGISTRY as { capabilities: { path?: string; method?: string; description: string; payment?: string }[] }).capabilities;
    const llms = readFileSync(new URL("../../public/llms.txt", import.meta.url), "utf8");
    const failures: string[] = [];
    for (const r of await resources()) {
      const path = new URL(r.url).pathname;
      const want = descriptionForPath(path, r.asset)!;
      const cap = caps.find((c) => c.path === path && (c.method ?? "GET") === "GET");
      if (!cap) failures.push(`${path}: no capabilities.json entry`);
      else if (cap.description !== want) failures.push(`${path}: capabilities.json description differs`);
      // llms.txt lists the PAID doors with their text; a zero-amount door (payment "free") is named on
      // its own line as "a live 402 route priced at zero" instead (scripts/llms-txt.mjs paidDoorsSection).
      const paid = cap && cap.payment !== "free";
      if (paid && !llms.includes(want)) failures.push(`${path}: llms.txt does not carry the canonical text`);
      if (!paid && !llms.includes(`https://councilof.ai${path}`)) failures.push(`${path}: llms.txt does not name the free door`);
    }
    expect(failures, `\n  ${failures.join("\n  ")}\n`).toEqual([]);
  });
});
