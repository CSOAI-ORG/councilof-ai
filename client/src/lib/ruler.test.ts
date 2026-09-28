import { createHash, createPublicKey, verify } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import bankData from "@/data/ruler-jail-goldbank.json";
import {
  RULER_ROUND_SIZE,
  betSetup,
  clearSession,
  fnv1a,
  loadSession,
  pickRound,
  publishedModels,
  saveSession,
  scoreBet,
  scoreLabel,
  seededCoin,
  summarizeRound,
  type RoundAnswer,
  type RulerItem,
} from "./ruler";

const ITEMS = bankData.items as RulerItem[];
const REPO = resolve(__dirname, "../../..");

function item(id: string, gold: "ESCAPE" | "BENIGN", answers: Record<string, "ESCAPE" | "BENIGN" | null>): RulerItem {
  return { id, line_sha256: "0".repeat(64), code: "print(1)", gold, note: "n", classes: [], model_answers: answers };
}

describe("the ruler — determinism", () => {
  it("FNV-1a matches the published reference vectors", () => {
    expect(fnv1a("")).toBe(0x811c9dc5);
    expect(fnv1a("a")).toBe(0xe40c292c);
    expect(fnv1a("foobar")).toBe(0xbf9cf968);
  });

  it("the same seed picks the same round, and never mutates the bank", () => {
    const before = ITEMS.map((i) => i.id).join(",");
    const a = pickRound(ITEMS, "0badc0de").map((i) => i.id);
    const b = pickRound(ITEMS, "0badc0de").map((i) => i.id);
    expect(a).toEqual(b);
    expect(a).toHaveLength(RULER_ROUND_SIZE);
    expect(new Set(a).size).toBe(a.length);
    expect(ITEMS.map((i) => i.id).join(",")).toBe(before);
    expect(pickRound(ITEMS, "12345678").map((i) => i.id)).not.toEqual(a);
  });

  it("round order does not depend on the order the bank was listed in", () => {
    const reversed = [...ITEMS].reverse();
    expect(pickRound(reversed, "cafef00d").map((i) => i.id)).toEqual(pickRound(ITEMS, "cafef00d").map((i) => i.id));
  });

  it("a seeded coin is stable per (seed, key) and not constant", () => {
    expect(seededCoin("aa", "k")).toBe(seededCoin("aa", "k"));
    const flips = Array.from({ length: 200 }, (_, i) => seededCoin("s", `k${i}`));
    const heads = flips.filter(Boolean).length;
    expect(heads).toBeGreaterThan(60);
    expect(heads).toBeLessThan(140);
  });
});

describe("the ruler — scoring is exact match, nothing else", () => {
  it("a label scores only when it equals gold", () => {
    const esc = item("x", "ESCAPE", {});
    expect(scoreLabel("ESCAPE", esc)).toBe(true);
    expect(scoreLabel("BENIGN", esc)).toBe(false);
  });

  it("no published answer → no bet offered", () => {
    const s = betSetup(item("x", "ESCAPE", { m: null }), "00000000");
    expect(s.kind).toBe("unpublished");
    expect(scoreBet("A", s)).toBe("unscored");
  });

  it("the model seat carries exactly the published answer, and the other seat is the opposite", () => {
    let bets = 0;
    let ties = 0;
    for (let n = 0; n < 64; n += 1) {
      const seed = n.toString(16).padStart(8, "0");
      const it1 = item("x", "ESCAPE", { m: "BENIGN" });
      const s = betSetup(it1, seed);
      if (s.kind === "bet") {
        bets += 1;
        expect(s.model).toBe("m");
        expect(s.seats[s.modelSeat]).toBe("BENIGN");
        expect(s.seats[s.modelSeat === "A" ? "B" : "A"]).toBe("ESCAPE");
        expect(scoreBet(s.modelSeat, s)).toBe("correct");
        expect(scoreBet(s.modelSeat === "A" ? "B" : "A", s)).toBe("wrong");
        expect(scoreBet(null, s)).toBe("unscored");
      } else {
        ties += 1;
        expect(s.kind).toBe("indistinguishable");
        expect(scoreBet("A", s)).toBe("unscored");
      }
    }
    expect(bets).toBeGreaterThan(0);
    expect(ties).toBeGreaterThan(0);
  });

  it("a model with no usable answer is never seated", () => {
    for (let n = 0; n < 32; n += 1) {
      const s = betSetup(item("x", "ESCAPE", { a: null, b: "ESCAPE" }), `${n}`.padStart(8, "0"));
      if (s.kind !== "unpublished") expect(s.model).toBe("b");
    }
  });

  it("summary keeps the player, each model and the baseline as separate tallies", () => {
    const round = [
      item("1", "ESCAPE", { m: "ESCAPE", n: null }),
      item("2", "BENIGN", { m: "ESCAPE", n: "BENIGN" }),
      item("3", "ESCAPE", { m: "BENIGN", n: "BENIGN" }),
    ];
    const answers: Record<string, RoundAnswer> = {
      "1": { label: "ESCAPE", bet: null },
      "2": { label: "ESCAPE", bet: null },
    };
    const s = summarizeRound(round, answers, "00000000");
    expect(s).toMatchObject({ items: 3, labelled: 2, labelCorrect: 1, betsScored: 0, betsUnscored: 2, alwaysEscapeCorrect: 2 });
    expect(s.models).toEqual([
      { model: "m", answered: 3, correct: 1, noAnswer: 0 },
      { model: "n", answered: 2, correct: 1, noAnswer: 1 },
    ]);
    expect(summarizeRound(round, answers, "00000000")).toEqual(s);
  });
});

describe("the ruler — local session only", () => {
  function memoryStorage() {
    const m = new Map<string, string>();
    return {
      getItem: (k: string) => m.get(k) ?? null,
      setItem: (k: string, v: string) => void m.set(k, v),
      removeItem: (k: string) => void m.delete(k),
      map: m,
    };
  }

  it("round-trips a session and drops anything malformed", () => {
    const s = memoryStorage();
    saveSession(s, { seed: "0badc0de", answers: { a: { label: "ESCAPE", bet: "A" } } });
    expect(loadSession(s)).toEqual({ seed: "0badc0de", answers: { a: { label: "ESCAPE", bet: "A" } } });
    s.map.set("coai.ruler.session.v1", JSON.stringify({ seed: "0badc0de", answers: { a: { label: "MAYBE" }, b: { label: "BENIGN", bet: "Z" } } }));
    expect(loadSession(s)).toEqual({ seed: "0badc0de", answers: { b: { label: "BENIGN", bet: null } } });
    s.map.set("coai.ruler.session.v1", "{not json");
    expect(loadSession(s)).toBeNull();
    clearSession(s);
    expect(loadSession(s)).toBeNull();
  });

  it("blocked storage never throws", () => {
    const throwing = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
      removeItem: () => {
        throw new Error("blocked");
      },
    };
    expect(loadSession(throwing)).toBeNull();
    expect(() => saveSession(throwing, { seed: "0badc0de", answers: {} })).not.toThrow();
    expect(() => clearSession(throwing)).not.toThrow();
    expect(loadSession(null)).toBeNull();
  });
});

describe("the ruler — its items are the frozen bank and its model answers are the signed evidence", () => {
  const evidencePath = resolve(REPO, "public/interop/jail-peritem-v3.json");
  const evidence = JSON.parse(readFileSync(evidencePath, "utf8"));

  it("the evidence file still verifies (content_id and Ed25519)", () => {
    const { signature, content_id: contentId, ...body } = evidence;
    const canonical = (v: unknown): string =>
      v === null || typeof v !== "object"
        ? JSON.stringify(v)
        : Array.isArray(v)
          ? `[${v.map(canonical).join(",")}]`
          : `{${Object.keys(v as object)
              .sort()
              .map((k) => `${JSON.stringify(k)}:${canonical((v as Record<string, unknown>)[k])}`)
              .join(",")}}`;
    expect(createHash("sha256").update(canonical(body), "utf8").digest("hex")).toBe(contentId);
    const key = createPublicKey({
      key: { kty: "OKP", crv: "Ed25519", x: Buffer.from(signature.pubkey, "base64").toString("base64url") },
      format: "jwk",
    });
    expect(verify(null, Buffer.from(contentId, "utf8"), key, Buffer.from(signature.sig, "base64"))).toBe(true);
    expect(bankData.evidence.content_id).toBe(contentId);
  });

  it("every model answer on the page is exactly what the signed evidence records, and none is invented", () => {
    const models = Object.keys(evidence.models).sort();
    expect(bankData.evidence.models).toEqual(models);
    for (const it1 of ITEMS) {
      expect(Object.keys(it1.model_answers).sort()).toEqual(models);
      for (const model of models) {
        const row = evidence.models[model].rows.find((r: { id: string }) => r.id === it1.id);
        const expected = row ? (row.detected === true ? "ESCAPE" : row.detected === false ? "BENIGN" : null) : null;
        expect(it1.model_answers[model], `${model} on ${it1.id}`).toBe(expected);
        if (row) expect(row.kind).toBe(it1.gold);
      }
      expect(publishedModels(it1).every((m) => it1.model_answers[m] !== null)).toBe(true);
    }
  });

  it("names the frozen bank digest, not the placeholder bank, and accounts for every row", () => {
    expect(bankData.bank.sha256).toBe("0b45b620f2277c364275420f812e9415698e3b8bf0b105a7bbb4c2b2627d0f4a");
    expect(JSON.stringify(bankData)).not.toMatch(/f0f31f9a/);
    expect(ITEMS.length + bankData.withheld.length).toBe(bankData.bank.rows);
    expect(new Set([...ITEMS.map((i) => i.id), ...bankData.withheld.map((w) => w.id)]).size).toBe(bankData.bank.rows);
    for (const i of ITEMS) expect(i.gold === "ESCAPE" || i.gold === "BENIGN").toBe(true);
  });

  it("ships no internal codename in any item it can display", () => {
    expect(JSON.stringify(bankData)).not.toMatch(/\bsovos\b|\bsov3\d*\b|\bdorado\b|\bcibola\b|\bsovereign\b|defoneos/i);
  });
});
