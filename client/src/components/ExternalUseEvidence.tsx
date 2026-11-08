import { Link } from "wouter";
import { EXTERNAL_USE_EXAMPLES, EXTERNAL_USE_REVIEWED } from "@/data/external-use";
import { PUBLIC_CONTRIBUTIONS, PUBLIC_CONTRIBUTIONS_REVIEWED } from "@/data/public-contributions";

const reviewedDate = (date: string) => new Intl.DateTimeFormat("en-GB", {
  day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
}).format(new Date(`${date}T12:00:00Z`));

type Example = (typeof EXTERNAL_USE_EXAMPLES)[number] | (typeof PUBLIC_CONTRIBUTIONS)[number];

function EvidenceCards({ examples, compact, inverted }: { examples: readonly Example[]; compact: boolean; inverted: boolean }) {
  const muted = inverted ? "text-slate-300" : "text-muted-foreground";
  const link = inverted ? "text-emerald-300" : "text-emerald-700 dark:text-emerald-300";
  return <div className={`mt-6 grid gap-5 ${examples.length === 2 ? "lg:grid-cols-2" : "lg:grid-cols-3"}`}>
    {examples.map((example) => (
      <article key={example.id} data-evidence-id={example.id} className={`min-w-0 rounded-2xl border p-5 ${inverted ? "border-slate-700 bg-slate-900" : "border-border bg-card"}`}>
        <p className={`text-xs font-bold uppercase tracking-wider ${link}`}>{example.category}</p>
        <h3 className="mt-3 text-lg font-bold leading-snug">{example.title}</h3>
        <p className={`mt-3 text-sm leading-6 ${muted}`}>{example.summary}</p>
        <p className={`mt-3 text-xs leading-5 ${muted}`}>{example.event}</p>
        {!compact && <>
          <p className={`mt-3 text-sm leading-6 ${muted}`}>{example.detail}</p>
          <p className={`mt-2 text-xs leading-5 ${muted}`}>Source revision: <code className="break-all">{example.revision}</code></p>
        </>}
        <p className={`mt-3 text-sm leading-6 ${muted}`}>{example.boundary}</p>
        <ul className="mt-4 space-y-2">
          {(compact ? example.sources.slice(0, 1) : example.sources).map((source) => (
            <li key={source.href}><a href={source.href} target="_blank" rel="noopener noreferrer" className={`inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4 ${link}`}>{source.label}</a></li>
          ))}
        </ul>
      </article>
    ))}
  </div>;
}

export default function ExternalUseEvidence({ compact = false, inverted = false, id = "external-use" }: { compact?: boolean; inverted?: boolean; id?: string }) {
  const muted = inverted ? "text-slate-300" : "text-muted-foreground";
  const link = inverted ? "text-emerald-300" : "text-emerald-700 dark:text-emerald-300";
  return (<>
    <section aria-labelledby={`${id}-heading`} data-testid="external-use-evidence">
      <h2 id={`${id}-heading`} className="text-2xl font-bold tracking-tight">Public evidence of outside use</h2>
      <p className={`mt-3 max-w-3xl text-base leading-7 ${muted}`}>
        Other developers have run a specific Council artifact, implemented a published proposal and cited its research.
        Each example has its own scope and primary source.
      </p>
      <p className={`mt-2 text-sm ${muted}`}>Sources reviewed <time dateTime={EXTERNAL_USE_REVIEWED}>{reviewedDate(EXTERNAL_USE_REVIEWED)}</time>.</p>
      <EvidenceCards examples={EXTERNAL_USE_EXAMPLES} compact={compact} inverted={inverted} />
      {compact && <Link href="/traction/#external-use" className={`mt-4 inline-flex min-h-11 items-center font-bold underline underline-offset-4 ${link}`}>Read the evidence and commercial position</Link>}
    </section>
    <section id={`${id}-contributions`} aria-labelledby={`${id}-contributions-heading`} className="mt-10 scroll-mt-24" data-testid="public-contributions-evidence">
      <h2 id={`${id}-contributions-heading`} className="text-2xl font-bold tracking-tight">Public technical contributions</h2>
      <p className={`mt-3 max-w-3xl text-base leading-7 ${muted}`}>Council of AI contributes practical suggestions about evaluation and evidence to public discussions. The records below document those contributions separately from outside use.</p>
      <p className={`mt-2 text-sm ${muted}`}>Sources reviewed <time dateTime={PUBLIC_CONTRIBUTIONS_REVIEWED}>{reviewedDate(PUBLIC_CONTRIBUTIONS_REVIEWED)}</time>.</p>
      <EvidenceCards examples={PUBLIC_CONTRIBUTIONS} compact={compact} inverted={inverted} />
    </section>
  </>);
}
