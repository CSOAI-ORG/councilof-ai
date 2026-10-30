import { useMemo, useState } from "react";
import groups from "../../../council-os/working-groups.json";
import tracker from "../../../council-os/working-group-tracker.json";
import { reviewDraft, selectDocuments, sourceUrl, STATUSES } from "../../../council-os/working-groups/core.mjs";
const catalog = { ...tracker, schema: "csoai.working-group-catalog/1", groups: groups.groups };
const LINK = "underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4";
const INPUT = "mt-1 w-full rounded-md border border-border bg-background p-3 text-foreground";
export default function WorkingGroupTracker() {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("");
  const [status, setStatus] = useState("");
  const [reviewId, setReviewId] = useState("");
  const [observation, setObservation] = useState("");
  const [conflicts, setConflicts] = useState("");
  const [draft, setDraft] = useState("");
  const docs = useMemo(() => selectDocuments(catalog, {query,group,status}), [query,group,status]);
  const reviewDoc = tracker.documents.find(d => d.id === reviewId);
  function beginReview(id: string) {
    setReviewId(id); setObservation(""); setConflicts(""); setDraft("");
    requestAnimationFrame(() => document.getElementById("wg-observation")?.focus());
  }
  return <section id="working-group-tracker" aria-labelledby="wg-tracker-heading" className="space-y-5 rounded-xl border border-border p-5">
    <div>
      <p className="text-sm font-medium text-muted-foreground">Public work register · candidate</p>
      <h3 id="wg-tracker-heading" className="mt-1 text-xl font-semibold">Follow a proposal from evidence to review</h3>
      <p className="mt-2">Find a task, read its pinned source and prepare a review. These are drafts awaiting editors and reviewers; no group decision has been recorded.</p>
      <nav aria-label="Working group discussions and exports" className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
        <a className={"inline-flex min-h-11 items-center " + LINK} href={tracker.forum}>Open public forum on GitHub</a>
        <a className={"inline-flex min-h-11 items-center " + LINK} href="/working-groups/catalog.json" download>Download public register (JSON)</a>
        <a className={"inline-flex min-h-11 items-center " + LINK} href="/working-groups/">Open lightweight tracker</a>
      </nav>
      <p className="text-sm text-muted-foreground">This register is public. Posting on GitHub needs an account; use the review email route below if you cannot use GitHub. Public posts must contain public or synthetic evidence only.</p>
    </div>
    <div className="grid gap-3 md:grid-cols-3">
      <label className="block" htmlFor="wg-query">Search documents or axes<input id="wg-query" className={INPUT} value={query} maxLength={200} onChange={e=>setQuery(e.target.value)} type="search" /></label>
      <label className="block" htmlFor="wg-group">Working group<select id="wg-group" className={INPUT} value={group} onChange={e=>setGroup(e.target.value)}><option value="">All groups</option>{groups.groups.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</select></label>
      <label className="block" htmlFor="wg-status">Document status<select id="wg-status" className={INPUT} value={status} onChange={e=>setStatus(e.target.value)}><option value="">All statuses</option>{STATUSES.map(s=><option key={s} value={s}>{s}</option>)}</select></label>
    </div>
    <p role="status" aria-live="polite">{docs.length} document{docs.length === 1 ? "" : "s"} shown</p>
    {docs.length === 0 && <div className="rounded-lg border border-border p-4"><p>No documents match these filters. An empty result does not mean the work has been completed.</p><button className={"mt-2 min-h-11 " + LINK} onClick={()=>{setQuery("");setGroup("");setStatus("");}}>Clear filters</button></div>}
    <ul className="space-y-3">
      {docs.map(doc=><li key={doc.id} className="rounded-lg border border-border p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2"><h4 className="font-semibold">{doc.title}</h4><span className="text-sm">{doc.status} · v{doc.version} · {doc.id}</span></div>
        <p className="mt-2">{doc.summary}</p>
        <details className="mt-3"><summary className="min-h-11 cursor-pointer font-medium focus-visible:outline focus-visible:outline-2">Evidence, history and review status</summary>
          <p className="mt-2"><a className={LINK} href={sourceUrl(doc)}>Read pinned source</a></p>
          <p className="mt-2">Editor: {doc.editor ?? "not appointed"}. Reviewers: {doc.reviewers.length ? doc.reviewers.join(", ") : "none accepted"}. Decision: {doc.decision ? "see decision record" : "none recorded"}.</p>
          <ul className="mt-2 list-disc pl-5">{doc.deliverables.map(item=><li key={item}>{item}</li>)}</ul>
          <ol className="mt-3 list-decimal pl-5">{doc.history.map(h=><li key={h.version}>{h.date} · v{h.version} · {h.event} Prepared by {h.actorKind}.</li>)}</ol>
        </details>
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
          <button className={"min-h-11 " + LINK} onClick={()=>beginReview(doc.id)}>Prepare review draft<span className="sr-only"> for {doc.id}</span></button>
          <a className={"inline-flex min-h-11 items-center " + LINK} href={"/contact/?arm=working-group&group="+doc.groupId+"&stage=review"}>Use email route<span className="sr-only"> for {doc.id}</span></a>
        </div>
      </li>)}
    </ul>
    {reviewDoc && <form aria-labelledby="wg-review-title" className="space-y-3 rounded-lg border border-border p-4" onSubmit={e=>{e.preventDefault();setDraft(reviewDraft(catalog,reviewId,{observation,conflicts}));}}>
      <h4 id="wg-review-title" className="font-semibold">Prepare review: {reviewDoc.title}</h4>
      <p className="text-sm">Draft text is temporary. Download a copy before leaving or switching views. Nothing is sent or saved to a case. Changing the document clears this draft.</p>
      <label className="block" htmlFor="wg-observation">Observation and public evidence<textarea id="wg-observation" className={INPUT} rows={5} maxLength={8000} value={observation} onChange={e=>{setObservation(e.target.value);setDraft("");}} required /></label>
      <label className="block" htmlFor="wg-conflicts">Relevant competence and conflicts<textarea id="wg-conflicts" className={INPUT} rows={3} maxLength={8000} value={conflicts} onChange={e=>{setConflicts(e.target.value);setDraft("");}} /></label>
      <button className="min-h-11 rounded-md bg-foreground px-4 text-background" type="submit">Prepare download</button>
      {draft && <div role="status"><p className="mb-2">Draft ready. Review it before sharing.</p><a className={LINK} href={"data:text/markdown;charset=utf-8,"+encodeURIComponent(draft)} download={reviewId+"-review-draft.md"}>Download unsent review draft (.md)</a></div>}
    </form>}
  </section>;
}
