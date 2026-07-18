/**
 * Email Digest Service
 * Batch notifications into daily/weekly email digests
 */

import { getDb } from "../db";
import { notifications, notificationPreferences, users } from "../../drizzle/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { sendEmail } from "../emailService";

interface DigestNotification {
  id: number;
  type: string;
  title: string;
  message: string;
  createdAt: Date;
  priority: string;
}

/**
 * Generate HTML email digest template
 */
function generateDigestHTML(
  userName: string,
  notificationsList: DigestNotification[],
  frequency: 'daily' | 'weekly'
): string {
  const period = frequency === 'daily' ? 'Today' : 'This Week';
  
  const notificationItems = notificationsList
    .map(
      (notif) => `
        <div style="border-left: 4px solid ${getPriorityColor(notif.priority)}; padding: 12px; margin-bottom: 12px; background: #f9fafb;">
          <div style="font-weight: 600; color: #111827; margin-bottom: 4px;">${notif.title}</div>
          <div style="font-size: 14px; color: #6b7280; margin-bottom: 4px;">${notif.message}</div>
          <div style="font-size: 12px; color: #9ca3af;">${formatDate(notif.createdAt)}</div>
        </div>
      `
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>CSOAI Notification Digest</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">CSOAI Notification Digest</h1>
            <p style="color: #cbd5e1; margin: 8px 0 0 0; font-size: 14px;">${period}'s Updates</p>
          </div>

          <!-- Content -->
          <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <p style="color: #374151; margin: 0 0 20px 0;">
              Hi ${userName},
            </p>
            <p style="color: #374151; margin: 0 0 20px 0;">
              Here's a summary of your notifications from ${period.toLowerCase()}:
            </p>

            <!-- Notifications List -->
            <div style="margin: 20px 0;">
              ${notificationItems}
            </div>

            <!-- Summary -->
            <div style="background: #eff6ff; border: 1px solid #dbeafe; border-radius: 6px; padding: 16px; margin-top: 20px;">
              <p style="margin: 0; color: #1e40af; font-weight: 600;">
                📊 Total Notifications: ${notificationsList.length}
              </p>
            </div>

            <!-- CTA -->
            <div style="text-align: center; margin-top: 30px;">
              <a href="https://csoai.manus.space" style="display: inline-block; background: #0f172a; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                View Dashboard
              </a>
            </div>

            <!-- Footer -->
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                You're receiving this digest because you enabled ${frequency} email digests in your notification settings.
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin: 8px 0 0 0;">
                <a href="https://csoai.manus.space/settings/notifications" style="color: #3b82f6; text-decoration: none;">Manage notification preferences</a>
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'high':
      return '#ef4444';
    case 'medium':
      return '#f59e0b';
    case 'low':
      return '#3b82f6';
    default:
      return '#6b7280';
  }
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Send daily digest emails to users
 */
export async function sendDailyDigests(): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.error('[EmailDigest] Database not available');
    return;
  }

  // Get users with daily digest enabled
  const usersWithDigest = await db
    .select({
      userId: notificationPreferences.userId,
      userName: users.name,
      userEmail: users.email,
    })
    .from(notificationPreferences)
    .leftJoin(users, eq(notificationPreferences.userId, users.id))
    .where(
      and(
        eq(notificationPreferences.digestEnabled, true),
        eq(notificationPreferences.digestFrequency, 'daily')
      )
    );

  console.log(`[EmailDigest] Processing daily digests for ${usersWithDigest.length} users`);

  // Get yesterday's start and end
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const user of usersWithDigest) {
    if (!user.userEmail || !user.userId) continue;

    // Get unread notifications from yesterday
    const userNotifications = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, user.userId),
          eq(notifications.isRead, false),
          gte(notifications.createdAt, yesterday),
          lte(notifications.createdAt, today)
        )
      )
      .orderBy(desc(notifications.createdAt));

    if (userNotifications.length === 0) {
      console.log(`[EmailDigest] No notifications for user ${user.userId}, skipping`);
      continue;
    }

    // Generate and send digest email
    const htmlContent = generateDigestHTML(
      user.userName || 'User',
      userNotifications as any,
      'daily'
    );

    try {
      await sendEmail({
        to: user.userEmail,
        subject: `CSOAI Daily Digest - ${userNotifications.length} new notifications`,
        html: htmlContent,
      });

      // Update last digest sent timestamp
      await db
        .update(notificationPreferences)
        .set({ lastDigestSentAt: new Date() })
        .where(eq(notificationPreferences.userId, user.userId));

      console.log(`[EmailDigest] Sent daily digest to user ${user.userId}`);
    } catch (error) {
      console.error(`[EmailDigest] Failed to send digest to user ${user.userId}:`, error);
    }
  }
}

/**
 * Send weekly digest emails to users
 */
export async function sendWeeklyDigests(): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.error('[EmailDigest] Database not available');
    return;
  }

  // Get users with weekly digest enabled
  const usersWithDigest = await db
    .select({
      userId: notificationPreferences.userId,
      userName: users.name,
      userEmail: users.email,
    })
    .from(notificationPreferences)
    .leftJoin(users, eq(notificationPreferences.userId, users.id))
    .where(
      and(
        eq(notificationPreferences.digestEnabled, true),
        eq(notificationPreferences.digestFrequency, 'weekly')
      )
    );

  console.log(`[EmailDigest] Processing weekly digests for ${usersWithDigest.length} users`);

  // Get last week's start and end
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);
  lastWeek.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const user of usersWithDigest) {
    if (!user.userEmail || !user.userId) continue;

    // Get unread notifications from last week
    const userNotifications = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, user.userId),
          eq(notifications.isRead, false),
          gte(notifications.createdAt, lastWeek),
          lte(notifications.createdAt, today)
        )
      )
      .orderBy(desc(notifications.createdAt));

    if (userNotifications.length === 0) {
      console.log(`[EmailDigest] No notifications for user ${user.userId}, skipping`);
      continue;
    }

    // Generate and send digest email
    const htmlContent = generateDigestHTML(
      user.userName || 'User',
      userNotifications as any,
      'weekly'
    );

    try {
      await sendEmail({
        to: user.userEmail,
        subject: `CSOAI Weekly Digest - ${userNotifications.length} new notifications`,
        html: htmlContent,
      });

      // Update last digest sent timestamp
      await db
        .update(notificationPreferences)
        .set({ lastDigestSentAt: new Date() })
        .where(eq(notificationPreferences.userId, user.userId));

      console.log(`[EmailDigest] Sent weekly digest to user ${user.userId}`);
    } catch (error) {
      console.error(`[EmailDigest] Failed to send digest to user ${user.userId}:`, error);
    }
  }
}
