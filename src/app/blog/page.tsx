import type { Metadata } from "next";
import BlogClient from "./BlogClient";

export const metadata: Metadata = {
  title: "CSOAI Blog - AI Governance News & Insights",
  description:
    "Latest articles on EU AI Act compliance, CASA certification, AI governance trends, Byzantine consensus, and AI regulation. Expert insights and industry updates.",
  openGraph: {
    title: "CSOAI Blog - AI Governance News & Insights",
    description: "Expert articles on AI governance, compliance, certification, and safety standards.",
    images: ["/api/og?title=CSOAI%20Blog&desc=AI%20governance%20news%20and%20insights"],
  },
  alternates: { canonical: "/blog" },
};

export const posts = [
  {
    slug: "launch-47-agent-town",
    category: "Launch",
    date: "June 22, 2026",
    title: "We Built a 47-Agent AI Town You Can Walk Through — And Every Decision Is Signed",
    excerpt:
      "CSOAI and MEOK launch a live 3D sovereign AI town: 47 autonomous agents, Byzantine-fault-tolerant governance, and cryptographically-attested verdicts you can verify yourself.",
    readTime: "4 min read",
  },
  {
    slug: "eu-ai-act-compliance",
    category: "Regulation",
    date: "February 18, 2026",
    title: "EU AI Act Compliance: What Organizations Must Know by August 2026",
    excerpt:
      "The EU AI Act compliance deadline is 520 days away. We break down the key requirements, certification pathways, and critical timelines for organizations operating AI systems in European markets.",
    readTime: "8 min read",
  },
  {
    slug: "casa-certification-levels",
    category: "Certification",
    date: "February 15, 2026",
    title: "CASA Certification Levels Explained: Commercial vs Government vs Defense",
    excerpt:
      "Choosing the right certification tier depends on your organizational needs and risk profile. This comprehensive guide explains Level 1, 2, and 3 certifications and their practical applications.",
    readTime: "10 min read",
  },
  {
    slug: "byzantine-consensus",
    category: "Governance",
    date: "February 12, 2026",
    title: "Byzantine Consensus Explained: How Distributed AI Governance Works",
    excerpt:
      "Understanding Byzantine Fault Tolerance is crucial to CSOAI governance. Learn how 33 distributed AI agents reach consensus using 22/33 threshold voting to ensure secure decision-making.",
    readTime: "12 min read",
  },
  {
    slug: "iso-42001-nist-ai-rmf",
    category: "Standards",
    date: "February 10, 2026",
    title: "ISO 42001 and NIST AI RMF: Aligning Your Systems with Global Standards",
    excerpt:
      "Multiple AI governance frameworks exist globally. We explain how ISO 42001, NIST AI RMF, and CSOAI standards complement each other and create a comprehensive governance approach.",
    readTime: "9 min read",
  },
  {
    slug: "ai-governance-trends-2026",
    category: "Governance",
    date: "February 8, 2026",
    title: "AI Governance Trends 2026: What's Changing in Regulation",
    excerpt:
      "From mandatory auditing to algorithmic transparency requirements, AI governance is rapidly evolving. Here are the top 10 trends shaping regulation in 2026 and beyond.",
    readTime: "7 min read",
  },
  {
    slug: "casa-certification-launch",
    category: "Certification",
    date: "February 5, 2026",
    title: "CASA Certification Launch: First Organizations Achieve AI Safety Certification",
    excerpt:
      "CASA has certified the first wave of organizations across commercial, government, and defense sectors. Read the success stories and lessons learned from early adopters.",
    readTime: "6 min read",
  },
  {
    slug: "cmmc-for-ai",
    category: "Regulation",
    date: "February 1, 2026",
    title: "CMMC for AI: Integrating Cybersecurity with AI Governance",
    excerpt:
      "The intersection of cybersecurity compliance and AI governance is becoming critical. Learn how CMMC (Cybersecurity Maturity Model Certification) applies to AI systems and organizations.",
    readTime: "8 min read",
  },
  {
    slug: "red-teaming-adversarial-testing",
    category: "Standards",
    date: "January 29, 2026",
    title: "Red Teaming and Adversarial Testing: Essential for AI Certification",
    excerpt:
      "Robust security testing is non-negotiable for AI governance. This guide explains red teaming methodologies, adversarial testing approaches, and how AIdome conducts comprehensive vulnerability assessments.",
    readTime: "11 min read",
  },
  {
    slug: "ai-audit-best-practices",
    category: "Governance",
    date: "January 26, 2026",
    title: "AI Audit Best Practices: Preparing Your Organization for Compliance Assessments",
    excerpt:
      "Pre-audit preparation can significantly improve certification outcomes. Discover the documentation, evidence collection, and stakeholder alignment needed for successful AI audits.",
    readTime: "9 min read",
  },
  {
    slug: "algorithmic-accountability",
    category: "Standards",
    date: "January 23, 2026",
    title: "Algorithmic Accountability and Transparency: Core Principles of AI Governance",
    excerpt:
      "Accountability and transparency aren't optional—they're foundational to responsible AI. Learn how to implement explainability, audit trails, and accountability mechanisms in your AI systems.",
    readTime: "7 min read",
  },
  {
    slug: "proof-of-ai",
    category: "Certification",
    date: "January 20, 2026",
    title: "Proof of AI: Tokenizing Certification for Transparent Verification",
    excerpt:
      "Blockchain-based Proof of AI tokens provide immutable verification of CASA certification. Understand how tokenization enhances transparency and enables secure third-party verification.",
    readTime: "8 min read",
  },
  {
    slug: "global-ai-governance-harmonization",
    category: "Regulation",
    date: "January 17, 2026",
    title: "Global AI Governance Harmonization: BSI's Role in Mutual Recognition",
    excerpt:
      "International AI governance alignment is essential for global deployment. BSI coordinates standards reciprocity agreements that enable certified AI systems to operate across borders seamlessly.",
    readTime: "10 min read",
  },
  {
    slug: "ai-risk-register",
    category: "Governance",
    date: "January 14, 2026",
    title: "Building Your AI Risk Register: A Step-by-Step Framework",
    excerpt:
      "Risk identification and management are central to AI governance. Learn how to develop a comprehensive AI risk register that aligns with ISO 42001 and CSOAI standards.",
    readTime: "6 min read",
  },
  {
    slug: "ai-governance-vs-compliance",
    category: "Governance",
    date: "June 17, 2026",
    title: "AI Governance vs AI Compliance: What's the Difference?",
    excerpt: "AI governance and AI compliance are related, but they are not the same thing. Confusing them leads to buying the wrong tools and missing the wrong risks.",
    readTime: "8 min read"
  },
  {
    slug: "choosing-ai-compliance-vendor",
    category: "Certification",
    date: "June 17, 2026",
    title: "How to Choose an AI Compliance Vendor",
    excerpt: "Every week a new vendor claims to solve AI compliance. Some are genuine. Many are repackaged GRC tools with AI marketing. Here is how to cut through the noise.",
    readTime: "8 min read"
  },
  {
    slug: "dora-compliance-uk-financial-services",
    category: "Regulation",
    date: "June 17, 2026",
    title: "DORA Compliance for UK Financial Services",
    excerpt: "The Digital Operational Resilience Act (DORA) applies to financial entities operating in the EU from 17 January 2025. It requires firms to ensure they can wi...",
    readTime: "8 min read"
  },
  {
    slug: "eu-ai-act-article-50-countdown",
    category: "Regulation",
    date: "June 17, 2026",
    title: "The EU AI Act Article 50 Countdown: What Changes on 2 August 2026",
    excerpt: "On 2 August 2026, the EU AI Act's Article 50 transparency obligations come into force. If your organisation deploys a high-risk AI system in the EU — or prov...",
    readTime: "8 min read"
  },
  {
    slug: "layer-0-agent-economy-trust",
    category: "Governance",
    date: "June 17, 2026",
    title: "Layer 0: The Missing Trust Layer for the Agent Economy",
    excerpt: "Each is a meaningful advance. But every one of them assumes something that does not yet exist: a trusted agent identity with enforceable policy.",
    readTime: "8 min read"
  },
  {
    slug: "nis2-compliance-critical-infrastructure",
    category: "Regulation",
    date: "June 17, 2026",
    title: "NIS2 Compliance for Critical Infrastructure Operators",
    excerpt: "The Network and Information Security Directive 2 (NIS2) is the EU's updated cybersecurity legislation. It expands the scope of the original NIS Directive to ...",
    readTime: "8 min read"
  },
  {
    slug: "rd-tax-credits-uk-ai-startups",
    category: "Governance",
    date: "June 17, 2026",
    title: "R&D Tax Credits: The Most Overlooked Cash Source for UK AI Startups",
    excerpt: "If you are a UK company building AI systems, there is a high chance you qualify for R&D tax credits. Many founders overlook this because \"R&D\" sounds like la...",
    readTime: "8 min read"
  },

];

const categories = ["All", "Governance", "Standards", "Certification", "Regulation"];

const schema = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "CSOAI Blog - AI Governance News & Insights",
  description: "Expert articles on AI governance, compliance, certification, and safety standards.",
  url: "https://csoai.org/blog",
  breadcrumb: {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://csoai.org" },
      { "@type": "ListItem", position: 2, name: "Blog", item: "https://csoai.org/blog" },
    ],
  },
};

export default function BlogPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <BlogClient posts={posts} categories={categories} />
    </>
  );
}
