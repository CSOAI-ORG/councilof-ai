import { Redirect } from "wouter";

/**
 * /jobs used to sell leftover analyst-job listings and earnings.
 * The public door is Council OS Home. Deep-link stays ?lobby= &task=.
 */
export default function Jobs() {
  return <Redirect to="/?lobby=home" />;
}
