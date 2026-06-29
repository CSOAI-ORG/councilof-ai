/**
 * csoai-mcp-sdk.ts - The 3-line TypeScript SDK for the 619 CSOAI MCPs.
 *
 * Usage (3 lines):
 *   import { CSOAIClient } from "@csgoai/mcp-sdk";
 *   const client = new CSOAIClient({ baseUrl: "https://mcp-bridge.herokuapp.com" });
 *   const result = await client.call("eu-ai-act-compliance-mcp", "audit_article_50", { system_description: "..." });
 *
 * Compatible with: Node.js 18+, Deno, Bun, Cloudflare Workers, Deno Deploy
 * License: MIT
 */

export interface CSOAIClientOptions {
  baseUrl?: string;
  token?: string;
  timeout?: number;
  retries?: number;
  fetch?: typeof fetch;
}

export interface McpInfo {
  name: string;
  description: string;
  tools: string[];
  tier?: "first_class" | "production";
  license?: string;
  category?: string;
}

export interface McpCategory {
  name: string;
  description: string;
  count: number;
}

export interface McpCallResult<T = any> {
  output: T;
  attestation: {
    mcp: string;
    tool: string;
    input_hash: string;
    output_hash: string;
    signed_by: string;
    signed_at: string;
    verify_url: string;
  };
}

export class CSOIClient {
  private baseUrl: string;
  private token: string;
  private timeout: number;
  private retries: number;
  private fetchFn: typeof fetch;

  constructor(options: CSOAIClientOptions = {}) {
    this.baseUrl = (options.baseUrl || "https://mcp-bridge.herokuapp.com").replace(/\/$/, "");
    this.token = options.token || "";
    this.timeout = options.timeout ?? 30000;
    this.retries = options.retries ?? 3;
    this.fetchFn = options.fetch || (typeof fetch !== "undefined" ? fetch : (() => {
      throw new Error("No fetch implementation available. Use Node.js 18+ or pass options.fetch.");
    })());
  }

  private async request<T = any>(path: string, method: string = "GET", body?: any): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (this.token) headers["Authorization"] = `Bearer ${this.token}`;

    for (let attempt = 0; attempt < this.retries; attempt++) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.timeout);
        const res = await this.fetchFn(url, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });
        clearTimeout(timer);
        if (!res.ok) {
          if (res.status >= 500 && attempt < this.retries - 1) continue;
          throw new Error(`HTTP ${res.status}: ${await res.text()}`);
        }
        return await res.json() as T;
      } catch (e) {
        if (attempt === this.retries - 1) throw e;
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
    throw new Error("Unreachable");
  }

  async health(): Promise<{ status: string; mcps: number; tools: number; first_class_mcps: number; production_mcps: number; categories: number; timestamp: string }> {
    return this.request("/health");
  }

  async listMcps(opts: { category?: string; tier?: "first_class" | "production" } = {}): Promise<{ mcps: McpInfo[]; total: number; first_class: number; production: number }> {
    const data = await this.request<{ mcps: McpInfo[]; total: number; first_class: number; production: number }>("/mcp/list");
    let mcps = data.mcps;
    if (opts.category) mcps = mcps.filter((m) => m.category === opts.category);
    if (opts.tier) mcps = mcps.filter((m) => m.tier === opts.tier);
    return { ...data, mcps };
  }

  async listCategories(): Promise<{ categories: McpCategory[]; total_categories: number }> {
    return this.request("/mcp/categories");
  }

  async marketplace(): Promise<any> {
    return this.request("/mcp/marketplace");
  }

  async search(query: string): Promise<McpInfo[]> {
    const data = await this.listMcps();
    const q = query.toLowerCase();
    return data.mcps.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        (m.category || "").toLowerCase().includes(q)
    );
  }

  async getMcp(name: string): Promise<McpInfo | undefined> {
    const data = await this.listMcps();
    return data.mcps.find((m) => m.name === name);
  }

  async call<T = any>(mcpName: string, toolName: string, input: Record<string, any> = {}): Promise<McpCallResult<T>> {
    return this.request<McpCallResult<T>>(`/mcp/${mcpName}/${toolName}`, "POST", { tool: toolName, input });
  }
}

// Convenience: synchronous-style helpers
export async function health(baseUrl?: string): Promise<any> {
  return new CSOAIClient({ baseUrl }).health();
}
export async function listMcps(baseUrl?: string): Promise<any> {
  return new CSOAIClient({ baseUrl }).listMcps();
}
export async function search(query: string, baseUrl?: string): Promise<McpInfo[]> {
  return new CSOAIClient({ baseUrl }).search(query);
}
export async function call(mcp: string, tool: string, input: any = {}, baseUrl?: string): Promise<any> {
  return new CSOAIClient({ baseUrl }).call(mcp, tool, input);
}

export default CSOAIClient;
