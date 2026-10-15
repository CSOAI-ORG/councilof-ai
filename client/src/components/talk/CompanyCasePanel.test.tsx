// @vitest-environment jsdom
// Synthetic render regression only; this never invokes a backend or the reserved acceptance request.
import { act, createRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useSearch } from "wouter";
import CompanyCasePanel, { type CompanyCasePanelHandle } from "./CompanyCasePanel";
import { companyWorkspaceSelection, type CommittedCompanyCase, type PendingCompanyCase, type CompanyCase, type CompanyCaseConnection } from "./companyCaseModel";

describe("company case pending navigation", () => {
  let root: Root | undefined;
  let container: HTMLDivElement | undefined;
  const clipboardDescriptor = Object.getOwnPropertyDescriptor(navigator, "clipboard");

  async function prepareEnquiry(): Promise<HTMLTextAreaElement> {
    const followUp = container!.querySelector<HTMLElement>('[data-testid="result-follow-up"]')!;
    expect(followUp).not.toBeNull();
    const prepare = Array.from(followUp.querySelectorAll("button")).find((button) => button.textContent === "Prepare a MEOK enquiry")!;
    expect(prepare).toBeDefined();
    await act(async () => { prepare.click(); });
    const textarea = followUp.querySelector("textarea")!;
    expect(textarea).not.toBeNull();
    return textarea;
  }

  async function editEnquiry(text: string): Promise<void> {
    const textarea = container!.querySelector<HTMLTextAreaElement>('[data-testid="result-follow-up"] textarea')!;
    const setValue = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!;
    await act(async () => {
      setValue.call(textarea, text);
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(textarea.value).toBe(text);
  }

  afterEach(async () => {
    if (root) await act(async () => root?.unmount());
    container?.remove();
    vi.restoreAllMocks();
    if (clipboardDescriptor) Object.defineProperty(navigator, "clipboard", clipboardDescriptor);
    else Reflect.deleteProperty(navigator, "clipboard");
    window.history.replaceState(null, "", "/dashboard/?workspace=company");
  });

  it("does not abort its POST when actual wouter observes its own prepared case URL; remount reads it", async () => {
    window.history.replaceState(null, "", "/dashboard/?workspace=company");
    const owner = "unit-owner@example.invalid";
    const question = "  Synthetic GSPC history regression request  ";
    const fetcher = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Unexpected backend fetch"));
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined });
    const caseId = "unit-case-history-1";
    vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue("00000000-0000-4000-8000-000000000001");
    let complete: ((value: CommittedCompanyCase) => void) | undefined;
    let saved: CommittedCompanyCase | undefined;
    const submit = vi.fn((request: string, options: { requestId: string; signal: AbortSignal }) => {
      saved = {
        caseId, requestId: options.requestId, ownerSubject: owner, request,
        result: { id: "unit-native-result", text: "Synthetic result", fetchedAt: "2026-10-12T18:00:00Z", sha256: "a".repeat(64), sources: [{ title: "Synthetic source", reference: "unit-source", fetchedAt: "2026-10-12T18:00:00Z" }] },
        receipt: { id: "unit-native-receipt", caseId, resultId: "unit-native-result", resultSha256: "a".repeat(64), sha256: "b".repeat(64), createdAt: "2026-10-12T18:00:01Z", integrity: "unsigned" },
        persistence: { merged: true, nativeReadbackVerified: true, nativeCommitId: "unit-head-case" },
        verification: { resultDigestVerified: true, receiptDigestVerified: true, receiptBindingVerified: true },
      };
      return new Promise<CommittedCompanyCase>((resolve) => { complete = resolve; });
    });
    const read = vi.fn(async (_caseId: string, _options: { signal: AbortSignal }) => saved!);
    const connection: CompanyCaseConnection = { session: { status: "ready", subject: owner }, client: { caseIdForRequest: async () => caseId, submit, read } };
    const handle = createRef<CompanyCasePanelHandle>();
    let observedCaseId: string | undefined;
    function Harness() {
      const selection = companyWorkspaceSelection(useSearch());
      observedCaseId = selection.caseId;
      return <CompanyCasePanel ref={handle} connection={connection} caseId={selection.caseId} invalidCase={selection.invalidCase} />;
    }
    container = document.createElement("div"); document.body.append(container);
    root = createRoot(container);
    await act(async () => { root!.render(<Harness />); });
    await act(async () => { handle.current?.ask(question); });
    expect(new URLSearchParams(window.location.search).get("case")).toBe(caseId);
    expect(observedCaseId).toBe(caseId);
    expect(submit).toHaveBeenCalledTimes(1);
    expect(submit.mock.calls[0][0]).toBe(question);
    expect(submit.mock.calls[0][1].signal.aborted).toBe(false);
    expect(read).not.toHaveBeenCalled();
    expect(container.querySelectorAll("#talk-input")).toHaveLength(1);
    await act(async () => { complete!(saved!); });
    expect(container.querySelector('[data-testid="company-case-saved"]')).not.toBeNull();
    expect(submit).toHaveBeenCalledTimes(1);
    expect(read).not.toHaveBeenCalled();

    expect(container.querySelector('[data-testid="result-follow-up"]')).not.toBeNull();
    expect(container.textContent).not.toContain("Edit question");
    const firstBrief = (await prepareEnquiry()).value;
    expect(firstBrief).toContain("Case: " + caseId);
    expect(firstBrief).toContain("Native result record: unit-native-result");
    expect(firstBrief).toContain("Native receipt record: unit-native-receipt");
    expect(firstBrief).not.toContain("Synthetic result");
    const enquiryLink = container.querySelector<HTMLAnchorElement>('[data-testid="result-follow-up"] a')!;
    expect(enquiryLink.getAttribute("href")).toBe("https://meok.ai/request-job");
    expect(enquiryLink.rel).toContain("noopener");
    expect(enquiryLink.rel).toContain("noreferrer");
    const copy = Array.from(container.querySelectorAll<HTMLButtonElement>('[data-testid="result-follow-up"] button')).find((button) => button.textContent === "Copy brief")!;
    await act(async () => { copy.click(); });
    expect(container.textContent).toContain("Copy is unavailable.");
    expect(container.textContent).toContain("Nothing has been sent.");
    const useful = Array.from(container.querySelectorAll<HTMLButtonElement>('[data-testid="result-follow-up"] button')).find((button) => button.textContent === "Useful for this task")!;
    await act(async () => { useful.click(); });
    expect(useful.getAttribute("aria-pressed")).toBe("true");
    await editEnquiry("PRIVATE_EDITED_DRAFT_BEFORE_REOPEN");
    expect(submit).toHaveBeenCalledTimes(1);
    expect(read).not.toHaveBeenCalled();
    expect(fetcher).not.toHaveBeenCalled();

    await act(async () => { root!.unmount(); });
    root = createRoot(container);
    await act(async () => { root!.render(<Harness />); });
    expect(read).toHaveBeenCalledTimes(1);
    expect(read.mock.calls[0][0]).toBe(caseId);
    expect(container.querySelector('[data-testid="company-case-saved"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="result-follow-up"] textarea')).toBeNull();
    expect(container.textContent).not.toContain("PRIVATE_EDITED_DRAFT_BEFORE_REOPEN");
    expect((await prepareEnquiry()).value).toBe(firstBrief);
    expect(container.querySelector('[data-testid="result-follow-up"] button[aria-pressed="true"]')).toBeNull();
    expect(submit).toHaveBeenCalledTimes(1);
    expect(fetcher).not.toHaveBeenCalled();

  });

  it("keeps a proposal awaiting review across remount and promotes only on a later GET", async () => {
    const owner = "unit-owner@example.invalid", caseId = "unit-case-pending-1";
    const committed: CommittedCompanyCase = {
      caseId, requestId: "00000000-0000-4000-8000-000000000001", ownerSubject: owner, request: "Synthetic GSPC review request",
      result: { id: "native-result", text: "Synthetic review result", fetchedAt: "2026-10-14T04:00:00Z", sha256: "a".repeat(64), sources: [{ title: "Synthetic source", reference: "unit-source", fetchedAt: "2026-10-14T04:00:00Z" }] },
      receipt: { id: "native-receipt", caseId, resultId: "native-result", resultSha256: "a".repeat(64), sha256: "b".repeat(64), createdAt: "2026-10-14T04:00:01Z", integrity: "unsigned" },
      persistence: { merged: true, nativeReadbackVerified: true, nativeCommitId: "native-case-head" },
      verification: { resultDigestVerified: true, receiptDigestVerified: true, receiptBindingVerified: true },
    };
    const proposed: PendingCompanyCase = {
      ...committed, result: { ...committed.result, id: "proposal-result-head" },
      receipt: { ...committed.receipt, id: "proposal-receipt-head", resultId: "proposal-result-head" },
      persistence: {
        merged: false, nativeReadbackVerified: false, proposalReadbackVerified: true, changeRequestId: "review-request", reviewStatus: "in_review",
        proposedRecords: {
          case: { operationId: "case-op", headCommitId: "proposal-case-head", payloadSha256: "c".repeat(64) },
          result: { operationId: "result-op", headCommitId: "proposal-result-head", payloadSha256: "d".repeat(64) },
          receipt: { operationId: "receipt-op", headCommitId: "proposal-receipt-head", payloadSha256: "e".repeat(64) },
        },
      },
      verification: { ...committed.verification, proposalReferencesVerified: true },
    };
    vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue(committed.requestId as ReturnType<Crypto["randomUUID"]>);
    let nextRead: CompanyCase = proposed;
    const submit = vi.fn(async () => proposed);
    const read = vi.fn(async () => nextRead);
    const connection: CompanyCaseConnection = { session: { status: "ready", subject: owner }, client: { caseIdForRequest: async () => caseId, submit, read } };
    const handle = createRef<CompanyCasePanelHandle>();
    function Harness() {
      const selection = companyWorkspaceSelection(useSearch());
      return <CompanyCasePanel ref={handle} connection={connection} caseId={selection.caseId} />;
    }
    container = document.createElement("div"); document.body.append(container); root = createRoot(container);
    await act(async () => { root!.render(<Harness />); });
    await act(async () => { handle.current?.ask(committed.request); });
    expect(container.querySelector('[data-testid="company-case-awaiting-review"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="company-case-saved"]')).toBeNull();
    expect(container.querySelector('[data-testid="result-follow-up"]')).toBeNull();
    expect(container.textContent).toContain("has not been merged");
    expect(container.querySelector<HTMLInputElement>("#talk-input")?.disabled).toBe(true);
    await act(async () => { handle.current?.ask(committed.request); });
    expect(submit).toHaveBeenCalledTimes(1);
    expect(read).not.toHaveBeenCalled();
    nextRead = { ...proposed, persistence: { ...proposed.persistence, reviewStatus: "approved" } };
    await act(async () => { root!.unmount(); });
    root = createRoot(container);
    await act(async () => { root!.render(<Harness />); });
    expect(read).toHaveBeenCalledTimes(1);
    expect(container.querySelector('[data-testid="company-case-awaiting-review"]')).not.toBeNull();
    expect(container.textContent).toContain("Approval reported; awaiting verified merge");
    expect(container.querySelector('[data-testid="result-follow-up"]')).toBeNull();
    expect(container.querySelector<HTMLAnchorElement>('[data-testid="company-case-reopen"]')?.href).toContain(encodeURIComponent(caseId));
    nextRead = committed;
    await act(async () => { container!.querySelector<HTMLButtonElement>('[data-testid="company-case-awaiting-review"] button')!.click(); });
    expect(read).toHaveBeenCalledTimes(2);
    expect(submit).toHaveBeenCalledTimes(1);
    expect(container.querySelector('[data-testid="company-case-saved"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="company-case-awaiting-review"]')).toBeNull();
    expect(container.querySelector('[data-testid="result-follow-up"]')).not.toBeNull();
    const committedBrief = (await prepareEnquiry()).value;
    expect(committedBrief).toContain("Native result record: native-result");
    expect(committedBrief).toContain("Native receipt record: native-receipt");
    expect(committedBrief).not.toContain("proposal-result-head");
    expect(committedBrief).not.toContain("proposal-receipt-head");
    expect(submit).toHaveBeenCalledTimes(1);
  });


  it("remounts away the previous owner's draft and refuses crossed readback before a valid owner GET", async () => {
    const ownerA = "owner-a@example.invalid", ownerB = "owner-b@example.invalid";
    const fixture = (ownerSubject: string, caseId: string, suffix: string): CommittedCompanyCase => ({
      caseId, requestId: "request-" + suffix, ownerSubject, request: "Synthetic GSPC request " + suffix,
      result: { id: "result-" + suffix, text: "DISPLAY_" + suffix, fetchedAt: "2026-10-14T20:00:00Z", sha256: "a".repeat(64), sources: [{ title: "Source " + suffix, reference: "source-" + suffix, recordedAt: "2026-10-14T19:59:00Z" }] },
      receipt: { id: "receipt-" + suffix, caseId, resultId: "result-" + suffix, resultSha256: "a".repeat(64), sha256: "b".repeat(64), createdAt: "2026-10-14T20:00:01Z", integrity: "unsigned" },
      persistence: { merged: true, nativeReadbackVerified: true, nativeCommitId: "case-head-" + suffix },
      verification: { resultDigestVerified: true, receiptDigestVerified: true, receiptBindingVerified: true },
    });
    const a = fixture(ownerA, "owner-case-a", "a"), b = fixture(ownerB, "owner-case-b", "b");
    const submitA = vi.fn(async () => a), submitB = vi.fn(async () => b);
    const readA = vi.fn(async () => a);
    let nextB: CompanyCase = { ...b, ownerSubject: ownerA };
    const readB = vi.fn(async () => nextB);
    const fetcher = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Unexpected backend fetch"));
    let selectedCaseId = a.caseId;
    let connection: CompanyCaseConnection = { session: { status: "ready", subject: ownerA }, client: { caseIdForRequest: async () => a.caseId, submit: submitA, read: readA } };
    function Harness() { return <CompanyCasePanel connection={connection} caseId={selectedCaseId} />; }
    container = document.createElement("div"); document.body.append(container); root = createRoot(container);
    await act(async () => { root!.render(<Harness />); });
    expect(readA).toHaveBeenCalledTimes(1);
    expect((await prepareEnquiry()).value).toContain("Native result record: result-a");
    await editEnquiry("PRIVATE_OWNER_A_DRAFT");
    selectedCaseId = b.caseId;
    connection = { session: { status: "ready", subject: ownerB }, client: { caseIdForRequest: async () => b.caseId, submit: submitB, read: readB } };
    await act(async () => { root!.render(<Harness />); });
    expect(readB).toHaveBeenCalledTimes(1);
    expect(container.querySelector('[data-testid="result-follow-up"]')).toBeNull();
    expect(container.querySelector('[data-testid="company-case-saved"]')).toBeNull();
    expect(container.textContent).not.toContain("PRIVATE_OWNER_A_DRAFT");
    expect(container.textContent).not.toContain(a.request);
    nextB = b;
    const check = Array.from(container.querySelectorAll("button")).find((button) => button.textContent === "Check this case’s saved status")!;
    expect(check).toBeDefined();
    await act(async () => { check.click(); });
    expect(readB).toHaveBeenCalledTimes(2);
    expect(container.querySelector('[data-testid="result-follow-up"] textarea')).toBeNull();
    const briefB = (await prepareEnquiry()).value;
    expect(briefB).toContain("Case: " + b.caseId);
    expect(briefB).toContain("Native result record: result-b");
    expect(briefB).not.toContain("result-a");
    expect(briefB).not.toContain("PRIVATE_OWNER_A_DRAFT");
    expect(briefB).not.toContain(ownerA);
    expect(briefB).not.toContain(ownerB);
    expect(submitA).not.toHaveBeenCalled();
    expect(submitB).not.toHaveBeenCalled();
    expect(fetcher).not.toHaveBeenCalled();
  });

});
