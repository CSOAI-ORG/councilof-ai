import { NextRequest, NextResponse } from "next/server";

const UPSTREAM = process.env.IDENTITY_API_URL;

export async function POST(request: NextRequest) {
  if (!UPSTREAM) {
    return NextResponse.json(
      { error: "identity_tunnel_not_configured", message: "Set IDENTITY_API_URL to enable identity proxying." },
      { status: 503 }
    );
  }

  try {
    const url = new URL("/v1/identity/register", UPSTREAM);
    const body = await request.json();
    const res = await fetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "identity_tunnel_unreachable" }, { status: 502 });
  }
}
