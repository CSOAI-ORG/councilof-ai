import { Redirect } from "wouter";

/**
 * /enterprise used to sell certification, remediation, and subscription tiers.
 * The public door is Council OS Get measured. Deep-link stays ?lobby= &task=.
 */
export default function Enterprise() {
  return <Redirect to="/os?lobby=assess&task=enterprise-start" />;
}
