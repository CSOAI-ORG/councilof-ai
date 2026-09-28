import { describe, expect, it } from "vitest";
import { boardEntries, liveNote } from "./_board";
import { jsonFeed } from "./board.json";
import { atomFeed } from "./board.atom";
import { SIGNED_BOARD_SNAPSHOTS, newestSnapshot } from "../api/_board_snapshot";
import type { BoardSource } from "../_lib/gspcBoardFacts";
import capture from "../badge/__fixtures__/gspc-2026-09-05.json";

const CAPTURE = capture as any;
const ctx = () => ({ request: new Request("https://councilof.ai/feeds/board.json"), env: {}, waitUntil: () => {} });
const stub = (body: unknown, status = 200): BoardSource => async () => new Response(JSON.stringify(body), { status });
// A live board whose totals equal the newest freeze's, built from the freeze file, not typed.
const newest = newestSnapshot(SIGNED_BOARD_SNAPSHOTS);
const agreeing = (() => {
  const d = JSON.parse(JSON.stringify(CAPTURE));
  for (const k of ["axes", "measured_axes", "unmeasured_axes", "public_count"]) d.totals[k] = newest.doc.totals[k];
  return d;
})();

describe("board-change feeds: one entry per signed freeze, dated by the artifact", () => {
  it("has one entry per registered freeze, newest first, each dated by its status document", () => {
    const e = boardEntries();
    expect(e.length).toBe(SIGNED_BOARD_SNAPSHOTS.length);
    const iso = e.map((x) => x.iso);
    expect([...iso].sort().reverse()).toEqual(iso);
    for (const s of SIGNED_BOARD_SNAPSHOTS) expect(iso).toContain(s.status.frozen_at);
  });
  it("prints each freeze's own public_count and claim state, and keeps superseded freezes", () => {
    const e = boardEntries();
    for (const s of SIGNED_BOARD_SNAPSHOTS) {
      const x = e.find((y) => y.iso === s.status.frozen_at)!;
      expect(x.public_count).toBe(s.doc.totals.public_count);
      expect(x.state).toBe(s.status.state);
      expect(x.title).toContain(s.doc.totals.public_count);
      expect(x.link).toBe(`https://councilof.ai/${s.source.replace(/^public\//, "")}`);
    }
    expect(e.some((x) => x.state !== "CURRENT")).toBe(true);
    expect(e.find((x) => x.superseded_by)?.body).toContain("superseded by https://councilof.ai/signed/");
  });
  it("ids are stable (file + content id), never a list position", () => {
    const a = boardEntries().map((x) => x.id);
    const b = boardEntries([...SIGNED_BOARD_SNAPSHOTS].reverse()).map((x) => x.id);
    expect(a).toEqual(b);
    for (const id of a) expect(id).toMatch(/^https:\/\/councilof\.ai\/signed\/gspc-board[^#]*\.signed\.json#/);
  });
});

describe("live board versus the newest freeze: said, not hidden", () => {
  it("agrees when the live totals equal the newest CURRENT freeze", () => {
    const n = liveNote({ facts: { public_count: newest.doc.totals.public_count, as_of: null, separation_public_count: null, axes: newest.doc.totals.axes, measured_axes: newest.doc.totals.measured_axes, unmeasured_axes: newest.doc.totals.unmeasured_axes, doi: null, doi_note: null } });
    expect(n.newest_signed_freeze_agrees).toBe(newest.status.state === "CURRENT");
  });
  it("a drifted live board is reported as differing, with the live count quoted", () => {
    const n = liveNote({ facts: { public_count: "99 axis · 1 measured", as_of: null, separation_public_count: null, axes: 99, measured_axes: 1, unmeasured_axes: 98, doi: null, doi_note: null } });
    expect(n.newest_signed_freeze_agrees).toBe(false);
    expect(n.note).toContain("99 axis · 1 measured");
    expect(n.note).toContain("differs from the newest signed freeze");
  });
  it("an unread live board is null, not false, and the freezes are still listed", async () => {
    const f = await jsonFeed(ctx(), stub({}, 503));
    expect(f._gspc.live).toBe("unread");
    expect(f._gspc.newest_signed_freeze_agrees).toBeNull();
    expect(f.items.length).toBe(SIGNED_BOARD_SNAPSHOTS.length);
  });
});

describe("/feeds/board.json and /feeds/board.atom", () => {
  it("JSON Feed 1.1 shape", async () => {
    const f = await jsonFeed(ctx(), stub(agreeing));
    expect(f.version).toBe("https://jsonfeed.org/version/1.1");
    expect(f.feed_url).toBe("https://councilof.ai/feeds/board.json");
    expect(f.home_page_url).toBe("https://councilof.ai/gspc");
    expect(f._gspc.live_public_count).toBe(newest.doc.totals.public_count);
    for (const i of f.items) {
      expect(typeof i.id).toBe("string");
      expect(i.content_text.length).toBeGreaterThan(0);
      expect(Number.isNaN(Date.parse(i.date_published))).toBe(false);
    }
  });
  it("Atom carries the same entries, its updated is the newest freeze's date, and drift is in the subtitle", async () => {
    const drifted = JSON.parse(JSON.stringify(agreeing));
    drifted.totals.axes = 999;
    const x = await atomFeed(ctx(), stub(drifted));
    expect(x).toMatch(/^<\?xml/);
    expect(x).toContain('<link rel="self" href="https://councilof.ai/feeds/board.atom"/>');
    const e = boardEntries();
    expect((x.match(/<entry>/g) ?? []).length).toBe(e.length);
    expect(x).toContain(`<updated>${new Date(e[0].iso).toISOString()}</updated>`);
    expect(x).toContain("differs from the newest signed freeze");
  });
});
