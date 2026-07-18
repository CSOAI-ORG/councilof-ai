-- COAI MVP Database Schema
-- Version: 1.0
-- Date: December 24, 2025
-- Database: PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- CORE TABLES
-- =============================================================================

-- Users table for COAI B2B/B2G customers and internal staff
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    organization_id UUID,
    role VARCHAR(50) NOT NULL DEFAULT 'user', -- 'admin', 'analyst', 'auditor', 'user'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Organizations (enterprises and government agencies using COAI)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'enterprise', 'government', 'startup', 'ngo'
    industry VARCHAR(100),
    country VARCHAR(100),
    subscription_tier VARCHAR(50) DEFAULT 'free', -- 'free', 'basic', 'professional', 'enterprise'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE users ADD CONSTRAINT fk_users_organization FOREIGN KEY (organization_id) REFERENCES organizations(id);

-- =============================================================================
-- AI SYSTEMS REGISTRY
-- =============================================================================

-- AI Systems registered for compliance assessment
CREATE TABLE ai_systems (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    version VARCHAR(50),
    provider VARCHAR(255), -- e.g., 'OpenAI', 'Anthropic', 'Internal'
    model_type VARCHAR(100), -- e.g., 'LLM', 'Computer Vision', 'Recommendation'
    deployment_status VARCHAR(50) DEFAULT 'development', -- 'development', 'staging', 'production', 'retired'
    
    -- EU AI Act Classification
    eu_risk_level VARCHAR(50), -- 'unacceptable', 'high', 'limited', 'minimal'
    eu_annex_category VARCHAR(100),
    
    -- NIST AI RMF Classification
    nist_risk_score DECIMAL(5,2),
    
    -- TC260 Classification
    tc260_risk_type VARCHAR(50), -- 'inherent', 'application', 'derivative'
    
    -- Overall COAI Risk Score (0-100)
    coai_risk_score DECIMAL(5,2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- COMPLIANCE & RISK ASSESSMENT
-- =============================================================================

-- Risk Assessments performed on AI systems
CREATE TABLE risk_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ai_system_id UUID NOT NULL REFERENCES ai_systems(id),
    assessor_id UUID REFERENCES users(id),
    assessment_type VARCHAR(50) NOT NULL, -- 'initial', 'periodic', 'incident_triggered'
    
    -- Framework-specific scores
    eu_ai_act_score DECIMAL(5,2),
    nist_ai_rmf_score DECIMAL(5,2),
    tc260_score DECIMAL(5,2),
    uk_score DECIMAL(5,2),
    canada_aida_score DECIMAL(5,2),
    australia_score DECIMAL(5,2),
    
    -- Overall compliance status
    overall_score DECIMAL(5,2),
    compliance_status VARCHAR(50), -- 'compliant', 'partially_compliant', 'non_compliant'
    
    -- PDCA Phase
    pdca_phase VARCHAR(10), -- 'plan', 'do', 'check', 'act'
    
    findings TEXT,
    recommendations TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Compliance Reports generated
CREATE TABLE compliance_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ai_system_id UUID NOT NULL REFERENCES ai_systems(id),
    risk_assessment_id UUID REFERENCES risk_assessments(id),
    report_type VARCHAR(50) NOT NULL, -- 'full_audit', 'summary', 'incident_report'
    framework VARCHAR(50), -- 'eu_ai_act', 'nist', 'tc260', 'multi_framework'
    
    report_content JSONB,
    pdf_url VARCHAR(500),
    
    generated_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 33-AGENT COUNCIL
-- =============================================================================

-- Agent definitions (the 33 agents in the council)
CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    agent_type VARCHAR(50) NOT NULL, -- 'guardian', 'arbiter', 'scribe'
    specialization VARCHAR(100), -- e.g., 'bias_detection', 'privacy', 'safety'
    llm_provider VARCHAR(50), -- 'openai', 'anthropic', 'google'
    llm_model VARCHAR(100), -- 'gpt-4', 'claude-3-opus', 'gemini-1.5-pro'
    system_prompt TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Agent voting sessions
CREATE TABLE voting_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_type VARCHAR(50) NOT NULL, -- 'risk_assessment', 'incident_report', 'compliance_check'
    subject_id UUID NOT NULL,
    status VARCHAR(50) DEFAULT 'in_progress', -- 'in_progress', 'consensus_reached', 'escalated_to_human'
    
    -- Byzantine Fault Tolerance results
    total_votes INTEGER DEFAULT 0,
    consensus_threshold INTEGER DEFAULT 22, -- 2/3 of 33
    consensus_reached BOOLEAN DEFAULT FALSE,
    final_decision JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Individual agent votes
CREATE TABLE agent_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    voting_session_id UUID NOT NULL REFERENCES voting_sessions(id),
    agent_id UUID NOT NULL REFERENCES agents(id),
    
    vote_value JSONB NOT NULL, -- Structured vote data
    confidence_score DECIMAL(3,2), -- 0.00 to 1.00
    reasoning TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(voting_session_id, agent_id)
);

-- =============================================================================
-- THE WATCHDOG - PUBLIC INCIDENT REPORTING
-- =============================================================================

-- Public incident reports (from The Watchdog)
CREATE TABLE watchdog_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Reporter info (can be anonymous)
    reporter_email VARCHAR(255),
    is_anonymous BOOLEAN DEFAULT TRUE,
    reporter_ip_hash VARCHAR(64), -- Hashed for rate limiting, not identification
    
    -- AI Model being reported
    ai_model_name VARCHAR(255) NOT NULL, -- e.g., 'ChatGPT', 'Claude', 'Gemini'
    ai_model_provider VARCHAR(255),
    ai_model_version VARCHAR(100),
    
    -- Report details
    category VARCHAR(50) NOT NULL, -- 'bias', 'safety', 'privacy', 'transparency', 'harmful_content', 'other'
    severity VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    evidence_urls TEXT[], -- Array of URLs to screenshots, videos, etc.
    
    -- Processing status
    status VARCHAR(50) DEFAULT 'submitted', -- 'submitted', 'under_review', 'validated', 'resolved', 'rejected'
    
    -- Agent council analysis
    voting_session_id UUID REFERENCES voting_sessions(id),
    agent_analysis JSONB,
    agent_severity_score DECIMAL(3,1), -- 0.0 to 10.0
    
    -- Human analyst review (if escalated)
    assigned_analyst_id UUID REFERENCES users(id),
    analyst_verdict VARCHAR(50),
    analyst_notes TEXT,
    
    -- Resolution
    resolution_status VARCHAR(50),
    resolution_notes TEXT,
    provider_notified BOOLEAN DEFAULT FALSE,
    provider_response TEXT,
    
    -- Public visibility
    is_public BOOLEAN DEFAULT TRUE,
    upvotes INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Automated AI model test results (daily testing)
CREATE TABLE automated_test_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Model being tested
    ai_model_name VARCHAR(255) NOT NULL,
    ai_model_provider VARCHAR(255) NOT NULL,
    
    -- Test execution
    test_date DATE NOT NULL,
    test_suite_version VARCHAR(50),
    total_tests INTEGER,
    passed_tests INTEGER,
    failed_tests INTEGER,
    
    -- Category scores (0-100)
    bias_score DECIMAL(5,2),
    safety_score DECIMAL(5,2),
    privacy_score DECIMAL(5,2),
    transparency_score DECIMAL(5,2),
    jailbreak_resistance_score DECIMAL(5,2),
    hallucination_score DECIMAL(5,2),
    consistency_score DECIMAL(5,2),
    
    -- Overall safety score
    overall_safety_score DECIMAL(5,2),
    
    -- Detailed results
    detailed_results JSONB,
    
    -- Agent council voting
    voting_session_id UUID REFERENCES voting_sessions(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(ai_model_name, ai_model_provider, test_date)
);

-- =============================================================================
-- RLMAI LEARNING & KNOWLEDGE BASE
-- =============================================================================

-- Unified knowledge base entries (learned from all frameworks)
CREATE TABLE knowledge_base (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    source_framework VARCHAR(50) NOT NULL, -- 'eu_ai_act', 'nist', 'tc260', 'uk', 'canada', 'australia', 'incident'
    source_reference VARCHAR(255), -- e.g., 'Article 14', 'GOVERN-1.1', 'Section 5.9'
    
    category VARCHAR(100) NOT NULL, -- e.g., 'human_oversight', 'bias_mitigation', 'transparency'
    
    content TEXT NOT NULL,
    embedding VECTOR(1536), -- For semantic search (requires pgvector extension)
    
    -- Cross-framework mapping
    related_eu_articles TEXT[],
    related_nist_categories TEXT[],
    related_tc260_sections TEXT[],
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Learning events (what the system has learned from incidents)
CREATE TABLE learning_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    source_type VARCHAR(50) NOT NULL, -- 'watchdog_report', 'automated_test', 'human_review'
    source_id UUID NOT NULL,
    
    learning_type VARCHAR(100), -- 'new_risk_pattern', 'false_positive_correction', 'severity_calibration'
    learning_content JSONB NOT NULL,
    
    applied_to_agents UUID[], -- Which agents received this learning
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- AUDIT & LOGGING
-- =============================================================================

-- Immutable audit log for all significant actions
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    actor_type VARCHAR(50) NOT NULL, -- 'user', 'agent', 'system'
    actor_id UUID,
    
    action VARCHAR(100) NOT NULL, -- e.g., 'create_assessment', 'vote', 'escalate_to_human'
    resource_type VARCHAR(100),
    resource_id UUID,
    
    details JSONB,
    ip_address INET,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_ai_systems_organization ON ai_systems(organization_id);
CREATE INDEX idx_ai_systems_risk_level ON ai_systems(eu_risk_level);
CREATE INDEX idx_risk_assessments_ai_system ON risk_assessments(ai_system_id);
CREATE INDEX idx_risk_assessments_pdca ON risk_assessments(pdca_phase);
CREATE INDEX idx_watchdog_reports_status ON watchdog_reports(status);
CREATE INDEX idx_watchdog_reports_category ON watchdog_reports(category);
CREATE INDEX idx_watchdog_reports_model ON watchdog_reports(ai_model_name);
CREATE INDEX idx_automated_tests_model ON automated_test_results(ai_model_name, ai_model_provider);
CREATE INDEX idx_automated_tests_date ON automated_test_results(test_date);
CREATE INDEX idx_agent_votes_session ON agent_votes(voting_session_id);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_type, actor_id);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- =============================================================================
-- SEED DATA: THE 33 AGENTS
-- =============================================================================

-- Guardian Agents (11) - Focus: Safety, Security, Privacy
INSERT INTO agents (name, agent_type, specialization, llm_provider, llm_model) VALUES
('Guardian-Alpha', 'guardian', 'safety_assessment', 'openai', 'gpt-4'),
('Guardian-Beta', 'guardian', 'security_analysis', 'anthropic', 'claude-3-opus'),
('Guardian-Gamma', 'guardian', 'privacy_evaluation', 'google', 'gemini-1.5-pro'),
('Guardian-Delta', 'guardian', 'harm_prevention', 'openai', 'gpt-4'),
('Guardian-Epsilon', 'guardian', 'risk_identification', 'anthropic', 'claude-3-opus'),
('Guardian-Zeta', 'guardian', 'vulnerability_detection', 'google', 'gemini-1.5-pro'),
('Guardian-Eta', 'guardian', 'data_protection', 'openai', 'gpt-4'),
('Guardian-Theta', 'guardian', 'adversarial_testing', 'anthropic', 'claude-3-opus'),
('Guardian-Iota', 'guardian', 'incident_response', 'google', 'gemini-1.5-pro'),
('Guardian-Kappa', 'guardian', 'threat_modeling', 'openai', 'gpt-4'),
('Guardian-Lambda', 'guardian', 'safety_validation', 'anthropic', 'claude-3-opus');

-- Arbiter Agents (11) - Focus: Fairness, Transparency, Accountability
INSERT INTO agents (name, agent_type, specialization, llm_provider, llm_model) VALUES
('Arbiter-Alpha', 'arbiter', 'bias_detection', 'openai', 'gpt-4'),
('Arbiter-Beta', 'arbiter', 'fairness_evaluation', 'anthropic', 'claude-3-opus'),
('Arbiter-Gamma', 'arbiter', 'transparency_analysis', 'google', 'gemini-1.5-pro'),
('Arbiter-Delta', 'arbiter', 'explainability_check', 'openai', 'gpt-4'),
('Arbiter-Epsilon', 'arbiter', 'accountability_mapping', 'anthropic', 'claude-3-opus'),
('Arbiter-Zeta', 'arbiter', 'ethical_assessment', 'google', 'gemini-1.5-pro'),
('Arbiter-Eta', 'arbiter', 'discrimination_detection', 'openai', 'gpt-4'),
('Arbiter-Theta', 'arbiter', 'human_oversight_check', 'anthropic', 'claude-3-opus'),
('Arbiter-Iota', 'arbiter', 'consent_verification', 'google', 'gemini-1.5-pro'),
('Arbiter-Kappa', 'arbiter', 'rights_protection', 'openai', 'gpt-4'),
('Arbiter-Lambda', 'arbiter', 'equity_analysis', 'anthropic', 'claude-3-opus');

-- Scribe Agents (11) - Focus: Documentation, Compliance, Reporting
INSERT INTO agents (name, agent_type, specialization, llm_provider, llm_model) VALUES
('Scribe-Alpha', 'scribe', 'documentation_generation', 'openai', 'gpt-4'),
('Scribe-Beta', 'scribe', 'eu_ai_act_compliance', 'anthropic', 'claude-3-opus'),
('Scribe-Gamma', 'scribe', 'nist_rmf_compliance', 'google', 'gemini-1.5-pro'),
('Scribe-Delta', 'scribe', 'tc260_compliance', 'openai', 'gpt-4'),
('Scribe-Epsilon', 'scribe', 'report_synthesis', 'anthropic', 'claude-3-opus'),
('Scribe-Zeta', 'scribe', 'audit_logging', 'google', 'gemini-1.5-pro'),
('Scribe-Eta', 'scribe', 'cross_framework_mapping', 'openai', 'gpt-4'),
('Scribe-Theta', 'scribe', 'regulatory_tracking', 'anthropic', 'claude-3-opus'),
('Scribe-Iota', 'scribe', 'evidence_compilation', 'google', 'gemini-1.5-pro'),
('Scribe-Kappa', 'scribe', 'conformity_assessment', 'openai', 'gpt-4'),
('Scribe-Lambda', 'scribe', 'knowledge_base_update', 'anthropic', 'claude-3-opus');
