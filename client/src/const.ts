import { useEffect } from "react";
export { COOKIE_NAME, ONE_YEAR_MS } from "./shared-const";

// Generate login URL at runtime so redirect URI reflects the current origin.
// Optional returnTo parameter allows redirecting back to original page after login.
export const getLoginUrl = (returnTo?: string) => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  
  // Build redirect URI with optional return_to parameter
  let redirectUri = `${window.location.origin}/api/oauth/callback`;
  if (returnTo) {
    // Encode the return path to pass through OAuth flow
    redirectUri += `?return_to=${encodeURIComponent(returnTo)}`;
  }
  
  const state = btoa(redirectUri);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};

// Helper to get login URL that returns to current page
export const getLoginUrlWithReturn = () => {
  const currentPath = window.location.pathname + window.location.search;
  return getLoginUrl(currentPath);
};
