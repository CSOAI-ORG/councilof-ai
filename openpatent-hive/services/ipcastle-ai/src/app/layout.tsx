import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "IP Castle Power Pack — ipcastle.ai",
  description:
    "The moat around your IP castle. BFT-reviewed claims, audit-grade chain of custody, patent pool coordination. 33-agent sovereign-temple v3.0.",
  metadataBase: new URL("https://ipcastle.ai"),
  openGraph: {
    title: "ipcastle.ai — The moat around your IP castle",
    description:
      "IP law firms, in-house IP teams, and patent pools use ipcastle.ai for high-volume defensive disclosure, BFT-reviewed claims, and audit-grade chain-of-custody.",
    url: "https://ipcastle.ai",
    siteName: "ipcastle.ai",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif", color: "#0d1f2d", background: "#fff" }}>
        {children}
      </body>
    </html>
  );
}
