import { Redirect } from "wouter";

/** Retracted 33-seat guarantee. Function 308s this path; SPA hydrate must not remount the old page. */
export default function AgentCouncilFeature() {
  return <Redirect to="/honesty/" />;
}
