import { describe, it, expect, beforeEach } from 'vitest';
import { appRouter } from '../routers';
import { getDb } from '../db';
import { 
  courseEnrollments, 
  learningSessions, 
  quizAnalytics, 
  userRecommendations,
  courseCertificates,
  courses,
  users
} from '../../drizzle/schema';
import { eq, and } from 'drizzle-orm';

describe('Progress Router', () => {
  let testUserId: number;
  let testCourseId: number;
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Create test user
    const [user] = await db.insert(users).values({
      openId: `test-progress-${Date.now()}`,
      name: 'Progress Test User',
      email: `progress-test-${Date.now()}@test.com`,
      loginMethod: 'test',
      role: 'user',
    }).$returningId();
    testUserId = user.id;

    // Create test course
    const [course] = await db.insert(courses).values({
      regionId: 1,
      title: 'Test Progress Course',
      framework: 'EU AI Act',
      level: 'fundamentals',
      durationHours: 2,
      price: 0,
      active: true,
      modules: [
        { title: 'Module 1', content: 'Test content 1', quiz: [] },
        { title: 'Module 2', content: 'Test content 2', quiz: [] },
      ],
    }).$returningId();
    testCourseId = course.id;

    // Create caller with test user context
    caller = appRouter.createCaller({
      user: { id: testUserId, openId: `test-progress-${Date.now()}`, role: 'user' },
      req: {} as any,
      res: {} as any,
    });
  });

  describe('getOverallProgress', () => {
    it('should return zero stats for new user', async () => {
      const result = await caller.progress.getOverallProgress();

      expect(result).toMatchObject({
        totalCourses: 0,
        completedCourses: 0,
        inProgressCourses: 0,
        completionPercentage: 0,
        totalHours: 0,
        avgScore: 0,
        certificateCount: 0,
      });
    });

    it('should calculate correct stats with enrollments', async () => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // Add enrollments
      await db.insert(courseEnrollments).values([
        {
          userId: testUserId,
          courseId: testCourseId,
          status: 'completed',
          progress: 100,
          score: 85,
        },
        {
          userId: testUserId,
          courseId: testCourseId + 1,
          status: 'in_progress',
          progress: 50,
        },
      ]);

      // Add learning sessions
      await db.insert(learningSessions).values({
        userId: testUserId,
        courseId: testCourseId,
        moduleIndex: 0,
        sessionStart: new Date(Date.now() - 120 * 60 * 1000),
        sessionEnd: new Date(),
        durationMinutes: 120,
        completed: true,
      });

      // Add quiz analytics
      await db.insert(quizAnalytics).values({
        userId: testUserId,
        courseId: testCourseId,
        moduleIndex: 0,
        attemptNumber: 1,
        score: 85,
        correctAnswers: 17,
        totalQuestions: 20,
        timeSpentSeconds: 600,
        passed: true,
      });

      const result = await caller.progress.getOverallProgress();

      expect(result.totalCourses).toBe(2);
      expect(result.completedCourses).toBe(1);
      expect(result.inProgressCourses).toBe(1);
      expect(result.completionPercentage).toBe(50);
      expect(result.totalHours).toBe(2);
      expect(result.avgScore).toBe(85);
    });
  });

  describe('getCourseProgress', () => {
    it('should throw error if not enrolled', async () => {
      await expect(
        caller.progress.getCourseProgress({ courseId: testCourseId })
      ).rejects.toThrow('Not enrolled in this course');
    });

    it('should return detailed course progress', async () => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // Enroll user
      await db.insert(courseEnrollments).values({
        userId: testUserId,
        courseId: testCourseId,
        status: 'in_progress',
        progress: 50,
      });

      // Add learning session
      await db.insert(learningSessions).values({
        userId: testUserId,
        courseId: testCourseId,
        moduleIndex: 0,
        sessionStart: new Date(Date.now() - 60 * 60 * 1000),
        sessionEnd: new Date(),
        durationMinutes: 60,
        completed: true,
      });

      // Add quiz
      await db.insert(quizAnalytics).values({
        userId: testUserId,
        courseId: testCourseId,
        moduleIndex: 0,
        attemptNumber: 1,
        score: 90,
        correctAnswers: 18,
        totalQuestions: 20,
        timeSpentSeconds: 300,
        passed: true,
      });

      const result = await caller.progress.getCourseProgress({ courseId: testCourseId });

      expect(result.totalModules).toBe(2);
      expect(result.completedModules).toBe(1);
      expect(result.moduleCompletionPercentage).toBe(50);
      expect(result.moduleStats).toHaveLength(2);
      expect(result.moduleStats[0].completed).toBe(true);
      expect(result.moduleStats[0].quizScore).toBe(90);
    });
  });

  describe('getQuizAnalytics', () => {
    it('should return empty analytics for user with no quizzes', async () => {
      const result = await caller.progress.getQuizAnalytics();

      expect(result).toMatchObject({
        totalAttempts: 0,
        avgScore: 0,
        passRate: 0,
        scoreTrend: [],
        topicPerformance: [],
        recentQuizzes: [],
      });
    });

    it('should calculate quiz analytics correctly', async () => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // Add multiple quiz attempts
      await db.insert(quizAnalytics).values([
        {
          userId: testUserId,
          courseId: testCourseId,
          moduleIndex: 0,
          attemptNumber: 1,
          score: 80,
          correctAnswers: 16,
          totalQuestions: 20,
          timeSpentSeconds: 300,
          passed: true,
        },
        {
          userId: testUserId,
          courseId: testCourseId,
          moduleIndex: 1,
          attemptNumber: 1,
          score: 90,
          correctAnswers: 18,
          totalQuestions: 20,
          timeSpentSeconds: 250,
          passed: true,
        },
        {
          userId: testUserId,
          courseId: testCourseId,
          moduleIndex: 2,
          attemptNumber: 1,
          score: 65,
          correctAnswers: 13,
          totalQuestions: 20,
          timeSpentSeconds: 400,
          passed: false,
        },
      ]);

      const result = await caller.progress.getQuizAnalytics();

      expect(result.totalAttempts).toBe(3);
      expect(result.avgScore).toBe(78); // (80 + 90 + 65) / 3 = 78.33 rounded
      expect(result.passRate).toBe(67); // 2/3 = 66.67 rounded
      expect(result.scoreTrend).toHaveLength(3);
      expect(result.recentQuizzes).toHaveLength(3);
    });
  });

  describe('getCertificates', () => {
    it('should return empty array for user with no certificates', async () => {
      const result = await caller.progress.getCertificates();
      expect(result).toEqual([]);
    });

    it('should return user certificates with course details', async () => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // Add certificate
      await db.insert(courseCertificates).values({
        userId: testUserId,
        courseId: testCourseId,
        certificateId: 'CERT-TEST-123',
        issuedAt: new Date(),
      });

      const result = await caller.progress.getCertificates();

      expect(result).toHaveLength(1);
      expect(result[0].certificateId).toBe('CERT-TEST-123');
      expect(result[0].courseName).toBe('Test Progress Course');
      expect(result[0].framework).toBe('EU AI Act');
      expect(result[0].verificationUrl).toContain('CERT-TEST-123');
    });
  });

  describe('getRecommendations', () => {
    it('should generate recommendations for new user', async () => {
      const result = await caller.progress.getRecommendations();

      // Should generate recommendations automatically
      expect(Array.isArray(result)).toBe(true);
    });

    it('should recommend incomplete courses with high priority', async () => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // Enroll user in course (in progress)
      await db.insert(courseEnrollments).values({
        userId: testUserId,
        courseId: testCourseId,
        status: 'in_progress',
        progress: 60,
      });

      const result = await caller.progress.getRecommendations();

      const incompleteRec = result.find(r => r.reason === 'incomplete');
      expect(incompleteRec).toBeDefined();
      expect(incompleteRec?.priority).toBe(10);
    });
  });

  describe('trackLearningSession', () => {
    it('should create learning session successfully', async () => {
      const result = await caller.progress.trackLearningSession({
        courseId: testCourseId,
        moduleIndex: 0,
        durationMinutes: 45,
        completed: true,
      });

      expect(result.success).toBe(true);

      // Verify session was created
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const sessions = await db
        .select()
        .from(learningSessions)
        .where(
          and(
            eq(learningSessions.userId, testUserId),
            eq(learningSessions.courseId, testCourseId)
          )
        );

      expect(sessions).toHaveLength(1);
      expect(sessions[0].durationMinutes).toBe(45);
      expect(sessions[0].completed).toBe(true);
    });
  });

  describe('dismissRecommendation', () => {
    it('should dismiss recommendation successfully', async () => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // Create recommendation
      const [rec] = await db.insert(userRecommendations).values({
        userId: testUserId,
        recommendedCourseId: testCourseId,
        reason: 'popular',
        reasonText: 'Test recommendation',
        priority: 5,
      }).$returningId();

      const result = await caller.progress.dismissRecommendation({
        recommendationId: rec.id,
      });

      expect(result.success).toBe(true);

      // Verify recommendation was dismissed
      const [updated] = await db
        .select()
        .from(userRecommendations)
        .where(eq(userRecommendations.id, rec.id));

      expect(updated.dismissed).toBe(true);
    });
  });
});
