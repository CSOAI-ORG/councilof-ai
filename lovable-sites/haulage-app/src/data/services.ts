import { Truck, Trash2, Hammer, Server } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface Service {
  id: string;
  title: string;
  shortDescription: string;
  description: string;
  icon: LucideIcon;
  href: string;
  external?: boolean;
  features: string[];
  image?: string;
}

export const services: Service[] = [
  {
    id: "plant-hire",
    title: "Plant Hire",
    shortDescription: "Excavators, dumpers, mixers — UK plant hire with ISO 19650 + CPCS compliance built in.",
    description: "PlantHire.ai is the umbrella platform for UK plant hire operators. Booking, fleet management, BIM/CDE alignment, CHAS readiness — all in one place. Backed by the construction-iso-19650-mcp and crane-hire-cpcs-mcp servers.",
    icon: Truck,
    href: "https://planthire.ai",
    external: true,
    features: [
      "Equipment booking + fleet management",
      "ISO 19650 BIM maturity checker",
      "CPCS card verification + lift plans",
      "CHAS / SSIP elite-prep workflows",
      "LOLER thorough exam tracking",
      "Direct API via 4 paired MCP servers",
    ],
  },
  {
    id: "grab-hire",
    title: "Grab Hire",
    shortDescription: "UK grab-truck logistics with DVSA + waste-carrier compliance baked into every quote.",
    description: "GrabHire.ai is the umbrella platform for UK grab-truck operators. Instant quoting, route optimisation, DVSA roadside readiness, waste-carrier registration checks. Backed by the haulage-uk-compliance-mcp and skip-hire-ai-mcp servers.",
    icon: Hammer,
    href: "https://grabhire.ai",
    external: true,
    features: [
      "Instant grab-hire quoting",
      "DVSA roadside risk scoring",
      "Operator licence + tachograph audit",
      "Drivers' hours calculator",
      "Waste-carrier registration lookup",
      "WhatsApp + email + phone CTAs",
    ],
  },
  {
    id: "muckaway",
    title: "Muckaway",
    shortDescription: "AI spoil classification, weighbridge OCR, NRSWA + landfill-tax compliance. The big SaaS.",
    description: "MuckAway.ai is the full-fledged operator SaaS — driver portal, weighbridge OCR, AI spoil classification, Stripe-powered payments, GDPR-compliant data handling. 60 pages, 116 components, 23+ Supabase edge functions. The most-built site in the group.",
    icon: Trash2,
    href: "https://muckaway.ai",
    external: true,
    features: [
      "AI spoil classification (EWC codes)",
      "Weighbridge OCR + ticket capture",
      "NRSWA S50 / S74 compliance",
      "Stripe checkout + customer portal",
      "Driver app via Capacitor (iOS/Android)",
      "Real-time mapbox tracking",
    ],
  },
  {
    id: "mcps",
    title: "Compliance MCPs",
    shortDescription: "Nine PyPI-published MCP servers shipping signed compliance attestations for UK trades.",
    description: "Each trade vertical comes with its own MCP server — install via pip, get callable tools for licence checks, certification audits, and compliance attestations. All signed via the meok-attestation-api. From £29/mo Starter to £1,499/mo Enterprise.",
    icon: Server,
    href: "/mcps",
    features: [
      "haulage-uk-compliance-mcp — DVSA + tachograph",
      "skip-hire-ai-mcp — EWC + waste-carrier",
      "nrswa-ai-mcp — S50 / S74 highways",
      "construction-iso-19650-mcp — BIM",
      "chas-elite-prep-mcp — H&S",
      "crane-hire-cpcs-mcp — LOLER + CPCS",
      "concrete-pump-cpa-mcp — CPA + ground bearing",
      "muckaway-ai-mcp — spoil + weighbridge",
      "planthire-ai-mcp — bookings + fleet",
    ],
  },
];

export const getServiceById = (id: string): Service | undefined => {
  return services.find((service) => service.id === id);
};
