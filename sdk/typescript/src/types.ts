/**
 * CSOAI Universal SDK — Shared Types
 * Normalized across MCP, A2A, ACP, libp2p, ABCI, and REST API
 */

// ── Auth ──────────────────────────────────────────────────────────
export interface AuthCredentials {
  accessToken: string;
  refreshToken?: string;
  apiKey?: string;
  expiresAt?: number;
}

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  organization?: string;
  roles: string[];
}

// ── Unified Config ────────────────────────────────────────────────
export interface CSOAIConfig {
  baseUrl: string;
  auth?: AuthCredentials;
  vertical?: string; // e.g. "safetyofai", "pokerhud"
  timeouts?: {
    api?: number;
    mcp?: number;
    a2a?: number;
    p2p?: number;
  };
  enableP2P?: boolean;
}

// ── MCP ───────────────────────────────────────────────────────────
export interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface MCPToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

export interface MCPResource {
  uri: string;
  name: string;
  mimeType?: string;
}

export interface MCPClientOptions {
  serverUrl: string;
  transport?: 'sse' | 'websocket';
  headers?: Record<string, string>;
}

// ── A2A ───────────────────────────────────────────────────────────
export interface A2AAgentCard {
  name: string;
  description: string;
  url: string;
  provider?: {
    organization: string;
    url: string;
  };
  version: string;
  authentication?: {
    schemes: string[];
  };
  defaultInputModes?: string[];
  defaultOutputModes?: string[];
  capabilities?: {
    streaming?: boolean;
    pushNotifications?: boolean;
  };
  skills: A2ASkill[];
}

export interface A2ASkill {
  id: string;
  name: string;
  description: string;
  tags?: string[];
  examples?: string[];
}

export interface A2ATask {
  id: string;
  status: 'submitted' | 'working' | 'input-required' | 'completed' | 'canceled' | 'failed';
  messages: A2AMessage[];
  artifacts?: A2AArtifact[];
}

export interface A2AMessage {
  role: 'user' | 'agent';
  parts: A2APart[];
}

export interface A2APart {
  type: 'text' | 'file' | 'data';
  text?: string;
  file?: { name?: string; mimeType?: string; bytes?: string; uri?: string };
  data?: Record<string, unknown>;
}

export interface A2AArtifact {
  name: string;
  parts: A2APart[];
  metadata?: Record<string, unknown>;
}

// ── ACP ───────────────────────────────────────────────────────────
export interface ACPMessage {
  id: string;
  from: string;
  to: string;
  type: 'request' | 'response' | 'event';
  payload: Record<string, unknown>;
  timestamp: number;
  signature?: string;
}

export interface ACPChannel {
  id: string;
  participants: string[];
  topic?: string;
  createdAt: number;
}

// ── libp2p ────────────────────────────────────────────────────────
export interface P2PNodeConfig {
  bootstrapPeers?: string[];
  listenAddresses?: string[];
  autoDial?: boolean;
}

export interface P2PMessage {
  topic: string;
  data: Uint8Array;
  from: string;
}

// ── ABCI ──────────────────────────────────────────────────────────
export interface ABCIQueryRequest {
  path: string;
  data?: Uint8Array;
  height?: number;
  prove?: boolean;
}

export interface ABCIQueryResponse {
  key: Uint8Array;
  value: Uint8Array;
  height: number;
  proof?: unknown;
}

// ── API ───────────────────────────────────────────────────────────
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    requestId: string;
    timestamp: string;
  };
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}
