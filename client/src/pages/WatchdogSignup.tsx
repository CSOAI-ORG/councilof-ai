import { Redirect } from "wouter";

/**
 * /watchdog-signup Function already 308s; this stops SPA hydrate from selling it.
 * The public door is Council OS Home. Deep-link stays ?lobby= &task=.
 */
export default function WatchdogSignup() {
  return <Redirect to="/dashboard?tab=home" />;
}
