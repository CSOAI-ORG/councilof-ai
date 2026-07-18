/**
 * Compliance Service - FERPA, GDPR, and sector-specific compliance
 * Compliance checking, reporting, and audit trail management
 */

const logger = require("../utils/logger");

class ComplianceService {
  constructor() {
    // Compliance records: Map<tenantId, compliance state>
    this.complianceState = new Map();

    // Audit logs: Array of audit entries
    this.auditLogs = [];

    // Compliance standards
    this.standards = {
      FERPA: {
        name: "Family Educational Rights and Privacy Act",
        requirements: [
          "student-data-privacy",
          "parent-access-rights",
          "records-security",
          "authorized-disclosure",
        ],
      },
      GDPR: {
        name: "General Data Protection Regulation",
        requirements: [
          "explicit-consent",
          "data-minimization",
          "right-to-be-forgotten",
          "data-portability",
          "privacy-by-design",
        ],
      },
      CCPA: {
        name: "California Consumer Privacy Act",
        requirements: [
          "consumer-rights",
          "opt-out-sale",
          "data-disclosure",
          "non-discrimination",
        ],
      },
      HIPAA: {
        name: "Health Insurance Portability and Accountability Act",
        requirements: [
          "protected-health-information",
          "access-controls",
          "audit-controls",
          "encryption",
        ],
      },
    };
  }

  /**
   * Check compliance for a tenant
   * @param {Object} tenantConfig - Tenant configuration
   * @returns {Promise<Object>}
   */
  async checkCompliance(tenantConfig) {
    const { tenantId, applicableRegulations = [] } = tenantConfig;

    logger.info(`Checking compliance for tenant`, {
      tenantId,
      regulations: applicableRegulations,
    });

    const complianceChecks = {
      dataProtection: this.checkDataProtection(tenantConfig),
      accessControls: this.checkAccessControls(tenantConfig),
      encryption: this.checkEncryption(tenantConfig),
      auditLogging: this.checkAuditLogging(tenantConfig),
      consentManagement: this.checkConsentManagement(tenantConfig),
      userRights: this.checkUserRights(tenantConfig),
    };

    const results = {};
    let allCompliant = true;

    for (const [check, result] of Object.entries(complianceChecks)) {
      results[check] = result;
      if (!result.compliant) {
        allCompliant = false;
      }
    }

    const complianceStatus = {
      tenantId,
      compliant: allCompliant,
      checks: results,
      regulations: applicableRegulations,
      timestamp: new Date().toISOString(),
      issues: this.aggregateIssues(results),
    };

    // Store in compliance state
    this.complianceState.set(tenantId, complianceStatus);

    logger.info(`Compliance check completed`, {
      tenantId,
      compliant: allCompliant,
      issueCount: complianceStatus.issues.length,
    });

    return complianceStatus;
  }

  /**
   * Generate comprehensive compliance report
   * @param {string} tenantId - Tenant ID
   * @param {Object} options - Report options
   * @returns {Promise<Object>}
   */
  async generateComplianceReport(tenantId, options = {}) {
    const { includeAuditLog = true, dateRange = null } = options;

    logger.info(`Generating compliance report`, { tenantId });

    const complianceState = this.complianceState.get(tenantId) || {
      tenantId,
      compliant: null,
      checks: {},
    };

    // Filter audit logs if date range provided
    let relevantAuditLogs = this.auditLogs.filter((log) => log.tenantId === tenantId);

    if (dateRange && dateRange.start && dateRange.end) {
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      relevantAuditLogs = relevantAuditLogs.filter((log) => {
        const logDate = new Date(log.timestamp);
        return logDate >= startDate && logDate <= endDate;
      });
    }

    // Analyze compliance trends
    const complianceTrends = this.analyzeComplianceTrends(
      tenantId,
      relevantAuditLogs
    );

    const report = {
      reportId: `compliance-report-${Date.now()}`,
      tenantId,
      generatedAt: new Date().toISOString(),
      reportPeriod: {
        start: dateRange?.start || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        end: dateRange?.end || new Date(),
      },
      executiveSummary: {
        status: complianceState.compliant ? "COMPLIANT" : "NON-COMPLIANT",
        issueCount: complianceState.issues?.length || 0,
        riskLevel: this.calculateRiskLevel(complianceState),
      },
      detailedFindings: complianceState.checks,
      issues: complianceState.issues || [],
      trends: complianceTrends,
      auditLog: includeAuditLog ? relevantAuditLogs.slice(0, 100) : undefined,
      recommendations: this.generateRecommendations(complianceState),
    };

    logger.info(`Compliance report generated`, {
      tenantId,
      reportId: report.reportId,
      status: report.executiveSummary.status,
    });

    return report;
  }

  /**
   * Log a compliance audit trail entry
   * @param {string} action - Action performed
   * @param {string} userId - User ID performing action
   * @param {string} tenantId - Tenant ID
   * @param {Object} details - Additional details
   * @returns {Object}
   */
  auditLog(action, userId, tenantId, details = {}) {
    const entry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      action,
      userId,
      tenantId,
      details,
      ipAddress: details.ipAddress || "unknown",
      userAgent: details.userAgent || "unknown",
    };

    this.auditLogs.push(entry);

    // Keep only last 10000 entries in memory
    if (this.auditLogs.length > 10000) {
      this.auditLogs = this.auditLogs.slice(-10000);
    }

    logger.debug(`Audit log entry created`, {
      auditId: entry.id,
      action,
      userId,
      tenantId,
    });

    return entry;
  }

  /**
   * Get audit logs for tenant
   * @param {string} tenantId
   * @param {Object} filters - Filter options
   * @returns {Array}
   */
  getAuditLogs(tenantId, filters = {}) {
    let logs = this.auditLogs.filter((log) => log.tenantId === tenantId);

    if (filters.userId) {
      logs = logs.filter((log) => log.userId === filters.userId);
    }

    if (filters.action) {
      logs = logs.filter((log) => log.action === filters.action);
    }

    if (filters.startDate) {
      const start = new Date(filters.startDate);
      logs = logs.filter((log) => new Date(log.timestamp) >= start);
    }

    if (filters.endDate) {
      const end = new Date(filters.endDate);
      logs = logs.filter((log) => new Date(log.timestamp) <= end);
    }

    return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  /**
   * Export audit logs
   * @param {string} tenantId
   * @param {string} format - csv|json
   * @returns {string}
   */
  exportAuditLogs(tenantId, format = "json") {
    const logs = this.getAuditLogs(tenantId);

    if (format === "csv") {
      // Convert to CSV
      const headers = [
        "id",
        "timestamp",
        "action",
        "userId",
        "details",
        "ipAddress",
      ];
      const rows = logs.map((log) => [
        log.id,
        log.timestamp,
        log.action,
        log.userId,
        JSON.stringify(log.details),
        log.ipAddress,
      ]);

      const csv =
        headers.join(",") +
        "\n" +
        rows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");

      return csv;
    }

    // Default: JSON
    return JSON.stringify(logs, null, 2);
  }

  /**
   * PRIVATE: Check data protection compliance
   */
  checkDataProtection(tenantConfig) {
    const issues = [];

    // Check for encryption in transit
    if (!tenantConfig.enforceHTTPS) {
      issues.push({
        severity: "critical",
        message: "HTTPS enforcement not enabled",
        recommendation: "Enable HTTPS enforcement",
      });
    }

    // Check data retention policy
    if (!tenantConfig.dataRetentionDays) {
      issues.push({
        severity: "high",
        message: "Data retention policy not defined",
        recommendation: "Define data retention policy (e.g., 7 years for FERPA)",
      });
    }

    // Check for data classification
    if (!tenantConfig.dataClassification) {
      issues.push({
        severity: "medium",
        message: "Data classification not implemented",
        recommendation: "Implement data classification (public, internal, sensitive)",
      });
    }

    return {
      compliant: issues.length === 0,
      issues,
    };
  }

  /**
   * PRIVATE: Check access controls
   */
  checkAccessControls(tenantConfig) {
    const issues = [];

    // Check for role-based access control
    if (!tenantConfig.rbacEnabled) {
      issues.push({
        severity: "high",
        message: "Role-based access control not enabled",
        recommendation: "Enable RBAC",
      });
    }

    // Check for admin account lockdown
    if (!tenantConfig.mfaRequired) {
      issues.push({
        severity: "high",
        message: "MFA not required for admin accounts",
        recommendation: "Require MFA for all admin accounts",
      });
    }

    // Check for access logging
    if (!tenantConfig.accessLoggingEnabled) {
      issues.push({
        severity: "medium",
        message: "Access logging not enabled",
        recommendation: "Enable comprehensive access logging",
      });
    }

    return {
      compliant: issues.length === 0,
      issues,
    };
  }

  /**
   * PRIVATE: Check encryption
   */
  checkEncryption(tenantConfig) {
    const issues = [];

    // Check for at-rest encryption
    if (!tenantConfig.encryptionAtRest) {
      issues.push({
        severity: "high",
        message: "Encryption at rest not enabled",
        recommendation: "Enable AES-256 encryption at rest",
      });
    }

    // Check for in-transit encryption
    if (!tenantConfig.encryptionInTransit) {
      issues.push({
        severity: "high",
        message: "Encryption in transit not enforced",
        recommendation: "Enforce TLS 1.2+",
      });
    }

    // Check for key management
    if (!tenantConfig.keyManagementService) {
      issues.push({
        severity: "medium",
        message: "Key management service not configured",
        recommendation: "Use AWS KMS or similar",
      });
    }

    return {
      compliant: issues.length === 0,
      issues,
    };
  }

  /**
   * PRIVATE: Check audit logging
   */
  checkAuditLogging(tenantConfig) {
    const issues = [];

    if (!tenantConfig.auditLoggingEnabled) {
      issues.push({
        severity: "high",
        message: "Audit logging not enabled",
        recommendation: "Enable comprehensive audit logging",
      });
    }

    if (!tenantConfig.logRetentionDays) {
      issues.push({
        severity: "medium",
        message: "Log retention period not defined",
        recommendation: "Define log retention (minimum 1 year for compliance)",
      });
    }

    return {
      compliant: issues.length === 0,
      issues,
    };
  }

  /**
   * PRIVATE: Check consent management
   */
  checkConsentManagement(tenantConfig) {
    const issues = [];

    if (!tenantConfig.consentManagementEnabled) {
      issues.push({
        severity: "high",
        message: "Consent management not implemented",
        recommendation: "Implement explicit consent tracking (GDPR requirement)",
      });
    }

    if (!tenantConfig.privacyPolicyUrl) {
      issues.push({
        severity: "medium",
        message: "Privacy policy not published",
        recommendation: "Publish privacy policy URL",
      });
    }

    return {
      compliant: issues.length === 0,
      issues,
    };
  }

  /**
   * PRIVATE: Check user rights
   */
  checkUserRights(tenantConfig) {
    const issues = [];

    if (!tenantConfig.dataExportEnabled) {
      issues.push({
        severity: "high",
        message: "Data export not enabled (right to portability)",
        recommendation: "Enable user data export (GDPR requirement)",
      });
    }

    if (!tenantConfig.dataDeleteEnabled) {
      issues.push({
        severity: "high",
        message: "Data deletion not enabled (right to be forgotten)",
        recommendation: "Enable user data deletion",
      });
    }

    return {
      compliant: issues.length === 0,
      issues,
    };
  }

  /**
   * PRIVATE: Aggregate issues from checks
   */
  aggregateIssues(results) {
    const issues = [];

    for (const [checkName, result] of Object.entries(results)) {
      if (result.issues) {
        result.issues.forEach((issue) => {
          issues.push({
            ...issue,
            checkName,
          });
        });
      }
    }

    return issues.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }

  /**
   * PRIVATE: Calculate risk level
   */
  calculateRiskLevel(complianceState) {
    if (!complianceState.issues || complianceState.issues.length === 0) {
      return "LOW";
    }

    const criticalCount = complianceState.issues.filter(
      (i) => i.severity === "critical"
    ).length;
    const highCount = complianceState.issues.filter(
      (i) => i.severity === "high"
    ).length;

    if (criticalCount > 0) return "CRITICAL";
    if (highCount >= 3) return "HIGH";
    if (highCount > 0) return "MEDIUM";
    return "LOW";
  }

  /**
   * PRIVATE: Analyze compliance trends
   */
  analyzeComplianceTrends(tenantId, auditLogs) {
    const dataByDay = {};

    auditLogs.forEach((log) => {
      const date = new Date(log.timestamp).toISOString().split("T")[0];
      if (!dataByDay[date]) {
        dataByDay[date] = {
          totalActions: 0,
          successCount: 0,
          failureCount: 0,
        };
      }
      dataByDay[date].totalActions++;
      if (log.details.status === "success") {
        dataByDay[date].successCount++;
      } else if (log.details.status === "failure") {
        dataByDay[date].failureCount++;
      }
    });

    return {
      dataByDay,
      totalActions: auditLogs.length,
      uniqueUsers: new Set(auditLogs.map((l) => l.userId)).size,
    };
  }

  /**
   * PRIVATE: Generate recommendations
   */
  generateRecommendations(complianceState) {
    const recommendations = [];

    if (!complianceState.issues || complianceState.issues.length === 0) {
      recommendations.push("Maintain current compliance posture");
      return recommendations;
    }

    // Group by severity and priority
    complianceState.issues.forEach((issue) => {
      if (
        !recommendations.find((r) => r === issue.recommendation)
      ) {
        recommendations.push(issue.recommendation);
      }
    });

    return recommendations;
  }
}

module.exports = new ComplianceService();
