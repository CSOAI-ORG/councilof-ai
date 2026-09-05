// /api/hf-spaces — server-side cached mirror of the csoai HF org Space catalog.
// Lane-doable: only reads from huggingface.co/api, no keys, no writes.
// Cache-Control: 5 min (the HF list is dynamic but stable on a per-day scale).
//
// A FAILED LISTING IS NOT AN EMPTY ONE. fetchJSON used to return [] on any
// non-OK response and counts was the .length of whatever survived, so one HF
// throttle published `models: 0` — a statement that the org has no models,
// indistinguishable from the truth. Same defect as /api/hub-cards: a fan-out
// totalling whatever came back. A count is now null unless its listing answered,
// and listings_unread names the ones that did not.

/// <reference types="@cloudflare/workers-types" />

const HF_API = "https://huggingface.co/api/spaces?author=csoai&limit=200";
const HF_DATASETS = "https://huggingface.co/api/datasets?author=csoai&limit=200";
const HF_MODELS = "https://huggingface.co/api/models?author=csoai&limit=200";
const TTL = 300; // 5 min

type Listing =
  | { ok: true; name: string; rows: unknown[] }
  | { ok: false; name: string; reason: string };

async function fetchListing(name: string, url: string): Promise<Listing> {
  try {
    const r = await fetch(url, { headers: { Accept: "application/json" } });
    if (!r.ok) return { ok: false, name, reason: `http ${r.status}` };
    const v = await r.json().catch(() => undefined);
    // A 200 that is not a list is not an empty catalogue; it is an unread one.
    if (!Array.isArray(v)) return { ok: false, name, reason: "not a json array" };
    return { ok: true, name, rows: v };
  } catch (e) {
    return { ok: false, name, reason: `fetch failed: ${(e as Error)?.message ?? "unknown"}` };
  }
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
    const [spacesL, datasetsL, modelsL] = await Promise.all([
      fetchListing("spaces", HF_API),
      fetchListing("datasets", HF_DATASETS),
      fetchListing("models", HF_MODELS),
    ]);

    const rows = (l: Listing): unknown[] => (l.ok ? l.rows : []);
    const spaces = rows(spacesL);
    const datasets = rows(datasetsL);
    const models = rows(modelsL);

    const unread = [spacesL, datasetsL, modelsL]
      .filter((l): l is Extract<Listing, { ok: false }> => !l.ok)
      .map((l) => ({ listing: l.name, reason: l.reason }));

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
          // null, never 0, for a listing that did not answer.
          spaces: spacesL.ok ? slimSpaces.length : null,
          datasets: datasetsL.ok ? slimDatasets.length : null,
          models: modelsL.ok ? slimModels.length : null,
          complete: unread.length === 0,
          listings_unread: unread,
        },
        null_means:
          "A null count is a listing that did not answer, never an empty catalogue. See counts.listings_unread.",
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
