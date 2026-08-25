import { Redirect } from "wouter";

/**
 * /pricing Function already 308s; this stops SPA hydrate from selling leftover price copy.
 * The public door is Council OS pricing-overview. Deep-link stays ?lobby= &task=.
 * Do not type public prices here.
 */
export default function Pricing() {
  return <Redirect to="/?lobby=measured&task=pricing-overview" />;
}
