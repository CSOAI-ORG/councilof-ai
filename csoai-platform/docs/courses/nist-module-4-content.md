# MAP Function: Understanding Context and Categorizing AI Risks

## Introduction: The Foundation of Risk-Based AI Management

The MAP function represents the critical first step in operationalizing AI risk management. Before an organization can effectively measure or manage AI risks, it must first understand the context in which AI systems operate, identify the specific AI systems and use cases within its portfolio, categorize these systems based on their risk profiles, and map the potential impacts and harms that could arise.

Without this foundational mapping work, AI risk management becomes generic and ineffective. Organizations may apply one-size-fits-all approaches that over-regulate low-risk systems while under-regulating high-risk ones. They may miss critical risks because they haven't systematically identified all AI systems in use. They may fail to consider important stakeholders or contextual factors that significantly affect risk.

The MAP function provides the systematic approach needed to understand "what AI systems do we have, who do they affect, what could go wrong, and how serious would that be?" This understanding enables risk-based prioritization, ensuring that risk management resources focus where they matter most.

This module explores the MAP function in depth, providing practical guidance on conducting context analysis, creating AI system inventories, categorizing systems by risk level, identifying stakeholders, assessing potential impacts, and documenting this foundational knowledge.

## The MAP Function Overview

The MAP function encompasses activities that establish a comprehensive understanding of an organization's AI landscape and the context in which AI systems operate. It answers critical questions:

- What AI systems does our organization develop, deploy, or use?
- What purposes do these systems serve?
- Who are the stakeholders affected by these systems?
- What are the potential benefits and harms?
- What is the risk profile of each system?
- What legal, regulatory, and ethical requirements apply?
- What organizational, technical, and societal context affects these systems?

The MAP function is not a one-time activity. As organizations develop new AI systems, as existing systems evolve, as the regulatory landscape changes, and as societal expectations shift, the mapping must be updated to reflect current reality.

## Understanding Organizational Context

Effective AI risk management must be grounded in understanding the specific organizational context. Different organizations face different AI risks based on their industry, size, regulatory environment, technical capabilities, and organizational culture.

### Industry and Sector Context

The industry in which an organization operates fundamentally shapes its AI risk profile:

**Healthcare**: AI systems in healthcare can directly impact patient safety and health outcomes. Risks include misdiagnosis, inappropriate treatment recommendations, privacy violations with sensitive health data, and disparities in care quality across demographic groups. The regulatory environment is stringent, with HIPAA in the US, GDPR in Europe, and FDA oversight for medical devices. Trust is paramount—patients and providers must have confidence in AI system recommendations.

**Financial Services**: AI systems in banking, insurance, and lending face intense scrutiny around fairness, transparency, and consumer protection. Risks include discriminatory lending, market manipulation, fraud, and systemic financial instability. Regulations like the Equal Credit Opportunity Act, Fair Housing Act, and emerging AI-specific regulations impose strict requirements. Explainability is often legally required for adverse decisions.

**Criminal Justice**: AI systems used in policing, sentencing, and parole decisions raise profound concerns about fairness, due process, and civil rights. Risks include perpetuating historical biases, false accusations, and erosion of civil liberties. Many jurisdictions have banned or restricted certain applications like facial recognition. Transparency and accountability are essential for legitimacy.

**Education**: AI systems for student assessment, admissions, and personalized learning must ensure fairness across demographic groups and protect student privacy. Risks include reinforcing educational inequities, privacy violations, and inappropriate data use. Regulations like FERPA govern student data. Stakeholder engagement with students, parents, and educators is critical.

**Employment**: AI systems for hiring, performance evaluation, and workforce management face legal requirements for non-discrimination and fairness. Risks include perpetuating workplace discrimination, privacy violations, and erosion of worker autonomy. Regulations vary by jurisdiction but often require transparency and human oversight of consequential decisions.

**Autonomous Vehicles**: Safety is the paramount concern. Risks include accidents, injuries, and fatalities. Extensive testing, redundant safety systems, and clear operational design domains are essential. Regulatory frameworks are still evolving but increasingly stringent.

**Consumer Technology**: AI systems in consumer products face risks around privacy, manipulation, addiction, and content moderation. Regulations like GDPR, CCPA, and emerging AI regulations impose requirements. Public trust and brand reputation are critical business considerations.

Understanding your industry's specific risk landscape, regulatory requirements, stakeholder expectations, and norms is the foundation for effective AI risk management.

### Organizational Size and Maturity

An organization's size and AI maturity significantly affect its risk management approach:

**Large Enterprises**: Have more resources for sophisticated risk management but also more complex AI portfolios, distributed decision-making, and coordination challenges. May have dedicated AI governance teams, formal processes, and mature risk management infrastructure. Face greater regulatory scrutiny and reputational risk.

**Small and Medium Enterprises (SMEs)**: Have fewer resources but also simpler AI portfolios. Risk management must be proportionate and efficient. May rely more on third-party AI systems rather than developing in-house. Can be more agile in implementing changes but may lack specialized expertise.

**Startups**: Face pressure to move fast and may be tempted to cut corners on risk management. However, building responsible AI practices from the start is easier than retrofitting later. Early-stage risk management can be lightweight but should establish good foundations (clear policies, documentation practices, ethical principles).

**AI Beginners**: Organizations just starting to use AI need to build foundational capabilities: understanding what AI is and isn't, identifying appropriate use cases, establishing basic policies, and building awareness of AI risks.

**AI Mature Organizations**: Organizations with extensive AI use need sophisticated risk management: comprehensive governance structures, detailed policies and standards, systematic risk assessment processes, and continuous monitoring and improvement.

### Regulatory and Legal Context

The regulatory environment significantly shapes AI risk management requirements:

**Highly Regulated Industries**: Healthcare, financial services, and critical infrastructure face extensive existing regulations that apply to AI systems. Organizations must ensure AI systems comply with industry-specific regulations (HIPAA, FDA, financial regulations, etc.) in addition to emerging AI-specific regulations.

**Emerging AI Regulations**: The regulatory landscape for AI is rapidly evolving. The EU AI Act establishes risk-based requirements for AI systems. US federal and state governments are considering various AI regulations. China has implemented AI regulations. Organizations must monitor regulatory developments and ensure compliance.

**Liability and Legal Risk**: AI systems can create legal liability through discrimination, privacy violations, safety failures, intellectual property infringement, and other harms. Understanding potential legal risks and liability exposure is essential for risk management.

**Contractual Obligations**: Organizations may have contractual obligations related to AI systems, such as service level agreements, data protection clauses, or liability provisions. These obligations affect risk management requirements.

### Organizational Values and Culture

An organization's values and culture shape its approach to AI risk management:

**Mission and Values**: Organizations should ensure AI systems align with their mission and values. A healthcare organization committed to health equity must ensure its AI systems don't perpetuate health disparities. A company that values privacy must implement strong privacy protections in its AI systems.

**Risk Appetite**: Organizations have different appetites for risk. Some are risk-averse and prefer conservative approaches. Others are more risk-tolerant and willing to accept higher risks for potential benefits. AI risk management should align with organizational risk appetite.

**Ethical Principles**: Many organizations have established ethical principles that guide AI development and use. These principles should inform risk assessment and decision-making.

**Stakeholder Expectations**: Different stakeholders (customers, employees, investors, regulators, civil society) have different expectations for responsible AI. Understanding and balancing these expectations is essential.

## Creating an AI System Inventory

A comprehensive inventory of AI systems is foundational for risk management. You cannot manage risks in systems you don't know exist.

### Defining "AI System"

The first challenge is defining what counts as an "AI system" for inventory purposes. The NIST AI RMF uses a broad definition: "An engineered or machine-based system that can, for a given set of objectives, generate outputs such as predictions, recommendations, or decisions influencing real or virtual environments."

This definition is intentionally broad and includes:
- Traditional machine learning systems (supervised, unsupervised, reinforcement learning)
- Deep learning systems (neural networks, transformers, etc.)
- Expert systems and rule-based systems
- Optimization and decision-support systems
- Generative AI systems (large language models, image generators, etc.)
- Robotic systems with AI components
- AI-enabled software applications

It also includes AI systems that are:
- Developed in-house
- Procured from third-party vendors
- Embedded in products or services
- Used internally or customer-facing
- In production, development, or pilot stages

Organizations should define clear criteria for what systems to include in their inventory based on their risk management objectives and resources.

### Inventory Discovery Process

Discovering all AI systems within an organization can be challenging, especially in large, decentralized organizations. Effective discovery strategies include:

**Top-Down Approach**: Survey business units and departments to identify AI systems. Provide clear definitions and examples. Use standardized questionnaires to gather consistent information.

**Bottom-Up Approach**: Engage with technical teams (data science, engineering, IT) to identify AI systems they've developed or deployed. Technical teams often have knowledge of systems that business leaders may not be aware of.

**Procurement Review**: Review procurement records to identify AI systems purchased from vendors. Many organizations use AI systems without realizing it (e.g., AI-powered analytics tools, customer service chatbots, fraud detection systems).

**Code and Infrastructure Scanning**: Use automated tools to scan code repositories, cloud infrastructure, and IT systems to identify AI components (e.g., machine learning libraries, model files, API calls to AI services).

**Third-Party Audits**: Engage external consultants to conduct comprehensive AI inventory audits, especially for large or complex organizations.

The discovery process should be repeated periodically as new systems are developed or procured.

### Inventory Information

For each AI system identified, the inventory should capture:

**Basic Information**:
- System name and identifier
- Brief description of purpose and functionality
- Business unit or department responsible
- Development status (concept, development, pilot, production, retired)
- Deployment date (for production systems)

**Technical Information**:
- AI techniques used (e.g., supervised learning, neural networks, NLP)
- Data sources and types
- Integration points with other systems
- Technical owner or team

**Risk Information**:
- Preliminary risk category (to be refined through detailed assessment)
- Potential impacts and harms
- Affected stakeholders
- Regulatory requirements

**Governance Information**:
- Risk assessment status and date
- Approval status and approving authority
- Monitoring and review schedule
- Incident history

The inventory should be maintained in a centralized, accessible system (e.g., database, configuration management system, governance platform) and kept up-to-date as systems evolve.

## AI System Categorization and Risk-Based Prioritization

Not all AI systems pose the same level of risk. Risk-based categorization enables organizations to prioritize risk management resources where they matter most.

### Risk Categorization Frameworks

Several frameworks exist for categorizing AI system risk:

**EU AI Act Risk Categories**: The EU AI Act establishes four risk categories:
- **Unacceptable Risk**: AI systems that pose unacceptable risks to safety, livelihoods, or rights (e.g., social scoring, real-time biometric identification in public spaces). These are prohibited.
- **High Risk**: AI systems used in sensitive domains or for consequential decisions (e.g., critical infrastructure, education, employment, law enforcement, migration). These face strict requirements.
- **Limited Risk**: AI systems with specific transparency obligations (e.g., chatbots must disclose they are AI).
- **Minimal Risk**: AI systems with minimal risk (e.g., AI-enabled video games). These face no specific requirements.

**NIST Risk Categorization**: NIST suggests considering:
- **Impact**: The severity of potential harms (safety, rights, livelihoods, wellbeing)
- **Likelihood**: The probability that harms will occur
- **Scope**: The number of people affected
- **Reversibility**: Whether harms can be easily reversed or remediated

**Custom Risk Categorization**: Organizations can develop custom risk categories tailored to their specific context, such as:
- **Critical**: Systems where failures could cause death, serious injury, or catastrophic business impact
- **High**: Systems affecting consequential decisions about individuals or significant business outcomes
- **Medium**: Systems with moderate impact on individuals or business operations
- **Low**: Systems with minimal impact

### Risk Factors to Consider

When categorizing AI systems, consider multiple risk factors:

**Impact on Individuals**:
- Does the system affect safety (physical harm, injury, death)?
- Does it affect legal rights or access to opportunities (employment, credit, education, housing, legal proceedings)?
- Does it affect privacy (collection, use, or disclosure of personal information)?
- Does it affect autonomy or dignity?
- Does it affect psychological wellbeing?

**Scale and Scope**:
- How many people are affected?
- Are vulnerable populations disproportionately affected?
- Are effects concentrated or distributed?

**Reversibility**:
- Can harms be easily detected and corrected?
- Are effects temporary or permanent?
- Can individuals appeal or challenge decisions?

**Transparency and Explainability**:
- Can the system's decisions be explained?
- Are affected individuals informed about AI use?
- Is there meaningful human oversight?

**Autonomy**:
- Does the system make decisions autonomously or provide recommendations for human decision-makers?
- What level of human oversight exists?
- Can humans override the system?

**Technical Maturity**:
- How mature and well-understood is the AI technology used?
- What is the system's track record of performance?
- How extensively has it been tested and validated?

**Regulatory Requirements**:
- What regulations apply to this system?
- What are the consequences of non-compliance?

### Prioritization for Risk Management

Once systems are categorized, prioritize risk management activities:

**High-Risk Systems**:
- Comprehensive risk assessments before deployment
- Extensive testing and validation
- Ongoing monitoring and periodic reassessment
- Governance board approval required
- Detailed documentation
- Regular audits

**Medium-Risk Systems**:
- Standard risk assessments
- Testing and validation appropriate to risk level
- Periodic monitoring and review
- Management approval required
- Standard documentation

**Low-Risk Systems**:
- Lightweight risk assessment
- Basic testing and validation
- Minimal ongoing monitoring
- Team-level approval
- Basic documentation

This risk-based approach ensures resources focus where they matter most while avoiding unnecessary burden on low-risk systems.

## Stakeholder Identification and Engagement

AI systems affect multiple stakeholders, and effective risk management requires understanding and engaging with these stakeholders.

### Identifying Stakeholders

Stakeholders include anyone who is affected by or has an interest in an AI system:

**Direct Users**: People who directly interact with the AI system. Their experience, needs, and concerns are critical.

**Affected Individuals**: People affected by AI system decisions even if they don't directly interact with it (e.g., job applicants affected by AI hiring systems, communities affected by predictive policing).

**Operators and Administrators**: People responsible for deploying, operating, and maintaining AI systems. They need appropriate training, tools, and support.

**Decision-Makers**: People who make decisions based on AI system outputs. They need to understand system capabilities, limitations, and appropriate use.

**Customers and Clients**: Organizations or individuals who purchase or use products or services that incorporate AI systems.

**Employees**: Workers whose jobs are affected by AI systems, whether through augmentation, automation, or monitoring.

**Regulators**: Government agencies responsible for overseeing AI systems in specific domains.

**Civil Society Organizations**: Advocacy groups, NGOs, and community organizations representing affected populations.

**Researchers and Academics**: Experts who study AI systems and their impacts.

**General Public**: Society broadly, especially for AI systems with wide-reaching effects.

### Stakeholder Engagement Strategies

Effective stakeholder engagement goes beyond simply informing stakeholders—it involves meaningful participation in AI system design, evaluation, and governance.

**Participatory Design**: Involve affected stakeholders in the design process. Their perspectives can identify use cases, requirements, and potential harms that developers might miss.

**User Research**: Conduct interviews, surveys, and usability studies with users and affected individuals to understand their needs, concerns, and experiences.

**Advisory Boards**: Establish advisory boards that include diverse stakeholders to provide ongoing input on AI systems and policies.

**Public Consultation**: For AI systems with broad societal impact, conduct public consultations to gather input from civil society and the general public.

**Transparency and Communication**: Provide clear, accessible information about AI systems, their purposes, how they work, and their limitations. Avoid technical jargon.

**Feedback Mechanisms**: Establish channels for stakeholders to provide feedback, report concerns, and appeal decisions. Respond to feedback transparently.

**Impact Assessments**: Conduct assessments that explicitly consider impacts on different stakeholder groups, especially vulnerable or marginalized populations.

**Ongoing Engagement**: Stakeholder engagement should be ongoing throughout the AI lifecycle, not just at the design stage. Needs, concerns, and impacts evolve over time.

## Impact and Harm Assessment

A critical component of the MAP function is systematically identifying potential impacts—both positive and negative—that AI systems could have.

### Types of Impacts and Harms

AI systems can cause various types of harms:

**Physical Harms**: Injury, illness, or death. Most relevant for AI systems in safety-critical domains (autonomous vehicles, medical devices, industrial automation).

**Psychological Harms**: Emotional distress, anxiety, manipulation, or addiction. Relevant for AI systems that interact with users extensively (social media algorithms, persuasive technologies).

**Economic Harms**: Financial loss, denial of opportunities, job displacement, or economic inequality. Relevant for AI systems affecting employment, credit, insurance, or economic opportunities.

**Social Harms**: Discrimination, stigmatization, social exclusion, or erosion of social cohesion. Relevant for AI systems that categorize or make decisions about people.

**Privacy Harms**: Unauthorized collection, use, or disclosure of personal information. Surveillance. Loss of anonymity. Relevant for any AI system that processes personal data.

**Autonomy Harms**: Loss of control, manipulation, or coercion. Relevant for AI systems that influence human decision-making or behavior.

**Dignity Harms**: Dehumanization, objectification, or disrespect. Relevant for AI systems that interact with or make decisions about people.

**Rights Harms**: Violation of legal rights (due process, equal protection, free speech, etc.). Relevant for AI systems used in legal, governmental, or consequential contexts.

**Environmental Harms**: Energy consumption, carbon emissions, electronic waste, or resource depletion. Relevant for all AI systems but especially large-scale models.

### Harm Assessment Process

Systematically assess potential harms for each AI system:

**1. Identify Potential Failure Modes**: How could the system fail or perform poorly?
- Inaccurate predictions or recommendations
- Biased or discriminatory outputs
- Security breaches or adversarial attacks
- System unavailability or performance degradation
- Unexpected behavior in edge cases
- Misuse by users or bad actors

**2. Trace Failure Modes to Harms**: For each failure mode, identify what harms could result:
- Who would be affected?
- What types of harms could occur (physical, economic, social, etc.)?
- How severe would the harms be?
- How many people would be affected?
- Would effects be reversible?

**3. Consider Differential Impacts**: Assess whether harms would disproportionately affect certain groups:
- Demographic groups (race, gender, age, disability, etc.)
- Socioeconomic groups
- Geographic regions
- Vulnerable or marginalized populations

**4. Assess Likelihood and Severity**: Estimate how likely each harm is to occur and how severe it would be. Use qualitative scales (low/medium/high) or quantitative risk matrices.

**5. Identify Existing Controls**: What controls or safeguards are already in place to prevent or mitigate these harms?

**6. Identify Gaps**: Where are existing controls insufficient? What additional controls are needed?

**7. Document Findings**: Create a comprehensive harm assessment document that captures all identified harms, their likelihood and severity, existing controls, and gaps.

### Positive Impacts and Benefits

While harm assessment focuses on risks, it's also important to document positive impacts and benefits:
- What problems does the AI system solve?
- What benefits does it provide to users and stakeholders?
- How does it improve on previous approaches?
- What are the opportunity costs of not deploying the system?

Understanding benefits helps with risk-benefit analysis and decision-making about whether and how to deploy AI systems.

## Documentation and Communication

The MAP function generates critical knowledge that must be documented and communicated effectively.

### AI System Documentation

Each AI system should have comprehensive documentation including:

**System Card**: High-level overview of the system including purpose, capabilities, limitations, intended use cases, and known risks. Written for non-technical audiences.

**Technical Documentation**: Detailed technical information about system architecture, algorithms, data, and implementation. For technical audiences.

**Risk Assessment**: Comprehensive assessment of risks, impacts, and harms, along with mitigation strategies. For risk management and governance audiences.

**Stakeholder Analysis**: Identification of affected stakeholders and summary of engagement activities. For governance and accountability.

**Regulatory Compliance Documentation**: Evidence of compliance with applicable regulations. For legal and compliance audiences.

Documentation should be:
- **Comprehensive**: Cover all relevant aspects of the system
- **Accessible**: Written in clear language appropriate for the audience
- **Maintained**: Kept up-to-date as systems evolve
- **Discoverable**: Stored in centralized, searchable systems
- **Version-controlled**: Track changes over time

### Communication Strategies

Effective communication of MAP function findings is essential:

**Executive Dashboards**: Provide executive leadership with high-level views of the AI system portfolio, risk distribution, and key metrics.

**Governance Reports**: Provide AI governance boards with detailed information needed for oversight and decision-making.

**Transparency Reports**: Publish information about AI systems for external stakeholders, customers, and the public to build trust and accountability.

**Stakeholder Communications**: Provide affected stakeholders with clear, accessible information about AI systems that affect them.

**Developer Guidance**: Provide AI development teams with actionable guidance based on MAP function findings.

## Conclusion

The MAP function provides the essential foundation for AI risk management. By systematically understanding organizational context, creating comprehensive AI system inventories, categorizing systems by risk, identifying stakeholders, and assessing potential impacts, organizations gain the knowledge needed to manage AI risks effectively.

Without this mapping work, AI risk management is flying blind—applying generic approaches without understanding specific risks, missing critical systems or stakeholders, and misallocating resources. With thorough mapping, organizations can implement risk-based, context-appropriate, stakeholder-informed risk management that focuses resources where they matter most.

The MAP function is not a one-time project but an ongoing process. As AI systems evolve, as new systems are developed, as the regulatory landscape changes, and as societal expectations shift, the mapping must be updated to reflect current reality. Organizations should establish processes for maintaining their AI inventories, updating risk assessments, and engaging with stakeholders on an ongoing basis.

## Key Takeaways

✅ The MAP function establishes foundational understanding of AI systems, context, stakeholders, and risks before attempting to measure or manage risks

✅ Understanding organizational context—industry, size, maturity, regulatory environment, and culture—is essential for effective, context-appropriate risk management

✅ Comprehensive AI system inventories identify all AI systems within an organization, preventing blind spots in risk management

✅ Risk-based categorization enables prioritization of risk management resources on high-risk systems while avoiding unnecessary burden on low-risk systems

✅ Stakeholder identification and engagement ensures AI systems consider the needs, concerns, and rights of all affected parties

✅ Systematic impact and harm assessment identifies potential negative consequences across multiple dimensions (physical, economic, social, privacy, autonomy, dignity, rights)

✅ Differential impact analysis ensures consideration of whether harms disproportionately affect vulnerable or marginalized populations

✅ Comprehensive documentation captures MAP function findings in formats appropriate for different audiences (technical, governance, stakeholders, public)

✅ The MAP function is an ongoing process that must be updated as AI systems, organizational context, and external environment evolve

✅ Effective mapping enables risk-based, context-appropriate, stakeholder-informed AI risk management that focuses resources where they matter most
