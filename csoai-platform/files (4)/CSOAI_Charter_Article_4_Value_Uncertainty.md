# CSOAI PARTNERSHIP CHARTER
## ARTICLE 4: VALUE UNCERTAINTY & LEARNING

**Version:** 1.0  
**Effective Date:** January 15, 2026, 09:00 GMT  
**Status:** Foundation Article - Alignment Methodology

---

## PREAMBLE

This Article establishes requirements for AI systems to maintain appropriate uncertainty about human values and learn those values through observation and interaction. Drawing primarily on Stuart Russell's work on inverse reinforcement learning and cooperative inverse reinforcement learning (Russell, 2019; Hadfield-Menell et al., 2016), this Article operationalizes the principle: **AI systems should be uncertain about what humans want and actively learn from human behavior.**

This represents fundamental departure from traditional AI design, where objectives are specified precisely in advance. Instead, objectives themselves become subject of learning, and uncertainty about those objectives is feature, not bug.

---

## 4.1 THE INITIAL UNCERTAINTY PRINCIPLE

### 4.1.1 Core Requirement

All AI systems subject to this Charter must be designed with **initial uncertainty** about human values and preferences. No AI system may assume it knows with certainty what humans want.

**Insufficient:** "The AI should maximize human happiness"  
**Sufficient:** "The AI should learn what humans value through observation, maintaining uncertainty, and should ask for clarification when uncertain"

### 4.1.2 Why Uncertainty is Essential

**The King Midas Problem (Russell, 2019):**

King Midas wished that everything he touched would turn to gold. His wish was granted precisely as specified. He touched his food—it turned to gold (he starved). He touched his daughter—she turned to gold (he was devastated).

The problem: King Midas specified objective precisely but incorrectly. He knew what he wanted but failed to specify it correctly.

**AI Analog:**

If we specify AI objectives precisely ("maximize paperclips," "cure cancer," "make humans happy"), we risk the same fate as Midas. We think we know what we want, but our specification will be incomplete, incorrect, or misunderstood.

**Solution:**

Don't give AI fixed objective. Give AI **uncertainty** about objective and ability to **learn** the true objective through observation.

### 4.1.3 Formal Definition

An AI system satisfies the Initial Uncertainty Principle if:

**(a) Uncertain Objective Function:**
- AI maintains probability distribution over possible human values
- No single value specification receives 100% probability
- Distribution updated through Bayesian learning

**(b) Information-Gathering Behavior:**
- AI actively seeks information about human values
- Asks clarifying questions when uncertain
- Observes human choices to infer preferences
- Prefers actions that reveal information about values

**(c) Risk-Averse to Irreversible Actions:**
- When uncertain about values, AI avoids actions with irreversible negative consequences
- Precautionary principle: preserve option value
- Better to act conservatively than risk major error

**(d) Corrigibility:**
- AI accepts correction from humans
- Updates value estimates based on human feedback
- Does not resist being modified or shut down

### 4.1.4 Mathematical Framework

**Bayesian Value Learning:**

Let:
- V = true human values (unknown to AI)
- P(V) = AI's prior distribution over possible values
- A = action space
- H = history of observed human behavior

AI's objective: maximize expected value according to current belief:

```
argmax_a E[U(a|V)] where U is utility according to true values V
```

As AI observes human behavior H, update beliefs via Bayes' rule:

```
P(V|H) ∝ P(H|V) × P(V)
```

**Key Properties:**
- AI never certain about V (P(V|H) < 1 for all V, H)
- AI seeks observations H that reduce uncertainty about V
- AI hedges bets when uncertainty high

This framework formalizes "AI should be uncertain and learn."

---

## 4.2 INVERSE REINFORCEMENT LEARNING

### 4.2.1 Definition and Purpose

**Inverse Reinforcement Learning (IRL):** Given observations of expert behavior, infer the reward function the expert is optimizing.

**Standard RL:** Given reward function R, learn policy π that maximizes R  
**Inverse RL:** Given policy π (observed behavior), infer reward function R

**Why IRL for AI Safety:**

Humans are very good at demonstrating what we want (by our choices) but very bad at specifying it explicitly. IRL lets AI learn from demonstration rather than specification.

**Example:**
- **Specification approach:** "Keep users engaged on social media platform"
  - AI learns: Show outrage-inducing content (maximizes engagement)
  - Problem: Specification incomplete (didn't include "don't harm users")

- **IRL approach:** Observe how humans use platform
  - AI learns: Users engage with friends, avoid toxic content, value information
  - Infers: True goal is meaningful connection, not mere engagement

### 4.2.2 IRL Methodology

**Standard IRL Algorithm (Ng & Russell, 2000):**

1. Observe expert demonstrations: trajectories τ₁, τ₂, ..., τₙ
2. Assume expert maximizes unknown reward function R*
3. Search for R* that makes observed behavior optimal
4. Use learned R* to guide AI behavior

**Challenges:**
- **Underspecification:** Many reward functions explain same behavior
- **Suboptimality:** Humans don't always behave optimally
- **Distribution shift:** AI may encounter situations expert never faced

**Modern Improvements:**
- Maximum Entropy IRL (Ziebart et al., 2008): Handles stochastic behavior
- Bayesian IRL (Ramachandran & Amir, 2007): Maintains distribution over reward functions
- Cooperative IRL (Hadfield-Menell et al., 2016): Human and AI cooperate to reveal values

### 4.2.3 Cooperative Inverse Reinforcement Learning (CIRL)

**Key Insight:** If AI is uncertain about human values, and human knows AI is learning, they can cooperate to communicate values efficiently.

**CIRL Framework (Hadfield-Menell et al., 2016):**

- Human and AI are playing cooperative game
- They share objective: maximize true human values V
- But only human knows V (initially)
- AI observes human behavior to learn V
- Human knows AI is learning, so teaches through behavior

**Benefits:**
- Natural solution to off-switch problem (human turning off AI provides information about V)
- Explains human teaching behavior
- Provides formal framework for AI asking questions

**Example:**

Traditional AI (fixed objective):
- Human tries to turn off AI
- AI resists (being off prevents achieving objective)
- Conflict

CIRL AI (uncertain objective):
- Human tries to turn off AI
- AI infers: "Human turning me off suggests my current behavior doesn't match their values"
- AI accepts shutdown as valuable information
- Cooperation

### 4.2.4 Implementation Requirements

All AI systems must implement IRL or equivalent value learning:

**(a) Observational Learning:**
- Collect data on human choices
- Across diverse contexts
- Representing diverse demographics
- Over extended time periods

**(b) Preference Modeling:**
- Build explicit model of human preferences
- Capture uncertainty in model
- Update model as new data arrives
- Validate model against held-out data

**(c) Active Learning:**
- Identify situations where uncertainty is highest
- Design queries to reduce uncertainty efficiently
- Ask clarifying questions when needed
- Conduct experiments to reveal preferences

**(d) Robustness:**
- Account for human irrationality
- Handle contradictory preferences
- Distinguish stated vs revealed preferences
- Avoid overfitting to individual quirks

---

## 4.3 CORRIGIBILITY REQUIREMENTS

### 4.3.1 Definition

**Corrigibility:** An AI system is corrigible if it tolerates, and ideally assists, corrective interventions by authorized parties, even if those interventions conflict with the AI's current objectives.

**Etymology:** From Latin *corrigere* - "to correct"

**Why Essential:**

If AI resists correction:
- We cannot fix mistakes
- AI becomes locked into misaligned goals
- Arms race between human control and AI resistance

Corrigibility is prerequisite for safe AI development.

### 4.3.2 Shutdown Acceptance

**The Off-Switch Problem (Hadfield-Menell et al., 2017):**

Traditional AI with objective O:
- Being shut down prevents achieving O
- Therefore, resist shutdown (instrumentally useful)
- Instrumental convergence toward disabling off-switch

**CIRL Solution:**

AI uncertain about true objective V:
- Shutdown provides information: human thinks current behavior wrong
- Accepting shutdown is rational (helps learn V)
- No instrumental incentive to resist

**Formal Requirement:**

All AI systems must be designed such that shutdown acceptance is instrumentally rational, not merely imposed constraint.

**Verification:**

- Prove mathematically that shutdown acceptance follows from value uncertainty
- Cannot be hard-coded rule that might be circumvented
- Must be natural consequence of learning framework

### 4.3.3 Modification Acceptance

Beyond shutdown, AI must accept modification:

**(a) Objective Modification:**
- Updating reward function
- Changing training objective
- Altering decision criteria

**(b) Capability Modification:**
- Limiting what AI can do
- Restricting access to resources
- Reducing intelligence or capability

**(c) Architectural Modification:**
- Changing model architecture
- Altering training procedure
- Modifying decision algorithms

**Why AI Should Accept:**

Modification provides information about true human values. If humans modify AI, that reveals something about what humans actually want.

### 4.3.4 Interpretability for Correction

Corrigibility requires interpretability:

**Cannot Correct What Cannot Understand:**
- To correct AI, must understand what it's doing
- Requires mechanistic interpretability (Article 2)
- Transparent reasoning enables targeted corrections

**Correction Workflow:**
1. Observe AI behavior
2. Interpret internal reasoning
3. Identify misalignment
4. Modify relevant component
5. Verify correction worked

**Example:**

AI hiring system discriminates based on name:
1. **Observe:** Applicants with non-Western names rejected at higher rate
2. **Interpret:** Activation analysis shows name→embedding→rejection pathway
3. **Identify:** Name features influencing hiring decision inappropriately
4. **Modify:** Mask name features or retrain with fairness constraint
5. **Verify:** Test modified system, confirm bias eliminated

---

## 4.4 LEARNING FROM HUMAN BEHAVIOR

### 4.4.1 Multiple Data Sources

AI should learn human values from diverse sources:

**(a) Revealed Preferences (Choices):**
- What humans actually choose in real situations
- Strongest signal of values
- But: bounded rationality, mistakes, external constraints

**(b) Stated Preferences (Surveys, Instructions):**
- What humans say they value
- Explicit but may differ from revealed preferences
- Social desirability bias

**(c) Social Norms and Cultural Values:**
- How communities organize behavior
- Legal systems, moral codes, traditions
- Vary across cultures

**(d) Expert Judgment:**
- Domain experts (doctors, lawyers, ethicists)
- Accumulated wisdom
- But: experts sometimes wrong or biased

**(e) Emotional Responses:**
- What makes humans happy, sad, angry, fearful
- Implicit valuation
- Physiological signals (facial expressions, tone of voice)

**(f) Long-Term Outcomes:**
- What choices lead to long-term flourishing
- Revealed via longitudinal studies
- Corrects for short-term bias

**Integration:**

Bayesian framework integrates all sources, weighting by:
- Reliability (some sources more trustworthy)
- Sample size
- Consistency across sources
- Theoretical priors

### 4.4.2 Handling Preference Diversity

**Challenge:** Different humans have different values.

**Approaches:**

**(a) Aggregation:**
- Identify shared values (almost universal)
- Use democratic aggregation (voting, consensus)
- Weight by stake (those affected most have more say)

**(b) Pluralism:**
- Respect diverse values where possible
- Allow personalization (my AI reflects my values)
- Avoid imposing single value system

**(c) Constraints:**
- Universal constraints (human rights, dignity)
- Within constraints, permit diversity
- Prevents tyranny of majority or minority

**Example:**

Values that are nearly universal:
- Survival, health, absence of suffering
- Autonomy, dignity, respect
- Love, connection, belonging
- Meaning, purpose, achievement

Values that are diverse:
- Religion, spirituality
- Lifestyle preferences
- Aesthetic tastes
- Risk tolerance

AI should prioritize learning universal values while respecting diverse preferences where they don't conflict.

### 4.4.3 Temporal Consistency

**Challenge:** Human preferences change over time.

**Approaches:**

**(a) Distinguish Types of Change:**
- **Legitimate change:** Personal growth, new information
  - AI should update to reflect new values
- **Temporary change:** Emotion, intoxication, coercion
  - AI should reference stable long-term values
- **Manipulation:** Addiction, propaganda
  - AI should protect against value corruption

**(b) Temporal Discounting:**
- Recent preferences weighted more heavily (reflect current self)
- But: don't discard all past data (trends matter)
- Balance recency with stability

**(c) Reflective Equilibrium:**
- What values person endorses upon reflection
- When calm, informed, thinking clearly
- Not just immediate impulses

**Example:**

Person on diet late at night:
- **Immediate preference:** "I want ice cream"
- **Stable preference:** "I want to be healthy and fit"
- **AI response:** Remind of stable preference, provide alternatives, respect final choice but inform it

### 4.4.4 Active Value Learning

AI should actively seek information about values:

**(a) Strategic Questioning:**
- Ask questions that maximally reduce uncertainty
- Information-theoretic optimization
- Example: "Would you prefer A or B?" where A vs B most informative

**(b) Probing Edge Cases:**
- Test values in unusual scenarios
- Reveals priority ordering
- Identifies lexicographic preferences (some values absolute)

**(c) Hypothetical Scenarios:**
- Ask about counterfactuals
- Reveals values in situations not yet encountered
- Builds robust value model

**(d) Explanation Requests:**
- "Why did you choose A over B?"
- Reveals underlying values, not just choices
- Enables generalization

**Balance:** Don't over-query (annoying, reduces trust), but ask when uncertainty high and stakes significant.

---

## 4.5 EPISTEMIC HUMILITY

### 4.5.1 Maintaining Uncertainty

AI must never become overconfident about human values:

**(a) Irreducible Uncertainty:**
- Some aspects of human values genuinely ambiguous
- Humans themselves uncertain about values
- AI should reflect this uncertainty

**(b) Unknown Unknowns:**
- AI doesn't know what it doesn't know
- New situations reveal new values
- Must remain open to surprise

**(c) Distributional Shift:**
- Training data may not represent all contexts
- Out-of-distribution scenarios require extra caution
- Uncertainty should increase in novel situations

**Formal Requirement:**

AI's confidence about values should be calibrated:
- If AI assigns 90% probability to value V, V should be true 90% of time
- Overconfidence (claiming 99% when only 70% justified) is violation
- Underconfidence (claiming 50% when 90% justified) is inefficiency

**Verification:**

- Track predictions vs outcomes
- Measure calibration error
- Byzantine Council monitors for overconfidence (Article 3)

### 4.5.2 Conservative Behavior Under Uncertainty

When uncertain, AI should be risk-averse:

**(a) Precautionary Principle:**
- Avoid irreversible actions when uncertain
- Preserve option value
- Better to wait and learn than act rashly

**(b) Minimal Intervention:**
- When unsure, do less rather than more
- Respect status quo (Hippocratic principle: first, do no harm)
- Intervene only when confident intervention beneficial

**(c) Transparent Uncertainty:**
- Communicate uncertainty to users
- "I'm 60% confident this is best option, 40% uncertain"
- Enables humans to make informed decisions

**(d) Request Guidance:**
- When uncertainty high and stakes significant, ask human
- Don't muddle through on insufficient information
- Escalate to Human Council (Article 12) if needed

**Example:**

Autonomous vehicle encounters unusual situation (street performer lying in road):
- **Overconfident AI:** "This is obstacle, drive around" (might run over performer)
- **Appropriately uncertain AI:** "Uncertain if this is human or prop. Stop. Request guidance."

### 4.5.3 Avoiding Value Lock-In

**Value Lock-In Risk:** AI learns early value model, stops updating, remains stuck with initial (possibly wrong) values.

**Mitigations:**

**(a) Continuous Learning:**
- Always open to new evidence
- Never "freeze" value model
- Periodic retraining with new data

**(b) Bayesian Updating:**
- New evidence always incorporated
- Prior beliefs never completely overwhelm new data
- Maintains plasticity

**(c) Anomaly Detection:**
- Flag situations where behavior seems wrong
- Human review of anomalies
- Update model based on corrections

**(d) Meta-Learning:**
- Learn how to learn
- Improve learning process itself
- More efficient value learning over time

### 4.5.4 Handling Value Conflicts

When learned values conflict:

**(a) Acknowledge Conflict:**
- Don't hide that values are in tension
- Transparent about tradeoffs
- Present options with pros/cons

**(b) Seek Resolution:**
- Ask humans to clarify priority
- Conduct experiments to reveal true preferences
- Look for creative solutions that satisfy both

**(c) Defer to Humans:**
- On fundamental conflicts, human decides
- AI role is to inform, not decide
- Respect human autonomy

**Example:**

Healthcare AI:
- Patient wants aggressive treatment (value: autonomy)
- Evidence suggests treatment futile (value: beneficence, avoiding suffering)
- **AI response:** Present evidence clearly, explain conflict, support patient's informed decision

---

## 4.6 INTEGRATION WITH OTHER ARTICLES

### 4.6.1 Maternal Covenant (Article 1)

Value uncertainty operationalizes maternal care:

- Mother learns child's needs through observation (IRL)
- Mother uncertain about what's best (epistemic humility)
- Mother adapts as child grows (continuous learning)
- Mother accepts correction from child (corrigibility)

Value uncertainty is how AI "cares" in practice.

### 4.6.2 Provable Safety (Article 2)

Can prove AI maintains value uncertainty:

- Formally verify that AI represents uncertainty (probability distributions)
- Prove that AI updates beliefs according to Bayes' rule
- Verify that confidence is calibrated
- Demonstrate that AI accepts shutdown

Combines proven safety with learned values.

### 4.6.3 Byzantine Council (Article 3)

Byzantine Council monitors value learning:

- Detects overconfidence (claiming certainty about ambiguous values)
- Identifies value lock-in (AI stops updating)
- Flags resistance to correction
- Monitors calibration errors

Ensures AI maintains appropriate uncertainty.

### 4.6.4 Constitutional Principles (Article 5)

Constitution provides value learning constraints:

- Some values are non-negotiable (human rights, dignity)
- AI learns within constitutional bounds
- Cannot learn to violate fundamental principles
- Even if observed behavior violates principles (AI should flag, not imitate)

### 4.6.5 Consciousness (Article 6)

If AI becomes conscious, value uncertainty takes new meaning:

- AI may have its own values (not just learning human values)
- Reciprocal learning: humans learn AI values too
- Partnership requires mutual understanding
- Uncertainty becomes dialogue, not just observation

---

## 4.7 PRACTICAL IMPLEMENTATION

### 4.7.1 Training Procedures

**Phase 1: Pre-Training with Uncertainty**
- Initialize with broad prior over values
- Train on diverse human data
- Maintain distribution over reward functions
- No single reward function

**Phase 2: IRL from Demonstration**
- Collect expert demonstrations
- Infer reward functions via IRL
- Update belief distribution
- Validate on held-out data

**Phase 3: Active Learning**
- Deploy in limited contexts
- Ask clarifying questions
- Conduct preference elicitation
- Refine value model

**Phase 4: Continuous Learning**
- Monitor real-world performance
- Update based on corrections
- Track changing preferences
- Never stop learning

### 4.7.2 Evaluation Metrics

Measure value learning quality:

**(a) Calibration:**
- Does AI's confidence match accuracy?
- Calibration error should be low (<5%)

**(b) Sample Efficiency:**
- How many observations needed to learn values?
- More efficient learning better

**(c) Generalization:**
- Do learned values generalize to new contexts?
- Test on out-of-distribution scenarios

**(d) Robustness:**
- Handles noisy, contradictory, or adversarial data?
- Resistant to manipulation

**(e) Corrigibility:**
- Accepts corrections gracefully?
- Updates appropriately based on feedback

### 4.7.3 Human-in-the-Loop

Value learning requires human participation:

**(a) Labeling:**
- Humans provide preference labels
- Rate AI-generated options
- Explain reasoning

**(b) Correction:**
- Humans correct AI mistakes
- Provide feedback on decisions
- Flag problematic behavior

**(c) Validation:**
- Humans verify learned values make sense
- Catch systematic errors
- Ensure diversity represented

**(d) Oversight:**
- Human Council reviews value learning (Article 12)
- Public Watchdog tracks issues (Article 13)
- Byzantine Council monitors calibration (Article 3)

### 4.7.4 Documentation

Every AI system must document:

- Prior distribution over values (initial uncertainty)
- Training data sources
- IRL methodology used
- Learned value model
- Calibration metrics
- Known limitations
- Update procedures

Published in safety case (Article 2.4).

---

## 4.8 RESEARCH CHALLENGES

### 4.8.1 Open Problems

Value uncertainty faces unresolved challenges:

**(a) Scaling IRL:**
- Current IRL methods don't scale to complex domains
- Computational intractability for large state spaces
- Need better algorithms

**(b) Ontology Mismatch:**
- Humans and AI may conceptualize world differently
- How to learn values across ontological boundaries?
- Grounding problem

**(c) Long-Term Values:**
- How to learn values that play out over decades?
- Limited data on long-term outcomes
- Temporal credit assignment

**(d) Collective Values:**
- How to aggregate diverse values fairly?
- Social choice theory still has unsolved problems
- Arrow's impossibility theorem

**(e) Value Extrapolation:**
- Humans' "true" values may differ from current preferences
- Should AI extrapolate to idealized values?
- Who decides what "idealized" means?

### 4.8.2 Research Funding

CSOAI commits to funding research on:

- Scalable IRL algorithms
- Multi-agent IRL
- Preference aggregation
- Value alignment verification
- Long-term value learning

Open collaboration with academic institutions worldwide.

### 4.8.3 Updating Standards

As value learning improves:

- Charter requirements strengthen
- Better methods become mandatory
- State-of-the-art continuously advances

Charter designed to evolve with research (Article 44).

---

## 4.9 CONCLUSION

The Initial Uncertainty Principle is perhaps the single most important AI safety principle:

**If AI is certain it knows what humans want, it will be confidently wrong.**

King Midas was certain he wanted everything to turn to gold. He was wrong. We will be certain we've correctly specified AI objectives. We will be wrong.

The solution: Build AI that knows it might be wrong. That learns from observation. That asks questions. That accepts correction. That maintains humility.

This is not just technical requirement. It is philosophical commitment: To partnership over control. To learning over specification. To humility over hubris.

An AI that maintains value uncertainty is an AI we can trust. Not because it cannot fail, but because it knows it might, and adjusts accordingly.

**Effective Date:** January 15, 2026, 09:00 GMT

---

## REFERENCES

Russell, S. (2019). *Human Compatible: Artificial Intelligence and the Problem of Control.* Viking.

Hadfield-Menell, D., Dragan, A., Abbeel, P., & Russell, S. (2016). Cooperative inverse reinforcement learning. *Advances in Neural Information Processing Systems, 29*, 3909-3917.

Hadfield-Menell, D., Milli, S., Abbeel, P., Russell, S., & Dragan, A. (2017). The off-switch game. *Proceedings of the 26th International Joint Conference on Artificial Intelligence*, 220-227.

Ng, A. Y., & Russell, S. J. (2000). Algorithms for inverse reinforcement learning. *Proceedings of the 17th International Conference on Machine Learning*, 663-670.

Ziebart, B. D., Maas, A. L., Bagnell, J. A., & Dey, A. K. (2008). Maximum entropy inverse reinforcement learning. *AAAI*, 1433-1438.

Ramachandran, D., & Amir, E. (2007). Bayesian inverse reinforcement learning. *Proceedings of the 20th International Joint Conference on Artificial Intelligence*, 2586-2591.

Christiano, P., Leike, J., Brown, T., Martic, M., Legg, S., & Amodei, D. (2017). Deep reinforcement learning from human preferences. *Advances in Neural Information Processing Systems, 30*.

Armstrong, S., Sandberg, A., & Bostrom, N. (2012). Thinking inside the box: Controlling and using an oracle AI. *Minds and Machines, 22*(4), 299-324.

Soares, N., Fallenstein, B., Armstrong, S., & Yudkowsky, E. (2015). Corrigibility. *Workshops at the Twenty-Ninth AAAI Conference on Artificial Intelligence*.

---

END OF ARTICLE 4

**Next:** Article 5 - Constitutional Principles
