export interface KillSwitchActivation {
  level: number;
  level_name?: string;
  reason: string;
  affected_agents: string[];
}

export interface KillSwitchStatus {
  active: boolean;
  current_level: number;
  level_name: string;
  activated_at?: string;
  reason?: string;
}

export class KillSwitchClient {
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
    if (!resp.ok) throw new Error(`KillSwitch API error: ${resp.status} ${resp.statusText}`);
    return resp.json();
  }

  async activate(level: number, reason: string, affectedAgents: string[] = []): Promise<any> {
    return this.fetch('/v1/killswitch/activate', {
      method: 'POST',
      body: JSON.stringify({ level, reason, affected_agents: affectedAgents }),
    });
  }

  async status(): Promise<KillSwitchStatus> {
    return this.fetch('/v1/killswitch/status');
  }

  async history(): Promise<any> {
    return this.fetch('/v1/killswitch/history');
  }

  async verify(decisionId: string, attestation: string): Promise<any> {
    return this.fetch('/v1/killswitch/verify', {
      method: 'POST',
      body: JSON.stringify({ decision_id: decisionId, attestation }),
    });
  }
}
