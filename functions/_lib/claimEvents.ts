/**
 * claimEvents — verification of the public claim-event feed (/api/claims/events).
 *
 * THE FEED is public/claims/events/v0.1/events.jsonl, produced by scripts/claims/claim_events_export.py
 * from the claim maintenance loop's append-only event log and committed. Line n carries
 * prev_sha256 = sha256(line n-1 bytes, without its newline); line 0 carries null; seq = n.
 *
 * THE HEAD (head.json) commits to every byte: n_lines, sha256 of the whole file, sha256 of the last
 * line. head.signed.json is a csoai.signed-run/0.1 envelope from POST /api/board-sign whose
 * payload.artifact.sha256 pins the head's bytes.
 *
 * Why the head matters to the chain: prev links alone cannot see a change to the LAST line (nothing
 * follows it). The head's head_line_sha256 and bytes_sha256 close that gap, and the signature pins the
 * head. Together, any one-byte change anywhere in the feed fails verification (see the sweep in
 * functions/api/claims/events/events.test.ts).
 *
 * This module computes nothing it then publishes; it only says whether the committed bytes agree
 * with each other. The Function serves the bytes only when they do.
 */
import { sha256hex } from "./cardVerify";
import { verifySignedRunDoc } from "./signedRunVerify";

export const FEED_DIR = "/claims/events/v0.1";
export const FEED_PATH = `${FEED_DIR}/events.jsonl`;
export const HEAD_PATH = `${FEED_DIR}/head.json`;
export const HEAD_SIGNED_PATH = `${FEED_DIR}/head.signed.json`;
export const LINE_SCHEMA = "csoai.claim-event/0.1";
export const HEAD_SCHEMA = "csoai.claim-event-head/0.1";

export type FeedCheck = { check: string; ok: boolean; detail: string };
export type FeedVerdict = {
  state: "VERIFIES" | "DOES_NOT_VERIFY";
  checks: FeedCheck[];
  n_lines: number;
  head: Record<string, unknown> | null;
};

const enc = new TextEncoder();

/** Split a JSONL byte string into lines WITHOUT their newline. A file must end with exactly one "\n". */
export function splitLines(text: string): string[] | null {
  if (text === "") return [];
  if (!text.endsWith("\n")) return null;
  return text.slice(0, -1).split("\n");
}

/** The exporter's canonical line bytes: compact, recursively key-sorted JSON. */
export function canonicalLine(v: unknown): string {
  const rec = (x: unknown): unknown => {
    if (Array.isArray(x)) return x.map(rec);
    if (x && typeof x === "object") {
      const o = x as Record<string, unknown>;
      const out: Record<string, unknown> = {};
      for (const k of Object.keys(o).sort()) out[k] = rec(o[k]);
      return out;
    }
    return x;
  };
  return JSON.stringify(rec(v));
}

/** Verify the chain of lines alone (no head). Returns the sha256 of the last line, or an error. */
export async function verifyChain(lines: string[]): Promise<{ ok: true; last: string | null } | { ok: false; at: number; why: string }> {
  let prev: string | null = null;
  for (let i = 0; i < lines.length; i++) {
    let o: Record<string, unknown>;
    try {
      o = JSON.parse(lines[i]);
    } catch {
      return { ok: false, at: i, why: "line is not JSON" };
    }
    if (canonicalLine(o) !== lines[i]) return { ok: false, at: i, why: "line is not in canonical form" };
    if (o.schema !== LINE_SCHEMA) return { ok: false, at: i, why: `schema ${String(o.schema)}` };
    if (o.seq !== i) return { ok: false, at: i, why: `seq ${String(o.seq)} != ${i}` };
    if (o.prev_sha256 !== prev) return { ok: false, at: i, why: "prev_sha256 does not match the previous line" };
    prev = await sha256hex(enc.encode(lines[i]));
  }
  return { ok: true, last: prev };
}

export async function verifyFeed(feedText: string, headText: string, signedText: string): Promise<FeedVerdict> {
  const checks: FeedCheck[] = [];
  const done = (n: number, head: Record<string, unknown> | null): FeedVerdict => ({
    state: checks.every((c) => c.ok) ? "VERIFIES" : "DOES_NOT_VERIFY",
    checks,
    n_lines: n,
    head,
  });

  let head: Record<string, unknown> | null = null;
  try {
    head = JSON.parse(headText);
  } catch {
    checks.push({ check: "head", ok: false, detail: "head.json is not JSON" });
    return done(0, null);
  }
  checks.push({ check: "head schema", ok: head?.schema === HEAD_SCHEMA, detail: String(head?.schema) });
  const feed = (head?.feed ?? {}) as Record<string, unknown>;

  const lines = splitLines(feedText);
  if (lines === null) {
    checks.push({ check: "framing", ok: false, detail: "the feed does not end with a newline" });
    return done(0, head);
  }
  const chain = await verifyChain(lines);
  if ("at" in chain) {
    checks.push({ check: "chain", ok: false, detail: `line ${chain.at}: ${chain.why}` });
  } else {
    checks.push({ check: "chain", ok: true, detail: `${lines.length} lines link` });
  }

  const bytesSha = await sha256hex(enc.encode(feedText));
  checks.push({ check: "feed bytes", ok: bytesSha === feed.bytes_sha256, detail: `sha256(events.jsonl) = ${bytesSha}` });
  checks.push({ check: "line count", ok: lines.length === feed.n_lines, detail: `${lines.length} lines, head says ${String(feed.n_lines)}` });
  const lastSha = lines.length ? await sha256hex(enc.encode(lines[lines.length - 1])) : null;
  checks.push({ check: "last line", ok: lastSha === (feed.head_line_sha256 ?? null), detail: `sha256(last line) = ${lastSha}` });

  let signed: unknown = null;
  try {
    signed = JSON.parse(signedText);
  } catch {
    checks.push({ check: "signature", ok: false, detail: "head.signed.json is not JSON" });
    return done(lines.length, head);
  }
  const v = await verifySignedRunDoc(signed);
  checks.push({ check: "signature", ok: v.state === "VALID", detail: `${v.state} ${v.did ?? ""} ${v.reasons.join(",")}`.trim() });
  const headSha = await sha256hex(enc.encode(headText));
  const pinned = (v.artifact?.sha256 ?? null) as string | null;
  checks.push({ check: "signature pins head", ok: pinned === headSha, detail: `sha256(head.json) = ${headSha}, signed artifact = ${pinned}` });
  return done(lines.length, head);
}

// ---------------------------------------------------------------- serving (used by functions/api/claims/events/*)

export type Env = { ASSETS?: { fetch: (req: Request | string) => Promise<Response> } };
export type Ctx = { request: Request; env?: Env };

const SITE = "https://councilof.ai";
export const BASE_HEADERS = {
  "access-control-allow-origin": "*",
  "cache-control": "public, max-age=300",
  link: '</api/claims/events/head>; rel="describedby"; type="application/json", <https://councilof.ai/spec/claim-maintenance/v0.2/>; rel="related"',
  "x-content-type-options": "nosniff",
};

export async function readStatic(ctx: Ctx, path: string): Promise<string> {
  const req = new Request(new URL(path, SITE).toString(), { method: "GET" });
  const r = ctx.env?.ASSETS ? await ctx.env.ASSETS.fetch(req) : await fetch(new URL(path, ctx.request.url).toString());
  if (!r.ok) throw new Error(`${path}: HTTP ${r.status}`);
  // Decode strictly and keep any BOM, so text <-> bytes is lossless and the digests below are of the served bytes.
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(new Uint8Array(await r.arrayBuffer()));
  } catch {
    throw new Error(`${path}: not valid UTF-8`);
  }
  // The SPA fallback answers 200 with HTML for a file that was never published.
  if (/^\s*</.test(text)) throw new Error(`${path}: served HTML (not published)`);
  return text;
}

export async function loadVerified(ctx: Ctx) {
  const [feed, head, signed] = await Promise.all([
    readStatic(ctx, FEED_PATH),
    readStatic(ctx, HEAD_PATH),
    readStatic(ctx, HEAD_SIGNED_PATH),
  ]);
  return { feed, head, signed, verdict: await verifyFeed(feed, head, signed) };
}

export const unavailable = (why: string, checks: unknown = null) =>
  new Response(
    JSON.stringify(
      {
        error: "feed_does_not_verify",
        detail: why,
        checks,
        note: "The feed is served only when events.jsonl, head.json and head.signed.json agree. Nothing partial is served.",
      },
      null,
      2,
    ),
    { status: 503, headers: { ...BASE_HEADERS, "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } },
  );
