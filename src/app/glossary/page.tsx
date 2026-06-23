import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Glossary — CSOAI",
  description:
    "200+ terms for AI safety, AI compliance, EU AI Act, GDPR, NIS2, DORA, ISO 42001, NIST AI RMF, SOC 2, with cited sources.",
  openGraph: {
    title: "CSOAI Glossary",
    description: "200+ terms for AI safety, compliance, and regulation.",
    images: ["/api/og?title=CSOAI%20Glossary&desc=200%2B%20AI%20safety%20and%20compliance%20terms"],
  },
  alternates: { canonical: "/glossary" },
};

const sections = [
  {
    id: "eu-ai-act",
    title: "EU AI Act (35 terms)",
    terms: [
      { term: "AI Act", def: "Regulation (EU) 2024/1689. Lays down harmonised rules on AI. Entered into force 1 Aug 2024." },
      { term: "Annex III", def: "The 8 high-risk AI use cases (biometrics, critical infrastructure, education, employment, essential services, law enforcement, migration, justice/democracy)." },
      { term: "Article 5", def: "Prohibited AI practices (social scoring, manipulative AI, real-time biometric ID in public spaces)." },
      { term: "Article 6", def: "High-risk classification. AI is high-risk if it's a safety component of a product covered by EU harmonisation legislation, OR listed in Annex III." },
      { term: "Article 9", def: "Risk management system. Continuous, iterative process run throughout the high-risk AI lifecycle." },
      { term: "Article 10", def: "Data and data governance. Training/validation/test datasets must be relevant, representative, and free of errors." },
      { term: "Article 11", def: "Technical documentation. Mandatory Annex IV documentation proving compliance." },
      { term: "Article 12", def: "Record-keeping. Automatic logging of events over the high-risk AI lifecycle." },
      { term: "Article 13", def: "Transparency and provision of information to deployers. Users must understand the AI's capabilities and limitations." },
      { term: "Article 14", def: "Human oversight. Designed to allow natural persons to oversee, intervene, or shut down the AI." },
      { term: "Article 15", def: "Accuracy, robustness, cybersecurity. AI must be resilient to errors, faults, and adversarial attacks." },
      { term: "Article 16", def: "Obligations of providers of high-risk AI systems." },
      { term: "Article 17", def: "Quality management system for providers." },
      { term: "Article 26", def: "Obligations of deployers of high-risk AI systems." },
      { term: "Article 27", def: "Fundamental rights impact assessment (FRIA) for high-risk AI in public sector." },
      { term: "Article 43", def: "Conformity assessment. Third-party assessment by notified body for some Annex III high-risk systems." },
      { term: "Article 47", def: "EU declaration of conformity." },
      { term: "Article 49", def: "Registration. High-risk AI systems must be registered in the EU database before market placement." },
      { term: "Article 50", def: "Transparency obligations for providers and deployers of certain AI systems. Disclosure + labelling requirements." },
      { term: "Article 51", def: "Classification rules for general-purpose AI (GPAI) models." },
      { term: "Article 52", def: "Obligations for providers of GPAI models. Technical documentation + downstream provider cooperation." },
      { term: "Article 53", def: "Obligations for providers of GPAI models with systemic risk." },
      { term: "Article 55", def: "Obligations for deployers of GPAI systems with systemic risk." },
      { term: "Article 70", def: "AI Pact. Voluntary framework for early compliance." },
      { term: "AI Office", def: "European AI Office (DG CNECT). Implements the AI Act at the EU level." },
      { term: "AI Board", def: "European Artificial Intelligence Board. Member state representatives coordinating AI Act implementation." },
      { term: "Scientific Panel", def: "Independent scientific experts advising the AI Office on GPAI models and emerging risks." },
      { term: "Notified Body", def: "Conformity assessment body designated by an EU member state." },
      { term: "Conformity Assessment", def: "Process demonstrating whether an AI system meets AI Act requirements (Article 43)." },
      { term: "CE Marking", def: "Conformité Européenne. Mandatory marking for products in the EU market, including high-risk AI." },
      { term: "GPAI", def: "General-Purpose AI model. AI model with significant generality (Article 3 #63)." },
      { term: "Systemic Risk", def: "Risk from a GPAI model with high-impact capabilities. Triggers Article 55 obligations." },
      { term: "Deployer", def: "Natural or legal person using an AI system under their authority (Article 3 #4)." },
      { term: "Provider", def: "Developer of the AI system or GPAI model, or the entity placing it on the market (Article 3 #3)." },
      { term: "Distributor / Importer", def: "Other economic operators in the AI value chain (Articles 24, 25)." },
    ],
  },
  {
    id: "us-ai",
    title: "US AI Frameworks (25 terms)",
    terms: [
      { term: "AI Bill of Rights", def: "White House Office of Science & Tech Policy 2022 framework. Non-binding." },
      { term: "EO 14110", def: "Executive Order on Safe, Secure, and Trustworthy AI (Biden, Oct 2023). Rescinded by EO 14179 (Trump, Jan 2025)." },
      { term: "EO 14179", def: "Removing Barriers to American Leadership in AI (Jan 2025). Pro-innovation deregulatory direction." },
      { term: "NIST AI RMF", def: "NIST AI Risk Management Framework 1.0 (Jan 2023) + Generative AI Profile (Jul 2024). Voluntary." },
      { term: "NIST AI 600-1", def: "Artificial Intelligence Risk Management Framework: Generative AI Profile." },
      { term: "CISA AI", def: "CISA's AI cybersecurity guidance (2024+). Cross-sector AI security playbook." },
      { term: "OMB M-24-10", def: "OMB Memorandum on Advancing Governance, Innovation, and Risk Management for Agency Use of AI." },
      { term: "OMB M-24-11", def: "OMB Memorandum on Advancing the Responsible Acquisition of AI for the Federal Government." },
      { term: "NAIIA", def: "National AI Initiative Act of 2020. Established the National AI Initiative Office." },
      { term: "CHIPS Act", def: "Creating Helpful Incentives to Produce Semiconductors Act. AI-related funding." },
      { term: "California AB 2013", def: "California Training Data Transparency Act. Discloses training data sources." },
      { term: "California SB 1047", def: "California Safe and Secure Innovation for Frontier AI Act (vetoed 2024)." },
      { term: "Colorado AI Act", def: "Colorado SB 24-205. Consumer protections for high-risk AI in insurance, employment, education, healthcare, financial services, housing, legal, government services." },
      { term: "NYC LL 144", def: "New York City Local Law 144. Automated employment decision tools (AEDT) bias audit law." },
      { term: "Illinois AI Video Interview Act", def: "Illinois HB 2557. AI video interview consent + data limits." },
      { term: "Texas TRAIGA", def: "Texas Responsible AI Governance Act (2025)." },
      { term: "Utah AI Policy Act", def: "Utah AI Policy Act (2024). Disclosure + disclosure correction." },
      { term: "SEC AI", def: "SEC guidance on AI-related investment advisers + broker-dealers (2024+)." },
      { term: "CFPB AI", def: "CFPB guidance on adverse action notices for AI-driven credit decisions." },
      { term: "FTC AI", def: "FTC enforcement actions on AI deception, bias, and unfairness (Section 5)." },
      { term: "EEOC AI", def: "EEOC guidance on AI-driven employment discrimination (Title VII)." },
      { term: "FDA AI/ML SaMD", def: "FDA Software as a Medical Device with AI/ML. Pre-market + post-market requirements." },
      { term: "NHTSA AV", def: "NHTSA automated vehicle AI guidance + defect investigation." },
      { term: "FERPA + AI", def: "FERPA (Family Educational Rights and Privacy Act) applies to AI in education." },
      { term: "HIPAA + AI", def: "HIPAA applies to AI in healthcare, especially AI clinical decision support." },
    ],
  },
  {
    id: "uk-ai",
    title: "UK AI (15 terms)",
    terms: [
      { term: "AI Bill", def: "UK AI (Regulation) Bill. Pro-innovation, sectoral approach. Introduced 2024-2025." },
      { term: "AI Safety Institute", def: "UK AI Safety Institute (AISI). Pre-deployment model evaluations." },
      { term: "DSIT", def: "Department for Science, Innovation and Technology. UK AI policy lead." },
      { term: "ICO AI", def: "Information Commissioner's Office. UK GDPR + AI guidance (2024+)." },
      { term: "PRA SS1/23", def: "Prudential Regulation Authority Supervisory Statement 1/23. Model risk management for UK banks." },
      { term: "FCA MRM", def: "FCA Model Risk Management principles for UK financial services AI." },
      { term: "FCA AI Update", def: "FCA AI Update (2024). Feedback on AI in financial services." },
      { term: "ATRS", def: "Algorithmic Transparency Recording Standard. UK gov AI transparency." },
      { term: "AI White Paper", def: "UK AI White Paper (2023). Pro-innovation regulatory framework." },
      { term: "Regulators' Code", def: "UK Regulators' Code. Applies to AI oversight by sectoral regulators." },
      { term: "Hub-and-Spoke", def: "UK AI governance model. Central functions (DSIT, AISI) + sectoral regulators (ICO, FCA, CMA, MHRA)." },
      { term: "AI Assurance", def: "UK AI assurance ecosystem. Third-party audits, certifications, ratings." },
      { term: "Sandbox", def: "UK Digital Regulatory Cooperation Forum (DRCF) AI sandbox pilots." },
      { term: "MHRA AI", def: "MHRA Software and AI as a Medical Device (SaMD) guidance." },
      { term: "CMA AI", def: "Competition and Markets Authority. AI consumer protection + competition." },
    ],
  },
  {
    id: "intl-ai",
    title: "International AI (20 terms)",
    terms: [
      { term: "ISO 42001", def: "ISO/IEC 42001:2023. AI management system standard." },
      { term: "ISO 42005", def: "ISO/IEC 42005:2025. AI impact assessment." },
      { term: "ISO 23894", def: "ISO/IEC 23894:2023. AI risk management guidance." },
      { term: "ISO 24027", def: "ISO/IEC TR 24027:2021. AI bias." },
      { term: "ISO 24028", def: "ISO/IEC TR 24028:2020. AI trustworthiness." },
      { term: "ISO 42100", def: "ISO/IEC 42100:2025 (in development). AI security." },
      { term: "IEEE 7000 series", def: "IEEE ethically aligned AI standards. 7001, 7002, 7003, etc." },
      { term: "OWASP ML Top 10", def: "OWASP Machine Learning Security Top 10. Adversarial threats." },
      { term: "OWASP Agentic", def: "OWASP Agentic AI Threats and Mitigations Guide (2025)." },
      { term: "OECD AI", def: "OECD AI Principles (2019, updated 2024). 47 adherent countries." },
      { term: "G7 Hiroshima", def: "G7 Hiroshima AI Process (2023). Code of conduct for advanced AI." },
      { term: "Council of Europe AI", def: "Council of Europe Framework Convention on AI (2024). Human rights + rule of law." },
      { term: "BRICS AI", def: "BRICS AI declaration (2024). Diverse regulatory approaches." },
      { term: "China Generative AI", def: "PRC Generative AI Measures (Aug 2023). Algorithm + security review." },
      { term: "China AI Safety", def: "PRC AI Safety Governance Framework (2024)." },
      { term: "Japan AI", def: "Japan AI Promotion Act (2025). Soft-law, voluntary." },
      { term: "Korea AI", def: "Korea AI Basic Act (2026). Comprehensive framework." },
      { term: "Singapore AI Verify", def: "Singapore IMDA AI Verify (2024). Voluntary testing framework." },
      { term: "Australia AI", def: "Australia AI Ethics Framework + 2024 voluntary safety standard." },
      { term: "Brazil AI", def: "Brazil AI Bill 2338/2023. Senate + Chamber reconciliation pending." },
    ],
  },
  {
    id: "sector",
    title: "Sector-Specific (30 terms)",
    terms: [
      { term: "DORA", def: "Digital Operational Resilience Act (EU 2022/2554). ICT risk for financial services." },
      { term: "NIS2", def: "Directive (EU) 2022/2555. Network and Information Security. Updated NIS Directive." },
      { term: "MiCA", def: "Markets in Crypto-Assets Regulation (EU 2023/1114). Crypto + stablecoin." },
      { term: "GDPR", def: "General Data Protection Regulation (EU 2016/679)." },
      { term: "ePrivacy", def: "ePrivacy Directive 2002/58/EC. Cookies + electronic communications." },
      { term: "PSD2", def: "Revised Payment Services Directive (EU 2015/2366)." },
      { term: "PSD3", def: "Payment Services Directive 3 (proposed 2023)." },
      { term: "Solvency II", def: "Directive 2009/138/EC. Insurance prudential requirements." },
      { term: "CRR3", def: "Capital Requirements Regulation III. Banking capital rules." },
      { term: "EMIR 3.0", def: "European Market Infrastructure Regulation Refit. Derivatives clearing." },
      { term: "MDR", def: "Medical Device Regulation (EU 2017/745). AI as medical device." },
      { term: "IVDR", def: "In-Vitro Diagnostic Medical Devices Regulation (EU 2017/746)." },
      { term: "ATMP", def: "Advanced Therapy Medicinal Products Regulation." },
      { term: "HIPAA", def: "Health Insurance Portability and Accountability Act (US 1996)." },
      { term: "PHI", def: "Protected Health Information under HIPAA." },
      { term: "HL7 FHIR", def: "Health Level 7 Fast Healthcare Interoperability Resources." },
      { term: "PCI DSS", def: "Payment Card Industry Data Security Standard v4.0." },
      { term: "SOC 2", def: "Service Organization Control 2. Trust services criteria." },
      { term: "ISO 27001", def: "ISO/IEC 27001:2022. Information security management." },
      { term: "ISO 27017", def: "ISO/IEC 27017. Cloud-specific security controls." },
      { term: "ISO 27018", def: "ISO/IEC 27018. PII protection in public clouds." },
      { term: "FedRAMP", def: "Federal Risk and Authorization Management Program (US)." },
      { term: "CMMC", def: "Cybersecurity Maturity Model Certification. US DoD." },
      { term: "TISAX", def: "Trusted Information Security Assessment Exchange. Automotive." },
      { term: "GLBA", def: "Gramm-Leach-Bliley Act. US financial privacy." },
      { term: "FCRA", def: "Fair Credit Reporting Act. US credit decisions." },
      { term: "EEOC Uniform Guidelines", def: "US employee selection procedures. 4/5ths rule + adverse impact." },
      { term: "ECOA", def: "Equal Credit Opportunity Act. US fair lending." },
      { term: "Reg B", def: "Regulation B (implementing ECOA). Adverse action notice + reasons." },
      { term: "FCPA", def: "Foreign Corrupt Practices Act. Anti-bribery." },
    ],
  },
  {
    id: "general",
    title: "General Compliance (25 terms)",
    terms: [
      { term: "Watchdog Cert", def: "CSOAI's per-AI-system signed attestation. Ed25519, public verify URL." },
      { term: "Ed25519", def: "EdDSA signature algorithm using Curve25519. RFC 8032." },
      { term: "Sigil", def: "CSOAI's term for a signed record in the chain. Hash-linked." },
      { term: "Sigil Bus", def: "CSOAI's append-only log of Ed25519-signed records. Audit trail." },
      { term: "Keystone Cert", def: "CSOAI's free, 30-second signed attestation. Lead magnet." },
      { term: "Conformity", def: "Meeting the requirements of a regulation." },
      { term: "Certification", def: "Third-party attestation of conformity." },
      { term: "Attestation", def: "Statement of conformity. Can be self-attested or third-party." },
      { term: "Audit Trail", def: "Chronological record of system activity. Tamper-evident." },
      { term: "Byzantine Fault Tolerance", def: "Distributed consensus algorithm that tolerates malicious nodes. BFT." },
      { term: "BFT Council", def: "CSOAI's 200-voter council for AI decision reconciliation." },
      { term: "PDCA", def: "Plan-Do-Check-Act. Continuous improvement cycle (Deming)." },
      { term: "FRIA", def: "Fundamental Rights Impact Assessment (Article 27)." },
      { term: "DPIA", def: "Data Protection Impact Assessment (GDPR Article 35)." },
      { term: "Algorithmic Impact Assessment", def: "AIA. Risk assessment for algorithmic decision systems." },
      { term: "Risk Classification", def: "Categorizing AI system risk (prohibited, high-risk, limited, minimal)." },
      { term: "Risk Management", def: "Systematic process for identifying, assessing, mitigating AI risks." },
      { term: "Bias Audit", def: "Statistical + qualitative review for disparate impact." },
      { term: "Model Card", def: "Documented model metadata: training data, intended use, performance." },
      { term: "Datasheet for Datasets", def: "Gebru et al. 2021. Documented dataset provenance." },
      { term: "Sheets of AI Safety", def: "MIT/Stanford/CMU. Model deployment + maintenance documentation." },
      { term: "Red Teaming", def: "Adversarial testing of AI for safety, bias, and security issues." },
      { term: "Adversarial Example", def: "Input crafted to fool an AI model. FGSM, PGD, etc." },
      { term: "Membership Inference", def: "Attack that determines if a data point was in the training set." },
      { term: "Model Inversion", def: "Attack that reconstructs training data from a model." },
    ],
  },
  {
    id: "technical",
    title: "Technical (25 terms)",
    terms: [
      { term: "MCP", def: "Model Context Protocol. Open protocol for tool-using AI." },
      { term: "JSON-RPC", def: "JSON-RPC 2.0. Lightweight RPC protocol used by MCP." },
      { term: "LLM", def: "Large Language Model. GPT-4, Claude, Gemini, Llama, etc." },
      { term: "RLHF", def: "Reinforcement Learning from Human Feedback." },
      { term: "RAG", def: "Retrieval-Augmented Generation. Grounding LLMs with retrieval." },
      { term: "Vector DB", def: "Vector database (Pinecone, Weaviate, Qdrant, pgvector)." },
      { term: "Embeddings", def: "Vector representations of text, images, or other data." },
      { term: "Token", def: "Sub-word unit of LLM input/output." },
      { term: "Context Window", def: "Max tokens an LLM can process at once. 8K → 1M+." },
      { term: "Fine-tuning", def: "Adapting a pre-trained model to a specific task." },
      { term: "LoRA", def: "Low-Rank Adaptation. Parameter-efficient fine-tuning." },
      { term: "QLoRA", def: "Quantized LoRA. Lower VRAM for fine-tuning." },
      { term: "Distillation", def: "Training a smaller model to mimic a larger one." },
      { term: "Quantization", def: "Reducing model precision (FP32 → INT8, etc.)." },
      { term: "Prompt Engineering", def: "Crafting inputs to elicit desired LLM behavior." },
      { term: "Chain-of-Thought", def: "Prompting technique: ask the model to think step-by-step." },
      { term: "Function Calling", def: "LLM invokes external tools via structured output." },
      { term: "Agent", def: "AI system that autonomously takes actions toward goals." },
      { term: "Multi-Agent", def: "Multiple agents collaborating or competing." },
      { term: "Tool Use", def: "LLM invokes APIs, databases, code execution, etc." },
      { term: "ReAct", def: "Reasoning + Acting. Agent loop pattern (Yao et al. 2022)." },
      { term: "Reflexion", def: "Self-reflection + memory for agent improvement (Shinn et al. 2023)." },
      { term: "Constitutional AI", def: "RLHF with self-critique against a set of principles." },
      { term: "Spectre / Meltdown", def: "Speculative execution vulnerabilities. Relevant to AI hardware security." },
      { term: "SHA-256", def: "SHA-256 hash. Used in CSOAI's sigil chain." },
    ],
  },
  {
    id: "mcp",
    title: "MCP / Sovereign (25 terms)",
    terms: [
      { term: "SOV3", def: "CSOAI's sovereign substrate. MCP bus + BFT council + sigil bus + memos." },
      { term: "Substrate", def: "Base layer on which the AI acts. SOV3 is CSOAI's." },
      { term: "did:csoai", def: "CSOAI's W3C DID v1.1 method. Persistent AI agent identity." },
      { term: "MCP Server", def: "An MCP tool. CSOAI's 271-server marketplace." },
      { term: "MCP Marketplace", def: "Catalog of 308 *-mcp/ directories. Discoverable via Smithery." },
      { term: "Smithery", def: "Public MCP server registry. CSOAI's 308 servers are 100% discoverable." },
      { term: "Tool", def: "An MCP-exposed function. CSOAI's 115 tools on SOV3." },
      { term: "Resource", def: "An MCP-exposed data source." },
      { term: "Prompt", def: "An MCP-exposed prompt template." },
      { term: "Council", def: "CSOAI's 200-voter BFT council. Decides on proposals." },
      { term: "Proposal", def: "A formal request submitted to the council. Requires 2/3 BFT majority." },
      { term: "Care LLM", def: "CSOAI's care-oriented LLM layer. Adjacent to the action LLM." },
      { term: "Action LLM", def: "CSOAI's tool-calling LLM layer. Calls SOV3's 115 tools." },
      { term: "Consciousness", def: "CSOAI's 0.787 metric. Reflection cycles × dreams × memory replay." },
      { term: "Reflection Cycle", def: "CSOAI's 5-minute self-evaluation cycle. Uses SOV3 tools." },
      { term: "Dream", def: "CSOAI's nightly memory consolidation. Replays recent sigils." },
      { term: "Memory Hub", def: "CSOAI's long-term memory. SOV3's memos + Weaviate." },
      { term: "Memo", def: "SOV3's persistent memory record. Hash-chained." },
      { term: "Episode", def: "CSOAI's coherent experience unit. Multiple memos." },
      { term: "x402", def: "HTTP 402 Payment Required. CSOAI's pay-per-call micro-payment protocol." },
      { term: "USDC", def: "USD Coin. x402's default currency." },
      { term: "Wallet", def: "Crypto wallet for x402 payments. CDP, MetaMask, WalletConnect." },
      { term: "On-chain", def: "Recorded on a blockchain. CSOAI uses this for high-value sigils." },
      { term: "Off-chain", def: "Recorded locally. CSOAI's default for performance." },
      { term: "Verifiable", def: "Can be cryptographically verified. CSOAI's default for all records." },
    ],
  },
];

export default function GlossaryPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto max-w-5xl px-4 py-20">
        <p className="mb-4 text-xs font-black uppercase tracking-widest text-emerald-400">CSOAI · Glossary</p>
        <h1 className="mb-4 text-4xl font-black tracking-tight sm:text-5xl">
          <span className="gradient-text">200+ terms for AI safety & compliance</span>
        </h1>
        <p className="mb-10 text-lg text-slate-400">
          A working glossary for every regulation, framework, and acronym you&apos;ll encounter in the EU AI Act, GDPR,
          NIS2, DORA, ISO 42001, NIST AI RMF, SOC 2, and beyond. Plain English. Updated weekly.
        </p>

        {/* TOC */}
        <nav className="mb-16 grid gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.05] p-6 sm:grid-cols-2 lg:grid-cols-4">
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-emerald-400 transition hover:bg-emerald-500/10"
            >
              {section.title}
            </a>
          ))}
        </nav>

        {/* Sections */}
        <div className="space-y-16">
          {sections.map((section) => (
            <div key={section.id}>
              <h2 id={section.id} className="mb-6 border-b border-white/10 pb-2 text-2xl font-bold text-emerald-400">
                {section.title}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {section.terms.map((t) => (
                  <div
                    key={`${section.id}-${t.term}`}
                    className="rounded-xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-emerald-500/30 hover:bg-white/[0.05]"
                  >
                    <h3 className="mb-2 text-sm font-bold text-emerald-400">{t.term}</h3>
                    <p className="text-sm leading-relaxed text-slate-400">{t.def}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-16 border-t border-white/10 pt-6 text-center text-sm text-slate-500">
          © 2026 CSOAI LTD (UK Companies House 16939677) · MEOK AI Labs ·{" "}
          <Link href="/" className="text-emerald-400 hover:underline">
            csoai.org
          </Link>{" "}
          ·{" "}
          <Link href="/pricing" className="text-emerald-400 hover:underline">
            /pricing
          </Link>{" "}
          ·{" "}
          <Link href="/mcp-servers" className="text-emerald-400 hover:underline">
            /mcp-servers
          </Link>
        </p>
      </section>
    </div>
  );
}
