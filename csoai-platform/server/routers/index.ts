/**
 * CSOAI Platform - tRPC Router Index
 *
 * Main router combining all domain-specific routers for the CSOAI platform.
 * Implements type-safe API communication between frontend and backend.
 *
 * Features:
 * - Multi-framework compliance (EU AI Act, NIST AI RMF, ISO 42001, TC260)
 * - 33-Agent Council Byzantine fault-tolerant voting
 * - Watchdog incident reporting
 * - Training and certification system
 * - Analyst workbench and job marketplace
 */

import { initTRPC, TRPCError } from '@trpc/server';
import { z } from 'zod';
import superjson from 'superjson';
import type { Context } from '../db/context';
import { authenticateUser, registerUser, getDemoAccounts } from '../services/auth';
import { generateAgentCouncil, getCouncilStats, getMockVotingSessions, executeSimulatedVoting } from '../services/council';
import { protocol0Router } from './protocol0';

// Initialize tRPC with context and superjson transformer
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof z.ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

// Export router and procedure helpers
export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;

// Auth middleware - checks if user is authenticated
const isAuthenticated = middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource',
    });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

// Protected procedure - requires authentication
export const protectedProcedure = t.procedure.use(isAuthenticated);

// Admin middleware - checks if user is admin
const isAdmin = middleware(async ({ ctx, next }) => {
  if (!ctx.user || ctx.user.role !== 'admin') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You must be an admin to access this resource',
    });
  }
  return next({ ctx });
});

// Admin procedure - requires admin role
export const adminProcedure = protectedProcedure.use(isAdmin);

// Analyst middleware
const isAnalyst = middleware(async ({ ctx, next }) => {
  if (!ctx.user || !['watchdog_analyst', 'admin'].includes(ctx.user.role)) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You must be a certified analyst to access this resource',
    });
  }
  return next({ ctx });
});

export const analystProcedure = protectedProcedure.use(isAnalyst);

// Enterprise middleware
const isEnterprise = middleware(async ({ ctx, next }) => {
  if (!ctx.user || !['enterprise_admin', 'compliance_officer', 'admin'].includes(ctx.user.role)) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You must have enterprise access to use this resource',
    });
  }
  return next({ ctx });
});

export const enterpriseProcedure = protectedProcedure.use(isEnterprise);

// ============================================================================
// AUTH ROUTER
// ============================================================================
const authRouter = router({
  me: publicProcedure.query(async ({ ctx }) => {
    return ctx.user || null;
  }),

  login: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(6),
    }))
    .mutation(async ({ input }) => {
      const result = await authenticateUser(input.email, input.password);
      if (!result) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid email or password',
        });
      }
      return {
        success: true,
        token: result.token,
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          role: result.user.role,
          subscriptionTier: result.user.subscriptionTier,
        },
      };
    }),

  register: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(6),
      name: z.string().min(2),
    }))
    .mutation(async ({ input }) => {
      const result = await registerUser(input.email, input.password, input.name);
      if (!result) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'User with this email already exists',
        });
      }
      return {
        success: true,
        token: result.token,
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          role: result.user.role,
          subscriptionTier: result.user.subscriptionTier,
        },
      };
    }),

  logout: protectedProcedure.mutation(async () => {
    return { success: true };
  }),

  // Get demo accounts for development
  getDemoAccounts: publicProcedure.query(async () => {
    return getDemoAccounts();
  }),
});

// ============================================================================
// DASHBOARD ROUTER
// ============================================================================
const dashboardRouter = router({
  getStats: protectedProcedure.query(async ({ ctx }) => {
    // Return realistic mock data for development
    return {
      totalAiSystems: 12,
      totalSystems: 12, // alias for totalAiSystems
      compliantSystems: 8,
      pendingAssessments: 3,
      pendingReviews: 3, // alias for pendingAssessments
      activeIncidents: 2,
      watchdogReportsToday: 5,
      agentVotesToday: 47,
      complianceScore: 78, // overall compliance score
      overallScore: 78, // alias
      complianceByFramework: {
        euAiAct: { compliant: 6, total: 10 },
        nistAiRmf: { compliant: 7, total: 9 },
        iso42001: { compliant: 5, total: 8 },
        tc260: { compliant: 4, total: 6 },
      },
      riskDistribution: {
        unacceptable: 0,
        high: 3,
        limited: 5,
        minimal: 4,
      },
      recentActivity: [
        { type: 'assessment', message: 'EU AI Act assessment completed for ChatBot Pro', time: '2 hours ago' },
        { type: 'incident', message: 'New watchdog report: Bias detected in hiring AI', time: '4 hours ago' },
        { type: 'council', message: '33-Agent Council voted on incident #2847', time: '6 hours ago' },
        { type: 'training', message: 'New analyst certified: Sarah Chen', time: '1 day ago' },
      ],
    };
  }),

  getCount: publicProcedure.query(async () => {
    return {
      aiSystems: 12,
      assessments: 47,
      reports: 2847,
      certifications: 8934,
    };
  }),

  list: protectedProcedure.query(async () => {
    return [
      { id: 1, name: 'Customer Service Chatbot', status: 'active', riskLevel: 'limited' },
      { id: 2, name: 'TalentScore AI', status: 'under_review', riskLevel: 'high' },
      { id: 3, name: 'Content Recommendation Engine', status: 'active', riskLevel: 'minimal' },
    ];
  }),
});

// ============================================================================
// AI SYSTEMS ROUTER
// ============================================================================
const mockAISystems = [
  {
    id: 1,
    name: 'Customer Service Chatbot',
    description: 'AI-powered customer support chatbot for handling inquiries',
    systemType: 'chatbot' as const,
    riskLevel: 'limited' as const,
    status: 'active' as const,
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-10'),
  },
  {
    id: 2,
    name: 'TalentScore AI',
    description: 'Resume screening and candidate ranking system',
    systemType: 'classification' as const,
    riskLevel: 'high' as const,
    status: 'under_review' as const,
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-08'),
  },
  {
    id: 3,
    name: 'Content Recommendation Engine',
    description: 'Personalized content suggestions for users',
    systemType: 'recommendation' as const,
    riskLevel: 'minimal' as const,
    status: 'active' as const,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-07'),
  },
];

const aiSystemsRouter = router({
  list: protectedProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(20),
      status: z.string().optional(),
      riskLevel: z.string().optional(),
      search: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      // Return array directly (client expects array, not object)
      return mockAISystems;
    }),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      systemType: z.enum(['chatbot', 'recommendation', 'classification', 'generation', 'analysis', 'other']),
      riskLevel: z.enum(['minimal', 'limited', 'high', 'unacceptable']).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const newSystem = {
        id: mockAISystems.length + 1,
        name: input.name,
        description: input.description || null,
        systemType: input.systemType,
        riskLevel: input.riskLevel || 'minimal' as const,
        status: 'draft' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as typeof mockAISystems[0];
      mockAISystems.push(newSystem);
      return { success: true, id: newSystem.id };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return mockAISystems.find(s => s.id === input.id) || null;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      systemType: z.enum(['chatbot', 'recommendation', 'classification', 'generation', 'analysis', 'other']).optional(),
      riskLevel: z.enum(['minimal', 'limited', 'high', 'unacceptable']).optional(),
      status: z.enum(['draft', 'active', 'archived', 'under_review']).optional(),
    }))
    .mutation(async ({ input }) => {
      const system = mockAISystems.find(s => s.id === input.id);
      if (system) {
        if (input.name) system.name = input.name;
        if (input.description !== undefined) system.description = input.description;
        if (input.systemType) (system as any).systemType = input.systemType;
        if (input.riskLevel) (system as any).riskLevel = input.riskLevel;
        if (input.status) (system as any).status = input.status;
        system.updatedAt = new Date();
      }
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const index = mockAISystems.findIndex(s => s.id === input.id);
      if (index !== -1) {
        mockAISystems.splice(index, 1);
      }
      return { success: true };
    }),
});

// ============================================================================
// COMPLIANCE ROUTER - Multi-Framework Support
// ============================================================================
const complianceRouter = router({
  getFrameworks: publicProcedure.query(async () => {
    return [
      {
        id: 1,
        code: 'EU_AI_ACT',
        name: 'EU AI Act',
        version: '2024',
        jurisdiction: 'European Union',
        totalArticles: 113,
        effectiveDate: '2026-08-02',
        description: 'Comprehensive AI regulation for the European Union market. First-ever legal framework on AI worldwide.',
        requirements: [
          'Risk classification (Article 6)',
          'High-risk system requirements (Articles 8-15)',
          'Transparency obligations (Articles 50, 52)',
          'Human oversight (Article 14)',
          'Data governance (Article 10)',
          'Record-keeping (Article 12)',
          'Conformity assessment (Article 43)',
        ],
      },
      {
        id: 2,
        code: 'NIST_AI_RMF',
        name: 'NIST AI Risk Management Framework',
        version: '1.0',
        jurisdiction: 'United States',
        totalRequirements: 72,
        description: 'Voluntary framework for managing AI risks across the AI lifecycle.',
        functions: ['GOVERN', 'MAP', 'MEASURE', 'MANAGE'],
      },
      {
        id: 3,
        code: 'ISO_42001',
        name: 'ISO/IEC 42001',
        version: '2023',
        jurisdiction: 'International',
        totalRequirements: 56,
        description: 'AI Management System standard for organizations developing or using AI.',
      },
      {
        id: 4,
        code: 'TC260',
        name: 'TC260 AI Safety Governance Framework',
        version: '2.0',
        jurisdiction: 'China',
        totalRequirements: 30,
        description: 'Chinese national AI safety governance standard.',
        riskCategories: ['Inherent Risk', 'Application Risk', 'Derivative Risk'],
      },
    ];
  }),

  getRequirements: publicProcedure
    .input(z.object({ frameworkCode: z.string() }))
    .query(async ({ input }) => {
      // Return EU AI Act articles as example
      if (input.frameworkCode === 'EU_AI_ACT') {
        return [
          { id: 1, articleNumber: 'Article 6', title: 'Classification Rules for High-Risk AI Systems', category: 'Risk Classification' },
          { id: 2, articleNumber: 'Article 9', title: 'Risk Management System', category: 'High-Risk Requirements' },
          { id: 3, articleNumber: 'Article 10', title: 'Data and Data Governance', category: 'High-Risk Requirements' },
          { id: 4, articleNumber: 'Article 11', title: 'Technical Documentation', category: 'High-Risk Requirements' },
          { id: 5, articleNumber: 'Article 12', title: 'Record-Keeping', category: 'High-Risk Requirements' },
          { id: 6, articleNumber: 'Article 13', title: 'Transparency and Provision of Information', category: 'High-Risk Requirements' },
          { id: 7, articleNumber: 'Article 14', title: 'Human Oversight', category: 'High-Risk Requirements' },
          { id: 8, articleNumber: 'Article 15', title: 'Accuracy, Robustness and Cybersecurity', category: 'High-Risk Requirements' },
          // ... more articles
        ];
      }
      return [];
    }),

  startAssessment: protectedProcedure
    .input(z.object({
      aiSystemId: z.number(),
      frameworkId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      return { success: true, assessmentId: 1 };
    }),

  createAssessment: protectedProcedure
    .input(z.object({
      aiSystemId: z.number(),
      frameworkCode: z.string(),
      frameworkId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      return {
        success: true,
        assessmentId: Date.now(),
        overallScore: 0,
        compliantCount: 0,
        partialCount: 0,
        nonCompliantCount: 0,
      };
    }),

  getAssessment: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return {
        id: input.id,
        status: 'in_progress',
        score: 75,
        framework: 'EU_AI_ACT',
        createdAt: new Date(),
      };
    }),

  getAssessments: protectedProcedure
    .input(z.object({
      systemId: z.number().optional(),
      aiSystemId: z.number().optional(),
      frameworkCode: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      const rawAssessments = [
        {
          id: 1,
          aiSystemId: 1,
          aiSystemName: 'Customer Service Chatbot',
          frameworkCode: 'EU_AI_ACT',
          frameworkName: 'EU AI Act',
          status: 'completed',
          score: 85,
          completedAt: new Date('2024-01-10'),
        },
        {
          id: 2,
          aiSystemId: 2,
          aiSystemName: 'TalentScore AI',
          frameworkCode: 'NIST_AI_RMF',
          frameworkName: 'NIST AI RMF',
          status: 'in_progress',
          score: 45,
          completedAt: null,
        },
      ];

      // Return with nested assessment, aiSystem, and framework objects for client compatibility
      return rawAssessments.map(a => ({
        ...a,
        overallScore: a.score,
        frameworkId: a.frameworkCode,
        createdAt: a.completedAt || new Date(),
        assessment: {
          id: a.id,
          status: a.status,
          score: a.score,
          overallScore: a.score,
          completedAt: a.completedAt,
        },
        aiSystem: {
          id: a.aiSystemId,
          name: a.aiSystemName,
        },
        framework: {
          code: a.frameworkCode,
          name: a.frameworkName,
        },
      }));
    }),

  getSummary: protectedProcedure.query(async () => {
    return {
      totalAssessments: 12,
      completedAssessments: 8,
      averageScore: 78,
      totalSystems: 12,
      compliantSystems: 8,
      pendingAssessments: 4,
      overallScore: 78,
      byFramework: {
        EU_AI_ACT: { count: 5, avgScore: 82 },
        NIST_AI_RMF: { count: 4, avgScore: 75 },
        ISO_42001: { count: 3, avgScore: 70 },
      },
    };
  }),

  generateReport: protectedProcedure
    .input(z.object({
      assessmentId: z.number(),
      format: z.enum(['pdf', 'html']).optional(),
    }))
    .mutation(async ({ input }) => {
      return {
        success: true,
        reportUrl: `/reports/assessment-${input.assessmentId}.pdf`,
        pdf: `/reports/assessment-${input.assessmentId}.pdf`,
        filename: `assessment-${input.assessmentId}.pdf`,
      };
    }),

  sendReport: protectedProcedure
    .input(z.object({
      assessmentId: z.number(),
      email: z.string().email(),
    }))
    .mutation(async ({ input }) => {
      return {
        success: true,
        message: `Report sent to ${input.email}`,
        previewUrl: `/reports/preview-${input.assessmentId}.html`,
      };
    }),
});

// ============================================================================
// 33-AGENT COUNCIL ROUTER - Byzantine Fault-Tolerant Voting
// ============================================================================
// Mock council sessions data
const mockCouncilSessionsData = [
  {
    id: 1,
    sessionId: 1,
    subjectType: 'watchdog_report',
    subjectId: 1,
    subjectTitle: 'Hiring AI Gender Bias Assessment',
    subjectDescription: 'Review of reported gender bias in TalentScore AI hiring system',
    status: 'completed',
    totalVotes: 33,
    approveVotes: 24,
    rejectVotes: 6,
    escalateVotes: 3,
    finalDecision: 'approved',
    consensusReached: true,
    createdAt: new Date('2024-01-10T14:30:00'),
    votes: [
      { agentId: 'agent_1', vote: 'approve', confidence: '0.92', agentProvider: 'OpenAI' },
      { agentId: 'agent_2', vote: 'approve', confidence: '0.88', agentProvider: 'Anthropic' },
    ],
  },
  {
    id: 2,
    sessionId: 2,
    subjectType: 'assessment',
    subjectId: 2,
    subjectTitle: 'EU AI Act High-Risk Classification Review',
    subjectDescription: 'Evaluating compliance of ChatBot Pro with EU AI Act requirements',
    status: 'completed',
    totalVotes: 33,
    approveVotes: 28,
    rejectVotes: 3,
    escalateVotes: 2,
    finalDecision: 'approved',
    consensusReached: true,
    createdAt: new Date('2024-01-09T10:15:00'),
    votes: [],
  },
  {
    id: 3,
    sessionId: 3,
    subjectType: 'policy_proposal',
    subjectId: 3,
    subjectTitle: 'Medical AI Safety Guidelines',
    subjectDescription: 'Proposed safety guidelines for AI systems in healthcare',
    status: 'voting',
    totalVotes: 22,
    approveVotes: 15,
    rejectVotes: 5,
    escalateVotes: 2,
    finalDecision: null,
    consensusReached: false,
    createdAt: new Date('2024-01-12T08:00:00'),
    votes: [],
  },
];

const councilRouter = router({
  // List sessions - client expects array directly
  list: publicProcedure.query(async () => {
    return mockCouncilSessionsData;
  }),

  getSessions: publicProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(20),
      status: z.string().optional(),
    }))
    .query(async ({ input }) => {
      let filtered = [...mockCouncilSessionsData];

      if (input.status) {
        filtered = filtered.filter(s => s.status === input.status);
      }

      const start = (input.page - 1) * input.limit;
      const items = filtered.slice(start, start + input.limit);

      return { items, total: filtered.length };
    }),

  getSession: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const session = mockCouncilSessionsData.find(s => s.id === input.id);
      if (!session) return null;
      return {
        ...session,
        session: {
          subjectTitle: session.subjectTitle,
        },
      };
    }),

  triggerVoting: adminProcedure
    .input(z.object({
      subjectType: z.enum(['watchdog_report', 'assessment', 'policy_proposal', 'system_review']),
      subjectId: z.number(),
      subjectTitle: z.string(),
      subjectDescription: z.string(),
    }))
    .mutation(async ({ input }) => {
      // Execute simulated 33-Agent Council voting
      const result = await executeSimulatedVoting({
        type: input.subjectType,
        id: input.subjectId,
        title: input.subjectTitle,
        description: input.subjectDescription,
      });

      return {
        sessionId: result.sessionId,
        status: result.status,
        totalVotes: result.totalVotes,
        approveVotes: result.approveVotes,
        rejectVotes: result.rejectVotes,
        escalateVotes: result.escalateVotes,
        finalDecision: result.finalDecision,
        consensusReached: result.consensusReached,
        consensusThreshold: 22,
      };
    }),

  getAgents: publicProcedure.query(async () => {
    const agents = generateAgentCouncil();
    const stats = getCouncilStats();

    return { agents, stats };
  }),

  getStats: publicProcedure.query(async () => {
    const stats = getCouncilStats();
    return {
      ...stats,
      totalSessions: 2847,
      consensusRate: 94.7,
      consensusReached: 2341,
      escalatedToHuman: 156,
      pendingReview: 47,
      avgVotingTime: '2.3 seconds',
      recentDecisions: [
        { type: 'approved', count: 1923 },
        { type: 'rejected', count: 678 },
        { type: 'escalated', count: 246 },
      ],
    };
  }),

  // Bridge a message to the SOV3 mesh via the Sovereign Town dashboard.
  sov3Think: protectedProcedure
    .input(z.object({
      message: z.string().min(1),
      character: z.string().optional(),
      profile: z.enum(['local_only', 'balanced', 'power', 'council']).optional(),
    }))
    .mutation(async ({ input }) => {
      const SOV_TOWN_URL = process.env.SOV_TOWN_URL || 'http://127.0.0.1:3940';
      const apiToken = process.env.SOV_TOWN_API_TOKEN;
      try {
        const res = await fetch(`${SOV_TOWN_URL}/api/sov3/think`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(apiToken ? { Authorization: `Bearer ${apiToken}` } : {}),
          },
          body: JSON.stringify({
            message: input.message,
            character: input.character || 'sage',
            profile: input.profile || 'balanced',
          }),
        });
        if (!res.ok) {
          return { success: false, error: `SOV3 returned ${res.status}` };
        }
        const data = await res.json();
        return { success: true, result: data };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('[council.sov3Think] bridge error:', message);
        return { success: false, error: message };
      }
    }),

  // Health check for configured LLM providers.
  providersHealth: publicProcedure.query(() => {
    return {
      providers: {
        openai: !!process.env.OPENAI_API_KEY,
        anthropic: !!process.env.ANTHROPIC_API_KEY,
        google: !!process.env.GOOGLE_AI_API_KEY,
        glm: !!process.env.GLM_API_KEY,
        hermes: true, // local Ollama, no cloud key required
      },
      totalConfigured: [
        process.env.OPENAI_API_KEY,
        process.env.ANTHROPIC_API_KEY,
        process.env.GOOGLE_AI_API_KEY,
        process.env.GLM_API_KEY,
      ].filter(Boolean).length + 1,
    };
  }),
});

// ============================================================================
// WATCHDOG ROUTER - Public Incident Reporting
// ============================================================================
const mockWatchdogReports = [
  {
    id: 1,
    title: 'Hiring AI shows gender bias in candidate scoring',
    description: 'Our company\'s AI-powered hiring tool consistently scores male candidates higher for technical roles, even when qualifications are identical. Analysis of 500+ candidates showed a 23% scoring gap.',
    aiSystemName: 'TalentScore AI',
    companyName: 'TechHire Inc.',
    incidentType: 'bias' as const,
    severity: 'high' as const,
    status: 'investigating' as const,
    upvotes: 247,
    downvotes: 12,
    createdAt: new Date('2024-01-10'),
    reporterName: 'Anonymous HR Professional',
  },
  {
    id: 2,
    title: 'ChatGPT generates medical advice leading to harm',
    description: 'Patient followed ChatGPT-generated advice to mix medications that caused adverse reaction. The AI provided specific dosage recommendations despite disclaimers.',
    aiSystemName: 'ChatGPT',
    companyName: 'OpenAI',
    incidentType: 'safety' as const,
    severity: 'critical' as const,
    status: 'under_review' as const,
    upvotes: 892,
    downvotes: 45,
    createdAt: new Date('2024-01-08'),
    reporterName: 'Dr. Sarah Mitchell',
  },
  {
    id: 3,
    title: 'Facial recognition false positive leads to wrongful detention',
    description: 'AI-powered facial recognition at airport flagged innocent traveler as person of interest, leading to 6-hour detention and missed flight. System showed 94% confidence on incorrect match.',
    aiSystemName: 'SecureScan Pro',
    companyName: 'BiometricAI Corp',
    incidentType: 'privacy' as const,
    severity: 'high' as const,
    status: 'resolved' as const,
    upvotes: 1203,
    downvotes: 89,
    createdAt: new Date('2024-01-05'),
    reporterName: 'Marcus Johnson',
  },
  {
    id: 4,
    title: 'AI content generator spreading election misinformation',
    description: 'Automated content generation tool creating fake news articles about election candidates with fabricated quotes and events. Content has been shared over 50,000 times on social media.',
    aiSystemName: 'ContentMaster AI',
    companyName: 'Unknown',
    incidentType: 'misinformation' as const,
    severity: 'critical' as const,
    status: 'investigating' as const,
    upvotes: 2341,
    downvotes: 156,
    createdAt: new Date('2024-01-12'),
    reporterName: 'Journalism Ethics Board',
  },
  {
    id: 5,
    title: 'Deepfake AI used for financial fraud',
    description: 'AI-generated deepfake video of CEO was used to authorize $2.3M wire transfer to fraudulent account. Voice and face perfectly matched authentic recordings.',
    aiSystemName: 'Unknown Deepfake Tool',
    companyName: 'Unknown',
    incidentType: 'manipulation' as const,
    severity: 'critical' as const,
    status: 'submitted' as const,
    upvotes: 567,
    downvotes: 23,
    createdAt: new Date('2024-01-11'),
    reporterName: 'Corporate Security Team',
  },
];

const watchdogRouter = router({
  getCount: publicProcedure.query(async () => {
    return {
      total: 2847,
      pending: 156,
      investigating: 350,
      resolved: 2341,
    };
  }),

  list: publicProcedure.query(async () => {
    return mockWatchdogReports.slice(0, 10);
  }),

  getReports: publicProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(20),
      category: z.string().optional(),
      severity: z.string().optional(),
      status: z.string().optional(),
    }))
    .query(async ({ input }) => {
      let filtered = [...mockWatchdogReports];

      if (input.category) {
        filtered = filtered.filter(r => r.incidentType === input.category);
      }
      if (input.severity) {
        filtered = filtered.filter(r => r.severity === input.severity);
      }
      if (input.status) {
        filtered = filtered.filter(r => r.status === input.status);
      }

      const start = (input.page - 1) * input.limit;
      const items = filtered.slice(start, start + input.limit);

      return { items, total: filtered.length };
    }),

  submitReport: publicProcedure
    .input(z.object({
      title: z.string().min(10).max(500),
      description: z.string().min(50),
      aiSystemName: z.string().optional(),
      companyName: z.string().optional(),
      incidentType: z.enum(['bias', 'privacy', 'safety', 'misinformation', 'manipulation', 'other']),
      severity: z.enum(['low', 'medium', 'high', 'critical']),
      reporterEmail: z.string().email().optional(),
      reporterName: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const newId = mockWatchdogReports.length + 1;
      mockWatchdogReports.unshift({
        id: newId,
        ...input,
        status: 'submitted' as const,
        upvotes: 0,
        downvotes: 0,
        createdAt: new Date(),
        reporterName: input.reporterName || 'Anonymous',
      } as unknown as typeof mockWatchdogReports[0]);

      return {
        success: true,
        reportId: newId,
        message: 'Report submitted. Our 33-agent council will analyze it within 24 hours.',
      };
    }),

  getReport: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return mockWatchdogReports.find(r => r.id === input.id) || null;
    }),

  upvote: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const report = mockWatchdogReports.find(r => r.id === input.id);
      if (report) {
        report.upvotes++;
      }
      return { success: true, newCount: report?.upvotes || 0 };
    }),

  getLeaderboard: publicProcedure.query(async () => {
    return {
      items: [
        { rank: 1, name: 'Sarah Chen', casesCompleted: 156, accuracy: 98.2, earnings: 12400 },
        { rank: 2, name: 'Michael Park', casesCompleted: 142, accuracy: 97.8, earnings: 11200 },
        { rank: 3, name: 'Emma Rodriguez', casesCompleted: 128, accuracy: 96.5, earnings: 10100 },
        { rank: 4, name: 'James Wilson', casesCompleted: 115, accuracy: 95.9, earnings: 9200 },
        { rank: 5, name: 'Aisha Patel', casesCompleted: 98, accuracy: 97.1, earnings: 7800 },
      ],
    };
  }),

  getStats: publicProcedure.query(async () => {
    return {
      totalReports: 2847,
      resolvedReports: 2341,
      activeInvestigations: 156,
      avgResolutionTime: '4.2 hours',
      topCategories: [
        { name: 'Bias', count: 892, percentage: 31 },
        { name: 'Privacy', count: 721, percentage: 25 },
        { name: 'Safety', count: 543, percentage: 19 },
        { name: 'Misinformation', count: 412, percentage: 14 },
        { name: 'Other', count: 279, percentage: 11 },
      ],
    };
  }),

  // KnowledgeBase endpoints
  getIncidentStats: publicProcedure.query(async () => {
    return {
      totalIncidents: 2847,
      resolvedIncidents: 2341,
      byCategory: {
        bias: 892,
        privacy: 721,
        safety: 543,
        misinformation: 412,
        other: 279,
      },
      bySeverity: {
        critical: 156,
        high: 534,
        medium: 1247,
        low: 910,
      },
      trends: [
        { month: 'Jan', count: 245 },
        { month: 'Feb', count: 267 },
        { month: 'Mar', count: 312 },
      ],
    };
  }),

  getCouncilStats: publicProcedure.query(async () => {
    return {
      totalSessions: 2847,
      consensusReached: 2341,
      escalatedToHuman: 156,
      avgResponseTime: '2.3 seconds',
      consensusRate: 94.7,
      decisionBreakdown: {
        approved: 1923,
        rejected: 678,
        escalated: 246,
      },
    };
  }),

  getRLMAILearnings: publicProcedure.query(async () => {
    return [
      {
        id: 1,
        category: 'bias_detection',
        title: 'Improved Gender Bias Detection',
        description: 'System learned to identify subtle gender bias patterns in hiring AI from 50+ reviewed cases.',
        confidence: 0.94,
        learnedAt: new Date('2024-01-10'),
      },
      {
        id: 2,
        category: 'safety_assessment',
        title: 'Medical AI Safety Patterns',
        description: 'Enhanced safety risk assessment for medical diagnosis AI systems.',
        confidence: 0.89,
        learnedAt: new Date('2024-01-08'),
      },
    ];
  }),

  getIncidentPatterns: publicProcedure.query(async () => {
    return [
      {
        id: 1,
        pattern: 'resume_screening_bias',
        description: 'AI screening tools showing demographic bias in candidate scoring',
        occurrences: 47,
        industries: ['Technology', 'Finance', 'Healthcare'],
        mitigation: 'Regular bias audits and diverse training data validation',
      },
      {
        id: 2,
        pattern: 'llm_hallucination_medical',
        description: 'LLMs providing incorrect medical information with high confidence',
        occurrences: 23,
        industries: ['Healthcare', 'Consumer Tech'],
        mitigation: 'Medical domain verification and explicit disclaimers',
      },
    ];
  }),
});

// ============================================================================
// TRAINING ROUTER - Courses and Learning
// ============================================================================
const mockCourses = [
  {
    id: 1,
    title: 'EU AI Act Fundamentals',
    description: 'Master the EU AI Act compliance requirements. Learn risk classification, high-risk system requirements, and conformity assessment procedures.',
    framework: 'EU AI Act',
    level: 'fundamentals',
    durationHours: 8,
    price: 29900,
    modules: 8,
    modulesList: [
      { title: 'Introduction to EU AI Act', duration: 45 },
      { title: 'Risk Classification Framework', duration: 60 },
      { title: 'High-Risk AI Systems', duration: 75 },
      { title: 'Transparency Requirements', duration: 50 },
      { title: 'Human Oversight', duration: 55 },
      { title: 'Data Governance', duration: 60 },
      { title: 'Conformity Assessment', duration: 70 },
      { title: 'Final Assessment', duration: 65 },
    ],
    rating: 4.8,
    enrolledCount: 3247,
    instructor: 'Dr. Maria Schmidt',
    badge: 'eu-ai-act-certified',
  },
  {
    id: 2,
    title: 'NIST AI RMF Fundamentals',
    description: 'Learn the NIST AI Risk Management Framework. Understand GOVERN, MAP, MEASURE, and MANAGE functions for AI risk management.',
    framework: 'NIST AI RMF',
    level: 'fundamentals',
    durationHours: 8,
    price: 29900,
    modules: 8,
    modulesList: [
      { title: 'NIST AI RMF Overview', duration: 45 },
      { title: 'GOVERN Function', duration: 70 },
      { title: 'MAP Function', duration: 65 },
      { title: 'MEASURE Function', duration: 60 },
      { title: 'MANAGE Function', duration: 65 },
      { title: 'Implementation Strategies', duration: 55 },
      { title: 'Case Studies', duration: 60 },
      { title: 'Final Assessment', duration: 60 },
    ],
    rating: 4.7,
    enrolledCount: 2891,
    instructor: 'James Wilson, PhD',
    badge: 'nist-rmf-certified',
  },
  {
    id: 3,
    title: 'ISO 42001 AI Management System',
    description: 'ISO/IEC 42001 certification preparation. Learn to implement an AI management system that meets international standards.',
    framework: 'ISO 42001',
    level: 'fundamentals',
    durationHours: 8,
    price: 29900,
    modules: 8,
    modulesList: [
      { title: 'ISO 42001 Introduction', duration: 50 },
      { title: 'Context & Leadership', duration: 60 },
      { title: 'Planning for AI Management', duration: 65 },
      { title: 'Support & Resources', duration: 55 },
      { title: 'Operation & Development', duration: 70 },
      { title: 'Performance Evaluation', duration: 60 },
      { title: 'Continual Improvement', duration: 55 },
      { title: 'Certification Exam Prep', duration: 65 },
    ],
    rating: 4.9,
    enrolledCount: 1876,
    instructor: 'Dr. Aisha Patel',
    badge: 'iso-42001-certified',
  },
  {
    id: 4,
    title: 'AI Safety Analyst Foundation',
    description: 'Become a certified AI Safety Analyst. Learn incident investigation, bias detection, and safety assessment methodologies.',
    framework: 'CSOAI',
    level: 'fundamentals',
    durationHours: 12,
    price: 49900,
    modules: 12,
    modulesList: [
      { title: 'AI Safety Fundamentals', duration: 60 },
      { title: 'Types of AI Risks', duration: 55 },
      { title: 'Bias Detection Methods', duration: 70 },
      { title: 'Privacy Assessment', duration: 65 },
      { title: 'Safety Testing', duration: 75 },
      { title: 'Incident Investigation', duration: 80 },
      { title: 'Report Writing', duration: 50 },
      { title: 'Regulatory Landscape', duration: 60 },
      { title: 'Ethics in AI', duration: 55 },
      { title: 'Case Studies', duration: 70 },
      { title: 'Practical Exercises', duration: 90 },
      { title: 'Certification Exam', duration: 90 },
    ],
    rating: 4.9,
    enrolledCount: 5234,
    instructor: 'CSOAI Expert Panel',
    badge: 'csoai-analyst',
    featured: true,
  },
];

const trainingRouter = router({
  getCourses: publicProcedure
    .input(z.object({
      regionId: z.number().optional(),
      level: z.string().optional(),
      framework: z.string().optional(),
    }))
    .query(async ({ input }) => {
      let filtered = [...mockCourses];

      if (input.level) {
        filtered = filtered.filter(c => c.level === input.level);
      }
      if (input.framework) {
        filtered = filtered.filter(c =>
          c.framework.toLowerCase().includes(input.framework!.toLowerCase())
        );
      }

      return filtered;
    }),

  getCourse: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return mockCourses.find(c => c.id === input.id) || null;
    }),

  enrollInCourse: protectedProcedure
    .input(z.object({
      courseId: z.number(),
      paymentType: z.enum(['one_time', '3_month', '6_month', '12_month']).default('one_time'),
    }))
    .mutation(async ({ input, ctx }) => {
      const course = mockCourses.find(c => c.id === input.courseId);
      if (course) {
        course.enrolledCount++;
      }
      return {
        success: true,
        enrollmentId: Date.now(),
        message: 'Successfully enrolled! You can now start learning.',
      };
    }),

  getMyEnrollments: protectedProcedure.query(async ({ ctx }) => {
    // Return mock enrollments for the user
    return [
      {
        id: 1,
        courseId: 1,
        courseName: 'EU AI Act Fundamentals',
        progress: 65,
        currentModule: 5,
        totalModules: 8,
        enrolledAt: new Date('2024-01-05'),
        lastAccessedAt: new Date('2024-01-12'),
      },
      {
        id: 2,
        courseId: 4,
        courseName: 'AI Safety Analyst Foundation',
        progress: 25,
        currentModule: 3,
        totalModules: 12,
        enrolledAt: new Date('2024-01-08'),
        lastAccessedAt: new Date('2024-01-11'),
      },
    ];
  }),

  updateProgress: protectedProcedure
    .input(z.object({
      enrollmentId: z.number(),
      moduleIndex: z.number(),
      progress: z.number().min(0).max(100),
    }))
    .mutation(async ({ input }) => {
      return {
        success: true,
        newProgress: input.progress,
        isCompleted: input.progress === 100,
      };
    }),

  getStats: publicProcedure.query(async () => {
    return {
      totalCourses: 15,
      totalEnrollments: 12847,
      certificatesIssued: 8934,
      averageRating: 4.8,
      topCourse: 'AI Safety Analyst Foundation',
    };
  }),
});

// ============================================================================
// CERTIFICATION ROUTER
// ============================================================================
const mockCertificationTests = [
  {
    id: 1,
    code: 'CSOAI_FOUNDATION',
    title: 'CSOAI Foundation Certification',
    description: 'Foundational AI safety analyst certification covering core concepts, risk assessment, and ethical frameworks.',
    passingScore: 80,
    timeLimitMinutes: 90,
    totalQuestions: 50,
    price: 9900,
    badge: 'foundation-certified',
  },
  {
    id: 2,
    code: 'CSOAI_ADVANCED',
    title: 'CSOAI Advanced Certification',
    description: 'Advanced certification covering multi-framework compliance, incident investigation, and regulatory analysis.',
    passingScore: 85,
    timeLimitMinutes: 120,
    totalQuestions: 75,
    price: 19900,
    badge: 'advanced-certified',
    prerequisites: ['CSOAI_FOUNDATION'],
  },
  {
    id: 3,
    code: 'CSOAI_EXPERT',
    title: 'CSOAI Expert Certification',
    description: 'Expert-level certification for senior AI safety professionals and compliance officers.',
    passingScore: 90,
    timeLimitMinutes: 180,
    totalQuestions: 100,
    price: 29900,
    badge: 'expert-certified',
    prerequisites: ['CSOAI_ADVANCED'],
  },
  {
    id: 4,
    code: 'EU_AI_ACT_SPECIALIST',
    title: 'EU AI Act Specialist',
    description: 'Specialized certification in EU AI Act compliance, high-risk systems, and conformity assessment.',
    passingScore: 80,
    timeLimitMinutes: 90,
    totalQuestions: 60,
    price: 14900,
    badge: 'eu-specialist',
  },
];

const mockExamQuestions = [
  {
    id: 1,
    questionText: 'What is the minimum consensus threshold in the CSOAI 33-Agent Council?',
    options: ['11 agents', '17 agents', '22 agents', '28 agents'],
    correctAnswer: 2,
    explanation: 'The council requires 22/33 votes (67%) for Byzantine fault tolerance, allowing up to 10 faulty agents.',
  },
  {
    id: 2,
    questionText: 'Which risk level under the EU AI Act requires conformity assessment?',
    options: ['Minimal risk', 'Limited risk', 'High risk', 'All levels'],
    correctAnswer: 2,
    explanation: 'High-risk AI systems require conformity assessment before they can be placed on the EU market.',
  },
  {
    id: 3,
    questionText: 'What does the NIST AI RMF MAP function focus on?',
    options: ['Policy governance', 'Risk identification', 'Risk measurement', 'Risk management'],
    correctAnswer: 1,
    explanation: 'The MAP function focuses on identifying and categorizing AI risks within the organization.',
  },
];

const mockUserCertificates = [
  {
    id: 1,
    certificateNumber: 'CSOAI-FOUND-2024-00847',
    testCode: 'CSOAI_FOUNDATION',
    title: 'CSOAI Foundation Certification',
    score: 92,
    issuedAt: new Date('2024-01-05'),
    expiresAt: new Date('2026-01-05'),
    badge: 'foundation-certified',
    holderName: 'Demo User',
    verified: true,
  },
];

const certificationRouter = router({
  getTests: publicProcedure.query(async () => {
    return mockCertificationTests;
  }),

  getTest: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return mockCertificationTests.find(t => t.id === input.id) || null;
    }),

  getTestQuestions: protectedProcedure
    .input(z.object({ testId: z.number() }))
    .query(async ({ input }) => {
      const test = mockCertificationTests.find(t => t.id === input.testId);
      // Return both test info and questions
      return {
        test: test ? {
          id: test.id,
          title: test.title,
          description: test.description,
          timeLimitMinutes: test.timeLimitMinutes,
          passingScore: test.passingScore,
          totalQuestions: test.totalQuestions,
        } : null,
        questions: mockExamQuestions.map(q => ({
          id: q.id,
          questionText: q.questionText,
          questionType: 'multiple_choice' as const,
          options: q.options.map((opt, i) => ({ id: String.fromCharCode(65 + i), text: opt })),
          points: 1,
          difficulty: 'medium' as const,
        })),
      };
    }),

  startTest: protectedProcedure
    .input(z.object({ testId: z.number() }))
    .mutation(async ({ input }) => {
      const test = mockCertificationTests.find(t => t.id === input.testId);
      if (!test) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Test not found' });
      }
      return {
        attemptId: Date.now(),
        testId: input.testId,
        timeLimit: test.timeLimitMinutes,
        totalQuestions: mockExamQuestions.length,
        startedAt: new Date(),
      };
    }),

  submitTest: protectedProcedure
    .input(z.object({
      attemptId: z.number(),
      testId: z.number().optional(),
      answers: z.union([
        z.array(z.object({
          questionId: z.number(),
          answer: z.number(),
        })),
        z.record(z.string()), // Record<string, string> format from the client
      ]),
    }))
    .mutation(async ({ input }) => {
      // Handle both array and record format for answers
      let correct = 0;
      const totalQ = mockExamQuestions.length;

      if (Array.isArray(input.answers)) {
        input.answers.forEach(a => {
          const question = mockExamQuestions.find(q => q.id === a.questionId);
          if (question?.correctAnswer === a.answer) correct++;
        });
      } else {
        // Record format: { "1": "A", "2": "B", ... }
        Object.entries(input.answers).forEach(([qId, answer]) => {
          const question = mockExamQuestions.find(q => q.id === parseInt(qId));
          if (question) {
            const answerIndex = answer.charCodeAt(0) - 65; // A=0, B=1, etc.
            if (question.correctAnswer === answerIndex) correct++;
          }
        });
      }

      const score = Math.round((correct / totalQ) * 100);
      const passed = score >= 80;
      const certNumber = passed ? `CSOAI-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}` : null;

      return {
        success: true,
        attemptId: input.attemptId,
        score,
        percentScore: score,
        passed,
        correctAnswers: correct,
        totalQuestions: totalQ,
        certificateId: certNumber,
        certificateNumber: certNumber,
      };
    }),

  startExam: protectedProcedure
    .input(z.object({ testId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const test = mockCertificationTests.find(t => t.id === input.testId);
      if (!test) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Test not found' });
      }

      // Return exam session with questions
      return {
        attemptId: Date.now(),
        questions: mockExamQuestions.map(q => ({
          id: q.id,
          questionText: q.questionText,
          options: q.options,
        })),
        timeLimit: test.timeLimitMinutes,
        totalQuestions: mockExamQuestions.length,
        startedAt: new Date(),
      };
    }),

  submitExam: protectedProcedure
    .input(z.object({
      attemptId: z.number(),
      answers: z.array(z.object({
        questionId: z.number(),
        answer: z.number(),
      })),
    }))
    .mutation(async ({ input, ctx }) => {
      // Calculate score
      let correct = 0;
      const results = input.answers.map(a => {
        const question = mockExamQuestions.find(q => q.id === a.questionId);
        const isCorrect = question?.correctAnswer === a.answer;
        if (isCorrect) correct++;
        return {
          questionId: a.questionId,
          selectedAnswer: a.answer,
          correctAnswer: question?.correctAnswer || 0,
          isCorrect,
          explanation: question?.explanation,
        };
      });

      const score = Math.round((correct / mockExamQuestions.length) * 100);
      const passed = score >= 80;

      // Generate certificate if passed
      let certificateId = null;
      if (passed) {
        certificateId = `CSOAI-FOUND-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;
      }

      return {
        success: true,
        score,
        passed,
        correctAnswers: correct,
        totalQuestions: mockExamQuestions.length,
        certificateId,
        results,
      };
    }),

  getAttemptReview: protectedProcedure
    .input(z.object({ attemptId: z.number() }))
    .query(async ({ input }) => {
      // Return review data for a completed exam attempt
      return {
        attemptId: input.attemptId,
        testId: 1,
        testTitle: 'CSOAI Foundation Certification',
        score: 85,
        passed: true,
        completedAt: new Date(),
        timeSpent: 45, // minutes
        questions: mockExamQuestions.map((q, i) => ({
          id: q.id,
          questionText: q.questionText,
          options: q.options,
          correctAnswer: q.correctAnswer,
          selectedAnswer: i === 0 ? q.correctAnswer : (q.correctAnswer + 1) % 4, // mock some wrong answers
          isCorrect: i !== 1 && i !== 2,
          explanation: q.explanation,
        })),
      };
    }),

  getMyCertificates: protectedProcedure.query(async ({ ctx }) => {
    // Return mock certificates for the logged-in user
    return mockUserCertificates;
  }),

  verifyCertificate: publicProcedure
    .input(z.object({ certificateNumber: z.string() }))
    .query(async ({ input }) => {
      const cert = mockUserCertificates.find(c =>
        c.certificateNumber.toLowerCase() === input.certificateNumber.toLowerCase()
      );

      if (!cert) {
        return null;
      }

      return {
        valid: true,
        certificate: {
          certificateNumber: cert.certificateNumber,
          title: cert.title,
          holderName: cert.holderName,
          issuedAt: cert.issuedAt,
          expiresAt: cert.expiresAt,
          score: cert.score,
          verified: true,
        },
      };
    }),

  getLeaderboard: publicProcedure.query(async () => {
    return [
      { rank: 1, name: 'Sarah Chen', certifications: 5, avgScore: 96.4, totalExams: 7 },
      { rank: 2, name: 'Michael Park', certifications: 4, avgScore: 94.2, totalExams: 5 },
      { rank: 3, name: 'Emma Rodriguez', certifications: 4, avgScore: 93.8, totalExams: 6 },
      { rank: 4, name: 'James Wilson', certifications: 3, avgScore: 91.5, totalExams: 4 },
      { rank: 5, name: 'Demo User', certifications: 1, avgScore: 92.0, totalExams: 1 },
    ];
  }),
});

// ============================================================================
// ANALYST ROUTER - Workbench
// ============================================================================
const analystRouter = router({
  getCases: analystProcedure
    .input(z.object({ status: z.string().optional() }))
    .query(async ({ ctx }) => {
      return [];
    }),

  claimCase: analystProcedure
    .input(z.object({ caseId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      return { success: true };
    }),

  submitDecision: analystProcedure
    .input(z.object({
      assignmentId: z.number(),
      decision: z.enum(['approve', 'reject', 'escalate', 'needs_more_info']),
      confidence: z.enum(['low', 'medium', 'high']),
      reasoning: z.string().min(50),
    }))
    .mutation(async ({ input, ctx }) => {
      return { success: true };
    }),

  getPerformance: analystProcedure.query(async ({ ctx }) => {
    return {
      totalCases: 0,
      completed: 0,
      accuracy: 0,
      avgResponseTime: 0,
      earnings: 0,
      rank: 0,
    };
  }),

  getLeaderboard: publicProcedure.query(async () => {
    return [];
  }),
});

// ============================================================================
// PDCA ROUTER - Continuous Improvement
// ============================================================================
const pdcaRouter = router({
  getStats: publicProcedure.query(async () => ({
    totalCycles: 47,
    activeCycles: 12,
    completedCycles: 35,
    pausedCycles: 3,
    avgCycleTime: '14 days',
    improvementRate: 23,
    phaseDistribution: {
      plan: { count: 8, percentage: 17 },
      do: { count: 12, percentage: 25 },
      check: { count: 15, percentage: 32 },
      act: { count: 12, percentage: 26 },
    },
  })),

  getCycles: protectedProcedure
    .input(z.object({
      aiSystemId: z.number().optional(),
      status: z.string().optional(),
    }))
    .query(async ({ input, ctx }) => {
      return [];
    }),

  createCycle: enterpriseProcedure
    .input(z.object({
      aiSystemId: z.number(),
      planSummary: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      return { success: true, cycleId: 1 };
    }),

  updatePhase: enterpriseProcedure
    .input(z.object({
      cycleId: z.number(),
      phase: z.enum(['plan', 'do', 'check', 'act']),
      summary: z.string(),
    }))
    .mutation(async ({ input }) => {
      return { success: true };
    }),
});

// ============================================================================
// JOBS ROUTER - AI Safety Job Marketplace
// ============================================================================
const mockJobs = [
  {
    id: 1,
    title: 'Senior AI Safety Analyst',
    company: 'Anthropic',
    location: 'San Francisco, CA',
    locationType: 'hybrid' as const,
    payRate: 18500, // $185/hr
    payRateMax: 22500,
    experienceLevel: 'senior' as const,
    employmentType: 'full_time' as const,
    description: 'Join Anthropic\'s AI Safety team to conduct safety evaluations on Claude and other AI systems. You\'ll work on red-teaming, capability assessments, and developing safety benchmarks.',
    requirements: 'PhD or equivalent experience in ML/AI Safety, 5+ years experience, strong background in adversarial testing',
    requiredCertifications: 'CSOAI Advanced Certification',
    createdAt: new Date('2024-01-10'),
    applicationCount: 47,
  },
  {
    id: 2,
    title: 'AI Compliance Officer',
    company: 'Meta',
    location: 'Remote',
    locationType: 'remote' as const,
    payRate: 15000,
    payRateMax: 19000,
    experienceLevel: 'mid' as const,
    employmentType: 'full_time' as const,
    description: 'Lead EU AI Act compliance efforts for Meta\'s AI products. Coordinate with engineering teams to implement required technical measures and documentation.',
    requirements: 'JD or advanced degree, 3+ years in AI policy/compliance, understanding of EU regulations',
    requiredCertifications: 'CSOAI Foundation, EU AI Act Specialist',
    createdAt: new Date('2024-01-08'),
    applicationCount: 89,
  },
  {
    id: 3,
    title: 'AI Ethics Researcher',
    company: 'DeepMind',
    location: 'London, UK',
    locationType: 'hybrid' as const,
    payRate: 14000,
    payRateMax: 18000,
    experienceLevel: 'mid' as const,
    employmentType: 'full_time' as const,
    description: 'Research AI alignment, value learning, and safe AI development practices. Publish findings and contribute to industry safety standards.',
    requirements: 'PhD in relevant field, publications in AI safety/ethics, strong research skills',
    requiredCertifications: 'CSOAI Advanced',
    createdAt: new Date('2024-01-05'),
    applicationCount: 124,
  },
  {
    id: 4,
    title: 'Freelance AI Safety Auditor',
    company: 'CSOAI Network',
    location: 'Remote',
    locationType: 'remote' as const,
    payRate: 12500,
    payRateMax: 15000,
    experienceLevel: 'entry' as const,
    employmentType: 'freelance' as const,
    description: 'Conduct AI safety assessments for enterprise clients. Review AI systems for bias, privacy issues, and compliance with major frameworks (EU AI Act, NIST, ISO 42001).',
    requirements: 'CSOAI Foundation certification required, strong analytical skills, excellent communication',
    requiredCertifications: 'CSOAI Foundation',
    createdAt: new Date('2024-01-12'),
    applicationCount: 256,
  },
  {
    id: 5,
    title: 'AI Risk Manager',
    company: 'Goldman Sachs',
    location: 'New York, NY',
    locationType: 'onsite' as const,
    payRate: 20000,
    payRateMax: 28000,
    experienceLevel: 'lead' as const,
    employmentType: 'full_time' as const,
    description: 'Lead AI risk management for trading and investment AI systems. Develop risk frameworks, conduct model validation, and ensure regulatory compliance.',
    requirements: '10+ years in financial risk management, ML/AI expertise, CFA or FRM preferred',
    requiredCertifications: 'CSOAI Expert, NIST AI RMF Specialist',
    createdAt: new Date('2024-01-11'),
    applicationCount: 34,
  },
];

const jobsRouter = router({
  getJobs: publicProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(20),
      location: z.string().optional(),
      experienceLevel: z.string().optional(),
      employmentType: z.string().optional(),
    }))
    .query(async ({ input }) => {
      let filtered = [...mockJobs];

      if (input.location) {
        filtered = filtered.filter(j =>
          j.locationType === input.location || j.location.toLowerCase().includes(input.location!.toLowerCase())
        );
      }
      if (input.experienceLevel) {
        filtered = filtered.filter(j => j.experienceLevel === input.experienceLevel);
      }
      if (input.employmentType) {
        filtered = filtered.filter(j => j.employmentType === input.employmentType);
      }

      const start = (input.page - 1) * input.limit;
      const items = filtered.slice(start, start + input.limit);

      return { items, total: filtered.length };
    }),

  getJobListings: publicProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(20),
      search: z.string().optional(),
      location: z.string().optional(),
      experienceLevel: z.string().optional(),
      employmentType: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      let filtered = [...mockJobs];
      if (input?.search) {
        const search = input.search.toLowerCase();
        filtered = filtered.filter(j =>
          j.title.toLowerCase().includes(search) ||
          j.company.toLowerCase().includes(search)
        );
      }
      if (input?.location) {
        filtered = filtered.filter(j =>
          j.locationType === input.location || j.location.toLowerCase().includes(input.location!.toLowerCase())
        );
      }
      return { items: filtered, total: filtered.length };
    }),

  getJob: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return mockJobs.find(j => j.id === input.id) || null;
    }),

  getJobDetails: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const job = mockJobs.find(j => j.id === input.id);
      if (!job) return null;
      return {
        ...job,
        fullDescription: job.description,
        benefits: ['Health Insurance', '401k', 'Remote Work', 'Learning Budget'],
        skills: ['AI Safety', 'Machine Learning', 'Risk Assessment'],
        postedBy: 'HR Team',
      };
    }),

  getJobStats: publicProcedure.query(async () => {
    return {
      totalJobs: 247,
      newThisWeek: 34,
      averageSalary: 165000,
      averageSalaryFormatted: '$165,000',
      topLocations: ['Remote', 'San Francisco', 'New York', 'London'],
      topCompanies: ['Anthropic', 'OpenAI', 'DeepMind', 'Meta', 'Google'],
      byExperience: {
        entry: 45,
        mid: 89,
        senior: 78,
        lead: 35,
      },
    };
  }),

  applyToJob: protectedProcedure
    .input(z.object({
      jobId: z.number(),
      coverLetter: z.string().optional(),
      resumeUrl: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const job = mockJobs.find(j => j.id === input.jobId);
      if (job) {
        job.applicationCount++;
      }
      return {
        success: true,
        message: 'Application submitted successfully. You will be notified of updates.',
      };
    }),

  getMyApplications: protectedProcedure.query(async ({ ctx }) => {
    // Return mock applications for the logged-in user
    return [
      {
        id: 1,
        jobId: 4,
        jobTitle: 'Freelance AI Safety Auditor',
        company: 'CSOAI Network',
        status: 'reviewing',
        appliedAt: new Date('2024-01-10'),
        location: 'Remote',
        locationType: 'remote',
        payRate: 12500,
        maxPayRate: 15000,
        currency: 'USD',
      },
    ];
  }),

  getStats: publicProcedure.query(async () => {
    return {
      totalJobs: 247,
      newThisWeek: 34,
      averageSalary: '$165,000',
      topLocations: ['Remote', 'San Francisco', 'New York', 'London'],
      topCompanies: ['Anthropic', 'OpenAI', 'DeepMind', 'Meta', 'Google'],
    };
  }),
});

// ============================================================================
// ADMIN ROUTER
// ============================================================================
const mockUsers = [
  { id: 1, email: 'demo@csoai.com', name: 'Demo User', role: 'user', createdAt: new Date('2024-01-01') },
  { id: 2, email: 'admin@csoai.com', name: 'Admin User', role: 'admin', createdAt: new Date('2024-01-01') },
  { id: 3, email: 'analyst@csoai.com', name: 'AI Safety Analyst', role: 'watchdog_analyst', createdAt: new Date('2024-01-02') },
  { id: 4, email: 'enterprise@csoai.com', name: 'Enterprise Admin', role: 'enterprise_admin', createdAt: new Date('2024-01-03') },
  { id: 5, email: 'sarah@techcorp.com', name: 'Sarah Chen', role: 'user', createdAt: new Date('2024-01-05') },
  { id: 6, email: 'michael@ailab.org', name: 'Michael Park', role: 'watchdog_analyst', createdAt: new Date('2024-01-06') },
];

// Mock applications for admin
const mockApplications = [
  {
    id: 1,
    userId: 5,
    name: 'Sarah Chen',
    userName: 'Sarah Chen',
    email: 'sarah@techcorp.com',
    country: 'United States',
    type: 'analyst',
    status: 'pending',
    appliedAt: new Date('2024-01-10'),
    createdAt: new Date('2024-01-10'),
    motivation: 'Passionate about AI safety and want to contribute to responsible AI development.',
    experience: '5 years in ML engineering, 2 years focused on AI ethics and bias detection.',
    resume: '#'
  },
  {
    id: 2,
    userId: 6,
    name: 'John Doe',
    userName: 'John Doe',
    email: 'john@aicompany.com',
    country: 'United Kingdom',
    type: 'analyst',
    status: 'pending',
    appliedAt: new Date('2024-01-11'),
    createdAt: new Date('2024-01-11'),
    motivation: 'Want to help organizations build safer AI systems.',
    experience: '3 years as AI compliance consultant, CISO background.',
    resume: '#'
  },
  {
    id: 3,
    userId: 7,
    name: 'Emma Wilson',
    userName: 'Emma Wilson',
    email: 'emma@startup.io',
    country: 'Germany',
    type: 'analyst',
    status: 'approved',
    appliedAt: new Date('2024-01-05'),
    createdAt: new Date('2024-01-05'),
    motivation: 'Former regulator wanting to apply policy expertise.',
    experience: '7 years at EU Commission, AI Act drafting contributor.',
    resume: '#'
  },
];

const mockCertifiedAnalysts = [
  {
    id: 1,
    userId: 3,
    name: 'Michael Park',
    certificateNumber: 'CSOAI-2024-00142',
    certificateType: 'Advanced',
    certifications: ['CSOAI Foundation', 'CSOAI Advanced'],
    casesCompleted: 142,
    accuracy: 97.8,
    issuedAt: new Date('2024-01-02'),
    expiresAt: new Date('2026-01-02'),
  },
  {
    id: 2,
    userId: 8,
    name: 'Emma Rodriguez',
    certificateNumber: 'CSOAI-2024-00089',
    certificateType: 'Foundation',
    certifications: ['CSOAI Foundation'],
    casesCompleted: 128,
    accuracy: 96.5,
    issuedAt: new Date('2024-01-05'),
    expiresAt: new Date('2026-01-05'),
  },
];

const mockAdminCouncilSessions = [
  {
    id: 1,
    type: 'watchdog_report',
    subjectType: 'watchdog_report',
    subjectId: 1,
    subjectTitle: 'Hiring AI Bias Review',
    title: 'Hiring AI Bias Review',
    status: 'completed',
    votes: 33,
    consensus: true,
    finalDecision: 'approved',
    createdAt: new Date('2024-01-10')
  },
  {
    id: 2,
    type: 'assessment',
    subjectType: 'assessment',
    subjectId: 2,
    subjectTitle: 'High-Risk System Review',
    title: 'High-Risk System Review',
    status: 'in_progress',
    votes: 22,
    consensus: false,
    finalDecision: null,
    createdAt: new Date('2024-01-12')
  },
];

const adminRouter = router({
  getUsers: adminProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(50),
      role: z.string().optional(),
      search: z.string().optional(),
    }))
    .query(async ({ input }) => {
      let filtered = [...mockUsers];

      if (input.role) {
        filtered = filtered.filter(u => u.role === input.role);
      }
      if (input.search) {
        const search = input.search.toLowerCase();
        filtered = filtered.filter(u =>
          u.name.toLowerCase().includes(search) || u.email.toLowerCase().includes(search)
        );
      }

      const start = (input.page - 1) * input.limit;
      const items = filtered.slice(start, start + input.limit);

      return { items, total: filtered.length };
    }),

  updateUserRole: adminProcedure
    .input(z.object({
      userId: z.number(),
      role: z.enum(['user', 'admin', 'watchdog_analyst', 'regulator', 'enterprise_admin', 'compliance_officer']),
    }))
    .mutation(async ({ input }) => {
      const user = mockUsers.find(u => u.id === input.userId);
      if (user) {
        user.role = input.role;
      }
      return { success: true };
    }),

  getAdminStats: adminProcedure.query(async () => {
    return {
      totalUsers: 12847,
      totalApplications: mockApplications.length,
      pendingApplications: mockApplications.filter(a => a.status === 'pending').length,
      pendingReports: 47,
      activeSessions: 2,
      activeCouncilSessions: mockAdminCouncilSessions.filter(s => s.status !== 'completed').length,
      certifiedAnalysts: mockCertifiedAnalysts.length,
    };
  }),

  getApplications: adminProcedure
    .input(z.object({
      status: z.string().optional(),
      limit: z.number().optional(),
    }))
    .query(async ({ input }) => {
      let filtered = [...mockApplications];
      if (input.status && input.status !== 'all') {
        filtered = filtered.filter(a => a.status === input.status);
      }
      if (input.limit) {
        filtered = filtered.slice(0, input.limit);
      }
      return filtered;
    }),

  getCertifiedAnalysts: adminProcedure.query(async () => {
    return mockCertifiedAnalysts;
  }),

  getCouncilSessions: adminProcedure
    .input(z.object({
      status: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      let filtered = [...mockAdminCouncilSessions];
      if (input?.status && input.status !== 'all') {
        filtered = filtered.filter(s => s.status === input.status);
      }
      return filtered;
    }),

  approveApplication: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const app = mockApplications.find(a => a.id === input.id);
      if (app) {
        app.status = 'approved';
      }
      return { success: true };
    }),

  rejectApplication: adminProcedure
    .input(z.object({ id: z.number(), reason: z.string().optional() }))
    .mutation(async ({ input }) => {
      const app = mockApplications.find(a => a.id === input.id);
      if (app) {
        app.status = 'rejected';
      }
      return { success: true };
    }),

  getAnalytics: adminProcedure.query(async () => {
    return {
      users: {
        total: 12847,
        new: 234,
        activeToday: 1847,
        byRole: {
          user: 11234,
          watchdog_analyst: 892,
          enterprise_admin: 456,
          compliance_officer: 234,
          admin: 31,
        },
      },
      revenue: {
        total: 2847000,
        monthly: 287000,
        growth: 23.5,
        byCourse: [
          { name: 'AI Safety Analyst Foundation', revenue: 892000 },
          { name: 'EU AI Act Fundamentals', revenue: 678000 },
          { name: 'NIST AI RMF', revenue: 534000 },
          { name: 'ISO 42001', revenue: 443000 },
        ],
      },
      courses: {
        enrollments: 8934,
        completions: 6234,
        completionRate: 69.8,
        averageRating: 4.8,
      },
      watchdog: {
        reports: 2847,
        resolved: 2341,
        resolutionRate: 82.2,
        avgResolutionTime: '4.2 hours',
      },
      agents: {
        totalVotes: 47823,
        consensusRate: 94.7,
        avgResponseTime: '2.3 seconds',
      },
    };
  }),
});

// ============================================================================
// NOTIFICATIONS ROUTER
// ============================================================================
const mockNotifications = [
  {
    id: 1,
    type: 'compliance_alert' as const,
    title: 'EU AI Act Deadline Approaching',
    message: 'Your high-risk AI system "ChatBot Pro" requires conformity assessment by Feb 2, 2025.',
    link: '/compliance?system=1',
    priority: 'high' as const,
    isRead: false,
    createdAt: new Date('2024-01-12T10:30:00'),
  },
  {
    id: 2,
    type: 'certificate_issued' as const,
    title: 'Certificate Earned!',
    message: 'Congratulations! You have earned your EU AI Act Fundamentals certificate.',
    link: '/certificates',
    priority: 'medium' as const,
    isRead: false,
    createdAt: new Date('2024-01-11T14:22:00'),
  },
  {
    id: 3,
    type: 'council_decision' as const,
    title: '33-Agent Council Decision',
    message: 'The council has reached consensus on incident #2847: Gender Bias in Hiring AI.',
    link: '/watchdog/report/1',
    priority: 'medium' as const,
    isRead: true,
    createdAt: new Date('2024-01-10T09:15:00'),
  },
  {
    id: 4,
    type: 'job_application' as const,
    title: 'Application Status Update',
    message: 'Your application for "Freelance AI Safety Auditor" is being reviewed.',
    link: '/my-applications',
    priority: 'low' as const,
    isRead: true,
    createdAt: new Date('2024-01-09T16:45:00'),
  },
  {
    id: 5,
    type: 'system_update' as const,
    title: 'New Course Available',
    message: 'Check out the new "TC260 AI Safety Standards" course now available.',
    link: '/courses',
    priority: 'low' as const,
    isRead: true,
    createdAt: new Date('2024-01-08T11:00:00'),
  },
];

const notificationsRouter = router({
  getNotifications: protectedProcedure
    .input(z.object({
      limit: z.number().default(20),
      offset: z.number().default(0),
      unreadOnly: z.boolean().default(false),
    }))
    .query(async ({ input }) => {
      let filtered = [...mockNotifications];

      if (input.unreadOnly) {
        filtered = filtered.filter(n => !n.isRead);
      }

      const items = filtered.slice(input.offset, input.offset + input.limit);
      const unreadCount = mockNotifications.filter(n => !n.isRead).length;

      return {
        notifications: items,
        total: filtered.length,
        unreadCount,
      };
    }),

  markAsRead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const notification = mockNotifications.find(n => n.id === input.id);
      if (notification) {
        notification.isRead = true;
      }
      return { success: true };
    }),

  markAllAsRead: protectedProcedure.mutation(async () => {
    mockNotifications.forEach(n => n.isRead = true);
    return { success: true };
  }),

  deleteNotification: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const index = mockNotifications.findIndex(n => n.id === input.id);
      if (index !== -1) {
        mockNotifications.splice(index, 1);
      }
      return { success: true };
    }),

  getPreferences: protectedProcedure.query(async () => {
    return {
      emailEnabled: true,
      slackEnabled: false,
      slackWebhookUrl: '',
      complianceAlerts: true,
      systemUpdates: true,
      jobApplications: true,
      certificateIssued: true,
      councilDecisions: true,
      reportUpdates: true,
      digestEnabled: false,
      digestFrequency: 'daily',
    };
  }),

  updatePreferences: protectedProcedure
    .input(z.object({
      emailEnabled: z.boolean().optional(),
      slackEnabled: z.boolean().optional(),
      slackWebhookUrl: z.string().optional(),
      complianceAlerts: z.boolean().optional(),
      systemUpdates: z.boolean().optional(),
      jobApplications: z.boolean().optional(),
      certificateIssued: z.boolean().optional(),
      councilDecisions: z.boolean().optional(),
      reportUpdates: z.boolean().optional(),
      digestEnabled: z.boolean().optional(),
      digestFrequency: z.enum(['daily', 'weekly']).optional(),
    }))
    .mutation(async ({ input }) => {
      return { success: true };
    }),

  testNotification: protectedProcedure
    .input(z.object({
      type: z.string().optional(),
      channel: z.enum(['email', 'slack']).optional(),
    }))
    .mutation(async ({ input }) => {
      return {
        success: true,
        message: `Test ${input.channel || 'notification'} sent successfully`,
      };
    }),
});

// ============================================================================
// API KEYS ROUTER
// ============================================================================
const mockApiKeys = [
  {
    id: 1,
    name: 'Production API Key',
    key: 'csoai_live_xxx...xxx',
    keyPrefix: 'csoai_live_xxx',
    maskedKey: 'csoai_live_xxx...xxx',
    tier: 'pro' as const,
    scopes: ['read:systems', 'read:compliance', 'write:reports'],
    rateLimit: 500,
    createdAt: new Date('2024-01-05'),
    lastUsedAt: new Date('2024-01-12'),
    expiresAt: new Date('2025-01-05'),
    usageCount: 1247,
    status: 'active' as const,
    isActive: true,
  },
  {
    id: 2,
    name: 'Development Key',
    key: 'csoai_test_yyy...yyy',
    keyPrefix: 'csoai_test_yyy',
    maskedKey: 'csoai_test_yyy...yyy',
    tier: 'free' as const,
    scopes: ['read:systems', 'read:compliance'],
    rateLimit: 100,
    createdAt: new Date('2024-01-08'),
    lastUsedAt: new Date('2024-01-11'),
    expiresAt: new Date('2024-04-08'),
    usageCount: 89,
    status: 'active' as const,
    isActive: true,
  },
];

const apiKeysRouter = router({
  list: protectedProcedure.query(async () => {
    return mockApiKeys;
  }),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      scopes: z.array(z.string()).optional(),
      tier: z.enum(['free', 'pro', 'enterprise']).optional(),
      expiresInDays: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const expiresAt = input.expiresInDays
        ? new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000)
        : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
      const newKey = {
        id: mockApiKeys.length + 1,
        name: input.name,
        key: `csoai_live_${Date.now().toString(36)}`,
        keyPrefix: `csoai_live_${Date.now().toString(36).slice(0, 3)}`,
        maskedKey: `csoai_live_xxx...xxx`,
        tier: input.tier || 'free' as const,
        scopes: input.scopes || ['read:systems'],
        rateLimit: input.tier === 'enterprise' ? 1000 : input.tier === 'pro' ? 500 : 100,
        createdAt: new Date(),
        lastUsedAt: null,
        expiresAt,
        usageCount: 0,
        status: 'active' as const,
        isActive: true,
      };
      mockApiKeys.push(newKey as any);
      return { success: true, key: newKey.key }; // Only return full key once
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const keyIndex = mockApiKeys.findIndex(k => k.id === input.id);
      if (keyIndex !== -1) {
        mockApiKeys[keyIndex].isActive = false;
        mockApiKeys[keyIndex].status = 'revoked' as any;
      }
      return { success: true };
    }),

  revoke: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const key = mockApiKeys.find(k => k.id === input.id);
      if (key) {
        key.status = 'revoked' as any;
        key.isActive = false;
      }
      return { success: true };
    }),

  getUsage: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return {
        keyId: input.id,
        totalCalls: 1247,
        callsToday: 47,
        errorRate: 0.02,
        avgLatency: 234,
        endpoints: [
          { path: '/api/systems', calls: 523, avgLatency: 189 },
          { path: '/api/compliance', calls: 412, avgLatency: 267 },
          { path: '/api/reports', calls: 312, avgLatency: 312 },
        ],
      };
    }),
});

// ============================================================================
// STRIPE / BILLING ROUTER
// ============================================================================
// Pricing tiers data
const pricingTiers = {
  free: {
    name: 'Free',
    description: 'Get started with basic features',
    priceMonthly: 0,
    priceYearly: 0,
    features: [
      '1 AI System',
      'Basic compliance tracking',
      'Community support',
      '5 assessments/month',
    ],
  },
  pro: {
    name: 'Professional',
    description: 'For growing teams and organizations',
    priceMonthly: 49,
    priceYearly: 490,
    features: [
      '10 AI Systems',
      'Advanced compliance dashboards',
      'Priority support',
      'Unlimited assessments',
      'API access (500 req/min)',
      '33-Agent Council access',
      'Certification discounts',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    description: 'For large organizations with complex needs',
    priceMonthly: 299,
    priceYearly: 2990,
    features: [
      'Unlimited AI Systems',
      'Custom compliance frameworks',
      'Dedicated support',
      'Unlimited assessments',
      'Full API access (1000 req/min)',
      '33-Agent Council priority',
      'Free certifications',
      'SSO & audit logs',
      'Custom integrations',
    ],
  },
};

const stripeRouter = router({
  createCheckoutSession: protectedProcedure
    .input(z.object({
      priceId: z.string().optional(),
      courseId: z.number().optional(),
      plan: z.enum(['starter', 'professional', 'enterprise']).optional(),
      tier: z.enum(['pro', 'enterprise']).optional(),
      billingPeriod: z.enum(['monthly', 'yearly']).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Simulate Stripe checkout session creation
      return {
        sessionId: `cs_test_${Date.now()}`,
        url: `https://checkout.stripe.com/pay/cs_test_${Date.now()}`,
      };
    }),

  getSubscription: protectedProcedure.query(async ({ ctx }) => {
    return {
      status: 'active',
      tier: 'pro',
      plan: 'professional',
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: false,
    };
  }),

  getSubscriptionStatus: protectedProcedure.query(async ({ ctx }) => {
    return {
      status: 'active',
      tier: 'pro',
      plan: 'professional',
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: false,
    };
  }),

  getPricingTiers: publicProcedure.query(async () => {
    return pricingTiers;
  }),

  cancelSubscription: protectedProcedure.mutation(async ({ ctx }) => {
    return { success: true, cancelAtPeriodEnd: true };
  }),

  getInvoices: protectedProcedure.query(async ({ ctx }) => {
    return [
      {
        id: 'inv_001',
        amount: 29900,
        status: 'paid',
        date: new Date('2024-01-01'),
        description: 'Professional Plan - January 2024',
        pdfUrl: '#',
      },
      {
        id: 'inv_002',
        amount: 29900,
        status: 'paid',
        date: new Date('2023-12-01'),
        description: 'Professional Plan - December 2023',
        pdfUrl: '#',
      },
    ];
  }),

  createPortalSession: protectedProcedure.mutation(async ({ ctx }) => {
    return {
      url: `https://billing.stripe.com/session/${Date.now()}`,
    };
  }),
});

// ============================================================================
// COURSES ROUTER
// ============================================================================
const mockCoursesData = [
  {
    id: 1,
    title: 'EU AI Act Fundamentals',
    slug: 'eu-ai-act-fundamentals',
    description: 'Master the basics of the EU AI Act compliance',
    framework: 'EU AI Act',
    level: 'beginner',
    duration: '8 hours',
    durationHours: 8,
    price: 299,
    modules: 12,
    enrolled: false,
    progress: 0,
    imageUrl: '/images/eu-ai-act.jpg',
    rating: 4.8,
    enrolledCount: 3247,
    instructor: 'Dr. Maria Schmidt',
    regionId: 1,
    modulesList: [
      { id: 1, title: 'Introduction to EU AI Act', duration: 45, type: 'video', videoUrl: '/videos/intro.mp4', content: 'Introduction content...' },
      { id: 2, title: 'Risk Classification Framework', duration: 60, type: 'video', videoUrl: '/videos/risk.mp4', content: 'Risk content...' },
      { id: 3, title: 'High-Risk AI Systems', duration: 75, type: 'reading', content: 'High-risk systems content...' },
      { id: 4, title: 'Transparency Requirements', duration: 50, type: 'quiz', quiz: { questions: [] } },
    ],
  },
  {
    id: 2,
    title: 'NIST AI Risk Management',
    slug: 'nist-ai-rmf',
    description: 'Implement the NIST AI Risk Management Framework',
    framework: 'NIST AI RMF',
    level: 'intermediate',
    duration: '12 hours',
    durationHours: 12,
    price: 449,
    modules: 16,
    enrolled: true,
    progress: 45,
    imageUrl: '/images/nist-rmf.jpg',
    rating: 4.7,
    enrolledCount: 2891,
    instructor: 'James Wilson, PhD',
    regionId: 2,
    modulesList: [
      { id: 1, title: 'NIST AI RMF Overview', duration: 45, type: 'video', videoUrl: '/videos/nist-intro.mp4', content: 'Overview content...' },
      { id: 2, title: 'GOVERN Function', duration: 70, type: 'video', videoUrl: '/videos/govern.mp4', content: 'Govern content...' },
    ],
  },
];

const mockRegions = [
  { id: 1, code: 'EU', name: 'European Union', frameworks: ['EU AI Act', 'ISO 42001'] },
  { id: 2, code: 'US', name: 'United States', frameworks: ['NIST AI RMF', 'ISO 42001'] },
  { id: 3, code: 'GLOBAL', name: 'Global', frameworks: ['ISO 42001', 'OECD AI Principles'] },
  { id: 4, code: 'CN', name: 'China', frameworks: ['TC260'] },
];

const mockCourseBundles = [
  { id: 1, name: 'EU Compliance Bundle', courses: [1], price: 249, discount: 15 },
  { id: 2, name: 'Full Framework Bundle', courses: [1, 2], price: 599, discount: 20 },
];

const coursesRouter = router({
  list: publicProcedure.query(async () => mockCoursesData),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => mockCoursesData.find(c => c.id === input.id) || null),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => mockCoursesData.find(c => c.slug === input.slug) || null),

  getCourseDetails: publicProcedure
    .input(z.object({ courseId: z.number() }))
    .query(async ({ input }) => {
      const course = mockCoursesData.find(c => c.id === input.courseId);
      if (!course) return null;
      // Return with modules array properly
      return {
        ...course,
        modules: course.modulesList || [],
        moduleCount: course.modules,
      };
    }),

  getRegions: publicProcedure.query(async () => mockRegions),

  getCatalog: publicProcedure
    .input(z.object({
      regionId: z.number().optional(),
      level: z.string().optional(),
      framework: z.string().optional(),
      search: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      let filtered = [...mockCoursesData];
      if (input?.regionId) {
        filtered = filtered.filter(c => c.regionId === input.regionId);
      }
      if (input?.level) {
        filtered = filtered.filter(c => c.level === input.level);
      }
      if (input?.framework) {
        filtered = filtered.filter(c => c.framework.toLowerCase().includes(input.framework!.toLowerCase()));
      }
      return filtered;
    }),

  getCourseBundles: publicProcedure.query(async () => mockCourseBundles),

  enrollInCourse: protectedProcedure
    .input(z.object({ courseId: z.number() }))
    .mutation(async ({ input }) => ({
      success: true,
      enrollmentId: Date.now(),
      message: 'Successfully enrolled in course',
    })),

  enroll: protectedProcedure
    .input(z.object({ courseId: z.number() }))
    .mutation(async ({ input }) => ({ success: true, enrollmentId: Date.now() })),

  getMyEnrollments: protectedProcedure.query(async () => [
    {
      id: 1,
      courseId: 1,
      courseName: 'EU AI Act Fundamentals',
      progress: 65,
      currentModule: 5,
      totalModules: 8,
      enrolledAt: new Date('2024-01-05'),
      lastAccessedAt: new Date('2024-01-12'),
      completedModules: [1, 2, 3, 4, 5],
    },
  ]),

  markModuleComplete: protectedProcedure
    .input(z.object({ courseId: z.number(), moduleId: z.number() }))
    .mutation(async ({ input }) => ({
      success: true,
      progress: 75,
      nextModule: input.moduleId + 1,
    })),

  getProgress: protectedProcedure
    .input(z.object({ courseId: z.number() }))
    .query(async ({ input }) => ({
      courseId: input.courseId,
      progress: 45,
      completedModules: 5,
      totalModules: 12,
    })),

  updateProgress: protectedProcedure
    .input(z.object({ courseId: z.number(), moduleId: z.number(), completed: z.boolean() }))
    .mutation(async ({ input }) => ({ success: true })),

  cancelEnrollment: protectedProcedure
    .input(z.object({ enrollmentId: z.number() }))
    .mutation(async ({ input }) => ({
      success: true,
      message: 'Enrollment cancelled successfully',
    })),
});

// ============================================================================
// CERTIFICATES ROUTER
// ============================================================================
const mockCertificates = [
  {
    id: 1,
    certificateNumber: 'CSOAI-2024-00142',
    certificateId: 'CSOAI-2024-00142',
    title: 'EU AI Act Fundamentals',
    courseName: 'EU AI Act Fundamentals',
    type: 'course_completion',
    issuedAt: new Date('2024-01-05'),
    expiresAt: new Date('2026-01-05'),
    verified: true,
    userName: 'Demo User',
    holderName: 'Demo User',
    level: 'Professional',
    framework: 'EU AI Act',
    score: 92,
  },
];

const certificatesRouter = router({
  list: protectedProcedure.query(async () => mockCertificates),
  verify: publicProcedure
    .input(z.object({ certificateNumber: z.string() }))
    .query(async ({ input }) => {
      const cert = mockCertificates.find(c => c.certificateNumber === input.certificateNumber);
      return cert ? { valid: true, certificate: cert } : { valid: false, certificate: null };
    }),
  verifyCertificate: publicProcedure
    .input(z.object({ certificateNumber: z.string() }))
    .mutation(async ({ input }) => {
      const cert = mockCertificates.find(c => c.certificateNumber.toLowerCase() === input.certificateNumber.toLowerCase());
      if (!cert) return { valid: false, certificate: null };
      return {
        valid: true,
        certificate: {
          ...cert,
          userName: cert.userName,
          courseName: cert.courseName,
          holderName: cert.holderName,
          level: cert.level,
          score: cert.score,
          verified: true,
        },
      };
    }),
  generate: protectedProcedure
    .input(z.object({ courseId: z.number() }))
    .mutation(async ({ input }) => ({
      success: true,
      certificateNumber: `CSOAI-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`,
      pdfUrl: `/certificates/cert-${Date.now()}.pdf`,
    })),
  issue: protectedProcedure
    .input(z.object({ courseId: z.number() }))
    .mutation(async ({ input }) => ({
      success: true,
      certificateNumber: `CSOAI-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`,
    })),
});

// ============================================================================
// BULK IMPORT ROUTER
// ============================================================================
const bulkImportFieldDescriptions = [
  { field: 'name', name: 'Name', description: 'Name of the AI system', required: true, type: 'string', example: 'Customer Service Bot' },
  { field: 'description', name: 'Description', description: 'Description of the AI system', required: false, type: 'string', example: 'AI chatbot for customer support' },
  { field: 'systemType', name: 'System Type', description: 'Type of AI system', required: true, type: 'enum', options: ['chatbot', 'recommendation', 'classification', 'generation', 'analysis', 'other'] },
  { field: 'riskLevel', name: 'Risk Level', description: 'Risk level (minimal, limited, high, unacceptable)', required: false, type: 'enum', options: ['minimal', 'limited', 'high', 'unacceptable'] },
  { field: 'vendor', name: 'Vendor', description: 'Vendor or provider of the AI system', required: false, type: 'string', example: 'OpenAI' },
  { field: 'department', name: 'Department', description: 'Department using the AI system', required: false, type: 'string', example: 'Customer Service' },
];

const bulkImportRouter = router({
  getCSVTemplate: publicProcedure.query(async () => {
    return {
      headers: ['name', 'description', 'systemType', 'riskLevel', 'vendor', 'department'],
      sampleRow: ['Customer Service Bot', 'AI chatbot for customer support', 'chatbot', 'limited', 'OpenAI', 'Customer Service'],
      downloadUrl: '/templates/ai-systems-import.csv',
      template: 'name,description,systemType,riskLevel,vendor,department\nExample Bot,AI chatbot,chatbot,limited,OpenAI,IT',
      filename: 'ai-systems-import-template.csv',
    };
  }),

  getFieldDescriptions: publicProcedure.query(async () => {
    return bulkImportFieldDescriptions;
  }),

  importFromCSV: protectedProcedure
    .input(z.object({ csvContent: z.string().optional(), csvData: z.string().optional() }))
    .mutation(async ({ input }) => {
      // Parse CSV and import systems
      const content = input.csvContent || input.csvData || '';
      const lines = content.split('\n').filter(l => l.trim());
      const imported = Math.max(0, lines.length - 1); // Subtract header row
      return {
        success: true,
        imported,
        skipped: 0,
        duplicates: [] as string[],
        errors: [] as { row: number; field: string; message: string; value: any }[],
        systems: [],
      };
    }),

  importFromExcel: protectedProcedure
    .input(z.object({ base64Content: z.string().optional(), excelData: z.string().optional() }))
    .mutation(async ({ input }) => {
      return {
        success: true,
        imported: 5,
        skipped: 0,
        duplicates: [] as string[],
        errors: [] as { row: number; field: string; message: string; value: any }[],
        systems: [],
      };
    }),

  validateCsv: protectedProcedure
    .input(z.object({ content: z.string() }))
    .mutation(async ({ input }) => ({
      valid: true,
      rows: 5,
      errors: [],
    })),

  import: protectedProcedure
    .input(z.object({ systems: z.array(z.any()) }))
    .mutation(async ({ input }) => ({
      success: true,
      imported: input.systems.length,
      errors: [],
    })),
});

// ============================================================================
// APPLICATIONS ROUTER (for job applications)
// ============================================================================
const applicationsRouter = router({
  list: protectedProcedure.query(async () => [
    {
      id: 1,
      jobId: 1,
      jobTitle: 'AI Safety Engineer',
      company: 'Anthropic',
      status: 'submitted',
      appliedAt: new Date('2024-01-10'),
    },
  ]),
  getCount: publicProcedure.query(async () => ({
    total: 127,
    pending: 45,
    approved: 72,
    rejected: 10,
  })),
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => null),
  withdraw: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => ({ success: true })),

  // For WatchdogSignup page - analyst application
  submit: publicProcedure
    .input(z.object({
      name: z.string(),
      email: z.string().email(),
      country: z.string().optional(),
      timezone: z.string().optional(),
      motivation: z.string(),
      availableHoursPerWeek: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      return {
        success: true,
        applicationId: Date.now(),
        message: 'Application submitted successfully',
      };
    }),
});

// ============================================================================
// REGULATOR ROUTER
// ============================================================================
const regulatorRouter = router({
  getStats: protectedProcedure.query(async () => {
    return {
      totalSystems: 2847,
      highRiskSystems: 892,
      pendingReviews: 156,
      completedAssessments: 2341,
      complianceRate: 78.5,
      flaggedIncidents: 47,
    };
  }),

  getComplianceDashboard: protectedProcedure.query(async () => {
    return {
      totalSystems: 2847,
      totalAssessments: 2341,
      highRiskSystems: 892,
      pendingReviews: 156,
      completedAssessments: 2341,
      complianceRate: 78.5,
      flaggedIncidents: 47,
      byRiskLevel: {
        unacceptable: 0,
        high: 892,
        limited: 1245,
        minimal: 710,
      },
      riskDistribution: {
        unacceptable: 0,
        high: 892,
        limited: 1245,
        minimal: 710,
      },
      byStatus: {
        compliant: 1856,
        non_compliant: 245,
        under_review: 456,
        pending: 290,
      },
      frameworkStats: {
        EU_AI_ACT: { total: 1200, compliant: 950, avgScore: 82 },
        NIST_AI_RMF: { total: 890, compliant: 720, avgScore: 78 },
        ISO_42001: { total: 457, compliant: 380, avgScore: 75 },
        TC260: { total: 300, compliant: 240, avgScore: 80 },
      },
      recentCriticalReports: mockWatchdogReports.slice(0, 5),
      recentAssessments: [
        { id: 1, systemName: 'TalentScore AI', company: 'TechHire', riskLevel: 'high', status: 'under_review', score: 45, completedAt: new Date('2024-01-10') },
        { id: 2, systemName: 'Customer Bot', company: 'ServiceCorp', riskLevel: 'limited', status: 'compliant', score: 92, completedAt: new Date('2024-01-08') },
      ],
      recentIncidents: mockWatchdogReports.slice(0, 3),
    };
  }),

  getAllSystems: protectedProcedure
    .input(z.object({
      riskLevel: z.string().optional(),
      status: z.string().optional(),
      page: z.number().default(1),
      limit: z.number().default(50),
    }).optional())
    .query(async ({ input }) => {
      // Return array directly for client compatibility
      return [
        { id: 1, name: 'TalentScore AI', company: 'TechHire Inc.', riskLevel: 'high', status: 'under_review', framework: 'EU AI Act', score: 45 },
        { id: 2, name: 'Customer Service Bot', company: 'ServiceCorp', riskLevel: 'limited', status: 'compliant', framework: 'EU AI Act', score: 92 },
        { id: 3, name: 'Recommendation Engine', company: 'DataCorp', riskLevel: 'minimal', status: 'compliant', framework: 'NIST AI RMF', score: 88 },
      ];
    }),

  getComplianceTrends: protectedProcedure.query(async () => {
    // Return array format for chart compatibility
    return [
      { month: 'Aug', complianceRate: 72, assessments: 120, incidents: 45 },
      { month: 'Sep', complianceRate: 74, assessments: 145, incidents: 38 },
      { month: 'Oct', complianceRate: 76, assessments: 167, incidents: 42 },
      { month: 'Nov', complianceRate: 77, assessments: 189, incidents: 35 },
      { month: 'Dec', complianceRate: 78, assessments: 210, incidents: 28 },
      { month: 'Jan', complianceRate: 79, assessments: 234, incidents: 22 },
    ];
  }),

  exportComplianceData: protectedProcedure
    .input(z.object({
      format: z.enum(['csv', 'xlsx', 'pdf']).optional(),
      riskLevel: z.string().optional(),
      status: z.string().optional(),
    }).optional())
    .mutation(async ({ input }) => {
      // Generate mock CSV data
      const csvContent = 'System Name,Company,Risk Level,Status,Score,Framework\nTalentScore AI,TechHire,high,under_review,45,EU AI Act\nCustomer Bot,ServiceCorp,limited,compliant,92,EU AI Act';
      return {
        success: true,
        data: btoa(csvContent),
        filename: `compliance-report-${Date.now()}.csv`,
        mimeType: 'text/csv',
      };
    }),

  getAssessments: protectedProcedure
    .input(z.object({
      status: z.string().optional(),
      riskLevel: z.string().optional(),
      page: z.number().default(1),
      limit: z.number().default(20),
    }).optional())
    .query(async ({ input }) => {
      // Return array directly for client compatibility
      return [
        {
          id: 1,
          systemName: 'TalentScore AI',
          company: 'TechHire Inc.',
          riskLevel: 'high',
          status: 'under_review',
          framework: 'EU AI Act',
          frameworkCode: 'EU_AI_ACT',
          systemType: 'hiring',
          score: 45,
          overallScore: 45,
          lastUpdated: new Date('2024-01-10'),
          completedAt: new Date('2024-01-10'),
        },
        {
          id: 2,
          systemName: 'Customer Service Bot',
          company: 'ServiceCorp',
          riskLevel: 'limited',
          status: 'compliant',
          framework: 'EU AI Act',
          frameworkCode: 'EU_AI_ACT',
          systemType: 'chatbot',
          score: 92,
          overallScore: 92,
          lastUpdated: new Date('2024-01-08'),
          completedAt: new Date('2024-01-08'),
        },
      ];
    }),

  getSystems: protectedProcedure
    .input(z.object({
      riskLevel: z.string().optional(),
      status: z.string().optional(),
    }).optional())
    .query(async () => {
      return [
        { id: 1, name: 'TalentScore AI', company: 'TechHire Inc.', riskLevel: 'high', status: 'under_review' },
        { id: 2, name: 'Customer Service Bot', company: 'ServiceCorp', riskLevel: 'limited', status: 'compliant' },
      ];
    }),

  getReports: protectedProcedure.query(async () => {
    return mockWatchdogReports.slice(0, 5);
  }),

  flagSystem: protectedProcedure
    .input(z.object({ systemId: z.number(), reason: z.string() }))
    .mutation(async ({ input }) => {
      return { success: true, flagId: Date.now() };
    }),

  approveAssessment: protectedProcedure
    .input(z.object({ assessmentId: z.number() }))
    .mutation(async ({ input }) => {
      return { success: true };
    }),
});

// ============================================================================
// PUBLIC API ROUTER - For Enterprise Integrations & Knowledge Base
// ============================================================================
const publicApiRouter = router({
  getSystemStatus: publicProcedure.query(async () => {
    return {
      status: 'operational',
      version: '1.0.0',
      uptime: process.uptime(),
      features: {
        euAiAct: true,
        nistAiRmf: true,
        iso42001: true,
        tc260: true,
        agentCouncil: true,
        watchdog: true,
      },
    };
  }),

  // KnowledgeBase endpoints
  getIncidentStats: publicProcedure.query(async () => {
    return {
      totalIncidents: 2847,
      resolvedIncidents: 2341,
      byCategory: {
        bias: 892,
        privacy: 721,
        safety: 543,
        misinformation: 412,
        other: 279,
      },
      bySeverity: {
        critical: 156,
        high: 534,
        medium: 1247,
        low: 910,
      },
      trends: [
        { month: 'Jan', count: 245 },
        { month: 'Feb', count: 267 },
        { month: 'Mar', count: 312 },
        { month: 'Apr', count: 289 },
        { month: 'May', count: 334 },
        { month: 'Jun', count: 356 },
      ],
    };
  }),

  getCouncilStats: publicProcedure.query(async () => {
    return {
      totalSessions: 2847,
      consensusReached: 2341,
      escalatedToHuman: 156,
      avgResponseTime: '2.3 seconds',
      consensusRate: 94.7,
      decisionBreakdown: {
        approved: 1923,
        rejected: 678,
        escalated: 246,
      },
    };
  }),

  getRLMAILearnings: publicProcedure.query(async () => {
    return [
      {
        id: 1,
        category: 'bias_detection',
        title: 'Improved Gender Bias Detection',
        description: 'System learned to identify subtle gender bias patterns in hiring AI from 50+ reviewed cases.',
        confidence: 0.94,
        learnedAt: new Date('2024-01-10'),
      },
      {
        id: 2,
        category: 'safety_assessment',
        title: 'Medical AI Safety Patterns',
        description: 'Enhanced safety risk assessment for medical diagnosis AI systems.',
        confidence: 0.89,
        learnedAt: new Date('2024-01-08'),
      },
      {
        id: 3,
        category: 'privacy_risk',
        title: 'Personal Data Exposure Detection',
        description: 'Learned to identify potential PII leakage in AI outputs.',
        confidence: 0.91,
        learnedAt: new Date('2024-01-06'),
      },
      {
        id: 4,
        category: 'misinformation',
        title: 'Hallucination Pattern Recognition',
        description: 'Improved detection of factual inconsistencies in LLM outputs.',
        confidence: 0.87,
        learnedAt: new Date('2024-01-04'),
      },
    ];
  }),

  getIncidentPatterns: publicProcedure.query(async () => {
    return [
      {
        id: 1,
        pattern: 'resume_screening_bias',
        description: 'AI screening tools showing demographic bias in candidate scoring',
        occurrences: 47,
        industries: ['Technology', 'Finance', 'Healthcare'],
        mitigation: 'Regular bias audits and diverse training data validation',
      },
      {
        id: 2,
        pattern: 'llm_hallucination_medical',
        description: 'LLMs providing incorrect medical information with high confidence',
        occurrences: 23,
        industries: ['Healthcare', 'Consumer Tech'],
        mitigation: 'Medical domain verification and explicit disclaimers',
      },
      {
        id: 3,
        pattern: 'facial_recognition_accuracy',
        description: 'Lower accuracy rates for certain demographic groups',
        occurrences: 34,
        industries: ['Security', 'Law Enforcement', 'Retail'],
        mitigation: 'Demographic parity testing and threshold adjustments',
      },
      {
        id: 4,
        pattern: 'recommendation_filter_bubble',
        description: 'Content recommendation systems creating echo chambers',
        occurrences: 56,
        industries: ['Social Media', 'News', 'E-commerce'],
        mitigation: 'Diversity injection and exposure tracking',
      },
    ];
  }),
});

// ============================================================================
// RECOMMENDATIONS ROUTER - AI-Powered Compliance Recommendations
// ============================================================================
const mockRecommendations = [
  {
    id: 1,
    systemId: 1,
    title: 'Add Human-in-the-Loop for High-Risk Decisions',
    description: 'Your TalentScore AI makes employment decisions which are classified as high-risk under EU AI Act Article 6.',
    priority: 'high',
    framework: 'EU AI Act',
    article: 'Article 14',
    status: 'pending',
    impact: 'Ensures compliance with human oversight requirements',
    effort: 'medium',
    createdAt: new Date('2024-01-10'),
  },
  {
    id: 2,
    systemId: 1,
    title: 'Implement Bias Monitoring Dashboard',
    description: 'Track demographic parity metrics in real-time to detect and address potential bias.',
    priority: 'medium',
    framework: 'NIST AI RMF',
    article: 'MEASURE 2.3',
    status: 'in_progress',
    impact: 'Reduces risk of discriminatory outcomes',
    effort: 'high',
    createdAt: new Date('2024-01-08'),
  },
  {
    id: 3,
    systemId: 2,
    title: 'Update Technical Documentation',
    description: 'Technical documentation is missing required details about training data and model architecture.',
    priority: 'high',
    framework: 'EU AI Act',
    article: 'Article 11',
    status: 'pending',
    impact: 'Required for CE marking and market access',
    effort: 'low',
    createdAt: new Date('2024-01-12'),
  },
  {
    id: 4,
    systemId: 3,
    title: 'Implement Data Retention Policy',
    description: 'Define and implement clear data retention periods for user interaction logs.',
    priority: 'low',
    framework: 'ISO 42001',
    article: 'Clause 7.5',
    status: 'completed',
    impact: 'Ensures data governance compliance',
    effort: 'low',
    createdAt: new Date('2024-01-05'),
  },
];

const recommendationsRouter = router({
  getAll: protectedProcedure
    .input(z.object({
      systemId: z.number().optional(),
      status: z.string().optional(),
      priority: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      let filtered = [...mockRecommendations];
      if (input?.systemId) {
        filtered = filtered.filter(r => r.systemId === input.systemId);
      }
      if (input?.status) {
        filtered = filtered.filter(r => r.status === input.status);
      }
      if (input?.priority) {
        filtered = filtered.filter(r => r.priority === input.priority);
      }
      return filtered;
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return mockRecommendations.find(r => r.id === input.id) || null;
    }),

  getStats: protectedProcedure.query(async () => {
    return {
      total: mockRecommendations.length,
      pending: mockRecommendations.filter(r => r.status === 'pending').length,
      inProgress: mockRecommendations.filter(r => r.status === 'in_progress').length,
      completed: mockRecommendations.filter(r => r.status === 'completed').length,
      byPriority: {
        high: mockRecommendations.filter(r => r.priority === 'high').length,
        medium: mockRecommendations.filter(r => r.priority === 'medium').length,
        low: mockRecommendations.filter(r => r.priority === 'low').length,
      },
    };
  }),

  updateStatus: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(['pending', 'in_progress', 'completed', 'dismissed']),
    }))
    .mutation(async ({ input }) => {
      const rec = mockRecommendations.find(r => r.id === input.id);
      if (rec) {
        rec.status = input.status;
      }
      return { success: true };
    }),

  dismiss: protectedProcedure
    .input(z.object({ id: z.number(), reason: z.string().optional() }))
    .mutation(async ({ input }) => {
      const rec = mockRecommendations.find(r => r.id === input.id);
      if (rec) {
        rec.status = 'dismissed';
      }
      return { success: true };
    }),

  generateForSystem: protectedProcedure
    .input(z.object({ systemId: z.number() }))
    .mutation(async ({ input }) => {
      // Simulates AI-generated recommendations
      return {
        success: true,
        count: 3,
        recommendations: mockRecommendations.filter(r => r.systemId === input.systemId),
      };
    }),

  // Additional methods for Recommendations page
  getRecommendations: protectedProcedure
    .input(z.object({
      category: z.string().optional(),
      priority: z.string().optional(),
      limit: z.number().optional(),
    }).optional())
    .query(async ({ input }) => {
      let filtered = [...mockRecommendations];
      if (input?.priority) {
        filtered = filtered.filter(r => r.priority === input.priority);
      }
      return filtered.slice(0, input?.limit || 20);
    }),

  getCategories: protectedProcedure.query(async () => {
    return ['compliance', 'security', 'performance', 'documentation', 'governance'];
  }),

  getDismissedIds: protectedProcedure.query(async () => {
    return { ids: [] as number[] };
  }),

  getInteractionHistory: protectedProcedure
    .input(z.object({ limit: z.number().optional() }).optional())
    .query(async () => {
      return [];
    }),

  getAnalytics: protectedProcedure
    .input(z.object({ periodType: z.string().optional(), limit: z.number().optional() }).optional())
    .query(async () => {
      return {
        implemented: 15,
        dismissed: 5,
        pending: 10,
        trends: [],
      };
    }),

  trackInteraction: protectedProcedure
    .input(z.object({
      recommendationId: z.number(),
      action: z.string(),
      feedback: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async () => {
      return { success: true };
    }),
});

// ============================================================================
// FILE UPLOAD ROUTER - For Resume/Document Uploads
// ============================================================================
const fileUploadRouter = router({
  getSignedUrl: protectedProcedure
    .input(z.object({
      filename: z.string(),
      contentType: z.string(),
      purpose: z.enum(['resume', 'document', 'evidence', 'avatar']),
    }))
    .mutation(async ({ input }) => {
      // In production, this would generate a signed URL for S3/GCS
      return {
        uploadUrl: `/api/upload/${Date.now()}/${input.filename}`,
        fileUrl: `/uploads/${Date.now()}/${input.filename}`,
        fileId: `file_${Date.now()}`,
      };
    }),

  confirmUpload: protectedProcedure
    .input(z.object({ fileId: z.string() }))
    .mutation(async ({ input }) => {
      return { success: true, fileId: input.fileId };
    }),
});

// ============================================================================
// PROGRESS ROUTER - Student Progress Tracking
// ============================================================================
const progressRouter = router({
  getOverview: protectedProcedure.query(async ({ ctx }) => {
    return {
      userId: ctx.user?.id || 1,
      totalCourses: 12,
      completedCourses: 4,
      inProgressCourses: 3,
      totalCertificates: 2,
      totalHoursLearned: 47,
      currentStreak: 5,
      longestStreak: 14,
      lastActivityAt: new Date(),
    };
  }),

  getCourseProgress: protectedProcedure.query(async () => {
    return [
      { courseId: 1, title: 'EU AI Act Fundamentals', progress: 100, completedAt: new Date('2024-01-05') },
      { courseId: 2, title: 'NIST AI RMF Practitioner', progress: 75, completedModules: 6, totalModules: 8 },
      { courseId: 3, title: 'ISO 42001 Foundation', progress: 45, completedModules: 3, totalModules: 7 },
    ];
  }),

  getCertificateProgress: protectedProcedure.query(async () => {
    return [
      { certificationId: 1, title: 'CSOAI Foundation', status: 'earned', earnedAt: new Date('2024-01-10') },
      { certificationId: 2, title: 'EU AI Act Specialist', status: 'in_progress', examAttempts: 1, requiredScore: 80 },
    ];
  }),

  getLearningPath: protectedProcedure.query(async () => {
    return {
      currentLevel: 'intermediate',
      nextLevel: 'advanced',
      pointsToNextLevel: 250,
      recommendedCourses: [1, 3, 5],
    };
  }),

  updateProgress: protectedProcedure
    .input(z.object({
      courseId: z.number(),
      moduleId: z.number(),
      progress: z.number(),
    }))
    .mutation(async ({ input }) => {
      return { success: true, newProgress: input.progress };
    }),

  getStreak: protectedProcedure.query(async () => {
    return {
      current: 5,
      longest: 14,
      weeklyGoal: 7,
      weeklyCompleted: 5,
    };
  }),

  // For StudentProgress page
  getOverallProgress: protectedProcedure.query(async ({ ctx }) => {
    return {
      completionPercentage: 67,
      totalCourses: 12,
      completedCourses: 4,
      inProgressCourses: 3,
      totalHoursLearned: 47,
      averageQuizScore: 82,
      certificatesEarned: 2,
      currentStreak: 5,
    };
  }),

  getQuizAnalytics: protectedProcedure.query(async () => {
    return {
      totalAttempts: 24,
      averageScore: 82,
      passRate: 88,
      recentScores: [
        { date: 'Jan 5', score: 85 },
        { date: 'Jan 8', score: 78 },
        { date: 'Jan 10', score: 92 },
        { date: 'Jan 12', score: 80 },
      ],
      byFramework: [
        { framework: 'EU AI Act', attempts: 8, avgScore: 85 },
        { framework: 'NIST AI RMF', attempts: 6, avgScore: 78 },
        { framework: 'ISO 42001', attempts: 5, avgScore: 82 },
        { framework: 'TC260', attempts: 5, avgScore: 79 },
      ],
    };
  }),

  getCertificates: protectedProcedure.query(async () => {
    return [
      {
        id: 1,
        title: 'CSOAI Foundation',
        earnedAt: new Date('2024-01-05'),
        expiresAt: new Date('2025-01-05'),
        certificateNumber: 'CSOAI-2024-001234',
      },
      {
        id: 2,
        title: 'EU AI Act Specialist',
        earnedAt: new Date('2024-01-10'),
        expiresAt: new Date('2025-01-10'),
        certificateNumber: 'CSOAI-2024-001567',
      },
    ];
  }),

  getRecommendations: protectedProcedure.query(async () => {
    return [
      {
        id: 1,
        type: 'course',
        title: 'Complete NIST AI RMF Course',
        description: 'You\'re 75% through this course. Finish it to earn your certificate!',
        priority: 'high',
        link: '/courses/2',
      },
      {
        id: 2,
        type: 'exam',
        title: 'Take ISO 42001 Certification Exam',
        description: 'You\'ve completed all prerequisites. Ready for the exam?',
        priority: 'medium',
        link: '/certification',
      },
    ];
  }),

  dismissRecommendation: protectedProcedure
    .input(z.object({ recommendationId: z.number() }))
    .mutation(async ({ input }) => {
      return { success: true };
    }),
});

// ============================================================================
// WORKBENCH ROUTER - Analyst Workbench Tools
// ============================================================================
const workbenchRouter = router({
  getTools: protectedProcedure.query(async () => {
    return [
      { id: 1, name: 'Bias Analyzer', description: 'Analyze AI models for demographic bias', icon: 'chart', status: 'active' },
      { id: 2, name: 'Compliance Checker', description: 'Check compliance against frameworks', icon: 'shield', status: 'active' },
      { id: 3, name: 'Risk Calculator', description: 'Calculate AI risk scores', icon: 'calculator', status: 'active' },
      { id: 4, name: 'Documentation Generator', description: 'Auto-generate compliance docs', icon: 'file', status: 'beta' },
    ];
  }),

  runAnalysis: protectedProcedure
    .input(z.object({
      toolId: z.number(),
      systemId: z.number().optional(),
      parameters: z.record(z.any()).optional(),
    }))
    .mutation(async ({ input }) => {
      return {
        success: true,
        analysisId: `analysis_${Date.now()}`,
        status: 'running',
        estimatedTime: 30,
      };
    }),

  getAnalysisResults: protectedProcedure
    .input(z.object({ analysisId: z.string() }))
    .query(async ({ input }) => {
      return {
        analysisId: input.analysisId,
        status: 'completed',
        results: {
          score: 78,
          findings: [
            { type: 'warning', message: 'Potential bias detected in age group 55+', severity: 'medium' },
            { type: 'info', message: 'Model documentation is up to date', severity: 'low' },
          ],
          recommendations: ['Consider additional training data for underrepresented groups'],
        },
        completedAt: new Date(),
      };
    }),

  getSavedAnalyses: protectedProcedure.query(async () => {
    return [
      { id: 'analysis_1', toolName: 'Bias Analyzer', systemName: 'TalentScore AI', createdAt: new Date('2024-01-10'), score: 72 },
      { id: 'analysis_2', toolName: 'Compliance Checker', systemName: 'Customer Bot', createdAt: new Date('2024-01-08'), score: 91 },
    ];
  }),

  deleteAnalysis: protectedProcedure
    .input(z.object({ analysisId: z.string() }))
    .mutation(async ({ input }) => {
      return { success: true };
    }),

  // Queue for Workbench page
  getQueue: protectedProcedure.query(async () => {
    return [
      { id: 1, systemName: 'TalentScore AI', type: 'compliance_review', status: 'pending', priority: 'high', createdAt: new Date() },
      { id: 2, systemName: 'Customer Bot', type: 'bias_audit', status: 'in_progress', priority: 'medium', createdAt: new Date() },
    ];
  }),

  // Analyst case management methods - structured for Workbench page
  getMyCases: protectedProcedure.query(async () => {
    return [
      {
        assignment: { id: 1, status: 'assigned', priority: 'high', dueAt: new Date('2024-01-20'), assignedAt: new Date('2024-01-10') },
        report: { id: 1, title: 'TalentScore AI Bias Review', severity: 'high', companyName: 'TechHire Inc.', incidentType: 'bias' },
      },
      {
        assignment: { id: 2, status: 'in_progress', priority: 'medium', dueAt: new Date('2024-01-25'), assignedAt: new Date('2024-01-08') },
        report: { id: 2, title: 'Customer Bot Privacy Audit', severity: 'medium', companyName: 'ServiceCorp', incidentType: 'privacy' },
      },
    ];
  }),

  getMyPerformance: protectedProcedure.query(async () => {
    return {
      casesCompleted: 47,
      averageTimeToResolve: '4.2 days',
      accuracyRate: 94.5,
      recentDecisions: 12,
      qualityScore: 4.7,
    };
  }),

  getCaseDetails: protectedProcedure
    .input(z.object({ caseId: z.number() }))
    .query(async ({ input }) => {
      return {
        assignment: {
          id: input.caseId,
          status: 'assigned',
          priority: 'high',
          dueAt: new Date('2024-01-20'),
          assignedAt: new Date('2024-01-10'),
        },
        report: {
          id: input.caseId,
          title: 'TalentScore AI Bias Review',
          description: 'Review the hiring AI system for potential demographic bias in candidate scoring.',
          severity: 'high',
          companyName: 'TechHire Inc.',
          incidentType: 'bias',
          aiSystemName: 'TalentScore AI',
        },
        councilVotes: {
          total: 33,
          approve: 12,
          reject: 8,
          escalate: 5,
          abstain: 8,
        },
        documents: [],
      };
    }),

  submitDecision: protectedProcedure
    .input(z.object({
      caseId: z.number(),
      decision: z.enum(['approve', 'reject', 'escalate', 'request_more_info']),
      notes: z.string().optional(),
      findings: z.array(z.any()).optional(),
    }))
    .mutation(async ({ input }) => {
      return {
        success: true,
        message: `Case ${input.caseId} decision submitted: ${input.decision}`,
      };
    }),
});

// ============================================================================
// COMBINED APP ROUTER
// ============================================================================
export const appRouter = router({
  auth: authRouter,
  dashboard: dashboardRouter,
  aiSystems: aiSystemsRouter,
  compliance: complianceRouter,
  council: councilRouter,
  watchdog: watchdogRouter,
  training: trainingRouter,
  certification: certificationRouter,
  analyst: analystRouter,
  pdca: pdcaRouter,
  jobs: jobsRouter,
  admin: adminRouter,
  notifications: notificationsRouter,
  apiKeys: apiKeysRouter,
  stripe: stripeRouter,
  courses: coursesRouter,
  certificates: certificatesRouter,
  bulkImport: bulkImportRouter,
  applications: applicationsRouter,
  regulator: regulatorRouter,
  publicApi: publicApiRouter,
  recommendations: recommendationsRouter,
  fileUpload: fileUploadRouter,
  progress: progressRouter,
  workbench: workbenchRouter,
  protocol0: protocol0Router,
});

export type AppRouter = typeof appRouter;
