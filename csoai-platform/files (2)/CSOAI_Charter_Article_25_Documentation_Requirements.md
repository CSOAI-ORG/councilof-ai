# CSOAI PARTNERSHIP CHARTER
## ARTICLE 25: DOCUMENTATION REQUIREMENTS

**Version:** 1.0  
**Effective Date:** January 15, 2026, 09:00 GMT  
**Status:** Technical Article - Documentation Standards

---

## PREAMBLE

This Article establishes comprehensive documentation requirements for AI systems. Undocumented systems are unmaintainable, unauditable, and unsafe. **If it's not documented, it doesn't exist.**

**Core Principle:** Clear documentation enables understanding, reproducibility, and accountability.

---

## 25.1 MODEL CARDS

### 25.1.1 Model Card Framework (Google/Mitchell et al.)

**Required for All Models:**

Model Cards provide standardized documentation for machine learning models. Analogous to nutrition labels for food—essential transparency.

**Originated:** Mitchell et al. (2019), Google Research

**Purpose:**
- Transparent communication of model capabilities and limitations
- Enable informed decisions about model use
- Facilitate accountability
- Support auditing and compliance

### 25.1.2 Model Card Contents

**Section 1: Model Details**

**Basic Information:**
- Model name and version
- Model date (when trained/released)
- Model type (architecture: Transformer, CNN, etc.)
- Paper or documentation link
- Citation information
- License (model weights, code)
- Contact information

**Example:**
```markdown
**Model Details**
- Name: ImageClassifier-v2.1
- Version: 2.1.0
- Date: January 10, 2026
- Type: ResNet-50 (Convolutional Neural Network)
- Paper: "ImageNet Classification with Deep Convolutional Neural Networks" (Krizhevsky et al., 2012)
- License: Apache 2.0
- Contact: ml-team@company.com
```

**Section 2: Intended Use**

**Primary Intended Uses:**
- What tasks is model designed for?
- What are appropriate applications?

**Primary Intended Users:**
- Who should use this model?
- What expertise required?

**Out-of-Scope Use Cases:**
- Explicitly list inappropriate uses
- Where model should NOT be used

**Example:**
```markdown
**Intended Use**

Primary Uses:
- Classification of consumer product images (electronics, furniture, clothing)
- E-commerce catalog organization
- Recommendation system feature extraction

Primary Users:
- E-commerce platforms
- Retail businesses
- Data scientists with ML experience

Out-of-Scope:
- Medical diagnosis (not trained on medical images)
- Security/surveillance applications
- Autonomous vehicle perception (safety-critical, different requirements)
- Legal evidence (model not validated for forensic use)
```

**Section 3: Factors**

**Relevant Factors:**
- What variables might affect model performance?
- Demographic factors (if applicable)
- Environmental factors
- Technical factors

**Evaluation Factors:**
- How was performance measured across these factors?

**Example:**
```markdown
**Factors**

Demographic:
- Model tested across various product categories (electronics: 30%, furniture: 25%, clothing: 20%, etc.)
- Geographic diversity in training data (US: 40%, EU: 30%, Asia: 20%, Other: 10%)

Environmental:
- Image quality (high-res professional photos vs. low-res user photos)
- Lighting conditions (studio vs. natural light)
- Background complexity (white background vs. cluttered)

Technical:
- Image resolution (tested from 224x224 to 4096x4096)
- File format (JPEG, PNG, WebP)
- Color space (RGB, grayscale)
```

**Section 4: Metrics**

**Model Performance Measures:**
- What metrics were used?
- Why these metrics chosen?
- Decision thresholds (if applicable)

**Confidence Intervals:**
- Uncertainty in metrics
- Statistical significance

**Example:**
```markdown
**Metrics**

Primary Metric: Top-1 Accuracy
- Overall: 94.2% (±0.3%)
- Top-5 Accuracy: 98.7% (±0.1%)

Per-Category Performance:
- Electronics: 96.1%
- Furniture: 93.5%
- Clothing: 92.8%

Inference Time:
- Single image (GPU): 15ms (p95)
- Batch 32 (GPU): 180ms total (5.6ms per image)

Metrics Chosen Because:
- Top-1 accuracy: Primary business metric (correct first prediction)
- Top-5 accuracy: User experience metric (correct answer in top 5 suggestions)
- Inference time: Product requirement (<50ms per image)
```

**Section 5: Evaluation Data**

**Datasets:**
- What data used for evaluation?
- How obtained?
- Size, composition

**Motivation:**
- Why this evaluation data chosen?
- How representative of deployment?

**Preprocessing:**
- How was data prepared?

**Example:**
```markdown
**Evaluation Data**

Dataset: ProductImages-Test-v2
- Size: 50,000 images
- Classes: 100 product categories
- Source: Held-out subset of labeled e-commerce catalog
- Split: Stratified by category, never seen during training
- Date range: January 2024 - December 2025

Motivation:
- Represents real-world product images
- Covers full category distribution
- Recent data (ensures relevance)

Preprocessing:
- Resized to 224x224 (maintaining aspect ratio, center crop)
- Normalized (ImageNet mean/std)
- No augmentation applied to test set
```

**Section 6: Training Data**

**Datasets Used:**
- Source of training data
- Size, composition
- Licensing
- Privacy considerations

**Known Issues:**
- Biases, gaps, limitations

**Example:**
```markdown
**Training Data**

Primary Dataset: ProductImages-Train-v2
- Size: 2 million images
- Classes: 100 product categories
- Source: Licensed e-commerce images (5 partner companies)
- License: Commercial use permitted, attribution required
- Date range: January 2020 - December 2024

Demographic Breakdown:
- North America: 1.2M images (60%)
- Europe: 400K (20%)
- Asia: 300K (15%)
- Other: 100K (5%)

Known Issues:
- Geographic imbalance (over-represents North American products)
- Limited representation of niche categories (<1000 images for 10 categories)
- Temporal bias (older products may have different photography styles)
- Brand imbalance (top 10 brands = 40% of data)
```

**Section 7: Quantitative Analyses**

**Performance Across Factors:**
- Disaggregated evaluation
- Identify disparities

**Intersectional Analysis:**
- Multiple factors combined

**Example:**
```markdown
**Quantitative Analyses**

Performance by Image Quality:
- High-resolution (>1024px): 96.5% accuracy
- Medium-resolution (512-1024px): 94.8%
- Low-resolution (<512px): 89.2%
- Conclusion: Degraded performance on low-res, acceptable given use case

Performance by Product Category (Top/Bottom 5):
Top 5:
1. Electronics: 96.1%
2. Books: 95.8%
3. Tools: 95.3%
4. Sports Equipment: 94.9%
5. Kitchen: 94.6%

Bottom 5:
96. Abstract Art: 87.2%
97. Vintage Collectibles: 85.9%
98. Handmade Crafts: 84.3%
99. Fashion Accessories: 82.1%
100. Jewelry: 79.8%

Analysis: Model struggles with categories having high visual diversity and subjective boundaries. Recommend human review for bottom 10 categories.

Confidence Calibration:
- Well-calibrated overall (expected calibration error: 0.03)
- Slightly overconfident on low-quality images
- Recommend confidence threshold tuning per category
```

**Section 8: Ethical Considerations**

**Potential Harms:**
- How could model cause harm?
- Mitigation strategies

**Use Cases to Monitor:**
- Sensitive applications requiring oversight

**Example:**
```markdown
**Ethical Considerations**

Data Privacy:
- Training data contains product images, not personal images
- No faces, personally identifiable information
- Low privacy risk

Bias and Fairness:
- Geographic bias in training data noted above
- Potential impact: Underperformance on non-Western products
- Mitigation: Expand training data to include more diverse product imagery
- Ongoing monitoring of performance across regions

Misuse Potential:
- Could be fine-tuned on prohibited items (weapons, drugs)
- Mitigation: Monitor API usage, terms of service prohibit illegal applications
- Reporting mechanism for misuse

Environmental Impact:
- Training CO2 footprint: 120 kg CO2e (renewable energy data center)
- Inference: 0.05g CO2e per image
- Mitigation: Model optimization to reduce compute requirements
```

**Section 9: Caveats and Recommendations**

**Known Limitations:**
- What doesn't work well?
- Edge cases

**Recommendations for Use:**
- Best practices
- Configuration suggestions

**Future Work:**
- Planned improvements

**Example:**
```markdown
**Caveats and Recommendations**

Limitations:
- Struggles with fine-grained distinctions (e.g., similar furniture styles)
- Sensitive to image quality (see quantitative analysis)
- Not robust to adversarial perturbations (not intended for security applications)
- Single-object assumption (performs poorly on multi-object scenes)

Recommendations:
- Use confidence threshold ≥0.85 for automated categorization
- Human review for confidence <0.85
- Retrain quarterly to maintain performance on new product trends
- Monitor performance degradation on specific categories
- Combine with metadata (product descriptions) for improved accuracy

Not Recommended:
- Real-time video classification (not optimized for this)
- Classification of images with multiple products (use object detection first)
- High-stakes decisions without human oversight

Future Work:
- Improve performance on underrepresented categories
- Multi-object scene understanding
- Adversarial robustness
- Model compression for edge deployment
```

### 25.1.3 Model Card Updates

**Living Documents:**

Model Cards must be updated when:
- Model retrained or fine-tuned
- New evaluation conducted
- Issue discovered (bias, failure mode)
- Intended use expanded or restricted
- Significant change in deployment context

**Versioning:**
- Model Card version matches model version
- Change log included
- Historical versions archived

**CSOAI Requirement:**
- Model Card published alongside model
- Publicly accessible (on Public Watchdog, Article 13)
- Updated within 30 days of model change

---

## 25.2 DATASHEETS FOR DATASETS

### 25.2.1 Datasheet Framework (Gebru et al.)

**Required for All Training Datasets:**

Datasheets document the characteristics, creation process, and appropriate uses of datasets. Inspired by electronics datasheets.

**Originated:** Gebru et al. (2018), Microsoft Research / Google

**Purpose:**
- Transparency about dataset composition
- Enable informed data selection
- Support reproducibility
- Facilitate accountability for dataset-related harms

### 25.2.2 Datasheet Contents

**Section 1: Motivation**

**Questions:**
- For what purpose was the dataset created?
- Who created the dataset?
- Who funded the creation?

**Example:**
```markdown
**Motivation**

Purpose:
- Train AI models for e-commerce product classification
- Support research on retail computer vision
- Enable development of recommendation systems

Creators:
- RetailAI Research Team, Company XYZ
- Principal Investigator: Dr. Jane Smith
- Contributors: 5 researchers, 10 data annotators

Funding:
- Company XYZ internal R&D budget
- Partial funding from National Science Foundation Grant #12345
- No conflicts of interest
```

**Section 2: Composition**

**Questions:**
- What do the instances represent?
- How many instances?
- Is there a label or target?
- Missing information?
- Confidential data?

**Example:**
```markdown
**Composition**

Instances:
- Each instance: One product image with category label
- Total: 2,000,000 images
- Categories: 100 (electronics, furniture, clothing, etc.)
- Format: JPEG images (224x224 to 4096x4096 pixels)

Labels:
- Human-annotated category labels
- Quality control: 3 annotators per image, majority vote
- Inter-annotator agreement: Cohen's kappa = 0.89

Distribution:
- Balanced across top 50 categories (15K-25K images each)
- Long tail: Bottom 50 categories (100-2K images each)
- Complete category distribution in Appendix A

Missing Information:
- Product metadata (price, brand) available for 80% of images
- Geographic origin unknown for 15% of images
- Date unknown for 5% of images (older curated datasets)

Confidential Data:
- No personally identifiable information
- All images licensed for commercial use
- Product images only (no people, private settings)
```

**Section 3: Collection Process**

**Questions:**
- How was data acquired?
- Who was involved?
- Time frame?
- Ethical review?

**Example:**
```markdown
**Collection Process**

Acquisition:
- Method 1: Licensed from e-commerce platforms (60%)
  - 5 partner companies provided product catalogs
  - Licensing agreements: Commercial use, attribution required
  
- Method 2: Web scraping (30%)
  - Public product pages, robots.txt compliant
  - Copyright review: Only images with permissive licenses
  
- Method 3: Commissioned photography (10%)
  - Professional photographers hired
  - Full rights transfer

Time Frame:
- Collection period: January 2020 - December 2024 (5 years)
- Most recent data: December 2024
- Ongoing updates: Quarterly

Annotators:
- 10 professional data annotators
- Training: 40 hours on category guidelines
- Compensation: Living wage ($25/hour, benefits)
- Diversity: 6 female, 4 male; ages 22-54; 5 countries

Ethical Review:
- IRB exempt (no human subjects, public data)
- Internal ethics review conducted
- Data privacy assessment: No PII confirmed
```

**Section 4: Preprocessing/Cleaning/Labeling**

**Questions:**
- Was raw data saved?
- What preprocessing applied?
- Was labeling outsourced?

**Example:**
```markdown
**Preprocessing**

Raw Data:
- Original images archived (S3 bucket, 7-year retention)
- Preprocessing scripts version-controlled (GitHub)
- Reversible transformations only

Preprocessing Steps:
1. Duplicate detection (perceptual hashing)
   - 15,000 duplicates removed
2. Quality filtering
   - Blurry images: 8,000 removed (detected via Laplacian variance)
   - Corrupted files: 200 removed
3. Resize and standardization
   - Resized to 224x224 (center crop)
   - Normalized (ImageNet statistics)
4. Augmentation (for training only)
   - Random horizontal flip
   - Random rotation (±15°)
   - Color jitter

Labeling:
- Outsourced to data labeling company (Vendor ABC)
- Annotator training: Category guidelines (50-page manual)
- Quality control: 3 annotators per image, majority vote
- Difficult cases: Expert review (senior annotator)
- Label confidence: Provided for each image
- Relabeling: 5% of data relabeled annually for quality maintenance
```

**Section 5: Uses**

**Questions:**
- For what tasks has the dataset been used?
- What tasks should it NOT be used for?
- Impact on society?

**Example:**
```markdown
**Uses**

Current Uses:
- Product image classification (primary)
- Visual search (image-to-product matching)
- Recommendation systems (feature extraction)
- Research on few-shot learning (academic publications)

Supported Tasks:
- Image classification (single-label)
- Transfer learning (pre-training for related tasks)
- Benchmark comparison (standardized evaluation)

Inappropriate Uses:
- Medical diagnosis (wrong domain)
- Surveillance or biometric identification (not designed for people)
- Deepfake generation (ethical concerns)
- Any application involving human subjects

Impact on Society:
- Positive: Enables better e-commerce experiences, supports small businesses
- Risks: Could disadvantage products not well-represented in data
- Mitigation: Ongoing data collection to improve coverage
```

**Section 6: Distribution**

**Questions:**
- How distributed?
- Licensing?
- Restrictions?

**Example:**
```markdown
**Distribution**

Availability:
- Public dataset: Subset (100K images) available for research
  - Download: https://datasets.company.com/productimages-public
  - License: CC BY-NC 4.0 (attribution, non-commercial)
  
- Full dataset: Available to commercial partners
  - Licensing agreement required
  - Pricing: Tiered (academic free, startup $10K, enterprise $100K/year)

Restrictions:
- No redistribution of full dataset
- Attribution required in publications
- Prohibited uses: As defined in Section 5
- Terms of service: https://datasets.company.com/tos

Intellectual Property:
- Images: Vary (licensed from multiple sources)
- Annotations: Copyright Company XYZ, licensed as above
- Compilation: Copyright Company XYZ
```

**Section 7: Maintenance**

**Questions:**
- Who maintains dataset?
- Update frequency?
- Versioning?
- Errata reporting?

**Example:**
```markdown
**Maintenance**

Owner:
- Company XYZ, RetailAI Research Team
- Contact: datasets@company.com
- Dataset curator: Dr. Jane Smith

Updates:
- Frequency: Quarterly
- Process: New images added, labels refined, errors corrected
- Notification: Subscribers notified via mailing list

Versioning:
- Semantic versioning: MAJOR.MINOR.PATCH
  - MAJOR: Incompatible changes (category redefinition)
  - MINOR: Additions (new images, new categories)
  - PATCH: Fixes (label corrections)
- Current version: 2.1.3
- All versions archived and accessible

Errata:
- Report issues: GitHub Issues (https://github.com/company/productimages/issues)
- Response time: 1 week for acknowledgment
- Public errata log maintained
- Critical issues: Addressed in emergency patch releases

Sunset Plan:
- No planned end-of-life
- If discontinued: 1-year notice, final archive provided
```

### 25.2.3 Datasheet Updates and Versioning

**Dataset Evolution:**

Datasets change over time:
- New data added
- Errors corrected
- Labels refined
- Usage discovered

**Update Requirements:**
- Datasheet updated with dataset
- Changelog documenting all changes
- Version number incremented appropriately

**CSOAI Requirement:**
- Datasheet published alongside dataset
- Updated within 30 days of dataset change
- Version history maintained

---

## 25.3 SYSTEM CARDS

### 25.3.1 System-Level Documentation

**Beyond Models and Data:**

System Cards document the complete AI system:
- Multiple models
- Data pipelines
- Business logic
- User interfaces
- Integration points

**Required for Deployed Systems:**

### 25.3.2 System Card Contents

**Section 1: System Overview**

- System name and version
- Purpose and capabilities
- Architecture diagram
- Components (models, databases, APIs, etc.)

**Example:**
```markdown
**System Overview**

Name: ShopAssist AI v3.2
Purpose: Intelligent shopping assistant for e-commerce
Capabilities:
- Product recommendations
- Visual search (upload image, find similar products)
- Natural language queries ("show me blue dresses under $50")
- Virtual try-on (AR feature)

Architecture:
[Diagram showing: User → Mobile App → API Gateway → 
 - Recommendation Service (Model A)
 - Visual Search Service (Model B)  
 - NLP Service (Model C)
 - AR Service (Model D)
 → Database → Product Catalog]

Components:
- Model A: Collaborative filtering recommendation (TensorFlow)
- Model B: Image similarity (ResNet-50, PyTorch)
- Model C: Query understanding (BERT, Transformers)
- Model D: 3D body mesh estimation (custom architecture)
- Database: PostgreSQL (product catalog), Redis (cache)
- Infrastructure: AWS (EKS, S3, RDS)
```

**Section 2: Use Cases**

- Primary use cases
- User workflows
- Success metrics

**Section 3: Known Limitations**

- What doesn't work well
- Edge cases
- Failure modes

**Example:**
```markdown
**Known Limitations**

Visual Search:
- Struggles with heavily occluded products (e.g., packaged items)
- Sensitive to image quality (blurry photos → poor results)
- Limited to product categories in training data

NLP:
- Ambiguous queries (e.g., "red" - color or brand Red?)
- Slang and colloquialisms (limited training data)
- Multi-lingual: English only currently

AR Try-On:
- Requires good lighting and clear camera
- Body shape estimation less accurate for plus sizes (training data bias)
- Clothing fit approximate (not perfect)

General:
- Requires internet connection (no offline mode)
- Performance degrades under high load (>10K concurrent users)
```

**Section 4: Performance Characteristics**

- Latency (p50, p95, p99)
- Throughput (requests per second)
- Accuracy metrics
- Uptime SLA

**Section 5: Safety Considerations**

- Content moderation (inappropriate products filtered?)
- User privacy (what data collected?)
- Security measures
- Failure handling

**Section 6: Monitoring and Maintenance**

- What metrics tracked
- Alert thresholds
- Update frequency
- Rollback procedures

### 25.3.3 System Card Updates

**Deployment Changes:**

Update System Card when:
- New feature deployed
- Model updated
- Infrastructure change
- Integration added/removed
- Performance characteristics change significantly

**CSOAI Requirement:**
- System Card published on Public Watchdog
- Updated within 14 days of system change
- Accessible to users and auditors

---

## 25.4 CHANGE LOGS

### 25.4.1 Version Control Documentation

**Track All Changes:**

Change logs document:
- What changed
- Why changed
- When changed
- Who changed
- Impact

**Semantic Versioning (SemVer):**

**Format:** MAJOR.MINOR.PATCH

- **MAJOR:** Incompatible changes (breaking API, model architecture change)
- **MINOR:** New features (backward-compatible additions)
- **PATCH:** Bug fixes (backward-compatible fixes)

**Example:** v2.3.1
- Major version 2 (current generation)
- Minor version 3 (three feature additions since v2.0.0)
- Patch version 1 (one bug fix since v2.3.0)

### 25.4.2 Change Log Format

**Example:**
```markdown
# Change Log - ImageClassifier

## [2.3.1] - 2026-01-10

### Fixed
- Fixed memory leak in preprocessing pipeline (Issue #127)
- Corrected confidence calibration for low-resolution images

### Security
- Patched vulnerability in image upload endpoint (CVE-2026-1234)

### Performance
- 15% inference speedup through kernel optimization

---

## [2.3.0] - 2025-12-15

### Added
- Support for 10 new product categories (total 110)
- Multi-language product descriptions (English, Spanish, French)

### Changed
- Updated ResNet backbone to EfficientNet (improved accuracy: 94.2% → 95.1%)
- Increased input resolution (224x224 → 299x299)

### Deprecated
- Legacy API v1 (will be removed in v3.0.0, 6-month notice)

---

## [2.2.0] - 2025-10-01

### Added
- Confidence calibration for better uncertainty estimates
- Batch inference API (process multiple images)

### Fixed
- Edge case: Model crash on corrupted JPEG files (now handles gracefully)

---

## [2.1.0] - 2025-08-01

### Added
- 20 new product categories
- Fine-tuning capability via API

### Changed
- Retrained on updated dataset (v2.1 with 500K new images)
- Improved performance on clothing category (+3% accuracy)

### Removed
- Deprecated endpoint /v0/classify (users must migrate to /v1/classify)

---

[Full history: https://github.com/company/imageclassifier/CHANGELOG.md]
```

### 25.4.3 Breaking Changes Communication

**Major Version Bumps:**

When introducing breaking changes:
- **Advance notice:** Minimum 3 months (6 months for High/Critical systems)
- **Migration guide:** Step-by-step instructions
- **Deprecation warnings:** In API responses, documentation
- **Support for old version:** Maintain during transition period
- **Clear deadline:** When old version will be shut down

**Example Migration Guide:**
```markdown
# Migration Guide: v2.x → v3.0

## Breaking Changes

1. **API Endpoint Change**
   - Old: POST /v1/classify
   - New: POST /v3/classify
   - **Action Required:** Update API endpoint in your code

2. **Response Format Change**
   - Old: `{"category": "electronics", "confidence": 0.95}`
   - New: `{"prediction": {"label": "electronics", "score": 0.95}, "latency_ms": 15}`
   - **Action Required:** Update JSON parsing to use new keys

3. **Input Format Change**
   - Old: Accepts images up to 10MB
   - New: Max 5MB (optimization for speed)
   - **Action Required:** Compress large images before upload

## Timeline

- Now: v3.0 available, v2.x still supported
- March 1, 2026: v2.x deprecated (warning messages)
- June 1, 2026: v2.x shutdown

## Support

- Questions: api-migration@company.com
- Slack channel: #api-v3-migration
```

---

## 25.5 API DOCUMENTATION

### 25.5.1 OpenAPI Specification

**Machine-Readable API Docs:**

**OpenAPI (formerly Swagger):**
- Industry standard for REST APIs
- YAML or JSON format
- Auto-generate documentation, client SDKs, mock servers

**Required Elements:**

**1. API Info:**
```yaml
openapi: 3.0.0
info:
  title: ImageClassifier API
  version: 2.3.1
  description: Product image classification API
  contact:
    email: api-support@company.com
  license:
    name: Commercial License
    url: https://company.com/api-license
```

**2. Servers:**
```yaml
servers:
  - url: https://api.company.com/v2
    description: Production
  - url: https://api-staging.company.com/v2
    description: Staging
```

**3. Paths and Operations:**
```yaml
paths:
  /classify:
    post:
      summary: Classify product image
      description: Upload an image and receive category prediction
      requestBody:
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              properties:
                image:
                  type: string
                  format: binary
      responses:
        '200':
          description: Successful classification
          content:
            application/json:
              schema:
                type: object
                properties:
                  category:
                    type: string
                    example: electronics
                  confidence:
                    type: number
                    format: float
                    example: 0.95
        '400':
          description: Invalid input
        '500':
          description: Server error
```

**4. Authentication:**
```yaml
components:
  securitySchemes:
    ApiKeyAuth:
      type: apiKey
      in: header
      name: X-API-Key
security:
  - ApiKeyAuth: []
```

**5. Rate Limits:**
```yaml
x-rateLimit:
  limit: 1000
  period: hour
```

### 25.5.2 Interactive Documentation

**Swagger UI / ReDoc:**
- Auto-generated from OpenAPI spec
- Interactive ("Try it out" feature)
- Examples and descriptions
- Hosted at https://api.company.com/docs

**Code Examples:**
- Provide examples in multiple languages
- Python, JavaScript, Java, cURL, etc.

**Example:**
```python
# Python Example
import requests

url = "https://api.company.com/v2/classify"
headers = {"X-API-Key": "your_api_key"}
files = {"image": open("product.jpg", "rb")}

response = requests.post(url, headers=headers, files=files)
data = response.json()

print(f"Category: {data['category']}")
print(f"Confidence: {data['confidence']:.2%}")
```

### 25.5.3 Error Codes and Messages

**Comprehensive Error Documentation:**

| Code | Meaning | Example | User Action |
|------|---------|---------|-------------|
| 400 | Bad Request | Invalid image format | Check file type (JPEG, PNG only) |
| 401 | Unauthorized | Missing/invalid API key | Verify API key |
| 413 | Payload Too Large | Image >5MB | Compress image |
| 429 | Too Many Requests | Rate limit exceeded | Wait and retry |
| 500 | Internal Server Error | Server crashed | Retry, contact support if persists |
| 503 | Service Unavailable | Maintenance | Check status page |

**Error Response Format:**
```json
{
  "error": {
    "code": "INVALID_IMAGE_FORMAT",
    "message": "Unsupported image format. Please upload JPEG or PNG.",
    "details": "Received image/webp, expected image/jpeg or image/png",
    "request_id": "req_abc123",
    "documentation_url": "https://api.company.com/docs/errors#INVALID_IMAGE_FORMAT"
  }
}
```

---

## 25.6 CODE DOCUMENTATION

### 25.6.1 Inline Comments

**Comment Wisely:**

**Good Comments:**
- Explain WHY, not WHAT
- Document non-obvious decisions
- Warn about gotchas

**Example:**
```python
# Good: Explains WHY
# We use L2 regularization instead of L1 because 
# we want to shrink all weights proportionally,
# not force some to zero. Sparse features are not
# beneficial in this domain.
regularization = 'l2'

# Bad: States the obvious
# Set regularization to L2
regularization = 'l2'
```

**Avoid Over-Commenting:**
- Self-explanatory code doesn't need comments
- Code should be readable without comments when possible

### 25.6.2 Docstrings

**Function/Class Documentation:**

**Python (Google Style):**
```python
def train_model(data, learning_rate=0.001, epochs=100):
    """
    Train image classification model.
    
    Args:
        data (Dataset): Training dataset containing images and labels
        learning_rate (float, optional): Optimizer learning rate. 
            Defaults to 0.001. Typical range: 1e-5 to 1e-2.
        epochs (int, optional): Number of training epochs. 
            Defaults to 100. Early stopping may terminate sooner.
    
    Returns:
        Model: Trained model object with .predict() method
    
    Raises:
        ValueError: If data is empty or learning_rate is negative
        RuntimeError: If training fails to converge after max epochs
    
    Example:
        >>> from datasets import load_dataset
        >>> data = load_dataset('imagefolder', data_dir='./train')
        >>> model = train_model(data, learning_rate=0.0001, epochs=50)
        >>> model.save('model.pth')
    
    Note:
        - Requires GPU for reasonable performance (CPU training very slow)
        - Training progress logged to TensorBoard (see ./runs directory)
        - Checkpoints saved every 10 epochs to ./checkpoints
    """
    # Implementation...
```

**All Public Functions Must Have Docstrings:**
- Parameters
- Return values
- Exceptions
- Examples
- Notes/warnings

### 25.6.3 Architecture Documentation

**High-Level Design Docs:**

**Contents:**
- System architecture diagram
- Component descriptions
- Data flow
- Design decisions (ADRs - Architecture Decision Records)
- Trade-offs

**Example ADR:**
```markdown
# ADR-003: Use ResNet-50 for Image Classification

## Status
Accepted

## Context
Need to select model architecture for product image classification.
Options: VGG, ResNet, EfficientNet, Vision Transformer.

## Decision
Use ResNet-50.

## Rationale
- Proven architecture (widely used in industry)
- Good balance of accuracy vs. speed
- Pre-trained weights available (ImageNet)
- Efficient (skip connections reduce vanishing gradients)

Comparison:
- VGG: Slower, more parameters, lower accuracy (rejected)
- EfficientNet: Slightly higher accuracy but 2x inference time (overkill for use case)
- ViT: Requires very large datasets, more complex (unnecessary)

## Consequences
Positive:
- Fast inference (~15ms per image on GPU)
- Good accuracy (94%+ on our data)
- Easy to deploy and maintain

Negative:
- Not state-of-the-art (EfficientNet would be 1-2% better)
- 25M parameters (could be smaller with MobileNet, but acceptable trade-off)

## Alternatives Considered
See rationale above.

## Date
2025-06-15
```

---

## 25.7 CONCLUSION

Documentation is not an afterthought. Documentation is integral to responsible AI development.

**Good documentation:**
- Enables transparency
- Supports reproducibility
- Facilitates auditing
- Reduces errors (through clear communication)
- Empowers users (to make informed decisions)

**CSOAI documentation standards ensure:**
- Model Cards: Every model documented
- Datasheets: Every dataset documented
- System Cards: Every deployed system documented
- Change Logs: Every change tracked
- API Docs: Every interface specified
- Code Docs: Every decision explained

**Undocumented AI is unaccountable AI.**

**Document thoroughly. Document honestly. Document continuously.**

**Effective Date:** January 15, 2026, 09:00 GMT  
**"If It's Not Documented, It Doesn't Exist"**

---

## REFERENCES

Mitchell, M., et al. (2019). *Model Cards for Model Reporting.* FAT*.

Gebru, T., et al. (2018). *Datasheets for Datasets.* arXiv.

OpenAPI Initiative. (2024). *OpenAPI Specification v3.1.*

Google. (2020). *Google Python Style Guide.*

---

END OF ARTICLE 25

**Progress: 25 of 52 Articles (48%)**

**Continuing with Articles 26-28 to complete Phase 3...**
