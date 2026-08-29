import { Redirect, useSearch } from "wouter";

/**
 * AG UI is Council OS at /os. `/chat` and `/ag-ui` both land here.
 * Deep-link stays `?lobby=`. A harness panel keeps `embed=1`.
 *
 * Do not iframe csoai-site.pages.dev/ag-ui. #365 and #372 restored that
 * second console; this file must stay a Redirect.
 *
 * 2026-08-28: Redirect to /os?lobby= instead of /?lobby=home. The homepage
 * no longer mounts the lobby panes (832 lean homepage), so /?lobby=home
 * crashes with removeChild NotFoundError. /os is the AG-UI host now.
 */
export default function AgUiBridge() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  if (!params.get("lobby")) params.set("lobby", "home");
  const qs = params.toString();
  // Default /ag-ui is Council OS home (one-door-guard literal). A harness
  // panel keeps embed=1 and lobby=board via the query string, never nested /.
  if (qs === "lobby=home") {
    return <Redirect to="/os?lobby=home" />;
  }
  return <Redirect to={`/os?${qs}`} />;
}

/** OpenRouter-shaped /rankings → living GSPC board. */
export function RankingsBridge() {
  return <Redirect to="/os?lobby=board" />;
}
