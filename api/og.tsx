import { ImageResponse } from "@vercel/og";

// /api/og — dynamic, tailored social cards (like meok.ai's). Pass ?title= &desc=
// and get a branded 1200×630 image. Isolated Vercel Edge function; does not touch
// the Vite SPA build.
export const config = { runtime: "edge" };

export default function handler(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = (searchParams.get("title") || "CSOAI").slice(0, 90);
  const desc = (searchParams.get("desc") || "AI governance, cybersecurity & safety — signed to Layer 0").slice(0, 140);

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #03110b 0%, #05261a 60%, #03110b 100%)",
          padding: "64px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "#34d399", display: "flex", alignItems: "center", justifyContent: "center", color: "#03110b", fontSize: 26, fontWeight: 900 }}>◉</div>
          <div style={{ color: "#8ff3c8", fontSize: 26, fontWeight: 800, letterSpacing: 2 }}>CSOAI</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div style={{ color: "#ecfdf5", fontSize: 62, fontWeight: 900, lineHeight: 1.05, maxWidth: 1000, display: "flex" }}>{title}</div>
          <div style={{ color: "#a7f3d0", fontSize: 30, fontWeight: 500, maxWidth: 980, display: "flex" }}>{desc}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "14px", color: "#34d399", fontSize: 22, fontWeight: 700 }}>
          <span>Ed25519 · Layer 0</span>
          <span style={{ color: "#065f46" }}>|</span>
          <span>33-agent Byzantine council</span>
          <span style={{ color: "#065f46" }}>|</span>
          <span>csoai.org</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
