/**
 * The claim-event feed: producer (claim_events_export.py), independent re-derivation
 * (claim-events-rederive.mjs) and the changed-pages helper (claim-events-changed-pages.mjs).
 *
 * The one-byte test is exhaustive: every byte of the feed and of the head, changed one at a time,
 * must make the re-derivation fail. A chain whose last line could be edited unseen, or a head that
 * could be edited without breaking its signature, would pass a sampled test and fail this one.
 */
import { describe, expect, it, beforeAll } from "vitest";
import { spawnSync } from "node:child_process";
import { generateKeyPairSync, sign as edSign, createHash } from "node:crypto";
import { mkdtempSync, readFileSync, writeFileSync, existsSync, appendFileSync, copyFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { rederive, rederiveHeads } from "./claim-events-rederive.mjs";
import { changedPages } from "./claim-events-changed-pages.mjs";

const HERE = resolve(__dirname);
const ROOT = resolve(HERE, "../..");
const EXPORT = join(HERE, "claim_events_export.py");
const FIXTURE = join(HERE, "__fixtures__/claim-events/make_fixture.py");
const sha = (b) => createHash("sha256").update(b).digest("hex");
const canon = (v) => {
  const rec = (x) => Array.isArray(x) ? x.map(rec)
    : x && typeof x === "object" ? Object.fromEntries(Object.keys(x).sort().map((k) => [k, rec(x[k])])) : x;
  return JSON.stringify(rec(v));
};

const py = (args) => spawnSync("python3", args, { encoding: "utf8" });
function fixture(days, dir = mkdtempSync(join(tmpdir(), "claim-events-"))) {
  const r = py([FIXTURE, "--out", dir, "--days", String(days)]);
  expect(r.status, r.stderr).toBe(0);
  return dir;
}
function exportFeed(dir, date, extra = []) {
  return py([EXPORT, "export", "--data", join(dir, "store"), "--register", join(dir, "register.json"),
    "--subjects", join(dir, "subjects"), "--out", join(dir, "feed"), "--date", date, "--as-of", `${date}T09:00:00Z`, ...extra]);
}

// A throwaway Ed25519 key standing in for the board signer: same envelope shape as POST /api/board-sign.
const { publicKey, privateKey } = generateKeyPairSync("ed25519");
const TEST_KEY_HEX = publicKey.export({ format: "der", type: "spki" }).subarray(12).toString("hex");
const TEST_DID = "did:web:example.test#fixture-signer";
const OPTS = { keyHex: TEST_KEY_HEX, did: TEST_DID };
function signHead(headBuf, date) {
  const payload = { schema: "csoai.signed-artifact/0.1", artifact: { path: `claims/events/v0.1/heads/${date}.json`,
    sha256: sha(headBuf), schema: "csoai.claim-event-head/0.1", as_of: JSON.parse(headBuf).as_of } };
  const c = Buffer.from(canon(payload), "utf8");
  return Buffer.from(JSON.stringify({ schema: "csoai.signed-run/0.1", payload,
    signature: { did: TEST_DID, alg: "Ed25519", sig_ed25519: edSign(null, c, privateKey).toString("hex"), payload_sha256: sha(c) } }, null, 1) + "\n");
}

describe("claim_events_export.py", () => {
  let dir, feed1;
  beforeAll(() => {
    dir = fixture(1);
    const r = exportFeed(dir, "2026-09-21");
    expect(r.status, r.stderr).toBe(0);
    feed1 = readFileSync(join(dir, "feed/events.jsonl"));
  });

  it("projects every source line once, chained, and the independent re-derivation agrees", () => {
    const lines = feed1.toString().trimEnd().split("\n").map((l) => JSON.parse(l));
    // 2 subjects x (6 events + 1 atoms line) on day 1
    expect(lines).toHaveLength(14);
    const head = readFileSync(join(dir, "feed/heads/2026-09-21.json"));
    const v = rederive(feed1, head, signHead(head, "2026-09-21"), OPTS);
    expect(v.checks.filter((c) => !c.ok)).toEqual([]);
    expect(v.state).toBe("VERIFIES");
  });

  it("SEALED subjects carry no name, claim id, atom name, free text or observation digest; DISCLOSED ones do", () => {
    const text = feed1.toString();
    const sealed = text.split("\n").filter((l) => l.includes("5eed000000000001"));
    for (const l of sealed) {
      for (const leak of ["fixture-sealed-subject", "FX-1", "FX-2", "doc.key_material", "claim_text_present", "reason", "doc.json", "proof/"]) {
        expect(l).not.toContain(leak);
      }
    }
    expect(sealed.some((l) => l.includes('"claim":"c1"'))).toBe(true);
    const disclosed = text.split("\n").filter((l) => l.includes("d15c000000000002"));
    expect(disclosed.some((l) => l.includes('"subject":"fixture-disclosed-subject"'))).toBe(true);
    expect(disclosed.some((l) => l.includes('"claim":"DX-1"'))).toBe(true);
    expect(text).not.toMatch(/"reason"/);
  });

  it("is append-only: a re-run adds nothing, a new day appends and keeps every earlier byte", () => {
    let r = exportFeed(dir, "2026-09-21");
    expect(r.status, r.stderr).toBe(0);
    expect(readFileSync(join(dir, "feed/events.jsonl")).equals(feed1)).toBe(true);
    const d2 = fixture(1); // an independent copy, then day 2 appended to it
    exportFeed(d2, "2026-09-21");
    const before = readFileSync(join(d2, "feed/events.jsonl"));
    const r2 = py([FIXTURE, "--out", d2, "--days", "2", "--from-day", "2"]);
    expect(r2.status, r2.stderr).toBe(0);
    r = exportFeed(d2, "2026-09-22");
    expect(r.status, r.stderr).toBe(0);
    const after = readFileSync(join(d2, "feed/events.jsonl"));
    expect(after.subarray(0, before.length).equals(before)).toBe(true);
    expect(after.length).toBeGreaterThan(before.length);
    const h2 = JSON.parse(readFileSync(join(d2, "feed/heads/2026-09-22.json"), "utf8"));
    expect(h2.prev_head).toEqual({ date: "2026-09-21", sha256: sha(readFileSync(join(d2, "feed/heads/2026-09-21.json"))) });
    expect(h2.feed.lines_added_since_prev_head).toBe(after.toString().trimEnd().split("\n").length - 14);
    expect(rederiveHeads(join(d2, "feed")).every((c) => c.ok)).toBe(true);
  });

  it("fails closed when a source line it already exported is rewritten", () => {
    const d = fixture(1);
    expect(exportFeed(d, "2026-09-21").status).toBe(0);
    const p = join(d, "store/d15c000000000002/atom/atoms.jsonl");
    writeFileSync(p, readFileSync(p, "utf8").replace("primary", "primarX"));
    const r = exportFeed(d, "2026-09-21");
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/SOURCE_REWRITTEN/);
  });

  it("fails closed on a source event log whose own chain is broken", () => {
    const d = fixture(1);
    const p = join(d, "store/5eed000000000001/history/events.jsonl");
    const lines = readFileSync(p, "utf8").trimEnd().split("\n");
    lines[2] = lines[2].replace('"MEASURED"', '"MEASURXD"');
    writeFileSync(p, lines.join("\n") + "\n");
    const r = exportFeed(d, "2026-09-21");
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/SOURCE_CHAIN_BROKEN/);
    expect(existsSync(join(d, "feed/events.jsonl"))).toBe(false);
  });

  it("refuses to write a line carrying an internal name", () => {
    const d = fixture(1);
    const p = join(d, "store/d15c000000000002/history/events.jsonl");
    // A new, correctly chained source line whose run_id carries a banned internal path.
    const lines = readFileSync(p, "utf8").trimEnd().split("\n");
    const last = JSON.parse(lines[lines.length - 1]);
    const e = { ...last, seq: last.seq + 1, prev_sha256: sha(Buffer.from(lines[lines.length - 1])), run_id: "/workspace/x", at: "2026-09-21T08:00:00Z" };
    const pyDump = spawnSync("python3", ["-c", "import json,sys;print(json.dumps(json.loads(sys.stdin.read()),sort_keys=True))"], { input: JSON.stringify(e), encoding: "utf8" });
    appendFileSync(p, pyDump.stdout);
    const r = exportFeed(d, "2026-09-21");
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/BANNED_NAME/);
  });
});

describe("one-byte change", () => {
  let feed, head, signed;
  beforeAll(() => {
    const d = fixture(2);
    expect(exportFeed(d, "2026-09-22").status).toBe(0);
    feed = readFileSync(join(d, "feed/events.jsonl"));
    head = readFileSync(join(d, "feed/heads/2026-09-22.json"));
    signed = signHead(head, "2026-09-22");
    expect(rederive(feed, head, signed, OPTS).state).toBe("VERIFIES");
  });

  it("anywhere in events.jsonl breaks the chain or the head — every byte position", () => {
    const missed = [];
    for (let i = 0; i < feed.length; i++) {
      const m = Buffer.from(feed);
      m[i] = m[i] ^ 0x01;
      if (rederive(m, head, signed, OPTS).state !== "DOES_NOT_VERIFY") missed.push(i);
    }
    expect(missed).toEqual([]);
  }, 120_000);

  it("changing a middle line breaks the prev link of the line after it (the chain itself, not only the head)", () => {
    const lines = feed.toString().trimEnd().split("\n");
    lines[3] = lines[3].replace(/"at":"(\d{4})/, (_, y) => `"at":"${Number(y) + 1}`);
    const v = rederive(Buffer.from(lines.join("\n") + "\n"), head, signed, OPTS);
    expect(v.checks.find((c) => c.check === "chain")).toMatchObject({ ok: false, detail: "line 4: prev_sha256 does not link" });
  });

  it("anywhere in head.json breaks the signature binding — every byte position", () => {
    const missed = [];
    for (let i = 0; i < head.length; i++) {
      const m = Buffer.from(head);
      m[i] = m[i] ^ 0x01;
      if (rederive(feed, m, signed, OPTS).state !== "DOES_NOT_VERIFY") missed.push(i);
    }
    expect(missed).toEqual([]);
  }, 120_000);

  it("a signature by any other key does not verify", () => {
    const other = generateKeyPairSync("ed25519").publicKey.export({ format: "der", type: "spki" }).subarray(12).toString("hex");
    expect(rederive(feed, head, signed, { ...OPTS, keyHex: other }).state).toBe("DOES_NOT_VERIFY");
  });
});

describe("the committed feed", () => {
  const D = join(ROOT, "public/claims/events/v0.1");
  it("re-derives against the pinned board key", () => {
    const [f, h, s] = ["events.jsonl", "head.json", "head.signed.json"].map((n) => readFileSync(join(D, n)));
    const v = rederive(f, h, s);
    expect(v.checks.filter((c) => !c.ok)).toEqual([]);
    expect(rederiveHeads(D).every((c) => c.ok)).toBe(true);
  });
  it("head.json and head.signed.json are byte copies of the newest dated head", () => {
    const h = JSON.parse(readFileSync(join(D, "head.json"), "utf8"));
    expect(readFileSync(join(D, "head.json")).equals(readFileSync(join(D, `heads/${h.date}.json`)))).toBe(true);
    expect(readFileSync(join(D, "head.signed.json")).equals(readFileSync(join(D, `heads/${h.date}.signed.json`)))).toBe(true);
  });
});

describe("claim-events-changed-pages.mjs", () => {
  const SEALED = "5eed000000000001", OPEN = "d15c000000000002";
  const deps = { host: "councilof.ai", pages: [
    { url: "https://councilof.ai/api/claims/events", depends_on: ["feed"] },
    { url: "https://councilof.ai/p/open-key", depends_on: [`${OPEN}:atom:doc.key_material`] },
    { url: "https://councilof.ai/p/open-claim-2", depends_on: [`${OPEN}:claim:DX-2`] },
    { url: "https://councilof.ai/p/open-claim-1", depends_on: [`${OPEN}:claim:DX-1`] },
    { url: "https://councilof.ai/p/sealed-any-claim", depends_on: [`${SEALED}:claim:*`] },
  ] };
  let day1, day2;
  beforeAll(() => {
    const d = fixture(1);
    exportFeed(d, "2026-09-21");
    day1 = readFileSync(join(d, "feed/events.jsonl"), "utf8");
    py([FIXTURE, "--out", d, "--days", "2", "--from-day", "2"]);
    exportFeed(d, "2026-09-22");
    day2 = readFileSync(join(d, "feed/events.jsonl"), "utf8");
  });

  it("a day that only CONFIRMS moves the feed pages and no claim page", () => {
    const cursor = { cursor_seq: day1.trimEnd().split("\n").length - 1 };
    // The sealed subject's day 2 is CONFIRMED everywhere; the only atom that moved for it is the derived byte pointer.
    const r = changedPages(day2, { ...deps, pages: deps.pages.filter((p) => !p.url.includes("/p/open")) }, cursor);
    expect(r.pages.map((p) => p.url)).toEqual(["https://councilof.ai/api/claims/events"]);
    expect(r.pinged).toBe(false);
  });

  it("an atom that changed moves exactly the pages that depend on it, with that line's time as lastmod", () => {
    const cursor = { cursor_seq: day1.trimEnd().split("\n").length - 1 };
    const r = changedPages(day2, deps, cursor);
    const urls = r.pages.map((p) => p.url);
    expect(urls).toContain("https://councilof.ai/p/open-key");
    expect(urls).toContain("https://councilof.ai/p/open-claim-2"); // QUARANTINED
    expect(urls).not.toContain("https://councilof.ai/p/open-claim-1"); // CONFIRMED again
    expect(urls).not.toContain("https://councilof.ai/p/sealed-any-claim");
    expect(r.lastmod["https://councilof.ai/p/open-key"]).toBe("2026-09-22T07:50:02Z");
    expect(r.indexnow.urlList).toEqual(urls);
    expect(r.next_state.cursor_seq).toBe(day2.trimEnd().split("\n").length - 1);
    // Nothing new after the cursor: nothing to announce.
    expect(changedPages(day2, deps, r.next_state).pages).toEqual([]);
  });

  it("has no network code: it computes the list and pings nothing", () => {
    const src = readFileSync(join(HERE, "claim-events-changed-pages.mjs"), "utf8").replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "");
    expect(src).not.toMatch(/\bfetch\s*\(|node:https?|node:net|node:dgram|XMLHttpRequest|WebSocket|child_process/);
  });

  it("the committed page-deps manifest names only real feed routes", () => {
    const m = JSON.parse(readFileSync(join(HERE, "claim-events-page-deps.json"), "utf8"));
    for (const p of m.pages) expect(p.url).toMatch(/^https:\/\/councilof\.ai\/api\/claims\/events(\/head)?$/);
  });
});
