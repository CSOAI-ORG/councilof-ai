# Module 6: Provider and Deployer Obligations

**Duration**: 60 minutes  
**Learning Objectives**:
- Distinguish between providers and deployers
- Understand provider obligations for high-risk AI systems
- Understand deployer obligations for high-risk AI systems
- Apply compliance requirements to your role

---

## Introduction

Now that we understand which AI systems are high-risk (Modules 4-5), we must explore **what organizations must do** to comply. The EU AI Act creates two primary responsible parties:

- **Providers**: Organizations that develop, place on market, or put into service AI systems
- **Deployers**: Organizations that use AI systems under their authority

Each role carries specific obligations. Understanding your role is the first step toward compliance.

## Defining Providers and Deployers

### Provider (Article 3(3))

**Definition**: A natural or legal person, public authority, agency, or other body that develops an AI system or a general-purpose AI model or that has an AI system or a general-purpose AI model developed and places it on the market or puts it into service under its own name or trademark, whether for payment or free of charge.

**In plain language**: You're a provider if you:
1. Develop an AI system yourself, OR
2. Have someone else develop it for you, AND
3. Place it on the market (sell/distribute) or put it into service (use it yourself)

**Examples of providers**:
- Software companies selling AI products
- Startups developing AI solutions for clients
- Enterprises building AI systems for internal use
- Open-source projects releasing AI models
- Research institutions deploying AI systems

**Key point**: If you build it (or have it built) and release it, you're a provider—even if it's free or open-source.

### Deployer (Article 3(4))

**Definition**: A natural or legal person, public authority, agency, or other body using an AI system under its authority except where the AI system is used in the course of a personal non-professional activity.

**In plain language**: You're a deployer if you:
1. Use an AI system (that someone else provided)
2. Under your authority (you control how it's used)
3. For professional purposes (not personal use)

**Examples of deployers**:
- Companies using third-party AI software
- Government agencies deploying AI systems
- Hospitals using AI diagnostic tools
- Schools using AI proctoring systems
- Employers using AI hiring tools

**Key point**: If you use someone else's AI system in your business or organization, you're a deployer.

### Can you be both?

**Yes!** Many organizations are both providers and deployers:

- **Provider** of AI systems you develop and sell to others
- **Deployer** of third-party AI systems you use internally

**Example**: A bank that develops credit scoring AI (provider) and also uses a third-party fraud detection system (deployer) has obligations in both roles.

### Special case: Substantial modification

If a deployer **substantially modifies** a high-risk AI system, they become a **provider** of the modified system.

**Substantial modification** means changes that affect:
- Compliance with requirements
- Intended purpose
- Risk profile

**Example**: A hospital using an AI diagnostic tool (deployer) that modifies the algorithm to work with different medical imaging equipment becomes a provider if the modification substantially changes how the system works.

## Provider Obligations for High-Risk AI Systems

Providers of high-risk AI systems must comply with extensive requirements before placing systems on the market. These obligations are found in Chapter III, Section 2 (Articles 9-15).

### 1. Risk Management System (Article 9)

**Requirement**: Establish, implement, document, and maintain a risk management system throughout the AI system's lifecycle.

**What this means**:

**Risk identification**: Identify known and foreseeable risks associated with the AI system, including:
- Risks to health, safety, fundamental rights
- Risks from intended use
- Risks from reasonably foreseeable misuse

**Risk estimation and evaluation**: Assess the likelihood and severity of identified risks.

**Risk mitigation**: Implement measures to eliminate or reduce risks to acceptable levels through:
- Design choices
- Technical safeguards
- Training and documentation
- Use limitations

**Testing**: Test risk mitigation measures to ensure effectiveness.

**Iteration**: Continuously update the risk management system based on:
- Post-market monitoring data
- Incident reports
- User feedback
- Technological developments

**Documentation**: Maintain comprehensive records of all risk management activities.

**Real-world example**: A provider of facial recognition systems must identify risks like misidentification (especially for certain demographics), privacy violations, and discriminatory outcomes. They must implement technical measures (improved algorithms, bias testing), provide clear usage guidelines, and continuously monitor performance to update risk assessments.

### 2. Data and Data Governance (Article 10)

**Requirement**: Training, validation, and testing datasets must be subject to data governance and management practices ensuring quality, relevance, representativeness, and appropriateness.

**What this means**:

**Data quality**: Datasets must be:
- **Relevant**: Appropriate for the intended purpose
- **Representative**: Reflecting the population or context where the system will be used
- **Accurate**: Free from errors
- **Complete**: Containing necessary information
- **Up-to-date**: Reflecting current conditions

**Bias examination**: Examine datasets for possible biases that could lead to discriminatory outcomes, especially regarding:
- Race or ethnic origin
- Political opinions
- Religion or philosophical beliefs
- Trade union membership
- Genetic or health data
- Sex life or sexual orientation
- Disability
- Age

**Data governance practices**:
- Document data sources and collection methods
- Implement quality assurance processes
- Establish data retention and deletion policies
- Ensure compliance with GDPR and other data protection laws

**Special data**: When using special categories of personal data (sensitive data), implement additional safeguards and ensure legal basis exists.

**Real-world example**: A provider of hiring AI must ensure training data represents diverse candidate pools, doesn't perpetuate historical discrimination (e.g., if past hiring favored men, the AI shouldn't learn this bias), and includes appropriate features (skills, experience) while excluding protected characteristics (race, gender, age).

### 3. Technical Documentation (Article 11 + Annex IV)

**Requirement**: Draw up technical documentation demonstrating compliance with requirements and providing necessary information for authorities and deployers.

**What this means**:

**Comprehensive documentation** including:
- General description of the AI system
- Detailed description of system elements and development process
- Information about training, validation, and testing data
- Risk management system documentation
- Specifications of system performance and limitations
- Human oversight measures
- Cybersecurity measures
- Quality management system description

**Purpose**: Enable authorities to assess compliance and help deployers understand the system and use it properly.

**Maintenance**: Keep documentation up-to-date throughout the system's lifecycle.

**Real-world example**: A provider of credit scoring AI must document the algorithm's logic, training data sources and characteristics, performance metrics (accuracy, error rates), known limitations (e.g., doesn't work well for people with no credit history), and instructions for proper use.

### 4. Record-Keeping and Logging (Article 12)

**Requirement**: Design AI systems to automatically log events throughout their operation.

**What must be logged**:
- Period of each use
- Reference database against which input data has been checked
- Input data for which the search has led to a match
- Identification of natural persons involved in verification and decision-making

**Purpose**: Enable:
- Traceability of system operation
- Investigation of incidents
- Verification of compliance
- Accountability for decisions

**Technical requirements**:
- Logging must be automatic (not manual)
- Logs must be protected against tampering
- Logs must be retained for appropriate periods

**Real-world example**: A facial recognition system used for access control must log every time it's used, which database it checked against, any matches found, and which security personnel verified and approved access.

### 5. Transparency and Information to Deployers (Article 13)

**Requirement**: Provide deployers with clear, comprehensive instructions for use.

**What must be provided**:
- Identity and contact details of the provider
- Characteristics, capabilities, and limitations of the AI system
- Performance metrics (accuracy, robustness, cybersecurity)
- Known or foreseeable circumstances that may lead to risks
- Expected lifetime and necessary maintenance
- Human oversight measures
- Computational and hardware requirements
- Instructions for installation, operation, and maintenance

**Purpose**: Enable deployers to:
- Understand the system's capabilities and limitations
- Use the system properly
- Implement appropriate human oversight
- Comply with their deployer obligations

**Real-world example**: A provider of AI proctoring software must inform schools about accuracy rates, known limitations (e.g., higher error rates for certain demographics), requirements for human review of flagged behavior, and instructions for proper setup and monitoring.

### 6. Human Oversight (Article 14)

**Requirement**: Design high-risk AI systems to enable effective oversight by natural persons.

**What this means**:

**Oversight measures** enabling humans to:
- Fully understand the AI system's capacities and limitations
- Remain aware of automation bias (over-reliance on AI)
- Correctly interpret the AI system's output
- Decide not to use the AI system in a particular situation
- Intervene in or interrupt the AI system's operation
- Override or reverse the AI system's output

**Technical implementation**:
- User interfaces enabling oversight
- Alerts and warnings for potential issues
- Mechanisms to stop or override the system
- Clear presentation of AI outputs and confidence levels

**Training**: Provide training and support for oversight personnel.

**Real-world example**: An AI hiring system must allow recruiters to see why candidates were ranked as they were, override the AI's recommendations, and exclude the AI from consideration for specific roles if appropriate. The system must alert recruiters to potential issues (e.g., low confidence in rankings) and provide training on avoiding over-reliance on AI.

### 7. Accuracy, Robustness, and Cybersecurity (Article 15)

**Requirement**: Design and develop high-risk AI systems to achieve appropriate levels of accuracy, robustness, and cybersecurity.

**What this means**:

**Accuracy**: The AI system performs as intended, with acceptable error rates.
- Define accuracy metrics appropriate for the use case
- Test accuracy across diverse populations and conditions
- Document expected accuracy levels

**Robustness**: The AI system performs reliably under various conditions, including:
- Errors in input data
- Attempts to manipulate the system (adversarial attacks)
- Environmental variations
- Edge cases

**Cybersecurity**: The AI system is protected against:
- Unauthorized access
- Data breaches
- Malicious attacks
- System compromise

**Testing**: Conduct rigorous testing to verify accuracy, robustness, and cybersecurity.

**Real-world example**: A medical diagnostic AI must achieve clinically acceptable accuracy rates (comparable to human experts), function reliably even with imperfect medical images, resist attempts to fool the system with manipulated images, and protect patient data from unauthorized access.

### 8. Quality Management System (Article 17)

**Requirement**: Establish and maintain a quality management system ensuring compliance with the AI Act.

**What this means**:

**QMS components**:
- Compliance strategy and procedures
- Design, development, and testing procedures
- Post-market monitoring procedures
- Incident reporting procedures
- Documentation and record-keeping
- Resource management
- Accountability framework

**Purpose**: Ensure systematic, organization-wide compliance—not just for individual systems.

**Standards**: May align with ISO 9001 or similar quality management standards.

**Real-world example**: An AI company must establish company-wide processes for ensuring all high-risk AI systems comply with the Act, including design reviews, testing protocols, documentation standards, and procedures for responding to incidents or regulatory inquiries.

### 9. Conformity Assessment (Article 43)

**Requirement**: Undergo conformity assessment before placing high-risk AI systems on the market.

**What this means**:

**Internal control** (most common): Provider assesses its own compliance and issues an EU declaration of conformity.

**Third-party assessment** (required for certain systems): Notified body verifies compliance.

**When third-party assessment is required**:
- Remote biometric identification systems
- AI systems used in products subject to third-party conformity assessment under other EU laws

**Process**:
1. Conduct conformity assessment
2. Draw up EU declaration of conformity
3. Affix CE marking to the system

**Real-world example**: A provider of hiring AI conducts internal conformity assessment, verifying compliance with all requirements, documenting the assessment, and issuing a declaration of conformity. However, a provider of facial recognition for law enforcement must have a notified body verify compliance.

### 10. Registration (Article 49)

**Requirement**: Register high-risk AI systems in the EU database before placing them on the market.

**What must be registered**:
- Provider's name and contact details
- AI system's name and type
- Intended purpose
- Status (on market, in service, withdrawn)
- Summary of risk management system
- Instructions for use

**Purpose**: Enable authorities to monitor the AI market and identify non-compliant systems.

**Real-world example**: Before selling credit scoring AI in the EU, a provider must register the system in the EU database, providing details about the system's purpose, risk management approach, and usage instructions.

### 11. Post-Market Monitoring (Article 72)

**Requirement**: Establish and maintain a post-market monitoring system to actively collect and analyze data on the AI system's performance throughout its lifecycle.

**What this means**:

**Monitoring activities**:
- Collect user feedback and incident reports
- Analyze performance data
- Identify emerging risks or issues
- Track changes in the operating environment

**Response**:
- Update risk management system based on monitoring data
- Implement corrective actions if issues arise
- Update technical documentation
- Inform deployers of significant changes or risks

**Documentation**: Maintain records of all monitoring activities and responses.

**Real-world example**: A provider of AI proctoring software must collect data on system performance (false positive rates, user complaints), analyze trends (e.g., increasing errors for certain demographics), and take corrective action (algorithm updates, improved instructions) when issues are identified.

### 12. Incident Reporting (Article 73)

**Requirement**: Report serious incidents and malfunctioning to market surveillance authorities.

**What must be reported**:
- Serious incidents: Events leading to death, serious injury, serious damage to property or environment, or serious infringement of fundamental rights
- Malfunctioning: System failures causing non-compliance with requirements

**Timeline**: Report within 15 days of becoming aware of the incident.

**Content**: Provide detailed information about the incident, its causes, and corrective actions taken.

**Real-world example**: If an AI hiring system is found to have systematically discriminated against a protected group due to a software bug, the provider must report this to authorities within 15 days, explaining the cause and the corrective actions being implemented.

## Deployer Obligations for High-Risk AI Systems

Deployers of high-risk AI systems have fewer obligations than providers, but they are still significant. These obligations are found in Article 26.

### 1. Use in Accordance with Instructions (Article 26(1))

**Requirement**: Use high-risk AI systems in accordance with the instructions for use provided by the provider.

**What this means**:
- Read and understand the provider's instructions
- Follow recommended usage procedures
- Respect system limitations
- Implement required oversight measures
- Maintain required technical infrastructure

**Consequences of non-compliance**: Using a system contrary to instructions may make the deployer liable for harms and could void the provider's conformity assessment.

**Real-world example**: If a hiring AI provider specifies that the system should only be used for initial candidate screening (not final hiring decisions) and requires human review of all recommendations, the deployer must follow these instructions. Using the system to make automated hiring decisions without human review violates this obligation.

### 2. Human Oversight (Article 26(2))

**Requirement**: Assign human oversight to natural persons who have the necessary competence, training, and authority.

**What this means**:
- Designate specific individuals responsible for oversight
- Ensure they understand the AI system's capabilities and limitations
- Provide necessary training
- Give them authority to intervene or override the system
- Ensure they have adequate time and resources for oversight

**Avoiding automation bias**: Oversight personnel must be trained to avoid over-reliance on AI outputs.

**Real-world example**: A hospital using AI diagnostic tools must assign qualified medical professionals to oversee the system, provide training on the AI's limitations and potential errors, and ensure they have time to carefully review AI recommendations rather than automatically accepting them.

### 3. Input Data Monitoring (Article 26(3))

**Requirement**: Monitor the operation of the high-risk AI system based on the instructions for use, and inform the provider of suspected malfunctioning or serious incidents.

**What this means**:
- Monitor system performance and outputs
- Ensure input data is appropriate and of sufficient quality
- Detect anomalies or unexpected behavior
- Report issues to the provider
- Take corrective action when problems arise

**Real-world example**: A bank using credit scoring AI must monitor the system's decisions for unusual patterns (e.g., sudden increase in denials for a particular demographic), investigate potential issues, and inform the provider if malfunctioning is suspected.

### 4. Record-Keeping (Article 26(5))

**Requirement**: Keep logs generated by the AI system (where under deployer's control) for at least six months.

**What this means**:
- Retain automatically generated logs
- Protect logs from tampering
- Make logs available to authorities upon request
- Use logs for monitoring and incident investigation

**Real-world example**: A company using AI proctoring for employee certification exams must retain logs of all exam sessions, including flagged behaviors and human reviewer decisions, for at least six months.

### 5. Fundamental Rights Impact Assessment (Article 27)

**Requirement**: Conduct a fundamental rights impact assessment before deploying high-risk AI systems (with certain exceptions).

**What this means**:

**Assessment components**:
- Description of the deployer's processes involving the AI system
- Description of the period and frequency of use
- Categories of natural persons and groups likely to be affected
- Specific risks of harm to affected persons' rights and freedoms
- Description of human oversight measures
- Measures to mitigate identified risks

**When required**: Before deploying high-risk AI systems, except:
- Small-scale providers (micro or small enterprises)
- Systems already subject to fundamental rights impact assessment under other EU law

**Purpose**: Ensure deployers understand and mitigate risks to fundamental rights before deployment.

**Real-world example**: A city government planning to deploy AI for emergency call triage must assess how the system might affect citizens' rights (e.g., right to life if misclassification delays response), identify vulnerable populations (non-native speakers, people with speech impairments), and implement safeguards (multilingual support, human override for uncertain cases).

### 6. Cooperation with Authorities (Article 26(8))

**Requirement**: Cooperate with competent authorities and provide information and access necessary for compliance verification.

**What this means**:
- Respond to authority requests for information
- Provide access to logs and documentation
- Facilitate inspections and audits
- Implement corrective actions if required

**Real-world example**: If a labor authority investigates potential discrimination by an AI hiring system, the deployer must provide access to system logs, hiring decisions, and documentation of human oversight procedures.

### 7. Inform Provider of Serious Incidents (Article 26(7))

**Requirement**: Inform the provider and relevant authorities of any serious incidents or malfunctioning.

**What this means**:
- Report incidents that cause harm or rights violations
- Provide details about the incident and its consequences
- Cooperate with provider and authorities in investigating and addressing the incident

**Real-world example**: If an AI diagnostic tool provides incorrect recommendations that lead to patient harm, the hospital must inform the AI provider and health authorities, providing details about the incident for investigation.

## Special Obligations for Specific Roles

### Importers and Distributors (Articles 23-24)

**Importers** (bringing AI systems from outside the EU) must:
- Verify provider compliance (CE marking, documentation)
- Register as importer in EU database
- Ensure proper storage and transport
- Cooperate with authorities

**Distributors** (making AI systems available on the EU market) must:
- Verify CE marking and documentation
- Ensure proper storage and transport
- Inform authorities of non-compliant systems
- Cooperate with authorities

### Authorized Representatives (Article 22)

Providers established outside the EU must appoint an authorized representative in the EU to:
- Act as point of contact for authorities
- Ensure compliance verification
- Maintain documentation
- Cooperate with authorities

## Practical Compliance Roadmap

### For Providers

**Phase 1: Assessment**
1. Identify which AI systems are high-risk
2. Determine applicable requirements
3. Gap analysis against current practices

**Phase 2: Implementation**
1. Establish risk management system
2. Implement data governance practices
3. Develop technical documentation
4. Design human oversight measures
5. Conduct accuracy, robustness, cybersecurity testing
6. Establish quality management system

**Phase 3: Conformity Assessment**
1. Conduct internal or third-party conformity assessment
2. Draw up EU declaration of conformity
3. Affix CE marking

**Phase 4: Market Entry**
1. Register in EU database
2. Provide instructions for use to deployers
3. Establish post-market monitoring system

**Phase 5: Ongoing Compliance**
1. Monitor system performance
2. Respond to incidents
3. Update documentation and risk assessments
4. Maintain quality management system

### For Deployers

**Phase 1: Assessment**
1. Identify high-risk AI systems in use
2. Review provider instructions for use
3. Conduct fundamental rights impact assessment

**Phase 2: Implementation**
1. Assign human oversight personnel
2. Provide training on AI system and oversight responsibilities
3. Establish monitoring procedures
4. Implement record-keeping systems

**Phase 3: Ongoing Compliance**
1. Monitor system operation
2. Ensure human oversight is effective
3. Maintain logs
4. Report incidents to provider and authorities
5. Cooperate with authorities

## Conclusion

Provider and deployer obligations form the compliance core of the EU AI Act. Providers bear primary responsibility for ensuring high-risk AI systems meet requirements before market entry. Deployers must use systems properly, implement human oversight, and monitor performance.

Understanding your role (provider, deployer, or both) and the associated obligations is essential for compliance. In the next module, we'll explore transparency requirements, general-purpose AI, and governance structures.

## Key Takeaways

✅ **Providers develop or have developed AI systems** and place them on market or into service

✅ **Deployers use AI systems** under their authority for professional purposes

✅ **Providers must establish risk management, data governance, technical documentation, logging, human oversight, quality management, and post-market monitoring systems**

✅ **Providers must undergo conformity assessment** and register high-risk systems before market entry

✅ **Deployers must use systems according to instructions, assign human oversight, monitor operation, keep logs, and conduct fundamental rights impact assessments**

✅ **Substantial modification by deployers** makes them providers of the modified system

✅ **Importers, distributors, and authorized representatives** have additional specific obligations

✅ **Compliance requires systematic, organization-wide processes**—not just individual system compliance
