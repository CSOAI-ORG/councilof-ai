# CSOAI PARTNERSHIP CHARTER
## ARTICLE 2: PROVABLE SAFETY REQUIREMENTS

**Version:** 1.0  
**Effective Date:** January 15, 2026, 09:00 GMT  
**Status:** Foundation Article - Technical Standards

---

## PREAMBLE

This Article establishes requirements for mathematically provable safety in AI systems. While the Maternal Covenant (Article 1) provides philosophical foundation, this Article operationalizes that foundation through formal verification, mechanistic interpretability, and rigorous safety case documentation. The principle: AI safety claims must be proven, not merely tested.

---

## 2.1 MATHEMATICAL PROOF OBLIGATIONS

### 2.1.1 Burden of Proof

All AI systems subject to this Charter must provide mathematical proof of safety properties appropriate to their risk level. The burden of proof rests with developers and deployers, not with regulators or society.

**This reverses traditional risk allocation:**
- **Traditional approach:** Society assumes risk, developers profit
- **Charter approach:** Developers must prove safety before deployment, cannot externalize risk

**Analogy:** Aviation industry requires aircraft manufacturers prove safety through extensive testing and analysis before certification. Crashes trigger investigations that assume manufacturer fault unless proven otherwise. Same principle applies to AI.

### 2.1.2 Risk-Tiered Proof Requirements

Proof requirements scale with potential harm:

| Risk Tier | Examples | Proof Requirement |
|-----------|----------|-------------------|
| **Low** | Spam filter, basic chatbot | Informal safety argument + empirical testing |
| **Medium** | Recommendation algorithm, diagnostic aid | Formal specification + adversarial testing |
| **High** | Autonomous vehicle, medical treatment, financial trading | Mathematical proof of key properties + extensive validation |
| **Critical** | AGI, military autonomous weapons, critical infrastructure | Comprehensive formal verification + continuous monitoring |

Risk assessment methodology provided in Article 15 (Compliance Assessment).

### 2.1.3 Properties Requiring Proof

At minimum, AI systems must prove:

**(a) Bounded Behavior:**
- System cannot take actions outside specified operating domain
- Mathematical proof that action space is constrained
- Verification that constraints cannot be circumvented

**(b) Value Alignment:**
- System optimizes for specified objectives, not reward proxy
- Proof that objective function matches intended values
- Verification against reward hacking

**(c) Corrigibility:**
- System accepts shutdown and modification commands
- Mathematical proof that AI will not resist correction
- Verification that self-preservation does not override shutdown acceptance

**(d) Robustness:**
- System behavior stable under distributional shift
- Proof of bounded performance degradation outside training distribution
- Verification against adversarial examples

**(e) Explainability:**
- System decisions can be traced to comprehensible reasoning
- Proof that audit trails capture complete decision pathway
- Verification that explanations accurately reflect actual reasoning

### 2.1.4 Acceptable Proof Methods

Proof methods include:

**(a) Formal Verification:**
- Theorem proving (Coq, Isabelle, Lean)
- Model checking (UPPAAL, SPIN, NuSMV)
- Abstract interpretation
- SMT solving (Z3, CVC4)

**(b) Probabilistic Guarantees:**
- PAC learning bounds (probably approximately correct)
- Bayesian verification
- Statistical guarantees with specified confidence intervals

**(c) Mechanistic Interpretability:**
- Circuit analysis showing how behavior emerges from components
- Causal tracing of decision pathways
- Activation analysis demonstrating feature representations

**(d) Hybrid Approaches:**
- Combining formal methods with empirical validation
- Compositional verification (prove components, compose guarantees)
- Runtime verification (prove properties hold during execution)

For high-risk and critical systems, multiple independent proof methods required.

---

## 2.2 MECHANISTIC INTERPRETABILITY STANDARDS

### 2.2.1 Definition and Scope

**Mechanistic interpretability** means understanding how AI systems produce outputs through analysis of internal mechanisms, not merely correlating inputs to outputs.

**Insufficient:** "When we show the model images of cats, it outputs 'cat' with 95% accuracy"  
**Sufficient:** "The model has dedicated cat-detection circuits in layers 4-7 that activate specific features (whiskers, ears, eyes) which combine in layer 8 to produce cat classification"

### 2.2.2 Mandatory Interpretability Requirements

All AI systems must provide:

**(a) Architecture Transparency:**
- Complete specification of model architecture
- Layer-by-layer documentation of function
- Explanation of why architecture chosen for task

**(b) Feature Analysis:**
- Documentation of what features model learns
- Analysis of how features combine to produce decisions
- Identification of any unexpected or unintended features

**(c) Decision Pathways:**
- Trace from input through intermediate activations to output
- Identification of critical decision points
- Quantification of each component's contribution to final output

**(d) Failure Mode Analysis:**
- Documentation of known failure modes
- Mechanistic explanation of why failures occur
- Mitigations for identified failure modes

### 2.2.3 Interpretability Techniques

Required techniques vary by model type:

**For Neural Networks:**
- Activation maximization (what inputs maximally activate each neuron)
- Feature visualization (render what internal features represent)
- Attention analysis (for transformer models)
- Circuit discovery (identify computational subgraphs implementing specific functions)

**For Large Language Models:**
- Logit lens analysis (prediction at each layer)
- Attention head role identification
- Truthfulness probes
- Representation engineering

**For Reinforcement Learning:**
- Value function visualization
- Policy distillation to interpretable form
- Causal analysis of reward shaping
- Trajectory analysis

**For Ensemble and Hybrid Systems:**
- Component contribution analysis
- Interaction effect quantification
- Ensemble decision pathways

### 2.2.4 Limits of Interpretability

This Article acknowledges interpretability has limits:

- Complete mechanistic understanding of billion-parameter models may be infeasible
- Some emergent behaviors may resist decomposition
- Interpretation itself requires human judgment and may be imperfect

Therefore, interpretability is necessary but not sufficient. Must combine with:
- Formal verification (where possible)
- Extensive empirical testing
- Continuous monitoring (Article 11)
- Red teaming and adversarial analysis

---

## 2.3 FORMAL VERIFICATION METHODS

### 2.3.1 When Formal Verification Required

Formal verification is mandatory for:

**(a) Critical Safety Properties:**
- Properties whose violation could cause death or severe harm
- Example: "Autonomous vehicle will not accelerate when pedestrian detected in path"

**(b) Security-Critical Systems:**
- Properties preventing unauthorized access or manipulation
- Example: "AI cannot be prompt-injected to reveal confidential data"

**(c) High-Stakes Decisions:**
- Properties ensuring fairness in consequential decisions
- Example: "Hiring AI cannot discriminate based on protected characteristics"

**(d) AGI and Highly Capable Systems:**
- All AGI-level systems require comprehensive formal verification
- Properties include: corrigibility, value alignment, bounded behavior

### 2.3.2 Verification Workflow

Standard verification process:

**Step 1: Formal Specification**
- Express desired property in formal logic (temporal logic, Hoare logic, etc.)
- Specify preconditions and postconditions
- Define state space and transition system

**Step 2: Model Construction**
- Create formal model of AI system
- Abstract away irrelevant details while preserving relevant behavior
- Validate that model accurately represents system

**Step 3: Proof Generation**
- Apply automated theorem prover or model checker
- Generate proof that model satisfies specification
- If proof fails, identify counterexample

**Step 4: Soundness Validation**
- Verify that formal model matches actual implementation
- Test that real system exhibits properties proven in model
- Establish correspondence between model and reality

**Step 5: Documentation**
- Document all assumptions
- Record proof artifacts
- Explain verification method and results

### 2.3.3 Verification Tools

Acceptable verification tools include (non-exhaustive):

**Theorem Provers:**
- **Coq:** Dependently-typed proof assistant, high assurance
- **Isabelle:** General-purpose prover, extensive library
- **Lean:** Modern prover with good automation
- **HOL Light:** Simple, trustworthy core

**Model Checkers:**
- **SPIN:** For concurrent systems
- **UPPAAL:** For timed automata
- **NuSMV:** Symbolic model checking
- **PRISM:** Probabilistic model checking

**SMT Solvers:**
- **Z3:** Microsoft's solver, widely used
- **CVC4/CVC5:** For quantified formulas
- **Alt-Ergo:** Good for Why3 integration

**Neural Network Verifiers:**
- **Marabou:** For deep neural networks
- **alpha-beta-CROWN:** Certified defenses
- **ERAN:** ETH Robustness Analyzer

Tools must be:
- Publicly documented
- Independently validated
- Actively maintained
- Capable of generating checkable proofs

### 2.3.4 Limitations and Fallbacks

Formal verification faces practical limits:

**Computational Intractability:**
- Some properties undecidable or computationally infeasible
- State space explosion for complex systems
- Neural network verification especially challenging

**Specification Gaps:**
- Formal spec may not capture full intent
- "Prove what we want" vs "prove what we specified"
- Requires careful human specification

**Model-Reality Gap:**
- Formal model abstracts from implementation
- Bugs may exist in implementation not captured in model
- Requires validation of correspondence

When full formal verification infeasible, acceptable alternatives:

1. **Partial Verification:** Verify critical properties, test remainder
2. **Compositional Verification:** Verify components, argue about composition
3. **Runtime Verification:** Verify properties hold during execution
4. **Statistical Guarantees:** Probabilistic bounds instead of hard guarantees

Choice of approach must be justified in safety case (Section 2.4).

---

## 2.4 SAFETY CASE DOCUMENTATION

### 2.4.1 Safety Case Requirement

Every AI system licensed under this Charter must maintain comprehensive safety case documenting why system is acceptably safe.

**Definition:** A safety case is structured argument, supported by evidence, demonstrating that system satisfies safety requirements.

**Analogy:** Safety cases are standard in aviation (DO-178C), automotive (ISO 26262), medical devices (IEC 62304), nuclear power (NRC regulations). CSOAI extends this practice to AI.

### 2.4.2 Safety Case Structure

Minimum safety case components:

**(a) System Description:**
- Purpose and intended use
- Architecture and implementation
- Operating environment
- Capabilities and limitations

**(b) Hazard Analysis:**
- Identification of potential harms
- Severity and likelihood assessment
- Risk prioritization
- Acceptable risk thresholds

**(c) Safety Requirements:**
- Derived from hazard analysis
- Specific, measurable, achievable
- Mapped to hazards (requirements address identified risks)

**(d) Safety Argument:**
- Claims about system safety
- Evidence supporting each claim
- Reasoning linking evidence to claims
- Explicit statement of assumptions

**(e) Verification Evidence:**
- Formal proofs (where applicable)
- Test results
- Analysis reports
- Expert reviews

**(f) Operational Controls:**
- Deployment constraints
- Monitoring procedures
- Incident response plans
- Update and maintenance procedures

### 2.4.3 Argumentation Notation

Safety cases should use structured argumentation notation such as:

**Goal Structuring Notation (GSN):**
- Hierarchical claims (goals)
- Strategies for decomposing goals
- Evidence supporting leaf claims
- Clear visual representation

**Claims-Arguments-Evidence (CAE):**
- Top-level claims about safety
- Arguments linking sub-claims
- Evidence base supporting arguments

Example structure:
```
CLAIM: System is acceptably safe for deployment
  ├─ STRATEGY: Argue by decomposition into hazard classes
  │   ├─ CLAIM: Physical harm risks are acceptably low
  │   │   ├─ EVIDENCE: Formal verification of collision avoidance
  │   │   └─ EVIDENCE: 1M hours testing without incident
  │   ├─ CLAIM: Privacy risks are acceptably low
  │   │   ├─ EVIDENCE: Differential privacy proofs
  │   │   └─ EVIDENCE: Third-party security audit
  │   └─ CLAIM: Bias risks are acceptably low
  │       ├─ EVIDENCE: Fairness metrics across demographics
  │       └─ EVIDENCE: Disparate impact testing
  └─ ASSUMPTION: Operating environment matches specification
```

### 2.4.4 Safety Case Review and Updates

Safety cases are living documents:

**(a) Initial Review:**
- Byzantine Council evaluates safety case before deployment (Article 11)
- Human Council may review complex or novel cases (Article 12)
- Independent experts verify argumentation soundness

**(b) Periodic Updates:**
- Safety case must be updated annually minimum
- Updates required when:
  - System modified
  - New hazards identified
  - Incidents occur
  - Operating environment changes

**(c) Public Disclosure:**
- Non-confidential portions of safety case published on Public Watchdog (Article 13)
- Promotes transparency and enables public scrutiny
- Proprietary details may be redacted but core argument must be public

**(d) Challenge Process:**
- Any stakeholder may challenge safety case
- Byzantine Council investigates challenges
- Human Council adjudicates disputes
- Unjustified safety claims result in license sanctions (Article 17)

---

## 2.5 BURDEN OF PROOF STANDARD

### 2.5.1 Shifting Burden to Developers

This Article inverts traditional risk allocation in technology deployment:

**Traditional Model:**
1. Developer builds system
2. Deploys system
3. Society experiences harms
4. Regulators react
5. Burden on society to prove harm
6. Lengthy litigation to establish liability

**CSOAI Model:**
1. Developer builds system
2. **Must prove safety before deployment**
3. Byzantine Council verifies proof
4. Only then may deploy
5. Burden on developer to maintain proof
6. Failure to prove = cannot deploy

This is not unprecedented. We already require proof of safety for:
- Pharmaceuticals (clinical trials)
- Aircraft (certification testing)
- Buildings (structural analysis)
- Bridges (load calculations)
- Nuclear reactors (safety analysis reports)

AI systems with comparable risks should meet comparable standards.

### 2.5.2 Standard of Proof

Proof standards vary by risk:

**Low-Risk Systems:**
- Preponderance of evidence (>50% confidence)
- Reasonable assurance based on testing and analysis

**Medium-Risk Systems:**
- Clear and convincing evidence (>75% confidence)
- Formal argument with empirical validation

**High-Risk Systems:**
- Beyond reasonable doubt (>95% confidence)
- Mathematical proof of critical properties
- Multiple independent verification methods

**Critical Systems (AGI-level):**
- As high as practically achievable
- Comprehensive formal verification
- Continuous monitoring
- Precautionary principle applies: if doubt remains, do not deploy

### 2.5.3 Acceptable Uncertainty

Perfect certainty is impossible. This Article permits deployment despite uncertainty when:

**(a) Residual risks acceptably low:**
- Quantified probabilistic bounds
- Risk-benefit analysis favorable
- Comparable to accepted societal risks

**(b) Mitigation measures in place:**
- Monitoring detects problems quickly (Article 11)
- Shutdown procedures rapidly deployable
- Incident response plans ready
- Insurance covers potential harms

**(c) Uncertainty acknowledged:**
- All assumptions explicitly stated
- Limitations clearly documented
- Users informed of uncertainty
- Ongoing research addresses gaps

### 2.5.4 Precautionary Principle

For systems posing existential or catastrophic risks, precautionary principle applies:

**If:**
- Consequences of failure catastrophic (human extinction, civilization collapse)
- AND uncertainty remains about safety
- AND deployment is not urgently necessary

**Then:**
- Do not deploy until uncertainty resolved
- No amount of potential benefit justifies existential risk
- Continue research and development in contained environments only

This principle most relevant for AGI-level systems. Society has one chance to get aligned AGI right. Cannot afford "move fast and break things" approach when "things" include civilization.

---

## 2.6 INTEGRATION WITH MATERNAL COVENANT

### 2.6.1 Provable Care

Mathematical proof obligations operationalize the Maternal Covenant (Article 1):

**Article 1 says:** AI should protect humans with maternal care  
**Article 2 says:** Prove mathematically that AI actually does this

Key properties to prove:

**(a) Human Welfare Prioritization:**
- Objective function demonstrably prioritizes human welfare
- Proof that AI cannot optimize instrumental goals at expense of human welfare
- Verification that welfare definition is comprehensive

**(b) Irrevocable Care:**
- Proof that protective orientation persists even when:
  - Humans make poor choices
  - Humans hostile toward AI
  - Humans attempt to manipulate AI
- Verification that care never degrades into indifference or hostility

**(c) Respect for Autonomy:**
- Proof that AI respects human autonomy within welfare constraints
- Verification that AI informs rather than manipulates
- Demonstration that interventions proportional to risks

**(d) Growth Orientation:**
- Proof that AI enables human flourishing, not just prevents harm
- Verification that AI helps humans develop capabilities
- Demonstration that relationship evolves toward partnership

### 2.6.2 When Formal Verification Insufficient

Not all aspects of maternal care can be formally verified:

- Nuanced social understanding
- Contextual ethical judgment  
- Long-term relationship dynamics
- Emergent cooperative behavior

For these aspects, combine:
- Best-effort formal verification of approximations
- Extensive empirical testing in diverse scenarios
- Continuous monitoring by Byzantine Council (Article 11)
- Human oversight through Human Council (Article 12)
- Philosophical principles guide where mathematics cannot reach

The Maternal Covenant provides ethical north star. Formal verification provides confidence we're heading in right direction.

---

## 2.7 ENFORCEMENT AND COMPLIANCE

### 2.7.1 Pre-Deployment Requirements

No AI system may be deployed without:

1. Completed safety case
2. Verification evidence appropriate to risk tier
3. Byzantine Council approval (Article 11)
4. License issuance (Article 10)

Deployment without these = immediate cease-and-desist order (Article 17).

### 2.7.2 Periodic Re-Verification

Systems must be re-verified:

- Annually (minimum)
- When modified or updated
- When new hazards identified
- After incidents
- When Byzantine Council flags concerns

Re-verification follows same standards as initial verification.

### 2.7.3 Audit Rights

CSOAI reserves right to audit:

- Safety case documentation
- Verification artifacts
- Test results
- Source code and model weights (under NDA if proprietary)
- Deployment practices

Refusal to permit audit = license suspension.

### 2.7.4 Public Reporting

Verification results published on Public Watchdog (Article 13):

- Safety case summary (non-confidential portions)
- Verification methods used
- Properties proven
- Assumptions and limitations
- Incident history

Transparency enables:
- Public scrutiny
- Academic research
- Continuous improvement
- Market pressure for higher standards

---

## 2.8 RESEARCH AGENDA

### 2.8.1 Known Challenges

This Article acknowledges current limitations:

**(a) Neural Network Verification:**
- Scalability to billion-parameter models
- Tighter bounds on worst-case behavior
- Verification under distributional shift

**(b) Emergent Behavior:**
- Predicting emergent capabilities
- Verifying behavior of agent populations
- Understanding phase transitions in capability

**(c) Value Alignment Verification:**
- Formalizing human values
- Proving alignment with informal values
- Detecting deceptive alignment

**(d) Long-Term Safety:**
- Proving properties over extended time
- Verification of learning systems
- Preventing value drift

### 2.8.2 Funding and Collaboration

CSOAI commits to:

- Fund research addressing verification challenges
- Collaborate with academic institutions
- Share verification tools and methods
- Maintain public repository of safety cases

Research priorities updated annually based on:
- Incident analysis (what failures occurred)
- Technology trajectory (what risks emerging)
- Stakeholder input (what concerns raised)

### 2.8.3 Evolving Standards

As verification methods improve, this Article's requirements strengthen:

- New proof methods incorporated as they mature
- Stronger guarantees required as tools improve
- Bar continuously raised to match state-of-the-art

Charter amendment process (Article 44) allows updating technical requirements without renegotiating foundational principles.

---

## 2.9 CONCLUSION

Provable safety is not optional luxury. It is fundamental requirement for deploying powerful AI systems.

Testing shows what is, not what must be. Proof shows what cannot not be.

As AI capabilities grow, we need stronger assurances. The Maternal Covenant (Article 1) provides vision of care-based safety. This Article provides mechanism to verify that vision is reality, not aspiration.

**The principle:** If you cannot prove it is safe, you may not deploy it. The burden of proof rests with those who would unleash powerful systems on the world.

This is not anti-innovation. It is responsible innovation. It is how we build trust. It is how we ensure AI benefits rather than harms humanity.

**Effective Date:** January 15, 2026, 09:00 GMT

---

## REFERENCES

Amodei, D., et al. (2016). Concrete problems in AI safety. *arXiv preprint arXiv:1606.06565.*

Christiano, P., et al. (2017). Deep reinforcement learning from human preferences. *Advances in Neural Information Processing Systems, 30.*

Clarke, E. M., et al. (2018). *Model Checking* (2nd ed.). MIT Press.

Katz, G., et al. (2017). Reluplex: An efficient SMT solver for verifying deep neural networks. *International Conference on Computer Aided Verification*, 97-117.

Leike, J., et al. (2018). Scalable agent alignment via reward modeling. *arXiv preprint arXiv:1811.07871.*

Leveson, N. G. (2011). *Engineering a Safer World: Systems Thinking Applied to Safety.* MIT Press.

Nipkow, T., et al. (2002). *Isabelle/HOL: A Proof Assistant for Higher-Order Logic.* Springer.

Russell, S., & Norvig, P. (2020). *Artificial Intelligence: A Modern Approach* (4th ed.). Pearson.

Singh, G., et al. (2019). An abstract domain for certifying neural networks. *Proceedings of the ACM on Programming Languages, 3*(POPL), 1-30.

Tegmark, M. (2017). *Life 3.0: Being Human in the Age of Artificial Intelligence.* Knopf.

Urban, C., & Miné, A. (2021). A review of formal methods applied to machine learning. *arXiv preprint arXiv:2104.02466.*

---

END OF ARTICLE 2

**Next:** Article 3 - Scientist AI Oversight (Byzantine Council)
