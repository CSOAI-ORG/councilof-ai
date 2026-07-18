/**
 * Public API for Transparency Data
 * 
 * These endpoints are accessible without authentication and provide
 * aggregated, anonymized data for public transparency.
 */

import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { 
  watchdogReports, 
  councilSessions, 
  agentVotes,
  frameworks,
  aiSystems,
  assessments,
} from "../drizzle/schema";
import { eq, desc, sql, and, gte } from "drizzle-orm";

export const publicApiRouter = router({
  // Get aggregated incident statistics
  getIncidentStats: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return null;

    const totalReports = await db
      .select({ count: sql<number>`count(*)` })
      .from(watchdogReports)
      .where(eq(watchdogReports.isPublic, true));

    const bySeverity = await db
      .select({
        severity: watchdogReports.severity,
        count: sql<number>`count(*)`,
      })
      .from(watchdogReports)
      .where(eq(watchdogReports.isPublic, true))
      .groupBy(watchdogReports.severity);

    const byStatus = await db
      .select({
        status: watchdogReports.status,
        count: sql<number>`count(*)`,
      })
      .from(watchdogReports)
      .where(eq(watchdogReports.isPublic, true))
      .groupBy(watchdogReports.status);

    return {
      total: totalReports[0]?.count || 0,
      bySeverity,
      byStatus,
      lastUpdated: new Date().toISOString(),
    };
  }),

  // Get recent public incidents (anonymized)
  getRecentIncidents: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(50).default(10),
      category: z.string().optional(),
      severity: z.enum(["low", "medium", "high", "critical"]).optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      let query = db
        .select({
          id: watchdogReports.id,
          title: watchdogReports.title,
          severity: watchdogReports.severity,
          status: watchdogReports.status,
          createdAt: watchdogReports.createdAt,
        })
        .from(watchdogReports)
        .where(eq(watchdogReports.isPublic, true))
        .orderBy(desc(watchdogReports.createdAt))
        .limit(input.limit);

      return query;
    }),

  // Get council voting statistics
  getCouncilStats: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return null;

    const totalSessions = await db
      .select({ count: sql<number>`count(*)` })
      .from(councilSessions);

    const byOutcome = await db
      .select({
        finalDecision: councilSessions.finalDecision,
        count: sql<number>`count(*)`,
      })
      .from(councilSessions)
      .groupBy(councilSessions.finalDecision);

    const totalVotes = await db
      .select({ count: sql<number>`count(*)` })
      .from(agentVotes);

    const voteDistribution = await db
      .select({
        vote: agentVotes.vote,
        count: sql<number>`count(*)`,
      })
      .from(agentVotes)
      .groupBy(agentVotes.vote);

    return {
      totalSessions: totalSessions[0]?.count || 0,
      totalVotes: totalVotes[0]?.count || 0,
      byOutcome,
      voteDistribution,
      lastUpdated: new Date().toISOString(),
    };
  }),

  // Get framework compliance overview
  getFrameworkStats: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return null;

    const frameworkList = await db.select().from(frameworks);

    const complianceStats = await db
      .select({
        frameworkId: assessments.frameworkId,
        avgScore: sql<number>`AVG(overall_score)`,
        totalAssessments: sql<number>`count(*)`,
      })
      .from(assessments)
      .groupBy(assessments.frameworkId);

    return {
      frameworks: frameworkList.map(f => ({
        id: f.id,
        name: f.name,
        version: f.version,
        description: f.description,
      })),
      complianceStats,
      lastUpdated: new Date().toISOString(),
    };
  }),

  // Get industry overview (anonymized)
  getIndustryOverview: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return null;

    const totalSystems = await db
      .select({ count: sql<number>`count(*)` })
      .from(aiSystems);

    const byRiskLevel = await db
      .select({
        riskLevel: aiSystems.riskLevel,
        count: sql<number>`count(*)`,
      })
      .from(aiSystems)
      .groupBy(aiSystems.riskLevel);

    const byType = await db
      .select({
        systemType: aiSystems.systemType,
        count: sql<number>`count(*)`,
      })
      .from(aiSystems)
      .groupBy(aiSystems.systemType);

    return {
      totalRegisteredSystems: totalSystems[0]?.count || 0,
      byRiskLevel,
      byType,
      lastUpdated: new Date().toISOString(),
    };
  }),

  // Get RLMAI learning data from council decisions
  getRLMAILearnings: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return null;

    // Get council decisions with their reasoning
    const decisions = await db
      .select({
        id: councilSessions.id,
        finalDecision: councilSessions.finalDecision,
        subjectTitle: councilSessions.subjectTitle,
        subjectDescription: councilSessions.subjectDescription,
        approveVotes: councilSessions.approveVotes,
        rejectVotes: councilSessions.rejectVotes,
        createdAt: councilSessions.createdAt,
      })
      .from(councilSessions)
      .where(sql`${councilSessions.finalDecision} IS NOT NULL`)
      .orderBy(desc(councilSessions.createdAt))
      .limit(50);

    // Get vote patterns by agent type
    const votePatterns = await db
      .select({
        agentType: agentVotes.agentType,
        vote: agentVotes.vote,
        count: sql<number>`count(*)`,
      })
      .from(agentVotes)
      .groupBy(agentVotes.agentType, agentVotes.vote);

    // Calculate consensus metrics
    const consensusMetrics = await db
      .select({
        sessionId: agentVotes.sessionId,
        totalVotes: sql<number>`count(*)`,
        approveVotes: sql<number>`SUM(CASE WHEN vote = 'approve' THEN 1 ELSE 0 END)`,
        rejectVotes: sql<number>`SUM(CASE WHEN vote = 'reject' THEN 1 ELSE 0 END)`,
      })
      .from(agentVotes)
      .groupBy(agentVotes.sessionId);

    const avgConsensus = consensusMetrics.length > 0
      ? consensusMetrics.reduce((sum, m) => {
          const total = Number(m.totalVotes) || 1;
          const majority = Math.max(Number(m.approveVotes) || 0, Number(m.rejectVotes) || 0);
          return sum + (majority / total);
        }, 0) / consensusMetrics.length
      : 0;

    return {
      totalDecisions: decisions.length,
      recentDecisions: decisions.slice(0, 10),
      votePatterns,
      consensusRate: Math.round(avgConsensus * 100),
      lastUpdated: new Date().toISOString(),
    };
  }),

  // Get incident patterns for knowledge base
  getIncidentPatterns: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return null;

    // Get incidents by incident type
    const byCategory = await db
      .select({
        incidentType: watchdogReports.incidentType,
        count: sql<number>`count(*)`,
        avgSeverity: sql<string>`AVG(CASE 
          WHEN severity = 'critical' THEN 4 
          WHEN severity = 'high' THEN 3 
          WHEN severity = 'medium' THEN 2 
          ELSE 1 END)`,
      })
      .from(watchdogReports)
      .where(eq(watchdogReports.isPublic, true))
      .groupBy(watchdogReports.incidentType);

    // Get resolution rates
    const resolutionStats = await db
      .select({
        status: watchdogReports.status,
        count: sql<number>`count(*)`,
      })
      .from(watchdogReports)
      .where(eq(watchdogReports.isPublic, true))
      .groupBy(watchdogReports.status);

    const totalIncidents = resolutionStats.reduce((sum, s) => sum + Number(s.count), 0);
    const resolvedCount = resolutionStats.find(s => s.status === 'resolved')?.count || 0;
    const resolutionRate = totalIncidents > 0 ? Math.round((Number(resolvedCount) / totalIncidents) * 100) : 0;

    return {
      byCategory,
      resolutionStats,
      resolutionRate,
      totalIncidents,
      lastUpdated: new Date().toISOString(),
    };
  }),

  // Get public leaderboard (anonymized company compliance scores)
  getComplianceLeaderboard: publicProcedure
    .input(z.object({
      frameworkId: z.number().optional(),
      limit: z.number().min(1).max(100).default(20),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      // Get top compliant systems (anonymized)
      const leaderboard = await db
        .select({
          systemId: assessments.aiSystemId,
          avgScore: sql<number>`AVG(overall_score)`,
          assessmentCount: sql<number>`count(*)`,
        })
        .from(assessments)
        .where(eq(assessments.status, 'completed'))
        .groupBy(assessments.aiSystemId)
        .orderBy(desc(sql`AVG(overall_score)`))
        .limit(input.limit);

      return leaderboard.map((item, index) => ({
        rank: index + 1,
        anonymizedId: `SYSTEM-${String(item.systemId).padStart(4, '0')}`,
        complianceScore: Math.round(Number(item.avgScore) || 0),
        assessmentCount: item.assessmentCount,
      }));
    }),
});
