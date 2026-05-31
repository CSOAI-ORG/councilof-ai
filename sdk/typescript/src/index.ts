/**
 * @meok-labs/ai-sdk
 * CSOAI Universal AI SDK
 *
 * Usage:
 *   import { CSOAI } from '@meok-labs/ai-sdk';
 *   const client = CSOAI.create({ baseUrl: 'https://api.csoai.org', vertical: 'safetyofai' });
 *   await client.connect();
 *   const result = await client.tool('safetyofai', 'audit_model', { model_id: 'gpt-4' });
 */

export { CSOAI } from './csoai';
export { AuthClient } from './auth';
export { APIClient } from './api/client';
export { MCPClient } from './mcp/client';
export { A2AClient } from './a2a/client';
export { ACPClient } from './acp/client';
export { ABCIClient } from './abci/client';
export { SigilClient, sigil } from './sigil/client';
export { TrustClient } from './trust/client';
export { MarketplaceClient } from './marketplace/client';
export { EnterpriseClient } from './enterprise/client';
export { GovernmentClient } from './government/client';
export { KillSwitchClient } from './killswitch/client';
export { AgentikClient } from './agentik/client';
export { HatchClient } from './hatch/client';
export { RainbowSecurityClient } from './rainbow/client';
export { CouncilBFTClient } from './council/client';
export { GodsEyeClient } from './godseye/client';
export * from './types';
