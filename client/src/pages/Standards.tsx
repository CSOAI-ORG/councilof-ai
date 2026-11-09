import { ExternalLink, FileText } from "lucide-react";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const REFERENCES = [
  {
    name: "EU AI Act",
    kind: "EU regulation",
    description: "Regulation (EU) 2024/1689 sets obligations for AI systems and general-purpose AI models. Applicability depends on the system, role and relevant provision.",
    source: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj",
    scope: "Inspect the published provision bank and mechanism map for the checks actually implemented. A provision listed in a corpus is not an executed test.",
  },
  {
    name: "NIST AI RMF",
    kind: "Voluntary risk framework",
    description: "NIST's AI Risk Management Framework supports the design, development, use and evaluation of trustworthy AI. Its source page carries current releases and revision information.",
    source: "https://www.nist.gov/itl/ai-risk-management-framework",
    scope: "A reference for instrument design. CSOAI does not publish a signed measurement crosswalk covering the framework as a whole.",
  },
  {
    name: "ISO/IEC 42001",
    kind: "AI management system standard",
    description: "ISO/IEC 42001:2023 specifies requirements for an AI management system. Consult ISO's source for the standard, edition and permitted access.",
    source: "https://www.iso.org/standard/42001",
    scope: "A reference for management and instrument design. CSOAI does not publish a signed measurement crosswalk covering the standard as a whole.",
  },
];

const METHODS = [
  { title: "Measurement methodology", href: "/methodology/", description: "The instruments, grading rules, evidence states and limits behind a published result." },
  { title: "Statute-to-predicate mechanism", href: "/mechanism/", description: "The published linkage between source provisions and executable checks, with unresolved coverage shown." },
  { title: "Claim Maintenance", href: "/claim-maintenance/", description: "The versioned specification, reference implementation and register for maintaining public claims." },
  { title: "Published findings", href: "/findings/", description: "Inspect a result's subject, measurement window, source and available verification record." },
];

const ADDITIONAL = [
  { name: "OECD AI Principles", href: "https://oecd.ai/en/ai-principles" },
  { name: "IEEE standards for autonomous systems", href: "https://standards.ieee.org/industry-connections/ec/autonomous-systems.html" },
  { name: "UK AI regulation policy", href: "https://www.gov.uk/government/publications/ai-regulation-a-pro-innovation-approach" },
  { name: "Singapore Model AI Governance Framework", href: "https://www.pdpc.gov.sg/help-and-resources/2020/01/model-ai-governance-framework" },
];

export default function Standards() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="surface-ink py-16 text-white sm:py-20">
        <div className="container max-w-5xl">
          <Badge className="mb-5 border-emerald-400/30 bg-emerald-500/10 text-emerald-200">Methods and references</Badge>
          <h1 className="max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl">AI governance references and published methods</h1>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-slate-200">
            Follow the official source for a law or standard, then inspect the CSOAI instrument
            and evidence that address your question. The scope of a measurement is stated in
            its record. Framework references do not establish full coverage or conformity.
          </p>
        </div>
      </section>

      <div className="container max-w-5xl space-y-14 py-12 sm:py-16">
        <section aria-labelledby="published-methods-heading">
          <h2 id="published-methods-heading" className="text-2xl font-bold">Inspect the published work</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {METHODS.map((method) => (
              <Link key={method.href} href={method.href} className="rounded-2xl border bg-card p-6 text-card-foreground transition-colors hover:border-emerald-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700">
                <h3 className="text-lg font-semibold">{method.title} <span aria-hidden="true">→</span></h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{method.description}</p>
              </Link>
            ))}
          </div>
        </section>

        <section aria-labelledby="official-references-heading">
          <h2 id="official-references-heading" className="text-2xl font-bold">Official framework references</h2>
          <p className="mt-3 max-w-3xl leading-relaxed text-muted-foreground">
            CSOAI publishes measurements and evidence. Certification, accreditation and regulatory
            decisions have their own authorities and requirements.
          </p>
          <div className="mt-6 space-y-5">
            {REFERENCES.map((reference) => (
              <Card key={reference.name} className="p-5 sm:p-7">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <Badge variant="outline">{reference.kind}</Badge>
                    <h3 className="mt-3 text-2xl font-semibold">{reference.name}</h3>
                  </div>
                  <FileText className="h-8 w-8 shrink-0 text-emerald-700" aria-hidden="true" />
                </div>
                <p className="mt-4 leading-relaxed text-muted-foreground">{reference.description}</p>
                <div className="mt-4 rounded-xl border bg-muted/40 p-4">
                  <p className="text-sm font-semibold">CSOAI evidence scope</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{reference.scope}</p>
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Button variant="outline" asChild>
                    <a href={reference.source} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" aria-hidden="true" /> Official {reference.name} source
                    </a>
                  </Button>
                  <Link href="/mechanism/" className="inline-flex min-h-10 items-center text-sm font-semibold text-emerald-800 underline underline-offset-4 dark:text-emerald-300">Inspect implemented coverage</Link>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section aria-labelledby="additional-references-heading">
          <h2 id="additional-references-heading" className="text-2xl font-bold">Additional source references</h2>
          <ul className="mt-5 grid list-none gap-3 p-0 sm:grid-cols-2">
            {ADDITIONAL.map((reference) => (
              <li key={reference.href}>
                <a href={reference.href} target="_blank" rel="noopener noreferrer" className="flex h-full items-start justify-between gap-4 rounded-xl border p-4 font-medium hover:bg-muted/50">
                  {reference.name}<ExternalLink className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            These links identify source materials. Participation records and their evidence are
            published separately on <Link href="/memberships/" className="font-medium text-primary underline">Where we take part</Link>.
          </p>
        </section>

        <section className="rounded-2xl border bg-muted/40 p-6 sm:p-8" aria-labelledby="measurement-enquiry-heading">
          <h2 id="measurement-enquiry-heading" className="text-2xl font-bold">Bring one question to the evidence</h2>
          <p className="mt-3 max-w-3xl leading-relaxed text-muted-foreground">
            Tell us the system, claim or decision you need to examine. We can agree the relevant
            sources, method, deliverable and limits within the existing measurement service.
          </p>
          <Button className="mt-5" asChild><Link href="/contact/">Request a scoped measurement</Link></Button>
        </section>
      </div>
    </div>
  );
}
