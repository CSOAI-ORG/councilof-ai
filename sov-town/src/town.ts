import crypto from "node:crypto";
import type { Agent, Attestation, CouncilVote, Message, Scenario, SimulationResult, Violation } from "./types.js";
import { createAgent } from "./agents.js";
import { defaultRules } from "./rules.js";
import { chooseAction } from "./reasoning.js";
import { summarize } from "./memory.js";
import { runCouncilVote } from "./council.js";
import { generateMessages } from "./negotiation.js";
import { anchorAttestations } from "./anchor.js";

export class Town {
  private agents: Agent[] = [];
  private tick = 0;
  private scenario: Scenario;
  private violations: Violation[] = [];
  private attestations: Attestation[] = [];
  private messages: Message[] = [];
  private councilVotes: CouncilVote[] = [];
  private privateKeyPem: string;
  private publicKeyPem: string;

  constructor(scenario: Scenario) {
    this.scenario = scenario;
    const { privateKey, publicKey } = crypto.generateKeyPairSync("ed25519", {
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
      publicKeyEncoding: { type: "spki", format: "pem" },
    });
    this.privateKeyPem = privateKey;
    this.publicKeyPem = publicKey;
  }

  spawnAgents(count: number): void {
    this.agents = Array.from({ length: count }, (_, i) => createAgent(i));
  }

  async run(): Promise<SimulationResult> {
    if (this.agents.length === 0) {
      this.spawnAgents(this.scenario.agentCount);
    }

    const rules = this.scenario.rules.length > 0 ? this.scenario.rules : defaultRules();

    for (let t = 0; t < this.scenario.ticks; t++) {
      this.tick = t;

      // Inter-agent negotiation messages
      const tickMessages = generateMessages(this.agents, t);
      for (const m of tickMessages) {
        this.messages.push(m);
        const recipient = this.agents.find((a) => a.id === m.to);
        if (recipient) recipient.messages.push(m);
      }

      // BFT council vote on latest governance topic
      if (t % 5 === 0 || t === this.scenario.ticks - 1) {
        const vote = runCouncilVote(this.agents, this.violations, t);
        if (vote) this.councilVotes.push(vote);
      }

      for (const agent of this.agents) {
        const action = await chooseAction(agent, t);
        let outcome = "completed";

        for (const rule of rules) {
          if (rule.condition(agent, action)) {
            const violation: Violation = {
              framework: rule.framework,
              rule: rule.message,
              severity: rule.severity,
              tick: t,
            };
            agent.complianceProfile.violations.push(violation);
            this.violations.push(violation);
            outcome = `violation: ${rule.id}`;
          }
        }

        agent.memory.push({
          tick: t,
          action,
          outcome,
          framework: this.scenario.frameworks[0],
          riskTier: agent.complianceProfile.riskScore >= 0.7 ? "high" : agent.complianceProfile.riskScore >= 0.4 ? "limited" : "minimal",
        });

        // Keep memory from growing unbounded; summarise periodically
        if (agent.memory.length > 50) {
          const { recent } = summarize(agent.memory, 25);
          agent.memory = recent;
        }
      }
    }

    this.generateAttestations();
    const anchor = this.attestations.length > 0 ? anchorAttestations(this.attestations) : null;
    if (anchor) {
      for (const a of this.attestations) a.anchoredTx = anchor.txHash;
    }
    return this.buildResult(anchor);
  }

  private generateAttestations(): void {
    for (const agent of this.agents) {
      for (const framework of this.scenario.frameworks) {
        const frameworkViolations = agent.complianceProfile.violations.filter((v) => v.framework === framework);
        const status = frameworkViolations.length === 0 ? "compliant" : "non-compliant";
        const payload = JSON.stringify({
          agentId: agent.id,
          framework,
          status,
          violations: frameworkViolations,
          memory: summarize(agent.memory, 5).highlights,
        });
        const hash = crypto.createHash("sha256").update(payload).digest("hex");
        const privateKey = crypto.createPrivateKey(this.privateKeyPem);
        // Ed25519 signs the RAW message — never a pre-hashed digest. Sign `payload`, keep the sha256 as a
        // fingerprint, and store `evidence` so anyone can verify: crypto.verify(null, Buffer.from(evidence,"utf8"), pub, sig).
        const signature = crypto.sign(null, Buffer.from(payload, "utf8"), privateKey).toString("base64");

        const attestation: Attestation = {
          id: `att-${agent.id}-${framework}`,
          agentId: agent.id,
          framework,
          status,
          evidence: payload,
          evidenceHash: hash,
          signature,
          publicKey: this.publicKeyPem,
          signedAt: new Date().toISOString(),
        };
        this.attestations.push(attestation);
      }
    }
  }

  private buildResult(anchor: { txHash: string; merkleRoot: string; count: number } | null): SimulationResult {
    const totalActions = this.agents.reduce((acc, a) => acc + a.memory.length, 0);
    const violationsByFramework: Record<string, number> = {};
    const riskDistribution: Record<string, number> = {};

    for (const v of this.violations) {
      violationsByFramework[v.framework] = (violationsByFramework[v.framework] ?? 0) + 1;
    }

    for (const a of this.agents) {
      const tier = a.complianceProfile.riskScore >= 0.7 ? "high" : a.complianceProfile.riskScore >= 0.4 ? "limited" : "minimal";
      riskDistribution[tier] = (riskDistribution[tier] ?? 0) + 1;
    }

    return {
      scenarioId: this.scenario.id,
      ticks: this.scenario.ticks,
      agents: this.agents,
      violations: this.violations,
      attestations: this.attestations,
      messages: this.messages,
      councilVotes: this.councilVotes,
      anchor: anchor ? { txHash: anchor.txHash, merkleRoot: anchor.merkleRoot } : null,
      summary: {
        totalActions,
        totalMessages: this.messages.length,
        totalCouncilVotes: this.councilVotes.length,
        violationsByFramework,
        riskDistribution,
      },
    };
  }
}
