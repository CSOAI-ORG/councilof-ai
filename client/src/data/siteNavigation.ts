/**
 * Site navigation — the full estate IA (formerly the header mega menu).
 *
 * Lives in the footer now. The header carries MASTER_NAVIGATION (Council OS / AG-UI).
 * Every href was verified against App.tsx before linking.
 */
import type { LucideIcon } from "lucide-react";
import { POSITIONING } from "@/lib/positioning";
import type { LobbyTabId } from "@/components/lobby/tabs";
import type { LobbyTaskId } from "@/lib/lobbyLink";
import {
  BarChart2,
  BookMarked,
  Building2,
  GraduationCap,
  Landmark,
  ShieldCheck,
} from "lucide-react";

export interface SiteNavItem {
  name: string;
  href: string;
  description: string;
  external?: boolean;
  /** Opens Council OS in place — href stays crawlable for SEO. */
  lobby?: { pane: LobbyTabId; task?: LobbyTaskId };
}

export interface SiteNavGroup {
  name: string;
  href: string;
  icon: LucideIcon;
  description: string;
  submenu: SiteNavItem[];
}

/** Lean canonical IA — Measure, Regulation, Solutions, Evidence, Academy, Company. */
export const SITE_NAVIGATION: SiteNavGroup[] = [
  {
    name: "Measure",
    href: "/gspc-scoreboard",
    icon: BarChart2,
    description: "The instrument and its board",
    submenu: [
      { name: "East-West", href: "/east-west", description: "One signed measurement, four regimes mapped. Mapping is not a determination." },
      { name: "The GSPC board", href: "/gspc-scoreboard", description: "The living board — measured axes, empty cells empty. Counts from GET /api/gspc" },
      { name: "Eunomia Router", href: "/instruments", description: POSITIONING.router.blurb },
      { name: "Measurement harness", href: "/arena-harness", description: POSITIONING.harness.blurb },
      { name: "Engine Axis", href: "/engine-axis", description: "Bond venturi, COBOL→A2A, one engine signs all crossings" },
      { name: "Labour & AI-economy indices", href: "/indices", description: "AI-economy · human-labour · humanoid-labour — UNMEASURED first, contextual only" },
      { name: "Bond Venturi", href: "/venturi", description: "COBOL fed state → A2A stream — metabolic boundary (DESIGN register)" },
      { name: "Measured results", href: "/benchmarks", description: "Every number traces to a published artefact, losses included" },
      { name: "The arena", href: "/gspc-arena", description: "Head-to-head, deterministic grading, no model judging another" },
      { name: "Verify a signed card", href: "/gspc-verify", description: "Check any Ed25519-signed record offline against the published key" },
      { name: "Free signed assessment", href: "/assess", description: "Measure your own system and get a signed record back" },
      { name: "Methodology", href: "/methodology", description: "Gold labels, n≥30, and how to recompute every number yourself" },
      { name: "The GSPC instrument", href: "/instrument", description: "Four deterministic lenses over frozen provisions — no model in the verdict" },
      { name: "Products catalog", href: "/products", description: "Living catalog — registers honest · scores never sold" },
    ],
  },
  {
    name: "Regulation",
    href: "/eu-ai-act",
    icon: Landmark,
    description: "The statute we measure against",
    submenu: [
      { name: "EU AI Act — the guide", href: "/eu-ai-act", description: "The whole Act, phased, with the Digital Omnibus amendments" },
      { name: "Article 50 — transparency", href: "/article-50", description: "Live since 2 Aug 2026; marking grace ends 2 Aug 2026" },
      { name: "Dates and deadlines", href: "/ai-act-timeline", description: "What applies when — Annex III deferred to 2 Aug 2027" },
      { name: "GPAI model duties", href: "/gpai", description: "Documentation, training-data summary, copyright" },
      { name: "Readiness checklist", href: "/checklist", description: "Work through the duties that are actually in force" },
      { name: "Global regulation tracker", href: "/regulation-tracker", description: "Every AI regime worldwide, with its current dates" },
      { name: "Regulator atlas", href: "/regulators", description: "Who supervises what, jurisdiction by jurisdiction" },
      { name: "Framework crosswalk", href: "/crosswalk", description: "Map existing ISO 42001 / NIST controls onto Act duties" },
      { name: "Regulation feed — live JSON", href: "/api/regulation", description: "The machine-readable corpus feed", external: true },
    ],
  },
  {
    name: "Solutions",
    href: "/enterprise",
    icon: Building2,
    description: "Who the measurement is for",
    submenu: [
      { name: "Enterprise", href: "/enterprise", description: "Measure a portfolio of systems against the duties that bind them" },
      { name: "Insurers and underwriters", href: "/insurers", description: "Signed evidence a risk model can actually price" },
      { name: "Government and regulators", href: "/government", description: "Independent measurement, published method, no conformity mark" },
      { name: "Industries", href: "/industries", description: "Sector-by-sector: what applies to you and when" },
      { name: "Pay as you go", href: "/payg", description: "Per-measurement access — no tiers, no lock-in" },
      { name: "Powered by Council OS", href: "/powered-by", description: "Option A white-label attestation — not tokenization" },
      { name: "Products catalog", href: "/products", description: "RAS · board · indices · Option A — HO.2" },
      { name: "Distribution Hive", href: "/intel", description: "Regulators, enterprises, SMBs — one cited org index" },
      { name: "Council OS Refinery", href: "/os", description: "Master ONE workspace — board, arena, ecosystem, AG-UI", lobby: { pane: "home" } },
      { name: "My systems workspace", href: "/workspace", description: "Portfolio batch assess and re-attest schedule" },
      { name: "Org index API", href: "/api/ecosystem", description: "Machine-readable ecosystem for agents", external: true },
    ],
  },
  {
    name: "Evidence",
    href: "/honesty",
    icon: ShieldCheck,
    description: "Our receipts, including the losses",
    submenu: [
      { name: "The honesty gate", href: "/honesty", description: "What we cannot yet measure, published rather than hidden" },
      { name: "Refutation Ledger", href: "/refutation-ledger", description: "Experiments that killed our own theses — with artefacts" },
      { name: "Firewall Charter", href: "/firewall-charter", description: "We measure; we never fix what we measure" },
      { name: "Corrections — live JSON", href: "/api/corrections", description: "Corrections published, never silently edited", external: true },
      { name: "GSPC board — live JSON", href: "/api/gspc", description: "The board as an agent reads it", external: true },
      { name: "did:web trust root", href: "/.well-known/did.json", description: "The published signer — verify a card without us", external: true },
      { name: "API documentation", href: "/api-docs", description: "Everything above, documented for agents" },
      { name: "Agent runbook", href: "/agent-runbook", description: "curl-first guide — gspc, instruments, AG-UI, bond crossing" },
      { name: "RECEIPT-SPEC-0.1", href: "/receipt-spec", description: "The measurement-card format — Ed25519 envelope, 3-path verify" },
      { name: "Ownership plan", href: "/ownership", description: "100 moves — standards, domain, data, trust, distribution" },
      { name: "Arena harness", href: "/arena-harness", description: "Downstream of Stripe/OpenRouter — arena, bonds, proof DB (DESIGN thesis)" },
      { name: "System status", href: "/status", description: "What is up, what is degraded" },
    ],
  },
  {
    name: "Academy",
    href: "/academy",
    icon: GraduationCap,
    description: "Training — not conformity",
    submenu: [
      { name: "Live training — Art. 4 sim", href: "/live-training", description: "Verified training-outcome records. Never a certificate." },
      { name: "Estate audit", href: "/estate", description: "Crown jewels, gaps, and every front end still rendering" },
      { name: "Council Academy", href: "/academy", description: "Learn the statute and the method" },
      { name: "All courses", href: "/courses", description: "The full catalogue, free" },
      { name: "Training overview", href: "/training", description: "How the free training rail works, and what a record does and does not say" },
      { name: "Verify a training record", href: "/verify-certificate", description: "Check a completion record against the published signer" },
      { name: "What a course attests", href: "/accreditation", description: "Course completion attests training, not conformity" },
    ],
  },
  {
    name: "Company",
    href: "/about",
    icon: BookMarked,
    description: "Council of AI — CSOAI Ltd",
    submenu: [
      { name: "About", href: "/about", description: "An independent measurement instrument, and what that excludes" },
      { name: "The Library — full archive", href: "/library", description: "Everything we have published, dated and organized by sector" },
      { name: "Blog", href: "/blog", description: "Findings, corrections and notes" },
      { name: "Trust Center", href: "/trust-center", description: "Security posture — and the certifications we have NOT been awarded" },
      { name: "Contact", href: "/contact", description: "CSOAI Ltd, UK company 16939677" },
      { name: "Legal and disclaimers", href: "/disclaimers", description: "What this measurement is not" },
    ],
  },
];
