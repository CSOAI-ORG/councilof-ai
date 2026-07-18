import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Legal Tech Power Pack — legalof.ai",
  description:
    "Defensive disclosure for patent attorneys, law firms, and inventors. Prior art that holds up in court across 10+ jurisdictions. $149 per filing, 5 min, Bitcoin-anchored.",
  metadataBase: new URL("https://legalof.ai"),
  openGraph: {
    title: "legalof.ai — Defensive disclosure for the world's most litigious industry",
    description:
      "Patent attorneys use legalof.ai to prove client prior art in 10+ jurisdictions. $149 per disclosure, Bitcoin-anchored, court-admissible.",
    url: "https://legalof.ai",
    siteName: "legalof.ai",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif", color: "#1a3a52", background: "#fff" }}>
        {children}
      </body>
    </html>
  );
}
