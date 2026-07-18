export interface CharacterCreate {
  character_name: string;
  archetype: string;
  personality_dna: Record<string, number>;
  backstory: string[];
  domains: string[];
  creator_id: string;
}

export interface WorldCreate {
  world_name: string;
  world_type: 'town' | 'enterprise' | 'game' | 'social';
  spatial_bounds: Record<string, any>;
  rules: string[];
}

export class HatchClient {
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
    if (!resp.ok) throw new Error(`Hatch API error: ${resp.status} ${resp.statusText}`);
    return resp.json();
  }

  async createCharacter(char: CharacterCreate): Promise<any> {
    return this.fetch('/v1/hatch/characters', { method: 'POST', body: JSON.stringify(char) });
  }

  async getCharacter(characterId: string): Promise<any> {
    return this.fetch(`/v1/hatch/characters/${characterId}`);
  }

  async interact(characterId: string, eventType: string, payload: Record<string, any>): Promise<any> {
    return this.fetch(`/v1/hatch/characters/${characterId}/interact`, {
      method: 'POST',
      body: JSON.stringify({ character_id: characterId, event_type: eventType, payload }),
    });
  }

  async exportToElizaOS(characterId: string): Promise<any> {
    return this.fetch(`/v1/hatch/characters/${characterId}/export/elizaos`, { method: 'POST' });
  }

  async createWorld(world: WorldCreate): Promise<any> {
    return this.fetch('/v1/hatch/worlds', { method: 'POST', body: JSON.stringify(world) });
  }

  async getWorld(worldId: string): Promise<any> {
    return this.fetch(`/v1/hatch/worlds/${worldId}`);
  }

  async joinWorld(worldId: string, characterId: string): Promise<any> {
    return this.fetch(`/v1/hatch/worlds/${worldId}/join`, {
      method: 'POST',
      body: JSON.stringify({ character_id: characterId }),
    });
  }

  async stats(): Promise<any> {
    return this.fetch('/v1/hatch/stats');
  }
}
