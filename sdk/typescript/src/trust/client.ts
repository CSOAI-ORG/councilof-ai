/**
 * Trust Layer Client
 * ArkForge-style trust scoring for MEOK characters and entities.
 */

export interface TrustScore {
  entity_id: string;
  composite_score: number;
  tier: string;
  dimensions: Record<string, number>;
  weights: Record<string, number>;
  computed_at: string;
  history_length: number;
}

export interface TrustAttestation {
  entity_id: string;
  attestation_type: string;
  payload: Record<string, any>;
  signature?: string;
}

export class TrustClient {
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
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    const resp = await fetch(url, { ...options, headers });
    if (!resp.ok) {
      throw new Error(`Trust API error: ${resp.status} ${resp.statusText}`);
    }
    return resp.json();
  }

  async getScore(entityId: string): Promise<TrustScore> {
    return this.fetch(`/v1/trust/score/${entityId}`);
  }

  async computeScore(entityId: string, dimensions?: Record<string, number>): Promise<TrustScore> {
    return this.fetch(`/v1/trust/score/${entityId}/compute`, {
      method: 'POST',
      body: JSON.stringify({ entity_id: entityId, dimensions }),
    });
  }

  async attest(attestation: TrustAttestation): Promise<any> {
    return this.fetch('/v1/trust/attest', {
      method: 'POST',
      body: JSON.stringify(attestation),
    });
  }

  async certify(entityId: string, jurisdictions: string[]): Promise<any> {
    return this.fetch(`/v1/trust/certify/${entityId}`, {
      method: 'POST',
      body: JSON.stringify(jurisdictions),
    });
  }

  async leaderboard(limit: number = 20): Promise<any> {
    return this.fetch(`/v1/trust/leaderboard?limit=${limit}`);
  }

  async listByTier(tier: string): Promise<any> {
    return this.fetch(`/v1/trust/tier/${tier}`);
  }

  async health(): Promise<any> {
    return this.fetch('/v1/trust/health');
  }
}
