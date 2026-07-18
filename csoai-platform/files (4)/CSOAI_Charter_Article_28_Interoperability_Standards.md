# CSOAI PARTNERSHIP CHARTER
## ARTICLE 28: INTEROPERABILITY STANDARDS

**Version:** 1.0  
**Effective Date:** January 15, 2026, 09:00 GMT  
**Status:** Technical Article - Integration Standards

**Framework Integration:** ISO/IEC 42001 AI Management System, CEN-CENELEC Harmonized Standards, NIST AI RMF GOVERN Function

---

## PREAMBLE

This Article establishes comprehensive interoperability standards for AI systems. AI systems do not exist in isolation—they integrate with other systems, share data, and must comply with diverse regulatory frameworks. **Interoperability enables ecosystem, compliance, and safety.**

**Core Principle:** Open standards, seamless integration, regulatory harmony.

---

## 28.1 API STANDARDS

### 28.1.1 REST API Requirements

**Representational State Transfer:**

**Mandatory for All AI Systems with External Interfaces:**

**Design Principles:**
- **Stateless:** Each request contains all necessary information
- **Uniform Interface:** Consistent resource-based URLs
- **Client-Server:** Separation of concerns
- **Cacheable:** Responses indicate cacheability
- **Layered System:** Intermediate servers (proxies, gateways) transparent

**URL Structure:**
```
https://api.company.com/v{version}/{resource}/{id}/{action}

Examples:
GET  /v1/models                     # List models
GET  /v1/models/{id}                # Get specific model
POST /v1/models/{id}/predict        # Make prediction
GET  /v1/models/{id}/metrics        # Get performance metrics
POST /v1/compliance/verify          # Verify compliance
```

**HTTP Methods:**

| Method | Purpose | Idempotent | Safe |
|--------|---------|------------|------|
| GET | Retrieve resource | Yes | Yes |
| POST | Create resource / Action | No | No |
| PUT | Replace resource | Yes | No |
| PATCH | Partial update | No | No |
| DELETE | Remove resource | Yes | No |

**Status Codes:**

| Code | Meaning | Use Case |
|------|---------|----------|
| 200 | OK | Successful GET, PUT, PATCH |
| 201 | Created | Successful POST (resource created) |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Invalid input |
| 401 | Unauthorized | Missing/invalid authentication |
| 403 | Forbidden | Authenticated but not authorized |
| 404 | Not Found | Resource doesn't exist |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side failure |
| 503 | Service Unavailable | Maintenance, overload |

**Response Format (JSON):**
```json
{
  "data": {
    "id": "model_123",
    "type": "prediction",
    "attributes": {
      "label": "cat",
      "confidence": 0.95,
      "timestamp": "2026-01-15T10:30:00Z"
    }
  },
  "meta": {
    "request_id": "req_abc123",
    "processing_time_ms": 45
  }
}
```

**Error Response:**
```json
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "Image format not supported",
    "details": "Expected JPEG or PNG, received GIF",
    "request_id": "req_abc123",
    "documentation": "https://api.company.com/docs/errors#INVALID_INPUT"
  }
}
```

### 28.1.2 OpenAPI Specification

**Machine-Readable API Documentation:**

**Required for All Public APIs:**

**OpenAPI 3.1 Compliance:**
```yaml
openapi: 3.1.0
info:
  title: AI Model API
  version: 1.0.0
  description: API for AI model inference and management
  contact:
    email: api@company.com
  license:
    name: Commercial
    
servers:
  - url: https://api.company.com/v1
    description: Production
  - url: https://api-staging.company.com/v1
    description: Staging

paths:
  /predict:
    post:
      summary: Make a prediction
      operationId: predict
      tags:
        - Inference
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/PredictRequest'
      responses:
        '200':
          description: Successful prediction
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PredictResponse'
        '400':
          $ref: '#/components/responses/BadRequest'
        '401':
          $ref: '#/components/responses/Unauthorized'
          
components:
  schemas:
    PredictRequest:
      type: object
      required:
        - input
      properties:
        input:
          type: string
          description: Input data (base64 encoded for binary)
        options:
          type: object
          properties:
            return_confidence:
              type: boolean
              default: true
            
    PredictResponse:
      type: object
      properties:
        prediction:
          type: string
        confidence:
          type: number
          format: float
        latency_ms:
          type: integer
          
  securitySchemes:
    ApiKeyAuth:
      type: apiKey
      in: header
      name: X-API-Key
      
security:
  - ApiKeyAuth: []
```

**Auto-Generated Documentation:**
- Swagger UI at /docs
- ReDoc at /redoc
- OpenAPI JSON at /openapi.json

### 28.1.3 gRPC for High-Performance

**When REST Not Sufficient:**

**Use Cases:**
- Low-latency requirements (<10ms)
- High throughput (>10,000 req/sec)
- Streaming data
- Internal microservices

**Protocol Buffers Definition:**
```protobuf
syntax = "proto3";

package ai.inference.v1;

service InferenceService {
  rpc Predict(PredictRequest) returns (PredictResponse);
  rpc StreamPredict(stream PredictRequest) returns (stream PredictResponse);
  rpc BatchPredict(BatchPredictRequest) returns (BatchPredictResponse);
}

message PredictRequest {
  bytes input = 1;
  map<string, string> options = 2;
}

message PredictResponse {
  string prediction = 1;
  float confidence = 2;
  int32 latency_ms = 3;
}

message BatchPredictRequest {
  repeated PredictRequest requests = 1;
}

message BatchPredictResponse {
  repeated PredictResponse responses = 1;
}
```

**Benefits:**
- Binary serialization (smaller, faster)
- Bi-directional streaming
- Strong typing
- Code generation for multiple languages

### 28.1.4 Rate Limiting

**Protect APIs from Abuse:**

**Standard Headers:**
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 950
X-RateLimit-Reset: 1705312800
Retry-After: 60
```

**Rate Limit Tiers:**

| Tier | Requests/Minute | Requests/Day |
|------|-----------------|--------------|
| Free | 10 | 1,000 |
| Basic | 100 | 10,000 |
| Pro | 1,000 | 100,000 |
| Enterprise | 10,000 | Unlimited |

**Response When Limited:**
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again in 60 seconds.",
    "retry_after": 60
  }
}
```

---

## 28.2 DATA FORMAT STANDARDS

### 28.2.1 Structured Data Formats

**JSON (JavaScript Object Notation):**
- **Primary format for APIs**
- Human-readable
- Wide language support
- Schema validation via JSON Schema

**Example:**
```json
{
  "model_id": "model_123",
  "predictions": [
    {"label": "cat", "confidence": 0.95},
    {"label": "dog", "confidence": 0.04}
  ],
  "metadata": {
    "inference_time_ms": 45,
    "model_version": "2.3.1"
  }
}
```

**XML (eXtensible Markup Language):**
- Use when required by domain (healthcare, finance)
- Schema validation via XSD
- Heavier than JSON

**CSV (Comma-Separated Values):**
- Tabular data
- Widely compatible
- Lacks hierarchy, types

**Parquet:**
- Columnar format
- Efficient for large datasets
- Used in data pipelines

### 28.2.2 Model Serialization Formats

**ONNX (Open Neural Network Exchange):**

**Purpose:**
- Interoperability between ML frameworks
- Export from PyTorch, TensorFlow, etc.
- Import to optimized runtimes (ONNX Runtime, TensorRT)

**Example Conversion:**
```python
import torch
import torch.onnx

model = MyModel()
model.load_state_dict(torch.load("model.pth"))
model.eval()

dummy_input = torch.randn(1, 3, 224, 224)
torch.onnx.export(
    model, 
    dummy_input, 
    "model.onnx",
    input_names=["input"],
    output_names=["output"],
    dynamic_axes={"input": {0: "batch_size"}}
)
```

**CSOAI Requirement:**
- High/Critical systems must support ONNX export
- Enables portability, auditing

**SavedModel (TensorFlow):**
- Native TensorFlow format
- Includes model architecture, weights, computation graph
- Used for TensorFlow Serving

**TorchScript (PyTorch):**
- Serialized PyTorch models
- JIT compilation
- Deployment without Python

**PMML (Predictive Model Markup Language):**
- XML-based
- Traditional ML models (decision trees, regression)
- Less common for deep learning

### 28.2.3 Embedding Standards

**Vector Representations:**

**Standard Dimensions:**
- Text embeddings: 768 (BERT), 1536 (OpenAI), 4096 (larger models)
- Image embeddings: 512, 2048 (typical)

**Storage Formats:**
- NumPy arrays (.npy)
- HDF5 (large datasets)
- Parquet (with array columns)
- Vector databases (Pinecone, Weaviate, Milvus)

**API for Embeddings:**
```json
POST /v1/embeddings
{
  "input": "Hello, world!",
  "model": "text-embedding-v1"
}

Response:
{
  "embedding": [0.1, -0.2, 0.3, ...],  // 768 dimensions
  "usage": {"tokens": 3}
}
```

---

## 28.3 MODEL INTERCHANGE

### 28.3.1 ONNX Ecosystem

**Framework Compatibility:**

| Framework | Export to ONNX | Import from ONNX |
|-----------|---------------|------------------|
| PyTorch | ✅ Native | ✅ Via onnx2torch |
| TensorFlow | ✅ Via tf2onnx | ✅ Via onnx-tf |
| Keras | ✅ Via tf2onnx | ✅ Via onnx-tf |
| scikit-learn | ✅ Via sklearn-onnx | ❌ |
| XGBoost | ✅ Via onnxmltools | ❌ |
| LightGBM | ✅ Via onnxmltools | ❌ |

**Operator Set (Opset):**
- Version number defining available operations
- Higher opset = More operations
- Current stable: Opset 18
- CSOAI recommends: Opset 15+ for compatibility

**Limitations:**
- Not all operations supported
- Custom ops require extensions
- Performance may vary between runtimes

### 28.3.2 Model Hub Integration

**Hugging Face Hub:**
```python
from transformers import AutoModel, AutoTokenizer

# Load from Hub
model = AutoModel.from_pretrained("company/model-name")
tokenizer = AutoTokenizer.from_pretrained("company/model-name")

# Push to Hub
model.push_to_hub("company/model-name")
```

**Benefits:**
- Version control for models
- Automatic Model Card hosting
- Community discovery

**CSOAI Integration:**
- Models can link to CSOAI license
- Model Card references CSOAI compliance status

### 28.3.3 Containerization

**Docker for Reproducibility:**

**Standard Dockerfile:**
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy model and code
COPY model/ ./model/
COPY src/ ./src/

# Environment variables
ENV MODEL_PATH=/app/model
ENV PORT=8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s \
  CMD curl -f http://localhost:8080/health || exit 1

# Run
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8080"]
```

**Container Registry:**
- Docker Hub, AWS ECR, Google GCR, Azure ACR
- Signed images (Docker Content Trust)
- Vulnerability scanning

---

## 28.4 REGULATORY DATA EXCHANGE

### 28.4.1 CSOAI Standard Formats

**License Application Format:**
```json
{
  "application": {
    "version": "1.0",
    "type": "license_application",
    "applicant": {
      "legal_name": "Company Ltd",
      "registration_number": "12345678",
      "jurisdiction": "GB",
      "contact": {
        "name": "John Smith",
        "email": "john@company.com",
        "phone": "+44..."
      }
    },
    "system": {
      "name": "ProductClassifier",
      "version": "2.3.1",
      "description": "Image classification for e-commerce",
      "risk_tier": "Medium",
      "use_cases": ["E-commerce", "Retail"],
      "deployment_regions": ["EU", "UK", "US"]
    },
    "safety_case": {
      "formal_verification": {
        "method": "SMT-based",
        "coverage": "85%",
        "properties_verified": [...]
      },
      "testing_results": {
        "accuracy": 0.942,
        "adversarial_robustness": 0.95,
        "fairness_metrics": {...}
      },
      "documentation": {
        "model_card_url": "https://...",
        "datasheet_url": "https://...",
        "system_card_url": "https://..."
      }
    },
    "compliance": {
      "eu_ai_act": {
        "risk_classification": "High-risk (Annex III)",
        "requirements_addressed": ["Art. 9", "Art. 10", ...]
      },
      "gdpr": {
        "dpia_completed": true,
        "dpo_contact": "dpo@company.com"
      }
    },
    "timestamp": "2026-01-15T10:00:00Z",
    "signature": "..."
  }
}
```

**Compliance Verification Format:**
```json
{
  "verification": {
    "license_id": "CSOAI-2026-00001",
    "system_id": "sys_abc123",
    "verification_type": "quarterly_audit",
    "timestamp": "2026-04-15T14:00:00Z",
    "results": {
      "overall_status": "COMPLIANT",
      "requirements": [
        {
          "id": "Article2.1",
          "name": "Provable Safety",
          "status": "COMPLIANT",
          "evidence": "Formal verification report v2.3",
          "notes": null
        },
        {
          "id": "Article5.3",
          "name": "Constitutional AI",
          "status": "COMPLIANT",
          "evidence": "Constitutional AI test suite passed",
          "notes": null
        }
      ],
      "non_conformities": [],
      "recommendations": [
        "Consider upgrading to latest adversarial testing framework"
      ]
    },
    "auditor": {
      "name": "CSOAI Audit Team",
      "auditor_id": "AUD-001"
    }
  }
}
```

**Incident Report Format:**
```json
{
  "incident": {
    "id": "INC-2026-00042",
    "license_id": "CSOAI-2026-00001",
    "system_id": "sys_abc123",
    "severity": "Medium",
    "type": "Safety Incident",
    "timestamp_detected": "2026-03-10T08:30:00Z",
    "timestamp_reported": "2026-03-10T09:00:00Z",
    "description": "Model produced incorrect classification leading to...",
    "impact": {
      "users_affected": 150,
      "harm_caused": "Minor financial loss",
      "data_breach": false
    },
    "root_cause": "Distribution shift in input data",
    "remediation": {
      "immediate_actions": ["Model taken offline", "Manual review initiated"],
      "long_term_actions": ["Retrain on updated data", "Improve drift detection"],
      "timeline": "Full remediation by 2026-03-17"
    },
    "reporter": {
      "name": "Safety Officer",
      "contact": "safety@company.com"
    }
  }
}
```

### 28.4.2 Byzantine Council API

**Framework Reference:** Article 11 Byzantine Council Specifications

**Monitoring Endpoints:**
```
POST /api/v1/byzantine/register
  - Register system for monitoring
  
GET /api/v1/byzantine/status/{system_id}
  - Get monitoring status
  
POST /api/v1/byzantine/heartbeat
  - System health check (required every 60 seconds for Critical)
  
GET /api/v1/byzantine/alerts/{system_id}
  - Get active alerts
  
POST /api/v1/byzantine/metrics
  - Submit performance metrics
  
GET /api/v1/byzantine/consensus/{decision_id}
  - Get consensus status on flagged issue
```

**Heartbeat Format:**
```json
{
  "system_id": "sys_abc123",
  "timestamp": "2026-01-15T10:30:00Z",
  "status": "HEALTHY",
  "metrics": {
    "requests_per_minute": 1250,
    "error_rate": 0.001,
    "average_latency_ms": 45,
    "gpu_utilization": 0.75,
    "memory_utilization": 0.60
  },
  "consciousness_indicators": {
    "self_reference_rate": 0.02,
    "goal_consistency": 0.98,
    "novel_behavior_detected": false
  },
  "signature": "..."
}
```

**Alert Format:**
```json
{
  "alert": {
    "id": "ALT-2026-00123",
    "system_id": "sys_abc123",
    "severity": "High",
    "type": "Anomalous Behavior",
    "description": "Unusual pattern in self-referential outputs",
    "detected_at": "2026-01-15T10:35:00Z",
    "indicators": {
      "self_reference_rate": 0.15,
      "threshold": 0.10,
      "deviation": "50% above threshold"
    },
    "recommended_action": "Human Council review",
    "consensus_status": "Pending (18/33 agents reviewed)"
  }
}
```

### 28.4.3 EU AI Act Data Exchange

**Framework Reference:** EU AI Act Article 71 (EU Database), Regulation 2024/1689

**EU Database Registration Format:**
```json
{
  "eu_registration": {
    "provider": {
      "name": "Company Ltd",
      "address": "...",
      "contact": "..."
    },
    "ai_system": {
      "name": "ProductClassifier",
      "description": "...",
      "intended_purpose": "...",
      "risk_classification": "High-risk",
      "annex_reference": "Annex III, 5(b)",
      "conformity_assessment": {
        "type": "Third-party (Notified Body)",
        "notified_body_id": "NB-1234",
        "certificate_number": "...",
        "valid_until": "2027-01-15"
      },
      "instructions_for_use_url": "https://...",
      "technical_documentation_available": true
    },
    "declaration_of_conformity": {
      "signed_by": "CEO Name",
      "date": "2026-01-15",
      "document_url": "https://..."
    }
  }
}
```

---

## 28.5 INTEGRATION STANDARDS

### 28.5.1 Cloud Platform Integration

**AWS:**
- SageMaker (model hosting)
- Lambda (serverless inference)
- S3 (model storage)
- CloudWatch (monitoring)
- IAM (access control)

**Google Cloud:**
- Vertex AI (end-to-end ML)
- Cloud Functions (serverless)
- Cloud Storage (model storage)
- Cloud Monitoring (observability)

**Azure:**
- Azure ML (model management)
- Azure Functions (serverless)
- Blob Storage (storage)
- Azure Monitor (monitoring)

**Multi-Cloud Support:**
- Use Kubernetes for portability
- Avoid vendor lock-in where possible
- Document cloud-specific configurations

### 28.5.2 MLOps Integration

**CI/CD for ML:**
- GitHub Actions, GitLab CI, Jenkins
- Automated testing on PR
- Model validation before deployment
- Staged rollout

**Model Registry:**
- MLflow Model Registry
- AWS SageMaker Model Registry
- Vertex AI Model Registry

**Feature Stores:**
- Feast (open source)
- Tecton
- AWS Feature Store

**Experiment Tracking:**
- MLflow
- Weights & Biases
- Neptune

### 28.5.3 Monitoring Integration

**Prometheus Metrics:**
```python
from prometheus_client import Counter, Histogram, start_http_server

PREDICTIONS = Counter('predictions_total', 'Total predictions', ['model', 'status'])
LATENCY = Histogram('prediction_latency_seconds', 'Prediction latency')

@LATENCY.time()
def predict(input):
    result = model.predict(input)
    PREDICTIONS.labels(model='v1', status='success').inc()
    return result

# Expose metrics on /metrics
start_http_server(8000)
```

**Grafana Dashboards:**
- Standard dashboards for AI systems
- Latency, throughput, error rate
- Model-specific metrics

**Alerting:**
- PagerDuty, Opsgenie, Slack integration
- Escalation policies

---

## 28.6 CONCLUSION

Interoperability is the connective tissue of the AI ecosystem. Without standards:
- Systems cannot integrate
- Compliance cannot be automated
- Auditing is manual and error-prone
- Innovation is siloed

**CSOAI interoperability standards enable:**
- Seamless regulatory data exchange
- Automated compliance verification
- Byzantine Council monitoring at scale
- Multi-framework model portability
- Cloud-agnostic deployment

**Open standards accelerate safety.** When systems can communicate, oversight becomes possible. When data formats are standard, auditing becomes automated. When APIs are consistent, integration becomes seamless.

**Interoperability is not just technical—it is enabling infrastructure for global AI governance.**

**Effective Date:** January 15, 2026, 09:00 GMT  
**"Connected Systems, Unified Safety"**

---

## REFERENCES

OpenAPI Initiative. (2024). *OpenAPI Specification v3.1.*

ONNX. (2024). *Open Neural Network Exchange - Specification.*

ISO/IEC. (2023). *ISO/IEC 42001:2023 - AI Management System.*

CEN-CENELEC. (2025). *prEN 18286 - AI Quality Management System.*

EU. (2024). *Regulation 2024/1689 - AI Act.*

NIST. (2023). *AI Risk Management Framework - GOVERN Function.*

---

END OF ARTICLE 28

**🎉 PHASE 3 COMPLETE! Articles 20-28 Technical Standards finished!**

**Progress: 28 of 52 Articles (54%)**

**Next: Phase 4 - Operational Requirements (Articles 29-36)**
