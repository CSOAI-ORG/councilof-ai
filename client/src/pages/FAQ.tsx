import { useState, useMemo } from "react";
import { ChevronDown, Search, MessageCircle, Mail, Phone, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface FAQItem {
  category: string;
  question: string;
  answer: string;
  tags?: string[];
}

const faqData: FAQItem[] = [
  // GENERAL
  {
    category: "GENERAL",
    question: "What is CSOAI?",
    answer:
      "The Council of Safety for AI (CSOAI) is a global AI governance and safety platform that provides comprehensive tools for monitoring, auditing, and certifying AI systems. We combine cutting-edge technology with human expertise to ensure AI systems are safe, transparent, and compliant with regulations worldwide.",
    tags: ["basics", "introduction"],
  },
  {
    category: "GENERAL",
    question: "What does the Council of Safety for AI do?",
    answer:
      "CSOAI operates as both a governance platform and a watchdog organization. We provide AI governance frameworks, compliance tools, training, certifications, and a global network of AI safety analysts who monitor and audit AI systems. Our mission is to protect humanity from AI risks while creating meaningful employment in AI safety.",
    tags: ["mission", "services"],
  },
  {
    category: "GENERAL",
    question: "Who founded CSOAI?",
    answer:
      "CSOAI was founded in 2024 as a response to the critical need for AI safety professionals and governance solutions. The platform was built by a diverse team of AI researchers, governance experts, and technologists committed to responsible AI deployment.",
    tags: ["history", "founding"],
  },
  {
    category: "GENERAL",
    question: "How is CSOAI different from other AI governance platforms?",
    answer:
      "CSOAI uniquely combines automated governance tools with human expertise through our Watchdog analyst network. Unlike competitors like Credo AI, Holistic AI, or OneTrust, we focus on solving two problems simultaneously: ensuring AI safety AND creating jobs for workers displaced by automation. Our 33-Agent Byzantine Council provides unprecedented consensus-driven decision-making.",
    tags: ["comparison", "differentiation"],
  },
  {
    category: "GENERAL",
    question: "Is CSOAI free to use?",
    answer:
      "CSOAI offers a free tier for individuals, startups, and non-profits with access to basic governance tools, educational resources, and certification programs. Enterprise features, unlimited audits, and dedicated support are available through our paid plans. Training and watchdog analyst certification are entirely free.",
    tags: ["pricing", "free"],
  },
  {
    category: "GENERAL",
    question: "What is the 33-Agent Council?",
    answer:
      "The 33-Agent Council is CSOAI's unique Byzantine fault-tolerant consensus mechanism. It uses 33 specialized AI agents representing different governance perspectives (ethics, compliance, technical safety, etc.) to make decisions about AI system classifications, risk assessments, and compliance recommendations. This distributed approach ensures no single point of failure and balanced decision-making.",
    tags: ["technology", "council"],
  },
  {
    category: "GENERAL",
    question: "What is the Maternal Covenant?",
    answer:
      "The Maternal Covenant is CSOAI's founding pledge to prioritize human well-being and create opportunities for displaced workers. It ensures that AI safety efforts directly translate into employment opportunities, training programs, and economic support for those affected by AI automation.",
    tags: ["values", "covenant"],
  },
  {
    category: "GENERAL",
    question: "What is the SOAI-PDCA framework?",
    answer:
      "SOAI-PDCA is CSOAI's governance methodology combining Safety-Oriented AI (SOAI) principles with the Plan-Do-Check-Act (PDCA) cycle. It provides a structured approach to implement AI governance: Plan your AI safety strategy, Do the implementation, Check compliance and safety metrics, and Act on findings to continuously improve.",
    tags: ["framework", "methodology"],
  },
  {
    category: "GENERAL",
    question: "How many nations does CSOAI cover?",
    answer:
      "CSOAI provides governance tools and frameworks for AI systems in 150+ countries. We support compliance with regulations across major jurisdictions including the EU, North America, Asia-Pacific, and emerging markets. Our multi-jurisdictional approach helps organizations navigate complex, overlapping regulatory requirements.",
    tags: ["global", "jurisdiction"],
  },
  {
    category: "GENERAL",
    question: "What is the DSRB (Digital Safety Review Board)?",
    answer:
      "The Digital Safety Review Board (DSRB) is CSOAI's expert body composed of AI safety professionals, ethicists, regulators, and industry specialists. They review complex AI incidents, provide guidance on emerging risks, and help establish best practices for AI governance. Organizations can request DSRB reviews for critical AI systems.",
    tags: ["governance", "board"],
  },
  {
    category: "GENERAL",
    question: "Can I integrate CSOAI with my existing tools?",
    answer:
      "Yes, CSOAI provides comprehensive APIs and integrations with popular platforms including Kubernetes, cloud providers, MLOps tools, and compliance platforms. Our enterprise plans include custom integration support and dedicated technical specialists.",
    tags: ["integration", "technical"],
  },

  // AI GOVERNANCE
  {
    category: "AI GOVERNANCE",
    question: "What is AI governance?",
    answer:
      "AI governance refers to the frameworks, policies, and processes that organizations implement to manage AI systems responsibly. It encompasses risk management, compliance, ethics, transparency, and human oversight. AI governance ensures AI systems are safe, fair, accountable, and aligned with organizational values and regulatory requirements.",
    tags: ["governance", "definition"],
  },
  {
    category: "AI GOVERNANCE",
    question: "Why is AI governance important?",
    answer:
      "AI governance is critical because AI systems can impact millions of people and influence critical decisions in healthcare, finance, criminal justice, and more. Without proper governance, organizations face regulatory penalties, reputational damage, legal liability, and most importantly, potential harm to users. Effective governance reduces risks while building trust.",
    tags: ["importance", "risk"],
  },
  {
    category: "AI GOVERNANCE",
    question: "What are the key components of an AI governance framework?",
    answer:
      "A comprehensive AI governance framework includes: (1) Risk assessment and classification, (2) Compliance monitoring, (3) Model validation and testing, (4) Data governance and quality assurance, (5) Transparency and explainability requirements, (6) Incident reporting and response, (7) Ongoing performance monitoring, (8) Stakeholder governance, and (9) Regular audits and certifications.",
    tags: ["framework", "components"],
  },
  {
    category: "AI GOVERNANCE",
    question: "How do I start implementing AI governance?",
    answer:
      "Start by: (1) Conducting an AI inventory of all systems in use, (2) Assessing risks using CSOAI's risk classification tool, (3) Mapping regulatory requirements relevant to your jurisdiction and industry, (4) Implementing policies for model development and deployment, (5) Establishing monitoring and incident response procedures, (6) Training teams on governance frameworks, and (7) Using CSOAI's tools to track compliance. Our free tier and certification programs can guide you through each step.",
    tags: ["implementation", "getting-started"],
  },
  {
    category: "AI GOVERNANCE",
    question: "What is the difference between AI ethics and AI governance?",
    answer:
      "AI ethics focuses on moral principles and values (fairness, transparency, human autonomy, etc.), while AI governance is the systematic approach to implementing and enforcing these principles. Ethics defines what's right; governance ensures it gets done. Both are essential—ethics without governance is aspirational, governance without ethics is hollow.",
    tags: ["ethics", "comparison"],
  },
  {
    category: "AI GOVERNANCE",
    question: "What is algorithmic bias and how is it addressed?",
    answer:
      "Algorithmic bias occurs when AI systems produce systematically unfair or discriminatory outcomes for certain groups. It can stem from biased training data, flawed model design, or misaligned objectives. CSOAI addresses bias through: (1) Bias detection tools that identify disparate impact, (2) Testing frameworks for fairness metrics, (3) Data auditing services, (4) Mitigation strategies, and (5) Ongoing monitoring for bias drift.",
    tags: ["bias", "fairness"],
  },
  {
    category: "AI GOVERNANCE",
    question: "What is explainable AI (XAI)?",
    answer:
      "Explainable AI (XAI) refers to techniques and practices that make AI decision-making transparent and understandable to humans. Instead of black-box systems, XAI provides interpretable explanations for why an AI system made a specific decision. CSOAI requires organizations to implement XAI methods, especially for high-risk systems, to ensure human oversight and regulatory compliance.",
    tags: ["transparency", "technical"],
  },
  {
    category: "AI GOVERNANCE",
    question: "How does AI governance relate to data privacy?",
    answer:
      "AI governance and data privacy are interconnected. Most AI systems process personal data, making GDPR, CCPA, and similar regulations critical considerations. AI governance frameworks must incorporate data governance practices including: minimizing data collection, ensuring data quality, implementing anonymization where possible, and protecting data throughout the AI lifecycle.",
    tags: ["privacy", "gdpr"],
  },
  {
    category: "AI GOVERNANCE",
    question: "What is a model card?",
    answer:
      "A model card is a comprehensive documentation artifact that describes an AI model's performance, characteristics, limitations, and intended use. It includes: model architecture, training data, performance metrics across different demographic groups, limitations, ethical considerations, and recommended use cases. Model cards promote transparency and help stakeholders understand what a model can and cannot do.",
    tags: ["documentation", "transparency"],
  },
  {
    category: "AI GOVERNANCE",
    question: "What is an AI impact assessment?",
    answer:
      "An AI impact assessment is a systematic evaluation of how a proposed or deployed AI system might affect individuals, groups, and society. It examines potential risks including discrimination, privacy violations, loss of autonomy, and societal impacts. CSOAI provides templates and tools to conduct thorough impact assessments as part of responsible AI deployment.",
    tags: ["assessment", "risk"],
  },

  // COMPLIANCE & REGULATIONS
  {
    category: "COMPLIANCE & REGULATIONS",
    question: "Which AI regulations does CSOAI cover?",
    answer:
      "CSOAI provides guidance and compliance tools for major AI regulations including: EU AI Act, NIST AI Risk Management Framework, ISO 42001, Canada's AIAODA, UK AI Bill, China's TC260 framework, Singapore's AI Governance Framework, and emerging regulations in 150+ countries. We continuously update our platform as new regulations are introduced.",
    tags: ["compliance", "regulations"],
  },
  {
    category: "COMPLIANCE & REGULATIONS",
    question: "How do I comply with the EU AI Act?",
    answer:
      "EU AI Act compliance involves: (1) Classifying your AI systems by risk level (prohibited, high-risk, limited-risk, minimal-risk), (2) Implementing required documentation and governance, (3) Conducting conformity assessments, (4) Establishing post-market monitoring, (5) Creating incident reporting procedures, and (6) Demonstrating compliance to regulatory bodies. CSOAI provides step-by-step guidance, templates, and automated compliance tracking for all EU AI Act requirements.",
    tags: ["eu-ai-act", "compliance"],
  },
  {
    category: "COMPLIANCE & REGULATIONS",
    question: "What is a high-risk AI system under the EU AI Act?",
    answer:
      "High-risk systems under the EU AI Act include AI used in: critical infrastructure, biometric identification, immigration/borders, law enforcement, military, employment decisions, education, credit assessment, benefits administration, and systems that could impact fundamental rights. These systems require conformity assessments, detailed documentation, human oversight, and ongoing monitoring.",
    tags: ["eu-ai-act", "risk-classification"],
  },
  {
    category: "COMPLIANCE & REGULATIONS",
    question: "What are the penalties for non-compliance with the EU AI Act?",
    answer:
      "EU AI Act penalties can be severe: fines up to 6% of global annual revenue for prohibited AI practices, 4% for high-risk violations, and 2% for documentation/transparency breaches. For large companies, this can mean millions in fines. CSOAI helps you avoid these penalties through comprehensive compliance tools and regular audits.",
    tags: ["eu-ai-act", "penalties"],
  },
  {
    category: "COMPLIANCE & REGULATIONS",
    question: "How does NIST AI RMF differ from the EU AI Act?",
    answer:
      "NIST AI RMF is a voluntary, flexible risk management framework focused on identifying and mitigating AI risks, while the EU AI Act is mandatory legislation with specific compliance requirements and penalties. NIST emphasizes continuous improvement and governance; EU AI Act prescribes specific rules for different risk categories. Most organizations use both: NIST for internal governance, EU AI Act for regulatory compliance.",
    tags: ["nist", "eu-ai-act"],
  },
  {
    category: "COMPLIANCE & REGULATIONS",
    question: "What is ISO 42001 and do I need it?",
    answer:
      "ISO 42001 is the international standard for AI management systems. It provides a framework for implementing, monitoring, and continuously improving AI governance across an organization. While not yet mandatory in most jurisdictions, ISO 42001 certification demonstrates serious commitment to AI safety and is increasingly expected by enterprises, regulators, and business partners. CSOAI can help you achieve certification.",
    tags: ["iso-42001", "certification"],
  },
  {
    category: "COMPLIANCE & REGULATIONS",
    question: "How does China's TC260 framework work?",
    answer:
      "China's TC260 framework, managed by the China Academy of Information and Communications Technology, provides guidelines for AI security, algorithm transparency, and data governance. It emphasizes content security, data protection, and state oversight of high-impact algorithms. Organizations operating in China must comply with TC260 requirements for algorithm registration, transparency reports, and security assessments.",
    tags: ["tc260", "china"],
  },
  {
    category: "COMPLIANCE & REGULATIONS",
    question: "How do I comply across multiple jurisdictions?",
    answer:
      "Multi-jurisdictional compliance requires: (1) Identifying which regulations apply to your organization and users, (2) Mapping overlapping requirements, (3) Implementing the strictest applicable standards (usually as baseline), (4) Using tools like CSOAI's framework mapper to track requirements, (5) Centralizing documentation and governance processes, and (6) Conducting regular multi-jurisdictional audits. CSOAI's platform supports simultaneous compliance with multiple frameworks.",
    tags: ["compliance", "multi-jurisdiction"],
  },
  {
    category: "COMPLIANCE & REGULATIONS",
    question: "What is the timeline for EU AI Act enforcement?",
    answer:
      "The EU AI Act has a phased enforcement timeline: (1) Prohibited practices restrictions took effect immediately, (2) Transparency and documentation requirements began in August 2024, (3) High-risk system requirements take full effect by 2025, (4) Full compliance is required by 2026. Organizations should begin compliance efforts immediately to meet these deadlines.",
    tags: ["eu-ai-act", "timeline"],
  },
  {
    category: "COMPLIANCE & REGULATIONS",
    question: "Does CSOAI help with GDPR compliance?",
    answer:
      "Yes, CSOAI's AI governance framework integrates with GDPR requirements. We help you: (1) Conduct data protection impact assessments, (2) Ensure legitimate processing grounds for AI training data, (3) Implement data minimization and purpose limitation, (4) Document consent for high-risk processing, and (5) Establish data deletion and user rights procedures. AI governance and GDPR are increasingly intertwined.",
    tags: ["gdpr", "privacy"],
  },

  // TRAINING & CERTIFICATION
  {
    category: "TRAINING & CERTIFICATION",
    question: "What training courses does CSOAI offer?",
    answer:
      "CSOAI offers comprehensive free and premium training including: (1) AI Governance Fundamentals, (2) Implementing the EU AI Act, (3) NIST AI Risk Management Framework, (4) Ethical AI and Bias Detection, (5) Model Auditing and Testing, (6) Regulatory Compliance for Different Industries, (7) Leadership in AI Safety, and (8) Watchdog Analyst Training. Courses range from self-paced to instructor-led.",
    tags: ["training", "courses"],
  },
  {
    category: "TRAINING & CERTIFICATION",
    question: "Is the training really free?",
    answer:
      "Yes, all CSOAI training is completely free, including certification programs. This aligns with our Maternal Covenant mission to create accessible pathways to AI safety careers. Funding comes from enterprise licensing and watchdog incident revenue. We believe AI governance expertise should be accessible to everyone.",
    tags: ["training", "free", "pricing"],
  },
  {
    category: "TRAINING & CERTIFICATION",
    question: "What certifications are available?",
    answer:
      "CSOAI offers multiple certifications: (1) Certified AI Governance Professional (CAGP), (2) Certified AI Safety Analyst (CASA), (3) Certified EU AI Act Specialist (CEAAS), (4) ISO 42001 Foundation Certificate, (5) NIST AI RMF Practitioner, (6) Certified Watchdog Analyst (CWA), and (7) specialized certifications for different industries. Each demonstrates competency in specific governance areas.",
    tags: ["certification", "credentials"],
  },
  {
    category: "TRAINING & CERTIFICATION",
    question: "How long does certification take?",
    answer:
      "Certification timelines vary: entry-level certifications typically take 4-8 weeks of part-time study and include exams covering 2-3 hours. Professional certifications require 3-6 months and may include practical projects or case studies. Watchdog analyst certification is more flexible and can be completed on your schedule while building experience through incident analysis.",
    tags: ["certification", "timeline"],
  },
  {
    category: "TRAINING & CERTIFICATION",
    question: "Are CSOAI certifications internationally recognized?",
    answer:
      "CSOAI certifications are recognized across 150+ countries where we operate. They're valued by enterprises, governments, and regulatory bodies as evidence of AI governance expertise. We're working toward formal accreditation with major professional bodies and educational authorities to enhance recognition.",
    tags: ["certification", "recognition"],
  },
  {
    category: "TRAINING & CERTIFICATION",
    question: "Can I earn CPD/CPE credits?",
    answer:
      "Yes, CSOAI courses and certifications are accredited for continuing professional development (CPD) and continuing professional education (CPE) credits in many jurisdictions. The number of credits varies by course and professional body. Check with your professional organization or certification body to confirm eligibility for specific credits.",
    tags: ["certification", "cpd", "credits"],
  },
  {
    category: "TRAINING & CERTIFICATION",
    question: "What is the CEASAI certification?",
    answer:
      "The Certified EU AI Act Specialist (CEASAI) certification demonstrates expertise in implementing and auditing compliance with the EU AI Act. It covers risk classification, conformity assessment, documentation requirements, high-risk system governance, and incident reporting. CEASAI holders are qualified to lead compliance programs and conduct EU AI Act audits.",
    tags: ["certification", "eu-ai-act"],
  },
  {
    category: "TRAINING & CERTIFICATION",
    question: "How do I verify a certificate?",
    answer:
      "All CSOAI certificates are digitally verifiable. Recipients get a unique certificate URL they can share with employers. Employers can verify authenticity through our public verification portal without needing to contact CSOAI directly. This ensures certificates cannot be counterfeited while maintaining privacy.",
    tags: ["certification", "verification"],
  },

  // WATCHDOG PROGRAM
  {
    category: "WATCHDOG PROGRAM",
    question: "What is the Watchdog program?",
    answer:
      "The Watchdog program is CSOAI's global network of trained AI safety analysts who monitor, audit, and report on AI systems. Watchdogs earn income analyzing AI incidents, conducting audits, and providing expert reports. The program creates meaningful employment while building critical AI safety capacity worldwide.",
    tags: ["watchdog", "program"],
  },
  {
    category: "WATCHDOG PROGRAM",
    question: "How do I become a Watchdog analyst?",
    answer:
      "To become a Watchdog analyst: (1) Complete CSOAI's free Watchdog training program, (2) Pass the certification exam demonstrating AI governance knowledge, (3) Complete a probationary period with supervised case reviews, and (4) Earn active analyst status. No prior degree required—just commitment to AI safety and willingness to learn. Training typically takes 4-8 weeks.",
    tags: ["watchdog", "getting-started"],
  },
  {
    category: "WATCHDOG PROGRAM",
    question: "How are Watchdog analysts paid?",
    answer:
      "Watchdog analysts earn on a per-incident and per-audit basis. Compensation ranges from $50-500+ per assignment depending on complexity, time required, and experience level. Experienced analysts can earn $3,000-8,000+ monthly. Some analysts work full-time on CSOAI; others supplement existing income. CSOAI also offers performance bonuses for high-quality work and referrals.",
    tags: ["watchdog", "compensation"],
  },
  {
    category: "WATCHDOG PROGRAM",
    question: "What types of incidents can be reported?",
    answer:
      "Watchdogs analyze and report on: (1) AI bias and discrimination incidents, (2) Privacy and data security breaches, (3) Model failures or unexpected outputs, (4) Transparency and explainability issues, (5) Unauthorized uses of AI systems, (6) Safety failures in high-risk domains, (7) Regulatory compliance violations, and (8) Emerging AI safety risks. Organizations and individuals can report incidents through CSOAI's platform.",
    tags: ["watchdog", "incidents"],
  },
  {
    category: "WATCHDOG PROGRAM",
    question: "How does the scoring system work?",
    answer:
      "CSOAI's scoring system rates incident severity (1-10 scale), jurisdiction relevance, and complexity. Analyst earnings reflect these factors: simple bias reports in major jurisdictions earn more than marginal issues. The system rewards thorough, actionable analysis. Analysts building strong track records with high-quality findings can take on premium assignments with higher compensation.",
    tags: ["watchdog", "scoring"],
  },
  {
    category: "WATCHDOG PROGRAM",
    question: "Can organizations hire Watchdog analysts?",
    answer:
      "Yes, enterprises can hire Watchdog analysts directly through CSOAI for custom audits, incident investigations, and ongoing monitoring. This provides organizations access to trained, vetted safety professionals. CSOAI manages contractor relationships while analysts maintain independence and can work with multiple clients.",
    tags: ["watchdog", "enterprise"],
  },

  // ENTERPRISE
  {
    category: "ENTERPRISE",
    question: "What enterprise features does CSOAI offer?",
    answer:
      "Enterprise features include: (1) Unlimited AI system audits and monitoring, (2) Custom governance framework implementation, (3) Multi-framework compliance tracking, (4) Dedicated security and performance teams, (5) API access and custom integrations, (6) Role-based access control and advanced reporting, (7) Priority incident response, (8) Executive dashboards, and (9) Quarterly strategic reviews with CSOAI experts.",
    tags: ["enterprise", "features"],
  },
  {
    category: "ENTERPRISE",
    question: "How does CSOAI integrate with existing systems?",
    answer:
      "CSOAI provides: (1) REST and GraphQL APIs for deep system integration, (2) Pre-built connectors for Kubernetes, cloud providers, and MLOps platforms, (3) Webhook support for real-time incident notifications, (4) Data export in standard formats, (5) Custom integration services for complex environments, and (6) Sandbox environments for testing integrations. Enterprise customers get dedicated integration support.",
    tags: ["enterprise", "integration", "technical"],
  },
  {
    category: "ENTERPRISE",
    question: "What support levels are available?",
    answer:
      "CSOAI offers tiered support: (1) Standard: business hours support, (2) Professional: business hours with guaranteed response times, (3) Premium: 24/7 support with dedicated technical account manager, and (4) Enterprise: white-glove service including on-site support, strategic consulting, and escalation to CSOAI executives. Response times range from 4 hours to 15 minutes depending on tier.",
    tags: ["enterprise", "support"],
  },
  {
    category: "ENTERPRISE",
    question: "How does multi-framework compliance work?",
    answer:
      "CSOAI's compliance engine supports simultaneous compliance with multiple frameworks (EU AI Act, NIST, ISO 42001, regional regulations, etc.). The platform: (1) Maps requirements across frameworks, (2) Identifies overlapping controls, (3) Flags conflicting requirements, (4) Tracks compliance status for each framework separately, and (5) Generates framework-specific audit reports. This eliminates duplicate work and reduces compliance costs.",
    tags: ["enterprise", "compliance"],
  },
  {
    category: "ENTERPRISE",
    question: "Can CSOAI be deployed on-premise?",
    answer:
      "Yes, CSOAI offers on-premise deployment options for enterprises requiring data residency, strict security controls, or regulatory mandates. Options include: (1) Private cloud deployment in your AWS/Azure account, (2) Dedicated on-premise servers, and (3) Hybrid deployments with some services on-premise and others cloud-based. On-premise deployments include support and maintenance.",
    tags: ["enterprise", "deployment"],
  },
  {
    category: "ENTERPRISE",
    question: "What is the enterprise pricing model?",
    answer:
      "Enterprise pricing is customized based on: (1) Number of AI systems monitored, (2) Geographic coverage and compliance requirements, (3) Support level selected, (4) Integration complexity, (5) Data storage and processing volume, and (6) Professional services needed. Most enterprise customers spend $10,000-100,000+ annually depending on scale. We'll conduct a needs assessment to provide accurate pricing.",
    tags: ["enterprise", "pricing"],
  },

  // TECHNICAL
  {
    category: "TECHNICAL",
    question: "What is the CSOAI API?",
    answer:
      "CSOAI's API provides programmatic access to governance tools, audit systems, and monitoring capabilities. The REST API allows you to: (1) Register and manage AI systems, (2) Run compliance assessments, (3) Submit incident reports, (4) Retrieve audit results and compliance status, (5) Configure monitoring parameters, and (6) Integrate with external tools. Full API documentation and SDKs are available.",
    tags: ["technical", "api"],
  },
  {
    category: "TECHNICAL",
    question: "How does the 33-Agent Byzantine consensus work?",
    answer:
      "The 33-Agent Council uses Byzantine Fault Tolerant (BFT) consensus where 33 specialized AI agents vote on decisions (risk classification, compliance status, etc.). If up to 10 agents malfunction or provide incorrect information, the council can still reach correct consensus with mathematical certainty. Decisions require approval from at least 23 agents (67%), ensuring robust, reliable governance outcomes.",
    tags: ["technical", "council"],
  },
  {
    category: "TECHNICAL",
    question: "What security measures does CSOAI have?",
    answer:
      "CSOAI implements: (1) End-to-end encryption for all data, (2) Regular penetration testing and security audits, (3) ISO 27001 certification, (4) Multi-factor authentication for all accounts, (5) Role-based access control, (6) Audit logs for all activities, (7) DDoS protection and WAF, (8) Secure API endpoints with rate limiting, and (9) Regular security updates. We undergo independent security assessments quarterly.",
    tags: ["technical", "security"],
  },
  {
    category: "TECHNICAL",
    question: "How is my data protected?",
    answer:
      "CSOAI protects your data through: (1) Encryption at rest (AES-256) and in transit (TLS 1.3), (2) Geographic redundancy with replicated backup systems, (3) Strict access controls limiting who can access your data, (4) Regular automated backups with tested recovery procedures, (5) Compliance with GDPR, CCPA, and other privacy regulations, (6) Transparency reports on data access, and (7) Right to export or delete your data.",
    tags: ["technical", "security", "privacy"],
  },
  {
    category: "TECHNICAL",
    question: "What browsers are supported?",
    answer:
      "CSOAI supports all modern browsers: Chrome/Chromium (latest), Firefox (latest), Safari (latest), and Edge (latest). We recommend using the latest versions for best performance and security. Mobile browsers (Chrome Mobile, Safari iOS) are also fully supported for responsive access.",
    tags: ["technical", "browser"],
  },
  {
    category: "TECHNICAL",
    question: "Does CSOAI support SSO?",
    answer:
      "Yes, CSOAI supports enterprise SSO through: (1) SAML 2.0 for corporate identity providers, (2) OAuth 2.0 for social and third-party providers, (3) OIDC for modern identity platforms, and (4) LDAP/Active Directory for on-premise environments. SSO setup is included in enterprise plans and managed by our implementation team.",
    tags: ["technical", "authentication"],
  },
];

type CategoryType =
  | "GENERAL"
  | "AI GOVERNANCE"
  | "COMPLIANCE & REGULATIONS"
  | "TRAINING & CERTIFICATION"
  | "WATCHDOG PROGRAM"
  | "ENTERPRISE"
  | "TECHNICAL";

const categories: CategoryType[] = [
  "GENERAL",
  "AI GOVERNANCE",
  "COMPLIANCE & REGULATIONS",
  "TRAINING & CERTIFICATION",
  "WATCHDOG PROGRAM",
  "ENTERPRISE",
  "TECHNICAL",
];

export default function FAQ() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(
    new Set()
  );
  const [selectedCategories, setSelectedCategories] = useState<
    Set<CategoryType>
  >(new Set(categories));

  const filteredFAQ = useMemo(() => {
    return faqData.filter((item) => {
      const matchesSearch =
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.tags && item.tags.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        ));

      const matchesCategory = selectedCategories.has(
        item.category as CategoryType
      );

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategories]);

  const toggleCategory = (category: CategoryType) => {
    const newCategories = new Set(selectedCategories);
    if (newCategories.has(category)) {
      newCategories.delete(category);
    } else {
      newCategories.add(category);
    }
    setSelectedCategories(newCategories);
  };

  const toggleItem = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 text-white py-20">
        <div className="container max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Frequently Asked Questions
            </h1>
            <p className="text-xl text-gray-300">
              Get answers to common questions about CSOAI, AI governance, compliance, and certifications.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by question, topic, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 py-3 bg-white/10 border-white/20 text-white placeholder-gray-400"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-5xl py-16">
        {/* Category Filters */}
        <div className="mb-12">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            Filter by Category
          </h3>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => toggleCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategories.has(category)
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* FAQ Items */}
        {filteredFAQ.length > 0 ? (
          <div className="space-y-4">
            {filteredFAQ.map((item, index) => {
              const itemId = `${item.category}-${index}`;
              const isExpanded = expandedItems.has(itemId);

              return (
                <Card
                  key={itemId}
                  className="border border-gray-200 hover:border-emerald-300 transition-all"
                >
                  <button
                    onClick={() => toggleItem(itemId)}
                    className="w-full px-6 py-4 text-left flex items-start justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">
                          {item.category}
                        </Badge>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 text-left">
                        {item.question}
                      </h3>
                    </div>
                    <ChevronDown
                      className={`h-5 w-5 text-gray-600 mt-1 flex-shrink-0 transition-transform ${
                        isExpanded ? "transform rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isExpanded && (
                    <div className="px-6 pb-6 border-t border-gray-200 bg-gray-50">
                      <p className="text-gray-700 leading-relaxed mb-4">
                        {item.answer}
                      </p>
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
                          {item.tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="text-xs"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No questions found
            </h3>
            <p className="text-gray-600">
              Try adjusting your search or selecting different categories.
            </p>
          </Card>
        )}

        {/* Results Count */}
        <div className="mt-8 text-center text-sm text-gray-600">
          Showing {filteredFAQ.length} of {faqData.length} questions
        </div>

        {/* Contact Section */}
        <div className="mt-20 bg-gradient-to-br from-emerald-50 to-blue-50 rounded-2xl p-12 border border-emerald-200">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            Still have questions?
          </h2>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="p-6 text-center border-none shadow-sm hover:shadow-md transition-shadow">
              <MessageCircle className="h-8 w-8 text-emerald-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Live Chat</h3>
              <p className="text-sm text-gray-600 mb-4">
                Chat with our support team in real-time
              </p>
              <Button variant="outline" className="w-full">
                Start Chat
              </Button>
            </Card>

            <Card className="p-6 text-center border-none shadow-sm hover:shadow-md transition-shadow">
              <Mail className="h-8 w-8 text-emerald-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Email</h3>
              <p className="text-sm text-gray-600 mb-4">
                support@csoai.org - Typically responds in 2-4 hours
              </p>
              <Button variant="outline" className="w-full">
                Send Email
              </Button>
            </Card>

            <Card className="p-6 text-center border-none shadow-sm hover:shadow-md transition-shadow">
              <Phone className="h-8 w-8 text-emerald-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">
                Schedule a Call
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Book time with an expert for personalized help
              </p>
              <Button variant="outline" className="w-full">
                Schedule Now
              </Button>
            </Card>
          </div>

          <div className="text-center">
            <p className="text-gray-600 mb-4">
              Enterprise customers have 24/7 support available
            </p>
            <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700">
              View Support Plans
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
