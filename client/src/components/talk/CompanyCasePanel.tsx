import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { ArrowUp, CheckCircle2, Loader2, LockKeyhole, RotateCw } from "lucide-react";
import { companyWorkspaceHref, councilLoginHref } from "@/lib/councilLoginReturn";
import {
  companyCaseFailure,
  companyCaseReadFailure,
  companyCaseSessionKey,
  isCompanyCaseId,
  requireVerifiedCompanyCase,
  type CompanyCase,
  type CompanyCaseConnection,
  type CompanyCaseViewState,
} from "./companyCaseModel";

export type CompanyCasePanelHandle = { ask: (question: string) => void };

export type CompanyCasePanelProps = {
  connection?: CompanyCaseConnection;
  caseId?: string;
  invalidCase?: boolean;
  variant?: "dock" | "standalone";
  labelledBy?: string;
  className?: string;
};

const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export function CompanyCaseResult({ value, onRead, busy }: { value: CompanyCase; onRead: () => void; busy: boolean }) {
  const proposal = value.persistence.merged === false ? value.persistence : undefined;
  const committed = value.persistence.merged === true ? value.persistence : undefined;
  return (
    <article className="space-y-3" data-testid={proposal ? "company-case-awaiting-review" : "company-case-saved"} aria-label={proposal ? "Company case awaiting review" : "Saved company case"}>
      <p className="ml-auto w-fit max-w-[90%] rounded-2xl rounded-br-sm bg-emerald-800 px-3 py-2 text-sm text-white [overflow-wrap:anywhere] dark:bg-emerald-700">
        {value.request}
      </p>
      <div className="min-w-0 rounded-xl border border-emerald-700/30 bg-card p-4 text-foreground">
        <p className="flex items-center gap-2 text-sm font-semibold text-emerald-900 dark:text-emerald-100" role="status">
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" /> {proposal ? "Awaiting review in the company library" : "Saved in the company library"}
        </p>
        {proposal ? <p className="mt-2 text-sm">The proposal is retained for review. It has not been merged. Refresh or reopen this case to check its status.</p> : null}
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed [overflow-wrap:anywhere]" data-testid="company-case-result">
          {value.result.text}
        </p>
        <p className="mt-3 text-xs text-muted-foreground">Sources fetched at {value.result.fetchedAt}. Fetch time alone does not establish a fresh measurement.</p>
        <ul className="mt-3 space-y-2 text-xs" aria-label="Report sources">
          {value.result.sources.map((source, index) => (
            <li key={`${index}-${source.reference}`} className="rounded-lg border border-border p-2 [overflow-wrap:anywhere]">
              <p className="font-semibold">{source.title}</p>
              <p className="mt-1 font-mono">{source.reference}</p>
              <p className="mt-1 text-muted-foreground">{source.fetchedAt ? `Fetched ${source.fetchedAt}` : `Recorded with case ${source.recordedAt}`}</p>
              {source.sha256 ? <p className="mt-1 font-mono">SHA-256 {source.sha256}</p> : null}
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          <a href={companyWorkspaceHref(value.caseId)} className={`inline-flex min-h-11 items-center rounded-lg border border-border px-3 text-sm font-semibold hover:bg-muted ${FOCUS}`} data-testid="company-case-reopen">
            Reopen this case
          </a>
          <a href={"https://meok.ai/?case=" + encodeURIComponent(value.caseId)} className={FOCUS + " inline-flex min-h-11 items-center rounded-lg border border-border px-3 text-sm font-semibold hover:bg-muted"} data-testid="company-case-meok-reopen">
            Reopen through MEOK
          </a>
          <button type="button" onClick={onRead} disabled={busy} className={`inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-3 text-sm font-semibold hover:bg-muted disabled:opacity-50 ${FOCUS}`}>
            <RotateCw className="h-4 w-4" aria-hidden="true" /> {proposal ? "Check review status" : "Read saved copy"}
          </button>
        </div>
        <details className="mt-3 rounded-lg border border-border px-3">
          <summary className={`min-h-11 cursor-pointer py-3 text-sm font-semibold ${FOCUS}`}>Receipt and storage evidence</summary>
          <dl className="space-y-2 pb-3 text-xs [overflow-wrap:anywhere]">
            <div><dt className="font-semibold">Case</dt><dd className="font-mono" data-testid="company-case-id">{value.caseId}</dd></div>
            <div><dt className="font-semibold">{proposal ? "Proposed result head" : "Result"}</dt><dd className="font-mono">{value.result.id}</dd></div>
            <div><dt className="font-semibold">{proposal ? "Proposed receipt head" : "Receipt"}</dt><dd className="font-mono">{value.receipt.id}</dd></div>
            <div><dt className="font-semibold">Receipt created</dt><dd>{value.receipt.createdAt}</dd></div>
            {committed ? <div><dt className="font-semibold">Native commit</dt><dd className="font-mono">{committed.nativeCommitId}</dd></div> : null}
            {proposal ? <div><dt className="font-semibold">Review request</dt><dd className="font-mono">{proposal.changeRequestId}</dd><dd>{proposal.reviewStatus === "changes_requested" ? "Changes requested" : proposal.reviewStatus === "approved" ? "Approval reported; awaiting verified merge" : "Awaiting review"}</dd></div> : null}
            <div><dt className="font-semibold">Result SHA-256</dt><dd className="font-mono" data-testid="company-result-digest">{value.result.sha256}</dd></div>
            <div><dt className="font-semibold">Receipt SHA-256</dt><dd className="font-mono" data-testid="company-receipt-digest">{value.receipt.sha256}</dd></div>
            <div><dt className="font-semibold">Integrity</dt><dd>Unsigned integrity receipt. {proposal ? "The result and receipt digests match their bound bytes. The authenticated adapter reports matching durable proposal heads. This is awaiting review, with no merged record IDs." : "The adapter verified the result and receipt digests, their binding, and a merged native readback."} No signer or independent measurement is established by this save.</dd></div>
          </dl>
        </details>
      </div>
    </article>
  );
}

const OwnerCompanyCasePanel = forwardRef<CompanyCasePanelHandle, CompanyCasePanelProps>(function OwnerCompanyCasePanel(
  { connection, caseId, invalidCase = false, variant = "standalone", labelledBy, className = "" },
  ref,
) {
  const [state, setState] = useState<CompanyCaseViewState>({ status: "idle" });
  const [question, setQuestion] = useState("");
  const operation = useRef(0);
  const pending = useRef<AbortController | null>(null);
  const inFlight = useRef(false);
  const uncertainWrite = useRef(false);
  const selfPreparedNavigation = useRef<{ caseId: string; operation: number } | null>(null);
  const alive = useRef(true);
  const session = connection?.session;
  const subject = session?.status === "ready" ? session.subject : undefined;
  const client = connection?.client;
  const connected = Boolean(subject && client);
  const busy = state.status === "preparing" || state.status === "submitting" || state.status === "reading";
  const blockedUnknownSave = state.status === "awaiting_review" || (state.status === "failed" && state.outcomeUnknown) || uncertainWrite.current;
  const returnHref = companyWorkspaceHref(caseId);
  const loginHref = councilLoginHref(returnHref);

  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; operation.current += 1; pending.current?.abort(); };
  }, []);

  const readCase = useCallback(async (id: string, requestId?: string) => {
    if (!client || !subject || !isCompanyCaseId(id)) return;
    pending.current?.abort();
    const controller = new AbortController();
    pending.current = controller;
    const sequence = ++operation.current;
    inFlight.current = true;
    setState({ status: "reading", caseId: id });
    try {
      const value = requireVerifiedCompanyCase(await client.read(id, { signal: controller.signal }), { ownerSubject: subject, caseId: id });
      if (!alive.current || sequence !== operation.current || controller.signal.aborted) return;
      uncertainWrite.current = false;
      setState(value.persistence.merged ? { status: "saved", value: value as Extract<CompanyCase, { persistence: { merged: true } }> } : { status: "awaiting_review", value: value as Extract<CompanyCase, { persistence: { merged: false } }> });
    } catch (error: unknown) {
      if (!alive.current || sequence !== operation.current || controller.signal.aborted) return;
      const failure = companyCaseReadFailure(error, id, requestId);
      uncertainWrite.current = uncertainWrite.current || failure.outcomeUnknown;
      setState(failure);
    } finally {
      if (sequence === operation.current) inFlight.current = false;
    }
  }, [client, subject]);

  // A reopened case is always read from the authorized adapter. Browser storage supplies no result.
  useEffect(() => {
    const prepared = selfPreparedNavigation.current;
    if (connected && !invalidCase && prepared && prepared.caseId === caseId && prepared.operation === operation.current) {
      // wouter observes our pre-POST replaceState. It is still this in-flight operation,
      // so consuming its own navigation must not abort it or start a competing read.
      selfPreparedNavigation.current = null;
      return;
    }
    selfPreparedNavigation.current = null;
    operation.current += 1;
    pending.current?.abort();
    inFlight.current = false;
    setState((current) => uncertainWrite.current && current.status === "failed" && current.outcomeUnknown ? current : { status: "idle" });
    if (connected && caseId && !invalidCase) void readCase(caseId);
  }, [connected, caseId, invalidCase, readCase]);

  const submit = useCallback(async (request: string) => {
    const text = request;
    if (!client || !subject || invalidCase || !text.trim() || text.length > 2000 || busy || inFlight.current || uncertainWrite.current || blockedUnknownSave) return;
    if (typeof globalThis.crypto?.randomUUID !== "function") {
      setState({ status: "failed", message: "A secure request identifier is unavailable in this browser. No request was sent.", outcomeUnknown: false });
      return;
    }
    const requestId = crypto.randomUUID();
    const controller = new AbortController();
    pending.current?.abort();
    pending.current = controller;
    const sequence = ++operation.current;
    inFlight.current = true;
    setState({ status: "preparing", request: text, requestId });
    setQuestion("");
    let preparedCaseId: string | undefined;
    let writeAttempted = false;
    try {
      preparedCaseId = await client.caseIdForRequest(requestId);
      if (!alive.current || sequence !== operation.current || controller.signal.aborted) return;
      if (!isCompanyCaseId(preparedCaseId)) throw new Error("invalid_recovery_id");
      // Pending navigation is prepared before POST, so refresh can recover the same case.
      // This URL is not a saved acknowledgement and carries no session or receipt body.
      selfPreparedNavigation.current = { caseId: preparedCaseId, operation: sequence };
      window.history.replaceState(window.history.state, "", companyWorkspaceHref(preparedCaseId));
      setState({ status: "submitting", request: text, requestId, caseId: preparedCaseId });
      writeAttempted = true;
      const value = requireVerifiedCompanyCase(await client.submit(text, { requestId, signal: controller.signal }), {
        ownerSubject: subject, caseId: preparedCaseId, requestId, request: text,
      });
      if (!alive.current || sequence !== operation.current || controller.signal.aborted) return;
      setState(value.persistence.merged ? { status: "saved", value: value as Extract<CompanyCase, { persistence: { merged: true } }> } : { status: "awaiting_review", value: value as Extract<CompanyCase, { persistence: { merged: false } }> });
    } catch (error: unknown) {
      if (!alive.current || sequence !== operation.current || controller.signal.aborted) return;
      const reported = companyCaseFailure(error, requestId);
      const failure = writeAttempted
        ? { ...reported, caseId: reported.outcomeUnknown ? preparedCaseId : reported.caseId }
        : { status: "failed" as const, message: "The request could not be prepared. No request was sent.", requestId, outcomeUnknown: false };
      if (!writeAttempted) selfPreparedNavigation.current = null;
      uncertainWrite.current = failure.outcomeUnknown;
      setState(failure);
    } finally {
      if (sequence === operation.current) inFlight.current = false;
    }
  }, [client, subject, invalidCase, busy, blockedUnknownSave]);

  useImperativeHandle(ref, () => ({ ask: (request: string) => { void submit(request); } }), [submit]);

  return (
    <section className={`min-w-0 space-y-3 ${className}`} aria-labelledby={labelledBy} aria-label={labelledBy ? undefined : "Company workspace conversation"} data-testid="company-case-panel">
      <div className="rounded-xl border border-border bg-muted p-3 text-sm">
        <p className="flex items-center gap-2 font-semibold"><LockKeyhole className="h-4 w-4 shrink-0" aria-hidden="true" /> Company workspace</p>
        <p className="mt-1 text-muted-foreground">Use your company library and supported public GSPC tools. A saved report includes its sources, fetch time and receipt.</p>
      </div>

      {invalidCase ? (
        <div className="rounded-lg border border-amber-700/30 p-3 text-sm">
          <p role="alert">This company workspace link is invalid. Open a clean workspace to continue.</p>
          <a href={companyWorkspaceHref()} className={`mt-2 inline-flex min-h-11 items-center rounded-lg border border-border px-3 font-semibold ${FOCUS}`}>Open a clean company workspace</a>
        </div>
      ) : null}
      {session?.status === "verifying" ? <p role="status" className="text-sm text-muted-foreground">Verifying your Council session…</p> : null}
      {session?.status === "signed_out" ? (
        <div className="rounded-lg border border-border p-3 text-sm">
          <p>Sign in to open your authorized company workspace.</p>
          <a href={loginHref} className={`mt-2 inline-flex min-h-11 items-center rounded-lg bg-emerald-800 px-4 font-semibold text-white hover:bg-emerald-900 ${FOCUS}`}>Sign in to Council</a>
        </div>
      ) : null}
      {(!connection || session?.status === "unavailable" || (session?.status === "ready" && !connected)) ? (
        <p role="status" className="rounded-lg border border-border p-3 text-sm text-muted-foreground">The company library connection is unavailable. Saved status cannot be verified here.</p>
      ) : null}

      {state.status === "preparing" || state.status === "submitting" ? (
        <div role="status" className="rounded-xl border border-border p-3 text-sm">
          <p className="whitespace-pre-wrap [overflow-wrap:anywhere]">{state.request}</p>
          <p className="mt-2 inline-flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> {state.status === "preparing" ? "Preparing a recovery link. No request has been sent yet…" : "Retrieving sources and checking the storage response…"}</p>
        </div>
      ) : null}
      {state.status === "reading" ? <p role="status" className="inline-flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> Reading this authorized case’s storage and review status…</p> : null}
      {(state.status === "saved" || state.status === "awaiting_review") && connected && state.value.ownerSubject === subject ? <CompanyCaseResult value={state.value} busy={busy} onRead={() => void readCase(state.value.caseId)} /> : null}
      {state.status === "failed" ? (
        <div className="rounded-lg border border-rose-700/30 bg-rose-50 p-3 text-sm text-rose-900 dark:border-rose-400/40 dark:bg-rose-950 dark:text-rose-100">
          <p role="alert">{state.message}</p>
          {state.requiresSignIn ? <a href={councilLoginHref(companyWorkspaceHref(state.caseId ?? caseId))} className={`mt-2 inline-flex min-h-11 items-center rounded-lg border border-current px-3 font-semibold ${FOCUS}`}>Sign in and reopen this workspace</a> : null}
          {state.requestId ? <p className="mt-2 break-all text-xs">Request reference: {state.requestId}</p> : null}
          {state.caseId && connected ? <button type="button" onClick={() => void readCase(state.caseId!, state.requestId)} className={`mt-2 min-h-11 rounded-lg border border-current px-3 font-semibold ${FOCUS}`}>Check this case’s saved status</button> : null}
          {state.outcomeUnknown && !state.caseId ? <p className="mt-2 text-xs">Keep this request reference for recovery. This page will not repeat the save automatically.</p> : null}
        </div>
      ) : null}

      {variant === "standalone" ? (
        <form className="flex items-end gap-2 pt-2" onSubmit={(event) => { event.preventDefault(); void submit(question); }}>
          <label htmlFor="talk-input" className="sr-only">Your company library request</label>
          <input id="talk-input" value={question} onChange={(event) => setQuestion(event.target.value)} maxLength={2000} disabled={!connected || invalidCase || busy || blockedUnknownSave} placeholder="Ask your company library and save the report" autoComplete="off" className={`min-h-11 min-w-0 flex-1 rounded-xl border border-border bg-background px-3 text-base text-foreground placeholder:text-muted-foreground disabled:opacity-60 sm:text-sm ${FOCUS}`} />
          <button type="submit" disabled={!connected || invalidCase || busy || blockedUnknownSave || !question.trim()} aria-label="Ask company workspace" className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-800 text-white hover:bg-emerald-900 disabled:opacity-50 ${FOCUS}`}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <ArrowUp className="h-4 w-4" aria-hidden="true" />}
          </button>
        </form>
      ) : null}
      <p className="text-xs text-muted-foreground">Reports awaiting review are marked saved only after a verified merge.</p>
    </section>
  );
});

/** Changing the verified owner discards the previous owner's entire conversation before paint. */
const CompanyCasePanel = forwardRef<CompanyCasePanelHandle, CompanyCasePanelProps>(function CompanyCasePanel(props, ref) {
  return <OwnerCompanyCasePanel key={companyCaseSessionKey(props.connection)} {...props} ref={ref} />;
});

export default CompanyCasePanel;
