import { useEffect, useRef, useState, type FormEvent } from "react";
import { BUYING_ENQUIRIES } from "@/lib/buying";
import { gpaiPreviewPath, loadGpaiPreview, normaliseGpaiSubject, type EvidencePreview } from "@/lib/gpaiEvidencePreview";

type Load = { state: "idle" | "loading" | "error" } | { state: "ready"; preview: EvidencePreview };
const invoice = BUYING_ENQUIRIES.find(item => item.product === "evidence-bundle");
const LINK = "inline-flex min-h-11 items-center rounded-lg border border-zinc-600 px-4 py-2 text-sm font-semibold text-emerald-300 hover:border-emerald-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";

/** The existing Article 53 preview, not a checkout, new product or fresh measurement. */
export function GpaiEvidencePreview() {
  const [subject, setSubject] = useState("");
  const [load, setLoad] = useState<Load>({ state: "idle" });
  const serial = useRef(0);
  const active = useRef<AbortController | null>(null);
  const validSubject = normaliseGpaiSubject(subject);

  useEffect(() => () => { serial.current += 1; active.current?.abort(); }, []);

  function changeSubject(value: string) {
    serial.current += 1;
    active.current?.abort();
    active.current = null;
    setSubject(value);
    setLoad({ state: "idle" });
  }

  async function preview(value: string) {
    const normalized = normaliseGpaiSubject(value);
    serial.current += 1;
    const request = serial.current;
    active.current?.abort();
    if (normalized === null) { setLoad({ state: "error" }); return; }
    const controller = new AbortController();
    active.current = controller;
    setLoad({ state: "loading" });
    const timer = window.setTimeout(() => {
      controller.abort();
      if (request === serial.current) setLoad({ state: "error" });
    }, 10_000);
    try {
      const result = await loadGpaiPreview(normalized, controller.signal);
      if (request === serial.current && !controller.signal.aborted) setLoad({ state: "ready", preview: result });
    } catch {
      if (request === serial.current) setLoad({ state: "error" });
    } finally {
      window.clearTimeout(timer);
      if (active.current === controller) active.current = null;
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void preview(subject);
  }
  function chooseSubject(value: string) {
    changeSubject(value);
    void preview(value);
  }

  const result = load.state === "ready" ? load.preview : null;
  return (
    <section id="existing-gpai-evidence" aria-labelledby="gpai-preview-heading" aria-busy={load.state === "loading"}
      className="mb-10 min-w-0 scroll-mt-24 rounded-xl border border-emerald-800/60 bg-emerald-950/20 p-5 sm:p-6 [overflow-wrap:anywhere]">
      <p className="mb-2 font-mono text-xs uppercase tracking-wide text-emerald-300">Existing published evidence · Article 53</p>
      <h2 id="gpai-preview-heading" className="text-xl font-semibold">Preview the evidence before choosing a bundle</h2>
      <p className="mt-3 text-sm leading-6 text-zinc-300">
        Inspect the existing Article 53 selection for a public model or provider. Leave the filter blank
        to inspect the whole obligation selection. This preview does not run a new measurement or place an order.
      </p>
      <form onSubmit={submit} className="mt-5 space-y-3">
        <label htmlFor="gpai-evidence-subject" className="block text-sm font-semibold text-zinc-200">Public model or provider filter (optional)</label>
        <input id="gpai-evidence-subject" value={subject} onChange={e => changeSubject(e.target.value)} maxLength={120}
          autoComplete="off" spellCheck={false} aria-describedby="gpai-subject-help" aria-invalid={validSubject === null}
          className="block min-h-11 w-full min-w-0 rounded-lg border border-zinc-600 bg-zinc-950 px-3 py-2 text-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400" />
        <p id="gpai-subject-help" className="text-xs leading-5 text-zinc-400">
          Matches text in published record subjects, surfaces or tags; it is not an exact model-identity check.
          Use public identifiers only, not private documents or personal information. The filter is sent only when you open a preview.
        </p>
        {validSubject === null ? <p role="alert" className="text-sm text-amber-200">Use at most 120 characters without control characters.</p> : null}
        <button type="submit" disabled={load.state === "loading" || validSubject === null}
          className="min-h-11 rounded-lg bg-emerald-400 px-5 py-2 text-sm font-semibold text-zinc-950 hover:bg-emerald-300 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
          {load.state === "loading" ? "Reading published evidence…" : "Preview existing evidence"}
        </button>
      </form>
      <div aria-live="polite" aria-atomic="true" className="mt-5">
        {load.state === "error" ? (
          <p role="alert" className="rounded-lg border border-amber-700/60 p-3 text-sm text-amber-200">
            The preview could not be read or did not match the requested scope. Availability is unknown, not zero.
            No payment was attempted. Use the preview button to try again.
          </p>
        ) : result ? (
          <div className="space-y-4 text-sm text-zinc-300" data-testid="gpai-preview-result">
            <p><strong className="text-zinc-100">{result.count} matching published record{result.count === 1 ? "" : "s"}</strong>
              {result.subject ? <> for filter <strong>{result.subject}</strong>.</> : <> across the Article 53 selection.</>}</p>
            <p>Corpus date, not request time: {result.corpusDate
              ? <time dateTime={result.corpusDate} className="font-mono text-xs">{result.corpusDate}</time>
              : <strong>not supplied</strong>}. Refreshing this preview does not make the underlying observations newer.</p>
            {result.reviewNote ? <p>{result.reviewNote}</p> : <p>{result.counselConfirmed === false
              ? "The API reports that counsel confirmation of the obligation mapping is pending."
              : result.counselConfirmed === true ? "The API reports a counsel-confirmed mapping; this preview does not independently establish that review."
              : "Counsel-review status was not supplied."}</p>}
            {result.count === 0 ? (
              <div className="rounded-lg border border-amber-800/60 p-3">
                <p>No matching records were returned for this selection. This is not a conclusion about the model, provider or legal compliance. No purchase link is offered for an empty selection.</p>
                {result.availableSubjects.length ? <div className="mt-3 flex flex-wrap gap-2" aria-label="Published subject suggestions">
                  {result.availableSubjects.map(value => <button type="button" key={value} className={LINK} onClick={() => chooseSubject(value)}>{value}</button>)}
                </div> : null}
                {result.subject ? <button type="button" className={`${LINK} mt-3`} onClick={() => chooseSubject("")}>Preview the whole Article 53 selection</button> : null}
              </div>
            ) : (
              <>
                <p>The selection retains signature fields; this preview does not verify those signatures or determine whether the records satisfy a legal duty.</p>
                <ul className="space-y-2" aria-label="Example records from this selection">
                  {result.cards.slice(0, 5).map(card => <li key={card.sha256}>
                    <a className="text-emerald-300 underline underline-offset-4" href={card.path} target="_blank" rel="noopener noreferrer">{card.subject || card.sha256.slice(0, 16)}</a>
                    <span className="ml-2 text-xs text-zinc-400">Record date: {card.asOf ?? "not supplied"}</span>
                  </li>)}
                </ul>
                <p className="text-xs text-zinc-400">Showing {Math.min(result.cards.length, 5)} records here; the raw preview returns up to 40 of the {result.count} selected records.</p>
                <a className={LINK} href={result.termsPath} target="_blank" rel="noopener noreferrer">Read current x402 terms for this selection (JSON)</a>
                <p className="text-xs leading-5 text-zinc-400">Opening terms does not pay. Payment requires a separate wallet authorization. Review the exact scope and current challenge before authorizing anything.</p>
              </>
            )}
          </div>
        ) : <p className="text-sm text-zinc-400">Choose a public subject or open the whole selection. No evidence count is assumed before the preview responds.</p>}
      </div>
      <nav aria-label="Evidence preview next steps" className="mt-5 flex flex-wrap gap-3">
        {validSubject !== null ? <a className={LINK} href={gpaiPreviewPath(validSubject)} target="_blank" rel="noopener noreferrer">Open raw preview JSON</a> : null}
        <a className={LINK} href="/gspc-verify">Verify a record free</a>
        {invoice ? <a className={LINK} href={invoice.href}>Ask about an invoice for this evidence bundle</a> : null}
      </nav>
      <p className="mt-3 text-xs leading-5 text-zinc-400">An invoice enquiry prepares a request, not a booking or confirmed delivery. Fresh measurement scope and service terms require separate confirmation.</p>
    </section>
  );
}
