import { Link } from "wouter";
import { ShieldCheck, FileSearch, GitCompare, Radar, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import seoHead from "../data/seo-head.json";

/**
 * /engagements — scoped, receipted evidence work.
 *
 * Static copy, light theme to match the site. No counts: nothing here is typed and nothing goes stale.
 * The four offerings name machinery that already ships. Prices are quoted privately and never published.
 */

const PAGE_DESCRIPTION = seoHead.routes["/engagements"].description;

const OFFERINGS = [
  {
    icon: FileSearch,
    tint: "from-blue-50 to-blue-100 border-blue-200",
    iconTint: "text-blue-600",
    name: "Artifact qualification",
    blurb: "You have an evaluation log, model card, benchmark result or dataset. We qualify it.",
    points: [
      "Recount what it claims from its own bytes — declared versus observed, side by side",
      "State the mapping and versions used, and run a negative control that must discriminate",
      "Return dated evidence records in our published schema, preserving every limitation",
      "Missing or malformed evidence stays marked as such. It never becomes a pass",
    ],
  },
  {
    icon: ShieldCheck,
    tint: "from-emerald-50 to-emerald-100 border-emerald-200",
    iconTint: "text-emerald-600",
    name: "Claim maintenance",
    blurb: "You cite numbers — ours or others'. We keep the citations honest over time.",
    points: [
      "Re-read the sources on a schedule, diffing extracted text rather than raw bytes",
      "Adjudicate each difference and publish corrections where a claim changed",
      "Deliver a register of what changed and which of your cited conclusions are affected",
    ],
  },
  {
    icon: GitCompare,
    tint: "from-amber-50 to-amber-100 border-amber-200",
    iconTint: "text-amber-600",
    name: "Dependency change evidence",
    blurb: "You operate a set of approved MCP servers or AI dependencies.",
    points: [
      "Watch the published records for version, endpoint, package digest and configuration changes",
      "Deliver a dated change record stating which of your earlier checks may no longer apply",
      "Coverage is stated with every record; absence of a record is never treated as evidence of absence",
    ],
  },
  {
    icon: Radar,
    tint: "from-rose-50 to-rose-100 border-rose-200",
    iconTint: "text-rose-600",
    name: "Connection audit",
    blurb: "We probe every endpoint you advertise — registries, catalogues, documentation.",
    points: [
      "Report which endpoints answer and which do not, with HTTP status and time",
      "Classify each as connected, wrong-path, dead-host or no-remote",
      "A listing that answers nothing costs more trust than absence; this finds those",
    ],
  },
];

const NOTS: Array<[string, string]> = [
  ["Not certification", "We measure; we do not certify, rank, or endorse. No engagement outcome is a grade, a mark or a badge."],
  ["Not a security audit", "A change record says re-check. It never says compromised. A connection audit names dead endpoints; it does not assess the software behind them."],
  ["Not safety assurance", "A recount of an evaluation log does not establish that the model ran as claimed, that a benchmark was uncontaminated, or that a system is safe."],
  ["Not silent", "Every method is stated, every limitation preserved, and every correction published in our public ledger."],
];

const FAQ: Array<[string, string]> = [
  ["Is this a security audit?", "No. A change record tells you that something changed and which earlier checks may not carry over. It does not tell you whether the new version is safe."],
  ["Do you certify AI systems?", "No. We measure and publish dated evidence with stated limits. Nothing we produce is a grade, a rank or a badge."],
  ["What does it cost?", "Quotes are private, dated and reference-specific, scoped before work starts. We do not publish prices."],
  ["What happens to our data?", "The engagement scope names it. We retain the artefacts needed to keep your evidence re-openable, under the data class declared in the scope, and nothing beyond it."],
  ["Who has used this?", "See the traction page for dated, qualified records of outside use — and their limits. Nobody there is a customer; we say so on the same page."],
  ["Can we self-serve first?", "Yes. The board, the verifier and the corrections ledger are free forever. Start with claim maintenance and the public root; an engagement is for when you want the same treatment applied to your own artefacts."],
];

export default function Engagements() {
  return (
    <div className="bg-white">
      <main className="max-w-6xl mx-auto px-5 py-16">
        <div className="text-center mb-14">
          <Badge className="mb-4 bg-emerald-50 text-emerald-700 border-emerald-200">Engagements</Badge>
          <h1 className="text-4xl font-bold mb-5 text-gray-900">
            Evidence work, scoped and receipted
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
            Council of AI helps you inspect what an AI measurement establishes, trace it to its source, and
            carry that evidence into your own work. An engagement is one bounded piece of that work, delivered
            with a receipt you can re-open later.
          </p>
        </div>

        <section aria-labelledby="offerings" className="mb-16">
          <h2 id="offerings" className="text-3xl font-bold mb-8 text-center text-gray-900">What we offer</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {OFFERINGS.map((o) => (
              <Card key={o.name} className={`p-8 bg-gradient-to-br ${o.tint}`}>
                <div className="flex items-center gap-3 mb-4">
                  <o.icon className={`h-6 w-6 ${o.iconTint}`} />
                  <h3 className="text-xl font-bold text-gray-900">{o.name}</h3>
                </div>
                <p className="text-sm leading-6 text-gray-700 mb-4">{o.blurb}</p>
                <ul className="space-y-2 text-sm leading-6 text-gray-600">
                  {o.points.map((p) => (
                    <li key={p} className="flex gap-2">
                      <span aria-hidden className="font-bold">·</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </section>

        <section aria-labelledby="not" className="mb-16">
          <h2 id="not" className="text-3xl font-bold mb-6 text-center text-gray-900">What this is not</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {NOTS.map(([t, d]) => (
              <Card key={t} className="p-6">
                <h3 className="font-bold text-gray-900 mb-2">{t}</h3>
                <p className="text-sm leading-6 text-gray-600">{d}</p>
              </Card>
            ))}
          </div>
        </section>

        <section aria-labelledby="start" className="mb-16 rounded-2xl p-8 bg-gradient-to-br from-emerald-50 to-white border border-emerald-200 text-center">
          <h2 id="start" className="text-2xl font-bold text-gray-900 mb-3">How it starts</h2>
          <p className="text-gray-600 leading-relaxed max-w-2xl mx-auto mb-5">
            Write to us with the artefact or claim set and the decision it feeds. We reply with a scoped, dated,
            reference-specific quote. Prices are quoted privately and are never published.
          </p>
          <a
            href="mailto:contact@csoai.org"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors"
          >
            <Mail className="h-5 w-5" />
            contact@csoai.org
          </a>
        </section>

        <section aria-labelledby="faq" className="mb-12">
          <h2 id="faq" className="text-3xl font-bold mb-6 text-center text-gray-900">FAQ</h2>
          <div className="max-w-3xl mx-auto space-y-4">
            {FAQ.map(([q, a]) => (
              <Card key={q} className="p-6">
                <h3 className="font-bold text-gray-900 mb-2">{q}</h3>
                <p className="text-sm leading-6 text-gray-600">{a}</p>
              </Card>
            ))}
          </div>
        </section>

        <p className="text-center text-sm text-gray-500">
          Dated records of outside use — and what they do not establish — live on{" "}
          <Link className="text-emerald-600 underline" href="/traction">the traction page</Link>. The board, the
          verifier and the corrections ledger are{" "}
          <Link className="text-emerald-600 underline" href="/claim-maintenance">free forever</Link>.
        </p>
      </main>
    </div>
  );
}
