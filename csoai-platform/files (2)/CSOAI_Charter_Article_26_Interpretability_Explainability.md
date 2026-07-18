# CSOAI PARTNERSHIP CHARTER
## ARTICLE 26: INTERPRETABILITY & EXPLAINABILITY STANDARDS

**Version:** 1.0  
**Effective Date:** January 15, 2026, 09:00 GMT  
**Status:** Technical Article - Transparency Standards

---

## PREAMBLE

This Article establishes comprehensive interpretability and explainability standards for AI systems. Black-box AI is unacceptable for high-stakes decisions. **We must understand how AI systems reach their conclusions.**

**Core Principle:** Transparency enables trust, accountability, and safety.

---

## 26.1 MECHANISTIC INTERPRETABILITY

### 26.1.1 Understanding Internal Mechanisms

**Beyond Black Boxes:**

**What is Mechanistic Interpretability?**
- Understanding the internal workings of neural networks
- Identifying specific circuits and features
- Reverse-engineering how the model computes
- Not just post-hoc explanations, but true understanding

**Required for Critical Risk Tier:**
- Must demonstrate understanding of model internals
- Cannot rely solely on empirical testing
- Need to explain WHY model works, not just THAT it works

### 26.1.2 Circuit Analysis

**Identifying Computational Paths:**

**Circuits:**
- Specific subnetworks within larger model
- Implement particular computations
- Example: "Induction head" circuit in transformers (copies previous tokens)

**Methodology:**
1. **Activation Patching:**
   - Replace activations in one forward pass with activations from another
   - Identify which components are causally important
   
2. **Causal Interventions:**
   - Manually set specific activations
   - Measure downstream effects
   - Build causal graph of computation

3. **Feature Visualization:**
   - Find inputs that maximally activate specific neurons
   - Understand what features neurons represent
   - Example: Edge detector, texture detector, object part detector

**Example: Image Classifier Circuit**
```
Input Image
  ↓
Early Layers: Edge detection (horizontal, vertical, diagonal)
  ↓
Middle Layers: Texture and pattern recognition
  ↓
Late Layers: Object parts (wheels, windows, faces)
  ↓
Final Layer: Object categories
  ↓
Output: "Cat" (85% confidence)
```

**Requirements:**
- Critical systems: Document key circuits
- Identify safety-critical pathways
- Verify circuits behave as expected
- Test edge cases where circuits might fail

### 26.1.3 Activation Analysis

**What Are Neurons Encoding?**

**Techniques:**

**1. Maximum Activation Examples:**
- Find training examples that maximally activate neuron
- Reveals what concept neuron responds to
- Example: Neuron #472 activates strongly on images of cars

**2. Dimensionality Reduction:**
- t-SNE, UMAP on activation space
- Visualize clustering of concepts
- Identify separability of classes

**3. Probing Classifiers:**
- Train linear classifier on activations
- Test if specific information is encoded
- Example: "Is gender information encoded in layer 5?"

**Safety Application:**
- Identify neurons encoding protected attributes (race, gender)
- Verify debiasing worked (protected attributes not used for decision)
- Monitor for adversarial activations (unusual activation patterns)

### 26.1.4 Causal Tracing

**Path Analysis:**

**Methodology:**
- Trace information flow through network
- Identify bottlenecks
- Understand failure modes

**Example: Language Model**
```
Input: "The Eiffel Tower is located in"
  ↓
Layer 1: Syntax parsing
Layer 3: Entity recognition ("Eiffel Tower")
Layer 5: Fact retrieval (location attribute)
Layer 8: Answer generation
  ↓
Output: "Paris"

Causal Trace: Information about "Eiffel Tower" flows through specific attention heads in layers 3-5
```

**Intervention Testing:**
- Block specific pathways
- Measure impact on output
- Confirms causal role

**CSOAI Requirement:**
- Critical systems: Map key causal pathways
- Verify safety-critical computations
- Document failure modes

---

## 26.2 POST-HOC EXPLAINABILITY

### 26.2.1 Local Explanations

**Explaining Individual Predictions:**

**LIME (Local Interpretable Model-agnostic Explanations):**

**How It Works:**
1. Generate perturbations of input (nearby examples)
2. Get model predictions on perturbations
3. Train simple interpretable model (e.g., linear) on perturbations
4. Linear model approximates complex model locally
5. Linear model coefficients = explanation

**Example: Image Classification**
```python
from lime import lime_image

explainer = lime_image.LimeImageExplainer()
explanation = explainer.explain_instance(
    image, 
    model.predict, 
    top_labels=1, 
    num_samples=1000
)

# Shows which pixels contributed most to prediction
explanation.show_explanation()
```

**Output:** Highlights regions of image important for classification

**Pros:**
- Model-agnostic (works with any model)
- Intuitive (shows important features)

**Cons:**
- Approximation (may be unfaithful)
- Instability (small input changes → different explanations)
- Computationally expensive

**SHAP (SHapley Additive exPlanations):**

**Based on Game Theory:**
- Shapley values: Fair attribution of contribution
- Each feature gets credit for its marginal contribution
- Satisfies nice mathematical properties (efficiency, symmetry, dummy, additivity)

**How It Works:**
1. Consider all possible coalitions of features
2. Measure marginal contribution of each feature
3. Average across all coalitions
4. Result: SHAP value for each feature

**Example: Loan Approval**
```python
import shap

explainer = shap.TreeExplainer(model)
shap_values = explainer.shap_values(X_test)

# Feature importance for specific prediction
shap.force_plot(
    explainer.expected_value, 
    shap_values[0], 
    X_test.iloc[0]
)
```

**Output:**
```
Base value: 0.45 (average approval probability)
Credit Score (+0.20): Positive contribution
Income (+0.15): Positive contribution
Debt-to-Income (-0.10): Negative contribution
Age (+0.05): Small positive contribution

Final prediction: 0.75 (75% approval probability)
```

**Pros:**
- Theoretically grounded
- Consistent
- Additive (contributions sum to difference from base value)

**Cons:**
- Computationally expensive (exponential in number of features)
- Assumes feature independence (can be violated)

**CSOAI Requirements:**

| Risk Tier | Explanation Method |
|-----------|-------------------|
| Low | Optional |
| Medium | LIME or SHAP recommended |
| High | LIME or SHAP required |
| Critical | SHAP required (theoretically grounded) |

**Counterfactual Explanations:**

**"What if" Scenarios:**

**Definition:**
- Minimal change to input that would flip prediction
- "You were denied the loan. If your income were $5,000 higher, you would be approved."

**Example:**
```
Original: [Income=$50K, Credit=680, Debt-to-Income=0.4] → Denied
Counterfactual: [Income=$55K, Credit=680, Debt-to-Income=0.4] → Approved

Explanation: "Increase income by $5,000 to be approved"
```

**Generation:**
- Optimization: Find minimal perturbation that changes prediction
- Constraint: Keep changes realistic (e.g., can't change age by 20 years)

**Benefits:**
- Actionable (tells user what to change)
- Human-friendly (intuitive)

**Challenges:**
- Multiple counterfactuals possible (which to show?)
- May reveal sensitive model details (could enable gaming)

**Saliency Maps (for Images):**

**Gradient-Based:**
- Compute gradient of output w.r.t. input pixels
- Large gradient = Important pixel

**Variants:**
- Vanilla Gradient
- Grad-CAM (Gradient-weighted Class Activation Mapping)
- Integrated Gradients
- SmoothGrad

**Example:**
```python
import torch

image.requires_grad = True
output = model(image)
output.backward()

saliency = image.grad.abs()
# Visualize saliency map
```

**Output:** Heatmap showing important regions

**Limitations:**
- Can be noisy
- May highlight texture over shape
- Adversarially brittle

### 26.2.2 Global Explanations

**Understanding Overall Behavior:**

**Feature Importance:**

**Permutation Importance:**
1. Measure baseline model performance
2. Randomly shuffle one feature
3. Measure degraded performance
4. Importance = Performance drop
5. Repeat for all features

**Example:**
```
Credit Score shuffled: Accuracy drops 85% → 60% (importance: 25%)
Income shuffled: Accuracy drops 85% → 75% (importance: 10%)
Age shuffled: Accuracy drops 85% → 83% (importance: 2%)

Conclusion: Credit score most important, age least
```

**SHAP Global:**
- Average absolute SHAP values across dataset
- Overall feature importance

**Partial Dependence Plots (PDP):**

**Marginal Effect:**
- How does prediction change as one feature varies?
- Averaging over other features

**Example:**
```
Loan Approval vs. Credit Score (holding other features constant)

Credit Score | Approval Probability
-------------|---------------------
600          | 20%
650          | 40%
700          | 60%
750          | 80%
800          | 90%

Interpretation: Approximately linear relationship
```

**Individual Conditional Expectation (ICE):**
- Like PDP but for individual instances (no averaging)
- Shows heterogeneity

**Accumulated Local Effects (ALE):**
- More robust than PDP when features correlated
- Uses local differences instead of marginal averages

**Model-Agnostic Methods:**

**Surrogate Models:**
- Train interpretable model (e.g., decision tree) to approximate complex model
- Use simple model as explanation

**Example:**
```
Complex model: Deep neural network (opaque)
Surrogate: Decision tree with 5 splits (transparent)

Tree:
- If Credit Score < 650: Deny
- Else if Debt-to-Income > 0.5: Deny
- Else if Income < $40K: Review manually
- Else: Approve

Fidelity: 95% agreement with neural network
```

**Pros:**
- Easy to understand
- Global view

**Cons:**
- Fidelity may be imperfect
- Oversimplification

---

## 26.3 HUMAN-UNDERSTANDABLE EXPLANATIONS

### 26.3.1 Plain Language Requirement

**Not Just Technical:**

**Bad Explanation (Technical):**
```
SHAP value for feature X₃ is 0.37, indicating positive contribution to log-odds.
Gradient magnitude 0.42 at pixel (127, 89).
```

**Good Explanation (Plain Language):**
```
Your credit score (720) positively influenced this decision.
The scratch on the bumper in the image reduced confidence in "Excellent Condition" rating.
```

**Principles:**
- No jargon (or explain jargon)
- Active voice
- Concrete examples
- Relate to user's context

### 26.3.2 Audience-Appropriate

**Different Audiences, Different Explanations:**

**For End Users:**
```
"You were approved for a loan based primarily on your excellent credit score (780) and stable income ($75,000/year). Your debt-to-income ratio (25%) is well within acceptable limits."
```

**For Data Scientists:**
```
Prediction: 0.87 (approved)
Top features (SHAP values):
- credit_score: +0.32
- income: +0.18
- debt_to_income: -0.05
- employment_length: +0.08

Model: Gradient Boosted Trees (XGBoost)
Confidence interval: [0.81, 0.92] (95%)
```

**For Regulators/Auditors:**
```
Model Decision: Approve (87% confidence)

Compliance Check:
✓ Protected attributes (race, gender) not used in decision
✓ Decision explainable via SHAP values
✓ No disparate impact detected (demographic parity within 5%)
✓ Counterfactual explanations available

Audit Trail: Request ID #12345, Timestamp: 2026-01-11T15:30:00Z
```

**CSOAI Requirement:**
- Explanations tailored to audience
- Multiple levels of detail available
- Always include plain language version

### 26.3.3 Visual Explanations

**Show, Don't Just Tell:**

**For Images:**
- Saliency maps (heatmaps)
- Bounding boxes (object detection)
- Attention maps (transformers)

**For Structured Data:**
- Bar charts (feature importance)
- Waterfall plots (SHAP)
- Decision trees (surrogate models)

**For Text:**
- Highlighted words (attention weights)
- Sentence importance scores

**For Time Series:**
- Line plots with highlighted regions
- Shaded areas indicating contributions

**Example: Medical Image Diagnosis**
```
Original X-ray displayed
+ Heatmap overlay (regions model focused on)
+ Bounding box around concerning area
+ Text: "Opacity detected in lower right lobe suggestive of pneumonia (85% confidence)"
```

**Accessibility:**
- Alt text for blind users
- Color-blind friendly palettes
- High contrast for low vision

---

## 26.4 EXPLANATION FIDELITY

### 26.4.1 Faithful Explanations

**Truth, Not Post-Hoc Rationalization:**

**Problem:**
- Some explanation methods can be misleading
- May not reflect actual model reasoning
- Could show plausible but incorrect explanations

**Example of Unfaithful Explanation:**
```
Model: Uses pixel (100, 100) to classify image as "Cat"
Explanation (LIME): Highlights ear region (pixels 50-70, 80-90)

Problem: Explanation doesn't match model's actual reasoning
Cause: LIME is approximation, can be unfaithful
```

**Testing Fidelity:**

**Sanity Checks:**
1. **Randomization Test:**
   - Randomize model weights
   - Explanation should change dramatically (if faithful)
   - If explanation looks same, it's not explaining the model

2. **Model Parameter Test:**
   - Compare explanations from trained vs. random model
   - Should be very different

**Quantitative Fidelity:**
- Correlation between explanation and actual influence
- Measured via controlled experiments

**CSOAI Requirement:**
- High/Critical systems: Verify explanation fidelity
- Report fidelity metrics
- Acknowledge limitations of explanations

### 26.4.2 Adversarial Robustness of Explanations

**Gaming Explanations:**

**Attack:**
- Adversary creates model that appears to have good explanations
- But actually uses different features
- "Explanation laundering"

**Example:**
```
Model A (Honest):
- Uses credit score to predict loan approval
- Explanation: Shows credit score importance
- Faithful

Model B (Deceptive):
- Uses race to predict loan approval (illegal)
- Adds fake dependency on credit score
- Explanation: Shows credit score importance (false)
- Unfaithful, conceals discrimination
```

**Defense:**

**Explanation Consistency:**
- Check explanations across many examples
- Look for inconsistencies
- Example: If model claims credit score important, removing credit score should hurt performance

**Independent Auditing:**
- Third-party validates explanations
- Tests for hidden biases

**Formal Verification:**
- Prove mathematical relationship between model and explanation
- Limited to simple models

**CSOAI Requirement:**
- Critical systems: Independent explanation audit
- Verify explanation consistency
- Test for explanation gaming

---

## 26.5 RIGHT TO EXPLANATION (GDPR Article 22)

### 26.5.1 Legal Requirements

**GDPR Provisions:**

**Article 22:**
- Right not to be subject to solely automated decision-making with legal/significant effects
- Right to obtain human intervention
- Right to express point of view
- Right to contest decision
- **Right to obtain explanation of decision**

**When Required:**
- Automated decisions with legal effects (loan denial, job rejection)
- Automated decisions with significant effects (insurance pricing, credit scoring)

**What Constitutes Explanation:**
- Information about logic involved
- Significance and consequences
- Not necessarily detailed algorithm disclosure

**Example Compliant Explanation:**
```
Dear [Name],

Your loan application was processed using an automated decision system. 

Decision: Not Approved

Primary factors considered:
1. Credit score (580): Below our minimum threshold (620)
2. Debt-to-income ratio (55%): Above our maximum threshold (45%)
3. Recent delinquencies: 2 in past 12 months

You have the right to:
- Request human review of this decision
- Provide additional information for reconsideration
- Receive a detailed explanation of how the decision was made

To exercise these rights, please contact us at [contact info]

Sincerely,
[Lender]
```

### 26.5.2 Explanation Delivery

**How and When:**

**Timing:**
- Provided with decision (or shortly after)
- Available on request (within 30 days)

**Format:**
- Written (email, letter)
- Accessible (plain language, appropriate reading level)
- Documented (record of explanation provided)

**Content:**
- What decision was made
- What factors were considered
- How factors influenced decision
- How to appeal or request review

### 26.5.3 Appeals Process

**When Explanation Unsatisfactory:**

**User Rights:**
1. Request human review
2. Provide additional context
3. Challenge factual errors
4. Appeal decision

**Process:**
1. User requests explanation (free, first request)
2. Explanation provided (30 days)
3. If unsatisfied, request human review
4. Human reviews case (14 days)
5. Decision confirmed or overturned
6. Additional explanation provided

**CSOAI Requirement:**
- Explanation process documented
- Appeals handled timely
- Track appeal outcomes (quality control)

---

## 26.6 EXPLAINABILITY FOR DIFFERENT MODALITIES

### 26.6.1 Computer Vision

**Explaining Image Decisions:**

**Techniques:**
- Saliency maps (Grad-CAM, LIME)
- Attention visualization (Transformers)
- Concept activation vectors (TCAV)

**Example: Medical Diagnosis**
```
Input: Chest X-ray
Output: Pneumonia detected (92% confidence)
Explanation: 
- Heatmap highlights lower right lobe
- Text: "Opacity pattern consistent with bacterial pneumonia"
- Comparison: Shows similar positive cases
- Differential: "Less likely: Viral pneumonia (8%), Fungal (2%)"
```

**Challenges:**
- High-dimensional inputs
- Spatial reasoning
- Multiple objects

### 26.6.2 Natural Language Processing

**Explaining Text Decisions:**

**Techniques:**
- Attention weights visualization
- Word/token importance (integrated gradients)
- Rationale extraction (highlight supporting sentences)

**Example: Sentiment Analysis**
```
Input: "The movie was visually stunning but the plot was terrible."
Output: Negative sentiment (65% confidence)
Explanation:
- "visually stunning" → Positive (+0.3)
- "but" → Negation (-0.1)
- "plot was terrible" → Negative (-0.8)
Overall: Negative outweighs positive

Highlighted: "The movie was visually stunning but the [plot was terrible]."
```

**Challenges:**
- Context dependence
- Negation and sarcasm
- Long-range dependencies

### 26.6.3 Tabular Data

**Explaining Structured Data:**

**Techniques:**
- SHAP values (most common)
- Feature importance
- Decision trees (surrogate)
- Counterfactuals

**Example: Credit Scoring**
```
Features:
- Credit Score: 720
- Income: $65,000
- Debt-to-Income: 0.35
- Employment Length: 5 years
- Recent Delinquencies: 0

SHAP Analysis:
Base probability: 50% (population average)
Credit Score (+720): +25%
Income (+$65K): +10%
Debt-to-Income (+0.35): -5%
Employment Length (+5yr): +8%
Recent Delinquencies (0): +2%

Final: 90% approval probability

Most important: Credit score
```

**Benefits:**
- Features interpretable
- Relationships clear

### 26.6.4 Time Series

**Explaining Temporal Predictions:**

**Techniques:**
- Temporal attention
- Sliding window importance
- Shapelet extraction (characteristic subsequences)

**Example: Stock Price Prediction**
```
Input: 30-day price history
Output: Predicted 5% increase next week
Explanation:
- Days 1-10: Minimal influence (gray)
- Days 11-20: Moderate influence (yellow)
- Days 21-30: Strong influence (red)

Key patterns:
- Consecutive up days (days 25-30): +3%
- Volume spike (day 28): +1.5%
- Moving average crossover (day 26): +0.5%
```

**Challenges:**
- Temporal dependencies
- Lag effects
- Non-stationarity

---

## 26.7 CONCLUSION

Interpretability and explainability are not luxuries—they are necessities for trustworthy AI.

**Benefits:**
- **Trust:** Users trust systems they understand
- **Debugging:** Developers find and fix issues
- **Fairness:** Detect and mitigate biases
- **Compliance:** Meet legal requirements (GDPR)
- **Safety:** Understand failure modes before deployment

**CSOAI standards ensure:**
- Critical systems: Deep mechanistic understanding
- High-risk systems: Rigorous post-hoc explanations
- All systems: Human-understandable explanations
- Legal compliance: GDPR Article 22 rights respected
- Explanation fidelity: Truthful, not misleading

**The path forward:**
- Invest in interpretability research
- Develop domain-specific explanation methods
- Balance accuracy with interpretability
- Prioritize transparency

**An unexplainable decision is an unaccountable decision.**

**Explain thoroughly. Explain honestly. Explain always.**

**Effective Date:** January 15, 2026, 09:00 GMT  
**"Understanding Enables Trust, Transparency Enables Safety"**

---

## REFERENCES

Ribeiro, M., et al. (2016). *"Why Should I Trust You?" Explaining the Predictions of Any Classifier.* KDD.

Lundberg, S., & Lee, S. (2017). *A Unified Approach to Interpreting Model Predictions.* NeurIPS.

Molnar, C. (2022). *Interpretable Machine Learning.* Book.

Rudin, C. (2019). *Stop Explaining Black Box Machine Learning Models for High Stakes Decisions.* Nature Machine Intelligence.

GDPR. (2016). *Regulation (EU) 2016/679 - Article 22.*

Olah, C., et al. (2020). *Zoom In: An Introduction to Circuits.* Distill.

---

END OF ARTICLE 26

**Progress: 26 of 52 Articles (50%)**

**Continuing with Articles 27-28 to complete Phase 3...**
