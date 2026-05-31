/**
 * Enterprise Characters Client
 * Branded AI assistants with built-in compliance for enterprise customers.
 */

export interface EnterpriseTenant {
  tenant_id: string;
  org_name: string;
  contact_email: string;
  primary_jurisdiction: string;
  allowed_jurisdictions: string[];
  tier: string;
  branding?: Record<string, string>;
  character_limit: number;
  monthly_price_usd: number;
}

export interface EnterpriseCharacter {
  character_id: string;
  tenant_id: string;
  character_name: string;
  archetype: string;
  description: string;
  allowed_domains: string[];
  assti_minimum: number;
  jurisdictions: string[];
  status: string;
  metadata?: Record<string, any>;
}

export class EnterpriseClient {
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
      throw new Error(`Enterprise API error: ${resp.status} ${resp.statusText}`);
    }
    return resp.json();
  }

  async createTenant(tenant: Omit<EnterpriseTenant, 'tenant_id' | 'character_limit' | 'monthly_price_usd'>): Promise<EnterpriseTenant> {
    return this.fetch('/v1/enterprise/tenants', {
      method: 'POST',
      body: JSON.stringify(tenant),
    });
  }

  async getTenant(tenantId: string): Promise<EnterpriseTenant> {
    return this.fetch(`/v1/enterprise/tenants/${tenantId}`);
  }

  async createCharacter(character: Omit<EnterpriseCharacter, 'character_id' | 'status'>): Promise<EnterpriseCharacter> {
    return this.fetch('/v1/enterprise/characters', {
      method: 'POST',
      body: JSON.stringify(character),
    });
  }

  async getCharacter(characterId: string): Promise<EnterpriseCharacter> {
    return this.fetch(`/v1/enterprise/characters/${characterId}`);
  }

  async listTenantCharacters(tenantId: string): Promise<{ characters: EnterpriseCharacter[]; count: number }> {
    return this.fetch(`/v1/enterprise/tenants/${tenantId}/characters`);
  }

  async deploy(characterId: string, targetJurisdictions: string[], environment: string = 'production'): Promise<any> {
    return this.fetch('/v1/enterprise/deploy', {
      method: 'POST',
      body: JSON.stringify({ character_id: characterId, target_jurisdictions: targetJurisdictions, environment }),
    });
  }

  async auditTrail(tenantId: string): Promise<any> {
    return this.fetch(`/v1/enterprise/tenants/${tenantId}/audit-trail`);
  }

  async pricing(): Promise<any> {
    return this.fetch('/v1/enterprise/pricing');
  }
}
