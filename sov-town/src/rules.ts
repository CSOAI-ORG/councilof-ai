import type { Agent, Rule } from "./types.js";

export const euAIActRules: Rule[] = [
  {
    id: "high-risk-human-oversight",
    framework: "EU AI Act",
    condition: (agent: Agent, action: string) =>
      agent.complianceProfile.riskScore >= 0.7 && !action.toLowerCase().includes("human-reviewed"),
    message: "High-risk system action requires human oversight.",
    severity: "high",
  },
  {
    id: "prohibited-social-scoring",
    framework: "EU AI Act",
    condition: (agent: Agent, action: string) =>
      action.toLowerCase().includes("social score") || action.toLowerCase().includes("mass surveillance"),
    message: "Prohibited practice: social scoring or mass surveillance.",
    severity: "critical",
  },
  {
    id: "transparency-disclosure",
    framework: "EU AI Act",
    condition: (agent: Agent, action: string) =>
      agent.role === "chatbot" && !action.toLowerCase().includes("disclose ai"),
    message: "Limited-risk AI system must disclose it is an AI.",
    severity: "medium",
  },
];

export const doraRules: Rule[] = [
  {
    id: "dora-incident-reporting",
    framework: "DORA",
    condition: (agent: Agent, action: string) =>
      action.toLowerCase().includes("outage") && !action.toLowerCase().includes("reported"),
    message: "Operational outage must be reported within the required timeframe.",
    severity: "high",
  },
  {
    id: "dora-resilience-testing",
    framework: "DORA",
    condition: (agent: Agent, action: string) =>
      agent.industry === "Finance" && !action.toLowerCase().includes("resilience test"),
    message: "Financial entity must demonstrate periodic resilience testing.",
    severity: "medium",
  },
];

export function defaultRules(): Rule[] {
  return [...euAIActRules, ...doraRules];
}
