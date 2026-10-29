/**
 * The Covenant is historical philosophy. Runtime obligations belong to the
 * versioned Operational Constitutional Harness Charter; neither proves safety.
 */
import { Heart, Shield, FileText, ArrowRight } from "lucide-react";

const operationalArticles = [
  { number: 1, title: "Measurement is not authority", summary: "A score, signature, listing or payment does not grant permission to act." },
  { number: 3, title: "Identity and tenancy are bound", summary: "A governed request identifies the subject, tenant, harness, resource, action and context." },
  { number: 4, title: "Authority is time-bounded state", summary: "Expired, revoked, not-yet-valid or malformed authority cannot authorize an effect." },
  { number: 8, title: "Runtime isolation is least privilege", summary: "Execution must stay within its authorized filesystem, network, credential and resource limits." },
  { number: 19, title: "No self-approval loop", summary: "Proposal, policy, execution, verification, signing, publication and acceptance remain distinct roles." },
  { number: 20, title: "Consequential changes require owner-visible review", summary: "Changes to production authority require an explicit authorized review and an auditable transition." },
];

const questions = [
  {
    question: "Does the Covenant mean that an AI cares about us?",
    answer: "Care is a design aspiration and a metaphor. We assess observable behaviour, failures and evidence. We do not infer emotions, consciousness or reliable protection from a model's language.",
  },
  {
    question: "How does this become a practical safeguard?",
    answer: "An operator needs authenticated identity, scoped permissions, bounded execution, human review where required, independent effect checks and retained evidence. Each control needs a test on the actual deployment. The charter describes these obligations; it does not establish that every product implements them.",
  },
  {
    question: "Can a person stop the AI?",
    answer: "A deployment needs a stop control outside the model: revoke authority, block new actions and request cancellation from its executors. Already completed actions may require separately authorized recovery. A browser Cancel button alone does not establish backend shutdown, and there is no universal switch for every AI system.",
  },
  {
    question: "What does the 33-seat council mean?",
    answer: "It is a proposed review architecture. Multiple roles do not prove independent judgement, and agreement between correlated models is not a safety guarantee. GSPC measurement axes and council seats describe different things.",
  },
  {
    question: "What happened to the Partnership Charter?",
    answer: "The 52-article Partnership Charter remains a historical reference. Its article numbers differ from the current 22-article operational charter. The amendment log records that relationship. Historical proposals about prosperity, governance and consciousness are not claims of deployed services or legal powers.",
  },
];

export default function MaternalCovenant() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <section className="bg-gradient-to-br from-emerald-950 via-teal-900 to-emerald-900 text-white">
        <div className="container max-w-5xl py-16 sm:py-24">
          <p className="mb-5 text-sm font-semibold uppercase tracking-widest text-emerald-200">
            Historical philosophy · current operating boundaries
          </p>
          <Heart className="mb-5 h-10 w-10 text-emerald-200" aria-hidden="true" />
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">The Maternal Covenant</h1>
          <p className="mt-6 max-w-3xl text-xl leading-relaxed text-emerald-50">
            AI should help people and respect their agency. The Covenant expresses
            that ambition through the language of care and partnership.
          </p>
          <p className="mt-5 max-w-3xl leading-relaxed text-emerald-100">
            An aspiration needs observable safeguards. Our current operational charter
            defines limits on authority, execution, verification and correction.
            It does not claim that an AI is safe or that care can be guaranteed.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href="/constitutional-harness/" className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 font-semibold text-emerald-950">
              Read the operational charter <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
            <a href="/.well-known/charter-amendments.json" className="inline-flex items-center justify-center rounded-lg border border-emerald-300 px-5 py-3 font-semibold">
              Inspect the version history
            </a>
          </div>
        </div>
      </section>

      <section className="container max-w-5xl py-12 sm:py-16" aria-labelledby="covenant-practice">
        <h2 id="covenant-practice" className="text-3xl font-bold">Care, expressed as responsibilities</h2>
        <div className="mt-7 grid gap-5 md:grid-cols-3">
          {[
            ["Human agency", "Show what is proposed, who may authorize it and what has actually happened. Preserve a route to decline, challenge and correct."],
            ["Bounded action", "Give agents the permissions needed for the task. Test restrictions at the point of action and after a paused task resumes."],
            ["Honest evidence", "Retain failures, disagreement and missing observations. A signature establishes origin and integrity, not the truth of every claim."],
          ].map(([title, text]) => (
            <article key={title} className="rounded-xl border border-slate-200 p-6">
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="mt-3 leading-relaxed text-slate-600">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-slate-50 py-12 sm:py-16" aria-labelledby="operational-articles">
        <div className="container max-w-5xl">
          <Shield className="mb-4 h-8 w-8 text-emerald-700" aria-hidden="true" />
          <h2 id="operational-articles" className="text-3xl font-bold">The current operational articles</h2>
          <p className="mt-4 max-w-3xl leading-relaxed text-slate-600">
            These references use version 0.1.0 of the 22-article Operational Constitutional
            Harness Charter. They are a reader's guide to its requirements, not a claim
            that all controls are deployed. The earlier Partnership Charter has its own numbering.
          </p>
          <div className="mt-7 grid gap-5 md:grid-cols-2">
            {operationalArticles.map((article) => (
              <article key={article.number} className="rounded-xl border border-slate-200 bg-white p-6">
                <p className="text-sm font-semibold text-emerald-700">Article {article.number}</p>
                <h3 className="mt-2 text-lg font-semibold">{article.title}</h3>
                <p className="mt-3 leading-relaxed text-slate-600">{article.summary}</p>
              </article>
            ))}
          </div>
          <a href="/constitutional-harness/" className="mt-7 inline-flex items-center gap-2 font-semibold text-emerald-800 underline">
            Read all 22 articles <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </section>

      <section className="container max-w-5xl py-12 sm:py-16" aria-labelledby="covenant-questions">
        <h2 id="covenant-questions" className="text-3xl font-bold">Questions and limits</h2>
        <div className="mt-7 space-y-4">
          {questions.map(({ question, answer }) => (
            <details key={question} className="rounded-xl border border-slate-200 p-5">
              <summary className="cursor-pointer text-lg font-semibold">{question}</summary>
              <p className="mt-4 max-w-3xl leading-relaxed text-slate-600">{answer}</p>
            </details>
          ))}
        </div>
        <aside className="mt-10 rounded-xl border border-emerald-200 bg-emerald-50 p-6">
          <FileText className="mb-3 h-6 w-6 text-emerald-700" aria-hidden="true" />
          <h3 className="text-lg font-semibold">Read the historical source in context</h3>
          <p className="mt-3 leading-relaxed text-slate-600">
            The original Partnership Charter page remains in the repository history.
            It is historical material and applies only where it does not conflict with
            the operational charter.
          </p>
          <a href="https://github.com/CSOAI-ORG/councilof-ai/blob/aa1937c698fb4f527c26980b73bc865deb957792/client/src/pages/Charter.tsx" className="mt-4 inline-block font-semibold text-emerald-800 underline">
            Inspect the historical Partnership Charter source
          </a>
        </aside>
        <p className="mt-8 text-sm leading-relaxed text-slate-500">
          Measurement is not certification. Charter adoption does not grant legal,
          regulatory, spending, execution or signing authority.
        </p>
      </section>
    </div>
  );
}

