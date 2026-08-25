import { Redirect } from "wouter";

/**
 * /products Function already 308s; this stops SPA hydrate from selling leftover billing copy.
 * The public door is Council OS enterprise-start. Deep-link stays ?lobby= &task=.
 * No public prices. A grade is never sold.
 */
export default function Products() {
  return <Redirect to="/?lobby=measured&task=enterprise-start" />;
}
