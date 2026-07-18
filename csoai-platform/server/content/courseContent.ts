/**
 * CSOAI Platform - Comprehensive Course Content
 *
 * This file contains full course definitions with:
 * - Course metadata (title, description, framework, level)
 * - Module content (lessons, readings, videos)
 * - Learning objectives
 * - Certification exam linkage
 *
 * All courses are FREE - only yearly license fee applies
 */

export interface ModuleContent {
  id: number;
  title: string;
  description: string;
  durationMinutes: number;
  learningObjectives: string[];
  content: {
    type: 'lesson' | 'video' | 'reading' | 'case_study' | 'interactive';
    title: string;
    content: string;
    estimatedMinutes: number;
  }[];
  keyTakeaways: string[];
}

export interface CourseContent {
  id: number;
  title: string;
  shortTitle: string;
  description: string;
  framework: string;
  level: 'fundamentals' | 'advanced' | 'specialist';
  totalDurationHours: number;
  certificationType: string;
  prerequisites: string[];
  modules: ModuleContent[];
  finalExamInfo: {
    questionCount: number;
    passingScore: number;
    timeLimit: number;
  };
}

// ============================================================================
// EU AI ACT FUNDAMENTALS COURSE
// ============================================================================
export const euAiActCourse: CourseContent = {
  id: 1,
  title: 'EU AI Act Compliance Fundamentals',
  shortTitle: 'EU AI Act',
  description: 'Master the requirements of the EU AI Act (Regulation 2024/1689) and prepare your organization for compliance. This comprehensive course covers all 113 articles, risk classification, prohibited practices, and implementation timelines.',
  framework: 'EU AI Act',
  level: 'fundamentals',
  totalDurationHours: 8,
  certificationType: 'EU AI Act Specialist',
  prerequisites: [],
  finalExamInfo: {
    questionCount: 50,
    passingScore: 80,
    timeLimit: 90,
  },
  modules: [
    {
      id: 1,
      title: 'Introduction to the EU AI Act',
      description: 'Overview of the EU AI Act, its purpose, scope, and the risk-based regulatory approach.',
      durationMinutes: 60,
      learningObjectives: [
        'Understand the legislative history and purpose of the EU AI Act',
        'Identify the four-tier risk classification system',
        'Explain the territorial scope and who the Act applies to',
        'Describe the phased implementation timeline',
      ],
      content: [
        {
          type: 'lesson',
          title: 'The Birth of AI Regulation in Europe',
          content: `The EU AI Act (Regulation 2024/1689) represents the world's first comprehensive legal framework for artificial intelligence. Published in the Official Journal on July 12, 2024, and entering into force on August 1, 2024, this landmark regulation establishes a harmonized approach to AI governance across all EU member states.

**Historical Context**
The European Commission first proposed the AI Act in April 2021 as part of its broader digital strategy. After three years of intense negotiations between the European Parliament and Council, the final text was adopted in May 2024.

**Core Philosophy: Risk-Based Approach**
Unlike previous technology regulations, the EU AI Act takes a proportionate, risk-based approach:

1. **Unacceptable Risk** - AI systems that pose clear threats to safety, livelihoods, or rights are prohibited outright
2. **High Risk** - Systems used in critical areas face strict requirements before market placement
3. **Limited Risk** - Systems with transparency obligations (e.g., chatbots must disclose they are AI)
4. **Minimal Risk** - Free use with no obligations (the vast majority of AI systems)

This approach ensures that regulation is proportionate to potential harm while not stifling innovation.`,
          estimatedMinutes: 15,
        },
        {
          type: 'lesson',
          title: 'Territorial Scope and Applicability',
          content: `**Who Does the EU AI Act Apply To?**

The Act has extraterritorial reach, applying to:

1. **Providers** - Those who develop or place AI systems on the EU market, regardless of location
2. **Deployers** - Organizations using AI systems within the EU
3. **Importers** - Those bringing AI systems into the EU market
4. **Distributors** - Those making AI systems available in the EU supply chain
5. **Product Manufacturers** - Those integrating AI into products under EU harmonization legislation

**Key Exclusions:**
- AI systems used exclusively for military or defense purposes
- AI systems used by public authorities in third countries under international agreements
- AI for scientific research and development (pre-market)
- Personal, non-professional AI use by individuals

**Important Note:** Even if you're outside the EU, if your AI system outputs are used within the EU, you may be subject to the regulation.`,
          estimatedMinutes: 12,
        },
        {
          type: 'lesson',
          title: 'Implementation Timeline',
          content: `The EU AI Act has a phased implementation approach:

**Phase 1: February 2, 2025 (6 months)**
- Prohibition of unacceptable-risk AI practices (Article 5)
- AI literacy requirements begin

**Phase 2: August 2, 2025 (12 months)**
- General-Purpose AI (GPAI) model provisions apply
- Governance structures must be established
- Codes of practice for GPAI

**Phase 3: August 2, 2026 (24 months)**
- High-risk AI systems in Annex III must comply
- Transparency obligations for limited-risk systems
- Most substantive requirements take effect

**Phase 4: August 2, 2027 (36 months)**
- High-risk AI systems embedded in products (Annex I) must comply
- Full enforcement across all provisions

**Compliance Checkpoints:**
Organizations should conduct gap analyses now and develop compliance roadmaps aligned with these deadlines.`,
          estimatedMinutes: 10,
        },
        {
          type: 'video',
          title: 'Risk Classification Deep Dive',
          content: 'Interactive video explaining the four-tier risk classification system with real-world examples of AI systems in each category.',
          estimatedMinutes: 15,
        },
        {
          type: 'case_study',
          title: 'Case Study: Determining Your AI System\'s Risk Category',
          content: `**Scenario:** TechCorp has developed three AI systems:
1. A customer service chatbot
2. A CV screening system for recruitment
3. A content recommendation algorithm for their news app

**Analysis Exercise:**
Classify each system according to the EU AI Act risk tiers and identify applicable obligations.

**Solution:**
1. **Chatbot** - Limited Risk: Must disclose to users they're interacting with AI (Article 52)
2. **CV Screening** - High Risk (Annex III, Category 4): Full compliance required including risk management, data governance, documentation, human oversight
3. **Recommendation Algorithm** - Minimal Risk: No specific obligations, but voluntary codes of conduct apply

This exercise demonstrates how different AI applications within the same organization may face vastly different compliance requirements.`,
          estimatedMinutes: 8,
        },
      ],
      keyTakeaways: [
        'The EU AI Act is the first comprehensive AI regulation globally',
        'It uses a proportionate, risk-based approach with four tiers',
        'The Act has extraterritorial reach affecting non-EU organizations',
        'Implementation is phased over 36 months from August 2024',
      ],
    },
    {
      id: 2,
      title: 'Prohibited AI Practices (Article 5)',
      description: 'Deep dive into the eight prohibited AI practices that pose unacceptable risks to fundamental rights.',
      durationMinutes: 60,
      learningObjectives: [
        'List all eight prohibited AI practices under Article 5',
        'Understand the rationale behind each prohibition',
        'Identify potential violations in real-world scenarios',
        'Know the timeline and penalties for prohibited practices',
      ],
      content: [
        {
          type: 'lesson',
          title: 'The Eight Prohibited Practices',
          content: `Article 5 prohibits AI systems that pose unacceptable risks. These prohibitions take effect February 2, 2025.

**1. Subliminal Manipulation**
AI that deploys subliminal techniques beyond a person's consciousness to materially distort behavior, causing significant harm.
Example: Hidden audio frequencies in advertising that influence purchasing decisions.

**2. Exploitation of Vulnerabilities**
AI that exploits vulnerabilities of specific groups (age, disability, social/economic situation) to distort behavior causing significant harm.
Example: Predatory lending AI targeting elderly individuals with diminished cognitive capacity.

**3. Social Scoring by Public Authorities**
AI for evaluating or classifying people based on social behavior leading to detrimental treatment unrelated to the context of data collection.
Example: A government system that denies services based on citizens' social media activity.

**4. Real-Time Remote Biometric Identification**
Using AI for real-time biometric identification in publicly accessible spaces for law enforcement, with limited exceptions:
- Searching for specific crime victims or missing persons
- Preventing imminent threats to life or terrorist attacks
- Identifying suspects of serious crimes

**5. Risk Assessments for Crime Prediction**
AI that assesses the risk of a natural person committing a criminal offense solely based on profiling or personality traits.
Exception: Systems that augment human assessments based on objective, verifiable facts linked to criminal activity.

**6. Untargeted Facial Image Scraping**
Creating or expanding facial recognition databases through untargeted scraping from the internet or CCTV footage.

**7. Emotion Recognition in Workplace/Education**
AI inferring emotions in workplaces or educational institutions, except for safety or medical purposes.

**8. Biometric Categorization by Sensitive Attributes**
AI categorizing individuals based on biometric data to deduce race, political opinions, trade union membership, religious beliefs, sex life, or sexual orientation.`,
          estimatedMinutes: 20,
        },
        {
          type: 'lesson',
          title: 'Penalties for Prohibited Practices',
          content: `**Maximum Penalties (Article 99):**

Non-compliance with prohibited AI practices attracts the highest penalty tier:

**For Companies:**
- €35 million OR
- 7% of total worldwide annual turnover (whichever is higher)

**For SMEs and Startups:**
- Lower caps apply proportionate to size
- Member states may set lower amounts for SMEs

**For Individuals:**
- Member states determine individual penalties

**Aggravating Factors:**
- Previous infringements
- Intentional nature of infringement
- Number of affected persons
- Duration of infringement
- Economic benefits gained

**Key Point:** These penalties can exceed GDPR fines and represent the most severe AI-related sanctions globally.`,
          estimatedMinutes: 10,
        },
        {
          type: 'interactive',
          title: 'Prohibition Identification Exercise',
          content: 'Interactive scenarios where learners identify which prohibition (if any) applies to described AI systems.',
          estimatedMinutes: 15,
        },
        {
          type: 'case_study',
          title: 'Real-World Prohibition Analysis',
          content: `**Scenario 1: Clearview AI-Style Systems**
A company offers facial recognition services built by scraping billions of images from social media platforms without consent.
**Analysis:** Violates Prohibition 6 (untargeted facial image scraping). Must discontinue by February 2025.

**Scenario 2: Employee Emotion Monitoring**
A corporation deploys cameras with emotion recognition to monitor employee "engagement" during meetings.
**Analysis:** Violates Prohibition 7 (emotion recognition in workplace). Not permitted regardless of consent.

**Scenario 3: Targeted Law Enforcement**
Police use real-time facial recognition to identify a specific kidnapping suspect in a public square.
**Analysis:** Potentially permitted under Prohibition 4 exceptions (searching for crime victim), but requires prior judicial authorization and strict procedural safeguards.`,
          estimatedMinutes: 15,
        },
      ],
      keyTakeaways: [
        'Eight specific AI practices are prohibited as posing unacceptable risks',
        'Prohibitions take effect February 2, 2025 - the earliest deadline',
        'Maximum fines are €35M or 7% global turnover',
        'Some biometric exceptions exist for law enforcement with strict safeguards',
      ],
    },
    {
      id: 3,
      title: 'High-Risk AI Systems (Annex III)',
      description: 'Understanding the eight categories of high-risk AI systems and their compliance requirements.',
      durationMinutes: 60,
      learningObjectives: [
        'Identify the eight categories of high-risk AI in Annex III',
        'Understand criteria for high-risk classification',
        'Know when conformity assessments are required',
        'Distinguish between Annex I and Annex III high-risk systems',
      ],
      content: [
        {
          type: 'lesson',
          title: 'The Eight High-Risk Categories (Annex III)',
          content: `High-risk AI systems are those used in areas where potential harm to health, safety, or fundamental rights is significant.

**Category 1: Biometrics**
- Remote biometric identification (non-real-time)
- Biometric categorization based on sensitive attributes
- Emotion recognition systems

**Category 2: Critical Infrastructure**
- AI as safety components in management/operation of:
  - Road traffic
  - Water, gas, heating, electricity supply
  - Digital infrastructure

**Category 3: Education and Vocational Training**
- Determining access to education
- Evaluating learning outcomes
- Assessing appropriate education levels
- Monitoring prohibited behavior during tests

**Category 4: Employment and Worker Management**
- CV screening and recruitment
- Job advertisement targeting
- Candidate evaluation and selection
- Promotion and termination decisions
- Task allocation and performance monitoring

**Category 5: Access to Essential Services**
- Creditworthiness assessment
- Loan and insurance pricing
- Emergency service dispatch prioritization
- Public benefit eligibility

**Category 6: Law Enforcement**
- Individual risk assessment (criminal behavior)
- Polygraphs and similar tools
- Evidence reliability assessment
- Criminal profiling
- Criminal analytics for pattern detection

**Category 7: Migration, Asylum, and Border Control**
- Polygraphs for migration interviews
- Risk assessment for security/health
- Asylum application examination
- Document authenticity verification

**Category 8: Administration of Justice**
- Judicial research and interpretation
- Alternative dispute resolution
- Sentencing assistance (for judges)`,
          estimatedMinutes: 20,
        },
        {
          type: 'lesson',
          title: 'Conformity Assessment Procedures',
          content: `High-risk AI systems must undergo conformity assessment before market placement.

**Two Pathways:**

**1. Internal Control (Self-Assessment)**
Most Annex III systems can conduct internal conformity assessment if:
- Following harmonized standards
- Using internal quality management system
- Maintaining technical documentation

**2. Third-Party Assessment (Notified Body)**
Required for:
- Biometric identification systems (Category 1)
- Systems embedded in products under specific EU legislation
- Systems where manufacturer chooses third-party assessment

**Key Steps in Conformity Assessment:**
1. Establish risk management system
2. Implement data governance
3. Create technical documentation
4. Ensure human oversight capabilities
5. Achieve accuracy, robustness, cybersecurity standards
6. Register in EU database
7. Affix CE marking

**Documentation Requirements:**
- Detailed system description
- Development process information
- Risk management documentation
- Testing and validation records
- Instructions for use`,
          estimatedMinutes: 15,
        },
        {
          type: 'reading',
          title: 'Annex I vs Annex III High-Risk Systems',
          content: `**Understanding the Two Annexes:**

**Annex I - Product Safety Legislation**
AI systems that are:
- Safety components of products, OR
- Products themselves
Covered by EU harmonization legislation listed in Annex I (e.g., machinery, medical devices, toys, vehicles).

Timeline: Full compliance by August 2, 2027 (36 months)

**Annex III - Standalone High-Risk Areas**
AI systems used in the eight specific areas regardless of whether they're products.

Timeline: Full compliance by August 2, 2026 (24 months)

**Key Distinction:**
A medical AI diagnostic tool would be:
- Annex I if it's a certified medical device
- Annex III Category 5 if used for determining treatment eligibility
- Potentially both if it meets criteria for each

**Practical Implication:**
Organizations must analyze their AI portfolio against both Annexes to determine compliance requirements and timelines.`,
          estimatedMinutes: 10,
        },
        {
          type: 'case_study',
          title: 'High-Risk Classification Analysis',
          content: `**Exercise:** Classify these AI systems and determine conformity assessment requirements.

**System A:** AI tool that analyzes resumes and ranks job candidates
Classification: High-risk (Annex III, Category 4 - Employment)
Assessment: Internal control possible
Timeline: August 2026

**System B:** AI component in an autonomous vehicle's collision detection
Classification: High-risk (Annex I - Vehicle Safety)
Assessment: Third-party required (per vehicle regulations)
Timeline: August 2027

**System C:** AI chatbot answering customer service questions about products
Classification: Limited risk (transparency only)
Assessment: None required
Timeline: August 2026 (transparency obligations)

**System D:** Emotion recognition for safety drivers in trucking company
Classification: May be exempt - safety purpose in workplace
Assessment: Depends on specific implementation
Note: Requires careful legal analysis of "safety purposes" exception`,
          estimatedMinutes: 15,
        },
      ],
      keyTakeaways: [
        'Eight categories in Annex III cover employment, education, law enforcement, etc.',
        'Most high-risk systems can do internal conformity assessment',
        'Biometric ID systems require third-party assessment',
        'Annex III systems must comply by August 2026',
      ],
    },
    {
      id: 4,
      title: 'High-Risk Requirements (Articles 9-15)',
      description: 'Detailed examination of the six mandatory requirements for high-risk AI systems.',
      durationMinutes: 60,
      learningObjectives: [
        'Explain the six key requirements for high-risk AI systems',
        'Describe risk management system components',
        'Understand data governance requirements',
        'Know human oversight and transparency obligations',
      ],
      content: [
        {
          type: 'lesson',
          title: 'Requirement 1: Risk Management System (Article 9)',
          content: `**Core Obligation:**
Providers must establish, implement, document, and maintain a risk management system throughout the AI system lifecycle.

**Key Components:**

1. **Risk Identification and Analysis**
   - Identify known and foreseeable risks to health, safety, and fundamental rights
   - Consider intended purpose AND reasonably foreseeable misuse
   - Account for technical knowledge and state of the art

2. **Risk Estimation and Evaluation**
   - Assess likelihood and severity of identified risks
   - Consider both individual and societal impacts
   - Evaluate risks against acceptable levels

3. **Risk Mitigation Measures**
   - Design-based risk elimination where possible
   - Technical risk mitigation measures
   - Residual risk information to deployers
   - Training and awareness measures

4. **Testing and Iteration**
   - Define appropriate metrics and thresholds
   - Test against metrics pre-deployment
   - Test with target demographic groups
   - Iterate based on results

**Documentation Requirements:**
- Risk register with all identified risks
- Assessment methodologies used
- Mitigation measures and effectiveness
- Testing results and decisions made

**Continuous Obligation:**
Risk management isn't one-time—it must be continuously updated throughout the system's lifecycle.`,
          estimatedMinutes: 15,
        },
        {
          type: 'lesson',
          title: 'Requirement 2: Data Governance (Article 10)',
          content: `**Core Principle:**
Training, validation, and testing datasets must meet specific quality criteria.

**Dataset Requirements:**

1. **Relevance and Representativeness**
   - Data must be relevant to intended purpose
   - Must be sufficiently representative
   - Consider geographical, contextual, behavioral elements

2. **Appropriate Statistical Properties**
   - Account for characteristics of target persons/groups
   - Address potential biases
   - Consider data gaps that could lead to bias

3. **Examination and Processing**
   - Examine datasets for errors and inconsistencies
   - Apply appropriate data cleansing
   - Document data preparation processes

4. **Free from Errors**
   - Reasonable measures to detect data errors
   - Address data quality issues
   - Document known limitations

**Special Category Data (Article 10(5)):**
Processing of sensitive data (race, health, biometrics) is permitted ONLY to detect and correct biases, subject to:
- Appropriate safeguards for fundamental rights
- Strict necessity for bias correction
- Compliance with data protection requirements
- No other method available

**Provider Obligations:**
- Maintain data governance policies
- Document dataset origin and characteristics
- Assess fitness for purpose
- Monitor for data quality degradation`,
          estimatedMinutes: 12,
        },
        {
          type: 'lesson',
          title: 'Requirements 3-4: Documentation & Record-Keeping',
          content: `**Requirement 3: Technical Documentation (Article 11)**

Providers must draw up technical documentation BEFORE market placement.

**Documentation Must Include:**
- General system description
- Detailed description of AI elements
- Development process description
- Risk management documentation
- Changes throughout lifecycle
- Monitoring and functioning description
- Data governance information
- Testing and validation reports
- Cybersecurity measures
- Instructions for deployers

**Retention Period:** 10 years after market placement

---

**Requirement 4: Automatic Record-Keeping (Article 12)**

High-risk AI systems must enable logging of events ("logs").

**Logging Requirements:**
- Identify situations that may indicate risks
- Enable monitoring of system operation
- Support post-market monitoring
- Retain logs for appropriate periods

**Minimum Logging:**
- Each period of use (start, end)
- Reference database checks
- Input data leading to matches
- Identification of humans involved in verification

**Purpose:**
Logs enable traceability and support:
- Incident investigation
- Compliance verification
- Market surveillance
- Fundamental rights impact assessment`,
          estimatedMinutes: 12,
        },
        {
          type: 'lesson',
          title: 'Requirements 5-6: Transparency & Human Oversight',
          content: `**Requirement 5: Transparency (Article 13)**

High-risk AI systems must be designed to enable deployers to interpret outputs and use appropriately.

**Transparency Elements:**
- Instructions for use (clear, accessible)
- Provider identity and contact
- System characteristics, capabilities, limitations
- Intended purpose and use conditions
- Known foreseeable misuse risks
- Technical specifications
- Human oversight measures
- Expected lifetime and maintenance

**Deployer Information Must Include:**
- How to interpret outputs
- Performance metrics and limitations
- Risk scenarios requiring vigilance
- Input data specifications
- What outputs mean in context

---

**Requirement 6: Human Oversight (Article 14)**

Systems must be designed to enable effective human oversight.

**Human Oversight Objectives:**
- Prevent or minimize risks during use
- Enable overseers to properly understand capabilities
- Remain aware of automation bias risk
- Ability to interpret outputs
- Ability to disregard, override, or reverse outputs

**Technical Implementation:**
Providers must build in tools that allow human overseers to:
- Monitor system operation
- Intervene in real-time when needed
- Decide to stop the system ("stop button")
- Access logs and audit trails

**Critical Note:**
Human oversight isn't just about having a person present—it requires meaningful ability to understand and intervene.`,
          estimatedMinutes: 12,
        },
        {
          type: 'interactive',
          title: 'Compliance Requirement Mapping Exercise',
          content: 'Interactive exercise mapping specific AI system features to the six high-risk requirements.',
          estimatedMinutes: 9,
        },
      ],
      keyTakeaways: [
        'Six mandatory requirements: risk management, data, docs, logging, transparency, human oversight',
        'Risk management must be continuous throughout lifecycle',
        'Special rules for processing sensitive data to detect bias',
        'Human oversight must enable meaningful intervention capability',
      ],
    },
    {
      id: 5,
      title: 'General-Purpose AI (GPAI) Models',
      description: 'Understanding obligations for General-Purpose AI models including foundation models and those with systemic risk.',
      durationMinutes: 60,
      learningObjectives: [
        'Define GPAI models and their characteristics',
        'Distinguish between standard GPAI and systemic risk GPAI',
        'Explain transparency requirements for GPAI providers',
        'Understand the 10^25 FLOP threshold for systemic risk',
      ],
      content: [
        {
          type: 'lesson',
          title: 'What is General-Purpose AI?',
          content: `**Definition (Article 3(63)):**
A General-Purpose AI model is an AI model that:
- Is trained with a large amount of data using self-supervision at scale
- Displays significant generality
- Can competently perform a wide range of distinct tasks
- Can be integrated into various downstream systems or applications

**Key Characteristics:**
- Foundation models (GPT, Claude, Gemini, Llama)
- Large language models (LLMs)
- Multimodal models (text, image, audio)
- Models released via API or open source

**Why Special Rules?**
GPAI models present unique regulatory challenges:
1. Used across many different applications
2. Provider may not know all downstream uses
3. Potential for misuse at scale
4. Concentration of capabilities in few providers
5. Downstream impact amplification

**GPAI vs High-Risk:**
GPAI rules focus on the model itself, not specific applications.
A GPAI model integrated into a high-risk system makes that system subject to BOTH:
- GPAI model obligations (for the model provider)
- High-risk requirements (for the system provider/deployer)`,
          estimatedMinutes: 15,
        },
        {
          type: 'lesson',
          title: 'GPAI Obligations (All Models)',
          content: `**All GPAI model providers must:**

1. **Technical Documentation**
   - Model architecture and design choices
   - Training methodologies
   - Data sources used (description, not data itself)
   - Compute resources used
   - Model capabilities and limitations
   - Testing and evaluation results

2. **Information for Downstream Providers**
   - How to integrate the model
   - Capabilities and limitations
   - Known risks and mitigations
   - Suitable use cases
   - Unsuitable use cases

3. **Copyright Compliance**
   - Policy to comply with EU copyright law
   - Summary of training data sources
   - Respect for opt-out mechanisms

4. **Model Card / Summary**
   - Publicly available summary of training data
   - Sufficient detail for rights holders

**Timeline:** These obligations apply from August 2, 2025 (12 months)

**Open Source Exception:**
Limited exemption for freely available models with open weights/parameters UNLESS:
- Model has systemic risk
- Model presents specific risks (prohibited practices, etc.)`,
          estimatedMinutes: 15,
        },
        {
          type: 'lesson',
          title: 'Systemic Risk GPAI Models',
          content: `**Definition of Systemic Risk:**
A GPAI model has systemic risk if:
- It has high impact capabilities, OR
- Training compute exceeds 10^25 floating point operations (FLOPs)

**10^25 FLOP Threshold:**
This captures the most capable frontier models:
- GPT-4 class and above
- Commission can update threshold
- Based on computational scale as proxy for capability

**Additional Obligations for Systemic Risk Models:**

1. **Model Evaluation**
   - Adversarial testing (red-teaming)
   - Evaluate and mitigate systemic risks
   - Track and report serious incidents

2. **Risk Assessment**
   - Assess systemic risks including:
     - Risks from model architecture
     - Potential for propagation in value chain
     - Societal-scale impacts

3. **Risk Mitigation**
   - Implement measures to address identified risks
   - Document mitigation approaches
   - Update as capabilities evolve

4. **Cybersecurity**
   - Adequate protection for model and infrastructure
   - Prevent unauthorized access
   - Protect model weights

5. **Energy Reporting**
   - Report energy consumption of training
   - Include in technical documentation

6. **Incident Reporting**
   - Report serious incidents to AI Office
   - Report without undue delay

**Codes of Practice:**
The AI Office will facilitate development of codes of practice for GPAI compliance.`,
          estimatedMinutes: 15,
        },
        {
          type: 'case_study',
          title: 'GPAI Compliance Scenarios',
          content: `**Scenario 1: Open-Source LLM Release**
Company releases a 70B parameter model with open weights for free.

Analysis:
- Is GPAI? Yes (large-scale self-supervised, general capability)
- Systemic risk? Check FLOP count - likely no if under 10^25
- Obligations: Documentation, information provision, copyright
- Open source exemption? May apply if below threshold, freely available

**Scenario 2: API-Based Foundation Model**
Major AI lab offers API access to frontier model trained with 10^26 FLOPs.

Analysis:
- Is GPAI? Yes
- Systemic risk? Yes (exceeds threshold)
- Obligations: All GPAI + systemic risk requirements
- Timeline: Must comply by August 2025

**Scenario 3: Downstream Integration**
Healthcare startup integrates GPAI into diagnostic assistant.

Analysis:
- GPAI model obligations: Upstream provider
- High-risk system obligations: Healthcare startup
- Startup must receive adequate information from GPAI provider
- Both parties have compliance responsibilities`,
          estimatedMinutes: 15,
        },
      ],
      keyTakeaways: [
        'GPAI models trained at scale with significant generality face specific rules',
        'All GPAI providers must document and share information with downstream users',
        '10^25 FLOPs threshold triggers additional systemic risk obligations',
        'Open source models have limited exemptions but not for systemic risk',
      ],
    },
    {
      id: 6,
      title: 'Transparency Obligations (Article 50)',
      description: 'Understanding transparency requirements for AI-generated content, chatbots, and deepfakes.',
      durationMinutes: 60,
      learningObjectives: [
        'Identify systems with transparency obligations',
        'Understand chatbot disclosure requirements',
        'Explain deepfake labeling requirements',
        'Know emotion recognition disclosure rules',
      ],
      content: [
        {
          type: 'lesson',
          title: 'The Transparency Tier',
          content: `**Limited Risk = Transparency Obligations**

The EU AI Act establishes transparency requirements for AI systems that don't meet the high-risk threshold but still warrant user awareness.

**Rationale:**
People have a right to know when they're:
- Interacting with an AI system
- Viewing AI-generated content
- Subject to emotion or biometric analysis

**Key Principle:**
Transparency enables informed choice. Users can decide how much to rely on AI outputs when they know AI is involved.

**Systems Subject to Transparency (Article 50):**

1. **Human-Interaction Systems**
   - Chatbots and virtual assistants
   - AI customer service
   - AI-powered interfaces

2. **Content-Generating Systems**
   - Text generation
   - Image synthesis
   - Audio creation (synthetic voices)
   - Video generation

3. **Deepfake Systems**
   - Manipulated images
   - Voice cloning
   - Face swapping
   - Synthetic media

4. **Emotion/Biometric Systems**
   - Emotion recognition
   - Biometric categorization
   - (When not prohibited)`,
          estimatedMinutes: 12,
        },
        {
          type: 'lesson',
          title: 'Specific Transparency Requirements',
          content: `**1. Chatbots and Virtual Assistants (Article 50(1))**
Deployers must ensure users are informed they're interacting with AI unless obvious from context.

Exceptions:
- Context makes AI involvement obvious
- System assists detection of deepfakes/manipulation

Implementation:
- Clear disclosure at start of interaction
- Persistent indicator during conversation
- Cannot be buried in terms of service

**2. Emotion Recognition (Article 50(3))**
Deployers of emotion recognition or biometric categorization must inform subjects that system is in operation.

Requirements:
- Prior notification
- Clear, accessible information
- Cannot be covert (except security/law enforcement)

**3. Deepfakes and Synthetic Content (Article 50(4))**
Deployers must label AI-generated or manipulated content so recipients know.

Applies to:
- Synthetic images, audio, video
- Manipulated existing content
- Generated text presented as human-written

Exceptions:
- Authorized law enforcement
- Freedom of expression (art, satire)
- But must still be machine-readable

**4. Text Generation for Public Interest (Article 50(4))**
AI-generated text published to inform on public interest matters must be labeled unless human editorial process verified accuracy.`,
          estimatedMinutes: 15,
        },
        {
          type: 'lesson',
          title: 'Technical Standards for Transparency',
          content: `**Machine-Readable Labels**

Article 50(6) requires AI-generated content to be marked in a machine-readable format.

**Purposes:**
- Enable platforms to detect AI content
- Support fact-checkers
- Facilitate regulatory oversight

**Technical Approaches:**
- Watermarking (embedded signals)
- Metadata tags
- Content credentials (C2PA standards)
- Cryptographic signatures

**Harmonized Standards:**
The Commission will establish specific technical standards for:
- Content labeling formats
- Detection tool interoperability
- Watermark requirements

**Platform Obligations:**
Online platforms must:
- Detect labeled AI content
- Display labels to users
- Prevent circumvention

**Compliance Challenges:**
- Watermarks can be removed
- Metadata can be stripped
- Detection isn't perfect
- Balance with creative uses`,
          estimatedMinutes: 12,
        },
        {
          type: 'interactive',
          title: 'Transparency Implementation Scenarios',
          content: 'Interactive exercise evaluating transparency implementations across different AI deployment scenarios.',
          estimatedMinutes: 12,
        },
        {
          type: 'case_study',
          title: 'Transparency Compliance Examples',
          content: `**Example 1: Customer Service Chatbot**
Compliant Implementation:
- Opening message: "Hi! I'm an AI assistant here to help. A human agent is available if you prefer."
- Persistent icon indicating AI
- Easy escalation to human

Non-Compliant:
- No disclosure
- Pretending to be human
- Disclosure only in footer text

**Example 2: AI-Generated Marketing Images**
Compliant Implementation:
- Watermarked images
- Metadata tags present
- "Created with AI" label in corner
- C2PA credentials embedded

Non-Compliant:
- Passing off as photographs
- Stripped metadata
- No machine-readable marking

**Example 3: News Summary Generation**
Compliant Implementation:
- "This summary was generated by AI"
- Human editor reviewed and approved
- Sources clearly attributed

Non-Compliant:
- AI-generated without disclosure
- No human verification
- Presented as journalist-written`,
          estimatedMinutes: 9,
        },
      ],
      keyTakeaways: [
        'Limited-risk systems have transparency-only obligations',
        'Chatbots must disclose AI involvement to users',
        'Deepfakes and synthetic content require labeling',
        'Machine-readable formats enable platform detection',
      ],
    },
    {
      id: 7,
      title: 'Governance and Enforcement',
      description: 'Understanding the EU AI Act governance structure, national authorities, and enforcement mechanisms.',
      durationMinutes: 60,
      learningObjectives: [
        'Describe the EU AI governance structure',
        'Explain the role of the European AI Office',
        'Understand national competent authority responsibilities',
        'Know the three-tier penalty structure',
      ],
      content: [
        {
          type: 'lesson',
          title: 'EU-Level Governance Structure',
          content: `**The European AI Office**
Established within the European Commission, the AI Office is the central EU authority for AI governance.

**Key Responsibilities:**
1. **GPAI Model Oversight**
   - Monitor GPAI model compliance
   - Coordinate with national authorities
   - Request information from providers
   - Conduct evaluations

2. **Implementation Coordination**
   - Support member state implementation
   - Develop guidance documents
   - Facilitate codes of practice
   - Maintain EU AI database

3. **Expert Support**
   - Scientific Panel of independent experts
   - Advisory Forum of stakeholders
   - Support Commission decisions

**The AI Board**
High-level advisory body composed of member state representatives.

Functions:
- Coordinate national approaches
- Advise Commission on implementation
- Exchange best practices
- Contribute to uniform application

**Scientific Panel**
Independent experts advising on:
- GPAI model assessment
- Systemic risk evaluation
- Technical standards development`,
          estimatedMinutes: 15,
        },
        {
          type: 'lesson',
          title: 'National Competent Authorities',
          content: `**Member State Obligations:**
Each EU country must designate:
1. At least one notifying authority
2. At least one market surveillance authority
3. May designate single authority for both

**Notifying Authorities:**
- Assess and designate conformity assessment bodies
- Monitor notified bodies' performance
- Report to Commission on notified bodies

**Market Surveillance Authorities:**
- Monitor AI systems on the market
- Investigate complaints
- Order corrective actions
- Impose penalties
- Coordinate with other member states

**Powers Include:**
- Request access to high-risk AI systems
- Access training/testing data
- Order modifications to systems
- Withdraw non-compliant systems from market
- Impose fines

**Coordination Mechanisms:**
- Information sharing between authorities
- Joint investigations
- Mutual assistance
- Union-wide enforcement actions`,
          estimatedMinutes: 15,
        },
        {
          type: 'lesson',
          title: 'Penalty Structure (Article 99)',
          content: `**Three-Tier Penalty System:**

**Tier 1: Prohibited Practices (Highest)**
- €35 million OR 7% global annual turnover
- For violations of Article 5 prohibitions
- Whichever amount is higher

**Tier 2: High-Risk Non-Compliance**
- €15 million OR 3% global annual turnover
- For violations of:
  - High-risk requirements (Articles 9-15)
  - Operator obligations
  - Notified body requirements

**Tier 3: Other Violations**
- €7.5 million OR 1.5% global annual turnover
- For:
  - Providing incorrect information
  - Non-cooperation with authorities
  - Transparency violations

**SME Considerations:**
- Lower caps for SMEs and startups
- Proportionate to size and resources
- Member states may adjust

**Aggravating/Mitigating Factors:**
- Nature, gravity, duration of infringement
- Previous violations
- Remedial actions taken
- Cooperation with authorities
- Benefits obtained from violation
- Number of affected persons`,
          estimatedMinutes: 12,
        },
        {
          type: 'lesson',
          title: 'Regulatory Sandboxes and Support',
          content: `**AI Regulatory Sandboxes (Articles 57-58)**

Member states must establish regulatory sandboxes by August 2026.

**Purpose:**
- Controlled environment for AI testing
- Regulatory supervision during development
- Help innovators understand compliance
- Support AI innovation while protecting rights

**Eligibility:**
- Innovative AI systems under development
- Clear testing plan and objectives
- Commitment to fundamental rights
- Exit plan and market pathway

**Benefits:**
- Direct regulatory guidance
- Reduced uncertainty
- Compliance support
- Limited liability during sandbox period

**Priority Access:**
- SMEs and startups
- Systems with potential public benefit

**Real-World Testing (Article 59)**
Specific provisions for testing high-risk AI in real conditions outside sandboxes:
- Prior authorization required
- Limited duration and scope
- Informed consent from participants
- Safeguards and monitoring
- Incident reporting obligations`,
          estimatedMinutes: 12,
        },
        {
          type: 'interactive',
          title: 'Enforcement Scenario Analysis',
          content: 'Interactive analysis of enforcement scenarios and appropriate regulatory responses.',
          estimatedMinutes: 6,
        },
      ],
      keyTakeaways: [
        'European AI Office oversees GPAI and coordinates implementation',
        'Each member state designates market surveillance authorities',
        'Three-tier penalties up to €35M or 7% turnover',
        'Regulatory sandboxes support compliant innovation',
      ],
    },
    {
      id: 8,
      title: 'Compliance Implementation Strategy',
      description: 'Practical guidance for implementing EU AI Act compliance in your organization.',
      durationMinutes: 60,
      learningObjectives: [
        'Develop an AI inventory and classification methodology',
        'Create a compliance roadmap aligned with deadlines',
        'Establish governance structures for AI oversight',
        'Implement ongoing compliance monitoring',
      ],
      content: [
        {
          type: 'lesson',
          title: 'Step 1: AI System Inventory',
          content: `**Building Your AI Inventory**

The foundation of compliance is knowing what AI you have.

**What to Document:**

1. **System Identification**
   - System name and version
   - Vendor/developer
   - Date of deployment
   - Business owner

2. **Technical Details**
   - Model architecture type
   - Training data sources
   - Input/output specifications
   - Integration points

3. **Use Case Information**
   - Intended purpose
   - Actual uses in practice
   - User groups affected
   - Decision types supported

4. **Risk Information**
   - Current risk classification
   - Known limitations
   - Incident history
   - Mitigation measures

**Discovery Methods:**
- IT asset management review
- Procurement records analysis
- Vendor surveys
- Department interviews
- API/integration analysis
- Cloud service inventory

**Classification Process:**
For each system, determine:
- Is it prohibited? (Article 5)
- Is it high-risk? (Annex I or III)
- Does it have transparency obligations? (Article 50)
- Is it minimal risk? (No specific obligations)`,
          estimatedMinutes: 15,
        },
        {
          type: 'lesson',
          title: 'Step 2: Gap Analysis and Roadmap',
          content: `**Conducting Gap Analysis**

For each high-risk system, assess current state against requirements:

**Risk Management (Article 9)**
□ Risk management system exists
□ Continuous process documented
□ Testing against metrics defined
□ Residual risks identified and communicated

**Data Governance (Article 10)**
□ Training data documented
□ Bias analysis conducted
□ Data quality processes established
□ Data governance policy in place

**Technical Documentation (Article 11)**
□ Complete documentation exists
□ Covers all required elements
□ Updated throughout lifecycle
□ Retention policy compliant

**Record-Keeping (Article 12)**
□ Logging capability built in
□ Appropriate events captured
□ Logs retained for required period
□ Access controls in place

**Transparency (Article 13)**
□ Instructions for use complete
□ Deployer information adequate
□ System limitations documented
□ Update process defined

**Human Oversight (Article 14)**
□ Oversight mechanisms designed
□ Override capabilities exist
□ Oversight personnel trained
□ Intervention protocols defined

**Creating the Roadmap:**
1. Prioritize by deadline (prohibited→GPAI→high-risk)
2. Estimate resource requirements
3. Identify dependencies
4. Assign accountability
5. Set milestones and checkpoints`,
          estimatedMinutes: 15,
        },
        {
          type: 'lesson',
          title: 'Step 3: Governance Structure',
          content: `**Establishing AI Governance**

**Recommended Structure:**

**1. AI Governance Committee**
- Senior leadership representation
- Cross-functional membership
- Regular meeting cadence
- Decision authority for AI policies

**2. AI Ethics/Compliance Function**
- Day-to-day compliance management
- Policy development and maintenance
- Training and awareness
- Incident response coordination

**3. AI Risk Management**
- Risk assessment methodology
- Ongoing risk monitoring
- Reporting to governance committee
- Integration with enterprise risk

**4. Technical AI Team**
- Implementation support
- Technical documentation
- Testing and validation
- System modifications

**Key Policies Needed:**
- AI Use Policy
- AI Development Standards
- AI Risk Assessment Procedure
- AI Incident Response Plan
- AI Vendor Management Policy
- AI Training Requirements

**Documentation Requirements:**
- Meeting minutes and decisions
- Policy versions and approvals
- Risk assessments and updates
- Incident logs and resolutions
- Training records
- Audit findings and remediation`,
          estimatedMinutes: 15,
        },
        {
          type: 'lesson',
          title: 'Step 4: Ongoing Compliance',
          content: `**Continuous Compliance Activities**

**Pre-Deployment:**
- Risk assessment review
- Conformity assessment completion
- Registration in EU database
- Deployer information package

**During Operation:**
- Performance monitoring
- Incident tracking
- User feedback collection
- Bias monitoring

**Periodic Reviews:**
- Annual risk assessment updates
- Documentation reviews
- Policy compliance audits
- Training refreshers

**Change Management:**
- System modification procedures
- Re-assessment triggers
- Documentation updates
- Stakeholder notifications

**Incident Response:**
1. Detection and initial assessment
2. Containment if needed
3. Investigation and root cause
4. Remediation actions
5. Regulatory notification if required
6. Lessons learned integration

**Audit Readiness:**
- Documentation organized and accessible
- Evidence readily available
- Staff trained on audit procedures
- Management review conducted`,
          estimatedMinutes: 12,
        },
        {
          type: 'interactive',
          title: 'Compliance Readiness Assessment',
          content: 'Self-assessment tool to evaluate your organization\'s current compliance readiness and identify priority actions.',
          estimatedMinutes: 3,
        },
      ],
      keyTakeaways: [
        'Start with comprehensive AI inventory and classification',
        'Conduct gap analysis against all six high-risk requirements',
        'Establish cross-functional AI governance structure',
        'Build ongoing compliance into operational processes',
      ],
    },
  ],
};

// ============================================================================
// NIST AI RMF COURSE
// ============================================================================
export const nistAiRmfCourse: CourseContent = {
  id: 2,
  title: 'NIST AI Risk Management Framework',
  shortTitle: 'NIST AI RMF',
  description: 'Learn to implement the NIST AI Risk Management Framework across your organization. This course covers the four core functions (Govern, Map, Measure, Manage), trustworthy AI characteristics, and practical implementation strategies.',
  framework: 'NIST AI RMF',
  level: 'advanced',
  totalDurationHours: 12,
  certificationType: 'NIST AI RMF Practitioner',
  prerequisites: ['Basic understanding of AI/ML concepts'],
  finalExamInfo: {
    questionCount: 60,
    passingScore: 80,
    timeLimit: 120,
  },
  modules: [
    {
      id: 1,
      title: 'Introduction to the NIST AI RMF',
      description: 'Overview of the NIST AI Risk Management Framework, its purpose, and relationship to other NIST frameworks.',
      durationMinutes: 90,
      learningObjectives: [
        'Understand the purpose and scope of the NIST AI RMF',
        'Identify the seven characteristics of trustworthy AI',
        'Explain the relationship to NIST CSF and RMF',
        'Describe the intended audience and use cases',
      ],
      content: [
        {
          type: 'lesson',
          title: 'The NIST AI RMF Foundation',
          content: `**What is the NIST AI RMF?**

The NIST AI Risk Management Framework (AI RMF 1.0), released January 2023, provides a voluntary, flexible framework for managing AI risks throughout the AI system lifecycle.

**Key Characteristics:**
- Voluntary, not regulatory
- Technology-neutral and use-case agnostic
- Designed to complement existing risk management
- Applicable across all sectors and organization sizes
- Living document to be updated as AI evolves

**Why a Separate AI Framework?**
AI systems present unique risk characteristics:
- Emergent and unpredictable behaviors
- Data dependency and bias potential
- Opacity and explainability challenges
- Rapid capability advancement
- Societal-scale impacts

**Framework Structure:**
1. **Part 1:** Foundational information and concepts
2. **Part 2:** Core framework functions and categories

**Companion Resources:**
- NIST AI RMF Playbook (practical implementation)
- Crosswalks to other standards
- Use case profiles
- Measurement approaches`,
          estimatedMinutes: 20,
        },
        {
          type: 'lesson',
          title: 'Seven Characteristics of Trustworthy AI',
          content: `The NIST AI RMF is built around seven characteristics that define trustworthy AI:

**1. Valid and Reliable**
- AI performs as intended under varying conditions
- Results are consistent and reproducible
- Performance is validated against requirements

**2. Safe**
- AI doesn't pose unreasonable risks to people
- Safety is prioritized in design and operation
- Harmful outcomes are prevented or mitigated

**3. Secure and Resilient**
- Protected against adversarial attacks
- Maintains functionality under stress
- Recovers from disruptions

**4. Accountable and Transparent**
- Clear ownership and responsibility
- Decisions and processes are explainable
- Stakeholders can understand AI operations

**5. Explainable and Interpretable**
- Outputs can be understood by users
- Decision factors are identifiable
- Appropriate level of explanation for context

**6. Privacy-Enhanced**
- Personal data is protected
- Privacy is built into design
- Data rights are respected

**7. Fair with Harmful Bias Managed**
- Bias is identified and mitigated
- Equitable outcomes across groups
- Systemic bias sources are addressed

**Important Note:**
These characteristics often involve trade-offs. Organizations must balance them based on context and priorities.`,
          estimatedMinutes: 25,
        },
        {
          type: 'lesson',
          title: 'Relationship to Other Frameworks',
          content: `**NIST Framework Ecosystem:**

**NIST Cybersecurity Framework (CSF)**
- General cybersecurity risk management
- AI RMF extends CSF for AI-specific concerns
- Security and resilience characteristics align

**NIST Risk Management Framework (RMF)**
- Federal information systems focus
- AI RMF compatible with RMF processes
- Can be integrated into existing RMF implementations

**NIST Privacy Framework**
- Privacy risk management
- Privacy-enhanced characteristic aligns
- Complementary approaches

**International Standards:**
- ISO/IEC 38507 (AI Governance)
- ISO/IEC 23894 (AI Risk Management)
- OECD AI Principles
- EU AI Act requirements

**Using Frameworks Together:**
Organizations typically:
1. Use NIST AI RMF for AI-specific risks
2. Integrate with CSF for security
3. Align with Privacy Framework for data
4. Map to regulatory requirements (EU AI Act, etc.)`,
          estimatedMinutes: 20,
        },
        {
          type: 'video',
          title: 'AI RMF Overview and Implementation Approaches',
          content: 'Video overview of the framework structure and common implementation patterns.',
          estimatedMinutes: 15,
        },
        {
          type: 'case_study',
          title: 'Framework Selection and Integration',
          content: `**Scenario:** A healthcare organization deploying AI for patient diagnosis needs to establish risk management.

**Challenge:** Multiple applicable frameworks
- NIST AI RMF for AI risks
- NIST CSF for cybersecurity
- HIPAA for health data privacy
- FDA guidance for medical AI

**Recommended Approach:**
1. Use NIST AI RMF as primary AI governance structure
2. Integrate security requirements from CSF
3. Ensure HIPAA compliance through privacy controls
4. Map FDA requirements to AI RMF categories
5. Create unified risk register spanning all frameworks

**Key Insight:** The AI RMF is designed to complement, not replace, other frameworks.`,
          estimatedMinutes: 10,
        },
      ],
      keyTakeaways: [
        'NIST AI RMF is voluntary, flexible, and technology-neutral',
        'Seven characteristics define trustworthy AI systems',
        'Framework complements existing NIST and international standards',
        'Organizations should integrate AI RMF with existing risk management',
      ],
    },
    {
      id: 2,
      title: 'GOVERN Function',
      description: 'Understanding the GOVERN function for establishing AI governance structures and culture.',
      durationMinutes: 90,
      learningObjectives: [
        'Explain the purpose and outcomes of the GOVERN function',
        'Describe governance structures for AI risk management',
        'Understand organizational culture requirements',
        'Identify GOVERN categories and subcategories',
      ],
      content: [
        {
          type: 'lesson',
          title: 'GOVERN Function Overview',
          content: `**Purpose:**
The GOVERN function cultivates and implements a culture of risk management across the organization, ensuring AI risks are managed according to organizational values, policies, and regulatory requirements.

**Why GOVERN Comes First:**
- Sets the foundation for all other functions
- Establishes accountability and authority
- Creates enabling conditions for risk management
- Ensures alignment with organizational objectives

**GOVERN Outcomes:**
1. Policies and procedures established
2. Roles and responsibilities defined
3. Culture supports risk awareness
4. Resources allocated appropriately
5. Third-party risks addressed
6. Regulatory compliance maintained

**Key Principle:**
Effective governance enables—rather than impedes—responsible AI development and deployment.`,
          estimatedMinutes: 15,
        },
        {
          type: 'lesson',
          title: 'GOVERN Categories Deep Dive',
          content: `**GOVERN-1: Legal and Regulatory Requirements**
- Identify applicable laws and regulations
- Monitor regulatory developments
- Implement compliance mechanisms
- Document compliance status

**GOVERN-2: Organizational AI Policies**
- Establish AI risk tolerance
- Define acceptable AI use cases
- Create AI development standards
- Document decision-making criteria

**GOVERN-3: Roles and Responsibilities**
- Assign AI risk ownership
- Define accountability structures
- Establish escalation paths
- Clarify decision authority

**GOVERN-4: AI Culture**
- Promote AI literacy across organization
- Encourage responsible AI practices
- Foster risk awareness
- Support open communication about AI risks

**GOVERN-5: Oversight and Due Diligence**
- Third-party AI assessment
- Supply chain risk management
- Vendor due diligence processes
- Ongoing monitoring mechanisms

**GOVERN-6: AI Risk Management Integration**
- Connect to enterprise risk management
- Align with strategic objectives
- Integrate with existing processes
- Maintain risk register`,
          estimatedMinutes: 30,
        },
        {
          type: 'lesson',
          title: 'Building AI Governance Structures',
          content: `**Governance Model Components:**

**Executive Oversight**
- Board-level AI governance committee
- C-suite accountability for AI strategy
- Regular reporting on AI risks
- Resource allocation authority

**AI Ethics Board/Council**
- Cross-functional representation
- Review high-stakes AI decisions
- Ethical guidance and standards
- Stakeholder representation

**Operational AI Risk Function**
- Day-to-day risk management
- Policy implementation
- Training and awareness
- Incident response

**Technical AI Teams**
- Risk-aware development practices
- Technical risk assessment
- Implementation of controls
- Testing and validation

**Key Governance Documents:**
1. AI Strategy and Principles
2. AI Risk Management Policy
3. AI Acceptable Use Policy
4. AI Development Standards
5. AI Vendor Assessment Criteria
6. AI Incident Response Plan`,
          estimatedMinutes: 25,
        },
        {
          type: 'interactive',
          title: 'Governance Structure Design Exercise',
          content: 'Interactive exercise designing governance structures for different organizational types.',
          estimatedMinutes: 20,
        },
      ],
      keyTakeaways: [
        'GOVERN establishes the foundation for all AI risk management',
        'Six categories cover legal, policies, roles, culture, oversight, and integration',
        'Governance structures should span executive to operational levels',
        'Culture of risk awareness is as important as formal structures',
      ],
    },
    {
      id: 3,
      title: 'MAP Function',
      description: 'Learning to map context, scope, and risks of AI systems.',
      durationMinutes: 90,
      learningObjectives: [
        'Explain the purpose and outcomes of the MAP function',
        'Conduct AI system context analysis',
        'Identify and categorize AI risks',
        'Document risk mapping results',
      ],
      content: [
        {
          type: 'lesson',
          title: 'MAP Function Overview',
          content: `**Purpose:**
The MAP function establishes the context for AI risk management by identifying the circumstances under which AI systems operate and the associated risks.

**MAP Activities:**
- Understand AI system context
- Identify stakeholders and impacts
- Categorize and prioritize risks
- Document mapping decisions

**Key Questions MAP Answers:**
- What is this AI system used for?
- Who is affected by its outputs?
- What can go wrong?
- What are the consequences of failure?
- How certain are we about risks?

**MAP Outcomes:**
1. Clear understanding of AI context
2. Comprehensive risk identification
3. Stakeholder impact analysis
4. Prioritized risk inventory
5. Documentation for other functions`,
          estimatedMinutes: 15,
        },
        {
          type: 'lesson',
          title: 'MAP Categories',
          content: `**MAP-1: AI System Context**
Understand the circumstances in which AI operates:
- Intended purpose and use cases
- Deployment environment
- User characteristics
- Data sources and flows
- System interactions

**MAP-2: Stakeholder Analysis**
Identify all affected parties:
- Direct users
- Decision subjects
- Operators and deployers
- Third parties
- Society at large

**MAP-3: Impact Assessment**
Evaluate potential consequences:
- Individual impacts (privacy, safety, rights)
- Group impacts (discrimination, bias)
- Organizational impacts (reputation, liability)
- Societal impacts (equity, democracy)

**MAP-4: AI Risk Identification**
Systematically identify risks:
- Technical risks (accuracy, robustness)
- Sociotechnical risks (misuse, over-reliance)
- Operational risks (availability, security)
- Ethical risks (fairness, transparency)

**MAP-5: Risk Categorization**
Organize identified risks:
- By trustworthiness characteristic
- By lifecycle stage
- By severity and likelihood
- By responsible party`,
          estimatedMinutes: 30,
        },
        {
          type: 'lesson',
          title: 'Conducting Risk Mapping',
          content: `**Risk Mapping Process:**

**Step 1: Define Scope**
- Which AI systems are in scope?
- What lifecycle stage?
- What use cases?

**Step 2: Gather Information**
- Technical documentation
- Use case descriptions
- Stakeholder input
- Prior incident data

**Step 3: Identify Risks**
Risk identification techniques:
- Brainstorming sessions
- Checklists and taxonomies
- Scenario analysis
- Expert interviews
- Historical analysis

**Step 4: Analyze Risks**
For each risk, document:
- Description and trigger conditions
- Affected trustworthiness characteristics
- Potential impacts
- Likelihood assessment
- Uncertainty level

**Step 5: Prioritize**
Risk prioritization considers:
- Severity of potential impact
- Likelihood of occurrence
- Uncertainty about risk
- Stakeholder concerns
- Organizational risk tolerance

**Step 6: Document**
Create risk mapping documentation:
- Risk register entries
- Impact analysis reports
- Stakeholder mapping
- Prioritization rationale`,
          estimatedMinutes: 25,
        },
        {
          type: 'case_study',
          title: 'Risk Mapping for an AI Hiring Tool',
          content: `**System:** AI-powered resume screening and candidate ranking

**MAP-1 Context:**
- Purpose: Reduce time-to-hire by screening resumes
- Environment: HR department, corporate hiring
- Users: HR staff, hiring managers
- Data: Resumes, job descriptions, historical hiring data

**MAP-2 Stakeholders:**
- Direct: HR team, hiring managers
- Decision subjects: Job applicants
- Third parties: Educational institutions (credentials)
- Society: Labor market, protected groups

**MAP-3 Impacts:**
- Individual: Employment opportunities, career prospects
- Group: Potential discrimination against protected classes
- Organizational: Legal liability, reputation, workforce quality
- Societal: Labor market equity, opportunity distribution

**MAP-4 Identified Risks:**
1. Bias against underrepresented groups (training data)
2. Proxy discrimination (zip code → race)
3. Unfair treatment of non-traditional candidates
4. Over-reliance on AI recommendations
5. Data privacy concerns
6. Transparency to candidates

**Prioritization:** Risks 1-3 are high priority due to legal and ethical implications.`,
          estimatedMinutes: 20,
        },
      ],
      keyTakeaways: [
        'MAP establishes context and identifies risks before management',
        'Five categories cover context, stakeholders, impacts, identification, categorization',
        'Systematic risk identification uses multiple techniques',
        'Documentation enables informed decision-making in other functions',
      ],
    },
    {
      id: 4,
      title: 'MEASURE Function',
      description: 'Developing metrics and assessments for AI risks and trustworthiness.',
      durationMinutes: 90,
      learningObjectives: [
        'Explain the purpose and outcomes of the MEASURE function',
        'Develop appropriate AI metrics and measures',
        'Conduct risk assessments and testing',
        'Document and communicate measurement results',
      ],
      content: [
        {
          type: 'lesson',
          title: 'MEASURE Function Overview',
          content: `**Purpose:**
The MEASURE function quantifies, assesses, or otherwise estimates AI risks through analytical processes including metrics, testing, and evaluation.

**Why MEASURE Matters:**
- Can't manage what you can't measure
- Enables evidence-based decisions
- Supports accountability claims
- Tracks progress over time

**MEASURE Activities:**
- Develop AI metrics
- Conduct assessments and testing
- Evaluate trustworthiness characteristics
- Track and report results

**MEASURE Outcomes:**
1. Quantified risk estimates
2. Validated trustworthiness claims
3. Documented assessment results
4. Baselines for improvement
5. Evidence for governance decisions`,
          estimatedMinutes: 15,
        },
        {
          type: 'lesson',
          title: 'MEASURE Categories',
          content: `**MEASURE-1: Risk Assessment Approaches**
Methods for evaluating AI risks:
- Quantitative risk analysis
- Qualitative risk assessment
- Red-teaming and adversarial testing
- Audit and review processes

**MEASURE-2: AI Evaluation**
Assessing trustworthiness characteristics:
- Validity and reliability testing
- Fairness and bias analysis
- Robustness evaluation
- Explainability assessment

**MEASURE-3: AI Metrics**
Developing and tracking metrics:
- Performance metrics
- Risk indicators
- Fairness metrics
- Operational metrics

**MEASURE-4: Testing and Monitoring**
Ongoing assessment activities:
- Pre-deployment testing
- Production monitoring
- Drift detection
- Incident analysis

**Key Principle:**
Measurement should be proportionate to risk level and appropriate for the AI system context.`,
          estimatedMinutes: 25,
        },
        {
          type: 'lesson',
          title: 'AI Metrics and Measures',
          content: `**Performance Metrics:**
- Accuracy, precision, recall
- F1 score, AUC-ROC
- False positive/negative rates
- Throughput and latency

**Fairness Metrics:**
- Demographic parity
- Equalized odds
- Calibration across groups
- Individual fairness measures

**Robustness Metrics:**
- Performance under distribution shift
- Adversarial robustness scores
- Sensitivity analysis results
- Uncertainty quantification

**Explainability Metrics:**
- Feature importance consistency
- Explanation fidelity
- User comprehension scores
- Actionability of explanations

**Operational Metrics:**
- Model drift indicators
- Data quality scores
- Incident rates
- User feedback metrics

**Selecting Appropriate Metrics:**
Consider:
- Stakeholder needs
- Context of use
- Available data
- Technical feasibility
- Interpretability`,
          estimatedMinutes: 25,
        },
        {
          type: 'interactive',
          title: 'Metric Selection Exercise',
          content: 'Interactive exercise selecting appropriate metrics for different AI use cases.',
          estimatedMinutes: 15,
        },
        {
          type: 'case_study',
          title: 'Measuring Fairness in Lending AI',
          content: `**System:** AI credit scoring for consumer loans

**MEASURE-1: Assessment Approach**
- Quantitative fairness analysis
- Regulatory compliance audit
- Statistical testing on outcomes

**MEASURE-2: Evaluation Focus**
Primary concern: Fair lending across protected groups

**MEASURE-3: Selected Metrics**
1. **Approval rate ratio** (by demographic group)
   Target: Within 80% of highest group

2. **Error rate balance** (FPR, FNR by group)
   Target: Equalized false negative rates

3. **Calibration** (predicted vs actual default)
   Target: Similar calibration across groups

**MEASURE-4: Testing Protocol**
- Historical data analysis (annual)
- Ongoing production monitoring
- Quarterly fairness reports
- External audit (biennial)

**Results Example:**
- Approval rate ratio: 0.73 (below 0.80 target)
- Action: Investigate and mitigate disparity
- Root cause: Proxy variable correlated with protected class
- Remediation: Remove proxy, retrain model`,
          estimatedMinutes: 10,
        },
      ],
      keyTakeaways: [
        'MEASURE quantifies risks through metrics, testing, and assessment',
        'Four categories cover approaches, evaluation, metrics, and testing',
        'Metrics should be appropriate for context and stakeholder needs',
        'Measurement enables evidence-based risk management decisions',
      ],
    },
    {
      id: 5,
      title: 'MANAGE Function',
      description: 'Implementing risk treatment strategies and response mechanisms.',
      durationMinutes: 90,
      learningObjectives: [
        'Explain the purpose and outcomes of the MANAGE function',
        'Develop risk treatment strategies',
        'Implement risk response mechanisms',
        'Establish monitoring and feedback processes',
      ],
      content: [
        {
          type: 'lesson',
          title: 'MANAGE Function Overview',
          content: `**Purpose:**
The MANAGE function allocates risk management resources and implements risk treatment strategies based on organization's risk tolerance and the outputs from MAP and MEASURE functions.

**MANAGE Activities:**
- Prioritize risks for treatment
- Select risk response strategies
- Implement risk controls
- Monitor effectiveness
- Adapt to changing conditions

**Risk Treatment Options:**
1. **Avoid** - Don't use the AI system
2. **Mitigate** - Reduce risk to acceptable level
3. **Transfer** - Shift risk to another party
4. **Accept** - Proceed with residual risk

**MANAGE Outcomes:**
1. Treated risks within tolerance
2. Implemented controls
3. Residual risks documented
4. Continuous improvement
5. Stakeholder communication`,
          estimatedMinutes: 15,
        },
        {
          type: 'lesson',
          title: 'MANAGE Categories',
          content: `**MANAGE-1: Risk Prioritization**
Determine which risks to address first:
- Severity ranking
- Resource allocation
- Urgency assessment
- Stakeholder priorities

**MANAGE-2: Risk Response**
Select and implement treatments:
- Control implementation
- Process changes
- Technical modifications
- Governance adjustments

**MANAGE-3: Risk Monitoring**
Track effectiveness of treatments:
- Control effectiveness metrics
- Residual risk tracking
- Emerging risk detection
- Performance trends

**MANAGE-4: Continuous Improvement**
Adapt and enhance risk management:
- Lessons learned integration
- Process refinement
- Control updates
- Framework evolution

**Key Principle:**
Risk management is ongoing—MANAGE creates feedback loops that improve all functions over time.`,
          estimatedMinutes: 25,
        },
        {
          type: 'lesson',
          title: 'Risk Treatment Strategies',
          content: `**Mitigation Strategies by Risk Type:**

**Bias and Fairness Risks:**
- Representative training data
- Bias testing and monitoring
- Algorithmic debiasing techniques
- Human review for high-stakes decisions

**Accuracy and Reliability Risks:**
- Enhanced testing and validation
- Uncertainty quantification
- Fallback mechanisms
- Performance monitoring

**Security and Adversarial Risks:**
- Adversarial robustness training
- Input validation
- Model protection
- Intrusion detection

**Transparency and Explainability Risks:**
- Explainability techniques
- Documentation improvements
- User-appropriate explanations
- Appeals processes

**Privacy Risks:**
- Privacy-preserving techniques
- Data minimization
- Access controls
- Consent mechanisms

**Implementation Considerations:**
- Technical feasibility
- Resource requirements
- Timeline for implementation
- Trade-offs with other characteristics`,
          estimatedMinutes: 25,
        },
        {
          type: 'interactive',
          title: 'Risk Treatment Planning Exercise',
          content: 'Interactive exercise developing risk treatment plans for identified AI risks.',
          estimatedMinutes: 15,
        },
        {
          type: 'case_study',
          title: 'Managing Risks in Autonomous Vehicle AI',
          content: `**System:** Perception AI for autonomous vehicles

**Identified Risks (from MAP/MEASURE):**
1. Object misclassification leading to accidents
2. Adversarial attacks on perception system
3. Performance degradation in adverse weather
4. Edge cases not in training data

**Risk Treatment Plan:**

**Risk 1: Misclassification**
- Treatment: Mitigate
- Controls: Redundant sensors, human takeover capability
- Monitoring: Continuous accuracy tracking
- Residual risk: Accepted with safeguards

**Risk 2: Adversarial Attacks**
- Treatment: Mitigate
- Controls: Adversarial training, input validation
- Monitoring: Anomaly detection
- Residual risk: Transfer via insurance, accept remainder

**Risk 3: Weather Degradation**
- Treatment: Avoid/Mitigate
- Controls: Automatic disengagement in conditions
- Monitoring: Performance by weather type
- Residual risk: Avoided by operational limits

**Risk 4: Edge Cases**
- Treatment: Mitigate
- Controls: Continuous learning, edge case collection
- Monitoring: Near-miss analysis
- Residual risk: Accepted with improvement process`,
          estimatedMinutes: 10,
        },
      ],
      keyTakeaways: [
        'MANAGE implements risk treatments based on MAP and MEASURE outputs',
        'Four categories cover prioritization, response, monitoring, improvement',
        'Risk treatments include avoid, mitigate, transfer, and accept',
        'Continuous monitoring and improvement are essential',
      ],
    },
    {
      id: 6,
      title: 'AI Lifecycle Risk Management',
      description: 'Applying the AI RMF across the AI system lifecycle.',
      durationMinutes: 90,
      learningObjectives: [
        'Identify AI lifecycle stages and associated risks',
        'Apply AI RMF functions to each lifecycle stage',
        'Manage risks during development and deployment',
        'Address post-deployment monitoring and updates',
      ],
      content: [
        {
          type: 'lesson',
          title: 'AI Lifecycle Stages',
          content: `**The AI System Lifecycle:**

**1. Plan and Design**
- Problem definition
- Solution approach
- Data strategy
- Risk planning

**2. Data Collection and Processing**
- Data acquisition
- Data preparation
- Quality assurance
- Privacy considerations

**3. Model Development**
- Algorithm selection
- Training and tuning
- Validation testing
- Documentation

**4. Evaluation and Verification**
- Performance testing
- Fairness assessment
- Security evaluation
- Stakeholder review

**5. Deployment**
- Integration
- User training
- Operational handover
- Initial monitoring

**6. Operation and Monitoring**
- Performance tracking
- Incident response
- User feedback
- Drift detection

**7. Retirement**
- Sunset planning
- Data retention
- Knowledge capture
- Transition management`,
          estimatedMinutes: 20,
        },
        {
          type: 'lesson',
          title: 'Lifecycle Risk Considerations',
          content: `**Plan and Design Risks:**
- Inappropriate problem framing
- Unrealistic expectations
- Insufficient stakeholder input
- Inadequate risk planning

**Data Risks:**
- Biased or unrepresentative data
- Data quality issues
- Privacy violations
- Insufficient data volume

**Development Risks:**
- Algorithm limitations
- Technical debt
- Insufficient testing
- Documentation gaps

**Deployment Risks:**
- Integration failures
- User misunderstanding
- Unintended use cases
- Scalability issues

**Operational Risks:**
- Model drift
- Adversarial attacks
- Operational failures
- Changing requirements

**Retirement Risks:**
- Data retention issues
- Knowledge loss
- Dependent system impacts
- Transition failures

**Cross-Cutting Risks:**
- Regulatory changes
- Stakeholder expectation shifts
- Technology evolution
- Organizational changes`,
          estimatedMinutes: 25,
        },
        {
          type: 'lesson',
          title: 'Applying AI RMF to Lifecycle',
          content: `**GOVERN Across Lifecycle:**
- Establish policies for each stage
- Define stage-gate criteria
- Assign responsibilities
- Ensure regulatory compliance

**MAP Across Lifecycle:**
- Update context as system evolves
- Identify stage-specific risks
- Reassess impacts at transitions
- Maintain risk inventory

**MEASURE Across Lifecycle:**
- Stage-appropriate metrics
- Transition validation
- Operational monitoring
- Retirement assessment

**MANAGE Across Lifecycle:**
- Stage-specific controls
- Transition risk management
- Operational risk treatment
- Retirement risk mitigation

**Key Principle:**
Risk management activities should be proportionate to the risks and resources at each stage.`,
          estimatedMinutes: 25,
        },
        {
          type: 'interactive',
          title: 'Lifecycle Risk Mapping Exercise',
          content: 'Interactive exercise mapping risks to lifecycle stages and identifying appropriate RMF activities.',
          estimatedMinutes: 20,
        },
      ],
      keyTakeaways: [
        'AI lifecycle spans planning through retirement',
        'Each stage presents unique risk considerations',
        'All four AI RMF functions apply throughout lifecycle',
        'Risk management should be proportionate to stage and context',
      ],
    },
    {
      id: 7,
      title: 'Stakeholder Engagement',
      description: 'Identifying and engaging stakeholders in AI risk management.',
      durationMinutes: 90,
      learningObjectives: [
        'Identify diverse AI stakeholders and their interests',
        'Develop stakeholder engagement strategies',
        'Incorporate stakeholder input into risk management',
        'Communicate AI risks to different audiences',
      ],
      content: [
        {
          type: 'lesson',
          title: 'AI Stakeholder Ecosystem',
          content: `**Who Are AI Stakeholders?**

**Internal Stakeholders:**
- Executive leadership
- AI development teams
- Business units using AI
- Legal and compliance
- Risk management
- IT/Security teams

**External Stakeholders:**
- Customers/users
- Decision subjects
- Regulators
- Civil society
- Academic community
- Industry peers

**Impacted Communities:**
- Individuals affected by AI decisions
- Communities with unequal AI access
- Workers displaced by AI
- Vulnerable populations

**Value Chain Stakeholders:**
- AI vendors and suppliers
- Data providers
- Integration partners
- Downstream deployers

**Why Engagement Matters:**
- Identifies overlooked risks
- Builds trust and legitimacy
- Improves AI outcomes
- Supports accountability`,
          estimatedMinutes: 20,
        },
        {
          type: 'lesson',
          title: 'Engagement Strategies',
          content: `**Engagement Methods:**

**1. Consultation**
- Surveys and questionnaires
- Focus groups
- Public comment periods
- Advisory panels

**2. Collaboration**
- Co-design workshops
- Participatory development
- Community partnerships
- Multi-stakeholder initiatives

**3. Communication**
- Transparency reports
- AI system documentation
- Educational materials
- Accessible explanations

**4. Feedback Mechanisms**
- User feedback channels
- Complaint processes
- Appeals mechanisms
- Incident reporting

**Engagement Principles:**
- Be inclusive and representative
- Engage early and continuously
- Be transparent about limitations
- Act on input received
- Communicate outcomes`,
          estimatedMinutes: 25,
        },
        {
          type: 'lesson',
          title: 'Risk Communication',
          content: `**Communicating AI Risks:**

**To Leadership:**
- Business impact focus
- Risk vs. opportunity framing
- Resource implications
- Regulatory considerations

**To Technical Teams:**
- Technical detail level
- Implementation focus
- Trade-off discussions
- Best practices

**To Users:**
- Plain language
- Practical guidance
- What to expect
- How to get help

**To Affected Communities:**
- Accessible formats
- Impact focus
- Rights and remedies
- Engagement opportunities

**To Regulators:**
- Compliance focus
- Documentation
- Control evidence
- Incident reports

**Communication Best Practices:**
- Know your audience
- Be honest about uncertainty
- Explain what you're doing about risks
- Provide actionable information
- Enable feedback`,
          estimatedMinutes: 25,
        },
        {
          type: 'case_study',
          title: 'Stakeholder Engagement Case Study',
          content: `**Scenario:** City deploying AI for public benefit determination

**Stakeholder Mapping:**
- City government (deployer)
- Social services staff (users)
- Benefit applicants (decision subjects)
- Community organizations (advocates)
- Civil rights groups (watchdogs)
- Technology vendor (provider)

**Engagement Plan:**

**Pre-Deployment:**
- Community meetings to explain system
- Civil rights group consultation
- Staff training with input sessions
- Public comment period

**During Deployment:**
- Clear explanation of AI role to applicants
- Easy appeal process
- Regular community updates
- Staff feedback channels

**Ongoing:**
- Quarterly public reports
- Community advisory group
- Annual external audit
- Continuous improvement based on input

**Outcome:** Higher trust, better outcomes, fewer appeals.`,
          estimatedMinutes: 20,
        },
      ],
      keyTakeaways: [
        'AI stakeholders span internal, external, and impacted communities',
        'Engagement should be inclusive, early, and continuous',
        'Communication should be tailored to audience needs',
        'Stakeholder input improves AI outcomes and legitimacy',
      ],
    },
    {
      id: 8,
      title: 'Implementing the AI RMF',
      description: 'Practical guidance for implementing the AI RMF in your organization.',
      durationMinutes: 90,
      learningObjectives: [
        'Develop an AI RMF implementation roadmap',
        'Establish AI risk management processes',
        'Create documentation and evidence',
        'Build organizational capability',
      ],
      content: [
        {
          type: 'lesson',
          title: 'Implementation Planning',
          content: `**Getting Started:**

**Phase 1: Foundation**
- Executive sponsorship
- Scope definition
- Resource allocation
- Team formation

**Phase 2: Assessment**
- Current state analysis
- Gap identification
- Priority setting
- Roadmap development

**Phase 3: Development**
- Policy and procedure creation
- Process design
- Tool selection
- Training development

**Phase 4: Implementation**
- Pilot deployment
- Process rollout
- Training delivery
- Monitoring establishment

**Phase 5: Maturation**
- Continuous improvement
- Capability building
- Integration deepening
- Culture development

**Success Factors:**
- Leadership commitment
- Clear accountability
- Adequate resources
- Stakeholder engagement
- Patience and persistence`,
          estimatedMinutes: 20,
        },
        {
          type: 'lesson',
          title: 'Process Design',
          content: `**Core AI Risk Processes:**

**AI System Registration**
- New AI identification
- Initial risk categorization
- Governance pathway assignment
- Documentation initiation

**Risk Assessment Process**
- Scheduled assessments
- Trigger-based reviews
- Assessment methodology
- Documentation requirements

**Risk Treatment Process**
- Treatment selection
- Implementation tracking
- Effectiveness review
- Residual risk acceptance

**Monitoring Process**
- Metrics collection
- Performance review
- Drift detection
- Incident tracking

**Change Management**
- Change identification
- Impact assessment
- Approval process
- Implementation control

**Incident Response**
- Detection and reporting
- Assessment and triage
- Response and remediation
- Learning and improvement

**Documentation Requirements:**
- Process procedures
- Roles and responsibilities
- Templates and forms
- Training materials`,
          estimatedMinutes: 25,
        },
        {
          type: 'lesson',
          title: 'Building Capability',
          content: `**Organizational Capabilities Needed:**

**Governance Capability**
- AI policy development
- Risk oversight
- Decision-making
- Stakeholder management

**Technical Capability**
- Risk assessment
- Metric development
- Testing and evaluation
- Technical controls

**Operational Capability**
- Process execution
- Monitoring
- Incident response
- Documentation

**People Capability**
- AI literacy
- Risk awareness
- Technical skills
- Soft skills

**Building Capability:**

1. **Training Programs**
   - Role-based training
   - Technical training
   - Awareness programs
   - Leadership education

2. **Knowledge Management**
   - Best practices library
   - Lessons learned
   - Expert networks
   - External resources

3. **Tools and Technology**
   - Risk management platforms
   - Testing tools
   - Monitoring solutions
   - Documentation systems

4. **Culture Development**
   - Leadership modeling
   - Recognition programs
   - Open communication
   - Psychological safety`,
          estimatedMinutes: 25,
        },
        {
          type: 'interactive',
          title: 'Implementation Readiness Assessment',
          content: 'Self-assessment tool to evaluate organizational readiness for AI RMF implementation.',
          estimatedMinutes: 20,
        },
      ],
      keyTakeaways: [
        'Implementation follows phases from foundation to maturation',
        'Core processes include registration, assessment, treatment, monitoring',
        'Capabilities span governance, technical, operational, and people',
        'Success requires leadership commitment and adequate resources',
      ],
    },
  ],
};

// ============================================================================
// ISO 42001 COURSE
// ============================================================================
export const iso42001Course: CourseContent = {
  id: 3,
  title: 'ISO 42001 AI Management System',
  shortTitle: 'ISO 42001',
  description: 'Comprehensive training on implementing ISO/IEC 42001 for AI governance. Learn to establish, implement, maintain, and continually improve an AI Management System (AIMS) aligned with international best practices.',
  framework: 'ISO 42001',
  level: 'specialist',
  totalDurationHours: 16,
  certificationType: 'ISO 42001 Lead Implementer',
  prerequisites: ['Familiarity with ISO management systems', 'Basic understanding of AI'],
  finalExamInfo: {
    questionCount: 75,
    passingScore: 80,
    timeLimit: 150,
  },
  modules: [
    {
      id: 1,
      title: 'Introduction to ISO 42001',
      description: 'Overview of ISO/IEC 42001, the first international standard for AI management systems.',
      durationMinutes: 120,
      learningObjectives: [
        'Understand the purpose and scope of ISO 42001',
        'Explain the AI Management System (AIMS) concept',
        'Identify relationships with other ISO standards',
        'Know the certification process',
      ],
      content: [
        {
          type: 'lesson',
          title: 'The Birth of ISO 42001',
          content: `**ISO/IEC 42001:2023**
The first international standard for AI Management Systems (AIMS).

**Publication:** December 2023

**Purpose:**
Provide a framework for organizations to:
- Responsibly develop and use AI systems
- Manage risks associated with AI
- Meet stakeholder expectations
- Demonstrate trustworthy AI practices

**Why an ISO Standard?**
- International recognition and acceptance
- Certifiable to demonstrate compliance
- Compatible with existing ISO systems
- Vendor-neutral and technology-agnostic

**Scope:**
Applies to any organization that:
- Develops AI systems
- Provides AI products/services
- Uses AI systems
- Regardless of size, sector, or type

**Key Features:**
- Risk-based approach
- Lifecycle coverage
- Stakeholder consideration
- Continual improvement
- Certification pathway`,
          estimatedMinutes: 25,
        },
        {
          type: 'lesson',
          title: 'AIMS Structure',
          content: `**What is an AI Management System?**

An AIMS is a set of interrelated elements that organizations use to establish policies and objectives for AI, and processes to achieve those objectives.

**AIMS Components:**

1. **Context**
   - Internal/external issues
   - Stakeholder needs
   - Scope definition

2. **Leadership**
   - Management commitment
   - AI policy
   - Organizational roles

3. **Planning**
   - Risk assessment
   - Objectives setting
   - Change planning

4. **Support**
   - Resources
   - Competence
   - Awareness
   - Communication
   - Documentation

5. **Operation**
   - AI system lifecycle
   - Third-party considerations
   - Data management
   - Human oversight

6. **Performance Evaluation**
   - Monitoring and measurement
   - Internal audit
   - Management review

7. **Improvement**
   - Nonconformity handling
   - Continual improvement

**Integration Opportunity:**
AIMS uses the same high-level structure (HLS) as other ISO management systems, enabling integration with ISO 9001, 27001, etc.`,
          estimatedMinutes: 30,
        },
        {
          type: 'lesson',
          title: 'Relationship to Other Standards',
          content: `**ISO Management System Family:**

**ISO 9001 - Quality Management**
- Quality principles apply to AI development
- Process approach complements AIMS
- Customer focus aligns with stakeholder consideration

**ISO 27001 - Information Security**
- Security controls for AI systems
- Data protection requirements
- Incident management alignment

**ISO 31000 - Risk Management**
- Risk principles underpin AIMS
- Risk assessment methodology
- Risk treatment approaches

**ISO 22301 - Business Continuity**
- AI system availability
- Operational resilience
- Recovery planning

**AI-Specific Standards:**

**ISO/IEC 23894**
- AI risk management guidance
- Complements 42001's risk approach
- Detailed risk techniques

**ISO/IEC 38507**
- AI governance guidance
- Board-level considerations
- Oversight frameworks

**Regulatory Alignment:**
ISO 42001 supports compliance with:
- EU AI Act requirements
- NIST AI RMF alignment
- Industry-specific regulations`,
          estimatedMinutes: 25,
        },
        {
          type: 'lesson',
          title: 'Certification Process',
          content: `**Achieving ISO 42001 Certification:**

**Step 1: Gap Analysis**
- Current state assessment
- Identify gaps to standard
- Prioritize remediation

**Step 2: AIMS Implementation**
- Establish documentation
- Implement processes
- Train personnel
- Build evidence

**Step 3: Internal Audit**
- Assess conformity
- Identify nonconformities
- Take corrective action

**Step 4: Management Review**
- Review AIMS performance
- Confirm resource adequacy
- Set improvement objectives

**Step 5: Certification Audit**
- Stage 1: Documentation review
- Stage 2: Implementation audit
- Address any findings

**Certification Bodies:**
- Accredited by national bodies
- Competent in AI domain
- Independent and impartial

**Maintaining Certification:**
- Annual surveillance audits
- Three-year recertification
- Continual improvement evidence`,
          estimatedMinutes: 25,
        },
        {
          type: 'video',
          title: 'ISO 42001 Certification Journey',
          content: 'Video overview of the certification process from gap analysis to successful certification.',
          estimatedMinutes: 15,
        },
      ],
      keyTakeaways: [
        'ISO 42001 is the first international AI management system standard',
        'AIMS provides structure for responsible AI development and use',
        'Integrates with other ISO management systems',
        'Certification demonstrates AI governance maturity',
      ],
    },
    {
      id: 2,
      title: 'Context and Leadership (Clauses 4-5)',
      description: 'Understanding organizational context and leadership requirements for AIMS.',
      durationMinutes: 120,
      learningObjectives: [
        'Analyze internal and external context for AI',
        'Identify and prioritize AI stakeholders',
        'Define appropriate AIMS scope',
        'Establish AI policy and leadership commitment',
      ],
      content: [
        {
          type: 'lesson',
          title: 'Organizational Context (Clause 4)',
          content: `**4.1 Understanding the Organization and Its Context**

Determine external and internal issues relevant to AI and AIMS.

**External Issues:**
- Regulatory environment (EU AI Act, etc.)
- Industry standards and expectations
- Technology landscape and trends
- Stakeholder perceptions of AI
- Competitive environment
- Societal attitudes toward AI

**Internal Issues:**
- AI strategy and objectives
- Organizational culture
- Technical capabilities
- Governance structures
- Risk appetite
- Resource availability

**4.2 Understanding Stakeholder Needs**

Identify:
- Who has interest in your AI activities
- What their requirements are
- How to prioritize competing needs

**Key Stakeholders:**
- Customers and users
- Employees
- Regulators
- Business partners
- Society and communities
- Shareholders

**4.3 Determining AIMS Scope**

Define boundaries considering:
- AI systems covered
- Organizational boundaries
- Processes included
- Exclusions and justifications

**4.4 AI Management System**

Establish, implement, maintain, and improve AIMS in accordance with standard requirements.`,
          estimatedMinutes: 35,
        },
        {
          type: 'lesson',
          title: 'Leadership (Clause 5)',
          content: `**5.1 Leadership and Commitment**

Top management shall demonstrate commitment by:
- Taking accountability for AIMS effectiveness
- Ensuring AI policy and objectives align with strategy
- Integrating AIMS into business processes
- Ensuring resources are available
- Communicating importance of AI governance
- Achieving intended AIMS outcomes
- Directing and supporting personnel
- Promoting continual improvement
- Supporting other managers

**5.2 AI Policy**

Top management shall establish AI policy that:
- Is appropriate to organizational purpose
- Provides framework for AI objectives
- Includes commitment to requirements
- Includes commitment to continual improvement
- Is documented and communicated
- Is available to stakeholders as appropriate

**AI Policy Content:**
- Organizational AI principles
- Risk management commitment
- Stakeholder consideration
- Compliance commitment
- Improvement commitment

**5.3 Roles, Responsibilities, and Authorities**

Top management shall assign:
- Responsibility for AIMS conformity
- Authority for reporting AIMS performance
- Clear accountability for AI decisions
- Defined roles at all levels`,
          estimatedMinutes: 35,
        },
        {
          type: 'lesson',
          title: 'Developing AI Policy',
          content: `**AI Policy Framework:**

**Vision Statement:**
What role AI plays in achieving organizational mission

**Principles:**
Core values guiding AI development and use
- Fairness and non-discrimination
- Transparency and explainability
- Privacy and security
- Accountability
- Human oversight
- Safety and reliability

**Commitments:**
What organization commits to regarding AI
- Risk management
- Stakeholder engagement
- Regulatory compliance
- Ethical considerations
- Continual improvement

**Governance:**
How AI will be overseen
- Decision-making authority
- Oversight mechanisms
- Review processes

**Implementation Guidance:**
How policy applies in practice
- When to apply
- How to interpret principles
- Where to get help

**Policy Characteristics:**
- Approved by top management
- Regularly reviewed
- Communicated to all personnel
- Available to stakeholders`,
          estimatedMinutes: 30,
        },
        {
          type: 'interactive',
          title: 'AI Policy Development Exercise',
          content: 'Interactive exercise developing AI policy elements for different organizational contexts.',
          estimatedMinutes: 20,
        },
      ],
      keyTakeaways: [
        'Context analysis covers internal and external AI-related issues',
        'Stakeholder identification and prioritization is essential',
        'AIMS scope must be clearly defined and documented',
        'Leadership commitment is demonstrated through policy and resource allocation',
      ],
    },
    // Modules 3-8 would follow similar detailed structure
    // Adding abbreviated versions for space
    {
      id: 3,
      title: 'Planning (Clause 6)',
      description: 'Risk assessment, objectives setting, and planning for AIMS.',
      durationMinutes: 120,
      learningObjectives: [
        'Conduct AI risk assessment',
        'Set measurable AI objectives',
        'Plan actions to achieve objectives',
        'Address risks and opportunities',
      ],
      content: [
        {
          type: 'lesson',
          title: 'Risk-Based Approach',
          content: `ISO 42001 requires risk assessment considering AI-specific impacts on individuals, groups, and society. This includes impact assessment methodology, risk treatment planning, and residual risk acceptance criteria.`,
          estimatedMinutes: 40,
        },
        {
          type: 'lesson',
          title: 'AI Objectives',
          content: `Objectives must be measurable, monitored, communicated, and updated. They should address trustworthiness characteristics and stakeholder expectations.`,
          estimatedMinutes: 40,
        },
        {
          type: 'lesson',
          title: 'Planning for Changes',
          content: `Changes to AI systems and AIMS must be planned, considering consequences and maintaining system integrity.`,
          estimatedMinutes: 40,
        },
      ],
      keyTakeaways: [
        'Risk assessment covers AI-specific impacts',
        'Objectives must be measurable and stakeholder-aligned',
        'Change planning maintains AIMS integrity',
      ],
    },
    {
      id: 4,
      title: 'Support (Clause 7)',
      description: 'Resources, competence, awareness, communication, and documentation.',
      durationMinutes: 120,
      learningObjectives: [
        'Determine resource requirements',
        'Establish competence criteria',
        'Develop awareness programs',
        'Manage documented information',
      ],
      content: [
        {
          type: 'lesson',
          title: 'Resources and Competence',
          content: `Organizations must determine and provide resources needed for AIMS, including personnel, technology, and expertise. Competence requirements for AI-related roles must be defined.`,
          estimatedMinutes: 40,
        },
        {
          type: 'lesson',
          title: 'Awareness and Communication',
          content: `Personnel must be aware of AI policy, their contribution to AIMS, and implications of nonconformity. Communication plans address internal and external stakeholders.`,
          estimatedMinutes: 40,
        },
        {
          type: 'lesson',
          title: 'Documented Information',
          content: `AIMS documentation includes required documents, those needed for effectiveness, and controls for creation, update, and management.`,
          estimatedMinutes: 40,
        },
      ],
      keyTakeaways: [
        'Resources include people, technology, and expertise',
        'Competence criteria ensure capable personnel',
        'Documentation provides evidence and guidance',
      ],
    },
    {
      id: 5,
      title: 'Operation (Clause 8)',
      description: 'AI lifecycle management and operational controls.',
      durationMinutes: 120,
      learningObjectives: [
        'Apply controls throughout AI lifecycle',
        'Manage third-party AI relationships',
        'Implement data management controls',
        'Ensure human oversight',
      ],
      content: [
        {
          type: 'lesson',
          title: 'AI System Lifecycle',
          content: `ISO 42001 addresses design, development, testing, deployment, operation, and retirement of AI systems with appropriate controls at each stage.`,
          estimatedMinutes: 40,
        },
        {
          type: 'lesson',
          title: 'Data and Third Parties',
          content: `Data management addresses quality, privacy, and governance. Third-party controls cover acquisition, supply chain, and ongoing management.`,
          estimatedMinutes: 40,
        },
        {
          type: 'lesson',
          title: 'Human Oversight',
          content: `Human oversight requirements ensure meaningful human involvement in AI decisions, with appropriate authority and capability.`,
          estimatedMinutes: 40,
        },
      ],
      keyTakeaways: [
        'Lifecycle controls apply from design to retirement',
        'Data management ensures quality and privacy',
        'Human oversight maintains meaningful human control',
      ],
    },
    {
      id: 6,
      title: 'Performance Evaluation (Clause 9)',
      description: 'Monitoring, measurement, audit, and management review.',
      durationMinutes: 120,
      learningObjectives: [
        'Establish monitoring and measurement',
        'Conduct internal audits',
        'Perform management reviews',
        'Evaluate AIMS performance',
      ],
      content: [
        {
          type: 'lesson',
          title: 'Monitoring and Measurement',
          content: `Organizations determine what to monitor, methods, timing, and analysis. AI system performance and AIMS effectiveness are key focus areas.`,
          estimatedMinutes: 40,
        },
        {
          type: 'lesson',
          title: 'Internal Audit',
          content: `Internal audits assess AIMS conformity and effectiveness at planned intervals. Audit programs, criteria, and findings management are addressed.`,
          estimatedMinutes: 40,
        },
        {
          type: 'lesson',
          title: 'Management Review',
          content: `Top management reviews AIMS suitability, adequacy, and effectiveness. Inputs and outputs of management review are specified.`,
          estimatedMinutes: 40,
        },
      ],
      keyTakeaways: [
        'Monitoring provides evidence of AIMS performance',
        'Internal audits assess conformity and effectiveness',
        'Management review ensures ongoing suitability',
      ],
    },
    {
      id: 7,
      title: 'Improvement (Clause 10)',
      description: 'Nonconformity management and continual improvement.',
      durationMinutes: 120,
      learningObjectives: [
        'Handle nonconformities effectively',
        'Implement corrective actions',
        'Drive continual improvement',
        'Document improvement activities',
      ],
      content: [
        {
          type: 'lesson',
          title: 'Nonconformity and Corrective Action',
          content: `When nonconformities occur, organizations must react, evaluate causes, implement corrections, and review effectiveness. Documentation of nonconformities and actions is required.`,
          estimatedMinutes: 40,
        },
        {
          type: 'lesson',
          title: 'Continual Improvement',
          content: `Organizations must continually improve AIMS suitability, adequacy, and effectiveness. Improvement opportunities come from audits, reviews, monitoring, and stakeholder feedback.`,
          estimatedMinutes: 40,
        },
        {
          type: 'lesson',
          title: 'Improvement Documentation',
          content: `Evidence of improvement includes corrective action records, audit findings resolution, management review outputs, and trend analysis.`,
          estimatedMinutes: 40,
        },
      ],
      keyTakeaways: [
        'Nonconformities drive systematic improvement',
        'Corrective actions address root causes',
        'Continual improvement is ongoing commitment',
      ],
    },
    {
      id: 8,
      title: 'Implementation and Certification',
      description: 'Practical guidance for implementing and certifying AIMS.',
      durationMinutes: 120,
      learningObjectives: [
        'Plan AIMS implementation',
        'Build required documentation',
        'Prepare for certification audit',
        'Maintain certification',
      ],
      content: [
        {
          type: 'lesson',
          title: 'Implementation Roadmap',
          content: `Implementation follows phases: gap analysis, planning, development, implementation, internal audit, and certification preparation.`,
          estimatedMinutes: 40,
        },
        {
          type: 'lesson',
          title: 'Documentation Development',
          content: `Required documentation includes AI policy, scope, risk assessment, objectives, procedures, and records. Templates and examples support development.`,
          estimatedMinutes: 40,
        },
        {
          type: 'lesson',
          title: 'Certification Preparation',
          content: `Certification readiness includes complete documentation, evidence of implementation, internal audit completion, and management review.`,
          estimatedMinutes: 40,
        },
      ],
      keyTakeaways: [
        'Implementation follows structured phases',
        'Documentation provides audit evidence',
        'Certification demonstrates AIMS maturity',
      ],
    },
  ],
};

// ============================================================================
// TC260 AI GOVERNANCE FRAMEWORK COURSE
// ============================================================================
export const tc260Course: CourseContent = {
  id: 4,
  title: 'TC260 AI Governance Framework',
  shortTitle: 'TC260',
  description: 'Master China\'s comprehensive AI governance framework through TC260 standards. This course covers the regulatory ecosystem, risk classification, data governance, algorithm security, generative AI requirements, and practical implementation strategies for organizations operating in or with China.',
  framework: 'TC260',
  level: 'advanced',
  totalDurationHours: 10,
  certificationType: 'TC260 AI Governance Specialist',
  prerequisites: ['Basic understanding of AI/ML concepts', 'Familiarity with Chinese business environment'],
  finalExamInfo: {
    questionCount: 60,
    passingScore: 80,
    timeLimit: 120,
  },
  modules: [
    {
      id: 1,
      title: 'Introduction to TC260 and Chinese AI Governance',
      description: 'Overview of TC260, its role in Chinese AI governance, and the regulatory ecosystem.',
      durationMinutes: 75,
      learningObjectives: [
        'Understand the role of TC260 in Chinese AI governance',
        'Identify key Chinese AI regulations and their relationship to TC260',
        'Explain the principles underlying Chinese AI governance',
        'Know the enforcement authorities and their responsibilities',
      ],
      content: [
        {
          type: 'lesson',
          title: 'Understanding TC260',
          content: `TC260 (National Information Security Standardization Technical Committee) is the primary body responsible for developing cybersecurity and AI-related standards in China. Working under the Standardization Administration of China (SAC), TC260 develops technical standards that help organizations comply with Chinese AI regulations.`,
          estimatedMinutes: 20,
        },
        {
          type: 'lesson',
          title: 'The Chinese AI Regulatory Ecosystem',
          content: `China's AI governance operates through a combination of regulations and supporting standards. Key regulations include the Algorithmic Recommendation Regulations (2022), Deep Synthesis Provisions (2023), and Generative AI Service Management Measures (2023). TC260 standards provide technical implementation guidance for these regulatory requirements.`,
          estimatedMinutes: 25,
        },
        {
          type: 'lesson',
          title: 'Core Principles of Chinese AI Governance',
          content: `Chinese AI governance is built on principles of human-centered AI, safety and security, transparency and explainability, fairness and non-discrimination, and social responsibility. These principles guide both regulatory requirements and TC260 standards.`,
          estimatedMinutes: 20,
        },
        {
          type: 'case_study',
          title: 'Regulatory Compliance Scenarios',
          content: `Analysis of real-world scenarios demonstrating how TC260 standards support compliance with Chinese AI regulations across different industry sectors.`,
          estimatedMinutes: 10,
        },
      ],
      keyTakeaways: [
        'TC260 provides technical standards supporting Chinese AI regulatory compliance',
        'Multiple regulations work together to form comprehensive AI governance',
        'Human-centered AI with safety focus is the core philosophy',
        'CAC is the primary enforcement authority',
      ],
    },
    {
      id: 2,
      title: 'AI Risk Classification and Assessment',
      description: 'Understanding TC260 approaches to AI risk classification and assessment methodologies.',
      durationMinutes: 75,
      learningObjectives: [
        'Apply TC260 risk classification approaches to AI systems',
        'Conduct AI risk assessments following TC260 guidelines',
        'Identify high-risk AI applications and their requirements',
        'Document risk classifications appropriately',
      ],
      content: [
        {
          type: 'lesson',
          title: 'Risk Classification Framework',
          content: `TC260 uses a multi-level classification approach based on risk level, potential societal impact, and sensitivity of domains. Classification considers factors including data sensitivity, autonomous decision-making capability, and impact on individuals and society.`,
          estimatedMinutes: 25,
        },
        {
          type: 'lesson',
          title: 'High-Risk AI Categories',
          content: `Certain AI applications face stricter requirements including those affecting national security, critical infrastructure, mass public opinion, and sensitive personal decisions. These require enhanced security assessments, human oversight, and ongoing monitoring.`,
          estimatedMinutes: 25,
        },
        {
          type: 'interactive',
          title: 'Risk Classification Exercise',
          content: `Interactive exercise classifying various AI systems according to TC260 risk categories and identifying applicable requirements.`,
          estimatedMinutes: 25,
        },
      ],
      keyTakeaways: [
        'Risk classification is based on impact, data sensitivity, and autonomy',
        'High-risk AI faces enhanced requirements and oversight',
        'Classification determines applicable compliance obligations',
        'Ongoing monitoring is required as systems evolve',
      ],
    },
    {
      id: 3,
      title: 'Data Governance Requirements',
      description: 'Understanding TC260 data governance requirements for AI systems.',
      durationMinutes: 75,
      learningObjectives: [
        'Apply TC260 data governance requirements to AI training data',
        'Ensure compliance with PIPL and data localization requirements',
        'Implement appropriate data quality and security measures',
        'Manage cross-border data flows for AI systems',
      ],
      content: [
        {
          type: 'lesson',
          title: 'Data Quality and Processing',
          content: `TC260 requires assessment of training data quality including accuracy, completeness, timeliness, and potential biases. Legal basis for data processing must be established in compliance with PIPL requirements.`,
          estimatedMinutes: 25,
        },
        {
          type: 'lesson',
          title: 'Data Security and Localization',
          content: `Data security classification, access controls, and encryption are mandatory. Critical and personal data must be stored in China, with security assessments required for cross-border transfers.`,
          estimatedMinutes: 25,
        },
        {
          type: 'lesson',
          title: 'Special Data Categories',
          content: `Sensitive personal information requires enhanced protections including explicit consent and additional security measures. Special rules apply to biometric, health, financial, and children's data.`,
          estimatedMinutes: 25,
        },
      ],
      keyTakeaways: [
        'Data quality assessment is essential for AI training data',
        'PIPL compliance is foundational for personal data use',
        'Data localization requirements apply to critical and personal data',
        'Cross-border transfers require security assessments',
      ],
    },
    {
      id: 4,
      title: 'Algorithm Security and Testing',
      description: 'Understanding TC260 requirements for algorithm security and testing.',
      durationMinutes: 75,
      learningObjectives: [
        'Implement TC260 algorithm security requirements',
        'Conduct required algorithm testing and validation',
        'Address algorithmic discrimination and bias',
        'Maintain appropriate algorithm documentation',
      ],
      content: [
        {
          type: 'lesson',
          title: 'Algorithm Security Requirements',
          content: `TC260 requires algorithms to be safe, reliable, and controllable. Security measures include input validation, output filtering, robustness testing, and protection against adversarial attacks.`,
          estimatedMinutes: 25,
        },
        {
          type: 'lesson',
          title: 'Fairness and Non-Discrimination',
          content: `Algorithms must not produce unreasonable differential treatment. Organizations must conduct fairness testing, monitor for discriminatory outputs, and implement corrective measures when bias is detected.`,
          estimatedMinutes: 25,
        },
        {
          type: 'lesson',
          title: 'Documentation and Audit Trails',
          content: `Comprehensive algorithm documentation is required including design rationale, training methodology, testing results, and decision logs. Audit trails support accountability and regulatory examination.`,
          estimatedMinutes: 25,
        },
      ],
      keyTakeaways: [
        'Algorithm safety, reliability, and controllability are mandatory',
        'Fairness testing and bias monitoring are required',
        'Robustness against adversarial attacks must be assessed',
        'Comprehensive documentation and audit trails are essential',
      ],
    },
    {
      id: 5,
      title: 'Generative AI Governance',
      description: 'Understanding TC260 requirements specific to generative AI services.',
      durationMinutes: 75,
      learningObjectives: [
        'Apply TC260 generative AI governance requirements',
        'Implement content safety measures for generative AI',
        'Meet registration and assessment requirements',
        'Handle synthetic media and deepfakes appropriately',
      ],
      content: [
        {
          type: 'lesson',
          title: 'Generative AI Service Requirements',
          content: `Generative AI services require registration with CAC before launch. Content safety measures must prevent generation of illegal content, harmful information, and disinformation. Input filtering and output moderation are mandatory.`,
          estimatedMinutes: 25,
        },
        {
          type: 'lesson',
          title: 'Content Safety and Labeling',
          content: `AI-generated content must be clearly labeled. Training data must be legally acquired and filtered for harmful content. Ongoing monitoring of outputs is required with incident reporting obligations.`,
          estimatedMinutes: 25,
        },
        {
          type: 'lesson',
          title: 'Synthetic Media Controls',
          content: `Deep synthesis and synthetic media face strict controls including identification labels, consent requirements from depicted individuals, and measures to prevent misuse for fraud or defamation.`,
          estimatedMinutes: 25,
        },
      ],
      keyTakeaways: [
        'Registration is required before launching generative AI services',
        'Content safety measures are mandatory',
        'AI-generated content must be labeled',
        'Synthetic media faces strict identity and consent requirements',
      ],
    },
    {
      id: 6,
      title: 'Compliance and Enforcement',
      description: 'Understanding TC260 compliance requirements and enforcement mechanisms.',
      durationMinutes: 75,
      learningObjectives: [
        'Understand enforcement authorities and their powers',
        'Know penalty structures for AI regulation violations',
        'Implement effective compliance monitoring',
        'Prepare for regulatory examinations',
      ],
      content: [
        {
          type: 'lesson',
          title: 'Enforcement Authorities',
          content: `CAC is the primary enforcement authority, with sectoral regulators overseeing specific industries. Authorities have broad powers including access to systems, data, and documentation. Regulatory examinations may occur with or without notice.`,
          estimatedMinutes: 25,
        },
        {
          type: 'lesson',
          title: 'Penalties and Consequences',
          content: `Violations can result in fines, service suspension, license revocation, and criminal liability for serious violations. Compliance history may affect organizational social credit ratings.`,
          estimatedMinutes: 25,
        },
        {
          type: 'lesson',
          title: 'Compliance Management',
          content: `Effective compliance requires ongoing monitoring, comprehensive record-keeping, incident management, and accessible complaint handling. Regular self-assessments and readiness for external examination are essential.`,
          estimatedMinutes: 25,
        },
      ],
      keyTakeaways: [
        'CAC and sectoral regulators have broad enforcement powers',
        'Penalties can be severe including criminal liability',
        'Compliance history affects social credit ratings',
        'Ongoing monitoring and record-keeping are essential',
      ],
    },
    {
      id: 7,
      title: 'Sector-Specific Requirements',
      description: 'Understanding TC260 requirements for specific industry sectors.',
      durationMinutes: 75,
      learningObjectives: [
        'Apply sector-specific AI requirements for key industries',
        'Understand healthcare, finance, and transportation AI governance',
        'Address public sector and critical infrastructure requirements',
        'Navigate cross-sector AI applications',
      ],
      content: [
        {
          type: 'lesson',
          title: 'Healthcare and Finance',
          content: `Healthcare AI requires clinical validation, medical professional oversight, and patient safety measures. Financial services AI must meet risk management, model validation, and consumer protection requirements.`,
          estimatedMinutes: 25,
        },
        {
          type: 'lesson',
          title: 'Critical Infrastructure and Public Services',
          content: `AI in critical infrastructure faces enhanced security, resilience requirements, and government oversight. Public sector AI must ensure transparency, fairness, accessibility, and citizen rights protections.`,
          estimatedMinutes: 25,
        },
        {
          type: 'lesson',
          title: 'Cross-Sector Considerations',
          content: `AI applications spanning multiple sectors must meet the requirements of each applicable sector. Industry self-regulation through codes of conduct complements government regulations.`,
          estimatedMinutes: 25,
        },
      ],
      keyTakeaways: [
        'Sector-specific requirements add to baseline TC260 obligations',
        'Healthcare and finance face particularly strict requirements',
        'Critical infrastructure requires government oversight',
        'Cross-sector AI must meet all applicable sectoral requirements',
      ],
    },
    {
      id: 8,
      title: 'Implementation Strategy',
      description: 'Practical guidance for implementing TC260 AI governance.',
      durationMinutes: 75,
      learningObjectives: [
        'Develop a TC260 implementation roadmap',
        'Establish appropriate governance structures',
        'Integrate TC260 with other AI frameworks',
        'Maintain ongoing compliance',
      ],
      content: [
        {
          type: 'lesson',
          title: 'Implementation Approach',
          content: `Implementation begins with gap analysis, followed by governance structure establishment, policy development, and progressive compliance improvement. Training and awareness programs support successful implementation.`,
          estimatedMinutes: 25,
        },
        {
          type: 'lesson',
          title: 'Governance and Documentation',
          content: `Establish an AI governance committee with clear roles and responsibilities. Maintain comprehensive documentation including AI inventory, risk assessments, policies, and compliance evidence.`,
          estimatedMinutes: 25,
        },
        {
          type: 'lesson',
          title: 'Framework Integration and Maintenance',
          content: `Integrate TC260 with other frameworks like ISO 42001 and NIST AI RMF. Ongoing activities include continuous monitoring, regular audits, and periodic reassessment as regulations and systems evolve.`,
          estimatedMinutes: 25,
        },
      ],
      keyTakeaways: [
        'Begin with gap analysis and prioritized implementation',
        'Establish clear governance structures and responsibilities',
        'Integrate TC260 with existing AI governance frameworks',
        'Maintain ongoing compliance through monitoring and audits',
      ],
    },
  ],
};

// ============================================================================
// MATERNAL COVENANT FRAMEWORK COURSE
// ============================================================================
export const maternalCovenantCourse: CourseContent = {
  id: 5,
  title: 'Maternal Covenant: Ethical AI Framework',
  shortTitle: 'Maternal Covenant',
  description: 'Explore the Maternal Covenant framework for ethical AI development, drawing from the profound responsibility of parenthood to guide AI governance. This course covers the philosophical foundations, core principles, implementation strategies, and practical application of this humanistic approach to AI ethics.',
  framework: 'Maternal Covenant',
  level: 'fundamentals',
  totalDurationHours: 6,
  certificationType: 'Maternal Covenant Practitioner',
  prerequisites: [],
  finalExamInfo: {
    questionCount: 40,
    passingScore: 80,
    timeLimit: 80,
  },
  modules: [
    {
      id: 1,
      title: 'Philosophy and Foundations',
      description: 'Understanding the philosophical underpinnings of the Maternal Covenant framework.',
      durationMinutes: 90,
      learningObjectives: [
        'Understand the core philosophy of the Maternal Covenant',
        'Explain the parental metaphor in AI ethics',
        'Describe the intergenerational responsibility perspective',
        'Identify the ethical traditions informing the framework',
      ],
      content: [
        {
          type: 'lesson',
          title: 'The Maternal Covenant Philosophy',
          content: `The Maternal Covenant framework draws from the profound responsibility of parenthood, applying the same care, protection, and nurturing mindset to AI development. Just as parents bear responsibility for how their children affect the world, AI developers are stewards with profound responsibility for their creations' impacts.`,
          estimatedMinutes: 25,
        },
        {
          type: 'lesson',
          title: 'Intergenerational Responsibility',
          content: `The "Covenant" represents a sacred commitment to future generations, recognizing that AI systems we create today will shape the world our children and grandchildren inherit. This long-term perspective counters short-term thinking in AI development.`,
          estimatedMinutes: 25,
        },
        {
          type: 'lesson',
          title: 'Ethical Foundations',
          content: `The framework draws from care ethics (prioritizing relationships and responsibility), virtue ethics (cultivating good character), and intergenerational justice (considering future generations). These traditions provide deep roots for AI ethical practice.`,
          estimatedMinutes: 25,
        },
        {
          type: 'case_study',
          title: 'Applying the Parental Perspective',
          content: `Exploring how the parental metaphor changes ethical decision-making in AI development through practical scenarios and reflective exercises.`,
          estimatedMinutes: 15,
        },
      ],
      keyTakeaways: [
        'The Maternal Covenant applies parental responsibility to AI development',
        'Intergenerational commitment extends consideration to future generations',
        'Care ethics, virtue ethics, and intergenerational justice form the foundation',
        'AI developers are stewards responsible for their creations\' impacts',
      ],
    },
    {
      id: 2,
      title: 'Core Principles',
      description: 'Deep dive into the four core principles of the Maternal Covenant.',
      durationMinutes: 90,
      learningObjectives: [
        'Explain each of the four core principles',
        'Understand how principles interact and reinforce each other',
        'Apply principles to AI development decisions',
        'Balance principles when trade-offs arise',
      ],
      content: [
        {
          type: 'lesson',
          title: 'Protection and Nurturing',
          content: `Protection focuses on safeguarding humans and society from AI harms through proactive safety measures and harm prevention. Nurturing fosters beneficial AI capabilities while carefully managing risks, supporting positive applications that serve human flourishing.`,
          estimatedMinutes: 25,
        },
        {
          type: 'lesson',
          title: 'Responsibility and Wisdom',
          content: `Responsibility encompasses comprehensive accountability for AI impacts from development through deployment and beyond. Wisdom involves thoughtful deliberation, learning from experience, and prudent decision-making that considers long-term consequences.`,
          estimatedMinutes: 25,
        },
        {
          type: 'lesson',
          title: 'Principle Integration',
          content: `The four principles are interconnected and mutually reinforcing. Protection enables safe Nurturing, Responsibility guides both, and Wisdom informs how all principles are applied. When trade-offs arise, Protection serves as a foundational priority.`,
          estimatedMinutes: 25,
        },
        {
          type: 'interactive',
          title: 'Principle Application Exercise',
          content: `Interactive scenarios where participants apply the four principles to real-world AI development decisions and navigate trade-offs.`,
          estimatedMinutes: 15,
        },
      ],
      keyTakeaways: [
        'Four principles: Protection, Nurturing, Responsibility, Wisdom',
        'Principles are interconnected and mutually reinforcing',
        'Protection serves as foundational when trade-offs arise',
        'All principles apply throughout the AI lifecycle',
      ],
    },
    {
      id: 3,
      title: 'Governance and Culture',
      description: 'Implementing Maternal Covenant governance structures and organizational culture.',
      durationMinutes: 90,
      learningObjectives: [
        'Design governance structures aligned with Maternal Covenant principles',
        'Foster organizational cultures supporting ethical AI',
        'Engage stakeholders in AI governance',
        'Implement monitoring and improvement practices',
      ],
      content: [
        {
          type: 'lesson',
          title: 'Governance Structures',
          content: `Multi-stakeholder governance with clear accountability, diverse perspectives, and meaningful community participation. Governance should include affected communities in design, oversight, and feedback processes.`,
          estimatedMinutes: 25,
        },
        {
          type: 'lesson',
          title: 'Ethical Culture Development',
          content: `Foster cultures prioritizing care, responsibility, and ethical awareness. Teams should feel empowered to raise concerns and prioritize safety. Organizational incentives must align with long-term ethical outcomes.`,
          estimatedMinutes: 25,
        },
        {
          type: 'lesson',
          title: 'Monitoring and Improvement',
          content: `Continuous monitoring for impacts and emerging risks. Compassionate, transparent incident response prioritizing affected parties. Holistic success evaluation including wellbeing, safety, and societal impact.`,
          estimatedMinutes: 25,
        },
        {
          type: 'case_study',
          title: 'Building Ethical AI Organizations',
          content: `Case studies of organizations successfully implementing Maternal Covenant principles in their AI governance and culture.`,
          estimatedMinutes: 15,
        },
      ],
      keyTakeaways: [
        'Multi-stakeholder governance includes affected communities',
        'Organizational culture must support ethical decision-making',
        'Incentives should align with long-term ethical outcomes',
        'Continuous monitoring and compassionate incident response are essential',
      ],
    },
    {
      id: 4,
      title: 'Practical Implementation',
      description: 'Strategies for implementing the Maternal Covenant in practice.',
      durationMinutes: 90,
      learningObjectives: [
        'Develop implementation roadmaps for the Maternal Covenant',
        'Integrate the framework with existing AI governance',
        'Measure implementation success',
        'Sustain ethical practices over time',
      ],
      content: [
        {
          type: 'lesson',
          title: 'Implementation Approach',
          content: `Begin by assessing current practices against Maternal Covenant principles. Develop phased implementation plans with visible leadership commitment. Integrate with existing technical and regulatory frameworks rather than replacing them.`,
          estimatedMinutes: 25,
        },
        {
          type: 'lesson',
          title: 'Success Measurement',
          content: `Success metrics include ethical culture indicators, stakeholder satisfaction, harm prevention outcomes, and community trust measures. Address resistance through education and demonstrating value.`,
          estimatedMinutes: 25,
        },
        {
          type: 'lesson',
          title: 'Sustainability and Evolution',
          content: `Sustain implementation through cultural embedding, regular reflection, and periodic renewal of commitment. Adapt to local cultural contexts while maintaining core ethical principles.`,
          estimatedMinutes: 25,
        },
        {
          type: 'interactive',
          title: 'Implementation Planning',
          content: `Develop a practical implementation plan for applying Maternal Covenant principles in your organization.`,
          estimatedMinutes: 15,
        },
      ],
      keyTakeaways: [
        'Begin with assessment and phased implementation',
        'Complement existing frameworks with ethical depth',
        'Measure success through ethical outcomes and stakeholder trust',
        'Sustain through culture, reflection, and adaptation',
      ],
    },
  ],
};

// ============================================================================
// SOAI-PDCA FRAMEWORK COURSE
// ============================================================================
export const soaiPdcaCourse: CourseContent = {
  id: 6,
  title: 'SOAI-PDCA: Continuous Improvement for AI Governance',
  shortTitle: 'SOAI-PDCA',
  description: 'Master the Safety-Oriented AI Plan-Do-Check-Act framework for continuous improvement in AI governance. This comprehensive course covers each PDCA phase adapted for AI systems, integration with other frameworks, and practical implementation strategies.',
  framework: 'SOAI-PDCA',
  level: 'advanced',
  totalDurationHours: 10,
  certificationType: 'SOAI-PDCA Practitioner',
  prerequisites: ['Basic understanding of AI/ML concepts', 'Familiarity with quality management principles'],
  finalExamInfo: {
    questionCount: 60,
    passingScore: 80,
    timeLimit: 120,
  },
  modules: [
    {
      id: 1,
      title: 'Introduction to SOAI-PDCA',
      description: 'Understanding the SOAI-PDCA framework and its application to AI governance.',
      durationMinutes: 75,
      learningObjectives: [
        'Understand the purpose and structure of SOAI-PDCA',
        'Explain how PDCA applies to AI governance',
        'Identify benefits of continuous improvement for AI',
        'Know the foundations SOAI-PDCA builds upon',
      ],
      content: [
        {
          type: 'lesson',
          title: 'What is SOAI-PDCA?',
          content: `SOAI-PDCA (Safety-Oriented AI Plan-Do-Check-Act) is a continuous improvement framework specifically adapted for AI governance. It applies the proven PDCA methodology to the unique challenges of AI safety, ethics, and performance management.`,
          estimatedMinutes: 20,
        },
        {
          type: 'lesson',
          title: 'The PDCA Cycle for AI',
          content: `The four phases—Plan, Do, Check, Act—create iterative cycles of improvement. Each phase is adapted for AI-specific considerations including safety assessment, bias monitoring, model drift detection, and ethical evaluation.`,
          estimatedMinutes: 25,
        },
        {
          type: 'lesson',
          title: 'Foundations and Benefits',
          content: `SOAI-PDCA builds upon quality management principles, AI ethics frameworks, and risk management standards. Benefits include systematic improvement, regulatory compliance support, and organizational learning.`,
          estimatedMinutes: 20,
        },
        {
          type: 'video',
          title: 'SOAI-PDCA Overview',
          content: `Video introduction to the SOAI-PDCA framework and its practical application.`,
          estimatedMinutes: 10,
        },
      ],
      keyTakeaways: [
        'SOAI-PDCA adapts continuous improvement for AI governance',
        'Four phases create iterative cycles of planning, implementation, evaluation, and action',
        'The framework builds on quality management and AI ethics foundations',
        'Continuous improvement addresses the dynamic nature of AI systems',
      ],
    },
    {
      id: 2,
      title: 'PLAN Phase',
      description: 'Establishing AI safety objectives and governance structures.',
      durationMinutes: 75,
      learningObjectives: [
        'Set effective AI safety objectives',
        'Conduct AI risk assessment during planning',
        'Establish governance structures and responsibilities',
        'Document planning decisions appropriately',
      ],
      content: [
        {
          type: 'lesson',
          title: 'Setting AI Safety Objectives',
          content: `The PLAN phase establishes clear, measurable objectives for AI safety, performance, and ethics. Objectives should be SMART: Specific, Measurable, Achievable, Relevant, and Time-bound.`,
          estimatedMinutes: 20,
        },
        {
          type: 'lesson',
          title: 'Risk Assessment',
          content: `Systematic identification of AI-specific risks including bias, safety, security, and ethical concerns. Risks are prioritized based on likelihood and impact to guide resource allocation.`,
          estimatedMinutes: 25,
        },
        {
          type: 'lesson',
          title: 'Governance and Documentation',
          content: `Establish roles, responsibilities, decision authority, and escalation procedures. Document objectives, risk assessments, resource plans, and success criteria to guide subsequent phases.`,
          estimatedMinutes: 20,
        },
        {
          type: 'interactive',
          title: 'PLAN Phase Exercise',
          content: `Develop a PLAN for an AI system including objectives, risk assessment, and governance structure.`,
          estimatedMinutes: 10,
        },
      ],
      keyTakeaways: [
        'Clear objectives guide all subsequent PDCA activities',
        'Risk assessment identifies and prioritizes AI-specific risks',
        'Governance structures define accountability and decision-making',
        'Documentation enables evaluation and improvement',
      ],
    },
    {
      id: 3,
      title: 'DO Phase',
      description: 'Implementing AI systems with safety-by-design principles.',
      durationMinutes: 75,
      learningObjectives: [
        'Apply safety-by-design in AI implementation',
        'Ensure data quality and governance during development',
        'Conduct comprehensive testing before deployment',
        'Implement human oversight mechanisms',
      ],
      content: [
        {
          type: 'lesson',
          title: 'Safety-by-Design Implementation',
          content: `The DO phase implements the AI system according to planned safety requirements. Safety-by-design principles, responsible development practices, and quality assurance are applied throughout implementation.`,
          estimatedMinutes: 20,
        },
        {
          type: 'lesson',
          title: 'Data and Testing',
          content: `Ensure data quality, privacy compliance, and bias assessment. Comprehensive testing covers safety validation, performance verification, fairness assessment, and robustness evaluation.`,
          estimatedMinutes: 25,
        },
        {
          type: 'lesson',
          title: 'Human Oversight and Deployment',
          content: `Implement human oversight mechanisms as specified in PLAN. Deployment follows controlled approaches with staged rollout and monitoring activation.`,
          estimatedMinutes: 20,
        },
        {
          type: 'case_study',
          title: 'DO Phase Implementation',
          content: `Case study of implementing an AI system following SOAI-PDCA DO phase practices.`,
          estimatedMinutes: 10,
        },
      ],
      keyTakeaways: [
        'Safety-by-design integrates safety throughout implementation',
        'Data quality and comprehensive testing are essential',
        'Human oversight mechanisms must be built in',
        'Controlled deployment with monitoring enables CHECK phase',
      ],
    },
    {
      id: 4,
      title: 'CHECK Phase',
      description: 'Monitoring and evaluating AI system performance.',
      durationMinutes: 75,
      learningObjectives: [
        'Establish comprehensive AI monitoring',
        'Evaluate performance against planned objectives',
        'Detect bias emergence and model drift',
        'Document evaluation findings effectively',
      ],
      content: [
        {
          type: 'lesson',
          title: 'Monitoring Approach',
          content: `The CHECK phase monitors AI system performance, safety, and ethical alignment against planned objectives. Metrics include safety indicators, performance measures, fairness metrics, and compliance status.`,
          estimatedMinutes: 20,
        },
        {
          type: 'lesson',
          title: 'Bias and Drift Detection',
          content: `Ongoing detection of bias emergence, fairness degradation, and model drift. Systematic comparison of actual results against planned objectives identifies gaps requiring action.`,
          estimatedMinutes: 25,
        },
        {
          type: 'lesson',
          title: 'Evaluation and Documentation',
          content: `Evaluation produces findings, identified gaps, and improvement recommendations. Documentation includes monitoring reports, evaluation results, and trend analyses supporting ACT phase decisions.`,
          estimatedMinutes: 20,
        },
        {
          type: 'interactive',
          title: 'CHECK Phase Exercise',
          content: `Develop monitoring and evaluation approaches for an AI system.`,
          estimatedMinutes: 10,
        },
      ],
      keyTakeaways: [
        'Comprehensive monitoring covers safety, performance, and ethics',
        'Bias and drift detection are ongoing activities',
        'Systematic evaluation compares actual to planned performance',
        'Documentation enables informed ACT phase decisions',
      ],
    },
    {
      id: 5,
      title: 'ACT Phase',
      description: 'Taking corrective and preventive actions for continuous improvement.',
      durationMinutes: 75,
      learningObjectives: [
        'Develop effective corrective and preventive actions',
        'Prioritize improvement initiatives appropriately',
        'Verify action effectiveness',
        'Connect ACT phase to next PDCA cycle',
      ],
      content: [
        {
          type: 'lesson',
          title: 'Corrective and Preventive Actions',
          content: `The ACT phase takes corrective actions (fixing identified problems) and preventive actions (preventing recurrence) based on CHECK findings. Root cause analysis ensures actions address underlying causes.`,
          estimatedMinutes: 20,
        },
        {
          type: 'lesson',
          title: 'Prioritization and Verification',
          content: `Improvements are prioritized based on risk severity, impact, and alignment with objectives. Effectiveness verification confirms actions resolved issues and prevent recurrence.`,
          estimatedMinutes: 25,
        },
        {
          type: 'lesson',
          title: 'Organizational Learning',
          content: `ACT captures and disseminates lessons learned. Improvement plans and updated understanding feed into the next PLAN phase, completing the continuous improvement cycle.`,
          estimatedMinutes: 20,
        },
        {
          type: 'case_study',
          title: 'Continuous Improvement in Practice',
          content: `Case study demonstrating multiple PDCA cycles driving continuous improvement in AI governance.`,
          estimatedMinutes: 10,
        },
      ],
      keyTakeaways: [
        'ACT addresses both corrective and preventive actions',
        'Root cause analysis ensures effective solutions',
        'Verification confirms action effectiveness',
        'Lessons learned feed the next PDCA cycle',
      ],
    },
    {
      id: 6,
      title: 'Framework Integration',
      description: 'Integrating SOAI-PDCA with other AI governance frameworks.',
      durationMinutes: 75,
      learningObjectives: [
        'Integrate SOAI-PDCA with ISO 42001',
        'Support EU AI Act compliance through PDCA',
        'Align with NIST AI RMF functions',
        'Create unified multi-framework governance',
      ],
      content: [
        {
          type: 'lesson',
          title: 'ISO 42001 Integration',
          content: `SOAI-PDCA provides the continuous improvement mechanism for ISO 42001 AIMS. PDCA phases align with ISO 42001 clauses for context, planning, support, operation, performance evaluation, and improvement.`,
          estimatedMinutes: 20,
        },
        {
          type: 'lesson',
          title: 'Regulatory Compliance',
          content: `SOAI-PDCA supports EU AI Act and TC260 compliance through systematic risk management, documentation, monitoring, and improvement. PDCA cycles maintain ongoing compliance as requirements evolve.`,
          estimatedMinutes: 25,
        },
        {
          type: 'lesson',
          title: 'Multi-Framework Governance',
          content: `SOAI-PDCA serves as an operational backbone connecting multiple framework requirements. Unified documentation mapped to multiple frameworks reduces duplication while demonstrating comprehensive compliance.`,
          estimatedMinutes: 20,
        },
        {
          type: 'interactive',
          title: 'Integration Mapping Exercise',
          content: `Map SOAI-PDCA phases to requirements from multiple AI governance frameworks.`,
          estimatedMinutes: 10,
        },
      ],
      keyTakeaways: [
        'SOAI-PDCA integrates naturally with ISO 42001 AIMS',
        'PDCA supports ongoing regulatory compliance',
        'Framework serves as operational backbone for multi-framework governance',
        'Unified approach reduces duplication while ensuring comprehensive coverage',
      ],
    },
    {
      id: 7,
      title: 'Metrics and Maturity',
      description: 'Measuring SOAI-PDCA effectiveness and building organizational maturity.',
      durationMinutes: 75,
      learningObjectives: [
        'Identify key metrics for SOAI-PDCA effectiveness',
        'Determine appropriate cycle frequency',
        'Build organizational capability for PDCA execution',
        'Assess and improve SOAI-PDCA maturity',
      ],
      content: [
        {
          type: 'lesson',
          title: 'Effectiveness Metrics',
          content: `Key metrics include safety indicators (incidents, near-misses), cycle time (improvement velocity), improvement rate (issues resolved), and stakeholder satisfaction. Metrics should be tracked over time to demonstrate continuous improvement.`,
          estimatedMinutes: 20,
        },
        {
          type: 'lesson',
          title: 'Cycle Frequency and Resources',
          content: `Cycle frequency depends on AI system risk level, change rate, and organizational context. Higher-risk systems require more frequent cycles. Resources include personnel time, tools, training, and leadership attention.`,
          estimatedMinutes: 25,
        },
        {
          type: 'lesson',
          title: 'Maturity Assessment',
          content: `SOAI-PDCA maturity is assessed by evaluating consistency of execution, depth of analysis, quality of improvements, and organizational learning. Common pitfalls include skipping phases and failure to act on findings.`,
          estimatedMinutes: 20,
        },
        {
          type: 'interactive',
          title: 'Maturity Self-Assessment',
          content: `Self-assessment tool to evaluate current SOAI-PDCA maturity and identify improvement opportunities.`,
          estimatedMinutes: 10,
        },
      ],
      keyTakeaways: [
        'Track metrics including safety indicators, cycle time, and improvement rate',
        'Cycle frequency should match AI system risk level',
        'Build capability through training, tools, and cross-functional teams',
        'Maturity assessment identifies improvement opportunities',
      ],
    },
    {
      id: 8,
      title: 'Implementation Guide',
      description: 'Practical guidance for implementing SOAI-PDCA in organizations.',
      durationMinutes: 75,
      learningObjectives: [
        'Develop SOAI-PDCA implementation approach',
        'Address change management considerations',
        'Sustain SOAI-PDCA practices over time',
        'Handle implementation challenges effectively',
      ],
      content: [
        {
          type: 'lesson',
          title: 'Getting Started',
          content: `Start with piloting SOAI-PDCA on one AI system, learning from experience, then expanding. Establish baseline understanding of current state, define objectives, and develop practical documentation.`,
          estimatedMinutes: 20,
        },
        {
          type: 'lesson',
          title: 'Change Management',
          content: `Address cultural shifts toward continuous improvement, engage stakeholders, and manage resistance proactively. Leadership commitment and adequate resources are critical success factors.`,
          estimatedMinutes: 25,
        },
        {
          type: 'lesson',
          title: 'Sustainability',
          content: `Embed SOAI-PDCA in organizational culture, align incentives with continuous improvement, and integrate cycles into standard processes. Treat setbacks as learning opportunities.`,
          estimatedMinutes: 20,
        },
        {
          type: 'interactive',
          title: 'Implementation Planning',
          content: `Develop a practical implementation plan for SOAI-PDCA in your organization.`,
          estimatedMinutes: 10,
        },
      ],
      keyTakeaways: [
        'Start with pilot implementation, learn, then expand',
        'Address change management including culture and resistance',
        'Embed in culture and processes for sustainability',
        'Treat setbacks as learning opportunities',
      ],
    },
  ],
};

// ============================================================================
// AI SAFETY FUNDAMENTALS COURSE (Foundation Tier)
// ============================================================================
export const aiSafetyFundamentalsCourse: CourseContent = {
  id: 7,
  title: 'AI Safety Fundamentals',
  shortTitle: 'AI Safety Fundamentals',
  description: 'Build a solid foundation in AI safety concepts, terminology, and practices. This essential course covers core safety principles, risk categories, failure modes, and the fundamental concepts every AI safety professional needs to understand.',
  framework: 'AI Safety',
  level: 'fundamentals',
  totalDurationHours: 4,
  certificationType: 'AI Safety Fundamentals Certificate',
  prerequisites: [],
  finalExamInfo: {
    questionCount: 40,
    passingScore: 70,
    timeLimit: 60,
  },
  modules: [
    {
      id: 1,
      title: 'Introduction to AI Safety',
      description: 'Core concepts, historical incidents, and the importance of AI safety.',
      durationMinutes: 60,
      learningObjectives: [
        'Define AI safety and its primary goals',
        'Understand key historical AI safety incidents',
        'Identify the three main risk categories: Safety, Fairness, Compliance',
        'Explain fundamental AI safety terminology',
      ],
      content: [
        { type: 'lesson', title: 'What is AI Safety?', content: 'Introduction to AI safety as a discipline focused on ensuring AI systems operate as intended without causing unintended harm.', estimatedMinutes: 15 },
        { type: 'lesson', title: 'Historical AI Incidents', content: 'Analysis of key incidents including Microsoft Tay, Amazon recruitment bias, and others that shaped the field.', estimatedMinutes: 20 },
        { type: 'lesson', title: 'Risk Categories Framework', content: 'Understanding Safety, Fairness, and Compliance as the three pillars of AI risk.', estimatedMinutes: 15 },
        { type: 'interactive', title: 'Risk Category Identification', content: 'Practice categorizing AI risks into the three main categories.', estimatedMinutes: 10 },
      ],
      keyTakeaways: ['AI safety ensures systems operate as intended', 'Historical incidents inform current practices', 'Three risk categories: Safety, Fairness, Compliance'],
    },
    {
      id: 2,
      title: 'AI Robustness and Security',
      description: 'Understanding robustness, adversarial attacks, and security considerations.',
      durationMinutes: 60,
      learningObjectives: [
        'Define robustness in AI systems',
        'Understand adversarial attacks and defenses',
        'Explain data poisoning and other security threats',
        'Apply principles of secure AI development',
      ],
      content: [
        { type: 'lesson', title: 'Robustness Fundamentals', content: 'Understanding how AI systems maintain performance under varying conditions.', estimatedMinutes: 20 },
        { type: 'lesson', title: 'Adversarial Attacks', content: 'How small perturbations can fool AI systems and defense strategies.', estimatedMinutes: 20 },
        { type: 'lesson', title: 'Data Security in AI', content: 'Data poisoning, privacy attacks, and securing training data.', estimatedMinutes: 15 },
        { type: 'interactive', title: 'Security Threat Analysis', content: 'Identify potential security threats in AI system scenarios.', estimatedMinutes: 5 },
      ],
      keyTakeaways: ['Robustness ensures reliable performance under varying conditions', 'Adversarial attacks are a key security concern', 'Data security is fundamental to AI safety'],
    },
    {
      id: 3,
      title: 'Safety-Critical AI Systems',
      description: 'Understanding high-stakes AI applications and their safety requirements.',
      durationMinutes: 60,
      learningObjectives: [
        'Identify safety-critical AI applications',
        'Understand failure modes and their consequences',
        'Apply incident analysis and reporting practices',
        'Design systems for graceful degradation',
      ],
      content: [
        { type: 'lesson', title: 'Safety-Critical Applications', content: 'Medical AI, autonomous vehicles, industrial control systems, and other high-stakes applications.', estimatedMinutes: 20 },
        { type: 'lesson', title: 'Failure Modes', content: 'Catastrophic forgetting, distribution shift, emergent behavior, and other failure modes.', estimatedMinutes: 20 },
        { type: 'lesson', title: 'Incident Analysis', content: 'AI incident databases and learning from failures.', estimatedMinutes: 15 },
        { type: 'case_study', title: 'Safety Incident Analysis', content: 'Analyze a real-world AI safety incident and identify lessons learned.', estimatedMinutes: 5 },
      ],
      keyTakeaways: ['Safety-critical AI requires extra vigilance', 'Understanding failure modes prevents incidents', 'Learning from incidents improves safety'],
    },
    {
      id: 4,
      title: 'AI Safety Practices and Culture',
      description: 'Implementing safety practices and building organizational safety culture.',
      durationMinutes: 60,
      learningObjectives: [
        'Apply defense in depth strategies',
        'Implement staged deployment practices',
        'Build organizational safety culture',
        'Understand the relationship between AI safety and ethics',
      ],
      content: [
        { type: 'lesson', title: 'Safety Engineering Principles', content: 'Precautionary principle, defense in depth, fail-safe design, and capability control.', estimatedMinutes: 20 },
        { type: 'lesson', title: 'Deployment Practices', content: 'Staged deployment, red teaming, safety testing, and monitoring.', estimatedMinutes: 20 },
        { type: 'lesson', title: 'Safety Culture', content: 'Building organizational values and practices that prioritize safety.', estimatedMinutes: 15 },
        { type: 'interactive', title: 'Safety Culture Assessment', content: 'Evaluate safety culture elements in organizational scenarios.', estimatedMinutes: 5 },
      ],
      keyTakeaways: ['Defense in depth provides multiple safety layers', 'Staged deployment catches issues early', 'Safety culture is essential for sustainable AI safety'],
    },
  ],
};

// ============================================================================
// ETHICS & BIAS DETECTION COURSE (Foundation Tier)
// ============================================================================
export const ethicsBiasDetectionCourse: CourseContent = {
  id: 8,
  title: 'Ethics & Bias Detection',
  shortTitle: 'Ethics & Bias',
  description: 'Learn to identify and mitigate bias in AI systems. This course covers types of bias, fairness metrics, detection techniques, and mitigation strategies essential for building fair and ethical AI.',
  framework: 'AI Ethics',
  level: 'fundamentals',
  totalDurationHours: 2,
  certificationType: 'AI Ethics & Bias Detection Certificate',
  prerequisites: [],
  finalExamInfo: {
    questionCount: 30,
    passingScore: 70,
    timeLimit: 45,
  },
  modules: [
    {
      id: 1,
      title: 'Understanding AI Bias',
      description: 'Types of bias, sources, and real-world impacts.',
      durationMinutes: 60,
      learningObjectives: [
        'Define algorithmic bias and its impacts',
        'Identify different types of bias in AI systems',
        'Understand historical and representation bias',
        'Recognize intersectionality in AI bias',
      ],
      content: [
        { type: 'lesson', title: 'What is Algorithmic Bias?', content: 'Understanding systematic errors that create unfair outcomes.', estimatedMinutes: 15 },
        { type: 'lesson', title: 'Types of Bias', content: 'Historical, representation, measurement, and automation bias.', estimatedMinutes: 20 },
        { type: 'case_study', title: 'Bias Case Studies', content: 'Amazon recruitment, facial recognition, and other notable bias incidents.', estimatedMinutes: 15 },
        { type: 'lesson', title: 'Fairness Metrics', content: 'Demographic parity, equalized odds, and other fairness definitions.', estimatedMinutes: 10 },
      ],
      keyTakeaways: ['Algorithmic bias creates systematic unfair outcomes', 'Multiple types of bias can affect AI systems', 'Intersectionality creates unique bias experiences'],
    },
    {
      id: 2,
      title: 'Bias Detection and Mitigation',
      description: 'Techniques for detecting and addressing bias in AI systems.',
      durationMinutes: 60,
      learningObjectives: [
        'Apply bias detection techniques',
        'Understand pre-processing, in-processing, and post-processing mitigation',
        'Conduct fairness audits',
        'Navigate fairness trade-offs and impossibility results',
      ],
      content: [
        { type: 'lesson', title: 'Detection Techniques', content: 'Confusion matrices, disparate impact analysis, and fairness testing.', estimatedMinutes: 15 },
        { type: 'lesson', title: 'Mitigation Strategies', content: 'Pre-processing (reweighting), in-processing (fairness constraints), and post-processing (threshold adjustment).', estimatedMinutes: 20 },
        { type: 'lesson', title: 'Fairness Audits', content: 'Conducting systematic fairness assessments of AI systems.', estimatedMinutes: 15 },
        { type: 'interactive', title: 'Fairness Analysis Exercise', content: 'Analyze a dataset for potential bias issues.', estimatedMinutes: 10 },
      ],
      keyTakeaways: ['Multiple techniques exist for detecting bias', 'Mitigation can occur at different stages', 'Some fairness criteria cannot all be satisfied simultaneously'],
    },
  ],
};

// ============================================================================
// REGULATORY COMPLIANCE OVERVIEW COURSE (Foundation Tier)
// ============================================================================
export const regulatoryComplianceCourse: CourseContent = {
  id: 9,
  title: 'Regulatory Compliance Overview',
  shortTitle: 'Regulatory Overview',
  description: 'Get a comprehensive overview of global AI regulations including the EU AI Act, NIST AI RMF, TC260, and ISO 42001. Understand compliance requirements and how different frameworks interact.',
  framework: 'Regulatory Compliance',
  level: 'fundamentals',
  totalDurationHours: 2,
  certificationType: 'AI Regulatory Compliance Overview Certificate',
  prerequisites: [],
  finalExamInfo: {
    questionCount: 30,
    passingScore: 70,
    timeLimit: 45,
  },
  modules: [
    {
      id: 1,
      title: 'Global AI Regulatory Landscape',
      description: 'Overview of major AI regulations worldwide.',
      durationMinutes: 60,
      learningObjectives: [
        'Understand the EU AI Act risk-based approach',
        'Explain the NIST AI RMF core functions',
        'Describe TC260 and ISO 42001 frameworks',
        'Compare regulatory approaches across jurisdictions',
      ],
      content: [
        { type: 'lesson', title: 'EU AI Act Overview', content: 'The first comprehensive AI regulation and its risk-based approach.', estimatedMinutes: 15 },
        { type: 'lesson', title: 'NIST AI RMF', content: 'Voluntary US framework with Govern, Map, Measure, Manage functions.', estimatedMinutes: 15 },
        { type: 'lesson', title: 'TC260 and ISO 42001', content: 'China\'s AI governance standards and international AI management systems.', estimatedMinutes: 15 },
        { type: 'lesson', title: 'Comparing Approaches', content: 'Mandatory vs voluntary, risk-based vs principles-based regulation.', estimatedMinutes: 15 },
      ],
      keyTakeaways: ['EU AI Act is the first comprehensive AI regulation', 'NIST AI RMF provides voluntary guidance', 'Multiple frameworks may apply to organizations'],
    },
    {
      id: 2,
      title: 'Compliance Requirements and Implementation',
      description: 'Understanding compliance processes and documentation requirements.',
      durationMinutes: 60,
      learningObjectives: [
        'Explain conformity assessment requirements',
        'Understand notified bodies and regulatory sandboxes',
        'Describe documentation and post-market monitoring requirements',
        'Navigate extraterritorial scope implications',
      ],
      content: [
        { type: 'lesson', title: 'Conformity Assessment', content: 'Self-assessment vs third-party assessment and harmonized standards.', estimatedMinutes: 15 },
        { type: 'lesson', title: 'Regulatory Mechanisms', content: 'Notified bodies, regulatory sandboxes, and AI registries.', estimatedMinutes: 15 },
        { type: 'lesson', title: 'Documentation and Monitoring', content: 'Technical documentation, post-market surveillance, and compliance gaps.', estimatedMinutes: 15 },
        { type: 'lesson', title: 'Penalties and Enforcement', content: 'Fines, enforcement mechanisms, and the right to explanation.', estimatedMinutes: 15 },
      ],
      keyTakeaways: ['Conformity assessment verifies regulatory compliance', 'Regulatory sandboxes support innovation', 'Significant penalties apply for non-compliance'],
    },
  ],
};

// ============================================================================
// UK AI REGULATION COURSE (Regional Specialization)
// ============================================================================
export const ukAiRegulationCourse: CourseContent = {
  id: 10,
  title: 'UK AI Regulation',
  shortTitle: 'UK AI Regulation',
  description: 'Master the UK\'s pro-innovation approach to AI regulation. Learn about the sector-based regulatory framework, cross-cutting principles, and how different regulators oversee AI in their domains.',
  framework: 'UK AI Regulation',
  level: 'advanced',
  totalDurationHours: 3,
  certificationType: 'UK AI Regulation Specialist',
  prerequisites: ['Regulatory Compliance Overview'],
  finalExamInfo: {
    questionCount: 45,
    passingScore: 75,
    timeLimit: 60,
  },
  modules: [
    {
      id: 1,
      title: 'UK AI Regulatory Framework',
      description: 'Understanding the UK\'s pro-innovation approach and five cross-cutting principles.',
      durationMinutes: 60,
      learningObjectives: [
        'Explain the UK\'s sector-based regulatory approach',
        'Identify the five cross-cutting AI principles',
        'Understand the role of the DRCF in coordinating regulation',
        'Compare UK and EU approaches to AI regulation',
      ],
      content: [
        { type: 'lesson', title: 'Pro-Innovation Approach', content: 'The UK\'s alternative to horizontal legislation.', estimatedMinutes: 15 },
        { type: 'lesson', title: 'Five Principles', content: 'Safety, Transparency, Fairness, Accountability, Contestability.', estimatedMinutes: 20 },
        { type: 'lesson', title: 'Regulatory Coordination', content: 'DRCF and coordination between ICO, CMA, Ofcom, and FCA.', estimatedMinutes: 15 },
        { type: 'lesson', title: 'UK vs EU Comparison', content: 'Key differences and implications for organizations in both jurisdictions.', estimatedMinutes: 10 },
      ],
      keyTakeaways: ['UK uses sector-based rather than horizontal regulation', 'Five cross-cutting principles guide AI regulation', 'Organizations may need to comply with both UK and EU requirements'],
    },
    {
      id: 2,
      title: 'Sector-Specific AI Regulation',
      description: 'How different UK regulators approach AI in their sectors.',
      durationMinutes: 60,
      learningObjectives: [
        'Explain ICO requirements for AI processing personal data',
        'Understand FCA and APRA guidance for financial AI',
        'Describe CMA competition concerns for AI markets',
        'Navigate multi-regulator compliance requirements',
      ],
      content: [
        { type: 'lesson', title: 'ICO and Data Protection', content: 'UK GDPR, automated decision-making rights, and AI transparency.', estimatedMinutes: 15 },
        { type: 'lesson', title: 'Financial Services AI', content: 'FCA and APRA guidance on model risk and consumer protection.', estimatedMinutes: 15 },
        { type: 'lesson', title: 'Competition and AI', content: 'CMA focus on market power, algorithmic collusion, and fair access.', estimatedMinutes: 15 },
        { type: 'lesson', title: 'Multi-Regulator Navigation', content: 'Managing compliance across multiple sector regulators.', estimatedMinutes: 15 },
      ],
      keyTakeaways: ['ICO enforces UK GDPR for AI processing personal data', 'Financial regulators have specific AI guidance', 'Multiple regulators may oversee a single AI system'],
    },
    {
      id: 3,
      title: 'UK AI Safety and Future Developments',
      description: 'The AI Safety Institute and evolving UK AI governance.',
      durationMinutes: 60,
      learningObjectives: [
        'Understand the role of the UK AI Safety Institute',
        'Describe the UK approach to frontier AI oversight',
        'Explain AI assurance and governance requirements',
        'Anticipate potential future UK AI legislation',
      ],
      content: [
        { type: 'lesson', title: 'AI Safety Institute', content: 'Government-backed research and evaluation for AI safety.', estimatedMinutes: 15 },
        { type: 'lesson', title: 'Frontier AI Oversight', content: 'UK approach to general-purpose and frontier models.', estimatedMinutes: 15 },
        { type: 'lesson', title: 'AI Assurance', content: 'Testing, verification, and validation frameworks.', estimatedMinutes: 15 },
        { type: 'lesson', title: 'Future Developments', content: 'Potential mandatory legislation and evolving guidance.', estimatedMinutes: 15 },
      ],
      keyTakeaways: ['AI Safety Institute focuses on frontier model evaluation', 'UK may introduce targeted mandatory legislation', 'AI assurance frameworks support responsible deployment'],
    },
  ],
};

// ============================================================================
// CANADA AIDA COURSE (Regional Specialization)
// ============================================================================
export const canadaAidaCourse: CourseContent = {
  id: 11,
  title: 'Canada AIDA',
  shortTitle: 'Canada AIDA',
  description: 'Comprehensive coverage of Canada\'s Artificial Intelligence and Data Act (AIDA) and related regulations. Understand high-impact AI requirements, the role of the AI and Data Commissioner, and compliance obligations.',
  framework: 'Canada AIDA',
  level: 'advanced',
  totalDurationHours: 3,
  certificationType: 'Canada AI Compliance Specialist',
  prerequisites: ['Regulatory Compliance Overview'],
  finalExamInfo: {
    questionCount: 45,
    passingScore: 75,
    timeLimit: 60,
  },
  modules: [
    {
      id: 1,
      title: 'Introduction to AIDA',
      description: 'Understanding Bill C-27 and Canada\'s AI regulatory approach.',
      durationMinutes: 60,
      learningObjectives: [
        'Explain AIDA within the context of Bill C-27',
        'Define high-impact AI systems under AIDA',
        'Understand the role of the AI and Data Commissioner',
        'Compare AIDA with PIPEDA and provincial privacy laws',
      ],
      content: [
        { type: 'lesson', title: 'Bill C-27 Overview', content: 'Digital Charter Implementation Act including CPPA and AIDA.', estimatedMinutes: 15 },
        { type: 'lesson', title: 'High-Impact AI Systems', content: 'Criteria and requirements for high-impact classification.', estimatedMinutes: 15 },
        { type: 'lesson', title: 'AI and Data Commissioner', content: 'Enforcement, investigation, and compliance powers.', estimatedMinutes: 15 },
        { type: 'lesson', title: 'Privacy Law Integration', content: 'PIPEDA, CPPA, and provincial laws like Quebec\'s Law 25.', estimatedMinutes: 15 },
      ],
      keyTakeaways: ['AIDA is part of comprehensive digital reform', 'High-impact AI faces significant requirements', 'Multiple privacy laws may apply alongside AIDA'],
    },
    {
      id: 2,
      title: 'AIDA Compliance Requirements',
      description: 'Obligations for organizations operating high-impact AI systems.',
      durationMinutes: 60,
      learningObjectives: [
        'Explain AIDA transparency and explanation requirements',
        'Understand bias prevention and testing obligations',
        'Describe documentation and audit requirements',
        'Navigate penalties for AIDA violations',
      ],
      content: [
        { type: 'lesson', title: 'Transparency Requirements', content: 'Publishing descriptions and providing plain-language explanations.', estimatedMinutes: 15 },
        { type: 'lesson', title: 'Bias Prevention', content: 'Requirements to prevent biased output based on prohibited grounds.', estimatedMinutes: 15 },
        { type: 'lesson', title: 'Documentation and Audits', content: 'Record-keeping requirements and audit powers.', estimatedMinutes: 15 },
        { type: 'lesson', title: 'Penalties and Harm', content: 'Fines up to $25M CAD and criminal offenses for causing harm.', estimatedMinutes: 15 },
      ],
      keyTakeaways: ['Transparency is a core AIDA requirement', 'Bias prevention is explicitly required', 'Significant penalties apply for violations'],
    },
    {
      id: 3,
      title: 'Canadian AI Governance Ecosystem',
      description: 'Government AI directives, impact assessments, and cross-border considerations.',
      durationMinutes: 60,
      learningObjectives: [
        'Apply the Directive on Automated Decision-Making',
        'Conduct Algorithmic Impact Assessments',
        'Navigate cross-border AI service requirements',
        'Understand Canadian AI governance best practices',
      ],
      content: [
        { type: 'lesson', title: 'Government AI Directive', content: 'Treasury Board requirements for federal government AI.', estimatedMinutes: 15 },
        { type: 'lesson', title: 'Algorithmic Impact Assessment', content: 'AIA tool and methodology for government AI systems.', estimatedMinutes: 15 },
        { type: 'lesson', title: 'Cross-Border Services', content: 'Requirements for AI services operating across borders.', estimatedMinutes: 15 },
        { type: 'lesson', title: 'Challenge Rights', content: 'Individual rights to explanation, human review, and complaint mechanisms.', estimatedMinutes: 15 },
      ],
      keyTakeaways: ['Federal government has specific AI requirements', 'AIAs are mandatory for government AI', 'Individuals have rights to challenge AI decisions'],
    },
  ],
};

// ============================================================================
// AUSTRALIA AI ETHICS COURSE (Regional Specialization)
// ============================================================================
export const australiaAiEthicsCourse: CourseContent = {
  id: 12,
  title: 'Australia AI Ethics',
  shortTitle: 'Australia AI Ethics',
  description: 'Explore Australia\'s AI Ethics Framework and regulatory approach. Learn about the eight core principles, sector-specific regulations, and the evolving landscape toward potential mandatory requirements.',
  framework: 'Australia AI Ethics',
  level: 'advanced',
  totalDurationHours: 3,
  certificationType: 'Australia AI Ethics Specialist',
  prerequisites: ['Regulatory Compliance Overview'],
  finalExamInfo: {
    questionCount: 45,
    passingScore: 75,
    timeLimit: 60,
  },
  modules: [
    {
      id: 1,
      title: 'Australia AI Ethics Framework',
      description: 'The eight core principles and voluntary framework approach.',
      durationMinutes: 60,
      learningObjectives: [
        'Explain Australia\'s current voluntary AI ethics approach',
        'Identify and apply the eight core AI ethics principles',
        'Understand the role of the Australian Human Rights Commission',
        'Describe how the Privacy Act 1988 applies to AI',
      ],
      content: [
        { type: 'lesson', title: 'Framework Overview', content: 'Voluntary approach combined with sector-specific regulations.', estimatedMinutes: 15 },
        { type: 'lesson', title: 'Eight Core Principles', content: 'Human-centred values, fairness, privacy, reliability, transparency, contestability, accountability, human oversight.', estimatedMinutes: 20 },
        { type: 'lesson', title: 'Human Rights and AI', content: 'AHRC role in AI governance and discrimination concerns.', estimatedMinutes: 15 },
        { type: 'lesson', title: 'Privacy Act Application', content: 'How Australian privacy law applies to AI systems.', estimatedMinutes: 10 },
      ],
      keyTakeaways: ['Australia uses a voluntary framework with eight principles', 'Human-centred values and contestability are core requirements', 'Privacy Act applies to AI processing personal information'],
    },
    {
      id: 2,
      title: 'Sector-Specific AI Governance',
      description: 'How different Australian regulators oversee AI in their sectors.',
      durationMinutes: 60,
      learningObjectives: [
        'Explain TGA regulation of AI medical devices',
        'Understand APRA and ASIC financial AI guidance',
        'Describe ACCC consumer protection for AI products',
        'Navigate multi-regulator requirements',
      ],
      content: [
        { type: 'lesson', title: 'Healthcare AI Regulation', content: 'TGA oversight of AI as medical devices.', estimatedMinutes: 15 },
        { type: 'lesson', title: 'Financial Services AI', content: 'APRA and ASIC guidance on AI use in financial services.', estimatedMinutes: 15 },
        { type: 'lesson', title: 'Consumer Protection', content: 'ACCC enforcement and deceptive AI claims.', estimatedMinutes: 15 },
        { type: 'lesson', title: 'Consumer Data Right', content: 'CDR implications for AI accessing consumer data.', estimatedMinutes: 15 },
      ],
      keyTakeaways: ['TGA regulates AI as software as medical device', 'Financial regulators have specific AI expectations', 'ACCC addresses consumer protection in AI markets'],
    },
    {
      id: 3,
      title: 'Future of Australian AI Regulation',
      description: 'Evolving landscape toward potential mandatory requirements.',
      durationMinutes: 60,
      learningObjectives: [
        'Understand Safe and Responsible AI consultation outcomes',
        'Anticipate potential mandatory guardrails for high-risk AI',
        'Explain Online Safety Act implications for AI content',
        'Prepare for evolving Australian AI requirements',
      ],
      content: [
        { type: 'lesson', title: 'Safe and Responsible AI', content: 'Government consultation on mandatory high-risk AI guardrails.', estimatedMinutes: 15 },
        { type: 'lesson', title: 'Potential Mandatory Requirements', content: 'Possible future legislation for high-risk AI applications.', estimatedMinutes: 15 },
        { type: 'lesson', title: 'Online Safety and AI', content: 'Online Safety Act implications for AI-generated content.', estimatedMinutes: 15 },
        { type: 'lesson', title: 'Preparing for Change', content: 'Best practices for adapting to evolving requirements.', estimatedMinutes: 15 },
      ],
      keyTakeaways: ['Australia is consulting on mandatory AI requirements', 'High-risk AI may face mandatory guardrails', 'Organizations should prepare for evolving requirements'],
    },
  ],
};

// ============================================================================
// HEALTHCARE AI SAFETY COURSE (Industry Specialization)
// ============================================================================
export const healthcareAiSafetyCourse: CourseContent = {
  id: 13,
  title: 'Healthcare AI Safety',
  shortTitle: 'Healthcare AI',
  description: 'Master the safety requirements for AI in healthcare settings. Covers FDA regulation of AI medical devices, clinical validation, patient safety, and the unique challenges of deploying AI in clinical environments.',
  framework: 'Healthcare AI Safety',
  level: 'specialist',
  totalDurationHours: 3,
  certificationType: 'Healthcare AI Safety Specialist',
  prerequisites: ['AI Safety Fundamentals'],
  finalExamInfo: {
    questionCount: 45,
    passingScore: 75,
    timeLimit: 60,
  },
  modules: [
    {
      id: 1,
      title: 'Medical AI Regulation',
      description: 'FDA, EU MDR, and regulatory requirements for AI medical devices.',
      durationMinutes: 60,
      learningObjectives: [
        'Explain Software as a Medical Device (SaMD) classification',
        'Understand FDA regulatory pathways for AI medical devices',
        'Describe clinical validation requirements',
        'Navigate predetermined change control plans for AI updates',
      ],
      content: [
        { type: 'lesson', title: 'SaMD Classification', content: 'Understanding software intended for medical purposes.', estimatedMinutes: 15 },
        { type: 'lesson', title: 'FDA AI Regulation', content: 'Regulatory pathways and approval requirements.', estimatedMinutes: 15 },
        { type: 'lesson', title: 'Clinical Validation', content: 'Demonstrating AI performance in clinical conditions.', estimatedMinutes: 15 },
        { type: 'lesson', title: 'Continuous Learning AI', content: 'Predetermined change control plans and locked algorithms.', estimatedMinutes: 15 },
      ],
      keyTakeaways: ['SaMD classification determines regulatory requirements', 'Clinical validation is essential for medical AI', 'Continuously learning AI requires special regulatory consideration'],
    },
    {
      id: 2,
      title: 'Clinical Safety Requirements',
      description: 'Patient safety, bias in healthcare AI, and adverse event management.',
      durationMinutes: 60,
      learningObjectives: [
        'Apply HIPAA requirements to AI systems',
        'Identify and mitigate algorithmic bias in healthcare AI',
        'Understand adverse event reporting requirements',
        'Implement post-market surveillance for medical AI',
      ],
      content: [
        { type: 'lesson', title: 'HIPAA and AI', content: 'Privacy and security requirements for healthcare AI.', estimatedMinutes: 15 },
        { type: 'lesson', title: 'Healthcare AI Bias', content: 'Bias affecting diagnostic accuracy across patient populations.', estimatedMinutes: 15 },
        { type: 'lesson', title: 'Adverse Events', content: 'Reporting requirements when AI may cause patient harm.', estimatedMinutes: 15 },
        { type: 'lesson', title: 'Post-Market Surveillance', content: 'Ongoing monitoring of AI device safety and performance.', estimatedMinutes: 15 },
      ],
      keyTakeaways: ['HIPAA applies to AI processing protected health information', 'Healthcare AI bias can affect patient outcomes', 'Adverse events must be reported to regulators'],
    },
    {
      id: 3,
      title: 'Clinical Integration and Human Oversight',
      description: 'Integrating AI into clinical workflows with appropriate human oversight.',
      durationMinutes: 60,
      learningObjectives: [
        'Design AI-assisted vs AI-autonomous diagnostic systems',
        'Implement appropriate human oversight in clinical AI',
        'Address alert fatigue and clinical workflow integration',
        'Apply human-AI teaming principles in healthcare',
      ],
      content: [
        { type: 'lesson', title: 'AI-Assisted vs Autonomous', content: 'Appropriate levels of AI independence in clinical decisions.', estimatedMinutes: 15 },
        { type: 'lesson', title: 'Human Oversight', content: 'Ensuring clinicians maintain meaningful control.', estimatedMinutes: 15 },
        { type: 'lesson', title: 'Clinical Integration', content: 'Workflow integration and addressing alert fatigue.', estimatedMinutes: 15 },
        { type: 'lesson', title: 'Human-AI Teaming', content: 'Collaborative approach to AI in healthcare.', estimatedMinutes: 15 },
      ],
      keyTakeaways: ['AI-assisted systems maintain clinician oversight', 'Alert fatigue can undermine AI safety benefits', 'Human-AI teaming combines AI capabilities with clinical judgment'],
    },
  ],
};

// ============================================================================
// FINANCIAL TRADING AI COURSE (Industry Specialization)
// ============================================================================
export const financialTradingAiCourse: CourseContent = {
  id: 14,
  title: 'Financial Trading AI',
  shortTitle: 'Financial Trading AI',
  description: 'Comprehensive coverage of AI safety in financial trading. Covers algorithmic trading regulations, market manipulation prevention, model risk management, and systemic risk considerations.',
  framework: 'Financial Trading AI',
  level: 'specialist',
  totalDurationHours: 3,
  certificationType: 'Financial Trading AI Safety Specialist',
  prerequisites: ['AI Safety Fundamentals'],
  finalExamInfo: {
    questionCount: 45,
    passingScore: 75,
    timeLimit: 60,
  },
  modules: [
    {
      id: 1,
      title: 'Algorithmic Trading Fundamentals',
      description: 'Introduction to AI in financial trading and associated risks.',
      durationMinutes: 60,
      learningObjectives: [
        'Define algorithmic and high-frequency trading',
        'Understand flash crashes and systemic risk',
        'Explain SEC and FINRA oversight of algorithmic trading',
        'Identify market manipulation using AI',
      ],
      content: [
        { type: 'lesson', title: 'Algorithmic Trading Overview', content: 'Automated trading using AI and predefined rules.', estimatedMinutes: 15 },
        { type: 'lesson', title: 'High-Frequency Trading', content: 'HFT characteristics, benefits, and risks.', estimatedMinutes: 15 },
        { type: 'lesson', title: 'Regulatory Oversight', content: 'SEC, FINRA, and their roles in algorithmic trading oversight.', estimatedMinutes: 15 },
        { type: 'lesson', title: 'Market Manipulation', content: 'Spoofing, layering, and other prohibited practices.', estimatedMinutes: 15 },
      ],
      keyTakeaways: ['Algorithmic trading requires robust safety controls', 'Flash crashes demonstrate systemic risk', 'Market manipulation using AI is a serious offense'],
    },
    {
      id: 2,
      title: 'Trading AI Risk Management',
      description: 'Model risk, pre-trade controls, and best execution obligations.',
      durationMinutes: 60,
      learningObjectives: [
        'Apply SR 11-7 model risk management guidance',
        'Implement pre-trade risk controls',
        'Understand best execution obligations for AI',
        'Design kill switches and circuit breakers',
      ],
      content: [
        { type: 'lesson', title: 'Model Risk Management', content: 'SR 11-7 requirements and model validation.', estimatedMinutes: 15 },
        { type: 'lesson', title: 'Pre-Trade Controls', content: 'Price collars, position limits, and message rate limits.', estimatedMinutes: 15 },
        { type: 'lesson', title: 'Best Execution', content: 'Regulatory obligations for trade execution quality.', estimatedMinutes: 15 },
        { type: 'lesson', title: 'Safety Mechanisms', content: 'Kill switches, circuit breakers, and emergency procedures.', estimatedMinutes: 15 },
      ],
      keyTakeaways: ['Model validation is required for trading AI', 'Pre-trade controls prevent erroneous trades', 'Kill switches are mandatory safety mechanisms'],
    },
    {
      id: 3,
      title: 'Trading AI Governance and Compliance',
      description: 'MiFID II requirements, algorithm tagging, and market surveillance.',
      durationMinutes: 60,
      learningObjectives: [
        'Apply MiFID II algorithmic trading requirements',
        'Implement algorithm tagging and surveillance',
        'Conduct stress testing for trading AI',
        'Address robo-advisory fiduciary obligations',
      ],
      content: [
        { type: 'lesson', title: 'MiFID II Requirements', content: 'EU requirements for algorithmic trading systems.', estimatedMinutes: 15 },
        { type: 'lesson', title: 'Algorithm Tagging', content: 'Unique identifiers for surveillance and accountability.', estimatedMinutes: 15 },
        { type: 'lesson', title: 'Stress Testing', content: 'Evaluating trading AI under extreme market conditions.', estimatedMinutes: 15 },
        { type: 'lesson', title: 'Robo-Advisory', content: 'Fiduciary obligations for AI financial advisors.', estimatedMinutes: 15 },
      ],
      keyTakeaways: ['MiFID II applies to EU algorithmic trading', 'Algorithm tagging enables accountability', 'Robo-advisors have fiduciary obligations'],
    },
  ],
};

// ============================================================================
// AUTONOMOUS VEHICLES COURSE (Industry Specialization)
// ============================================================================
export const autonomousVehiclesCourse: CourseContent = {
  id: 15,
  title: 'Autonomous Vehicles',
  shortTitle: 'Autonomous Vehicles',
  description: 'Comprehensive safety course for autonomous vehicles. Covers SAE automation levels, safety standards, regulatory requirements, and the unique challenges of deploying AI in vehicles.',
  framework: 'Autonomous Vehicles',
  level: 'specialist',
  totalDurationHours: 3,
  certificationType: 'Autonomous Vehicle Safety Specialist',
  prerequisites: ['AI Safety Fundamentals'],
  finalExamInfo: {
    questionCount: 45,
    passingScore: 75,
    timeLimit: 60,
  },
  modules: [
    {
      id: 1,
      title: 'AV Safety Fundamentals',
      description: 'SAE levels, operational design domains, and core safety concepts.',
      durationMinutes: 60,
      learningObjectives: [
        'Explain SAE levels 0-5 of driving automation',
        'Define Operational Design Domain (ODD)',
        'Understand safety driver requirements and disengagement reporting',
        'Analyze AV liability considerations',
      ],
      content: [
        { type: 'lesson', title: 'SAE Automation Levels', content: 'Levels 0-5 from no automation to full automation.', estimatedMinutes: 15 },
        { type: 'lesson', title: 'Operational Design Domain', content: 'Defining where autonomous systems can safely operate.', estimatedMinutes: 15 },
        { type: 'lesson', title: 'Safety Drivers', content: 'Human oversight during AV testing and operation.', estimatedMinutes: 15 },
        { type: 'lesson', title: 'Liability Framework', content: 'Complex liability questions in AV accidents.', estimatedMinutes: 15 },
      ],
      keyTakeaways: ['SAE levels define automation capability', 'ODD specifies safe operating conditions', 'Liability frameworks are still evolving'],
    },
    {
      id: 2,
      title: 'AV Safety Standards and Testing',
      description: 'ISO 26262, SOTIF, and comprehensive AV testing approaches.',
      durationMinutes: 60,
      learningObjectives: [
        'Apply ISO 26262 functional safety requirements',
        'Understand SOTIF (ISO 21448) for intended functionality',
        'Design scenario-based testing programs',
        'Implement validation and verification approaches',
      ],
      content: [
        { type: 'lesson', title: 'ISO 26262', content: 'Functional safety for automotive electrical systems.', estimatedMinutes: 15 },
        { type: 'lesson', title: 'SOTIF', content: 'Safety of the intended functionality beyond system failures.', estimatedMinutes: 15 },
        { type: 'lesson', title: 'Scenario-Based Testing', content: 'Systematic testing using defined driving scenarios.', estimatedMinutes: 15 },
        { type: 'lesson', title: 'Validation vs Verification', content: 'Building correctly vs building the right thing.', estimatedMinutes: 15 },
      ],
      keyTakeaways: ['ISO 26262 addresses system failures', 'SOTIF addresses functional limitations', 'Comprehensive testing is essential for AV safety'],
    },
    {
      id: 3,
      title: 'AV Regulation and Deployment',
      description: 'NHTSA requirements, international regulations, and deployment considerations.',
      durationMinutes: 60,
      learningObjectives: [
        'Navigate NHTSA autonomous vehicle guidance',
        'Understand UNECE WP.29 international regulations',
        'Address cybersecurity and V2X communication security',
        'Implement safety cases for AV deployment',
      ],
      content: [
        { type: 'lesson', title: 'NHTSA Guidance', content: 'US federal autonomous vehicle safety framework.', estimatedMinutes: 15 },
        { type: 'lesson', title: 'International Regulations', content: 'UNECE WP.29 and global harmonization efforts.', estimatedMinutes: 15 },
        { type: 'lesson', title: 'Cybersecurity', content: 'Protecting AVs from hacking and malicious interference.', estimatedMinutes: 15 },
        { type: 'lesson', title: 'Safety Cases', content: 'Building evidence-based arguments for AV safety.', estimatedMinutes: 15 },
      ],
      keyTakeaways: ['NHTSA provides federal AV guidance', 'International harmonization is progressing', 'Cybersecurity is critical for AV safety'],
    },
  ],
};

// Export all courses
export const allCourses: CourseContent[] = [
  euAiActCourse,
  nistAiRmfCourse,
  iso42001Course,
  tc260Course,
  maternalCovenantCourse,
  soaiPdcaCourse,
  aiSafetyFundamentalsCourse,
  ethicsBiasDetectionCourse,
  regulatoryComplianceCourse,
  ukAiRegulationCourse,
  canadaAidaCourse,
  australiaAiEthicsCourse,
  healthcareAiSafetyCourse,
  financialTradingAiCourse,
  autonomousVehiclesCourse,
];

// Export course lookup function
export function getCourseById(id: number): CourseContent | undefined {
  return allCourses.find(course => course.id === id);
}

export function getModuleContent(courseId: number, moduleIndex: number): ModuleContent | undefined {
  const course = getCourseById(courseId);
  if (!course) return undefined;
  return course.modules[moduleIndex];
}
