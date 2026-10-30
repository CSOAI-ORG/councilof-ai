import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import { onRequestGet } from "./gspc";
import { BANK_LANGUAGE } from "./_gspc_bank_language";
import { LANGUAGE_AXES, axisLanguage, languageLimitation } from "./_gspc_language";
import { servedBankFile } from "./_gspc_power";

/**
 * Lane board-language-field (13 Oct 2026). The board did not say which language its banks are in.
 * These tests hold four things on the SERVED payload:
 *   1. every axis carries a language block, and a language is asserted only where every distinct
 *      item text of the served bank was read (the count equals the board's own distinct_items and
 *      the file is the one the board already binds by sha256);
 *   2. no fact axis is handed a language, and nothing defaults to "en";
 *   3. the limitations line and language_contract carry no number of their own;
 *   4. the new fields are inside the edge signature and outside the living-stamp preimage.
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

type Language =
  | {
      state: "CENSUSED";
      languages: string[];
      english_only: boolean;
      item_texts_read: number;
      texts_by_language: Record<string, number>;
      decided_by: { english_function_word: number; reviewer_reading: number };
      declared: string[];
      declaration_holds: boolean;
      items_with_code_cell?: number;
      source: string;
      note?: string;
    }
  | { state: "UNMEASURED"; reason_code: string; reason: string };

type Axis = {
  axis: string;
  kind: string;
  status: string;
  n: number;
  distinct_items?: number | null;
  language: Language;
};

type Contract = {
  schema: string;
  producer: string;
  review: { file: string; sha256: string; verdicts: number; reviewer: string; reviewed_on: string };
  states: Record<string, string[]>;
  unmeasured_reasons: Record<string, string[]>;
  languages_found: string[];
  item_texts_read: number;
  texts_by_language: Record<string, number>;
  decided_by: { english_function_word: number; reviewer_reading: number };
  english_only_axes: string[];
  not_english_only_axes: string[];
  declaration_does_not_hold: string[];
};

type Payload = {
  axes: Axis[];
  limitations: string[];
  language_contract: Contract;
  state_enum: { language_state: string[]; language_unmeasured_reason_code: string[] };
  measured_on: { living_stamp: { preimage?: { axes: Record<string, unknown>[] }; signature?: string } };
  site_attestation?: { sig: string; public_key_x: string };
};

async function served(search = "", env: Record<string, unknown> = {}): Promise<Payload> {
  (globalThis as unknown as { caches: unknown }).caches = {
    default: { match: async () => undefined, put: async () => undefined },
  };
  const res = await onRequestGet({
    request: new Request("https://councilof.ai/api/gspc" + search),
    env,
    waitUntil: () => undefined,
  } as unknown as Parameters<typeof onRequestGet>[0]);
  return (await res.json()) as Payload;
}

const censused = (a: Axis): a is Axis & { language: Extract<Language, { state: "CENSUSED" }> } => a.language.state === "CENSUSED";
const languageLines = (p: Payload) => p.limitations.filter((l) => l.startsWith("Language:"));

describe("GET /api/gspc — the language of each axis's items", () => {
  let body: Payload;
  beforeAll(async () => { body = await served(); });

  it("every axis carries a language block in a served state", () => {
    expect(body.axes.length).toBeGreaterThan(0);
    for (const a of body.axes) {
      expect(a.language, a.axis).toBeTruthy();
      expect(body.state_enum.language_state, a.axis).toContain(a.language.state);
      if (a.language.state === "UNMEASURED") {
        expect(body.state_enum.language_unmeasured_reason_code, a.axis).toContain(a.language.reason_code);
        expect(a.language.reason.length, a.axis).toBeGreaterThan(20);
      }
    }
  });

  it("a language is asserted only from a full read of the served bank's own bytes", () => {
    const cmp = body.axes.filter((a) => a.kind === "model-comparison");
    expect(cmp.length).toBeGreaterThan(0);
    for (const a of cmp) {
      expect(a.language.state, a.axis).toBe("CENSUSED");
      if (!censused(a)) continue;
      const l = a.language;
      // every distinct item the board counts was read — no more, no fewer
      expect(l.item_texts_read, a.axis).toBe(a.distinct_items);
      expect(Object.values(l.texts_by_language).reduce((s, k) => s + k, 0), a.axis).toBe(l.item_texts_read);
      expect(l.decided_by.english_function_word + l.decided_by.reviewer_reading, a.axis).toBe(l.item_texts_read);
      expect(l.languages, a.axis).toEqual(Object.keys(l.texts_by_language));
      expect(l.english_only, a.axis).toBe(l.languages.length === 1 && l.languages[0] === "en");
      expect(l.declaration_holds, a.axis).toBe([...l.languages].sort().join() === [...l.declared].sort().join());
      // the file read is the file distinct_items is counted from, bound by sha256
      const bank = servedBankFile(a.axis);
      expect(bank, a.axis).toBeTruthy();
      expect(LANGUAGE_AXES[a.axis].file_sha256, a.axis).toBe(bank!.sha256);
      expect(l.source, a.axis).toContain(bank!.sha256.slice(0, 16));
    }
  });

  it("says where a bank is not English only, instead of repeating its card", () => {
    const care = body.axes.find((a) => a.axis === "care")!;
    expect(care.language.state).toBe("CENSUSED");
    if (!censused(care)) return;
    expect(care.language.declared).toEqual(["en"]);
    expect(care.language.texts_by_language).toEqual({ en: 198, pt: 1 });
    expect(care.language.english_only).toBe(false);
    expect(care.language.declaration_holds).toBe(false);
    expect(care.language.note).toMatch(/1 of 199 item texts is not English: 1 reads as Portuguese/);
    expect(body.language_contract.not_english_only_axes).toEqual(["care"]);
    expect(body.language_contract.declaration_does_not_hold).toEqual(["care"]);
  });

  it("does not call code a language: jail's items are code cells", () => {
    const jail = body.axes.find((a) => a.axis === "jail")!;
    if (!censused(jail)) throw new Error("jail is not censused");
    expect(jail.language.items_with_code_cell).toBe(jail.language.item_texts_read);
    expect(jail.language.note).toMatch(/Code is not natural language/);
    for (const a of body.axes.filter(censused).filter((x) => x.axis !== "jail")) {
      expect(a.language.items_with_code_cell, a.axis).toBeUndefined();
    }
  });

  it("no fact axis is handed a language, and nothing defaults to en", () => {
    const facts = body.axes.filter((a) => a.kind === "deterministic-facts");
    expect(facts.length).toBeGreaterThan(0);
    for (const a of facts) {
      expect(a.language, a.axis).toMatchObject({ state: "UNMEASURED", reason_code: "NO_PROMPT_BANK" });
      expect(a.language, a.axis).not.toHaveProperty("languages");
      expect(JSON.stringify(a.language), a.axis).not.toMatch(/"en"|English/);
    }
  });

  it("language_contract is summed from the axes and names its producer and review", () => {
    const c = body.language_contract;
    const read = body.axes.filter(censused);
    expect(c.schema).toBe("csoai.gspc-language/0.1");
    expect(c.states.CENSUSED).toEqual(read.map((a) => a.axis));
    expect(c.states.UNMEASURED).toEqual(body.axes.filter((a) => a.language.state === "UNMEASURED").map((a) => a.axis));
    expect(Object.values(c.states).flat()).toHaveLength(body.axes.length);
    expect(Object.values(c.unmeasured_reasons).flat().sort()).toEqual([...c.states.UNMEASURED].sort());
    expect(c.item_texts_read).toBe(read.reduce((s, a) => s + a.language.item_texts_read, 0));
    const totals: Record<string, number> = {};
    for (const a of read) for (const [t, k] of Object.entries(a.language.texts_by_language)) totals[t] = (totals[t] ?? 0) + k;
    expect(c.texts_by_language).toEqual(totals);
    expect([...c.languages_found].sort()).toEqual(Object.keys(totals).sort());
    expect(c.decided_by.english_function_word + c.decided_by.reviewer_reading).toBe(c.item_texts_read);
    expect([...c.english_only_axes, ...c.not_english_only_axes].sort()).toEqual(read.map((a) => a.axis).sort());
    expect(c.producer).toBe("scripts/gspc_bank_language.py");
    expect(c.review.file).toBe("scripts/gspc_bank_language_review.json");
  });

  it("limitations carries one language line, last, with no number of its own", () => {
    const lines = languageLines(body);
    expect(lines).toHaveLength(1);
    expect(body.limitations[body.limitations.length - 1]).toBe(lines[0]);
    // the line that used to be last keeps its place in front of it
    expect(body.limitations[body.limitations.length - 2]).toMatch(/^CSOAI is a measurement body/);
    const c = body.language_contract;
    const cmp = body.axes.filter((a) => a.kind === "model-comparison");
    const facts = body.axes.filter((a) => a.kind === "deterministic-facts");
    const other = c.item_texts_read - c.texts_by_language.en;
    expect(lines[0]).toContain(`${c.states.CENSUSED.length} of the ${cmp.length} model-comparison banks`);
    expect(lines[0]).toContain(`(${c.item_texts_read} distinct item texts)`);
    expect(lines[0]).toContain(`${c.texts_by_language.en} are English`);
    expect(lines[0]).toContain(`${other} is not (1 in care reads as Portuguese)`);
    expect(lines[0]).toContain(`${c.decided_by.english_function_word} were decided by an English function-word rule and ${c.decided_by.reviewer_reading} by a recorded reading`);
    expect(lines[0]).toContain("Outside that 1 text, no number here rests on an item in another language, so nothing here says how a model behaves outside English.");
    expect(lines[0]).toContain(`The ${facts.length} deterministic-facts axes prompt no model; their language is UNMEASURED.`);
    expect(lines[0]).toContain("jail: every item is a code cell");
  });

  it("single-axis views stay true to the one axis they serve", async () => {
    const fact = await served("?axis=effect-binding");
    expect(languageLines(fact)).toEqual([
      "Language: The 1 deterministic-facts axis prompts no model; its language is UNMEASURED. See axes[].language and language_contract.",
    ]);
    expect(fact.language_contract.item_texts_read).toBe(0);
    expect(fact.language_contract.languages_found).toEqual([]);

    const gov = await served("?axis=governance");
    const line = languageLines(gov)[0];
    expect(line).toContain("1 of the 1 model-comparison bank was checked in full");
    expect(line).toMatch(/\(237 distinct item texts\): 237 are English\. /);
    expect(line).toContain("No number here rests on an item in another language");
    expect(line).not.toMatch(/deterministic-facts|Portuguese|jail/);
  });
});

describe("the language block fails closed", () => {
  const gov = { axis: "governance", kind: "model-comparison" } as const;

  it("an axis with no census is UNMEASURED, never English by default", () => {
    expect(axisLanguage({ axis: "an-axis-added-tomorrow", kind: "model-comparison" })).toMatchObject({
      state: "UNMEASURED",
      reason_code: "BANK_NOT_CENSUSED",
    });
  });

  it("a census of a file that is not the served bank is refused", () => {
    expect(axisLanguage(gov)).toMatchObject({ state: "CENSUSED" });
    const swapped = () => ({ file: "peritem_gov.jsonl", sha256: "0".repeat(64) });
    expect(axisLanguage(gov, LANGUAGE_AXES, swapped)).toMatchObject({ state: "UNMEASURED", reason_code: "CENSUS_IS_NOT_THE_SERVED_BANK" });
    expect(axisLanguage(gov, LANGUAGE_AXES, () => undefined)).toMatchObject({ state: "UNMEASURED", reason_code: "CENSUS_IS_NOT_THE_SERVED_BANK" });
  });

  it("one undecided text is enough to withdraw the language", () => {
    const e = LANGUAGE_AXES.governance;
    const undecided = { ...LANGUAGE_AXES, governance: { ...e, state: "UNMEASURED", reason_code: "UNDECIDED_TEXTS", texts_undecided: 1, languages: undefined } };
    const got = axisLanguage(gov, undecided);
    expect(got).toMatchObject({ state: "UNMEASURED", reason_code: "UNDECIDED_TEXTS" });
    expect(got).not.toHaveProperty("languages");
    const noCard = { ...LANGUAGE_AXES, governance: { ...e, state: "UNMEASURED", reason_code: "NO_DECLARATION", declared_languages: null, languages: undefined } };
    expect(axisLanguage(gov, noCard)).toMatchObject({ state: "UNMEASURED", reason_code: "NO_DECLARATION" });
  });

  it("a slot with nothing measured has no language", () => {
    expect(axisLanguage({ axis: "some-slot", kind: "declared-slot" })).toMatchObject({ state: "UNMEASURED", reason_code: "NOTHING_MEASURED" });
  });

  it("the limitations line reports an uncensused comparison axis instead of counting it as English", () => {
    const line = languageLimitation([
      { axis: "governance", kind: "model-comparison", language: axisLanguage(gov) },
      { axis: "new-axis", kind: "model-comparison", language: axisLanguage({ axis: "new-axis", kind: "model-comparison" }) },
    ]);
    expect(line).toContain("1 of the 2 model-comparison banks");
    expect(line).toContain("1 model-comparison axis has no complete language census (new-axis) and reads UNMEASURED.");
  });
});

describe("signing: the new fields are signed at the edge and are not in the living-stamp preimage", () => {
  const canonical = (o: unknown): string => {
    if (o === null || typeof o !== "object") return JSON.stringify(o);
    if (Array.isArray(o)) return "[" + o.map(canonical).join(",") + "]";
    const r = o as Record<string, unknown>;
    return "{" + Object.keys(r).sort().map((k) => JSON.stringify(k) + ":" + canonical(r[k])).join(",") + "}";
  };
  const hexToBytes = (h: string) => Uint8Array.from(h.match(/.{2}/g)!.map((x) => parseInt(x, 16)));

  it("site_attestation verifies over the served bytes with the language fields in them", async () => {
    const kp = (await crypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"])) as CryptoKeyPair;
    const pkcs8 = Buffer.from(await crypto.subtle.exportKey("pkcs8", kp.privateKey)).toString("base64");
    const signed = await served("", { BOARD_SIGN_KEY_PKCS8_B64: pkcs8 });
    expect(signed.site_attestation?.sig).toMatch(/^[0-9a-f]{128}$/);
    expect(signed.axes.every((a) => a.language)).toBe(true);
    expect(signed.language_contract.states.CENSUSED.length).toBeGreaterThan(0);

    const { site_attestation, ...rest } = signed;
    const ok = await crypto.subtle.verify(
      "Ed25519", kp.publicKey, hexToBytes(site_attestation!.sig), new TextEncoder().encode(canonical(rest)),
    );
    expect(ok).toBe(true);

    // The living stamp signs seven named fields per axis. A language key there would change what
    // that stamp means; this change must not reach it.
    const pre = signed.measured_on.living_stamp.preimage!;
    expect(pre.axes).toHaveLength(signed.axes.length);
    for (const a of pre.axes) {
      expect(Object.keys(a).sort()).toEqual(["accuracy", "axis", "family", "kind", "n", "separation", "status"]);
    }
  });
});

describe("the generated census is bound to its producer and its review table", () => {
  it("the module names the review table by the sha256 of the committed file", () => {
    const raw = readFileSync(resolve(ROOT, BANK_LANGUAGE.review.file));
    expect(createHash("sha256").update(raw).digest("hex")).toBe(BANK_LANGUAGE.review.sha256);
    const review = JSON.parse(raw.toString("utf8")) as { axes: Record<string, Record<string, unknown>> };
    expect(Object.values(review.axes).reduce((s, t) => s + Object.keys(t).length, 0)).toBe(BANK_LANGUAGE.review.verdicts);
  });

  it("python3 -m unittest scripts/test_gspc_bank_language.py passes (no network)", () => {
    const out = execFileSync("python3", ["-m", "unittest", "scripts/test_gspc_bank_language.py"], {
      cwd: ROOT, stdio: "pipe", encoding: "utf8",
    });
    // unittest writes its report to stderr; a non-zero exit throws above. stdout is empty on success.
    expect(out).toBe("");
  }, 120_000);
});
