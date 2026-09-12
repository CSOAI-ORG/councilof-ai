import { ArrowUpRight, BookOpen, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";

// Deliberately self-contained. The historic generated blog corpus remains outside
// the homepage dependency graph until each article passes editorial review.
const FEATURED_POSTS = [
  { slug: "governance-benchmarking-is-broken-signed-fix", title: "AI Governance Benchmarking Is Broken", excerpt: "Why rankings need frozen tests, uncertainty, reproducible rows and signed measurement records.", topic: "Method" },
  { slug: "verified-measurement-credential-how-to-verify", title: "How to Verify a Measurement Credential", excerpt: "A practical explanation of hashes, Ed25519 signatures and the boundary between measurement and certification.", topic: "Verification" },
  { slug: "scitt-ai-supply-chain-transparency", title: "SCITT and AI Supply-Chain Transparency", excerpt: "How transparent evidence receipts can make an AI supply chain independently inspectable.", topic: "Provenance" },
  { slug: "eu-ai-act-article-50-machine-readable-marking", title: "Article 50 and Machine-Readable Marking", excerpt: "A source-led look at marking duties, technical evidence and what remains a legal determination.", topic: "Regulation" },
  { slug: "eu-ai-act-article-5-prohibited-practices", title: "Article 5: What Procurement Must Screen", excerpt: "Turning prohibited-practice questions into explicit checks without claiming a compliance verdict.", topic: "Safeguards" },
  { slug: "ai-insurance-verified-measurement", title: "Verified Measurement for AI Insurance", excerpt: "How dated behavioural evidence can support underwriting while leaving the risk decision with the insurer.", topic: "Insurance" },
  { slug: "iso-42001-audit-readiness", title: "ISO/IEC 42001 Audit Readiness", excerpt: "The records, controls and operational evidence an organization should be ready to produce.", topic: "Standards" },
  { slug: "what-is-monitored-containment", title: "What Is Monitored Containment?", excerpt: "A precise account of what monitoring observes, what containment attempts, and what neither proves.", topic: "Safety" },
  { slug: "why-we-publish-our-refutations", title: "Why We Publish Our Refutations", excerpt: "Corrections, failed claims and explicit unknowns are part of the evidence product, not hidden exceptions.", topic: "Corrections" },
] as const;

const PUBLIC_RECORDS = [
  {
    name: "EU AI Pact",
    status: "Pillar I community participant",
    detail: "Direct European Commission invitation received 20 Aug 2026. Participation is not endorsement or certification.",
    href: "https://digital-strategy.ec.europa.eu/en/policies/ai-pact",
  },
  {
    name: "IETF",
    status: "Public technical contributor",
    detail: "Active public discussion across AUDIT, AgentProto and SCITT; contributions remain proposals until working-group consensus.",
    href: "https://datatracker.ietf.org/",
  },
  {
    name: "C2PA",
    status: "Contributor member",
    detail: "Contributor membership approved by the C2PA Steering Committee in August 2026; no endorsement is implied.",
    href: "https://c2pa.org/",
  },
  {
    name: "Decentralized Identity Foundation",
    status: "Member",
    detail: "Membership onboarding confirmed in August 2026, with access to DIF working groups and public technical work.",
    href: "https://identity.foundation/",
  },
  {
    name: "LOT Network",
    status: "Member",
    detail: "CSOAI Ltd joined the defensive patent network in August 2026.",
    href: "https://lotnet.com/",
  },
  {
    name: "Open Invention Network",
    status: "Community member",
    detail: "Membership confirmation received in August 2026 for the open-source patent non-aggression community.",
    href: "https://openinventionnetwork.com/",
  },
  {
    name: "x402 List",
    status: "Independently monitored",
    detail: "Live payment-ready listing with 14/14 protocol checks and published uptime evidence.",
    href: "https://www.x402-list.com/services/council-of-ai",
  },
  {
    name: "Agent Tools",
    status: "Five endpoints verified",
    detail: "Directory confirmations cover proof, evidence, attestation and receipt routes. Listing is not a partnership.",
    href: "https://councilof.ai/openapi.json",
  },
  {
    name: "Open infrastructure",
    status: "Source and datasets public",
    detail: "Inspect the code on GitHub and the published measurement surfaces on Hugging Face.",
    href: "https://github.com/CSOAI-ORG/council-of-ai",
  },
] as const;

export function featuredEvidencePosts() {
  return FEATURED_POSTS.map((post) => ({ ...post, href: `/blog/${post.slug}` }));
}

export default function HomeEvidenceShowcase() {
  const posts = featuredEvidencePosts();

  return (
    <>
      <section aria-labelledby="public-records-h" className="mt-20 sm:mt-24" data-testid="home-public-records">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Public record</p>
          <h2 id="public-records-h" className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Participation you can check.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-600">
            These labels describe documented participation, public listings or independently measured services.
            They do not claim approval, partnership, certification or regulatory status.
          </p>
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PUBLIC_RECORDS.map((record) => (
            <a
              key={record.name}
              href={record.href}
              target="_blank"
              rel="noreferrer"
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-black text-slate-900">{record.name}</p>
                  <p className="mt-1 text-sm font-semibold text-emerald-700">{record.status}</p>
                </div>
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{record.detail}</p>
            </a>
          ))}
        </div>
      </section>

      <section aria-labelledby="field-notes-h" className="mt-20 sm:mt-24" data-testid="home-featured-posts">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Nine field notes</p>
            <h2 id="field-notes-h" className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              Read the method behind the board.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              Governance, regulation, provenance, insurance and containment — linked to the evidence and honest limits.
            </p>
          </div>
          <Link href="/blog" className="inline-flex min-h-11 items-center gap-2 font-bold text-emerald-800 hover:text-emerald-950">
            All research <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post, index) => (
            <Link
              key={post.slug}
              href={post.href}
              className="group flex min-h-64 flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <BookOpen className="h-4 w-4 text-emerald-700" aria-hidden="true" />
              </div>
              <h3 className="mt-5 text-xl font-black leading-tight text-slate-900 group-hover:text-emerald-800">{post.title}</h3>
              <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-600">{post.excerpt}</p>
              <div className="mt-auto flex items-center justify-between gap-3 pt-5 text-xs font-semibold text-slate-500">
                <span>{post.topic}</span>
                <span>Read brief</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
