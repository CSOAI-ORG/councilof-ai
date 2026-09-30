/**
 * GET /api/claims/events and /api/claims/events/head over the COMMITTED feed, through a mocked ASSETS
 * binding that serves public/ from disk (the reach suite's pattern). The door serves bytes only when the
 * feed, its head and the head's board signature agree; any one-byte change is a 503, never a partial feed.
 */
import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { onRequestGet as getFeed } from "./index";
import { onRequestGet as getHead } from "./head";
import { verifyFeed } from "../../../_lib/claimEvents";

const REPO = resolve(__dirname, "../../../..");
const DIR = join(REPO, "public/claims/events/v0.1");
const FEED = readFileSync(join(DIR, "events.jsonl"));
const HEAD = readFileSync(join(DIR, "head.json"));
const SIGNED = readFileSync(join(DIR, "head.signed.json"));

const assets = (override: Record<string, Buffer> = {}) => ({
  fetch: async (req: Request | string) => {
    const path = new URL(typeof req === "string" ? req : req.url).pathname;
    if (override[path]) return new Response(override[path], { status: 200 });
    const f = join(REPO, "public", decodeURIComponent(path));
    return existsSync(f) ? new Response(readFileSync(f), { status: 200 }) : new Response("<!doctype html><title>SPA</title>", { status: 200 });
  },
});
const ctx = (path: string, override: Record<string, Buffer> = {}) => ({
  request: new Request(`https://councilof.ai${path}`),
  env: { ASSETS: assets(override) },
});

describe("GET /api/claims/events", () => {
  it("serves the committed bytes exactly, as JSONL, when feed, head and signature agree", async () => {
    const r = await getFeed(ctx("/api/claims/events"));
    expect(r.status).toBe(200);
    expect(r.headers.get("content-type")).toMatch(/application\/x-ndjson/);
    expect(Buffer.from(await r.arrayBuffer()).equals(FEED)).toBe(true);
    const head = JSON.parse(HEAD.toString());
    expect(r.headers.get("x-claim-events-bytes-sha256")).toBe(head.feed.bytes_sha256);
    expect(r.headers.get("x-claim-events-lines")).toBe(String(head.feed.n_lines));
  });

  it("?since=N returns lines N.. unchanged, each still carrying its prev link", async () => {
    const lines = FEED.toString().trimEnd().split("\n");
    const r = await getFeed(ctx("/api/claims/events?since=2"));
    expect(r.status).toBe(200);
    expect(await r.text()).toBe(lines.slice(2).map((l) => l + "\n").join(""));
    expect((await getFeed(ctx("/api/claims/events?since=-1"))).status).toBe(400);
  });

  it("a one-byte change anywhere in the feed makes the door refuse (503), for every byte position", async () => {
    const headText = HEAD.toString(), signedText = SIGNED.toString();
    const missed: number[] = [];
    for (let i = 0; i < FEED.length; i++) {
      const m = Buffer.from(FEED);
      m[i] ^= 0x01;
      let text: string;
      try {
        text = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(m);
      } catch {
        continue; // the door's strict decoder refuses these before verification (covered below)
      }
      if ((await verifyFeed(text, headText, signedText)).state !== "DOES_NOT_VERIFY") missed.push(i);
    }
    expect(missed).toEqual([]);
  }, 120_000);

  it("through the door itself: a changed byte in the last line, the head, or invalid UTF-8 is a 503", async () => {
    const last = Buffer.from(FEED); last[last.length - 5] ^= 0x01;
    const head = Buffer.from(HEAD); head[10] ^= 0x01;
    const bad = Buffer.from(FEED); bad[0] = 0xff;
    for (const [path, bytes] of [
      ["/claims/events/v0.1/events.jsonl", last],
      ["/claims/events/v0.1/head.json", head],
      ["/claims/events/v0.1/events.jsonl", bad],
    ] as const) {
      const r = await getFeed(ctx("/api/claims/events", { [path]: bytes }));
      expect(r.status, path).toBe(503);
      expect((await r.json()).error).toBe("feed_does_not_verify");
    }
  });

  it("an unpublished feed (SPA fallback HTML) is a 503, not an empty feed", async () => {
    const r = await getFeed(ctx("/api/claims/events", { "/claims/events/v0.1/events.jsonl": Buffer.from("<!doctype html>") }));
    expect(r.status).toBe(503);
  });
});

describe("GET /api/claims/events/head", () => {
  it("returns the committed head and envelope with this door's verification", async () => {
    const r = await getHead(ctx("/api/claims/events/head"));
    expect(r.status).toBe(200);
    const body = await r.json();
    expect(body.head).toEqual(JSON.parse(HEAD.toString()));
    expect(body.signed).toEqual(JSON.parse(SIGNED.toString()));
    expect(body.verification.state).toBe("VERIFIES");
    expect(body.signed.signature.did).toBe("did:web:csoai.org#board-attestation-1");
  });
});
