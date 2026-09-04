import { Redirect, useSearch } from "wouter";
import { normalizeLobbyTabId } from "@/components/lobby/tabs";

/**
 * AG UI is the canonical Council OS dashboard. `/chat` and `/ag-ui` both
 * land there; a legacy `?lobby=` value becomes the matching dashboard tab.
 *
 * Do not iframe csoai-site.pages.dev/ag-ui. #365 and #372 restored that
 * second console; this file must stay a Redirect.
 *
 * This component remains as a defensive route even though App.tsx now
 * normalizes these doors before the main switch.
 */
export default function AgUiBridge() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const tab = normalizeLobbyTabId(params.get("lobby") || params.get("tab") || "home");
  params.delete("lobby");
  params.set("tab", tab);
  return <Redirect to={`/dashboard?${params.toString()}`} />;
}

/** OpenRouter-shaped /rankings → living GSPC board. */
export function RankingsBridge() {
  return <Redirect to="/dashboard?tab=board" />;
}
