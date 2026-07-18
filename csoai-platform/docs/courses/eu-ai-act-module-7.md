# Module 7: Transparency, GPAI, and Governance

**Duration**: 60 minutes  
**Learning Objectives**:
- Understand transparency obligations for all AI systems
- Recognize General-Purpose AI (GPAI) requirements
- Identify the governance structure and key institutions
- Apply transparency requirements to your AI systems

---

## Introduction

Beyond prohibited practices and high-risk systems, the EU AI Act establishes requirements for **all AI systems** through transparency obligations. It also creates a new regulatory framework for **General-Purpose AI** (GPAI) models and establishes a comprehensive **governance structure** to oversee implementation.

This module covers three critical topics:
1. Transparency obligations for all AI systems
2. General-Purpose AI (GPAI) requirements
3. Governance structure and enforcement

## Transparency Obligations (Chapter IV)

Transparency requirements apply to **all AI systems**, not just high-risk ones. The principle: people should know when they're interacting with AI.

### 1. AI System Interaction Disclosure (Article 50(1))

**Requirement**: Providers of AI systems intended to interact directly with natural persons must design the system to inform people that they are interacting with an AI system.

**Exceptions**: When this is obvious from the circumstances and context.

**What this means**:

**Covered systems**:
- Chatbots and conversational AI
- Virtual assistants
- AI-powered customer service
- Interactive AI applications

**Disclosure requirement**: Clear, prominent notice that the user is interacting with AI, not a human.

**"Obvious from circumstances" exception**: If it's unmistakably clear that the system is AI (e.g., a robot with mechanical voice, a clearly labeled "AI Assistant" interface), explicit disclosure may not be required.

**Examples**:

✅ **Requires disclosure**:
- Customer service chatbot that could be mistaken for a human agent
- AI phone system with natural-sounding voice
- Virtual assistant with human-like responses

❌ **May not require disclosure (obvious)**:
- Clearly labeled "AI Chatbot" with robotic avatar
- System explicitly introduced as AI
- Interface that unmistakably appears automated

**Real-world scenario**: A company deploying a customer service chatbot must ensure the interface clearly indicates "You are chatting with an AI assistant" or similar disclosure. However, if the chatbot is labeled "AI Support Bot" with a robot icon and mechanical responses, additional disclosure may not be required.

### 2. Emotion Recognition and Biometric Categorization Disclosure (Article 50(2))

**Requirement**: Deployers of emotion recognition or biometric categorization systems must inform natural persons exposed to the system.

**What this means**:

**Covered systems**:
- Emotion recognition AI (excluding prohibited workplace/school use)
- Biometric categorization AI (excluding prohibited sensitive attribute inference)

**Disclosure requirement**: Clear notice that individuals are being subjected to emotion recognition or biometric categorization.

**Timing**: Before exposure to the system.

**Examples**:

✅ **Requires disclosure**:
- Retail store using emotion recognition to analyze shoppers' responses to products
- Call center using emotion detection on customer calls
- Public space using biometric categorization for demographic analytics

**Real-world scenario**: A shopping mall using AI cameras to analyze shoppers' emotional responses to store displays must post clear signage informing visitors that emotion recognition technology is in use.

### 3. Deep Fake Disclosure (Article 50(4))

**Requirement**: Deployers of AI systems that generate or manipulate image, audio, or video content (deep fakes) must disclose that the content has been artificially generated or manipulated.

**What this means**:

**Covered content**:
- AI-generated images, videos, or audio
- AI-manipulated media (face swaps, voice cloning, etc.)

**Disclosure requirement**: Clear, prominent notice that content is AI-generated or AI-manipulated.

**Exceptions**:
- Content necessary for the exercise of the right to freedom of expression and the right to freedom of the arts and sciences (with appropriate safeguards)
- Content that is obviously satire or artistic in nature
- Content authorized by law for detecting, preventing, or investigating criminal offenses

**Machine-readable format**: Disclosure should be in a format that can be detected by technical means (e.g., metadata, watermarks).

**Examples**:

✅ **Requires disclosure**:
- AI-generated spokesperson videos for marketing
- AI-manipulated images in news or social media
- Deepfake videos of public figures
- AI-generated audio impersonating real people

❌ **May not require disclosure (exceptions)**:
- Clearly satirical deepfakes (e.g., comedy sketches)
- Artistic works where AI generation is part of the creative expression
- Law enforcement use of deepfakes in investigations (authorized by law)

**Real-world scenario**: A marketing agency creating AI-generated spokesperson videos must include clear disclosure (e.g., "This video was generated using AI") and embed machine-readable markers in the content. However, a comedian creating an obvious parody video using deepfake technology may not need explicit disclosure if the satirical nature is clear.

## General-Purpose AI (GPAI) Requirements (Chapter V)

General-Purpose AI models (like GPT, Claude, Gemini) are regulated separately from specific-use AI systems. The Act creates a two-tier framework based on capabilities.

### What is General-Purpose AI?

**Definition (Article 3(63))**: An AI model, including when trained with a large amount of data using self-supervision at scale, that displays significant generality and is capable of competently performing a wide range of distinct tasks regardless of the way the model is placed on the market, and that can be integrated into a variety of downstream systems or applications.

**In plain language**: AI models that can be used for many different purposes, not designed for a specific task.

**Examples**:
- Large language models (GPT-4, Claude, Gemini, Llama)
- Multimodal models (GPT-4V, Gemini Pro)
- Foundation models for images (DALL-E, Stable Diffusion)
- General-purpose vision models

**Not GPAI**:
- AI systems designed for specific tasks (e.g., credit scoring AI, facial recognition for access control)
- Narrow AI models (e.g., spam filters, recommendation systems for specific platforms)

### GPAI with Systemic Risk

**Definition (Article 3(65))**: GPAI models with high-impact capabilities, determined by:
- **Cumulative compute threshold**: Training with compute ≥ 10^25 FLOPs (floating-point operations)
- **Commission designation**: Models with capabilities or impact equivalent to threshold models

**In plain language**: The most powerful GPAI models that could pose systemic risks.

**Examples** (as of 2024):
- GPT-4 and future versions
- Claude 3 Opus and future versions
- Gemini Ultra and future versions
- Other frontier models

**Not systemic risk GPAI**:
- Smaller open-source models (Llama 2, Mistral 7B)
- Specialized models below the compute threshold

### GPAI Provider Obligations (Article 53)

All GPAI providers must comply with baseline obligations:

#### 1. Technical Documentation (Article 53(1)(a))

**Requirement**: Draw up and keep up-to-date technical documentation including:
- Training process description
- Data sources and curation
- Compute resources used
- Model architecture
- Capabilities and limitations
- Evaluation results

**Purpose**: Enable downstream providers to understand the model and comply with their obligations.

#### 2. Information to Downstream Providers (Article 53(1)(b))

**Requirement**: Provide information and documentation to downstream providers (those building applications on top of the GPAI model) to enable compliance.

**What must be provided**:
- Capabilities and limitations
- Appropriate use cases
- Inappropriate use cases
- Known risks
- Mitigation measures

**Purpose**: Enable downstream providers to assess whether the GPAI model is suitable for their high-risk AI system and to implement necessary safeguards.

#### 3. Copyright Compliance (Article 53(1)(c))

**Requirement**: Put in place a policy to comply with EU copyright law, particularly regarding the reservation of rights by rights holders to opt out of text and data mining.

**What this means**:
- Respect copyright holders' rights
- Implement mechanisms for rights holders to opt out of having their content used for training
- Document compliance with copyright obligations

**Purpose**: Balance AI innovation with intellectual property rights.

#### 4. Public Summary (Article 53(1)(d))

**Requirement**: Make publicly available a sufficiently detailed summary of the content used for training the GPAI model.

**What must be included**:
- Types of content used (text, images, code, etc.)
- Data sources (websites, books, datasets, etc.)
- Data curation methods
- Copyright compliance measures

**Purpose**: Transparency about training data for public accountability and rights holders' awareness.

**Real-world example**: OpenAI, Anthropic, and Google must publish summaries describing the types of content used to train GPT, Claude, and Gemini, including data sources, curation methods, and copyright compliance policies.

### Additional Obligations for Systemic Risk GPAI (Article 55)

Providers of GPAI models with systemic risk face additional obligations:

#### 1. Model Evaluation (Article 55(1)(a))

**Requirement**: Perform model evaluation in accordance with standardized protocols and tools, including conducting and documenting adversarial testing.

**What this means**:
- Test model capabilities and limitations
- Conduct red-teaming (adversarial testing)
- Evaluate potential for misuse
- Document evaluation results

**Purpose**: Identify and mitigate risks before deployment.

#### 2. Risk Assessment and Mitigation (Article 55(1)(b))

**Requirement**: Assess and mitigate systemic risks, including their sources, that may stem from the development, placing on the market, or use of GPAI models with systemic risk.

**Systemic risks** include:
- Risks to public health, safety, security
- Risks to fundamental rights
- Risks to democratic processes
- Risks from malicious use (e.g., cyberattacks, disinformation, bioweapons)

**Mitigation measures** may include:
- Technical safeguards (content filters, usage restrictions)
- Access controls
- Monitoring and response systems
- Collaboration with other providers and authorities

**Purpose**: Prevent catastrophic risks from the most powerful AI models.

#### 3. Tracking and Reporting Serious Incidents (Article 55(1)(c))

**Requirement**: Track, document, and report serious incidents and possible corrective measures to the AI Office and national authorities.

**Serious incidents**: Events causing or potentially causing:
- Widespread harm
- Serious fundamental rights violations
- Major security breaches
- Significant societal disruption

**Timeline**: Report without undue delay after becoming aware.

**Purpose**: Enable rapid response to incidents involving powerful AI models.

#### 4. Cybersecurity Protection (Article 55(1)(d))

**Requirement**: Ensure an adequate level of cybersecurity protection for the GPAI model and its physical infrastructure.

**What this means**:
- Protect model weights from theft or unauthorized access
- Secure training and inference infrastructure
- Implement access controls
- Monitor for security breaches

**Purpose**: Prevent malicious actors from stealing or compromising powerful AI models.

**Real-world example**: OpenAI, Anthropic, and Google must conduct adversarial testing of their frontier models, assess risks like potential for generating bioweapon instructions or sophisticated disinformation, implement mitigation measures (content filters, usage monitoring), report serious incidents, and secure their models against theft or compromise.

## Governance Structure (Chapter VII)

The EU AI Act establishes a multi-layered governance structure to oversee implementation and enforcement.

### 1. European Artificial Intelligence Board (Article 65)

**Composition**: Representatives from all EU member states' national supervisory authorities, plus the European Data Protection Supervisor.

**Role**:
- Advise the Commission on AI Act implementation
- Coordinate between member states
- Issue opinions, recommendations, and guidance
- Support consistent application of the Act across the EU

**Key functions**:
- Develop guidance on high-risk AI systems
- Coordinate market surveillance
- Facilitate information exchange between authorities
- Advise on international cooperation

**Real-world impact**: The Board will issue guidance helping organizations understand and comply with requirements, ensuring consistent interpretation across all EU countries.

### 2. AI Office (Article 64)

**Location**: Within the European Commission.

**Role**:
- Oversee GPAI model compliance
- Coordinate with national authorities
- Monitor AI market and emerging risks
- Conduct investigations
- Issue guidance and recommendations

**Key functions**:
- Supervise GPAI providers (especially systemic risk models)
- Maintain the EU database of high-risk AI systems
- Support standardization efforts
- Facilitate codes of practice
- Engage in international cooperation

**Real-world impact**: The AI Office will directly supervise frontier AI labs (OpenAI, Anthropic, Google, etc.), investigate potential violations, and coordinate EU-wide enforcement.

### 3. National Competent Authorities (Article 70)

**Composition**: Each EU member state designates national authorities responsible for:
- Market surveillance
- Enforcement
- Notified body oversight

**Role**:
- Supervise AI systems (except GPAI with systemic risk, which the AI Office handles)
- Investigate complaints
- Conduct inspections and audits
- Issue corrective measures and penalties
- Cooperate with other national authorities and the AI Office

**Real-world impact**: National authorities will enforce the Act within their countries, investigating complaints about non-compliant AI systems and imposing penalties.

### 4. Notified Bodies (Article 33)

**Role**: Independent organizations designated by member states to conduct third-party conformity assessments for certain high-risk AI systems.

**Requirements for notified bodies**:
- Independence and impartiality
- Technical expertise in AI
- Organizational and quality management capabilities
- Confidentiality and data protection

**When notified body assessment is required**:
- Remote biometric identification systems
- High-risk AI systems in products subject to third-party assessment under other EU laws

**Real-world impact**: Notified bodies will verify compliance for the most sensitive high-risk AI systems before they can be placed on the market.

### 5. Advisory Forum (Article 67)

**Composition**: Stakeholders including industry, startups, SMEs, civil society, academia, and other relevant parties.

**Role**:
- Provide technical expertise
- Advise the AI Office and Board
- Support development of standards and codes of practice
- Represent diverse perspectives in AI governance

**Real-world impact**: The Advisory Forum ensures that AI governance considers input from all affected parties, not just regulators and large companies.

## Codes of Practice (Article 56)

**Purpose**: Provide practical guidance for complying with GPAI obligations.

**Development**: GPAI providers, in collaboration with the AI Office, develop codes of practice specifying:
- Means to comply with obligations
- Technical standards and benchmarks
- Best practices

**Voluntary but incentivized**: Following codes of practice creates a presumption of compliance, reducing regulatory uncertainty.

**Real-world impact**: Frontier AI labs will collaborate to develop industry standards for model evaluation, risk assessment, and incident reporting, creating clear compliance pathways.

## International Cooperation (Article 99)

**Purpose**: Ensure global coordination on AI governance.

**Activities**:
- Information exchange with non-EU authorities
- Cooperation on enforcement
- Harmonization of standards
- Capacity building in third countries

**Real-world impact**: The EU will work with the US, UK, and other jurisdictions to align AI regulations, reducing compliance burdens for global AI providers.

## Practical Implications

### For GPAI Providers

**Baseline obligations** (all GPAI models):
1. Create comprehensive technical documentation
2. Provide information to downstream providers
3. Implement copyright compliance policies
4. Publish training data summary

**Additional obligations** (systemic risk models):
1. Conduct model evaluations and adversarial testing
2. Assess and mitigate systemic risks
3. Track and report serious incidents
4. Ensure robust cybersecurity

**Compliance pathway**:
- Participate in codes of practice development
- Engage with the AI Office
- Collaborate with other GPAI providers on standards
- Implement monitoring and response systems

### For Downstream Providers (Using GPAI Models)

**Obligations**:
1. Obtain information from GPAI provider about capabilities, limitations, and risks
2. Assess whether the GPAI model is suitable for your high-risk AI system
3. Implement necessary safeguards based on GPAI provider's guidance
4. Comply with all high-risk AI system requirements (if applicable)

**Compliance pathway**:
- Request comprehensive documentation from GPAI provider
- Conduct your own risk assessment
- Implement additional safeguards if needed
- Document your evaluation and decisions

### For All AI System Providers

**Transparency obligations**:
1. Disclose AI interaction (chatbots, virtual assistants)
2. Disclose emotion recognition or biometric categorization
3. Disclose AI-generated or AI-manipulated content (deepfakes)

**Compliance pathway**:
- Review all AI systems for transparency requirements
- Implement clear, prominent disclosures
- Use machine-readable formats for deepfake disclosure
- Document compliance

## Conclusion

Transparency, GPAI regulation, and governance structures complete the EU AI Act's comprehensive framework. Transparency obligations ensure people know when they're interacting with AI. GPAI requirements address the unique risks of powerful, general-purpose models. The governance structure provides oversight, guidance, and enforcement.

Understanding these elements is essential for comprehensive compliance. In the final module, we'll cover compliance timelines, penalties, and next steps for your organization.

## Key Takeaways

✅ **All AI systems must disclose** when people are interacting with AI, being subjected to emotion recognition/biometric categorization, or viewing AI-generated content

✅ **GPAI providers must create technical documentation**, provide information to downstream providers, comply with copyright law, and publish training data summaries

✅ **GPAI models with systemic risk** (≥10^25 FLOPs) face additional obligations: model evaluation, risk assessment/mitigation, incident reporting, and cybersecurity

✅ **Governance structure includes** the AI Office (GPAI supervision), European AI Board (coordination), national authorities (enforcement), notified bodies (conformity assessment), and Advisory Forum (stakeholder input)

✅ **Codes of practice** provide practical compliance guidance for GPAI providers

✅ **International cooperation** aims to harmonize AI regulation globally

✅ **Transparency is universal**—even non-high-risk AI systems must disclose their nature

✅ **Downstream providers** using GPAI models must obtain information about capabilities and risks to ensure compliance
