import { Redirect } from "wouter";

/**
 * /watchdog/incident used to sell leftover incident-report marketing.
 * The public door is Council OS Home. Deep-link stays ?lobby= &task=.
 */
export default function WatchdogIncidentReport() {
  return <Redirect to="/?lobby=home" />;
}
