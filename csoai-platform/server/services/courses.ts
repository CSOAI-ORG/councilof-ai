/**
 * Courses Router - Training Certification Business Model
 * Handles course catalog, enrollments, payment plans, and Stripe subscriptions
 */

import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { courses, courseEnrollments, courseBundles, regions } from "../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";
import Stripe from "stripe";

// Initialize Stripe only if key is available
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-12-18.acacia",
    })
  : null;

// Mock course data for development
const mockCourses = [
  {
    id: 1,
    title: "EU AI Act Compliance Fundamentals",
    description: "Master the requirements of the EU AI Act and prepare your organization for compliance.",
    level: "fundamentals" as const,
    framework: "EU AI Act",
    duration: "8 hours",
    price: 299,
    price3Month: 99,
    price6Month: 59,
    price12Month: 29,
    modules: 12,
    active: true,
    featured: true,
    imageUrl: "/images/courses/eu-ai-act.jpg",
  },
  {
    id: 2,
    title: "NIST AI Risk Management Framework",
    description: "Learn to implement the NIST AI RMF across your organization's AI systems.",
    level: "advanced" as const,
    framework: "NIST AI RMF",
    duration: "12 hours",
    price: 449,
    price3Month: 149,
    price6Month: 89,
    price12Month: 45,
    modules: 16,
    active: true,
    featured: true,
    imageUrl: "/images/courses/nist-rmf.jpg",
  },
  {
    id: 3,
    title: "ISO 42001 AI Management System",
    description: "Comprehensive training on implementing ISO 42001 for AI governance.",
    level: "specialist" as const,
    framework: "ISO 42001",
    duration: "16 hours",
    price: 599,
    price3Month: 199,
    price6Month: 119,
    price12Month: 59,
    modules: 20,
    active: true,
    featured: false,
    imageUrl: "/images/courses/iso-42001.jpg",
  },
  {
    id: 4,
    title: "China TC260 AI Governance",
    description: "Navigate Chinese AI regulations and TC260 standards for global compliance.",
    level: "specialist" as const,
    framework: "TC260",
    duration: "10 hours",
    price: 399,
    price3Month: 133,
    price6Month: 79,
    price12Month: 40,
    modules: 14,
    active: true,
    featured: false,
    imageUrl: "/images/courses/tc260.jpg",
  },
];

export const coursesRouter = router({
  /**
   * Get course catalog with pricing by region
   * Public endpoint - anyone can browse courses
   */
  getCatalog: publicProcedure
    .input(
      z.object({
        regionId: z.number().optional(),
        level: z.enum(["fundamentals", "advanced", "specialist"]).optional(),
        framework: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();

      // Use mock data if no database
      if (!db) {
        let filtered = mockCourses;
        if (input.level) {
          filtered = filtered.filter(c => c.level === input.level);
        }
        if (input.framework) {
          filtered = filtered.filter(c => c.framework === input.framework);
        }
        return filtered.map(course => ({
          ...course,
          pricing: {
            oneTime: course.price,
            threeMonth: course.price3Month,
            sixMonth: course.price6Month,
            twelveMonth: course.price12Month,
          },
        }));
      }

      // Build where conditions
      const conditions: any[] = [eq(courses.active, true)];
      if (input.regionId) {
        conditions.push(eq(courses.regionId, input.regionId));
      }
      if (input.level) {
        conditions.push(eq(courses.level, input.level));
      }
      if (input.framework) {
        conditions.push(eq(courses.framework, input.framework));
      }

      const allCourses = await db
        .select()
        .from(courses)
        .where(and(...conditions));

      return allCourses.map((course: any) => ({
        ...course,
        pricing: {
          oneTime: course.price,
          threeMonth: course.price3Month,
          sixMonth: course.price6Month,
          twelveMonth: course.price12Month,
        },
        stripePriceIds: {
          oneTime: course.stripePriceId,
          threeMonth: course.stripePriceId3Month,
          sixMonth: course.stripePriceId6Month,
          twelveMonth: course.stripePriceId12Month,
        },
      }));
    }),

  /**
   * Get course details with full information
   */
  getCourseDetails: publicProcedure
    .input(z.object({ courseId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();

      // Use mock data if no database
      if (!db) {
        const course = mockCourses.find(c => c.id === input.courseId);
        if (!course) {
          throw new Error("Course not found");
        }
        return {
          ...course,
          enrollmentCount: Math.floor(Math.random() * 500) + 100,
          pricing: {
            oneTime: course.price,
            threeMonth: course.price3Month,
            sixMonth: course.price6Month,
            twelveMonth: course.price12Month,
          },
        };
      }

      const [course] = await db
        .select()
        .from(courses)
        .where(eq(courses.id, input.courseId));

      if (!course) {
        throw new Error("Course not found");
      }

      // Get enrollment count
      const [enrollmentStats] = await db
        .select({ count: sql<number>`count(*)` })
        .from(courseEnrollments)
        .where(eq(courseEnrollments.courseId, input.courseId));

      return {
        ...course,
        enrollmentCount: enrollmentStats?.count || 0,
        pricing: {
          oneTime: course.price,
          threeMonth: course.price3Month,
          sixMonth: course.price6Month,
          twelveMonth: course.price12Month,
        },
      };
    }),

  /**
   * Get user's enrolled courses
   */
  getMyEnrollments: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    const userId = Number(ctx.user.id);

    // Mock enrollments for development
    if (!db) {
      return [
        {
          id: 1,
          courseId: 1,
          course: mockCourses[0],
          progress: 45,
          enrolledAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          status: "active" as const,
        },
      ];
    }

    const enrollments = await db
      .select({
        enrollment: courseEnrollments,
        course: courses,
      })
      .from(courseEnrollments)
      .innerJoin(courses, eq(courseEnrollments.courseId, courses.id))
      .where(eq(courseEnrollments.userId, userId));

    return enrollments.map((e: any) => ({
      id: e.enrollment.id,
      courseId: e.course.id,
      course: e.course,
      progress: e.enrollment.progress || 0,
      enrolledAt: e.enrollment.createdAt,
      status: e.enrollment.status,
    }));
  }),

  /**
   * Enroll in a course (create checkout session)
   */
  createCheckoutSession: protectedProcedure
    .input(
      z.object({
        courseId: z.number(),
        paymentPlan: z.enum(["oneTime", "threeMonth", "sixMonth", "twelveMonth"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!stripe) {
        // For development, simulate successful enrollment
        return {
          success: true,
          message: "Stripe not configured. Simulating enrollment.",
          sessionId: "mock_session_" + Date.now(),
        };
      }

      const db = await getDb();
      const userId = Number(ctx.user.id);

      // Get course details
      let course: any;
      if (db) {
        const [dbCourse] = await db
          .select()
          .from(courses)
          .where(eq(courses.id, input.courseId));
        course = dbCourse;
      } else {
        course = mockCourses.find(c => c.id === input.courseId);
      }

      if (!course) {
        throw new Error("Course not found");
      }

      // Get the appropriate price based on payment plan
      const priceMap: Record<string, number> = {
        oneTime: course.price,
        threeMonth: course.price3Month,
        sixMonth: course.price6Month,
        twelveMonth: course.price12Month,
      };

      const amount = priceMap[input.paymentPlan];

      // Create Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: course.title,
                description: `${input.paymentPlan} access`,
              },
              unit_amount: Math.round(amount * 100),
            },
            quantity: 1,
          },
        ],
        mode: input.paymentPlan === "oneTime" ? "payment" : "subscription",
        success_url: `${process.env.CLIENT_URL || "http://localhost:5173"}/training/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.CLIENT_URL || "http://localhost:5173"}/training/courses/${input.courseId}`,
        metadata: {
          userId: String(userId),
          courseId: String(input.courseId),
          paymentPlan: input.paymentPlan,
        },
      });

      return {
        success: true,
        sessionId: session.id,
        url: session.url,
      };
    }),

  /**
   * Get available regions with pricing
   */
  getRegions: publicProcedure.query(async () => {
    const db = await getDb();

    if (!db) {
      return [
        { id: 1, name: "North America", code: "NA", currency: "USD" },
        { id: 2, name: "Europe", code: "EU", currency: "EUR" },
        { id: 3, name: "Asia Pacific", code: "APAC", currency: "USD" },
        { id: 4, name: "Latin America", code: "LATAM", currency: "USD" },
      ];
    }

    return db.select().from(regions);
  }),

  /**
   * Get course bundles
   */
  getBundles: publicProcedure.query(async () => {
    const db = await getDb();

    if (!db) {
      return [
        {
          id: 1,
          name: "Complete AI Compliance Bundle",
          description: "All four framework courses at a 30% discount",
          courses: mockCourses,
          price: 1199,
          originalPrice: 1746,
          discount: 30,
        },
        {
          id: 2,
          name: "Western Compliance Bundle",
          description: "EU AI Act + NIST AI RMF + ISO 42001",
          courses: mockCourses.slice(0, 3),
          price: 899,
          originalPrice: 1347,
          discount: 33,
        },
      ];
    }

    return db.select().from(courseBundles);
  }),
});
