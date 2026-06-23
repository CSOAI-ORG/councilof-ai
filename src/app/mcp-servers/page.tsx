import type { Metadata } from "next";
import McpServersClient from "./McpServersClient";
import { sectorGroups, stats, tiers } from "./servers";

export const metadata: Metadata = {
  title: "MCP Server Catalogue — 271 Published Servers",
  description:
    "Browse 271 published MCP servers in the CSOAI / MEOK marketplace. Filter by industry sector, tier, or name. Each server has a verify URL, keystone cert, and live deployment.",
  openGraph: {
    title: "MCP Server Catalogue — 271 Published Servers · CSOAI",
    description:
      "Browse 271 published MCP servers in the CSOAI / MEOK marketplace. Filter by industry sector, tier, or name.",
    images: ["/api/og?title=MCP%20Server%20Catalogue&desc=271%20Published%20Servers"],
  },
  alternates: { canonical: "/mcp-servers" },
};

const itemListElements = sectorGroups.map((group, index) => ({
  "@type": "ListItem" as const,
  position: index + 1,
  name: group.name,
  item: `https://csoai.org/mcp-servers#sec-${group.id}`,
}));

const collectionSchema = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "MCP Server Catalogue — 271 Published Servers · CSOAI",
  description:
    "Browse 271 published MCP servers in the CSOAI / MEOK marketplace. Filter by industry sector, tier, or name.",
  url: "https://csoai.org/mcp-servers",
  breadcrumb: {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://csoai.org" },
      { "@type": "ListItem", position: 2, name: "MCP Servers", item: "https://csoai.org/mcp-servers" },
    ],
  },
  hasPart: {
    "@type": "ItemList",
    itemListElement: itemListElements,
  },
};

export default function McpServersPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }} />
      <McpServersClient stats={stats} tiers={tiers} sectorGroups={sectorGroups} />
    </>
  );
}
