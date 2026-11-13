// Eligibility for the historical brain checks in claims-e2e.mjs. A health response
// from another service (including the current HIM edge) does not establish that
// the brain-specific MCP and signing contracts can be exercised at this origin.
// docs/DEMO_READINESS.md records the service identity for those checks.
const BRAIN_SERVICE = "sovereign-backend";

// /sov3-system-card redirects to the current canonical /council-system-card page.
// Keep this specific: the generic application title must still fail the check.
export const SYSTEM_CARD_TITLE = /^Council system card \| Council of AI$/i;

export async function probeBrainHealth(base, fetchImpl = fetch) {
  const url = base + "/health";
  try {
    const response = await fetchImpl(url, { headers: { accept: "application/json" } });
    if (!response.ok) {
      return { up: false, why: `${url} answers HTTP ${response.status}; brain health could not be established` };
    }
    const type = (response.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
    if (type !== "application/json" && !/^application\/[^\s]+\+json$/.test(type)) {
      return { up: false, why: `${url} answers ${type || "without a content-type"}; expected JSON brain health` };
    }
    let health;
    try {
      health = await response.json();
    } catch {
      return { up: false, why: `${url} did not return valid JSON brain health` };
    }
    if (!health || Array.isArray(health) || typeof health !== "object" ||
        health.ok !== true || health.service !== BRAIN_SERVICE) {
      return { up: false, why: `${url} did not identify a healthy ${BRAIN_SERVICE}; brain-specific claims were not probed` };
    }
    return { up: true, health };
  } catch (error) {
    return { up: false, why: `${url} unreachable: ${error.message}` };
  }
}
