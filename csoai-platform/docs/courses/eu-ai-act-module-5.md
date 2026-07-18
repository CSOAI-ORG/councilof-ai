# Module 5: High-Risk AI Systems - Part 2

**Duration**: 60 minutes  
**Learning Objectives**:
- Recognize high-risk AI systems in essential services, law enforcement, migration, and justice
- Understand the heightened sensitivity of these categories
- Apply high-risk classification to your AI systems

---

## Introduction

This module continues our exploration of Annex III high-risk AI systems, covering the final four categories:

5. Access to essential private and public services
6. Law enforcement
7. Migration, asylum, and border control
8. Administration of justice and democratic processes

These categories involve particularly sensitive applications where AI can significantly impact fundamental rights, access to essential services, and the functioning of democratic institutions. The compliance obligations for these systems (covered in Module 6) are extensive, reflecting the serious risks involved.

## Category 5: Essential Private and Public Services

**Annex III, Point 5**: AI systems intended to be used to evaluate the creditworthiness of natural persons or establish their credit score, with the exception of AI systems used for detecting financial fraud.

**Annex III, Point 5 (continued)**: AI systems intended to be used to dispatch or establish priority in the dispatching of emergency first responder services, including firefighters and medical aid.

### Creditworthiness and Credit Scoring

**What triggers high-risk classification?** AI systems that assess individuals' ability to repay debt or assign credit scores that affect access to financial services.

**Examples**:

✅ **High-risk creditworthiness systems**:
- AI determining credit scores (FICO-style scoring)
- AI evaluating loan applications (mortgage, personal loans, business loans)
- AI assessing creditworthiness for credit cards
- AI determining interest rates based on credit risk
- AI evaluating "buy now, pay later" eligibility
- AI assessing risk for insurance underwriting (if based on creditworthiness)

❌ **Not high-risk**:
- Fraud detection systems (explicit exception)
- Transaction monitoring for suspicious activity
- Identity verification for account opening (not creditworthiness assessment)

**Why is this high-risk?** Access to credit is essential for:
- Housing (mortgages, rental applications)
- Education (student loans)
- Business creation (startup financing)
- Emergency expenses (medical bills, car repairs)
- Building wealth (home ownership, investments)

Discriminatory or inaccurate credit decisions can perpetuate economic inequality and deny fundamental opportunities.

**Key considerations**:

**Bias risks**: Credit scoring AI can perpetuate historical discrimination if trained on biased data. Protected characteristics (race, gender, religion) cannot be used directly, but proxy variables (zip code, name, shopping patterns) can create indirect discrimination.

**Explainability**: Individuals have the right to understand why they were denied credit. "Black box" AI systems that cannot explain decisions violate both the AI Act and existing consumer protection laws.

**Data quality**: Credit decisions based on inaccurate, incomplete, or outdated data cause significant harm. High-risk classification requires rigorous data governance.

**Real-world scenario**: A bank using AI to evaluate mortgage applications, analyzing income, employment history, existing debts, and payment patterns to approve or deny loans, is deploying a high-risk system. However, the same bank using AI to detect fraudulent loan applications (fake documents, identity theft) is not deploying a high-risk system (fraud detection exception).

### Emergency First Responder Dispatching

**What triggers high-risk classification?** AI systems that determine which emergency services respond to calls or establish priority for response.

**Examples**:

✅ **High-risk emergency dispatching systems**:
- AI triaging 911/112 calls to determine urgency
- AI dispatching ambulances, fire trucks, or police based on call assessment
- AI establishing priority queues for emergency response
- AI determining resource allocation during mass casualty events
- AI routing emergency calls to appropriate services

❌ **Not high-risk**:
- GPS routing for emergency vehicles (navigation, not dispatching)
- Communication systems for first responders (not decision-making)
- Administrative scheduling for non-emergency services

**Why is this high-risk?** Emergency response decisions are literally life-and-death:
- Delayed response can result in death or serious injury
- Misclassification of urgency can deny critical care
- Biased prioritization can create discriminatory outcomes
- System failures can leave people without help

**Key considerations**:

**Accuracy**: Misassessing emergency severity can be fatal. A heart attack misclassified as indigestion, a stroke misclassified as drunkenness, or a fire misclassified as low-priority can result in death.

**Bias**: AI must not deprioritize calls from certain neighborhoods, demographics, or callers. Historical data showing slower response times to minority neighborhoods cannot be perpetuated by AI.

**Reliability**: System failures during emergencies are unacceptable. High-risk classification requires robust failsafes and human override capabilities.

**Real-world scenario**: A city using AI to analyze 911 calls, assess urgency based on caller's description and voice patterns, and dispatch appropriate emergency services with priority levels is deploying a high-risk system. However, a GPS navigation system that provides optimal routes to emergency vehicles is not high-risk.

## Category 6: Law Enforcement

**Annex III, Point 6**: AI systems intended to be used by or on behalf of law enforcement authorities or by Union institutions, bodies, offices, or agencies in support of law enforcement authorities for:

- Assessing risk of natural persons becoming victims of criminal offenses
- Polygraphs and similar tools detecting emotional state
- Detecting deep fakes
- Evaluating reliability of evidence
- Assessing risk of persons committing or reoffending criminal offenses
- Profiling in the course of detection, investigation, or prosecution
- Crime analytics regarding natural persons

### Risk Assessment for Potential Victims

**What triggers high-risk classification?** AI systems that predict who might become victims of crime.

**Examples**:

✅ **High-risk victim risk assessment**:
- AI identifying individuals at risk of domestic violence
- AI predicting potential victims of human trafficking
- AI assessing risk of child abuse or neglect
- AI identifying vulnerable individuals for targeted protection

❌ **Not high-risk**:
- General crime statistics by area (not individual risk assessment)
- Public awareness campaigns about crime prevention

**Why is this high-risk?** While well-intentioned, victim risk assessment can:
- Create self-fulfilling prophecies (treating someone as a victim can make them one)
- Stigmatize individuals or communities
- Violate privacy by profiling vulnerable people
- Misallocate resources if predictions are inaccurate

**Real-world scenario**: A police department using AI to analyze domestic violence call history, restraining orders, and other data to identify individuals at high risk of becoming domestic violence victims for proactive intervention is deploying a high-risk system.

### Polygraphs and Emotion Detection

**What triggers high-risk classification?** AI systems that detect lies or emotional states for law enforcement purposes.

**Examples**:

✅ **High-risk lie/emotion detection**:
- AI-powered polygraphs analyzing physiological responses
- AI detecting deception from facial expressions or voice
- AI assessing stress or anxiety during interrogations
- AI evaluating truthfulness of statements

❌ **Not high-risk**:
- Traditional polygraphs operated by trained examiners (not AI)
- Behavioral analysis by human investigators

**Why is this high-risk?** Lie detection AI is:
- **Scientifically questionable**: No reliable method exists to detect lies from physiological or behavioral cues
- **Culturally biased**: Emotional expressions vary across cultures
- **Coercive**: Can pressure innocent people into false confessions
- **Rights-violating**: Presumption of innocence requires not assuming deception

**Real-world scenario**: A police department using AI to analyze suspects' facial expressions and voice patterns during interrogations to assess truthfulness is deploying a high-risk system (and likely violating rights given the lack of scientific validity).

### Deep Fake Detection

**What triggers high-risk classification?** AI systems that identify manipulated media (images, videos, audio) for law enforcement purposes.

**Examples**:

✅ **High-risk deep fake detection**:
- AI analyzing video evidence to detect manipulation
- AI authenticating audio recordings in criminal cases
- AI identifying synthetic media used in crimes

❌ **Not high-risk**:
- Deep fake detection for social media content moderation (not law enforcement)
- Forensic analysis by human experts using AI tools

**Why is this high-risk?** Deep fake detection affects:
- **Evidence admissibility**: Incorrectly labeling authentic evidence as fake can free guilty parties
- **False accusations**: Incorrectly labeling fake evidence as authentic can convict innocent people
- **Due process**: Defendants have the right to challenge evidence, requiring explainable AI

**Real-world scenario**: A prosecutor using AI to analyze a video allegedly showing the defendant committing a crime, determining whether it's authentic or a deep fake, is deploying a high-risk system.

### Evaluating Reliability of Evidence

**What triggers high-risk classification?** AI systems that assess the credibility or reliability of evidence in criminal cases.

**Examples**:

✅ **High-risk evidence evaluation**:
- AI assessing reliability of witness statements
- AI evaluating consistency of testimony
- AI analyzing forensic evidence (DNA, fingerprints, ballistics)
- AI determining authenticity of documents

❌ **Not high-risk**:
- Database searches matching fingerprints or DNA (narrow procedural task)
- Document translation or transcription (narrow procedural task)

**Why is this high-risk?** Evidence evaluation directly affects:
- **Guilt or innocence**: Unreliable evidence assessment can convict innocent people or free guilty ones
- **Due process**: Defendants must be able to challenge evidence and understand how it was evaluated
- **Fairness**: Biased evaluation can discriminate against certain groups

**Real-world scenario**: An AI system that analyzes witness statements, compares them to physical evidence, and produces a "reliability score" for each witness is deploying a high-risk system. However, a database that searches for fingerprint matches (without assessing reliability) is not high-risk.

### Risk Assessment for Offending or Reoffending

**What triggers high-risk classification?** AI systems that predict whether individuals will commit crimes or reoffend.

**Examples**:

✅ **High-risk recidivism assessment**:
- AI predicting likelihood of reoffending for parole decisions
- AI assessing risk for bail/pretrial release decisions
- AI evaluating rehabilitation program success likelihood
- AI determining sentencing recommendations based on recidivism risk

❌ **Prohibited**:
- AI predicting criminality based solely on profiling without objective facts (Article 5)

**Why is this high-risk?** Recidivism prediction affects:
- **Liberty**: Bail and parole decisions determine whether people remain incarcerated
- **Sentencing**: Risk assessments can influence sentence length
- **Rehabilitation**: Program placement affects chances of successful reintegration
- **Bias**: Historical data reflects discriminatory policing and sentencing practices

**Key distinction**: This is **permitted** (if compliant) because it's based on objective facts (criminal history, rehabilitation participation). Predictive policing based **solely on profiling** (personality, demographics) is **prohibited** (Module 3).

**Real-world scenario**: A parole board using AI to assess an inmate's recidivism risk based on criminal history, behavior in prison, rehabilitation program completion, and other objective factors to inform parole decisions is deploying a high-risk system (legal if compliant). However, police using AI to predict who will commit crimes based on neighborhood, social connections, and demographics without evidence of criminal activity is prohibited.

### Profiling for Detection, Investigation, or Prosecution

**What triggers high-risk classification?** AI systems that create profiles of individuals during criminal investigations.

**Examples**:

✅ **High-risk law enforcement profiling**:
- AI analyzing suspects' behavior patterns
- AI profiling individuals based on investigative data
- AI creating psychological profiles of offenders
- AI linking individuals to criminal networks

❌ **Not high-risk**:
- Database searches for known offenders (narrow procedural task)
- Forensic analysis of physical evidence

**Why is this high-risk?** Profiling can:
- **Violate privacy**: Extensive data collection and analysis
- **Create bias**: Profiles based on stereotypes or discriminatory data
- **Misidentify**: Innocent people matching profiles can be wrongly targeted
- **Expand scope**: Profiling can extend investigations beyond legitimate targets

**Real-world scenario**: Police using AI to analyze a suspect's social media activity, financial transactions, location history, and communications to create a behavioral profile for investigation is deploying a high-risk system.

### Crime Analytics Regarding Natural Persons

**What triggers high-risk classification?** AI systems that analyze crime data involving identifiable individuals.

**Examples**:

✅ **High-risk crime analytics**:
- AI analyzing crime patterns linked to specific individuals
- AI identifying criminal networks and members
- AI predicting crime hotspots based on individual-level data
- AI linking crimes to potential suspects

❌ **Not high-risk**:
- Aggregate crime statistics by area (not individual-level)
- Crime trend analysis without identifying individuals

**Why is this high-risk?** Individual-level crime analytics can:
- **Stigmatize**: Labeling individuals or communities as high-risk
- **Violate privacy**: Extensive surveillance and data collection
- **Create bias**: Perpetuating discriminatory policing patterns
- **Misallocate resources**: Focusing on predicted rather than actual crime

**Real-world scenario**: A police department using AI to analyze crime data and identify individuals likely to be involved in criminal activity based on their associations, location patterns, and other data is deploying a high-risk system. However, analyzing aggregate crime statistics to determine which neighborhoods need more patrols (without identifying individuals) is not high-risk.

## Category 7: Migration, Asylum, and Border Control

**Annex III, Point 7**: AI systems intended to be used by or on behalf of competent public authorities or by Union institutions, bodies, offices, or agencies for:

- Assessing risk posed by natural persons entering or attempting to enter the territory
- Assisting competent public authorities for examining applications for asylum, visa, and residence permits
- Detecting, recognizing, or identifying natural persons (excluding verification of travel documents)

### Risk Assessment for Border Entry

**What triggers high-risk classification?** AI systems that assess security or other risks posed by people crossing borders.

**Examples**:

✅ **High-risk border risk assessment**:
- AI assessing security risk of travelers
- AI determining likelihood of visa overstay
- AI evaluating risk of illegal immigration
- AI assessing terrorism or crime risk

❌ **Not high-risk**:
- Passport scanning and verification (narrow procedural task)
- Automated gates for known travelers (biometric verification, not identification)

**Why is this high-risk?** Border risk assessment affects:
- **Freedom of movement**: Denying entry restricts travel rights
- **Asylum access**: Incorrect risk assessment can endanger refugees
- **Discrimination**: Profiling based on nationality, religion, or ethnicity
- **Family separation**: Entry denials can separate families

**Real-world scenario**: A border control system using AI to analyze travelers' passport data, travel history, social media activity, and other information to assess security risk and determine whether to allow entry is deploying a high-risk system.

### Assisting with Asylum, Visa, and Residence Permit Applications

**What triggers high-risk classification?** AI systems that assist in evaluating applications for legal status.

**Examples**:

✅ **High-risk immigration application systems**:
- AI assessing asylum claims for credibility
- AI evaluating visa applications
- AI determining eligibility for residence permits
- AI recommending approval or denial of applications

❌ **Not high-risk**:
- Document translation (narrow procedural task)
- Application completeness checks (narrow procedural task)
- Appointment scheduling (narrow procedural task)

**Why is this high-risk?** Immigration decisions affect:
- **Safety**: Denying asylum can send refugees back to danger
- **Family unity**: Visa denials separate families
- **Economic opportunity**: Work permits determine livelihood
- **Discrimination**: Bias against certain nationalities or religions

**Real-world scenario**: An immigration agency using AI to analyze asylum applications, assess credibility of claims, and recommend approval or denial is deploying a high-risk system. However, an AI system that translates application documents or checks that all required forms are submitted is not high-risk.

### Detecting, Recognizing, or Identifying Natural Persons

**What triggers high-risk classification?** AI systems that identify individuals at borders (excluding travel document verification).

**Examples**:

✅ **High-risk border identification**:
- Facial recognition systems identifying individuals at border crossings
- Biometric identification for immigration enforcement
- AI identifying individuals in border surveillance footage

❌ **Not high-risk**:
- Biometric verification matching travelers to their passports (verification, not identification)
- Document authentication (not identifying persons)

**Why is this high-risk?** Border identification enables:
- **Mass surveillance**: Tracking everyone crossing borders
- **Discrimination**: Higher error rates for certain demographics
- **Rights violations**: Identifying asylum seekers or refugees without proper process
- **Mission creep**: Systems deployed for security expanding to general surveillance

**Real-world scenario**: A border crossing using facial recognition to identify individuals against watchlists or databases is deploying a high-risk system. However, an automated gate that verifies a traveler matches their passport photo is not high-risk (verification, not identification).

## Category 8: Administration of Justice and Democratic Processes

**Annex III, Point 8**: AI systems intended to assist a judicial authority in researching and interpreting facts and the law and in applying the law to a concrete set of facts, or to be used in a similar way in alternative dispute resolution.

### Assisting Judicial Authorities

**What triggers high-risk classification?** AI systems that assist judges, courts, or tribunals in legal decision-making.

**Examples**:

✅ **High-risk judicial assistance systems**:
- AI analyzing case law to recommend legal precedents
- AI assessing evidence and suggesting findings of fact
- AI recommending sentences or remedies
- AI evaluating legal arguments for strength
- AI predicting case outcomes
- AI assisting in legal research for judicial decisions

❌ **Not high-risk**:
- Legal research databases (search tools, not decision assistance)
- Case management systems (administrative, not substantive)
- Court scheduling systems (narrow procedural task)

**Why is this high-risk?** Judicial AI affects:
- **Justice**: Incorrect legal analysis can result in unjust outcomes
- **Rights**: Due process requires human judgment in legal decisions
- **Accountability**: Judges must be able to explain and justify decisions
- **Bias**: AI trained on historical data can perpetuate discriminatory outcomes

**Key principle**: AI can **assist** judges but cannot **replace** judicial decision-making. Final decisions must be made by human judges who understand and take responsibility for outcomes.

**Real-world scenario**: A court using AI to analyze evidence in a case, identify relevant legal precedents, and suggest findings of fact and legal conclusions for the judge's consideration is deploying a high-risk system. However, a legal research database that allows judges to search for cases by keyword is not high-risk.

### Alternative Dispute Resolution

**What triggers high-risk classification?** AI systems used in mediation, arbitration, or other dispute resolution outside courts.

**Examples**:

✅ **High-risk ADR systems**:
- AI assisting arbitrators in evaluating claims
- AI recommending settlements in mediation
- AI assessing evidence in arbitration proceedings
- AI determining outcomes in online dispute resolution

❌ **Not high-risk**:
- Scheduling systems for mediation sessions (narrow procedural task)
- Document sharing platforms (not decision-making)

**Why is this high-risk?** ADR AI affects:
- **Fairness**: Parties must receive fair evaluation of their claims
- **Rights**: Binding arbitration decisions affect legal rights
- **Bias**: AI can perpetuate power imbalances between parties
- **Transparency**: Parties have the right to understand how decisions are reached

**Real-world scenario**: An online dispute resolution platform using AI to evaluate consumer complaints, assess evidence, and recommend resolutions is deploying a high-risk system.

## Practical Application

### Case Study 1: Credit Scoring for Mortgage

**System**: Bank uses AI to evaluate mortgage applications, analyzing income, credit history, employment, and other factors to approve/deny loans and set interest rates.

**Analysis**:
- **Annex III category**: Essential services (creditworthiness evaluation)
- **Exception?** No—substantive decision-making, not fraud detection
- **Profiling?** Yes—evaluating economic situation and reliability
- **Result**: High-risk

### Case Study 2: Emergency Call Triage

**System**: City uses AI to analyze 911 calls, assess urgency, and dispatch appropriate emergency services with priority levels.

**Analysis**:
- **Annex III category**: Essential services (emergency dispatching)
- **Exception?** No—life-and-death decision-making
- **Safety component?** Yes—failure could result in death
- **Result**: High-risk

### Case Study 3: Recidivism Risk Assessment

**System**: Parole board uses AI to assess inmates' likelihood of reoffending based on criminal history, prison behavior, and rehabilitation participation.

**Analysis**:
- **Annex III category**: Law enforcement (risk of offending/reoffending)
- **Based solely on profiling?** No—based on objective facts
- **Exception?** No—substantive decision affecting liberty
- **Result**: High-risk

### Case Study 4: Asylum Application Evaluation

**System**: Immigration agency uses AI to analyze asylum applications, assess credibility of claims, and recommend approval/denial.

**Analysis**:
- **Annex III category**: Migration (assisting with asylum applications)
- **Exception?** No—substantive decision affecting safety and rights
- **Profiling?** Yes—evaluating credibility and risk
- **Result**: High-risk

### Case Study 5: Legal Research for Judges

**System**: Court uses AI to analyze case facts, search legal precedents, and suggest relevant case law for judge's consideration.

**Analysis**:
- **Annex III category**: Justice (assisting judicial authority)
- **Exception?** No—assisting substantive legal decision-making
- **Replacing judgment?** No—judge makes final decision
- **Result**: High-risk

## Heightened Sensitivity

The final four Annex III categories involve particularly sensitive applications:

- **Essential services**: Access to credit and emergency response are fundamental to economic opportunity and safety
- **Law enforcement**: Criminal justice decisions affect liberty, reputation, and fundamental rights
- **Migration**: Immigration decisions can be life-or-death for asylum seekers and affect family unity
- **Justice**: Legal decisions determine rights, obligations, and access to justice

These categories require especially rigorous compliance measures, including:
- **Fundamental rights impact assessments**: Mandatory evaluation of effects on affected persons' rights
- **Human oversight**: Meaningful human review and decision-making authority
- **Transparency**: Clear explanation of how AI influences decisions
- **Accountability**: Mechanisms for challenging AI-influenced decisions

## Conclusion

The eight Annex III categories cover AI systems that significantly impact fundamental rights, safety, and access to essential services and opportunities:

1. Biometric identification and categorization
2. Critical infrastructure
3. Education and vocational training
4. Employment and worker management
5. Essential private and public services
6. Law enforcement
7. Migration, asylum, and border control
8. Administration of justice and democratic processes

Understanding these categories is essential for determining whether your AI system is high-risk and subject to extensive compliance obligations. In the next module, we'll explore what providers and deployers must do to comply with high-risk requirements.

## Key Takeaways

✅ **Credit scoring and emergency dispatching AI are high-risk** due to impact on essential services

✅ **Law enforcement AI is high-risk across seven specific use cases** including victim risk assessment, lie detection, evidence evaluation, recidivism prediction, profiling, and crime analytics

✅ **Migration AI affecting border entry, asylum/visa applications, or identification is high-risk** due to safety and rights implications

✅ **Judicial AI assisting courts or alternative dispute resolution is high-risk** due to impact on justice and rights

✅ **Fraud detection is explicitly exempt** from high-risk classification for creditworthiness

✅ **Biometric verification (not identification) is not high-risk** at borders

✅ **These categories involve heightened sensitivity** requiring rigorous compliance measures

✅ **Human oversight is especially critical** in law enforcement, migration, and justice applications
