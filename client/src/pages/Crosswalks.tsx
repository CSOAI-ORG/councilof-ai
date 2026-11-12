import {
  ArrowRight,
  FileText,
  GitCompareArrows,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const examples = [
  {
    title: "Record-keeping",
    reference: "EU AI Act · Article 12",
    href: "https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-12",
    question:
      "Which events were recorded, by which system, and can the record be inspected?",
    evidence:
      "Identify the log or evidence packet, its scope, timestamps, source version and integrity checks.",
  },
  {
    title: "Human oversight",
    reference: "EU AI Act · Article 14",
    href: "https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-14",
    question:
      "Who could intervene, what authority did they have, and what action is recorded?",
    evidence:
      "Keep role assignment, human acceptance, decision and observed action as separate records.",
  },
  {
    title: "Penalties and enforcement",
    reference: "EU AI Act · Article 99",
    href: "https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-99",
    question:
      "Which competent authority and legal process apply to the system and alleged infringement?",
    evidence:
      "Record the applicable source and responsible authority. Council measurement does not confer enforcement powers.",
  },
];

export default function Crosswalks() {
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-br from-emerald-950 to-teal-900 py-20 text-white">
        <div className="container max-w-5xl">
          <Badge className="mb-5 border-emerald-300/30 bg-emerald-500/20 text-emerald-100">
            Sources, questions and evidence
          </Badge>
          <h1 className="text-4xl font-bold leading-tight md:text-5xl">
            Framework crosswalks
          </h1>
          <p className="mt-6 max-w-3xl text-xl leading-relaxed text-emerald-50">
            Connect a governance question to its published source and the
            evidence needed to examine it. Council's charter register, methods
            and verification tools make that work inspectable.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href="/charter-register/"
              className="rounded-lg bg-white px-5 py-3 font-semibold text-emerald-900"
            >
              Inspect the source register
            </a>
            <a
              href="/services/"
              className="rounded-lg border border-emerald-200 px-5 py-3 font-semibold"
            >
              Discuss a scoped evidence review
            </a>
          </div>
        </div>
      </section>

      <section
        className="container max-w-6xl py-16"
        aria-labelledby="crosswalk-tools"
      >
        <h2 id="crosswalk-tools" className="text-3xl font-bold text-slate-900">
          Start with material you can inspect
        </h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Source register",
              icon: FileText,
              text: "Read charter sources, frozen provision identifiers and their recorded coverage and review status.",
              href: "/charter-register/",
              label: "Read sources",
            },
            {
              title: "Measurement methods",
              icon: GitCompareArrows,
              text: "Use the published method and dated result to see what a particular check actually measures.",
              href: "/methodology/",
              label: "Inspect methods",
            },
            {
              title: "Record verification",
              icon: ShieldCheck,
              text: "Check supported signed records with the public verifier. Integrity helps establish which bytes were signed; interpretation still needs evidence.",
              href: "/gspc-verify/",
              label: "Verify a record",
            },
          ].map(({ title, icon: Icon, text, href, label }) => (
            <Card key={title}>
              <CardContent className="p-6">
                <Icon
                  className="mb-4 h-7 w-7 text-emerald-700"
                  aria-hidden="true"
                />
                <h3 className="text-xl font-semibold">{title}</h3>
                <p className="my-4 leading-relaxed text-slate-600">{text}</p>
                <a
                  href={href}
                  className="font-semibold text-emerald-800 underline underline-offset-4"
                >
                  {label}
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section
        className="bg-slate-50 py-16"
        aria-labelledby="crosswalk-examples"
      >
        <div className="container max-w-6xl">
          <h2
            id="crosswalk-examples"
            className="text-3xl font-bold text-slate-900"
          >
            Three examples of evidence questions
          </h2>
          <p className="mt-4 max-w-3xl leading-relaxed text-slate-600">
            These examples use the European Commission's AI Act article
            references, checked on 4 November 2026. They are starting points for
            a scoped review. Applicability and a conformity assessment require
            the exact system, legal text and responsible parties; a thematic
            mapping is not a compliance result.
          </p>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {examples.map((example) => (
              <article
                key={example.title}
                className="rounded-xl border border-slate-200 bg-white p-6"
              >
                <h3 className="text-xl font-semibold">{example.title}</h3>
                <a
                  href={example.href}
                  className="mt-3 inline-block text-sm font-semibold text-emerald-800 underline underline-offset-4"
                >
                  {example.reference}
                </a>
                <p className="mt-4 font-medium leading-relaxed text-slate-800">
                  {example.question}
                </p>
                <p className="mt-3 leading-relaxed text-slate-600">
                  {example.evidence}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        className="container max-w-5xl py-16"
        aria-labelledby="crosswalk-review"
      >
        <h2 id="crosswalk-review" className="text-3xl font-bold text-slate-900">
          Build a crosswalk a reviewer can use
        </h2>
        <ol className="mt-6 list-decimal space-y-4 pl-6 leading-relaxed text-slate-700">
          <li>
            Choose the named framework, edition and system scope. Record the
            authoritative source and access date.
          </li>
          <li>
            State the specific requirement or question, its responsible owner
            and the evidence needed to assess it.
          </li>
          <li>
            Link the method, input, result and limitations. Keep proposed
            controls distinct from demonstrated operation.
          </li>
          <li>
            Record review findings, unresolved questions and corrections before
            relying on the mapping.
          </li>
        </ol>
        <p className="mt-6 leading-relaxed text-slate-600">
          The earlier Charter crosswalk included thematic comparisons with the
          EU AI Act, NIST AI RMF, ISO/IEC 42001, TC260 and CMMC. Its clause
          references and alignment ratings have not been established as a
          complete reviewed matrix. The{" "}
          <a
            className="text-emerald-800 underline"
            href="https://github.com/CSOAI-ORG/councilof-ai/blob/cc7859d1c4930146dad9a3595061b2e5d209fe63/client/src/pages/Crosswalks.tsx"
          >
            earlier source remains available
          </a>{" "}
          for history; the{" "}
          <a className="text-emerald-800 underline" href="/charter-register/">
            source register
          </a>{" "}
          and
          <a className="text-emerald-800 underline" href="/working-groups/">
            {" "}
            working-group tracker
          </a>{" "}
          provide the current review routes.
        </p>
        <div className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50 p-6">
          <h3 className="text-xl font-semibold text-emerald-950">
            Bring one system and one decision
          </h3>
          <p className="mt-3 leading-relaxed text-emerald-900">
            We can discuss a defined evidence packet, review question and
            written output. Agree the scope, capacity and acceptance conditions
            before work begins.
          </p>
          <a
            href="/contact?subject=framework-evidence-review"
            className="mt-5 inline-flex items-center gap-2 font-semibold text-emerald-900 underline underline-offset-4"
          >
            Discuss the scope{" "}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </section>
    </div>
  );
}
