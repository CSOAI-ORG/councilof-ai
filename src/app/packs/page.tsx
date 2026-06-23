import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "CSOAI Compliance Packs",
  description: "CSOAI compliance MCP packs have moved. Browse the latest bundled offerings.",
  alternates: { canonical: "/mcp-packs" },
};

export default function PacksRedirectPage() {
  redirect("/mcp-packs");
}
