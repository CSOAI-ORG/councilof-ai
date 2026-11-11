import { webcrypto } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ACADEMY_READING_KEY, changeReadingMark, emptyReadingProgress, fingerprintAcademyTrack,
  parseReadingProgress, readReadingProgress, requestedAcademyTrack, reviewedStepsFor,
  saveReadingProgress, type AcademyTrack,
} from "./academyReadingProgress";

const track: AcademyTrack = { id: "board", name: "Read a board", level: "Beginner", mins: 15,
  blurb: "Inspect source evidence.", steps: [{ t: "Read", href: "/dashboard?tab=board" }, { t: "Verify", href: "/gspc-verify/" }] };
const hash = "a".repeat(64);
afterEach(() => vi.unstubAllGlobals());

describe("Academy reading marks", () => {
  it("binds marks to changed wording, destinations and step order", async () => {
    vi.stubGlobal("crypto", webcrypto);
    const original = await fingerprintAcademyTrack(track);
    const marked = changeReadingMark(emptyReadingProgress(), track, original, 0, true);
    expect(reviewedStepsFor(marked, track, original)).toEqual([0]);
    for (const revised of [
      { ...track, blurb: "Inspect changed source evidence." },
      { ...track, steps: [...track.steps].reverse() },
      { ...track, steps: [{ ...track.steps[0], href: "/dashboard?tab=evidence-learning" }, track.steps[1]] },
    ]) {
      const revision = await fingerprintAcademyTrack(revised);
      expect(revision).not.toBe(original);
      expect(reviewedStepsFor(marked, revised, revision)).toEqual([]);
      const updated = changeReadingMark(marked, revised, revision, 1, true);
      expect(updated.versions).toHaveLength(2);
      expect(reviewedStepsFor(updated, track, original)).toEqual([0]);
      expect(reviewedStepsFor(updated, revised, revision)).toEqual([1]);
    }
  });

  it("round-trips an exported record without turning it into an assessment", () => {
    const marked = changeReadingMark(emptyReadingProgress(), track, hash, 0, true);
    const replay = parseReadingProgress(JSON.stringify({ ...marked, passed: true, execution_authority: true }));
    expect(replay).toEqual(marked);
    expect(replay).not.toHaveProperty("passed");
    expect(replay).not.toHaveProperty("execution_authority");
    expect(changeReadingMark(replay, track, hash, 0, false).versions[0].reviewedSteps).toEqual([]);
  });

  it("preserves old track versions and other tracks when changing one mark", () => {
    const old = changeReadingMark(emptyReadingProgress(), track, "b".repeat(64), 1, true);
    const other = changeReadingMark(old, { ...track, id: "practice" }, hash, 0, true);
    const current = changeReadingMark(other, track, hash, 0, true);
    expect(current.versions).toHaveLength(3);
    expect(current.selectedTrack).toBe("board");
    expect(current.versions.slice(0, 2)).toEqual(other.versions);
  });

  it("ignores out-of-range imported marks and refuses an invalid new step", () => {
    const loaded = parseReadingProgress(JSON.stringify({ ...emptyReadingProgress(),
      versions: [{ trackId: "board", sourceSha256: hash, reviewedSteps: [0, 99, 0] }] }));
    expect(reviewedStepsFor(loaded, track, hash)).toEqual([0]);
    expect(reviewedStepsFor(loaded, track, undefined)).toEqual([]);
    expect(() => changeReadingMark(loaded, track, hash, 99, true)).toThrow("Unknown reading step");
  });

  it("rejects malformed, future, duplicate and oversized data without writing", () => {
    const version = { trackId: "board", sourceSha256: hash, reviewedSteps: [0] };
    for (const raw of [
      "broken", JSON.stringify({ schema: "csoai.academy-reading-progress/2" }),
      JSON.stringify({ ...emptyReadingProgress(), versions: [version, version] }),
      JSON.stringify({ ...emptyReadingProgress(), versions: [{ ...version, reviewedSteps: [-1] }] }),
      " ".repeat(200_001),
    ]) {
      const storage = { getItem: () => raw, setItem: vi.fn() };
      expect(readReadingProgress(storage).writable).toBe(false);
      expect(storage.setItem).not.toHaveBeenCalled();
      expect(() => parseReadingProgress(raw)).toThrow();
    }
  });

  it("distinguishes missing storage from unavailable storage and confirms a write by reading it back", () => {
    let value: string | null = null;
    const storage = { getItem: () => value, setItem: (_: string, next: string) => { value = next; } };
    expect(readReadingProgress(storage)).toMatchObject({ writable: true, state: emptyReadingProgress() });
    saveReadingProgress(storage, changeReadingMark(emptyReadingProgress(), track, hash, 0, true));
    expect(readReadingProgress(storage).state.versions[0].reviewedSteps).toEqual([0]);
    expect(readReadingProgress({ getItem: () => { throw new Error("denied"); }, setItem: vi.fn() }).writable).toBe(false);
    const refused = { getItem: () => null, setItem: vi.fn() };
    expect(() => saveReadingProgress(refused, emptyReadingProgress())).toThrow("could not be confirmed");
    expect(refused.setItem.mock.calls[0][0]).toBe(ACADEMY_READING_KEY);
  });

  it("accepts known share links and identifies unknown track requests", () => {
    expect(requestedAcademyTrack("track=board", [track])).toEqual({ id: "board", unknown: false });
    expect(requestedAcademyTrack("", [track])).toEqual({ id: null, unknown: false });
    expect(requestedAcademyTrack("track=https%3A%2F%2Fexample.test", [track])).toEqual({ id: null, unknown: true });
    expect(requestedAcademyTrack("track=", [track]).unknown).toBe(true);
  });
});
