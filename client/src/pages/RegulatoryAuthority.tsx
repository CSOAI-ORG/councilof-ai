import { Link } from "wouter";
import { ArrowRight, FileCheck, BookOpen, History, Building2 } from "lucide-react";

const evidence = [
  { icon: FileCheck, title: "Measurement records", href: "/gspc-verify", label: "Inspect and verify a record", description: "Read the measured system, method, sample, date and limitations. Check a signature where one is supplied; unsigned and unavailable evidence remain visible." },
  { icon: BookOpen, title: "Published methods", href: "/methodology", label: "Read the methodology", description: "Inspect how an observation was produced and what it can establish. A framework reference or crosswalk does not establish compliance with the whole instrument." },
  { icon: History, title: "Corrections and withdrawals", href: "/corrections", label: "Read public corrections", description: "Review dated corrections, withdrawn claims and their supporting records. The public record includes limits and failures alongside results." },
  { icon: Building2, title: "Participation and provenance", href: "/memberships", label: "Inspect participation evidence", description: "Check the source and scope of each published membership or contribution. Participation in a standards process does not mean adoption, accreditation or endorsement." },
];

export default function RegulatoryAuthority() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="border-b bg-primary/5 py-16 sm:py-20">
        <div className="container mx-auto max-w-5xl px-4">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-primary">Council of AI · CSOAI Ltd</p>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">AI measurement for governance review</h1>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground">
            CSOAI publishes measurement evidence, verification tools and corrections so an organisation can inspect the record behind a claim and include it in its own review.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/gspc-verify" className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground">Verify evidence <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
            <Link href="/for/regulator" className="rounded-lg border px-5 py-3 font-semibold">Evidence for regulators</Link>
          </div>
        </div>
      </section>

      <div className="container mx-auto max-w-5xl space-y-14 px-4 py-14">
        <section aria-labelledby="organisation-heading" className="rounded-xl border p-6 sm:p-8">
          <h2 id="organisation-heading" className="text-2xl font-bold">The organisation behind the record</h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Council of AI is operated by CSOAI Ltd, UK company 16939677. Companies House records the company as active, incorporated on 2 January 2026. Company registration identifies the legal entity; it does not confer regulatory authority.
          </p>
          <div className="mt-5 flex flex-wrap gap-5 text-sm font-semibold">
            <a href="https://find-and-update.company-information.service.gov.uk/company/16939677" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-4">Check the company register</a>
            <Link href="/about" className="text-primary underline underline-offset-4">About CSOAI</Link>
            <Link href="/licensing-agreement/#rights" className="text-primary underline underline-offset-4">Evidence and reuse rights</Link>
          </div>
        </section>

        <section aria-labelledby="record-heading">
          <h2 id="record-heading" className="text-3xl font-bold">What you can inspect today</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {evidence.map(({ icon: Icon, title, href, label, description }) => (
              <article key={href} className="flex flex-col rounded-xl border p-6">
                <Icon className="mb-4 h-7 w-7 text-primary" aria-hidden="true" />
                <h3 className="text-xl font-semibold">{title}</h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
                <Link href={href} className="mt-5 text-sm font-semibold text-primary underline underline-offset-4">{label} →</Link>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="scope-heading" className="rounded-xl border bg-muted/30 p-6 sm:p-8">
          <h2 id="scope-heading" className="text-2xl font-bold">Use the evidence within its scope</h2>
          <div className="mt-5 space-y-4 text-sm leading-relaxed text-muted-foreground">
            <p>A measurement records an observation under a stated method at a stated time. It does not certify a system, issue a conformity mark, authorise deployment or replace an organisation’s obligations.</p>
            <p>CSOAI is not an accredited certification body or an EU notified body. No government mandate, NIST recognition or automatic regulatory acceptance is claimed. A recipient determines whether a specific record is suitable for its decision.</p>
            <p>Free verification checks the record supplied to it. Signature validity, current key status, completeness of the measurement and rights to reuse an asset are separate questions.</p>
          </div>
          <Link href="/standards" className="mt-5 inline-block text-sm font-semibold text-primary underline underline-offset-4">Inspect official framework references →</Link>
        </section>

        <section aria-labelledby="review-heading">
          <h2 id="review-heading" className="text-2xl font-bold">Discuss a specific review</h2>
          <p className="mt-3 max-w-3xl leading-relaxed text-muted-foreground">Tell us which system, claim or evidence requirement you need to inspect. We can define the measurement and delivery scope against the published methods and available records.</p>
          <div className="mt-6 flex flex-wrap gap-5 font-semibold">
            <Link href="/contact" className="text-primary underline underline-offset-4">Contact CSOAI</Link>
            <Link href="/claim-maintenance" className="text-primary underline underline-offset-4">Inspect claim maintenance</Link>
            <Link href="/connect" className="text-primary underline underline-offset-4">Connect to the evidence tools</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
