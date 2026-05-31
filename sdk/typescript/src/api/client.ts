/**
 * CSOAI Unified REST API Client
 * Wraps all backend endpoints with typed responses
 */
import { AuthClient } from '../auth';
import { APIResponse, PaginatedResponse, CSOAIConfig } from '../types';

export class APIClient {
  private baseUrl: string;
  private auth: AuthClient;
  private requestId = 0;

  constructor(config: CSOAIConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.auth = new AuthClient(this.baseUrl);
    if (config.auth) this.auth.setCredentials(config.auth);
  }

  getAuth(): AuthClient {
    return this.auth;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    params?: Record<string, string>
  ): Promise<APIResponse<T>> {
    const url = new URL(path, this.baseUrl);
    if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

    const headers = this.auth.getAuthHeaders();
    const reqId = `req_${++this.requestId}_${Date.now()}`;

    const res = await fetch(url.toString(), {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const json = await res.json().catch(() => ({}));
    return {
      success: res.ok,
      data: res.ok ? json : undefined,
      error: res.ok ? undefined : { code: `http_${res.status}`, message: json.detail || res.statusText },
      meta: { requestId: reqId, timestamp: new Date().toISOString() },
    };
  }

  // ── Generic CRUD ──────────────────────────────────────────────
  get<T>(path: string, params?: Record<string, string>): Promise<APIResponse<T>> {
    return this.request<T>('GET', path, undefined, params);
  }
  post<T>(path: string, body?: unknown): Promise<APIResponse<T>> {
    return this.request<T>('POST', path, body);
  }
  put<T>(path: string, body?: unknown): Promise<APIResponse<T>> {
    return this.request<T>('PUT', path, body);
  }
  delete<T>(path: string): Promise<APIResponse<T>> {
    return this.request<T>('DELETE', path);
  }

  // ── Vertical-specific endpoints ───────────────────────────────
  async getVerticalTools(vertical: string): Promise<APIResponse<{ tools: unknown[] }>> {
    return this.get(`/v1/verticals/${vertical}/tools`);
  }

  async executeTool(vertical: string, tool: string, args: Record<string, unknown>): Promise<APIResponse<unknown>> {
    return this.post(`/v1/verticals/${vertical}/tools/${tool}`, args);
  }

  async getTrustRegistry(entityId: string): Promise<APIResponse<unknown>> {
    return this.get(`/v1/trust-registry/${entityId}`);
  }
}
