import { Redirect } from "wouter";

/**
 * /watchdog used to sell leftover analyst training, jobs, and earnings.
 * The public door is Council OS Home. Deep-link stays ?lobby= &task=.
 */
export default function Watchdog() {
  return <Redirect to="/?lobby=home" />;
}
