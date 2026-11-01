// @vitest-environment jsdom
// Parent presentation/visibility fixtures with the actual shared Cody verifier helper.
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CompanyCaseVerifiedCallback } from "../talk/CompanyCasePanel";
import type { CommittedCompanyCase, PendingCompanyCase } from "../talk/companyCaseModel";
import { CSOAI_STAFF_PROFILE } from "@/lib/csoaiStaffProfile";
import * as voice from "@/lib/councilVoice";
import * as input from "@/lib/councilListen";
import { newRun, type TalkRun } from "@/lib/aguiTalk";
import AskPane from "./AskPane";

const child = vi.hoisted(() => ({ props: null as null | { listen?: boolean; onCaseVerified?: CompanyCaseVerifiedCallback; onRunDone?: (run: TalkRun) => void } }));
vi.mock("@/components/talk/TalkPanel", async () => {
  const { createElement, forwardRef, useImperativeHandle } = await import("react");
  return { default: forwardRef(function MockTalk(props: { listen?: boolean; onCaseVerified?: CompanyCaseVerifiedCallback; onRunDone?: (run: TalkRun) => void }, ref) {
    child.props = props;
    useImperativeHandle(ref, () => ({ ask() {} }), []);
    return createElement("div", { "data-testid": "voice-child", "data-listen": String(props.listen) });
  }) };
});
vi.mock("@/components/ask/OwmFreshness", () => ({ default: () => null }));
const expected = { ownerSubject: "owner-a", caseId: "case-a", requestId: "request-a" };
function committed(): CommittedCompanyCase {
  return {
    ...expected, request: "Read the existing GSPC record",
    result: {
      id: "result-a", text: "Private result text must not be spoken.",
      fetchedAt: "2026-10-25T02:00:00Z", sha256: "a".repeat(64),
      sources: [{ title: "GSPC", reference: "https://councilof.ai/api/gspc", fetchedAt: "2026-10-25T02:00:00Z" }],
    },
    receipt: {
      id: "receipt-a", caseId: expected.caseId, resultId: "result-a",
      resultSha256: "a".repeat(64), sha256: "b".repeat(64),
      createdAt: "2026-10-25T02:00:00Z", integrity: "unsigned",
    },
    persistence: { merged: true, nativeReadbackVerified: true, nativeCommitId: "commit-a" },
    verification: { resultDigestVerified: true, receiptDigestVerified: true, receiptBindingVerified: true },
  };
}
function proposed(): PendingCompanyCase {
  const saved = committed();
  return {
    ...saved,
    result: { ...saved.result, id: "result-head-a" },
    receipt: { ...saved.receipt, id: "receipt-head-a", resultId: "result-head-a" },
    persistence: {
      merged: false, nativeReadbackVerified: false, proposalReadbackVerified: true,
      changeRequestId: "review-a", reviewStatus: "in_review",
      proposedRecords: {
        case: { operationId: "case-op", headCommitId: "case-head-a", payloadSha256: "c".repeat(64) },
        result: { operationId: "result-op", headCommitId: "result-head-a", payloadSha256: "d".repeat(64) },
        receipt: { operationId: "receipt-op", headCommitId: "receipt-head-a", payloadSha256: "e".repeat(64) },
      },
    },
    verification: { ...saved.verification, proposalReferencesVerified: true },
  };
}

let root: Root | undefined;
let node: HTMLDivElement;
const onClose = vi.fn();
async function render(open: boolean) {
  await act(async () => { root!.render(<AskPane open={open} onClose={onClose} />); });
}
beforeEach(() => {
  window.history.replaceState(null, "", "/");
  window.sessionStorage.clear();
  window.sessionStorage.setItem("coai:ask-prefs", JSON.stringify({ voice: true, watch: false }));
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.spyOn(voice, "stopVoice").mockImplementation(() => {});
  vi.spyOn(voice, "speakVoice").mockImplementation(() => {});
  vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("No backend belongs to this presentation fixture."); }));
  node = document.createElement("div"); document.body.append(node); root = createRoot(node);
});
afterEach(async () => {
  if (root) await act(async () => root!.unmount());
  node.remove(); root = undefined; child.props = null;
  window.sessionStorage.clear(); vi.restoreAllMocks(); vi.unstubAllGlobals();
});
describe("Cody voice receiving boundary", () => {
  it("uses the shared AI identity and retires listening when hidden or on another tab", async () => {
    await render(true);
    expect(node.querySelector('[data-testid="ask-introduction"]')!.textContent).toContain(CSOAI_STAFF_PROFILE.disclosure);
    expect(child.props?.listen).toBe(true);
    await render(false);
    expect(child.props?.listen).toBe(false);
    await render(true);
    expect(child.props?.listen).toBe(true);
    await act(async () => node.querySelector<HTMLButtonElement>('#ask-tab-steps')!.click());
    expect(child.props?.listen).toBe(false);
    expect(voice.stopVoice).toHaveBeenCalled();
  });
  it("turning voice off retires the child without submitting a question", async () => {
    await render(true);
    await act(async () => node.querySelector<HTMLButtonElement>('#ask-voice')!.click());
    expect(child.props?.listen).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });
  it("keeps an initial read and identical reread silent, then narrates a verified merge once", async () => {
    await render(true);
    await act(async () => child.props?.onCaseVerified?.(proposed(), "initial-read", expected));
    expect(voice.speakVoice).not.toHaveBeenCalled();
    await act(async () => child.props?.onCaseVerified?.(proposed(), "read", expected));
    expect(voice.speakVoice).not.toHaveBeenCalled();
    await act(async () => child.props?.onCaseVerified?.(committed(), "read", expected));
    expect(voice.speakVoice).toHaveBeenCalledTimes(1);
    expect(vi.mocked(voice.speakVoice).mock.calls[0][0]).toContain("Your case is saved");
    expect(vi.mocked(voice.speakVoice).mock.calls[0][0]).not.toContain("Private result text");
    await act(async () => child.props?.onCaseVerified?.(committed(), "read", expected));
    expect(voice.speakVoice).toHaveBeenCalledTimes(1);
  });
  it("does not start an answer or saved-result voice while a microphone already owns input", async () => {
    await render(true);
    vi.spyOn(input, "isListening").mockReturnValue(true);
    await act(async () => child.props?.onRunDone?.({ ...newRun("question", "run"), status: "done", text: "Published answer" }));
    await act(async () => child.props?.onCaseVerified?.(committed(), "submitted", expected));
    expect(voice.speakVoice).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });
  it("does not narrate a crossed-owner case or a result delivered while hidden", async () => {
    await render(true);
    await act(async () => child.props?.onCaseVerified?.(committed(), "submitted", { ...expected, ownerSubject: "other" }));
    expect(voice.speakVoice).not.toHaveBeenCalled();
    await render(false);
    await act(async () => child.props?.onCaseVerified?.(committed(), "submitted", expected));
    expect(voice.speakVoice).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });
});
