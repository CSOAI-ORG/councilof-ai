// /api/hf-spaces — server-side cached mirror of the csoai HF org Space catalog.
// Lane-doable: only reads from huggingface.co/api, no keys, no writes.
// Cache-Control: 5 min (the HF list is dynamic but stable on a per-day scale).

/// <reference types="@cloudflare/workers-types" />

const HF_API = "https://huggingface.co/api/spaces?author=csoai&limit=200";
const HF_DATASETS = "https://huggingface.co/api/datasets?author=csoai&limit=200";
const HF_MODELS = "https://huggingface.co/api/models?author=csoai&limit=200";
const TTL = 300; // 5 min

async function fetchJSON(url: string): Promise<unknown> {
  const r = await fetch(url, { headers: { "Accept": "application/json" } });
  if (!r.ok) return [];
  return await r.json();
}

function asArray(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

interface SlimSpace {
  slug: string;
  url: string;
  sdk: string;
  likes: number;
  createdAt: string;
}

function slimSpace(s: any): SlimSpace {
  return {
    slug: String(s.id || s.modelId || "").replace(/^csoai\//, ""),
    url: `https://huggingface.co/csoai/${String(s.id || s.modelId || "").replace(/^csoai\//, "")}`,
    sdk: String(s.sdk || "static"),
    likes: Number(s.likes || 0),
    createdAt: String(s.createdAt || ""),
  };
}

export const onRequestGet: PagesFunction = async (ctx) => {
  try {
    const [spaces, datasets, models] = await Promise.all([
      fetchJSON(HF_API).then(asArray),
      fetchJSON(HF_DATASETS).then(asArray),
      fetchJSON(HF_MODELS).then(asArray),
    ]);

    const slimSpaces = (spaces as any[]).map(slimSpace);
    const slimDatasets = (datasets as any[]).map((d: any) => ({
      slug: String(d.id || "").replace(/^csoai\//, ""),
      url: `https://huggingface.co/datasets/csoai/${String(d.id || "").replace(/^csoai\//, "")}`,
      downloads: Number(d.downloads || 0),
      likes: Number(d.likes || 0),
      license: String((d.tags || []).find((t: string) => t.startsWith("license:")) || "unknown"),
    }));
    const slimModels = (models as any[]).map((m: any) => ({
      slug: String(m.id || "").replace(/^csoai\//, ""),
      url: `https://huggingface.co/csoai/${String(m.id || "").replace(/^csoai\//, "")}`,
      likes: Number(m.likes || 0),
      pipeline: String(m.pipeline_tag || ""),
    }));

    const body = JSON.stringify(
      {
        as_of: new Date().toISOString(),
        source: "huggingface.co/api",
        ttl_seconds: TTL,
        spaces: slimSpaces,
        datasets: slimDatasets,
        models: slimModels,
        counts: {
          spaces: slimSpaces.length,
          datasets: slimDatasets.length,
          models: slimModels.length,
        },
        live_board: "https://councilof.ai/api/gspc",
        verify: "https://councilof.ai/gspc-verify",
      },
      null,
      2
    );

    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": `public, max-age=${TTL}`,
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: "hf-spaces fetch failed", detail: String(err?.message || err) }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }
};
