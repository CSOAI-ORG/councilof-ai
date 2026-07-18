import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json, decimal, index } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "watchdog_analyst", "regulator", "enterprise_admin", "compliance_officer"]).default("user").notNull(),
  // Stripe integration fields
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  subscriptionTier: mysqlEnum("subscriptionTier", ["free", "pro", "enterprise"]).default("free").notNull(),
  subscriptionStatus: mysqlEnum("subscriptionStatus", ["active", "canceled", "past_due", "trialing", "none"]).default("none").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Organizations table for B2B customers
 */
export const organizations = mysqlTable("organizations", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  industry: varchar("industry", { length: 100 }),
  size: mysqlEnum("size", ["startup", "small", "medium", "large", "enterprise"]),
  country: varchar("country", { length: 100 }),
  subscriptionTier: mysqlEnum("subscriptionTier", ["free", "professional", "enterprise"]).default("free").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Organization = typeof organizations.$inferSelect;

/**
 * AI Systems registered for compliance tracking
 */
export const aiSystems = mysqlTable("ai_systems", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId"),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  systemType: mysqlEnum("systemType", ["chatbot", "recommendation", "classification", "generation", "analysis", "other"]).notNull(),
  riskLevel: mysqlEnum("riskLevel", ["minimal", "limited", "high", "unacceptable"]).default("minimal").notNull(),
  status: mysqlEnum("status", ["draft", "active", "under_review", "compliant", "non_compliant", "archived"]).default("draft").notNull(),
  deploymentDate: timestamp("deploymentDate"),
  lastAssessmentDate: timestamp("lastAssessmentDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AISystem = typeof aiSystems.$inferSelect;

/**
 * Compliance frameworks supported by CSOAI
 */
export const frameworks = mysqlTable("frameworks", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  version: varchar("version", { length: 50 }),
  jurisdiction: varchar("jurisdiction", { length: 100 }),
  description: text("description"),
  effectiveDate: timestamp("effectiveDate"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Framework = typeof frameworks.$inferSelect;

/**
 * Compliance requirements from each framework
 */
export const requirements = mysqlTable("requirements", {
  id: int("id").autoincrement().primaryKey(),
  frameworkId: int("frameworkId").notNull(),
  articleNumber: varchar("articleNumber", { length: 50 }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  riskLevelApplicable: mysqlEnum("riskLevelApplicable", ["all", "minimal", "limited", "high", "unacceptable"]).default("all"),
  isMandatory: boolean("isMandatory").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Requirement = typeof requirements.$inferSelect;

/**
 * Compliance assessments for AI systems
 */
export const assessments = mysqlTable("assessments", {
  id: int("id").autoincrement().primaryKey(),
  aiSystemId: int("aiSystemId").notNull(),
  frameworkId: int("frameworkId").notNull(),
  assessorId: int("assessorId").notNull(),
  status: mysqlEnum("status", ["pending", "in_progress", "completed", "approved", "rejected"]).default("pending").notNull(),
  overallScore: decimal("overallScore", { precision: 5, scale: 2 }),
  findings: text("findings"),
  recommendations: text("recommendations"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Assessment = typeof assessments.$inferSelect;

/**
 * Individual requirement compliance status within an assessment
 */
export const assessmentItems = mysqlTable("assessment_items", {
  id: int("id").autoincrement().primaryKey(),
  assessmentId: int("assessmentId").notNull(),
  requirementId: int("requirementId").notNull(),
  status: mysqlEnum("status", ["not_started", "in_progress", "compliant", "non_compliant", "not_applicable"]).default("not_started").notNull(),
  evidence: text("evidence"),
  notes: text("notes"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AssessmentItem = typeof assessmentItems.$inferSelect;

/**
 * Watchdog incident reports from the public
 */
export const watchdogReports = mysqlTable("watchdog_reports", {
  id: int("id").autoincrement().primaryKey(),
  reporterId: int("reporterId"),
  reporterEmail: varchar("reporterEmail", { length: 320 }),
  reporterName: varchar("reporterName", { length: 255 }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  aiSystemName: varchar("aiSystemName", { length: 255 }),
  companyName: varchar("companyName", { length: 255 }),
  incidentType: mysqlEnum("incidentType", ["bias", "privacy", "safety", "misinformation", "manipulation", "other"]).notNull(),
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  status: mysqlEnum("status", ["submitted", "under_review", "investigating", "resolved", "dismissed"]).default("submitted").notNull(),
  upvotes: int("upvotes").default(0).notNull(),
  downvotes: int("downvotes").default(0).notNull(),
  isPublic: boolean("isPublic").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WatchdogReport = typeof watchdogReports.$inferSelect;

/**
 * Comments on watchdog reports
 */
export const watchdogComments = mysqlTable("watchdog_comments", {
  id: int("id").autoincrement().primaryKey(),
  reportId: int("reportId").notNull(),
  userId: int("userId"),
  authorName: varchar("authorName", { length: 255 }),
  content: text("content").notNull(),
  isOfficial: boolean("isOfficial").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WatchdogComment = typeof watchdogComments.$inferSelect;

/**
 * 33-Agent Council voting sessions
 */
export const councilSessions = mysqlTable("council_sessions", {
  id: int("id").autoincrement().primaryKey(),
  subjectType: mysqlEnum("subjectType", ["watchdog_report", "assessment", "policy_proposal", "system_review"]).notNull(),
  subjectId: int("subjectId").notNull(),
  subjectTitle: varchar("subjectTitle", { length: 255 }).notNull(),
  subjectDescription: text("subjectDescription"),
  status: mysqlEnum("status", ["voting", "consensus_reached", "escalated_to_human", "completed"]).default("voting").notNull(),
  consensusThreshold: decimal("consensusThreshold", { precision: 5, scale: 2 }).default("0.67").notNull(),
  totalVotes: int("totalVotes").default(0).notNull(),
  approveVotes: int("approveVotes").default(0).notNull(),
  rejectVotes: int("rejectVotes").default(0).notNull(),
  escalateVotes: int("escalateVotes").default(0).notNull(),
  finalDecision: mysqlEnum("finalDecision", ["approved", "rejected", "escalated"]),
  humanReviewerId: int("humanReviewerId"),
  humanDecision: text("humanDecision"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type CouncilSession = typeof councilSessions.$inferSelect;

/**
 * Individual agent votes in a council session
 */
export const agentVotes = mysqlTable("agent_votes", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  agentId: varchar("agentId", { length: 50 }).notNull(),
  agentType: mysqlEnum("agentType", ["guardian", "arbiter", "scribe"]).notNull(),
  agentProvider: mysqlEnum("agentProvider", ["openai", "anthropic", "google", "kimi", "deepseek"]).notNull(),
  vote: mysqlEnum("vote", ["approve", "reject", "escalate"]).notNull(),
  confidence: decimal("confidence", { precision: 5, scale: 2 }),
  reasoning: text("reasoning"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AgentVote = typeof agentVotes.$inferSelect;

/**
 * Watchdog analyst job applications (LOI collection)
 */
export const watchdogApplications = mysqlTable("watchdog_applications", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  country: varchar("country", { length: 100 }),
  timezone: varchar("timezone", { length: 100 }),
  experience: text("experience"),
  motivation: text("motivation"),
  availableHoursPerWeek: int("availableHoursPerWeek"),
  status: mysqlEnum("status", ["pending", "approved", "rejected", "waitlisted"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WatchdogApplication = typeof watchdogApplications.$inferSelect;

/**
 * PDCA Loop cycles for continuous improvement
 */
export const pdcaCycles = mysqlTable("pdca_cycles", {
  id: int("id").autoincrement().primaryKey(),
  aiSystemId: int("aiSystemId"),
  organizationId: int("organizationId"),
  cycleNumber: int("cycleNumber").default(1).notNull(),
  phase: mysqlEnum("phase", ["plan", "do", "check", "act"]).default("plan").notNull(),
  planSummary: text("planSummary"),
  doSummary: text("doSummary"),
  checkSummary: text("checkSummary"),
  actSummary: text("actSummary"),
  status: mysqlEnum("status", ["active", "completed", "paused"]).default("active").notNull(),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type PDCACycle = typeof pdcaCycles.$inferSelect;

/**
 * Audit log for compliance tracking
 */
export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entityType", { length: 100 }).notNull(),
  entityId: int("entityId"),
  details: text("details"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;


/**
 * Training modules for Watchdog Analyst certification
 */
export const trainingModules = mysqlTable("training_modules", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  content: text("content").notNull(),
  orderIndex: int("orderIndex").default(0).notNull(),
  durationMinutes: int("durationMinutes").default(30).notNull(),
  isRequired: boolean("isRequired").default(true).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TrainingModule = typeof trainingModules.$inferSelect;

/**
 * User progress through training modules
 */
export const userTrainingProgress = mysqlTable("user_training_progress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  moduleId: int("moduleId").notNull(),
  status: mysqlEnum("status", ["not_started", "in_progress", "completed"]).default("not_started").notNull(),
  progressPercent: int("progressPercent").default(0).notNull(),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserTrainingProgress = typeof userTrainingProgress.$inferSelect;

/**
 * Certification tests for Watchdog Analysts
 */
export const certificationTests = mysqlTable("certification_tests", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  passingScore: int("passingScore").default(70).notNull(),
  timeLimitMinutes: int("timeLimitMinutes").default(60).notNull(),
  totalQuestions: int("totalQuestions").default(50).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CertificationTest = typeof certificationTests.$inferSelect;

/**
 * Questions for certification tests
 */
export const testQuestions = mysqlTable("test_questions", {
  id: int("id").autoincrement().primaryKey(),
  testId: int("testId").notNull(),
  moduleId: int("moduleId"),
  questionText: text("questionText").notNull(),
  questionType: mysqlEnum("questionType", ["multiple_choice", "true_false", "scenario"]).default("multiple_choice").notNull(),
  options: json("options").notNull(),
  correctAnswer: varchar("correctAnswer", { length: 255 }).notNull(),
  explanation: text("explanation"),
  points: int("points").default(1).notNull(),
  difficulty: mysqlEnum("difficulty", ["easy", "medium", "hard"]).default("medium").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TestQuestion = typeof testQuestions.$inferSelect;

/**
 * User test attempts
 */
export const userTestAttempts = mysqlTable("user_test_attempts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  testId: int("testId").notNull(),
  score: int("score").default(0).notNull(),
  totalPoints: int("totalPoints").default(0).notNull(),
  percentScore: decimal("percentScore", { precision: 5, scale: 2 }),
  passed: boolean("passed").default(false).notNull(),
  answers: json("answers"),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserTestAttempt = typeof userTestAttempts.$inferSelect;

/**
 * Certificates issued to qualified analysts
 */
export const userCertificates = mysqlTable("user_certificates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  testId: int("testId").notNull(),
  attemptId: int("attemptId").notNull(),
  certificateNumber: varchar("certificateNumber", { length: 100 }).notNull().unique(),
  certificateType: mysqlEnum("certificateType", ["basic", "advanced", "expert"]).default("basic").notNull(),
  issuedAt: timestamp("issuedAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"),
  isRevoked: boolean("isRevoked").default(false).notNull(),
  revokedReason: text("revokedReason"),
});

export type UserCertificate = typeof userCertificates.$inferSelect;

/**
 * Training course certificates
 */
export const courseCertificates = mysqlTable("course_certificates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  courseId: int("courseId").notNull(),
  certificateId: varchar("certificateId", { length: 100 }).notNull().unique(),
  issuedAt: timestamp("issuedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CourseCertificate = typeof courseCertificates.$inferSelect;

/**
 * Case assignments for Watchdog Analysts
 */
export const caseAssignments = mysqlTable("case_assignments", {
  id: int("id").autoincrement().primaryKey(),
  analystId: int("analystId").notNull(),
  reportId: int("reportId").notNull(),
  councilSessionId: int("councilSessionId"),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  status: mysqlEnum("status", ["assigned", "in_progress", "completed", "expired", "reassigned"]).default("assigned").notNull(),
  assignedAt: timestamp("assignedAt").defaultNow().notNull(),
  dueAt: timestamp("dueAt"),
  completedAt: timestamp("completedAt"),
});

export type CaseAssignment = typeof caseAssignments.$inferSelect;

/**
 * Analyst decisions on assigned cases
 */
export const analystDecisions = mysqlTable("analyst_decisions", {
  id: int("id").autoincrement().primaryKey(),
  assignmentId: int("assignmentId").notNull(),
  analystId: int("analystId").notNull(),
  decision: mysqlEnum("decision", ["approve", "reject", "escalate", "needs_more_info"]).notNull(),
  confidence: mysqlEnum("confidence", ["low", "medium", "high"]).default("medium").notNull(),
  reasoning: text("reasoning").notNull(),
  evidenceReviewed: json("evidenceReviewed"),
  timeSpentMinutes: int("timeSpentMinutes"),
  submittedAt: timestamp("submittedAt").defaultNow().notNull(),
});

export type AnalystDecision = typeof analystDecisions.$inferSelect;

/**
 * Analyst performance metrics
 */
export const analystPerformance = mysqlTable("analyst_performance", {
  id: int("id").autoincrement().primaryKey(),
  analystId: int("analystId").notNull().unique(),
  totalCasesAssigned: int("totalCasesAssigned").default(0).notNull(),
  totalCasesCompleted: int("totalCasesCompleted").default(0).notNull(),
  totalCasesExpired: int("totalCasesExpired").default(0).notNull(),
  accuracyRate: decimal("accuracyRate", { precision: 5, scale: 2 }),
  avgResponseTimeMinutes: decimal("avgResponseTimeMinutes", { precision: 10, scale: 2 }),
  qualityScore: decimal("qualityScore", { precision: 5, scale: 2 }),
  rank: int("rank"),
  totalEarnings: decimal("totalEarnings", { precision: 10, scale: 2 }).default("0.00").notNull(),
  lastActiveAt: timestamp("lastActiveAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AnalystPerformance = typeof analystPerformance.$inferSelect;


/**
 * API Keys for enterprise integrations
 */
export const apiKeys = mysqlTable("api_keys", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  keyPrefix: varchar("keyPrefix", { length: 10 }).notNull(), // First 8 chars for identification
  keyHash: varchar("keyHash", { length: 64 }).notNull(), // SHA-256 hash of the full key
  tier: mysqlEnum("tier", ["free", "pro", "enterprise"]).default("free").notNull(),
  permissions: json("permissions").$type<string[]>(),
  rateLimit: int("rateLimit").default(100).notNull(), // Requests per minute
  lastUsedAt: timestamp("lastUsedAt"),
  expiresAt: timestamp("expiresAt"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = typeof apiKeys.$inferInsert;


/**
 * Recommendation interactions tracking
 * Stores user interactions with RLMAI recommendations
 */
export const recommendationInteractions = mysqlTable("recommendation_interactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  recommendationId: varchar("recommendationId", { length: 100 }).notNull(),
  recommendationType: varchar("recommendationType", { length: 50 }).notNull(), // e.g., "compliance_gap", "incident_prevention"
  action: mysqlEnum("action", ["viewed", "implemented", "dismissed", "snoozed"]).notNull(),
  feedback: mysqlEnum("feedback", ["helpful", "not_helpful", "irrelevant"]),
  feedbackNote: text("feedbackNote"),
  snoozeUntil: timestamp("snoozeUntil"),
  aiSystemId: int("aiSystemId"), // Optional: which AI system this recommendation was for
  frameworkId: int("frameworkId"), // Optional: which framework this relates to
  metadata: json("metadata").$type<{
    priority?: string;
    category?: string;
    title?: string;
    basedOnType?: string;
  }>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RecommendationInteraction = typeof recommendationInteractions.$inferSelect;
export type InsertRecommendationInteraction = typeof recommendationInteractions.$inferInsert;

/**
 * User recommendation preferences
 * Stores user preferences for recommendation generation
 */
export const recommendationPreferences = mysqlTable("recommendation_preferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  // Category preferences (0-100 weight, higher = more important)
  complianceGapWeight: int("complianceGapWeight").default(100).notNull(),
  incidentPreventionWeight: int("incidentPreventionWeight").default(80).notNull(),
  governanceWeight: int("governanceWeight").default(70).notNull(),
  riskMitigationWeight: int("riskMitigationWeight").default(90).notNull(),
  bestPracticeWeight: int("bestPracticeWeight").default(50).notNull(),
  regulatoryUpdateWeight: int("regulatoryUpdateWeight").default(85).notNull(),
  // Notification preferences
  emailDigestEnabled: boolean("emailDigestEnabled").default(false).notNull(),
  emailDigestFrequency: mysqlEnum("emailDigestFrequency", ["daily", "weekly", "monthly"]).default("weekly").notNull(),
  minPriorityForEmail: mysqlEnum("minPriorityForEmail", ["critical", "high", "medium", "low"]).default("high").notNull(),
  // Display preferences
  defaultLimit: int("defaultLimit").default(10).notNull(),
  showDismissedAfterDays: int("showDismissedAfterDays").default(30).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RecommendationPreference = typeof recommendationPreferences.$inferSelect;
export type InsertRecommendationPreference = typeof recommendationPreferences.$inferInsert;

/**
 * Recommendation analytics aggregates
 * Stores aggregated stats for recommendation effectiveness
 */
export const recommendationAnalytics = mysqlTable("recommendation_analytics", {
  id: int("id").autoincrement().primaryKey(),
  period: varchar("period", { length: 20 }).notNull(), // e.g., "2024-01", "2024-W52"
  periodType: mysqlEnum("periodType", ["daily", "weekly", "monthly"]).notNull(),
  totalGenerated: int("totalGenerated").default(0).notNull(),
  totalViewed: int("totalViewed").default(0).notNull(),
  totalImplemented: int("totalImplemented").default(0).notNull(),
  totalDismissed: int("totalDismissed").default(0).notNull(),
  totalSnoozed: int("totalSnoozed").default(0).notNull(),
  helpfulCount: int("helpfulCount").default(0).notNull(),
  notHelpfulCount: int("notHelpfulCount").default(0).notNull(),
  // By category breakdown (JSON for flexibility)
  byCategory: json("byCategory").$type<Record<string, {
    generated: number;
    implemented: number;
    dismissed: number;
  }>>(),
  // By priority breakdown
  byPriority: json("byPriority").$type<Record<string, {
    generated: number;
    implemented: number;
    dismissed: number;
  }>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RecommendationAnalytic = typeof recommendationAnalytics.$inferSelect;


/**
 * Regions table for global coverage
 * Defines geographic regions with specific AI regulations
 */
export const regions = mysqlTable("regions", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 10 }).notNull().unique(), // EU, US, UK, CA, AU
  name: varchar("name", { length: 100 }).notNull(), // European Union, United States, etc.
  description: text("description"),
  primaryFramework: varchar("primaryFramework", { length: 100 }), // EU AI Act, NIST AI RMF, etc.
  regulatoryBody: varchar("regulatoryBody", { length: 255 }), // European Commission, NIST, etc.
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Region = typeof regions.$inferSelect;
export type InsertRegion = typeof regions.$inferInsert;

/**
 * Specialists table for regional and industry experts
 * Three-tier hierarchy: Regional Specialist → Industry Specialist → Analysts
 */
export const specialists = mysqlTable("specialists", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Links to users table
  regionId: int("regionId").notNull(), // Links to regions table
  specialistType: mysqlEnum("specialistType", ["regional", "industry"]).notNull(),
  industry: varchar("industry", { length: 100 }), // healthcare, finance, automotive, etc. (for industry specialists)
  supervisorId: int("supervisorId"), // Links to parent specialist (industry specialists report to regional)
  certifications: json("certifications").$type<string[]>(), // Array of certification IDs
  yearsExperience: int("yearsExperience"),
  bio: text("bio"),
  baseSalary: int("baseSalary").default(5000).notNull(), // Monthly base salary in USD
  commissionRate: int("commissionRate").default(10).notNull(), // Percentage of analyst earnings
  courseCommissionRate: int("courseCommissionRate").default(20).notNull(), // Percentage of course sales
  status: mysqlEnum("status", ["active", "probation", "suspended", "inactive"]).default("probation").notNull(),
  probationStartDate: timestamp("probationStartDate"),
  probationEndDate: timestamp("probationEndDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Specialist = typeof specialists.$inferSelect;
export type InsertSpecialist = typeof specialists.$inferInsert;

/**
 * Analyst assignments table
 * Tracks which analysts are supervised by which specialists
 */
export const analystAssignments = mysqlTable("analyst_assignments", {
  id: int("id").autoincrement().primaryKey(),
  analystId: int("analystId").notNull(), // Links to users table (role: watchdog_analyst)
  specialistId: int("specialistId").notNull(), // Links to specialists table
  regionId: int("regionId").notNull(), // Links to regions table
  industry: varchar("industry", { length: 100 }), // Analyst's industry focus
  assignedAt: timestamp("assignedAt").defaultNow().notNull(),
  status: mysqlEnum("status", ["active", "suspended", "terminated"]).default("active").notNull(),
  qualityScore: int("qualityScore").default(0), // 0-100 score based on specialist reviews
  reportsCompleted: int("reportsCompleted").default(0).notNull(),
  averageTurnaroundHours: int("averageTurnaroundHours").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AnalystAssignment = typeof analystAssignments.$inferSelect;
export type InsertAnalystAssignment = typeof analystAssignments.$inferInsert;

/**
 * Courses table for regional training content
 * Monetized training courses specific to each region
 */
export const courses = mysqlTable("courses", {
  id: int("id").autoincrement().primaryKey(),
  regionId: int("regionId").notNull(), // Links to regions table
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  framework: varchar("framework", { length: 100 }), // EU AI Act, NIST AI RMF, etc.
  level: mysqlEnum("level", ["fundamentals", "advanced", "specialist"]).notNull(),
  durationHours: int("durationHours").notNull(),
  price: int("price").notNull(), // One-time price in cents (e.g., 9900 = $99.00)
  stripePriceId: varchar("stripePriceId", { length: 255 }), // Stripe Price ID for one-time payment
  // Payment plan pricing
  price3Month: int("price3Month"), // 3-month plan total price
  price6Month: int("price6Month"), // 6-month plan total price
  price12Month: int("price12Month"), // 12-month plan total price
  stripePriceId3Month: varchar("stripePriceId3Month", { length: 255 }),
  stripePriceId6Month: varchar("stripePriceId6Month", { length: 255 }),
  stripePriceId12Month: varchar("stripePriceId12Month", { length: 255 }),
  modules: json("modules").$type<Array<{
    title: string;
    description: string;
    durationMinutes: number;
    content: string;
  }>>(),
  prerequisites: json("prerequisites").$type<number[]>(), // Array of course IDs
  certificationRequired: boolean("certificationRequired").default(false).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Course = typeof courses.$inferSelect;
export type InsertCourse = typeof courses.$inferInsert;

/**
 * Course enrollments table
 * Tracks user enrollment and completion of courses
 */
export const courseEnrollments = mysqlTable("course_enrollments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  courseId: int("courseId").notNull(),
  status: mysqlEnum("status", ["enrolled", "in_progress", "completed", "failed"]).default("enrolled").notNull(),
  progress: int("progress").default(0).notNull(), // 0-100 percentage
  enrolledAt: timestamp("enrolledAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  score: int("score"), // Final exam score (0-100)
  certificateIssued: boolean("certificateIssued").default(false).notNull(),
  // Payment tracking
  paymentType: mysqlEnum("paymentType", ["one_time", "3_month", "6_month", "12_month"]).default("one_time").notNull(),
  paidAmount: int("paidAmount").default(0).notNull(), // Amount paid in cents
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  subscriptionStatus: mysqlEnum("subscriptionStatus", ["active", "cancelled", "past_due", "none"]).default("none").notNull(),
  // Referral tracking for affiliate commissions
  referredBySpecialistId: int("referredBySpecialistId"), // Links to specialists table
  commissionPaid: boolean("commissionPaid").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CourseEnrollment = typeof courseEnrollments.$inferSelect;
export type InsertCourseEnrollment = typeof courseEnrollments.$inferInsert;

/**
 * Course bundles table
 * Discounted packages of multiple courses
 */
export const courseBundles = mysqlTable("course_bundles", {
  id: int("id").autoincrement().primaryKey(),
  regionId: int("regionId").notNull(),
  name: varchar("name", { length: 255 }).notNull(), // e.g., "EU Compliance Bundle"
  description: text("description"),
  courseIds: json("courseIds").$type<number[]>().notNull(), // Array of course IDs
  regularPrice: int("regularPrice").notNull(), // Sum of individual course prices
  bundlePrice: int("bundlePrice").notNull(), // Discounted one-time price
  savings: int("savings").notNull(), // regularPrice - bundlePrice
  stripePriceId: varchar("stripePriceId", { length: 255 }),
  // Payment plan pricing for bundles
  bundlePrice3Month: int("bundlePrice3Month"),
  bundlePrice6Month: int("bundlePrice6Month"),
  bundlePrice12Month: int("bundlePrice12Month"),
  stripePriceId3Month: varchar("stripePriceId3Month", { length: 255 }),
  stripePriceId6Month: varchar("stripePriceId6Month", { length: 255 }),
  stripePriceId12Month: varchar("stripePriceId12Month", { length: 255 }),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CourseBundle = typeof courseBundles.$inferSelect;
export type InsertCourseBundle = typeof courseBundles.$inferInsert;

/**
 * Report assignments table
 * Tracks which specialist assigned which report to which analyst
 */
export const reportAssignments = mysqlTable("report_assignments", {
  id: int("id").autoincrement().primaryKey(),
  reportId: int("reportId").notNull(), // Links to watchdogReports table
  analystId: int("analystId").notNull(), // Links to users table
  specialistId: int("specialistId").notNull(), // Links to specialists table
  assignedAt: timestamp("assignedAt").defaultNow().notNull(),
  dueAt: timestamp("dueAt").notNull(), // SLA: 4 hours from assignment
  completedAt: timestamp("completedAt"),
  status: mysqlEnum("status", ["assigned", "in_progress", "completed", "escalated"]).default("assigned").notNull(),
  // Quality review by specialist
  reviewedAt: timestamp("reviewedAt"),
  qualityScore: int("qualityScore"), // 0-100 score
  specialistFeedback: text("specialistFeedback"),
  // Escalation
  escalated: boolean("escalated").default(false).notNull(),
  escalationReason: text("escalationReason"),
  escalatedTo: mysqlEnum("escalatedTo", ["regional_specialist", "council"]),
  // Earnings
  paymentAmount: int("paymentAmount"), // Amount paid to analyst in cents
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "paid"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ReportAssignment = typeof reportAssignments.$inferSelect;
export type InsertReportAssignment = typeof reportAssignments.$inferInsert;

/**
 * Specialist earnings table
 * Tracks specialist compensation (salary + commissions)
 */
export const specialistEarnings = mysqlTable("specialist_earnings", {
  id: int("id").autoincrement().primaryKey(),
  specialistId: int("specialistId").notNull(),
  period: varchar("period", { length: 20 }).notNull(), // e.g., "2024-01" for monthly
  baseSalary: int("baseSalary").notNull(), // Monthly base in cents
  analystCommissions: int("analystCommissions").default(0).notNull(), // Earnings from analyst work
  courseCommissions: int("courseCommissions").default(0).notNull(), // Earnings from course sales
  performanceBonus: int("performanceBonus").default(0).notNull(),
  totalEarnings: int("totalEarnings").notNull(), // Sum of all above
  paidAt: timestamp("paidAt"),
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "processing", "paid"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SpecialistEarning = typeof specialistEarnings.$inferSelect;
export type InsertSpecialistEarning = typeof specialistEarnings.$inferInsert;

/**
 * Learning sessions table
 * Tracks time spent by users on course modules for analytics
 */
export const learningSessions = mysqlTable("learning_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  courseId: int("courseId").notNull(),
  moduleIndex: int("moduleIndex").notNull(), // Which module (0-based)
  sessionStart: timestamp("sessionStart").notNull(),
  sessionEnd: timestamp("sessionEnd"),
  durationMinutes: int("durationMinutes").default(0).notNull(), // Calculated duration
  completed: boolean("completed").default(false).notNull(), // Did they finish the module?
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LearningSession = typeof learningSessions.$inferSelect;
export type InsertLearningSession = typeof learningSessions.$inferInsert;

/**
 * Quiz analytics table
 * Detailed tracking of quiz performance for progress analytics
 */
export const quizAnalytics = mysqlTable("quiz_analytics", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  courseId: int("courseId").notNull(),
  moduleIndex: int("moduleIndex").notNull(),
  attemptNumber: int("attemptNumber").default(1).notNull(), // How many times they tried
  score: int("score").notNull(), // 0-100 percentage
  correctAnswers: int("correctAnswers").notNull(),
  totalQuestions: int("totalQuestions").notNull(),
  timeSpentSeconds: int("timeSpentSeconds").notNull(), // Time taken to complete quiz
  passed: boolean("passed").notNull(), // Did they meet 70% threshold?
  questionResults: json("questionResults").$type<{
    questionId: string;
    correct: boolean;
    selectedAnswer: string;
    timeSpent: number;
  }[]>(), // Detailed per-question results
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type QuizAnalytic = typeof quizAnalytics.$inferSelect;
export type InsertQuizAnalytic = typeof quizAnalytics.$inferInsert;

/**
 * User recommendations table
 * Personalized course recommendations based on progress and performance
 */
export const userRecommendations = mysqlTable("user_recommendations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  recommendedCourseId: int("recommendedCourseId").notNull(),
  reason: mysqlEnum("reason", [
    "weak_area", // Low quiz scores in related topics
    "next_in_path", // Logical next course
    "advanced", // Ready for advanced level
    "framework_preference", // Matches user's framework interest
    "popular", // Trending course
    "incomplete" // User started but didn't finish
  ]).notNull(),
  reasonText: text("reasonText"), // Human-readable explanation
  priority: int("priority").default(5).notNull(), // 1-10, higher = more important
  dismissed: boolean("dismissed").default(false).notNull(), // User dismissed this recommendation
  enrolled: boolean("enrolled").default(false).notNull(), // User enrolled after seeing recommendation
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserRecommendation = typeof userRecommendations.$inferSelect;
export type InsertUserRecommendation = typeof userRecommendations.$inferInsert;

/**
 * Job postings table
 * AI Safety Analyst job opportunities
 */
export const jobPostings = mysqlTable("job_postings", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  company: varchar("company", { length: 255 }).notNull(),
  location: varchar("location", { length: 255 }).notNull(), // e.g., "Remote", "San Francisco, CA", "London, UK"
  locationType: mysqlEnum("locationType", ["remote", "hybrid", "onsite"]).default("remote").notNull(),
  country: varchar("country", { length: 100 }),
  payRate: int("payRate").notNull(), // Hourly rate in cents (e.g., 4500 = $45/hr)
  payRateMax: int("payRateMax"), // Optional max for range (e.g., $45-65/hr)
  payCurrency: varchar("payCurrency", { length: 3 }).default("USD").notNull(),
  experienceLevel: mysqlEnum("experienceLevel", ["entry", "mid", "senior", "lead"]).default("entry").notNull(),
  employmentType: mysqlEnum("employmentType", ["full_time", "part_time", "contract", "freelance"]).default("full_time").notNull(),
  description: text("description").notNull(),
  responsibilities: text("responsibilities"), // JSON array or newline-separated
  requirements: text("requirements"), // JSON array or newline-separated
  requiredCertifications: text("requiredCertifications"), // e.g., "CSOAI Foundation, NIST AI RMF"
  preferredCertifications: text("preferredCertifications"),
  benefits: text("benefits"),
  applicationUrl: varchar("applicationUrl", { length: 500 }),
  contactEmail: varchar("contactEmail", { length: 320 }),
  status: mysqlEnum("status", ["active", "closed", "draft"]).default("active").notNull(),
  postedBy: int("postedBy"), // User ID of poster (optional)
  viewCount: int("viewCount").default(0).notNull(),
  applicationCount: int("applicationCount").default(0).notNull(),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type JobPosting = typeof jobPostings.$inferSelect;
export type InsertJobPosting = typeof jobPostings.$inferInsert;

/**
 * Job applications table
 * Track user applications to job postings
 */
export const jobApplications = mysqlTable("job_applications", {
  id: int("id").autoincrement().primaryKey(),
  jobId: int("jobId").notNull(),
  userId: int("userId").notNull(),
  applicantName: varchar("applicantName", { length: 255 }).notNull(),
  applicantEmail: varchar("applicantEmail", { length: 320 }).notNull(),
  resumeUrl: varchar("resumeUrl", { length: 500 }),
  coverLetter: text("coverLetter"),
  certifications: text("certifications"), // List of CSOAI certifications
  yearsExperience: int("yearsExperience"),
  status: mysqlEnum("status", ["submitted", "reviewing", "shortlisted", "rejected", "accepted"]).default("submitted").notNull(),
  notes: text("notes"), // Internal notes from reviewer
  employerResponse: text("employerResponse"),
  statusUpdatedAt: timestamp("statusUpdatedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type JobApplication = typeof jobApplications.$inferSelect;
export type InsertJobApplication = typeof jobApplications.$inferInsert;

/**
 * Notifications table
 * In-app notifications for users
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", [
    "compliance_alert",
    "system_update",
    "job_application",
    "certificate_issued",
    "council_decision",
    "report_update",
  ]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  link: varchar("link", { length: 500 }),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  readAt: timestamp("readAt"),
  metadata: json("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdIsReadIdx: index("idx_userId_isRead").on(table.userId, table.isRead),
  createdAtIdx: index("idx_createdAt").on(table.createdAt),
}));

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Notification preferences table
 * User preferences for notification delivery
 */
export const notificationPreferences = mysqlTable("notification_preferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  emailEnabled: boolean("emailEnabled").default(true).notNull(),
  slackEnabled: boolean("slackEnabled").default(false).notNull(),
  slackWebhookUrl: varchar("slackWebhookUrl", { length: 500 }),
  complianceAlerts: boolean("complianceAlerts").default(true).notNull(),
  systemUpdates: boolean("systemUpdates").default(true).notNull(),
  jobApplications: boolean("jobApplications").default(true).notNull(),
  certificateIssued: boolean("certificateIssued").default(true).notNull(),
  councilDecisions: boolean("councilDecisions").default(true).notNull(),
  reportUpdates: boolean("reportUpdates").default(true).notNull(),
  digestEnabled: boolean("digestEnabled").default(false).notNull(),
  digestFrequency: mysqlEnum("digestFrequency", ["daily", "weekly"]).default("daily").notNull(),
  lastDigestSentAt: timestamp("lastDigestSentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreference = typeof notificationPreferences.$inferInsert;
