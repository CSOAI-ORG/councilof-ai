# Module 3: Prohibited AI Practices

**Duration**: 60 minutes  
**Learning Objectives**:
- Identify prohibited AI practices under Article 5
- Understand the narrow exceptions for law enforcement biometrics
- Recognize compliance deadline (February 2, 2025)

---

## Introduction

Article 5 of the EU AI Act establishes a category of AI practices considered so harmful that they are completely banned—regardless of safeguards, transparency, or oversight. These practices are deemed incompatible with EU values and fundamental rights enshrined in the Charter of Fundamental Rights of the European Union.

**Why prohibit rather than regulate?** The EU determined that certain AI applications pose **unacceptable risks** that cannot be mitigated through compliance requirements. Even with perfect technical implementation, these systems would violate human dignity, freedom, and democratic principles.

**Timeline**: Prohibited practices become illegal **6 months after the Act's entry into force**—meaning **February 2, 2025**. Organizations deploying these systems must cease operations immediately or face severe penalties.

## The Complete List of Prohibited AI Practices

### 1. Subliminal Manipulation

**Article 5(1)(a)**: AI systems that deploy subliminal techniques beyond a person's consciousness to materially distort behavior in a manner that causes or is reasonably likely to cause significant harm.

**What this means**: AI that manipulates people without their awareness, exploiting psychological vulnerabilities through imperceptible cues, hidden messaging, or subconscious triggers.

**Examples of prohibited systems**:
- **Audio manipulation**: AI that embeds subliminal messages in music, podcasts, or voice assistants to influence purchasing decisions or political views
- **Visual manipulation**: AI that uses imperceptible flickers, patterns, or images in video content to trigger emotional responses or behavioral changes
- **Algorithmic manipulation**: Recommendation systems that exploit cognitive biases through timing, sequencing, or presentation methods designed to bypass conscious decision-making

**Key requirement**: The manipulation must be:
1. **Subliminal** (beyond conscious perception)
2. **Material** (significantly distorts behavior)
3. **Harmful** (causes or likely to cause significant harm)

**Not prohibited**: Overt persuasion techniques, transparent recommendations, or marketing that operates at a conscious level—even if highly effective.

**Real-world scenario**: A social media platform using AI to determine the optimal time to send notifications when users are most psychologically vulnerable (e.g., late at night, during stressful periods) to maximize engagement could be prohibited if it materially distorts behavior and causes harm (e.g., addiction, sleep deprivation).

### 2. Exploitation of Vulnerabilities

**Article 5(1)(b)**: AI systems that exploit vulnerabilities of specific groups due to age, disability, or social or economic circumstances, distorting behavior in a manner that causes or is reasonably likely to cause significant harm.

**Protected groups**:
- **Children**: Cognitive and emotional immaturity
- **Elderly**: Cognitive decline, isolation, reduced digital literacy
- **People with disabilities**: Physical, mental, intellectual, or sensory impairments
- **Economically disadvantaged**: Financial desperation, limited options
- **Socially vulnerable**: Refugees, homeless, marginalized communities

**Examples of prohibited systems**:
- **Predatory lending AI**: Systems targeting financially desperate individuals with high-interest loans by exploiting their immediate need for cash
- **Child manipulation**: AI-powered toys or apps that exploit children's inability to distinguish advertising from content, manipulating them to make purchases or share personal information
- **Elderly exploitation**: AI chatbots impersonating family members or authority figures to scam elderly people out of money or personal data
- **Disability exploitation**: AI systems that take advantage of cognitive impairments to obtain consent for unfavorable contracts or transactions

**Key distinction**: The prohibition applies when AI **exploits** vulnerabilities, not merely when it serves vulnerable populations. Healthcare AI for elderly patients or educational AI for children with disabilities is permitted and encouraged—exploitation is the issue.

**Real-world scenario**: An AI system that identifies elderly social media users showing signs of cognitive decline and targets them with deceptive investment schemes would be prohibited.

### 3. Social Scoring by Public Authorities

**Article 5(1)(c)**: AI systems used by public authorities or on their behalf for evaluating or classifying natural persons or groups based on social behavior or personal characteristics, with the social score leading to detrimental or unfavorable treatment.

**What is social scoring?** A system that:
1. Evaluates individuals or groups based on behavior or characteristics
2. Produces a score or classification
3. Is used by or for public authorities
4. Results in detrimental treatment in contexts unrelated to the behavior assessed

**The China model**: This provision directly targets systems like China's Social Credit System, which:
- Monitors citizens' behavior (online activity, purchases, social connections, public conduct)
- Assigns scores based on "trustworthiness"
- Restricts access to services (travel, education, employment) based on scores
- Applies consequences in contexts unrelated to the original behavior

**Examples of prohibited systems**:
- **General social credit**: A government AI system that tracks citizens' social media posts, shopping habits, and social connections to produce a "citizenship score" affecting access to public housing, education, or travel
- **Cross-context punishment**: AI that denies someone access to healthcare based on their traffic violations or social media activity
- **Group-based discrimination**: AI that classifies neighborhoods or communities as "high-risk" based on aggregate behavior, restricting residents' access to services

**Not prohibited**:
- **Context-specific assessment**: Credit scoring for loan applications (assessing financial behavior for financial decisions)
- **Criminal justice risk assessment**: Evaluating recidivism risk for sentencing (though this is high-risk and heavily regulated)
- **Sector-specific evaluation**: Teacher performance evaluation for employment decisions in education

**Key distinction**: Social scoring is prohibited when it creates **cross-context consequences**—behavior in one domain affecting treatment in unrelated domains.

**Real-world scenario**: A city government using AI to monitor citizens' recycling habits, noise complaints, and parking violations to produce a "good citizen score" that affects priority for public housing would be prohibited.

### 4. Biometric Categorization of Sensitive Attributes

**Article 5(1)(d)**: AI systems that categorize individuals based on biometric data to infer or deduce sensitive attributes such as race, political opinions, trade union membership, religious or philosophical beliefs, sex life, or sexual orientation.

**Exception**: Labeling or filtering lawfully acquired biometric datasets in law enforcement contexts, or law enforcement categorization of biometric data.

**What is biometric categorization?** Using physical, physiological, or behavioral characteristics (facial features, gait, voice, etc.) to infer protected characteristics.

**Examples of prohibited systems**:
- **Facial analysis for race**: AI that analyzes facial features to classify individuals by race or ethnicity for any purpose (hiring, lending, marketing, public services)
- **Gait analysis for sexual orientation**: AI that attempts to infer sexual orientation from walking patterns
- **Voice analysis for political views**: AI that analyzes speech patterns to deduce political affiliation
- **Appearance-based religion inference**: AI that infers religious beliefs from clothing, hairstyles, or facial features

**Why is this prohibited?** 
1. **Scientific invalidity**: These inferences are often based on stereotypes and lack scientific basis
2. **Discrimination risk**: Even if accurate, using these categories perpetuates discrimination
3. **Privacy violation**: Inferring sensitive attributes violates the right to privacy and data protection
4. **Dignity harm**: Reducing individuals to inferred categories violates human dignity

**Exception explained**: Law enforcement can use biometric categorization in narrow contexts:
- **Labeling datasets**: Annotating lawfully collected images with demographic information for training or analysis
- **Investigation purposes**: Categorizing suspects' biometric data during criminal investigations

**Not prohibited**:
- **Self-reported categorization**: Systems where individuals voluntarily provide sensitive attributes
- **Medical diagnosis**: AI analyzing physical characteristics for health purposes (e.g., genetic disorder identification)
- **Age verification**: Estimating age for access control (not a sensitive attribute under GDPR)

**Real-world scenario**: A retail store using facial recognition AI to infer customers' race and religion to tailor product recommendations would be prohibited. However, a medical AI analyzing facial features to diagnose genetic conditions would be permitted.

### 5. Predictive Policing Based Solely on Profiling

**Article 5(1)(e)**: AI systems assessing the risk of a natural person committing a criminal offense based solely on profiling or assessing personality traits and characteristics.

**Key word: "solely"**: This prohibition applies when AI predicts criminality **only** from profiling, without objective, verifiable facts directly linked to criminal activity.

**What is profiling?** Automated processing of personal data to evaluate aspects of a person's life—work performance, economic situation, health, preferences, interests, reliability, behavior, location, or movements.

**Examples of prohibited systems**:
- **Personality-based crime prediction**: AI that predicts someone will commit a crime based on personality assessments (e.g., "aggressive personality type" = high crime risk)
- **Demographic profiling**: AI that assigns crime risk based on age, race, neighborhood, or social connections without evidence of criminal activity
- **Behavioral pattern prediction**: AI that predicts criminality from shopping habits, social media activity, or lifestyle choices without connection to actual criminal behavior

**Permitted uses**:
- **Augmenting human assessment**: AI that assists human decision-makers by analyzing objective facts (prior convictions, evidence from investigations)
- **Evidence-based risk assessment**: AI that evaluates recidivism risk based on criminal history, rehabilitation progress, and other objective, verifiable factors directly linked to criminal activity
- **Investigative tools**: AI that analyzes evidence in ongoing investigations (not predicting who will commit future crimes)

**Key distinction**: The prohibition targets **predictive** systems that label people as future criminals based on characteristics, not **investigative** systems that analyze evidence of actual crimes.

**Real-world scenario**: A police department using AI to generate a "potential offender list" based on individuals' social media posts, friend networks, and shopping patterns would be prohibited. However, using AI to assess recidivism risk for parole decisions based on criminal history and rehabilitation participation would be permitted (though high-risk and regulated).

### 6. Untargeted Scraping of Facial Images

**Article 5(1)(f)**: Creating or expanding facial recognition databases through untargeted scraping of facial images from the internet or CCTV footage.

**What is untargeted scraping?** Indiscriminate collection of facial images from publicly accessible sources without:
- Specific purpose or investigation
- Individual consent
- Legal basis under data protection law

**Examples of prohibited practices**:
- **Internet scraping**: Crawling social media, websites, or online platforms to collect millions of facial images for a general-purpose facial recognition database
- **CCTV harvesting**: Collecting facial images from public surveillance cameras without specific investigative purpose
- **Photo aggregation**: Building databases by scraping images from news articles, blogs, or public photo repositories

**Why is this prohibited?**
1. **Mass surveillance risk**: Enables indiscriminate tracking of individuals in public spaces
2. **Consent violation**: People posting photos online don't consent to facial recognition use
3. **Purpose limitation**: Violates data protection principle that data should be collected for specific purposes
4. **Chilling effect**: Creates fear of surveillance, restricting freedom of expression and assembly

**Permitted practices**:
- **Targeted collection**: Law enforcement collecting images of specific suspects in criminal investigations
- **Consensual databases**: Systems where individuals voluntarily provide images (employee access control, customer opt-in services)
- **Lawful datasets**: Databases created under specific legal authority (passport photos, driver's licenses) with clear legal basis

**Real-world scenario**: A company scraping Facebook, Instagram, and LinkedIn to build a facial recognition database sold to law enforcement and private companies would be prohibited. However, a company building a facial recognition system using only images voluntarily submitted by users would be permitted.

### 7. Emotion Recognition in Workplaces and Schools

**Article 5(1)(g)**: AI systems inferring emotions of natural persons in the workplace and educational institutions.

**Exception**: Medical or safety reasons.

**What is emotion recognition?** AI that analyzes facial expressions, voice tone, body language, or physiological signals to infer emotional states (happiness, sadness, anger, stress, engagement, etc.).

**Examples of prohibited systems**:
- **Workplace monitoring**: AI cameras analyzing employees' facial expressions to assess productivity, engagement, or job satisfaction
- **Student attention tracking**: AI monitoring students' faces during class to measure attention, interest, or comprehension
- **Interview analysis**: AI assessing job candidates' emotions during interviews to evaluate suitability
- **Performance evaluation**: AI using emotion detection to evaluate employee performance or student learning

**Why is this prohibited in workplaces and schools?**
1. **Power imbalance**: Employees and students cannot meaningfully consent due to hierarchical relationships
2. **Pseudoscience**: Emotion recognition AI often lacks scientific validity—facial expressions don't reliably indicate internal emotional states
3. **Discrimination risk**: Systems may misinterpret cultural differences in emotional expression
4. **Dignity violation**: Constant emotional surveillance violates human dignity and autonomy
5. **Chilling effect**: Creates oppressive environment, restricting authentic expression

**Medical and safety exceptions**:
- **Driver fatigue detection**: AI monitoring truck drivers' faces to detect drowsiness and prevent accidents
- **Patient monitoring**: AI analyzing patients' emotional states to detect pain, distress, or mental health crises
- **Pilot alertness**: AI monitoring pilots' attention and stress levels for flight safety
- **Special education**: AI helping teachers identify when students with autism or communication disorders are distressed

**Not prohibited**:
- **Voluntary consumer applications**: Emotion recognition in entertainment, gaming, or personal wellness apps where users opt in
- **Research contexts**: Academic research with informed consent and ethical approval
- **Public spaces**: Emotion recognition outside workplaces and schools (though other regulations may apply)

**Real-world scenario**: An employer installing AI cameras to monitor employees' facial expressions and flag those showing "low engagement" or "negative emotions" for performance reviews would be prohibited. However, a hospital using AI to monitor patients' facial expressions to detect pain and alert nurses would be permitted.

### 8. Real-Time Remote Biometric Identification in Public Spaces

**Article 5(1)(h)**: Use of 'real-time' remote biometric identification (RBI) systems in publicly accessible spaces for law enforcement purposes.

**Narrow exceptions**: Permitted only for:
1. Targeted search for missing persons, abduction victims, trafficking victims, or sexual exploitation victims
2. Prevention of substantial and imminent threat to life or foreseeable terrorist attack
3. Identification of suspects in serious crimes

**What is real-time RBI?** AI that:
- Identifies individuals (not just verifies identity)
- Operates remotely (without physical interaction)
- Processes biometric data in real-time (immediate identification)
- Functions in publicly accessible spaces (streets, parks, transport hubs, shopping areas)

**Examples**:
- **Facial recognition cameras**: Live facial recognition scanning crowds in public squares, train stations, or streets
- **Gait recognition**: AI identifying individuals by walking patterns captured by surveillance cameras
- **Voice recognition**: AI identifying individuals from voice captured in public spaces

**Why is this generally prohibited?**
1. **Mass surveillance**: Enables tracking everyone in public spaces without suspicion
2. **Chilling effect**: Deters people from exercising rights to assembly, protest, and free movement
3. **Discrimination risk**: Higher error rates for certain demographic groups
4. **Mission creep**: Systems deployed for one purpose often expand to broader surveillance

**Exceptions explained**:

#### Exception 1: Missing Persons and Victims
- **Targeted search**: Must be searching for specific identified individuals
- **Vulnerable victims**: Children, trafficking victims, sexual exploitation victims
- **Time-sensitive**: Immediate danger to the person's safety

**Example**: Police using facial recognition to search for a kidnapped child in a train station.

#### Exception 2: Imminent Threats
- **Substantial threat**: Serious risk to life (not minor crimes)
- **Imminent**: Immediate or very near-term threat
- **Prevention**: Used to prevent harm, not investigate past events

**Example**: Using facial recognition to identify a terrorist suspect believed to be planning an imminent attack in a crowded area.

#### Exception 3: Serious Crime Suspects
- **Serious crimes**: Murder, rape, armed robbery, drug trafficking, organized crime, environmental crime (list in Annex II)
- **Identified suspects**: Must be searching for specific individuals suspected of these crimes
- **Investigation**: Used to locate and apprehend suspects

**Example**: Using facial recognition to locate a murder suspect believed to be in a specific neighborhood.

**Safeguards for exceptions**:

1. **Prior authorization**: Must obtain approval from judicial authority or independent administrative authority before deployment
   - **Exception**: In duly justified urgent cases, can deploy first and request authorization within 24 hours
   - If authorization denied, must cease immediately and delete all data

2. **Fundamental rights impact assessment**: Must assess impact on affected persons' rights before deployment

3. **Registration**: Must register the system in the EU database (can be done after deployment in urgent cases)

4. **Proportionality**: Use must be necessary and proportionate—no less intrusive means available

5. **Temporal and geographic limits**: Must be limited in time and geographic scope

**Not covered by prohibition**:
- **Post-event investigation**: Analyzing recorded footage after a crime (not real-time)
- **Biometric verification**: Confirming someone is who they claim to be (e.g., border control)
- **Private spaces**: Biometric identification in non-public spaces (offices, private events)

**Real-world scenario**: A city installing live facial recognition cameras throughout its downtown area to identify anyone with outstanding warrants would be prohibited. However, police using facial recognition for 2 hours in a specific train station to search for a specific terrorist suspect after receiving credible intelligence of an imminent attack would be permitted (with prior judicial authorization and fundamental rights assessment).

## Enforcement Timeline

**Critical deadline**: February 2, 2025 (6 months after entry into force on August 1, 2024)

**What happens on February 2, 2025?**
- All prohibited AI practices become illegal throughout the EU
- Organizations must cease all prohibited activities immediately
- Deployment, use, or placing on market of prohibited systems is subject to penalties

**Penalties for violations**:
- **€35 million OR 7% of total worldwide annual turnover** (whichever is higher)
- This is the maximum penalty tier—reserved for the most serious violations
- SMEs face proportionally adjusted fines

**Compliance actions required now**:
1. **Inventory**: Identify all AI systems your organization develops or deploys
2. **Assessment**: Evaluate whether any fall into prohibited categories
3. **Cessation plan**: If prohibited systems exist, plan immediate shutdown
4. **Documentation**: Document your assessment and actions taken
5. **Training**: Ensure decision-makers understand prohibited practices

## Common Misconceptions

### Misconception 1: "If we add transparency, prohibited systems become legal"
**Reality**: No. Prohibited practices are banned regardless of safeguards, transparency, or consent. You cannot make a social scoring system legal by disclosing it to citizens.

### Misconception 2: "Prohibition only applies to new systems"
**Reality**: No. Existing systems must be shut down by February 2, 2025. There is no grandfathering or transition period for prohibited practices.

### Misconception 3: "We're outside the EU, so this doesn't apply"
**Reality**: If your AI system's output is used in the EU, the Act applies. A US company providing emotion recognition software to EU schools must comply.

### Misconception 4: "B2B sales exempt us from prohibition"
**Reality**: No. Providing prohibited AI systems to other businesses is equally illegal. You cannot sell social scoring systems to EU governments.

### Misconception 5: "Research and development are exempt"
**Reality**: Partially true. R&D before market release is exempt, but once you deploy or sell the system, prohibitions apply.

## Practical Guidance

### If you're developing AI systems:

**Step 1: Review Article 5 carefully**
- Don't rely on summaries—read the actual regulation text
- Consult legal counsel if any ambiguity exists

**Step 2: Conduct prohibition assessment**
- For each AI system, explicitly evaluate whether it falls into prohibited categories
- Document your reasoning
- Err on the side of caution

**Step 3: Redesign or discontinue**
- If a system is prohibited, you have two options: redesign to remove prohibited elements or discontinue entirely
- There is no third option of "compliance measures"

**Step 4: Monitor regulatory guidance**
- The AI Office and national authorities will issue guidance
- Case law will develop as enforcement begins
- Stay informed on interpretations and enforcement actions

### If you're deploying AI systems:

**Step 1: Vendor due diligence**
- Ask vendors explicitly whether their systems involve prohibited practices
- Request documentation of their Article 5 assessment
- Include contractual warranties that systems comply with prohibitions

**Step 2: Use case review**
- Even if a system isn't inherently prohibited, your use case might be
- Example: A general emotion recognition system becomes prohibited when deployed in your workplace

**Step 3: Immediate cessation plan**
- If you discover you're using a prohibited system, cease use immediately
- Document the discovery and cessation
- Notify relevant authorities if required

## Conclusion

Article 5's prohibitions represent the EU's red lines—AI practices incompatible with fundamental rights and human dignity. Unlike high-risk systems that can be made compliant through safeguards, prohibited practices cannot be fixed—they must be eliminated.

The February 2, 2025 deadline is imminent. Organizations must act now to identify and cease prohibited practices. The penalties are severe, and ignorance is not a defense.

In the next module, we'll explore high-risk AI systems—those that can be deployed legally but require extensive compliance measures.

## Key Takeaways

✅ **8 categories of AI practices are completely prohibited** under Article 5, regardless of safeguards

✅ **Subliminal manipulation and exploitation of vulnerabilities** are banned when they cause significant harm

✅ **Social scoring by public authorities** is prohibited when it creates cross-context consequences

✅ **Biometric categorization of sensitive attributes** (race, religion, sexual orientation) is banned except in narrow law enforcement contexts

✅ **Predictive policing based solely on profiling** is prohibited—must be based on objective facts

✅ **Untargeted scraping of facial images** from internet or CCTV is banned

✅ **Emotion recognition in workplaces and schools** is prohibited except for medical/safety reasons

✅ **Real-time biometric identification in public spaces** is generally prohibited with narrow exceptions for missing persons, imminent threats, and serious crime suspects

✅ **Enforcement begins February 2, 2025**—organizations must cease prohibited practices immediately

✅ **Maximum penalties**: €35M or 7% of global turnover for violations

✅ **No compliance pathway exists**—prohibited systems must be discontinued, not made compliant
