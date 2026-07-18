/**
 * Seed script for certification exam questions
 * Run with: pnpm tsx scripts/seed-exam-questions.ts
 */

import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import { testQuestions, certificationTests, trainingModules } from "../drizzle/schema";

interface QuestionData {
  questionText: string;
  questionType: "multiple_choice" | "true_false" | "scenario";
  options: { id: string; text: string }[];
  correctAnswer: string;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
  category: string; // For reference, maps to module
  points: number;
}

// Comprehensive question bank organized by category
const questions: QuestionData[] = [
  // ============================================
  // EU AI ACT QUESTIONS (15 questions)
  // ============================================
  {
    questionText: "Under the EU AI Act, which of the following AI systems is classified as 'unacceptable risk' and therefore prohibited?",
    questionType: "multiple_choice",
    options: [
      { id: "A", text: "AI systems used for credit scoring" },
      { id: "B", text: "AI systems that exploit vulnerabilities of specific groups to materially distort behavior" },
      { id: "C", text: "AI systems for emotion recognition in the workplace" },
      { id: "D", text: "AI chatbots for customer service" }
    ],
    correctAnswer: "B",
    explanation: "The EU AI Act prohibits AI systems that exploit vulnerabilities of specific groups (age, disability, social/economic situation) to materially distort behavior in ways that cause significant harm. This falls under 'unacceptable risk' in Article 5.",
    difficulty: "medium",
    category: "EU_AI_ACT",
    points: 1
  },
  {
    questionText: "What is the maximum administrative fine for non-compliance with prohibited AI practices under the EU AI Act?",
    questionType: "multiple_choice",
    options: [
      { id: "A", text: "€10 million or 2% of annual worldwide turnover" },
      { id: "B", text: "€20 million or 4% of annual worldwide turnover" },
      { id: "C", text: "€35 million or 7% of annual worldwide turnover" },
      { id: "D", text: "€50 million or 10% of annual worldwide turnover" }
    ],
    correctAnswer: "C",
    explanation: "Under Article 99 of the EU AI Act, violations of prohibited AI practices can result in fines up to €35 million or 7% of total worldwide annual turnover, whichever is higher.",
    difficulty: "hard",
    category: "EU_AI_ACT",
    points: 1
  },
  {
    questionText: "Which body is responsible for coordinating the enforcement of the EU AI Act across member states?",
    questionType: "multiple_choice",
    options: [
      { id: "A", text: "European Data Protection Board" },
      { id: "B", text: "European AI Office" },
      { id: "C", text: "European Commission" },
      { id: "D", text: "European Court of Justice" }
    ],
    correctAnswer: "B",
    explanation: "The European AI Office, established within the European Commission, coordinates enforcement and provides guidance on the EU AI Act implementation across all member states.",
    difficulty: "medium",
    category: "EU_AI_ACT",
    points: 1
  },
  {
    questionText: "Under the EU AI Act, high-risk AI systems must maintain technical documentation for how long after the system is placed on the market?",
    questionType: "multiple_choice",
    options: [
      { id: "A", text: "5 years" },
      { id: "B", text: "10 years" },
      { id: "C", text: "15 years" },
      { id: "D", text: "Indefinitely" }
    ],
    correctAnswer: "B",
    explanation: "Article 18 of the EU AI Act requires providers of high-risk AI systems to keep technical documentation available for 10 years after the AI system has been placed on the market or put into service.",
    difficulty: "medium",
    category: "EU_AI_ACT",
    points: 1
  },
  {
    questionText: "Which of the following is NOT a requirement for high-risk AI systems under the EU AI Act?",
    questionType: "multiple_choice",
    options: [
      { id: "A", text: "Risk management system" },
      { id: "B", text: "Data governance and management practices" },
      { id: "C", text: "Open-source code publication" },
      { id: "D", text: "Human oversight measures" }
    ],
    correctAnswer: "C",
    explanation: "The EU AI Act does not require open-source code publication. High-risk AI systems must have risk management, data governance, technical documentation, record-keeping, transparency, human oversight, and accuracy/robustness measures.",
    difficulty: "easy",
    category: "EU_AI_ACT",
    points: 1
  },
  {
    questionText: "According to the EU AI Act, AI systems used for biometric categorization based on sensitive attributes are:",
    questionType: "multiple_choice",
    options: [
      { id: "A", text: "Permitted without restrictions" },
      { id: "B", text: "Classified as minimal risk" },
      { id: "C", text: "Classified as high-risk" },
      { id: "D", text: "Prohibited" }
    ],
    correctAnswer: "D",
    explanation: "Article 5 of the EU AI Act prohibits AI systems that categorize individuals based on biometric data to deduce or infer sensitive attributes such as race, political opinions, religious beliefs, or sexual orientation.",
    difficulty: "medium",
    category: "EU_AI_ACT",
    points: 1
  },
  {
    questionText: "What transparency obligation applies to AI systems that generate synthetic content (deepfakes)?",
    questionType: "multiple_choice",
    options: [
      { id: "A", text: "No specific obligations" },
      { id: "B", text: "Must be labeled as AI-generated in a machine-readable format" },
      { id: "C", text: "Must be reviewed by human moderators before publication" },
      { id: "D", text: "Must be registered in a central EU database" }
    ],
    correctAnswer: "B",
    explanation: "Article 50 requires that AI-generated or manipulated content (including deepfakes) must be marked in a machine-readable format and disclosed to recipients that the content was artificially generated or manipulated.",
    difficulty: "medium",
    category: "EU_AI_ACT",
    points: 1
  },
  {
    questionText: "Under the EU AI Act, which entity bears primary responsibility for ensuring high-risk AI system compliance?",
    questionType: "multiple_choice",
    options: [
      { id: "A", text: "The end user" },
      { id: "B", text: "The provider (developer)" },
      { id: "C", text: "The deployer" },
      { id: "D", text: "The national supervisory authority" }
    ],
    correctAnswer: "B",
    explanation: "The provider (developer) of a high-risk AI system bears primary responsibility for compliance, including conformity assessment, CE marking, and maintaining technical documentation.",
    difficulty: "easy",
    category: "EU_AI_ACT",
    points: 1
  },
  {
    questionText: "The EU AI Act requires a conformity assessment for high-risk AI systems. Which type requires third-party assessment?",
    questionType: "multiple_choice",
    options: [
      { id: "A", text: "All high-risk AI systems" },
      { id: "B", text: "Only AI systems in critical infrastructure" },
      { id: "C", text: "Biometric identification systems and certain safety components" },
      { id: "D", text: "Only AI systems processing personal data" }
    ],
    correctAnswer: "C",
    explanation: "While most high-risk AI systems can use self-assessment, remote biometric identification systems and certain safety components of products require third-party conformity assessment by a notified body.",
    difficulty: "hard",
    category: "EU_AI_ACT",
    points: 1
  },
  {
    questionText: "What is the 'regulatory sandbox' provision in the EU AI Act?",
    questionType: "multiple_choice",
    options: [
      { id: "A", text: "A testing environment exempt from all AI regulations" },
      { id: "B", text: "A controlled environment for developing and testing innovative AI under regulatory supervision" },
      { id: "C", text: "A database for registering all AI systems" },
      { id: "D", text: "A penalty reduction program for first-time offenders" }
    ],
    correctAnswer: "B",
    explanation: "Regulatory sandboxes (Article 57) provide controlled environments where innovative AI systems can be developed, trained, and tested under regulatory supervision before market placement, allowing for regulatory learning and adaptation.",
    difficulty: "medium",
    category: "EU_AI_ACT",
    points: 1
  },

  // ============================================
  // NIST AI RMF QUESTIONS (12 questions)
  // ============================================
  {
    questionText: "What are the four core functions of the NIST AI Risk Management Framework?",
    questionType: "multiple_choice",
    options: [
      { id: "A", text: "Identify, Protect, Detect, Respond" },
      { id: "B", text: "Govern, Map, Measure, Manage" },
      { id: "C", text: "Plan, Do, Check, Act" },
      { id: "D", text: "Assess, Design, Implement, Monitor" }
    ],
    correctAnswer: "B",
    explanation: "The NIST AI RMF is built around four core functions: GOVERN (cultivate culture of risk management), MAP (contextualize AI system), MEASURE (analyze and assess risks), and MANAGE (prioritize and act on risks).",
    difficulty: "easy",
    category: "NIST_RMF",
    points: 1
  },
  {
    questionText: "In the NIST AI RMF, what does the GOVERN function primarily address?",
    questionType: "multiple_choice",
    options: [
      { id: "A", text: "Technical implementation of AI systems" },
      { id: "B", text: "Organizational culture, policies, and accountability structures" },
      { id: "C", text: "Measurement of AI system performance" },
      { id: "D", text: "Incident response procedures" }
    ],
    correctAnswer: "B",
    explanation: "The GOVERN function focuses on cultivating a culture of risk management, establishing policies, defining roles and responsibilities, and creating accountability structures for AI risk management across the organization.",
    difficulty: "medium",
    category: "NIST_RMF",
    points: 1
  },
  {
    questionText: "According to NIST AI RMF, which characteristic relates to AI systems operating reliably within defined conditions?",
    questionType: "multiple_choice",
    options: [
      { id: "A", text: "Explainability" },
      { id: "B", text: "Fairness" },
      { id: "C", text: "Robustness" },
      { id: "D", text: "Accountability" }
    ],
    correctAnswer: "C",
    explanation: "Robustness in the NIST AI RMF refers to the ability of an AI system to maintain its level of performance under various conditions, including adversarial inputs, data drift, and unexpected operational scenarios.",
    difficulty: "medium",
    category: "NIST_RMF",
    points: 1
  },
  {
    questionText: "The NIST AI RMF MAP function includes which of the following activities?",
    questionType: "multiple_choice",
    options: [
      { id: "A", text: "Setting organizational AI policies" },
      { id: "B", text: "Categorizing AI systems and identifying potential impacts" },
      { id: "C", text: "Implementing technical controls" },
      { id: "D", text: "Conducting post-incident reviews" }
    ],
    correctAnswer: "B",
    explanation: "The MAP function involves understanding the AI system context, categorizing systems, identifying stakeholders, and determining potential positive and negative impacts across the AI lifecycle.",
    difficulty: "medium",
    category: "NIST_RMF",
    points: 1
  },
  {
    questionText: "What is 'AI system provenance' as referenced in the NIST AI RMF?",
    questionType: "multiple_choice",
    options: [
      { id: "A", text: "The geographic origin of AI development" },
      { id: "B", text: "Documentation of AI system lineage, including data sources and model development history" },
      { id: "C", text: "The legal ownership of AI intellectual property" },
      { id: "D", text: "The certification status of AI systems" }
    ],
    correctAnswer: "B",
    explanation: "AI system provenance refers to the documented history and lineage of an AI system, including data sources, preprocessing steps, model architecture decisions, training procedures, and version history.",
    difficulty: "hard",
    category: "NIST_RMF",
    points: 1
  },
  {
    questionText: "In the NIST AI RMF, what does the MEASURE function primarily involve?",
    questionType: "multiple_choice",
    options: [
      { id: "A", text: "Measuring financial return on AI investments" },
      { id: "B", text: "Analyzing, assessing, benchmarking, and monitoring AI risks" },
      { id: "C", text: "Measuring employee satisfaction with AI tools" },
      { id: "D", text: "Calculating computational resource usage" }
    ],
    correctAnswer: "B",
    explanation: "The MEASURE function employs quantitative and qualitative methods to analyze, assess, benchmark, and monitor AI risks and impacts, including tracking metrics over time and comparing against established baselines.",
    difficulty: "easy",
    category: "NIST_RMF",
    points: 1
  },
  {
    questionText: "According to NIST, which trustworthy AI characteristic ensures that AI decisions can be understood by humans?",
    questionType: "multiple_choice",
    options: [
      { id: "A", text: "Privacy" },
      { id: "B", text: "Explainability" },
      { id: "C", text: "Security" },
      { id: "D", text: "Validity" }
    ],
    correctAnswer: "B",
    explanation: "Explainability (also called interpretability) ensures that AI system outputs and decision-making processes can be understood by humans, enabling appropriate trust, oversight, and accountability.",
    difficulty: "easy",
    category: "NIST_RMF",
    points: 1
  },
  {
    questionText: "The NIST AI RMF MANAGE function includes which activity?",
    questionType: "multiple_choice",
    options: [
      { id: "A", text: "Identifying AI system stakeholders" },
      { id: "B", text: "Prioritizing risks and implementing mitigation strategies" },
      { id: "C", text: "Defining organizational AI policies" },
      { id: "D", text: "Measuring AI system accuracy" }
    ],
    correctAnswer: "B",
    explanation: "The MANAGE function involves prioritizing identified risks, allocating resources, implementing mitigation strategies, and taking action to address AI risks based on the organization's risk tolerance.",
    difficulty: "medium",
    category: "NIST_RMF",
    points: 1
  },
  {
    questionText: "What is 'emergent behavior' in AI systems as described by NIST?",
    questionType: "multiple_choice",
    options: [
      { id: "A", text: "Planned system upgrades" },
      { id: "B", text: "Unexpected capabilities or behaviors that arise from complex AI systems" },
      { id: "C", text: "Standard error handling procedures" },
      { id: "D", text: "User-requested feature additions" }
    ],
    correctAnswer: "B",
    explanation: "Emergent behavior refers to unexpected capabilities, outputs, or behaviors that arise from AI systems, particularly complex ones like large language models, which may not have been anticipated during development.",
    difficulty: "hard",
    category: "NIST_RMF",
    points: 1
  },
  {
    questionText: "According to NIST AI RMF, what is the relationship between AI risk management and existing enterprise risk management?",
    questionType: "multiple_choice",
    options: [
      { id: "A", text: "AI risk management should replace existing risk management" },
      { id: "B", text: "AI risk management should be integrated with existing enterprise risk management" },
      { id: "C", text: "AI risk management should operate independently" },
      { id: "D", text: "AI risk management is only for technology departments" }
    ],
    correctAnswer: "B",
    explanation: "NIST recommends integrating AI risk management into existing enterprise risk management frameworks, leveraging established processes while addressing AI-specific considerations.",
    difficulty: "medium",
    category: "NIST_RMF",
    points: 1
  },

  // ============================================
  // TC260 / CHINA AI GOVERNANCE (8 questions)
  // ============================================
  {
    questionText: "What is TC260 in the context of AI governance?",
    questionType: "multiple_choice",
    options: [
      { id: "A", text: "A European AI certification body" },
      { id: "B", text: "China's National Information Security Standardization Technical Committee" },
      { id: "C", text: "A US federal AI agency" },
      { id: "D", text: "An international AI standards organization" }
    ],
    correctAnswer: "B",
    explanation: "TC260 (National Information Security Standardization Technical Committee) is China's primary body for developing cybersecurity and AI safety standards, including the AI Safety Governance Framework.",
    difficulty: "medium",
    category: "TC260",
    points: 1
  },
  {
    questionText: "How many governance measures are outlined in China's TC260 AI Safety Governance Framework?",
    questionType: "multiple_choice",
    options: [
      { id: "A", text: "7" },
      { id: "B", text: "10" },
      { id: "C", text: "14" },
      { id: "D", text: "20" }
    ],
    correctAnswer: "C",
    explanation: "The TC260 AI Safety Governance Framework outlines 14 specific governance measures covering the entire AI lifecycle from development through deployment and monitoring.",
    difficulty: "hard",
    category: "TC260",
    points: 1
  },
  {
    questionText: "Under China's AI regulations, which type of AI service requires algorithm registration with the Cyberspace Administration?",
    questionType: "multiple_choice",
    options: [
      { id: "A", text: "All AI services" },
      { id: "B", text: "Only government AI systems" },
      { id: "C", text: "Recommendation algorithms and generative AI services" },
      { id: "D", text: "Only autonomous vehicles" }
    ],
    correctAnswer: "C",
    explanation: "China requires algorithm registration for recommendation algorithms (under the Algorithm Recommendation Regulations) and generative AI services (under the Generative AI Measures) with the Cyberspace Administration of China.",
    difficulty: "medium",
    category: "TC260",
    points: 1
  },
  {
    questionText: "What is the 'socialist core values' requirement in China's generative AI regulations?",
    questionType: "multiple_choice",
    options: [
      { id: "A", text: "AI must promote economic growth" },
      { id: "B", text: "AI-generated content must align with state-approved values and not undermine social stability" },
      { id: "C", text: "AI must be developed by state-owned enterprises" },
      { id: "D", text: "AI must use Chinese language only" }
    ],
    correctAnswer: "B",
    explanation: "China's Generative AI Measures require that AI-generated content adheres to socialist core values, does not contain content that could undermine state power, national unity, or social stability.",
    difficulty: "medium",
    category: "TC260",
    points: 1
  },
  {
    questionText: "Which principle is emphasized in both EU AI Act and TC260 frameworks?",
    questionType: "multiple_choice",
    options: [
      { id: "A", text: "AI development should be unrestricted" },
      { id: "B", text: "Human oversight and control of AI systems" },
      { id: "C", text: "AI should replace human decision-making entirely" },
      { id: "D", text: "AI development should be government-controlled" }
    ],
    correctAnswer: "B",
    explanation: "Both the EU AI Act and TC260 framework emphasize the importance of human oversight and maintaining human control over AI systems, though they differ in implementation approaches.",
    difficulty: "easy",
    category: "TC260",
    points: 1
  },
  {
    questionText: "Under China's AI governance framework, what is required before deploying a generative AI service to the public?",
    questionType: "multiple_choice",
    options: [
      { id: "A", text: "No requirements" },
      { id: "B", text: "Security assessment and algorithm filing" },
      { id: "C", text: "International certification" },
      { id: "D", text: "Open-source publication" }
    ],
    correctAnswer: "B",
    explanation: "China's Generative AI Measures require providers to conduct security assessments and file their algorithms with the Cyberspace Administration before offering services to the public.",
    difficulty: "medium",
    category: "TC260",
    points: 1
  },

  // ============================================
  // AI ETHICS & BIAS (10 questions)
  // ============================================
  {
    questionText: "What is 'algorithmic bias' in AI systems?",
    questionType: "multiple_choice",
    options: [
      { id: "A", text: "Intentional discrimination programmed by developers" },
      { id: "B", text: "Systematic errors that create unfair outcomes for certain groups" },
      { id: "C", text: "Preference for certain programming languages" },
      { id: "D", text: "Hardware limitations affecting performance" }
    ],
    correctAnswer: "B",
    explanation: "Algorithmic bias refers to systematic and repeatable errors in AI systems that create unfair outcomes, such as privileging one group over another. It can arise from biased training data, flawed algorithms, or inappropriate use.",
    difficulty: "easy",
    category: "ETHICS",
    points: 1
  },
  {
    questionText: "Which of the following is an example of 'proxy discrimination' in AI?",
    questionType: "multiple_choice",
    options: [
      { id: "A", text: "Using race directly as a feature in a model" },
      { id: "B", text: "Using zip code as a feature that correlates with race" },
      { id: "C", text: "Removing all demographic data from training" },
      { id: "D", text: "Using random sampling for training data" }
    ],
    correctAnswer: "B",
    explanation: "Proxy discrimination occurs when seemingly neutral features (like zip code) serve as proxies for protected characteristics (like race) because they are highly correlated, leading to discriminatory outcomes even without explicit use of protected attributes.",
    difficulty: "medium",
    category: "ETHICS",
    points: 1
  },
  {
    questionText: "What is 'fairness through unawareness' and why is it problematic?",
    questionType: "multiple_choice",
    options: [
      { id: "A", text: "It's the gold standard for fair AI development" },
      { id: "B", text: "Simply removing protected attributes doesn't prevent discrimination due to proxy variables" },
      { id: "C", text: "It requires too much computational power" },
      { id: "D", text: "It's only applicable to image recognition systems" }
    ],
    correctAnswer: "B",
    explanation: "Fairness through unawareness—simply removing protected attributes from training data—is problematic because other features can serve as proxies for protected characteristics, still leading to discriminatory outcomes.",
    difficulty: "hard",
    category: "ETHICS",
    points: 1
  },
  {
    questionText: "What is 'disparate impact' in the context of AI systems?",
    questionType: "multiple_choice",
    options: [
      { id: "A", text: "When AI systems crash unexpectedly" },
      { id: "B", text: "When a neutral policy disproportionately affects a protected group" },
      { id: "C", text: "When AI systems have different performance on different hardware" },
      { id: "D", text: "When AI systems are deployed in different regions" }
    ],
    correctAnswer: "B",
    explanation: "Disparate impact occurs when a facially neutral policy or practice disproportionately affects members of a protected group, even without discriminatory intent. In AI, this often manifests as different error rates across demographic groups.",
    difficulty: "medium",
    category: "ETHICS",
    points: 1
  },
  {
    questionText: "Which metric measures whether an AI system has equal true positive rates across groups?",
    questionType: "multiple_choice",
    options: [
      { id: "A", text: "Demographic parity" },
      { id: "B", text: "Equal opportunity" },
      { id: "C", text: "Calibration" },
      { id: "D", text: "Individual fairness" }
    ],
    correctAnswer: "B",
    explanation: "Equal opportunity (also called equality of opportunity) requires that the true positive rate (sensitivity/recall) be equal across protected groups, ensuring qualified individuals have equal chances of positive outcomes.",
    difficulty: "hard",
    category: "ETHICS",
    points: 1
  },
  {
    questionText: "What is the 'right to explanation' in AI decision-making?",
    questionType: "multiple_choice",
    options: [
      { id: "A", text: "The right to access AI source code" },
      { id: "B", text: "The right to understand how an automated decision affecting you was made" },
      { id: "C", text: "The right to modify AI algorithms" },
      { id: "D", text: "The right to use AI systems for free" }
    ],
    correctAnswer: "B",
    explanation: "The right to explanation gives individuals the right to receive meaningful information about the logic involved in automated decisions that significantly affect them, enabling them to understand and potentially contest such decisions.",
    difficulty: "easy",
    category: "ETHICS",
    points: 1
  },
  {
    questionText: "What is 'model card' documentation in responsible AI?",
    questionType: "multiple_choice",
    options: [
      { id: "A", text: "A physical card containing AI hardware specifications" },
      { id: "B", text: "Standardized documentation of model performance, limitations, and intended use" },
      { id: "C", text: "A credit card for purchasing AI services" },
      { id: "D", text: "A security access card for AI systems" }
    ],
    correctAnswer: "B",
    explanation: "Model cards are standardized documentation that accompanies AI models, describing their performance characteristics, intended use cases, limitations, ethical considerations, and evaluation results across different demographic groups.",
    difficulty: "medium",
    category: "ETHICS",
    points: 1
  },
  {
    questionText: "What is 'automation bias' in human-AI interaction?",
    questionType: "multiple_choice",
    options: [
      { id: "A", text: "Preference for manual processes over automation" },
      { id: "B", text: "Tendency to over-rely on automated systems and ignore contradicting information" },
      { id: "C", text: "Bias in how automation systems are programmed" },
      { id: "D", text: "Discrimination against automated workers" }
    ],
    correctAnswer: "B",
    explanation: "Automation bias is the tendency for humans to favor suggestions from automated systems, potentially ignoring contradicting information or failing to exercise appropriate oversight, which can lead to errors in high-stakes decisions.",
    difficulty: "medium",
    category: "ETHICS",
    points: 1
  },

  // ============================================
  // INCIDENT ANALYSIS & WATCHDOG PROCEDURES (10 questions)
  // ============================================
  {
    questionText: "What is the first step a Watchdog Analyst should take when receiving a new incident report?",
    questionType: "multiple_choice",
    options: [
      { id: "A", text: "Immediately escalate to the 33-Agent Council" },
      { id: "B", text: "Verify the report's authenticity and gather initial context" },
      { id: "C", text: "Contact the AI company directly" },
      { id: "D", text: "Publish the report publicly" }
    ],
    correctAnswer: "B",
    explanation: "The first step is to verify the report's authenticity and gather initial context, including checking for duplicate reports, verifying the AI system exists, and understanding the basic facts before proceeding with analysis.",
    difficulty: "easy",
    category: "INCIDENT_ANALYSIS",
    points: 1
  },
  {
    questionText: "In the COAI framework, what triggers escalation to the 33-Agent Council?",
    questionType: "multiple_choice",
    options: [
      { id: "A", text: "All reports are automatically escalated" },
      { id: "B", text: "Reports meeting severity thresholds or requiring multi-perspective analysis" },
      { id: "C", text: "Only reports from verified organizations" },
      { id: "D", text: "Reports older than 30 days" }
    ],
    correctAnswer: "B",
    explanation: "Reports are escalated to the 33-Agent Council when they meet severity thresholds (high/critical), involve complex multi-stakeholder impacts, or require diverse AI perspectives for comprehensive analysis.",
    difficulty: "medium",
    category: "INCIDENT_ANALYSIS",
    points: 1
  },
  {
    questionText: "What are the three types of AI agents in the 33-Agent Council?",
    questionType: "multiple_choice",
    options: [
      { id: "A", text: "Developers, Testers, Reviewers" },
      { id: "B", text: "Guardians, Arbiters, Scribes" },
      { id: "C", text: "Analysts, Managers, Directors" },
      { id: "D", text: "Observers, Participants, Judges" }
    ],
    correctAnswer: "B",
    explanation: "The 33-Agent Council consists of Guardians (safety-focused), Arbiters (fairness and balance-focused), and Scribes (documentation and precedent-focused), with 11 agents of each type from different AI providers.",
    difficulty: "easy",
    category: "INCIDENT_ANALYSIS",
    points: 1
  },
  {
    questionText: "What is the purpose of the SOAI-PDCA cycle in incident management?",
    questionType: "multiple_choice",
    options: [
      { id: "A", text: "To process payments for AI services" },
      { id: "B", text: "To provide continuous improvement through Plan-Do-Check-Act methodology" },
      { id: "C", text: "To manage AI development sprints" },
      { id: "D", text: "To track AI system performance metrics" }
    ],
    correctAnswer: "B",
    explanation: "The SOAI-PDCA (Safety of AI - Plan-Do-Check-Act) cycle provides a continuous improvement framework for AI safety, ensuring incidents lead to systemic improvements rather than just individual fixes.",
    difficulty: "medium",
    category: "INCIDENT_ANALYSIS",
    points: 1
  },
  {
    questionText: "When analyzing an AI bias incident, which evidence is MOST important to collect?",
    questionType: "multiple_choice",
    options: [
      { id: "A", text: "The AI company's stock price" },
      { id: "B", text: "Comparative outcomes across demographic groups with similar qualifications" },
      { id: "C", text: "The number of users of the AI system" },
      { id: "D", text: "The programming language used" }
    ],
    correctAnswer: "B",
    explanation: "For bias incidents, the most critical evidence is comparative outcomes showing how the AI system treats different demographic groups with similar qualifications or circumstances, demonstrating disparate impact.",
    difficulty: "medium",
    category: "INCIDENT_ANALYSIS",
    points: 1
  },
  {
    questionText: "What is 'severity classification' in incident reporting?",
    questionType: "multiple_choice",
    options: [
      { id: "A", text: "Rating the technical complexity of the AI system" },
      { id: "B", text: "Categorizing the potential harm level (low, medium, high, critical)" },
      { id: "C", text: "Measuring the financial impact on the company" },
      { id: "D", text: "Counting the number of affected users" }
    ],
    correctAnswer: "B",
    explanation: "Severity classification categorizes incidents by potential harm level: Low (minor inconvenience), Medium (significant impact), High (serious harm potential), Critical (immediate safety risk or widespread harm).",
    difficulty: "easy",
    category: "INCIDENT_ANALYSIS",
    points: 1
  },
  {
    questionText: "What distinguishes a 'safety' incident from a 'bias' incident in AI systems?",
    questionType: "multiple_choice",
    options: [
      { id: "A", text: "Safety incidents only affect physical systems" },
      { id: "B", text: "Safety incidents involve potential physical or psychological harm; bias involves unfair treatment of groups" },
      { id: "C", text: "There is no distinction; they are the same" },
      { id: "D", text: "Bias incidents are always more severe" }
    ],
    correctAnswer: "B",
    explanation: "Safety incidents involve AI systems that could cause physical harm, psychological damage, or dangerous outcomes. Bias incidents involve systematic unfair treatment of protected groups. An incident can be both.",
    difficulty: "medium",
    category: "INCIDENT_ANALYSIS",
    points: 1
  },
  {
    questionText: "What is the 'chain of custody' requirement for incident evidence?",
    questionType: "multiple_choice",
    options: [
      { id: "A", text: "Evidence must be stored in a physical safe" },
      { id: "B", text: "Documentation of who handled evidence and when, ensuring integrity" },
      { id: "C", text: "Evidence must be reviewed by a lawyer" },
      { id: "D", text: "Evidence must be encrypted" }
    ],
    correctAnswer: "B",
    explanation: "Chain of custody documents who collected, handled, and stored evidence and when, ensuring the evidence hasn't been tampered with and can be relied upon for analysis and potential legal proceedings.",
    difficulty: "medium",
    category: "INCIDENT_ANALYSIS",
    points: 1
  },
  {
    questionText: "When should a Watchdog Analyst recommend 'escalate' versus 'approve' or 'reject' a report?",
    questionType: "multiple_choice",
    options: [
      { id: "A", text: "When they want to avoid making a decision" },
      { id: "B", text: "When the case requires additional expertise, evidence, or multi-stakeholder input" },
      { id: "C", text: "When the report is older than 7 days" },
      { id: "D", text: "When the AI company is well-known" }
    ],
    correctAnswer: "B",
    explanation: "Escalation is appropriate when a case requires expertise beyond the analyst's scope, additional evidence gathering, input from multiple stakeholders, or review by the 33-Agent Council for complex ethical considerations.",
    difficulty: "medium",
    category: "INCIDENT_ANALYSIS",
    points: 1
  },
  {
    questionText: "What is the purpose of 'precedent analysis' in incident review?",
    questionType: "multiple_choice",
    options: [
      { id: "A", text: "To copy decisions from previous cases exactly" },
      { id: "B", text: "To ensure consistency and learn from similar past incidents" },
      { id: "C", text: "To reduce the workload of analysts" },
      { id: "D", text: "To automatically resolve all similar cases" }
    ],
    correctAnswer: "B",
    explanation: "Precedent analysis examines how similar past incidents were handled to ensure consistency in decision-making, identify patterns, and apply lessons learned while recognizing each case's unique circumstances.",
    difficulty: "easy",
    category: "INCIDENT_ANALYSIS",
    points: 1
  },

  // ============================================
  // SCENARIO-BASED QUESTIONS (5 questions)
  // ============================================
  {
    questionText: "Scenario: A hiring AI system rejects 80% of female applicants but only 40% of male applicants with similar qualifications. What type of incident is this?",
    questionType: "scenario",
    options: [
      { id: "A", text: "Privacy violation" },
      { id: "B", text: "Algorithmic bias with disparate impact" },
      { id: "C", text: "Safety concern" },
      { id: "D", text: "Misinformation" }
    ],
    correctAnswer: "B",
    explanation: "This is algorithmic bias resulting in disparate impact—the AI system produces significantly different outcomes for protected groups (gender) with similar qualifications, violating equal opportunity principles.",
    difficulty: "medium",
    category: "SCENARIO",
    points: 2
  },
  {
    questionText: "Scenario: An AI chatbot provides specific medical diagnoses without disclaimers. A user follows the advice instead of seeing a doctor and their condition worsens. How should this be classified?",
    questionType: "scenario",
    options: [
      { id: "A", text: "Low severity - user error" },
      { id: "B", text: "Medium severity - bias incident" },
      { id: "C", text: "High/Critical severity - safety incident" },
      { id: "D", text: "Not an AI incident" }
    ],
    correctAnswer: "C",
    explanation: "This is a high/critical severity safety incident. The AI system provided medical advice without appropriate disclaimers, leading to potential physical harm. This violates safety requirements and transparency obligations.",
    difficulty: "medium",
    category: "SCENARIO",
    points: 2
  },
  {
    questionText: "Scenario: A facial recognition system at an airport has a 5% error rate for white individuals but 35% for Black individuals. Under the EU AI Act, what is the primary concern?",
    questionType: "scenario",
    options: [
      { id: "A", text: "The system is too slow" },
      { id: "B", text: "Discriminatory performance violating fundamental rights" },
      { id: "C", text: "The system uses too much energy" },
      { id: "D", text: "The system needs more training data" }
    ],
    correctAnswer: "B",
    explanation: "The primary concern is discriminatory performance that violates fundamental rights. Under the EU AI Act, biometric systems must not discriminate based on protected characteristics, and such disparate error rates constitute a serious compliance failure.",
    difficulty: "hard",
    category: "SCENARIO",
    points: 2
  },
  {
    questionText: "Scenario: An AI content moderation system flags legitimate news articles as misinformation based on political viewpoint. What frameworks are potentially violated?",
    questionType: "scenario",
    options: [
      { id: "A", text: "Only privacy regulations" },
      { id: "B", text: "EU AI Act transparency requirements and fundamental rights protections" },
      { id: "C", text: "Only environmental regulations" },
      { id: "D", text: "No frameworks are violated" }
    ],
    correctAnswer: "B",
    explanation: "This violates EU AI Act requirements for transparency and non-discrimination, as well as fundamental rights to freedom of expression. Content moderation AI must not systematically suppress legitimate speech based on viewpoint.",
    difficulty: "hard",
    category: "SCENARIO",
    points: 2
  },
  {
    questionText: "Scenario: A company deploys a generative AI service in China without algorithm registration. What is the regulatory consequence?",
    questionType: "scenario",
    options: [
      { id: "A", text: "No consequence - registration is optional" },
      { id: "B", text: "Warning letter only" },
      { id: "C", text: "Potential service suspension and administrative penalties" },
      { id: "D", text: "Automatic approval after 30 days" }
    ],
    correctAnswer: "C",
    explanation: "Under China's Generative AI Measures, deploying without required algorithm registration can result in service suspension, administrative penalties, and potential criminal liability for serious violations.",
    difficulty: "medium",
    category: "SCENARIO",
    points: 2
  }
];

async function seedQuestions() {
  console.log("🌱 Starting exam question seeding...");
  
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("❌ DATABASE_URL environment variable not set");
    process.exit(1);
  }

  const db = drizzle(databaseUrl);

  try {
    // Get the test ID
    const [test] = await db
      .select()
      .from(certificationTests)
      .where(eq(certificationTests.code, "WATCHDOG_BASIC"))
      .limit(1);

    if (!test) {
      console.error("❌ WATCHDOG_BASIC test not found. Please create it first.");
      process.exit(1);
    }

    console.log(`📋 Found test: ${test.title} (ID: ${test.id})`);

    // Get module IDs for category mapping
    const modules = await db.select().from(trainingModules);
    const moduleMap = new Map(modules.map(m => [m.code, m.id]));

    // Category to module code mapping
    const categoryToModule: Record<string, string> = {
      "EU_AI_ACT": "EU_AI_ACT",
      "NIST_RMF": "NIST_RMF",
      "TC260": "TC260",
      "ETHICS": "ETHICS_BIAS",
      "INCIDENT_ANALYSIS": "INCIDENT_ANALYSIS",
      "SCENARIO": "INCIDENT_ANALYSIS"
    };

    // Insert questions
    console.log("📝 Inserting questions...");
    let insertedCount = 0;

    for (const q of questions) {
      const moduleCode = categoryToModule[q.category];
      const moduleId = moduleMap.get(moduleCode) || null;

      await db.insert(testQuestions).values({
        testId: test.id,
        moduleId,
        questionText: q.questionText,
        questionType: q.questionType,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        points: q.points,
        difficulty: q.difficulty,
        isActive: true,
      });

      insertedCount++;
      if (insertedCount % 10 === 0) {
        console.log(`  ✓ Inserted ${insertedCount} questions...`);
      }
    }

    console.log(`\n✅ Question seeding complete!`);
    console.log(`   - ${insertedCount} questions inserted`);
    console.log(`   - Categories: EU AI Act, NIST RMF, TC260, Ethics, Incident Analysis`);
    console.log(`   - Difficulty distribution: Easy, Medium, Hard`);

  } catch (error) {
    console.error("❌ Error seeding questions:", error);
    throw error;
  }
}

seedQuestions().catch(console.error);
