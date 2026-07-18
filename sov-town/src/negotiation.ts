import type { Agent, Message } from "./types.js";

const TEMPLATES = [
  "Can you provide the latest attestation for {topic}?",
  "Our legal team flagged {topic}. Let me know the remediation plan.",
  "I noticed a {severity} risk on {topic}. Can we align before next tick?",
  "Please share evidence logs covering {topic} from the last 24h.",
  "We need a cross-border handoff decision on {topic}.",
];

const TOPICS = [
  "EU AI Act high-risk classification",
  "DORA ICT incident reporting",
  "shadow AI procurement",
  "vendor supply-chain attestation",
  "automated decision logging",
];

export function generateMessages(agents: Agent[], tick: number): Message[] {
  const messages: Message[] = [];
  const pairs = shuffle(agents).slice(0, Math.floor(agents.length / 2));
  for (let i = 0; i < pairs.length; i += 2) {
    const a = pairs[i];
    const b = pairs[i + 1];
    if (!b) continue;
    const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
    const severity = Math.random() > 0.7 ? "high" : "medium";
    const content = TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)]
      .replace("{topic}", topic)
      .replace("{severity}", severity);
    messages.push({ from: a.id, to: b.id, content, tick });
  }
  return messages;
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
