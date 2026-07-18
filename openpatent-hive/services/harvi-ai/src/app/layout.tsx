import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gaming Power Pack — harvi.ai",
  description:
    "Disclose novel game mechanics, procedural generation, and modder contributions. 30s from idea to Bitcoin-anchored. $10 starter, MIT core, MCP-friendly.",
  metadataBase: new URL("https://harvi.ai"),
  openGraph: {
    title: "harvi.ai — Disclose game mechanics before your studio's NDA leaks",
    description:
      "Game devs, modders, and indie studios use harvi.ai to timestamp novel mechanics, level designs, and procedural generation. Court-admissible in 10+ jurisdictions.",
    url: "https://harvi.ai",
    siteName: "harvi.ai",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif", color: "#2a1140", background: "#fff" }}>
        {children}
      </body>
    </html>
  );
}
