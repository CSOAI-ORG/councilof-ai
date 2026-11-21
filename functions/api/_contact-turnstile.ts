/**
 * Fail-closed contact Turnstile verification.
 * Client-rendered widgets do NOT prove validity: only a successful Siteverify
 * response for the expected host and action permits a KV write.
 */
export const CONTACT_TURNSTILE_ACTION = "contact_enquiry";
const SITEVERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export type ContactChallengeResult = "VALID" | "DENIED" | "UNAVAILABLE";

export async function verifyContactChallenge(
  token: unknown,
  secret: unknown,
  expectedHostname: string,
  fetcher: typeof fetch = fetch,
): Promise<ContactChallengeResult> {
  if (typeof secret !== "string" || !secret.trim()) return "UNAVAILABLE";
  if (typeof token !== "string" || !token.trim() || token.length > 2048) return "DENIED";
  if (!expectedHostname || expectedHostname !== expectedHostname.toLowerCase() ||
      !/^[a-z0-9][a-z0-9.-]*$/.test(expectedHostname)) return "UNAVAILABLE";

  const payload = new URLSearchParams({ secret, response: token });
  try {
    const response = await fetcher(SITEVERIFY, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: payload.toString(),
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return "UNAVAILABLE";
    const verified: unknown = await response.json();
    if (!verified || typeof verified !== "object" || Array.isArray(verified)) return "UNAVAILABLE";
    const data = verified as Record<string, unknown>;
    if (data.success !== true) return "DENIED";
    return data.hostname === expectedHostname && data.action === CONTACT_TURNSTILE_ACTION
      ? "VALID" : "DENIED";
  } catch {
    // Do not write a contact record after a network or parse failure.
    return "UNAVAILABLE";
  }
}
