import { useState } from "react";
import { WORKING_GROUPS, WORKING_GROUPS_AS_OF, WORKING_GROUPS_CHARTER, REVOCATION_REVIEW_PROTOCOL, workingGroupBrief, workingGroupEnquiryHref } from "@/lib/workingGroups";

import WorkingGroupTracker from "./WorkingGroupTracker";

const LINK = "underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4";

export default function WorkingGroups() {
  const [view, setView] = useState(() => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("groupview") === "tracker" ? "tracker" : "tasks");
  function changeView(next: string) {
    setView(next);
    const url = new URL(window.location.href);
    if (next === "tracker") url.searchParams.set("groupview", "tracker");
    else url.searchParams.delete("groupview");
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
  }
  return (
    <section aria-labelledby="working-groups-heading" className="mt-8 space-y-6">
      <div>
        <h2 id="working-groups-heading" className="text-2xl font-bold">Public Watchdog working groups</h2>
        <p className="mt-2 text-muted-foreground">Forming · proposal dated {WORKING_GROUPS_AS_OF}. Independent researchers, practitioners and people affected by AI are welcome to propose a contribution. Chairs and reviewer appointments are not yet confirmed.</p>
        <p className="mt-2 text-muted-foreground">Choose a bounded first task below. The groups cover the axes in our dated GSPC snapshot; coverage does not mean every axis is measured or staffed. See the <a className={LINK} href="/board/">live board</a> for measurement state.</p>
      </div>
      <nav aria-label="Working group views" className="flex flex-wrap gap-3">
        <button type="button" aria-pressed={view === "tasks"} className="min-h-11 rounded-md border border-border px-4 font-medium aria-pressed:bg-foreground aria-pressed:text-background" onClick={() => changeView("tasks")}>Start a task</button>
        <button type="button" aria-pressed={view === "tracker"} className="min-h-11 rounded-md border border-border px-4 font-medium aria-pressed:bg-foreground aria-pressed:text-background" onClick={() => changeView("tracker")}>Track documents</button>
      </nav>
      <div className="rounded-xl border border-border p-5" aria-labelledby="contribution-steps">
        <h3 id="contribution-steps" className="font-semibold">Make your first contribution</h3>
        <ol className="mt-3 list-decimal space-y-2 pl-5">
          <li><strong>Choose a task.</strong> Download a group brief with the scope, evidence checklist and review notes.</li>
          <li><strong>Agree the terms.</strong> Prepare a participation enquiry to discuss time, attribution, conflicts and any funding before starting.</li>
          <li><strong>Return your evidence.</strong> Prepare a contribution email, add your public result and review it before sending. Keep a copy and wait for acknowledgement and an agreed next step.</li>
        </ol>
        <p className="mt-3 text-sm text-muted-foreground">No response time or appointment is promised. A completed task does not grant case access or authority to act.</p>
      </div>
      <div className="rounded-xl border border-border p-5">
        <h3 className="font-semibold">Proposed operating charter</h3>
        <p className="mt-2">The engine can collect public sources, run frozen tests and prepare evidence. A named, competent human reviews scope and findings; an independent reviewer handles contested conclusions. Publication, consequential actions and regulator referrals need explicit human authority.</p>
        <p className="mt-2">Researchers disclose conflicts and can record dissent. Contributors agree their scope, attribution, time and any funding before starting. An enquiry neither appoints a reviewer nor grants access to private cases.</p>
        <p className="mt-2">Council of AI is an evidence and measurement project. Participation in another working group is not its endorsement. These groups do not certify compliance or speak for regulators.</p>
        <p className="mt-3"><a className={LINK} href={WORKING_GROUPS_CHARTER}>Read the full draft charter</a></p>
      </div>
      {view === "tracker" ? <WorkingGroupTracker /> : <div className="grid gap-4 md:grid-cols-2">
        {WORKING_GROUPS.map(group => (
          <article key={group.id} id={group.id} className="rounded-xl border border-border p-5">
            <h3 className="text-lg font-semibold">{group.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">Forming · chair and independent reviewer to be appointed</p>
            <p className="mt-3">{group.purpose}</p>
            <p className="mt-3"><strong>First task:</strong> {group.firstTask}</p>
            {group.id === "agent-control" && <p className="mt-3"><a className={LINK} href={REVOCATION_REVIEW_PROTOCOL}>Open the runnable revocation trial</a><span className="block text-sm text-muted-foreground">Four local controls, including failures and unknown effects. Independent review is pending; production halt latency is unmeasured.</span></p>}
            <details className="mt-3">
              <summary className="cursor-pointer font-medium focus-visible:outline focus-visible:outline-2">Axes in this group</summary>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {group.axes.map(axis => <li key={axis}><a className={LINK} href={`/gspc/${axis}/`}>{axis}</a></li>)}
              </ul>
            </details>
            <div className="mt-4 flex flex-col items-start gap-1">
              <a className={`inline-flex min-h-11 items-center ${LINK}`} href={workingGroupBrief(group.id)!.href} download={workingGroupBrief(group.id)!.filename}>Download task brief (.md)<span className="sr-only"> for {group.name}</span></a>
              <a className={`inline-flex min-h-11 items-center ${LINK}`} href={workingGroupEnquiryHref(group.id)}>Prepare participation enquiry<span className="sr-only"> for {group.name}</span></a>
              <a className={`inline-flex min-h-11 items-center ${LINK}`} href={workingGroupEnquiryHref(group.id, "review")}>Prepare contribution email<span className="sr-only"> for {group.name}</span></a>
            </div>
          </article>
        ))}
      </div>}
      <p className="text-sm text-muted-foreground">The contact page prepares an email for you to review and send. It does not submit an application or create membership. Share public work first; agree a private channel before sharing confidential evidence.</p>
      <nav aria-label="Human review and challenges" className="flex flex-wrap gap-5">
        <a className={LINK} href="/dashboard?tab=staff">Council OS review workspace (authorised staff)</a>
        <a className={LINK} href="/dispute/">Challenge a finding</a>
        <a className={LINK} href="/corrections/">Read corrections</a>
      </nav>
    </section>
  );
}
