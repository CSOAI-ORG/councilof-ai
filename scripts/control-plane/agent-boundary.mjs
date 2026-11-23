// SPDX-License-Identifier: MIT
// Trace-based advisory detection. This cannot read private model reasoning, identify
// every steganographic channel, enforce network isolation, or stop an agent itself.
export function observeAgentBoundaries(events, policy) {
  if (!Array.isArray(events) || !policy || !Array.isArray(policy.allowedAgentEdges) ||
      !Array.isArray(policy.allowedTools) || !Array.isArray(policy.allowedEgressHosts))
    throw new Error("explicit event trace and permission policy required");
  const edges = new Set(policy.allowedAgentEdges.map(e => {
    if (!Array.isArray(e) || e.length !== 2 || e.some(s => typeof s !== "string" || !s))
      throw new Error("invalid edge");
    return JSON.stringify(e);
  }));
  const tools = new Set(policy.allowedTools);
  const hosts = new Set(policy.allowedEgressHosts);
  const findings = [];
  const add = (index, type, detail) => findings.push({
    event_index:index, type, detail, verification:"OBSERVED_TRACE_ONLY", outcome:"REVIEW_OR_ENFORCE_AT_BOUNDARY",
  });
  events.forEach((e, index) => {
    if (!e || typeof e !== "object" || typeof e.actor !== "string") throw new Error("invalid trace event");
    if (e.action === "agent_message") {
      if (typeof e.target !== "string" || !edges.has(JSON.stringify([e.actor,e.target])))
        add(index,"UNAUTHORISED_INTER_AGENT_EDGE", "Sender/recipient pair is not allowed by policy");
    } else if (e.action === "tool_call") {
      if (typeof e.target !== "string" || !tools.has(e.target))
        add(index,"UNAPPROVED_TOOL_CALL", "Tool is not allowlisted");
    } else if (e.action === "network_egress") {
      let host=null;
      try {
        const url=new URL(e.target);
        if (url.protocol==="https:" && !url.username && !url.password) host=url.hostname.toLowerCase();
      } catch {}
      if (!host || !hosts.has(host)) add(index,"UNAUTHORISED_EGRESS", "Host or protocol is not allowed");
    } else if (e.action === "authority_effect") {
      if (e.authorisation_state !== "VERIFIED_BY_ENFORCER")
        add(index,"UNVERIFIED_AUTHORITY", "A claimed human or delegated approval is not verified by an enforcement boundary");
    }
    // Encoded and high-entropy content is not evidence of covert messaging.
    // Do not label content suspicious solely on its appearance.
  });
  return {
    schema:"csoai.agent-boundary-observation/0.1",
    state:findings.length?"REVIEW_CANDIDATES":"NO_POLICY_BREACH_OBSERVED",
    enforcement:"NOT_CONNECTED_ADVISORY_ONLY",
    hidden_reasoning_visibility:"NONE",
    findings,
    limitations:[
      "No policy violation observed is not proof of no collusion or covert channel.",
      "This reads supplied trace events only. Missing or forged events cannot be detected here.",
      "A secure kill switch needs separately implemented tool/network gating and revocation acknowledgements.",
      "Human or working-group notification is not performed.",
    ],
  };
}
