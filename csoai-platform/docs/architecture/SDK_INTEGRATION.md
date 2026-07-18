# COAI SDK Integration Guide

## Overview

This guide explains how to integrate COAI's AI safety and compliance platform into your organization's AI systems using our REST API and SDK libraries.

---

## Quick Start

### 1. Get Your API Key

1. Log into your COAI dashboard
2. Navigate to **API Keys** in the sidebar
3. Click **Generate New Key**
4. Select your tier (Free/Pro/Enterprise)
5. Copy and securely store your API key

> **Important**: API keys are only shown once. Store them securely in environment variables, never in source code.

### 2. Install the SDK

**Python**
```bash
pip install coai-sdk
```

**JavaScript/Node.js**
```bash
npm install @coai/sdk
# or
pnpm add @coai/sdk
```

### 3. Initialize the Client

**Python**
```python
from coai import COAIClient

client = COAIClient(
    api_key="coai_xxx...",
    base_url="https://api.coai.io/v1"  # Optional, defaults to production
)
```

**JavaScript**
```javascript
import { COAIClient } from '@coai/sdk';

const client = new COAIClient({
    apiKey: 'coai_xxx...',
    baseUrl: 'https://api.coai.io/v1'  // Optional
});
```

---

## Core Workflows

### Register an AI System

Before running compliance assessments, register your AI system:

**Python**
```python
# Register a new AI system
system = client.ai_systems.create(
    name="CustomerBot Pro",
    description="AI-powered customer service chatbot",
    system_type="chatbot",  # chatbot, recommendation, classification, generation, analysis, other
    risk_level="limited"    # minimal, limited, high, unacceptable
)

print(f"System registered with ID: {system.id}")
```

**JavaScript**
```javascript
const system = await client.aiSystems.create({
    name: 'CustomerBot Pro',
    description: 'AI-powered customer service chatbot',
    systemType: 'chatbot',
    riskLevel: 'limited'
});

console.log(`System registered with ID: ${system.id}`);
```

### Run a Compliance Assessment

**Python**
```python
# Run assessment against EU AI Act
assessment = client.compliance.create_assessment(
    ai_system_id=system.id,
    framework_id=1  # 1=EU AI Act, 2=NIST RMF, 3=TC260
)

print(f"Assessment Score: {assessment.overall_score}%")
print(f"Compliant: {assessment.compliant_count}/{assessment.items_count}")
print(f"Non-compliant: {assessment.non_compliant_count}")
```

**JavaScript**
```javascript
const assessment = await client.compliance.createAssessment({
    aiSystemId: system.id,
    frameworkId: 1  // EU AI Act
});

console.log(`Assessment Score: ${assessment.overallScore}%`);
```

### Get Assessment Results

**Python**
```python
# Get detailed assessment results
results = client.compliance.get_assessment(assessment_id=assessment.id)

for item in results.items:
    print(f"{item.requirement.title}: {item.status}")
    if item.notes:
        print(f"  Notes: {item.notes}")
```

### Generate Compliance Report

**Python**
```python
# Generate PDF report
report = client.compliance.generate_report(
    assessment_id=assessment.id,
    include_evidence=True,
    include_recommendations=True
)

# Save to file
with open("compliance_report.pdf", "wb") as f:
    f.write(report.pdf_bytes)
```

### Create PDCA Improvement Cycle

**Python**
```python
# Start a PDCA cycle for continuous improvement
cycle = client.pdca.create(
    ai_system_id=system.id,
    plan_summary="Implement bias detection and human oversight controls"
)

# Advance through phases
client.pdca.advance_phase(cycle.id)  # Plan → Do
client.pdca.update_phase(cycle.id, do_summary="Deployed bias monitoring system")

client.pdca.advance_phase(cycle.id)  # Do → Check
client.pdca.update_phase(cycle.id, check_summary="Verified 95% reduction in bias incidents")

client.pdca.advance_phase(cycle.id)  # Check → Act
client.pdca.update_phase(cycle.id, act_summary="Standardized bias monitoring across all systems")

client.pdca.complete(cycle.id)
```

---

## Webhook Integration

Set up webhooks to receive real-time notifications about your AI systems.

### Configure Webhooks

1. Go to **API Keys** → **Webhooks**
2. Add your endpoint URL
3. Select events to subscribe to
4. Copy the webhook secret for signature verification

### Webhook Events

| Event | Description |
|-------|-------------|
| `assessment.completed` | Compliance assessment finished |
| `assessment.score_changed` | Compliance score updated |
| `watchdog.report_filed` | New incident report about your system |
| `watchdog.report_verified` | Incident report verified by analyst |
| `council.vote_completed` | 33-Agent Council finished voting |
| `pdca.phase_advanced` | PDCA cycle moved to next phase |
| `pdca.cycle_completed` | PDCA cycle fully completed |

### Webhook Payload Example

```json
{
  "event": "watchdog.report_filed",
  "timestamp": "2024-12-24T10:30:00Z",
  "data": {
    "report_id": 123,
    "ai_system_name": "CustomerBot Pro",
    "incident_type": "bias",
    "severity": "medium",
    "title": "Discriminatory responses detected"
  },
  "signature": "sha256=abc123..."
}
```

### Verify Webhook Signature

**Python**
```python
import hmac
import hashlib

def verify_webhook(payload: bytes, signature: str, secret: str) -> bool:
    expected = hmac.new(
        secret.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(f"sha256={expected}", signature)
```

---

## Error Handling

All SDK methods may raise exceptions. Handle them appropriately:

**Python**
```python
from coai.exceptions import (
    COAIAuthError,
    COAIRateLimitError,
    COAIValidationError,
    COAINotFoundError
)

try:
    assessment = client.compliance.create_assessment(
        ai_system_id=999,
        framework_id=1
    )
except COAIAuthError:
    print("Invalid API key")
except COAIRateLimitError as e:
    print(f"Rate limited. Retry after {e.retry_after} seconds")
except COAINotFoundError:
    print("AI system not found")
except COAIValidationError as e:
    print(f"Validation error: {e.message}")
```

---

## Rate Limits

| Tier | Requests/Hour | Concurrent Requests |
|------|---------------|---------------------|
| Free | 100 | 2 |
| Pro | 500 | 10 |
| Enterprise | 1000 | 50 |

Rate limit headers are included in all responses:
- `X-RateLimit-Limit`: Maximum requests per hour
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Unix timestamp when limit resets

---

## Best Practices

### 1. Secure API Key Storage

```python
import os

# Good: Use environment variables
client = COAIClient(api_key=os.environ["COAI_API_KEY"])

# Bad: Hardcoded keys
client = COAIClient(api_key="coai_xxx...")  # Never do this!
```

### 2. Implement Retry Logic

```python
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=4, max=10)
)
def run_assessment_with_retry(system_id, framework_id):
    return client.compliance.create_assessment(
        ai_system_id=system_id,
        framework_id=framework_id
    )
```

### 3. Use Webhooks for Async Operations

Instead of polling for assessment results:
```python
# Bad: Polling
while True:
    result = client.compliance.get_assessment(assessment_id)
    if result.status == "completed":
        break
    time.sleep(5)
```

Set up webhooks to receive notifications when operations complete.

### 4. Cache Framework Data

```python
# Frameworks rarely change - cache them
@lru_cache(maxsize=1)
def get_frameworks():
    return client.compliance.get_frameworks()
```

---

## API Reference

### Base URL
```
Production: https://api.coai.io/v1
Sandbox: https://sandbox.coai.io/v1
```

### Authentication
All requests require an API key in the header:
```
Authorization: Bearer coai_xxx...
```

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/ai-systems` | List registered AI systems |
| POST | `/ai-systems` | Register new AI system |
| GET | `/ai-systems/:id` | Get AI system details |
| PUT | `/ai-systems/:id` | Update AI system |
| DELETE | `/ai-systems/:id` | Delete AI system |
| GET | `/compliance/frameworks` | List available frameworks |
| POST | `/compliance/assessments` | Create new assessment |
| GET | `/compliance/assessments/:id` | Get assessment results |
| POST | `/compliance/assessments/:id/report` | Generate PDF report |
| GET | `/pdca` | List PDCA cycles |
| POST | `/pdca` | Create new PDCA cycle |
| POST | `/pdca/:id/advance` | Advance to next phase |
| POST | `/pdca/:id/complete` | Complete the cycle |
| GET | `/watchdog/reports` | List incident reports |
| POST | `/watchdog/reports` | Submit incident report |

---

## Support

- **Documentation**: https://docs.coai.io
- **API Status**: https://status.coai.io
- **Email**: support@coai.io
- **Enterprise Support**: enterprise@coai.io

