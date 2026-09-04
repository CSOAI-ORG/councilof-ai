/** Cold-load compatibility door for the living board inside Council OS. */
export function scoreboardDestination(request: Request): URL {
  const source = new URL(request.url);
  const destination = new URL("/dashboard", source.origin);
  for (const [key, value] of source.searchParams) {
    if (key !== "tab") destination.searchParams.append(key, value);
  }
  destination.searchParams.set("tab", "board");
  return destination;
}

export function onRequest({ request }: { request: Request }): Response {
  return Response.redirect(scoreboardDestination(request).toString(), 308);
}
