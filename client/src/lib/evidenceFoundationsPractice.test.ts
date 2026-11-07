import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createPracticeNote, CURRICULUM_SOURCE, lessonProgress, type PracticeAttempt } from "./evidenceFoundationsPractice";
const at = "2026-09-29T00:00:00.000Z";
const sample: PracticeAttempt = { lessonId: "source-identity", choiceId: "identify", correct: true, attemptedAt: at };
describe("practice note source and semantic identity", () => {
  it("pins the exact current curriculum source rather than only its schema label", () => {
    const raw = readFileSync(new URL("../data/evidence-foundations.ts", import.meta.url));
    expect(createHash("sha256").update(raw).digest("hex")).toBe(CURRICULUM_SOURCE.sha256);
    expect(createHash("sha256").update(Buffer.concat([raw, Buffer.from("changed")])).digest("hex")).not.toBe(CURRICULUM_SOURCE.sha256);
  });
  it("makes a detached export without mutating its input", () => {
    const attempts = [sample]; const note = createPracticeNote(attempts, at);
    expect(note.attempts[0]).not.toBe(sample); expect(attempts).toEqual([sample]);
    expect(note.curriculum[0].id).toBe("source-identity");
  });
  it.each(["unknown-lesson", "__proto__"])("rejects unknown lesson %s", (lessonId) => {
    expect(() => createPracticeNote([{...sample, lessonId}], at)).toThrow();
  });
  it("rejects a choice from a different lesson", () => {
    expect(() => createPracticeNote([{...sample, choiceId: "supersede"}], at)).toThrow();
  });
  it("rejects a contradictory recorded answer without silently relabelling it", () => {
    expect(() => createPracticeNote([{...sample, correct: false}], at)).toThrow();
  });
  it("rejects invalid clocks", () => {
    expect(() => createPracticeNote([sample], "invalid")).toThrow();
    expect(() => createPracticeNote([{...sample, attemptedAt: "invalid"}], at)).toThrow();
  });
  it("keeps latest state separate from supported history", () => {
    expect(lessonProgress("source-identity", [sample, {...sample, choiceId: "accept", correct: false}])).toMatchObject({supported: true, latestCorrect: false});
  });
});


describe("practice export clock and history boundaries", () => {
  it.each([
    "2026-09-29T00:00:00",
    "2026-02-30T00:00:00.000Z",
    "2025-02-29T00:00:00.000Z",
    "2026-09-29T24:00:00.000Z",
    "2026-09-29T00:00:00Z",
    "2026-09-29T00:00:00.000+01:00",
  ])("rejects clocks outside the canonical browser-export profile: %s", (clock) => {
    expect(() => createPracticeNote([sample], clock)).toThrow();
    expect(() => createPracticeNote([{...sample, attemptedAt: clock}], at)).toThrow();
  });
  it("accepts a genuine leap day without changing the recorded timestamp", () => {
    const leap = "2024-02-29T23:59:59.123Z";
    const value = createPracticeNote([{...sample, attemptedAt: leap}], leap);
    expect(value.exported_at).toBe(leap); expect(value.attempts[0].attemptedAt).toBe(leap);
  });
  it("does not coerce a boxed string into a trustworthy clock", () => {
    expect(() => createPracticeNote([sample], new String(at) as unknown as string)).toThrow();
  });
  it("rejects sparse history rather than exporting invented null attempts", () => {
    expect(() => createPracticeNote(new Array<PracticeAttempt>(1), at)).toThrow();
  });
  it("labels client clocks unverified and preserves interaction order across a clock rollback", () => {
    const later = {...sample, attemptedAt: "2026-09-29T00:02:00.000Z"};
    const earlier = {...sample, choiceId: "accept", correct: false, attemptedAt: at};
    const value = createPracticeNote([later, earlier], at);
    expect(value).toMatchObject({clock_basis: "UNVERIFIED_CLIENT_WALL_CLOCK", attempt_order: "RECORDED_ARRAY_ORDER_NOT_CLOCK_SORTED"});
    expect(value.attempts).toEqual([later, earlier]); expect(value.supported_answer_lesson_count).toBe(1);
  });
});
