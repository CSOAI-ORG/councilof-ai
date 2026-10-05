// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import EvidenceFoundationsCourse from "./EvidenceFoundationsCourse";
import { EVIDENCE_FOUNDATIONS_LESSONS as lessons } from "../data/evidence-foundations";

let host: HTMLDivElement;
let root: Root;
let createUrl: ReturnType<typeof vi.fn>;
let revokeUrl: ReturnType<typeof vi.fn>;
let clickDownload: ReturnType<typeof vi.spyOn>;
function click(element: Element) {
  act(() => element.dispatchEvent(new MouseEvent("click", { bubbles: true })));
}
function button(label: string): HTMLButtonElement {
  const value = [...host.querySelectorAll("button")].find((row) => row.textContent?.trim() === label);
  if (!value) throw new Error(`Button not found: ${label}`);
  return value;
}
function choose(index: number, correct: boolean) {
  const choice = lessons[index].choices.find((row) => row.correct === correct)!;
  click(button(choice.label));
}
function note() {
  const field = host.querySelector<HTMLTextAreaElement>('[data-testid="practice-note-copy"]');
  if (!field) throw new Error("Copyable note is missing.");
  return JSON.parse(field.value);
}
function selectLesson(index: number) { click(host.querySelectorAll("nav button")[index]); }

beforeEach(() => {
  vi.useFakeTimers();
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  vi.stubGlobal("fetch", vi.fn(() => { throw new Error("Unexpected network request"); }));
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("Unexpected persistence"); });
  createUrl = vi.fn(() => "blob:s06-test");
  revokeUrl = vi.fn();
  Object.defineProperty(URL, "createObjectURL", { configurable: true, value: createUrl });
  Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: revokeUrl });
  clickDownload = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  host = document.createElement("div"); document.body.appendChild(host);
  root = createRoot(host);
  act(() => root.render(<EvidenceFoundationsCourse />));
});
afterEach(() => {
  act(() => root.unmount()); host.remove();
  vi.clearAllTimers(); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals();
});

describe("S06 actual component in a simulated DOM; not browser or human acceptance", () => {
  it("explains session-only progress and exposes all six untried statuses", () => {
    expect(host.textContent).toContain("not saved for a later visit");
    expect(host.textContent).toContain("0 of 6 lessons have a supported answer");
    expect(host.textContent).toContain("not a mastery assessment");
    for (const selector of host.querySelectorAll("nav button")) {
      const status = document.getElementById(selector.getAttribute("aria-describedby")!);
      expect(status?.textContent).toContain("Not tried yet.");
      expect(status?.getAttribute("aria-hidden")).not.toBe("true");
    }
  });
  it("preserves wrong-correct-wrong history while distinguishing latest feedback", () => {
    choose(0, false); choose(0, true); choose(0, false);
    expect(host.textContent).toContain("1 of 6 lessons have a supported answer");
    expect(host.textContent).toContain("Supported answer recorded; latest answer needs another try.");
    expect(host.querySelector('[data-testid="evidence-foundations-feedback"]')?.textContent).toContain("Try again.");
    click(button("Show copyable note"));
    expect(note().attempts.map((row: {correct: boolean}) => row.correct)).toEqual([false, true, false]);
  });
  it("retains answer and progress through lesson navigation", () => {
    choose(0, true); selectLesson(1); selectLesson(0);
    expect(host.querySelector('fieldset button[aria-pressed="true"]')?.textContent).toBe(lessons[0].choices.find((r) => r.correct)!.label);
    expect(host.textContent).toContain("1 of 6 lessons have a supported answer");
  });
  it("does not count repeated supported answers as additional lessons", () => {
    choose(0, true); choose(0, true); click(button("Show copyable note"));
    expect(note().supported_answer_lesson_count).toBe(1); expect(note().attempts).toHaveLength(2);
  });
  it("enforces first and last navigation boundaries", () => {
    expect(button("Previous").disabled).toBe(true);
    selectLesson(5); expect(button("Next lesson").disabled).toBe(true);
    click(button("Previous")); expect(button("Next lesson").disabled).toBe(false);
  });
  it("exports all six lessons with curriculum identity and no admission or mastery", () => {
    lessons.forEach((_, i) => { selectLesson(i); choose(i, true); });
    click(button("Show copyable note")); const value = note();
    expect(value.schema).toBe("csoai.learning-practice-export/0.2");
    expect(value.supported_answer_lesson_count).toBe(6); expect(value.curriculum).toHaveLength(6);
    expect(value.curriculum_source.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(value.identity_state).toBe("UNAUTHENTICATED_SESSION");
    expect(value.assessment_state).toBe("PRACTICE_ONLY_NOT_ASSESSED");
    expect(value.evidence_boundary.createsCertificate).toBe(false);
    expect(value.evidence_boundary.modelTraining).toBe(false);
  });
  it("keeps a selectable note if object-URL creation throws", () => {
    choose(0, true); createUrl.mockImplementation(() => { throw new Error("Unsupported download"); });
    click(button("Export practice note"));
    expect(host.textContent).toContain("download could not be started"); expect(note().attempts).toHaveLength(1);
    expect(clickDownload).not.toHaveBeenCalled();
  });
  it("cleans up and retains the note when the download click throws", () => {
    clickDownload.mockImplementation(() => { throw new Error("Blocked download"); });
    click(button("Export practice note"));
    expect(host.textContent).toContain("download could not be started"); expect(note().attempts).toEqual([]);
    expect(revokeUrl).toHaveBeenCalledOnce(); expect(document.querySelector("a[download]")).toBeNull();
  });
  it("does not assert a saved file when a download is silently suppressed", () => {
    click(button("Export practice note"));
    expect(host.textContent).toContain("Saving is not confirmed");
    expect(host.querySelector<HTMLTextAreaElement>('[data-testid="practice-note-copy"]')?.readOnly).toBe(true);
    expect(clickDownload).toHaveBeenCalledOnce();
  });
  it("prepares copy-only output without invoking download or network", () => {
    click(button("Show copyable note")); expect(note().attempts).toEqual([]);
    expect(createUrl).not.toHaveBeenCalled(); expect(clickDownload).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });
  it("keeps an export snapshot stable until another explicit preparation", () => {
    choose(0, true); click(button("Show copyable note")); const first = note();
    choose(0, false); expect(note()).toEqual(first);
    click(button("Show copyable note")); expect(note().attempts).toHaveLength(2);
  });
  it("starts a remounted session without persisted answers", () => {
    choose(0, true); act(() => root.unmount()); root = createRoot(host);
    act(() => root.render(<EvidenceFoundationsCourse />));
    expect(host.textContent).toContain("0 of 6 lessons have a supported answer");
    expect(host.querySelector('[data-testid="practice-note-copy"]')).toBeNull();
  });
  it("does not immediately revoke a URL and releases it exactly once", () => {
    click(button("Export practice note")); expect(revokeUrl).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(60_000)); expect(revokeUrl).toHaveBeenCalledOnce();
    act(() => vi.advanceTimersByTime(60_000)); expect(revokeUrl).toHaveBeenCalledOnce();
  });
  it("releases pending download URLs on component unmount", () => {
    click(button("Export practice note")); act(() => root.unmount());
    expect(revokeUrl).toHaveBeenCalledOnce(); root = createRoot(host);
  });
  it("keeps IDs and accessible descriptions distinct across two instances", () => {
    act(() => root.render(<><EvidenceFoundationsCourse /><EvidenceFoundationsCourse /></>));
    const ids = [...host.querySelectorAll("[id]")].map((node) => node.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const node of host.querySelectorAll("[aria-describedby]"))
      expect(document.getElementById(node.getAttribute("aria-describedby")!)).not.toBeNull();
  });
  it("states that transfer prompts are not collected or assessed", () => {
    expect(host.textContent).toContain("Your response is not collected or assessed here.");
  });
});


describe("bounded downloads and fault-isolated cleanup", () => {
  it("limits repeated pending downloads to three while preserving copy recovery", () => {
    createUrl.mockImplementationOnce(() => "blob:first").mockImplementationOnce(() => "blob:second").mockImplementationOnce(() => "blob:third");
    choose(0, true);
    for (let i = 0; i < 4; i++) click(button("Export practice note"));
    expect(createUrl).toHaveBeenCalledTimes(3); expect(clickDownload).toHaveBeenCalledTimes(3);
    expect(host.textContent).toContain("Three download requests are still pending");
    expect(note().attempts).toHaveLength(1);
    expect(host.textContent).not.toContain("Saving confirmed");
  });
  it("admits another request after pending URLs expire without changing history", () => {
    for (let i = 0; i < 4; i++) click(button("Export practice note"));
    expect(createUrl).toHaveBeenCalledTimes(3);
    act(() => vi.advanceTimersByTime(60_000));
    click(button("Export practice note")); expect(createUrl).toHaveBeenCalledTimes(4);
    expect(note().attempts).toEqual([]);
  });
  it("keeps copy-only preparation available at the download limit", () => {
    for (let i = 0; i < 3; i++) click(button("Export practice note"));
    choose(0, true); click(button("Show copyable note"));
    expect(createUrl).toHaveBeenCalledTimes(3); expect(note().attempts).toHaveLength(1);
    expect(host.textContent).toContain("Copyable note prepared"); expect(fetch).not.toHaveBeenCalled();
  });
  it("attempts every pending cleanup even if a browser revocation throws", () => {
    for (let i = 0; i < 3; i++) click(button("Export practice note"));
    revokeUrl.mockImplementationOnce(() => { throw new Error("Synthetic revoke failure"); });
    let unmountFailure: unknown;
    try { act(() => root.unmount()); } catch (error) { unmountFailure = error; }
    finally { root = createRoot(host); }
    expect(unmountFailure).toBeUndefined(); expect(revokeUrl).toHaveBeenCalledTimes(3);
    expect(document.querySelector("a[download]")).toBeNull();
  });
});


describe("learner orientation and explicit snapshot continuity; simulated DOM only", () => {
  it("does not take focus from another control during a StrictMode mount", () => {
    act(() => root.unmount());
    const outside = document.createElement("button");
    document.body.appendChild(outside); outside.focus(); root = createRoot(host);
    try {
      act(() => root.render(<React.StrictMode><EvidenceFoundationsCourse /></React.StrictMode>));
      expect(document.activeElement).toBe(outside);
    } finally { outside.remove(); }
  });
  it("orients Next at the new lesson heading without adding it to the tab sequence", () => {
    const next = button("Next lesson"); next.focus(); click(next);
    const heading = host.querySelector("h3");
    expect(heading?.textContent).toBe(lessons[1].title);
    expect(document.activeElement).toBe(heading);
    expect(heading?.getAttribute("tabindex")).toBe("-1");
  });
  it("orients Previous at the selected lesson rather than a now-disabled button", () => {
    selectLesson(1); const previous = button("Previous"); previous.focus(); click(previous);
    expect(button("Previous").disabled).toBe(true);
    expect(host.querySelector("h3")?.textContent).toBe(lessons[0].title);
    expect(document.activeElement).toBe(host.querySelector("h3"));
  });
  it("orients a direct final-lesson selection at that lesson", () => {
    const selector = host.querySelectorAll<HTMLButtonElement>("nav button")[5];
    selector.focus(); click(selector);
    expect(host.querySelector("h3")?.textContent).toBe(lessons[5].title);
    expect(document.activeElement).toBe(host.querySelector("h3"));
    expect(button("Next lesson").disabled).toBe(true);
  });
  it("keeps focus on the current lesson selector when no navigation occurs", () => {
    const current = host.querySelector<HTMLButtonElement>("nav button")!;
    current.focus(); click(current); expect(document.activeElement).toBe(current);
  });
  it("keeps answer focus while changing polite feedback", () => {
    const answer = button(lessons[0].choices.find((row) => !row.correct)!.label);
    answer.focus(); click(answer);
    expect(document.activeElement).toBe(answer);
    const feedback = host.querySelector('[data-testid="evidence-foundations-feedback"]');
    expect(feedback?.getAttribute("role")).toBe("status");
    expect(feedback?.getAttribute("aria-live")).toBe("polite");
    expect(feedback?.textContent).toContain("Try again.");
  });
  it("does not steal focus on a same-lesson parent rerender", () => {
    click(button("Next lesson"));
    const answer = button(lessons[1].choices[0].label); answer.focus();
    act(() => root.render(<EvidenceFoundationsCourse />));
    expect(document.activeElement).toBe(answer);
  });
  it("binds navigation controls to the correct lesson region in each instance", () => {
    act(() => root.render(<><EvidenceFoundationsCourse /><EvidenceFoundationsCourse /></>));
    const sections = host.querySelectorAll('[data-testid="evidence-foundations-course"]');
    const targets = new Set<string>();
    for (const section of sections) {
      for (const control of section.querySelectorAll("nav button")) {
        const targetId = control.getAttribute("aria-controls");
        expect(targetId).toBeTruthy();
        const target = document.getElementById(targetId!);
        expect(section.contains(target)).toBe(true);
        expect(target?.getAttribute("aria-labelledby")).toBe(section.querySelector("h3")?.id);
        targets.add(targetId!);
      }
    }
    expect(targets.size).toBe(2);
    for (const node of host.querySelectorAll<HTMLElement>("[tabindex]")) expect(node.tabIndex).toBeLessThanOrEqual(0);
  });
  it("announces an out-of-date copy without rewriting it, then clears the warning on explicit refresh", () => {
    choose(0, true); click(button("Show copyable note")); const first = note();
    const status = () => host.querySelector('[data-testid="practice-export-status"]');
    expect(status()?.textContent).not.toContain("does not include your latest answers");
    choose(0, false);
    expect(note()).toEqual(first);
    expect(status()?.textContent).toContain("does not include your latest answers");
    expect(status()?.getAttribute("aria-atomic")).toBe("true");
    click(button("Show copyable note"));
    expect(status()?.textContent).not.toContain("does not include your latest answers");
    expect(note().attempts).toHaveLength(2);
  });
  it("captures one event timestamp outside replayable state updaters in StrictMode", () => {
    act(() => root.render(<React.StrictMode><EvidenceFoundationsCourse /></React.StrictMode>));
    const clock = vi.spyOn(Date.prototype, "toISOString");
    choose(0, true);
    expect(clock).toHaveBeenCalledTimes(1);
    clock.mockRestore(); click(button("Show copyable note"));
    expect(note().attempts).toHaveLength(1);
    expect(fetch).not.toHaveBeenCalled();
  });
});
