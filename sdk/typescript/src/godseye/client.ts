export class GodsEyeClient {
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
    if (!resp.ok) throw new Error(`GodsEye API error: ${resp.status} ${resp.statusText}`);
    return resp.json();
  }

  async health(): Promise<any> {
    return this.fetch('/v1/gods-eye/health');
  }

  async dashboard(): Promise<any> {
    return this.fetch('/v1/gods-eye/dashboard');
  }

  async ingestLog(source: string, level: string, message: string, metadata?: Record<string, any>): Promise<any> {
    return this.fetch('/v1/gods-eye/telemetry/log', {
      method: 'POST',
      body: JSON.stringify({ source, level, message, metadata }),
    });
  }

  async ingestMetric(name: string, value: number, labels?: Record<string, any>): Promise<any> {
    return this.fetch('/v1/gods-eye/telemetry/metric', {
      method: 'POST',
      body: JSON.stringify({ name, value, labels }),
    });
  }

  async queryLogs(source?: string, level?: string, limit: number = 100): Promise<any> {
    const qs = new URLSearchParams();
    if (source) qs.set('source', source);
    if (level) qs.set('level', level);
    qs.set('limit', String(limit));
    return this.fetch(`/v1/gods-eye/telemetry/logs?${qs.toString()}`);
  }

  async submitThreatIntel(threatType: string, severity: string, description: string, source?: string, indicators?: string[]): Promise<any> {
    return this.fetch('/v1/gods-eye/threat-intel', {
      method: 'POST',
      body: JSON.stringify({ threat_type: threatType, severity, description, source, indicators }),
    });
  }

  async scannerStatus(): Promise<any> {
    return this.fetch('/v1/gods-eye/scanner/status');
  }
}
