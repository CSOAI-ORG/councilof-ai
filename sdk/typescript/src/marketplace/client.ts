/**
 * Marketplace Client
 * Buy, sell, and trade MEOK character configurations.
 */

export interface CharacterListing {
  seller_id: string;
  character_id: string;
  character_name: string;
  description: string;
  price_usd: number;
  trust_tier_required?: string;
  jurisdictions?: string[];
  aibom_hash?: string;
  metadata?: Record<string, any>;
}

export interface PurchaseRequest {
  buyer_id: string;
  listing_id: string;
  payment_method?: string;
}

export class MarketplaceClient {
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
      throw new Error(`Marketplace API error: ${resp.status} ${resp.statusText}`);
    }
    return resp.json();
  }

  async listListings(filters?: {
    status?: string;
    min_tier?: string;
    jurisdiction?: string;
    max_price?: number;
  }): Promise<any> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.min_tier) params.append('min_tier', filters.min_tier);
    if (filters?.jurisdiction) params.append('jurisdiction', filters.jurisdiction);
    if (filters?.max_price) params.append('max_price', String(filters.max_price));
    return this.fetch(`/v1/marketplace/listings?${params.toString()}`);
  }

  async getListing(listingId: string): Promise<any> {
    return this.fetch(`/v1/marketplace/listings/${listingId}`);
  }

  async createListing(listing: CharacterListing): Promise<any> {
    return this.fetch('/v1/marketplace/listings', {
      method: 'POST',
      body: JSON.stringify(listing),
    });
  }

  async purchase(req: PurchaseRequest): Promise<any> {
    return this.fetch('/v1/marketplace/purchase', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  }

  async transactions(limit: number = 50, offset: number = 0): Promise<any> {
    return this.fetch(`/v1/marketplace/transactions?limit=${limit}&offset=${offset}`);
  }

  async stats(): Promise<any> {
    return this.fetch('/v1/marketplace/stats');
  }

  async withdraw(listingId: string, sellerId: string): Promise<any> {
    return this.fetch(`/v1/marketplace/listings/${listingId}?seller_id=${sellerId}`, {
      method: 'DELETE',
    });
  }
}
