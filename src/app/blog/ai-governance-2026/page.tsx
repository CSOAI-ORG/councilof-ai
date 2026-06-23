import type { Metadata } from "next";
import AIGovernance2026Client from "./AIGovernance2026Client";

export const metadata: Metadata = {
  title: "AI Governance in 2026",
  description:
    "Why Palantir, Databricks and Snowflake are missing the compliance layer — and what the EU AI Act Article 50 deadline means for enterprise AI.",
  openGraph: {
    title: "AI Governance in 2026 — CSOAI",
    description: "The gap in AI infrastructure compliance and the Layer 0 opportunity.",
    type: "article",
  },
  alternates: { canonical: "/blog/ai-governance-2026" },
};

export default function AIGovernance2026Page() {
  return <AIGovernance2026Client />;
}
