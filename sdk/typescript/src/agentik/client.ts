export interface ValidationResult {
  valid: boolean;
  spec: string;
  findings: string[];
}

export class AgentikClient {
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
    if (!resp.ok) throw new Error(`Agentik API error: ${resp.status} ${resp.statusText}`);
    return resp.json();
  }

  async validate(input: string, spec?: string): Promise<ValidationResult> {
    return this.fetch('/v1/agentik/validate', {
      method: 'POST',
      body: JSON.stringify({ input, spec }),
    });
  }

  async status(): Promise<any> {
    return this.fetch('/v1/agentik/status');
  }

  async compliance(jurisdiction: string): Promise<any> {
    return this.fetch(`/v1/agentik/compliance/${jurisdiction}`);
  }
}
