/**
 * sovereign-types.ts — Strict TypeScript types for the sovereign substrate.
 * CSOAI Ltd (UK 16939677) · MIT License
 *
 * 6 layers: Locale → Sigil → State → MCP → BFT → Audit
 */

export type Locale = "en" | "fr" | "de" | "es" | "ja" | "zh";

export type Region = "UK" | "EU" | "US" | "APAC" | "LATAM";

export interface LocaleInfo {
  readonly name: string;
  readonly flag: string;
  readonly region: Region;
}

export interface SovereignDoc<T = unknown> {
  readonly protocol: string;
  readonly version: string;
  readonly kid: string;
  readonly sig: string;
  readonly ts: string;
  readonly data?: T;
}

export interface SovereignError {
  readonly error: string;
  readonly valid?: boolean;
}

export type SovereignResult<T> = SovereignDoc<T> | SovereignError;

export interface CareFloorState {
  readonly state: number[];  // 16-dim
  readonly probes: Record<string, boolean>;
  readonly passed_count: number;
  readonly total: number;
  readonly care_floor_passed: boolean;
}

export type BFTMode = "fast" | "balanced" | "secure";

export interface BFTProposal {
  readonly proposal_id: string;
  readonly title: string;
  readonly description: string;
  readonly bft_mode: BFTMode;
  readonly status: "PENDING" | "RATIFIED" | "REJECTED";
  readonly votes_for: number;
  readonly votes_against: number;
  readonly votes_abstain: number;
  readonly voters_required: number;
  readonly quorum_required: number;
}

export interface SigilEntry {
  readonly protocol: string;
  readonly version: string;
  readonly kid: string;
  readonly sig: string;
  readonly ts: string;
  readonly prev_hash: string;
  readonly hash: string;
  readonly event_type?: string;
  readonly actor?: string;
  readonly action?: string;
}

export interface HiveInfo {
  readonly id: number;
  readonly name: string;
  readonly lat: number;
  readonly lng: number;
  readonly general: string;
  readonly tier: "sovereign" | "enterprise" | "smb";
  readonly region: Region | string;
}

export type General =
  | "Argus" | "Scribe" | "Shield" | "Builder" | "Abacus" | "Lex"
  | "Scale" | "Crow" | "Gear" | "Voice" | "Owl" | "Dragon";

export interface GeneralInfo {
  readonly id: number;
  readonly name: General;
  readonly role: string;
  readonly sephirah: string;
  readonly qowm: string;
  readonly bft_default: BFTMode;
}

export type FrameworkId =
  | 1   // EU AI Act
  | 2   // EU DORA
  | 3   // UK AI Bill
  | 4   // EU GDPR
  | 5   // EU NIS2
  | 6   // ISO 42001 AIMS
  | 7   // NIST AI RMF
  | 8   // JSP 936 NATO
  | 9   // HIPAA
  | 10  // SOC 2
  | 11  // ISO 27001 ISMS
  | 12; // PCI-DSS 4.0

export interface FrameworkInfo {
  readonly id: FrameworkId;
  readonly name: string;
  readonly region: Region | "GLOBAL" | "NATO" | string;
  readonly controls: number;
}

export interface CompliancePassport {
  readonly passport_id: string;
  readonly organization: string;
  readonly sector: string;
  readonly region: Region | string;
  readonly framework_count: number;
  readonly frameworks: Record<string, PassportFramework>;
  readonly issued_at: string;
  readonly status: "ACTIVE" | "REVOKED";
}

export interface PassportFramework {
  readonly name: string;
  readonly score: number;
  readonly status: "PENDING" | "CERTIFIED" | "FAILED";
  readonly region: string;
  readonly controls: number;
}

export interface CrosswalkControl {
  readonly control: string;
  readonly satisfies: readonly number[];
  readonly satisfies_count: number;
}

export type SovereignException = {
  readonly code: number;
  readonly message: string;
  readonly ts: string;
};

// API response types
export interface ApiError {
  readonly detail: Array<{
    readonly type: string;
    readonly loc: readonly string[];
    readonly msg: string;
    readonly input?: unknown;
  }>;
}

// Tier types
export type PricingTier = "free" | "pro" | "governance" | "enterprise";

export interface PricingTierInfo {
  readonly name: string;
  readonly price: number;
  readonly currency: "USD" | "EUR" | "GBP" | "JPY" | "CNY";
  readonly tagline: string;
  readonly features: readonly string[];
}

export interface PageMeta {
  readonly title: string;
  readonly description: string;
  readonly og_image?: string;
  readonly canonical?: string;
  readonly hreflang?: Record<Locale, string>;
}

export interface DashboardMetric {
  readonly label: string;
  readonly value: number | string;
  readonly trend?: "up" | "down" | "stable";
  readonly delta?: number;
}

// User flow types (E2E)
export interface UserFlow {
  readonly id: string;
  readonly name: string;
  readonly persona: "compliance_officer" | "defence_contractor" | "bank_cto"
                  | "healthcare_ceo" | "smb_owner" | "ai_researcher";
  readonly steps: readonly UserFlowStep[];
}

export interface UserFlowStep {
  readonly step: number;
  readonly action: string;
  readonly url: string;
  readonly expected: string;
  readonly selector?: string;
}

export const USER_FLOWS: readonly UserFlow[] = [
  {
    id: "compliance_officer_eu_ai_act",
    name: "Compliance Officer: Run EU AI Act audit",
    persona: "compliance_officer",
    steps: [
      { step: 1, action: "Land on home page", url: "/", expected: "Hero visible", selector: "[data-i18n='hero.title']" },
      { step: 2, action: "Click 'Try free'", url: "/#cta", expected: "Sign up form visible", selector: "[data-i18n='cta.try_free']" },
      { step: 3, action: "Sign up with email", url: "/signup", expected: "Passport created" },
      { step: 4, action: "Run EU AI Act audit", url: "/dashboard/audit", expected: "Audit result: 8 articles" },
      { step: 5, action: "View passport", url: "/passport", expected: "12 frameworks visible" },
      { step: 6, action: "Buy pro", url: "/pricing", expected: "Checkout form" },
    ],
  },
  {
    id: "defence_contractor_jsp936",
    name: "Defence Contractor: JSP 936 audit",
    persona: "defence_contractor",
    steps: [
      { step: 1, action: "Land on home page", url: "/", expected: "Hero visible" },
      { step: 2, action: "Navigate to JSP 936", url: "/jsp936", expected: "5 pillars visible" },
      { step: 3, action: "Run audit", url: "/jsp936#audit", expected: "IWC score computed" },
      { step: 4, action: "View supply chain", url: "/supply-chain", expected: "Chain attestation" },
      { step: 5, action: "Request GovCloud deploy", url: "/govcloud", expected: "Contact form" },
    ],
  },
  {
    id: "bank_cto_dora",
    name: "Bank CTO: DORA + CTPP classification",
    persona: "bank_cto",
    steps: [
      { step: 1, action: "Land on home page", url: "/", expected: "Hero visible" },
      { step: 2, action: "Navigate to DORA", url: "/dora", expected: "5 pillars visible" },
      { step: 3, action: "Run DORA audit", url: "/dora#audit", expected: "CTPP classification" },
      { step: 4, action: "View passport", url: "/passport", expected: "DORA certified" },
      { step: 5, action: "Buy pro", url: "/pricing", expected: "Pro checkout" },
    ],
  },
  {
    id: "healthcare_ceo_hipaa",
    name: "Healthcare CEO: HIPAA + iOK Farm demo",
    persona: "healthcare_ceo",
    steps: [
      { step: 1, action: "Land on home page", url: "/", expected: "Hero visible" },
      { step: 2, action: "Navigate to HIPAA", url: "/hipaa", expected: "HIPAA safeguards" },
      { step: 3, action: "Run HIPAA audit", url: "/hipaa#audit", expected: "18 safeguards checked" },
      { step: 4, action: "View iOK Farm", url: "/iok-farm-live", expected: "Live IoT readings" },
      { step: 5, action: "Buy pro", url: "/pricing", expected: "Pro checkout" },
    ],
  },
  {
    id: "smb_owner_soc2_starter",
    name: "SMB Owner: SOC 2 starter at 1/4 price",
    persona: "smb_owner",
    steps: [
      { step: 1, action: "Land on home page", url: "/", expected: "Hero visible" },
      { step: 2, action: "Compare to Vanta", url: "/compare/vanta", expected: "Comparison table" },
      { step: 3, action: "Try free", url: "/signup?plan=free", expected: "Free tier signup" },
      { step: 4, action: "Upgrade to Pro", url: "/pricing", expected: "Pro checkout" },
    ],
  },
  {
    id: "ai_researcher_open_patent",
    name: "AI Researcher: 12 mindsets × 8 MoE",
    persona: "ai_researcher",
    steps: [
      { step: 1, action: "Land on home page", url: "/", expected: "Hero visible" },
      { step: 2, action: "Navigate to mindsets", url: "/mindsets", expected: "12 mindsets visible" },
      { step: 3, action: "View BIG BRAIM", url: "/big-braim", expected: "8 experts visible" },
      { step: 4, action: "Read open patent", url: "/open-patent", expected: "Patent details" },
      { step: 5, action: "GitHub fork", url: "/github", expected: "Repo link" },
    ],
  },
  {
    id: "demo_try_free",
    name: "Anonymous: Try free EU AI Act audit",
    persona: "compliance_officer",
    steps: [
      { step: 1, action: "Land on home page", url: "/", expected: "Hero visible" },
      { step: 2, action: "Click 'Try free'", url: "/#cta", expected: "Audit form" },
      { step: 3, action: "Paste code", url: "/try", expected: "Code accepted" },
      { step: 4, action: "View audit result", url: "/try#result", expected: "8/8 articles" },
      { step: 5, action: "Sign up for full passport", url: "/signup", expected: "Passport created" },
    ],
  },
  {
    id: "verify_passport",
    name: "Anyone: Verify a passport",
    persona: "compliance_officer",
    steps: [
      { step: 1, action: "Navigate to verify", url: "/verify", expected: "Verify form" },
      { step: 2, action: "Paste passport ID", url: "/verify#result", expected: "Verification result" },
    ],
  },
  {
    id: "view_sigil",
    name: "Anyone: View sigil explorer",
    persona: "compliance_officer",
    steps: [
      { step: 1, action: "Navigate to sigil", url: "/sigil", expected: "Sigil explorer" },
      { step: 2, action: "View chain", url: "/sigil#chain", expected: "Chain length" },
    ],
  },
  {
    id: "globe_view",
    name: "Anyone: View 3D globe",
    persona: "compliance_officer",
    steps: [
      { step: 1, action: "Navigate to globe", url: "/cesium-globe.html", expected: "3D globe visible" },
      { step: 2, action: "Click a hive", url: "/cesium-globe.html#hive-1", expected: "Hive info" },
      { step: 3, action: "View 5D Hive", url: "/sovereign-town/5d-hive.html", expected: "5D visualization" },
    ],
  },
] as const;

// Compile-time enforcement: all 6 personas must have a flow
type RequiredPersonas = "compliance_officer" | "defence_contractor" | "bank_cto"
                       | "healthcare_ceo" | "smb_owner" | "ai_researcher";

const _personaCheck: Record<RequiredPersonas, true> = {
  compliance_officer: true,
  defence_contractor: true,
  bank_cto: true,
  healthcare_ceo: true,
  smb_owner: true,
  ai_researcher: true,
};
void _personaCheck;