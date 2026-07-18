/**
 * OAuth SDK for CSOAI Platform
 * Handles token exchange and user info retrieval
 */

import * as jose from "jose";

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || "csoai-dev-secret-key-change-in-production";
const JWT_ALGORITHM = "HS256";
const JWT_ISSUER = "csoai";

// OAuth provider configuration (placeholder for actual OAuth integration)
const OAUTH_CLIENT_ID = process.env.OAUTH_CLIENT_ID || "";
const OAUTH_CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET || "";
const OAUTH_REDIRECT_URI = process.env.OAUTH_REDIRECT_URI || "http://localhost:3001/api/oauth/callback";

interface TokenResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType: string;
}

interface UserInfo {
  openId: string;
  email?: string;
  name?: string;
  picture?: string;
  loginMethod?: string;
  platform?: string;
}

interface SessionTokenOptions {
  name: string;
  expiresInMs: number;
}

/**
 * SDK for OAuth operations
 */
export const sdk = {
  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string, state: string): Promise<TokenResponse> {
    // In development/demo mode, simulate token exchange
    if (!OAUTH_CLIENT_ID || !OAUTH_CLIENT_SECRET) {
      console.log("[SDK] OAuth not configured, simulating token exchange");
      return {
        accessToken: `demo_access_${Date.now()}`,
        tokenType: "Bearer",
        expiresIn: 3600,
      };
    }

    // Actual OAuth token exchange would happen here
    // This is a placeholder for integrating with providers like Google, GitHub, etc.
    throw new Error("OAuth provider not configured");
  },

  /**
   * Get user info from access token
   */
  async getUserInfo(accessToken: string): Promise<UserInfo> {
    // In development/demo mode, return mock user info
    if (accessToken.startsWith("demo_access_")) {
      return {
        openId: `demo_user_${Date.now()}`,
        email: "demo@csoai.com",
        name: "Demo User",
        loginMethod: "demo",
        platform: "web",
      };
    }

    // Actual user info retrieval would happen here
    throw new Error("OAuth provider not configured");
  },

  /**
   * Create a session token (JWT)
   */
  async createSessionToken(openId: string, options: SessionTokenOptions): Promise<string> {
    const secret = new TextEncoder().encode(JWT_SECRET);

    const token = await new jose.SignJWT({
      openId,
      name: options.name,
    })
      .setProtectedHeader({ alg: JWT_ALGORITHM })
      .setIssuer(JWT_ISSUER)
      .setIssuedAt()
      .setExpirationTime(Math.floor((Date.now() + options.expiresInMs) / 1000))
      .sign(secret);

    return token;
  },

  /**
   * Verify a session token
   */
  async verifySessionToken(token: string): Promise<{ openId: string; name?: string } | null> {
    try {
      const secret = new TextEncoder().encode(JWT_SECRET);
      const { payload } = await jose.jwtVerify(token, secret, {
        issuer: JWT_ISSUER,
      });

      return {
        openId: payload.openId as string,
        name: payload.name as string | undefined,
      };
    } catch (error) {
      console.error("[SDK] Token verification failed:", error);
      return null;
    }
  },

  /**
   * Get OAuth authorization URL
   */
  getAuthorizationUrl(provider: string, state: string): string {
    // Placeholder for OAuth authorization URLs
    const providers: Record<string, string> = {
      google: "https://accounts.google.com/o/oauth2/v2/auth",
      github: "https://github.com/login/oauth/authorize",
    };

    const baseUrl = providers[provider];
    if (!baseUrl) {
      throw new Error(`Unknown OAuth provider: ${provider}`);
    }

    const params = new URLSearchParams({
      client_id: OAUTH_CLIENT_ID,
      redirect_uri: OAUTH_REDIRECT_URI,
      response_type: "code",
      state,
      scope: provider === "google" ? "openid email profile" : "user:email",
    });

    return `${baseUrl}?${params.toString()}`;
  },
};
