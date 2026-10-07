/**
 * deploy.yml's IndexNow post-step (scripts/indexnow-deploy.mjs). D-01 / A-G6, 7 Oct 2026: no change
 * announcement had left since 6 Oct 21:50Z, when the pod hook lost its route under the
 * single-writer ruling, and that hook also sent capsule .json URLs. These pin: only changed HTML
 * pages are announced, the per-build momentum figures and stamps are not a change, a first run
 * seeds without announcing, and a refused submission is retried rather than recorded as sent.
 */
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  KEY, SCHEMA, distFileFor, fingerprint, isHtmlPage, plan, run, sitemapEntries, submit, visibleText,
} from "./indexnow-deploy.mjs";

const page = (body, extra = "") => `<!doctype html><html><head><script>var x=${Math.random()}</script>
<style>.a{color:red}</style></head><body><main>${body}</main>${extra}</body></html>`;

describe("visible-text fingerprint", () => {
  it("ignores scripts, styles, momentum figures, relative ages and ISO stamps", () => {
    const a = page("<h1>Board</h1><p>23 axes &middot; 23 measured</p><p>read 2026-10-07T05:00:00Z, 12.5 hours ago</p>",
      `<section data-testid="footer-stats"><p>76 public corrections</p></section>
       <p data-testid="momentum-origin">Live · read now</p><ul><li data-testid="momentum-figure-cards">+16 this week</li></ul>`);
    const b = page("<h1>Board</h1><p>23 axes · 23 measured</p><p>read 2026-10-08T09:30:11Z, 40 hours ago</p>",
      `<section data-testid="footer-stats"><p>73 public corrections</p></section>
       <p data-testid="momentum-origin">Snapshot · taken</p><ul><li data-testid="momentum-figure-cards">+13 this week</li></ul>`);
    expect(fingerprint(a)).toBe(fingerprint(b));
    expect(visibleText(a)).toBe("Board 23 axes · 23 measured read ,");
  });

  it("changes when the page's own words change (failing control)", () => {
    expect(fingerprint(page("<p>23 axes</p>"))).not.toBe(fingerprint(page("<p>24 axes</p>")));
  });
});

describe("what counts as a page", () => {
  it("keeps HTML page URLs and drops capsule JSON, feeds and text files", () => {
    expect(isHtmlPage("https://councilof.ai")).toBe(true);
    expect(isHtmlPage("https://councilof.ai/about/")).toBe(true);
    expect(isHtmlPage("https://councilof.ai/x402/free_door/")).toBe(true);
    expect(isHtmlPage("https://councilof.ai/standalone.html")).toBe(true);
    expect(isHtmlPage("https://councilof.ai/interop/capsules/2026-10-06.json")).toBe(false);
    expect(isHtmlPage("https://councilof.ai/feed.xml")).toBe(false);
    expect(isHtmlPage("https://councilof.ai/llms.txt")).toBe(false);
  });

  it("maps sitemap URLs onto the prerendered files and refuses to leave the tree", () => {
    const dist = fs.mkdtempSync(path.join(os.tmpdir(), "inx-dist-"));
    fs.mkdirSync(path.join(dist, "about"));
    fs.writeFileSync(path.join(dist, "index.html"), page("home"));
    fs.writeFileSync(path.join(dist, "about", "index.html"), page("about"));
    expect(distFileFor(dist, "https://councilof.ai")).toBe(path.join(dist, "index.html"));
    expect(distFileFor(dist, "https://councilof.ai/about/")).toBe(path.join(dist, "about", "index.html"));
    expect(distFileFor(dist, "https://councilof.ai/about")).toBe(path.join(dist, "about", "index.html"));
    expect(distFileFor(dist, "https://councilof.ai/mcp-servers/x/")).toBeNull();
    expect(distFileFor(dist, "https://councilof.ai/%2e%2e/%2e%2e/etc/passwd")).toBeNull();
  });

  it("reads loc and lastmod from sitemaps and sitemap indexes", () => {
    const xml = `<urlset><url><loc>https://councilof.ai/a/</loc><lastmod>2026-10-01</lastmod></url>
      <url><loc>https://councilof.ai/b/</loc></url></urlset>`;
    expect(sitemapEntries(xml)).toEqual([
      { loc: "https://councilof.ai/a/", lastmod: "2026-10-01" },
      { loc: "https://councilof.ai/b/", lastmod: "" },
    ]);
  });
});

describe("plan", () => {
  it("seeds on a first run and announces nothing", () => {
    const p = plan(null, { "https://councilof.ai/a/": "1" }, { "https://councilof.ai/x/": "2026-10-01" });
    expect(p).toEqual({ seed: true, changedPages: [], entityCandidates: [] });
  });

  it("announces new and changed pages, and entities whose lastmod moved, HTML only", () => {
    const prev = { schema: SCHEMA, pages: { "https://councilof.ai/a/": "1", "https://councilof.ai/b/": "2" },
      entities: { "https://councilof.ai/e1/": "2026-10-01", "https://councilof.ai/e2/": "2026-10-01" } };
    const p = plan(prev,
      { "https://councilof.ai/a/": "1", "https://councilof.ai/b/": "3", "https://councilof.ai/c/": "4" },
      { "https://councilof.ai/e1/": "2026-10-01", "https://councilof.ai/e2/": "2026-10-07",
        "https://councilof.ai/e3/": "2026-10-07", "https://councilof.ai/capsules/c.json": "2026-10-07" });
    expect(p.seed).toBe(false);
    expect(p.changedPages).toEqual(["https://councilof.ai/b/", "https://councilof.ai/c/"]);
    expect(p.entityCandidates).toEqual(["https://councilof.ai/e2/", "https://councilof.ai/e3/"]);
  });

  it("an unreadable entity listing announces no entity", () => {
    const prev = { schema: SCHEMA, pages: {}, entities: { "https://councilof.ai/e1/": "2026-10-01" } };
    expect(plan(prev, {}, null).entityCandidates).toEqual([]);
  });
});

describe("submit", () => {
  it("posts the key, its location and the URLs to api.indexnow.org", async () => {
    const calls = [];
    const fetchImpl = async (url, init) => { calls.push({ url, body: JSON.parse(init.body) }); return { status: 202 }; };
    const res = await submit(["https://councilof.ai/a/"], { fetchImpl });
    expect(res).toEqual([{ count: 1, status: 202 }]);
    expect(calls[0].url).toBe("https://api.indexnow.org/indexnow");
    expect(calls[0].body).toEqual({ host: "councilof.ai", key: KEY, keyLocation: `https://councilof.ai/${KEY}.txt`,
      urlList: ["https://councilof.ai/a/"] });
  });
});

describe("run (end to end, injected network)", () => {
  function fixture() {
    const dist = fs.mkdtempSync(path.join(os.tmpdir(), "inx-run-"));
    fs.writeFileSync(path.join(dist, `${KEY}.txt`), KEY);
    fs.mkdirSync(path.join(dist, "a"));
    fs.mkdirSync(path.join(dist, "b"));
    fs.writeFileSync(path.join(dist, "a", "index.html"), page("alpha"));
    fs.writeFileSync(path.join(dist, "b", "index.html"), page("beta"));
    fs.writeFileSync(path.join(dist, "sitemap.xml"),
      `<urlset><url><loc>https://councilof.ai/a/</loc></url><url><loc>https://councilof.ai/b/</loc></url>
       <url><loc>https://councilof.ai/feed.xml</loc></url></urlset>`);
    return { dist, statePath: path.join(dist, "..", `inx-state-${path.basename(dist)}.json`) };
  }
  function net({ postStatus = 200, entityLastmod = "2026-10-01" } = {}) {
    const posts = [];
    const fetchImpl = async (url, init) => {
      if (init && init.method === "POST") { posts.push(JSON.parse(init.body).urlList); return { status: postStatus }; }
      const text = (s) => ({ status: 200, text: async () => s });
      if (url.endsWith(`${KEY}.txt`)) return text(KEY);
      if (url.endsWith("/sitemaps/index.xml")) return text("<sitemapindex><sitemap><loc>https://councilof.ai/sitemaps/x-1.xml</loc></sitemap></sitemapindex>");
      if (url.endsWith("/sitemaps/x-1.xml")) return text(`<urlset><url><loc>https://councilof.ai/x/one/</loc><lastmod>${entityLastmod}</lastmod></url>
        <url><loc>https://councilof.ai/capsules/c.json</loc><lastmod>${entityLastmod}</lastmod></url></urlset>`);
      if (url === "https://councilof.ai/x/one/") return text("ok");
      return { status: 404, text: async () => "" };
    };
    return { posts, fetchImpl };
  }

  it("seeds, then announces only the changed page and the moved entity, never the JSON", async () => {
    const { dist, statePath } = fixture();
    const lines = [];
    const log = (l) => lines.push(l);
    const first = net();
    expect(await run({ dist, statePath, fetchImpl: first.fetchImpl, log })).toBe(0);
    expect(first.posts).toEqual([]);
    expect(lines.pop()).toMatch(/^indexnow: SEED .*submitted=0$/);

    fs.writeFileSync(path.join(dist, "b", "index.html"), page("beta, revised"));
    const second = net({ entityLastmod: "2026-10-07" });
    expect(await run({ dist, statePath, fetchImpl: second.fetchImpl, log })).toBe(0);
    expect(second.posts).toEqual([["https://councilof.ai/b/"], ["https://councilof.ai/x/one/"]]);
    expect(lines.pop()).toMatch(/changed=1 submitted=1 pages_status=200 .*live=1 submitted=1 entities_status=200/);

    const third = net({ entityLastmod: "2026-10-07" });
    expect(await run({ dist, statePath, fetchImpl: third.fetchImpl, log })).toBe(0);
    expect(third.posts).toEqual([]);
    expect(lines.pop()).toMatch(/changed=0 submitted=0 .*new_or_changed=0/);
  });

  it("a refused submission exits 1 and is retried on the next deploy", async () => {
    const { dist, statePath } = fixture();
    await run({ dist, statePath, fetchImpl: net().fetchImpl, log: () => {} });
    fs.writeFileSync(path.join(dist, "a", "index.html"), page("alpha, revised"));
    const refused = net({ postStatus: 403 });
    expect(await run({ dist, statePath, fetchImpl: refused.fetchImpl, log: () => {} })).toBe(1);
    const retry = net();
    expect(await run({ dist, statePath, fetchImpl: retry.fetchImpl, log: () => {} })).toBe(0);
    expect(retry.posts).toEqual([["https://councilof.ai/a/"]]);
  });

  it("does nothing when the key file is not live", async () => {
    const { dist, statePath } = fixture();
    const lines = [];
    const fetchImpl = async () => ({ status: 403, text: async () => "" });
    expect(await run({ dist, statePath, fetchImpl, log: (l) => lines.push(l) })).toBe(1);
    expect(lines[0]).toMatch(/^indexnow: SKIP key file not live \(HTTP 403\); submitted=0$/);
    expect(fs.existsSync(statePath)).toBe(false);
  });
});

describe("deploy.yml wiring", () => {
  const wf = readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), "..", ".github", "workflows", "deploy.yml"), "utf8");
  it("runs the post-step only after the gated tree held, without being able to fail the deploy", () => {
    const step = (name) => {
      const i = wf.indexOf(`- name: ${name}`);
      expect(i, name).toBeGreaterThan(wf.indexOf("- name: Confirm gated tree still holds"));
      return wf.slice(i, wf.indexOf("\n      - ", i + 10));
    };
    const announce = step("IndexNow — announce changed HTML pages only");
    expect(announce).toContain("steps.hold.outcome == 'success'");
    expect(announce).toContain("continue-on-error: true");
    expect(announce).toContain("node scripts/indexnow-deploy.mjs --dist dist/client --state .indexnow-state/state.json");
    // the state the script reads is the state the cache restores and saves
    expect(step("IndexNow state — restore the last deploy's fingerprints")).toContain("path: .indexnow-state");
    expect(step("IndexNow state — save for the next deploy")).toContain("path: .indexnow-state");
    expect(wf).toContain("id: hold");
  });
});
