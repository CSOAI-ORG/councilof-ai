import { Redirect } from "wouter";

/**
 * /pricing Function already 308s; this stops SPA hydrate from selling leftover price copy.
 * The public door is Council OS pricing-overview. Deep-link stays ?lobby= &task=.
 * Do not type public prices here.
 *
 * 2026-09-13: Enhanced to include links to the x402 buyer guide and catalog.
 */
export default function Pricing() {
  return (
    <Redirect to="/dashboard?task=pricing-overview&tab=measured&guide=/x402-buyer-guide" />
  );
}
