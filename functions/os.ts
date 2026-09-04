/**
 * Cold-load compatibility door for the retired Council OS shell.
 *
 * The dashboard is the only workspace. Preserve the old `lobby` selection as
 * the dashboard `tab` so bookmarks do not land on a second app or a 404.
 */
const LEGACY_TAB_ALIASES: Readonly<Record<string, string>> = {
  assess: "measured",
  assessment: "measured",
  "get-measured": "measured",
  ras: "measured",
  rankings: "leaderboard",
  scoreboard: "board",
  chat: "home",
  "ag-ui": "home",
};

export function legacyOsDestination(request: Request): URL {
  const source = new URL(request.url);
  const requested = (source.searchParams.get("lobby") || "home")
    .trim()
    .toLowerCase();
  const tab = LEGACY_TAB_ALIASES[requested] || requested || "home";
  const destination = new URL("/dashboard", source.origin);

  for (const [key, value] of source.searchParams) {
    if (key !== "lobby" && key !== "tab") destination.searchParams.append(key, value);
  }
  destination.searchParams.set("tab", tab);
  return destination;
}

export function onRequest({ request }: { request: Request }): Response {
  return Response.redirect(legacyOsDestination(request).toString(), 308);
}
