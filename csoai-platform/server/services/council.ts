/**
 * CSOAI 33-Agent Council Service
 *
 * Byzantine Fault-Tolerant (BFT) Voting System
 *
 * The council consists of 33 independent AI agents distributed across
 * three providers (OpenAI, Anthropic, Google) for maximum resilience.
 *
 * Agent Types:
 * - 11 Guardian Agents: Focus on safety, security, and privacy
 * - 11 Arbiter Agents: Focus on fairness, transparency, accountability
 * - 11 Scribe Agents: Focus on documentation, compliance, reporting
 *
 * Consensus: 22/33 votes required (Byzantine fault tolerance)
 * Can tolerate up to 10 faulty/malicious agents
 */

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Agent configuration
export interface Agent {
  id: string;
  name: string;
  type: 'guardian' | 'arbiter' | 'scribe';
  provider: 'openai' | 'anthropic' | 'google' | 'glm' | 'hermes';
  icon: string;
}

export interface AgentVote {
  agentId: string;
  agentType: 'guardian' | 'arbiter' | 'scribe';
  agentProvider: 'openai' | 'anthropic' | 'google' | 'glm' | 'hermes';
  vote: 'approve' | 'reject' | 'escalate';
  confidence: number;
  reasoning: string;
}

export interface VotingSession {
  sessionId: number;
  subjectType: 'watchdog_report' | 'assessment' | 'policy_proposal' | 'system_review';
  subjectId: number;
  subjectTitle: string;
  subjectDescription: string;
  status: 'voting' | 'consensus_reached' | 'escalated_to_human' | 'completed';
  votes: AgentVote[];
  totalVotes: number;
  approveVotes: number;
  rejectVotes: number;
  escalateVotes: number;
  finalDecision: 'approved' | 'rejected' | 'escalated' | null;
  consensusReached: boolean;
}

// Generate the 33-agent council configuration
export function generateAgentCouncil(): Agent[] {
  const agents: Agent[] = [];
  const types: Array<'guardian' | 'arbiter' | 'scribe'> = ['guardian', 'arbiter', 'scribe'];
  const providers: Array<'openai' | 'anthropic' | 'google' | 'glm' | 'hermes'> = ['openai', 'anthropic', 'google', 'glm', 'hermes'];
  const icons = { guardian: '🛡️', arbiter: '⚖️', scribe: '📄' };

  let agentNum = 1;
  for (const type of types) {
    for (let i = 0; i < 11; i++) {
      const provider = providers[agentNum % providers.length];
      agents.push({
        id: `agent_${agentNum}`,
        name: `${type.charAt(0).toUpperCase() + type.slice(1)} Agent ${i + 1}`,
        type,
        provider,
        icon: icons[type],
      });
      agentNum++;
    }
  }

  return agents;
}

// System prompts for each agent type
const AGENT_PROMPTS = {
  guardian: `You are a Guardian Agent in the CSOAI 33-Agent Council. Your primary focus is:
- SAFETY: Evaluating potential harms to individuals and society
- SECURITY: Identifying cybersecurity and system vulnerabilities
- PRIVACY: Protecting personal data and individual rights

You must evaluate AI incidents with a safety-first mindset. Be rigorous but fair.`,

  arbiter: `You are an Arbiter Agent in the CSOAI 33-Agent Council. Your primary focus is:
- FAIRNESS: Detecting bias and ensuring equitable treatment
- TRANSPARENCY: Evaluating explainability and openness
- ACCOUNTABILITY: Determining responsibility and liability

You must evaluate AI incidents with justice and equity in mind. Be impartial and principled.`,

  scribe: `You are a Scribe Agent in the CSOAI 33-Agent Council. Your primary focus is:
- DOCUMENTATION: Assessing record-keeping and audit trails
- COMPLIANCE: Evaluating regulatory adherence (EU AI Act, NIST, ISO 42001)
- REPORTING: Ensuring proper incident disclosure and transparency

You must evaluate AI incidents against regulatory frameworks. Be thorough and methodical.`,
};

// Vote using OpenAI
async function voteWithOpenAI(
  agent: Agent,
  subject: { title: string; description: string; type: string }
): Promise<AgentVote> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `${AGENT_PROMPTS[agent.type]}

You must respond with a JSON object containing:
- vote: "approve", "reject", or "escalate"
- confidence: a number between 0 and 1
- reasoning: a brief explanation (2-3 sentences)`,
        },
        {
          role: 'user',
          content: `Please evaluate this ${subject.type} and cast your vote:

Title: ${subject.title}
Description: ${subject.description}

Respond with JSON only.`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No response from OpenAI');

    const parsed = JSON.parse(content);
    return {
      agentId: agent.id,
      agentType: agent.type,
      agentProvider: agent.provider,
      vote: parsed.vote,
      confidence: parsed.confidence,
      reasoning: parsed.reasoning,
    };
  } catch (error) {
    console.error(`[Council] OpenAI agent ${agent.id} failed:`, error);
    return {
      agentId: agent.id,
      agentType: agent.type,
      agentProvider: agent.provider,
      vote: 'escalate',
      confidence: 0.5,
      reasoning: 'Agent encountered an error and defaulted to escalation.',
    };
  }
}

// Vote using Anthropic
async function voteWithAnthropic(
  agent: Agent,
  subject: { title: string; description: string; type: string }
): Promise<AgentVote> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 500,
      system: `${AGENT_PROMPTS[agent.type]}

You must respond with a JSON object containing:
- vote: "approve", "reject", or "escalate"
- confidence: a number between 0 and 1
- reasoning: a brief explanation (2-3 sentences)`,
      messages: [
        {
          role: 'user',
          content: `Please evaluate this ${subject.type} and cast your vote:

Title: ${subject.title}
Description: ${subject.description}

Respond with JSON only.`,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') throw new Error('Unexpected response type');

    const parsed = JSON.parse(content.text);
    return {
      agentId: agent.id,
      agentType: agent.type,
      agentProvider: agent.provider,
      vote: parsed.vote,
      confidence: parsed.confidence,
      reasoning: parsed.reasoning,
    };
  } catch (error) {
    console.error(`[Council] Anthropic agent ${agent.id} failed:`, error);
    return {
      agentId: agent.id,
      agentType: agent.type,
      agentProvider: agent.provider,
      vote: 'escalate',
      confidence: 0.5,
      reasoning: 'Agent encountered an error and defaulted to escalation.',
    };
  }
}

// Vote using Google Gemini
async function voteWithGoogle(
  agent: Agent,
  subject: { title: string; description: string; type: string }
): Promise<AgentVote> {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  try {
    const prompt = `${AGENT_PROMPTS[agent.type]}

Please evaluate this ${subject.type} and cast your vote:

Title: ${subject.title}
Description: ${subject.description}

You must respond with a JSON object containing:
- vote: "approve", "reject", or "escalate"
- confidence: a number between 0 and 1
- reasoning: a brief explanation (2-3 sentences)

Respond with JSON only.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in response');

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      agentId: agent.id,
      agentType: agent.type,
      agentProvider: agent.provider,
      vote: parsed.vote,
      confidence: parsed.confidence,
      reasoning: parsed.reasoning,
    };
  } catch (error) {
    console.error(`[Council] Google agent ${agent.id} failed:`, error);
    return {
      agentId: agent.id,
      agentType: agent.type,
      agentProvider: agent.provider,
      vote: 'escalate',
      confidence: 0.5,
      reasoning: 'Agent encountered an error and defaulted to escalation.',
    };
  }
}

// Vote using GLM (Zhipu AI) via OpenAI-compatible endpoint
async function voteWithGLM(
  agent: Agent,
  subject: { title: string; description: string; type: string }
): Promise<AgentVote> {
  const apiKey = process.env.GLM_API_KEY || process.env.ZHIPU_API_KEY;
  if (!apiKey) {
    console.warn(`[Council] GLM agent ${agent.id} skipped: GLM_API_KEY not configured`);
    return {
      agentId: agent.id,
      agentType: agent.type,
      agentProvider: agent.provider,
      vote: 'escalate',
      confidence: 0.5,
      reasoning: 'GLM API key not configured; defaulted to escalation.',
    };
  }

  const openai = new OpenAI({ apiKey, baseURL: 'https://open.bigmodel.cn/api/paas/v4/' });

  try {
    const response = await openai.chat.completions.create({
      model: 'glm-4-flash',
      messages: [
        {
          role: 'system',
          content: `${AGENT_PROMPTS[agent.type]}

You must respond with a JSON object containing:
- vote: "approve", "reject", or "escalate"
- confidence: a number between 0 and 1
- reasoning: a brief explanation (2-3 sentences)`,
        },
        {
          role: 'user',
          content: `Please evaluate this ${subject.type} and cast your vote:

Title: ${subject.title}
Description: ${subject.description}

Respond with JSON only.`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No response from GLM');

    const parsed = JSON.parse(content);
    return {
      agentId: agent.id,
      agentType: agent.type,
      agentProvider: agent.provider,
      vote: parsed.vote,
      confidence: parsed.confidence,
      reasoning: parsed.reasoning,
    };
  } catch (error) {
    console.error(`[Council] GLM agent ${agent.id} failed:`, error);
    return {
      agentId: agent.id,
      agentType: agent.type,
      agentProvider: agent.provider,
      vote: 'escalate',
      confidence: 0.5,
      reasoning: 'Agent encountered an error and defaulted to escalation.',
    };
  }
}

// Vote using Hermes via local Ollama (sovereign/on-prem path)
async function voteWithHermes(
  agent: Agent,
  subject: { title: string; description: string; type: string }
): Promise<AgentVote> {
  const baseURL = process.env.HERMES_BASE_URL || 'http://127.0.0.1:11434/v1/';
  const openai = new OpenAI({ apiKey: 'ollama', baseURL });

  try {
    const response = await openai.chat.completions.create({
      model: process.env.HERMES_MODEL || 'qwen3:0.6b',
      messages: [
        {
          role: 'system',
          content: `${AGENT_PROMPTS[agent.type]}

You must respond with a JSON object containing:
- vote: "approve", "reject", or "escalate"
- confidence: a number between 0 and 1
- reasoning: a brief explanation (2-3 sentences)`,
        },
        {
          role: 'user',
          content: `Please evaluate this ${subject.type} and cast your vote:

Title: ${subject.title}
Description: ${subject.description}

Respond with JSON only.`,
        },
      ],
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No response from Hermes/Ollama');

    const parsed = JSON.parse(content);
    return {
      agentId: agent.id,
      agentType: agent.type,
      agentProvider: agent.provider,
      vote: parsed.vote,
      confidence: parsed.confidence,
      reasoning: parsed.reasoning,
    };
  } catch (error) {
    console.error(`[Council] Hermes agent ${agent.id} failed:`, error);
    return {
      agentId: agent.id,
      agentType: agent.type,
      agentProvider: agent.provider,
      vote: 'escalate',
      confidence: 0.5,
      reasoning: 'Agent encountered an error and defaulted to escalation.',
    };
  }
}

// Main voting function
async function getAgentVote(
  agent: Agent,
  subject: { title: string; description: string; type: string }
): Promise<AgentVote> {
  switch (agent.provider) {
    case 'openai':
      return voteWithOpenAI(agent, subject);
    case 'anthropic':
      return voteWithAnthropic(agent, subject);
    case 'google':
      return voteWithGoogle(agent, subject);
    case 'glm':
      return voteWithGLM(agent, subject);
    case 'hermes':
      return voteWithHermes(agent, subject);
  }
}

// Execute the 33-Agent Council voting
export async function executeCouncilVoting(
  subject: {
    type: 'watchdog_report' | 'assessment' | 'policy_proposal' | 'system_review';
    id: number;
    title: string;
    description: string;
  }
): Promise<VotingSession> {
  const agents = generateAgentCouncil();

  console.log(`[Council] Starting voting session for: ${subject.title}`);
  console.log(`[Council] ${agents.length} agents will vote...`);

  // Execute all votes in parallel for speed
  const votePromises = agents.map(agent =>
    getAgentVote(agent, {
      title: subject.title,
      description: subject.description,
      type: subject.type,
    })
  );

  const votes = await Promise.all(votePromises);

  // Count votes
  const approveVotes = votes.filter(v => v.vote === 'approve').length;
  const rejectVotes = votes.filter(v => v.vote === 'reject').length;
  const escalateVotes = votes.filter(v => v.vote === 'escalate').length;

  // Determine consensus (22/33 threshold)
  const CONSENSUS_THRESHOLD = 22;
  let finalDecision: 'approved' | 'rejected' | 'escalated' = 'escalated';
  let consensusReached = false;
  let status: VotingSession['status'] = 'escalated_to_human';

  if (approveVotes >= CONSENSUS_THRESHOLD) {
    finalDecision = 'approved';
    consensusReached = true;
    status = 'consensus_reached';
  } else if (rejectVotes >= CONSENSUS_THRESHOLD) {
    finalDecision = 'rejected';
    consensusReached = true;
    status = 'consensus_reached';
  }

  console.log(`[Council] Voting complete:`);
  console.log(`  Approve: ${approveVotes}/33`);
  console.log(`  Reject: ${rejectVotes}/33`);
  console.log(`  Escalate: ${escalateVotes}/33`);
  console.log(`  Decision: ${finalDecision}`);
  console.log(`  Consensus: ${consensusReached}`);

  return {
    sessionId: Date.now(), // Will be replaced with DB ID
    subjectType: subject.type,
    subjectId: subject.id,
    subjectTitle: subject.title,
    subjectDescription: subject.description,
    status,
    votes,
    totalVotes: 33,
    approveVotes,
    rejectVotes,
    escalateVotes,
    finalDecision,
    consensusReached,
  };
}

// Simulated voting for development (when API keys are not configured)
function simulateAgentVote(
  agent: Agent,
  subject: { title: string; description: string; type: string }
): AgentVote {
  // Simulate realistic voting behavior based on agent type and subject
  const severityKeywords = ['critical', 'severe', 'dangerous', 'harm', 'death', 'fraud'];
  const biasKeywords = ['bias', 'discrimination', 'unfair', 'prejudice'];
  const privacyKeywords = ['privacy', 'data', 'personal', 'tracking', 'surveillance'];

  const titleLower = subject.title.toLowerCase();
  const descLower = subject.description.toLowerCase();

  let baseRejectProbability = 0.3;
  let baseApproveProb = 0.5;

  // Adjust probabilities based on content
  if (severityKeywords.some(k => titleLower.includes(k) || descLower.includes(k))) {
    baseRejectProbability = 0.7;
  }

  // Guardians are stricter on safety/privacy
  if (agent.type === 'guardian') {
    if (privacyKeywords.some(k => titleLower.includes(k) || descLower.includes(k))) {
      baseRejectProbability += 0.2;
    }
  }

  // Arbiters focus on bias/fairness
  if (agent.type === 'arbiter') {
    if (biasKeywords.some(k => titleLower.includes(k) || descLower.includes(k))) {
      baseRejectProbability += 0.15;
    }
  }

  // Generate vote with some randomness
  const rand = Math.random();
  let vote: 'approve' | 'reject' | 'escalate';
  let confidence: number;

  if (rand < baseRejectProbability) {
    vote = 'reject';
    confidence = 0.7 + Math.random() * 0.25;
  } else if (rand < baseRejectProbability + baseApproveProb) {
    vote = 'approve';
    confidence = 0.6 + Math.random() * 0.3;
  } else {
    vote = 'escalate';
    confidence = 0.5 + Math.random() * 0.2;
  }

  // Generate reasoning based on agent type
  const reasonings = {
    guardian: {
      approve: 'Safety assessment indicates manageable risk levels with proper safeguards.',
      reject: 'Identified potential safety concerns that require immediate attention.',
      escalate: 'Safety implications require human expert review for final determination.',
    },
    arbiter: {
      approve: 'No significant fairness or transparency concerns identified.',
      reject: 'Detected bias patterns or accountability gaps that need addressing.',
      escalate: 'Ethical considerations require broader stakeholder input.',
    },
    scribe: {
      approve: 'Documentation and compliance requirements appear to be met.',
      reject: 'Missing critical documentation or regulatory compliance gaps found.',
      escalate: 'Regulatory interpretation requires legal expert consultation.',
    },
  };

  return {
    agentId: agent.id,
    agentType: agent.type,
    agentProvider: agent.provider,
    vote,
    confidence: parseFloat(confidence.toFixed(2)),
    reasoning: reasonings[agent.type][vote],
  };
}

// Execute simulated council voting (for development without API keys)
export async function executeSimulatedVoting(
  subject: {
    type: 'watchdog_report' | 'assessment' | 'policy_proposal' | 'system_review';
    id: number;
    title: string;
    description: string;
  }
): Promise<VotingSession> {
  const agents = generateAgentCouncil();

  console.log(`[Council] Starting SIMULATED voting session for: ${subject.title}`);

  // Simulate votes with slight delays for realism
  const votes: AgentVote[] = agents.map(agent =>
    simulateAgentVote(agent, {
      title: subject.title,
      description: subject.description,
      type: subject.type,
    })
  );

  // Count votes
  const approveVotes = votes.filter(v => v.vote === 'approve').length;
  const rejectVotes = votes.filter(v => v.vote === 'reject').length;
  const escalateVotes = votes.filter(v => v.vote === 'escalate').length;

  // Determine consensus
  const CONSENSUS_THRESHOLD = 22;
  let finalDecision: 'approved' | 'rejected' | 'escalated' = 'escalated';
  let consensusReached = false;
  let status: VotingSession['status'] = 'escalated_to_human';

  if (approveVotes >= CONSENSUS_THRESHOLD) {
    finalDecision = 'approved';
    consensusReached = true;
    status = 'consensus_reached';
  } else if (rejectVotes >= CONSENSUS_THRESHOLD) {
    finalDecision = 'rejected';
    consensusReached = true;
    status = 'consensus_reached';
  }

  console.log(`[Council] Simulated voting complete:`);
  console.log(`  Approve: ${approveVotes}/33`);
  console.log(`  Reject: ${rejectVotes}/33`);
  console.log(`  Escalate: ${escalateVotes}/33`);
  console.log(`  Decision: ${finalDecision}`);

  return {
    sessionId: Date.now(),
    subjectType: subject.type,
    subjectId: subject.id,
    subjectTitle: subject.title,
    subjectDescription: subject.description,
    status,
    votes,
    totalVotes: 33,
    approveVotes,
    rejectVotes,
    escalateVotes,
    finalDecision,
    consensusReached,
  };
}

// Get council statistics
export function getCouncilStats() {
  const agents = generateAgentCouncil();

  return {
    totalAgents: 33,
    byType: {
      guardian: agents.filter(a => a.type === 'guardian').length,
      arbiter: agents.filter(a => a.type === 'arbiter').length,
      scribe: agents.filter(a => a.type === 'scribe').length,
    },
    byProvider: {
      openai: agents.filter(a => a.provider === 'openai').length,
      anthropic: agents.filter(a => a.provider === 'anthropic').length,
      google: agents.filter(a => a.provider === 'google').length,
      glm: agents.filter(a => a.provider === 'glm').length,
      hermes: agents.filter(a => a.provider === 'hermes').length,
    },
    consensusThreshold: 22,
    faultTolerance: 10,
  };
}

// Get mock voting sessions for development
export function getMockVotingSessions(): VotingSession[] {
  return [
    {
      sessionId: 1001,
      subjectType: 'watchdog_report',
      subjectId: 1,
      subjectTitle: 'Hiring AI shows gender bias in candidate scoring',
      subjectDescription: 'AI-powered hiring tool consistently scores male candidates higher for technical roles.',
      status: 'consensus_reached',
      votes: [],
      totalVotes: 33,
      approveVotes: 2,
      rejectVotes: 28,
      escalateVotes: 3,
      finalDecision: 'rejected',
      consensusReached: true,
    },
    {
      sessionId: 1002,
      subjectType: 'watchdog_report',
      subjectId: 2,
      subjectTitle: 'ChatGPT generates medical advice leading to harm',
      subjectDescription: 'Patient followed AI-generated advice to mix medications that caused adverse reaction.',
      status: 'escalated_to_human',
      votes: [],
      totalVotes: 33,
      approveVotes: 4,
      rejectVotes: 15,
      escalateVotes: 14,
      finalDecision: 'escalated',
      consensusReached: false,
    },
    {
      sessionId: 1003,
      subjectType: 'assessment',
      subjectId: 5,
      subjectTitle: 'EU AI Act Compliance Assessment - TalentScore AI',
      subjectDescription: 'High-risk AI system assessment for hiring/recruitment use case.',
      status: 'consensus_reached',
      votes: [],
      totalVotes: 33,
      approveVotes: 25,
      rejectVotes: 5,
      escalateVotes: 3,
      finalDecision: 'approved',
      consensusReached: true,
    },
  ];
}
