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
  afterEach(async () => {
    if (root) await act(async () => root?.unmount());
    container?.remove();
    vi.restoreAllMocks();
    window.history.replaceState(null, "", "/dashboard/?workspace=company");
  });

  it("does not abort its POST when actual wouter observes its own prepared case URL; remount reads it", async () => {
    window.history.replaceState(null, "", "/dashboard/?workspace=company");
    const owner = "unit-owner@example.invalid";
    const question = "  Synthetic GSPC history regression request  ";
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
    await act(async () => { root!.unmount(); });
    root = createRoot(container);
    await act(async () => { root!.render(<Harness />); });
    expect(read).toHaveBeenCalledTimes(1);
    expect(read.mock.calls[0][0]).toBe(caseId);
    expect(container.querySelector('[data-testid="company-case-saved"]')).not.toBeNull();
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
    expect(container.textContent).toContain("has not been merged");
    expect(container.querySelector<HTMLInputElement>("#talk-input")?.disabled).toBe(true);
    await act(async () => { handle.current?.ask(committed.request); });
    expect(submit).toHaveBeenCalledTimes(1);
    expect(read).not.toHaveBeenCalled();
    await act(async () => { root!.unmount(); });
    root = createRoot(container);
    await act(async () => { root!.render(<Harness />); });
    expect(read).toHaveBeenCalledTimes(1);
    expect(container.querySelector('[data-testid="company-case-awaiting-review"]')).not.toBeNull();
    expect(container.querySelector<HTMLAnchorElement>('[data-testid="company-case-reopen"]')?.href).toContain(encodeURIComponent(caseId));
    nextRead = committed;
    await act(async () => { container!.querySelector<HTMLButtonElement>('[data-testid="company-case-awaiting-review"] button')!.click(); });
    expect(read).toHaveBeenCalledTimes(2);
    expect(submit).toHaveBeenCalledTimes(1);
    expect(container.querySelector('[data-testid="company-case-saved"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="company-case-awaiting-review"]')).toBeNull();
  });

});
