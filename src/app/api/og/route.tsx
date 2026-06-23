import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawTitle = searchParams.get("title") || "CSOAI";
  const rawDesc = searchParams.get("desc") || "The Council for the Safety of AI";

  const title = rawTitle.slice(0, 100).replace(/[<>]/g, "");
  const desc = rawDesc.slice(0, 200).replace(/[<>]/g, "");

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          backgroundColor: "#020617",
          backgroundImage: "radial-gradient(circle at 80% 20%, rgba(16,185,129,0.15), transparent 40%)",
          padding: 80,
          fontFamily: "Inter, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 40,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              backgroundColor: "#10b981",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#020617",
              fontSize: 28,
              fontWeight: 900,
            }}
          >
            0
          </div>
          <span style={{ fontSize: 32, fontWeight: 800, color: "#ffffff", letterSpacing: "-0.02em" }}>
            CSOAI
          </span>
        </div>
        <h1
          style={{
            fontSize: 72,
            fontWeight: 900,
            color: "#ffffff",
            lineHeight: 1.05,
            letterSpacing: "-0.03em",
            marginBottom: 24,
            maxWidth: 900,
          }}
        >
          {title}
        </h1>
        <p
          style={{
            fontSize: 32,
            color: "#94a3b8",
            maxWidth: 900,
            lineHeight: 1.4,
          }}
        >
          {desc}
        </p>
        <div
          style={{
            marginTop: 60,
            padding: "12px 24px",
            borderRadius: 999,
            border: "1px solid rgba(16,185,129,0.4)",
            backgroundColor: "rgba(16,185,129,0.1)",
            color: "#34d399",
            fontSize: 20,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          csoai.org
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
