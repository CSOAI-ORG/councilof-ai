import type { Metadata } from "next";
import Link from "next/link";
import CountdownBadge from "./EuAiActClient";

export const metadata: Metadata = {
  title: "EU AI Act Compliance Guide 2026 — Every Article, Every Deadline, Every Signed Attestation",
  description:
    "Complete EU AI Act compliance playbook for 2 August 2026 enforcement. Article-by-article breakdown, Annex IV technical documentation fields, conformity assessment paths, penalty thresholds. Pre-certification evidence via signed attestations. Built by a solo founder with 225+ compliance MCPs.",
  openGraph: {
    title: "The EU AI Act Compliance Guide Every CAIO Needs for 2 August 2026",
    description:
      "Article-by-article: Article 5 prohibitions, Article 9 risk management, Article 10 bias testing, Article 11 documentation, Article 14 oversight, Article 43 conformity, Article 73 incident reporting. £199/mo continuous · £5k 48h audit.",
    url: "https://csoai.org/eu-ai-act",
    type: "article",
  },
  alternates: { canonical: "/eu-ai-act" },
};

const techArticleSchema = {
  "@context": "https://schema.org",
  "@type": "TechArticle",
  headline: "EU AI Act Compliance Guide 2026 — Article-by-Article Breakdown + Signed Evidence",
  description:
    "Complete technical breakdown of EU AI Act (Regulation (EU) 2024/1689) obligations, deadlines, penalties, and preparation timeline with cryptographically signed attestation pathway.",
  datePublished: "2026-04-23",
  dateModified: "2026-04-23",
  author: { "@type": "Organization", name: "MEOK AI Labs", url: "https://meok.ai" },
  publisher: {
    "@type": "Organization",
    name: "CSOAI",
    logo: { "@type": "ImageObject", url: "https://csoai.org/logo.png" },
  },
  mainEntityOfPage: "https://csoai.org/eu-ai-act",
  about: [
    { "@type": "Thing", name: "EU AI Act" },
    { "@type": "Thing", name: "Regulation (EU) 2024/1689" },
    { "@type": "Thing", name: "High-risk AI systems" },
  ],
};

const PrimaryButton = ({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) => (
  <a
    href={href}
    className="inline-flex rounded-lg bg-emerald-500 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
  >
    {children}
  </a>
);

const SecondaryButton = ({
  href,
  children,
  target,
}: {
  href: string;
  children: React.ReactNode;
  target?: string;
}) => (
  <a
    href={href}
    target={target}
    className="inline-flex rounded-lg border border-white/10 bg-white/[0.03] px-6 py-3 text-sm font-bold text-white transition hover:border-emerald-500/30 hover:bg-white/[0.05]"
  >
    {children}
  </a>
);

const CtaBox = ({
  title,
  children,
  buttons,
}: {
  title: string;
  children: React.ReactNode;
  buttons: React.ReactNode;
}) => (
  <div className="my-8 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.05] p-6 text-center sm:p-8">
    <strong className="mb-2 block text-lg font-bold text-white">{title}</strong>
    <p className="mb-6 text-slate-300">{children}</p>
    <div className="flex flex-col flex-wrap items-center justify-center gap-3 sm:flex-row">
      {buttons}
    </div>
  </div>
);

const SectionCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <section className={`mb-12 ${className}`}>{children}</section>
);

export default function EuAiActPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(techArticleSchema) }}
      />
      <article className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-20">
        <CountdownBadge />

        <h1 className="mb-6 text-3xl font-black tracking-tighter sm:text-5xl lg:text-6xl">
          The EU AI Act — Article-by-Article, Deadline-by-Deadline, in Plain English
        </h1>
        <p className="mb-8 text-sm text-slate-400 sm:text-base">
          Published <strong className="text-white">23 April 2026</strong> · Updated weekly · ~12 minute read · For
          Chief AI Officers, CISOs, compliance leads, product owners of AI systems sold into the EU.
        </p>

        <div className="mb-10 rounded-2xl border-l-4 border-emerald-500 bg-white/[0.03] p-6 sm:p-8">
          <h2 className="mb-3 text-xs font-black uppercase tracking-widest text-emerald-400">TL;DR</h2>
          <p className="leading-relaxed text-slate-300">
            The EU AI Act (Regulation (EU) 2024/1689) starts enforcing high-risk AI system rules on{" "}
            <strong className="text-white">2 August 2026</strong>. Penalties are{" "}
            <strong className="text-white">up to €35 million or 7% of global annual turnover</strong> for prohibited
            practices and <strong className="text-white">€15M or 3%</strong> for high-risk violations. Most teams we
            talk to cover 3-4 of the 14 mandatory Annex IV documentation fields. The Notified Body supply is{" "}
            <strong className="text-white">capped at 50-60 qualified ISO 42001 consultants globally</strong> — queues
            will stretch 6-9 months by Q2 2026. Pre-certification evidence is the fastest path to a clean conformity
            assessment.
          </p>
        </div>

        <nav className="mb-12 rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          <h2 className="mb-4 text-xs font-black uppercase tracking-widest text-slate-400">On this page</h2>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-300 marker:text-emerald-500">
            <li>
              <a href="#what-is" className="transition hover:text-emerald-400">
                What the EU AI Act actually is (and isn&apos;t)
              </a>
            </li>
            <li>
              <a href="#who" className="transition hover:text-emerald-400">
                Who it applies to
              </a>
            </li>
            <li>
              <a href="#risk-tiers" className="transition hover:text-emerald-400">
                The four risk tiers
              </a>
            </li>
            <li>
              <a href="#timeline" className="transition hover:text-emerald-400">
                Enforcement timeline (key dates)
              </a>
            </li>
            <li>
              <a href="#penalties" className="transition hover:text-emerald-400">
                Penalty structure
              </a>
            </li>
            <li>
              <a href="#articles" className="transition hover:text-emerald-400">
                The articles that matter most
              </a>
              <ul className="mt-2 list-disc space-y-1 pl-5 marker:text-slate-500">
                <li>
                  <a href="#art-5" className="transition hover:text-emerald-400">
                    Article 5 — prohibited practices
                  </a>
                </li>
                <li>
                  <a href="#art-9" className="transition hover:text-emerald-400">
                    Article 9 — risk management
                  </a>
                </li>
                <li>
                  <a href="#art-10" className="transition hover:text-emerald-400">
                    Article 10 — data governance
                  </a>
                </li>
                <li>
                  <a href="#art-11" className="transition hover:text-emerald-400">
                    Article 11 — technical documentation
                  </a>
                </li>
                <li>
                  <a href="#art-14" className="transition hover:text-emerald-400">
                    Article 14 — human oversight
                  </a>
                </li>
                <li>
                  <a href="#art-43" className="transition hover:text-emerald-400">
                    Article 43 — conformity assessment
                  </a>
                </li>
                <li>
                  <a href="#art-73" className="transition hover:text-emerald-400">
                    Article 73 — serious incident reporting
                  </a>
                </li>
              </ul>
            </li>
            <li>
              <a href="#gpai" className="transition hover:text-emerald-400">
                General-purpose AI (GPAI) models
              </a>
            </li>
            <li>
              <a href="#preparation" className="transition hover:text-emerald-400">
                A realistic 90-day preparation plan
              </a>
            </li>
            <li>
              <a href="#evidence" className="transition hover:text-emerald-400">
                Pre-certification evidence your Notified Body accepts
              </a>
            </li>
            <li>
              <a href="#faq" className="transition hover:text-emerald-400">
                Common questions
              </a>
            </li>
          </ol>
        </nav>

        <SectionCard>
          <h2 id="what-is" className="mb-4 text-2xl font-bold tracking-tight sm:text-3xl">
            1. What the EU AI Act actually is (and isn&apos;t)
          </h2>
          <div className="space-y-4 leading-relaxed text-slate-300">
            <p>
              The EU AI Act is Regulation (EU) 2024/1689 — a horizontal statute that applies to anyone who places an AI
              system on the EU market OR whose system&apos;s output is used in the EU, regardless of where the provider
              is located. Think of it as GDPR for AI: extraterritorial, risk-tiered, penalty-heavy.
            </p>
            <p>
              It is <strong className="text-white">not</strong> a certification framework in the ISO-42001 sense. ISO
              42001 is about your AI management system; the AI Act is about specific AI systems you place on the market.
              You can have a perfect AIMS and still breach the AI Act on a single Annex III system. And vice versa.
            </p>
            <p>
              It is <strong className="text-white">not</strong> a ban on AI. Most AI systems are &quot;limited risk&quot;
              or &quot;minimal risk&quot; — only transparency obligations apply. The hard compliance lift is
              concentrated in Article 5 prohibitions (8 specific practices) and Annex III high-risk systems (8 categories
              covering ~15% of enterprise AI deployments).
            </p>
          </div>
        </SectionCard>

        <SectionCard>
          <h2 id="who" className="mb-4 text-2xl font-bold tracking-tight sm:text-3xl">
            2. Who it applies to
          </h2>
          <p className="mb-4 leading-relaxed text-slate-300">Roles under the AI Act:</p>
          <ul className="mb-6 list-disc space-y-2 pl-5 leading-relaxed text-slate-300 marker:text-emerald-500">
            <li>
              <strong className="text-white">Provider</strong> — anyone who develops an AI system or has one developed
              and places it on the EU market under its own name/trademark. Bears the primary obligations.
            </li>
            <li>
              <strong className="text-white">Deployer</strong> — anyone who uses an AI system under its own authority
              (except personal non-professional use). Fewer obligations, but Article 26 still applies.
            </li>
            <li>
              <strong className="text-white">Importer</strong> / <strong className="text-white">distributor</strong> —
              parties in the supply chain with specific verification duties.
            </li>
            <li>
              <strong className="text-white">Authorised representative</strong> — EU-based party representing non-EU
              providers.
            </li>
          </ul>
          <p className="leading-relaxed text-slate-300">
            Extraterritoriality: if you&apos;re a US SaaS company whose AI output is used by an EU customer, you are in
            scope as a provider. There is no &quot;US-only&quot; carve-out.
          </p>
        </SectionCard>

        <SectionCard>
          <h2 id="risk-tiers" className="mb-4 text-2xl font-bold tracking-tight sm:text-3xl">
            3. The four risk tiers
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left">
                  <th className="bg-white/[0.03] px-4 py-3 font-bold text-white">Tier</th>
                  <th className="bg-white/[0.03] px-4 py-3 font-bold text-white">Examples</th>
                  <th className="bg-white/[0.03] px-4 py-3 font-bold text-white">Obligations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-slate-300">
                <tr>
                  <td className="px-4 py-3 align-top font-semibold text-white">
                    Unacceptable (prohibited, Article 5)
                  </td>
                  <td className="px-4 py-3 align-top">
                    Social scoring by public authorities; subliminal manipulation; exploitation of vulnerabilities;
                    untargeted facial-image scraping; emotion recognition in workplace/education; biometric
                    categorisation for protected characteristics; real-time remote biometric ID in public (with narrow
                    exceptions).
                  </td>
                  <td className="px-4 py-3 align-top font-semibold text-white">
                    Banned. €35M / 7% penalty cap.
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 align-top font-semibold text-white">
                    High-risk (Annex III + Annex I safety components)
                  </td>
                  <td className="px-4 py-3 align-top">
                    Biometric ID (remote); critical infrastructure; education access + evaluation; employment decisions;
                    access to essential services (credit scoring, insurance); law enforcement profiling; migration +
                    border; administration of justice. Plus Annex I: AI components in regulated products (medical
                    devices, vehicles, toys, machinery, etc.).
                  </td>
                  <td className="px-4 py-3 align-top">
                    Full lifecycle obligations: Art 9 risk mgmt, Art 10 data governance, Art 11 technical docs, Art 14
                    human oversight, Art 43 conformity, registration, CE marking, incident reporting.{" "}
                    <span className="font-semibold text-white">€15M / 3% penalty cap.</span>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 align-top font-semibold text-white">Limited risk (transparency)</td>
                  <td className="px-4 py-3 align-top">Chatbots; emotion recognition (non-prohibited contexts); deepfakes.</td>
                  <td className="px-4 py-3 align-top">
                    Disclosure that content is AI-generated or user is interacting with AI.{" "}
                    <span className="font-semibold text-white">€7.5M / 1.5% penalty cap.</span>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 align-top font-semibold text-white">Minimal risk (no obligations)</td>
                  <td className="px-4 py-3 align-top">Most current AI (spam filters, recommender systems, routine classifiers).</td>
                  <td className="px-4 py-3 align-top">None. Voluntary codes of conduct encouraged.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard>
          <h2 id="timeline" className="mb-4 text-2xl font-bold tracking-tight sm:text-3xl">
            4. Enforcement timeline
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left">
                  <th className="bg-white/[0.03] px-4 py-3 font-bold text-white">Date</th>
                  <th className="bg-white/[0.03] px-4 py-3 font-bold text-white">What kicks in</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-slate-300">
                <tr>
                  <td className="px-4 py-3 align-top font-semibold text-white">2 February 2025</td>
                  <td className="px-4 py-3 align-top">
                    Article 5 prohibitions in force. AI literacy obligation (Art 4) for staff.
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 align-top font-semibold text-white">2 August 2025</td>
                  <td className="px-4 py-3 align-top">
                    GPAI model obligations (Art 51-55). Member states must designate national competent authorities. AI
                    Office operational.
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 align-top font-semibold text-white">2 August 2026</td>
                  <td className="px-4 py-3 align-top">
                    🎯 <strong className="text-white">High-risk system obligations (Annex III) fully in force.</strong>{" "}
                    Conformity assessment, CE marking, registration, incident reporting.
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 align-top font-semibold text-white">2 August 2027</td>
                  <td className="px-4 py-3 align-top">
                    High-risk obligations apply to Annex I products (medical devices, machinery, vehicles, etc.) that
                    were placed on the market before 2 Aug 2026.
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 align-top font-semibold text-white">2 August 2030</td>
                  <td className="px-4 py-3 align-top">
                    Public-authority deployers of high-risk systems placed before 2 Aug 2026 must fully comply.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <CtaBox
            title="103 days isn't a lot."
            buttons={
              <>
                <PrimaryButton href="https://buy.stripe.com/4gM7sN2G0bIKeQJfL28k833">
                  Book £5k 48h gap analysis
                </PrimaryButton>
                <SecondaryButton href="https://buy.stripe.com/14A4gB3K4eUWgYR56o8k836">
                  Or start £199/mo Pro
                </SecondaryButton>
              </>
            }
          >
            If your system is Annex III (high-risk), you need Articles 9, 10, 11, 14, 43 evidence before 2 August 2026.
          </CtaBox>
        </SectionCard>

        <SectionCard>
          <h2 id="penalties" className="mb-4 text-2xl font-bold tracking-tight sm:text-3xl">
            5. Penalty structure
          </h2>
          <ul className="list-disc space-y-2 pl-5 leading-relaxed text-slate-300 marker:text-emerald-500">
            <li>
              <strong className="text-white">€35M or 7% of global annual turnover</strong> — prohibited-practice
              violations (Art 5).
            </li>
            <li>
              <strong className="text-white">€15M or 3% of turnover</strong> — high-risk violations of most operative
              provisions.
            </li>
            <li>
              <strong className="text-white">€7.5M or 1.5% of turnover</strong> — supplying incorrect/incomplete
              information.
            </li>
            <li>Administrative fines scale for SMEs (lower of the two applies).</li>
            <li>
              <strong className="text-white">Criminal liability</strong> is not introduced by the Act itself, but
              member states can add it during transposition.
            </li>
            <li>Each EU national competent authority enforces nationally — forum shopping is real.</li>
          </ul>
        </SectionCard>

        <SectionCard>
          <h2 id="articles" className="mb-4 text-2xl font-bold tracking-tight sm:text-3xl">
            6. The articles that matter most
          </h2>

          <h3 id="art-5" className="mb-3 mt-8 text-xl font-bold text-white">
            Article 5 — Prohibited practices
          </h3>
          <p className="mb-4 leading-relaxed text-slate-300">Eight categories. The most commercially relevant are:</p>
          <ul className="mb-6 list-disc space-y-2 pl-5 leading-relaxed text-slate-300 marker:text-emerald-500">
            <li>
              <strong className="text-white">Art 5(1)(a)</strong> subliminal techniques beyond a person&apos;s
              consciousness that materially distort behaviour causing harm — rules out aggressive personalisation
              patterns in advertising AI.
            </li>
            <li>
              <strong className="text-white">Art 5(1)(b)</strong> exploitation of vulnerabilities due to age,
              disability, or social/economic situation — affects edtech, fintech, gambling-adjacent AI.
            </li>
            <li>
              <strong className="text-white">Art 5(1)(c)</strong> social scoring by public authorities with detrimental
              or unfavourable treatment in unrelated contexts.
            </li>
            <li>
              <strong className="text-white">Art 5(1)(f)</strong> emotion inference in workplace and education (except
              medical/safety reasons).
            </li>
            <li>
              <strong className="text-white">Art 5(1)(g)</strong> biometric categorisation inferring race, political
              opinions, religion, sexual orientation, etc.
            </li>
          </ul>

          <h3 id="art-9" className="mb-3 mt-8 text-xl font-bold text-white">
            Article 9 — Risk management system
          </h3>
          <p className="mb-6 leading-relaxed text-slate-300">
            You must establish, implement, document, and maintain a continuous risk management system across the AI
            system&apos;s lifecycle. Minimum components: identification, estimation, evaluation, risk-management
            measures, testing, post-market monitoring feedback.
          </p>

          <h3 id="art-10" className="mb-3 mt-8 text-xl font-bold text-white">
            Article 10 — Data and data governance
          </h3>
          <p className="mb-6 leading-relaxed text-slate-300">
            Training, validation, and test datasets must be relevant, representative, free of errors, complete. Bias
            examination for protected characteristics is mandatory. Data governance practices must be documented — where
            data came from, how it was annotated, how it was cleaned, whether it was augmented, and what biases might
            remain.
          </p>

          <h3 id="art-11" className="mb-3 mt-8 text-xl font-bold text-white">
            Article 11 — Technical documentation
          </h3>
          <p className="mb-4 leading-relaxed text-slate-300">
            This is the single most commonly under-delivered requirement. Annex IV specifies 14 fields you must document
            before CE marking:
          </p>
          <ol className="mb-6 list-decimal space-y-2 pl-5 leading-relaxed text-slate-300 marker:text-emerald-500">
            <li>
              General description: intended purpose, developer, version, interaction with hardware/software outside
              scope, software versions.
            </li>
            <li>Detailed design: methods, training data, relationship between inputs/outputs, pre-determined changes.</li>
            <li>Information on monitoring, functioning, control — oversight, accuracy, robustness, cybersecurity.</li>
            <li>Description of technical means to comply with Article 13 (transparency to deployers).</li>
            <li>Dataset description (Article 10 linkage) — sources, labelling, cleaning, filtering, bias.</li>
            <li>Assessment methodology & validation + accuracy, robustness, cybersecurity metrics.</li>
            <li>Cybersecurity measures.</li>
            <li>Changes during the AI system&apos;s lifecycle.</li>
            <li>List of harmonised standards + common specifications applied.</li>
            <li>EU declaration of conformity.</li>
            <li>Post-market monitoring plan (Article 72 linkage).</li>
            <li>Risk management plan (Article 9 linkage).</li>
            <li>For GPAI components embedded: information required under Article 53.</li>
            <li>Any other documentation necessary to demonstrate compliance.</li>
          </ol>
          <p className="leading-relaxed text-slate-300">
            Most technical packs I see cover 3-4 of these fields. Notified Body reviewers reject incomplete packs. The
            fix: generate all 14 upfront via an AI-BOM + risk-register template.
          </p>

          <h3 id="art-14" className="mb-3 mt-8 text-xl font-bold text-white">
            Article 14 — Human oversight
          </h3>
          <p className="mb-6 leading-relaxed text-slate-300">
            Effective oversight must be designed into the system. For fully automated decisions, a human must be able to
            disregard / override / reverse outputs. For assisted decisions, the human must understand the system&apos;s
            capacity and limitations. Requires interface design work, not just policy documents.
          </p>

          <h3 id="art-43" className="mb-3 mt-8 text-xl font-bold text-white">
            Article 43 — Conformity assessment
          </h3>
          <p className="mb-4 leading-relaxed text-slate-300">Two paths:</p>
          <ul className="mb-6 list-disc space-y-2 pl-5 leading-relaxed text-slate-300 marker:text-emerald-500">
            <li>
              <strong className="text-white">Internal control (Annex VI)</strong> — provider self-assesses. Available
              for MOST Annex III systems under certain conditions.
            </li>
            <li>
              <strong className="text-white">Notified Body assessment (Annex VII)</strong> — third-party audit. Required
              for biometric systems in Annex III point 1 and a few other cases. Currently supply-constrained.
            </li>
          </ul>
          <p className="leading-relaxed text-slate-300">
            Either path produces a CE mark + EU declaration of conformity + registration in the EU high-risk AI system
            database.
          </p>

          <h3 id="art-73" className="mb-3 mt-8 text-xl font-bold text-white">
            Article 73 — Serious incident reporting
          </h3>
          <p className="mb-4 leading-relaxed text-slate-300">
            Providers + deployers must report &quot;serious incidents&quot; to market-surveillance authorities. Without
            undue delay and <strong className="text-white">within 15 days of awareness</strong> (10 days for widespread
            infringement; 2 days for serious + irreversible). Definitions:
          </p>
          <ul className="mb-6 list-disc space-y-2 pl-5 leading-relaxed text-slate-300 marker:text-emerald-500">
            <li>Death or serious bodily harm.</li>
            <li>Serious or irreversible disruption to critical infrastructure management.</li>
            <li>Fundamental-rights infringement.</li>
            <li>Serious damage to property or environment.</li>
          </ul>
          <p className="leading-relaxed text-slate-300">
            Runs in parallel to DORA (4h/72h/1mo for financial entities), NIS2 (24h/72h/1mo for essential/important
            entities), and GDPR (72h). If one incident triggers multiple regimes, plan notification workflows that run
            in parallel.
          </p>
        </SectionCard>

        <SectionCard>
          <h2 id="gpai" className="mb-4 text-2xl font-bold tracking-tight sm:text-3xl">
            7. General-purpose AI (GPAI) models
          </h2>
          <p className="mb-4 leading-relaxed text-slate-300">
            Articles 51-55 cover foundation models. Two sub-tiers:
          </p>
          <ul className="mb-6 list-disc space-y-2 pl-5 leading-relaxed text-slate-300 marker:text-emerald-500">
            <li>
              <strong className="text-white">GPAI models</strong> — transparency, copyright protection,
              training-content summary (Art 53).
            </li>
            <li>
              <strong className="text-white">GPAI models with systemic risk</strong> — trigger: 10^25 FLOPs cumulative
              training compute OR Commission designation. Add: model evaluation, systemic-risk assessment, incident
              tracking, cybersecurity, Commission cooperation (Art 55).
            </li>
          </ul>
          <p className="leading-relaxed text-slate-300">
            The Code of Practice for GPAI (published mid-2025) is the practical roadmap for compliance. Signing it is
            voluntary but reduces burden of proof.
          </p>
        </SectionCard>

        <SectionCard>
          <h2 id="preparation" className="mb-4 text-2xl font-bold tracking-tight sm:text-3xl">
            8. A realistic 90-day preparation plan
          </h2>
          <p className="mb-6 leading-relaxed text-slate-300">
            If you&apos;re starting from scratch and need to be evidence-ready by 2 August 2026:
          </p>

          <h3 className="mb-3 text-lg font-bold text-white">Weeks 1-2 — scoping</h3>
          <ul className="mb-6 list-disc space-y-2 pl-5 leading-relaxed text-slate-300 marker:text-emerald-500">
            <li>
              Classify every AI system: prohibited? high-risk? limited? minimal? (Use{" "}
              <code className="rounded bg-white/10 px-1 py-0.5 font-mono text-emerald-400">
                eu-ai-act-compliance-mcp
              </code>{" "}
              risk classifier — &lt;5 min per system.)
            </li>
            <li>Identify roles: provider vs deployer vs importer.</li>
            <li>Designate internal senior responsible person.</li>
            <li>
              Map each high-risk system to Article 9 (risk register), Article 10 (data governance), Article 11
              (technical documentation), Article 14 (oversight).
            </li>
          </ul>

          <h3 className="mb-3 text-lg font-bold text-white">Weeks 3-6 — evidence build</h3>
          <ul className="mb-6 list-disc space-y-2 pl-5 leading-relaxed text-slate-300 marker:text-emerald-500">
            <li>Generate Annex IV technical documentation pack for each high-risk system (14 fields).</li>
            <li>
              Produce CycloneDX ML-BOM / SPDX 3.0 AI-BOM per model ({" "}
              <code className="rounded bg-white/10 px-1 py-0.5 font-mono text-emerald-400">ai-bom-mcp</code>).
            </li>
            <li>Article 10 bias testing results across protected characteristics.</li>
            <li>Risk management register (Article 9) with residual-risk sign-offs.</li>
            <li>Human-oversight interface design spec + test evidence (Article 14).</li>
          </ul>

          <h3 className="mb-3 text-lg font-bold text-white">Weeks 7-10 — conformity path</h3>
          <ul className="mb-6 list-disc space-y-2 pl-5 leading-relaxed text-slate-300 marker:text-emerald-500">
            <li>Decide Annex VI (internal) vs Annex VII (Notified Body) per system.</li>
            <li>For NB path: engage Notified Body now — queues are 6-9 months.</li>
            <li>Draft EU declaration of conformity per system.</li>
            <li>Prepare CE marking process.</li>
            <li>Register in the EU high-risk AI system database.</li>
          </ul>

          <h3 className="mb-3 text-lg font-bold text-white">Weeks 11-13 — launch readiness</h3>
          <ul className="mb-6 list-disc space-y-2 pl-5 leading-relaxed text-slate-300 marker:text-emerald-500">
            <li>Post-market monitoring plan + dashboard.</li>
            <li>Article 73 incident-reporting runbook (incl. DORA + NIS2 + GDPR parallel clocks).</li>
            <li>Staff AI-literacy training (Article 4).</li>
            <li>Continuous signed-attestation cadence (quarterly re-attestation keeps evidence fresh).</li>
          </ul>

          <CtaBox
            title="We can collapse 13 weeks into a 48-hour gap analysis."
            buttons={
              <PrimaryButton href="https://buy.stripe.com/4gM7sN2G0bIKeQJfL28k833">
                Book the 48h audit
              </PrimaryButton>
            }
          >
            Written article-by-article report. Signed HMAC attestation your Notified Body accepts as pre-certification
            evidence. £5,000.
          </CtaBox>
        </SectionCard>

        <SectionCard>
          <h2 id="evidence" className="mb-4 text-2xl font-bold tracking-tight sm:text-3xl">
            9. Pre-certification evidence your Notified Body accepts
          </h2>
          <p className="mb-4 leading-relaxed text-slate-300">
            The Notified Body wants three things per high-risk system:
          </p>
          <ol className="mb-6 list-decimal space-y-2 pl-5 leading-relaxed text-slate-300 marker:text-emerald-500">
            <li>
              <strong className="text-white">Clean Annex IV technical documentation pack</strong> — all 14 fields
              populated, cross-linked to test evidence.
            </li>
            <li>
              <strong className="text-white">Defensible risk management records</strong> — Article 9 residual risks,
              mitigation, sign-offs.
            </li>
            <li>
              <strong className="text-white">Verifiable continuous monitoring</strong> — proof that you didn&apos;t
              just prepare the pack once and walk away.
            </li>
          </ol>
          <p className="mb-4 leading-relaxed text-slate-300">
            Cryptographically signed attestations address #3. A HMAC-SHA256 signed cert issued by an independent signing
            API (like{" "}
            <a
              href="https://meok-attestation-api.vercel.app"
              className="font-semibold text-emerald-400 underline underline-offset-4 transition hover:text-emerald-300"
            >
              meok-attestation-api.vercel.app
            </a>
            ) proves:
          </p>
          <ul className="mb-6 list-disc space-y-2 pl-5 leading-relaxed text-slate-300 marker:text-emerald-500">
            <li>The audit was run on a specific date with a specific score.</li>
            <li>The payload hasn&apos;t been modified since issuance.</li>
            <li>
              The cert is verifiable at a public URL <em>without the Notified Body contacting the issuer</em>.
            </li>
          </ul>
          <p className="leading-relaxed text-slate-300">
            That&apos;s the Vanta Trust Center pattern, applied to AI compliance. Pre-certification evidence the NB
            accepts as preparation, saving weeks of back-and-forth.
          </p>
        </SectionCard>

        <SectionCard>
          <h2 id="faq" className="mb-4 text-2xl font-bold tracking-tight sm:text-3xl">
            10. Common questions
          </h2>

          <h3 className="mb-3 mt-8 text-lg font-bold text-white">
            Is voluntary NB engagement faster than waiting for mandatory dates?
          </h3>
          <p className="mb-6 leading-relaxed text-slate-300">
            Yes. NBs that accept voluntary engagements are running 4-6 month queues vs 6-9 months forecast for the Aug
            2026 rush. Pre-certification evidence compresses the NB engagement itself from ~3 months to ~3-4 weeks.
          </p>

          <h3 className="mb-3 text-lg font-bold text-white">We&apos;re a US SaaS — do we really need to do this?</h3>
          <p className="mb-6 leading-relaxed text-slate-300">
            If your AI output is used by EU customers: yes. Anthropic, OpenAI, Google, Mistral, Cohere all have EU AI
            Act compliance programmes. Providers cannot delegate the obligation to deployers.
          </p>

          <h3 className="mb-3 text-lg font-bold text-white">
            What&apos;s the minimum viable compliance posture for a Series A?
          </h3>
          <p className="mb-6 leading-relaxed text-slate-300">
            Risk classification completed (Art 6 + Annex III mapping). Annex IV pack at ~60% complete. Signed quarterly
            self-attestation posture. Named senior accountable person. Documented Article 14 human oversight.
            Incident-reporting runbook. Article 4 literacy training log.
          </p>

          <h3 className="mb-3 text-lg font-bold text-white">What software can actually automate this?</h3>
          <p className="mb-6 leading-relaxed text-slate-300">
            We built 225+ MCPs on PyPI under{" "}
            <a
              href="https://pypi.org/user/MEOK_AI_Labs/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-emerald-400 underline underline-offset-4 transition hover:text-emerald-300"
            >
              MEOK AI Labs
            </a>
            . The EU AI Act stack is:{" "}
            <code className="rounded bg-white/10 px-1 py-0.5 font-mono text-emerald-400">eu-ai-act-compliance-mcp</code>{" "}
            (audit),{" "}
            <code className="rounded bg-white/10 px-1 py-0.5 font-mono text-emerald-400">ai-bom-mcp</code> (Annex IV
            technical docs),{" "}
            <code className="rounded bg-white/10 px-1 py-0.5 font-mono text-emerald-400">ai-incident-reporting-mcp</code>{" "}
            (Art 73 + DORA + NIS2 + GDPR clocks),{" "}
            <code className="rounded bg-white/10 px-1 py-0.5 font-mono text-emerald-400">dora-nis2-crosswalk-mcp</code>{" "}
            (for financial entities),{" "}
            <code className="rounded bg-white/10 px-1 py-0.5 font-mono text-emerald-400">
              agent-policy-enforcement-mcp
            </code>{" "}
            +{" "}
            <code className="rounded bg-white/10 px-1 py-0.5 font-mono text-emerald-400">agent-audit-logger-mcp</code>{" "}
            (for agent-based systems). All installable in 60 seconds. Pro tier (£199/mo) emits signed attestations.
          </p>

          <CtaBox
            title="Start free. Sign when you need evidence."
            buttons={
              <>
                <PrimaryButton href="https://councilof.ai">Explore all frameworks →</PrimaryButton>
                <SecondaryButton
                  href="https://pypi.org/project/eu-ai-act-compliance-mcp/"
                  target="_blank"
                >
                  Try the free MCP
                </SecondaryButton>
              </>
            }
          >
            Every regulation, one subscription, signed attestations, public verify URLs.
          </CtaBox>
        </SectionCard>

        <SectionCard>
          <h2 className="mb-4 text-2xl font-bold tracking-tight sm:text-3xl">Further reading</h2>
          <ul className="list-disc space-y-2 pl-5 leading-relaxed text-slate-300 marker:text-emerald-500">
            <li>
              <a
                href="https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32024R1689"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-emerald-400 underline underline-offset-4 transition hover:text-emerald-300"
              >
                Regulation (EU) 2024/1689 (official text, EUR-Lex)
              </a>
            </li>
            <li>
              <a
                href="https://artificialintelligenceact.eu/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-emerald-400 underline underline-offset-4 transition hover:text-emerald-300"
              >
                AI Act Explorer (public text navigator)
              </a>
            </li>
            <li>
              <a
                href="https://digital-strategy.ec.europa.eu/en/policies/european-approach-artificial-intelligence"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-emerald-400 underline underline-offset-4 transition hover:text-emerald-300"
              >
                European Commission — Digital Strategy page on AI
              </a>
            </li>
            <li>
              <a
                href="https://meok-attestation-api.vercel.app/catalogue"
                className="font-semibold text-emerald-400 underline underline-offset-4 transition hover:text-emerald-300"
              >
                MEOK Compliance MCP Catalogue
              </a>{" "}
              — all 16 flagship MCPs
            </li>
            <li>
              <a
                href="https://meok-verify.vercel.app"
                className="font-semibold text-emerald-400 underline underline-offset-4 transition hover:text-emerald-300"
              >
                Verify a signed attestation
              </a>
            </li>
          </ul>
        </SectionCard>

        <div className="mt-12 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm leading-relaxed text-slate-400 sm:p-8">
          Written by <strong className="text-white">Nicholas Templeman</strong>, solo founder of MEOK AI Labs. Built the
          attestation infrastructure after watching enterprise AI teams scramble for pre-certification evidence with no
          affordable tooling between Big-4 advisory (£200k+) and DIY spreadsheets.{" "}
          <a
            href="mailto:nicholas@csoai.org"
            className="font-semibold text-emerald-400 underline underline-offset-4 transition hover:text-emerald-300"
          >
            nicholas@csoai.org
          </a>
          .
        </div>

        <div className="mt-8 flex justify-start">
          <Link
            href="/"
            className="inline-flex rounded-lg border border-white/10 bg-white/[0.03] px-6 py-3 text-sm font-bold text-white transition hover:border-emerald-500/30 hover:bg-white/[0.05]"
          >
            ← Back to home
          </Link>
        </div>
      </article>
    </div>
  );
}
