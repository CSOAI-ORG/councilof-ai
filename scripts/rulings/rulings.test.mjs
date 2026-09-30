// csoai.ruling/0.1 — the records on disk, their signatures, the index, and the rule that a
// ruling can never carry or change a measured state. No fixture key and no stub signer: the
// signatures under test are the ones committed, verified under the pinned board key.
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  BOARD_KEY_HEX, MEASURED_STATE_KEYS, buildIndex, checkRecord, checkSigned, contentId,
} from "./ruling-lib.mjs";
import { PANEL_NOT_CONVENED, PanelNotConvened, measurePanelNEff, reviewRuling } from "./panel.mjs";

const REPO = resolve(__dirname, "../..");
const DIR = join(REPO, "public/signed/rulings");
const clone = (o) => JSON.parse(JSON.stringify(o));
const files = readdirSync(DIR).filter((f) => /^R-\d{4}-\d{4}-\d{2}\.json$/.test(f)).sort();
const records = files.map((f) => JSON.parse(readFileSync(join(DIR, f), "utf8")));
const index = JSON.parse(readFileSync(join(DIR, "index.json"), "utf8"));
const unsigned = (r) => { const { signature: _s, ...b } = clone(r); return b; };

describe("ruling records on disk", () => {
  it("there are records, and each file is named by its ruling_id", () => {
    expect(records.length).toBeGreaterThanOrEqual(8);
    records.forEach((r, i) => expect(files[i]).toBe(`${r.ruling_id}.json`));
  });

  it("every record passes the producer's checks", () => {
    for (const r of records) expect(checkRecord(r)).toBe(true);
  });

  it("every signature verifies under the pinned board key and commits to these bytes (VALID)", () => {
    for (const r of records) {
      expect(r.signature.key_ed25519_hex).toBe(BOARD_KEY_HEX);
      expect(checkSigned(r).state, r.ruling_id).toBe("VALID");
    }
  });

  it("an edit after signing reads STALE; a corrupted signature reads INVALID_SIGNATURE", () => {
    const r = clone(records[0]);
    r.owner_ruling_verbatim += " (edited)";
    expect(checkSigned(r).state).toBe("STALE");
    const s = clone(records[0]);
    s.signature.sig_ed25519 = (s.signature.sig_ed25519[0] === "0" ? "1" : "0") + s.signature.sig_ed25519.slice(1);
    expect(checkSigned(s).state).toBe("INVALID_SIGNATURE");
    const moved = clone(records[0]);
    moved.signature.attestation.content_id = contentId(r).content_id; // re-point the digest without re-signing
    expect(checkSigned(moved).state).toBe("INVALID_SIGNATURE");
  });

  it("the backfill: panel not convened, n_eff UNMEASURED, owner binds, words present", () => {
    for (const r of records.filter((x) => x.ruling_id <= "R-2026-0929-06")) {
      expect(r.reviewers).toEqual([]);
      expect(r.panel_state).toBe("NOT_CONVENED");
      expect(r.panel_n_eff).toBe("UNMEASURED");
      expect(r.panel_note).toBe("panel not yet convened");
      expect(r.binding).toBe("OWNER");
      expect(r.owner_ruling_verbatim.length).toBeGreaterThan(0);
    }
  });
});

describe("the index lists every record", () => {
  it("count, ids and content_ids match the files exactly", () => {
    expect(index.count).toBe(records.length);
    expect(index.rulings.map((x) => x.ruling_id)).toEqual(records.map((r) => r.ruling_id));
    records.forEach((r, i) => expect(index.rulings[i].content_id).toBe(contentId(r).content_id));
    const { signature: _s, ...body } = index;
    expect(body).toEqual(buildIndex(records));
  });

  it("the index signature is VALID, and dropping a record makes it STALE", () => {
    expect(checkSigned(index, { kind: "index" }).state).toBe("VALID");
    const short = clone(index);
    short.rulings.pop();
    short.count -= 1;
    expect(checkSigned(short, { kind: "index" }).state).toBe("STALE");
  });

  it("the generated data module serves the same bytes as the files", async () => {
    const mod = await import(join(REPO, "functions/api/_rulings_data.ts"));
    expect(mod.RULINGS).toEqual(records);
    expect(mod.RULINGS_INDEX).toEqual(index);
  });
});

describe("a ruling cannot change a measured state", () => {
  const base = () => unsigned(records[0]);

  it("refuses a measured-state key at the top level and at any depth", () => {
    for (const k of ["state", "measured_state", "separation", "grade", "set_state"]) {
      const r = base(); r[k] = "MEASURED";
      expect(() => checkRecord(r), k).toThrow(/measured-state field/);
    }
    const nested = base();
    nested.evidence[0].status = "SEPARATED";
    expect(() => checkRecord(nested)).toThrow(/measured-state field/);
    expect(MEASURED_STATE_KEYS.has("panel_state")).toBe(false);
  });

  it("refuses effect.writes_measured_state or effect.writes_board true", () => {
    const a = base(); a.effect.writes_measured_state = true;
    expect(() => checkRecord(a)).toThrow(/writes_measured_state/);
    const b = base(); b.effect.writes_board = true;
    expect(() => checkRecord(b)).toThrow(/writes_board/);
  });

  it("rule_output is recorded from the committed rule, never authored by the ruling", () => {
    const jail = records.find((r) => r.class === "board-change" && r.rule_output);
    expect(jail).toBeTruthy();
    expect(jail.rule_output.origin).toBe("rule");
    const r = unsigned(jail);
    r.rule_output.origin = "owner";
    expect(() => checkRecord(r)).toThrow(/origin must be 'rule'/);
    const noCommit = unsigned(jail);
    noCommit.rule_output.computed_by = "the owner said so";
    expect(() => checkRecord(noCommit)).toThrow(/computed_by/);
    // Changing the recorded output of a signed ruling cannot pass as the signed record.
    const flipped = clone(jail);
    flipped.rule_output.value = "SEPARATED";
    expect(checkSigned(flipped).state).toBe("STALE");
  });

  it("the board's handlers import nothing from the rulings surface", () => {
    const api = join(REPO, "functions/api");
    const board = readdirSync(api).filter((f) => /^(_?gspc|board|state|root)[^/]*\.ts$/.test(f) && !f.endsWith(".test.ts"));
    expect(board.length).toBeGreaterThan(0);
    for (const f of board) expect(readFileSync(join(api, f), "utf8"), f).not.toMatch(/rulings/);
  });
});

describe("panel: advisory, measured, stub only", () => {
  it("no reviewers means NOT_CONVENED and UNMEASURED", () => {
    const r = base0(); r.panel_state = "ADVISORY";
    expect(() => checkRecord(r)).toThrow(/NOT_CONVENED/);
  });

  it("a panel below n_eff 2 is ADVISORY, never INDEPENDENT", () => {
    const r = base0();
    r.reviewers = [{ provider: "p1", model: "m1", verdict: "CONCUR", rationale_hash: "a".repeat(64) }];
    r.panel_n_eff = "1.4";
    r.panel_state = "INDEPENDENT";
    expect(() => checkRecord(r)).toThrow(/ADVISORY/);
    r.panel_state = "ADVISORY";
    expect(checkRecord(r)).toBe(true);
  });

  it("fault-tolerance vocabulary is refused until 4 keyed reviewers and n_eff >= 4", () => {
    const r = base0(); r.panel_note = "a BFT panel";
    expect(() => checkRecord(r)).toThrow(/fault-tolerance/);
  });

  it("the stub calls no provider", async () => {
    const f = vi.spyOn(globalThis, "fetch");
    await expect(reviewRuling({}, [{ provider: "x", model: "y" }])).rejects.toBeInstanceOf(PanelNotConvened);
    expect(measurePanelNEff([])).toBe("UNMEASURED");
    expect(f).not.toHaveBeenCalled();
    expect(PANEL_NOT_CONVENED.panel_n_eff).toBe("UNMEASURED");
    f.mockRestore();
  });
});

function base0() { return unsigned(records[0]); }
