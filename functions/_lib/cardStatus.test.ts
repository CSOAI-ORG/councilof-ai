import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { readStatusLedgers, statusFor, WITHDRAWN_LEDGER_PATH, SUPERSEDED_LEDGER_PATH } from "./cardStatus";

const PUB = new URL("../../public/", import.meta.url).pathname;
const ORIGIN = "https://councilof.ai";
const withdrawnText = readFileSync(PUB + WITHDRAWN_LEDGER_PATH.slice(1), "utf8");
const supersededText = readFileSync(PUB + SUPERSEDED_LEDGER_PATH.slice(1), "utf8");

const serve = (w: string | number, s: string | number) =>
  vi.fn(async (url: string) => {
    const body = url.endsWith("WITHDRAWN.jsonl") ? w : url.endsWith("SUPERSEDED.jsonl") ? s : 404;
    return typeof body === "number" ? new Response("", { status: body }) : new Response(body, { status: 200 });
  }) as unknown as typeof fetch;

describe("cardStatus — the two withdrawal ledgers as the status source of truth", () => {
  it("reads every row of the committed ledgers (58 withdrawn, 1466 superseded on 2026-10-07; recounted here, not typed)", async () => {
    const l = await readStatusLedgers(ORIGIN, serve(withdrawnText, supersededText));
    expect(l.withdrawn.ok && l.withdrawn.rows.size).toBe(withdrawnText.split("\n").filter((x) => x.trim()).length);
    expect(l.superseded.ok && l.superseded.rows.size).toBe(supersededText.split("\n").filter((x) => x.trim()).length);
  });

  it("WITHDRAWN outranks SUPERSEDED, and the supersession is still carried", async () => {
    const l = await readStatusLedgers(ORIGIN, serve(withdrawnText, supersededText));
    const both = [...(l.withdrawn.ok ? l.withdrawn.rows.keys() : [])].filter((id) => l.superseded.ok && l.superseded.rows.has(id));
    expect(both.length).toBeGreaterThan(0); // seven ids sat in both on 2026-10-07
    const v = statusFor(both[0], l, ORIGIN);
    expect(v.status).toBe("WITHDRAWN");
    expect(v.supersession?.superseded_by).toBeTruthy();
    expect(v.withdrawal?.superseded_by).toBe(v.supersession?.superseded_by);
  });

  it("an id in neither ledger is LIVE only when both ledgers were read", async () => {
    const ok = await readStatusLedgers(ORIGIN, serve(withdrawnText, supersededText));
    expect(statusFor("f".repeat(64), ok, ORIGIN).status).toBe("LIVE");
    const half = await readStatusLedgers(ORIGIN, serve(503, supersededText));
    const v = statusFor("f".repeat(64), half, ORIGIN);
    expect(v.status).toBe("UNCHECKED");
    expect(v.unchecked[0]).toMatch(/WITHDRAWN\.jsonl.*HTTP 503/);
  });

  it("a malformed row makes that ledger unreadable (fail closed), never silently skipped", async () => {
    const l = await readStatusLedgers(ORIGIN, serve(withdrawnText + '\n{"withdrawn_id": \n', supersededText));
    expect(l.withdrawn.ok).toBe(false);
    expect(statusFor("f".repeat(64), l, ORIGIN).status).toBe("UNCHECKED");
  });

  it("a fetch that throws is reported, not thrown", async () => {
    const l = await readStatusLedgers(ORIGIN, vi.fn(async () => { throw new TypeError("network down"); }) as unknown as typeof fetch);
    expect(l.withdrawn.ok).toBe(false);
    expect(statusFor("f".repeat(64), l, ORIGIN).unchecked).toHaveLength(2);
  });
});
