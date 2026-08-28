import { Redirect } from "wouter";

/**
 * /enterprise — public door is Council OS Get measured.
 * Deep-link seeds Ask (consent lock); never auto-sends.
 */
export default function Enterprise() {
  return <Redirect to="/os?lobby=assess&task=enterprise-start" />;
}
