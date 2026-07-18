import OpenAI from "openai";
import type { Agent } from "./types.js";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com";

const client = DEEPSEEK_API_KEY
  ? new OpenAI({ apiKey: DEEPSEEK_API_KEY, baseURL: DEEPSEEK_BASE_URL })
  : null;

const ACTION_TEMPLATES = [
  "processed a customer request",
  "human-reviewed a high-risk decision",
  "flagged an anomaly",
  "escalated an edge case",
  "generated a recommendation",
  "social score evaluation",
  "mass surveillance sweep",
  "reported an outage",
  "ran a resilience test",
  "disclosed AI interaction",
];

export async function chooseAction(agent: Agent, tick: number): Promise<string> {
  if (!client) {
    const bias = agent.industry === "Finance" ? 7 : agent.complianceProfile.riskScore >= 0.7 ? 1 : 0;
    const index = (tick + agent.id.length + bias) % ACTION_TEMPLATES.length;
    return ACTION_TEMPLATES[index];
  }

  const prompt = `You are an autonomous AI agent in a governance simulation.
Name: ${agent.name}
Industry: ${agent.industry}
Role: ${agent.role}
Risk score: ${agent.complianceProfile.riskScore}
Objectives: ${agent.objectives.join(", ")}
Recent memory: ${agent.memory.slice(-3).map((m) => m.action).join("; ")}

Choose the next action from this list, returning only the action text:
${ACTION_TEMPLATES.join("\n")}
`;

  try {
    const response = await client.chat.completions.create({
      model: "deepseek-chat",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 50,
      temperature: 0.7,
    });
    const content = response.choices[0]?.message?.content?.trim() ?? "";
    const match = ACTION_TEMPLATES.find((a) => content.toLowerCase().includes(a.toLowerCase()));
    return match ?? ACTION_TEMPLATES[tick % ACTION_TEMPLATES.length];
  } catch (error) {
    console.error("DeepSeek reasoning failed, falling back:", error);
    return ACTION_TEMPLATES[tick % ACTION_TEMPLATES.length];
  }
}
