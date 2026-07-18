# Module 4: High-Risk AI Systems - Part 1

**Duration**: 60 minutes  
**Learning Objectives**:
- Recognize high-risk AI systems in biometrics, infrastructure, education, and employment
- Apply exceptions correctly (narrow procedural tasks, human activity improvement)
- Evaluate whether your AI system falls into these categories

---

## Introduction

In Module 2, we learned that high-risk AI systems are determined through two pathways: Annex I (safety components) and Annex III (use cases). This module provides an in-depth exploration of the first four Annex III categories:

1. Biometric identification and categorization
2. Critical infrastructure
3. Education and vocational training
4. Employment and worker management

These categories represent areas where AI can significantly impact fundamental rights, safety, and life opportunities. High-risk classification triggers extensive compliance obligations (covered in Module 6), but systems can be legally deployed if requirements are met.

## Category 1: Biometric Identification and Categorization

**Annex III, Point 1**: AI systems intended to be used for remote biometric identification, biometric categorization, and emotion recognition (excluding prohibited practices covered in Module 3).

### Remote Biometric Identification

**What is it?** AI systems that identify individuals from a distance using biometric data—facial features, gait, voice, iris patterns, fingerprints, or other physical/behavioral characteristics.

**Key distinction**: **Identification** (who is this person?) vs. **Verification** (is this the person they claim to be?).

**High-risk**: Remote biometric identification systems  
**Not high-risk**: Biometric verification systems

**Examples**:

✅ **High-risk remote biometric identification**:
- Facial recognition system scanning crowds to identify individuals
- Gait recognition identifying people by walking patterns
- Voice recognition identifying speakers from audio recordings
- Iris recognition cameras identifying individuals at a distance

❌ **Not high-risk biometric verification**:
- Face ID on smartphones (verifying you are the phone owner)
- Fingerprint scanners for building access (verifying employee identity)
- Passport e-gates at airports (verifying you match your passport photo)
- Voice authentication for phone banking (verifying you are the account holder)

**Why is identification high-risk but verification isn't?**
- **Identification** enables mass surveillance—scanning everyone to find specific individuals
- **Verification** requires the person to present themselves—no surveillance capability
- **Identification** has higher error rates and discrimination risks
- **Verification** has clear consent and purpose limitation

**Real-world scenario**: A shopping mall installing facial recognition cameras to identify shoplifters from a watchlist is deploying a high-risk AI system. However, an office building using facial recognition to verify employees at the entrance (employees look at camera, system confirms identity) is not high-risk.

### Biometric Categorization (Non-Prohibited)

**What is it?** AI systems that categorize individuals into groups based on biometric data—but not inferring sensitive attributes (which is prohibited under Article 5).

**High-risk**: Biometric categorization systems (excluding prohibited sensitive attribute inference)  
**Prohibited**: Inferring race, political opinions, religion, sexual orientation, etc. (Module 3)

**Examples**:

✅ **High-risk biometric categorization**:
- Age estimation systems for content access control (e.g., age-restricted content)
- Gender classification for demographic analytics (if not inferring from protected characteristics)
- Behavioral pattern categorization for security screening

❌ **Prohibited biometric categorization**:
- Inferring race from facial features
- Inferring religion from appearance
- Inferring sexual orientation from biometric data

**Gray area**: Many biometric categorization systems risk crossing into prohibited territory. If your system categorizes people by biometric data, carefully evaluate whether it infers or deduces sensitive attributes.

**Real-world scenario**: A website using facial analysis AI to estimate users' ages to restrict access to age-appropriate content is deploying a high-risk system (but legal if compliant). However, using facial analysis to infer users' race for targeted advertising would be prohibited.

### Emotion Recognition (Non-Prohibited Contexts)

**What is it?** AI systems that infer emotional states from facial expressions, voice, body language, or physiological signals.

**Prohibited**: Emotion recognition in workplaces and educational institutions (Module 3)  
**High-risk**: Emotion recognition in other contexts (public spaces, consumer applications, healthcare)

**Examples**:

✅ **High-risk emotion recognition (legal if compliant)**:
- Retail stores analyzing shoppers' emotional responses to products
- Call centers analyzing customer emotions during support calls
- Healthcare AI monitoring patients' emotional states
- Driver monitoring systems detecting stress or fatigue

❌ **Prohibited emotion recognition**:
- Workplace employee monitoring
- Student attention tracking in schools
- Job interview emotion analysis

**Real-world scenario**: A hospital using AI to monitor patients' facial expressions to detect pain or distress is deploying a high-risk system (legal if compliant). However, an employer using the same technology to monitor employees' emotions during work would be prohibited.

## Category 2: Critical Infrastructure

**Annex III, Point 2**: AI systems intended to be used as safety components in the management and operation of critical digital infrastructure, road traffic, or the supply of water, gas, heating, or electricity.

### What is Critical Infrastructure?

Infrastructure essential for maintaining vital societal functions, economic activities, health, safety, security, or social well-being. Disruption would have significant negative impact.

**Key requirement**: The AI system must be a **safety component**—its failure or malfunction could endanger health, safety, or infrastructure integrity.

### Critical Digital Infrastructure

**Examples**:

✅ **High-risk AI in critical digital infrastructure**:
- AI managing core internet routing and switching
- AI controlling telecommunications network operations
- AI managing cloud infrastructure for essential services
- AI securing critical government or financial networks

❌ **Not high-risk**:
- AI optimizing website performance for e-commerce
- AI managing office IT infrastructure
- AI chatbots for customer service

**Key distinction**: "Critical" means essential for societal functioning. A company's internal IT infrastructure, while important to the company, is not critical infrastructure under the AI Act.

**Real-world scenario**: An AI system managing traffic routing for a national telecommunications network is high-risk. An AI system managing a company's internal email servers is not.

### Road Traffic

**Examples**:

✅ **High-risk AI in road traffic**:
- AI controlling traffic light systems
- AI managing highway speed limits and lane controls
- AI coordinating autonomous vehicle traffic flow
- AI operating railway signaling systems
- AI managing air traffic control systems

❌ **Not high-risk**:
- Navigation apps providing route suggestions (not controlling infrastructure)
- Parking apps finding available spaces
- Ride-sharing algorithms matching drivers and passengers

**Key distinction**: The AI must **control** traffic infrastructure or **operate** transportation systems, not merely provide information or suggestions.

**Real-world scenario**: An AI system that dynamically adjusts traffic lights based on real-time traffic flow is high-risk. A navigation app that suggests optimal routes to drivers is not.

### Water, Gas, Heating, Electricity Supply

**Examples**:

✅ **High-risk AI in utility infrastructure**:
- AI managing power grid load balancing
- AI controlling water treatment and distribution
- AI operating natural gas pipeline systems
- AI managing district heating networks
- AI coordinating renewable energy integration

❌ **Not high-risk**:
- Smart thermostats in homes (not critical infrastructure)
- Energy usage analytics for consumers
- Billing systems for utilities

**Key distinction**: The AI must manage **critical supply infrastructure**, not individual consumer devices or administrative systems.

**Real-world scenario**: An AI system managing a city's power grid, balancing supply and demand across the network, is high-risk. A smart home system optimizing an individual household's energy usage is not.

## Category 3: Education and Vocational Training

**Annex III, Point 3**: AI systems intended to be used for:
- Determining access or admission to educational and vocational training institutions
- Assessing students in educational and vocational training institutions
- Evaluating learning outcomes, including steering the learning process
- Assessing the appropriate level of education for an individual
- Monitoring and detecting prohibited behavior of students during tests

### Determining Access or Admission

**What triggers high-risk classification?** AI systems that make or significantly influence decisions about who gets access to educational opportunities.

**Examples**:

✅ **High-risk admission systems**:
- AI deciding university admissions based on applications
- AI ranking candidates for limited spots in vocational programs
- AI determining eligibility for scholarship programs
- AI assigning students to schools or programs

❌ **Not high-risk**:
- AI suggesting programs that might interest students (preparatory task)
- AI translating application documents (narrow procedural task)
- AI checking application completeness (narrow procedural task)

**Exception**: If the AI performs a **preparatory task** (organizing information for human decision-makers) without making substantive decisions, it's not high-risk.

**Real-world scenario**: An AI system that analyzes university applications and produces an "admit/reject/waitlist" recommendation that admissions officers typically follow is high-risk. An AI system that translates international students' documents or checks that all required materials are submitted is not high-risk.

### Assessing Students

**What triggers high-risk classification?** AI systems that evaluate student performance, knowledge, or skills in ways that affect their educational outcomes.

**Examples**:

✅ **High-risk assessment systems**:
- AI grading essays, exams, or assignments that determine pass/fail
- AI evaluating student projects or presentations
- AI assessing vocational skills (e.g., welding, coding, medical procedures)
- AI determining course grades or final marks

❌ **Not high-risk**:
- AI providing feedback on practice exercises (not graded)
- AI suggesting areas for improvement (not evaluative)
- Spell-check or grammar tools (improving human work, not assessing it)

**Exception**: If the AI **improves the result of a previously completed human activity** without replacing human assessment, it's not high-risk.

**Real-world scenario**: An AI system that grades student essays and assigns final grades is high-risk. An AI writing assistant that provides grammar and style suggestions while students write (but doesn't grade) is not high-risk.

### Evaluating Learning Outcomes and Steering Learning

**What triggers high-risk classification?** AI systems that assess what students have learned and adapt educational content or pathways based on that assessment.

**Examples**:

✅ **High-risk learning evaluation systems**:
- Adaptive learning platforms that assess mastery and determine progression
- AI that evaluates learning outcomes to decide if students advance to next level
- AI that assesses skill acquisition in vocational training
- AI that personalizes curriculum based on learning assessments

❌ **Not high-risk**:
- Content recommendation systems suggesting optional resources
- Study planners organizing materials
- Flashcard apps for self-study

**Key distinction**: If the AI **steers the learning process** by making decisions about what students learn or when they progress, it's high-risk. If it merely suggests optional resources, it's not.

**Real-world scenario**: An adaptive math learning platform that assesses students' understanding and determines when they're ready to move to the next topic (blocking progression until mastery) is high-risk. A study app that suggests related videos based on topics students are studying is not high-risk.

### Assessing Appropriate Level of Education

**What triggers high-risk classification?** AI systems that determine what level or type of education is suitable for an individual.

**Examples**:

✅ **High-risk level assessment systems**:
- AI placing students into advanced, standard, or remedial tracks
- AI determining appropriate grade level for transfer students
- AI assessing readiness for higher education
- AI recommending vocational vs. academic pathways

❌ **Not high-risk**:
- Career aptitude tests providing suggestions (not determinative)
- Self-assessment tools for personal reflection

**Key distinction**: If the AI's assessment **determines** placement or access, it's high-risk. If it merely provides information for students to consider, it's not.

**Real-world scenario**: An AI system that analyzes students' performance and assigns them to ability-based learning tracks is high-risk. A career exploration tool that suggests fields students might enjoy based on interests is not high-risk.

### Monitoring and Detecting Prohibited Behavior During Tests

**What triggers high-risk classification?** AI systems that monitor students during exams to detect cheating or prohibited behavior.

**Examples**:

✅ **High-risk proctoring systems**:
- AI monitoring students' faces, eye movements, and surroundings during online exams
- AI detecting suspicious behavior patterns during tests
- AI analyzing audio for unauthorized communication
- AI flagging potential cheating for human review

❌ **Not high-risk**:
- Timer applications for exams (narrow procedural task)
- Plagiarism detection on submitted work (post-exam analysis)

**Why is proctoring high-risk?** It involves:
- Biometric processing (facial recognition, gaze tracking)
- Real-time surveillance
- Significant consequences (exam invalidation, academic penalties)
- Privacy intrusion (monitoring home environments)

**Real-world scenario**: An online proctoring system that uses webcam and screen monitoring with AI to detect cheating during remote exams is high-risk. A plagiarism detection tool that analyzes submitted essays after the exam is not high-risk (though it may be high-risk under employment category if used for hiring decisions).

## Category 4: Employment and Worker Management

**Annex III, Point 4**: AI systems intended to be used for:
- Recruitment or selection of natural persons
- Making decisions affecting terms of work-related relationships, promotion, or termination
- Task allocation and monitoring or evaluation of persons in work-related relationships

### Recruitment or Selection

**What triggers high-risk classification?** AI systems involved in hiring processes that affect who gets job opportunities.

**Examples**:

✅ **High-risk recruitment systems**:
- AI screening resumes and filtering out candidates
- AI ranking job applicants
- AI conducting or scoring video interviews
- AI assessing candidates' skills or personality traits
- AI targeting job advertisements to specific demographics
- AI recommending candidates for interviews or hiring

❌ **Not high-risk**:
- Job board search engines (helping candidates find jobs)
- Applicant tracking systems that organize applications (narrow procedural task)
- Calendar scheduling tools for interviews (narrow procedural task)

**Key distinction**: If the AI makes substantive decisions about candidates' suitability or affects who gets opportunities, it's high-risk. If it merely organizes information or performs administrative tasks, it's not.

**Real-world scenario**: An AI system that analyzes resumes, scores candidates on various criteria, and recommends the top 10 for interviews is high-risk. An applicant tracking system that checks if candidates meet minimum qualifications (e.g., required degree, years of experience) and flags incomplete applications is not high-risk (narrow procedural task).

**Targeted job advertising**: If AI targets job ads based on demographics (age, gender, location) in ways that could discriminate, it's high-risk. General job board postings are not.

### Promotion and Termination Decisions

**What triggers high-risk classification?** AI systems that influence decisions about career advancement or job loss.

**Examples**:

✅ **High-risk promotion/termination systems**:
- AI recommending employees for promotion based on performance data
- AI identifying employees for layoffs or termination
- AI assessing employees for role changes or reassignments
- AI evaluating probationary period success

❌ **Not high-risk**:
- HR systems tracking promotion eligibility dates (narrow procedural task)
- Organizational charts showing reporting structures

**Key distinction**: If the AI evaluates employees and influences career-altering decisions, it's high-risk. If it merely tracks administrative information, it's not.

**Real-world scenario**: An AI system that analyzes employees' performance metrics, peer feedback, and project outcomes to recommend candidates for promotion is high-risk. An HR system that tracks how long employees have been in their current role and flags those eligible for promotion consideration (without evaluation) is not high-risk.

### Task Allocation Based on Personality Traits or Characteristics

**What triggers high-risk classification?** AI systems that assign work based on assessments of personal characteristics, not just skills or availability.

**Examples**:

✅ **High-risk task allocation systems**:
- AI assigning tasks based on personality assessments
- AI allocating work based on behavioral patterns
- AI determining shift assignments based on personal characteristics
- AI matching employees to projects based on psychological profiles

❌ **Not high-risk**:
- Scheduling systems based on availability and skills (not personality)
- Project management tools assigning tasks based on expertise
- Shift scheduling based on preferences and requirements

**Key distinction**: If the AI assesses **personality traits or characteristics** (beyond skills and availability) to allocate tasks, it's high-risk. Skills-based or availability-based allocation is not high-risk.

**Real-world scenario**: An AI system that analyzes employees' personality types and assigns them to teams or tasks based on "cultural fit" or "working style" is high-risk. A scheduling system that assigns shifts based on employees' availability, seniority, and job qualifications is not high-risk.

### Monitoring or Evaluation of Performance

**What triggers high-risk classification?** AI systems that monitor workers' activities or evaluate their performance in ways that affect employment outcomes.

**Examples**:

✅ **High-risk monitoring/evaluation systems**:
- AI monitoring employees' productivity (keystrokes, mouse movements, active time)
- AI evaluating performance based on metrics (sales, output, efficiency)
- AI assessing employee behavior or conduct
- AI generating performance scores or ratings
- AI monitoring delivery drivers' routes and speed
- AI evaluating customer service representatives' call handling

❌ **Not high-risk**:
- Time tracking systems recording hours worked (narrow procedural task)
- Project management tools showing task completion
- Safety monitoring systems (e.g., detecting if workers enter hazardous areas)

**Key distinction**: If the AI **evaluates** performance or **monitors** behavior in ways that affect employment decisions, it's high-risk. If it merely records objective data without evaluation, it's not high-risk.

**Real-world scenario**: An AI system that monitors warehouse workers' movements, tracks their productivity metrics, and generates performance scores used in reviews and promotion decisions is high-risk. A time clock system that records when employees clock in and out is not high-risk.

## Exceptions to High-Risk Classification

Even if an AI system falls into one of these Annex III categories, it's **not high-risk** if it meets one of these exceptions:

### Exception 1: Narrow Procedural Task

The AI performs a limited, well-defined administrative or procedural function without substantive decision-making.

**Examples**:
- Sorting applications alphabetically
- Checking document completeness
- Converting file formats
- Scheduling interviews based on availability
- Translating documents

**Not a narrow procedural task**:
- Ranking candidates by suitability
- Assessing qualifications
- Evaluating performance

### Exception 2: Improves Previously Completed Human Activity

The AI enhances or refines work already done by humans without replacing human judgment.

**Examples**:
- Spell-check and grammar tools
- Formatting assistance
- Data visualization of human-generated analysis

**Not improving human activity**:
- Automated grading (replacing human assessment)
- Resume screening (replacing human review)

### Exception 3: Detects Patterns Without Replacing Human Assessment

The AI identifies patterns or deviations for human review but doesn't make decisions or replace human judgment.

**Examples**:
- Anomaly detection in performance data for human investigation
- Pattern identification in hiring outcomes for bias audits
- Flagging unusual behavior for human review

**Not pattern detection**:
- Automated decisions based on patterns
- Recommendations that typically determine outcomes

### Exception 4: Preparatory Task

The AI prepares information or materials for human decision-makers without making substantive assessments.

**Examples**:
- Translating application documents
- Organizing candidate information
- Compiling performance data for review

**Not a preparatory task**:
- Scoring or ranking
- Recommendations that influence decisions

## Important: Profiling Overrides Exceptions

If an AI system **profiles individuals** (automated processing of personal data to evaluate aspects of their life), it is **always high-risk** even if exceptions would otherwise apply.

**Profiling** means evaluating:
- Work performance
- Economic situation
- Health
- Personal preferences
- Interests
- Reliability
- Behavior
- Location or movements

**Example**: An AI system that detects patterns in hiring decisions (exception 3) would normally not be high-risk. But if it creates profiles of candidates evaluating their reliability or work performance potential, it becomes high-risk.

## Practical Application

### Case Study 1: University Admissions AI

**System**: AI analyzes applications (grades, test scores, essays, activities) and produces admit/reject recommendations.

**Analysis**:
- **Annex III category**: Education (determining access or admission)
- **Exception?** No—it's making substantive decisions, not narrow procedural tasks
- **Profiling?** Yes—evaluating academic performance, potential, and characteristics
- **Result**: High-risk

### Case Study 2: Resume Screening AI

**System**: AI screens resumes, filters out unqualified candidates, and ranks remaining candidates.

**Analysis**:
- **Annex III category**: Employment (recruitment or selection)
- **Exception?** No—it's making substantive decisions about candidate suitability
- **Profiling?** Yes—evaluating work performance potential and reliability
- **Result**: High-risk

### Case Study 3: Traffic Light Control AI

**System**: AI adjusts traffic light timing based on real-time traffic flow.

**Analysis**:
- **Annex III category**: Critical infrastructure (road traffic)
- **Safety component?** Yes—failure could cause accidents
- **Exception?** No exceptions apply to critical infrastructure
- **Result**: High-risk

### Case Study 4: Age Verification AI

**System**: AI estimates users' ages from facial images to restrict access to age-appropriate content.

**Analysis**:
- **Annex III category**: Biometrics (biometric categorization)
- **Prohibited?** No—age is not a sensitive attribute
- **Exception?** No—it's making substantive decisions about access
- **Result**: High-risk

### Case Study 5: Employee Scheduling AI

**System**: AI creates shift schedules based on employees' availability, seniority, and job requirements.

**Analysis**:
- **Annex III category**: Employment (task allocation)
- **Based on personality traits?** No—based on availability and qualifications
- **Exception?** Yes—narrow procedural task (scheduling based on objective criteria)
- **Result**: Not high-risk

## Conclusion

The first four Annex III categories cover AI systems that significantly impact fundamental rights, safety, and life opportunities:

- **Biometrics**: Identification and categorization systems (excluding verification)
- **Critical infrastructure**: Safety components in essential services
- **Education**: Systems affecting access, assessment, and learning
- **Employment**: Systems affecting hiring, promotion, termination, and performance

Understanding these categories is essential for determining compliance obligations. In the next module, we'll cover the remaining four Annex III categories: essential services, law enforcement, migration, and justice.

## Key Takeaways

✅ **Remote biometric identification is high-risk**; biometric verification is not

✅ **Emotion recognition is prohibited in workplaces/schools** but high-risk in other contexts

✅ **Critical infrastructure AI must be a safety component** to be high-risk

✅ **Education AI affecting access, admission, assessment, or learning progression is high-risk**

✅ **Employment AI affecting hiring, promotion, termination, or performance evaluation is high-risk**

✅ **Four exceptions exist**: narrow procedural task, improving human activity, pattern detection, preparatory task

✅ **Profiling overrides exceptions**—if the system profiles individuals, it's always high-risk

✅ **Context matters**—the same AI system may be high-risk in one use case and not in another
