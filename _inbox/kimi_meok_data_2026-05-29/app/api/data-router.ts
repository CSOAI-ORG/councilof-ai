import { z } from "zod";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { datasets, subscriptions, apiKeys, dataRequests } from "../db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export const dataRouter = createRouter({
  // List available datasets (public)
  listDatasets: publicQuery
    .input(z.object({
      category: z.enum(["governance", "healthcare", "financial", "cross_domain"]).optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const where = input?.category
        ? eq(datasets.category, input.category)
        : undefined;

      const results = await db
        .select()
        .from(datasets)
        .where(where)
        .orderBy(datasets.status, datasets.name);

      return results;
    }),

  // Get dataset by slug (public)
  getDataset: publicQuery
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const [dataset] = await db
        .select()
        .from(datasets)
        .where(eq(datasets.slug, input.slug))
        .limit(1);

      return dataset || null;
    }),

  // Get user's subscription (authed)
  getSubscription: authedQuery
    .query(async ({ ctx }) => {
      const db = getDb();
      const [sub] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, ctx.user.id))
        .orderBy(desc(subscriptions.createdAt))
        .limit(1);

      return sub || null;
    }),

  // Get user's API keys (authed)
  listApiKeys: authedQuery
    .query(async ({ ctx }) => {
      const db = getDb();
      return db
        .select({
          id: apiKeys.id,
          name: apiKeys.name,
          keyPrefix: apiKeys.keyPrefix,
          tier: apiKeys.tier,
          requestsUsed: apiKeys.requestsUsed,
          requestsLimit: apiKeys.requestsLimit,
          isActive: apiKeys.isActive,
          lastUsedAt: apiKeys.lastUsedAt,
          createdAt: apiKeys.createdAt,
        })
        .from(apiKeys)
        .where(eq(apiKeys.userId, ctx.user.id))
        .orderBy(desc(apiKeys.createdAt));
    }),

  // Create API key (authed)
  createApiKey: authedQuery
    .input(z.object({
      name: z.string().min(1).max(100),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      // Get user's subscription tier
      const [sub] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, ctx.user.id))
        .orderBy(desc(subscriptions.createdAt))
        .limit(1);

      const tier = sub?.tier || "free";
      const limit = tier === "enterprise" ? 1000000 : tier === "pro" ? 10000 : 100;

      // Generate key (in production, hash the full key)
      const prefix = "mk_" + tier.slice(0, 1);
      const randomPart = Array.from({ length: 24 }, () =>
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 62)]
      ).join("");
      const fullKey = `${prefix}_${randomPart}`;
      const keyPrefix = fullKey.slice(0, 12);

      await db.insert(apiKeys).values({
        userId: ctx.user.id,
        name: input.name,
        keyHash: fullKey, // In production: hash with bcrypt
        keyPrefix,
        tier,
        requestsLimit: limit,
      });

      return { key: fullKey, prefix: keyPrefix };
    }),

  // Get usage stats (authed)
  getUsageStats: authedQuery
    .query(async ({ ctx }) => {
      const db = getDb();

      // Total requests today
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const [todayRequests] = await db
        .select({ count: sql<number>`count(*)` })
        .from(dataRequests)
        .where(
          and(
            eq(dataRequests.userId, ctx.user.id),
            sql`${dataRequests.createdAt} >= ${todayStart}`
          )
        );

      // Get subscription
      const [sub] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, ctx.user.id))
        .orderBy(desc(subscriptions.createdAt))
        .limit(1);

      // Recent requests
      const recent = await db
        .select()
        .from(dataRequests)
        .where(eq(dataRequests.userId, ctx.user.id))
        .orderBy(desc(dataRequests.createdAt))
        .limit(20);

      return {
        todayRequests: todayRequests?.count || 0,
        subscription: sub || null,
        recentRequests: recent,
      };
    }),

  // Query dataset (simulated - authed)
  queryDataset: authedQuery
    .input(z.object({
      slug: z.string(),
      limit: z.number().min(1).max(1000).default(100),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const startTime = Date.now();

      // Check subscription
      const [sub] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, ctx.user.id))
        .orderBy(desc(subscriptions.createdAt))
        .limit(1);

      const tier = sub?.tier || "free";
      const requestLimit = tier === "enterprise" ? 1000000 : tier === "pro" ? 10000 : 100;

      if ((sub?.requestsUsed || 0) >= requestLimit) {
        throw new Error("Request limit exceeded. Upgrade your plan.");
      }

      // Get dataset
      const [dataset] = await db
        .select()
        .from(datasets)
        .where(eq(datasets.slug, input.slug))
        .limit(1);

      if (!dataset) {
        throw new Error("Dataset not found");
      }

      // Check tier access
      const tierLevels = { free: 0, pro: 1, enterprise: 2 };
      if (tierLevels[tier] < tierLevels[dataset.minTier]) {
        throw new Error(`Dataset requires ${dataset.minTier} tier or higher`);
      }

      // Increment usage
      if (sub) {
        await db
          .update(subscriptions)
          .set({ requestsUsed: sql`${subscriptions.requestsUsed} + 1` })
          .where(eq(subscriptions.id, sub.id));
      }

      // Log request
      await db.insert(dataRequests).values({
        userId: ctx.user.id,
        endpoint: `/v1/datasets/${input.slug}`,
        method: "GET",
        datasetSlug: input.slug,
        statusCode: 200,
        responseTimeMs: Date.now() - startTime,
        recordsReturned: Math.min(input.limit, 1000),
      });

      // Return simulated data
      return {
        dataset: {
          name: dataset.name,
          slug: dataset.slug,
          category: dataset.category,
          recordCount: dataset.recordCount,
        },
        records: generateMockData(dataset.slug, input.limit),
        meta: {
          totalRecords: dataset.recordCount,
          returned: Math.min(input.limit, 1000),
          responseTime: Date.now() - startTime,
        },
      };
    }),
});

function generateMockData(slug: string, limit: number) {
  const count = Math.min(limit, 10);
  const records = [];

  if (slug.includes("eu-ai-act")) {
    for (let i = 0; i < count; i++) {
      records.push({
        id: `REQ-${1000 + i}`,
        article: `Article ${i + 1}`,
        requirement: `High-risk AI systems must ${["maintain logs", "ensure transparency", "enable human oversight", "meet accuracy standards"][i % 4]}`,
        riskLevel: ["high", "limited", "minimal", "unacceptable"][i % 4],
        lastUpdated: new Date(Date.now() - i * 86400000).toISOString(),
      });
    }
  } else if (slug.includes("fhir")) {
    for (let i = 0; i < count; i++) {
      records.push({
        id: `obs-${10000 + i}`,
        resourceType: "Observation",
        code: ["8867-4", "8310-5", "2710-2"][i % 3],
        value: `${90 + i}/${60 + i} mmHg`,
        effectiveDateTime: new Date(Date.now() - i * 3600000).toISOString(),
        status: "final",
      });
    }
  } else {
    for (let i = 0; i < count; i++) {
      records.push({
        id: `rec-${i}`,
        index: i,
        value: Math.floor(Math.random() * 1000),
        timestamp: new Date(Date.now() - i * 3600000).toISOString(),
        category: ["A", "B", "C"][i % 3],
      });
    }
  }

  return records;
}
