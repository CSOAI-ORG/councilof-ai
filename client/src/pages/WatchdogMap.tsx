import { Redirect } from "wouter";

/**
 * /watchdog-map used to sell leftover heatmap/report marketing.
 * The public door is Council OS Home. Deep-link stays ?lobby= &task=.
 */
export default function WatchdogMap() {
  return <Redirect to="/os?lobby=home" />;
}
