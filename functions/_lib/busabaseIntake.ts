/**
 * busabaseIntake — the one way an edge function proposes a record into Busabase.
 *
 * Busabase (the single source of truth) runs on the operator's pod, not at the edge. The edge
 * reaches it only through BUSABASE_INTAKE_URL, an operator-set https endpoint that fronts the
 * Busabase bulk-change-request API. Nothing is auto-merged: every write is a PROPOSAL
 * (autoMerge:false) that a reviewer approves in Busabase. When the URL is not set the caller
 * answers DOOR_CLOSED — it never pretends to have stored anything.
 */
export interface IntakeEnv {
  BUSABASE_INTAKE_URL?: string;
  BUSABASE_INTAKE_TOKEN?: string;
}

export const intakeConfigured = (env: IntakeEnv): boolean =>
  typeof env.BUSABASE_INTAKE_URL === "string" && env.BUSABASE_INTAKE_URL.startsWith("https://");

export async function proposeRecord(
  env: IntakeEnv,
  base: "waitlist" | "bookings",
  record: Record<string, string>,
  idempotencyKey: string,
  message: string,
): Promise<{ ok: boolean; status: number; change_request?: string }> {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (env.BUSABASE_INTAKE_TOKEN) headers.authorization = `Bearer ${env.BUSABASE_INTAKE_TOKEN}`;
  const r = await fetch(`${env.BUSABASE_INTAKE_URL!.replace(/\/+$/, "")}/bases/${base}/records/bulk-change-request`, {
    method: "POST",
    headers,
    body: JSON.stringify({ records: [record], autoMerge: false, submittedBy: `edge-${base}`, message, idempotencyKey }),
  });
  let cr: string | undefined;
  try {
    const j = (await r.json()) as { data?: { id?: string }; id?: string };
    cr = j?.data?.id ?? j?.id;
  } catch { /* non-JSON upstream */ }
  return { ok: r.ok, status: r.status, change_request: cr };
}

export async function sha256Hex(s: string): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const json = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "access-control-allow-origin": "*" },
  });
