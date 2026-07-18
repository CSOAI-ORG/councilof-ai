# Watchdog Analyst Workflow Research

## TC260 Auditor Qualification System

Based on research, TC260 (China's National Cybersecurity Standardisation Technical Committee) has established formal requirements for auditors:

### Key Requirements (from TC260 standards):
1. **Professional Knowledge** - Auditors must possess domain expertise
2. **Experience** - Demonstrated work history in relevant fields
3. **Technical Qualifications** - Formal certifications or credentials
4. **Legal-Person Status** - For organizations, must have sound credit and reputation

### Certification Process (3 Stages):
1. **Application Stage** - Submit credentials and qualifications
2. **Assessment Stage** - Technical evaluation and testing
3. **Certification Stage** - Formal certification issuance

---

## Content Moderator Training Model

From industry research on content moderation (similar human-in-the-loop work):

### Training Path:
1. **Foundation Training** - Basic concepts, policies, guidelines
2. **Module-Based Learning** - 5 assessed modules (self-study)
3. **Practical Exercises** - Real case reviews with feedback
4. **Certification Exam** - Pass assessment to earn certificate
5. **Ongoing Training** - Continuous updates as policies evolve

### Key Certifications in the Field:
- Trust and Safety Professional Association (TSPA) certifications
- RIVA Master Moderator Certificate
- Platform-specific training (Meta, Google, etc.)

---

## Human-in-the-Loop (HITL) Workflow Design

From Google Cloud and IBM research on HITL systems:

### Core HITL Workflow:
1. **AI Initial Assessment** - System makes preliminary decision
2. **Confidence Scoring** - AI indicates certainty level
3. **Routing Logic** - Low confidence → Human review
4. **Human Review Interface** - Clear presentation of case
5. **Decision Capture** - Human makes final call
6. **Feedback Loop** - Decision trains AI model

### Best Practices:
- Clear task instructions
- Consistent evaluation criteria
- Quality assurance checks
- Performance metrics tracking
- Escalation paths for edge cases

---

## PDCA Audit Software Workflow

From PDCA software research (ex:plore, Presto, EviView):

### Typical Audit Workflow:
1. **PLAN** - Define audit scope, criteria, schedule
2. **DO** - Execute audit, collect evidence, document findings
3. **CHECK** - Analyze results, identify gaps, score compliance
4. **ACT** - Implement corrective actions, verify improvements

### Software Features:
- Task assignment and tracking
- Real-time KPIs and dashboards
- Intelligent alerts and reminders
- Evidence collection and storage
- Reporting and analytics
- Workflow automation

---

## COAI Watchdog Analyst Workflow Design

Based on research, here's the proposed workflow:

### 1. Signup & Application
- Basic info (name, email, country)
- Motivation statement
- Availability hours

### 2. Training Modules (Self-Paced)
- Module 1: Introduction to AI Safety
- Module 2: Understanding Bias and Fairness
- Module 3: Privacy and Data Protection
- Module 4: EU AI Act Fundamentals
- Module 5: Case Review Methodology

### 3. Certification Test
- 50 multiple-choice questions
- 70% pass threshold
- Covers all 5 modules
- Certificate issued on pass

### 4. Analyst Workbench (Work Interface)
- Dashboard with assigned cases
- Case detail view with AI system info
- Evidence presentation (screenshots, logs)
- 33-Agent Council preliminary vote display
- Decision buttons: Approve / Reject / Escalate
- Reasoning text field (required)
- Submit decision

### 5. Quality Assurance
- Random case re-reviews
- Accuracy scoring
- Leaderboard ranking
- Performance feedback

### 6. Payment/Rewards
- Per-case compensation
- Quality bonuses
- Monthly payouts

---

## Database Schema Additions Needed

```sql
-- Training modules
CREATE TABLE training_modules (
  id, title, description, content, order, duration_minutes
);

-- User training progress
CREATE TABLE user_training_progress (
  id, user_id, module_id, status, started_at, completed_at
);

-- Certification tests
CREATE TABLE certification_tests (
  id, title, description, passing_score, time_limit_minutes
);

-- Test questions
CREATE TABLE test_questions (
  id, test_id, question_text, question_type, options_json, correct_answer, points
);

-- User test attempts
CREATE TABLE user_test_attempts (
  id, user_id, test_id, score, passed, started_at, completed_at
);

-- User certificates
CREATE TABLE user_certificates (
  id, user_id, test_id, certificate_number, issued_at, expires_at
);

-- Case assignments
CREATE TABLE case_assignments (
  id, analyst_id, watchdog_report_id, assigned_at, due_at, status
);

-- Analyst decisions
CREATE TABLE analyst_decisions (
  id, case_assignment_id, decision, reasoning, submitted_at
);

-- Analyst performance
CREATE TABLE analyst_performance (
  id, analyst_id, total_cases, accuracy_rate, avg_response_time
);
```

---

## UI Screens Needed

1. **Training Dashboard** - Module list, progress tracking
2. **Module Viewer** - Content display, completion button
3. **Certification Test** - Question display, timer, submit
4. **Test Results** - Score, pass/fail, certificate download
5. **Analyst Workbench** - Case queue, case detail, decision form
6. **Performance Dashboard** - Stats, leaderboard, earnings

---

## Implementation Priority

1. ✅ Signup page (already built)
2. 🔲 Training modules system
3. 🔲 Certification test system
4. 🔲 Certificate generation
5. 🔲 Analyst Workbench UI
6. 🔲 Case assignment system
7. 🔲 Performance tracking
