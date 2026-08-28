import { Redirect } from "wouter";

/**
 * /government — public door is Council OS Ask (regulator brief).
 * Deep-link seeds Ask (consent lock); never auto-sends.
 * Static brief: /regulator-indices-one-pager.html (+ .pdf).
 */
export default function GovernmentDashboard() {
  return <Redirect to="/os?lobby=assess&task=regulator-brief" />;
}
