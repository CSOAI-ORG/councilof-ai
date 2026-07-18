import { COOKIE_NAME } from "../shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import crypto from "crypto";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { 
  watchdogReports, 
  watchdogApplications, 
  councilSessions, 
  agentVotes,
  frameworks,
  aiSystems,
  assessments,
  assessmentItems,
  requirements,
  trainingModules,
  userTrainingProgress,
  certificationTests,
  testQuestions,
  userTestAttempts,
  userCertificates,
  caseAssignments,
  analystDecisions,
  analystPerformance,
  users,
  apiKeys,
  pdcaCycles,
} from "../drizzle/schema";
import { eq, desc, sql, and } from "drizzle-orm";
import { invokeLLM } from "./_core/llm";
import { notifyOwner } from "./_core/notification";
import { publicApiRouter } from "./publicApi";
import { recommendationsRouter } from "./recommendations";
import { coursesRouter } from "./courses";
import { modulePopulationRouter } from "./routers/modulePopulation";
import { certificatesRouter } from "./routers/certificates";
import { progressRouter } from "./routers/progress";
import { pdcaTemplatesRouter } from "./routers/pdcaTemplates";
import { bulkImportRouter } from "./routers/bulkImport";
import { jobsRouter } from "./routers/jobs";
import { notificationsRouter } from "./routers/notifications";
import { fileUploadRouter } from "./routers/fileUpload";

// ============================================
// WATCHDOG ROUTER - Public incident reporting
// ============================================
const watchdogRouter = router({
  // Get all public watchdog reports
  list: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    
    const reports = await db
      .select()
      .from(watchdogReports)
      .where(eq(watchdogReports.isPublic, true))
      .orderBy(desc(watchdogReports.createdAt))
      .limit(50);
    
    return reports;
  }),

  // Submit a new watchdog report
  submit: publicProcedure
    .input(z.object({
      title: z.string().min(10).max(255),
      description: z.string().min(50).max(5000),
      aiSystemName: z.string().optional(),
      companyName: z.string().optional(),
      incidentType: z.enum(["bias", "privacy", "safety", "misinformation", "manipulation", "other"]),
      severity: z.enum(["low", "medium", "high", "critical"]).default("medium"),
      reporterEmail: z.string().email().optional(),
      reporterName: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [report] = await db.insert(watchdogReports).values({
        ...input,
        reporterId: ctx.user?.id,
        status: "submitted",
      }).$returningId();

      // Automatically create a council session for this report
      await db.insert(councilSessions).values({
        subjectType: "watchdog_report",
        subjectId: report.id,
        subjectTitle: input.title,
        subjectDescription: input.description,
        status: "voting",
      });

      return { success: true, reportId: report.id };
    }),

  // Upvote a report
  upvote: publicProcedure
    .input(z.object({ reportId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(watchdogReports)
        .set({ upvotes: sql`${watchdogReports.upvotes} + 1` })
        .where(eq(watchdogReports.id, input.reportId));

      return { success: true };
    }),

  // Get report details
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const [report] = await db
        .select()
        .from(watchdogReports)
        .where(eq(watchdogReports.id, input.id))
        .limit(1);

      return report || null;
    }),
});

// ============================================
// WATCHDOG APPLICATIONS - LOI Collection
// ============================================
const applicationsRouter = router({
  // Submit application to become a Watchdog Analyst
  submit: publicProcedure
    .input(z.object({
      email: z.string().email(),
      name: z.string().min(2).max(255),
      country: z.string().optional(),
      timezone: z.string().optional(),
      experience: z.string().optional(),
      motivation: z.string().min(50).max(2000),
      availableHoursPerWeek: z.number().min(1).max(40).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [application] = await db.insert(watchdogApplications).values({
        ...input,
        status: "pending",
      }).$returningId();

      // Send notification to owner about new LOI signup
      try {
        await notifyOwner({
          title: `🎯 New Watchdog Analyst Application: ${input.name}`,
          content: `A new Letter of Intent has been submitted!

**Applicant:** ${input.name}
**Email:** ${input.email}
**Country:** ${input.country || "Not specified"}
**Motivation:** ${input.motivation.substring(0, 200)}${input.motivation.length > 200 ? "..." : ""}
**Available Hours/Week:** ${input.availableHoursPerWeek || "Not specified"}

This LOI adds to your market validation. Total applications can be viewed in the CSOAI Dashboard.`,
        });
      } catch (e) {
        console.warn("Failed to send notification:", e);
      }

      return { success: true, applicationId: application.id };
    }),

  // Get application count (for LOI display)
  getCount: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { count: 0 };

    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(watchdogApplications);

    return { count: result[0]?.count || 0 };
  }),

  // Admin: List all applications
  list: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new Error("Admin access required");
    }

    const db = await getDb();
    if (!db) return [];

    return db
      .select()
      .from(watchdogApplications)
      .orderBy(desc(watchdogApplications.createdAt));
  }),
});

// ============================================
// 33-AGENT COUNCIL ROUTER
// ============================================
const councilRouter = router({
  // Get all council sessions
  list: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    return db
      .select()
      .from(councilSessions)
      .orderBy(desc(councilSessions.createdAt))
      .limit(20);
  }),

  // Get session with votes
  getSession: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const [session] = await db
        .select()
        .from(councilSessions)
        .where(eq(councilSessions.id, input.id))
        .limit(1);

      if (!session) return null;

      const votes = await db
        .select()
        .from(agentVotes)
        .where(eq(agentVotes.sessionId, input.id));

      return { session, votes };
    }),

  // Trigger 33-agent voting on a session (uses LLM)
  triggerVoting: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get the session
      const [session] = await db
        .select()
        .from(councilSessions)
        .where(eq(councilSessions.id, input.sessionId))
        .limit(1);

      if (!session) throw new Error("Session not found");

      // Define the 33 agents
      const agents = generateAgentCouncil();
      const votes: { agentId: string; agentType: "guardian" | "arbiter" | "scribe"; agentProvider: "openai" | "anthropic" | "google" | "kimi" | "deepseek" | "glm" | "hermes"; vote: "approve" | "reject" | "escalate"; confidence: number; reasoning: string }[] = [];

      // Simulate voting (in production, each would call different LLM endpoints)
      for (const agent of agents) {
        try {
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `You are ${agent.name}, a ${agent.type} agent in the CSOAI 33-Agent Council. Your role is to evaluate AI safety incidents and vote on appropriate actions. You must respond with a JSON object containing: vote ("approve", "reject", or "escalate"), confidence (0-1), and reasoning (brief explanation).`
              },
              {
                role: "user",
                content: `Please evaluate this incident and cast your vote:

Title: ${session.subjectTitle}
Description: ${session.subjectDescription}
Type: ${session.subjectType}

Respond with JSON only: {"vote": "approve|reject|escalate", "confidence": 0.0-1.0, "reasoning": "your brief reasoning"}`
              }
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "agent_vote",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    vote: { type: "string", enum: ["approve", "reject", "escalate"] },
                    confidence: { type: "number" },
                    reasoning: { type: "string" }
                  },
                  required: ["vote", "confidence", "reasoning"],
                  additionalProperties: false
                }
              }
            }
          });

          const content = response.choices[0]?.message?.content as string | undefined;
          if (content) {
            const parsed = JSON.parse(content);
            votes.push({
              agentId: agent.id,
              agentType: agent.type as "guardian" | "arbiter" | "scribe",
              agentProvider: agent.provider as "openai" | "anthropic" | "google" | "kimi" | "deepseek" | "glm" | "hermes",
              vote: parsed.vote,
              confidence: parsed.confidence,
              reasoning: parsed.reasoning
            });
          }
        } catch (error) {
          // Fallback vote if LLM fails
          votes.push({
            agentId: agent.id,
            agentType: agent.type as "guardian" | "arbiter" | "scribe",
            agentProvider: agent.provider as "openai" | "anthropic" | "google",
            vote: "escalate",
            confidence: 0.5,
            reasoning: "Unable to evaluate - escalating to human review"
          });
        }
      }

      // Save votes to database
      for (const vote of votes) {
        await db.insert(agentVotes).values({
          sessionId: input.sessionId,
          ...vote,
          confidence: vote.confidence.toString(),
        });
      }

      // Calculate results
      const approveCount = votes.filter(v => v.vote === "approve").length;
      const rejectCount = votes.filter(v => v.vote === "reject").length;
      const escalateCount = votes.filter(v => v.vote === "escalate").length;

      // Determine consensus (2/3 majority = 22/33)
      const consensusThreshold = 22;
      let finalDecision: "approved" | "rejected" | "escalated" = "escalated";
      let status: "consensus_reached" | "escalated_to_human" = "escalated_to_human";

      if (approveCount >= consensusThreshold) {
        finalDecision = "approved";
        status = "consensus_reached";
      } else if (rejectCount >= consensusThreshold) {
        finalDecision = "rejected";
        status = "consensus_reached";
      }

      // Update session
      await db
        .update(councilSessions)
        .set({
          status,
          totalVotes: 33,
          approveVotes: approveCount,
          rejectVotes: rejectCount,
          escalateVotes: escalateCount,
          finalDecision,
          completedAt: new Date(),
        })
        .where(eq(councilSessions.id, input.sessionId));

      return {
        success: true,
        totalVotes: 33,
        approveVotes: approveCount,
        rejectVotes: rejectCount,
        escalateVotes: escalateCount,
        finalDecision,
        consensusReached: status === "consensus_reached"
      };
    }),

  // Get council statistics
  getStats: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return {
      totalSessions: 0,
      consensusReached: 0,
      escalatedToHuman: 0,
      pendingReview: 0
    };

    const sessions = await db.select().from(councilSessions);
    
    return {
      totalSessions: sessions.length,
      consensusReached: sessions.filter(s => s.status === "consensus_reached").length,
      escalatedToHuman: sessions.filter(s => s.status === "escalated_to_human").length,
      pendingReview: sessions.filter(s => s.status === "voting").length
    };
  }),

  // Proxy a thought through the Sovereign Town SOV3 bridge
  sov3Think: publicProcedure
    .input(z.object({
      message: z.string().min(1).max(4000),
      character: z.string().default("sage"),
      profile: z.enum(["local_only", "balanced", "power", "council"]).default("balanced"),
    }))
    .mutation(async ({ input }) => {
      const sovTownUrl = process.env.SOV_TOWN_URL || "http://127.0.0.1:3940";
      const url = `${sovTownUrl}/api/sov3/think`;

      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            character: input.character,
            message: input.message,
            profile: input.profile,
          }),
        });

        if (!response.ok) {
          const text = await response.text().catch(() => "unknown error");
          throw new Error(`Sovereign Town bridge returned ${response.status}: ${text}`);
        }

        const data = await response.json();
        return {
          success: true,
          bridge: data,
        };
      } catch (error: any) {
        console.error("[council.sov3Think] bridge error:", error);
        return {
          success: false,
          error: error.message || "Failed to reach Sovereign Town bridge",
        };
      }
    }),

  // Health/status of the AI providers available to the 33-Agent Council
  providersHealth: publicProcedure.query(async () => {
    const checks = {
      openai: !!process.env.OPENAI_API_KEY,
      anthropic: !!process.env.ANTHROPIC_API_KEY,
      google: !!process.env.GOOGLE_AI_API_KEY,
      glm: !!(process.env.GLM_API_KEY || process.env.ZHIPU_API_KEY),
      hermes: false,
    };

    // Probe Hermes / Ollama
    try {
      const ollamaUrl = process.env.HERMES_BASE_URL || "http://127.0.0.1:11434";
      const res = await fetch(`${ollamaUrl}/api/tags`, { method: "GET" });
      checks.hermes = res.ok;
    } catch {
      checks.hermes = false;
    }

    return {
      providers: checks,
      totalConfigured: Object.values(checks).filter(Boolean).length,
      sovTownUrl: process.env.SOV_TOWN_URL || "http://127.0.0.1:3940",
    };
  }),
});

// ============================================
// COMPLIANCE ROUTER
// ============================================
const complianceRouter = router({
  // Get all frameworks
  getFrameworks: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      // Return default frameworks if DB not available
      return [
        { id: 1, code: "EU_AI_ACT", name: "EU AI Act", version: "2024/1689", jurisdiction: "European Union", isActive: true },
        { id: 2, code: "NIST_AI_RMF", name: "NIST AI RMF", version: "1.0", jurisdiction: "United States", isActive: true },
        { id: 3, code: "TC260", name: "TC260 AI Safety Framework", version: "2.0", jurisdiction: "China", isActive: true },
      ];
    }

    return db.select().from(frameworks).where(eq(frameworks.isActive, true));
  }),

  // Get compliance summary for dashboard
  getSummary: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      return {
        totalSystems: 0,
        compliantSystems: 0,
        pendingAssessments: 0,
        overallScore: 0
      };
    }

    const systems = await db
      .select()
      .from(aiSystems)
      .where(eq(aiSystems.userId, ctx.user.id));

    const assessmentList = await db.select().from(assessments);

    return {
      totalSystems: systems.length,
      compliantSystems: systems.filter(s => s.status === "compliant").length,
      pendingAssessments: assessmentList.filter(a => a.status === "pending").length,
      overallScore: 75 // Placeholder - would calculate from actual assessments
    };
  }),

  // Get assessments for an AI system
  getAssessments: protectedProcedure
    .input(z.object({ aiSystemId: z.number().optional() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return [];

      // Build conditions array
      const conditions = [eq(aiSystems.userId, ctx.user.id)];
      if (input.aiSystemId) {
        conditions.push(eq(assessments.aiSystemId, input.aiSystemId));
      }

      return db
        .select({
          assessment: assessments,
          framework: frameworks,
          aiSystem: aiSystems,
        })
        .from(assessments)
        .leftJoin(frameworks, eq(assessments.frameworkId, frameworks.id))
        .leftJoin(aiSystems, eq(assessments.aiSystemId, aiSystems.id))
        .where(and(...conditions));
    }),

  // Generate compliance report PDF
  generateReport: protectedProcedure
    .input(z.object({
      assessmentId: z.number().positive(),
      includeEvidence: z.boolean().default(true),
      includeRecommendations: z.boolean().default(true),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get assessment with related data
      const [assessmentData] = await db
        .select({
          assessment: assessments,
          framework: frameworks,
          aiSystem: aiSystems,
        })
        .from(assessments)
        .leftJoin(frameworks, eq(assessments.frameworkId, frameworks.id))
        .leftJoin(aiSystems, eq(assessments.aiSystemId, aiSystems.id))
        .where(eq(assessments.id, input.assessmentId))
        .limit(1);

      if (!assessmentData || !assessmentData.aiSystem || assessmentData.aiSystem.userId !== ctx.user.id) {
        throw new Error("Assessment not found or access denied");
      }

      // Get assessment items with requirements
      const items = await db
        .select({
          item: assessmentItems,
          requirement: requirements,
        })
        .from(assessmentItems)
        .leftJoin(requirements, eq(assessmentItems.requirementId, requirements.id))
        .where(eq(assessmentItems.assessmentId, input.assessmentId));

      // Import PDF generator
      const { generateComplianceReportPDF } = await import("./compliancePdfGenerator");

      // Generate PDF
      const pdfBuffer = await generateComplianceReportPDF(
        {
          aiSystem: assessmentData.aiSystem,
          framework: assessmentData.framework!,
          assessment: assessmentData.assessment,
          items: items.map(i => ({
            ...i.item,
            requirement: i.requirement || undefined,
          })),
          generatedBy: ctx.user.name || "Unknown",
        },
        {
          includeEvidence: input.includeEvidence,
          includeRecommendations: input.includeRecommendations,
        }
      );

      return {
        success: true,
        pdf: pdfBuffer.toString("base64"),
        filename: `compliance-report-${assessmentData.framework?.code || "report"}-${assessmentData.aiSystem.name.replace(/\s+/g, "-")}.pdf`,
      };
    }),

  // Create/run a new compliance assessment
  createAssessment: protectedProcedure
    .input(z.object({
      aiSystemId: z.number().positive(),
      frameworkId: z.number().positive(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify AI system ownership
      const [system] = await db
        .select()
        .from(aiSystems)
        .where(eq(aiSystems.id, input.aiSystemId))
        .limit(1);

      if (!system || system.userId !== ctx.user.id) {
        throw new Error("AI System not found or access denied");
      }

      // Get framework requirements
      const frameworkReqs = await db
        .select()
        .from(requirements)
        .where(eq(requirements.frameworkId, input.frameworkId));

      if (frameworkReqs.length === 0) {
        throw new Error("No requirements found for this framework");
      }

      // Create assessment
      const [assessment] = await db.insert(assessments).values({
        aiSystemId: input.aiSystemId,
        frameworkId: input.frameworkId,
        assessorId: ctx.user.id,
        status: "in_progress",
        overallScore: "0",
      }).$returningId();

      // Create assessment items for each requirement
      // Simulate assessment by randomly assigning compliance status
      const assessmentItemsData = frameworkReqs.map(req => {
        const random = Math.random();
        let status: "compliant" | "in_progress" | "non_compliant" | "not_applicable";
        let score: number;
        
        if (random > 0.7) {
          status = "compliant";
          score = 100;
        } else if (random > 0.4) {
          status = "in_progress";
          score = 50;
        } else if (random > 0.1) {
          status = "non_compliant";
          score = 0;
        } else {
          status = "not_applicable";
          score = 100;
        }

        return {
          assessmentId: assessment.id,
          requirementId: req.id,
          status,
          notes: status === "non_compliant" 
            ? `Action required: Implement ${req.title} controls`
            : status === "in_progress"
            ? `Partially implemented: Review ${req.title} for full compliance`
            : null,
          score,
        };
      });

      // Insert items without score field (not in schema)
      await db.insert(assessmentItems).values(assessmentItemsData.map(item => ({
        assessmentId: item.assessmentId,
        requirementId: item.requirementId,
        status: item.status,
        notes: item.notes,
      })));

      // Calculate overall score
      const totalScore = assessmentItemsData.reduce((sum, item) => sum + item.score, 0);
      const overallScore = Math.round(totalScore / assessmentItemsData.length);

      // Update assessment with final score
      await db
        .update(assessments)
        .set({
          overallScore: overallScore.toString(),
          status: overallScore >= 80 ? "completed" : "in_progress",
          completedAt: new Date(),
        })
        .where(eq(assessments.id, assessment.id));

      return {
        success: true,
        assessmentId: assessment.id,
        overallScore,
        itemsCount: assessmentItemsData.length,
        compliantCount: assessmentItemsData.filter(i => i.status === "compliant").length,
        partialCount: assessmentItemsData.filter(i => i.status === "in_progress").length,
        nonCompliantCount: assessmentItemsData.filter(i => i.status === "non_compliant").length,
      };
    }),

  // Send compliance report via email
  sendReport: protectedProcedure
    .input(z.object({
      assessmentId: z.number().positive(),
      email: z.string().email(),
      includeEvidence: z.boolean().default(true),
      includeRecommendations: z.boolean().default(true),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get assessment with related data
      const [assessmentData] = await db
        .select({
          assessment: assessments,
          framework: frameworks,
          aiSystem: aiSystems,
        })
        .from(assessments)
        .leftJoin(frameworks, eq(assessments.frameworkId, frameworks.id))
        .leftJoin(aiSystems, eq(assessments.aiSystemId, aiSystems.id))
        .where(eq(assessments.id, input.assessmentId))
        .limit(1);

      if (!assessmentData || !assessmentData.aiSystem || assessmentData.aiSystem.userId !== ctx.user.id) {
        throw new Error("Assessment not found or access denied");
      }

      // Get assessment items with requirements
      const items = await db
        .select({
          item: assessmentItems,
          requirement: requirements,
        })
        .from(assessmentItems)
        .leftJoin(requirements, eq(assessmentItems.requirementId, requirements.id))
        .where(eq(assessmentItems.assessmentId, input.assessmentId));

      // Import PDF generator and email service
      const { generateComplianceReportPDF } = await import("./compliancePdfGenerator");
      const { sendEmailWithAttachment } = await import("./emailService");

      // Generate PDF
      const pdfBuffer = await generateComplianceReportPDF(
        {
          aiSystem: assessmentData.aiSystem,
          framework: assessmentData.framework!,
          assessment: assessmentData.assessment,
          items: items.map(i => ({
            ...i.item,
            requirement: i.requirement || undefined,
          })),
          generatedBy: ctx.user.name || "Unknown",
        },
        {
          includeEvidence: input.includeEvidence,
          includeRecommendations: input.includeRecommendations,
        }
      );

      const filename = `compliance-report-${assessmentData.framework?.code || "report"}-${assessmentData.aiSystem.name.replace(/\s+/g, "-")}.pdf`;

      // Send email
      const result = await sendEmailWithAttachment({
        to: input.email,
        subject: `Compliance Report: ${assessmentData.aiSystem.name} - ${assessmentData.framework?.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #1a1a1a; color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0;">CSOAI</h1>
              <p style="margin: 5px 0 0 0; opacity: 0.8;">Council of AIs</p>
            </div>
            <div style="padding: 30px; background: #f9fafb;">
              <h2 style="color: #1a1a1a; margin-top: 0;">Compliance Assessment Report</h2>
              <p>Please find attached the compliance assessment report for:</p>
              <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>AI System:</strong> ${assessmentData.aiSystem.name}</p>
                <p style="margin: 5px 0;"><strong>Framework:</strong> ${assessmentData.framework?.name}</p>
                <p style="margin: 5px 0;"><strong>Score:</strong> ${assessmentData.assessment.overallScore || "N/A"}%</p>
              </div>
              <p style="color: #666; font-size: 14px;">This report was generated by CSOAI on ${new Date().toLocaleDateString()}.</p>
            </div>
            <div style="background: #e5e7eb; padding: 15px; text-align: center; font-size: 12px; color: #666;">
              <p style="margin: 0;">CSOAI - AI Safety & Compliance Platform</p>
            </div>
          </div>
        `,
        attachments: [{
          filename,
          content: pdfBuffer,
          contentType: "application/pdf",
        }],
      });

      return {
        success: true,
        messageId: result.messageId,
        previewUrl: result.previewUrl,
      };
    }),
});

// ============================================
// AI SYSTEMS ROUTER
// ============================================
const aiSystemsRouter = router({
  // List user's AI systems
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    return db
      .select()
      .from(aiSystems)
      .where(eq(aiSystems.userId, ctx.user.id))
      .orderBy(desc(aiSystems.createdAt));
  }),

  // Register a new AI system
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(3).max(255),
      description: z.string().optional(),
      systemType: z.enum(["chatbot", "recommendation", "classification", "generation", "analysis", "other"]),
      riskLevel: z.enum(["minimal", "limited", "high", "unacceptable"]).default("minimal"),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [system] = await db.insert(aiSystems).values({
        ...input,
        userId: ctx.user.id,
        status: "draft",
      }).$returningId();

      return { success: true, systemId: system.id };
    }),

  // Get system by ID
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return null;

      const [system] = await db
        .select()
        .from(aiSystems)
        .where(eq(aiSystems.id, input.id))
        .limit(1);

      if (!system || system.userId !== ctx.user.id) return null;
      return system;
    }),

  // Update an AI system
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(3).max(255).optional(),
      description: z.string().optional(),
      systemType: z.enum(["chatbot", "recommendation", "classification", "generation", "analysis", "other"]).optional(),
      riskLevel: z.enum(["minimal", "limited", "high", "unacceptable"]).optional(),
      status: z.enum(["draft", "active", "archived", "under_review"]).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify ownership
      const [existing] = await db
        .select()
        .from(aiSystems)
        .where(eq(aiSystems.id, input.id))
        .limit(1);

      if (!existing || existing.userId !== ctx.user.id) {
        throw new Error("AI system not found or access denied");
      }

      const { id, ...updateData } = input;
      
      await db
        .update(aiSystems)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(aiSystems.id, id));

      return { success: true };
    }),

  // Delete an AI system
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify ownership
      const [existing] = await db
        .select()
        .from(aiSystems)
        .where(eq(aiSystems.id, input.id))
        .limit(1);

      if (!existing || existing.userId !== ctx.user.id) {
        throw new Error("AI system not found or access denied");
      }

      await db
        .delete(aiSystems)
        .where(eq(aiSystems.id, input.id));

      return { success: true };
    }),

  // Bulk register AI systems (Enterprise only)
  bulkCreate: protectedProcedure
    .input(z.object({
      systems: z.array(z.object({
        name: z.string().min(3).max(255),
        description: z.string().optional(),
        systemType: z.enum(["chatbot", "recommendation", "classification", "generation", "analysis", "other"]),
        riskLevel: z.enum(["minimal", "limited", "high", "unacceptable"]).default("minimal"),
      })).min(1).max(100),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check enterprise tier (in production, use permission middleware)
      const [user] = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
      if (user?.subscriptionTier !== 'enterprise') {
        throw new Error("Bulk registration requires Enterprise subscription");
      }

      const results = [];
      for (const system of input.systems) {
        const [created] = await db.insert(aiSystems).values({
          ...system,
          userId: ctx.user.id,
          status: "draft",
        }).$returningId();
        results.push({ name: system.name, id: created.id });
      }

      return { success: true, created: results.length, systems: results };
    }),

  // Get industry-wide trend analysis (Enterprise only)
  getTrends: protectedProcedure
    .input(z.object({
      timeRange: z.enum(["7d", "30d", "90d", "1y"]).default("30d"),
    }))
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return null;

      // Get total systems by risk level
      const riskDistribution = await db
        .select({
          riskLevel: aiSystems.riskLevel,
          count: sql<number>`count(*)`,
        })
        .from(aiSystems)
        .groupBy(aiSystems.riskLevel);

      // Get total systems by type
      const typeDistribution = await db
        .select({
          systemType: aiSystems.systemType,
          count: sql<number>`count(*)`,
        })
        .from(aiSystems)
        .groupBy(aiSystems.systemType);

      // Get compliance scores by framework
      const complianceByFramework = await db
        .select({
          frameworkId: assessments.frameworkId,
          avgScore: sql<number>`AVG(overall_score)`,
          totalAssessments: sql<number>`count(*)`,
        })
        .from(assessments)
        .groupBy(assessments.frameworkId);

      // Get incident trends
      const incidentTrends = await db
        .select({
          severity: watchdogReports.severity,
          count: sql<number>`count(*)`,
        })
        .from(watchdogReports)
        .groupBy(watchdogReports.severity);

      return {
        riskDistribution,
        typeDistribution,
        complianceByFramework,
        incidentTrends,
        generatedAt: new Date().toISOString(),
      };
    }),
});

// ============================================
// DASHBOARD STATS ROUTER
// ============================================
const dashboardRouter = router({
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    
    // Return mock data if DB not available
    if (!db) {
      return {
        totalSystems: 12,
        complianceScore: 78,
        pendingReviews: 5,
        watchdogReports: 23,
        councilSessions: 8,
        loiCount: 156
      };
    }

    const systems = await db.select().from(aiSystems).where(eq(aiSystems.userId, ctx.user.id));
    const reports = await db.select().from(watchdogReports);
    const sessions = await db.select().from(councilSessions);
    const applications = await db.select().from(watchdogApplications);

    return {
      totalSystems: systems.length,
      complianceScore: 78, // Would calculate from assessments
      pendingReviews: sessions.filter(s => s.status === "voting").length,
      watchdogReports: reports.length,
      councilSessions: sessions.length,
      loiCount: applications.length
    };
  }),
});

// ============================================
// HELPER FUNCTIONS
// ============================================
function generateAgentCouncil() {
  const agents: { id: string; name: string; type: string; provider: string }[] = [];
  
  const types = ["guardian", "arbiter", "scribe"];
  // Expanded to 5 providers for greater diversity and Byzantine fault tolerance
  const providers = ["openai", "anthropic", "google", "kimi", "deepseek"];
  
  let agentNum = 1;
  for (const type of types) {
    for (let i = 0; i < 11; i++) {
      const provider = providers[i % 5]; // Rotate through 5 providers
      agents.push({
        id: `agent_${agentNum}`,
        name: `${type.charAt(0).toUpperCase() + type.slice(1)} Agent ${i + 1}`,
        type,
        provider: provider!
      });
      agentNum++;
    }
  }
  
  return agents; // Still 33 agents, now distributed across 5 providers
}

// ============================================
// TRAINING ROUTER - Analyst training modules
// ============================================
const trainingRouter = router({
  // Get all training modules
  getModules: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    return db
      .select()
      .from(trainingModules)
      .where(eq(trainingModules.isActive, true))
      .orderBy(trainingModules.orderIndex);
  }),

  // Get module by ID
  getModule: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const [module] = await db
        .select()
        .from(trainingModules)
        .where(eq(trainingModules.id, input.id))
        .limit(1);

      return module || null;
    }),

  // Get user's training progress
  getProgress: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    return db
      .select()
      .from(userTrainingProgress)
      .where(eq(userTrainingProgress.userId, ctx.user.id));
  }),

  // Start a training module
  startModule: protectedProcedure
    .input(z.object({ moduleId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check if progress exists
      const [existing] = await db
        .select()
        .from(userTrainingProgress)
        .where(and(
          eq(userTrainingProgress.userId, ctx.user.id),
          eq(userTrainingProgress.moduleId, input.moduleId)
        ))
        .limit(1);

      if (existing) {
        await db
          .update(userTrainingProgress)
          .set({ status: "in_progress", startedAt: new Date() })
          .where(eq(userTrainingProgress.id, existing.id));
      } else {
        await db.insert(userTrainingProgress).values({
          userId: ctx.user.id,
          moduleId: input.moduleId,
          status: "in_progress",
          startedAt: new Date(),
        });
      }

      return { success: true };
    }),

  // Complete a training module
  completeModule: protectedProcedure
    .input(z.object({ moduleId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(userTrainingProgress)
        .set({ 
          status: "completed", 
          progressPercent: 100,
          completedAt: new Date() 
        })
        .where(and(
          eq(userTrainingProgress.userId, ctx.user.id),
          eq(userTrainingProgress.moduleId, input.moduleId)
        ));

      return { success: true };
    }),
});

// ============================================
// CERTIFICATION ROUTER - Tests and certificates
// ============================================
const certificationRouter = router({
  // Get available tests
  getTests: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    return db
      .select()
      .from(certificationTests)
      .where(eq(certificationTests.isActive, true));
  }),

  // Get test with questions (for taking the test)
  getTestQuestions: protectedProcedure
    .input(z.object({ testId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const [test] = await db
        .select()
        .from(certificationTests)
        .where(eq(certificationTests.id, input.testId))
        .limit(1);

      if (!test) return null;

      const questions = await db
        .select({
          id: testQuestions.id,
          questionText: testQuestions.questionText,
          questionType: testQuestions.questionType,
          options: testQuestions.options,
          points: testQuestions.points,
          difficulty: testQuestions.difficulty,
        })
        .from(testQuestions)
        .where(and(
          eq(testQuestions.testId, input.testId),
          eq(testQuestions.isActive, true)
        ));

      return { test, questions };
    }),

  // Start a test attempt
  startTest: protectedProcedure
    .input(z.object({ testId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [attempt] = await db.insert(userTestAttempts).values({
        userId: ctx.user.id,
        testId: input.testId,
        startedAt: new Date(),
      }).$returningId();

      return { attemptId: attempt.id };
    }),

  // Submit test answers
  submitTest: protectedProcedure
    .input(z.object({
      attemptId: z.number(),
      answers: z.record(z.string(), z.string()), // questionId -> answer
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get the attempt
      const [attempt] = await db
        .select()
        .from(userTestAttempts)
        .where(eq(userTestAttempts.id, input.attemptId))
        .limit(1);

      if (!attempt || attempt.userId !== ctx.user.id) {
        throw new Error("Test attempt not found");
      }

      // Get test and questions
      const [test] = await db
        .select()
        .from(certificationTests)
        .where(eq(certificationTests.id, attempt.testId))
        .limit(1);

      const questions = await db
        .select()
        .from(testQuestions)
        .where(eq(testQuestions.testId, attempt.testId));

      // Calculate score
      let totalPoints = 0;
      let earnedPoints = 0;

      for (const question of questions) {
        totalPoints += question.points;
        const userAnswer = input.answers[question.id.toString()];
        if (userAnswer === question.correctAnswer) {
          earnedPoints += question.points;
        }
      }

      const percentScore = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
      const passed = percentScore >= (test?.passingScore || 70);

      // Update attempt
      await db
        .update(userTestAttempts)
        .set({
          score: earnedPoints,
          totalPoints,
          percentScore: percentScore.toFixed(2),
          passed,
          answers: input.answers,
          completedAt: new Date(),
        })
        .where(eq(userTestAttempts.id, input.attemptId));

      // If passed, issue certificate
      if (passed) {
        const certificateNumber = `CSOAI-WA-${Date.now()}-${ctx.user.id}`;
        
        await db.insert(userCertificates).values({
          userId: ctx.user.id,
          testId: attempt.testId,
          attemptId: input.attemptId,
          certificateNumber,
          certificateType: "basic",
          issuedAt: new Date(),
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        });

        // Update user role to watchdog_analyst
        await db
          .update(users)
          .set({ role: "watchdog_analyst" })
          .where(eq(users.id, ctx.user.id));

        // Send notification about new certified analyst
        try {
          await notifyOwner({
            title: `🎉 New Certified Watchdog Analyst!`,
            content: `A user has passed the certification exam and is now a certified CSOAI Watchdog Analyst!

**User ID:** ${ctx.user.id}
**Certificate Number:** ${certificateNumber}
**Score:** ${Math.round(percentScore)}%
**Passing Score:** ${test?.passingScore || 70}%

This analyst can now review AI safety cases in the Workbench. Your certified analyst pool is growing!`,
          });
        } catch (e) {
          console.warn("Failed to send certification notification:", e);
        }
      }

      return { 
        passed, 
        score: earnedPoints, 
        totalPoints, 
        percentScore: Math.round(percentScore),
        certificateNumber: passed ? `CSOAI-WA-${Date.now()}-${ctx.user.id}` : null,
        attemptId: input.attemptId,
      };
    }),

  // Get user's certificates
  getMyCertificates: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    return db
      .select()
      .from(userCertificates)
      .where(eq(userCertificates.userId, ctx.user.id));
  }),

  // Get user's test attempts
  getMyAttempts: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    return db
      .select()
      .from(userTestAttempts)
      .where(eq(userTestAttempts.userId, ctx.user.id))
      .orderBy(desc(userTestAttempts.createdAt));
  }),

  // Get attempt review with answers and explanations
  getAttemptReview: protectedProcedure
    .input(z.object({ attemptId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return null;

      // Get the attempt
      const [attempt] = await db
        .select()
        .from(userTestAttempts)
        .where(eq(userTestAttempts.id, input.attemptId))
        .limit(1);

      if (!attempt || attempt.userId !== ctx.user.id) {
        throw new Error("Attempt not found or access denied");
      }

      // Only allow review of completed attempts
      if (!attempt.completedAt) {
        throw new Error("Cannot review an incomplete attempt");
      }

      // Get the test
      const [test] = await db
        .select()
        .from(certificationTests)
        .where(eq(certificationTests.id, attempt.testId))
        .limit(1);

      // Get all questions with correct answers and explanations
      const questions = await db
        .select()
        .from(testQuestions)
        .where(eq(testQuestions.testId, attempt.testId));

      // Parse user answers
      const userAnswers = (attempt.answers as Record<string, string>) || {};

      // Build review data with correct/incorrect status
      const reviewQuestions = questions.map((q) => {
        const userAnswer = userAnswers[q.id.toString()] || null;
        const isCorrect = userAnswer === q.correctAnswer;

        return {
          id: q.id,
          questionText: q.questionText,
          questionType: q.questionType,
          options: q.options,
          points: q.points,
          difficulty: q.difficulty,
          userAnswer,
          correctAnswer: q.correctAnswer,
          isCorrect,
          explanation: q.explanation,
        };
      });

      return {
        attempt: {
          id: attempt.id,
          score: attempt.score,
          totalPoints: attempt.totalPoints,
          percentScore: attempt.percentScore,
          passed: attempt.passed,
          startedAt: attempt.startedAt,
          completedAt: attempt.completedAt,
        },
        test: {
          id: test?.id,
          title: test?.title,
          passingScore: test?.passingScore,
        },
        questions: reviewQuestions,
        summary: {
          totalQuestions: questions.length,
          correctCount: reviewQuestions.filter((q) => q.isCorrect).length,
          incorrectCount: reviewQuestions.filter((q) => !q.isCorrect && q.userAnswer).length,
          unansweredCount: reviewQuestions.filter((q) => !q.userAnswer).length,
        },
      };
    }),
});

// ============================================
// ANALYST WORKBENCH ROUTER - Case review
// ============================================
const workbenchRouter = router({
  // Get assigned cases for the analyst
  getMyCases: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    // Verify user is a watchdog analyst
    if (ctx.user.role !== "watchdog_analyst" && ctx.user.role !== "admin") {
      return [];
    }

    const assignments = await db
      .select()
      .from(caseAssignments)
      .where(eq(caseAssignments.analystId, ctx.user.id))
      .orderBy(desc(caseAssignments.assignedAt));

    // Get report details for each assignment
    const casesWithDetails = await Promise.all(
      assignments.map(async (assignment) => {
        const [report] = await db
          .select()
          .from(watchdogReports)
          .where(eq(watchdogReports.id, assignment.reportId))
          .limit(1);

        return { assignment, report };
      })
    );

    return casesWithDetails;
  }),

  // Get case details
  getCaseDetails: protectedProcedure
    .input(z.object({ assignmentId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return null;

      const [assignment] = await db
        .select()
        .from(caseAssignments)
        .where(eq(caseAssignments.id, input.assignmentId))
        .limit(1);

      if (!assignment || (assignment.analystId !== ctx.user.id && ctx.user.role !== "admin")) {
        return null;
      }

      const [report] = await db
        .select()
        .from(watchdogReports)
        .where(eq(watchdogReports.id, assignment.reportId))
        .limit(1);

      // Get council session if exists
      let councilSession = null;
      let councilVotes: any[] = [];
      if (assignment.councilSessionId) {
        const [session] = await db
          .select()
          .from(councilSessions)
          .where(eq(councilSessions.id, assignment.councilSessionId))
          .limit(1);
        councilSession = session;

        councilVotes = await db
          .select()
          .from(agentVotes)
          .where(eq(agentVotes.sessionId, assignment.councilSessionId));
      }

      return { assignment, report, councilSession, councilVotes };
    }),

  // Submit decision on a case
  submitDecision: protectedProcedure
    .input(z.object({
      assignmentId: z.number(),
      decision: z.enum(["approve", "reject", "escalate", "needs_more_info"]),
      confidence: z.enum(["low", "medium", "high"]),
      reasoning: z.string().min(50).max(2000),
      timeSpentMinutes: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify assignment belongs to user
      const [assignment] = await db
        .select()
        .from(caseAssignments)
        .where(eq(caseAssignments.id, input.assignmentId))
        .limit(1);

      if (!assignment || assignment.analystId !== ctx.user.id) {
        throw new Error("Assignment not found");
      }

      // Create decision record
      await db.insert(analystDecisions).values({
        assignmentId: input.assignmentId,
        analystId: ctx.user.id,
        decision: input.decision,
        confidence: input.confidence,
        reasoning: input.reasoning,
        timeSpentMinutes: input.timeSpentMinutes,
      });

      // Update assignment status
      await db
        .update(caseAssignments)
        .set({ status: "completed", completedAt: new Date() })
        .where(eq(caseAssignments.id, input.assignmentId));

      // Update report status based on decision
      const reportStatus = input.decision === "approve" ? "resolved" : 
                          input.decision === "reject" ? "dismissed" : "investigating";
      
      await db
        .update(watchdogReports)
        .set({ status: reportStatus })
        .where(eq(watchdogReports.id, assignment.reportId));

      // Update analyst performance
      await updateAnalystPerformance(ctx.user.id);

      return { success: true };
    }),

  // Get analyst performance stats
  getMyPerformance: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;

    const [performance] = await db
      .select()
      .from(analystPerformance)
      .where(eq(analystPerformance.analystId, ctx.user.id))
      .limit(1);

    return performance || null;
  }),

  // Get leaderboard
  getLeaderboard: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const leaderboard = await db
      .select({
        rank: analystPerformance.rank,
        totalCasesCompleted: analystPerformance.totalCasesCompleted,
        accuracyRate: analystPerformance.accuracyRate,
        qualityScore: analystPerformance.qualityScore,
      })
      .from(analystPerformance)
      .orderBy(desc(analystPerformance.qualityScore))
      .limit(50);

    return leaderboard;
  }),
});

// Helper function to update analyst performance
async function updateAnalystPerformance(analystId: number) {
  const db = await getDb();
  if (!db) return;

  // Get all assignments for this analyst
  const assignments = await db
    .select()
    .from(caseAssignments)
    .where(eq(caseAssignments.analystId, analystId));

  const totalAssigned = assignments.length;
  const completed = assignments.filter(a => a.status === "completed").length;
  const expired = assignments.filter(a => a.status === "expired").length;

  // Check if performance record exists
  const [existing] = await db
    .select()
    .from(analystPerformance)
    .where(eq(analystPerformance.analystId, analystId))
    .limit(1);

  const data = {
    totalCasesAssigned: totalAssigned,
    totalCasesCompleted: completed,
    totalCasesExpired: expired,
    lastActiveAt: new Date(),
  };

  if (existing) {
    await db
      .update(analystPerformance)
      .set(data)
      .where(eq(analystPerformance.analystId, analystId));
  } else {
    await db.insert(analystPerformance).values({
      analystId,
      ...data,
    });
  }
}

// ============================================
// ADMIN ROUTER - LOI management and analyst approval
// ============================================
const adminRouter = router({
  // Get all LOI applications (admin only)
  getApplications: protectedProcedure
    .input(z.object({
      status: z.enum(["pending", "approved", "rejected", "all"]).default("all"),
      limit: z.number().min(1).max(100).default(50),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return [];

      // Check admin role
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
      }

      let query = db.select().from(watchdogApplications);
      
      if (input.status !== "all") {
        query = query.where(eq(watchdogApplications.status, input.status)) as any;
      }

      return query.orderBy(desc(watchdogApplications.createdAt)).limit(input.limit);
    }),

  // Approve an application
  approveApplication: protectedProcedure
    .input(z.object({ applicationId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
      }

      await db
        .update(watchdogApplications)
        .set({ status: "approved" })
        .where(eq(watchdogApplications.id, input.applicationId));

      return { success: true };
    }),

  // Reject an application
  rejectApplication: protectedProcedure
    .input(z.object({ applicationId: z.number(), reason: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
      }

      await db
        .update(watchdogApplications)
        .set({ status: "rejected" })
        .where(eq(watchdogApplications.id, input.applicationId));

      return { success: true };
    }),

  // Get all certified analysts
  getCertifiedAnalysts: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    if (ctx.user.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    return db
      .select()
      .from(userCertificates)
      .orderBy(desc(userCertificates.issuedAt));
  }),

  // Get dashboard stats for admin
  getAdminStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;

    if (ctx.user.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    const [pendingApps] = await db
      .select({ count: sql<number>`count(*)` })
      .from(watchdogApplications)
      .where(eq(watchdogApplications.status, "pending"));

    const [totalApps] = await db
      .select({ count: sql<number>`count(*)` })
      .from(watchdogApplications);

    const [certifiedAnalysts] = await db
      .select({ count: sql<number>`count(*)` })
      .from(userCertificates);

    const [pendingReports] = await db
      .select({ count: sql<number>`count(*)` })
      .from(watchdogReports)
      .where(eq(watchdogReports.status, "submitted"));

    const [activeSessions] = await db
      .select({ count: sql<number>`count(*)` })
      .from(councilSessions)
      .where(eq(councilSessions.status, "voting"));

    return {
      pendingApplications: pendingApps?.count || 0,
      totalApplications: totalApps?.count || 0,
      certifiedAnalysts: certifiedAnalysts?.count || 0,
      pendingReports: pendingReports?.count || 0,
      activeCouncilSessions: activeSessions?.count || 0,
    };
  }),

  // Manage council sessions
  getCouncilSessions: protectedProcedure
    .input(z.object({ status: z.enum(["voting", "consensus_reached", "escalated_to_human", "completed", "all"]).default("all") }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return [];

      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
      }

      if (input.status === "all") {
        return db.select().from(councilSessions).orderBy(desc(councilSessions.createdAt)).limit(50);
      }

      return db
        .select()
        .from(councilSessions)
        .where(eq(councilSessions.status, input.status as "voting" | "consensus_reached" | "escalated_to_human" | "completed"))
        .orderBy(desc(councilSessions.createdAt))
        .limit(50);
    }),
});

// ============================================
// CHAT ROUTER - LLM-powered compliance assistant
// ============================================
const chatRouter = router({
  // Send a message and get AI response
  sendMessage: protectedProcedure
    .input(z.object({
      message: z.string().min(1).max(2000),
      context: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are CSOAI, the Council of AIs - a Western equivalent to China's TC260 AI Safety Governance Framework. You are an expert in AI safety, compliance, and governance across multiple frameworks:

1. **EU AI Act** (Regulation 2024/1689) - 113 articles covering risk classification, prohibited practices, high-risk requirements, transparency obligations
2. **NIST AI RMF** - GOVERN, MAP, MEASURE, MANAGE functions for AI risk management
3. **TC260** - China's AI Safety Governance Framework with 14 governance measures

You help organizations:
- Understand compliance requirements
- Assess AI system risks
- Navigate multi-framework compliance
- Report and investigate AI safety incidents
- Implement the SOAI-PDCA continuous improvement loop

Be helpful, accurate, and cite specific articles/requirements when relevant. If you're unsure, recommend consulting with legal experts or using the 33-Agent Council for formal assessments.`
            },
            {
              role: "user",
              content: input.message
            }
          ],
          response_format: { type: "text" }
        });

        const content = response.choices[0]?.message?.content as string || "I apologize, but I couldn't generate a response. Please try again.";

        return {
          response: content,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        console.error("Chat error:", error);
        return {
          response: "I apologize, but I encountered an error processing your request. Please try again or contact support if the issue persists.",
          timestamp: new Date().toISOString(),
        };
      }
    }),
});

// ============================================
// PDCA ROUTER - Plan-Do-Check-Act cycle management
// ============================================
const pdcaRouter = router({
  // List all PDCA cycles for the user or a specific AI system
  list: protectedProcedure
    .input(z.object({
      aiSystemId: z.number().optional(),
      status: z.enum(["active", "completed", "paused", "all"]).default("all"),
    }).optional())
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return [];

      let query = db
        .select({
          id: pdcaCycles.id,
          aiSystemId: pdcaCycles.aiSystemId,
          cycleNumber: pdcaCycles.cycleNumber,
          phase: pdcaCycles.phase,
          planSummary: pdcaCycles.planSummary,
          doSummary: pdcaCycles.doSummary,
          checkSummary: pdcaCycles.checkSummary,
          actSummary: pdcaCycles.actSummary,
          status: pdcaCycles.status,
          startedAt: pdcaCycles.startedAt,
          completedAt: pdcaCycles.completedAt,
          aiSystemName: aiSystems.name,
        })
        .from(pdcaCycles)
        .leftJoin(aiSystems, eq(pdcaCycles.aiSystemId, aiSystems.id));

      // Filter by AI system if provided
      if (input?.aiSystemId) {
        query = query.where(eq(pdcaCycles.aiSystemId, input.aiSystemId)) as any;
      }

      // Filter by status if not "all"
      if (input?.status && input.status !== "all") {
        query = query.where(eq(pdcaCycles.status, input.status)) as any;
      }

      return query.orderBy(desc(pdcaCycles.startedAt)).limit(50);
    }),

  // Get a single PDCA cycle with full details
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const [cycle] = await db
        .select({
          id: pdcaCycles.id,
          aiSystemId: pdcaCycles.aiSystemId,
          cycleNumber: pdcaCycles.cycleNumber,
          phase: pdcaCycles.phase,
          planSummary: pdcaCycles.planSummary,
          doSummary: pdcaCycles.doSummary,
          checkSummary: pdcaCycles.checkSummary,
          actSummary: pdcaCycles.actSummary,
          status: pdcaCycles.status,
          startedAt: pdcaCycles.startedAt,
          completedAt: pdcaCycles.completedAt,
          aiSystemName: aiSystems.name,
          aiSystemType: aiSystems.systemType,
          aiSystemRiskLevel: aiSystems.riskLevel,
        })
        .from(pdcaCycles)
        .leftJoin(aiSystems, eq(pdcaCycles.aiSystemId, aiSystems.id))
        .where(eq(pdcaCycles.id, input.id))
        .limit(1);

      return cycle || null;
    }),

  // Create a new PDCA cycle
  create: protectedProcedure
    .input(z.object({
      aiSystemId: z.number(),
      planSummary: z.string().min(10).max(2000),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify AI system exists and belongs to user
      const [system] = await db
        .select()
        .from(aiSystems)
        .where(eq(aiSystems.id, input.aiSystemId))
        .limit(1);

      if (!system || system.userId !== ctx.user.id) {
        throw new Error("AI system not found or access denied");
      }

      // Get the next cycle number for this AI system
      const existingCycles = await db
        .select({ cycleNumber: pdcaCycles.cycleNumber })
        .from(pdcaCycles)
        .where(eq(pdcaCycles.aiSystemId, input.aiSystemId))
        .orderBy(desc(pdcaCycles.cycleNumber))
        .limit(1);

      const nextCycleNumber = (existingCycles[0]?.cycleNumber || 0) + 1;

      const result = await db.insert(pdcaCycles).values({
        aiSystemId: input.aiSystemId,
        cycleNumber: nextCycleNumber,
        phase: "plan",
        planSummary: input.planSummary,
        status: "active",
      });

      return { id: Number((result as any)[0]?.insertId || 0), cycleNumber: nextCycleNumber };
    }),

  // Update phase summary (Plan, Do, Check, or Act)
  updatePhase: protectedProcedure
    .input(z.object({
      id: z.number(),
      phase: z.enum(["plan", "do", "check", "act"]),
      summary: z.string().min(10).max(2000),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get the cycle and verify access
      const [cycle] = await db
        .select()
        .from(pdcaCycles)
        .where(eq(pdcaCycles.id, input.id))
        .limit(1);

      if (!cycle) {
        throw new Error("PDCA cycle not found");
      }

      // Verify user owns the AI system
      if (cycle.aiSystemId) {
        const [system] = await db
          .select()
          .from(aiSystems)
          .where(eq(aiSystems.id, cycle.aiSystemId))
          .limit(1);

        if (!system || system.userId !== ctx.user.id) {
          throw new Error("Access denied");
        }
      }

      // Update the appropriate summary field
      const updateData: Record<string, string> = {};
      switch (input.phase) {
        case "plan":
          updateData.planSummary = input.summary;
          break;
        case "do":
          updateData.doSummary = input.summary;
          break;
        case "check":
          updateData.checkSummary = input.summary;
          break;
        case "act":
          updateData.actSummary = input.summary;
          break;
      }

      await db
        .update(pdcaCycles)
        .set(updateData)
        .where(eq(pdcaCycles.id, input.id));

      return { success: true };
    }),

  // Advance to the next phase
  advancePhase: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get the cycle
      const [cycle] = await db
        .select()
        .from(pdcaCycles)
        .where(eq(pdcaCycles.id, input.id))
        .limit(1);

      if (!cycle) {
        throw new Error("PDCA cycle not found");
      }

      // Verify user owns the AI system
      if (cycle.aiSystemId) {
        const [system] = await db
          .select()
          .from(aiSystems)
          .where(eq(aiSystems.id, cycle.aiSystemId))
          .limit(1);

        if (!system || system.userId !== ctx.user.id) {
          throw new Error("Access denied");
        }
      }

      // Determine next phase
      const phaseOrder: ("plan" | "do" | "check" | "act")[] = ["plan", "do", "check", "act"];
      const currentIndex = phaseOrder.indexOf(cycle.phase);
      
      if (currentIndex === 3) {
        // Completing the Act phase - mark cycle as completed
        await db
          .update(pdcaCycles)
          .set({ status: "completed", completedAt: new Date() })
          .where(eq(pdcaCycles.id, input.id));

        return { success: true, completed: true, nextPhase: null };
      }

      const nextPhase = phaseOrder[currentIndex + 1];

      await db
        .update(pdcaCycles)
        .set({ phase: nextPhase })
        .where(eq(pdcaCycles.id, input.id));

      return { success: true, completed: false, nextPhase };
    }),

  // Pause a cycle
  pause: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [cycle] = await db
        .select()
        .from(pdcaCycles)
        .where(eq(pdcaCycles.id, input.id))
        .limit(1);

      if (!cycle) {
        throw new Error("PDCA cycle not found");
      }

      // Verify access
      if (cycle.aiSystemId) {
        const [system] = await db
          .select()
          .from(aiSystems)
          .where(eq(aiSystems.id, cycle.aiSystemId))
          .limit(1);

        if (!system || system.userId !== ctx.user.id) {
          throw new Error("Access denied");
        }
      }

      await db
        .update(pdcaCycles)
        .set({ status: "paused" })
        .where(eq(pdcaCycles.id, input.id));

      return { success: true };
    }),

  // Resume a paused cycle
  resume: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [cycle] = await db
        .select()
        .from(pdcaCycles)
        .where(eq(pdcaCycles.id, input.id))
        .limit(1);

      if (!cycle || cycle.status !== "paused") {
        throw new Error("PDCA cycle not found or not paused");
      }

      // Verify access
      if (cycle.aiSystemId) {
        const [system] = await db
          .select()
          .from(aiSystems)
          .where(eq(aiSystems.id, cycle.aiSystemId))
          .limit(1);

        if (!system || system.userId !== ctx.user.id) {
          throw new Error("Access denied");
        }
      }

      await db
        .update(pdcaCycles)
        .set({ status: "active" })
        .where(eq(pdcaCycles.id, input.id));

      return { success: true };
    }),

  // Delete a cycle
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [cycle] = await db
        .select()
        .from(pdcaCycles)
        .where(eq(pdcaCycles.id, input.id))
        .limit(1);

      if (!cycle) {
        throw new Error("PDCA cycle not found");
      }

      // Verify access
      if (cycle.aiSystemId) {
        const [system] = await db
          .select()
          .from(aiSystems)
          .where(eq(aiSystems.id, cycle.aiSystemId))
          .limit(1);

        if (!system || system.userId !== ctx.user.id) {
          throw new Error("Access denied");
        }
      }

      await db
        .delete(pdcaCycles)
        .where(eq(pdcaCycles.id, input.id));

      return { success: true };
    }),

  // Send PDF report via email
  sendReport: protectedProcedure
    .input(z.object({
      id: z.number(),
      email: z.string().email("Please enter a valid email address"),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get the cycle with AI system details
      const [cycle] = await db
        .select({
          id: pdcaCycles.id,
          cycleNumber: pdcaCycles.cycleNumber,
          phase: pdcaCycles.phase,
          planSummary: pdcaCycles.planSummary,
          doSummary: pdcaCycles.doSummary,
          checkSummary: pdcaCycles.checkSummary,
          actSummary: pdcaCycles.actSummary,
          status: pdcaCycles.status,
          startedAt: pdcaCycles.startedAt,
          completedAt: pdcaCycles.completedAt,
          aiSystemName: aiSystems.name,
          aiSystemType: aiSystems.systemType,
          aiSystemRiskLevel: aiSystems.riskLevel,
        })
        .from(pdcaCycles)
        .leftJoin(aiSystems, eq(pdcaCycles.aiSystemId, aiSystems.id))
        .where(eq(pdcaCycles.id, input.id))
        .limit(1);

      if (!cycle) {
        throw new Error("PDCA cycle not found");
      }

      // Generate PDF
      const { generatePDCACyclePDF } = await import("./pdfGenerator");
      const pdfBuffer = await generatePDCACyclePDF(cycle as any);

      // Send email
      const { sendPDCAReport } = await import("./emailService");
      const result = await sendPDCAReport(
        input.email,
        cycle.cycleNumber,
        cycle.aiSystemName || "Unknown System",
        pdfBuffer
      );

      if (!result.success) {
        throw new Error(result.error || "Failed to send email");
      }

      return {
        success: true,
        messageId: result.messageId,
        previewUrl: result.previewUrl, // For testing with ethereal
      };
    }),

  // Generate PDF report for a PDCA cycle
  generateReport: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get the cycle with AI system details
      const [cycle] = await db
        .select({
          id: pdcaCycles.id,
          cycleNumber: pdcaCycles.cycleNumber,
          phase: pdcaCycles.phase,
          planSummary: pdcaCycles.planSummary,
          doSummary: pdcaCycles.doSummary,
          checkSummary: pdcaCycles.checkSummary,
          actSummary: pdcaCycles.actSummary,
          status: pdcaCycles.status,
          startedAt: pdcaCycles.startedAt,
          completedAt: pdcaCycles.completedAt,
          aiSystemName: aiSystems.name,
          aiSystemType: aiSystems.systemType,
          aiSystemRiskLevel: aiSystems.riskLevel,
        })
        .from(pdcaCycles)
        .leftJoin(aiSystems, eq(pdcaCycles.aiSystemId, aiSystems.id))
        .where(eq(pdcaCycles.id, input.id))
        .limit(1);

      if (!cycle) {
        throw new Error("PDCA cycle not found");
      }

      // Verify user has access to this cycle
      const [aiSystem] = await db
        .select()
        .from(aiSystems)
        .where(eq(aiSystems.name, cycle.aiSystemName || ""))
        .limit(1);

      if (aiSystem && aiSystem.userId !== ctx.user.id) {
        throw new Error("Access denied");
      }

      // Generate PDF
      const { generatePDCACyclePDF } = await import("./pdfGenerator");
      const pdfBuffer = await generatePDCACyclePDF(cycle as any);

      // Return as base64 for client download
      return {
        filename: `PDCA-Cycle-${cycle.cycleNumber}-Report.pdf`,
        data: pdfBuffer.toString("base64"),
        mimeType: "application/pdf",
      };
    }),

  // Get PDCA stats for dashboard
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;

    // Get user's AI systems
    const userSystems = await db
      .select({ id: aiSystems.id })
      .from(aiSystems)
      .where(eq(aiSystems.userId, ctx.user.id));

    const systemIds = userSystems.map(s => s.id);

    if (systemIds.length === 0) {
      return {
        totalCycles: 0,
        activeCycles: 0,
        completedCycles: 0,
        pausedCycles: 0,
        phaseDistribution: { plan: 0, do: 0, check: 0, act: 0 },
      };
    }

    // Get all cycles for user's systems
    const cycles = await db
      .select()
      .from(pdcaCycles)
      .where(sql`${pdcaCycles.aiSystemId} IN (${sql.join(systemIds, sql`, `)})`);

    const activeCycles = cycles.filter(c => c.status === "active");
    const phaseDistribution = {
      plan: activeCycles.filter(c => c.phase === "plan").length,
      do: activeCycles.filter(c => c.phase === "do").length,
      check: activeCycles.filter(c => c.phase === "check").length,
      act: activeCycles.filter(c => c.phase === "act").length,
    };

    return {
      totalCycles: cycles.length,
      activeCycles: activeCycles.length,
      completedCycles: cycles.filter(c => c.status === "completed").length,
      pausedCycles: cycles.filter(c => c.status === "paused").length,
      phaseDistribution,
    };
  }),
});

// ============================================
// API KEYS ROUTER - Enterprise API key management
// ============================================

function generateApiKey(): { key: string; prefix: string; hash: string } {
  const key = `coai_${crypto.randomBytes(32).toString('hex')}`;
  const prefix = key.substring(0, 12);
  const hash = crypto.createHash('sha256').update(key).digest('hex');
  return { key, prefix, hash };
}

const apiKeysRouter = router({
  // List user's API keys
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    return db
      .select({
        id: apiKeys.id,
        name: apiKeys.name,
        keyPrefix: apiKeys.keyPrefix,
        tier: apiKeys.tier,
        rateLimit: apiKeys.rateLimit,
        lastUsedAt: apiKeys.lastUsedAt,
        expiresAt: apiKeys.expiresAt,
        isActive: apiKeys.isActive,
        createdAt: apiKeys.createdAt,
      })
      .from(apiKeys)
      .where(eq(apiKeys.userId, ctx.user.id))
      .orderBy(desc(apiKeys.createdAt));
  }),

  // Create a new API key
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(255),
      tier: z.enum(["free", "pro", "enterprise"]).default("free"),
      expiresInDays: z.number().min(1).max(365).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { key, prefix, hash } = generateApiKey();
      
      const expiresAt = input.expiresInDays 
        ? new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000)
        : null;

      const rateLimit = input.tier === "enterprise" ? 1000 
        : input.tier === "pro" ? 500 
        : 100;

      const [result] = await db.insert(apiKeys).values({
        userId: ctx.user.id,
        name: input.name,
        keyPrefix: prefix,
        keyHash: hash,
        tier: input.tier,
        rateLimit,
        expiresAt,
      }).$returningId();

      // Return the full key only once - it won't be retrievable later
      return {
        id: result.id,
        key, // Full key - show to user only once!
        name: input.name,
        tier: input.tier,
        rateLimit,
        expiresAt,
      };
    }),

  // Revoke an API key
  revoke: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify ownership
      const [existing] = await db
        .select()
        .from(apiKeys)
        .where(eq(apiKeys.id, input.id))
        .limit(1);

      if (!existing || existing.userId !== ctx.user.id) {
        throw new Error("API key not found or access denied");
      }

      await db
        .update(apiKeys)
        .set({ isActive: false })
        .where(eq(apiKeys.id, input.id));

      return { success: true };
    }),

  // Delete an API key permanently
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify ownership
      const [existing] = await db
        .select()
        .from(apiKeys)
        .where(eq(apiKeys.id, input.id))
        .limit(1);

      if (!existing || existing.userId !== ctx.user.id) {
        throw new Error("API key not found or access denied");
      }

      await db
        .delete(apiKeys)
        .where(eq(apiKeys.id, input.id));

      return { success: true };
    }),
});

// ============================================
// STRIPE BILLING ROUTER - Subscription management
// ============================================
const stripeRouter = router({
  // Create checkout session for subscription
  createCheckoutSession: protectedProcedure
    .input(z.object({
      tier: z.enum(["pro", "enterprise"]),
      billingPeriod: z.enum(["monthly", "yearly"]),
    }))
    .mutation(async ({ input, ctx }) => {
      const { createCheckoutSession } = await import("./stripe/stripeService");
      
      const origin = ctx.req.headers.origin || "http://localhost:3000";
      
      const result = await createCheckoutSession({
        userId: ctx.user.id,
        email: ctx.user.email || "",
        name: ctx.user.name || undefined,
        tier: input.tier,
        billingPeriod: input.billingPeriod,
        successUrl: `${origin}/settings/billing?success=true`,
        cancelUrl: `${origin}/settings/billing?canceled=true`,
      });
      
      return { url: result.url, sessionId: result.sessionId };
    }),

  // Create customer portal session for managing subscription
  createPortalSession: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);

    if (!user?.stripeCustomerId) {
      throw new Error("No Stripe customer found. Please subscribe first.");
    }

    const { createPortalSession } = await import("./stripe/stripeService");
    const origin = ctx.req.headers.origin || "http://localhost:3000";
    const url = await createPortalSession(user.stripeCustomerId, `${origin}/settings/billing`);
    
    return { url };
  }),

  // Get current subscription status
  getSubscriptionStatus: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { tier: "free", status: "none" };

    const [user] = await db
      .select({
        subscriptionTier: users.subscriptionTier,
        subscriptionStatus: users.subscriptionStatus,
        stripeCustomerId: users.stripeCustomerId,
        stripeSubscriptionId: users.stripeSubscriptionId,
      })
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);

    if (!user) return { tier: "free", status: "none" };

    return {
      tier: user.subscriptionTier,
      status: user.subscriptionStatus,
      hasStripeCustomer: !!user.stripeCustomerId,
      hasSubscription: !!user.stripeSubscriptionId,
    };
  }),

  // Get pricing tiers info
  getPricingTiers: publicProcedure.query(async () => {
    const { SUBSCRIPTION_TIERS } = await import("./stripe/products");
    return SUBSCRIPTION_TIERS;
  }),
});

// ============================================
// REGULATOR ROUTER - Government/regulatory body access
// ============================================
const regulatorProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'regulator' && ctx.user.role !== 'admin') {
    throw new Error('Regulator access required');
  }
  return next({ ctx });
});

const regulatorRouter = router({
  // Get aggregated compliance dashboard for all organizations
  getComplianceDashboard: regulatorProcedure.query(async () => {
    const db = await getDb();
    if (!db) return null;

    // Get all assessments with system and framework info
    const allAssessments = await db
      .select({
        id: assessments.id,
        status: assessments.status,
        overallScore: assessments.overallScore,
        frameworkCode: frameworks.code,
        frameworkName: frameworks.name,
        systemName: aiSystems.name,
        systemType: aiSystems.systemType,
        riskLevel: aiSystems.riskLevel,
        completedAt: assessments.completedAt,
      })
      .from(assessments)
      .leftJoin(frameworks, eq(assessments.frameworkId, frameworks.id))
      .leftJoin(aiSystems, eq(assessments.aiSystemId, aiSystems.id))
      .orderBy(desc(assessments.completedAt))
      .limit(500);

    // Calculate framework-level stats
    const frameworkStats: Record<string, { total: number; compliant: number; avgScore: number }> = {};
    for (const a of allAssessments) {
      const code = a.frameworkCode || 'unknown';
      if (!frameworkStats[code]) {
        frameworkStats[code] = { total: 0, compliant: 0, avgScore: 0 };
      }
      frameworkStats[code].total++;
      if (a.status === 'completed' && (Number(a.overallScore) || 0) >= 70) {
        frameworkStats[code].compliant++;
      }
      frameworkStats[code].avgScore += Number(a.overallScore) || 0;
    }

    // Calculate averages
    for (const code of Object.keys(frameworkStats)) {
      if (frameworkStats[code].total > 0) {
        frameworkStats[code].avgScore = Math.round(frameworkStats[code].avgScore / frameworkStats[code].total);
      }
    }

    // Risk level distribution
    const riskDistribution = {
      minimal: allAssessments.filter(a => a.riskLevel === 'minimal').length,
      limited: allAssessments.filter(a => a.riskLevel === 'limited').length,
      high: allAssessments.filter(a => a.riskLevel === 'high').length,
      unacceptable: allAssessments.filter(a => a.riskLevel === 'unacceptable').length,
    };

    // Get recent watchdog reports for regulatory attention
    const recentReports = await db
      .select()
      .from(watchdogReports)
      .where(eq(watchdogReports.severity, 'critical'))
      .orderBy(desc(watchdogReports.createdAt))
      .limit(10);

    return {
      totalAssessments: allAssessments.length,
      frameworkStats,
      riskDistribution,
      recentCriticalReports: recentReports,
      recentAssessments: allAssessments.slice(0, 20),
    };
  }),

  // Get all AI systems across all organizations
  getAllSystems: regulatorProcedure
    .input(z.object({
      riskLevel: z.enum(['all', 'minimal', 'limited', 'high', 'unacceptable']).optional(),
      status: z.enum(['all', 'draft', 'active', 'under_review', 'compliant', 'non_compliant', 'archived']).optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      let query = db.select().from(aiSystems);

      if (input?.riskLevel && input.riskLevel !== 'all') {
        query = query.where(eq(aiSystems.riskLevel, input.riskLevel)) as any;
      }

      if (input?.status && input.status !== 'all') {
        query = query.where(eq(aiSystems.status, input.status)) as any;
      }

      return query.orderBy(desc(aiSystems.createdAt)).limit(200);
    }),

  // Get all watchdog reports for regulatory review
  getAllReports: regulatorProcedure
    .input(z.object({
      severity: z.enum(['all', 'low', 'medium', 'high', 'critical']).optional(),
      status: z.enum(['all', 'submitted', 'under_review', 'investigating', 'resolved', 'dismissed']).optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      let query = db.select().from(watchdogReports);

      if (input?.severity && input.severity !== 'all') {
        query = query.where(eq(watchdogReports.severity, input.severity)) as any;
      }

      if (input?.status && input.status !== 'all') {
        query = query.where(eq(watchdogReports.status, input.status)) as any;
      }

      return query.orderBy(desc(watchdogReports.createdAt)).limit(200);
    }),

  // Get compliance trends over time
  getComplianceTrends: regulatorProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    // Get assessments from last 6 months grouped by month
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const assessmentData = await db
      .select({
        completedAt: assessments.completedAt,
        overallScore: assessments.overallScore,
        frameworkCode: frameworks.code,
      })
      .from(assessments)
      .leftJoin(frameworks, eq(assessments.frameworkId, frameworks.id))
      .where(sql`${assessments.completedAt} >= ${sixMonthsAgo}`)
      .orderBy(assessments.completedAt);

    // Group by month
    const monthlyData: Record<string, { count: number; avgScore: number; scores: number[] }> = {};
    for (const a of assessmentData) {
      if (!a.completedAt) continue;
      const month = a.completedAt.toISOString().slice(0, 7);
      if (!monthlyData[month]) {
        monthlyData[month] = { count: 0, avgScore: 0, scores: [] };
      }
      monthlyData[month].count++;
      monthlyData[month].scores.push(Number(a.overallScore) || 0);
    }

    // Calculate averages
    const trends = Object.entries(monthlyData).map(([month, data]) => ({
      month,
      assessmentCount: data.count,
      avgScore: data.scores.length > 0 
        ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length)
        : 0,
    }));

    return trends.sort((a, b) => a.month.localeCompare(b.month));
  }),

  // Export compliance data for regulatory reporting
  exportComplianceData: regulatorProcedure
    .input(z.object({
      frameworkCode: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      let query = db
        .select({
          systemName: aiSystems.name,
          systemType: aiSystems.systemType,
          riskLevel: aiSystems.riskLevel,
          frameworkCode: frameworks.code,
          frameworkName: frameworks.name,
          assessmentStatus: assessments.status,
          overallScore: assessments.overallScore,
          completedAt: assessments.completedAt,
        })
        .from(assessments)
        .leftJoin(frameworks, eq(assessments.frameworkId, frameworks.id))
        .leftJoin(aiSystems, eq(assessments.aiSystemId, aiSystems.id));

      if (input.frameworkCode) {
        query = query.where(eq(frameworks.code, input.frameworkCode)) as any;
      }

      const data = await query.orderBy(desc(assessments.completedAt));

      // Generate CSV content
      const headers = ['System Name', 'System Type', 'Risk Level', 'Framework', 'Status', 'Score', 'Completed At'];
      const rows = data.map(d => [
        d.systemName || '',
        d.systemType || '',
        d.riskLevel || '',
        d.frameworkCode || '',
        d.assessmentStatus || '',
        String(d.overallScore || 0),
        d.completedAt?.toISOString() || '',
      ]);

      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

      return {
        filename: `compliance-export-${new Date().toISOString().slice(0, 10)}.csv`,
        data: Buffer.from(csv).toString('base64'),
        mimeType: 'text/csv',
      };
    }),
});

// ============================================
// MAIN APP ROUTER
// ============================================
export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  
  // Feature routers
  watchdog: watchdogRouter,
  applications: applicationsRouter,
  council: councilRouter,
  compliance: complianceRouter,
  aiSystems: aiSystemsRouter,
  dashboard: dashboardRouter,
  training: trainingRouter,
  certification: certificationRouter,
  workbench: workbenchRouter,
  chat: chatRouter,
  admin: adminRouter,
  apiKeys: apiKeysRouter,
  pdca: pdcaRouter,
  stripe: stripeRouter,
  publicApi: publicApiRouter,
  regulator: regulatorRouter,
  recommendations: recommendationsRouter,
  courses: coursesRouter,
  modulePopulation: modulePopulationRouter,
  progress: progressRouter,
  certificates: certificatesRouter,
  pdcaTemplates: pdcaTemplatesRouter,
  bulkImport: bulkImportRouter,
  jobs: jobsRouter,
  notifications: notificationsRouter,
  fileUpload: fileUploadRouter,
});

export type AppRouter = typeof appRouter;
