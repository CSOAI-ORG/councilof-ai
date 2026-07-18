import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import type { InsertUser } from "./schema";
import { users } from "./schema";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    // Check if user exists
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.openId, user.openId))
      .limit(1);

    if (existing.length > 0) {
      // Update existing user
      await db
        .update(users)
        .set({
          name: user.name,
          email: user.email,
          lastSignedIn: new Date(),
        })
        .where(eq(users.openId, user.openId));
    } else {
      // Insert new user
      await db.insert(users).values(user);
    }
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return null;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return user || null;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return null;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return user || null;
}
