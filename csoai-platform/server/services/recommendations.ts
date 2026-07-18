/**
 * RLMAI Recommendations Engine
 * 
 * Analyzes council decisions, incident patterns, and compliance data
 * to generate personalized compliance recommendations for users.
 */

import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { 
  watchdogReports, 
  councilSessions, 
  agentVotes,
  aiSystems,
  assessments,
  assessmentItems,
  frameworks,
  pdcaCycles,
  recommendationInteractions,
  recommendationPreferences,
  recommendationAnalytics,
} from "../drizzle/schema";
import { eq, desc, sql, and, inArray, isNull, or } from "drizzle-orm";

// Recommendation types and priorities
type RecommendationPriority = "critical" | "high" | "medium" | "low";
type RecommendationCategory = 
  | "compliance_gap" 
  | "incident_prevention" 
  | "governance_improvement" 
  | "risk_mitigation"
  | "best_practice"
  | "regulatory_update";

interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: RecommendationPriority;
  category: RecommendationCategory;
  framework?: string;
  aiSystemId?: number;
  aiSystemName?: string;
  actionItems: string[];
  basedOn: {
    type: "incident_pattern" | "council_decision" | "compliance_gap" | "industry_trend";
    details: string;
  };
  estimatedEffort: "low" | "medium" | "high";
  potentialImpact: "low" | "medium" | "high";
  createdAt: string;
}

// Framework-specific recommendation templates
const FRAMEWORK_RECOMMENDATIONS: Record<string, { title: string; description: string; actionItems: string[] }[]> = {
  "EU AI Act": [
    {
      title: "Implement Human Oversight Mechanisms",
      description: "EU AI Act Article 14 requires human oversight for high-risk AI systems. Ensure your system has appropriate human-in-the-loop controls.",
      actionItems: [
        "Designate human operators responsible for AI system oversight",
        "Implement pause/override controls for automated decisions",
        "Create escalation procedures for edge cases",
        "Document human oversight processes"
      ]
    },
    {
      title: "Establish Transparency Documentation",
      description: "Article 13 requires clear documentation of AI system capabilities and limitations for users.",
      actionItems: [
        "Create user-facing documentation explaining AI capabilities",
        "Document known limitations and failure modes",
        "Implement clear AI disclosure notices",
        "Maintain technical documentation for regulators"
      ]
    },
    {
      title: "Conduct Bias and Fairness Audit",
      description: "Article 10 requires training data to be representative and free from bias.",
      actionItems: [
        "Audit training data for demographic representation",
        "Test model outputs across different user groups",
        "Document bias mitigation measures",
        "Establish ongoing monitoring for discriminatory outcomes"
      ]
    }
  ],
  "NIST AI RMF": [
    {
      title: "Implement Risk Assessment Framework",
      description: "NIST AI RMF MAP function requires systematic identification and assessment of AI risks.",
      actionItems: [
        "Conduct comprehensive AI risk assessment",
        "Document risk tolerance levels for each use case",
        "Create risk mitigation strategies",
        "Establish risk monitoring dashboards"
      ]
    },
    {
      title: "Establish AI Governance Structure",
      description: "GOVERN function requires clear organizational accountability for AI systems.",
      actionItems: [
        "Define AI governance roles and responsibilities",
        "Create AI ethics committee or review board",
        "Establish AI policy documentation",
        "Implement regular governance reviews"
      ]
    },
    {
      title: "Deploy Continuous Monitoring",
      description: "MEASURE function requires ongoing measurement of AI system performance and impacts.",
      actionItems: [
        "Implement performance monitoring dashboards",
        "Track key safety and fairness metrics",
        "Set up automated alerting for anomalies",
        "Schedule regular model performance reviews"
      ]
    }
  ],
  "TC260": [
    {
      title: "Implement Content Safety Controls",
      description: "TC260 requires robust content safety measures for generative AI systems.",
      actionItems: [
        "Deploy content filtering for harmful outputs",
        "Implement prompt injection protections",
        "Create content moderation workflows",
        "Document safety testing procedures"
      ]
    },
    {
      title: "Establish Data Security Measures",
      description: "TC260 requires comprehensive data protection for AI training and inference.",
      actionItems: [
        "Implement data encryption at rest and in transit",
        "Establish data access controls and audit logs",
        "Create data retention and deletion policies",
        "Document data handling procedures"
      ]
    }
  ]
};

// Incident type to recommendation mapping
const INCIDENT_RECOMMENDATIONS: Record<string, { title: string; description: string; actionItems: string[] }> = {
  bias: {
    title: "Address Algorithmic Bias Risks",
    description: "Based on industry incident patterns, bias-related issues are a significant risk. Implement proactive bias detection and mitigation.",
    actionItems: [
      "Conduct bias audit across all AI decision points",
      "Implement fairness metrics monitoring",
      "Diversify training data sources",
      "Establish bias incident response procedures"
    ]
  },
  privacy: {
    title: "Strengthen Privacy Protections",
    description: "Privacy violations are a common incident type. Enhance data protection measures to prevent unauthorized data exposure.",
    actionItems: [
      "Review data minimization practices",
      "Implement differential privacy techniques",
      "Audit data access patterns",
      "Strengthen consent management"
    ]
  },
  safety: {
    title: "Enhance Safety Controls",
    description: "Safety failures can have severe consequences. Implement robust safety measures and fail-safes.",
    actionItems: [
      "Conduct safety-critical scenario testing",
      "Implement redundant safety systems",
      "Create emergency shutdown procedures",
      "Document operational design domain"
    ]
  },
  misinformation: {
    title: "Implement Misinformation Safeguards",
    description: "AI-generated misinformation is a growing concern. Deploy content verification and provenance measures.",
    actionItems: [
      "Implement content provenance tracking",
      "Deploy fact-checking integration",
      "Add AI-generated content watermarking",
      "Create misinformation response protocols"
    ]
  },
  manipulation: {
    title: "Prevent Manipulative AI Behaviors",
    description: "AI systems can inadvertently enable manipulation. Implement safeguards against dark patterns and deceptive practices.",
    actionItems: [
      "Audit recommendation algorithms for manipulation risks",
      "Implement user agency protections",
      "Review engagement optimization practices",
      "Create ethical design guidelines"
    ]
  },
  other: {
    title: "General AI Safety Review",
    description: "Conduct a comprehensive review of AI safety practices based on emerging incident patterns.",
    actionItems: [
      "Review all AI system documentation",
      "Conduct stakeholder impact assessment",
      "Update incident response procedures",
      "Schedule regular safety audits"
    ]
  }
};

export const recommendationsRouter = router({
  // Get personalized recommendations for the user
  getRecommendations: protectedProcedure
    .input(z.object({
      aiSystemId: z.number().optional(),
      limit: z.number().min(1).max(50).default(10),
      category: z.enum([
        "compliance_gap",
        "incident_prevention", 
        "governance_improvement",
        "risk_mitigation",
        "best_practice",
        "regulatory_update"
      ]).optional(),
      priority: z.enum(["critical", "high", "medium", "low"]).optional(),
      includeDismissed: z.boolean().default(false),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      let recommendations: Recommendation[] = [];

      // Get user's dismissed and snoozed recommendations for filtering
      const dismissedInteractions = db ? await db
        .select({ recommendationId: recommendationInteractions.recommendationId })
        .from(recommendationInteractions)
        .where(and(
          eq(recommendationInteractions.userId, ctx.user.id),
          eq(recommendationInteractions.action, "dismissed")
        )) : [];
      
      const snoozedInteractions = db ? await db
        .select({ 
          recommendationId: recommendationInteractions.recommendationId,
          snoozeUntil: recommendationInteractions.snoozeUntil,
        })
        .from(recommendationInteractions)
        .where(and(
          eq(recommendationInteractions.userId, ctx.user.id),
          eq(recommendationInteractions.action, "snoozed")
        )) : [];

      const dismissedIds = new Set(dismissedInteractions.map(d => d.recommendationId));
      const now = new Date();
      const activeSnoozedIds = new Set(
        snoozedInteractions
          .filter(s => s.snoozeUntil && new Date(s.snoozeUntil) > now)
          .map(s => s.recommendationId)
      );

      // Get user's preferences for category weighting
      const userPrefs = db ? await db
        .select()
        .from(recommendationPreferences)
        .where(eq(recommendationPreferences.userId, ctx.user.id))
        .limit(1) : [];

      const prefs = userPrefs[0] || {
        complianceGapWeight: 100,
        incidentPreventionWeight: 80,
        governanceWeight: 70,
        riskMitigationWeight: 90,
        bestPracticeWeight: 50,
        regulatoryUpdateWeight: 85,
      };

      // Get user's frequently dismissed categories to deprioritize
      const dismissedByCategory = db ? await db
        .select({
          category: recommendationInteractions.recommendationType,
          count: sql<number>`count(*)`,
        })
        .from(recommendationInteractions)
        .where(and(
          eq(recommendationInteractions.userId, ctx.user.id),
          eq(recommendationInteractions.action, "dismissed")
        ))
        .groupBy(recommendationInteractions.recommendationType) : [];

      const dismissedCategoryCounts = Object.fromEntries(
        dismissedByCategory.map(d => [d.category, Number(d.count)])
      );
      
      // Get user's AI systems
      const userSystems = db ? await db
        .select()
        .from(aiSystems)
        .where(eq(aiSystems.userId, ctx.user.id)) : [];

      // Get incident patterns from public data
      const incidentPatterns = db ? await db
        .select({
          incidentType: watchdogReports.incidentType,
          count: sql<number>`count(*)`,
          avgSeverity: sql<number>`AVG(CASE 
            WHEN severity = 'critical' THEN 4 
            WHEN severity = 'high' THEN 3 
            WHEN severity = 'medium' THEN 2 
            ELSE 1 END)`,
        })
        .from(watchdogReports)
        .where(eq(watchdogReports.isPublic, true))
        .groupBy(watchdogReports.incidentType) : [];

      // Get council decision patterns
      const councilPatterns = db ? await db
        .select({
          finalDecision: councilSessions.finalDecision,
          count: sql<number>`count(*)`,
        })
        .from(councilSessions)
        .where(sql`${councilSessions.finalDecision} IS NOT NULL`)
        .groupBy(councilSessions.finalDecision) : [];

      // Get user's assessment gaps
      const systemIds = userSystems.map(s => s.id);
      const assessmentGaps = systemIds.length > 0 && db ? await db
        .select({
          aiSystemId: assessments.aiSystemId,
          frameworkId: assessments.frameworkId,
          overallScore: assessments.overallScore,
          status: assessments.status,
        })
        .from(assessments)
        .where(sql`${assessments.aiSystemId} IN (${sql.join(systemIds, sql`, `)})`) : [];

      // Get frameworks for reference
      const frameworkList = db ? await db.select().from(frameworks) : [];
      const frameworkMap = new Map(frameworkList.map(f => [f.id, f]));

      // Generate recommendations based on incident patterns
      const sortedIncidents = [...incidentPatterns].sort((a, b) => 
        (Number(b.avgSeverity) * Number(b.count)) - (Number(a.avgSeverity) * Number(a.count))
      );

      for (const incident of sortedIncidents.slice(0, 3)) {
        const template = INCIDENT_RECOMMENDATIONS[incident.incidentType] || INCIDENT_RECOMMENDATIONS.other;
        const priority = Number(incident.avgSeverity) >= 3 ? "high" : Number(incident.avgSeverity) >= 2 ? "medium" : "low";
        
        recommendations.push({
          id: `incident-${incident.incidentType}-${Date.now()}`,
          title: template.title,
          description: template.description,
          priority: priority as RecommendationPriority,
          category: "incident_prevention",
          actionItems: template.actionItems,
          basedOn: {
            type: "incident_pattern",
            details: `${incident.count} ${incident.incidentType} incidents reported with average severity ${Number(incident.avgSeverity).toFixed(1)}/4`
          },
          estimatedEffort: "medium",
          potentialImpact: priority === "high" ? "high" : "medium",
          createdAt: new Date().toISOString(),
        });
      }

      // Generate recommendations based on compliance gaps
      for (const system of userSystems) {
        const systemAssessments = assessmentGaps.filter(a => a.aiSystemId === system.id);
        
        // Check for missing framework assessments
        for (const framework of frameworkList) {
          const hasAssessment = systemAssessments.some(a => a.frameworkId === framework.id);
          if (!hasAssessment) {
            const frameworkRecs = FRAMEWORK_RECOMMENDATIONS[framework.name] || [];
            if (frameworkRecs.length > 0) {
              const template = frameworkRecs[0];
              recommendations.push({
                id: `compliance-${system.id}-${framework.id}-${Date.now()}`,
                title: `${framework.name} Compliance Assessment Required`,
                description: `Your AI system "${system.name}" has not been assessed against ${framework.name}. ${template.description}`,
                priority: system.riskLevel === "high" ? "critical" : system.riskLevel === "limited" ? "high" : "medium",
                category: "compliance_gap",
                framework: framework.name,
                aiSystemId: system.id,
                aiSystemName: system.name,
                actionItems: [
                  `Schedule ${framework.name} compliance assessment`,
                  ...template.actionItems.slice(0, 2)
                ],
                basedOn: {
                  type: "compliance_gap",
                  details: `No ${framework.name} assessment found for ${system.name}`
                },
                estimatedEffort: "high",
                potentialImpact: "high",
                createdAt: new Date().toISOString(),
              });
            }
          }
        }

        // Check for low-scoring assessments
        for (const assessment of systemAssessments) {
          const score = Number(assessment.overallScore) || 0;
          if (score < 70 && assessment.status === "completed") {
            const framework = frameworkMap.get(assessment.frameworkId);
            if (framework) {
              const frameworkRecs = FRAMEWORK_RECOMMENDATIONS[framework.name] || [];
              const template = frameworkRecs[Math.floor(Math.random() * frameworkRecs.length)];
              
              recommendations.push({
                id: `improvement-${system.id}-${framework.id}-${Date.now()}`,
                title: `Improve ${framework.name} Compliance Score`,
                description: `Your AI system "${system.name}" scored ${score}% on ${framework.name} assessment. ${template?.description || "Improvement actions are recommended."}`,
                priority: score < 50 ? "critical" : score < 60 ? "high" : "medium",
                category: "compliance_gap",
                framework: framework.name,
                aiSystemId: system.id,
                aiSystemName: system.name,
                actionItems: template?.actionItems || [
                  "Review assessment findings",
                  "Address non-compliant items",
                  "Schedule reassessment"
                ],
                basedOn: {
                  type: "compliance_gap",
                  details: `${framework.name} compliance score: ${score}%`
                },
                estimatedEffort: score < 50 ? "high" : "medium",
                potentialImpact: "high",
                createdAt: new Date().toISOString(),
              });
            }
          }
        }

        // Risk-based recommendations for high-risk systems
        if (system.riskLevel === "high" || system.riskLevel === "unacceptable") {
          recommendations.push({
            id: `risk-${system.id}-${Date.now()}`,
            title: "High-Risk AI System Review Required",
            description: `Your AI system "${system.name}" is classified as ${system.riskLevel} risk. Enhanced governance and oversight measures are required.`,
            priority: "critical",
            category: "risk_mitigation",
            aiSystemId: system.id,
            aiSystemName: system.name,
            actionItems: [
              "Conduct comprehensive risk assessment",
              "Implement enhanced human oversight",
              "Establish incident response procedures",
              "Schedule regular compliance audits",
              "Document risk mitigation measures"
            ],
            basedOn: {
              type: "industry_trend",
              details: `${system.riskLevel} risk classification requires enhanced governance`
            },
            estimatedEffort: "high",
            potentialImpact: "high",
            createdAt: new Date().toISOString(),
          });
        }
      }

      // Generate governance recommendations based on council patterns
      const rejectionRate = councilPatterns.length > 0
        ? (councilPatterns.find(p => p.finalDecision === "rejected")?.count || 0) / 
          councilPatterns.reduce((sum, p) => sum + Number(p.count), 0)
        : 0;

      if (rejectionRate > 0.3) {
        recommendations.push({
          id: `governance-council-${Date.now()}`,
          title: "Strengthen Pre-Submission Review Process",
          description: "Council rejection rates indicate opportunities to improve submission quality through better pre-review processes.",
          priority: "medium",
          category: "governance_improvement",
          actionItems: [
            "Implement internal review checklist before council submission",
            "Create peer review process for compliance documentation",
            "Establish quality gates for assessment submissions",
            "Train team on common rejection reasons"
          ],
          basedOn: {
            type: "council_decision",
            details: `${Math.round(rejectionRate * 100)}% council rejection rate observed`
          },
          estimatedEffort: "medium",
          potentialImpact: "medium",
          createdAt: new Date().toISOString(),
        });
      }

      // Add best practice recommendations
      if (userSystems.length > 0) {
        recommendations.push({
          id: `best-practice-pdca-${Date.now()}`,
          title: "Implement PDCA Continuous Improvement",
          description: "Establish Plan-Do-Check-Act cycles for ongoing AI safety and compliance improvement.",
          priority: "low",
          category: "best_practice",
          actionItems: [
            "Create PDCA cycle for each AI system",
            "Define measurable improvement goals",
            "Schedule regular check phases",
            "Document lessons learned in act phase"
          ],
          basedOn: {
            type: "industry_trend",
            details: "PDCA methodology is industry best practice for continuous improvement"
          },
          estimatedEffort: "medium",
          potentialImpact: "high",
          createdAt: new Date().toISOString(),
        });
      }

      // Filter out dismissed and snoozed recommendations (unless includeDismissed is true)
      let filteredRecs = recommendations;
      
      if (!input?.includeDismissed) {
        filteredRecs = filteredRecs.filter(r => 
          !dismissedIds.has(r.id) && !activeSnoozedIds.has(r.id)
        );
      }
      
      if (input?.aiSystemId) {
        filteredRecs = filteredRecs.filter(r => !r.aiSystemId || r.aiSystemId === input.aiSystemId);
      }
      
      if (input?.category) {
        filteredRecs = filteredRecs.filter(r => r.category === input.category);
      }
      
      if (input?.priority) {
        filteredRecs = filteredRecs.filter(r => r.priority === input.priority);
      }

      // Calculate weight for each recommendation based on user preferences
      const categoryWeights: Record<string, number> = {
        compliance_gap: prefs.complianceGapWeight,
        incident_prevention: prefs.incidentPreventionWeight,
        governance_improvement: prefs.governanceWeight,
        risk_mitigation: prefs.riskMitigationWeight,
        best_practice: prefs.bestPracticeWeight,
        regulatory_update: prefs.regulatoryUpdateWeight,
      };

      // Sort by priority first, then by category weight (adjusted by dismissal frequency)
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      filteredRecs.sort((a, b) => {
        // Primary sort: priority
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        
        // Secondary sort: category weight (higher weight = more important)
        const aWeight = categoryWeights[a.category] || 50;
        const bWeight = categoryWeights[b.category] || 50;
        
        // Reduce weight for frequently dismissed categories
        const aDismissedPenalty = (dismissedCategoryCounts[a.category] || 0) * 5;
        const bDismissedPenalty = (dismissedCategoryCounts[b.category] || 0) * 5;
        
        const aAdjustedWeight = aWeight - aDismissedPenalty;
        const bAdjustedWeight = bWeight - bDismissedPenalty;
        
        return bAdjustedWeight - aAdjustedWeight; // Higher weight first
      });

      return {
        recommendations: filteredRecs.slice(0, input?.limit || 10),
        totalCount: filteredRecs.length,
        summary: {
          critical: filteredRecs.filter(r => r.priority === "critical").length,
          high: filteredRecs.filter(r => r.priority === "high").length,
          medium: filteredRecs.filter(r => r.priority === "medium").length,
          low: filteredRecs.filter(r => r.priority === "low").length,
        },
        dismissedCount: dismissedIds.size,
        snoozedCount: activeSnoozedIds.size,
        generatedAt: new Date().toISOString(),
      };
    }),

  // Get recommendation categories and counts
  getCategories: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    
    // Get user's systems to determine applicable categories
    const userSystems = db ? await db
      .select()
      .from(aiSystems)
      .where(eq(aiSystems.userId, ctx.user.id)) : [];

    return {
      categories: [
        { 
          id: "compliance_gap", 
          name: "Compliance Gaps", 
          description: "Address missing or incomplete compliance requirements",
          icon: "shield-alert"
        },
        { 
          id: "incident_prevention", 
          name: "Incident Prevention", 
          description: "Proactive measures based on industry incident patterns",
          icon: "alert-triangle"
        },
        { 
          id: "governance_improvement", 
          name: "Governance Improvement", 
          description: "Enhance organizational AI governance practices",
          icon: "building"
        },
        { 
          id: "risk_mitigation", 
          name: "Risk Mitigation", 
          description: "Address identified risks in AI systems",
          icon: "shield"
        },
        { 
          id: "best_practice", 
          name: "Best Practices", 
          description: "Industry-recommended practices for AI safety",
          icon: "star"
        },
        { 
          id: "regulatory_update", 
          name: "Regulatory Updates", 
          description: "New or updated regulatory requirements",
          icon: "file-text"
        },
      ],
      systemCount: userSystems.length,
    };
  }),

  // Get public recommendations (industry-wide, no auth required)
  getPublicRecommendations: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(20).default(5),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      const recommendations: Recommendation[] = [];

      // Get incident patterns
      const incidentPatterns = db ? await db
        .select({
          incidentType: watchdogReports.incidentType,
          count: sql<number>`count(*)`,
          avgSeverity: sql<number>`AVG(CASE 
            WHEN severity = 'critical' THEN 4 
            WHEN severity = 'high' THEN 3 
            WHEN severity = 'medium' THEN 2 
            ELSE 1 END)`,
        })
        .from(watchdogReports)
        .where(eq(watchdogReports.isPublic, true))
        .groupBy(watchdogReports.incidentType) : [];

      // Generate public recommendations based on top incident types
      const sortedIncidents = [...incidentPatterns].sort((a, b) => 
        (Number(b.avgSeverity) * Number(b.count)) - (Number(a.avgSeverity) * Number(a.count))
      );

      for (const incident of sortedIncidents.slice(0, input?.limit || 5)) {
        const template = INCIDENT_RECOMMENDATIONS[incident.incidentType] || INCIDENT_RECOMMENDATIONS.other;
        const priority = Number(incident.avgSeverity) >= 3 ? "high" : Number(incident.avgSeverity) >= 2 ? "medium" : "low";
        
        recommendations.push({
          id: `public-${incident.incidentType}-${Date.now()}`,
          title: template.title,
          description: template.description,
          priority: priority as RecommendationPriority,
          category: "incident_prevention",
          actionItems: template.actionItems,
          basedOn: {
            type: "incident_pattern",
            details: `Based on ${incident.count} reported ${incident.incidentType} incidents`
          },
          estimatedEffort: "medium",
          potentialImpact: priority === "high" ? "high" : "medium",
          createdAt: new Date().toISOString(),
        });
      }

      return {
        recommendations,
        generatedAt: new Date().toISOString(),
      };
    }),

  // ============================================
  // TRACKING ENDPOINTS
  // ============================================

  // Track a user interaction with a recommendation
  trackInteraction: protectedProcedure
    .input(z.object({
      recommendationId: z.string(),
      recommendationType: z.string(),
      action: z.enum(["viewed", "implemented", "dismissed", "snoozed"]),
      feedback: z.enum(["helpful", "not_helpful", "irrelevant"]).optional(),
      feedbackNote: z.string().optional(),
      snoozeDays: z.number().min(1).max(90).optional(),
      aiSystemId: z.number().optional(),
      frameworkId: z.number().optional(),
      metadata: z.object({
        priority: z.string().optional(),
        category: z.string().optional(),
        title: z.string().optional(),
        basedOnType: z.string().optional(),
      }).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const snoozeUntil = input.action === "snoozed" && input.snoozeDays
        ? new Date(Date.now() + input.snoozeDays * 24 * 60 * 60 * 1000)
        : null;

      await db.insert(recommendationInteractions).values({
        userId: ctx.user.id,
        recommendationId: input.recommendationId,
        recommendationType: input.recommendationType,
        action: input.action,
        feedback: input.feedback,
        feedbackNote: input.feedbackNote,
        snoozeUntil,
        aiSystemId: input.aiSystemId,
        frameworkId: input.frameworkId,
        metadata: input.metadata,
      });

      // Update analytics
      const now = new Date();
      const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      
      // Try to update existing analytics record, or create new one
      const existingAnalytics = await db
        .select()
        .from(recommendationAnalytics)
        .where(and(
          eq(recommendationAnalytics.period, period),
          eq(recommendationAnalytics.periodType, "monthly")
        ))
        .limit(1);

      if (existingAnalytics.length > 0) {
        const updates: Record<string, any> = {};
        if (input.action === "viewed") updates.totalViewed = sql`${recommendationAnalytics.totalViewed} + 1`;
        if (input.action === "implemented") updates.totalImplemented = sql`${recommendationAnalytics.totalImplemented} + 1`;
        if (input.action === "dismissed") updates.totalDismissed = sql`${recommendationAnalytics.totalDismissed} + 1`;
        if (input.action === "snoozed") updates.totalSnoozed = sql`${recommendationAnalytics.totalSnoozed} + 1`;
        if (input.feedback === "helpful") updates.helpfulCount = sql`${recommendationAnalytics.helpfulCount} + 1`;
        if (input.feedback === "not_helpful") updates.notHelpfulCount = sql`${recommendationAnalytics.notHelpfulCount} + 1`;

        if (Object.keys(updates).length > 0) {
          await db
            .update(recommendationAnalytics)
            .set(updates)
            .where(eq(recommendationAnalytics.id, existingAnalytics[0].id));
        }
      } else {
        await db.insert(recommendationAnalytics).values({
          period,
          periodType: "monthly",
          totalViewed: input.action === "viewed" ? 1 : 0,
          totalImplemented: input.action === "implemented" ? 1 : 0,
          totalDismissed: input.action === "dismissed" ? 1 : 0,
          totalSnoozed: input.action === "snoozed" ? 1 : 0,
          helpfulCount: input.feedback === "helpful" ? 1 : 0,
          notHelpfulCount: input.feedback === "not_helpful" ? 1 : 0,
        });
      }

      return { success: true };
    }),

  // Get user's interaction history
  getInteractionHistory: protectedProcedure
    .input(z.object({
      action: z.enum(["viewed", "implemented", "dismissed", "snoozed"]).optional(),
      limit: z.number().min(1).max(100).default(50),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      let query = db
        .select()
        .from(recommendationInteractions)
        .where(eq(recommendationInteractions.userId, ctx.user.id))
        .orderBy(desc(recommendationInteractions.createdAt))
        .limit(input?.limit || 50);

      const interactions = await query;

      // Filter by action if specified
      const filtered = input?.action
        ? interactions.filter(i => i.action === input.action)
        : interactions;

      return filtered;
    }),

  // Get dismissed recommendation IDs (for filtering)
  getDismissedIds: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { dismissedIds: [], snoozedIds: [] };

    const now = new Date();

    // Get dismissed recommendations
    const dismissed = await db
      .select({ recommendationId: recommendationInteractions.recommendationId })
      .from(recommendationInteractions)
      .where(and(
        eq(recommendationInteractions.userId, ctx.user.id),
        eq(recommendationInteractions.action, "dismissed")
      ));

    // Get snoozed recommendations that are still active
    const snoozed = await db
      .select({ 
        recommendationId: recommendationInteractions.recommendationId,
        snoozeUntil: recommendationInteractions.snoozeUntil,
      })
      .from(recommendationInteractions)
      .where(and(
        eq(recommendationInteractions.userId, ctx.user.id),
        eq(recommendationInteractions.action, "snoozed")
      ));

    const activeSnoozed = snoozed
      .filter(s => s.snoozeUntil && new Date(s.snoozeUntil) > now)
      .map(s => s.recommendationId);

    return {
      dismissedIds: dismissed.map(d => d.recommendationId),
      snoozedIds: activeSnoozed,
    };
  }),

  // Get recommendation statistics for the user
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;

    const interactions = await db
      .select({
        action: recommendationInteractions.action,
        count: sql<number>`count(*)`,
      })
      .from(recommendationInteractions)
      .where(eq(recommendationInteractions.userId, ctx.user.id))
      .groupBy(recommendationInteractions.action);

    const feedbackStats = await db
      .select({
        feedback: recommendationInteractions.feedback,
        count: sql<number>`count(*)`,
      })
      .from(recommendationInteractions)
      .where(and(
        eq(recommendationInteractions.userId, ctx.user.id),
        sql`${recommendationInteractions.feedback} IS NOT NULL`
      ))
      .groupBy(recommendationInteractions.feedback);

    const byCategory = await db
      .select({
        category: recommendationInteractions.recommendationType,
        action: recommendationInteractions.action,
        count: sql<number>`count(*)`,
      })
      .from(recommendationInteractions)
      .where(eq(recommendationInteractions.userId, ctx.user.id))
      .groupBy(recommendationInteractions.recommendationType, recommendationInteractions.action);

    return {
      totalInteractions: interactions.reduce((sum, i) => sum + Number(i.count), 0),
      byAction: Object.fromEntries(interactions.map(i => [i.action, Number(i.count)])),
      byFeedback: Object.fromEntries(feedbackStats.map(f => [f.feedback, Number(f.count)])),
      byCategory,
      implementationRate: (() => {
        const viewed = interactions.find(i => i.action === "viewed")?.count || 0;
        const implemented = interactions.find(i => i.action === "implemented")?.count || 0;
        return Number(viewed) > 0 ? Math.round((Number(implemented) / Number(viewed)) * 100) : 0;
      })(),
    };
  }),

  // Get/update user preferences
  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;

    const prefs = await db
      .select()
      .from(recommendationPreferences)
      .where(eq(recommendationPreferences.userId, ctx.user.id))
      .limit(1);

    if (prefs.length === 0) {
      // Return defaults
      return {
        complianceGapWeight: 100,
        incidentPreventionWeight: 80,
        governanceWeight: 70,
        riskMitigationWeight: 90,
        bestPracticeWeight: 50,
        regulatoryUpdateWeight: 85,
        emailDigestEnabled: false,
        emailDigestFrequency: "weekly" as const,
        minPriorityForEmail: "high" as const,
        defaultLimit: 10,
        showDismissedAfterDays: 30,
      };
    }

    return prefs[0];
  }),

  updatePreferences: protectedProcedure
    .input(z.object({
      complianceGapWeight: z.number().min(0).max(100).optional(),
      incidentPreventionWeight: z.number().min(0).max(100).optional(),
      governanceWeight: z.number().min(0).max(100).optional(),
      riskMitigationWeight: z.number().min(0).max(100).optional(),
      bestPracticeWeight: z.number().min(0).max(100).optional(),
      regulatoryUpdateWeight: z.number().min(0).max(100).optional(),
      emailDigestEnabled: z.boolean().optional(),
      emailDigestFrequency: z.enum(["daily", "weekly", "monthly"]).optional(),
      minPriorityForEmail: z.enum(["critical", "high", "medium", "low"]).optional(),
      defaultLimit: z.number().min(5).max(50).optional(),
      showDismissedAfterDays: z.number().min(7).max(365).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const existing = await db
        .select()
        .from(recommendationPreferences)
        .where(eq(recommendationPreferences.userId, ctx.user.id))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(recommendationPreferences).values({
          userId: ctx.user.id,
          ...input,
        });
      } else {
        await db
          .update(recommendationPreferences)
          .set(input)
          .where(eq(recommendationPreferences.userId, ctx.user.id));
      }

      return { success: true };
    }),

  // Get analytics (admin only or for own data)
  getAnalytics: protectedProcedure
    .input(z.object({
      periodType: z.enum(["daily", "weekly", "monthly"]).default("monthly"),
      limit: z.number().min(1).max(12).default(6),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const analytics = await db
        .select()
        .from(recommendationAnalytics)
        .where(eq(recommendationAnalytics.periodType, input?.periodType || "monthly"))
        .orderBy(desc(recommendationAnalytics.period))
        .limit(input?.limit || 6);

      return analytics;
    }),
});
