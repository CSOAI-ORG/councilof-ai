import { Redirect } from "wouter";

/**
 * /watchdog-map used to sell leftover heatmap/report marketing.
 * The public door is Council OS Home. Deep-link stays ?lobby= &task=.
 */
export default function WatchdogMap() {
  // Direct to the incident pane — a watchdog door that opened the overview left the reader one click short.
  return <Redirect to="/dashboard?tab=watchdog" />;
}
