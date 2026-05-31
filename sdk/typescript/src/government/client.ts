/**
 * Government Enforcement Client
 * Built for regulators, not lawyers.
 */

export interface SystemRegistration {
  system_name: string;
  operator_id: string;
  operator_name: string;
  jurisdictions: string[];
  risk_classification: string;
  intended_use: string;
  training_data_provenance?: string;
  aibom_hash?: string;
  contact_email: string;
}

export interface EnforcementAction {
  jurisdiction: string;
  system_id: string;
  action_type: string;
  severity: string;
  description: string;
  penalty_amount_eur?: number;
}

export class GovernmentClient {
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
      throw new Error(`Government API error: ${resp.status} ${resp.statusText}`);
    }
    return resp.json();
  }

  async registerSystem(system: SystemRegistration): Promise<any> {
    return this.fetch('/v1/government/register', {
      method: 'POST',
      body: JSON.stringify(system),
    });
  }

  async getSystem(systemId: string): Promise<any> {
    return this.fetch(`/v1/government/systems/${systemId}`);
  }

  async listSystems(filters?: {
    jurisdiction?: string;
    risk_classification?: string;
    operator_id?: string;
  }): Promise<any> {
    const params = new URLSearchParams();
    if (filters?.jurisdiction) params.append('jurisdiction', filters.jurisdiction);
    if (filters?.risk_classification) params.append('risk_classification', filters.risk_classification);
    if (filters?.operator_id) params.append('operator_id', filters.operator_id);
    return this.fetch(`/v1/government/systems?${params.toString()}`);
  }

  async complianceCheck(systemId: string, jurisdiction: string): Promise<any> {
    return this.fetch('/v1/government/compliance-check', {
      method: 'POST',
      body: JSON.stringify({ system_id: systemId, jurisdiction }),
    });
  }

  async enforce(action: EnforcementAction): Promise<any> {
    return this.fetch('/v1/government/enforce', {
      method: 'POST',
      body: JSON.stringify(action),
    });
  }

  async enforcementActions(filters?: {
    jurisdiction?: string;
    severity?: string;
  }): Promise<any> {
    const params = new URLSearchParams();
    if (filters?.jurisdiction) params.append('jurisdiction', filters.jurisdiction);
    if (filters?.severity) params.append('severity', filters.severity);
    return this.fetch(`/v1/government/enforcement-actions?${params.toString()}`);
  }

  async transparencyRegister(filters?: {
    jurisdiction?: string;
    risk_classification?: string;
  }): Promise<any> {
    const params = new URLSearchParams();
    if (filters?.jurisdiction) params.append('jurisdiction', filters.jurisdiction);
    if (filters?.risk_classification) params.append('risk_classification', filters.risk_classification);
    return this.fetch(`/v1/government/transparency-register?${params.toString()}`);
  }

  async dashboard(jurisdiction: string): Promise<any> {
    return this.fetch(`/v1/government/dashboard/${jurisdiction}`);
  }
}
