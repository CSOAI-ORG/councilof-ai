/** Buyer-facing comparison of evidence needs, available Council capabilities and scope. */
import { Link } from "wouter";
import {
  ArrowRight,
  FileCheck2,
  BookOpen,
  Code2,
  History,
  Users,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const capabilities = [
  {
    icon: Search,
    title: "Inspect a published measurement",
    text: "Read a result's subject, method, date, sample and limitations. An absent measurement stays UNMEASURED; a statistical tie is not presented as a winner.",
    href: "/gspc-scoreboard",
    action: "Explore the board",
  },
  {
    icon: FileCheck2,
    title: "Check the evidence yourself",
    text: "Verify supported signed records in your browser or with the published offline checker. Integrity, signature and inclusion checks have distinct results; a valid signature does not prove the claim is true.",
    href: "/gspc-verify",
    action: "Verify a record",
  },
  {
    icon: Code2,
    title: "Connect evidence to your workflow",
    text: "Use documented HTTP, MCP and A2A interfaces to read published evidence. The integration guide names supported paths, tested examples and what remains unmeasured.",
    href: "/connect",
    action: "Inspect the interfaces",
  },
  {
    icon: History,
    title: "Follow corrections",
    text: "Review dated corrections and the sources behind them. A correction stays visible beside the evidence trail, so a later reader can reconstruct what changed.",
    href: "/corrections",
    action: "Read the correction record",
  },
  {
    icon: BookOpen,
    title: "Learn from published examples",
    text: "Use the open learning material and exercises to inspect and reproduce a bounded result. Completing an exercise is not a professional qualification or a promise of employment.",
    href: "/learn",
    action: "Open the learning material",
  },
  {
    icon: Users,
    title: "Commission a defined piece of work",
    text: "Discuss a named system, evidence question and deliverable. Agree the method, access, capacity, acceptance criteria and commercial terms before work starts.",
    href: "/services",
    action: "Explore scoped services",
  },
];

const buyingQuestions = [
  {
    need: "A result another person can inspect",
    ask: "Does it include the source records, method version, date and a reproducible check?",
    council:
      "Published measurement records, methods and verification tools provide an inspectable starting point. Check the specific record's completeness and scope.",
  },
  {
    need: "Evidence inside an existing product or process",
    ask: "Which interfaces and deployment paths have been tested, and who operates the integration?",
    council:
      "Public APIs, MCP tools and documented integration examples are available. Production installation, permissions and support must be assessed for your environment.",
  },
  {
    need: "Evidence for procurement or a release decision",
    ask: "What question will the work answer, what will be delivered, and how will limitations be recorded?",
    council:
      "Scoped evidence work can be discussed through the services enquiry. Payment funds agreed work; it does not buy a favourable result.",
  },
  {
    need: "A legal determination, certification or continuing managed service",
    ask: "Who has the required authority, qualifications and accepted service obligations?",
    council:
      "A Council measurement is evidence, not certification or a legal determination. Any recurring service needs separately agreed scope, people, capacity and terms.",
  },
];

export default function ComparisonPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="bg-gradient-to-br from-primary/10 via-background to-emerald-500/10 px-5 py-16">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            Choosing evidence infrastructure
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            AI measurement you can inspect and bring into your workflow.
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">
            Council of AI publishes measurements, methods, software and
            verification tools, and offers enquiries for scoped evidence work.
            Use the public record to assess whether the capability fits your
            decision, alongside the software and specialist advice you already
            use.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/traction">
              <Button size="lg">
                Inspect the operating evidence{" "}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/services">
              <Button variant="outline" size="lg">
                Discuss a defined engagement
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section
        className="mx-auto max-w-6xl px-5 py-14"
        aria-labelledby="available-capabilities"
      >
        <h2 id="available-capabilities" className="text-3xl font-bold">
          Start with what you can inspect today
        </h2>
        <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
          Free public evidence makes an evaluation possible before an enquiry.
          Follow the source for each capability.
        </p>
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {capabilities.map(({ icon: Icon, title, text, href, action }) => (
            <Card key={title} className="h-full">
              <CardContent className="pt-6">
                <Icon className="h-7 w-7 text-primary" aria-hidden="true" />
                <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {text}
                </p>
                <Link
                  href={href}
                  className="mt-4 inline-block font-semibold text-primary underline underline-offset-4"
                >
                  {action}
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section
        className="bg-muted/40 px-5 py-14"
        aria-labelledby="compare-options"
      >
        <div className="mx-auto max-w-6xl">
          <h2 id="compare-options" className="text-3xl font-bold">
            Compare options against the job you need done
          </h2>
          <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
            Ask these questions of Council and any alternative provider. This is
            a buying checklist, not a ranking of unnamed competitors.
          </p>
          <div
            className="mt-7 overflow-x-auto rounded-lg border bg-background"
            role="region"
            aria-label="Evidence provider buying checklist"
            tabIndex={0}
          >
            <table className="w-full min-w-[640px] text-left text-sm">
              <caption className="sr-only">
                Buyer needs, questions to ask and the relevant Council
                capability
              </caption>
              <thead>
                <tr className="border-b bg-muted/50">
                  <th scope="col" className="p-4">
                    Your need
                  </th>
                  <th scope="col" className="p-4">
                    Ask each provider
                  </th>
                  <th scope="col" className="p-4">
                    Council's available starting point
                  </th>
                </tr>
              </thead>
              <tbody>
                {buyingQuestions.map((row) => (
                  <tr key={row.need} className="border-b last:border-0">
                    <th scope="row" className="p-4 align-top font-semibold">
                      {row.need}
                    </th>
                    <td className="p-4 align-top leading-6">{row.ask}</td>
                    <td className="p-4 align-top leading-6 text-muted-foreground">
                      {row.council}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section
        className="mx-auto max-w-5xl px-5 py-14"
        aria-labelledby="first-engagement"
      >
        <h2 id="first-engagement" className="text-3xl font-bold">
          A practical first engagement
        </h2>
        <ol className="mt-7 grid gap-5 sm:grid-cols-2">
          {[
            [
              "Name the decision",
              "Identify the system, workflow or claim, and the question the evidence should help answer.",
            ],
            [
              "Inspect existing evidence",
              "Read the relevant published records and methods. Identify missing evidence and any source or data-use permissions.",
            ],
            [
              "Agree the work",
              "Set the scope, responsible people, deliverables, acceptance criteria, timing and commercial terms.",
            ],
            [
              "Receive and review",
              "Check the delivered records and findings against the agreed scope, including unresolved questions and limits.",
            ],
          ].map(([title, text], index) => (
            <li key={title} className="rounded-lg border p-5">
              <h3 className="font-semibold">
                {index + 1}. {title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {text}
              </p>
            </li>
          ))}
        </ol>
        <p className="mt-6 leading-7 text-muted-foreground">
          Integration and delivery time depend on the agreed scope and
          environment. A published interface does not establish a migration time
          or a support commitment.
        </p>
      </section>

      <section
        className="bg-muted/40 px-5 py-14"
        aria-labelledby="common-questions"
      >
        <div className="mx-auto max-w-4xl">
          <h2 id="common-questions" className="text-3xl font-bold">
            Questions before you begin
          </h2>
          <div className="mt-7 space-y-6">
            <div>
              <h3 className="text-lg font-semibold">
                What is free, and what can be commissioned?
              </h3>
              <p className="mt-2 leading-7 text-muted-foreground">
                Public measurements, verification and learning material are open
                to inspect. Defined evidence work is agreed separately.
                Supported metered endpoints state their current terms in the
                endpoint response; check the named service before ordering.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold">
                Can this work with an existing stack?
              </h3>
              <p className="mt-2 leading-7 text-muted-foreground">
                Start with the{" "}
                <Link href="/connect" className="underline underline-offset-4">
                  documented HTTP, MCP and A2A routes
                </Link>
                . Assess the specific connector, data flow, permissions and
                operational responsibility before production use.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold">
                Are all Charter proposals operating services?
              </h3>
              <p className="mt-2 leading-7 text-muted-foreground">
                No. The 33-seat Council is a design, and the Prosperity Fund is
                a proposal. Neither establishes an operating review network,
                available fund payments, a job marketplace or staffed global
                incident monitoring. Published measurements and tools have their
                own evidence and status.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold">
                How is evidence reuse handled?
              </h3>
              <p className="mt-2 leading-7 text-muted-foreground">
                Check the licence for the exact component or dataset. For
                commissioned work, agree access, retention, export,
                confidentiality and publication terms before sharing material.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-5 py-14">
        <h2 className="text-3xl font-bold">Bring one evidence question</h2>
        <p className="mt-4 leading-7 text-muted-foreground">
          Start with a public example, or tell us what decision your
          organisation needs to make. The services page explains the existing
          enquiry routes and the scope to agree.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/quickstart">
            <Button variant="outline">Try the public workflow</Button>
          </Link>
          <Link href="/services">
            <Button>
              Explore services <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
