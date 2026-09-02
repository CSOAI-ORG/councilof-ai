import { Redirect } from "wouter";

/**
 * /public-watchdog used to sell leftover community-watchdog marketing.
 * The public door is Council OS Home. Deep-link stays ?lobby= &task=.
 */
export default function PublicWatchdog() {
  // Direct to the incident pane — a watchdog door that opened the overview left the reader one click short.
  return <Redirect to="/dashboard?tab=watchdog" />;
}
