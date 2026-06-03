import { Truck, Trash2, HardHat, Building2, Shield, Anchor, Layers, Database, Wrench } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface MCP {
  id: string;
  name: string;
  tagline: string;
  pypi: string;
  install: string;
  tools: number;
  /** Stripe Starter link (£29/mo). `null` means MCP is bundled into the SaaS — buy via the parent product. */
  starterStripe: string | null;
  starterPrice: string;
  icon: LucideIcon;
  pairs: string[];
}

export const mcps: MCP[] = [
  {
    id: "haulage-uk-compliance",
    name: "haulage-uk-compliance-mcp",
    tagline: "DVSA, tachograph, drivers' hours, vehicle safety, road-user levy.",
    pypi: "https://pypi.org/project/haulage-uk-compliance-mcp/",
    install: "pip install haulage-uk-compliance-mcp",
    tools: 5,
    starterStripe: "https://buy.stripe.com/4gMbJ3fsM28a381fL28k844",
    starterPrice: "£29/mo",
    icon: Truck,
    pairs: ["haulage.app", "grabhire.ai"],
  },
  {
    id: "skip-hire",
    name: "skip-hire-ai-mcp",
    tagline: "Waste-carrier reg, EWC codes, consignment notes, duty-of-care.",
    pypi: "https://pypi.org/project/skip-hire-ai-mcp/",
    install: "pip install skip-hire-ai-mcp",
    tools: 5,
    starterStripe: "https://buy.stripe.com/4gM8wR6Wg8wy4c5gP68k845",
    starterPrice: "£29/mo",
    icon: Trash2,
    pairs: ["muckaway.ai"],
  },
  {
    id: "nrswa",
    name: "nrswa-ai-mcp",
    tagline: "S50 licence, works classification, S74 overrun, noticing timeline.",
    pypi: "https://pypi.org/project/nrswa-ai-mcp/",
    install: "pip install nrswa-ai-mcp",
    tools: 5,
    starterStripe: "https://buy.stripe.com/7sYdRbcgA1466kd0Q88k847",
    starterPrice: "£29/mo",
    icon: HardHat,
    pairs: ["haulage.app"],
  },
  {
    id: "iso-19650",
    name: "construction-iso-19650-mcp",
    tagline: "BIM maturity, EIR, BEP, CDE structure, clause lookup.",
    pypi: "https://pypi.org/project/construction-iso-19650-mcp/",
    install: "pip install construction-iso-19650-mcp",
    tools: 5,
    starterStripe: "https://buy.stripe.com/eVq9AV0xSeUW6kdeGY8k846",
    starterPrice: "£29/mo",
    icon: Building2,
    pairs: ["planthire.ai"],
  },
  {
    id: "chas",
    name: "chas-elite-prep-mcp",
    tagline: "CHAS readiness, H&S audit, SSIP mutual recognition, PQ templates.",
    pypi: "https://pypi.org/project/chas-elite-prep-mcp/",
    install: "pip install chas-elite-prep-mcp",
    tools: 5,
    starterStripe: "https://buy.stripe.com/9B6aEZ94ocMO6kdcyQ8k900",
    starterPrice: "£29/mo",
    icon: Shield,
    pairs: ["planthire.ai"],
  },
  {
    id: "crane-cpcs",
    name: "crane-hire-cpcs-mcp",
    tagline: "CPCS card verify, lift plans, appointed person, LOLER exam.",
    pypi: "https://pypi.org/project/crane-hire-cpcs-mcp/",
    install: "pip install crane-hire-cpcs-mcp",
    tools: 5,
    starterStripe: "https://buy.stripe.com/14AcN70xS6oq8sl56o8k901",
    starterPrice: "£29/mo",
    icon: Anchor,
    pairs: ["planthire.ai"],
  },
  {
    id: "concrete-pump-cpa",
    name: "concrete-pump-cpa-mcp",
    tagline: "CPA compliance, operator certs, ground bearing, exclusion zones.",
    pypi: "https://pypi.org/project/concrete-pump-cpa-mcp/",
    install: "pip install concrete-pump-cpa-mcp",
    tools: 5,
    starterStripe: "https://buy.stripe.com/fZu3cxa8seUW6kdfL28k902",
    starterPrice: "£29/mo",
    icon: Layers,
    pairs: ["planthire.ai"],
  },
  {
    id: "muckaway",
    name: "muckaway-ai-mcp",
    tagline: "Waste volume, skip pricing, EWC, transport, transfer notes.",
    pypi: "https://pypi.org/project/muckaway-ai-mcp/",
    install: "pip install muckaway-ai-mcp",
    tools: 6,
    starterStripe: null,
    starterPrice: "Bundled in SaaS",
    icon: Database,
    pairs: ["muckaway.ai"],
  },
  {
    id: "planthire",
    name: "planthire-ai-mcp",
    tagline: "Equipment search, rental quotes, availability, booking, safety.",
    pypi: "https://pypi.org/project/planthire-ai-mcp/",
    install: "pip install planthire-ai-mcp",
    tools: 6,
    starterStripe: null,
    starterPrice: "Bundled in SaaS",
    icon: Wrench,
    pairs: ["planthire.ai"],
  },
];

export const proStripeUrl = "https://buy.stripe.com/14A4gB3K4eUWgYR56o8k836";
export const proPriceAmount = "£79";
export const proPricePeriod = "mo";
export const enterprisePriceAmount = "£1,499";
export const enterprisePricePeriod = "mo";

/** @deprecated use proPriceAmount + proPricePeriod */
export const proPrice = `${proPriceAmount}/${proPricePeriod}`;
/** @deprecated use enterprisePriceAmount + enterprisePricePeriod */
export const enterprisePrice = `${enterprisePriceAmount}/${enterprisePricePeriod}`;
