export interface DeliberationRequest {
  query: string;
  context?: string;
  models?: string[];
  consensus_threshold?: number;
}

export interface DeliberationResult {
  decision_id: string;
  consensus_reached: boolean;
  majority_decision: string;
  majority_count: number;
  models_consulted: number;
  attestation: string;
  escalation?: any;
  responses: any[];
}

export class CouncilBFTClient {
  private baseUrl: string;
  private token?: string;

  constructor(baseUrl: string, token?: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.token = token;
  }

  private async fetch(path: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
    const resp = await fetch(url, { ...options, headers });
    if (!resp.ok) throw new Error(`Council API error: ${resp.status} ${resp.statusText}`);
    return resp.json();
  }

  async deliberate(req: DeliberationRequest): Promise<DeliberationResult> {
    return this.fetch('/v1/council/deliberate', { method: 'POST', body: JSON.stringify(req) });
  }

  async verifyAttestation(decisionId: string, attestation: string): Promise<any> {
    return this.fetch('/v1/council/verify', {
      method: 'POST',
      body: JSON.stringify({ decision_id: decisionId, attestation }),
    });
  }

  async history(limit: number = 50): Promise<any> {
    return this.fetch(`/v1/council/history?limit=${limit}`);
  }
}
