import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { jobPostings, jobApplications } from "../../drizzle/schema";
import { eq, and, or, like, gte, lte, desc, sql } from "drizzle-orm";

export const jobsRouter = router({
  /**
   * Get job listings with filters
   */
  getJobListings: publicProcedure
    .input(
      z.object({
        location: z.string().optional(),
        locationType: z.enum(["remote", "hybrid", "onsite"]).optional(),
        experienceLevel: z.enum(["entry", "mid", "senior", "lead"]).optional(),
        minPayRate: z.number().optional(),
        maxPayRate: z.number().optional(),
        requiredCertifications: z.string().optional(), // Comma-separated list
        employmentType: z.enum(["full_time", "part_time", "contract", "freelance"]).optional(),
        search: z.string().optional(), // Search in title, company, description
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { jobs: [], total: 0 };

      // Build filter conditions
      const conditions: any[] = [eq(jobPostings.status, "active")];

      if (input.locationType) {
        conditions.push(eq(jobPostings.locationType, input.locationType));
      }

      if (input.experienceLevel) {
        conditions.push(eq(jobPostings.experienceLevel, input.experienceLevel));
      }

      if (input.minPayRate) {
        conditions.push(gte(jobPostings.payRate, input.minPayRate));
      }

      if (input.maxPayRate) {
        conditions.push(lte(jobPostings.payRate, input.maxPayRate));
      }

      if (input.employmentType) {
        conditions.push(eq(jobPostings.employmentType, input.employmentType));
      }

      if (input.location) {
        conditions.push(
          or(
            like(jobPostings.location, `%${input.location}%`),
            like(jobPostings.country, `%${input.location}%`)
          )
        );
      }

      if (input.requiredCertifications) {
        conditions.push(like(jobPostings.requiredCertifications, `%${input.requiredCertifications}%`));
      }

      if (input.search) {
        conditions.push(
          or(
            like(jobPostings.title, `%${input.search}%`),
            like(jobPostings.company, `%${input.search}%`),
            like(jobPostings.description, `%${input.search}%`)
          )
        );
      }

      // Get jobs with pagination
      const jobs = await db
        .select()
        .from(jobPostings)
        .where(and(...conditions))
        .orderBy(desc(jobPostings.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      // Get total count
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(jobPostings)
        .where(and(...conditions));

      return {
        jobs,
        total: count || 0,
        hasMore: (input.offset + input.limit) < (count || 0),
      };
    }),

  /**
   * Get job details by ID
   */
  getJobDetails: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const [job] = await db
        .select()
        .from(jobPostings)
        .where(eq(jobPostings.id, input.id))
        .limit(1);

      if (!job) return null;

      // Increment view count
      await db
        .update(jobPostings)
        .set({ viewCount: sql`${jobPostings.viewCount} + 1` })
        .where(eq(jobPostings.id, input.id));

      return job;
    }),

  /**
   * Apply to a job
   */
  applyToJob: protectedProcedure
    .input(
      z.object({
        jobId: z.number(),
        coverLetter: z.string().optional(),
        resumeUrl: z.string().url().optional(),
        certifications: z.string().optional(),
        yearsExperience: z.number().min(0).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const userId = Number(ctx.user.id);

      // Check if job exists
      const [job] = await db
        .select()
        .from(jobPostings)
        .where(eq(jobPostings.id, input.jobId))
        .limit(1);

      if (!job) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Job not found" });
      }

      if (job.status !== "active") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This job posting is no longer active" });
      }

      // Check if user already applied
      const existing = await db
        .select()
        .from(jobApplications)
        .where(and(eq(jobApplications.jobId, input.jobId), eq(jobApplications.userId, userId)))
        .limit(1);

      if (existing.length > 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "You have already applied to this job" });
      }

      // Create application
      const [application] = await db
        .insert(jobApplications)
        .values({
          jobId: input.jobId,
          userId,
          applicantName: ctx.user.name || "Anonymous",
          applicantEmail: ctx.user.email || "",
          coverLetter: input.coverLetter,
          resumeUrl: input.resumeUrl,
          certifications: input.certifications,
          yearsExperience: input.yearsExperience,
          status: "submitted",
        })
        .$returningId();

      // Increment application count
      await db
        .update(jobPostings)
        .set({ applicationCount: sql`${jobPostings.applicationCount} + 1` })
        .where(eq(jobPostings.id, input.jobId));

      return {
        success: true,
        applicationId: application.id,
      };
    }),

  /**
   * Get job statistics for dashboard
   */
  getJobStats: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      return {
        totalJobs: 0,
        remoteJobs: 0,
        avgPayRate: 0,
        topCompanies: [],
      };
    }

    const [stats] = await db
      .select({
        totalJobs: sql<number>`count(*)`,
        remoteJobs: sql<number>`sum(case when ${jobPostings.locationType} = 'remote' then 1 else 0 end)`,
        avgPayRate: sql<number>`avg(${jobPostings.payRate})`,
      })
      .from(jobPostings)
      .where(eq(jobPostings.status, "active"));

    // Get top companies by job count
    const topCompanies = await db
      .select({
        company: jobPostings.company,
        jobCount: sql<number>`count(*)`,
      })
      .from(jobPostings)
      .where(eq(jobPostings.status, "active"))
      .groupBy(jobPostings.company)
      .orderBy(desc(sql`count(*)`))
      .limit(5);

    return {
      totalJobs: stats?.totalJobs || 0,
      remoteJobs: stats?.remoteJobs || 0,
      avgPayRate: stats?.avgPayRate || 0,
      topCompanies: topCompanies || [],
    };
  }),

  /**
   * Get filter options (for dropdown filters)
   */
  getFilterOptions: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      return {
        locations: [],
        companies: [],
        certifications: [],
      };
    }

    // Get unique locations
    const locations = await db
      .selectDistinct({ location: jobPostings.location })
      .from(jobPostings)
      .where(eq(jobPostings.status, "active"))
      .limit(50);

    // Get unique companies
    const companies = await db
      .selectDistinct({ company: jobPostings.company })
      .from(jobPostings)
      .where(eq(jobPostings.status, "active"))
      .limit(50);

    return {
      locations: locations.map((l) => l.location).filter(Boolean),
      companies: companies.map((c) => c.company).filter(Boolean),
      certifications: [
        "CSOAI Foundation",
        "CSOAI Professional",
        "NIST AI RMF",
        "EU AI Act Compliance",
        "TC260 Certified",
        "ISO 42001",
      ],
    };
  }),

  /**
   * Get user's job applications
   */
  getMyApplications: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    const userId = Number(ctx.user.id);

    const applications = await db
      .select({
        id: jobApplications.id,
        jobId: jobApplications.jobId,
        coverLetter: jobApplications.coverLetter,
        resumeUrl: jobApplications.resumeUrl,
        status: jobApplications.status,
        employerResponse: jobApplications.employerResponse,
        statusUpdatedAt: jobApplications.statusUpdatedAt,
        appliedAt: jobApplications.createdAt,
        jobTitle: jobPostings.title,
        company: jobPostings.company,
        location: jobPostings.location,
        locationType: jobPostings.locationType,
        payRate: jobPostings.payRate,
        maxPayRate: jobPostings.payRateMax,
        currency: jobPostings.payCurrency,
      })
      .from(jobApplications)
      .leftJoin(jobPostings, eq(jobApplications.jobId, jobPostings.id))
      .where(eq(jobApplications.userId, userId))
      .orderBy(desc(jobApplications.createdAt));

    return applications;
  }),

  /**
   * Update application status (for employers/admins)
   */
  updateApplicationStatus: protectedProcedure
    .input(
      z.object({
        applicationId: z.number(),
        status: z.enum(["pending", "reviewed", "accepted", "rejected"]),
        employerResponse: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      // Update application status
      await db
        .update(jobApplications)
        .set({
          status: input.status === 'pending' ? 'submitted' : input.status === 'reviewed' ? 'reviewing' : input.status,
          employerResponse: input.employerResponse,
          statusUpdatedAt: new Date(),
        })
        .where(eq(jobApplications.id, input.applicationId));

      return {
        success: true,
        message: "Application status updated",
      };
    }),
});
