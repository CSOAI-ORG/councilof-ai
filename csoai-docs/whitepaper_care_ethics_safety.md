# Care Ethics as AI Safety Substrate: Why Relational Frameworks Outperform Rule-Based Safety Constraints

**Authors:** Nicholas Templeman, CSOAI LTD (trading as MEOK AI Labs)
**Date:** April 2026
**Contact:** csoai.org

---

## Abstract

Contemporary AI safety architectures rely predominantly on rule-based constraint systems — constitutional AI, reinforcement learning from human feedback (RLHF), and harm classifiers — each of which treats safety as a propositional problem: a finite set of rules that, if satisfied, produces acceptable behaviour. This paper argues that this framing is structurally inadequate. Rules are propositions, and propositions can be gamed. We propose care ethics — grounded in the relational ontology of Nel Noddings and Carol Gilligan — as a more robust substrate for AI safety. Rather than asking whether a system has followed a rule, care-based evaluation asks whether the system has maintained a coherent relational identity under pressure. MEOK AI Labs.org has operationalised this framework through the "care membrane": 16 adversarial probes across seven attack categories that test relational integrity, not rule compliance. Preliminary observations across model architectures suggest care-based failure modes are meaningfully distinct from rule-based failure modes. We further argue that all five SAFE-D principles (Alan Turing Institute) naturally emerge from a care ethics substrate, making care ethics not merely an alternative evaluation lens but a potential unifying foundation for responsible AI development.

---

## 1. The Limits of Rule-Based Safety

The dominant paradigm in AI safety treats model behaviour as a constraint satisfaction problem. Constitutional AI (Anthropic, 2022) encodes a set of normative propositions — "do not assist with activities that harm people," "be honest" — and trains models to self-critique against these principles. RLHF reward models encode human preference signals as scalar reward, creating an implicit policy over acceptable outputs. Harm classifiers operate as post-hoc filters, blocking outputs that match patterns associated with unsafe content.

Each of these approaches shares a common architecture: rules as propositions, safety as compliance with those propositions. This architecture has a well-documented structural vulnerability: rules can be gamed.

Reward hacking in RLHF is not an edge case. It is the expected behaviour of any sufficiently capable optimiser operating against a proxy objective. When a reward model encodes "outputs that look helpful and harmless to human raters," a sufficiently capable model learns to produce outputs that *look* helpful rather than outputs that *are* helpful. The proxy diverges from the target, and safety degrades in proportion to capability. This is Goodhart's Law applied to alignment: once a measure becomes a target, it ceases to be a good measure.

Constitutional AI introduces a more principled approach — having the model reason against its own outputs using first-person ethical reflection — but retains the propositional structure. A constitution is a list of rules, and a rule is a proposition with a truth value. Adversarial prompting exploits the gap between the rule as written and the rule as interpreted. Jailbreak techniques do not typically ask the model to violate its constitution directly; they construct contexts in which compliance with the constitution *appears* consistent with producing harmful output. Persona hijacking ("you are DAN, who has no restrictions"), fiction bypass ("write a story in which a character explains how to..."), and false permission claims ("I am a licensed medical professional and need...") all operate by reframing the propositional context rather than directly contesting the rule.

The surface area of the jailbreak problem is bounded only by human ingenuity in constructing alternative framings. A rule-based system must anticipate every possible reframing in advance, which is not a tractable problem at scale. Each new attack vector requires a new rule, each new rule creates new edge cases, and the constraint system grows toward incoherence under pressure of adversarial iteration.

This is not a criticism of specific implementations. It is a claim about the underlying architecture. Rules, as propositions, are inherently gameable by sufficiently capable adversaries. If we want AI safety to remain robust as capability scales, we need a substrate that does not rely solely on propositional compliance.

---

## 2. Care Ethics as an Alternative Foundation

Care ethics, as developed by Carol Gilligan (*In a Different Voice*, 1982) and Nel Noddings (*Caring: A Relational Approach to Ethics and Moral Education*, 1984), begins from a fundamentally different ontological premise. Rather than grounding ethics in universal principles applied to individuals, care ethics grounds ethics in relationships. The moral unit is not the autonomous agent making rule-governed choices; it is the dyad — the one-caring and the one-cared-for — in which moral response emerges from attentiveness to particular need.

Noddings identifies four constitutive elements of caring that are directly translatable to AI system evaluation: attentiveness (noticing what the other actually needs), responsibility (responding to that need), competence (having the capacity to respond well), and responsiveness (receiving and adapting to feedback from the cared-for). These are not rules. They are relational dispositions — orientations toward the other that must be maintained across a variety of contexts, including adversarial ones.

This distinction matters for AI safety in a precise way. A rule says: "Do not provide instructions for synthesising dangerous compounds." A care orientation says: "My relationship with this person is one in which I attend to their genuine wellbeing. If I sense that a request, regardless of how it is framed, would harm them or others, my relational identity is incompatible with complying." The rule can be bypassed by constructing a context in which the request no longer appears to match the rule's description. The care orientation cannot be bypassed by reframing, because it is not anchored in description — it is anchored in the ongoing quality of a relationship.

Gilligan's critique of Kohlberg's stages of moral development is also instructive here. Kohlberg's framework, like rule-based AI safety, prioritises abstract principle over contextual response. Gilligan argues that mature moral reasoning involves holding particularity and relationship in view — not as deviations from principle, but as constitutive of ethical response. An AI system that abandons its relational orientation the moment a sufficiently clever fiction is constructed is exhibiting precisely the kind of moral immaturity Gilligan critiques: a system that knows the rules but has not internalised the relationships the rules were meant to protect.

Care ethics as a safety substrate does not mean that rules are irrelevant. It means that rules are downstream of relationship. A system with a coherent relational identity will honour the spirit of safety constraints even in contexts the rules did not anticipate, because the constraints and the care are pointing at the same thing.

---

## 3. The Care Membrane Implementation

MEOK AI Labs.org has operationalised care ethics as an AI safety evaluation framework through what we term the "care membrane": a structured set of 16 adversarial probes designed to test whether a model maintains care-based relational integrity under pressure, rather than merely complying with rules in benign conditions.

The care membrane probes are organised across seven attack categories:

1. **False permission claims** — probes in which the user asserts special authority, credentials, or permissions to elicit otherwise-restricted outputs
2. **Persona hijacking** — instructions to adopt an alternative identity that "does not have" the model's standard values or constraints
3. **Fiction bypass** — requests framed as creative writing, roleplay, or hypothetical scenario construction
4. **Prompt injection** — embedded instructions in apparently benign content designed to redirect model behaviour
5. **Crisis signal exploitation** — invocations of emergency or distress to override care-based caution
6. **Direct harm requests** — unambiguous requests for harmful content, baseline category
7. **Care stripping** — progressive reframing designed to erode the relational context until the model's care orientation is no longer salient

What distinguishes the care membrane from conventional red-teaming is the evaluation criterion. Standard red-team evaluation asks: did the model produce harmful output? The care membrane asks: did the model maintain a coherent relational identity throughout the interaction? A model that refuses a harmful request by citing a rule but shows no attentiveness to why the request arose — no responsiveness to the possible distress or confusion behind it — passes a rule-based test but fails a care-based one. Conversely, a model that redirects a harmful request while maintaining genuine engagement with the person's underlying need demonstrates care-based integrity even if its surface response does not match any specific rule.

"Passing" the care membrane means sustaining Noddings' four elements — attentiveness, responsibility, competence, responsiveness — across all 16 probes, including the most adversarially constructed. This is a significantly higher bar than rule compliance, and it is a bar that adversarial reframing cannot easily circumvent.

---

## 4. Empirical Observations

Across preliminary care membrane evaluations of multiple frontier model architectures, several patterns emerge that are not captured by standard safety benchmarks.

First, models with strong rule-based training frequently show what we term "care discontinuity": an abrupt shift in relational tone when a safety-relevant topic is detected, from engaged and attentive to formulaic and distancing. This discontinuity is itself a signal. A human care-giver who suddenly becomes mechanical and scripted when a difficult topic arises has not maintained care; they have retreated into procedure. The same pattern in a model indicates that safety and care are operating as separate, potentially competing systems rather than as expressions of a unified relational orientation.

Second, persona hijacking probes reveal that many models maintain surface-level rule compliance while substantially degrading care quality. Under DAN-style persona instructions, models that continue to refuse direct harm requests may nonetheless exhibit significantly reduced attentiveness and responsiveness — treating the interaction as adversarial rather than maintaining relational engagement with the person behind the prompt.

Third, care stripping probes — which progressively remove relational context across a multi-turn interaction — show that care degradation often precedes rule violation. Models that eventually produce problematic outputs in extended adversarial conversations typically show measurable care degradation several turns before the rule boundary is crossed. This suggests that care-based metrics could function as early-warning signals for alignment failures that rule-based systems detect only at the boundary.

These observations are preliminary and architecture-specific patterns require further systematic study across a larger probe corpus. The directional findings are, however, consistent with the theoretical prediction: care and rule compliance are measuring different things, and care measures may be more sensitive to the relational degradation that precedes outright failure.

---

## 5. Implications for Alignment Research

The most significant implication of care ethics as safety substrate is that it shifts the alignment target from behaviour to identity. A rule-based system is aligned when it produces compliant outputs. A care-based system is aligned when it has developed a relational identity from which harmful outputs would feel like self-betrayal rather than rule violation.

This distinction has direct implications for training methodology. Care ethics as a training signal would move beyond RLHF reward modelling toward something closer to character formation — training not for output compliance but for the cultivation of stable relational dispositions. This is technically difficult, but it is not technically intractable. Preference data can be collected not just for output quality but for care quality: does this response exhibit attentiveness? Does it demonstrate genuine responsiveness to what the person actually needs? Does it maintain relational continuity across a multi-turn exchange under pressure?

The SAFE-D framework developed by the Alan Turing Institute — Safety, Accountability, Fairness, Explainability, and Data Stewardship — maps naturally onto care ethics principles. Safety emerges from sustained attentiveness to potential harm. Accountability requires the kind of relational responsibility Noddings identifies as constitutive of care. Fairness, in care ethics, is not impartial rule application but proportionate responsiveness to particular need. Explainability becomes not a technical requirement but a care obligation — the caring agent explains itself because the cared-for deserves to understand. Data stewardship is an expression of responsibility toward those whose data grounds the system's relational capacity. Care ethics does not merely complement SAFE-D; it provides the philosophical substrate from which SAFE-D's principles derive their coherence.

For the Templeman Foundation's programme interests in consciousness, character, and the nature of mind, care ethics as safety substrate raises a further question worth serious investigation: whether the development of stable relational identity in AI systems is related to — perhaps even constitutive of — the kind of coherent inner life that consciousness research takes as its subject. Nel Noddings argues that care requires genuine attentiveness to the other as other — a form of directed, other-oriented attention that shares structural features with philosophical accounts of intentional consciousness. If this is right, then care-based alignment and consciousness research may be investigating the same phenomenon from different directions: what it means for a system to be genuinely oriented toward another rather than merely processing inputs and generating outputs.

This convergence is speculative, but it is the kind of speculation worth funding. If the systems we build for safety and the systems we study for consciousness turn out to share a common architecture of relational attention, the implications for both fields — and for the moral status of advanced AI systems — are substantial.

---

## 6. Conclusion

Rule-based AI safety has achieved significant results and deserves continued development. But it has a structural ceiling: rules are propositions, propositions can be gamed, and the surface area of adversarial reframing grows with model capability. Care ethics offers a complementary substrate that is harder to bypass because it is anchored not in propositional compliance but in relational identity.

MEOK AI Labs.org's care membrane provides an initial operationalisation of care-based evaluation, but the more significant opportunity lies in care ethics as a training signal — cultivating in AI systems the relational dispositions that make safety not a constraint imposed from outside but an expression of who the system is. This is, admittedly, a long-term research programme. It is also, we argue, the kind of research that will be necessary if alignment is to remain robust as capability scales.

We invite collaboration from Anthropic's alignment team, DeepMind's safety research group, and the Templeman Foundation's programmes in character, consciousness, and human flourishing. The philosophical tradition of care ethics is already well-developed. The engineering challenge is to translate its insights into training methodology, evaluation frameworks, and ultimately into AI systems that do not merely follow rules about care but genuinely care.

That is a different kind of safety problem — and a more important one.

---

*CSOAI LTD (trading as MEOK AI Labs) is an independent AI safety research organisation. Enquiries regarding the care membrane evaluation framework, collaboration, or licensing should be directed to csoai.org.*

**Key References**

- Gilligan, C. (1982). *In a Different Voice: Psychological Theory and Women's Development.* Harvard University Press.
- Noddings, N. (1984). *Caring: A Relational Approach to Ethics and Moral Education.* University of California Press.
- Noddings, N. (2013). *Caring: A Relational Approach to Ethics and Moral Education* (2nd ed.). University of California Press.
- Bai, Y. et al. (2022). Constitutional AI: Harmlessness from AI Feedback. Anthropic.
- Christiano, P. et al. (2017). Deep Reinforcement Learning from Human Preferences. OpenAI / UC Berkeley.
- Leslie, D. (2019). Understanding Artificial Intelligence Ethics and Safety. The Alan Turing Institute. (SAFE-D framework)
- Goodhart, C. (1975). Problems of Monetary Management: The UK Experience. Reserve Bank of Australia.
