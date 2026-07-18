import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { notifications, notificationPreferences } from "../../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";

/**
 * Send notification via email (placeholder - integrate with actual email service)
 */
async function sendEmailNotification(email: string, title: string, message: string) {
  // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
  console.log(`[Email] To: ${email}, Subject: ${title}, Body: ${message}`);
  return true;
}

/**
 * Send notification via Slack webhook
 */
async function sendSlackNotification(webhookUrl: string, title: string, message: string, link?: string) {
  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `*${title}*\n${message}${link ? `\n<${link}|View Details>` : ""}`,
      }),
    });

    if (!response.ok) {
      console.error(`[Slack] Failed to send notification: ${response.statusText}`);
      return false;
    }

    console.log(`[Slack] Notification sent successfully`);
    return true;
  } catch (error) {
    console.error(`[Slack] Error sending notification:`, error);
    return false;
  }
}

/**
 * Create and deliver a notification
 */
export async function createNotification(params: {
  userId: number;
  type: "compliance_alert" | "system_update" | "job_application" | "certificate_issued" | "council_decision" | "report_update";
  title: string;
  message: string;
  link?: string;
  priority?: "low" | "medium" | "high" | "urgent";
  metadata?: Record<string, any>;
  userEmail?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Create in-app notification
  const [notification] = await db
    .insert(notifications)
    .values({
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link,
      priority: params.priority || "medium",
      metadata: params.metadata,
      isRead: false,
    })
    .$returningId();

  // Get user preferences
  const [prefs] = await db
    .select()
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, params.userId))
    .limit(1);

  // Check if user wants this type of notification
  const typeEnabled = prefs ? prefs[`${params.type.replace("_", "")}` as keyof typeof prefs] : true;

  if (typeEnabled) {
    // Send email if enabled
    if (prefs?.emailEnabled && params.userEmail) {
      await sendEmailNotification(params.userEmail, params.title, params.message);
    }

    // Send Slack if enabled and webhook configured
    if (prefs?.slackEnabled && prefs.slackWebhookUrl) {
      await sendSlackNotification(prefs.slackWebhookUrl, params.title, params.message, params.link);
    }
  }

  return notification;
}

export const notificationsRouter = router({
  /**
   * Get user's notifications
   */
  getNotifications: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        unreadOnly: z.boolean().default(false),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { notifications: [], total: 0, unreadCount: 0 };

      const userId = Number(ctx.user.id);

      // Build conditions
      const conditions: any[] = [eq(notifications.userId, userId)];
      if (input.unreadOnly) {
        conditions.push(eq(notifications.isRead, false));
      }

      // Get notifications
      const notificationsList = await db
        .select()
        .from(notifications)
        .where(and(...conditions))
        .orderBy(desc(notifications.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      // Get total count
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(notifications)
        .where(and(...conditions));

      // Get unread count
      const [{ unreadCount }] = await db
        .select({ unreadCount: sql<number>`count(*)` })
        .from(notifications)
        .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

      return {
        notifications: notificationsList,
        total: count || 0,
        unreadCount: unreadCount || 0,
      };
    }),

  /**
   * Mark notification as read
   */
  markAsRead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const userId = Number(ctx.user.id);

      // Verify ownership
      const [notification] = await db
        .select()
        .from(notifications)
        .where(eq(notifications.id, input.id))
        .limit(1);

      if (!notification || notification.userId !== userId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Notification not found" });
      }

      // Mark as read
      await db
        .update(notifications)
        .set({ isRead: true, readAt: new Date() })
        .where(eq(notifications.id, input.id));

      return { success: true };
    }),

  /**
   * Mark all notifications as read
   */
  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const userId = Number(ctx.user.id);

    await db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

    return { success: true };
  }),

  /**
   * Delete notification
   */
  deleteNotification: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const userId = Number(ctx.user.id);

      // Verify ownership
      const [notification] = await db
        .select()
        .from(notifications)
        .where(eq(notifications.id, input.id))
        .limit(1);

      if (!notification || notification.userId !== userId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Notification not found" });
      }

      await db.delete(notifications).where(eq(notifications.id, input.id));

      return { success: true };
    }),

  /**
   * Get notification preferences
   */
  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;

    const userId = Number(ctx.user.id);

    const [prefs] = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId))
      .limit(1);

    // Create default preferences if none exist
    if (!prefs) {
      const [newPrefs] = await db
        .insert(notificationPreferences)
        .values({ userId })
        .$returningId();

      const [created] = await db
        .select()
        .from(notificationPreferences)
        .where(eq(notificationPreferences.id, newPrefs.id))
        .limit(1);

      return created;
    }

    return prefs;
  }),

  /**
   * Update notification preferences
   */
  updatePreferences: protectedProcedure
    .input(
      z.object({
        emailEnabled: z.boolean().optional(),
        slackEnabled: z.boolean().optional(),
        slackWebhookUrl: z.string().url().optional().nullable(),
        complianceAlerts: z.boolean().optional(),
        systemUpdates: z.boolean().optional(),
        jobApplications: z.boolean().optional(),
        certificateIssued: z.boolean().optional(),
        councilDecisions: z.boolean().optional(),
        reportUpdates: z.boolean().optional(),
        digestEnabled: z.boolean().optional(),
        digestFrequency: z.enum(["daily", "weekly"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const userId = Number(ctx.user.id);

      // Check if preferences exist
      const [existing] = await db
        .select()
        .from(notificationPreferences)
        .where(eq(notificationPreferences.userId, userId))
        .limit(1);

      if (existing) {
        // Update existing preferences
        await db
          .update(notificationPreferences)
          .set(input)
          .where(eq(notificationPreferences.userId, userId));
      } else {
        // Create new preferences
        await db.insert(notificationPreferences).values({
          userId,
          ...input,
        });
      }

      return { success: true };
    }),

  /**
   * Test notification delivery
   */
  testNotification: protectedProcedure
    .input(
      z.object({
        channel: z.enum(["email", "slack"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = Number(ctx.user.id);

      await createNotification({
        userId,
        type: "system_update",
        title: "Test Notification",
        message: `This is a test notification sent via ${input.channel}`,
        priority: "low",
        userEmail: ctx.user.email || undefined,
      });

      return { success: true, message: `Test notification sent via ${input.channel}` };
    }),
});
