/**
 * CSOAI — Main Unified Client
 * One import for MCP, A2A, ACP, libp2p, ABCI, and REST API
 */
import { CSOAIConfig } from './types';
import { AuthClient } from './auth';
import { APIClient } from './api/client';
import { MCPClient } from './mcp/client';
import { A2AClient } from './a2a/client';
import { ACPClient } from './acp/client';
import { ABCIClient } from './abci/client';
import { TrustClient } from './trust/client';
import { MarketplaceClient } from './marketplace/client';
import { EnterpriseClient } from './enterprise/client';
import { GovernmentClient } from './government/client';
import { KillSwitchClient } from './killswitch/client';
import { AgentikClient } from './agentik/client';
import { HatchClient } from './hatch/client';
import { RainbowSecurityClient } from './rainbow/client';
import { CouncilBFTClient } from './council/client';
import { GodsEyeClient } from './godseye/client';

export class CSOAI {
  config: CSOAIConfig;
  auth: AuthClient;
  api: APIClient;
  mcp: MCPClient;
  a2a: A2AClient;
  acp: ACPClient;
  private _p2p: any = null;
  get p2p(): any {
    if (!this._p2p) {
      const p2pPath = './p2p/client';
      const { P2PClient } = require(p2pPath);
      this._p2p = new P2PClient({
        bootstrapPeers: [`${this.config.baseUrl.replace(/^http/, 'ws')}/p2p/bootstrap`],
      });
    }
    return this._p2p;
  }
  abci: ABCIClient;
  trust: TrustClient;
  marketplace: MarketplaceClient;
  enterprise: EnterpriseClient;
  government: GovernmentClient;
  killSwitch: KillSwitchClient;
  agentik: AgentikClient;
  hatch: HatchClient;
  rainbow: RainbowSecurityClient;
  council: CouncilBFTClient;
  godsEye: GodsEyeClient;

  private constructor(config: CSOAIConfig) {
    this.config = config;
    this.auth = new AuthClient(config.baseUrl);
    if (config.auth) this.auth.setCredentials(config.auth);

    this.api = new APIClient(config);
    this.mcp = new MCPClient({
      serverUrl: `${config.baseUrl}/mcp`,
      headers: this.auth.getAuthHeaders(),
    });
    this.a2a = new A2AClient(`${config.baseUrl}/a2a`, this.auth.getAuthHeaders());
    this.acp = new ACPClient(`${config.baseUrl}/acp`, this.auth.getAuthHeaders());
    this.abci = new ABCIClient(`${config.baseUrl}:26657`, this.auth.getAuthHeaders());
    this.trust = new TrustClient(config.baseUrl, this.auth.getToken());
    this.marketplace = new MarketplaceClient(config.baseUrl, this.auth.getToken());
    this.enterprise = new EnterpriseClient(config.baseUrl, this.auth.getToken());
    this.government = new GovernmentClient(config.baseUrl, this.auth.getToken());
    this.killSwitch = new KillSwitchClient(config.baseUrl, this.auth.getToken());
    this.agentik = new AgentikClient(config.baseUrl, this.auth.getToken());
    this.hatch = new HatchClient(config.baseUrl, this.auth.getToken());
    this.rainbow = new RainbowSecurityClient(config.baseUrl, this.auth.getToken());
    this.council = new CouncilBFTClient(config.baseUrl, this.auth.getToken());
    this.godsEye = new GodsEyeClient(config.baseUrl, this.auth.getToken());
  }

  static create(config: CSOAIConfig): CSOAI {
    return new CSOAI(config);
  }

  /** Full connectivity handshake for a session */
  async connect(): Promise<void> {
    await this.mcp.connect();
    await this.mcp.initialize();
    await this.acp.connect();
    if (this.config.enableP2P) {
      await this.p2p.start();
    }
  }

  /** Graceful teardown */
  async disconnect(): Promise<void> {
    this.mcp.disconnect();
    this.acp.disconnect();
    if (this.config.enableP2P) {
      await this.p2p.stop();
    }
  }

  /** Convenience: call a vertical tool via MCP */
  async tool(vertical: string, toolName: string, args: Record<string, unknown>): Promise<unknown> {
    return this.mcp.callTool({ name: `${vertical}/${toolName}`, arguments: args });
  }

  /** Convenience: send an A2A message to a domain agent */
  async askAgent(agentUrl: string, text: string): Promise<unknown> {
    const msg = A2AClient.textMessage('user', text);
    return this.a2a.sendTask(agentUrl, [msg]);
  }

  /** Convenience: query on-chain trust state */
  async verifyTrust(entityId: string): Promise<Record<string, unknown>> {
    return this.abci.queryTrustRegistry(entityId);
  }
}
