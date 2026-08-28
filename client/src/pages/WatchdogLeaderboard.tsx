import { Redirect } from "wouter";

/**
 * /watchdog-leaderboard used to sell leftover analyst rankings.
 * The public door is Council OS Home. Deep-link stays ?lobby= &task=.
 */
export default function WatchdogLeaderboard() {
  return <Redirect to="/os?lobby=home" />;
}
