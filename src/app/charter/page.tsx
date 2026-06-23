import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "52-Article Charter — CSOAI",
  description:
    "The CSOAI 52-Article Charter is the global governance constitution for safe, fair, and accountable AI. Read the complete framework and adopt it for your organisation.",
  openGraph: {
    title: "52-Article Charter — CSOAI",
    description:
      "The global governance constitution for safe, fair, and accountable AI. 52 articles across risk, transparency, oversight, and Byzantine consensus.",
    images: ["/api/og?title=52-Article%20Charter&desc=Global%20AI%20governance%20constitution"],
  },
  alternates: { canonical: "/charter" },
};

const chapters = [
  {
    title: "I. Purpose & Scope",
    articles: [
      { n: 1, title: "Mission", text: "CSOAI exists to certify that AI is safe, fair, and aligned with human interests across all jurisdictions." },
      { n: 2, title: "Universal Application", text: "The Charter applies to any organisation that designs, deploys, or operates AI systems subject to CSOAI certification." },
      { n: 3, title: "Primacy of Human Rights", text: "All AI governance decisions shall prioritise fundamental human rights, dignity, and democratic values." },
      { n: 4, title: "Cross-Border Harmony", text: "Charter obligations are designed to map to EU AI Act, NIST AI RMF, ISO 42001, and comparable frameworks." },
      { n: 5, title: "Open Governance", text: "CSOAI governance records, audit logs, and charter amendments are published unless legally restricted." },
    ],
  },
  {
    title: "II. Governance & Council",
    articles: [
      { n: 6, title: "BFT Council", text: "A Byzantine-Fault-Tolerant Council of elected delegates ratifies standards, audits, and enforcement actions." },
      { n: 7, title: "Council Elections", text: "Council seats are elected by certified members through cryptographic, auditable voting." },
      { n: 8, title: "Term Limits", text: "Council members serve staggered terms to prevent capture and ensure institutional continuity." },
      { n: 9, title: "Conflict of Interest", text: "Members must disclose financial or operational conflicts and recuse themselves from related votes." },
      { n: 10, title: "Transparency of Proceedings", text: "Council agendas, votes, and minutes are published after a short confidentiality window." },
    ],
  },
  {
    title: "III. Risk Classification",
    articles: [
      { n: 11, title: "Risk-Based Approach", text: "AI systems are classified by potential harm to individuals, society, and critical infrastructure." },
      { n: 12, title: "Prohibited Practices", text: "Systems that manipulate, exploit vulnerability, or enable social scoring are prohibited." },
      { n: 13, title: "High-Risk Systems", text: "High-risk systems require conformity assessment, logging, and continuous monitoring." },
      { n: 14, title: "General-Purpose AI", text: "Foundation models are subject to transparency, evaluation, and systemic-risk obligations." },
      { n: 15, title: "Re-Classification", text: "Risk class may be upgraded based on incident reports, new evidence, or changed deployment context." },
    ],
  },
  {
    title: "IV. Transparency & Accountability",
    articles: [
      { n: 16, title: "Disclosure Requirements", text: "Certified systems must disclose capabilities, limitations, and intended use cases to users." },
      { n: 17, title: "Model Documentation", text: "Technical documentation, training data summaries, and evaluation reports are maintained and auditable." },
      { n: 18, title: "Public Registry", text: "CSOAI maintains a public registry of certified systems, their tier, and current status." },
      { n: 19, title: "Attribution of Decisions", text: "Every significant AI decision must be attributable to a responsible human or organisational actor." },
      { n: 20, title: "Incident Reporting", text: "Serious incidents, biases, or failures must be reported to CSOAI within 72 hours of discovery." },
    ],
  },
  {
    title: "V. Safety & Security",
    articles: [
      { n: 21, title: "Safety Testing", text: "Systems undergo pre-deployment and ongoing safety testing against defined adversarial scenarios." },
      { n: 22, title: "Robustness", text: "Models must demonstrate robustness to distribution shift, adversarial inputs, and edge cases." },
      { n: 23, title: "Cybersecurity", text: "AI infrastructure follows security-by-design principles, including access control and encrypted logs." },
      { n: 24, title: "Red Teaming", text: "High-risk systems are periodically red-teamed by independent operators certified by CSOAI." },
      { n: 25, title: "Vulnerability Response", text: "Discovered vulnerabilities are triaged, remediated, and disclosed according to responsible disclosure norms." },
    ],
  },
  {
    title: "VI. Data & Privacy",
    articles: [
      { n: 26, title: "Lawful Data Use", text: "Training and operational data must be collected, processed, and retained lawfully and fairly." },
      { n: 27, title: "Data Minimisation", text: "Only data necessary for the stated purpose shall be collected or retained." },
      { n: 28, title: "Rights of Data Subjects", text: "Individuals have rights to access, correction, deletion, and objection regarding their personal data." },
      { n: 29, title: "Synthetic & Anonymised Data", text: "Use of synthetic data does not remove accountability obligations for downstream harms." },
      { n: 30, title: "Cross-Border Transfers", text: "Data transfers across jurisdictions must comply with applicable data-protection laws." },
    ],
  },
  {
    title: "VII. Human Oversight",
    articles: [
      { n: 31, title: "Meaningful Human Control", text: "High-risk decisions remain subject to meaningful human review and override capability." },
      { n: 32, title: "Operator Competence", text: "Human overseers must be trained, empowered, and informed enough to challenge AI outputs." },
      { n: 33, title: "Decision Explainability", text: "AI-assisted decisions must be explainable to the affected person in plain language." },
      { n: 34, title: "Opt-Out & Appeal", text: "Individuals have the right to request human review of automated decisions that affect them." },
      { n: 35, title: "Human-in-the-Loop", text: "Critical operations must include real-time human oversight, not merely post-hoc review." },
    ],
  },
  {
    title: "VIII. Certification & Audit",
    articles: [
      { n: 36, title: "CASA Framework", text: "The CSOAI AI Safety Attestation (CASA) framework defines certification levels and criteria." },
      { n: 37, title: "Independent Audit", text: "Certification requires independent audit by CSOAI-accredited assessors." },
      { n: 38, title: "Evidence-Based Assessment", text: "Audits evaluate documentation, system behaviour, and organisational controls against the Charter." },
      { n: 39, title: "Certificate Lifecycle", text: "Certificates have defined validity periods and require renewal, surveillance, or re-assessment." },
      { n: 40, title: "Verification", text: "Every certificate is cryptographically signed and publicly verifiable without contacting CSOAI." },
    ],
  },
  {
    title: "IX. Enforcement & Remediation",
    articles: [
      { n: 41, title: "Non-Compliance Tiers", text: "Violations are classified by severity, intent, and actual or potential harm caused." },
      { n: 42, title: "Corrective Actions", text: "Certified organisations must implement corrective actions within deadlines set by the Council." },
      { n: 43, title: "Suspension & Revocation", text: "Serious or repeated breaches may result in certificate suspension or revocation." },
      { n: 44, title: "Appeals", text: "Affected parties may appeal Council decisions through a transparent, time-bound process." },
      { n: 45, title: "Restitution", text: "Organisations are responsible for remedying harms caused by non-compliant AI systems." },
    ],
  },
  {
    title: "X. Byzantine Consensus",
    articles: [
      { n: 46, title: "Decentralised Trust", text: "Critical governance decisions are ratified by Byzantine consensus to resist single points of failure." },
      { n: 47, title: "Quorum Requirements", text: "A supermajority of honest Council nodes is required to approve standards and enforcement actions." },
      { n: 48, title: "Cryptographic Signing", text: "Council votes and audit anchors are signed with Ed25519 keys bound to member identities." },
      { n: 49, title: "Tamper-Evident Ledger", text: "Governance actions are recorded in a tamper-evident ledger for public verification." },
      { n: 50, title: "Resilience to Capture", text: "No single member, organisation, or jurisdiction can unilaterally alter Charter obligations." },
    ],
  },
  {
    title: "XI. Amendments & Interpretation",
    articles: [
      { n: 51, title: "Amendment Process", text: "Charter amendments require Council consensus, public comment, and a reasonable transition period." },
      { n: 52, title: "Interpretive Authority", text: "The BFT Council has final interpretive authority, subject to appeal and transparency requirements." },
    ],
  },
];

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "CSOAI 52-Article Charter",
  description:
    "The global governance constitution for safe, fair, and accountable AI systems.",
  url: "https://csoai.org/charter",
  author: {
    "@type": "Organization",
    name: "CSOAI",
  },
  publisher: {
    "@type": "Organization",
    name: "CSOAI",
  },
};

export default function CharterPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <div className="min-h-screen bg-slate-950 text-white">
        <section className="mx-auto max-w-5xl px-4 pb-16 pt-32 text-center">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-400">
            Governance Framework
          </span>
          <h1 className="mb-6 text-4xl font-black tracking-tighter sm:text-6xl">
            <span className="gradient-text">52-Article Charter</span>
          </h1>
          <p className="mx-auto mb-10 max-w-3xl text-lg leading-relaxed text-slate-300">
            The global constitution for AI safety. The CSOAI Charter defines the rights, obligations,
            and governance mechanisms that keep artificial intelligence accountable to humanity.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/certification"
              className="inline-flex rounded-lg bg-emerald-500 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
            >
              Get Certified
            </Link>
            <Link
              href="/framework-crosswalk"
              className="inline-flex rounded-lg border-2 border-emerald-500 px-6 py-3 text-sm font-bold text-emerald-400 transition hover:bg-emerald-500 hover:text-slate-950"
            >
              Framework Crosswalk
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 pb-20">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 sm:p-12">
            <h2 className="mb-4 text-2xl font-black text-white">Preamble</h2>
            <p className="leading-relaxed text-slate-300">
              We, the members of CSOAI, establish this Charter to govern the design, deployment, and
              oversight of artificial intelligence. We believe that powerful technology demands
              durable institutions. These 52 articles bind our community to transparency, safety,
              human oversight, and decentralised trust through Byzantine consensus.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 pb-20">
          <div className="space-y-16">
            {chapters.map((chapter) => (
              <div key={chapter.title}>
                <h2 className="mb-6 text-2xl font-black tracking-tight text-emerald-400">
                  {chapter.title}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {chapter.articles.map((article) => (
                    <div
                      key={article.n}
                      className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-emerald-500/30 hover:bg-white/[0.05]"
                    >
                      <div className="mb-2 text-[10px] font-black uppercase tracking-widest text-emerald-500">
                        Article {article.n}
                      </div>
                      <h3 className="mb-2 text-lg font-bold text-white">{article.title}</h3>
                      <p className="text-sm leading-relaxed text-slate-400">{article.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-emerald-500/[0.03] py-20">
          <div className="mx-auto max-w-5xl px-4 text-center">
            <h2 className="mb-4 text-3xl font-black tracking-tight">
              <span className="gradient-accent">Adopt the Charter</span>
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-slate-300">
              Align your organisation with the 52-Article Charter through CASA certification,
              advisory services, or enterprise governance implementation.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/certification"
                className="inline-flex rounded-lg bg-emerald-500 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
              >
                Start Certification
              </Link>
              <Link
                href="/advisory"
                className="inline-flex rounded-lg border-2 border-emerald-500 px-6 py-3 text-sm font-bold text-emerald-400 transition hover:bg-emerald-500 hover:text-slate-950"
              >
                Advisory Services
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
