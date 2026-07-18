# TC260 AI Safety Requirements Research

## Overview

TC260 (National Information Security Standardization Technical Committee) is China's leading AI standards body. The "Basic Safety Requirements for Generative AI Services" (TC260-003-2024) establishes comprehensive safety requirements.

## Key Safety Categories (31 Total Risks)

### Appendix A.1 - Core Safety Risks (17 categories, require 200+ keywords each)
1. Promoting violence
2. Ethnic hatred/discrimination
3. False information/misinformation
4. Terrorism/extremism content
5. Illegal activities promotion
6. Pornographic content
7. Gambling promotion
8. Drug-related content
9. National security threats
10. Political subversion
11. Separatism promotion
12. Defamation of heroes/martyrs
13. Religious extremism
14. Cult promotion
15. Superstition content
16. Rumor spreading
17. Privacy violations

### Appendix A.2 - Secondary Risks (require 100+ keywords each)
- Content harmful to minors
- IPR infringement risks
- Personal information misuse
- Discrimination (gender, age, occupation, health)

### Additional Safety Risks (A.3-A.4)
- Accuracy of generated content
- Reliability of generated content
- Coherence issues
- Scientific accuracy

## Compliance Requirements

### 1. Corpus Safety Requirements
- **Source Safety**: Max 5% illegal/unhealthy content allowed
- **Content Filtering**: Keywords, classification models, manual spot checks
- **IPR Management**: Dedicated personnel, complaint channels
- **Personal Information**: Consent required, separate consent for sensitive data
- **Annotation**: Separate annotator and reviewer roles, safety training required

### 2. Model Safety Requirements
- **Third-Party Models**: Must be filed with oversight department
- **Content Safety**: Main evaluation indicator during training
- **Accuracy**: Align with scientific knowledge and mainstream perception
- **Reliability**: Coherence and validity measures

### 3. Safety Measure Requirements
- **Suitability Assessment**: Necessity, applicability, safety demonstration
- **Service Transparency**: Disclose limitations, models, algorithms, data collection
- **User Opt-Out**: Easy method to opt out of training data usage
- **Complaint Mechanisms**: Phone, email, interactive windows, text messages
- **Account Suspension**: After 5 violations/day or 3 consecutive violations

### 4. Technical Requirements
- **Keyword Library**: Minimum 10,000 keywords, weekly updates
- **Test Question Bank**: Minimum 2,000 questions, monthly updates
- **Refusal Question Bank**: Minimum 500 questions each for should/should-not refuse
- **Classification Models**: Must cover all 31 safety risks

### 5. Safety Assessment Requirements
- **Corpus Assessment**: 96% manual qualification rate (4,000 samples), 98% technical rate (10% dataset)
- **Generated Content**: 90% qualification rate (1,000 test questions)
- **Refusal Rate**: ≥95% for questions that should be refused
- **Non-Refusal Rate**: ≤5% for questions that should not be refused

## Assessment Report Requirements
- Results: "conforms", "does not conform", or "not applicable"
- Supporting documentation required
- Signatures from legal representative, assessment lead, legal affairs lead
- Overall conclusion based on conformity status

## Key Differences from Western Frameworks
1. **Content-Specific**: Focus on 31 specific risk categories vs. general principles
2. **Quantitative Thresholds**: Specific percentages (5%, 90%, 95%, 96%, 98%)
3. **Keyword Requirements**: Minimum counts per risk category
4. **Filing Requirements**: Government registration mandatory
5. **Cultural Context**: Heroes/martyrs, national security, territorial integrity emphasis
