/**
 * Master Header Component with Professional Mega Menu
 * Clean, modern navigation with CSOAI branding
 */

import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Menu, X, User, LogOut, Settings, BookOpen, BarChart3, ChevronDown, Search, Award, Landmark, Globe2, BookMarked, ShieldCheck, BarChart2, Boxes, LayoutGrid } from 'lucide-react';
import { NotificationCenter } from '@/pages/NotificationCenter';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSiteChromeHidden } from '@/lib/osChrome';


import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { GlobalSearch } from '@/components/GlobalSearch';
import { HOME_NAV } from '@/components/homeNav';
export { HOME_NAV };

// ---------------------------------------------------------------------------
// MASTER NAVIGATION — the lean canonical IA.
//
// Rev 2026-08-26 (front-door alignment). The previous six groups predated the
// product family and the Council OS lobby, so the six product pages sat buried
// four items deep inside "Solutions" and the OS was reachable only from a single
// "Chat" pill in the chrome. Two structural changes:
//
//   * PRODUCTS is now a top-level group — the six signed-evidence products plus
//     the /products packaging page, with the audiences they serve as the tail.
//   * COUNCIL OS is now a top-level group — the lobby panes are real destinations
//     (?lobby=<tab>), not a chat gimmick, and the recovered arena views live here.
//
// ...and "Academy" folded into Company: four of its five items pointed at the
// identical /academy URL, so it was a dropdown that mostly linked to itself.
//
// Still six groups, so the xl mega-menu still fits. The primary nav points at
// CURRENT pages exclusively; everything else stays reachable through the footer
// Library (/library), dated and sector-organized. "Library, don't delete."
//
// EVERY href below is verified against client/src/App.tsx, and every internal
// path is registered in PRIMARY_PATHS (client/src/data/library-ia.ts) — an
// unregistered path renders the "archived" banner under a primary nav link,
// which is exactly the drift this nav exists to prevent.
//
// Items flagged `external` are machine surfaces (live JSON, did:web) — they open
// in a new tab and are deliberately in the nav because the site serves agents
// (A2A) as well as humans. `section` renders a non-focusable subheading so a long
// dropdown stays scannable.
// ---------------------------------------------------------------------------

interface NavItem { name: string; href: string; description: string; external?: boolean; section?: string }
interface NavGroup { name: string; href: string; icon: typeof Globe2; description: string; submenu: NavItem[] }

const PRIMARY_LINKS: { name: string; href: string }[] = [
  { name: "Verify", href: "/gspc-verify" },
  { name: "Get measured", href: "/assess" },
  { name: "Board", href: "/gspc-scoreboard" },
  { name: "Council OS", href: "/os" },
  { name: "Tools", href: "/tools" },
];

const navigation: NavGroup[] = [
  {
    name: 'Measure',
    href: '/gspc-scoreboard',
    icon: BarChart2,
    description: 'The instrument and its living board',
    submenu: [
      { section: 'The board', name: 'The GSPC board', href: '/gspc-scoreboard', description: 'Every published axis. Counts and the stamp date come from GET /api/gspc — never typed into a page' },
      { name: 'The arena', href: '/gspc-arena', description: 'Head-to-head on the same frozen items. Deterministic grading — no model judges another' },
      { name: 'Arena — benchmarks', href: '/gspc-arena?view=benchmarks', description: 'The per-bank view of the arena: which instrument, which rows, which result' },
      { name: 'Arena — live training', href: '/gspc-arena?view=training', description: 'Runs in progress. Practice stays practice and is never quoted' },
      { name: 'Measured models', href: '/models', description: 'Ranked by signed GSPC results, not by parameter count' },
      { name: 'Measured results', href: '/benchmarks', description: 'Every number traces to a published artefact — the losses included' },
      { section: 'Get a card', name: 'Free signed assessment', href: '/assess', description: 'Measure your own system and get the signed record back. No account, no fee' },
      { name: 'Verify a signed card', href: '/gspc-verify', description: 'Check any Ed25519-signed record offline against the published key. Free forever' },
      { name: 'Report an AI incident', href: '/report', description: 'Anyone can flag AI behaviour that looks wrong — the intake is public, not a vendor inbox' },
      { section: 'How it works', name: 'Methodology', href: '/methodology', description: 'Gold labels, n≥30, McNemar separation — and how to recompute every number yourself' },
      { name: 'The GSPC instrument', href: '/instrument', description: 'Four deterministic lenses over frozen provisions. No model sits in the verdict path' },
      { name: 'Published tools', href: '/tools', description: 'MCP servers you can run yourself — not a marketplace' },
      { section: 'Specialist boards', name: 'Financial axis', href: '/financial-axes', description: 'The declared financial slots — measured where measured, UNMEASURED and honest where not' },
      { name: 'EUNOMIA board', href: '/eunomia', description: 'Financial-verification axis, signed, across a two-tier fleet' },
      { name: 'Signed registers', href: '/registers', description: 'The financial-axis register — a stranger can re-derive every row' },
      { name: 'First-Fine Watch', href: '/first-fine-watch', description: 'Signed enforcement record: EU AI Act fines and the deadlines behind them' },
      { name: 'EUNOMIA data (commercial)', href: '/eunomia-data', description: 'x402 data-only lane — enforcement record + deadline calendar, never scores' },
      { name: 'EUNOMIA catalog', href: '/eunomia-catalog', description: 'Every surface, API, HF mirror, A2A card and MCP tool — catalogued and linked' },
      { name: 'EU AI Act × CRA watch', href: '/eunomia-crosswalk', description: 'Statute → axis → requirement → exposure, with live source links' },
      { name: 'EUNOMIA indices', href: '/eunomia-indices', description: 'The aspirational index axes — now measured (frozen gold sets, Wilson CI)' },
    ],
  },
  {
    name: 'Products',
    href: '/products',
    icon: Boxes,
    description: 'Signed evidence — and who it is for',
    submenu: [
      { section: 'The four SKUs', name: 'All products', href: '/products', description: 'Council OS is the workspace. Verify free. Ledger and Data on enquiry. A grade is never sold' },
      { name: 'Council OS', href: '/os', description: 'The workspace a stranger opens — board, verifier, assess, evidence in one window' },
      { name: 'Council Verify', href: '/gspc-verify', description: 'Paste a card. Your browser recomputes the signature. Free forever' },
      { name: 'Council Ledger', href: '/council-licensing', description: 'Signed evidence feed for insurers, procurement and deployers — never a purchased rank' },
      { name: 'Council Data', href: '/licensing-agreement', description: 'Licensed signed corpus. Buy data, never a score' },
      { section: 'Modules', name: 'GPAI Evidence Pack', href: '/gpai-evidence', description: 'Independent third-party evidence a GPAI provider can hand the AI Office. Evidence, never a conformity mark' },
      { name: 'CRA Readiness Kit', href: '/cra-readiness', description: 'The 24h / 72h / 14-day ENISA runbook and signed SBOM workflow we run on ourselves' },
      { name: 'Financial axis', href: '/financial-axes', description: 'The declared financial slots, coverage stated first — never a credit rating' },
      { name: 'Distribution integrity', href: '/distribution-integrity', description: 'Represented is not distributed: the committed-versus-distributed spread, coverage-first and UNMEASURED' },
      { name: 'Verify embed / white-label', href: '/embed', description: 'A self-verifying badge for your own site — WebCrypto checks the signature in the reader’s browser' },
      { name: 'Legacy modernization on-ramp', href: '/cobolbridge', description: 'COBOL lineage under DORA / Basel / SOX carried into signed, continuous evidence' },
      { section: 'Who it is for', name: 'Startups', href: '/for/startup', description: 'A signed measurement your buyer can re-check — not a certificate' },
      { name: 'Enterprise', href: '/for/enterprise', description: 'Measure a portfolio of systems against the duties that actually bind them' },
      { name: 'Finance', href: '/for/finance', description: 'Model risk, DORA, and the EU AI Act — what we actually hold' },
      { name: 'Healthcare', href: '/for/healthcare', description: 'Clinical AI, measured, and the measurement signed' },
      { name: 'Regulators', href: '/for/regulator', description: 'An assurance baseline you can verify and publish' },
      { name: 'SEC filers', href: '/for/sec-filer', description: 'AI governance your 10-K can stand behind' },
      { name: 'Insurers and underwriters', href: '/insurers', description: 'An observed behavioural sample with a stated n and interval — something a risk model can price' },
      { name: 'Government and regulators', href: '/government', description: 'Independent measurement with a published method. We issue no conformity mark' },
      { name: 'Industries', href: '/industries', description: 'Sector by sector: the provisions that apply, and when they bite' },
      { name: 'Sector tooling', href: '/sectors', description: 'White-label tooling per sector — regulator, insurer, bond, legacy, vendor' },
      { name: 'Integrations', href: '/integrations', description: 'Wire the measurement into the tools you already run' },
      { name: 'How the free rail works', href: '/os?lobby=assess&task=pricing-overview', description: 'Verify is free. A grade is never sold. There are no public prices' },
    ],
  },
];
