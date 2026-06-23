import { NextRequest, NextResponse } from "next/server";

const UPSTREAM = process.env.POLICY_API_URL;

export async function POST(request: NextRequest) {
  if (!UPSTREAM) {
    return NextResponse.json(
      { error: "policy_tunnel_not_configured", message: "Set POLICY_API_URL to enable policy proxying." },
      { status: 503 }
    );
  }

  try {
    const url = new URL("/v1/policy/evaluate", UPSTREAM);
    const body = await request.json();
    const auth = request.headers.get("authorization") || "";
    const res = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(auth ? { Authorization: auth } : {}),
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "policy_tunnel_unreachable" }, { status: 502 });
  }
}
