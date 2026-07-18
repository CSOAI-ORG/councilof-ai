import type { Request, CookieOptions } from "express";

export const COOKIE_NAME = "csoai_session";

// Determine if we're in production
const isProduction = process.env.NODE_ENV === "production";

/**
 * Get cookie options based on request context
 */
export function getSessionCookieOptions(req: Request): CookieOptions {
  // Check if request is over HTTPS
  const isSecure = req.secure || req.headers["x-forwarded-proto"] === "https";

  return {
    httpOnly: true,
    secure: isProduction || isSecure,
    sameSite: isProduction ? "strict" : "lax",
    path: "/",
    // Domain is typically not needed for same-origin cookies
    // domain: process.env.COOKIE_DOMAIN,
  };
}

/**
 * Cookie configuration for development vs production
 */
export const cookieConfig = {
  name: COOKIE_NAME,
  options: {
    development: {
      httpOnly: true,
      secure: false,
      sameSite: "lax" as const,
      path: "/",
    },
    production: {
      httpOnly: true,
      secure: true,
      sameSite: "strict" as const,
      path: "/",
    },
  },
};
