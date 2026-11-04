import { Globe, GraduationCap, Shield, Users, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const scopes = [
  {
    title: "Capacity building",
    icon: GraduationCap,
    text: "Help a public-sector team read measurement records, examine methods and ask useful questions about an AI system.",
    output:
      "Proposed output: a scoped workshop, worked evidence example and agreed follow-up questions.",
  },
  {
    title: "Government evidence pilot",
    icon: Shield,
    text: "Take one procurement or deployment question and identify the records, checks and accountable people needed to examine it.",
    output:
      "Proposed output: an evidence inventory, reproducibility findings and a prioritised review plan.",
  },
  {
    title: "Regional collaboration",
    icon: Users,
    text: "Explore a shared method with participating organisations while keeping each jurisdiction's responsibilities and source rights explicit.",
    output:
      "Proposed output: a versioned method proposal, comparison criteria and a record of review findings.",
  },
];

export default function GlobalAISafetyInitiative() {
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-br from-emerald-950 to-teal-900 py-20 text-white">
        <div className="container max-w-5xl">
          <Badge className="mb-5 border-emerald-300/30 bg-emerald-500/20 text-emerald-100">
            <Globe className="mr-2 h-4 w-4" aria-hidden="true" />
            Global AI Safety Initiative · proposed programme
          </Badge>
          <h1 className="text-4xl font-bold leading-tight md:text-5xl">
            Public-sector decisions need inspectable AI evidence
          </h1>
          <p className="mt-6 max-w-3xl text-xl leading-relaxed text-emerald-50">
            Council of AI publishes measurement tools, methods, datasets and
            verification records. The Global AI Safety Initiative proposes a
            practical way for governments and regional organisations to use that
            work: start with one system, one decision and a defined evidence
            question.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href="/contact?subject=government-evidence"
              className="rounded-lg bg-white px-5 py-3 font-semibold text-emerald-900"
            >
              Discuss a government evidence pilot
            </a>
            <a
              href="/board/"
              className="rounded-lg border border-emerald-200 px-5 py-3 font-semibold"
            >
              Inspect published measurements
            </a>
          </div>
        </div>
      </section>

      <section
        className="container max-w-6xl py-16"
        aria-labelledby="public-sector-current"
      >
        <h2
          id="public-sector-current"
          className="text-3xl font-bold text-slate-900"
        >
          Explore the existing work
        </h2>
        <p className="mt-4 max-w-3xl leading-relaxed text-slate-600">
          Start with the public board, follow the method behind a result and
          verify a supported signed record. These resources are available for
          inspection before discussing a project.
        </p>
        <div className="mt-7 flex flex-wrap gap-4">
          <a
            href="/methodology/"
            className="font-semibold text-emerald-800 underline underline-offset-4"
          >
            Measurement methods
          </a>
          <a
            href="/gspc-verify/"
            className="font-semibold text-emerald-800 underline underline-offset-4"
          >
            Free record verification
          </a>
          <a
            href="/products/"
            className="font-semibold text-emerald-800 underline underline-offset-4"
          >
            Products and interfaces
          </a>
          <a
            href="/traction/"
            className="font-semibold text-emerald-800 underline underline-offset-4"
          >
            Operating evidence
          </a>
        </div>
      </section>

      <section
        className="bg-slate-50 py-16"
        aria-labelledby="public-sector-scopes"
      >
        <div className="container max-w-6xl">
          <h2
            id="public-sector-scopes"
            className="text-3xl font-bold text-slate-900"
          >
            Three scopes to discuss
          </h2>
          <p className="mt-4 max-w-3xl leading-relaxed text-slate-600">
            These are programme proposals. Each engagement needs an agreed
            scope, delivery owner, capacity, price and acceptance criteria
            before it starts.
          </p>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {scopes.map(({ title, icon: Icon, text, output }) => (
              <Card key={title}>
                <CardContent className="p-6">
                  <Icon
                    className="mb-4 h-7 w-7 text-emerald-700"
                    aria-hidden="true"
                  />
                  <h3 className="text-xl font-semibold">{title}</h3>
                  <p className="mt-4 leading-relaxed text-slate-600">{text}</p>
                  <p className="mt-4 border-t border-slate-200 pt-4 text-sm leading-relaxed text-slate-700">
                    {output}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section
        className="container max-w-5xl py-16"
        aria-labelledby="public-sector-process"
      >
        <h2
          id="public-sector-process"
          className="text-3xl font-bold text-slate-900"
        >
          From enquiry to a defined piece of work
        </h2>
        <ol className="mt-6 list-decimal space-y-4 pl-6 leading-relaxed text-slate-700">
          <li>
            <strong>Define the decision.</strong> Name the system, intended use,
            responsible organisation and question the evidence must help answer.
          </li>
          <li>
            <strong>Agree the material and method.</strong> Establish source
            permissions, confidentiality, permitted tooling, reviewer competence
            and any conflicts.
          </li>
          <li>
            <strong>Set the deliverable.</strong> Agree the files, written
            findings, limitations, schedule and acceptance conditions. Human
            roles and support arrangements must be accepted explicitly.
          </li>
          <li>
            <strong>Review the result.</strong> Record what the evidence
            supports, what remains unresolved and the next justified step.
          </li>
        </ol>
        <p className="mt-6 leading-relaxed text-slate-600">
          The programme does not create a national authority, a staffed
          oversight service or a legal conformity result. Local policy,
          regulatory decisions and deployment authority remain with the
          responsible institutions. Existing{" "}
          <a href="/services/" className="text-emerald-800 underline">
            scoped services
          </a>{" "}
          provide the starting point for a proposal.
        </p>
        <div className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50 p-6">
          <h3 className="text-xl font-semibold text-emerald-950">
            Tell us the question you need to answer
          </h3>
          <p className="mt-3 leading-relaxed text-emerald-900">
            Use the contact page with your organisation, jurisdiction, intended
            use and desired output. Share public or synthetic material
            initially; arrange suitable terms before sending confidential
            records.
          </p>
          <a
            href="/contact?subject=government-evidence"
            className="mt-5 inline-flex items-center gap-2 font-semibold text-emerald-900 underline underline-offset-4"
          >
            Open the contact page{" "}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </section>
    </div>
  );
}
