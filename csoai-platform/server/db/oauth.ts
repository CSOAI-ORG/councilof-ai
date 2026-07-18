import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions, COOKIE_NAME } from "./cookies";
import { sdk } from "./sdk";

// Session duration constants
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });

  // Logout endpoint
  app.post("/api/oauth/logout", (req: Request, res: Response) => {
    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie(COOKIE_NAME, cookieOptions);
    res.json({ success: true });
  });

  // Get current user info
  app.get("/api/oauth/me", async (req: Request, res: Response) => {
    const sessionToken = req.cookies[COOKIE_NAME];

    if (!sessionToken) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    try {
      const payload = await sdk.verifySessionToken(sessionToken);
      if (!payload || !payload.openId) {
        res.status(401).json({ error: "Invalid session" });
        return;
      }

      const user = await db.getUserByOpenId(payload.openId);
      if (!user) {
        res.status(401).json({ error: "User not found" });
        return;
      }

      res.json({ user });
    } catch (error) {
      console.error("[OAuth] Failed to get user info", error);
      res.status(401).json({ error: "Invalid session" });
    }
  });
}
