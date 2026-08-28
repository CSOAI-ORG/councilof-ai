// locale.ts — detect the visitor's region + language and return the governance context
// that ACTUALLY applies there. All regulation facts are grounded in
// docs/FRAMEWORK_GROUND_TRUTH.md — accurate, never invented. Powers the "loads local"
// experience: right regs, right language, right globe location, one platform.

export type RegionProfile = {
  code: string;
  label: string;
  frameworks: string[];   // what genuinely governs AI here (verified register)
  note: string;           // one honest English line on the regime
  globe: [number, number]; // [lng, lat] → globe fly-to for this region
};

// Region → the real AI-governance regime (ground-truth register).
export const REGIONS: Record<string, RegionProfile> = {
  EU: { code: "EU", label: "European Union", frameworks: ["EU AI Act", "GDPR", "DORA", "NIS2", "CRA"], note: "The EU AI Act is the binding regime — Article 50 transparency duties + penalties apply from 2 Aug 2026; high-risk obligations from 2 Dec 2027 (Annex III) / 2 Aug 2028 (Annex I) under the Digital Omnibus.", globe: [9.0, 50.5] },
  UK: { code: "UK", label: "United Kingdom", frameworks: ["UK AI principles (pro-innovation)", "UK GDPR", "NIS Regulations"], note: "The UK runs a principles-based, regulator-led approach (no single AI Act yet); the AI Safety Institute leads frontier evaluation.", globe: [-1.5, 52.5] },
  US: { code: "US", label: "United States", frameworks: ["NIST AI RMF", "State AI laws (CO, TX, CA)", "Sector rules (HIPAA, FTC Act)"], note: "No single federal AI act — NIST AI RMF is the voluntary baseline; Colorado's AI Act (high-risk) and state laws are the binding edge.", globe: [-98.0, 39.5] },
  JP: { code: "JP", label: "Japan", frameworks: ["METI AI Guidelines for Business", "APPI (privacy)", "ISO/IEC 42001"], note: "Japan uses soft-law AI Guidelines for Business (METI/MIC) plus the 2025 AI Promotion Act framework — guidance-led, innovation-first.", globe: [138.0, 37.0] },
  KR: { code: "KR", label: "South Korea", frameworks: ["AI Basic Act", "PIPA (privacy)", "ISO/IEC 42001"], note: "Korea's AI Basic Act (Framework Act on AI) is enacted and phases in from 2026 — Asia's first horizontal AI law.", globe: [127.8, 36.5] },
  CN: { code: "CN", label: "China", frameworks: ["TC260 standards", "GenAI Measures", "Algorithm/Deep-synthesis rules"], note: "China regulates via binding measures — the Generative AI Measures and deep-synthesis/algorithm provisions, with TC260 technical standards.", globe: [104.0, 35.0] },
  SG: { code: "SG", label: "Singapore", frameworks: ["Model AI Governance Framework", "MAS FEAT (finance)", "ISO/IEC 42001"], note: "Singapore leads with voluntary, practical frameworks — the Model AI Governance Framework and AI Verify testing toolkit.", globe: [103.8, 1.35] },
  CA: { code: "CA", label: "Canada", frameworks: ["Voluntary AI code of conduct", "PIPEDA (privacy)", "NIST AI RMF (de-facto)"], note: "Canada's AIDA (Bill C-27) lapsed in Jan 2025 — a voluntary code applies while new legislation is reconsidered.", globe: [-96.0, 56.0] },
  IN: { code: "IN", label: "India", frameworks: ["MeitY AI advisories", "DPDP Act (privacy)", "ISO/IEC 42001"], note: "India regulates through MeitY advisories and the DPDP Act — a light-touch, sectoral approach while a broader framework develops.", globe: [79.0, 22.0] },
  GLOBAL: { code: "GLOBAL", label: "Global", frameworks: ["EU AI Act", "NIST AI RMF", "ISO/IEC 42001"], note: "CSOAI crosswalks global frameworks to one control set — comply once, evidence everywhere.", globe: [10.0, 25.0] },
};

// Short greeting in the region's primary language (accurate, human-checked phrasing).
export const GREETINGS: Record<string, string> = {
  en: "Governing AI, wherever you operate.",
  ja: "AIガバナンスを、この地域から。",
  de: "KI-Governance nach dem EU AI Act.",
  fr: "La gouvernance de l'IA, adaptée à votre région.",
  es: "Gobernanza de IA para tu región.",
  ko: "AI 거버넌스를 지금 시작하세요.",
  zh: "AI 治理，从你所在的地区开始。",
  it: "Governance dell'IA per la tua regione.",
  pt: "Governança de IA para a sua região.",
  nl: "AI-governance voor jouw regio.",
  ar: "حوكمة الذكاء الاصطناعي، أينما تعمل.",
  hi: "आपके क्षेत्र के लिए AI गवर्नेंस।",
  ru: "Управление ИИ для вашего региона.",
  pl: "Zarządzanie AI dla Twojego regionu.",
  tr: "Bölgeniz için yapay zekâ yönetişimi.",
  sv: "AI-styrning för din region.",
  id: "Tata kelola AI untuk wilayah Anda.",
  th: "ธรรมาภิบาล AI สำหรับภูมิภาคของคุณ",
  vi: "Quản trị AI cho khu vực của bạn.",
  he: "ממשל בינה מלאכותית לאזור שלך.",
};

function tzRegion(tz: string): string {
  if (!tz) return "GLOBAL";
  if (tz === "Europe/London") return "UK";
  if (tz.startsWith("Europe/")) return "EU";
  if (tz === "Asia/Tokyo") return "JP";
  if (tz === "Asia/Seoul") return "KR";
  if (tz === "Asia/Shanghai" || tz === "Asia/Hong_Kong" || tz === "Asia/Urumqi") return "CN";
  if (tz === "Asia/Singapore") return "SG";
  if (tz === "Asia/Kolkata" || tz === "Asia/Calcutta") return "IN";
  if (tz.startsWith("America/")) {
    if (/Toronto|Vancouver|Edmonton|Winnipeg|Halifax|Montreal|Regina/.test(tz)) return "CA";
    return "US";
  }
  return "GLOBAL";
}

export type Locale = { region: RegionProfile; lang: string; greeting: string };

export function detectLocale(): Locale {
  let region = "GLOBAL", lang = "en";
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    region = tzRegion(tz);
    lang = ((typeof navigator !== "undefined" && (navigator.language || "en")).split("-")[0] || "en").toLowerCase();
  } catch { /* SSR / older browsers → GLOBAL/en */ }
  return { region: REGIONS[region] || REGIONS.GLOBAL, lang, greeting: GREETINGS[lang] || GREETINGS.en };
}
