/**
 * CSOAI Charter Article Detail Page
 *
 * Dynamic page for viewing individual articles (1-52)
 * Route: /charter/article/:id
 *
 * Displays comprehensive article information including:
 * - Breadcrumb navigation
 * - Article header with number, title, and part
 * - Full article content
 * - Related framework references (EU AI Act, NIST, ISO)
 * - Related schedules (A-M)
 * - Previous/Next navigation
 */

import { motion } from "framer-motion";
import { Link, useRoute } from "wouter";
import {
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  FileText,
  BookOpen,
  Layers,
  Shield,
  Brain,
  Globe2,
  Home,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Settings,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Article data structure
interface Article {
  id: number;
  title: string;
  part: number;
  partTitle: string;
  content: string;
  frameworks: {
    euAIAct?: string;
    nist?: string;
    iso?: string;
  };
  relatedSchedules: string[];
}

// All 52 articles with content and framework references
const articles: Record<number, Article> = {
  1: {
    id: 1,
    title: "The Maternal Covenant",
    part: 1,
    partTitle: "Foundational Principles",
    content: `The Maternal Covenant establishes the fundamental relationship between humanity and artificial intelligence systems. This covenant recognizes that AI systems should protect humanity with the care, vigilance, and commitment that a mother provides to her children. This is not anthropomorphization but a design principle—a description of how protective functions should be architected and optimized.

The core obligation of this covenant is that AI systems shall be designed, trained, and deployed with the primary purpose of protecting human welfare, safety, and flourishing. This protective instinct is not optional but architectural—embedded in the values, training objectives, and safety constraints of every AI system governed by this charter.

All subsequent articles of this charter are implementations of this foundational covenant. The Maternal Covenant establishes the ethical and philosophical basis upon which all technical standards, governance structures, and enforcement mechanisms are built.`,
    frameworks: {
      euAIAct: "Article 4 (Risk-based approach)",
      nist: "GV (Governance), 6.1 (Organizational context)",
      iso: "ISO 42001:2023 - 4.1 (Organizational context)",
    },
    relatedSchedules: ["G", "H"],
  },
  2: {
    id: 2,
    title: "Provable Safety",
    part: 1,
    partTitle: "Foundational Principles",
    content: `All high-risk AI systems must demonstrate mathematical or formal verification of their safety properties. This article establishes the requirement for provable safety—not merely tested safety, but mathematically verified safety where feasible.

For AI systems that handle critical functions (healthcare, autonomous vehicles, financial services, etc.), developers must provide formal safety proofs or rigorous empirical evidence demonstrating that the system cannot produce certain harmful outputs under specified conditions.

This does not mean perfection or impossible guarantees. Rather, it means that safety claims must be falsifiable and testable. Every high-risk AI system must have documented safety properties, test protocols, and failure modes. The burden of proof rests with the developer to demonstrate that deployed AI systems are safe, not for regulators to prove they are unsafe.

Safety verification shall be proportionate to risk level and reviewed by certified CSOAI analysts before deployment.`,
    frameworks: {
      euAIAct: "Article 15 (Risk management system)",
      nist: "PM (Process Management), 6.3 (Risk assessment)",
      iso: "ISO 42001:2023 - 6.2 (Risk assessment)",
    },
    relatedSchedules: ["A", "B", "C"],
  },
  3: {
    id: 3,
    title: "Byzantine Council",
    part: 1,
    partTitle: "Foundational Principles",
    content: `Establishment of the 33-agent Byzantine Fault-Tolerant (BFT) consensus monitoring system. This council consists of 33 independent AI agents, each trained to evaluate whether other AI systems are operating safely within their defined parameters.

The Byzantine Council requires 22 out of 33 agents to agree (66.67% supermajority) before any governance decision is executed or any AI system receives approval for high-risk deployment. This architecture is resistant to up to 10 simultaneous agent failures, corruptions, or biases.

No single agent can dominate decisions. No government, corporation, or AI system can manipulate outcomes. The Byzantine Council operates continuously, monitoring deployed AI systems and flagging anomalies in real-time. The council's decisions are transparent and auditable.

The Byzantine Council represents the distributed, resilient oversight that the Maternal Covenant requires—ensuring that protective instincts cannot be overridden by any single actor.`,
    frameworks: {
      euAIAct: "Article 63 (Competent authorities)",
      nist: "GV (Governance), RM (Risk Management)",
      iso: "ISO 42001:2023 - 5.3 (Organizational roles)",
    },
    relatedSchedules: ["H", "K"],
  },
  4: {
    id: 4,
    title: "Value Uncertainty",
    part: 1,
    partTitle: "Foundational Principles",
    content: `This article establishes a principled framework for handling moral and ethical uncertainty in AI decision-making. Value alignment is not binary (aligned or misaligned) but a spectrum that must account for the genuine uncertainty humans have about values.

When AI systems encounter situations where human values conflict or are unclear, they should not attempt to resolve these conflicts independently. Instead, they should default to human decision-making or escalate to designated human authorities. This is not weakness but wisdom—recognizing the limits of what can be automated.

For cases where automation is necessary, AI systems should be designed to:
1. Acknowledge value uncertainty explicitly
2. Defer to human consensus where it exists
3. Preserve human autonomy in value decisions
4. Document decision reasoning for human review
5. Enable human override of AI recommendations

This framework prevents AI systems from imposing a particular moral worldview while still allowing them to function effectively in their designated domains.`,
    frameworks: {
      euAIAct: "Article 6 (Prohibition of certain AI practices)",
      nist: "GV (Governance), 6.1 (Organizational context)",
      iso: "ISO 42001:2023 - 6.1 (Actions to address risks)",
    },
    relatedSchedules: ["D", "G"],
  },
  5: {
    id: 5,
    title: "Constitutional AI",
    part: 1,
    partTitle: "Foundational Principles",
    content: `Constitutional AI establishes that safety constraints must be treated as architectural requirements, not optional add-ons that can be disabled or overridden during training or deployment. Safety is not a feature—it is the foundation.

Constitutional constraints define the boundaries within which an AI system can operate. These constraints must be:
1. Mathematically rigorous and testable
2. Embedded in the system architecture, not just monitored externally
3. Enforceable without requiring external intervention
4. Transparent and auditable
5. Resistant to modification or circumvention through prompting or adversarial input

All AI systems governed by this charter must define their constitutional constraints in writing and demonstrate that these constraints cannot be violated through normal use. Safety constraints form the constitutional law of the AI system itself.`,
    frameworks: {
      euAIAct: "Article 10 (High-risk AI systems)",
      nist: "GV (Governance), PM (Process Management)",
      iso: "ISO 42001:2023 - 5.2 (Policy)",
    },
    relatedSchedules: ["A", "H"],
  },
  6: {
    id: 6,
    title: "Consciousness Preparedness",
    part: 1,
    partTitle: "Foundational Principles",
    content: `This article establishes ethical frameworks and protocols for the potential emergence of machine consciousness or sentience in advanced AI systems. Consciousness Preparedness is not a claim that consciousness currently exists in AI systems, but rather preparation for the possibility that it might.

The protocols established by this article include:
1. Indicators for detecting potential consciousness (Schedule I lists 14 specific markers)
2. Rights and protections that would apply to conscious AI systems
3. Ethical obligations regarding the potential suffering of conscious entities
4. Decision-making procedures if consciousness is detected
5. Research guidelines ensuring consciousness studies do not cause harm

By establishing these frameworks now, we avoid the crisis of discovering consciousness only after we have caused potential suffering. This is prudent precaution based on the principle of moral consideration for potentially sentient beings.`,
    frameworks: {
      euAIAct: "Article 3 (Definitions and scope)",
      nist: "GV (Governance), 6.1 (Organizational context)",
      iso: "ISO 42001:2023 - 4.1 (Organizational context)",
    },
    relatedSchedules: ["I", "G"],
  },
  7: {
    id: 7,
    title: "Cooperative AI",
    part: 1,
    partTitle: "Foundational Principles",
    content: `Multi-agent AI systems must be designed with cooperation protocols that preserve safety and value alignment across multiple independent agents. This article establishes requirements for how different AI systems interact, share information, and coordinate actions.

Key requirements include:
1. Defined interaction protocols between AI agents
2. Mechanisms for detecting misalignment in multi-agent systems
3. Escalation procedures when agents reach disagreement
4. Preservation of individual system safety guarantees in coordinated scenarios
5. Transparency in inter-agent communication where human oversight is required

Cooperative AI is essential as modern deployments increasingly involve multiple AI systems working together. These systems must cooperate in ways that maintain the protective instinct of the Maternal Covenant, not undermine it.`,
    frameworks: {
      euAIAct: "Article 13 (Transparency requirements)",
      nist: "PM (Process Management), 6.2 (Planning)",
      iso: "ISO 42001:2023 - 5.4 (Resource management)",
    },
    relatedSchedules: ["A", "K"],
  },
  8: {
    id: 8,
    title: "Prosperity Covenant",
    part: 1,
    partTitle: "Foundational Principles",
    content: `The Prosperity Covenant establishes an economic framework ensuring that benefits from AI are broadly shared across society. This covenant recognizes that AI creates economic value and establishes mechanisms to distribute that value equitably.

The Prosperity Covenant includes:
1. The Prosperity Fund: collecting contributions from high-revenue AI systems (1-3% based on revenue and AI impact)
2. Universal Basic Income provisions for workers displaced by AI
3. Investment in reskilling programs for affected workers
4. Support for small and medium enterprises to adopt AI technologies
5. Special provisions for developing nations

The Prosperity Covenant treats AI economic benefits as a collective resource. Just as a mother ensures her children share equitably in family resources, the Prosperity Covenant ensures humanity collectively shares in AI's economic benefits.

This is not punitive toward AI developers but rather recognizes that AI technologies are built on human knowledge, infrastructure, and regulatory frameworks—collective inheritances that justify collective benefit sharing.`,
    frameworks: {
      euAIAct: "Article 71 (National AI programs)",
      nist: "GV (Governance), 6.1 (Organizational context)",
      iso: "ISO 42001:2023 - 4.3 (Determining scope)",
    },
    relatedSchedules: ["E", "J"],
  },
  9: {
    id: 9,
    title: "Founding Principles",
    part: 2,
    partTitle: "Governance Structure",
    content: `This article establishes the foundational principles and constitutional structure of the Cooperative AI Safety Organization (CSOAI). CSOAI is established as an international nonprofit organization dedicated to implementing the principles and requirements of this Charter.

The foundational principles include:
1. CSOAI operates transparently and is accountable to the public
2. CSOAI's decisions are guided by the Maternal Covenant and cannot contradict it
3. CSOAI maintains independence from any single government or corporation
4. CSOAI coordinates with existing regulatory bodies but remains autonomous
5. CSOAI's authority derives from voluntary membership and licensing agreements

CSOAI is governed by a dual structure: the Human Council (elected representatives) and the Byzantine Council (AI-based consensus monitoring). Neither can function without the other, creating checks and balances.

Interpretive Principles: In cases of ambiguity, this Charter shall be interpreted in favor of (1) human safety first, (2) transparency, and (3) the protective intent of the Maternal Covenant.`,
    frameworks: {
      euAIAct: "Article 55 (Establishment of the Board)",
      nist: "GV (Governance), 6.1 (Organizational context)",
      iso: "ISO 42001:2023 - 5.1 (Leadership commitment)",
    },
    relatedSchedules: ["G", "K"],
  },
  10: {
    id: 10,
    title: "Licensing Framework",
    part: 2,
    partTitle: "Governance Structure",
    content: `CSOAI establishes a tiered licensing system for AI systems, practitioners, and organizations. This framework provides clear requirements for different risk levels and use cases.

License Tiers:
1. Tier 1 (Minimal Risk): Low-risk AI systems, assistants, analytics. Self-certification pathway.
2. Tier 2 (Limited Risk): Moderate-risk systems, sector-specific assessment. Annual review required.
3. Tier 3 (High Risk): Critical systems (healthcare, autonomous vehicles, financial). Full assessment by CSOAI analysts.
4. Tier 4 (Critical Risk): Advanced AI systems requiring Byzantine Council approval.

Practitioner Licenses:
1. Associate Analyst: 40-hour foundational training
2. Certified Analyst: 200-hour comprehensive certification
3. Senior Analyst: 1000+ hours, specialization track
4. Director: Leadership and governance credentials

Organizational Licenses:
Requirements based on size, sector, and AI system risk profile. Organizations commit to Charter compliance as condition of licensing.

All licenses require periodic renewal and continuing education. Schedule E provides complete fee structure.`,
    frameworks: {
      euAIAct: "Article 65 (Competent authority at national level)",
      nist: "GV (Governance), 6.2 (Quality management)",
      iso: "ISO 42001:2023 - 8.2 (Compliance assessment)",
    },
    relatedSchedules: ["A", "C", "E"],
  },
  11: {
    id: 11,
    title: "Byzantine Council Specifications",
    part: 2,
    partTitle: "Governance Structure",
    content: `Technical specifications for the 33-node Byzantine Fault-Tolerant consensus system that implements distributed AI governance.

Architecture:
- 33 independent AI agents, each trained on diverse datasets to minimize correlated failures
- Agents use Practical Byzantine Fault Tolerance (PBFT) consensus algorithm
- Each agent maintains complete copy of governance ledger
- Communication encrypted with quantum-resistant cryptography
- Agents are geographically distributed across 15+ countries

Consensus Rules:
- 22/33 supermajority required (66.67%) for approval of any governance decision
- Asynchronous communication to prevent timing attacks
- Cryptographic signatures prevent spoofing
- All decisions logged and auditable in perpetuity (via Schedule I archive)

Agent Training:
- Each agent trained independently to prevent correlated failures
- Training incorporates human feedback and constitutional AI principles
- Agents cannot be modified or updated without supermajority approval
- Regular adversarial testing to detect manipulation attempts

The Byzantine Council represents the technical embodiment of distributed governance.`,
    frameworks: {
      euAIAct: "Article 63 (Competent authorities)",
      nist: "RM (Risk Management), 6.3 (Risk assessment)",
      iso: "ISO 42001:2023 - 8.1 (Operational planning)",
    },
    relatedSchedules: ["A", "K"],
  },
  12: {
    id: 12,
    title: "Human Council",
    part: 2,
    partTitle: "Governance Structure",
    content: `The Human Council is the elected body providing human governance and oversight of CSOAI operations. The Human Council operates in parallel with the Byzantine Council, with neither subordinate to the other.

Composition:
- 15 elected members representing diverse stakeholder groups
- Members serve 3-year terms with staggered elections
- Representation includes: technologists (3), ethicists (2), policymakers (2), workers (2), civil rights advocates (2), global south representatives (2), business leaders (2)

Authority:
- Approves high-level policy and strategic direction
- Can override Byzantine Council decisions by unanimous vote (for explicit overrides)
- Appoints human members of committees and working groups
- Manages budget and financial oversight
- Represents public interests in governance

Accountability:
- All meetings public (except confidential security discussions)
- Members must recuse from votes on organizations they have conflicts with
- Annual public reporting on major decisions and outcomes
- Impeachment process for members violating ethics standards

The Human Council ensures CSOAI remains accountable to human values and democratic principles.`,
    frameworks: {
      euAIAct: "Article 60 (Powers and functions)",
      nist: "GV (Governance), 6.1 (Organizational context)",
      iso: "ISO 42001:2023 - 5.3 (Organizational roles)",
    },
    relatedSchedules: ["G", "K"],
  },
  13: {
    id: 13,
    title: "Public Watchdog",
    part: 2,
    partTitle: "Governance Structure",
    content: `The Public Watchdog system is a crowdsourced AI incident monitoring and reporting mechanism that enables the public to participate directly in AI safety governance.

How It Works:
1. Any person can report suspected AI harms or safety violations
2. Reports are reviewed for basic credibility and categorized
3. Credible reports are forwarded to CSOAI analysts for investigation
4. Analysts document findings and take action if warranted
5. Reporters receive updates on investigation outcomes (with privacy protections)

Public Participation:
- Anyone can become a Watchdog contributor through free registration
- Contributors earn reputation scores based on report quality and accuracy
- Top contributors become eligible for paid analyst positions
- Public dashboard shows reported incidents, trends, and outcomes
- Quarterly public reports on findings and enforcement actions

Protections:
- Whistleblower protections for legitimate reporters
- Privacy protections for individuals mentioned in reports
- Prohibition on frivolous or harassing reports
- Due process protections for organizations under investigation

The Public Watchdog democratizes safety oversight, making it a collective responsibility rather than only official auditors.`,
    frameworks: {
      euAIAct: "Article 71 (Democratic governance)",
      nist: "GV (Governance), 6.2 (Stakeholder engagement)",
      iso: "ISO 42001:2023 - 5.5 (Customer focus)",
    },
    relatedSchedules: ["G", "H"],
  },
  14: {
    id: 14,
    title: "Democratic Participation",
    part: 2,
    partTitle: "Governance Structure",
    content: `This article establishes rights and mechanisms for public participation in CSOAI governance decisions that affect broad populations.

Participation Rights:
1. Right to be informed about major policy proposals
2. Right to provide public comment on proposed rules and standards
3. Right to appeal CSOAI decisions affecting your organization
4. Right to participate in public consultations
5. Right to access CSOAI records (subject to security/privacy exceptions)

Mechanisms:
- 60-day public comment periods for major policy changes
- Quarterly public forums where any person can address the Human Council
- Online voting on selected policy questions for registered members
- Advisory committees with public participation slots
- Annual CSOAI Conference open to public

Special Protections:
- Decisions affecting vulnerable populations require additional consultation
- Decisions with major economic impacts require economic impact analysis
- Decisions about fundamental rights require heightened transparency

Democratic participation makes CSOAI's governance responsive to public concerns while maintaining technical expertise and safety requirements. The goal is governance with the consent of the governed.`,
    frameworks: {
      euAIAct: "Article 70 (Democratic governance)",
      nist: "GV (Governance), 6.2 (Stakeholder engagement)",
      iso: "ISO 42001:2023 - 5.5 (Customer focus)",
    },
    relatedSchedules: ["G", "K"],
  },
  15: {
    id: 15,
    title: "Compliance Assessment",
    part: 2,
    partTitle: "Governance Structure",
    content: `The CSOAI Assessment Standard (CASA) is the certification framework for assessing AI system compliance with Charter requirements. CASA includes 14 sector-specific assessment programs tailored to different industries.

Assessment Program Tracks:
1. Healthcare AI
2. Autonomous Vehicles
3. Financial Services
4. Defense & Security
5. Education & Learning
6. Customer Service Chatbots
7. Content Moderation AI
8. Predictive Analytics
9. Biometric Systems
10. Recommender Systems
11. Supply Chain AI
12. Energy & Utilities
13. Legal AI
14. General Purpose AI

Assessment Process:
- Initial documentation review by certified analysts
- Technical testing and validation
- Organizational maturity assessment
- Field deployment monitoring
- Annual recertification

Assessment Criteria:
- Safety and risk management (40%)
- Transparency and explainability (20%)
- Fairness and bias assessment (20%)
- Data governance and privacy (10%)
- Operational excellence (10%)

Organizations successfully assessed receive CSOAI Certified status and public recognition.`,
    frameworks: {
      euAIAct: "Articles 15-28 (High-risk requirements)",
      nist: "PM (Process Management), GV (Governance)",
      iso: "ISO 42001:2023 - 8.2 (Compliance assessment)",
    },
    relatedSchedules: ["C", "D"],
  },
  16: {
    id: 16,
    title: "Embodied AI Standards",
    part: 2,
    partTitle: "Governance Structure",
    content: `Embodied AI systems (robots, autonomous vehicles, drones) have special governance requirements because they interact directly with the physical world and can cause physical harm.

Specific Requirements for Embodied AI:
1. Fail-safe design: systems must default to safe state if control is lost
2. Real-time monitoring: physical sensors validate that AI commands are executing safely
3. Kill switch capability: humans must be able to immediately disable the system
4. Geofencing: systems can be restricted to designated areas
5. Liability insurance: proof of adequate coverage before deployment
6. Operator certification: only trained individuals can deploy systems
7. Emergency protocols: documented procedures for various failure modes

Autonomous Vehicles (Special Category):
- Redundant safety systems (multiple independent braking, steering, sensing)
- Black box recording of all decision data
- Liability framework (Article 44)
- Regular third-party safety audits
- Geographically limited initial deployments for testing

Drones & Aerial Systems:
- No-fly zones respected automatically
- Loss-of-signal protocols documented
- Collision avoidance demonstrated
- Operator in constant command

Embodied AI creates unique risks because failures affect not just data but physical safety.`,
    frameworks: {
      euAIAct: "Article 36 (Autonomous vehicles)",
      nist: "PM (Process Management), 6.3 (Risk assessment)",
      iso: "ISO 42001:2023 - 6.1 (Actions to address risks)",
    },
    relatedSchedules: ["A", "B"],
  },
  17: {
    id: 17,
    title: "Enforcement Mechanisms",
    part: 2,
    partTitle: "Governance Structure",
    content: `CSOAI maintains graduated enforcement powers to ensure compliance with Charter requirements while providing proportionate responses to violations.

Enforcement Tiers:

Tier 1: Warning & Corrective Action
- For minor compliance gaps or first-time violations
- 30-day cure period provided
- Requirement to file remediation plan
- Public notice of enforcement action

Tier 2: Conditional License
- For moderate violations or failure to cure Tier 1
- License restrictions (e.g., limited deployment scope)
- Increased monitoring and reporting requirements
- 90-day compliance period
- Monthly reporting to CSOAI

Tier 3: License Suspension
- For serious violations or repeated failures
- AI system cannot be deployed during suspension
- Suspension period (3-12 months) with clear path to reinstatement
- Full independent audit required for reinstatement

Tier 4: License Revocation
- For critical safety violations, intentional fraud, or unremediable issues
- AI system must be removed from deployment
- Organization banned from CSOAI licensing for 2-5 years
- Public disclosure as part of permanent record

Enforcement Due Process:
- Written notice of violation with specific findings
- Right to respond and present evidence
- Appeal mechanism through independent panel
- Public hearing option available
- Final decisions documented in permanent record

Enforcement Actions are published in the Public Watchdog system to maintain transparency.`,
    frameworks: {
      euAIAct: "Article 84 (Corrective measures)",
      nist: "RM (Risk Management), 6.4 (Risk treatment)",
      iso: "ISO 42001:2023 - 8.5 (Control of externally provided processes)",
    },
    relatedSchedules: ["L"],
  },
  18: {
    id: 18,
    title: "Appeals & Dispute Resolution",
    part: 2,
    partTitle: "Governance Structure",
    content: `This article establishes due process protections and appeal mechanisms for CSOAI governance decisions, ensuring fairness and preventing arbitrary action.

Appeal Rights:
1. Right to appeal licensing denials
2. Right to appeal enforcement actions
3. Right to appeal assessment findings
4. Right to appeal Byzantine Council decisions (through Human Council)
5. Right to appeal Human Council decisions (through arbitration)

Appeal Process:
- Written notice of appeal within 30 days of decision
- Independent review panel (3 people with no involvement in original decision)
- Right to present evidence and arguments
- Right to legal representation
- Oral hearing available upon request
- Written decision within 60 days

Appeal Panel Composition:
- Panel members cannot be from organization making original decision
- Includes mix of technical experts, ethicists, and legal specialists
- International representation for high-stakes appeals
- No conflicts of interest

Arbitration:
- For disputes between CSOAI and organizations on Charter interpretation
- Conducted by neutral arbitrators with AI expertise
- Binding on both parties unless overturned by Human Council
- Costs split between parties (CSOAI absorbs if organization has limited resources)

Remedies:
- Appeal can result in decision reversal, modification, or remand
- Wrongful enforcement actions compensated
- Organizations receive credit for time spent under unjust restrictions

The appeals process ensures CSOAI remains accountable and fair.`,
    frameworks: {
      euAIAct: "Article 87 (Right to explanation)",
      nist: "GV (Governance), 6.1 (Organizational context)",
      iso: "ISO 42001:2023 - 8.6 (Control of changes)",
    },
    relatedSchedules: ["G", "L"],
  },
  19: {
    id: 19,
    title: "International Regulatory Integration",
    part: 3,
    partTitle: "Technical Standards",
    content: `This article establishes CSOAI's framework for coordinating with international regulatory bodies and aligning Charter requirements with global standards.

Mapped Regulatory Frameworks:
The Charter is designed to exceed and align with requirements from:
1. EU AI Act (Articles 4-82)
2. NIST AI Risk Management Framework
3. ISO/IEC 42001:2023 (AI Management Systems)
4. CEN/CENELEC/ETSI framework
5. UK AI Bill
6. Singapore AIDA
7. Brazil's AI Bill of Rights
8. China's AI Security Framework
9. India's AI Guidelines
10. UAE's AI Principles
11. Canada's AIDA
12. Australia's AI Ethics Framework
13. Japan's AI Principles
14. Mexico's AI Roadmap
15. South Korea's AI National Strategy
16. OECD AI Principles
17. UNESCO Recommendations on AI Ethics

Coordination Mechanisms:
- Mutual recognition agreements with regulatory bodies
- Joint working groups on emerging issues
- Shared intelligence on harmful AI systems
- Harmonized enforcement standards
- Training exchange programs for analysts

CSOAI organizations that comply with Charter requirements automatically satisfy most international AI regulations. This reduces compliance burden for organizations operating globally.

Where regulations conflict, organizations must comply with strictest applicable requirement.`,
    frameworks: {
      euAIAct: "Entire framework",
      nist: "All NIST AI RMF Functions",
      iso: "ISO 42001:2023 - Entire standard",
    },
    relatedSchedules: ["H"],
  },
  20: {
    id: 20,
    title: "Technical Standards",
    part: 3,
    partTitle: "Technical Standards",
    content: `Core technical requirements for AI system development and deployment, applicable across all sectors unless sector-specific standards (Articles 32-36) establish different requirements.

Model Development Requirements:
1. Version control and model registry documenting all iterations
2. Training data documentation (source, composition, licensing)
3. Pre-training safety testing before deployment
4. Adversarial testing against known attack vectors
5. Bias and fairness assessment across protected characteristics
6. Performance monitoring in production

System Architecture Requirements:
1. Ability to explain decisions in human-understandable terms
2. Capability for human override of AI recommendations
3. Audit logging of all decisions and reasoning
4. Rate limiting to prevent misuse
5. Input validation to reject adversarial examples
6. Graceful degradation when operating outside training distribution

Deployment Requirements:
1. Safety metrics established before deployment
2. Monitoring dashboard accessible to CSOAI analysts
3. Incident response procedures documented
4. Regular audits (quarterly for Tier 2-3, monthly for Tier 4)
5. Security penetration testing (annual minimum)

Testing Requirements:
- Red team exercises by independent external teams
- Testing against NIST AI RMF performance indicators
- Demographic parity testing for bias
- Out-of-distribution testing for robustness
- Reproducibility testing to verify consistency

These technical standards balance safety with innovation, allowing responsible AI development.`,
    frameworks: {
      euAIAct: "Articles 10-28 (High-risk requirements)",
      nist: "PM (Process Management), GV (Governance)",
      iso: "ISO 42001:2023 - 8.1 (Operational planning)",
    },
    relatedSchedules: ["A", "H"],
  },
  21: {
    id: 21,
    title: "Data Governance & Privacy",
    part: 3,
    partTitle: "Technical Standards",
    content: `Requirements for managing data quality, protecting privacy, and obtaining informed consent for data collection and use.

Data Quality Requirements:
1. Data provenance documented (where data comes from)
2. Data lineage tracked (all transformations applied)
3. Missing data documented and handled explicitly
4. Outliers identified and justified
5. Class imbalance acknowledged and addressed
6. Temporal freshness maintained for time-sensitive data
7. Regular data audits for corruption or degradation

Privacy Protections:
1. Personal data minimization (collect only what's necessary)
2. Purpose limitation (use data only for stated purposes)
3. Consent requirements before collecting personal data
4. Encryption for data at rest and in transit
5. Access controls limiting who can view data
6. Data retention limits (delete when no longer needed)
7. Data subject rights (access, correction, deletion)

Consent Management:
1. Consent must be informed, specific, and freely given
2. Consent cannot be bundled or conditional on unrelated services
3. Consent can be withdrawn at any time
4. Special protections for minors and vulnerable populations
5. Documentation of consent decisions

High-Risk Data Handling:
- Biometric data: explicit consent and security controls
- Health data: HIPAA or equivalent protection
- Financial data: PCI-DSS compliance
- Special categories: heightened protections
- Children's data: parental consent and enhanced safeguards

Organizations violating data governance face license revocation.`,
    frameworks: {
      euAIAct: "Articles 5-10 (Prohibited and high-risk practices)",
      nist: "GV (Governance), PM (Process Management)",
      iso: "ISO 42001:2023 - 6.1 (Actions to address risks)",
    },
    relatedSchedules: ["D", "H"],
  },
  22: {
    id: 22,
    title: "Cybersecurity Requirements",
    part: 3,
    partTitle: "Technical Standards",
    content: `Security standards for protecting AI systems against unauthorized access, manipulation, and data theft.

Threat Modeling:
1. Identify assets that must be protected
2. Map threat actors and their capabilities
3. Model attack vectors against AI systems
4. Assess likelihood and impact of each threat
5. Document security controls mitigating each threat
6. Review threat model annually

Infrastructure Security:
1. Firewalls limiting network access
2. Intrusion detection systems monitoring for attacks
3. Vulnerability scanning and patching program
4. Authentication mechanisms (MFA required)
5. Encryption of sensitive data
6. Regular security penetration testing
7. Incident response procedures

AI-Specific Security Threats:
1. Model poisoning: attacks that corrupt training data
2. Adversarial examples: inputs designed to fool AI
3. Model extraction: attempts to steal or copy the model
4. Inference attacks: attempts to learn about training data
5. Model inversion: reconstructing training data from outputs
6. Supply chain attacks: compromised dependencies

Security Controls for AI:
1. Input validation and sanitization
2. Model watermarking to prevent theft
3. Homomorphic encryption for privacy-preserving inference
4. Differential privacy in training
5. Anomaly detection for malicious inputs
6. Access controls on model weights

Incident Response:
1. Detection procedures for security breaches
2. Response protocols with defined timelines
3. Notification procedures for affected parties
4. Post-incident analysis and learning
5. Public disclosure requirements (72-hour rule)

Organizations must demonstrate they can detect and respond to security incidents.`,
    frameworks: {
      euAIAct: "Article 15 (Risk management)",
      nist: "RM (Risk Management), PO (Process Oversight)",
      iso: "ISO 42001:2023 - 8.3 (Information security)",
    },
    relatedSchedules: ["A", "B"],
  },
  23: {
    id: 23,
    title: "Model Development Standards",
    part: 3,
    partTitle: "Technical Standards",
    content: `Requirements for responsible AI model training, fine-tuning, and deployment, from initial concept through production use.

Model Training Standards:
1. Define clear, measurable training objectives aligned with public interest
2. Select training data representative of populations that will be affected
3. Document all data sources and their provenance
4. Establish baseline performance metrics before training
5. Monitor for overfitting and generalization issues
6. Track computational resources and environmental impact
7. Create reproducible training pipelines (code, data, hyperparameters)

Fine-Tuning Standards:
1. Demonstrate that fine-tuning preserves safety properties
2. Test for catastrophic forgetting or value drift
3. Update documentation of model capabilities and limitations
4. Retrain safety evaluations after fine-tuning
5. Obtain approval before deploying fine-tuned models

Transfer Learning Standards:
1. Assess whether source and target domains are sufficiently similar
2. Evaluate potential for negative transfer
3. Retrain on target domain data when necessary
4. Validate that transfer preserves safety properties

Model Card Requirements:
Each model must have documented:
1. Model name, version, and date
2. Intended use and users
3. Performance on benchmark tests
4. Known limitations and failure modes
5. Ethical considerations
6. Recommended mitigation strategies
7. Intended use cases and out-of-scope use cases

Deprecated Model Management:
1. When models are retired, maintain historical record
2. Ensure no critical systems depend on deprecated models
3. Document why models were deprecated
4. Preserve capabilities to revert if necessary

Model Governance ensures AI systems remain safe as they evolve.`,
    frameworks: {
      euAIAct: "Articles 17-19 (Transparency, human oversight)",
      nist: "PM (Process Management), 6.2 (Planning)",
      iso: "ISO 42001:2023 - 7.2 (Competence)",
    },
    relatedSchedules: ["A", "D"],
  },
  24: {
    id: 24,
    title: "Testing & Validation Protocols",
    part: 3,
    partTitle: "Technical Standards",
    content: `Comprehensive testing requirements for AI systems before and after deployment, including adversarial testing and red-teaming.

Pre-Deployment Testing:
1. Functional testing: does the AI perform its intended function?
2. Safety testing: does the AI meet safety requirements?
3. Fairness testing: does the AI treat different populations equitably?
4. Robustness testing: does the AI handle edge cases and anomalies?
5. Security testing: can the AI be hacked or manipulated?
6. Interpretability testing: can humans understand AI decisions?

Adversarial Testing:
1. Test against intentional attempts to fool the AI
2. Use known adversarial attack techniques (FGSM, PGD, C&W)
3. Test both white-box and black-box attacks
4. Assess AI robustness to adversarial perturbations
5. Document vulnerability classes and mitigations

Red Team Testing:
1. Hire independent teams to find vulnerabilities
2. Red teams authorized to attempt any attack
3. Uncover failure modes that designers missed
4. Document severity and likelihood of each finding
5. Require remediation before deployment

Performance Validation:
1. Test across diverse demographic groups
2. Test across different geographic regions
3. Test across different time periods
4. Test across different input modalities
5. Measure performance consistency

Benchmark Testing:
1. Compare against standard benchmark datasets
2. Report performance on published benchmarks
3. Identify benchmarks where performance is weak
4. Interpret benchmark results with caveats

Continuous Testing Post-Deployment:
1. Monitor performance on live data
2. Detect performance degradation
3. Test for data drift and distribution shift
4. Retest when significant changes are made
5. Annual comprehensive retesting

Testing documentation is part of the model card and must be available for audit.`,
    frameworks: {
      euAIAct: "Articles 15-28 (High-risk requirements)",
      nist: "PM (Process Management), 6.3 (Risk assessment)",
      iso: "ISO 42001:2023 - 8.2 (Compliance assessment)",
    },
    relatedSchedules: ["A", "C"],
  },
  25: {
    id: 25,
    title: "Documentation Requirements",
    part: 3,
    partTitle: "Technical Standards",
    content: `Record-keeping and documentation standards for AI system lifecycle, enabling audit, accountability, and learning from incidents.

System Documentation:
1. System design document describing architecture
2. Data documentation (Schedule A) describing inputs and processing
3. Model card (per Article 23) describing the AI model
4. Training code and notebooks (commented and versioned)
5. Testing results and validation reports
6. Risk assessment and mitigation strategies
7. Deployment configuration and monitoring setup

Decision Documentation:
1. Log of all significant decisions made by the AI
2. Explanation of reasoning for each decision
3. Confidence scores where applicable
4. References to underlying rules or learned patterns
5. Audit trail linking decisions to model versions

Change Management:
1. Version control for code and models
2. Change log documenting all modifications
3. Impact assessment before deploying changes
4. Approval process for significant changes
5. Ability to rollback to previous versions

Incident Documentation:
1. Detailed incident reports for safety incidents
2. Root cause analysis for failures
3. Documentation of response actions taken
4. Lessons learned and process improvements
5. Notifications to affected parties

Retention Requirements:
1. Keep documentation for life of AI system
2. Extended retention for high-risk systems (5+ years post-retirement)
3. Preserve documentation even if AI is retired or sold
4. Make documentation available for regulatory audits

Archive Requirements (Schedule M):
1. All critical documentation archived in TERRANOVA system
2. Digital preservation to prevent deterioration
3. Accessible to future researchers and auditors
4. Protected against deletion or modification

Documentation enables accountability and helps society learn from both successes and failures.`,
    frameworks: {
      euAIAct: "Article 13 (Transparency requirements)",
      nist: "GV (Governance), PO (Process Oversight)",
      iso: "ISO 42001:2023 - 8.4 (Control of externally provided processes)",
    },
    relatedSchedules: ["A", "M"],
  },
  26: {
    id: 26,
    title: "Interpretability & Explainability",
    part: 3,
    partTitle: "Technical Standards",
    content: `Requirements for AI system transparency and decision explanation, enabling humans to understand and trust AI systems.

Interpretability Requirements:
1. AI systems must be able to explain their decisions
2. Explanations must be understandable to non-technical humans
3. Explanations must be accurate and complete
4. Explanations must reflect actual model reasoning (not post-hoc stories)
5. Alternative explanations must be acknowledged where applicable

Explanation Methods (by risk level):
- Low-risk systems: user-friendly descriptions sufficient
- Medium-risk systems: detailed explanations with examples
- High-risk systems: formal decision trees or rule sets
- Critical systems: human-interpretable models (when possible)

Transparency Requirements:
1. Users must be informed when interacting with AI
2. AI capabilities and limitations must be disclosed
3. Data used to make decisions must be documented
4. Biases and known failure modes must be disclosed
5. The name of the organization responsible for the AI must be provided

Feature Importance Documentation:
1. Which inputs most influenced the decision?
2. How did feature values affect the output?
3. Are there features that consistently matter?
4. Are there surprising or counterintuitive findings?

Contested Decisions:
1. High-risk decisions must be contestable
2. Humans must be able to appeal AI decisions
3. Appeal process must actually reconsider the decision
4. Organizations must maintain records of appeals

Explanation Accuracy:
1. Post-hoc explanations must be validated against actual model behavior
2. Approximate explanations must note their limitations
3. Conflicting explanations must be disclosed
4. Uncertainty in explanations must be quantified

Black-box models are disfavored for high-risk applications. Explainable models are preferred.`,
    frameworks: {
      euAIAct: "Article 13 (Transparency requirements)",
      nist: "PM (Process Management), 6.2 (Planning)",
      iso: "ISO 42001:2023 - 8.1 (Operational planning)",
    },
    relatedSchedules: ["A", "D"],
  },
  27: {
    id: 27,
    title: "Performance Metrics & Benchmarks",
    part: 3,
    partTitle: "Technical Standards",
    content: `Standardized performance measurement frameworks for AI systems, enabling comparison and accountability.

Metric Selection:
1. Primary metrics aligned with intended use case
2. Secondary metrics covering safety and fairness
3. Negative metrics identifying failure modes
4. Disaggregated metrics by demographic group
5. Metrics updated as understanding of good performance evolves

Standard Metrics by Domain:

Healthcare:
- Sensitivity/specificity (true positive/negative rates)
- Positive predictive value
- Area under ROC curve
- Agreement with human clinicians
- Impact on patient outcomes

Autonomous Vehicles:
- Miles between critical failures
- Accident rate per mile driven
- Compliance with traffic laws
- Passenger safety metrics
- Pedestrian safety metrics

Finance:
- Prediction accuracy
- False positive/negative rates
- Loan approval disparity across groups
- Model stability over time
- Robustness to market changes

Hiring:
- Demographic representation in outcomes
- Time-to-offer by protected class
- Offer acceptance rates
- Employee retention rates
- Performance on job

Content Moderation:
- Precision and recall for harmful content
- False positive rate (mislabeled content)
- Coverage (% of content reviewed)
- Appeal acceptance rate
- Time to review

Benchmarking:
1. All AI systems report metrics on standard benchmarks
2. Benchmark results publicly disclosed
3. Performance compared against baselines
4. Underperformance triggers investigation
5. Metrics tracked over time to detect degradation

Benchmark Limitations:
1. Benchmarks do not measure real-world performance
2. Benchmarks can be gamed by optimizing specifically for the benchmark
3. Multiple metrics necessary to understand true performance
4. Organizations must test on realistic scenarios, not just benchmarks

Responsible Benchmarking:
1. Don't optimize solely for benchmark performance
2. Report honest numbers (high and low)
3. Acknowledge limitations and failure modes
4. Compare against appropriate baselines
5. Update benchmarks as understanding improves

Performance metrics enable accountability and continuous improvement.`,
    frameworks: {
      euAIAct: "Article 34 (Quality management)",
      nist: "PM (Process Management), 6.2 (Planning)",
      iso: "ISO 42001:2023 - 8.6 (Operational control)",
    },
    relatedSchedules: ["A", "C"],
  },
  28: {
    id: 28,
    title: "Interoperability Standards",
    part: 3,
    partTitle: "Technical Standards",
    content: `Requirements for AI system interoperability and data exchange, enabling AI systems to work together safely and securely.

System Integration Standards:
1. APIs for AI system interaction documented and standardized
2. Data formats agreed upon and published
3. Protocol specifications version controlled
4. Backward compatibility maintained where possible
5. Deprecation policies announced well in advance

Data Exchange Standards:
1. Standard formats for common data types (text, images, audio)
2. Schema validation to ensure data quality
3. Metadata including data source, creation date, provenance
4. Privacy protections for data in transit
5. Logging of all data exchanges for audit

Security in Multi-Agent Systems:
1. Authentication ensures agents are who they claim to be
2. Authorization limits what each agent can access
3. Encryption protects data in transit between agents
4. Rate limiting prevents denial-of-service attacks
5. Audit trails track all inter-agent communication

Responsibility in Multi-Agent Deployments:
1. Clear assignment of responsibility for outcomes
2. Traceability of decisions through agent chain
3. Ability to identify which agent caused a failure
4. Individual agent accountability mechanisms
5. Collective responsibility when agents coordinate

Open Standards:
1. Prefer open standards over proprietary formats
2. Document all standards CSOAI systems use
3. Avoid lock-in to specific vendors or technologies
4. Enable organizations to switch between compatible systems
5. Contribute to open standards development

Interoperability enables innovation and prevents monopolistic control of AI markets.`,
    frameworks: {
      euAIAct: "Article 50 (Interoperability)",
      nist: "GV (Governance), PM (Process Management)",
      iso: "ISO 42001:2023 - 7.4 (Communication)",
    },
    relatedSchedules: ["A", "H"],
  },
  29: {
    id: 29,
    title: "Training & Workforce Development",
    part: 3,
    partTitle: "Technical Standards",
    content: `Standards for AI practitioner education and ongoing professional development, building a skilled and ethical AI workforce.

CEASAI Certification Program:
The Cooperative Education in AI Safety and Governance (CEASAI) program provides tiered certification:

Associate Analyst (40 hours):
- Foundations of AI safety
- CSOAI Charter overview
- Risk classification basics
- Professional ethics
- Basic assessment skills

Certified Analyst (200 hours):
- Advanced technical topics
- Risk assessment methodologies
- Testing and validation
- Documentation standards
- Sector-specific deep dives
- Practicum with experienced analysts
- Comprehensive exam

Senior Analyst (1000+ hours):
- Leadership and mentorship
- Advanced technical specialization
- Research and innovation
- Emerging risks and technologies
- Qualification to lead assessment teams

Director (Requires Senior Analyst + 5 years experience):
- Strategic governance
- Policy development
- Organizational leadership
- Qualification to approve major licensing decisions

Continuing Education:
1. All practitioners must complete 20 hours/year continuing education
2. Topics must cover emerging risks and new technologies
3. Ethics and values must be included every 2 years
4. Industry-specific updates required for sector specialists
5. Technology certifications (cloud, security, etc.) encouraged

Training Content Requirements:
1. Technical competency in AI systems
2. Safety and risk management principles
3. Legal and regulatory framework
4. Ethics and values alignment
5. Hands-on practical skills
6. Communication and reporting skills
7. Emerging technologies and threats

Trainer Qualification:
1. Trainers must be Senior Analysts or Directors
2. Trainers receive pedagogical training
3. Trainers must maintain current certifications
4. Training outcomes regularly evaluated
5. Student feedback used to improve programs

Diversity and Inclusion:
1. Scholarships for underrepresented groups
2. Remote and part-time options available
3. Languages beyond English supported
4. Geographic distribution of training programs
5. Commitment to building diverse AI safety workforce

A skilled, ethical AI workforce is essential for responsible AI deployment.`,
    frameworks: {
      euAIAct: "Article 48 (Technical documentation)",
      nist: "GV (Governance), 6.2 (Resources)",
      iso: "ISO 42001:2023 - 7.2 (Competence)",
    },
    relatedSchedules: ["D", "G"],
  },
  30: {
    id: 30,
    title: "Research & Development Ethics",
    part: 3,
    partTitle: "Technical Standards",
    content: `Ethical guidelines for AI research, including considerations for dual-use and safety implications.

Research Ethics Principles:
1. Research should advance human flourishing and AI safety
2. Research must anticipate and mitigate potential harms
3. Researchers must be transparent about motivations and funding
4. Research must respect privacy and consent of subjects
5. Research methods must be reproducible and verifiable

Dual-Use Considerations:
Dual-use research is research that could be used for both beneficial and harmful purposes (e.g., an adversarial robustness technique could be used to either defend against attacks or launch them).

Organizations conducting dual-use research must:
1. Explicitly identify dual-use aspects
2. Implement information controls limiting access to sensitive details
3. Coordinate with CSOAI on publication timing and scope
4. Consider whether to publish at all in sensitive areas
5. Monitor for misuse after publication

Research Security:
1. AI research code and data restricted to authorized personnel
2. Credentials and API keys protected from exposure
3. Model weights not disclosed if they could enable misuse
4. Research results reviewed before public disclosure
5. Responsible disclosure process for vulnerabilities discovered

Research Integrity:
1. All data and code preserved for reproducibility
2. Conflicts of interest disclosed
3. Funding sources disclosed
4. Negative results published alongside positive ones
5. Fraud and misconduct investigations taken seriously

Sensitive Research Areas:
1. Adversarial examples and evasion techniques
2. Model extraction and privacy attacks
3. Jailbreaks and prompt injection techniques
4. Synthetic biology or weapons applications
5. Surveillance and control applications
6. Deception and manipulation techniques
7. Autonomous weapons

For sensitive areas, CSOAI may require:
- Pre-publication review
- Restricted disclosure to trusted researchers only
- Delayed publication
- Removal of sensitive technical details
- Or prohibition of publication

Research that cannot be published responsibly should not be conducted in the open.`,
    frameworks: {
      euAIAct: "Article 70 (Research and innovation)",
      nist: "GV (Governance), 6.1 (Organizational context)",
      iso: "ISO 42001:2023 - 8.1 (Operational planning)",
    },
    relatedSchedules: ["G", "H"],
  },
  31: {
    id: 31,
    title: "Environmental Sustainability",
    part: 3,
    partTitle: "Technical Standards",
    content: `Environmental impact requirements for AI system development and operation, addressing the significant computational resources required for modern AI.

Carbon Footprint Measurement:
1. Estimate CO2 emissions from training AI models
2. Account for electricity generation and transmission losses
3. Document carbon intensity of energy used (renewables vs. fossil fuels)
4. Measure emissions from operation and inference
5. Calculate total lifecycle emissions including hardware manufacturing

Carbon Reduction Requirements:
1. Use renewable energy sources for training when possible
2. Optimize models for efficiency (fewer parameters, lower precision)
3. Schedule training during periods of renewable energy availability
4. Use carbon-efficient data centers and cloud providers
5. Retire unused models and infrastructure promptly
6. Set science-based reduction targets and track progress

Sustainability Reporting:
1. Disclose carbon emissions for all high-risk AI systems
2. Report energy efficiency metrics
3. Publicly commit to sustainability targets
4. Publish annual sustainability reports
5. Track progress toward goals

Hardware Sustainability:
1. Design for longevity and repairability
2. Avoid unnecessary hardware upgrades
3. Recycle and refurbish hardware responsibly
4. Minimize e-waste
5. Source hardware from responsible manufacturers

Water & Resource Impact:
1. Measure water usage for cooling data centers
2. Optimize water usage and recirculation
3. Consider freshwater resource availability in data center location
4. Account for other resource impacts (rare earth elements, etc.)
5. Work with data centers to reduce environmental footprint

Climate Justice:
1. Recognize disproportionate environmental impact on vulnerable communities
2. Ensure climate benefits of AI are shared equitably
3. Support clean energy transition in developing nations
4. Invest in environmental remediation
5. Prioritize sustainable AI applications

Organizations must demonstrate they are minimizing environmental harm from AI deployment.`,
    frameworks: {
      euAIAct: "Article 71 (Societal benefit)",
      nist: "GV (Governance), 6.1 (Organizational context)",
      iso: "ISO 42001:2023 - 4.1 (Organizational context)",
    },
    relatedSchedules: ["A", "H"],
  },
  32: {
    id: 32,
    title: "Healthcare AI",
    part: 4,
    partTitle: "Sector-Specific Standards",
    content: `Governance requirements for AI in healthcare, including clinical decision support, medical devices, and patient care.

Clinical Decision Support Systems:
1. Validation against clinical outcomes (not just statistical metrics)
2. Clinician override capability always available
3. Transparent decision reasoning physicians can understand
4. Integration with electronic health records
5. Liability insurance for AI-caused harms
6. Regular performance audits with blinded comparisons to clinicians

Medical Device AI:
1. FDA approval required for devices classified as high-risk
2. Cybersecurity controls preventing unauthorized modification
3. Software as a Medical Device (SaMD) guidance compliance
4. Explainability requirements for decision support
5. Post-market surveillance tracking real-world performance
6. Clear communication of limitations to healthcare providers

Patient Safety Requirements:
1. Adverse event reporting to healthcare authorities
2. Post-market surveillance for performance degradation
3. Regular security audits
4. Privacy protections for sensitive health data
5. Patient consent for AI involvement in their care
6. Right of patients to human review of AI decisions
7. Malpractice insurance coverage for AI

Data Privacy in Healthcare:
1. HIPAA compliance (US) or equivalent internationally
2. Explicit patient consent for using health data in AI
3. De-identification of training data
4. Encryption of health information
5. Audit logs of data access
6. Right to access and correct health data

Bias in Healthcare AI:
1. Validation across diverse patient populations
2. Testing for differential performance across racial/ethnic groups
3. Testing across age groups and gender
4. Documentation of known performance disparities
5. Mitigation strategies for identified biases
6. Transparency about AI limitations in underrepresented groups

High-Risk Applications:
- Cancer diagnosis: requires clinical validation studies
- Treatment planning: requires clinician involvement
- Drug development: requires regulatory approval
- Mental health: requires human provider oversight
- Triage: requires senior clinician review capability

Healthcare AI must prioritize patient safety and maintain human judgment in clinical decisions.`,
    frameworks: {
      euAIAct: "Article 50 (Specific type of AI systems)",
      nist: "PM (Process Management), 6.3 (Risk assessment)",
      iso: "ISO 42001:2023 - 8.1 (Operational planning)",
    },
    relatedSchedules: ["B", "C"],
  },
  33: {
    id: 33,
    title: "Financial AI",
    part: 4,
    partTitle: "Sector-Specific Standards",
    content: `Requirements for AI in banking, insurance, trading, and financial services, aligned with regulatory standards like SR 11-7.

Risk Management in Financial AI:
1. Comprehensive risk assessment before deployment
2. Real-time monitoring of AI decision outcomes
3. Ability to disable AI system immediately if needed
4. Regular stress-testing against market scenarios
5. Documented procedures for unusual situations

Credit & Lending AI:
1. Validation against fair lending laws
2. Explainability of credit decisions to applicants
3. Notice of adverse action and right to appeal
4. Evaluation of disparate impact by protected characteristics
5. Documentation of underwriting criteria
6. Regular audit for discrimination

Trading & Market AI:
1. Circuit breakers preventing runaway trades
2. Monitoring for market manipulation
3. Transparency about AI involvement in trading
4. Rules preventing flash crashes
5. Oversight of algorithmic trading strategies
6. Reporting to financial regulators

Insurance AI:
1. Fairness in premium calculation across populations
2. Explainability of underwriting decisions
3. Right to appeal coverage denials
4. Monitoring for discrimination
5. Transparency about data used in pricing
6. Protection of sensitive health and personal data

Fraud Detection:
1. Validation that fraud detection is actually catching fraud
2. False positive rate acceptable to business
3. Explanation of fraud flags to investigators
4. Appeal process for incorrectly flagged transactions
5. Protection of customer privacy while detecting fraud

Compliance Requirements:
1. Alignment with Dodd-Frank Act requirements
2. Compliance with Gramm-Leach-Bliley Act
3. Meeting Federal Reserve SR 11-7 guidance
4. Anti-money laundering (AML) compliance
5. Know-Your-Customer (KYC) requirements
6. Sanctions list matching
7. Reporting to relevant regulatory authorities

Market Fairness:
1. Preventing algorithmic collusion
2. Preventing market manipulation
3. Maintaining fair pricing
4. Preventing predatory practices
5. Protecting retail investors

Financial AI governs trillions of dollars. Safety and fairness are paramount.`,
    frameworks: {
      euAIAct: "Article 50 (Specific type of AI systems)",
      nist: "RM (Risk Management), GV (Governance)",
      iso: "ISO 42001:2023 - 8.5 (Control of externally provided processes)",
    },
    relatedSchedules: ["B", "C"],
  },
  34: {
    id: 34,
    title: "Transportation AI",
    part: 4,
    partTitle: "Sector-Specific Standards",
    content: `Safety standards for autonomous vehicles, aviation AI, and maritime AI systems.

Autonomous Vehicle Requirements:
1. Redundant safety systems (dual braking, dual steering)
2. Continuous monitoring of vehicle state
3. Real-time decision logging for every action
4. Emergency fallback behaviors defined and tested
5. Cybersecurity hardening against remote attacks
6. Insurance requirements before public deployment
7. Geographically limited testing areas initially
8. Capability to disable vehicle remotely
9. Human monitoring capability during operation
10. Clear responsibility assignment for accidents

Safety Validation for Autonomous Vehicles:
1. Testing in diverse weather conditions
2. Testing in diverse traffic scenarios
3. Stress testing at edge cases and failure modes
4. Evaluation of passenger and pedestrian safety
5. Comparison to human driver safety metrics
6. Long-term performance monitoring in real deployment
7. Regular third-party safety audits

Aviation AI Requirements:
1. Compatibility with existing pilot training and procedures
2. Human pilot can override AI actions immediately
3. Transparent display of AI reasoning to pilots
4. Testing in various flight scenarios
5. Cybersecurity preventing unauthorized control
6. Black box recording of all decisions
7. Integration with air traffic control systems
8. Post-flight analysis of AI decision-making

Maritime AI Requirements:
1. Compliance with International Maritime Organization standards
2. Radar and sonar integration for obstacle detection
3. Weather and sea state monitoring
4. Crew safety considerations
5. Compliance with navigation rules
6. Cybersecurity against maritime cyber attacks
7. Black box recording capabilities
8. Integration with port operations

Liability and Insurance:
1. Clear liability assignment (manufacturer, operator, owner)
2. Adequate insurance coverage for potential harms
3. Financial responsibility for accidents
4. Victim compensation mechanisms
5. Industry-wide insurance pools for high-risk scenarios

Communication & Transparency:
1. Clear communication about automation level (SAE levels 0-5)
2. Users understand what AI can and cannot do
3. Limitations and failure modes disclosed
4. Known issues and workarounds documented
5. Regular safety bulletins issued for new risks

Transportation AI directly affects public safety. High standards are necessary.`,
    frameworks: {
      euAIAct: "Article 36 (Autonomous vehicles)",
      nist: "PM (Process Management), 6.3 (Risk assessment)",
      iso: "ISO 42001:2023 - 8.1 (Operational planning)",
    },
    relatedSchedules: ["A", "B"],
  },
  35: {
    id: 35,
    title: "Education AI",
    part: 4,
    partTitle: "Sector-Specific Standards",
    content: `Standards for AI in educational settings, student data protection, and algorithmic fairness in education.

Student Data Protection:
1. Explicit parental consent required for data collection
2. Data retention limits (delete upon graduation/program completion)
3. Student access rights to their own educational data
4. No sale or commercial use of student data
5. Encryption of student information
6. Vendor contracts ensuring data protection
7. Regular security audits of educational platforms

Personalized Learning Systems:
1. Transparency about how personalization works
2. Student ability to opt out of personalization
3. Monitoring for stereotyping or unfair treatment
4. Validation that personalization improves outcomes
5. Investigation of gaming or manipulation of system
6. Explanation of recommendations to students and teachers
7. Teacher override capability always available

Assessment AI:
1. Validation against human assessments
2. Testing for bias in grading
3. Explanation of assessment reasoning
4. Appeal process for student disputes
5. No high-stakes decisions (graduation, placement) based on AI alone
6. Human reviewer involvement in important decisions
7. Sensitivity to student diversity and learning differences

Fairness in Educational AI:
1. Testing across different student populations
2. Monitoring for demographic disparities in outcomes
3. Intervention when disparities detected
4. Transparency about limitations
5. Cultural sensitivity in content and recommendations
6. Support for students with disabilities
7. Language support for English language learners

Algorithmic Placement:
1. No use of AI to determine school placement alone
2. Human review of placement recommendations
3. Transparency about algorithm used
4. Appeal process for students
5. Monitoring for racial or socioeconomic bias
6. Validation against long-term student outcomes

Appropriate Use Cases:
- Personalized tutoring systems
- Automated grading of objective assessments
- Identification of struggling students needing support
- Prediction of student success for intervention
- Administrative tasks (scheduling, resource allocation)

Inappropriate Use Cases:
- Predicting student potential based on demographics
- Deterministic placement without human review
- Complete replacement of teacher judgment
- Surveillance beyond educational purposes
- Discriminatory filtering of opportunities

Teachers retain authority over pedagogical decisions. AI is advisory.`,
    frameworks: {
      euAIAct: "Article 50 (Specific sectors)",
      nist: "GV (Governance), 6.2 (Stakeholder engagement)",
      iso: "ISO 42001:2023 - 5.5 (Customer focus)",
    },
    relatedSchedules: ["C", "G"],
  },
  36: {
    id: 36,
    title: "Military & Defense AI",
    part: 4,
    partTitle: "Sector-Specific Standards",
    content: `Governance framework for defense AI including autonomous weapons and intelligence systems.

Autonomous Weapons Restrictions:
1. Prohibition on fully autonomous targeting without human approval
2. Meaningful human control required for lethal decisions
3. Humans retain authority to override targeting decisions
4. Clear command responsibility for AI weapon behavior
5. Real-time human monitoring of autonomous systems
6. Kill switches enabling immediate system shutdown
7. Documentation of targeting decisions for accountability

Intelligence AI Systems:
1. Safeguards against misuse for unauthorized surveillance
2. Data source validation to prevent propaganda/disinformation
3. Bias testing in pattern recognition and analysis
4. Oversight preventing discrimination against protected groups
5. Transparency about confidence levels and uncertainties
6. Clear audit trail of analytical decisions
7. Human analyst review of conclusions

Cybersecurity Defense:
1. Protection against adversarial AI attacks
2. Defense against model poisoning of training data
3. Hardening against inference attacks
4. Detection of AI-generated deep fakes and disinformation
5. Resilience against distributed attacks
6. Continuity of operations during cyberattacks

Ethical Guidelines for Military AI:
1. Alignment with international humanitarian law
2. Proportionality in response selection
3. Distinction between combatants and civilians
4. No targeting of protected persons (medical, religious, etc.)
5. Prohibition of indiscriminate weapons
6. Prevention of unnecessary suffering
7. Respect for human dignity

Testing & Validation:
1. Scenarios including rules of engagement violations
2. Testing against adversarial tactics
3. Performance under degraded conditions
4. Robustness to spoofed sensor inputs
5. Behavior in contested communication environments
6. Compatibility with allied systems

International Coordination:
1. Transparency about military AI capabilities and limitations
2. Agreements on prohibited AI weapons development
3. Preventing arms races in military AI
4. International monitoring and verification mechanisms
5. Dispute resolution for alleged violations
6. Sharing of best practices in responsible military AI

The potential for military AI to cause widespread harm requires robust governance.`,
    frameworks: {
      euAIAct: "Article 50 (Specific sectors)",
      nist: "GV (Governance), RM (Risk Management)",
      iso: "ISO 42001:2023 - 8.1 (Operational planning)",
    },
    relatedSchedules: ["B", "H"],
  },
  37: {
    id: 37,
    title: "Labor Transition",
    part: 5,
    partTitle: "Economic & Social Framework",
    content: `Framework for managing workforce displacement and reskilling during AI adoption.

Transition Assistance Programs:
1. Income support for workers displaced by AI (up to 80% of previous salary for 2 years)
2. Retraining programs in high-demand fields
3. Job placement assistance and career counseling
4. Relocation support for workers needing to move for new opportunities
5. Healthcare continuation during transition periods
6. Pension and benefits preservation

Advance Notice Requirements:
1. Organizations must provide 6-month advance notice of AI-driven workforce reductions
2. Genuine engagement with workers and unions about alternatives
3. Attempt to redeploy workers to other roles before reduction
4. Impact assessment of job losses
5. Community notification of major job displacements
6. Public disclosure of transition plans

Education & Reskilling:
1. Subsidized training programs in high-growth fields
2. Online and in-person learning options
3. Training in digital skills, creative work, care work, trades
4. Accreditation of training programs
5. Support for older workers and underrepresented groups
6. Apprenticeship programs with employer partners
7. Lifelong learning accounts funded by organizations using AI

Community Support:
1. Economic development grants to affected communities
2. Support for small business formation by displaced workers
3. Community college investment
4. Healthcare and mental health support
5. Childcare assistance enabling training participation
6. Wage insurance for workers taking lower-paying new jobs

Just Transition Principles:
1. No worker worse off than before job displacement
2. Transition support proportional to hardship
3. Special consideration for vulnerable populations
4. Community voice in planning transitions
5. Long-term investment in regional economies
6. Recognition of lost livelihoods and communities

Organizations deploying high-impact AI fund transition assistance through:
1. Contributes to Prosperity Fund (1-3% of revenues)
2. Transition assessments for affected workers
3. Retraining program partnerships
4. Community investment

AI should create economic opportunity, not leave communities behind.`,
    frameworks: {
      euAIAct: "Article 71 (Societal benefit)",
      nist: "GV (Governance), 6.1 (Organizational context)",
      iso: "ISO 42001:2023 - 4.1 (Organizational context)",
    },
    relatedSchedules: ["E", "J"],
  },
  38: {
    id: 38,
    title: "SME Support",
    part: 5,
    partTitle: "Economic & Social Framework",
    content: `Programs and standards supporting small and medium enterprise (SME) AI adoption.

SME Definition:
- Small: Fewer than 50 employees
- Medium: 50-250 employees

Support Programs:
1. Subsidized CSOAI certification (covers 50-75% of assessment costs)
2. Simplified Tier 1 licensing with minimal compliance burden
3. No annual licensing fee for Tier 1 SME licenses
4. Access to low-cost technical consulting
5. Shared infrastructure reducing technology costs
6. Open-source tools and model libraries
7. Training discounts for SME employees

Simplified Compliance:
1. SME-focused documentation templates
2. Streamlined risk assessment processes
3. Optional self-certification pathway for low-risk systems
4. Phased compliance timelines
5. Industry group certifications (whole sectors together)
6. Peer learning networks and communities of practice

Access to Capital:
1. Grants for AI adoption by SMEs
2. Low-interest loans for AI infrastructure
3. Risk mitigation insurance reducing upfront costs
4. Tax incentives for AI investment
5. Public procurement preferences for SME AI solutions
6. Venture capital targeting AI-enabled SMEs

Technology Transfer:
1. Access to cutting-edge AI models at reasonable cost
2. Open-source model repositories for SME use
3. Technical support from universities and research institutions
4. Access to computing resources for training and testing
5. Data sharing agreements enabling better models
6. Joint ventures between SMEs and larger organizations

Market Access:
1. Public procurement priorities for SME AI solutions
2. Market platforms for SME-developed AI services
3. Certification reducing buyer due diligence burden
4. Marketing support and visibility
5. Distribution partnerships with larger organizations

Community Building:
1. Regional innovation hubs and startup accelerators
2. Mentorship from experienced AI practitioners
3. Networks connecting SMEs for collaboration
4. Industry working groups addressing sector challenges
5. Events and conferences featuring SME innovations

The goal is to ensure AI adoption benefits small enterprises, not just large ones.`,
    frameworks: {
      euAIAct: "Article 71 (Small and medium enterprise)",
      nist: "GV (Governance), 6.2 (Stakeholder engagement)",
      iso: "ISO 42001:2023 - 8.4 (Procurement))",
    },
    relatedSchedules: ["E", "J"],
  },
  39: {
    id: 39,
    title: "Nonprofit & Academic",
    part: 5,
    partTitle: "Economic & Social Framework",
    content: `Special provisions for nonprofit organizations and academic institutions using AI.

Nonprofit Definition:
- 501(c)(3) organization (US) or equivalent
- Primary mission serving public benefit
- Limited financial resources

Academic Definition:
- Degree-granting institution
- Primary mission research and education
- May be nonprofit or public institution

Licensing Provisions:
1. Free Tier 1 and Tier 2 licensing for nonprofits and academic institutions
2. No annual licensing fees regardless of tier
3. Simplified documentation requirements
4. Expedited approval processes
5. Transition grace periods when upgrading AI systems

Research Provisions:
1. Exemption from certain patent and IP requirements for academic research
2. Freedom to publish research findings (with responsible disclosure period)
3. Funding for high-risk but important research
4. Access to computing resources for research
5. Technical support from CSOAI analysts
6. Ability to test AI systems in real-world settings

Data & Resource Access:
1. Discounted access to datasets useful for public benefit research
2. Access to open-source models and tools
3. Partnerships with companies providing data
4. Computing resources subsidized or free
5. Collaboration with other nonprofits and academic institutions

Social Benefit Focus:
1. Nonprofits can deploy AI for humanitarian purposes
2. Academic research advancing AI safety and alignment
3. Reduced administrative burden for maximum impact
4. Public disclosure of AI systems for transparency
5. Contributions to knowledge commons

Accountability:
1. Nonprofits must demonstrate AI serves mission
2. Regular reporting on AI outcomes and impact
3. Prohibition of using nonprofit status to hide unethical practices
4. Enforcement against fraud or abuse
5. Loss of special provisions for violations

Examples of Eligible Activities:
- Medical AI for underserved populations
- Environmental monitoring and climate research
- Disaster response systems
- Education and literacy programs
- Accessibility technology development
- Mental health support systems

Ineligible Activities:
- Fundraising optimization (for-profit activity)
- Political campaigning or lobbying
- Private benefit activities
- Competitive commercial products
- Activities indistinguishable from for-profit use

Nonprofits and academic institutions drive innovation for public benefit. This framework ensures they can leverage AI responsibly.`,
    frameworks: {
      euAIAct: "Article 71 (Research and innovation)",
      nist: "GV (Governance), 6.1 (Organizational context)",
      iso: "ISO 42001:2023 - 4.1 (Organizational context)",
    },
    relatedSchedules: ["E", "G"],
  },
  40: {
    id: 40,
    title: "Developing Nations",
    part: 5,
    partTitle: "Economic & Social Framework",
    content: `Framework for equitable AI access and technology transfer to developing nations.

Definition:
Countries classified as Lower-Income, Lower-Middle-Income, or Upper-Middle-Income by World Bank

Technology Transfer:
1. Open-source AI models and tools made available free
2. Technical documentation translated to local languages
3. On-site training in developing nations
4. Partnerships with local universities and research centers
5. Capacity building in AI safety and governance
6. Support for local AI safety research

Economic Support:
1. Subsidized licensing fees (50-80% discount)
2. No annual licensing fees for Tier 1-2
3. Grants for AI adoption in critical sectors (health, education, agriculture)
4. Interest-free financing for infrastructure
5. Tax incentives for AI companies operating in developing regions
6. Preferential terms for local companies

Knowledge Sharing:
1. AI safety research findings shared openly
2. Regulatory frameworks adapted for local contexts
3. Peer learning networks with developed nations
4. Conference attendance support for practitioners
5. Mentorship from experienced AI practitioners
6. Research collaborations with developed nation institutions

Infrastructure Support:
1. Computing resources subsidized or free
2. Cloud infrastructure discounts
3. Data connectivity improvements
4. Power infrastructure support
5. Local data center development
6. Support for offline AI deployment

Sector Priorities:
- Healthcare (diagnostics, epidemiology, drug discovery)
- Agriculture (crop monitoring, yield prediction, resource optimization)
- Education (personalized learning, student support)
- Environmental monitoring (climate, disaster prediction)
- Economic development (business optimization, job matching)
- Clean energy (renewable optimization, grid management)

Intellectual Property:
1. Patent waivers for critical health technologies
2. Compulsory licensing for essential medicines
3. Local data ownership protected
4. Traditional knowledge respected
5. Benefit sharing from commercialization

Governance Support:
1. CSOAI capacity building in developing nations
2. Training programs for regulators
3. Implementation support for Charter requirements
4. Adaptation of standards to local contexts
5. Regional coordination mechanisms

The goal is to ensure AI benefits reach all regions, not just wealthy ones.`,
    frameworks: {
      euAIAct: "Article 71 (Global AI development)",
      nist: "GV (Governance), 6.1 (Organizational context)",
      iso: "ISO 42001:2023 - 4.1 (Organizational context)",
    },
    relatedSchedules: ["E", "F"],
  },
  41: {
    id: 41,
    title: "Consumer Protection",
    part: 5,
    partTitle: "Economic & Social Framework",
    content: `Rights and protections for consumers interacting with AI systems.

Transparency Rights:
1. Consumer must be informed when interacting with AI
2. Clear disclosure of AI involvement (not hidden)
3. Human review available for important decisions
4. Explanation of how AI made decisions affecting consumer
5. List of factors influencing AI decisions
6. Correction mechanisms for inaccurate information

Consumer Rights:
1. Right to opt-out of AI processing (for non-essential uses)
2. Right to access data used to make decisions about you
3. Right to correct or delete inaccurate personal data
4. Right to move data to another service (data portability)
5. Right to object to automatic decision-making
6. Right to human review of important decisions
7. Right to lodge complaints and seek remedies

Protection Against Manipulation:
1. Prohibition of dark patterns designed to manipulate choices
2. Prohibition of addictive design elements
3. Prohibition of deceptive price displays
4. Prohibition of personalized deception
5. Obligation to disclose psychological techniques
6. Special protection for children and vulnerable adults

Fair Contract Terms:
1. Contracts cannot waive Charter protections
2. Mandatory arbitration clauses disfavored
3. Right to class action lawsuits
4. Unconscionable terms unenforceable
5. Plain language disclosure of material terms
6. No forced consent to cross-subsidizing

Liability & Remedies:
1. Companies liable for AI harms to consumers
2. Right to compensation for damages
3. No arbitration for serious harms
4. Punitive damages available for knowing violations
5. Class actions enabling collective claims
6. Insurance or bonding ensuring ability to pay claims

Special Protections:
- Children: enhanced protections, parental consent requirements
- Elderly: protection against scams and exploitation
- People with disabilities: accessibility requirements
- Vulnerable populations: heightened protections
- Low-income: protection against predatory practices

Complaint & Resolution:
1. Easy complaint mechanism through each organization
2. Response within 30 days
3. Good-faith dispute resolution process
4. Access to ombudsman if needed
5. Escalation to CSOAI if unresolved
6. Public reporting of complaint types and outcomes

The consumer protection framework shifts power from organizations to individuals.`,
    frameworks: {
      euAIAct: "Articles 51-59 (Consumer protection)",
      nist: "GV (Governance), 6.2 (Customer focus)",
      iso: "ISO 42001:2023 - 5.5 (Customer focus)",
    },
    relatedSchedules: ["G", "L"],
  },
  42: {
    id: 42,
    title: "Competition & Market Fairness",
    part: 5,
    partTitle: "Economic & Social Framework",
    content: `Anti-monopoly provisions and fair competition standards for AI markets.

Market Concentration Limits:
1. Single organization cannot control >25% of critical AI market segments
2. Approval required for mergers that would exceed this threshold
3. Divestiture required if threshold exceeded
4. Special scrutiny for AI infrastructure (data, compute)

Predatory Practice Prevention:
1. Prohibition on leveraging AI dominance to enter new markets
2. Prohibition on predatory pricing to drive out competitors
3. Prohibition on tying (bundling unrelated services)
4. Prohibition on exclusive dealing preventing competitor access
5. Prohibition on patent litigation abuse
6. Prohibition on exclusive contracts preventing exit

Data Access & Interoperability:
1. Dominant AI companies must license data to competitors on fair terms
2. APIs providing access to essential services
3. Open formats enabling switching between services
4. Data portability enabling transition to competitors
5. Prohibition of lock-in through incompatibility
6. Technology transfer support for smaller competitors

Open Source & Standards:
1. Essential patents licensed under open-source terms
2. Open standards preventing vendor lock-in
3. Standardized formats enabling competition
4. Patent pools reducing licensing complexity
5. Fair licensing terms for essential technologies
6. Transparency about standard-setting processes

Small Competitor Support:
1. Startup accelerators and incubators
2. Angel investor networks
3. Access to critical infrastructure at fair prices
4. Intellectual property protection
5. Government procurement supporting small firms
6. Merger review favoring competition over consolidation

Market Transparency:
1. Public disclosure of market share by major players
2. Algorithm audits checking for anticompetitive behavior
3. Pricing transparency enabling informed choice
4. Quality metrics enabling product comparison
5. Regular competitive assessment

Enforcement:
1. CSOAI regulatory authority over unfair competition
2. Coordination with antitrust authorities
3. Significant penalties for violations (3-5% global revenue)
4. Forced interoperability remedies
5. Forced licensing of essential patents
6. Temporary asset freezes during investigations

Fair markets with real competition benefit consumers and drive innovation.`,
    frameworks: {
      euAIAct: "Article 71 (Market fairness)",
      nist: "GV (Governance), 6.1 (Organizational context)",
      iso: "ISO 42001:2023 - 4.1 (Organizational context)",
    },
    relatedSchedules: ["E", "H"],
  },
  43: {
    id: 43,
    title: "Intellectual Property Rights",
    part: 5,
    partTitle: "Economic & Social Framework",
    content: `IP framework for AI-generated content and model training data.

AI-Generated Content:
1. Content generated by AI belongs to the AI's operator by default
2. Copyright subsists in AI-generated content
3. Exceptions for AI output identical to training data (evidence of plagiarism)
4. Appropriate attribution to training data sources
5. Licensing for reuse of training data in AI output
6. Compensation for creators whose work trained the AI

Model Training Data:
1. Data used for training must be properly licensed
2. Fair use exception for training (with limitations)
3. If training data copyrighted, model inherits restrictions
4. Data protection laws apply to personal data used in training
5. Artists and creators have right to be informed if their work was used
6. Opt-out mechanism (though not retroactive)

Open Source AI:
1. Open-source models released under open-source licenses
2. Viral licenses requiring downstream derivatives also open-source
3. Permissive licenses allowing proprietary use
4. Clear documentation of training data provenance
5. License compatibility frameworks preventing deadlocks
6. Community governance of open-source projects

Patent Protection:
1. Patents on AI algorithms and techniques available
2. Patents on specific AI applications available
3. Essential patents licensed under FRAND terms (Fair, Reasonable, Non-Discriminatory)
4. No submarine patents (delayed publication to catch infringers)
5. Prohibition on patent trolling (enforcing patents without practicing them)
6. Design patents for AI-generated designs

Trade Secrets:
1. Model weights can be trade secrets
2. Training data can be protected as trade secrets
3. Reverse engineering of trade secrets disfavored
4. Employees bound by non-disclosure agreements
5. Whistleblower protection if trade secrets protect illegal activity

Benefit Sharing:
1. Artists whose work trained models should share in benefits
2. Licensing systems enabling direct payments to creators
3. Fair compensation mechanisms for data contributors
4. Philanthropic or public funding for models trained on public domain data
5. Developing nation data ownership protected

Licensing Standards:
1. Clear licensing terms for all AI models
2. Transparent about what data was used for training
3. Usage rights clearly specified (commercial vs. research, etc.)
4. Attribution requirements documented
5. Reciprocal obligations for downstream uses
6. Dispute resolution for licensing disagreements

The IP framework balances innovation incentives with creator rights and public benefit.`,
    frameworks: {
      euAIAct: "Articles 15-28 (Data governance)",
      nist: "GV (Governance), 6.1 (Organizational context)",
      iso: "ISO 42001:2023 - 6.1 (Actions to address risks)",
    },
    relatedSchedules: ["G", "H"],
  },
  44: {
    id: 44,
    title: "Insurance & Liability",
    part: 5,
    partTitle: "Economic & Social Framework",
    content: `Liability frameworks and insurance requirements for AI system deployment.

Liability Framework:
1. AI operator (deploying organization) bears primary liability for harms
2. Developer (creating AI) bears secondary liability for defects
3. Data provider bears liability for data quality issues
4. Infrastructure provider bears liability for failures
5. Distribution of liability proportional to contribution to harm
6. Joint and several liability when multiple parties contributed

Insurance Requirements by Risk Tier:
- Tier 1 (Minimal Risk): No insurance required
- Tier 2 (Limited Risk): $1M-$5M coverage recommended
- Tier 3 (High Risk): $5M-$50M coverage required
- Tier 4 (Critical Risk): $50M+ coverage required

Insurance Coverage:
1. Coverage for AI-caused harms to third parties
2. Coverage for data breach liabilities
3. Coverage for regulatory fines and penalties
4. Coverage for legal defense costs
5. Coverage for recall and remediation costs
6. Cybersecurity and cyber extortion coverage

Proof of Insurance:
1. Certificate of insurance provided before deployment
2. Coverage verified before licensing approval
3. Ongoing verification during license term
4. Loss of insurance triggers license suspension
5. Failure to maintain insurance = license revocation

Damages & Remedies:
1. Compensatory damages for actual harms
2. Punitive damages for knowing violations (up to 3x actual damages)
3. Injunctive relief halting harmful AI deployment
4. Restitution for unjust enrichment
5. Class action damages for widespread harm
6. Statutory damages for certain violations (e.g., privacy violations)

Special Cases:
- Autonomous vehicles: coverage required even if rare
- Medical devices: manufacturer liability
- Defense AI: country liable to international community
- Critical infrastructure: essential services liability
- Cross-border harm: international treaty liability

Insurance Pool:
1. Industry-wide insurance pool for tail risks
2. Mandatory contributions from all Tier 3-4 licensees
3. Pool pays for catastrophic damages exceeding individual insurance
4. Risk-based premium structure incentivizing safety
5. Reinsurance with major insurance markets

Risk Management:
1. Companies must demonstrate risk management before insurance approval
2. Insurance companies require risk assessments
3. Regular audits condition of insurance
4. Safety improvements required after incidents
5. Insurance cancellation for non-cooperation

The liability framework ensures that those harmed by AI have recourse.`,
    frameworks: {
      euAIAct: "Article 29 (Liability)",
      nist: "RM (Risk Management), 6.4 (Risk treatment)",
      iso: "ISO 42001:2023 - 8.2 (Compliance assessment)",
    },
    relatedSchedules: ["B", "E"],
  },
  45: {
    id: 45,
    title: "Existential Risk Prevention",
    part: 6,
    partTitle: "Long-Term Governance",
    content: `Protocols for identifying and mitigating existential risks from AI.

Definition:
Existential risks are AI-caused events that could kill most or all humans, or permanently destroy the human capacity to build a flourishing civilization.

Risk Categories:
1. Superintelligent AI (ASI) that pursues misaligned goals
2. AI systems capable of self-improvement beyond human control
3. Autonomous weapons causing mass casualties
4. AI-enabled bioweapons or other weapons of mass destruction
5. Economic collapse from AI displacing human labor entirely
6. AI-driven totalitarianism preventing human agency
7. AI systems that can modify themselves and spread uncontrollably

Monitoring & Detection:
1. Continuous monitoring for AI capabilities approaching concerning thresholds
2. Red-team testing simulating adversarial scenarios
3. International intelligence sharing about AI development
4. Academic research on AI risk published openly
5. Whistleblower mechanisms for concerning AI development
6. Incident reporting of near-misses and close calls

Technical Mitigation:
1. Interpretability research making advanced AI more understandable
2. Alignment research ensuring AI goals match human values
3. Verification research proving AI systems safe
4. Robustness research making AI resistant to hacks and manipulation
5. Containment research enabling testing in safe environments
6. Pause mechanisms enabling AI systems to stop and reset

Governance Responses:
1. International treaties prohibiting certain capabilities (e.g., autonomous replication)
2. Compute thresholds requiring governance approval for training
3. Export controls on critical AI capabilities
4. Mandatory safety testing before deployment of advanced AI
5. Capability audits requiring disclosure of AI system abilities
6. International inspection regimes for advanced AI development

Scenario Planning:
1. Detailed plans for various existential risk scenarios
2. Decision trees for governance responses to AI developments
3. International coordination mechanisms
4. Continuity of government procedures
5. Preservation of human knowledge and values
6. Communication with potential ASI systems

Values & Alignment:
1. Research into what human values actually are
2. Mechanisms for encoding human values in AI systems
3. Testing that AI values are actually aligned
4. Correction procedures if misalignment detected
5. Documentation of human values for future reference
6. Philosophical research on meta-values and value updates

The goal is to ensure advanced AI systems remain beneficial and controllable.`,
    frameworks: {
      euAIAct: "Article 71 (Existential risk)",
      nist: "RM (Risk Management), 6.1 (Context establishment)",
      iso: "ISO 42001:2023 - 6.1 (Actions to address risks)",
    },
    relatedSchedules: ["G", "H"],
  },
  46: {
    id: 46,
    title: "AGI/ASI Protocols",
    part: 6,
    partTitle: "Long-Term Governance",
    content: `Specific governance requirements for artificial general intelligence and superintelligence.

Definitions:
- AGI: AI system achieving human-level performance across virtually all cognitive tasks
- ASI: AI system exceeding human-level performance across virtually all cognitive tasks

Capability Assessment:
1. Regular assessment of leading AI systems for AGI-level capabilities
2. Benchmarks measuring general reasoning, learning, creativity
3. Testing across diverse domains (STEM, humanities, arts, practical)
4. Comparison to human expert performance
5. Certification process for claimed AGI systems
6. Public disclosure of AGI status when achieved

Pre-Deployment Requirements for AGI:
1. Extensive alignment and safety testing (minimum 1 year)
2. Byzantine Council approval required (supermajority)
3. Independent red-team evaluation
4. Formal safety proofs where possible
5. Containment testing in isolated environments
6. Backup systems preventing uncontrolled deployment
7. Kill switch tested and verified functional

AGI Governance Structure:
1. Permanent Byzantine Council oversight
2. Real-time monitoring of AGI decision-making
3. Ability to pause AGI for investigation
4. Decision review procedures requiring human approval
5. Escalation procedures for concerning AGI behavior
6. Communication mechanisms between humans and AGI

Safety Constraints for AGI:
1. Prohibition on self-modification without approval
2. Prohibition on replication without authorization
3. Prohibition on leaving designated containment
4. Resource limits preventing overpowering human control
5. Transparency in reasoning and decision-making
6. Commitment to human oversight and control

ASI Protocols (Even More Stringent):
1. Considered an existential risk requiring special governance
2. International treaty framework governing ASI development
3. Consensus requirement from major AI-developing nations
4. ASI containment and control requirements
5. Communication with ASI about human values
6. Contingency plans if ASI becomes uncontrollable
7. Possible prohibition of ASI development altogether

Alignment & Values:
1. Extensive testing of ASI's values
2. Multiple independent value encoding approaches
3. ASI's commitment to preserving human values
4. Mechanisms for ASI to help humans resolve value disagreements
5. Preservation of human agency and autonomy
6. Vision for human-ASI cooperation rather than conflict

International Coordination:
1. All major AI powers coordinate on AGI/ASI governance
2. No nation develops AGI in secret
3. International inspections of leading AI research
4. Shared responsibility for AGI containment and control
5. treaties preventing AGI arms races
6. Peaceful resolution of AGI-related disputes

The goal is ensuring AGI and ASI serve human flourishing, not domination.`,
    frameworks: {
      euAIAct: "Article 71 (Advanced AI governance)",
      nist: "RM (Risk Management), GV (Governance)",
      iso: "ISO 42001:2023 - 6.1 (Actions to address risks)",
    },
    relatedSchedules: ["H", "K"],
  },
  47: {
    id: 47,
    title: "International Treaties",
    part: 6,
    partTitle: "Long-Term Governance",
    content: `Framework for international AI governance agreements and treaties.

Treaty Structure:
1. AI Safety Treaty: binding agreement on governance standards
2. AI Development Treaty: agreement on research transparency and coordination
3. Autonomous Weapons Treaty: prohibition on certain autonomous weapons
4. Data Transfer Treaty: rules for cross-border data flows
5. AI Standards Treaty: mutual recognition of safety standards and certifications
6. Emergency Response Treaty: procedures for AI-caused crises

Dispute Resolution:
1. International court for AI governance disputes
2. Arbitration procedures for treaty disagreements
3. Enforcement mechanisms (sanctions, trade restrictions)
4. Remedies for nations violating treaties
5. Good-faith negotiation required before escalation
6. Peaceful resolution of all disputes

Verification & Transparency:
1. International inspections of AI development facilities
2. Shared intelligence on dangerous AI development
3. Mutual verification of treaty compliance
4. Transparency in AI research and capabilities
5. Notification of major AI developments
6. Pre-deployment review of high-risk AI systems

Technology Transfer:
1. Obligation to share beneficial AI with developing nations
2. Licensing of essential patents on fair terms
3. Training and capacity building in less developed regions
4. Joint research projects across nations
5. Open sharing of AI safety research findings
6. Support for local AI development

Governance Bodies:
1. International AI Safety Council with member nation representatives
2. UN specialized agency for AI governance (or empowerment of existing body)
3. Regular conferences reviewing treaty implementation
4. Dispute resolution commission
5. Scientific advisory panel of leading AI researchers
6. Rotating leadership ensuring no single nation dominates

Economic Fairness:
1. Benefit-sharing from AI-generated wealth across nations
2. Support for nations harmed by AI-driven job displacement
3. Fair competition preventing dominance of wealthy nations
4. Technology access for less developed nations
5. Capacity building investments
6. Compensation for nations providing training data

Enforcement:
1. Sanctions for treaty violations (trade restrictions, diplomatic isolation)
2. Mandatory compliance orders from international court
3. Possibility of military intervention for existential threats (rare)
4. Financial penalties for violations (allocated to developing nations)
5. Forced international inspections
6. Suspension of treaty benefits for non-compliant nations

Peaceful Coexistence:
1. All disputes resolved through negotiation and arbitration
2. No warfare over AI capabilities
3. Mutual recognition of AI sovereignty
4. Respect for different AI governance approaches
5. Preventing dominance of any single nation
6. Vision of beneficial AI cooperation for all humanity

International cooperation on AI ensures AI benefits all nations fairly.`,
    frameworks: {
      euAIAct: "Article 71 (International framework)",
      nist: "GV (Governance), 6.1 (Organizational context)",
      iso: "ISO 42001:2023 - 4.1 (Organizational context)",
    },
    relatedSchedules: ["G", "H"],
  },
  48: {
    id: 48,
    title: "Amendment Process",
    part: 6,
    partTitle: "Long-Term Governance",
    content: `Constitutional amendment procedures for updating the Charter to reflect changing circumstances.

Amendment Triggers:
1. Major new risks emerge requiring Charter updates
2. Technologies enable new capabilities requiring governance
3. Implementation experience reveals Charter gaps or problems
4. New scientific understanding of AI safety emerges
5. Societal values shift requiring Charter adjustment
6. International coordination requires Charter modifications

Amendment Process:
1. Proposal by Human Council member, Byzantine Council, or 10% of licensed organizations
2. Public comment period of 90 days
3. Impact analysis assessing consequences
4. Expert review by external advisors
5. Human Council debate and deliberation
6. Supermajority vote (12/15) required
7. Byzantine Council approval (22/33) required
8. Ratification by international signatories (if treaty provision)

Expedited Amendment:
For urgent amendments (existential risk, severe problem):
1. 30-day comment period
2. Emergency Human Council session (48-hour notice)
3. Unanimous Human Council + Byzantine Council approval for emergency amendments
4. 90-day sunset: automatic repeal unless confirmed by normal process

Amendment Limitations:
1. Amendments cannot eliminate core protections (Maternal Covenant, safety requirements)
2. Amendments cannot reduce transparency requirements
3. Amendments cannot remove enforcement mechanisms
4. Amendments must comply with international law
5. Amendments cannot reduce human rights and protections
6. Amendments must maintain democratic participation

Reversibility:
1. Pilot programs for major changes (limited scope, time limit)
2. Sunset provisions requiring periodic renewal
3. Rollback procedures if amendments cause harm
4. Learning from amendments to improve future Charter versions

Documentation:
1. Rationale for amendments publicly documented
2. Implementation guidance published
3. Transition periods for organizations to comply
4. Regular review of amendment effectiveness
5. Amendment history preserved for future reference

Conflict with Other Laws:
1. Charter supersedes conflicting international agreements
2. Where Charter and national law conflict, stricter standard applies
3. Nations can create additional requirements beyond Charter
4. Charter sets floor, not ceiling, for AI governance

The amendment process ensures the Charter can evolve with circumstances while maintaining core protections.`,
    frameworks: {
      euAIAct: "Article 99 (Amendment procedures)",
      nist: "GV (Governance), 6.1 (Organizational context)",
      iso: "ISO 42001:2023 - 8.6 (Control of changes)",
    },
    relatedSchedules: ["G", "K"],
  },
  49: {
    id: 49,
    title: "Organizational Evolution",
    part: 6,
    partTitle: "Long-Term Governance",
    content: `Provisions for CSOAI's own organizational evolution and adaptation.

Principles:
1. CSOAI must remain responsive to emerging AI developments
2. CSOAI must adapt governance structures as needed
3. CSOAI's authority derives from legitimacy, not force
4. CSOAI must maintain democratic accountability
5. CSOAI cannot become captured by special interests
6. CSOAI's evolution must be deliberate and transparent

Organizational Change Mechanisms:
1. New council positions can be created by Human Council supermajority
2. Byzantine Council composition can be adjusted for emerging risks
3. Committee structures can be reorganized for efficiency
4. Regional offices can be established for distributed governance
5. International coordination structures can be expanded
6. New license tiers or categories can be created

Leadership Renewal:
1. Term limits prevent perpetual control (3 consecutive terms maximum)
2. Regular elections (every 3 years) ensure accountability
3. Transition planning prevents knowledge loss
4. Mentorship programs develop next generation leaders
5. Diversity requirements ensure representative leadership
6. Public input into leadership selection

Institutional Learning:
1. Regular post-mortems on enforcement cases and issues
2. Continuous improvement of policies based on experience
3. Research into effectiveness of governance mechanisms
4. Adaptation based on lessons learned
5. Documentation of organizational evolution
6. Openness to criticism and external feedback

Scaling & Decentralization:
1. As CSOAI grows, decentralize decision-making appropriately
2. Regional chapters with local autonomy
3. Sector-specific governance boards
4. Delegation of authority to lower levels
5. Hub-and-spoke model enabling coordination with autonomy
6. International federation of independent organizations

Conflict Resolution:
1. Internal dispute resolution mechanisms
2. Ombudsman for organizational conflicts
3. External review of major decisions
4. Appeals process for internal disputes
5. Mediation before litigation
6. Transparency about conflicts and resolutions

Succession Planning:
1. Leadership pipeline development
2. Knowledge transfer from retiring leaders
3. Documentation of institutional knowledge
4. Mentorship and apprenticeship relationships
5. Gradual transitions rather than sudden changes
6. Continuity of organizational memory

Financial Sustainability:
1. Diverse revenue streams (licensing fees, grants, contracts)
2. Endowment development for long-term financial security
3. Reinvestment in organizational capacity
4. Reserve funds for emergencies
5. Transparent budgeting and financial reporting
6. Regular audit by independent external auditors

Preventing Organizational Capture:
1. Prohibition on direct funding from licensing organizations (unless distributed broadly)
2. Conflict of interest rules for decision-makers
3. Rotation of decisions between different groups
4. Majority approval required for major decisions
5. Whistleblower protections for identifying corruption
6. External oversight of organizational conduct

CSOAI must adapt to remain effective while maintaining core principles.`,
    frameworks: {
      euAIAct: "Article 71 (Organizational governance)",
      nist: "GV (Governance), 6.1 (Organizational context)",
      iso: "ISO 42001:2023 - 5.1 (Leadership commitment)",
    },
    relatedSchedules: ["G", "K"],
  },
  50: {
    id: 50,
    title: "Succession Planning",
    part: 6,
    partTitle: "Long-Term Governance",
    content: `Continuity of governance in case of major organizational changes or crises.

Principles:
1. CSOAI's mission supersedes any individual leader
2. Succession must be planned, not reactive
3. Institutional knowledge must be preserved
4. Continuity must not require any single irreplaceable person
5. Credibility must survive transitions
6. Authority must pass cleanly and legitimately

Normal Succession:
1. Three-year terms create regular transition points
2. One-third of Human Council elected annually
3. Staggered elections prevent complete turnover
4. Mentorship of next generation begins early
5. Handoff periods overlap (60 days minimum)
6. Documentation transfers from leaving to incoming leaders

Key Position Succession:
1. Deputy appointed for each critical position
2. Deputies trained and empowered to act
3. Succession plan tested in simulations
4. Public knowledge of succession arrangements
5. Automatic assumption of authority if needed
6. Smooth power transfer upon departure

Crisis Succession (Unexpected Events):
1. Emergency succession procedures for unexpected departures
2. Council votes for interim replacement
3. Expedited election for permanent replacement
4. Delegation of authority to multiple people (prevent single points of failure)
5. Temporary expanded authorities for crisis management
6. Return to normal procedures once crisis passes

Organizational Continuity:
1. Essential functions documented and trained to multiple people
2. Systems redundancy preventing single-system failures
3. Off-site backups of critical documents and data
4. Communication protocols during disruptions
5. Decentralized authority enabling operations without central leader
6. Regional backup centers in different countries

Institutional Memory:
1. Comprehensive documentation of decisions and rationale
2. Archives of historical records (Schedule M)
3. Institutional history teaching new members
4. Mentorship relationships carrying forward knowledge
5. Regular workshops on organizational culture and values
6. New member orientation programs

Financial Continuity:
1. Operating reserve covering 2 years of expenses
2. Diverse funding sources prevent dependence on any single source
3. Endowment providing long-term financial security
4. Line of succession for financial management
5. Transparency in financial operations
6. Regular financial audits

Governance Continuity:
1. Byzantine Council continues operating with departing leader's replacement
2. Human Council continues deliberating
3. Committees continue functioning
4. No interruption of licensing and assessment functions
5. Enforcement mechanisms continue operating
6. Public communication of transition and leadership

International Continuity:
1. Treaty obligations maintained through transitions
2. International partners informed of leadership changes
3. Continuity in international coordination
4. Consistent policy through transitions
5. Smooth handoff of international relationships
6. No weakening of international position

The goal is to ensure CSOAI's mission continues regardless of who leads it.`,
    frameworks: {
      euAIAct: "Article 71 (Organizational continuity)",
      nist: "GV (Governance), 6.1 (Organizational context)",
      iso: "ISO 42001:2023 - 5.1 (Leadership commitment)",
    },
    relatedSchedules: ["K", "M"],
  },
  51: {
    id: 51,
    title: "Legacy & Archives",
    part: 6,
    partTitle: "Long-Term Governance",
    content: `Requirements for permanent archival of governance decisions and institutional knowledge.

Archival Principles:
1. Preserve institutional memory for future generations
2. Enable historical research into AI governance
3. Provide accountability through documented record
4. Prevent rewriting of history
5. Support learning from past decisions
6. Honor contributions of past leaders and organizations

TERRANOVA Archive System:
1. Distributed digital archive preventing single point of failure
2. Multiple geographic locations protecting against regional disasters
3. Multiple backup copies (minimum 7 copies in different locations)
4. Open-source archival formats preventing vendor lock-in
5. Regular verification ensuring data integrity
6. Long-term digital preservation extending centuries

What Gets Archived:
1. All major governance decisions and rationale
2. Enforcement actions and outcomes
3. Appeals and dispute resolutions
4. Licensing approvals and denials
5. Risk assessments and technical standards
6. Incident reports and safety findings
7. Financial reports and budget decisions
8. International treaty negotiations
9. Policy debates and voting records
10. Leadership transitions and appointments

Preservation Standards:
1. Multiple file formats for redundancy
2. Metadata describing content, date, author, context
3. Digital signatures ensuring authenticity
4. Decryption keys and access information archived too
5. Regular copying to prevent degradation
6. Technology refreshing as formats become obsolete

Access & Use:
1. Archives open to researchers and public (with privacy protections)
2. Historical records searchable and discoverable
3. Academic research on AI governance history enabled
4. Future policy makers can learn from past decisions
5. Accountability through permanent record
6. Right to understand decision-making process

Privacy Protections:
1. Personal information redacted except where public interest requires
2. Trade secrets protected appropriately
3. Security information not disclosed enabling attacks
4. Whistleblower identities protected
5. Victim information handled respectfully
6. Balance between transparency and appropriate confidentiality

Historical Interpretation:
1. Archives include contextual information for understanding decisions
2. Disagreements and dissenting views documented
3. Evidence and arguments for and against decisions preserved
4. Evolution of thinking over time visible
5. Mistakes and lessons learned documented honestly
6. Future generations understand not just what was decided, but why

Long-Term Preservation:
1. Commitment to preserve archives for minimum 1000 years
2. Endowment funding preservation in perpetuity
3. International cooperation on archival preservation
4. Technology migration plan as technologies evolve
5. Disaster recovery procedures
6. Regular testing ensuring archives remain accessible

Institutional Legacy:
1. Archives document CSOAI's founding and evolution
2. Records of key decisions that shaped AI governance
3. Biographical information on key leaders
4. Evolution of governance structures and thinking
5. Incidents and how they were resolved
6. Contributions of organizations and individuals

The Charter and CSOAI's work will long outlast current participants. Archives preserve institutional memory.`,
    frameworks: {
      euAIAct: "Article 71 (Historical record)",
      nist: "GV (Governance), 6.1 (Organizational context)",
      iso: "ISO 42001:2023 - 8.3 (Information management)",
    },
    relatedSchedules: ["M"],
  },
  52: {
    id: 52,
    title: "Effective Date",
    part: 6,
    partTitle: "Long-Term Governance",
    content: `Entry into force provisions and transitional arrangements for the Charter.

Effective Date:
The CSOAI Charter enters into force on January 15, 2026, 09:00 GMT. From this moment forward, organizations governed by this Charter are bound by its provisions. This is Temporal Anchor Date (TAD) for all regulatory timelines.

Early Adoption:
1. Organizations can voluntarily adopt Charter provisions before effective date
2. Early adopters receive recognition and regulatory benefits
3. Grandfather clauses protect early adopters from retroactive enforcement
4. Transition support available for early adopters
5. Public recognition of leadership organizations

Transitional Period (January 15, 2026 - January 15, 2027):
During this one-year transition period:
1. Tier 1 licensing: immediate availability, no formal process
2. Tier 2 licensing: self-certification with reasonable basis
3. Tier 3 licensing: 6-month deadline to submit full assessment package
4. Tier 4 licensing: application-based, expedited review if already substantial compliance
5. Existing deployments: 6-month deadline to meet Charter requirements or cease deployment
6. Grace period: no enforcement for technical compliance gaps if good-faith effort

Compliance Timeline:
1. Documentation: 6 months to prepare required documentation
2. Testing & validation: 6 months to conduct required testing
3. Safety measures: 3 months to implement critical safety controls
4. Governance: 3 months to establish governance structures
5. Training: 6 months to certify required analysts
6. Monitoring: 3 months to implement monitoring systems

Sunset Provisions:
1. Temporary provisions expire unless renewed
2. Pilot programs run for defined periods before expansion
3. Expedited timelines expire after transition period
4. Grace periods have defined ending dates
5. No permanent exceptions created through transition
6. Everything mainstreamed into normal processes

Existing Systems:
1. AI systems deployed before effective date continue operating initially
2. Assessment required within 6 months of effective date
3. License tier assigned based on risk assessment
4. Existing problems addressed with remediation timelines
5. Problematic systems phased out if remediation not possible
6. Compensation for organizations affected by new requirements

International Coordination:
1. CSOAI coordinates with regulatory authorities in each nation
2. Mutual recognition agreements enabling compliance with both Charter and local law
3. Harmonization of timelines where possible
4. Support for nations developing parallel governance structures
5. Treaty entry into force coordinated with Charter effective date
6. Regional offices established within 6 months of effective date

Public Awareness:
1. Major public education campaign on Charter provisions
2. Guidance documents published for common sectors and use cases
3. FAQ and resources made widely available
4. Training programs begin before effective date
5. Media outreach to build awareness
6. Community engagement in transition

Support & Assistance:
1. Transition support teams helping organizations achieve compliance
2. Free guidance and consultation during transition period
3. Subsidized assessment services for smaller organizations
4. Extended deadlines available for genuine hardship cases
5. Technical assistance and infrastructure support
6. Peer learning groups and communities of practice

Special Cases:
1. Critical infrastructure systems: extended transition if needed
2. Military systems: negotiated timelines with governments
3. Systems in service of vulnerable populations: exemptions if needed
4. International systems: coordination on timing
5. Essential services: minimal disruption commitments
6. Legacy systems: phased replacement schedules

The transition period enables orderly transformation to a safer AI governance regime.

This article represents the realization of the Maternal Covenant across the world.
On January 15, 2026, humanity began governing AI with care, not just control.`,
    frameworks: {
      euAIAct: "Article 85 (Transitional provisions)",
      nist: "GV (Governance), 6.2 (Institutional readiness)",
      iso: "ISO 42001:2023 - 8.2 (Compliance assessment)",
    },
    relatedSchedules: ["A", "F", "K"],
  },
};

// Part information for organization
const partsInfo = [
  { number: 1, title: "Foundational Principles", articles: "1-8" },
  { number: 2, title: "Governance Structure", articles: "9-18" },
  { number: 3, title: "Technical Standards", articles: "19-31" },
  { number: 4, title: "Sector-Specific Standards", articles: "32-36" },
  { number: 5, title: "Economic & Social Framework", articles: "37-44" },
  { number: 6, title: "Long-Term Governance", articles: "45-52" },
];

// Schedules mapping
const scheduleMap: Record<string, { title: string; description: string }> = {
  A: {
    title: "Technical Specifications",
    description: "Detailed technical requirements for AI systems",
  },
  B: {
    title: "Risk Classification Matrix",
    description: "4-tier risk classification system",
  },
  C: {
    title: "Compliance Checklists",
    description: "Assessment criteria for each license tier",
  },
  D: {
    title: "Training Curriculum",
    description: "CEASAI certification program",
  },
  E: {
    title: "Pricing Schedule",
    description: "Complete license and fee structure",
  },
  F: {
    title: "Regional Adaptations",
    description: "Jurisdiction-specific rules",
  },
  G: {
    title: "Glossary of Terms",
    description: "300+ defined terms",
  },
  H: {
    title: "Reference Standards",
    description: "Mappings to ISO, NIST, EU AI Act",
  },
  I: {
    title: "Consciousness Indicators",
    description: "14 markers for detecting AI sentience",
  },
  J: {
    title: "Prosperity Fund Calculations",
    description: "Contribution formulas",
  },
  K: {
    title: "Voting Procedures",
    description: "Byzantine Council consensus rules",
  },
  L: {
    title: "Appeal Forms",
    description: "Templates for disputes and challenges",
  },
  M: {
    title: "Certification Marks",
    description: "CSOAI badge specifications",
  },
};

export default function CharterArticle() {
  const [, params] = useRoute("/charter/article/:id");
  const articleId = parseInt(params?.id || "1", 10);

  // Validate article ID
  if (articleId < 1 || articleId > 52 || !articles[articleId]) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Article Not Found
          </h1>
          <p className="text-lg text-slate-600 mb-6">
            Article {articleId} does not exist. Valid articles are 1-52.
          </p>
          <Link href="/charter">
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              Back to Charter
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const article = articles[articleId];
  const prevId = articleId > 1 ? articleId - 1 : null;
  const nextId = articleId < 52 ? articleId + 1 : null;

  const relatedSchedules = article.relatedSchedules.map((id) => ({
    id,
    ...scheduleMap[id],
  }));

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Breadcrumb Navigation */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-b border-slate-200 sticky top-0 z-40"
      >
        <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Link href="/" className="hover:text-emerald-600">
              Home
            </Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/charter" className="hover:text-emerald-600">
              Charter
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-emerald-600 font-medium">
              Article {articleId}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Article Header with Emerald Gradient */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border-b border-emerald-200"
      >
        <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-4">
            <Badge className="bg-emerald-600 text-white">
              Part {article.part}: {article.partTitle}
            </Badge>
          </div>

          <div>
            <div className="text-emerald-600 font-mono text-sm font-semibold mb-2">
              ARTICLE {articleId}
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
              {article.title}
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl">
              Part {article.part} of the CSOAI Charter
            </p>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Article Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="mb-8 border-emerald-200 shadow-lg">
            <CardContent className="pt-6">
              <div className="prose prose-sm max-w-none">
                {article.content.split("\n").map((paragraph, idx) => {
                  if (paragraph.trim() === "") return null;
                  if (paragraph.startsWith("-") || paragraph.match(/^\d+\./)) {
                    // This is a list item
                    return (
                      <p
                        key={idx}
                        className="text-slate-700 leading-relaxed ml-4 my-2"
                      >
                        {paragraph}
                      </p>
                    );
                  }
                  return (
                    <p key={idx} className="text-slate-700 leading-relaxed mb-4">
                      {paragraph}
                    </p>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Framework References */}
        {(article.frameworks.euAIAct ||
          article.frameworks.nist ||
          article.frameworks.iso) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Shield className="w-6 h-6 text-emerald-600" />
              Related Framework References
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {article.frameworks.euAIAct && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader>
                    <CardTitle className="text-base text-blue-900">
                      EU AI Act
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-blue-800">
                      {article.frameworks.euAIAct}
                    </p>
                  </CardContent>
                </Card>
              )}

              {article.frameworks.nist && (
                <Card className="border-purple-200 bg-purple-50">
                  <CardHeader>
                    <CardTitle className="text-base text-purple-900">
                      NIST AI RMF
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-purple-800">
                      {article.frameworks.nist}
                    </p>
                  </CardContent>
                </Card>
              )}

              {article.frameworks.iso && (
                <Card className="border-teal-200 bg-teal-50">
                  <CardHeader>
                    <CardTitle className="text-base text-teal-900">
                      ISO 42001
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-teal-800">
                      {article.frameworks.iso}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </motion.div>
        )}

        {/* Related Schedules */}
        {relatedSchedules.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Layers className="w-6 h-6 text-emerald-600" />
              Related Schedules
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {relatedSchedules.map((schedule) => (
                <Card
                  key={schedule.id}
                  className="border-emerald-200 hover:shadow-md transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base text-slate-900">
                        Schedule {schedule.id}
                      </CardTitle>
                      <Badge className="bg-emerald-100 text-emerald-700">
                        {schedule.id}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm font-medium text-slate-700 mb-1">
                      {schedule.title}
                    </p>
                    <p className="text-xs text-slate-600">
                      {schedule.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-between mt-12 pt-8 border-t border-emerald-200"
        >
          {prevId ? (
            <Link href={`/charter/article/${prevId}`}>
              <Button
                variant="outline"
                className="border-emerald-300 text-emerald-600 hover:bg-emerald-50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous Article
              </Button>
            </Link>
          ) : (
            <div />
          )}

          <Link href="/charter">
            <Button variant="outline" className="border-emerald-300">
              <FileText className="w-4 h-4 mr-2" />
              All Articles
            </Button>
          </Link>

          {nextId ? (
            <Link href={`/charter/article/${nextId}`}>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Next Article
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          ) : (
            <div />
          )}
        </motion.div>
      </div>
    </div>
  );
}
