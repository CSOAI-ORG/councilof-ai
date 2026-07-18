/**
 * CSOAI Auth Client
 * JWT + API key management for all verticals
 */
import { AuthCredentials, UserProfile } from './types';

export class AuthClient {
  private baseUrl: string;
  private credentials: AuthCredentials | null = null;
  private refreshTimer?: ReturnType<typeof setTimeout>;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  setCredentials(creds: AuthCredentials): void {
    this.credentials = creds;
    if (creds.expiresAt) {
      const msUntilExpiry = creds.expiresAt * 1000 - Date.now();
      const refreshAt = Math.max(msUntilExpiry - 60000, 0);
      this.refreshTimer = setTimeout(() => this.refresh(), refreshAt);
    }
  }

  getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.credentials?.accessToken) {
      headers['Authorization'] = `Bearer ${this.credentials.accessToken}`;
    }
    if (this.credentials?.apiKey) {
      headers['X-API-Key'] = this.credentials.apiKey;
    }
    return headers;
  }

  getToken(): string | undefined {
    return this.credentials?.accessToken;
  }

  async login(email: string, password: string): Promise<AuthCredentials> {
    const res = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error(`Login failed: ${res.status}`);
    const data = await res.json();
    this.setCredentials(data);
    return data;
  }

  async refresh(): Promise<AuthCredentials> {
    if (!this.credentials?.refreshToken) throw new Error('No refresh token');
    const res = await fetch(`${this.baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: this.credentials.refreshToken }),
    });
    if (!res.ok) throw new Error(`Refresh failed: ${res.status}`);
    const data = await res.json();
    this.setCredentials(data);
    return data;
  }

  async me(): Promise<UserProfile> {
    const res = await fetch(`${this.baseUrl}/auth/me`, {
      headers: this.getAuthHeaders(),
    });
    if (!res.ok) throw new Error(`Profile fetch failed: ${res.status}`);
    return res.json();
  }

  async createApiKey(name: string): Promise<{ key: string; id: string }> {
    const res = await fetch(`${this.baseUrl}/auth/api-keys`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error(`API key creation failed: ${res.status}`);
    return res.json();
  }

  logout(): void {
    this.credentials = null;
    if (this.refreshTimer) clearTimeout(this.refreshTimer);
  }
}
