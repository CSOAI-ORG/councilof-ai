/**
 * /api/workspace — per-user org + AI systems registry (JSON-in-KV).
 *
 * Auth: X-Workspace-Token header (opaque id issued on create). No PII in public hive.
 * This is YOUR portfolio — separate from the 1,999-row public Distribution Hive.
 *
 * POST   { action: "create" }                         → new workspace
 * GET    ?id=ws_xxx                                   → fetch workspace
 * PUT    { id, org?, systems?, integrations? }      → merge update
 * POST   { action: "add_system", id, system }       → add AI system
 * DELETE ?id=ws_xxx&systemId=sys_xxx                → remove system
 */

interface Env {
  WORKSPACE?: KVNamespace;
}

type AiSystem = {
  id: string;
  name: string;
  description: string;
  domain?: string;
  frameworks: string[];
  last_assess_at?: string;
  last_report_id?: string;
  last_tier?: string;
  next_reattest_at?: string;
  baseline_report_id?: string;
  created_at: string;
};

type Workspace = {
  id: string;
  created_at: string;
  org: {
    name: string;
    sector?: string;
    jurisdictions: string[];
    size?: "smb" | "enterprise" | "regulator" | "government";
  };
  systems: AiSystem[];
  integrations: {
    crm?: { provider: "apollo" | "zoominfo"; connected_at: string; last4: string };
  };
  doctrine: string;
};

const DOCTRINE =
  "Measurement and training loop — not certification. Council signs observations; you fix; re-measure free.";

function key(id: string) {
  return `workspace:${id}`;
}

async function readWs(env: Env, id: string): Promise<Workspace | null> {
  if (!env.WORKSPACE) return null;
  const raw = await env.WORKSPACE.get(key(id));
  return raw ? (JSON.parse(raw) as Workspace) : null;
}

async function writeWs(env: Env, ws: Workspace) {
  if (!env.WORKSPACE) return false;
  await env.WORKSPACE.put(key(ws.id), JSON.stringify(ws));
  return true;
}

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  let body: Record<string, unknown>;
  try {
    body = await ctx.request.json();
  } catch {
    return Response.json({ error: "body must be JSON" }, { status: 400 });
  }

  const action = String(body.action || "");

  if (action === "create") {
    const id = `ws_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
    const ws: Workspace = {
      id,
      created_at: new Date().toISOString(),
      org: {
        name: String(body.org_name || "My organisation"),
        sector: body.sector ? String(body.sector) : undefined,
        jurisdictions: Array.isArray(body.jurisdictions) ? body.jurisdictions.map(String) : ["eu"],
        size: (["smb", "enterprise", "regulator", "government"].includes(String(body.size))
          ? String(body.size)
          : "enterprise") as Workspace["org"]["size"],
      },
      systems: [],
      integrations: {},
      doctrine: DOCTRINE,
    };
    const stored = await writeWs(ctx.env, ws);
    return Response.json({
      ok: true,
      stored,
      workspace: ws,
      token: id,
      note: stored
        ? "Save workspace id as X-Workspace-Token for subsequent calls."
        : "no WORKSPACE KV bound — workspace exists in response only until KV is provisioned",
    });
  }

  const id = String(body.id || ctx.request.headers.get("X-Workspace-Token") || "");
  if (!id) return Response.json({ error: "workspace id required" }, { status: 400 });

  if (action === "add_system") {
    const ws = await readWs(ctx.env, id);
    if (!ws) return Response.json({ error: "workspace not found" }, { status: 404 });
    const sys = body.system as Record<string, unknown>;
    const system: AiSystem = {
      id: `sys_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`,
      name: String(sys.name || "Unnamed system"),
      description: String(sys.description || sys.system || ""),
      domain: sys.domain ? String(sys.domain) : undefined,
      frameworks: Array.isArray(sys.frameworks) ? sys.frameworks.map(String) : ws.org.jurisdictions,
      created_at: new Date().toISOString(),
    };
    ws.systems.push(system);
    const stored = await writeWs(ctx.env, ws);
    return Response.json({ ok: true, stored, system, workspace_id: id });
  }

  return Response.json({ error: "unknown action" }, { status: 400 });
};

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const url = new URL(ctx.request.url);
  const id = url.searchParams.get("id") || ctx.request.headers.get("X-Workspace-Token");
  if (!id) return Response.json({ error: "id required" }, { status: 400 });

  if (!ctx.env.WORKSPACE) {
    return Response.json({
      bound: false,
      reason: "no WORKSPACE KV bound",
      fallback: "Create workspace via POST — response includes workspace object for client-side session until KV is bound",
    });
  }

  const ws = await readWs(ctx.env, id);
  if (!ws) return Response.json({ error: "workspace not found" }, { status: 404 });
  return Response.json({ bound: true, workspace: ws });
};

export const onRequestPut: PagesFunction<Env> = async (ctx) => {
  let body: Record<string, unknown>;
  try {
    body = await ctx.request.json();
  } catch {
    return Response.json({ error: "body must be JSON" }, { status: 400 });
  }
  const id = String(body.id || ctx.request.headers.get("X-Workspace-Token") || "");
  if (!id) return Response.json({ error: "id required" }, { status: 400 });

  const existing = (await readWs(ctx.env, id)) || {
    id,
    created_at: new Date().toISOString(),
    org: { name: "My organisation", jurisdictions: ["eu"] },
    systems: [],
    integrations: {},
    doctrine: DOCTRINE,
  };

  if (body.org && typeof body.org === "object") {
    existing.org = { ...existing.org, ...(body.org as Workspace["org"]) };
  }
  if (Array.isArray(body.systems)) {
    existing.systems = body.systems as AiSystem[];
  }
  const stored = await writeWs(ctx.env, existing);
  return Response.json({ ok: true, stored, workspace: existing });
};

export const onRequestDelete: PagesFunction<Env> = async (ctx) => {
  const url = new URL(ctx.request.url);
  const id = url.searchParams.get("id");
  const systemId = url.searchParams.get("systemId");
  if (!id || !systemId) return Response.json({ error: "id and systemId required" }, { status: 400 });

  const ws = await readWs(ctx.env, id);
  if (!ws) return Response.json({ error: "workspace not found" }, { status: 404 });
  ws.systems = ws.systems.filter((s) => s.id !== systemId);
  const stored = await writeWs(ctx.env, ws);
  return Response.json({ ok: true, stored, workspace: ws });
};
