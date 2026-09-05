import { Redirect } from "wouter";

/** Retracted 33-seat guarantee. SPA hydrate must not remount the old page. */
export default function AgentCouncil() {
  return <Redirect to="/honesty/" />;
}
