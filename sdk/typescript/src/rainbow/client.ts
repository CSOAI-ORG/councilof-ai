export interface LayerStatus {
  layer: string;
  name: string;
  description: string;
  status: string;
  tools: string[];
  meok_implementation: string;
  last_check: string;
}

export class RainbowSecurityClient {
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
    if (!resp.ok) throw new Error(`Rainbow API error: ${resp.status} ${resp.statusText}`);
    return resp.json();
  }

  async getLayer(layerCode: string): Promise<LayerStatus> {
    return this.fetch(`/v1/rainbow/layer/${layerCode}`);
  }

  async getAllLayers(): Promise<any> {
    return this.fetch('/v1/rainbow/layers');
  }

  async runAssessment(): Promise<any> {
    return this.fetch('/v1/rainbow/assess', { method: 'POST' });
  }
}
