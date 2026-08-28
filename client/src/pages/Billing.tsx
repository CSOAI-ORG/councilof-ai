import { Redirect } from "wouter";

/**
 * /settings/billing Function already 308s; this stops SPA hydrate from selling leftover Stripe tiers.
 * The public door is the measured pricing-overview lobby. Deep-link stays ?lobby= &task=.
 * No public prices. A grade is never sold.
 */
export default function Billing() {
  return <Redirect to="/os?lobby=assess&task=pricing-overview" />;
}
