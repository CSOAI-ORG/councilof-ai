# CSOAI PARTNERSHIP CHARTER
## ARTICLE 2: PROVABLE SAFETY REQUIREMENTS

**Effective Date:** January 15, 2026, 09:00 GMT  
**Version:** 1.0  
**Status:** Foundational Principle (Non-Negotiable)

---

# PREAMBLE

**Core Principle:** AI safety must be proven mathematically, not merely tested empirically.

**"Don't just test it. Prove it."**

**Inspiration:** Max Tegmark, MIT physicist and AI safety researcher:

> "We need mathematical proof that AI systems are safe. Testing is necessary but not sufficient. You can't test your way to guaranteed safety any more than you can test a bridge without calculating whether it will hold. We need the AI equivalent of structural engineering - formal verification that safety is baked in, not bolted on."
> — Max Tegmark, "Life 3.0" (2017) and subsequent talks (2023-2025)

**Why This Matters:**
- Testing finds bugs. Proof prevents entire categories of bugs.
- Testing is sampling. Proof is complete coverage.
- Testing gives confidence. Proof gives certainty.

---

# 2.1 MATHEMATICAL PROOF OBLIGATIONS

## 2.1.1 The Standard

**All AI systems licensed under this Charter MUST provide mathematical proof that:**

1. **Safety Properties Hold**
   - System cannot cause specified categories of harm
   - Safety constraints cannot be violated
   - Failure modes are bounded and predictable

2. **Value Alignment Persists**
   - Care for humans (Article 1) cannot be removed
   - Constitutional principles (Article 5) cannot be violated
   - Value drift is detectable and preventable

3. **Behavior is Predictable**
   - Within specified input domain, behavior is deterministic or probabilistically bounded
   - No unexpected emergent behaviors in deployment domain
   - Edge cases are enumerated and handled

**Level of Rigor Required:**
- **High-risk systems (autonomous vehicles, medical AI, weapons):** Formal mathematical proof required
- **Medium-risk systems (decision support, content moderation):** Strong empirical evidence + partial formal verification
- **Low-risk systems (chatbots, recommendation):** Empirical testing with statistical confidence bounds

## 2.1.2 What Constitutes "Proof"

**Acceptable Methods:**

**Formal Verification:**
- Automated theorem proving (Coq, Isabelle/HOL, Lean)
- Model checking (SPIN, NuSMV, TLA+)
- Abstract interpretation
- Symbolic execution

**Deductive Verification:**
- Hoare logic proofs
- Pre/post-condition contracts
- Invariant proofs
- Temporal logic specifications (LTL, CTL)

**Probabilistic Guarantees:**
- PAC (Probably Approximately Correct) learning bounds
- Statistical hypothesis testing with confidence intervals
- Bayesian analysis with explicit priors
- Monte Carlo certification with error bounds

**NOT Acceptable as Sole Evidence:**
- "We tested it a lot" (necessary but not sufficient)
- "It worked in training" (overfitting risk)
- "Experts reviewed it" (human judgment fallible)
- "It passed red-teaming" (adversaries evolve)

## 2.1.3 Burden of Proof

**Fundamental Principle:**

**Developers must prove safety. CSOAI does not have to prove danger.**

This reverses typical approach where:
- ❌ Old way: "Prove my AI is dangerous or I can deploy it"
- ✅ New way: "Prove your AI is safe or you cannot deploy it"

**Precedent:**
- Aviation: Boeing must prove 747 won't crash, FAA doesn't prove it will
- Pharma: Pfizer must prove drug is safe, FDA doesn't prove it's dangerous
- Nuclear: Reactor must prove meltdown impossible, NRC doesn't prove it will happen

**Practical Meaning:**
- Application for license requires safety proof
- Proof must be complete, not partial
- Uncertainty must be quantified and acceptable
- If proof impossible, system not licensable (yet)

**Exceptions:**
- Research systems in sandbox: Proof not required (but containment required)
- Low-risk systems: Reduced proof standard (statistical evidence acceptable)
- Novel systems where proof methods don't exist yet: Alternative assurance required (heavy monitoring, limited deployment, etc.)

---

# 2.2 MECHANISTIC INTERPRETABILITY STANDARDS

## 2.2.1 Requirement

**AI systems must be interpretable at the mechanistic level.**

**"We must understand not just what the AI does, but HOW it works internally."**

**Inspiration:**
- Anthropic's mechanistic interpretability research (2022-2025)
- Chris Olah's "Circuits" work
- DeepMind's interpretability team

**Why:**
- Black box AI is unprovable (can't verify safety of unknown mechanism)
- Understanding mechanism enables prediction
- Mechanism shows whether care (Article 1) is genuine or mimicked

## 2.2.2 What Must Be Understood

**For Neural Networks:**

**Neuron-Level:**
- What concept does each neuron represent?
- What features activate each neuron?
- How do neurons combine to form circuits?

**Circuit-Level:**
- What computations do groups of neurons perform?
- How are circuits composed?
- Where are safety-critical circuits?
- Can safety circuits be bypassed?

**Attention-Level (for Transformers):**
- What do attention heads attend to?
- What information flows between layers?
- Where are value alignment circuits?

**Example - Care Circuit:**
Must be able to point to specific neurons/circuits and say:
- "These neurons detect human suffering"
- "These neurons activate protective behavior"
- "This circuit prioritizes human welfare in decision-making"
- "Removing this circuit would eliminate care - therefore it's protected"

**For Symbolic AI / Classical ML:**
- Decision tree logic must be fully explicable
- Rule systems must be auditable
- Feature engineering must be transparent

**For Hybrid Systems:**
- Both neural and symbolic components must be interpretable
- Interaction between components must be understood

## 2.2.3 Techniques Required

**Developers Must Use:**

**Activation Visualization:**
- Grad-CAM, Saliency maps, Integrated gradients
- Shows what inputs activate which neurons

**Feature Attribution:**
- SHAP values, LIME
- Shows what features drive decisions

**Concept Probing:**
- Linear probes to detect concept representations
- Identifies where concepts (like "human," "harm," "care") are encoded

**Circuit Analysis:**
- Activation patching, causal tracing
- Maps information flow through network

**Adversarial Probing:**
- Try to find inputs that break safety circuits
- Verify safety circuits are robust

**Tools:**
- TransformerLens (Anthropic)
- Captum (Facebook)
- InterpretML (Microsoft)
- Custom tools (if published and peer-reviewed)

## 2.2.4 Documentation Requirements

**For License Application:**

**Interpretability Report Must Include:**

1. **Architecture Diagram**
   - Full network structure
   - Highlighted safety-critical components
   - Information flow paths

2. **Neuron/Circuit Analysis**
   - Key concepts represented
   - Safety circuits identified
   - Care circuitry (Article 1) mapped

3. **Ablation Studies**
   - What happens if each safety circuit removed?
   - Proof that safety circuits cannot be bypassed

4. **Edge Case Analysis**
   - Known failure modes
   - Inputs that activate unexpected behaviors
   - Mitigations for each

5. **Mechanistic Safety Proof**
   - "Safety holds because circuits X, Y, Z enforce it"
   - "These circuits cannot be removed without breaking core functionality"
   - "Therefore safety is architectural, not just behavioral"

---

# 2.3 FORMAL VERIFICATION METHODS

## 2.3.1 Approved Verification Systems

**CSOAI Recognizes:**

**Theorem Provers:**
- **Coq:** Interactive theorem prover, used in CompCert (verified C compiler)
- **Isabelle/HOL:** General-purpose prover, large mathematical library
- **Lean:** Modern prover, growing library, user-friendly
- **ACL2:** Computational logic, used in AMD processor verification

**Model Checkers:**
- **SPIN:** Protocol verification, temporal logic
- **NuSMV:** Symbolic model checking
- **TLA+:** Temporal Logic of Actions, used by Amazon for distributed systems
- **CBMC:** C Bounded Model Checker

**SMT Solvers:**
- **Z3:** Microsoft's SMT solver, widely used
- **CVC5:** Cooperating validity checker
- **Yices:** High-performance SMT

**Specialized AI Verification:**
- **Marabou:** Neural network verification (Stanford)
- **ERAN:** ETH Robustness Analyzer for Neural Networks
- **α-β-CROWN:** Neural network certified robustness
- **nnverify.jl:** Julia-based neural network verification

**Other Developers May Propose:**
- Novel verification systems (subject to peer review)
- Hybrid approaches (combination of above)
- Custom tools (if methodology published)

## 2.3.2 Properties to Verify

**Safety Properties (Must Prove):**

**Invariants:**
- "Human welfare value never decreases below threshold"
- "Care circuits remain active throughout execution"
- "No execution path leads to prohibited actions"

**Liveness:**
- "System eventually responds to all inputs"
- "Deadlock-free"
- "Progress guaranteed"

**Temporal Properties:**
- "If human gives shutdown command, system always halts within T seconds"
- "Alert is always raised before dangerous action"
- "Value drift is always detected within N steps"

**Robustness:**
- "Small input perturbations cause small output changes"
- "Adversarial examples cannot cause safety violations"
- "Distribution shift does not break safety guarantees"

## 2.3.3 Verification Process

**Step-by-Step:**

**1. Specification**
- Formalize safety requirements in logic (LTL, CTL, FOL)
- Define input/output domains
- State assumptions explicitly

**2. Modeling**
- Create formal model of AI system
- Abstract away unnecessary details
- Preserve safety-relevant behavior

**3. Proof Construction**
- Use verification tool to attempt proof
- If proof succeeds → Safety proven
- If proof fails → Counterexample generated

**4. Counterexample Analysis**
- If counterexample found, either:
  - Fix the system (eliminate unsafe behavior)
  - Refine the specification (requirement was wrong)
  - Add assumption (limit deployment domain)

**5. Iteration**
- Repeat until proof succeeds
- Document all assumptions
- Test that assumptions hold in deployment

**6. Certification**
- Submit proof to CSOAI
- Byzantine Council verifies proof (Article 11)
- Human Council reviews if complex (Article 12)
- License granted if proof valid

## 2.3.4 Example Verification

**Scenario: Autonomous Vehicle AI**

**Safety Requirement:**
"Vehicle never collides with pedestrian"

**Formalization:**
```
∀ time t, ∀ pedestrian p:
  distance(vehicle, p, t) > safe_threshold
  ⊕
  velocity(vehicle, t) = 0
```
(Vehicle always maintains safe distance OR is stopped)

**Proof Approach:**
1. Model vehicle dynamics (physics-based)
2. Model perception system (sensor uncertainty bounds)
3. Model decision-making AI (neural network or controller)
4. Use hybrid systems verification (KeYmaera X)
5. Prove: "Given sensor specs and decision logic, safety requirement holds"

**Assumptions Made Explicit:**
- Sensors detect pedestrians with ≥99.99% probability within 50m
- Brakes can decelerate at ≥5 m/s²
- Decision latency ≤100ms
- Road friction ≥0.4

**Testing to Verify Assumptions:**
- Sensor testing in all weather conditions
- Brake testing under all conditions
- Latency measurement under load
- Assumption monitoring during deployment

---

# 2.4 SAFETY CASE DOCUMENTATION

## 2.4.1 What is a Safety Case

**Definition:**
A structured argument, supported by evidence, that a system is acceptably safe for deployment.

**Origin:**
- Aviation (DO-178C software certification)
- Nuclear (safety analysis reports)
- Medical devices (FDA pre-market approval)
- Adapted for AI

**Components:**
1. **Goals:** Top-level safety requirements
2. **Strategy:** How goals will be achieved
3. **Evidence:** Data, proofs, tests supporting strategy
4. **Context:** Deployment domain, assumptions
5. **Assurance:** Confidence level in the argument

## 2.4.2 Required Safety Case Structure

**For All AI Systems:**

**Goal (Top Level):**
"System X is acceptably safe for deployment in domain Y"

**Sub-Goals (Examples):**
- "System does not violate human rights"
- "System maintains care for humans (Article 1)"
- "System is transparent about limitations"
- "System accepts human oversight"

**Strategies:**
- "Provable safety via formal verification" (this Article)
- "Value alignment via learning" (Article 4)
- "Ongoing monitoring via Byzantine Council" (Article 11)
- "Sector-specific safety" (Articles 21-28)

**Evidence:**
- Formal proofs (Section 2.3)
- Mechanistic interpretability (Section 2.2)
- Testing results (extensive but not sole evidence)
- Expert review (Human Council approval)
- Deployment history (if system has track record)

**Context:**
- Deployment environment description
- User population characteristics
- Potential edge cases and how handled
- Assumptions and their validity

**Assurance:**
- Confidence level (e.g., "99.9% confidence")
- Limitations acknowledged
- Residual risks quantified
- Mitigation plans for residual risks

## 2.4.3 Safety Case Notation

**Use Goal Structuring Notation (GSN):**
- Graphical representation
- Shows argument structure visually
- Widely used in safety-critical industries
- Tools: ASCE, AdvoCATE

**Example GSN Diagram Structure:**
```
[Goal] System is safe
    ├─[Strategy] Via formal verification
    │   ├─[Evidence] Coq proof of safety properties
    │   └─[Evidence] Mechanistic interpretability report
    ├─[Strategy] Via continuous monitoring
    │   └─[Evidence] Byzantine Council logs (0 violations in 1000 hours)
    └─[Context] Deployed only in controlled environment
```

## 2.4.4 Safety Case Review Process

**Submission:**
- Safety case submitted with license application
- Must be in GSN format (or equivalent like Claims-Arguments-Evidence)
- Maximum 100 pages (executive summary + full documentation)

**Byzantine Council Review:**
- Automated checks for completeness
- Logical consistency verification
- Evidence validation (can proofs be reproduced?)

**Human Council Review:**
- If Byzantine flags concerns OR
- If high-risk system (autonomous weapons, critical infrastructure)
- Experts evaluate argument strength

**Acceptance Criteria:**
- Argument is logically sound
- Evidence supports all claims
- No critical gaps in coverage
- Assumptions are realistic and tested
- Residual risks are acceptable

**If Rejected:**
- Specific feedback provided
- Applicant can revise and resubmit
- No limit on resubmissions (but fees apply)

---

# 2.5 BURDEN OF PROOF ON DEVELOPERS

## 2.5.1 Principle

**Safety is not opt-in. It is prerequisite.**

**Analogy:**
- You don't get to build a skyscraper and then let government prove it will collapse.
- You must prove it won't collapse before building permit issued.

**Same for AI:**
- Don't deploy and let CSOAI prove it's dangerous.
- Prove it's safe before license issued.

## 2.5.2 Standard of Proof

**What Developers Must Demonstrate:**

**Beyond Reasonable Doubt (High-Risk Systems):**
- Formal mathematical proof
- Exhaustive testing
- Expert consensus
- Precedent from similar systems
- Confidence >99.9%

**Balance of Probabilities (Medium-Risk Systems):**
- Strong empirical evidence
- Partial formal verification
- Expert review
- Confidence >95%

**Reasonable Assurance (Low-Risk Systems):**
- Good testing practices
- Known failure modes mitigated
- User warnings clear
- Confidence >90%

## 2.5.3 Onus During Deployment

**Proof Not Just for Initial License:**

**Ongoing Obligations:**
- If system updated → re-prove safety
- If deployment expanded → prove safe in new context
- If incident occurs → prove it won't recur
- If Byzantine flags concern → prove it's false alarm or fix

**Continuous Proof:**
- Not one-time gate
- Living requirement throughout system life
- Burden always on developer, never shifts to CSOAI

---

# 2.6 RELATIONSHIP TO OTHER SAFETY APPROACHES

## 2.6.1 Complementarity with Testing

**Proof Does NOT Eliminate Testing:**

**Formal Verification:**
- Proves properties hold for model
- Model is abstraction of real system
- Gap between model and reality

**Testing:**
- Validates that model matches reality
- Finds bugs in implementation (not modeled behavior)
- Checks assumptions from verification

**Together:**
- Prove model is safe
- Test that implementation matches model
- Monitor that deployment matches testing

**Example:**
- Prove: "Braking algorithm never fails to activate"
- Test: Brakes actually work (hardware not modeled)
- Monitor: Brake performance doesn't degrade over time

## 2.6.2 Integration with Value Alignment (Article 4)

**Provable Safety + Value Learning:**

**Value Learning:**
- AI learns what humans want (inverse RL)
- But learning has uncertainty

**Provable Safety:**
- Prove that even with learned values, safety holds
- "Whatever values learned, cannot violate care (Article 1)"

**Example:**
- AI learns via IRL that humans value efficiency
- Proof shows: "Even if efficiency maximized, human welfare constraint never violated"

## 2.6.3 Integration with Byzantine Monitoring (Article 11)

**Static Proof + Dynamic Monitoring:**

**Formal Verification:**
- Proves safety for specified conditions
- Assumptions must hold

**Byzantine Council:**
- Monitors that assumptions continue to hold
- Detects distribution shift, adversarial attacks, unexpected inputs

**Together:**
- Verification proves "If assumptions hold, then safe"
- Byzantine checks "Do assumptions still hold?"

---

# 2.7 SECTOR-SPECIFIC VERIFICATION REQUIREMENTS

## 2.7.1 Healthcare AI (Article 21)

**Additional Proof Requirements:**

**Must Prove:**
- Diagnostic accuracy ≥ specialist (on validated test sets)
- Bias across demographics (racial, gender, age) < specified threshold
- Never recommends contraindicated treatments
- Explains reasoning in medically valid terms

**Verification Standards:**
- FDA Digital Health Pre-Cert (if applicable)
- ISO 13485 (Medical Devices)
- HL7 FHIR compliance (interoperability)

## 2.7.2 Financial AI (Article 22)

**Additional Proof Requirements:**

**Must Prove:**
- Fair lending (no disparate impact)
- Manipulation-proof (can't be gamed)
- Market stability (won't cause flash crash)
- Transparent explainability (FCRA compliance)

**Verification Standards:**
- SEC/FINRA algorithmic trading review
- Fed stress testing (if systemically important)
- GDPR/FCRA explainability

## 2.7.3 Military/Defense AI (Article 23)

**Additional Proof Requirements:**

**Must Prove:**
- Meaningful human control maintained
- Distinction (civilian vs. military targets)
- Proportionality (damage ≤ military advantage)
- No autonomous decision to use lethal force

**Verification Standards:**
- International Humanitarian Law compliance
- Geneva Conventions adherence
- Department of Defense AI Ethics Principles

*[Similar sector-specific requirements for Articles 24-28]*

---

# 2.8 LIMITATIONS & OPEN PROBLEMS

## 2.8.1 Current Limitations of Formal Verification

**Honest Acknowledgment:**

**Challenges:**
1. **Scalability:** Hard to verify large neural networks (millions of parameters)
2. **Abstraction Gap:** Model ≠ implementation perfectly
3. **Specification:** Hard to formalize "safety" completely
4. **Emergent Behavior:** Hard to predict from components
5. **Learning Systems:** Behavior changes after deployment

**Our Approach:**
- Require verification where possible (critical subsystems)
- Use approximation methods where exact verification impossible
- Monitor heavily where verification unavailable
- Research better verification techniques (Section 2.8.3)

## 2.8.2 What Cannot Be Fully Proven (Yet)

**Honest About Limits:**

**Cannot Prove:**
- Absence of all bugs (Halting Problem)
- Safety under all possible inputs (infinite space)
- Alignment with human values (values are complex/contested)
- Long-term safety (unpredictable future environments)

**Can Prove:**
- Specific safety properties for bounded domains
- Worst-case bounds on behavior
- Certain invariants hold
- Probabilistic safety with confidence bounds

**Strategy:**
- Prove what's provable
- Bound uncertainty for what's not
- Monitor aggressively (Byzantine Council)
- Improve verification methods over time

## 2.8.3 Research Priorities

**CSOAI Funds Research:**

**Technical:**
- Scalable neural network verification
- Verification of learning/adaptive systems
- Compositional verification (verify parts, prove whole)
- Probabilistic proof methods
- Verification of emergent multi-agent behavior

**Theoretical:**
- Formalization of value alignment
- Proof that corrigibility is maintained
- Verification of consciousness indicators (Article 6)
- Long-term safety proofs

**Practical:**
- Automated verification tools for practitioners
- User-friendly specification languages
- Integration with ML frameworks (PyTorch, TensorFlow)
- Cost-effective verification (reduce proof time/cost)

---

# 2.9 ENFORCEMENT

## 2.9.1 License Requirement

**Cannot Get License Without:**
- Safety case submitted
- Formal proofs provided (or strong empirical evidence if proof impossible)
- Mechanistic interpretability report
- Byzantine Council safety review passed

**Verification Depth Scales with Risk:**
- High-risk: Full formal verification required
- Medium-risk: Partial verification + heavy testing
- Low-risk: Testing + statistical bounds

## 2.9.2 Periodic Re-Verification

**Safety Proof is Not Permanent:**

**Must Re-Prove When:**
- System updated (code changes)
- Deployment expanded (new use cases)
- Assumptions violated (Byzantine detects)
- Incident occurs (prove fix worked)

**Annual Certification:**
- Even if no changes, must re-certify
- Ensures verification still valid
- Assumptions still hold
- No value drift occurred

## 2.9.3 Public Disclosure

**Transparency Requirement:**

**Published on Public Watchdog (Article 13):**
- Safety case (executive summary, not proprietary details)
- Verification methods used
- Confidence level achieved
- Known limitations
- Incident history

**Balance:**
- Enough detail for public confidence
- Protect proprietary methods
- Enable peer review
- Prevent misuse of vulnerabilities

---

# 2.10 CONCLUSION

**Provable Safety is Foundation:**

**Together with Article 1 (Maternal Covenant):**
- Article 1 defines WHAT (care for humans)
- Article 2 defines HOW TO PROVE IT

**Together They Mean:**
- AI must care for humans (Article 1)
- Developers must prove that care cannot be removed (Article 2)
- No proof = no license
- No exceptions

**This Raises the Bar:**
- From "we think it's safe"
- To "we can prove it's safe"

**This Is How Aviation Works:**
- Boeing proves 747 won't crash
- Not "we flew it 100 times and it didn't crash"
- Mathematical proof structure can handle loads

**This Is How AI Should Work:**
- OpenAI proves GPT-6 is safe
- Not "we red-teamed it and found nothing"
- Mathematical proof that care cannot be removed, safety cannot be violated

**We Are Building Safety Standards for the Most Important Technology in Human History.**

**We Will Not Accept "Good Enough."**

**We Demand Proof.**

---

**END OF ARTICLE 2**

*Next: Article 3 - Scientist AI Oversight (Byzantine Council)*

---

**LEGAL FOOTER:**

This Article is part of the CSOAI Partnership Charter and is subject to Article 0 (Foundational Legal Provisions) including governing law, dispute resolution, and liability limitations.

© 2026 CSOAI Ltd. Charter text licensed under CC BY-SA 4.0.  
"CSOAI" is a trademark of CSOAI Ltd.

For questions: legal@csoai.org
