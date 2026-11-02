// @vitest-environment jsdom
// Real AskPane → TalkPanel → CompanyCasePanel; only the authenticated adapter boundary is synthetic.
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CompanyCasePanelHandle, CompanyCasePanelProps } from "../talk/CompanyCasePanel";
import type { CommittedCompanyCase, CompanyCaseConnection } from "../talk/companyCaseModel";
import * as voice from "@/lib/councilVoice";
import AskPane from "./AskPane";

const trusted = vi.hoisted(() => ({ connection: undefined as CompanyCaseConnection | undefined }));
vi.mock("@/components/talk/ConnectedCompanyCasePanel", async () => {
  const { createElement, forwardRef } = await import("react");
  const { default: Panel } = await import("@/components/talk/CompanyCasePanel");
  return { default: forwardRef<CompanyCasePanelHandle, Omit<CompanyCasePanelProps, "connection">>(function AdapterBoundary(props, ref) {
    return createElement(Panel, { ...props, ref, connection: trusted.connection });
  }) };
});
vi.mock("@/components/ask/OwmFreshness", () => ({ default: () => null }));

function value(owner = "owner-a", caseId = "case-a", version = 1): CommittedCompanyCase {
  const resultId = "result-" + version, receiptId = "receipt-" + version;
  return {
    ownerSubject: owner, caseId, requestId: "request-a", request: "Read the public GSPC record",
    result: { id: resultId, text: "Synthetic result for " + owner + "/" + caseId, fetchedAt: "2026-10-25T02:00:00Z", sha256: "a".repeat(64), sources: [{ title: "Fixture", reference: "fixture-only", fetchedAt: "2026-10-25T02:00:00Z" }] },
    receipt: { id: receiptId, caseId, resultId, resultSha256: "a".repeat(64), sha256: "b".repeat(64), createdAt: "2026-10-25T02:00:01Z", integrity: "unsigned" },
    persistence: { merged: true, nativeReadbackVerified: true, nativeCommitId: "commit-" + version },
    verification: { resultDigestVerified: true, receiptDigestVerified: true, receiptBindingVerified: true },
  };
}
let current: CommittedCompanyCase;
let node: HTMLDivElement;
let root: Root;
const onClose = vi.fn();
function connection(subject: string): CompanyCaseConnection {
  return { session: { status: "ready", subject }, client: {
    caseIdForRequest: async () => "case-a",
    read: vi.fn(async () => current),
    submit: vi.fn(async () => { throw new Error("No submit belongs to this read fixture."); }),
  } };
}
async function render() { await act(async () => { root.render(<AskPane open onClose={onClose} />); }); }
async function reread() {
  const button = Array.from(node.querySelectorAll("button")).find(button => button.textContent?.trim() === "Read saved copy");
  if (!button) throw new Error("Missing verified case read button");
  await act(async () => button.click());
}
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.spyOn(voice, "speakVoice").mockImplementation(() => {});
  vi.spyOn(voice, "stopVoice").mockImplementation(() => {});
  vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("No backend belongs to this context fixture."); }));
  window.sessionStorage.clear();
  window.sessionStorage.setItem("coai:ask-prefs", JSON.stringify({ voice: true, watch: false }));
  window.history.replaceState(null, "", "/dashboard/?workspace=company&case=case-a");
  current = value();
  trusted.connection = connection("owner-a");
  node = document.createElement("div"); document.body.append(node); root = createRoot(node);
});
afterEach(async () => {
  await act(async () => root.unmount());
  node.remove(); trusted.connection = undefined;
  window.sessionStorage.clear(); window.history.replaceState(null, "", "/");
  vi.restoreAllMocks(); vi.unstubAllGlobals();
});
describe("same-open-pane trusted Company context", () => {
  it.each(["session", "owner", "case"] as const)("stops prior narration on %s change before any new result is presented", async kind => {
    await render();
    expect(voice.speakVoice).not.toHaveBeenCalled();
    current = value("owner-a", "case-a", 2);
    await reread();
    expect(voice.speakVoice).toHaveBeenCalledTimes(1);
    expect(vi.mocked(voice.speakVoice).mock.calls[0][0]).toContain("Your case is saved");
    const stopped = vi.mocked(voice.stopVoice).mock.calls.length;

    await act(async () => {
      if (kind === "session") trusted.connection = { session: { status: "verifying" } };
      if (kind === "owner") {
        current = value("owner-b", "case-a", 2);
        trusted.connection = connection("owner-b");
      }
      if (kind === "case") {
        current = value("owner-a", "case-b", 2);
        window.history.replaceState(null, "", "/dashboard/?workspace=company&case=case-b");
      }
      root.render(<AskPane open onClose={onClose} />);
    });
    expect(node.querySelector('[data-testid="ask-pane"]')?.hasAttribute("hidden")).toBe(false);
    expect(vi.mocked(voice.stopVoice).mock.calls.length).toBeGreaterThan(stopped);
    expect(voice.speakVoice).toHaveBeenCalledTimes(1);
    if (kind === "session") {
      expect(node.textContent).toContain("Verifying your Council session");
      trusted.connection = connection("owner-a");
      await render();
    }
    // A new verified context establishes a silent baseline; an identical explicit reread stays silent.
    await reread();
    expect(voice.speakVoice).toHaveBeenCalledTimes(1);
    expect(fetch).not.toHaveBeenCalled();
  });
});
