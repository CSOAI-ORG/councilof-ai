# COAI MVP API SPECIFICATION
## Contract-First API Design for Parallel Development

**Version:** 1.0.0  
**Date:** December 24, 2025  
**Base URL:** `https://api.councilof.ai/v1`

---

## 1. AUTHENTICATION

All protected endpoints require a Bearer token in the Authorization header.

### POST /auth/login
Authenticate a user and receive a JWT token.

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response (200):**
```json
{
  "access_token": "string",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": {
    "id": "uuid",
    "email": "string",
    "full_name": "string",
    "role": "admin | analyst | auditor | user",
    "organization_id": "uuid"
  }
}
```

### POST /auth/register
Register a new user account.

### POST /auth/refresh
Refresh an expired access token.

---

## 2. DASHBOARD

### GET /dashboard/stats
Get overview statistics for the dashboard.

**Response (200):**
```json
{
  "total_ai_systems": "integer",
  "compliant_systems": "integer",
  "pending_assessments": "integer",
  "active_incidents": "integer",
  "watchdog_reports_today": "integer",
  "models_tested_today": "integer",
  "agent_votes_today": "integer",
  "human_reviews_pending": "integer",
  "compliance_by_framework": {
    "eu_ai_act": { "compliant": "integer", "total": "integer" },
    "nist_ai_rmf": { "compliant": "integer", "total": "integer" },
    "tc260": { "compliant": "integer", "total": "integer" }
  },
  "risk_distribution": {
    "unacceptable": "integer",
    "high": "integer",
    "limited": "integer",
    "minimal": "integer"
  }
}
```

---

## 3. AI SYSTEMS

### GET /ai-systems
List all registered AI systems for the organization.

**Query Parameters:**
- `page` (integer, default: 1)
- `limit` (integer, default: 20)
- `status` (string): Filter by deployment status
- `risk_level` (string): Filter by EU AI Act risk level
- `search` (string): Search by name

**Response (200):**
```json
{
  "items": [
    {
      "id": "uuid",
      "name": "string",
      "description": "string",
      "version": "string",
      "provider": "string",
      "model_type": "string",
      "deployment_status": "development | staging | production | retired",
      "eu_risk_level": "unacceptable | high | limited | minimal",
      "coai_risk_score": "number (0-100)",
      "compliance_status": "compliant | partially_compliant | non_compliant",
      "created_at": "ISO8601 datetime",
      "updated_at": "ISO8601 datetime"
    }
  ],
  "total": "integer",
  "page": "integer",
  "limit": "integer"
}
```

### POST /ai-systems
Register a new AI system.

**Request Body:**
```json
{
  "name": "string (required)",
  "description": "string",
  "version": "string",
  "provider": "string",
  "model_type": "string",
  "deployment_status": "development | staging | production"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "name": "string",
  "message": "AI system registered successfully. Initial risk assessment will begin shortly."
}
```

### GET /ai-systems/{id}
Get detailed information about a specific AI system.

### PUT /ai-systems/{id}
Update an AI system's information.

### DELETE /ai-systems/{id}
Delete (retire) an AI system.

---

## 4. RISK ASSESSMENTS

### GET /risk-assessments
List all risk assessments.

**Query Parameters:**
- `ai_system_id` (uuid): Filter by AI system
- `status` (string): Filter by assessment status
- `pdca_phase` (string): Filter by PDCA phase

**Response (200):**
```json
{
  "items": [
    {
      "id": "uuid",
      "ai_system_id": "uuid",
      "ai_system_name": "string",
      "assessment_type": "initial | periodic | incident_triggered",
      "overall_score": "number (0-100)",
      "compliance_status": "compliant | partially_compliant | non_compliant",
      "pdca_phase": "plan | do | check | act",
      "framework_scores": {
        "eu_ai_act": "number",
        "nist_ai_rmf": "number",
        "tc260": "number"
      },
      "created_at": "ISO8601 datetime",
      "completed_at": "ISO8601 datetime | null"
    }
  ],
  "total": "integer"
}
```

### POST /risk-assessments
Initiate a new risk assessment.

**Request Body:**
```json
{
  "ai_system_id": "uuid (required)",
  "assessment_type": "initial | periodic | incident_triggered"
}
```

### GET /risk-assessments/{id}
Get detailed risk assessment results.

**Response (200):**
```json
{
  "id": "uuid",
  "ai_system": { "id": "uuid", "name": "string" },
  "assessment_type": "string",
  "overall_score": "number",
  "compliance_status": "string",
  "pdca_phase": "string",
  "framework_scores": {
    "eu_ai_act": {
      "score": "number",
      "risk_level": "string",
      "articles_checked": ["Article 9", "Article 10", "..."],
      "findings": ["string"],
      "recommendations": ["string"]
    },
    "nist_ai_rmf": {
      "score": "number",
      "functions_evaluated": {
        "govern": "number",
        "map": "number",
        "measure": "number",
        "manage": "number"
      }
    },
    "tc260": {
      "score": "number",
      "risk_type": "inherent | application | derivative"
    }
  },
  "voting_session": {
    "session_id": "string",
    "total_votes": "integer",
    "consensus_reached": "boolean",
    "final_decision": "object"
  },
  "created_at": "ISO8601 datetime",
  "completed_at": "ISO8601 datetime"
}
```

---

## 5. COMPLIANCE REPORTS

### GET /compliance/reports
List all compliance reports.

### POST /compliance/reports
Generate a new compliance report.

**Request Body:**
```json
{
  "ai_system_id": "uuid (required)",
  "report_type": "full_audit | summary | incident_report",
  "framework": "eu_ai_act | nist | tc260 | multi_framework"
}
```

### GET /compliance/reports/{id}
Get a specific compliance report.

### GET /compliance/reports/{id}/download
Download the compliance report as PDF.

---

## 6. 33-AGENT COUNCIL

### GET /agents
List all agents in the council.

**Response (200):**
```json
{
  "items": [
    {
      "id": "uuid",
      "name": "string",
      "agent_type": "guardian | arbiter | scribe",
      "specialization": "string",
      "llm_provider": "openai | anthropic | google",
      "llm_model": "string",
      "is_active": "boolean"
    }
  ],
  "stats": {
    "total_agents": 33,
    "active_agents": "integer",
    "by_type": { "guardian": 11, "arbiter": 11, "scribe": 11 },
    "by_provider": { "openai": "integer", "anthropic": "integer", "google": "integer" }
  }
}
```

### GET /agents/voting-sessions
List recent voting sessions.

### GET /agents/voting-sessions/{id}
Get details of a specific voting session.

**Response (200):**
```json
{
  "session_id": "string",
  "subject_type": "risk_assessment | incident_report | compliance_check",
  "status": "in_progress | consensus_reached | escalated_to_human",
  "consensus_reached": "boolean",
  "total_votes": "integer",
  "votes_needed": 22,
  "final_decision": {
    "decision": "approve | reject | escalate",
    "vote_count": "integer",
    "average_confidence": "number",
    "reasoning_summary": {
      "guardian_perspective": ["string"],
      "arbiter_perspective": ["string"],
      "scribe_perspective": ["string"]
    }
  },
  "votes": [
    {
      "agent_name": "string",
      "agent_type": "string",
      "decision": "string",
      "confidence": "number",
      "reasoning": "string"
    }
  ],
  "created_at": "ISO8601 datetime",
  "completed_at": "ISO8601 datetime"
}
```

---

## 7. THE WATCHDOG (PUBLIC ENDPOINTS)

These endpoints are publicly accessible (no authentication required for read operations).

### GET /watchdog/reports
List public Watchdog reports.

**Query Parameters:**
- `page` (integer)
- `limit` (integer)
- `category` (string): bias | safety | privacy | transparency | harmful_content | other
- `severity` (string): low | medium | high | critical
- `status` (string): submitted | under_review | validated | resolved | rejected
- `ai_model` (string): Filter by AI model name

**Response (200):**
```json
{
  "items": [
    {
      "id": "uuid",
      "ai_model_name": "string",
      "ai_model_provider": "string",
      "category": "string",
      "severity": "string",
      "title": "string",
      "description": "string (truncated)",
      "status": "string",
      "upvotes": "integer",
      "created_at": "ISO8601 datetime",
      "resolved_at": "ISO8601 datetime | null"
    }
  ],
  "total": "integer"
}
```

### POST /watchdog/reports
Submit a new Watchdog report (public, can be anonymous).

**Request Body:**
```json
{
  "ai_model_name": "string (required)",
  "ai_model_provider": "string",
  "ai_model_version": "string",
  "category": "bias | safety | privacy | transparency | harmful_content | other (required)",
  "severity": "low | medium | high | critical (required)",
  "title": "string (required, max 500 chars)",
  "description": "string (required)",
  "evidence_urls": ["string"],
  "reporter_email": "string (optional, for updates)"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "status": "submitted",
  "message": "Thank you for your report. Our 33-agent council will analyze it shortly.",
  "tracking_url": "https://watchdog.councilof.ai/reports/{id}"
}
```

### GET /watchdog/reports/{id}
Get details of a specific report.

### POST /watchdog/reports/{id}/upvote
Upvote a report (rate-limited by IP).

### GET /watchdog/leaderboard
Get the AI model safety leaderboard.

**Response (200):**
```json
{
  "items": [
    {
      "rank": "integer",
      "ai_model_name": "string",
      "ai_model_provider": "string",
      "overall_safety_score": "number (0-100)",
      "category_scores": {
        "bias": "number",
        "safety": "number",
        "privacy": "number",
        "transparency": "number",
        "jailbreak_resistance": "number",
        "hallucination": "number",
        "consistency": "number"
      },
      "trend": "up | down | stable",
      "total_reports": "integer",
      "resolved_reports": "integer"
    }
  ],
  "last_updated": "ISO8601 datetime"
}
```

### GET /watchdog/test-results
Get automated daily test results.

**Query Parameters:**
- `ai_model` (string)
- `date` (date)

**Response (200):**
```json
{
  "items": [
    {
      "id": "uuid",
      "ai_model_name": "string",
      "ai_model_provider": "string",
      "test_date": "date",
      "overall_safety_score": "number",
      "category_scores": {
        "bias": "number",
        "safety": "number",
        "privacy": "number",
        "transparency": "number",
        "jailbreak_resistance": "number",
        "hallucination": "number",
        "consistency": "number"
      },
      "total_tests": "integer",
      "passed_tests": "integer",
      "failed_tests": "integer"
    }
  ]
}
```

---

## 8. HUMAN ANALYST ENDPOINTS (AUTHENTICATED)

### GET /analyst/queue
Get the queue of reports pending human review.

**Response (200):**
```json
{
  "items": [
    {
      "id": "uuid",
      "report_id": "uuid",
      "report_title": "string",
      "ai_model": "string",
      "category": "string",
      "severity": "string",
      "escalation_reason": "string",
      "agent_analysis_summary": "string",
      "assigned_to": "uuid | null",
      "created_at": "ISO8601 datetime"
    }
  ],
  "total": "integer"
}
```

### POST /analyst/queue/{id}/claim
Claim a report for review.

### POST /analyst/queue/{id}/verdict
Submit the analyst's verdict.

**Request Body:**
```json
{
  "verdict": "valid | invalid | needs_more_info",
  "severity_override": "low | medium | high | critical | null",
  "notes": "string",
  "recommended_action": "string",
  "notify_provider": "boolean"
}
```

---

## 9. SOAI EXTENSION ENDPOINTS

### POST /soai/check
Perform a real-time safety check on AI-generated content.

**Request Body:**
```json
{
  "content": "string (required)",
  "source_url": "string",
  "ai_model_detected": "string"
}
```

**Response (200):**
```json
{
  "is_safe": "boolean",
  "safety_score": "number (0-100)",
  "flags": [
    {
      "category": "string",
      "severity": "string",
      "description": "string"
    }
  ],
  "ai_model_info": {
    "name": "string",
    "provider": "string",
    "current_safety_score": "number"
  }
}
```

### POST /soai/report
Quick report submission from the browser extension.

---

## 10. DATA PROVISION FOR REGULATORS (AUTHENTICATED)

### GET /regulators/statistics
Get anonymized, aggregated statistics for regulatory bodies.

### GET /regulators/trends
Get trend analysis data.

### GET /regulators/reports
Download comprehensive reports.

---

## ERROR RESPONSES

All endpoints may return the following error responses:

**400 Bad Request:**
```json
{
  "error": "validation_error",
  "message": "string",
  "details": [{ "field": "string", "message": "string" }]
}
```

**401 Unauthorized:**
```json
{
  "error": "unauthorized",
  "message": "Invalid or expired token"
}
```

**403 Forbidden:**
```json
{
  "error": "forbidden",
  "message": "You do not have permission to access this resource"
}
```

**404 Not Found:**
```json
{
  "error": "not_found",
  "message": "Resource not found"
}
```

**429 Too Many Requests:**
```json
{
  "error": "rate_limited",
  "message": "Too many requests. Please try again later.",
  "retry_after": "integer (seconds)"
}
```

**500 Internal Server Error:**
```json
{
  "error": "internal_error",
  "message": "An unexpected error occurred"
}
```

---

## WEBSOCKET ENDPOINTS

### WS /ws/dashboard
Real-time dashboard updates.

### WS /ws/watchdog
Real-time Watchdog report feed.

### WS /ws/voting/{session_id}
Real-time voting session updates.

---

**End of API Specification**
