/**
 * LiteLLM gateway catalog — OpenAI-compatible /v1/models for the /models page.
 *
 * Build-time only in the browser (VITE_*). Server chat lane uses LITELLM_* secrets.
 */

export type GatewayModel = {
  id: string;
  owned_by?: string;
};

export type GatewayCatalog = {
  models: GatewayModel[];
  source: "wire" | "unconfigured" | "error";
  error?: string;
};

const proxyUrl = () => import.meta.env.VITE_LITELLM_PROXY_URL as string | undefined;
const proxyKey = () => import.meta.env.VITE_LITELLM_MASTER_KEY as string | undefined;

export function gatewayConfigured(): boolean {
  return Boolean(proxyUrl()?.trim() && proxyKey()?.trim());
}

export async function fetchGatewayCatalog(): Promise<GatewayCatalog> {
  const base = proxyUrl()?.trim();
  const key = proxyKey()?.trim();
  if (!base || !key) {
    return { models: [], source: "unconfigured" };
  }

  try {
    const r = await fetch(`${base.replace(/\/+$/, "")}/v1/models`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const data = (await r.json()) as { data?: GatewayModel[] };
    const models = Array.isArray(data?.data) ? data.data : [];
    return { models, source: "wire" };
  } catch (e) {
    return {
      models: [],
      source: "error",
      error: e instanceof Error ? e.message : "gateway unreachable",
    };
  }
}
