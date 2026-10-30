import { WORKING_GROUPS, WORKING_GROUPS_AS_OF, WORKING_GROUPS_CHARTER, workingGroupEnquiryHref } from "@/lib/workingGroups";

const LINK = "underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4";

export default function WorkingGroups() {
  return (
    <section aria-labelledby="working-groups-heading" className="mt-8 space-y-6">
      <div>
        <h2 id="working-groups-heading" className="text-2xl font-bold">Public Watchdog working groups</h2>
        <p className="mt-2 text-muted-foreground">Forming · proposal dated {WORKING_GROUPS_AS_OF}. Independent researchers, practitioners and people affected by AI are welcome to propose a contribution. Chairs and reviewer appointments are not yet confirmed.</p>
        <p className="mt-2 text-muted-foreground">Choose a bounded first task below. The groups cover the axes in our dated GSPC snapshot; coverage does not mean every axis is measured or staffed. See the <a className={LINK} href="/board/">live board</a> for measurement state.</p>
      </div>
      <div className="rounded-xl border border-border p-5">
        <h3 className="font-semibold">Proposed operating charter</h3>
        <p className="mt-2">The engine can collect public sources, run frozen tests and prepare evidence. A named, competent human reviews scope and findings; an independent reviewer handles contested conclusions. Publication, consequential actions and regulator referrals need explicit human authority.</p>
        <p className="mt-2">Researchers disclose conflicts and can record dissent. Contributors agree their scope, attribution, time and any funding before starting. An enquiry neither appoints a reviewer nor grants access to private cases.</p>
        <p className="mt-2">Council of AI is an evidence and measurement project. Participation in another working group is not its endorsement. These groups do not certify compliance or speak for regulators.</p>
        <p className="mt-3"><a className={LINK} href={WORKING_GROUPS_CHARTER}>Read the full draft charter</a></p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {WORKING_GROUPS.map(group => (
          <article key={group.id} id={group.id} className="rounded-xl border border-border p-5">
            <h3 className="text-lg font-semibold">{group.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">Forming · chair and independent reviewer to be appointed</p>
            <p className="mt-3">{group.purpose}</p>
            <p className="mt-3"><strong>First task:</strong> {group.firstTask}</p>
            <details className="mt-3">
              <summary className="cursor-pointer font-medium focus-visible:outline focus-visible:outline-2">Axes in this group</summary>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {group.axes.map(axis => <li key={axis}><a className={LINK} href={`/gspc/${axis}/`}>{axis}</a></li>)}
              </ul>
            </details>
            <a className={`mt-4 inline-flex min-h-11 items-center ${LINK}`} href={workingGroupEnquiryHref(group.id)}>Prepare participation enquiry<span className="sr-only"> for {group.name}</span></a>
          </article>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">The contact page prepares an email for you to review and send. It does not submit an application or create membership. Share public work first; agree a private channel before sharing confidential evidence.</p>
      <nav aria-label="Human review and challenges" className="flex flex-wrap gap-5">
        <a className={LINK} href="/dashboard?tab=staff">Council OS review workspace (authorised staff)</a>
        <a className={LINK} href="/dispute/">Challenge a finding</a>
        <a className={LINK} href="/corrections/">Read corrections</a>
      </nav>
    </section>
  );
}
