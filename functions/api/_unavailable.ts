export function unavailable(endpoint: string, capability: string, status = 501): Response {
  return Response.json(
    {
      schema: "csoai.capability-state/0.1",
      endpoint,
      state: "NOT_IMPLEMENTED",
      capability,
      accepted: false,
      persisted: false,
      signed: false,
      note: "This public route has no durable worker or store. No job, report, subscription, card, or receipt was created.",
    },
    {
      status,
      headers: {
        "cache-control": "no-store",
        "access-control-allow-origin": "*",
      },
    },
  );
}
