import type { Metadata } from "next";
import ApiPlaygroundClient from "./ApiPlaygroundClient";

export const metadata: Metadata = {
  title: "API Playground — CSOAI",
  description:
    "Try the csoai-mcp-monetization API live in your browser. 26 endpoints, no auth required, real responses.",
  alternates: { canonical: "/api-playground" },
  openGraph: {
    title: "API Playground — CSOAI",
    description: "Try the csoai-mcp-monetization API live in your browser.",
    type: "website",
  },
};

export default function ApiPlaygroundPage() {
  return <ApiPlaygroundClient />;
}
