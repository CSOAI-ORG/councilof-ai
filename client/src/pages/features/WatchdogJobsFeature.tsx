import { Redirect } from "wouter";

/**
 * /features/watchdog-jobs Function already 308s; this stops SPA hydrate from selling jobs.
 * The public door is Council OS Home. Deep-link stays ?lobby= &task=.
 */
export default function WatchdogJobsFeature() {
  return <Redirect to="/?lobby=home" />;
}
