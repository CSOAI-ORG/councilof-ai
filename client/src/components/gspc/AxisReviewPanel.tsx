import { useRef, useState } from "react";
import HitlConsole from "../HitlConsole";
import type { AxisSpecialistAudit } from "./CouncilAxisSpecialistPane";
import { axisReviewRequest, submitAxisReview } from "../../lib/axisSpecialistReview";
import type { HitlChallenge } from "../../../../functions/api/_hitl";

type Outcome = { state: "sending" | "confirmed" | "unconfirmed"; challenge?: HitlChallenge & { stored: boolean }; error?: string };
export default function AxisReviewPanel({ audit }: { audit: AxisSpecialistAudit | null }) {
  const [selection, setSelection] = useState({ audit: "", proposal: "", acknowledged: false });
  const [outcomes, setOutcomes] = useState<Record<string, Outcome>>({});
  const submitting = useRef(false);
  if (!audit) return null;
  const proposal = selection.audit === audit.audit_sha256 ? selection.proposal : "";
  const acknowledged = selection.audit === audit.audit_sha256 && selection.acknowledged;
  const key = `${audit.audit_sha256}:${proposal}`;
  const outcome = outcomes[key];
  const sending = Object.values(outcomes).some(item => item.state === "sending");
  async function send() {
    if (!audit || !proposal || !acknowledged || submitting.current || outcomes[key]) return;
    submitting.current = true;
    setOutcomes(previous => ({ ...previous, [key]: { state: "sending" } }));
    try {
      const input = await axisReviewRequest(audit, proposal);
      const challenge = await submitAxisReview(input);
      setOutcomes(previous => ({ ...previous, [key]: { state: "confirmed", challenge } }));
    } catch (error) {
      setOutcomes(previous => ({ ...previous, [key]: { state: "unconfirmed", error: error instanceof Error ? error.message : "Review outcome unconfirmed." } }));
    } finally { submitting.current = false; }
  }
  return <section aria-labelledby="axis-human-review" className="mt-6 rounded-2xl border border-border bg-card p-5">
    <h3 id="axis-human-review" className="text-lg font-bold">Continue to human review</h3>
    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Choose one bounded proposal. Sending it creates a public review request in the existing Council queue. It does not approve or apply the proposal.</p>
    <label className="mt-4 block text-sm font-semibold">Proposal to review
      <select value={proposal} disabled={sending} onChange={event => setSelection({ audit: audit.audit_sha256, proposal: event.target.value, acknowledged: false })} className="mt-2 min-h-11 w-full rounded-xl border border-border bg-card px-3 text-sm">
        <option value="">Choose a proposal</option>
        {audit.improvement_proposals.map(item => <option key={item.id} value={item.id}>{item.proposal}</option>)}
      </select>
    </label>
    <label className="mt-4 flex items-start gap-3 text-sm"><input type="checkbox" checked={acknowledged} disabled={!proposal || Boolean(outcome)} onChange={event => setSelection(previous => ({ ...previous, acknowledged: event.target.checked }))} className="mt-1 h-5 w-5 shrink-0" />I understand that the proposal and its evidence identifiers will be public, and that sending it grants no execution permission.</label>
    <button type="button" disabled={!proposal || !acknowledged || Boolean(outcome) || sending} onClick={() => void send()} className="mt-4 min-h-11 rounded-xl bg-emerald-800 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{outcome?.state === "sending" ? "Sending review request…" : "Send selected proposal for human review"}</button>
    {outcome?.state === "unconfirmed" ? <div role="alert" className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-950"><p>{outcome.error}</p><p className="mt-2">No retry was sent. Keep this page open and <a className="underline" href="/dashboard?tab=staff" target="_blank" rel="noopener noreferrer">inspect the existing review queue</a> before any new submission.</p></div> : null}
    {outcome?.challenge ? <div className="mt-4" data-testid="axis-review-handoff"><p role="status" className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-950">{outcome.challenge.stored ? "Review request recorded. Awaiting a human decision." : "Review request created but not stored. Keep this page and download the record; it is not in the persistent queue."}</p>
      <a className="mt-3 inline-block min-h-11 break-all py-2 text-sm underline" download={`${audit.axis}-review.json`} href={`data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(outcome.challenge, null, 2))}`}>Download review request</a>
      <div className="mt-4 min-w-0 rounded-xl bg-slate-950 p-4 [overflow-wrap:anywhere]"><HitlConsole key={outcome.challenge.id} challenge={outcome.challenge} /></div>
    </div> : null}
  </section>;
}
