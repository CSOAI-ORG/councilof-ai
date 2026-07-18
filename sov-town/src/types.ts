export interface AgentIdentity {
  did: string;
  publicKey: string;
}

export interface Agent {
  id: string;
  name: string;
  industry: string;
  role: string;
  identity: AgentIdentity;
  objectives: string[];
  memory: MemoryEntry[];
  complianceProfile: ComplianceProfile;
  messages: Message[];
}

export interface MemoryEntry {
  tick: number;
  action: string;
  outcome: string;
  framework?: string;
  riskTier?: "minimal" | "limited" | "high" | "unacceptable";
}

export interface ComplianceProfile {
  frameworks: string[];
  riskScore: number;
  violations: Violation[];
}

export interface Violation {
  framework: string;
  rule: string;
  severity: "low" | "medium" | "high" | "critical";
  tick: number;
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  frameworks: string[];
  agentCount: number;
  ticks: number;
  rules: Rule[];
}

export interface Rule {
  id: string;
  framework: string;
  condition: (agent: Agent, action: string) => boolean;
  message: string;
  severity: "low" | "medium" | "high" | "critical";
}

export interface Message {
  from: string;
  to: string;
  content: string;
  tick: number;
}

export interface CouncilVote {
  id: string;
  topic: string;
  votes: { agentId: string; vote: "yes" | "no" | "abstain"; weight: number }[];
  outcome: "passed" | "rejected" | "tied";
  tick: number;
}

export interface SimulationResult {
  scenarioId: string;
  ticks: number;
  agents: Agent[];
  violations: Violation[];
  attestations: Attestation[];
  messages: Message[];
  councilVotes: CouncilVote[];
  anchor: { txHash: string; merkleRoot: string } | null;
  summary: {
    totalActions: number;
    totalMessages: number;
    totalCouncilVotes: number;
    violationsByFramework: Record<string, number>;
    riskDistribution: Record<string, number>;
  };
}

export interface Attestation {
  id: string;
  agentId: string;
  framework: string;
  status: "compliant" | "non-compliant";
  evidence?: string;
  evidenceHash: string;
  signature: string;
  publicKey: string;
  signedAt: string;
  anchoredTx?: string;
}
