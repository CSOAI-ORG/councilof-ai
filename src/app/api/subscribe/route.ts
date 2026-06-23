import { NextRequest, NextResponse } from "next/server";

// Simple in-memory rate limiter (per Vercel instance, resets on cold start)
const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 5;
const attempts = new Map<string, { count: number; resetAt: number }>();

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = attempts.get(ip);
  if (!record || now > record.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  record.count += 1;
  return record.count > MAX_REQUESTS_PER_WINDOW;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  const maskedLocal = local.length > 2 ? `${local.slice(0, 2)}***` : "***";
  return `${maskedLocal}@${domain}`;
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (isRateLimited(ip)) {
    return NextResponse.json({ success: false, error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    const contentType = request.headers.get("content-type") || "";
    let email: unknown;
    let source: unknown;

    if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      email = form.get("email");
      source = form.get("source");
    } else {
      const body = (await request.json()) as { email?: unknown; source?: unknown };
      email = body.email;
      source = body.source;
    }

    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const normalizedSource = typeof source === "string" ? source.trim().slice(0, 100) : "website";

    if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
      return NextResponse.json({ success: false, error: "Valid email required" }, { status: 400 });
    }

    const lead = { email: normalizedEmail, source: normalizedSource, timestamp: new Date().toISOString() };

    // Log masked email only (privacy)
    console.log("[LEAD CAPTURED]", JSON.stringify({ email: maskEmail(normalizedEmail), source: normalizedSource, timestamp: lead.timestamp }));

    if (process.env.DATABASE_URL) {
      try {
        const { Pool } = await import("pg");
        const pool = new Pool({ connectionString: process.env.DATABASE_URL });
        const client = await pool.connect();
        try {
          await client.query(
            "INSERT INTO subscribers (email, source, created_at) VALUES ($1, $2, NOW()) ON CONFLICT DO NOTHING",
            [normalizedEmail, normalizedSource]
          );
        } finally {
          client.release();
        }
      } catch (dbErr) {
        console.error("DB write failed (non-critical):", dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Subscribed successfully",
      lead: { email: maskEmail(normalizedEmail), source: normalizedSource },
    });
  } catch (error) {
    console.error("Subscribe error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  const adminToken = process.env.ADMIN_TOKEN;
  if (!adminToken) {
    return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
  }
  if (auth !== `Bearer ${adminToken}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ count: 0, message: "Use your CRM or database admin for lead export." });
}
