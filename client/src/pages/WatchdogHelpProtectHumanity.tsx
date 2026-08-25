import { Redirect } from "wouter";

/**
 * /watchdog/help-protect-humanity used to sell leftover cert/job copy.
 * The public door is Council OS Home. Deep-link stays ?lobby= &task=.
 */
export default function WatchdogHelpProtectHumanity() {
  return <Redirect to="/?lobby=home" />;
}
