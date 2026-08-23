import { Redirect } from "wouter";

/**
 * AG UI is Council OS. `/chat` and `/ag-ui` both land here.
 * Deep-link stays `?lobby=`.
 *
 * Do not iframe a second console on csoai-site.pages.dev.
 */
export default function AgUiBridge() {
  return <Redirect to="/?lobby=home" />;
}

/** OpenRouter-shaped /rankings → living GSPC board. */
export function RankingsBridge() {
  return <Redirect to="/?lobby=board" />;
}
