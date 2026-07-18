import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import CouncilNav from "@/components/CouncilNav";
import FooterWrapper from "@/components/FooterWrapper";
import CookieBanner from "@/components/CookieBanner";
import { Analytics } from "@vercel/analytics/react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://csoai.org"),
  title: {
    default: "CSOAI — The Council for the Safety of AI",
    template: "%s — CSOAI",
  },
  description:
    "The independent authority that certifies AI is safe — and lets anyone verify it. Watchdog Certification, MCP governance fabric, and the CSOAI Council substrate.",
  keywords: [
    "CSOAI",
    "AI safety",
    "AI governance",
    "EU AI Act",
    "Watchdog Certification",
    "MCP",
    "BFT Council",
    "A2A",
    "x402",
    "ISO 42001",
    "NIST AI RMF",
  ],
  openGraph: {
    title: "CSOAI — The Council for the Safety of AI",
    description:
      "Watchdog Certification, MCP governance fabric, and the CSOAI Council substrate.",
    url: "https://csoai.org",
    siteName: "CSOAI",
    type: "website",
    images: [
      {
        url: "/assets/og-image.png",
        width: 1200,
        height: 630,
        alt: "CSOAI — The Council for the Safety of AI",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CSOAI — The Council for the Safety of AI",
    description: "Watchdog Certification + MCP governance fabric.",
    images: ["/assets/og-image.png"],
  },
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/assets/favicon.svg",
    apple: "/assets/apple-touch-icon.svg",
  },
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://csoai.org/#website",
  url: "https://csoai.org",
  name: "CSOAI",
  publisher: { "@id": "https://csoai.org/#org" },
  potentialAction: {
    "@type": "SearchAction",
    target: "https://csoai.org/?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} flex min-h-screen flex-col bg-slate-950 text-white antialiased`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-emerald-500 focus:px-4 focus:py-2 focus:text-slate-950"
        >
          Skip to content
        </a>
        <CouncilNav />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <FooterWrapper />
        <CookieBanner />
        <Analytics />
      </body>
    </html>
  );
}
