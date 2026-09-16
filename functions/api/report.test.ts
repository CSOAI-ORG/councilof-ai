import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequestGet, onRequestPost, slugify } from "./report";

/**
 * /api/report serves the derived tree; it never computes a report at the edge.
 *   · no params  -> /reports/index.json
 *   · a known pair -> that report, 200, JSON, CORS
 *   · an unknown pair -> 404 with an honest body (absence is not a measurement)
 *   · one param, or an unsafe identifier -> 400
 *   · the subject id and its slug reach the same file
 */

const INDEX = { schema: "csoai.axis-reports-index/0.1", counts: { reports: 1 }, reports: [{ subject: "qwen2.5:7b", slug: "qwen2.5-7b", axis: "governance" }] };
const REPORT = { schema: "csoai.axis-report/0.1", subject: "qwen2.5:7b", axis: "governance", status: "UNMEASURED" };

const installFetch = () => {
  const mocked = vi.fn(async (input: string | URL | Request) => {
    const url = new URL(typeof input === "string" ? input : input instanceof URL ? input : input.url);
    if (url.pathname === "/reports/index.json") return Response.json(INDEX);
    if (url.pathname === "/reports/qwen2.5-7b/governance.json") return Response.json(REPORT);
    return new Response("not found", { status: 404 });
  });
  vi.stubGlobal("fetch", mocked);
  return mocked;
};

const get = (qs = "", env: Record<string, unknown> = {}) =>
  (onRequestGet as unknown as Function)({ request: new Request(`https://councilof.ai/api/report${qs}`), env });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("GET /api/report", () => {
  it("serves the index when no pair is named", async () => {
    installFetch();
    const res = await get();
    expect(res.status).toBe(200);
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
    expect(res.headers.get("content-type")).toMatch(/application\/json/);
    expect(await res.json()).toEqual(INDEX);
  });

  it("serves a known subject × axis report, by slug or by subject id", async () => {
    const fetchMock = installFetch();
    const bySlug = await get("?subject=qwen2.5-7b&axis=governance");
    expect(bySlug.status).toBe(200);
    expect(await bySlug.json()).toEqual(REPORT);
    const byId = await get("?subject=" + encodeURIComponent("qwen2.5:7b") + "&axis=governance");
    expect(byId.status).toBe(200);
    expect(await byId.json()).toEqual(REPORT);
    expect(fetchMock.mock.calls.every(([i]) => String(i instanceof Request ? i.url : i).includes("/reports/qwen2.5-7b/governance.json"))).toBe(true);
  });

  it("prefers the ASSETS binding when the platform provides it", async () => {
    const assets = { fetch: vi.fn(async () => Response.json(REPORT)) };
    vi.stubGlobal("fetch", vi.fn(async () => new Response("should not be called", { status: 500 })));
    const res = await get("?subject=qwen2.5-7b&axis=governance", { ASSETS: assets });
    expect(res.status).toBe(200);
    expect(assets.fetch).toHaveBeenCalledTimes(1);
  });

  it("404s an unknown pair with a body that says absence is not a measurement", async () => {
    installFetch();
    const res = await get("?subject=nobody&axis=governance");
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.state).toBe("NOT_FOUND");
    expect(body.subject_slug).toBe("nobody");
    expect(body.note).toMatch(/not a measurement/);
  });

  it("400s a half-specified pair and an unsafe identifier without touching the asset store", async () => {
    const fetchMock = installFetch();
    expect((await get("?subject=qwen2.5-7b")).status).toBe(400);
    expect((await get("?axis=governance")).status).toBe(400);
    expect((await get("?subject=qwen2.5-7b&axis=../index")).status).toBe(400);
    expect((await get("?subject=..&axis=..")).status).toBe(400);
    expect((await get("?subject=a..b&axis=governance")).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("slugify matches the generator's one-way rule", () => {
    expect(slugify("qwen2.5:7b")).toBe("qwen2.5-7b");
    expect(slugify("Model One:LATEST")).toBe("model-one-latest");
  });
});

describe("POST /api/report stays an honest 501", () => {
  it("accepts, persists and signs nothing", async () => {
    const res = await (onRequestPost as unknown as Function)({ request: new Request("https://councilof.ai/api/report", { method: "POST" }) });
    expect(res.status).toBe(501);
    const body = await res.json();
    expect(body).toMatchObject({ state: "NOT_IMPLEMENTED", accepted: false, persisted: false, signed: false });
  });
});
