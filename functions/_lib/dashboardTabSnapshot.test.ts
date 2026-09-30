import { describe, expect, it, vi } from "vitest";
import { dashboardSnapshotPath, serveDashboardSnapshot, snapshotDirectVisit } from "./dashboardTabSnapshot";
import { onRequest } from "../_middleware";

const req = (u: string, method = "GET") => new Request(u, { method });

describe("Council OS deep-link snapshots", () => {
  it("only an exact /dashboard/?tab=<snapshotted pane> maps to a snapshot", () => {
    expect(dashboardSnapshotPath(req("https://councilof.ai/dashboard/?tab=route"))).toBe("/_dashboard-tab/route/");
    for (const u of [
      "https://councilof.ai/dashboard/",
      "https://councilof.ai/dashboard?tab=route",
      "https://councilof.ai/dashboard/?tab=route&card=ab",
      "https://councilof.ai/dashboard/?tab=home",
      "https://councilof.ai/dashboard/?tab=../x",
      "https://councilof.ai/verify-server/?tab=route",
    ])
      expect(dashboardSnapshotPath(req(u)), u).toBeNull();
    expect(dashboardSnapshotPath(req("https://councilof.ai/dashboard/?tab=route", "POST"))).toBeNull();
  });
  it("serves the snapshot body with a marker header, and falls through when it is missing", async () => {
    const assets = { fetch: vi.fn(async () => new Response("<html>route</html>", { headers: { "content-type": "text/html" } })) };
    const r = await serveDashboardSnapshot(req("https://councilof.ai/dashboard/?tab=route"), assets);
    expect(await r!.text()).toBe("<html>route</html>");
    expect(r!.headers.get("x-csoai-snapshot")).toBe("dashboard-tab:route");
    const missing = { fetch: vi.fn(async () => new Response("nf", { status: 404, headers: { "content-type": "text/html" } })) };
    expect(await serveDashboardSnapshot(req("https://councilof.ai/dashboard/?tab=route"), missing)).toBeNull();
  });
  it("a direct visit to a snapshot path 308s to the URL it stands for", () => {
    expect(snapshotDirectVisit(req("https://councilof.ai/_dashboard-tab/route/"))!.headers.get("location")).toBe("/dashboard/?tab=route");
    expect(snapshotDirectVisit(req("https://councilof.ai/dashboard/"))).toBeNull();
  });
  it("the middleware uses ASSETS for a deep link and next() for everything else", async () => {
    const next = vi.fn(async () => new Response("next"));
    const ASSETS = { fetch: vi.fn(async () => new Response("<html>snap</html>", { headers: { "content-type": "text/html; charset=utf-8" } })) };
    const a = await onRequest({ request: req("https://councilof.ai/dashboard/?tab=board"), next, env: { ASSETS } });
    expect(await a.text()).toBe("<html>snap</html>");
    expect(next).not.toHaveBeenCalled();
    const b = await onRequest({ request: req("https://councilof.ai/dashboard/"), next, env: { ASSETS } });
    expect(await b.text()).toBe("next");
  });
});
