import { Redirect } from "wouter";

/**
 * /watchdog-hub used to sell leftover watchdog-global marketing.
 * The public door is Council OS Home. Deep-link stays ?lobby= &task=.
 */
export default function PublicWatchdogHub() {
  return <Redirect to="/?lobby=home" />;
}
