/**
 * /api/integrations/crm — user's licensed Apollo / ZoomInfo connector.
 *
 * HONESTY: contact enrichment uses the USER's API key and quota — never mixed with
 * measurement. Council does not certify because a contact exists in Apollo.
 *
 * POST { action: "connect", workspace, provider, api_key }
 * POST { action: "enrich", workspace, account_id?, domain?, company_name? }
 * GET  ?workspace=ws_xxx  → connection status (last4 only, never full key)
 */

interface Env {
  WORKSPACE?: KVNamespace;
}

type CrmProvider = "apollo" | "zoominfo";

async function getKey(env: Env, workspace: string, provider: CrmProvider): Promise<string | null> {
  if (!env.WORKSPACE) return null;
  return env.WORKSPACE.get(`crm:${workspace}:${provider}`);
}

async function saveKey(env: Env, workspace: string, provider: CrmProvider, apiKey: string) {
  if (!env.WORKSPACE) return false;
  await env.WORKSPACE.put(`crm:${workspace}:${provider}`, apiKey);
  return true;
}

async function apolloEnrich(apiKey: string, domain: string, name: string) {
  const res = await fetch("https://api.apollo.io/v1/organizations/search", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Cache-Control": "no-cache", "X-Api-Key": apiKey },
    body: JSON.stringify({
      q_organization_domains: domain || undefined,
      q_organization_name: name || undefined,
      page: 1,
      per_page: 3,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    return { error: `Apollo API ${res.status}`, detail: err.slice(0, 200) };
  }
  const data = (await res.json()) as { organizations?: Array<Record<string, unknown>> };
  const orgs = (data.organizations || []).map((o) => ({
    name: o.name,
    domain: o.primary_domain || o.website_url,
    industry: o.industry,
    employees: o.estimated_num_employees,
    hq: o.city && o.country ? `${o.city}, ${o.country}` : o.country,
    linkedin: o.linkedin_url,
    source: "apollo.io (user-licensed)",
    note: "Org-level firmographics only — not used in measurement verdicts",
  }));
  return { provider: "apollo", count: orgs.length, organizations: orgs };
}

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  let body: Record<string, unknown>;
  try {
    body = await ctx.request.json();
  } catch {
    return Response.json({ error: "body must be JSON" }, { status: 400 });
  }

  const action = String(body.action || "");
  const workspace = String(body.workspace || ctx.request.headers.get("X-Workspace-Token") || "");
  if (!workspace) return Response.json({ error: "workspace required" }, { status: 400 });

  if (action === "connect") {
    const provider = String(body.provider || "") as CrmProvider;
    const apiKey = String(body.api_key || "");
    if (!["apollo", "zoominfo"].includes(provider)) {
      return Response.json({ error: "provider must be apollo or zoominfo" }, { status: 400 });
    }
    if (apiKey.length < 8) return Response.json({ error: "api_key required" }, { status: 400 });

    const stored = await saveKey(ctx.env, workspace, provider, apiKey);
    return Response.json({
      ok: true,
      stored,
      provider,
      last4: apiKey.slice(-4),
      note: stored
        ? "Key stored in workspace KV — used only for on-demand enrichment you trigger"
        : "no WORKSPACE KV bound — connect CRM after KV is provisioned",
    });
  }

  if (action === "enrich") {
    const provider = (String(body.provider || "apollo")) as CrmProvider;
    const apiKey = await getKey(ctx.env, workspace, provider);
    if (!apiKey) {
      return Response.json({
        error: "CRM not connected",
        connect: "POST /api/integrations/crm { action: connect, provider, api_key, workspace }",
      }, { status: 400 });
    }

    const domain = String(body.domain || "");
    const company_name = String(body.company_name || body.account_id || "");

    if (provider === "apollo") {
      const result = await apolloEnrich(apiKey, domain, company_name);
      return Response.json({
        ...result,
        firewall: "Enrichment for outreach only — never alters measurement or compliance scores",
      });
    }

    return Response.json({
      provider: "zoominfo",
      error: "ZoomInfo enrich stub — connect key stored; full API wiring pending user's ZoomInfo contract",
      note: "Use Apollo for live enrich today, or export contacts from ZoomInfo manually",
    }, { status: 501 });
  }

  return Response.json({ error: "unknown action" }, { status: 400 });
};

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const url = new URL(ctx.request.url);
  const workspace = url.searchParams.get("workspace") || ctx.request.headers.get("X-Workspace-Token");
  if (!workspace) return Response.json({ error: "workspace required" }, { status: 400 });

  const apolloKey = await getKey(ctx.env, workspace, "apollo");
  const zoomKey = await getKey(ctx.env, workspace, "zoominfo");

  return Response.json({
    workspace,
    bound: !!ctx.env.WORKSPACE,
    apollo: apolloKey ? { connected: true, last4: apolloKey.slice(-4) } : { connected: false },
    zoominfo: zoomKey ? { connected: true, last4: zoomKey.slice(-4) } : { connected: false },
    doctrine: "User-licensed B2B tools under legitimate interest — never scraped dossiers",
  });
};
