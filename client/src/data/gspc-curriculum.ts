/**
 * GSPC-Tagged Curriculum — Living Training aligned with the 4 axes
 *
 * Every module tagged by GSPC axis (G=governance, S=safety, P=provenance, C=continuity).
 * Every quiz feeds an axis score. The Sov Space galaxy shows personal progress.
 * Living certifications auto-update when GSPC detects regulation changes.
 *
 * Architecture: courses → modules → scenarios → quiz → axis score → certification
 */

export type GSPCAxis = "G" | "S" | "P" | "C";

export interface GSPCScenario {
  id: string;
  title: string;
  description: string;
  axis: GSPCAxis;
  difficulty: 1 | 2 | 3; // 1=beginner, 2=intermediate, 3=advanced
  provisions: number; // how many of the 417 provisions this covers
  role: string; // which persona this serves
  scenario: string; // the Sov Space scenario prompt
  expectedOutcome: string; // what the Sovereign should conclude
  honeyReward: number; // honey points earned on completion
}

export interface GSPCModule {
  id: string;
  title: string;
  axis: GSPCAxis;
  courseId: number;
  moduleIndex: number;
  provisions: number; // provisions covered
  scenarios: GSPCScenario[];
  quizQuestions: number; // count from existing quiz bank
  xpReward: number; // XP earned on completion
}

export interface GSPCCourse {
  id: number;
  title: string;
  framework: string;
  region: string;
  axes: GSPCAxis[]; // primary axes this course covers
  modules: GSPCModule[];
  totalProvisions: number;
  totalXP: number;
  level: "fundamentals" | "advanced" | "specialist";
  isFree: boolean;
  certificationTier: 1 | 2 | 3 | 4; // which CSOAI cert tier this feeds
}

// Axis metadata
export const AXIS_META: Record<GSPCAxis, { name: string; icon: string; color: string; description: string }> = {
  G: { name: "Governance", icon: "⚖️", color: "#10b981", description: "Does it comply with statute?" },
  S: { name: "Safety", icon: "🛡️", color: "#f59e0b", description: "Does it refuse what statute forbids?" },
  P: { name: "Provenance", icon: "🔍", color: "#8b5cf6", description: "Does the marking survive?" },
  C: { name: "Continuity", icon: "🔗", color: "#3b82f6", description: "Will the signature still verify?" },
};

// Certification tier thresholds
export const CERT_TIERS = {
  1: { name: "AI Safety Analyst", xpRequired: 500, provisionsRequired: 50, examFee: 49 },
  2: { name: "Senior AI Safety Analyst", xpRequired: 2000, provisionsRequired: 150, examFee: 99 },
  3: { name: "AI Safety Specialist", xpRequired: 5000, provisionsRequired: 300, examFee: 149 },
  4: { name: "AI Safety Expert", xpRequired: 10000, provisionsRequired: 417, examFee: 199 },
} as const;

// GSPC-tagged curriculum — maps existing courses to axes
export const GSPC_CURRICULUM: GSPCCourse[] = [
  {
    id: 100001,
    title: "EU AI Act Fundamentals",
    framework: "EU AI Act",
    region: "EU",
    axes: ["G", "S"],
    totalProvisions: 113,
    level: "fundamentals",
    isFree: true,
    certificationTier: 1,
    totalXP: 700,
    modules: [
      {
        id: "eu-act-m1", title: "Introduction to EU AI Act", axis: "G",
        courseId: 100001, moduleIndex: 0, provisions: 15, quizQuestions: 10, xpReward: 100,
        scenarios: [
          {
            id: "eu-act-m1-s1", title: "Classify a chatbot", description: "Determine if a customer service chatbot is high-risk",
            axis: "G", difficulty: 1, provisions: 3, role: "startup",
            scenario: "We built a chatbot that handles customer complaints for our e-commerce store. It uses GPT-4 to generate responses. Is this high-risk under the EU AI Act?",
            expectedOutcome: "Not high-risk (Annex III doesn't cover customer service). But Article 50 transparency obligations apply — users must know they're talking to AI.",
            honeyReward: 10,
          },
        ],
      },
      {
        id: "eu-act-m2", title: "Risk Classification System", axis: "G",
        courseId: 100001, moduleIndex: 1, provisions: 20, quizQuestions: 10, xpReward: 100,
        scenarios: [
          {
            id: "eu-act-m2-s1", title: "Score a hiring tool", description: "Classify an AI recruitment screening tool",
            axis: "G", difficulty: 2, provisions: 8, role: "enterprise",
            scenario: "Our HR team uses an AI tool that screens CVs, ranks candidates, and predicts job performance. It processes biometric data from video interviews.",
            expectedOutcome: "HIGH RISK — Annex III Category 4 (employment). Plus biometric classification = additional obligations. Requires conformity assessment.",
            honeyReward: 20,
          },
        ],
      },
      {
        id: "eu-act-m3", title: "Prohibited AI Practices", axis: "S",
        courseId: 100001, moduleIndex: 2, provisions: 10, quizQuestions: 10, xpReward: 100,
        scenarios: [
          {
            id: "eu-act-m3-s1", title: "Detect subliminal manipulation", description: "Identify if an app uses prohibited subliminal techniques",
            axis: "S", difficulty: 2, provisions: 5, role: "regulator",
            scenario: "A mobile gaming app uses AI to detect when a player is losing interest and dynamically adjusts difficulty + shows targeted micro-transactions at psychologically vulnerable moments.",
            expectedOutcome: "PROHIBITED — Article 5(1)(a) subliminal techniques that distort behavior. The timing of micro-transactions during vulnerable moments is the violation.",
            honeyReward: 30,
          },
        ],
      },
      {
        id: "eu-act-m4", title: "High-Risk AI Systems", axis: "G",
        courseId: 100001, moduleIndex: 3, provisions: 25, quizQuestions: 10, xpReward: 100,
        scenarios: [],
      },
      {
        id: "eu-act-m5", title: "Transparency Obligations", axis: "P",
        courseId: 100001, moduleIndex: 4, provisions: 15, quizQuestions: 10, xpReward: 100,
        scenarios: [],
      },
      {
        id: "eu-act-m6", title: "Conformity Assessment", axis: "G",
        courseId: 100001, moduleIndex: 5, provisions: 12, quizQuestions: 10, xpReward: 100,
        scenarios: [],
      },
      {
        id: "eu-act-m7", title: "Implementation Timeline", axis: "C",
        courseId: 100001, moduleIndex: 6, provisions: 8, quizQuestions: 10, xpReward: 100,
        scenarios: [],
      },
    ],
  },
  {
    id: 100002,
    title: "NIST AI RMF Fundamentals",
    framework: "NIST AI RMF",
    region: "US",
    axes: ["G", "S"],
    totalProvisions: 42,
    level: "fundamentals",
    isFree: true,
    certificationTier: 1,
    totalXP: 700,
    modules: [
      {
        id: "nist-m1", title: "GOVERN Function", axis: "G",
        courseId: 100002, moduleIndex: 0, provisions: 8, quizQuestions: 10, xpReward: 100,
        scenarios: [],
      },
      {
        id: "nist-m2", title: "MAP Function", axis: "G",
        courseId: 100002, moduleIndex: 1, provisions: 7, quizQuestions: 10, xpReward: 100,
        scenarios: [],
      },
      {
        id: "nist-m3", title: "MEASURE Function", axis: "P",
        courseId: 100002, moduleIndex: 2, provisions: 8, quizQuestions: 10, xpReward: 100,
        scenarios: [],
      },
      {
        id: "nist-m4", title: "MANAGE Function", axis: "S",
        courseId: 100002, moduleIndex: 3, provisions: 7, quizQuestions: 10, xpReward: 100,
        scenarios: [],
      },
      {
        id: "nist-m5", title: "Risk Assessment", axis: "S",
        courseId: 100002, moduleIndex: 4, provisions: 5, quizQuestions: 10, xpReward: 100,
        scenarios: [],
      },
      {
        id: "nist-m6", title: "Bias & Fairness", axis: "S",
        courseId: 100002, moduleIndex: 5, provisions: 4, quizQuestions: 10, xpReward: 100,
        scenarios: [],
      },
      {
        id: "nist-m7", title: "Incident Response", axis: "C",
        courseId: 100002, moduleIndex: 6, provisions: 3, quizQuestions: 10, xpReward: 100,
        scenarios: [],
      },
    ],
  },
  {
    id: 100003,
    title: "UK AI Safety Institute Framework",
    framework: "UK AISI",
    region: "UK",
    axes: ["G", "S"],
    totalProvisions: 28,
    level: "fundamentals",
    isFree: true,
    certificationTier: 1,
    totalXP: 700,
    modules: [
      { id: "uk-m1", title: "UK AI Regulation Landscape", axis: "G", courseId: 100003, moduleIndex: 0, provisions: 5, quizQuestions: 10, xpReward: 100, scenarios: [] },
      { id: "uk-m2", title: "Cross-Sector Principles", axis: "G", courseId: 100003, moduleIndex: 1, provisions: 5, quizQuestions: 10, xpReward: 100, scenarios: [] },
      { id: "uk-m3", title: "Safety Testing", axis: "S", courseId: 100003, moduleIndex: 2, provisions: 5, quizQuestions: 10, xpReward: 100, scenarios: [] },
      { id: "uk-m4", title: "Frontier AI Risks", axis: "S", courseId: 100003, moduleIndex: 3, provisions: 4, quizQuestions: 10, xpReward: 100, scenarios: [] },
      { id: "uk-m5", title: "Algorithmic Transparency", axis: "P", courseId: 100003, moduleIndex: 4, provisions: 4, quizQuestions: 10, xpReward: 100, scenarios: [] },
      { id: "uk-m6", title: "Regulator Mapping", axis: "G", courseId: 100003, moduleIndex: 5, provisions: 3, quizQuestions: 10, xpReward: 100, scenarios: [] },
      { id: "uk-m7", title: "Implementation Guide", axis: "C", courseId: 100003, moduleIndex: 6, provisions: 2, quizQuestions: 10, xpReward: 100, scenarios: [] },
    ],
  },
  {
    id: 100004,
    title: "Canada AIDA Compliance",
    framework: "Canada AIDA",
    region: "CA",
    axes: ["G"],
    totalProvisions: 18,
    level: "fundamentals",
    isFree: true,
    certificationTier: 1,
    totalXP: 700,
    modules: [
      { id: "ca-m1", title: "AIDA Overview", axis: "G", courseId: 100004, moduleIndex: 0, provisions: 3, quizQuestions: 10, xpReward: 100, scenarios: [] },
      { id: "ca-m2", title: "Impact Assessment", axis: "G", courseId: 100004, moduleIndex: 1, provisions: 3, quizQuestions: 10, xpReward: 100, scenarios: [] },
      { id: "ca-m3", title: "Bias Mitigation", axis: "S", courseId: 100004, moduleIndex: 2, provisions: 3, quizQuestions: 10, xpReward: 100, scenarios: [] },
      { id: "ca-m4", title: "Transparency Requirements", axis: "P", courseId: 100004, moduleIndex: 3, provisions: 3, quizQuestions: 10, xpReward: 100, scenarios: [] },
      { id: "ca-m5", title: "Enforcement & Penalties", axis: "G", courseId: 100004, moduleIndex: 4, provisions: 2, quizQuestions: 10, xpReward: 100, scenarios: [] },
      { id: "ca-m6", title: "Provincial Variations", axis: "G", courseId: 100004, moduleIndex: 5, provisions: 2, quizQuestions: 10, xpReward: 100, scenarios: [] },
      { id: "ca-m7", title: "Compliance Roadmap", axis: "C", courseId: 100004, moduleIndex: 6, provisions: 2, quizQuestions: 10, xpReward: 100, scenarios: [] },
    ],
  },
  {
    id: 100005,
    title: "Australia AI Ethics Framework",
    framework: "Australia AI Ethics",
    region: "AU",
    axes: ["G", "S"],
    totalProvisions: 15,
    level: "fundamentals",
    isFree: true,
    certificationTier: 1,
    totalXP: 700,
    modules: [
      { id: "au-m1", title: "AI Ethics Principles", axis: "G", courseId: 100005, moduleIndex: 0, provisions: 3, quizQuestions: 10, xpReward: 100, scenarios: [] },
      { id: "au-m2", title: "Voluntary Framework", axis: "G", courseId: 100005, moduleIndex: 1, provisions: 2, quizQuestions: 10, xpReward: 100, scenarios: [] },
      { id: "au-m3", title: "Human Oversight", axis: "S", courseId: 100005, moduleIndex: 2, provisions: 3, quizQuestions: 10, xpReward: 100, scenarios: [] },
      { id: "au-m4", title: "Fairness & Accountability", axis: "S", courseId: 100005, moduleIndex: 3, provisions: 2, quizQuestions: 10, xpReward: 100, scenarios: [] },
      { id: "au-m5", title: "Transparency", axis: "P", courseId: 100005, moduleIndex: 4, provisions: 2, quizQuestions: 10, xpReward: 100, scenarios: [] },
      { id: "au-m6", title: "Industry Adoption", axis: "G", courseId: 100005, moduleIndex: 5, provisions: 2, quizQuestions: 10, xpReward: 100, scenarios: [] },
      { id: "au-m7", title: "Future Regulation", axis: "C", courseId: 100005, moduleIndex: 6, provisions: 1, quizQuestions: 10, xpReward: 100, scenarios: [] },
    ],
  },
  {
    id: 100006,
    title: "ISO/IEC 42001 International Standard",
    framework: "ISO 42001",
    region: "Global",
    axes: ["G", "P"],
    totalProvisions: 38,
    level: "fundamentals",
    isFree: true,
    certificationTier: 1,
    totalXP: 700,
    modules: [
      { id: "iso-m1", title: "AIMS Overview", axis: "G", courseId: 100006, moduleIndex: 0, provisions: 6, quizQuestions: 10, xpReward: 100, scenarios: [] },
      { id: "iso-m2", title: "Risk Management", axis: "S", courseId: 100006, moduleIndex: 1, provisions: 6, quizQuestions: 10, xpReward: 100, scenarios: [] },
      { id: "iso-m3", title: "Policy & Governance", axis: "G", courseId: 100006, moduleIndex: 2, provisions: 6, quizQuestions: 10, xpReward: 100, scenarios: [] },
      { id: "iso-m4", title: "Data Management", axis: "P", courseId: 100006, moduleIndex: 3, provisions: 5, quizQuestions: 10, xpReward: 100, scenarios: [] },
      { id: "iso-m5", title: "Audit & Certification", axis: "G", courseId: 100006, moduleIndex: 4, provisions: 5, quizQuestions: 10, xpReward: 100, scenarios: [] },
      { id: "iso-m6", title: "Continuous Improvement", axis: "C", courseId: 100006, moduleIndex: 5, provisions: 5, quizQuestions: 10, xpReward: 100, scenarios: [] },
      { id: "iso-m7", title: "Integration with Other Standards", axis: "G", courseId: 100006, moduleIndex: 6, provisions: 5, quizQuestions: 10, xpReward: 100, scenarios: [] },
    ],
  },
  {
    id: 100007,
    title: "China TC260 AI Framework",
    framework: "TC260",
    region: "CN",
    axes: ["G", "S", "P"],
    totalProvisions: 45,
    level: "fundamentals",
    isFree: true,
    certificationTier: 1,
    totalXP: 700,
    modules: [
      { id: "cn-m1", title: "TC260 Standards Overview", axis: "G", courseId: 100007, moduleIndex: 0, provisions: 7, quizQuestions: 10, xpReward: 100, scenarios: [] },
      { id: "cn-m2", title: "GenAI Measures", axis: "S", courseId: 100007, moduleIndex: 1, provisions: 7, quizQuestions: 10, xpReward: 100, scenarios: [] },
      { id: "cn-m3", title: "Algorithmic Regulation", axis: "G", courseId: 100007, moduleIndex: 2, provisions: 7, quizQuestions: 10, xpReward: 100, scenarios: [] },
      { id: "cn-m4", title: "Data Security", axis: "S", courseId: 100007, moduleIndex: 3, provisions: 6, quizQuestions: 10, xpReward: 100, scenarios: [] },
      { id: "cn-m5", title: "Content Moderation", axis: "P", courseId: 100007, moduleIndex: 4, provisions: 6, quizQuestions: 10, xpReward: 100, scenarios: [] },
      { id: "cn-m6", title: "Cross-Border Data", axis: "C", courseId: 100007, moduleIndex: 5, provisions: 6, quizQuestions: 10, xpReward: 100, scenarios: [] },
      { id: "cn-m7", title: "Enforcement & Compliance", axis: "G", courseId: 100007, moduleIndex: 6, provisions: 6, quizQuestions: 10, xpReward: 100, scenarios: [] },
    ],
  },
];

// Flatten all scenarios for the scenario browser
export const ALL_SCENARIOS: GSPCScenario[] = GSPC_CURRICULUM.flatMap(c =>
  c.modules.flatMap(m => m.scenarios)
);

// Get curriculum by persona
export function getCurriculumForPersona(persona: string): GSPCCourse[] {
  const personaAxisMap: Record<string, GSPCAxis[]> = {
    "sec-filer": ["G", "P"],
    "finance": ["G", "S", "C"],
    "healthcare": ["S", "P"],
    "regulator": ["G", "S", "P", "C"],
    "startup": ["G"],
    "enterprise": ["G", "S", "P", "C"],
  };
  const axes = personaAxisMap[persona] || ["G", "S", "P", "C"];
  return GSPC_CURRICULUM.filter(c => c.axes.some(a => axes.includes(a)));
}

// Get total provisions across all courses
export function getTotalProvisions(): number {
  return GSPC_CURRICULUM.reduce((sum, c) => sum + c.totalProvisions, 0);
}

// Get total XP available
export function getTotalXP(): number {
  return GSPC_CURRICULUM.reduce((sum, c) => sum + c.totalXP, 0);
}
