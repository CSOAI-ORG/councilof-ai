import type { Metadata } from "next";
import CasaCertDashboardClient from "./CasaCertDashboardClient";

export const metadata: Metadata = {
  title: "🐉 CASA Cert Dashboard | The 7-Tap Flywheel | csoai.org",
  description:
    "The 7-Tap Sovereign Flywheel: from free EU AI Act risk scan to $500K CASA certification.",
  alternates: { canonical: "/casa-cert-dashboard" },
  openGraph: {
    title: "🐉 CASA Cert Dashboard | The 7-Tap Flywheel",
    description: "The 7-Tap Sovereign Flywheel: from free EU AI Act risk scan to $500K CASA certification.",
    type: "website",
  },
};

export default function CasaCertDashboardPage() {
  return <CasaCertDashboardClient />;
}
