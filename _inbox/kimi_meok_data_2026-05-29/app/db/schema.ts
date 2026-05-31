import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  bigint,
  int,
  json,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// MEOK DATA: Subscription tiers
export const subscriptions = mysqlTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  tier: mysqlEnum("tier", ["free", "pro", "enterprise"]).default("free").notNull(),
  status: mysqlEnum("status", ["active", "cancelled", "past_due"]).default("active").notNull(),
  requestsUsed: int("requestsUsed").default(0).notNull(),
  requestsLimit: int("requestsLimit").default(100).notNull(),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type Subscription = typeof subscriptions.$inferSelect;

// MEOK DATA: API Keys
export const apiKeys = mysqlTable("api_keys", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  keyHash: varchar("keyHash", { length: 255 }).notNull(),
  keyPrefix: varchar("keyPrefix", { length: 12 }).notNull(),
  tier: mysqlEnum("tier", ["free", "pro", "enterprise"]).default("free").notNull(),
  requestsUsed: int("requestsUsed").default(0).notNull(),
  requestsLimit: int("requestsLimit").default(100).notNull(),
  lastUsedAt: timestamp("lastUsedAt"),
  expiresAt: timestamp("expiresAt"),
  isActive: mysqlEnum("isActive", ["yes", "no"]).default("yes").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ApiKey = typeof apiKeys.$inferSelect;

// MEOK DATA: Datasets catalog
export const datasets = mysqlTable("datasets", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: mysqlEnum("category", ["governance", "healthcare", "financial", "cross_domain"]).notNull(),
  sourceMcp: varchar("sourceMcp", { length: 255 }),
  minTier: mysqlEnum("minTier", ["free", "pro", "enterprise"]).default("free").notNull(),
  recordCount: bigint("recordCount", { mode: "number" }).default(0),
  schema: json("schema"),
  status: mysqlEnum("status", ["live", "beta", "deprecated"]).default("live").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Dataset = typeof datasets.$inferSelect;

// MEOK DATA: API request logs
export const dataRequests = mysqlTable("data_requests", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  apiKeyId: bigint("apiKeyId", { mode: "number", unsigned: true }),
  endpoint: varchar("endpoint", { length: 255 }).notNull(),
  method: varchar("method", { length: 10 }).notNull(),
  datasetSlug: varchar("datasetSlug", { length: 100 }),
  statusCode: int("statusCode"),
  responseTimeMs: int("responseTimeMs"),
  recordsReturned: int("recordsReturned").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DataRequest = typeof dataRequests.$inferSelect;

// MEOK DATA: Licensing agreements
export const licenses = mysqlTable("licenses", {
  id: serial("id").primaryKey(),
  licenseeName: varchar("licenseeName", { length: 255 }).notNull(),
  licenseeEmail: varchar("licenseeEmail", { length: 320 }).notNull(),
  licenseType: mysqlEnum("licenseType", ["b2b_revenue_share", "academic", "enterprise_custom"]).notNull(),
  revenueShare: int("revenueShare"), // percentage for revenue share deals
  datasetsAllowed: json("datasetsAllowed"), // array of dataset slugs
  status: mysqlEnum("status", ["pending", "active", "expired", "terminated"]).default("pending").notNull(),
  startedAt: timestamp("startedAt"),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type License = typeof licenses.$inferSelect;
