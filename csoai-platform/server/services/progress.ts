import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { 
  courseEnrollments, 
  courses, 
  learningSessions, 
  quizAnalytics, 
  userRecommendations,
  courseCertificates
} from "../../drizzle/schema";
import { eq, and, desc, sql, avg, sum, count } from "drizzle-orm";

export const progressRouter = router({
  /**
   * Get overall progress summary for the current user
   * Returns: total courses, completed, in-progress, completion %, total hours, avg score, certificates
   */
  getOverallProgress: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    const userId = ctx.user.id;

    // Get enrollment stats
    const enrollments = await db
      .select()
      .from(courseEnrollments)
      .where(eq(courseEnrollments.userId, userId));

    const totalCourses = enrollments.length;
    const completedCourses = enrollments.filter(e => e.status === "completed").length;
    const inProgressCourses = enrollments.filter(e => e.status === "in_progress").length;
    const completionPercentage = totalCourses > 0 ? Math.round((completedCourses / totalCourses) * 100) : 0;

    // Calculate total learning time
    const sessions = await db
      .select()
      .from(learningSessions)
      .where(eq(learningSessions.userId, userId));

    const totalMinutes = sessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
    const totalHours = Math.round(totalMinutes / 60 * 10) / 10; // Round to 1 decimal

    // Calculate average quiz score
    const quizzes = await db
      .select()
      .from(quizAnalytics)
      .where(eq(quizAnalytics.userId, userId));

    const avgScore = quizzes.length > 0
      ? Math.round(quizzes.reduce((sum, q) => sum + q.score, 0) / quizzes.length)
      : 0;

    // Count certificates
    const certificates = await db
      .select()
      .from(courseCertificates)
      .where(eq(courseCertificates.userId, userId));

    const certificateCount = certificates.length;

    return {
      totalCourses,
      completedCourses,
      inProgressCourses,
      completionPercentage,
      totalHours,
      avgScore,
      certificateCount,
    };
  }),

  /**
   * Get detailed progress for a specific course
   * Returns: module completion, quiz scores, time spent, current module
   */
  getCourseProgress: protectedProcedure
    .input(z.object({ courseId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      const userId = ctx.user.id;

      // Get enrollment
      const enrollment = await db
        .select()
        .from(courseEnrollments)
        .where(
          and(
            eq(courseEnrollments.userId, userId),
            eq(courseEnrollments.courseId, input.courseId)
          )
        )
        .limit(1);

      if (enrollment.length === 0) {
        throw new Error("Not enrolled in this course");
      }

      // Get course details
      const courseData = await db
        .select()
        .from(courses)
        .where(eq(courses.id, input.courseId))
        .limit(1);

      if (courseData.length === 0) {
        throw new Error("Course not found");
      }

      const course = courseData[0];
      const modules = course.modules as any[];
      const totalModules = modules?.length || 0;

      // Get quiz analytics for this course
      const quizzes = await db
        .select()
        .from(quizAnalytics)
        .where(
          and(
            eq(quizAnalytics.userId, userId),
            eq(quizAnalytics.courseId, input.courseId)
          )
        )
        .orderBy(desc(quizAnalytics.createdAt));

      // Get learning sessions for this course
      const sessions = await db
        .select()
        .from(learningSessions)
        .where(
          and(
            eq(learningSessions.userId, userId),
            eq(learningSessions.courseId, input.courseId)
          )
        );

      // Calculate per-module stats
      const moduleStats = modules?.map((module: any, index: number) => {
        const moduleQuizzes = quizzes.filter(q => q.moduleIndex === index);
        const moduleSessions = sessions.filter(s => s.moduleIndex === index);
        const timeSpent = moduleSessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
        const completed = moduleSessions.some(s => s.completed);
        const bestScore = moduleQuizzes.length > 0 
          ? Math.max(...moduleQuizzes.map(q => q.score))
          : null;
        const attempts = moduleQuizzes.length;

        return {
          moduleIndex: index,
          title: module.title,
          completed,
          timeSpentMinutes: timeSpent,
          quizScore: bestScore,
          quizAttempts: attempts,
        };
      }) || [];

      const completedModules = moduleStats.filter(m => m.completed).length;
      const moduleCompletionPercentage = totalModules > 0 
        ? Math.round((completedModules / totalModules) * 100)
        : 0;

      return {
        enrollment: enrollment[0],
        course: {
          id: course.id,
          title: course.title,
          framework: course.framework,
          level: course.level,
        },
        totalModules,
        completedModules,
        moduleCompletionPercentage,
        moduleStats,
        overallProgress: enrollment[0].progress,
      };
    }),

  /**
   * Get quiz analytics across all courses
   * Returns: score trends, strongest/weakest topics, improvement over time
   */
  getQuizAnalytics: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    const userId = ctx.user.id;

    // Get all quiz attempts
    const quizzes = await db
      .select()
      .from(quizAnalytics)
      .where(eq(quizAnalytics.userId, userId))
      .orderBy(quizAnalytics.createdAt);

    if (quizzes.length === 0) {
      return {
        totalAttempts: 0,
        avgScore: 0,
        passRate: 0,
        scoreTrend: [],
        topicPerformance: [],
        recentQuizzes: [],
      };
    }

    // Calculate overall stats
    const totalAttempts = quizzes.length;
    const avgScore = Math.round(
      quizzes.reduce((sum, q) => sum + q.score, 0) / totalAttempts
    );
    const passedQuizzes = quizzes.filter(q => q.passed).length;
    const passRate = Math.round((passedQuizzes / totalAttempts) * 100);

    // Score trend over time (last 10 quizzes)
    const scoreTrend = quizzes.slice(-10).map(q => ({
      date: q.createdAt.toISOString().split('T')[0],
      score: q.score,
      courseId: q.courseId,
      moduleIndex: q.moduleIndex,
    }));

    // Get course names for topic performance
    const courseIds = Array.from(new Set(quizzes.map((q: any) => q.courseId)));
    const coursesData = await db
      .select()
      .from(courses)
      .where(sql`${courses.id} IN (${sql.join(courseIds.map(id => sql`${id}`), sql`, `)})`);

    const courseMap = new Map(coursesData.map((c: any) => [c.id, c.title]));

    // Topic performance by course
    const topicPerformance = courseIds.map((courseId: number) => {
      const courseQuizzes = quizzes.filter(q => q.courseId === courseId);
      const avgCourseScore = Math.round(
        courseQuizzes.reduce((sum, q) => sum + q.score, 0) / courseQuizzes.length
      );
      return {
        topic: courseMap.get(courseId) || `Course ${courseId}`,
        avgScore: avgCourseScore,
        attempts: courseQuizzes.length,
      };
    }).sort((a, b) => b.avgScore - a.avgScore);

    // Recent quizzes (last 5)
    const recentQuizzes = quizzes.slice(-5).reverse().map(q => ({
      courseId: q.courseId,
      courseName: courseMap.get(q.courseId) || `Course ${q.courseId}`,
      moduleIndex: q.moduleIndex,
      score: q.score,
      passed: q.passed,
      date: q.createdAt,
    }));

    return {
      totalAttempts,
      avgScore,
      passRate,
      scoreTrend,
      topicPerformance,
      recentQuizzes,
    };
  }),

  /**
   * Get all certificates earned by the user
   */
  getCertificates: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    const userId = ctx.user.id;

    const certificates = await db
      .select({
        certificate: courseCertificates,
        course: courses,
      })
      .from(courseCertificates)
      .leftJoin(courses, eq(courseCertificates.courseId, courses.id))
      .where(eq(courseCertificates.userId, userId))
      .orderBy(desc(courseCertificates.issuedAt));

    return certificates.map(c => ({
      id: c.certificate.id,
      certificateId: c.certificate.certificateId,
      courseId: c.certificate.courseId,
      courseName: c.course?.title || "Unknown Course",
      framework: c.course?.framework || "Unknown",
      issuedAt: c.certificate.issuedAt,
      verificationUrl: `/verify-certificate/${c.certificate.certificateId}`,
    }));
  }),

  /**
   * Get personalized course recommendations
   * Based on completed courses, quiz performance, and learning patterns
   */
  getRecommendations: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    const userId = ctx.user.id;

    // Get existing recommendations
    const existingRecs = await db
      .select({
        recommendation: userRecommendations,
        course: courses,
      })
      .from(userRecommendations)
      .leftJoin(courses, eq(userRecommendations.recommendedCourseId, courses.id))
      .where(
        and(
          eq(userRecommendations.userId, userId),
          eq(userRecommendations.dismissed, false)
        )
      )
      .orderBy(desc(userRecommendations.priority));

    // If no recommendations exist, generate them
    if (existingRecs.length === 0) {
      await generateRecommendations(userId);
      // Fetch again after generation
      const newRecs = await db
        .select({
          recommendation: userRecommendations,
          course: courses,
        })
        .from(userRecommendations)
        .leftJoin(courses, eq(userRecommendations.recommendedCourseId, courses.id))
        .where(
          and(
            eq(userRecommendations.userId, userId),
            eq(userRecommendations.dismissed, false)
          )
        )
        .orderBy(desc(userRecommendations.priority));

      return newRecs.map((r: any) => ({
        id: r.recommendation.id,
        courseId: r.recommendation.recommendedCourseId,
        courseName: r.course?.title || "Unknown Course",
        framework: r.course?.framework || "Unknown",
        level: r.course?.level || "fundamentals",
        reason: r.recommendation.reason,
        reasonText: r.recommendation.reasonText,
        priority: r.recommendation.priority,
      }));
    }

    return existingRecs.map((r: any) => ({
      id: r.recommendation.id,
      courseId: r.recommendation.recommendedCourseId,
      courseName: r.course?.title || "Unknown Course",
      framework: r.course?.framework || "Unknown",
      level: r.course?.level || "fundamentals",
      reason: r.recommendation.reason,
      reasonText: r.recommendation.reasonText,
      priority: r.recommendation.priority,
    }));
  }),

  /**
   * Track a learning session (time spent on a module)
   */
  trackLearningSession: protectedProcedure
    .input(
      z.object({
        courseId: z.number(),
        moduleIndex: z.number(),
        durationMinutes: z.number(),
        completed: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      const userId = ctx.user.id;

      const sessionStart = new Date(Date.now() - input.durationMinutes * 60 * 1000);
      const sessionEnd = new Date();

      await db.insert(learningSessions).values({
        userId,
        courseId: input.courseId,
        moduleIndex: input.moduleIndex,
        sessionStart,
        sessionEnd,
        durationMinutes: input.durationMinutes,
        completed: input.completed,
      });

      return { success: true };
    }),

  /**
   * Dismiss a recommendation
   */
  dismissRecommendation: protectedProcedure
    .input(z.object({ recommendationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      const userId = ctx.user.id;

      await db
        .update(userRecommendations)
        .set({ dismissed: true })
        .where(
          and(
            eq(userRecommendations.id, input.recommendationId),
            eq(userRecommendations.userId, userId)
          )
        );

      return { success: true };
    }),
});

/**
 * Generate personalized recommendations for a user
 * Called automatically when user has no active recommendations
 */
async function generateRecommendations(userId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // Get user's enrollments
  const enrollments = await db
    .select()
    .from(courseEnrollments)
    .where(eq(courseEnrollments.userId, userId));

  const completedCourseIds = enrollments
    .filter((e: any) => e.status === "completed")
    .map((e: any) => e.courseId);

  const inProgressCourseIds = enrollments
    .filter((e: any) => e.status === "in_progress")
    .map((e: any) => e.courseId);

  // Get all available courses
  const allCourses = await db
    .select()
    .from(courses)
    .where(eq(courses.active, true));

  // Get quiz performance
  const quizzes = await db
    .select()
    .from(quizAnalytics)
    .where(eq(quizAnalytics.userId, userId));

  const recommendations: Array<{
    userId: number;
    recommendedCourseId: number;
    reason: "incomplete" | "weak_area" | "next_in_path" | "advanced" | "framework_preference" | "popular";
    reasonText: string;
    priority: number;
  }> = [];

  // Recommend incomplete courses (highest priority)
  for (const courseId of inProgressCourseIds) {
    const course = allCourses.find((c: any) => c.id === courseId);
    if (course) {
      recommendations.push({
        userId,
        recommendedCourseId: courseId,
        reason: "incomplete" as const,
        reasonText: `You're ${enrollments.find((e: any) => e.courseId === courseId)?.progress || 0}% through this course. Keep going!`,
        priority: 10,
      });
    }
  }

  // Recommend courses based on weak quiz performance
  const weakCourses = quizzes
    .filter((q: any) => q.score < 70)
    .map((q: any) => q.courseId as number);

  const uniqueWeakCourses = Array.from(new Set(weakCourses));
  for (const courseId of uniqueWeakCourses) {
    if (!completedCourseIds.includes(courseId) && !inProgressCourseIds.includes(courseId)) {
      const course = allCourses.find((c: any) => c.id === courseId);
      if (course) {
        recommendations.push({
          userId,
          recommendedCourseId: courseId as number,
          reason: "weak_area" as const,
          reasonText: `Strengthen your understanding in ${course.title}`,
          priority: 8,
        });
      }
    }
  }

  // Recommend next logical courses (e.g., advanced after fundamentals)
  for (const courseId of completedCourseIds) {
    const completedCourse = allCourses.find((c: any) => c.id === courseId);
    if (completedCourse && completedCourse.level === "fundamentals") {
      // Find advanced course in same framework
      const advancedCourse = allCourses.find(
        (c: any) =>
          c.framework === completedCourse.framework &&
          c.level === "advanced" &&
          !completedCourseIds.includes(c.id) &&
          !inProgressCourseIds.includes(c.id)
      );

      if (advancedCourse) {
        recommendations.push({
          userId,
          recommendedCourseId: advancedCourse.id,
          reason: "advanced" as const,
          reasonText: `Ready for advanced ${completedCourse.framework}? Take your skills to the next level.`,
          priority: 7,
        });
      }
    }
  }

  // Recommend popular courses (lowest priority)
  const notEnrolledCourses = allCourses.filter(
    (c: any) => !completedCourseIds.includes(c.id) && !inProgressCourseIds.includes(c.id)
  );

  if (notEnrolledCourses.length > 0 && recommendations.length < 5) {
    const popularCourse = notEnrolledCourses[0]; // First course as "popular"
    recommendations.push({
      userId,
      recommendedCourseId: popularCourse.id,
      reason: "popular" as const,
      reasonText: `${popularCourse.title} is popular among AI safety professionals`,
      priority: 5,
    });
  }

  // Insert recommendations (limit to top 5)
  if (recommendations.length > 0) {
    await db.insert(userRecommendations).values(recommendations.slice(0, 5));
  }
}
