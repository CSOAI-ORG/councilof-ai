import type { Metadata } from "next";
import McpPacksClient from "./McpPacksClient";

export const metadata: Metadata = {
  title: "MCP Packs",
  description:
    "Pre-built MCP server packs for EU AI Act compliance, brand & distribution, agentic finance and more. Drop governance into any AI agent stack.",
  openGraph: {
    title: "CSOAI MCP Packs",
    description: "Governance MCP server packs for AI agent ecosystems.",
    images: ["/api/og?title=CSOAI%20MCP%20Packs&desc=Governance%20MCP%20server%20packs%20for%20AI%20agent%20ecosystems."],
  },
  alternates: { canonical: "/mcp-packs" },
};

const itemListSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "CSOAI Premium MCP Packs",
  itemListElement: [
    {
      "@type": "Product",
      name: "EU AI Act Emergency Pack",
      description: "7 MCP servers for EU AI Act Article 50 transparency and risk classification.",
      offers: { "@type": "Offer", price: "999", priceCurrency: "GBP" },
    },
    {
      "@type": "Product",
      name: "Brand & Distribution Pack",
      description: "AEO/GEO optimization, brand authority scoring, and conversion funnels.",
      offers: { "@type": "Offer", price: "499", priceCurrency: "GBP" },
    },
    {
      "@type": "Product",
      name: "Agentic Finance Pack",
      description: "Pre-check compliance before agents execute payments via Stripe ACP, x402, or AP2.",
      offers: { "@type": "Offer", price: "1499", priceCurrency: "GBP" },
    },
  ],
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://csoai.org/" },
    { "@type": "ListItem", position: 2, name: "MCP Packs", item: "https://csoai.org/mcp-packs" },
  ],
};

export default function McpPacksPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />
      <McpPacksClient />
    </>
  );
}
