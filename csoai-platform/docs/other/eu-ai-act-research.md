# EU AI Act Research Findings

## Overview
- **Published**: Official Journal of the European Union, 12 July 2024
- **Entry into Force**: 1 August 2024 (20 days after publication)
- **Regulation Number**: EU 2024/1689
- **Scope**: First comprehensive AI regulation by a major regulator worldwide

## Risk Classification System

### 1. Unacceptable Risk (Prohibited)
**Timeline**: Banned 6 months after entry into force (February 2025)

Prohibited AI systems include:
- **Subliminal manipulation**: Techniques that distort behavior and impair informed decision-making
- **Exploitation of vulnerabilities**: Based on age, disability, or socio-economic circumstances
- **Social scoring**: Government-run evaluation systems (China-style)
- **Biometric categorization**: Inferring sensitive attributes (race, political opinions, religion, sexual orientation)
- **Predictive policing**: Assessing crime risk solely based on profiling/personality traits
- **Facial recognition databases**: Untargeted scraping from internet/CCTV
- **Emotion recognition**: In workplaces or educational institutions (except medical/safety)
- **Real-time remote biometric identification**: In public spaces by law enforcement (with narrow exceptions)

### 2. High-Risk AI Systems
**Timeline**: Regulated 24 months after entry into force (August 2026) for Annex III systems

**Classification Criteria** (Article 6):
- Used as safety component in products covered by EU laws (Annex I) AND requires third-party conformity assessment
- Listed in Annex III use cases (unless performs narrow procedural task, improves previous human activity, or detects patterns without replacing human assessment)
- Always high-risk if it profiles individuals

**Annex III Use Cases**:
1. **Biometrics** (non-banned):
   - Remote biometric identification systems
   - Biometric categorization systems
   - Emotion recognition systems

2. **Critical Infrastructure**:
   - Digital infrastructure management
   - Road traffic safety components
   - Water, gas, heating, electricity supply

3. **Education and Vocational Training**:
   - Access/admission/assignment to institutions
   - Evaluating learning outcomes
   - Assessing appropriate education level
   - Monitoring prohibited student behavior during tests

4. **Employment and Worker Management**:
   - Recruitment/selection (job ads, CV scanning, candidate evaluation)
   - Promotion and termination decisions
   - Task allocation based on personality traits
   - Performance monitoring and evaluation

5. **Essential Public and Private Services**:
   - Eligibility for public benefits/services
   - Creditworthiness evaluation (except fraud detection)
   - Emergency call classification and dispatch
   - Health and life insurance risk assessment/pricing

6. **Law Enforcement**:
   - Crime victim risk assessment
   - Polygraphs
   - Evidence reliability evaluation
   - Offending/re-offending risk assessment
   - Profiling during criminal investigations

7. **Migration, Asylum, Border Control**:
   - Polygraphs
   - Irregular migration/health risk assessments
   - Asylum, visa, residence permit applications
   - Individual detection/recognition/identification

8. **Administration of Justice and Democratic Processes**:
   - Researching/interpreting facts and applying law
   - Alternative dispute resolution
   - Influencing elections/referenda outcomes

### 3. Limited Risk (Transparency Obligations)
- **Chatbots**: Users must be aware they're interacting with AI
- **Deepfakes**: Must be clearly labeled
- **Emotion recognition/biometric categorization**: Users must be informed

### 4. Minimal Risk (Unregulated)
- AI-enabled video games
- Spam filters
- Most current AI applications (as of 2021)

## Provider Obligations (High-Risk Systems)

Providers (developers) of high-risk AI systems must:

1. **Risk Management System** (Article 8-9):
   - Throughout AI system lifecycle
   - Continuous iterative process
   - Regular systematic updates

2. **Data Governance** (Article 10):
   - Training, validation, testing datasets must be:
     - Relevant and representative
     - Free of errors (to best extent possible)
     - Complete for intended purpose
   - Special attention to biases

3. **Technical Documentation** (Article 11):
   - Demonstrate compliance
   - Enable authorities to assess compliance
   - Must be kept up-to-date

4. **Record-Keeping** (Article 12):
   - Automatic logging of events
   - Identify risks and substantial modifications
   - Throughout lifecycle

5. **Transparency and Instructions** (Article 13):
   - Provide instructions for use to deployers
   - Enable deployer compliance
   - Clear, comprehensive, correct, and up-to-date

6. **Human Oversight** (Article 14):
   - Design systems to allow human oversight
   - Prevent/minimize risks to health, safety, fundamental rights
   - Humans can interpret outputs and intervene

7. **Accuracy, Robustness, Cybersecurity** (Article 15):
   - Appropriate levels throughout lifecycle
   - Resilient to errors, faults, inconsistencies
   - Protected against unauthorized access

8. **Quality Management System** (Article 17):
   - Ensure compliance with Act
   - Document policies, procedures, instructions
   - Regular review and updates

## Deployer (User) Obligations

Deployers of high-risk AI systems must:
- Use systems according to instructions
- Implement human oversight measures
- Monitor system operation
- Report serious incidents
- Conduct fundamental rights impact assessment (for certain systems)

## General Purpose AI (GPAI)

### GPAI Model Definition
- Trained with large amounts of data using self-supervision at scale
- Displays significant generality
- Capable of performing wide range of distinct tasks
- Can be integrated into various downstream systems

### All GPAI Model Providers Must:
1. Draw up **technical documentation** (training, testing, evaluation)
2. Provide **information to downstream providers** (capabilities, limitations)
3. Establish **Copyright Directive compliance** policy
4. Publish **training data summary** (sufficiently detailed)

### Free and Open License GPAI Models
- Only need to comply with copyright and training data summary
- Unless they present systemic risk

### GPAI Models with Systemic Risk
**Criteria**: Cumulative compute > 10^25 FLOPs

Additional obligations:
1. **Model evaluations** including adversarial testing
2. **Assess and mitigate systemic risks**
3. **Track, document, report serious incidents** to AI Office
4. **Ensure cybersecurity protection**

**Timeline**: 12 months after entry into force (August 2025)

## Governance Structure

### AI Office
- Sits within European Commission
- Monitors GPAI model provider compliance
- Can conduct evaluations and investigations
- Handles complaints from downstream providers

### National Competent Authorities
- Each Member State designates authorities
- Supervise high-risk AI systems
- Enforce compliance within their jurisdiction

### European Artificial Intelligence Board
- Advises and assists Commission and Member States
- Ensures consistent application across EU

### Scientific Panel of Independent Experts
- Provides technical expertise
- Can issue qualified alerts about systemic risks

## Conformity Assessment

### High-Risk AI Systems (Annex III)
- **Self-assessment** by provider (internal control)
- Exception: Remote biometric identification requires third-party assessment

### High-Risk AI Systems (Annex I)
- **Third-party conformity assessment** required
- By notified bodies designated by Member States

### CE Marking
- High-risk AI systems must bear CE marking
- Indicates conformity with Act
- Required before placing on market

## Penalties

Member States must establish penalties for infringements, which must be:
- Effective
- Proportionate
- Dissuasive

**Maximum fines**:
- **€35 million or 7% of global annual turnover** (whichever higher): Prohibited AI practices
- **€15 million or 3% of global annual turnover**: High-risk AI obligations
- **€7.5 million or 1.5% of global annual turnover**: Incorrect information to authorities

**SME adjustments**: Fines capped at percentages of turnover or fixed amounts (whichever lower)

## Implementation Timeline

| Deadline | Requirement |
|----------|-------------|
| **1 August 2024** | Entry into force |
| **2 February 2025** | Prohibited AI systems banned (6 months) |
| **2 May 2025** | Codes of practice ready (9 months) |
| **2 August 2025** | GPAI obligations apply (12 months) |
| **2 August 2026** | High-risk AI (Annex III) obligations apply (24 months) |
| **2 August 2027** | High-risk AI (Annex I) obligations apply (36 months) |

## Key Definitions

**Provider**: Natural or legal person that develops or has an AI system developed with a view to placing it on the market or putting it into service under its own name or trademark

**Deployer**: Natural or legal person that uses an AI system under its authority (except for personal non-professional activity)

**Placing on the market**: First making available of an AI system on the Union market

**Putting into service**: Supply of an AI system for first use directly to the deployer or for own use in the Union for its intended purpose

**AI System**: Machine-based system that is designed to operate with varying levels of autonomy and that may exhibit adaptiveness after deployment, and that, for explicit or implicit objectives, infers, from the input it receives, how to generate outputs such as predictions, content, recommendations, or decisions that can influence physical or virtual environments

## Sources
- Official Journal: https://eur-lex.europa.eu/eli/reg/2024/1689/oj/eng
- AI Act website: https://artificialintelligenceact.eu/
- High-level summary: https://artificialintelligenceact.eu/high-level-summary/
