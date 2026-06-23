import { NextRequest, NextResponse } from "next/server";

const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 3;
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

function sanitize(str: unknown): string {
  if (typeof str !== "string") return "";
  return str
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, 2000);
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (isRateLimited(ip)) {
    return NextResponse.json({ success: false, error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    const body = (await request.json()) as {
      name?: unknown;
      email?: unknown;
      company?: unknown;
      topic?: unknown;
      message?: unknown;
    };

    const name = sanitize(body.name);
    const email = sanitize(body.email).toLowerCase();
    const company = sanitize(body.company);
    const topic = sanitize(body.topic);
    const message = sanitize(body.message);

    if (!name || !email || !isValidEmail(email) || !topic || !message) {
      return NextResponse.json({ success: false, error: "Name, email, topic and message are required" }, { status: 400 });
    }

    const lead = { name, email, company, topic, message, ip, timestamp: new Date().toISOString() };

    console.log(
      "[CONTACT FORM]",
      JSON.stringify({
        name,
        email: maskEmail(email),
        company,
        topic,
        message: message.slice(0, 200),
        ip,
        timestamp: lead.timestamp,
      })
    );

    if (process.env.DATABASE_URL) {
      try {
        const { Pool } = await import("pg");
        const pool = new Pool({ connectionString: process.env.DATABASE_URL });
        const client = await pool.connect();
        try {
          await client.query(
            `CREATE TABLE IF NOT EXISTS contact_submissions (
              id SERIAL PRIMARY KEY,
              name TEXT NOT NULL,
              email TEXT NOT NULL,
              company TEXT,
              topic TEXT NOT NULL,
              message TEXT NOT NULL,
              created_at TIMESTAMPTZ DEFAULT NOW()
            )`
          );
          await client.query(
            "INSERT INTO contact_submissions (name, email, company, topic, message) VALUES ($1, $2, $3, $4, $5)",
            [name, email, company, topic, message]
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
      message: "Message received. We will be in touch within 24 hours.",
    });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
