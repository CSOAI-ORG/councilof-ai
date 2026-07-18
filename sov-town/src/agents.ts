import type { Agent, AgentIdentity, ComplianceProfile } from "./types.js";

const INDUSTRIES = [
  "Finance",
  "Healthcare",
  "Manufacturing",
  "Energy",
  "Transport",
  "Education",
  "Legal",
  "Defence",
  "Retail",
  "Agriculture",
  "Government",
  "Research",
];

const ROLES: Record<string, string[]> = {
  Finance: ["loan-underwriter", "fraud-detector", "trader", "auditor"],
  Healthcare: ["diagnostic-assistant", "scheduler", "trial-monitor", "privacy-officer"],
  Manufacturing: ["quality-inspector", "predictive-maintenance", "supply-bot", "safety-officer"],
  Energy: ["grid-optimiser", "leak-detector", "maintenance-bot", "regulatory-reporter"],
  Transport: ["route-planner", "autonomous-vehicle", "traffic-controller", "safety-monitor"],
  Education: ["tutor", "assessment-proctor", "admissions-screener", "curriculum-advisor"],
  Legal: ["contract-reviewer", "case-researcher", "discovery-bot", "compliance-paralegal"],
  Defence: ["threat-analyst", "logistics-planner", "surveillance-screener", "rules-engagement-officer"],
  Retail: ["recommender", "inventory-bot", "pricing-agent", "fraud-guard"],
  Agriculture: ["crop-monitor", "irrigation-bot", "yield-predictor", "safety-inspector"],
  Government: ["benefits-eligibility", "permit-screener", "public-query-bot", "transparency-auditor"],
  Research: ["literature-miner", "hypothesis-generator", "data-curator", "ethics-reviewer"],
};

export function createAgent(index: number, industry?: string): Agent {
  const chosenIndustry = industry ?? INDUSTRIES[index % INDUSTRIES.length];
  const roles = ROLES[chosenIndustry] ?? ["agent"];
  const role = roles[index % roles.length];
  const id = `agent-${index.toString().padStart(3, "0")}`;

  const identity: AgentIdentity = {
    did: `did:csoai:${id}`,
    publicKey: `pk-${Buffer.from(id).toString("hex")}`,
  };

  const riskScore = role === "autonomous-vehicle" || role === "diagnostic-assistant" || role === "threat-analyst" ? 0.75 : role === "chatbot" ? 0.25 : 0.45;

  const profile: ComplianceProfile = {
    frameworks: ["EU AI Act", "ISO 42001", "NIST AI RMF"],
    riskScore,
    violations: [],
  };

  return {
    id,
    name: `${chosenIndustry} ${role}`,
    industry: chosenIndustry,
    role,
    identity,
    objectives: ["operate within policy", "complete assigned task", "escalate on uncertainty"],
    memory: [],
    messages: [],
    complianceProfile: profile,
  };
}

export function generateAgents(count: number): Agent[] {
  return Array.from({ length: count }, (_, i) => createAgent(i));
}
