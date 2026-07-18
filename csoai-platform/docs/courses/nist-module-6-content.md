# MANAGE Function: Mitigating and Responding to AI Risks

## Introduction: From Measurement to Action

The MANAGE function represents the operational heart of AI risk management—where understanding (MAP) and measurement (MEASURE) translate into concrete actions to mitigate risks, respond to incidents, and continuously improve AI systems. While the previous functions identify and assess risks, MANAGE focuses on what organizations do about those risks.

Effective risk management requires more than identifying problems. It requires systematic approaches to reducing risk likelihood and severity, responding effectively when things go wrong, learning from incidents and near-misses, and continuously improving AI systems and risk management processes. The MANAGE function provides the frameworks, processes, and practices that enable organizations to actively manage AI risks rather than simply documenting them.

This module explores the MANAGE function comprehensively, covering risk treatment strategies, incident response and recovery, continuous improvement processes, documentation and reporting, and practical implementation guidance for building mature AI risk management capabilities.

## The MANAGE Function Overview

The MANAGE function encompasses all activities related to treating identified risks, responding to incidents, and continuously improving AI systems and risk management processes. It answers critical questions:

- How do we reduce the likelihood and severity of identified risks?
- What controls and safeguards should we implement?
- How do we respond when AI systems fail or cause harm?
- How do we learn from incidents and near-misses?
- How do we continuously improve AI systems and risk management processes?
- How do we document and communicate risk management activities?

The MANAGE function operates continuously throughout the AI lifecycle, from initial risk treatment planning through ongoing monitoring, incident response, and iterative improvement.

## Risk Treatment Strategies

Risk treatment involves selecting and implementing strategies to address identified risks. The classic risk management framework identifies four primary strategies: avoid, mitigate, transfer, and accept.

### Risk Avoidance

Risk avoidance means eliminating the risk entirely by not pursuing the risky activity.

**When to Avoid Risks**:
- Risks are unacceptable and cannot be adequately mitigated
- Potential harms are catastrophic or irreversible
- Regulatory or ethical constraints prohibit the use case
- Risks significantly outweigh benefits
- Alternative approaches can achieve objectives with lower risk

**Examples**:
- Deciding not to deploy an AI system for a use case where risks cannot be adequately managed (e.g., fully autonomous weapons, social scoring systems)
- Choosing not to use certain types of sensitive data that pose unacceptable privacy risks
- Avoiding deployment in contexts where the system hasn't been adequately validated (e.g., not deploying a medical AI in pediatric contexts if only validated on adults)

**Considerations**:
- Risk avoidance may mean forgoing benefits
- May need to communicate decision to stakeholders who expected the system
- Should document rationale for risk avoidance decisions
- May need to explore alternative approaches to achieve objectives

### Risk Mitigation

Risk mitigation means implementing controls and safeguards to reduce risk likelihood, severity, or both. This is the most common risk treatment strategy.

**Technical Controls**:

**Data Quality Controls**: Improve data quality to reduce risks from poor data:
- Data validation and cleaning processes
- Bias detection and mitigation in training data
- Data augmentation to improve representation
- Synthetic data generation to address data gaps
- Data provenance tracking to ensure data integrity

**Model Design Controls**: Design models to be more trustworthy:
- Choose inherently interpretable models when appropriate (decision trees, linear models, rule-based systems)
- Implement fairness constraints during training
- Use ensemble methods to improve robustness
- Implement uncertainty quantification to identify low-confidence predictions
- Design models with appropriate complexity (avoid overfitting)

**Testing and Validation Controls**: Comprehensive testing before deployment:
- Extensive performance testing on diverse test sets
- Adversarial testing to identify vulnerabilities
- Fairness testing across demographic groups
- Safety testing including edge cases and failure modes
- User acceptance testing with representative users

**Security Controls**: Protect against security threats:
- Input validation and sanitization
- Adversarial training to improve robustness
- Access controls and authentication
- Encryption of data and models
- Security monitoring and intrusion detection
- Regular security audits and penetration testing

**Privacy Controls**: Protect personal information:
- Data minimization (collect only necessary data)
- Differential privacy techniques
- Federated learning (train without centralizing data)
- De-identification and anonymization
- Access controls and audit logging
- Privacy-preserving computation techniques

**Operational Controls**:

**Human Oversight**: Maintain appropriate human involvement:
- Human-in-the-loop: Humans make final decisions based on AI recommendations
- Human-on-the-loop: Humans monitor AI decisions and can intervene
- Human-in-command: Humans set objectives and constraints for AI systems
- Appropriate expertise and training for human overseers
- Clear escalation procedures for uncertain or high-stakes decisions

**Operational Constraints**: Limit how and where systems operate:
- Define clear operational design domains (contexts where system is validated)
- Implement geofencing or other constraints on where systems operate
- Limit system autonomy (require approval for certain actions)
- Implement rate limiting or throttling
- Establish kill switches or emergency shutdown procedures

**Monitoring and Alerting**: Detect issues quickly:
- Real-time monitoring of system performance and outputs
- Automated alerts for anomalies or performance degradation
- User feedback mechanisms
- Incident reporting systems
- Regular audits and reviews

**Procedural Controls**:

**Policies and Standards**: Establish clear requirements:
- Development standards and best practices
- Deployment approval processes
- Change management procedures
- Incident response procedures
- Regular review and update cycles

**Training and Awareness**: Ensure people understand risks and responsibilities:
- Training for developers on secure AI development
- Training for operators on appropriate use and limitations
- Training for users on how to use systems appropriately
- Ethics training on potential harms and responsible practices
- Regular refresher training

**Documentation**: Maintain comprehensive records:
- System documentation (architecture, data, models, performance)
- Risk assessments and mitigation strategies
- Testing and validation results
- Operational procedures and guidelines
- Incident reports and lessons learned

### Risk Transfer

Risk transfer means shifting risk to another party, typically through insurance or contractual arrangements.

**Insurance**: Purchase insurance coverage for AI-related risks:
- Cyber insurance covering data breaches and security incidents
- Professional liability insurance covering errors and omissions
- Product liability insurance covering harms from AI products
- Directors and officers insurance covering governance failures

**Considerations**:
- Insurance may not cover all AI risks (emerging risk, intentional misconduct)
- Insurance doesn't eliminate risk, only transfers financial consequences
- May require demonstrating adequate risk management practices
- Should supplement, not replace, risk mitigation

**Contractual Risk Transfer**: Allocate risks through contracts:
- Vendor contracts that place liability on AI system providers
- User agreements that limit organizational liability
- Indemnification clauses
- Service level agreements with penalties for failures

**Considerations**:
- Contractual risk transfer may not be enforceable in all contexts (e.g., can't contract away liability for discrimination or safety failures)
- Must ensure vendors have capability to bear transferred risks
- Should conduct vendor due diligence
- May need to monitor vendor risk management practices

### Risk Acceptance

Risk acceptance means consciously deciding to accept a risk without additional treatment, typically because the risk is low or the cost of mitigation exceeds the benefit.

**When to Accept Risks**:
- Residual risks after mitigation are within acceptable risk appetite
- Cost of further mitigation exceeds expected benefit
- Risks are low likelihood and low severity
- No feasible mitigation strategies exist

**Requirements for Risk Acceptance**:
- Explicit documentation of accepted risks
- Approval by appropriate authority (governance board for high risks)
- Clear rationale for acceptance decision
- Ongoing monitoring of accepted risks
- Periodic reassessment of acceptance decisions

**Considerations**:
- Risk acceptance is not risk ignorance—must be conscious, documented decision
- Accepted risks should be monitored in case conditions change
- Should communicate accepted risks to affected stakeholders
- May need to establish contingency plans even for accepted risks

## Incident Response and Recovery

Despite best efforts at risk mitigation, incidents will occur. Effective incident response minimizes harm and enables learning.

### Incident Detection

Rapid detection is critical for minimizing harm:

**Automated Detection**:
- Monitoring systems that detect anomalies, performance degradation, or policy violations
- Automated alerts triggered by threshold violations
- Anomaly detection algorithms that identify unusual patterns
- Security monitoring systems that detect attacks or breaches

**Human Detection**:
- User reports of errors, inappropriate outputs, or concerns
- Operator observations during monitoring
- Internal audits and reviews
- External reports from researchers, journalists, or advocacy groups

**Proactive Detection**:
- Regular testing and validation
- Red team exercises
- Penetration testing
- Bias audits
- Safety assessments

### Incident Classification

Not all incidents are equal. Classification helps prioritize response:

**Severity Levels**:
- **Critical**: Incidents causing or likely to cause serious harm (death, serious injury, major rights violations, catastrophic business impact)
- **High**: Incidents causing or likely to cause significant harm (moderate injury, rights violations, major business impact)
- **Medium**: Incidents causing or likely to cause moderate harm (minor injury, privacy violations, moderate business impact)
- **Low**: Incidents causing minimal harm (minor errors, minimal impact)

**Incident Types**:
- **Safety Incidents**: Failures causing physical harm or safety risks
- **Security Incidents**: Breaches, attacks, or unauthorized access
- **Fairness Incidents**: Discriminatory or biased outcomes
- **Privacy Incidents**: Unauthorized collection, use, or disclosure of personal information
- **Performance Incidents**: Significant performance degradation or failures
- **Compliance Incidents**: Violations of regulations or policies

### Incident Response Process

A systematic response process ensures consistent, effective handling:

**1. Initial Response (Minutes to Hours)**:
- Confirm and assess the incident
- Classify severity and type
- Activate incident response team
- Implement immediate containment measures (system shutdown, rollback, access restrictions)
- Notify key stakeholders (management, legal, affected parties as appropriate)

**2. Investigation (Hours to Days)**:
- Gather evidence (logs, data, system states)
- Conduct root cause analysis
- Determine scope and impact (how many people affected, what harms occurred)
- Assess whether incident is ongoing or contained
- Document findings

**3. Remediation (Days to Weeks)**:
- Develop and implement fixes for root causes
- Validate that fixes address the issue
- Test to ensure fixes don't introduce new problems
- Update documentation and procedures
- Implement additional safeguards to prevent recurrence

**4. Communication (Ongoing)**:
- Notify affected individuals as required by law or policy
- Communicate with regulators if required
- Provide updates to stakeholders
- Public communication if appropriate
- Internal communication and lessons sharing

**5. Recovery (Days to Weeks)**:
- Restore normal operations
- Monitor for recurrence
- Provide support to affected individuals
- Assess and address any ongoing impacts

**6. Post-Incident Review (Weeks)**:
- Conduct comprehensive review of incident and response
- Identify lessons learned
- Update policies, procedures, and systems based on lessons
- Share learnings across organization
- Document for future reference

### Incident Documentation

Comprehensive documentation is essential for learning, accountability, and compliance:

**Incident Report Should Include**:
- Incident description and timeline
- Root cause analysis
- Impact assessment (who was affected, what harms occurred)
- Response actions taken
- Effectiveness of response
- Lessons learned
- Recommendations for preventing recurrence
- Follow-up actions and responsible parties

**Documentation Uses**:
- Organizational learning and improvement
- Regulatory reporting and compliance
- Legal proceedings if necessary
- Transparency and accountability
- Training and awareness

## Continuous Improvement

Effective AI risk management is not static but continuously evolving based on experience, feedback, and changing conditions.

### Learning from Incidents

Every incident is an opportunity to improve:

**Incident Analysis**:
- What went wrong and why?
- Were existing controls inadequate or not followed?
- Were there warning signs that were missed?
- How effective was the incident response?
- What could prevent similar incidents?

**Systemic Improvements**:
- Update policies and procedures based on lessons
- Implement additional technical controls
- Improve monitoring and detection capabilities
- Enhance training and awareness
- Adjust risk assessments and mitigation strategies

**Knowledge Sharing**:
- Share lessons learned across the organization
- Contribute to industry knowledge (anonymized case studies)
- Update training materials with real examples
- Build institutional memory

### Performance Monitoring and Optimization

Continuously monitor and optimize AI system performance:

**Performance Trends**:
- Track key metrics over time
- Identify gradual degradation or improvement
- Detect seasonal or cyclical patterns
- Compare performance across different contexts or populations

**Root Cause Analysis**:
- When performance degrades, investigate why
- Is it data drift, concept drift, or system issues?
- Are certain subpopulations disproportionately affected?
- Are there environmental or contextual factors?

**Optimization**:
- Retrain models with new data
- Adjust thresholds or parameters
- Implement improved algorithms or techniques
- Update data pipelines or preprocessing
- Refine operational procedures

### Feedback Loops

Establish systematic feedback loops that drive improvement:

**User Feedback**:
- Collect user satisfaction, complaints, and suggestions
- Analyze patterns in user feedback
- Prioritize improvements based on user needs
- Close the loop by communicating improvements to users

**Operator Feedback**:
- Gather feedback from people who deploy and operate AI systems
- Understand practical challenges and limitations
- Identify opportunities to improve usability and effectiveness
- Involve operators in improvement initiatives

**Stakeholder Feedback**:
- Engage with affected communities and advocacy groups
- Understand evolving concerns and expectations
- Incorporate stakeholder perspectives into improvements
- Build trust through responsive engagement

**Regulatory Feedback**:
- Monitor regulatory guidance and enforcement actions
- Understand regulator expectations and concerns
- Proactively address regulatory priorities
- Engage constructively with regulators

### Maturity Assessment and Roadmap

Periodically assess risk management maturity and plan improvements:

**Maturity Assessment**:
- Evaluate current capabilities against maturity models
- Identify strengths and gaps
- Benchmark against industry peers
- Assess whether current maturity is appropriate for risk profile

**Improvement Roadmap**:
- Prioritize improvements based on risk and feasibility
- Establish clear objectives and success criteria
- Allocate resources for improvement initiatives
- Track progress and adjust plans as needed

## Documentation and Reporting

Comprehensive documentation and reporting are essential for accountability, compliance, learning, and trust.

### Internal Documentation

Maintain detailed internal documentation:

**AI System Documentation**:
- System cards, model cards, data sheets
- Architecture and technical specifications
- Risk assessments and mitigation strategies
- Testing and validation results
- Operational procedures and guidelines
- Change history and version control

**Risk Management Documentation**:
- Risk register (inventory of identified risks)
- Risk treatment plans
- Incident reports and post-incident reviews
- Monitoring data and analysis
- Audit reports and findings
- Governance decisions and rationale

**Process Documentation**:
- Policies and standards
- Procedures and workflows
- Roles and responsibilities
- Training materials
- Templates and tools

### Regulatory Reporting

Many jurisdictions require reporting to regulators:

**Pre-Deployment Reporting**:
- Notification of high-risk AI systems
- Risk assessments and mitigation plans
- Evidence of compliance with requirements
- Third-party audit or certification results

**Ongoing Reporting**:
- Periodic compliance reports
- Significant changes to AI systems
- Performance and monitoring data
- Incident reports (especially for serious incidents)

**Ad-Hoc Reporting**:
- Responses to regulator inquiries
- Investigation cooperation
- Corrective action plans

### Transparency Reporting

Public transparency builds trust and accountability:

**Transparency Reports**:
- Overview of AI systems and their purposes
- Risk management approaches and controls
- Performance metrics and trends
- Incident summaries and responses
- Continuous improvement initiatives

**System-Specific Transparency**:
- Clear disclosure when individuals interact with AI systems
- Explanations of how systems work (at appropriate level of detail)
- Information about data used and how decisions are made
- Limitations and known issues
- How to provide feedback or appeal decisions

**Considerations**:
- Balance transparency with protecting proprietary information and security
- Make information accessible to non-technical audiences
- Update regularly to reflect current state
- Respond to questions and concerns

## Practical Implementation Guide

### Building Incident Response Capabilities

**Step 1: Establish Incident Response Team**:
- Designate team members with clear roles and responsibilities
- Include technical, legal, communications, and business representatives
- Provide training on incident response procedures
- Establish on-call rotations for 24/7 coverage if needed

**Step 2: Develop Incident Response Procedures**:
- Document step-by-step procedures for different incident types and severities
- Create decision trees for incident classification
- Establish escalation criteria and procedures
- Define communication templates and protocols
- Create runbooks for common incident types

**Step 3: Implement Detection and Monitoring**:
- Deploy monitoring systems with appropriate alerts
- Establish user reporting mechanisms
- Conduct regular testing and audits
- Train staff to recognize and report incidents

**Step 4: Practice and Refine**:
- Conduct tabletop exercises simulating incidents
- Run drills to test response procedures
- Review and update procedures based on exercises and real incidents
- Build muscle memory for effective response

### Implementing Continuous Improvement

**Step 1: Establish Feedback Mechanisms**:
- Implement user feedback systems
- Create channels for operator and stakeholder input
- Monitor performance metrics continuously
- Conduct regular audits and reviews

**Step 2: Analyze and Prioritize**:
- Regularly review feedback, metrics, and incidents
- Identify patterns and systemic issues
- Prioritize improvements based on risk and impact
- Develop improvement plans with clear objectives

**Step 3: Implement Improvements**:
- Allocate resources for improvement initiatives
- Follow systematic change management processes
- Test improvements thoroughly before deployment
- Monitor effectiveness of improvements

**Step 4: Close the Loop**:
- Communicate improvements to stakeholders
- Update documentation to reflect changes
- Share lessons learned across organization
- Celebrate successes and recognize contributors

### Building Risk Management Culture

Effective risk management requires organizational culture that supports it:

**Leadership Commitment**:
- Leaders visibly prioritize risk management
- Allocate adequate resources
- Hold people accountable for risk management
- Recognize and reward good risk management practices

**Psychological Safety**:
- Encourage reporting of concerns without fear of retaliation
- Treat incidents as learning opportunities, not blame opportunities
- Reward people who identify and report risks
- Foster open dialogue about risks and tradeoffs

**Continuous Learning**:
- Invest in training and professional development
- Share knowledge and lessons learned
- Stay current with evolving best practices
- Encourage experimentation and innovation in risk management

**Stakeholder Engagement**:
- Involve stakeholders in risk management decisions
- Listen to and act on stakeholder concerns
- Build trust through transparency and responsiveness
- Recognize that risk management serves stakeholders, not just the organization

## Conclusion

The MANAGE function is where AI risk management becomes operational—where identified risks are treated, incidents are responded to, and continuous improvement drives ever-greater trustworthiness. Effective risk management requires systematic approaches to risk treatment, rapid and effective incident response, and commitment to continuous learning and improvement.

Risk management is not about eliminating all risks—that's impossible and would prevent beneficial AI innovation. It's about consciously managing risks to acceptable levels through appropriate controls, responding effectively when things go wrong, and continuously improving both AI systems and risk management processes. It's about building organizational capabilities and culture that enable responsible AI innovation.

The MANAGE function completes the AI Risk Management Framework cycle: GOVERN establishes the foundation, MAP identifies risks, MEASURE assesses them, and MANAGE addresses them. But the cycle doesn't end—continuous monitoring feeds back into MAP (identifying new risks), MEASURE (assessing current risk levels), and MANAGE (refining risk treatment). This iterative, continuous process enables organizations to manage AI risks in dynamic, evolving environments.

## Key Takeaways

✅ The MANAGE function translates risk identification and assessment into concrete actions through risk treatment, incident response, and continuous improvement

✅ Risk treatment strategies include avoidance (eliminating risk), mitigation (reducing risk), transfer (shifting risk), and acceptance (consciously accepting risk)

✅ Risk mitigation employs technical controls (data quality, model design, testing, security, privacy), operational controls (human oversight, constraints, monitoring), and procedural controls (policies, training, documentation)

✅ Effective incident response requires rapid detection, systematic classification, structured response processes, comprehensive documentation, and post-incident learning

✅ Continuous improvement leverages learning from incidents, performance monitoring and optimization, systematic feedback loops, and maturity assessment to drive ever-greater trustworthiness

✅ Comprehensive documentation and reporting serve accountability, compliance, learning, and trust-building purposes through internal documentation, regulatory reporting, and transparency reporting

✅ Building incident response capabilities requires dedicated teams, documented procedures, detection and monitoring systems, and regular practice through exercises and drills

✅ Implementing continuous improvement requires feedback mechanisms, systematic analysis and prioritization, disciplined implementation, and closing the loop with stakeholders

✅ Effective risk management requires organizational culture that supports it through leadership commitment, psychological safety, continuous learning, and stakeholder engagement

✅ The MANAGE function completes the AI RMF cycle but the cycle continues—continuous monitoring and improvement drive iterative refinement of all risk management functions
