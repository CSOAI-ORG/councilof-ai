import { Redirect } from "wouter";

/**
 * AG UI is Council OS. `/chat` and `/ag-ui` both land here.
 * Deep-link stays `?lobby=`.
 *
 * Do not iframe csoai-site.pages.dev/ag-ui. #365 and #372 restored that
 * second console; this file must stay a Redirect.
 */
export default function AgUiBridge() {
  return <Redirect to="/?lobby=home" />;
}

/** OpenRouter-shaped /rankings → living GSPC board. */
export function RankingsBridge() {
  return <Redirect to="/?lobby=board" />;
}
