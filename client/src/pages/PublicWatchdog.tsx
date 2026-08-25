import { Redirect } from "wouter";

/**
 * /public-watchdog used to sell leftover community-watchdog marketing.
 * The public door is Council OS Home. Deep-link stays ?lobby= &task=.
 */
export default function PublicWatchdog() {
  return <Redirect to="/?lobby=home" />;
}
