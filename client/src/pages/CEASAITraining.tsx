import { Redirect } from "wouter";

/** Retracted credential brand. Function 308s this path; SPA hydrate must not remount the old page. */
export default function CEASAITraining() {
  return <Redirect to="/honesty/" />;
}
