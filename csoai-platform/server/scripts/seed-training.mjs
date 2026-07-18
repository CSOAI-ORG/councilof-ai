/**
 * COAI Database Seed Script
 * Seeds training modules and certification test questions
 * 
 * Run with: node scripts/seed-training.mjs
 */

import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

// Training Modules Content
const trainingModules = [
  {
    title: "Introduction to AI Safety",
    description: "Learn the fundamentals of AI safety, why it matters, and the global regulatory landscape.",
    content: `
# Introduction to AI Safety

## What is AI Safety?

AI Safety is the field dedicated to ensuring that artificial intelligence systems operate reliably, ethically, and without causing unintended harm to humans or society. As AI becomes more powerful and ubiquitous, the importance of safety measures grows exponentially.

## Why AI Safety Matters

### 1. Preventing Harm
AI systems can make decisions that affect millions of people. A biased hiring algorithm, a flawed medical diagnosis system, or a manipulative recommendation engine can cause significant harm at scale.

### 2. Building Trust
For AI to be widely adopted and beneficial, people need to trust it. Safety measures help build this trust by ensuring AI systems are transparent, fair, and accountable.

### 3. Regulatory Compliance
Governments worldwide are implementing AI regulations. The EU AI Act, NIST AI RMF, and China's TC260 framework all require organizations to demonstrate AI safety practices.

## The Global Regulatory Landscape

### EU AI Act (2024)
- Risk-based approach: Unacceptable, High, Limited, Minimal risk categories
- Mandatory requirements for high-risk AI systems
- Penalties up to €35 million or 7% of global revenue

### NIST AI RMF (USA)
- Voluntary framework with four core functions: GOVERN, MAP, MEASURE, MANAGE
- Focus on trustworthiness characteristics
- Widely adopted by US government and industry

### TC260 (China)
- Comprehensive AI governance framework
- Three-tier risk classification
- 14 governance measures

## Your Role as a Watchdog Analyst

As a COAI Watchdog Analyst, you will:
1. Review AI safety incidents reported by the public
2. Evaluate whether AI systems comply with safety standards
3. Provide human oversight when the 33-agent council cannot reach consensus
4. Contribute to the global effort to make AI safe for humanity

## Key Takeaways

- AI safety is critical for preventing harm and building trust
- Multiple regulatory frameworks exist globally
- Human oversight remains essential even with AI-powered analysis
- Your decisions as an analyst directly impact AI safety outcomes
    `,
    orderIndex: 1,
    estimatedMinutes: 30,
    isRequired: true,
  },
  {
    title: "Understanding the EU AI Act",
    description: "Deep dive into the EU AI Act requirements, risk categories, and compliance obligations.",
    content: `
# Understanding the EU AI Act

## Overview

The EU AI Act (Regulation 2024/1689) is the world's first comprehensive AI law. It establishes a risk-based framework for regulating AI systems in the European Union.

## Risk Categories

### Unacceptable Risk (Prohibited)
These AI applications are banned entirely:
- Social scoring by governments
- Real-time biometric identification in public spaces (with exceptions)
- Manipulation of vulnerable groups
- Subliminal manipulation techniques

### High Risk
AI systems that require strict compliance:
- Biometric identification and categorization
- Critical infrastructure management
- Education and vocational training
- Employment and worker management
- Access to essential services
- Law enforcement
- Migration and border control
- Administration of justice

### Limited Risk
AI systems with transparency obligations:
- Chatbots (must disclose AI nature)
- Emotion recognition systems
- Deepfake generators

### Minimal Risk
AI systems with no specific obligations:
- AI-enabled video games
- Spam filters
- Most consumer applications

## Key Requirements for High-Risk AI

### 1. Risk Management System
- Identify and analyze known and foreseeable risks
- Estimate and evaluate risks
- Adopt risk management measures
- Test and monitor effectiveness

### 2. Data Governance
- Training data must be relevant, representative, and error-free
- Bias detection and mitigation required
- Data protection compliance

### 3. Technical Documentation
- Detailed description of the AI system
- Design specifications and development process
- Monitoring and control mechanisms

### 4. Record Keeping
- Automatic logging of events
- Traceability of decisions
- Audit trail maintenance

### 5. Transparency
- Clear instructions for use
- Information about capabilities and limitations
- Contact information for provider

### 6. Human Oversight
- Ability to understand AI system outputs
- Ability to override or stop the system
- Awareness of automation bias risks

### 7. Accuracy, Robustness, Cybersecurity
- Appropriate levels of accuracy
- Resilience against errors and attacks
- Protection against unauthorized access

## Penalties

| Violation Type | Maximum Fine |
|---------------|--------------|
| Prohibited AI practices | €35M or 7% of global revenue |
| High-risk non-compliance | €15M or 3% of global revenue |
| Incorrect information | €7.5M or 1.5% of global revenue |

## Timeline

- August 2024: Act enters into force
- February 2025: Prohibited AI practices banned
- August 2025: GPAI model requirements apply
- August 2026: Full compliance required for high-risk AI

## Analyst Checklist

When reviewing an AI system for EU AI Act compliance, check:
- [ ] Is the AI system classified correctly by risk level?
- [ ] Does it have a documented risk management system?
- [ ] Is training data governance adequate?
- [ ] Is technical documentation complete?
- [ ] Are human oversight measures in place?
- [ ] Is transparency sufficient for users?
    `,
    orderIndex: 2,
    estimatedMinutes: 45,
    isRequired: true,
  },
  {
    title: "NIST AI Risk Management Framework",
    description: "Learn the NIST AI RMF's four core functions and how to apply them in practice.",
    content: `
# NIST AI Risk Management Framework

## Overview

The NIST AI Risk Management Framework (AI RMF 1.0) provides a voluntary framework for managing risks in AI systems. It's widely adopted in the United States and serves as a practical guide for AI governance.

## The Four Core Functions

### 1. GOVERN
Establish and maintain organizational AI risk management practices.

**Key Activities:**
- Define AI risk management policies
- Establish roles and responsibilities
- Create accountability structures
- Develop organizational culture around AI risk

**Questions to Ask:**
- Who is responsible for AI risk management?
- What policies govern AI development and deployment?
- How is AI risk communicated across the organization?

### 2. MAP
Understand the context and potential impacts of AI systems.

**Key Activities:**
- Identify AI system purposes and intended uses
- Map potential positive and negative impacts
- Understand the deployment context
- Identify stakeholders affected by the AI

**Questions to Ask:**
- What problem does this AI system solve?
- Who are the users and affected parties?
- What could go wrong with this system?
- What are the potential benefits and harms?

### 3. MEASURE
Analyze and assess AI risks and impacts.

**Key Activities:**
- Develop metrics for AI trustworthiness
- Test AI systems for bias and errors
- Evaluate system performance
- Monitor for emerging risks

**Questions to Ask:**
- How accurate is the AI system?
- Is the system fair across different groups?
- How robust is the system to adversarial inputs?
- What metrics indicate system health?

### 4. MANAGE
Prioritize and act on AI risks.

**Key Activities:**
- Prioritize risks based on severity and likelihood
- Implement risk mitigation measures
- Document risk management decisions
- Continuously monitor and improve

**Questions to Ask:**
- Which risks require immediate attention?
- What controls can reduce identified risks?
- How do we know if controls are effective?
- What is our incident response plan?

## Seven Trustworthiness Characteristics

The NIST AI RMF identifies seven characteristics of trustworthy AI:

| Characteristic | Description |
|---------------|-------------|
| **Valid & Reliable** | System performs as intended under expected conditions |
| **Safe** | System doesn't cause harm to people or environment |
| **Secure & Resilient** | System resists attacks and recovers from failures |
| **Accountable & Transparent** | Clear responsibility and explainable decisions |
| **Explainable & Interpretable** | Users can understand how decisions are made |
| **Privacy-Enhanced** | System protects personal information |
| **Fair with Harmful Bias Managed** | System treats all groups equitably |

## Applying NIST AI RMF as an Analyst

When reviewing an AI system using NIST AI RMF:

1. **GOVERN Check**: Does the organization have AI governance in place?
2. **MAP Check**: Is the AI system's context and impact well understood?
3. **MEASURE Check**: Are appropriate metrics being tracked?
4. **MANAGE Check**: Are risks being actively managed?

## PDCA Integration

The NIST AI RMF aligns with the Plan-Do-Check-Act (PDCA) cycle:

- **Plan** → GOVERN + MAP (establish policies, understand context)
- **Do** → MEASURE (implement and test)
- **Check** → MEASURE (evaluate results)
- **Act** → MANAGE (improve based on findings)

This is how COAI integrates SOAI (Safety Of AI) with the PDCA loop!
    `,
    orderIndex: 3,
    estimatedMinutes: 40,
    isRequired: true,
  },
  {
    title: "Identifying AI Bias and Fairness Issues",
    description: "Learn to recognize different types of AI bias and evaluate fairness in AI systems.",
    content: `
# Identifying AI Bias and Fairness Issues

## What is AI Bias?

AI bias occurs when an AI system produces systematically unfair outcomes for certain groups of people. This can happen at any stage of the AI lifecycle, from data collection to deployment.

## Types of AI Bias

### 1. Historical Bias
**Definition:** Bias that exists in the real world and is reflected in training data.

**Example:** A hiring AI trained on historical data may learn to prefer male candidates because men were historically hired more often for certain roles.

**Red Flags:**
- Training data reflects past discrimination
- Outcomes mirror historical inequities
- Protected groups are underrepresented in positive outcomes

### 2. Representation Bias
**Definition:** Bias from training data that doesn't represent the full population.

**Example:** A facial recognition system trained primarily on light-skinned faces performs poorly on darker-skinned faces.

**Red Flags:**
- Training data lacks diversity
- Performance varies significantly across groups
- Certain populations are underrepresented in data

### 3. Measurement Bias
**Definition:** Bias from using proxies that don't accurately measure what they intend to.

**Example:** Using zip code as a proxy for creditworthiness, which correlates with race due to historical housing discrimination.

**Red Flags:**
- Proxy variables correlate with protected characteristics
- Indirect discrimination through seemingly neutral factors
- Outcomes differ by group despite similar qualifications

### 4. Aggregation Bias
**Definition:** Bias from using a single model for groups with different characteristics.

**Example:** A medical AI trained on general population data may not work well for specific ethnic groups with different disease presentations.

**Red Flags:**
- One-size-fits-all model for diverse populations
- Subgroup performance not evaluated
- Model assumes homogeneity

### 5. Evaluation Bias
**Definition:** Bias in how AI systems are tested and validated.

**Example:** Testing a voice assistant only with native English speakers, missing performance issues for non-native speakers.

**Red Flags:**
- Test data not representative
- Evaluation metrics don't capture fairness
- Subgroup analysis not performed

## Fairness Metrics

### Demographic Parity
All groups receive positive outcomes at equal rates.
- Formula: P(Ŷ=1|A=0) = P(Ŷ=1|A=1)
- Use when: Equal representation is the goal

### Equalized Odds
All groups have equal true positive and false positive rates.
- Formula: P(Ŷ=1|Y=1,A=0) = P(Ŷ=1|Y=1,A=1)
- Use when: Accuracy across groups matters

### Predictive Parity
Positive predictions are equally accurate across groups.
- Formula: P(Y=1|Ŷ=1,A=0) = P(Y=1|Ŷ=1,A=1)
- Use when: Prediction reliability matters

## Analyst Evaluation Checklist

When reviewing an AI system for bias:

- [ ] **Data Review**: Is training data diverse and representative?
- [ ] **Outcome Analysis**: Do outcomes differ significantly by group?
- [ ] **Proxy Check**: Are proxy variables used that correlate with protected characteristics?
- [ ] **Subgroup Testing**: Has the system been tested on all relevant subgroups?
- [ ] **Metric Selection**: Are appropriate fairness metrics being used?
- [ ] **Mitigation**: What bias mitigation measures are in place?

## Case Study: Job Recommendation Bias

**Scenario:** Users report that a job recommendation AI shows higher-paying tech jobs to men and administrative roles to women.

**Analysis Steps:**
1. Check if training data reflects historical hiring patterns
2. Analyze recommendation outcomes by gender
3. Look for proxy variables (e.g., browsing history, previous job titles)
4. Evaluate if the system was tested for gender bias
5. Determine if bias mitigation was attempted

**Possible Decisions:**
- **Approve**: If bias is minimal and within acceptable bounds
- **Reject**: If significant bias exists with no mitigation
- **Escalate**: If bias is complex and requires expert review
    `,
    orderIndex: 4,
    estimatedMinutes: 50,
    isRequired: true,
  },
  {
    title: "Making Decisions as a Watchdog Analyst",
    description: "Learn the decision-making framework for reviewing AI safety cases.",
    content: `
# Making Decisions as a Watchdog Analyst

## Your Role in the COAI Ecosystem

As a Watchdog Analyst, you are the human-in-the-loop for AI safety. When the 33-agent council cannot reach consensus (22/33 votes), cases are escalated to you for human judgment.

## The Decision Framework

### Step 1: Understand the Incident

Before making any decision, thoroughly understand:
- What AI system is involved?
- What is the reported issue?
- Who is affected?
- What evidence is provided?

### Step 2: Assess Severity

Rate the incident severity:

| Severity | Description | Examples |
|----------|-------------|----------|
| **Critical** | Immediate harm to individuals | Medical misdiagnosis, safety system failure |
| **High** | Significant harm or discrimination | Systematic bias, privacy breach |
| **Medium** | Moderate impact, limited scope | Inaccurate recommendations, minor errors |
| **Low** | Minimal impact, easily corrected | UI issues, minor inconveniences |

### Step 3: Evaluate Against Frameworks

Check compliance with relevant frameworks:

**EU AI Act:**
- Is this a prohibited practice?
- Is the system high-risk?
- Are requirements being met?

**NIST AI RMF:**
- Are the four functions (GOVERN, MAP, MEASURE, MANAGE) addressed?
- Which trustworthiness characteristics are affected?

**General Safety:**
- Is there potential for harm?
- Are vulnerable populations affected?
- Is there adequate human oversight?

### Step 4: Consider the Council Votes

Review how the 33-agent council voted:
- **Approve votes**: What reasoning supports approval?
- **Reject votes**: What concerns led to rejection?
- **Escalate votes**: Why did agents feel human review was needed?

The council's split vote provides valuable context for your decision.

### Step 5: Make Your Decision

You have four options:

#### APPROVE
Use when:
- The AI system meets safety requirements
- The reported issue is not a significant concern
- Evidence doesn't support the complaint
- Minor issues exist but are being addressed

#### REJECT
Use when:
- Clear violation of safety standards
- Significant harm is occurring or likely
- The AI system fails to meet compliance requirements
- Evidence strongly supports the complaint

#### ESCALATE
Use when:
- The case requires specialized expertise
- Legal or regulatory interpretation is needed
- The issue has broader implications
- You're uncertain and need senior review

#### NEEDS MORE INFO
Use when:
- Evidence is insufficient to decide
- Key details are missing
- Additional investigation is required
- Clarification from the reporter is needed

### Step 6: Document Your Reasoning

Always provide clear reasoning:
- State the key facts you considered
- Explain which frameworks/standards apply
- Describe why you chose your decision
- Note any concerns or caveats

## Quality Standards

Your decisions will be evaluated on:

| Metric | Target |
|--------|--------|
| Accuracy | 85%+ alignment with expert review |
| Consistency | Similar cases, similar decisions |
| Thoroughness | Complete reasoning provided |
| Timeliness | Decisions within SLA |

## Common Pitfalls to Avoid

1. **Rushing to judgment**: Take time to review all evidence
2. **Ignoring council votes**: They provide valuable AI analysis
3. **Inconsistent standards**: Apply frameworks uniformly
4. **Insufficient reasoning**: Always explain your decision
5. **Bias in review**: Be aware of your own biases

## Practice Scenario

**Case:** A user reports that an AI chatbot is providing medical diagnoses without disclaimers.

**Council Votes:** Approve: 5, Reject: 20, Escalate: 8

**Your Analysis:**
1. This involves health/safety (high severity)
2. EU AI Act requires transparency for chatbots
3. Medical advice without disclaimers is dangerous
4. Council strongly leans toward rejection
5. Evidence supports the complaint

**Decision:** REJECT - The AI system violates transparency requirements and poses safety risks by providing medical advice without appropriate disclaimers.

## You're Ready!

After completing this training, you're prepared to:
- Review AI safety incidents
- Apply regulatory frameworks
- Make informed decisions
- Contribute to global AI safety

Welcome to the COAI Watchdog Analyst team!
    `,
    orderIndex: 5,
    estimatedMinutes: 45,
    isRequired: true,
  },
];

// Certification Test Questions
const certificationQuestions = [
  // Module 1: Introduction to AI Safety
  {
    question: "What is the primary purpose of AI Safety?",
    options: JSON.stringify([
      "To make AI systems faster",
      "To ensure AI systems operate reliably, ethically, and without causing unintended harm",
      "To reduce the cost of AI development",
      "To replace human workers with AI"
    ]),
    correctAnswer: 1,
    explanation: "AI Safety focuses on ensuring AI systems are reliable, ethical, and don't cause unintended harm to humans or society.",
    moduleId: 1,
  },
  {
    question: "Which of the following is NOT a reason why AI Safety matters?",
    options: JSON.stringify([
      "Preventing harm at scale",
      "Building public trust in AI",
      "Maximizing AI company profits",
      "Regulatory compliance"
    ]),
    correctAnswer: 2,
    explanation: "While AI safety may indirectly benefit companies, its primary purposes are preventing harm, building trust, and ensuring compliance.",
    moduleId: 1,
  },
  {
    question: "What is the maximum penalty under the EU AI Act for prohibited AI practices?",
    options: JSON.stringify([
      "€10 million or 2% of global revenue",
      "€35 million or 7% of global revenue",
      "€50 million or 10% of global revenue",
      "€1 million or 0.5% of global revenue"
    ]),
    correctAnswer: 1,
    explanation: "The EU AI Act imposes penalties up to €35 million or 7% of global annual revenue for prohibited AI practices.",
    moduleId: 1,
  },
  {
    question: "What is the role of a COAI Watchdog Analyst?",
    options: JSON.stringify([
      "To develop new AI systems",
      "To review AI safety incidents and provide human oversight",
      "To sell AI products to customers",
      "To write AI regulations"
    ]),
    correctAnswer: 1,
    explanation: "Watchdog Analysts review AI safety incidents reported by the public and provide human oversight when the 33-agent council cannot reach consensus.",
    moduleId: 1,
  },
  {
    question: "Which framework is voluntary and widely adopted in the United States?",
    options: JSON.stringify([
      "EU AI Act",
      "TC260",
      "NIST AI RMF",
      "GDPR"
    ]),
    correctAnswer: 2,
    explanation: "The NIST AI Risk Management Framework is a voluntary framework widely adopted by US government and industry.",
    moduleId: 1,
  },
  
  // Module 2: EU AI Act
  {
    question: "Under the EU AI Act, which risk category is completely prohibited?",
    options: JSON.stringify([
      "Minimal risk",
      "Limited risk",
      "High risk",
      "Unacceptable risk"
    ]),
    correctAnswer: 3,
    explanation: "Unacceptable risk AI applications are banned entirely under the EU AI Act.",
    moduleId: 2,
  },
  {
    question: "Which of the following is an example of a prohibited AI practice under the EU AI Act?",
    options: JSON.stringify([
      "AI-powered spam filters",
      "Social scoring by governments",
      "AI chatbots",
      "Recommendation algorithms"
    ]),
    correctAnswer: 1,
    explanation: "Social scoring by governments is explicitly prohibited under the EU AI Act as an unacceptable risk.",
    moduleId: 2,
  },
  {
    question: "What transparency obligation applies to chatbots under the EU AI Act?",
    options: JSON.stringify([
      "No obligations",
      "Must disclose they are AI",
      "Must provide source code",
      "Must be approved by regulators"
    ]),
    correctAnswer: 1,
    explanation: "Chatbots fall under 'limited risk' and must disclose to users that they are interacting with an AI system.",
    moduleId: 2,
  },
  {
    question: "Which of the following is NOT a requirement for high-risk AI systems under the EU AI Act?",
    options: JSON.stringify([
      "Risk management system",
      "Data governance",
      "Open source code",
      "Human oversight"
    ]),
    correctAnswer: 2,
    explanation: "The EU AI Act does not require high-risk AI systems to be open source. Requirements include risk management, data governance, documentation, transparency, and human oversight.",
    moduleId: 2,
  },
  {
    question: "When does full compliance with the EU AI Act become required for high-risk AI?",
    options: JSON.stringify([
      "August 2024",
      "February 2025",
      "August 2025",
      "August 2026"
    ]),
    correctAnswer: 3,
    explanation: "Full compliance for high-risk AI systems is required by August 2026.",
    moduleId: 2,
  },
  {
    question: "Which sector's AI systems are classified as high-risk under the EU AI Act?",
    options: JSON.stringify([
      "Video games",
      "Spam filters",
      "Employment and worker management",
      "Music recommendations"
    ]),
    correctAnswer: 2,
    explanation: "AI systems used in employment and worker management are classified as high-risk under the EU AI Act.",
    moduleId: 2,
  },
  {
    question: "What is the penalty for providing incorrect information under the EU AI Act?",
    options: JSON.stringify([
      "€35 million or 7% of global revenue",
      "€15 million or 3% of global revenue",
      "€7.5 million or 1.5% of global revenue",
      "No penalty"
    ]),
    correctAnswer: 2,
    explanation: "Providing incorrect information to authorities can result in fines up to €7.5 million or 1.5% of global revenue.",
    moduleId: 2,
  },
  {
    question: "What does 'human oversight' mean under the EU AI Act?",
    options: JSON.stringify([
      "Humans must build all AI systems",
      "Humans must be able to understand, override, or stop AI systems",
      "Humans must approve every AI decision",
      "Humans must own AI companies"
    ]),
    correctAnswer: 1,
    explanation: "Human oversight means humans must be able to understand AI outputs, override or stop the system, and be aware of automation bias risks.",
    moduleId: 2,
  },
  
  // Module 3: NIST AI RMF
  {
    question: "What are the four core functions of the NIST AI RMF?",
    options: JSON.stringify([
      "Plan, Do, Check, Act",
      "Govern, Map, Measure, Manage",
      "Identify, Protect, Detect, Respond",
      "Design, Develop, Deploy, Monitor"
    ]),
    correctAnswer: 1,
    explanation: "The NIST AI RMF has four core functions: GOVERN, MAP, MEASURE, and MANAGE.",
    moduleId: 3,
  },
  {
    question: "Which NIST AI RMF function focuses on understanding the context and potential impacts of AI systems?",
    options: JSON.stringify([
      "GOVERN",
      "MAP",
      "MEASURE",
      "MANAGE"
    ]),
    correctAnswer: 1,
    explanation: "The MAP function focuses on understanding the context and potential impacts of AI systems.",
    moduleId: 3,
  },
  {
    question: "How many trustworthiness characteristics does the NIST AI RMF identify?",
    options: JSON.stringify([
      "3",
      "5",
      "7",
      "10"
    ]),
    correctAnswer: 2,
    explanation: "The NIST AI RMF identifies seven trustworthiness characteristics: Valid & Reliable, Safe, Secure & Resilient, Accountable & Transparent, Explainable & Interpretable, Privacy-Enhanced, and Fair with Harmful Bias Managed.",
    moduleId: 3,
  },
  {
    question: "Which trustworthiness characteristic relates to protecting personal information?",
    options: JSON.stringify([
      "Safe",
      "Secure & Resilient",
      "Privacy-Enhanced",
      "Accountable & Transparent"
    ]),
    correctAnswer: 2,
    explanation: "Privacy-Enhanced refers to AI systems that protect personal information.",
    moduleId: 3,
  },
  {
    question: "Is the NIST AI RMF mandatory or voluntary?",
    options: JSON.stringify([
      "Mandatory for all US companies",
      "Mandatory only for government contractors",
      "Voluntary",
      "Mandatory for AI companies only"
    ]),
    correctAnswer: 2,
    explanation: "The NIST AI RMF is a voluntary framework, though it's widely adopted by US government and industry.",
    moduleId: 3,
  },
  {
    question: "Which NIST AI RMF function involves prioritizing and acting on AI risks?",
    options: JSON.stringify([
      "GOVERN",
      "MAP",
      "MEASURE",
      "MANAGE"
    ]),
    correctAnswer: 3,
    explanation: "The MANAGE function involves prioritizing risks based on severity and likelihood, and implementing risk mitigation measures.",
    moduleId: 3,
  },
  {
    question: "How does the NIST AI RMF align with the PDCA cycle?",
    options: JSON.stringify([
      "It doesn't align with PDCA",
      "GOVERN+MAP=Plan, MEASURE=Do+Check, MANAGE=Act",
      "Each function maps to one PDCA phase",
      "PDCA replaces the four functions"
    ]),
    correctAnswer: 1,
    explanation: "GOVERN and MAP align with Plan, MEASURE aligns with Do and Check, and MANAGE aligns with Act.",
    moduleId: 3,
  },
  {
    question: "What does 'Explainable & Interpretable' mean in the NIST AI RMF?",
    options: JSON.stringify([
      "AI code must be open source",
      "Users can understand how AI decisions are made",
      "AI must explain itself in natural language",
      "AI documentation must be public"
    ]),
    correctAnswer: 1,
    explanation: "Explainable & Interpretable means users can understand how AI decisions are made.",
    moduleId: 3,
  },
  
  // Module 4: AI Bias and Fairness
  {
    question: "What is historical bias in AI?",
    options: JSON.stringify([
      "Bias in AI history textbooks",
      "Bias that exists in the real world and is reflected in training data",
      "Bias toward older AI systems",
      "Bias in historical data storage"
    ]),
    correctAnswer: 1,
    explanation: "Historical bias occurs when real-world bias is reflected in training data, such as past discrimination patterns.",
    moduleId: 4,
  },
  {
    question: "A facial recognition system trained primarily on light-skinned faces performs poorly on darker-skinned faces. What type of bias is this?",
    options: JSON.stringify([
      "Historical bias",
      "Representation bias",
      "Measurement bias",
      "Evaluation bias"
    ]),
    correctAnswer: 1,
    explanation: "This is representation bias - the training data doesn't represent the full population.",
    moduleId: 4,
  },
  {
    question: "Using zip code as a proxy for creditworthiness is an example of what type of bias?",
    options: JSON.stringify([
      "Historical bias",
      "Representation bias",
      "Measurement bias",
      "Aggregation bias"
    ]),
    correctAnswer: 2,
    explanation: "This is measurement bias - using a proxy (zip code) that correlates with protected characteristics (race) due to historical housing discrimination.",
    moduleId: 4,
  },
  {
    question: "What is demographic parity?",
    options: JSON.stringify([
      "All groups have equal population sizes",
      "All groups receive positive outcomes at equal rates",
      "All groups are treated identically",
      "All groups have equal voting rights"
    ]),
    correctAnswer: 1,
    explanation: "Demographic parity means all groups receive positive outcomes at equal rates.",
    moduleId: 4,
  },
  {
    question: "Which fairness metric ensures equal true positive and false positive rates across groups?",
    options: JSON.stringify([
      "Demographic parity",
      "Equalized odds",
      "Predictive parity",
      "Statistical parity"
    ]),
    correctAnswer: 1,
    explanation: "Equalized odds ensures all groups have equal true positive and false positive rates.",
    moduleId: 4,
  },
  {
    question: "What is aggregation bias?",
    options: JSON.stringify([
      "Bias from combining multiple datasets",
      "Bias from using a single model for groups with different characteristics",
      "Bias in data aggregation functions",
      "Bias in summary statistics"
    ]),
    correctAnswer: 1,
    explanation: "Aggregation bias occurs when a single model is used for diverse groups that have different characteristics.",
    moduleId: 4,
  },
  {
    question: "A voice assistant tested only with native English speakers misses issues for non-native speakers. What type of bias is this?",
    options: JSON.stringify([
      "Historical bias",
      "Representation bias",
      "Measurement bias",
      "Evaluation bias"
    ]),
    correctAnswer: 3,
    explanation: "This is evaluation bias - the testing process didn't include representative samples of all user groups.",
    moduleId: 4,
  },
  {
    question: "What is the first step in evaluating an AI system for bias?",
    options: JSON.stringify([
      "Apply bias mitigation techniques",
      "Review if training data is diverse and representative",
      "Calculate fairness metrics",
      "Deploy the system and monitor outcomes"
    ]),
    correctAnswer: 1,
    explanation: "The first step is to review whether training data is diverse and representative of all groups.",
    moduleId: 4,
  },
  {
    question: "Which of the following is a red flag for representation bias?",
    options: JSON.stringify([
      "High accuracy on test data",
      "Performance varies significantly across demographic groups",
      "Fast inference time",
      "Low computational cost"
    ]),
    correctAnswer: 1,
    explanation: "Performance varying significantly across groups is a key indicator of representation bias.",
    moduleId: 4,
  },
  {
    question: "What should an analyst do if they find significant bias in an AI system with no mitigation measures?",
    options: JSON.stringify([
      "Approve the system",
      "Reject the system",
      "Ignore the bias",
      "Wait for more data"
    ]),
    correctAnswer: 1,
    explanation: "If significant bias exists with no mitigation measures, the analyst should reject the system.",
    moduleId: 4,
  },
  
  // Module 5: Decision Making
  {
    question: "When should a Watchdog Analyst escalate a case?",
    options: JSON.stringify([
      "When they want to avoid making a decision",
      "When the case requires specialized expertise or has broader implications",
      "When they disagree with the council",
      "When the case is too easy"
    ]),
    correctAnswer: 1,
    explanation: "Cases should be escalated when they require specialized expertise, legal interpretation, or have broader implications.",
    moduleId: 5,
  },
  {
    question: "What is the consensus threshold for the 33-agent council?",
    options: JSON.stringify([
      "Simple majority (17/33)",
      "Two-thirds majority (22/33)",
      "Unanimous (33/33)",
      "Three-quarters majority (25/33)"
    ]),
    correctAnswer: 1,
    explanation: "The 33-agent council requires a two-thirds majority (22/33 votes) to reach consensus.",
    moduleId: 5,
  },
  {
    question: "What is the target accuracy rate for Watchdog Analyst decisions?",
    options: JSON.stringify([
      "50%+",
      "70%+",
      "85%+",
      "100%"
    ]),
    correctAnswer: 2,
    explanation: "Analysts are expected to achieve 85%+ alignment with expert review.",
    moduleId: 5,
  },
  {
    question: "Which severity level applies to AI systems causing immediate harm to individuals?",
    options: JSON.stringify([
      "Low",
      "Medium",
      "High",
      "Critical"
    ]),
    correctAnswer: 3,
    explanation: "Critical severity applies to cases involving immediate harm to individuals, such as medical misdiagnosis or safety system failures.",
    moduleId: 5,
  },
  {
    question: "What should an analyst do before making any decision?",
    options: JSON.stringify([
      "Check the council votes first",
      "Thoroughly understand the incident",
      "Make a quick decision to meet SLA",
      "Ask a colleague for their opinion"
    ]),
    correctAnswer: 1,
    explanation: "Before making any decision, analysts should thoroughly understand the incident, including what AI system is involved, what the issue is, who is affected, and what evidence is provided.",
    moduleId: 5,
  },
  {
    question: "When should an analyst choose 'NEEDS MORE INFO'?",
    options: JSON.stringify([
      "When they're unsure about the decision",
      "When evidence is insufficient to decide",
      "When they want more time",
      "When the case is complex"
    ]),
    correctAnswer: 1,
    explanation: "NEEDS MORE INFO should be chosen when evidence is insufficient, key details are missing, or clarification from the reporter is needed.",
    moduleId: 5,
  },
  {
    question: "What is a common pitfall to avoid as a Watchdog Analyst?",
    options: JSON.stringify([
      "Taking time to review evidence",
      "Considering council votes",
      "Rushing to judgment",
      "Providing detailed reasoning"
    ]),
    correctAnswer: 2,
    explanation: "Rushing to judgment is a common pitfall. Analysts should take time to review all evidence thoroughly.",
    moduleId: 5,
  },
  {
    question: "Why is it important to document reasoning for decisions?",
    options: JSON.stringify([
      "To meet word count requirements",
      "To ensure accountability and enable review",
      "To make the decision look more professional",
      "To delay the decision"
    ]),
    correctAnswer: 1,
    explanation: "Documenting reasoning ensures accountability, enables review of decisions, and helps maintain consistency.",
    moduleId: 5,
  },
  {
    question: "An AI chatbot provides medical diagnoses without disclaimers. The council votes: Approve 5, Reject 20, Escalate 8. What should the analyst likely decide?",
    options: JSON.stringify([
      "Approve",
      "Reject",
      "Escalate",
      "Needs More Info"
    ]),
    correctAnswer: 1,
    explanation: "This case involves health/safety risks, violates transparency requirements, and the council strongly leans toward rejection. The analyst should reject.",
    moduleId: 5,
  },
  {
    question: "What does consistency in decision-making mean for analysts?",
    options: JSON.stringify([
      "Always making the same decision",
      "Similar cases should receive similar decisions",
      "Following the council's majority vote",
      "Never changing your mind"
    ]),
    correctAnswer: 1,
    explanation: "Consistency means applying standards uniformly so that similar cases receive similar decisions.",
    moduleId: 5,
  },
  
  // Additional questions to reach 50
  {
    question: "What is the purpose of the COAI 33-agent council?",
    options: JSON.stringify([
      "To replace human analysts",
      "To provide AI-powered initial analysis with Byzantine fault tolerance",
      "To develop new AI systems",
      "To lobby for AI regulations"
    ]),
    correctAnswer: 1,
    explanation: "The 33-agent council provides AI-powered initial analysis using Byzantine fault tolerance, escalating to humans when consensus cannot be reached.",
    moduleId: 1,
  },
  {
    question: "What does Byzantine fault tolerance mean in the context of the 33-agent council?",
    options: JSON.stringify([
      "The system can handle Byzantine Empire regulations",
      "The system can reach correct consensus even if some agents are faulty or malicious",
      "The system uses Byzantine cryptography",
      "The system was developed in Byzantine"
    ]),
    correctAnswer: 1,
    explanation: "Byzantine fault tolerance means the system can reach correct consensus even if some agents provide incorrect or malicious outputs.",
    moduleId: 1,
  },
  {
    question: "What is TC260?",
    options: JSON.stringify([
      "A US regulatory body",
      "China's national cybersecurity standardization technical committee",
      "An EU AI certification",
      "A type of AI model"
    ]),
    correctAnswer: 1,
    explanation: "TC260 is China's National Information Security Standardization Technical Committee, which develops AI safety governance frameworks.",
    moduleId: 1,
  },
  {
    question: "What is the relationship between COAI and SOAI?",
    options: JSON.stringify([
      "They are competitors",
      "COAI is B2B/B2G, SOAI is B2C consumer protection",
      "SOAI replaced COAI",
      "They are the same product"
    ]),
    correctAnswer: 1,
    explanation: "COAI (Council of AIs) is the B2B/B2G enterprise product, while SOAI (Safety Of AI) is the B2C consumer protection product.",
    moduleId: 1,
  },
  {
    question: "Under the EU AI Act, what must deepfake generators disclose?",
    options: JSON.stringify([
      "Nothing",
      "That the content is AI-generated",
      "The source code",
      "The training data"
    ]),
    correctAnswer: 1,
    explanation: "Deepfake generators fall under limited risk and must disclose that content is AI-generated.",
    moduleId: 2,
  },
  {
    question: "Which NIST AI RMF function establishes organizational AI risk management practices?",
    options: JSON.stringify([
      "GOVERN",
      "MAP",
      "MEASURE",
      "MANAGE"
    ]),
    correctAnswer: 0,
    explanation: "The GOVERN function establishes and maintains organizational AI risk management practices.",
    moduleId: 3,
  },
  {
    question: "What is the difference between explainability and interpretability?",
    options: JSON.stringify([
      "They are the same thing",
      "Explainability is for users, interpretability is for developers",
      "Explainability describes the model, interpretability describes individual decisions",
      "Interpretability is more important"
    ]),
    correctAnswer: 2,
    explanation: "Explainability typically refers to understanding the overall model, while interpretability refers to understanding individual decisions.",
    moduleId: 3,
  },
  {
    question: "What is predictive parity?",
    options: JSON.stringify([
      "All predictions are correct",
      "Positive predictions are equally accurate across groups",
      "All groups make predictions",
      "Predictions are made in parallel"
    ]),
    correctAnswer: 1,
    explanation: "Predictive parity means positive predictions are equally accurate across different demographic groups.",
    moduleId: 4,
  },
  {
    question: "Why is it important to consider the council votes when making a decision?",
    options: JSON.stringify([
      "To copy the majority vote",
      "They provide valuable AI analysis and context",
      "To avoid responsibility",
      "Council votes are always correct"
    ]),
    correctAnswer: 1,
    explanation: "Council votes provide valuable AI-powered analysis and context that helps inform the human decision.",
    moduleId: 5,
  },
  {
    question: "What makes COAI's approach unique compared to traditional compliance tools?",
    options: JSON.stringify([
      "It's cheaper",
      "It combines AI analysis with human oversight and public accountability",
      "It only covers EU regulations",
      "It doesn't require any human involvement"
    ]),
    correctAnswer: 1,
    explanation: "COAI uniquely combines AI-powered analysis (33-agent council), human oversight (Watchdog Analysts), and public accountability (The Watchdog).",
    moduleId: 1,
  },
];

async function seedDatabase() {
  console.log("🌱 Starting database seed...");
  
  // Get database connection string from environment
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.log("⚠️ DATABASE_URL not set. Creating seed data file instead...");
    
    // Write seed data to JSON files for manual import
    const fs = await import("fs");
    
    fs.writeFileSync(
      "./scripts/seed-modules.json",
      JSON.stringify(trainingModules, null, 2)
    );
    
    fs.writeFileSync(
      "./scripts/seed-questions.json",
      JSON.stringify(certificationQuestions, null, 2)
    );
    
    console.log("✅ Seed data written to:");
    console.log("   - scripts/seed-modules.json");
    console.log("   - scripts/seed-questions.json");
    console.log("");
    console.log("📋 To import manually, use the Database panel in the Management UI");
    return;
  }
  
  try {
    const connection = await mysql.createConnection(connectionString);
    const db = drizzle(connection);
    
    console.log("📚 Seeding training modules...");
    for (const module of trainingModules) {
      await connection.execute(
        `INSERT INTO training_modules (code, title, description, content, orderIndex, durationMinutes, isRequired)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE title = VALUES(title)`,
        [`module_${module.orderIndex}`, module.title, module.description, module.content, module.orderIndex, module.estimatedMinutes, module.isRequired]
      );
    }
    console.log(`   ✅ Seeded ${trainingModules.length} training modules`);
    
    // First, create a certification test
    console.log("📝 Creating certification test...");
    const [testResult] = await connection.execute(
      `INSERT INTO certification_tests (code, title, description, passingScore, timeLimitMinutes, isActive)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE title = VALUES(title)`,
      ["watchdog_cert_v1", "Watchdog Analyst Certification", "Complete this test to become a certified COAI Watchdog Analyst", 70, 60, true]
    );
    
    // Get the test ID
    const [tests] = await connection.execute("SELECT id FROM certification_tests WHERE title = ?", ["Watchdog Analyst Certification"]);
    const testId = tests[0]?.id || 1;
    
    console.log("❓ Seeding certification questions...");
    for (const question of certificationQuestions) {
      await connection.execute(
        `INSERT INTO test_questions (testId, moduleId, questionText, options, correctAnswer, explanation)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [testId, question.moduleId, question.question, question.options, String(question.correctAnswer), question.explanation]
      );
    }
    console.log(`   ✅ Seeded ${certificationQuestions.length} certification questions`);
    
    await connection.end();
    console.log("");
    console.log("🎉 Database seeding complete!");
    
  } catch (error) {
    console.error("❌ Error seeding database:", error.message);
    console.log("");
    console.log("💡 Seed data has been saved to JSON files. You can import them manually.");
  }
}

// Export for use in other scripts
export { trainingModules, certificationQuestions };

// Run if called directly
seedDatabase();
