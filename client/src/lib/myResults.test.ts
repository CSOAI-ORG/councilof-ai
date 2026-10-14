/**
 * My results keeps what a lookup actually returned (tools audit, 6 Oct 2026). A server or record
 * lookup was saved before any answer, with no state; My results then searched the paid-request
 * queue for it and said nothing matched.
 */
import { describe, expect, it } from "vitest";
import { lookupAgainHref, lookupFromRun, paidResult, paidSubject, signedRecordOf, PAID_RECORD_MAX_CHARS } from "./myResults";

describe("My results — lookups", () => {
  it("saves the first tool's own state word, the record it cited and the question asked", () => {
    const row = lookupFromRun("github.com", {
      question: "What is measured about github.com?",
      status: "done",
      tools: [{ label: "NOT_MEASURED", citation: { record_id: "2026-10-06T00:00:00Z" } }],
    });
    expect(row).toEqual({
      kind: "lookup",
      subject: "github.com",
      question: "What is measured about github.com?",
      state: "NOT_MEASURED",
      ref: "2026-10-06T00:00:00Z",
    });
  });

  it("a run that returned no tool is listed with no state, never a guessed one", () => {
    const row = lookupFromRun("github.com", { question: "What is measured about github.com?", status: "error", tools: [] });
    expect(row).toEqual({ kind: "lookup", subject: "github.com", question: "What is measured about github.com?" });
  });

  it("'Look up again' re-asks the original question, or refills Get results for a model", () => {
    expect(lookupAgainHref({ subject: "github.com", question: "What is measured about github.com?" })).toBe(
      "/dashboard?ask=What%20is%20measured%20about%20github.com%3F",
    );
    expect(lookupAgainHref({ subject: "qwen3:8b" })).toBe("/dashboard?lookup=qwen3%3A8b");
  });
});

/**
 * Paid results (paid-route lane, 7 Oct 2026). A paid door's deliverable used to be dropped by the
 * paying page and never reached My results, so "pay → My results → verify" stopped at pay.
 */
describe("My results — paid results", () => {
  const leaf = { payload: { kind: "csoai.art50.marking-evidence/0.1" }, sha256: "ab".repeat(32), sig_ed25519: "cd".repeat(64), did: "did:web:csoai.org#board-attestation-1" };
  const door = "https://councilof.ai/api/art50/marking-evidence?url=https%3A%2F%2Fcouncilof.ai%2Fog-image.png";

  it("finds the signed record wherever the door puts it: card, manifest_card or signature", () => {
    expect(signedRecordOf({ card: leaf })).toBe(leaf);
    expect(signedRecordOf({ manifest_card: leaf, cards: {} })).toBe(leaf);
    expect(signedRecordOf({ capsule: {}, signature: { ...leaf, unsigned_reason: null } })?.sha256).toBe(leaf.sha256);
    expect(signedRecordOf({ card: { payload: "not an object", sha256: "x", sig_ed25519: null } })).toBeNull();
    expect(signedRecordOf(null)).toBeNull();
  });

  it("an art50 pack becomes a row with the record id, the transaction and the record itself to check later", () => {
    const row = paidResult({ doorUrl: door, body: { scope: {}, card: leaf }, transaction: "0x" + "ee".repeat(32) });
    expect(row).toMatchObject({ kind: "paid", subject: "art50/marking-evidence · https://councilof.ai/og-image.png", door, state: "DELIVERED · SIGNED", ref: leaf.sha256, tx: "0x" + "ee".repeat(32) });
    expect(JSON.parse(row.record!)).toEqual(leaf);
  });

  it("states what it does not have: no record means no record id and no 'signed'", () => {
    const row = paidResult({ doorUrl: "https://councilof.ai/api/free-door", body: { totals: {} }, transaction: null });
    expect(row).toEqual({ kind: "paid", subject: "free-door", door: "https://councilof.ai/api/free-door", state: "DELIVERED" });
    expect(paidResult({ doorUrl: door, body: { card: { ...leaf, sig_ed25519: null } }, transaction: null }).state).toBe("DELIVERED · UNSIGNED");
  });

  it("does not keep a record too large for this browser's storage; the id still points at it", () => {
    const big = { ...leaf, payload: { blob: "x".repeat(PAID_RECORD_MAX_CHARS) } };
    const row = paidResult({ doorUrl: door, body: { card: big }, transaction: null });
    expect(row.record).toBeUndefined();
    expect(row.ref).toBe(leaf.sha256);
    expect(paidSubject("not a url")).toBe("not a url");
  });
});

describe("My results — saved-result defects (14 Oct 2026)", () => {
  type Store = Record<string, string>;
  const install = (opts: { quotaChars?: number } = {}) => {
    const store: Store = {};
    const ls = {
      getItem: (k: string) => (k in store ? store[k] : null),
      setItem: (k: string, v: string) => {
        if (opts.quotaChars !== undefined && v.length > opts.quotaChars) throw new Error("QuotaExceededError");
        store[k] = v;
      },
      removeItem: (k: string) => void delete store[k],
    };
    (globalThis as unknown as { window: unknown }).window = { localStorage: ls, dispatchEvent: () => true };
    (globalThis as unknown as { Event: unknown }).Event ??= class { constructor(public type: string) {} };
    return store;
  };

  it("two saves with the same timestamp get distinct ids", async () => {
    install();
    const { saveMyResult, readMyResults } = await import("./myResults");
    saveMyResult({ kind: "watch", subject: "a", ref: "r1", at: "2026-10-14T00:00:00Z" });
    saveMyResult({ kind: "watch", subject: "a", ref: "r2", at: "2026-10-14T00:00:00Z" });
    const ids = readMyResults().map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("malformed stored rows are not rendered; a row without an id gets one", async () => {
    const store = install();
    const { readMyResults, MY_RESULTS_KEY } = await import("./myResults");
    store[MY_RESULTS_KEY] = JSON.stringify([
      { kind: "nope", subject: "x", at: "t" },
      { kind: "paid", subject: "x", at: "t", record: { not: "a string" } },
      { kind: "watch", subject: "ok", at: "t" },
      { id: "dup", kind: "watch", subject: "a", at: "t" },
      { id: "dup", kind: "watch", subject: "b", at: "t" },
    ]);
    const rows = readMyResults();
    expect(rows.map((r) => r.subject)).toEqual(["ok", "a", "b"]);
    expect(rows.every((r) => typeof r.id === "string" && r.id)).toBe(true);
    expect(new Set(rows.map((r) => r.id)).size).toBe(3);
  });

  it("the cap never evicts a paid row holding its only signed record before other rows", async () => {
    const { capRows } = await import("./myResults");
    const paid = { id: "p", kind: "paid" as const, subject: "door", at: "t", record: "{}" };
    const others = Array.from({ length: 60 }, (_, i) => ({ id: `w${i}`, kind: "watch" as const, subject: `s${i}`, at: "t" }));
    const kept = capRows([...others, paid], 50);
    expect(kept.length).toBe(50);
    expect(kept).toContain(paid);
  });

  it("a re-saved paid result replaces its earlier row instead of stacking", async () => {
    install();
    const { saveMyResult, readMyResults } = await import("./myResults");
    saveMyResult({ kind: "paid", subject: "art50", ref: "abc", record: "{}" });
    saveMyResult({ kind: "paid", subject: "art50", ref: "abc", record: "{}" });
    expect(readMyResults().filter((r) => r.ref === "abc").length).toBe(1);
  });

  it("when storage is full the outcome says so, and the returned rows are what was actually stored", async () => {
    install({ quotaChars: 10 });
    const { saveMyResult, readMyResults } = await import("./myResults");
    const out = saveMyResult({ kind: "paid", subject: "art50", ref: "abc", record: "x".repeat(100) });
    expect(out.saved).toBe(false);
    expect(out.recordKept).toBe(false);
    expect(out.rows).toEqual(readMyResults());
  });
});

/**
 * Retention contract (14 Oct 2026): automatic cap and quota handling keeps every stored paid record
 * byte-for-byte; when the new row cannot be stored safely the old store is left as it was and the
 * outcome says so. Every case reads the store back rather than trusting the return value.
 */
describe("My results — paid records are never shed", () => {
  type Store = Record<string, string>;
  const install = (opts: { quotaChars?: number; disabled?: boolean; failWrites?: boolean } = {}) => {
    const store: Store = {};
    const ls = {
      getItem: (k: string) => {
        if (opts.disabled) throw new Error("SecurityError");
        return k in store ? store[k] : null;
      },
      setItem: (k: string, v: string) => {
        if (opts.disabled || opts.failWrites) throw new Error("SecurityError");
        if (opts.quotaChars !== undefined && v.length > opts.quotaChars) throw new Error("QuotaExceededError");
        store[k] = v;
      },
      removeItem: (k: string) => void delete store[k],
    };
    const events: string[] = [];
    (globalThis as unknown as { window: unknown }).window = { localStorage: ls, dispatchEvent: (e: { type: string }) => (events.push(e.type), true) };
    (globalThis as unknown as { Event: unknown }).Event ??= class { constructor(public type: string) {} };
    return { store, events, opts };
  };
  const body = (i: number) => JSON.stringify({ payload: { n: i, note: "é\u2028" }, sha256: `sha${i}`, sig_ed25519: `sig${i}` }, null, 2);
  const seedPaid = async (n: number) => {
    const { saveMyResult } = await import("./myResults");
    for (let i = 0; i < n; i++) expect(saveMyResult({ kind: "paid", subject: `door${i}`, ref: `sha${i}`, record: body(i) }).saved).toBe(true);
  };
  const paidBodies = async () => {
    const { readMyResults } = await import("./myResults");
    return Object.fromEntries(readMyResults().filter((r) => r.kind === "paid").map((r) => [r.ref, r.record]));
  };
  const expectAllOld = (got: Record<string, string | undefined>, n: number) => {
    for (let i = 0; i < n; i++) expect(got[`sha${i}`]).toBe(body(i));
  };

  it("50 paid copies + a new lookup: the lookup is not saved, the outcome says so, the store is unchanged", async () => {
    const { store } = install();
    const { saveMyResult, readMyResults, MY_RESULTS_KEY } = await import("./myResults");
    await seedPaid(50);
    const before = store[MY_RESULTS_KEY];
    const out = saveMyResult({ kind: "lookup", subject: "github.com", question: "q" });
    expect(out.saved).toBe(false);
    expect(store[MY_RESULTS_KEY]).toBe(before);
    expect(readMyResults().some((r) => r.kind === "lookup")).toBe(false);
    expectAllOld(await paidBodies(), 50);
  });

  it("a 51st paid copy is kept and evicts no older paid copy", async () => {
    install();
    const { saveMyResult, readMyResults } = await import("./myResults");
    await seedPaid(50);
    const out = saveMyResult({ kind: "paid", subject: "door50", ref: "sha50", record: body(50) });
    expect(out).toMatchObject({ saved: true, recordKept: true });
    expect(readMyResults().length).toBe(51);
    expectAllOld(await paidBodies(), 51);
  });

  it("non-paid rows still give way, oldest first, to keep the list at the cap", async () => {
    install();
    const { saveMyResult, readMyResults } = await import("./myResults");
    await seedPaid(2);
    for (let i = 0; i < 48; i++) saveMyResult({ kind: "watch", subject: `w${i}`, ref: `r${i}` });
    const out = saveMyResult({ kind: "watch", subject: "new", ref: "rn" });
    expect(out.saved).toBe(true);
    const rows = readMyResults();
    expect(rows.length).toBe(50);
    expect(rows[0].subject).toBe("new");
    expect(rows.some((r) => r.subject === "w0")).toBe(false);
    expectAllOld(await paidBodies(), 2);
  });

  it("first write over quota: no slim or bare rewrite sheds stored paid bodies; the new row is stored without its record, truthfully", async () => {
    const env = install();
    const { saveMyResult, readMyResults, MY_RESULTS_KEY } = await import("./myResults");
    await seedPaid(3);
    const before = env.store[MY_RESULTS_KEY];
    // Room for the old list plus a bare row, not for the new record: the old fallbacks would have
    // "succeeded" here by stripping older (slim) or all (bare) purchased records.
    env.opts.quotaChars = before.length + 400;
    const big = "x".repeat(2000);
    const out = saveMyResult({ kind: "paid", subject: "door-new", ref: "shaN", record: big });
    expect(out).toMatchObject({ saved: true, recordKept: false });
    const rows = readMyResults();
    expect(rows[0]).toMatchObject({ ref: "shaN" });
    expect(rows[0].record).toBeUndefined();
    expectAllOld(await paidBodies(), 3);
  });

  it("no room even for a bare row: nothing is written, the old store is byte-identical, saved: false", async () => {
    const env = install();
    const { saveMyResult, MY_RESULTS_KEY } = await import("./myResults");
    await seedPaid(3);
    const before = env.store[MY_RESULTS_KEY];
    env.opts.quotaChars = before.length + 10;
    const out = saveMyResult({ kind: "paid", subject: "door-new", ref: "shaN", record: "y".repeat(500) });
    expect(out).toMatchObject({ saved: false, recordKept: false });
    expect(env.store[MY_RESULTS_KEY]).toBe(before);
    expectAllOld(await paidBodies(), 3);
  });

  it("storage switched off or every write failing: saved: false, nothing claimed", async () => {
    install({ disabled: true });
    const { saveMyResult, saveNote } = await import("./myResults");
    const off = saveMyResult({ kind: "paid", subject: "d", ref: "s", record: "{}" });
    expect(off).toMatchObject({ saved: false, recordKept: false, rows: [] });
    expect(saveNote(off)).toMatch(/could NOT be saved/);
    const env = install();
    await seedPaid(1);
    const before = env.store["coai:my-results"];
    env.opts.failWrites = true;
    expect(saveMyResult({ kind: "watch", subject: "w", ref: "r" }).saved).toBe(false);
    expect(env.store["coai:my-results"]).toBe(before);
  });

  it("a storage-read error or unreadable store is never treated as empty and overwritten", async () => {
    const env = install();
    const { saveMyResult, MY_RESULTS_KEY } = await import("./myResults");
    env.store[MY_RESULTS_KEY] = '[{"kind":"paid","subject":"d","at":"t","record":"KEEP"'; // truncated JSON
    expect(saveMyResult({ kind: "watch", subject: "w", ref: "r" }).saved).toBe(false);
    expect(env.store[MY_RESULTS_KEY]).toBe('[{"kind":"paid","subject":"d","at":"t","record":"KEEP"');
    env.store[MY_RESULTS_KEY] = '{"not":"a list"}';
    expect(saveMyResult({ kind: "watch", subject: "w", ref: "r" }).saved).toBe(false);
    expect(env.store[MY_RESULTS_KEY]).toBe('{"not":"a list"}');
    // getItem throws but setItem would work: nothing is written.
    const kept = install();
    await seedPaid(1);
    const before = kept.store[MY_RESULTS_KEY];
    const ls = (globalThis as unknown as { window: { localStorage: { getItem: unknown } } }).window.localStorage;
    ls.getItem = () => {
      throw new Error("SecurityError");
    };
    expect(saveMyResult({ kind: "paid", subject: "n", ref: "n", record: "{}" })).toMatchObject({ saved: false, recordKept: false });
    expect(kept.store[MY_RESULTS_KEY]).toBe(before);
  });

  it("a repeat save of a paid ref over quota never strips the stored paid copy", async () => {
    const env = install();
    const { saveMyResult, MY_RESULTS_KEY } = await import("./myResults");
    await seedPaid(2);
    const before = env.store[MY_RESULTS_KEY];
    env.opts.quotaChars = 10; // every write fails
    for (const record of [body(0), undefined]) {
      expect(saveMyResult({ kind: "paid", subject: "door0", ref: "sha0", ...(record ? { record } : {}) })).toMatchObject({ saved: false, recordKept: false });
      expect(env.store[MY_RESULTS_KEY]).toBe(before);
    }
    // Room for a bare replacement row only, not for the full one: the bare fallback is refused.
    env.opts.quotaChars = before.length - JSON.stringify(body(0)).length + 60;
    expect(saveMyResult({ kind: "paid", subject: "door0", ref: "sha0" }).saved).toBe(false);
    expect(env.store[MY_RESULTS_KEY]).toBe(before);
    expectAllOld(await paidBodies(), 2);
  });

  it("same ref with different record bytes never overwrites the stored paid copy", async () => {
    install();
    const { saveMyResult, readMyResults } = await import("./myResults");
    await seedPaid(1);
    const out = saveMyResult({ kind: "paid", subject: "door0", ref: "sha0", record: "DIFFERENT" });
    expect(out).toMatchObject({ saved: true, recordKept: true });
    const recs = readMyResults().filter((r) => r.ref === "sha0").map((r) => r.record);
    expect(recs).toEqual(["DIFFERENT", body(0)]);
  });

  it("first read succeeds, a later read fails, writes allowed: the old paid bytes remain", async () => {
    const env = install();
    const { saveMyResult, MY_RESULTS_KEY } = await import("./myResults");
    await seedPaid(2);
    const before = env.store[MY_RESULTS_KEY];
    const ls = (globalThis as unknown as { window: { localStorage: { getItem: (k: string) => string | null } } }).window.localStorage;
    const real = ls.getItem;
    let reads = 0;
    ls.getItem = (k: string) => {
      reads++;
      if (reads === 1) return real(k);
      throw new Error("SecurityError");
    };
    const out = saveMyResult({ kind: "watch", subject: "w", ref: "r" });
    // Whatever it reports, nothing stored may be lost, and "saved" needs a successful read-back.
    ls.getItem = real;
    const stored = JSON.parse(env.store[MY_RESULTS_KEY]) as { ref?: string; record?: string }[];
    for (let i = 0; i < 2; i++) expect(stored.find((r) => r.ref === `sha${i}`)?.record).toBe(body(i));
    expect(out.saved).toBe(false);
    expect(env.store[MY_RESULTS_KEY]).toBe(before);
  });

  it("a repeat save keeps one row with the exact record, and never loses it to a record-less retry", async () => {
    install();
    const { saveMyResult, readMyResults } = await import("./myResults");
    saveMyResult({ kind: "paid", subject: "door0", ref: "sha0", record: body(0) });
    expect(saveMyResult({ kind: "paid", subject: "door0", ref: "sha0", record: body(0) })).toMatchObject({ saved: true, recordKept: true });
    expect(saveMyResult({ kind: "paid", subject: "door0", ref: "sha0" })).toMatchObject({ saved: true, recordKept: true });
    const rows = readMyResults().filter((r) => r.ref === "sha0");
    expect(rows.length).toBe(1);
    expect(rows[0].record).toBe(body(0));
  });

  it("mocked reopen and download hand back the SAME bytes that were delivered (store re-read, not a browser reload)", async () => {
    const env = install();
    const { saveMyResult, readMyResults, MY_RESULTS_KEY } = await import("./myResults");
    const delivered = body(7);
    saveMyResult({ kind: "paid", subject: "door7", ref: "sha7", record: delivered });
    // Mocked reopen: a new mock store holding the persisted string, re-read by the same module.
    const raw = env.store[MY_RESULTS_KEY];
    install().store[MY_RESULTS_KEY] = raw;
    const again = readMyResults().find((r) => r.ref === "sha7")!;
    expect(again.record).toBe(delivered);
    // Download path: downloadText is handed exactly the stored text.
    const blobs: string[] = [];
    const g = globalThis as unknown as Record<string, unknown>;
    const saved = { Blob: g.Blob, URL: g.URL, document: g.document };
    g.Blob = class { constructor(parts: string[]) { blobs.push(parts.join("")); } };
    g.URL = { createObjectURL: () => "blob:x", revokeObjectURL: () => undefined };
    g.document = { createElement: () => ({ click() {}, remove() {} }), body: { appendChild() {} } };
    try {
      const { downloadText } = await import("./myResults");
      downloadText(again.record!, "r.json");
      expect(blobs).toEqual([delivered]);
    } finally {
      Object.assign(g, saved);
    }
  });

  it("the buyer note follows the outcome, never a guessed 'saved'", async () => {
    const { saveNote } = await import("./myResults");
    expect(saveNote({ rows: [], saved: true, recordKept: true })).toMatch(/saved to My results/);
    expect(saveNote({ rows: [], saved: true, recordKept: false })).toMatch(/download it now/);
    expect(saveNote({ rows: [], saved: false, recordKept: false })).toMatch(/could NOT be saved/);
    expect(saveNote(null)).toBeNull();
  });
});
