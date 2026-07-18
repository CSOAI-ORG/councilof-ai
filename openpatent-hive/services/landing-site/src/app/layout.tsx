import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OpenPatent.ai — Disclose First. AI Second.",
  description:
    "Protect your inventions from AI before you use AI. $10 defensive disclosure with 6-layer blockchain proof. Court-admissible in 10+ jurisdictions.",
  metadataBase: new URL("https://openpatent.ai"),
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "OpenPatent.ai — Disclose First. AI Second.",
    description: "Protect your inventions from AI. $10. 6 layers. Court-admissible.",
    url: "https://openpatent.ai",
    siteName: "OpenPatent.ai",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
