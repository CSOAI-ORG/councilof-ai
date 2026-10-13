/**
 * csoai.org answers 404 for a /.well-known/ path that has no file behind it.
 *
 * What was wrong (read live, 13 Oct 2026 07:30Z). https://csoai.org/.well-known/<anything>
 * answered 200 text/html, 1,740 bytes: the index.html of CSOAI-ORG/csoai-static-deploy2, byte
 * for byte. The middleware in csoai-site-deploy.yml handed every /.well-known/* path to the
 * Pages asset server, and Pages answers a path that has no file with /index.html and status 200
 * when the upload holds no top-level 404.html. /.well-known/scitt-keys, scitt-configuration,
 * x402.json and openid-configuration all returned that page as if it were the document.
 *
 * These tests build the middleware from a small site, put it in front of an asset server that
 * behaves as Pages does, and read the answers. The first block runs the old handler through
 * the same asset server, so the defect is on record next to the fix.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { decide } from "./apex-middleware.js";
import {
  MARKER,
  MUST_KEEP,
  TEMPLATE_PATH,
  buildApexFunctions,
  listWellKnownFiles,
  loadMiddleware,
  renderMiddleware,
  selfCheck,
} from "./build-apex-functions.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const WORKFLOW = readFileSync(join(ROOT, ".github/workflows/csoai-site-deploy.yml"), "utf8");

// The page Pages hands back for a path with no file. The real one is a stale landing page;
// here it is a marker, so a test can tell at once whether it leaked into an answer.
const FALLBACK = "FALLBACK-PAGE-MARKER";

// The handler this change replaces (csoai-site-deploy.yml at master 8c89bfccf8, lines 123-134).
const OLD_HANDLER = `
export async function onRequest(context) {
  const url = new URL(context.request.url);
  const p = url.pathname;
  if (p === '/.well-known' || p.startsWith('/.well-known/')) {
    return context.next();
  }
  const dest = new URL(url.pathname + url.search + url.hash, 'https://councilof.ai');
  return Response.redirect(dest.toString(), 308);
}
`;

const FILES = {
  "index.html": `<title>${FALLBACK}</title>`,
  "cards/0123456789abcdef.json": "{}",
  ".well-known/did.json": '{"id":"did:web:csoai.org"}',
  ".well-known/agent-card.json": '{"name":"card"}',
  ".well-known/agent.json": '{"name":"card"}',
  ".well-known/api-catalog": '{"linkset":[]}',
  ".well-known/scitt-keys": '{"keys":[]}',
  ".well-known/security.txt": "Contact: mailto:security@example.org\n",
  ".well-known/mcp/server-card.json": '{"name":"server"}',
};
const LISTED = Object.keys(FILES)
  .filter((f) => f.startsWith(".well-known/"))
  .map((f) => `/${f}`)
  .sort();

function makeSite(files = FILES) {
  const dir = mkdtempSync(join(tmpdir(), "apex-site-"));
  for (const [rel, body] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), body);
  }
  return dir;
}

// Pages, as far as this defect goes: a file is served at its own path; anything else gets
// /index.html and 200, because the upload has no top-level 404.html.
function pagesAssets(files) {
  return (pathname) => {
    const rel = pathname.slice(1);
    if (Object.prototype.hasOwnProperty.call(files, rel)) return new Response(files[rel], { status: 200 });
    return new Response(files["index.html"], { status: 200, headers: { "content-type": "text/html; charset=utf-8" } });
  };
}

async function get(mod, assets, path, method = "GET") {
  let reachedAssets = 0;
  const request = new Request(`https://csoai.org${path}`, { method });
  const response = await mod.onRequest({
    request,
    next: async () => {
      reachedAssets += 1;
      return assets(new URL(request.url).pathname);
    },
  });
  const body = response.status === 308 ? "" : await response.text();
  return { status: response.status, body, reachedAssets, location: response.headers.get("location"), type: response.headers.get("content-type") };
}

let site;
let out;
let built;
let mod;
let assets;

beforeAll(async () => {
  site = makeSite();
  out = mkdtempSync(join(tmpdir(), "apex-functions-"));
  built = await buildApexFunctions(site, out);
  mod = await loadMiddleware(readFileSync(built.file, "utf8"));
  assets = pagesAssets(FILES);
});

afterAll(() => {
  for (const d of [site, out]) if (d) rmSync(d, { recursive: true, force: true });
});

// Each of these answered 200 text/html, 1,740 bytes, sha256 a873ee8a…65795 on https://csoai.org
// and on https://main.csoai-site.pages.dev (the upload this workflow makes), 13 Oct 2026 07:30-07:36Z.
const SEEN_LIVE_AS_THE_FALLBACK_PAGE = [
  "/.well-known/",
  "/.well-known/zzz-unknown-probe-1",
  "/.well-known/no-such-dir/no-such-file.json",
  "/.well-known/scitt-configuration",
  "/.well-known/x402.json",
  "/.well-known/openid-configuration",
  "/.well-known/mcp",
  "/.well-known/mcp/",
  "/.well-known/did.json/",
  "/.well-known/DID.JSON",
  "/.well-known/did.json.bak",
];
// Pages tidies these two spellings and serves did.json for them today. The list is exact, so
// after this change they answer 404. The real address, /.well-known/did.json, is untouched.
const TIDIED_BY_PAGES_TODAY = ["/.well-known//did.json", "/.well-known/did%2Ejson"];
const UNKNOWN = [...SEEN_LIVE_AS_THE_FALLBACK_PAGE, ...TIDIED_BY_PAGES_TODAY];

describe("the defect: the old handler returns the fallback page for any /.well-known/ path", () => {
  it("answers 200 with the fallback page where no file exists", async () => {
    const old = await loadMiddleware(OLD_HANDLER);
    for (const p of SEEN_LIVE_AS_THE_FALLBACK_PAGE) {
      const r = await get(old, assets, p);
      expect([p, r.status, r.body.includes(FALLBACK)]).toEqual([p, 200, true]);
    }
  });

  it("sends //host/path to that host", async () => {
    const old = await loadMiddleware(OLD_HANDLER);
    const r = await get(old, assets, "//example.com/x");
    expect(r.location).toBe("https://example.com/x");
  });
});

describe("the built middleware", () => {
  it("lists exactly the files the site holds under /.well-known/", () => {
    expect(built.paths).toEqual(LISTED);
    expect(listWellKnownFiles(site)).toEqual(LISTED);
    const source = readFileSync(built.file, "utf8");
    expect(source).not.toContain(MARKER);
    for (const p of LISTED) expect(source).toContain(JSON.stringify(p));
  });

  it("answers 404, as text, for a /.well-known/ path with no file, and never asks the asset server", async () => {
    for (const p of UNKNOWN) {
      for (const method of ["GET", "HEAD"]) {
        const r = await get(mod, assets, p, method);
        expect([p, method, r.status, r.reachedAssets]).toEqual([p, method, 404, 0]);
        expect(r.type).toBe("text/plain; charset=utf-8");
        expect(r.body).not.toContain(FALLBACK);
        expect(r.body.toLowerCase()).not.toContain("<html");
      }
    }
  });

  it("hands each listed file to the asset server once and returns its bytes unchanged", async () => {
    for (const p of LISTED) {
      const r = await get(mod, assets, p);
      expect([p, r.status, r.reachedAssets]).toEqual([p, 200, 1]);
      expect(r.body).toBe(FILES[p.slice(1)]);
    }
    const withQuery = await get(mod, assets, "/.well-known/did.json?cb=1");
    expect([withQuery.status, withQuery.body]).toEqual([200, FILES[".well-known/did.json"]]);
  });

  it("keeps did.json and both agent-card names on the must-keep list", () => {
    expect(MUST_KEEP).toEqual(["/.well-known/did.json", "/.well-known/agent-card.json", "/.well-known/agent.json"]);
  });

  it("redirects every other path to the same path on councilof.ai, without asking the asset server", async () => {
    for (const [p, want] of [
      ["/", "https://councilof.ai/"],
      ["/index.html", "https://councilof.ai/index.html"],
      ["/some/page?x=1&y=2", "https://councilof.ai/some/page?x=1&y=2"],
      ["/cards/0123456789abcdef.json", "https://councilof.ai/cards/0123456789abcdef.json"],
      ["/root.json", "https://councilof.ai/root.json"],
      ["/.well-known", "https://councilof.ai/.well-known"],
      ["/.well-knownX/did.json", "https://councilof.ai/.well-knownX/did.json"],
    ]) {
      const r = await get(mod, assets, p);
      expect([p, r.status, r.location, r.reachedAssets]).toEqual([p, 308, want, 0]);
    }
  });

  it("cannot be made to redirect off councilof.ai", async () => {
    for (const p of ["//example.com/x", "///example.com/x", "/\\example.com/x", "/\\/example.com", "//example.com@evil.example/x", "/%2F%2Fexample.com"]) {
      const r = await get(mod, assets, p);
      expect(r.status).toBe(308);
      expect(new URL(r.location).origin).toBe("https://councilof.ai");
      expect(r.location.startsWith("https://councilof.ai/")).toBe(true);
    }
    const r = await get(mod, assets, "//example.com/x");
    expect(r.location).toBe("https://councilof.ai/example.com/x");
  });

  it("passes the builder's own check, and that check catches a pass-through handler", async () => {
    expect(await selfCheck(readFileSync(built.file, "utf8"), LISTED)).toEqual([]);
    const failures = await selfCheck(OLD_HANDLER, LISTED);
    expect(failures.some((f) => f.includes("reached the asset server"))).toBe(true);
    expect(failures.some((f) => f.includes("//example.com/x"))).toBe(true);
  });
});

describe("the template, before it is built", () => {
  it("holds the marker exactly once and an empty list, so it fails closed", () => {
    const template = readFileSync(TEMPLATE_PATH, "utf8");
    expect(template.split(MARKER).length).toBe(2);
    expect(decide("/.well-known/did.json", "")).toEqual({ kind: "not_found" });
    expect(decide("/anything", "?a=1")).toEqual({ kind: "redirect", location: "https://councilof.ai/anything?a=1" });
  });

  it("decides by exact path", () => {
    const listed = new Set(["/.well-known/did.json"]);
    expect(decide("/.well-known/did.json", "", listed)).toEqual({ kind: "asset" });
    expect(decide("/.well-known/did.json/", "", listed)).toEqual({ kind: "not_found" });
    expect(decide("/.well-known/", "", listed)).toEqual({ kind: "not_found" });
  });
});

describe("the builder refuses a site it cannot list exactly", () => {
  const cases = [];
  const site2 = (files) => {
    const d = makeSite(files);
    cases.push(d);
    return d;
  };
  afterAll(() => {
    for (const d of cases) rmSync(d, { recursive: true, force: true });
  });
  const without = (name) => Object.fromEntries(Object.entries(FILES).filter(([k]) => k !== name));

  it("stops when did.json or an agent card is missing", async () => {
    for (const name of ["did.json", "agent-card.json", "agent.json"]) {
      const d = site2(without(`.well-known/${name}`));
      await expect(buildApexFunctions(d, join(d, "functions"))).rejects.toThrow(`/.well-known/${name}`);
      expect(existsSync(join(d, "functions", "_middleware.js"))).toBe(false);
    }
  });

  it("stops when there is no .well-known directory", () => {
    const d = site2({ "index.html": "x" });
    expect(() => listWellKnownFiles(d)).toThrow(/does not exist/);
  });

  it("stops on a name a URL parser could rewrite, on an HTML file and on a symbolic link", () => {
    expect(() => listWellKnownFiles(site2({ ...FILES, ".well-known/has space.json": "{}" }))).toThrow(/outside/);
    expect(() => listWellKnownFiles(site2({ ...FILES, ".well-known/a%2Fb.json": "{}" }))).toThrow(/outside/);
    expect(() => listWellKnownFiles(site2({ ...FILES, ".well-known/page.html": "<p>" }))).toThrow(/HTML file/);
    const d = site2(FILES);
    symlinkSync(join(d, "index.html"), join(d, ".well-known", "link.json"));
    expect(() => listWellKnownFiles(d)).toThrow(/symbolic link/);
  });

  it("stops when the template has lost its marker", () => {
    expect(() => renderMiddleware(LISTED, "export async function onRequest() {}")).toThrow(/marker/);
  });
});

describe("csoai-site-deploy.yml uses the built middleware", () => {
  const code = (text) => text.split("\n").filter((l) => !/^\s*#/.test(l)).join("\n");
  const steps = WORKFLOW.slice(WORKFLOW.indexOf("\n    steps:\n"))
    .split(/\n(?=      - )/)
    .slice(1)
    .map((block) => ({ name: (block.match(/^      - name:\s*(.+)$/m) || [])[1] || "", block }));
  const inject = steps.findIndex((s) => /^Inject redirect-only middleware/.test(s.name));
  const deploy = steps.findIndex((s) => /^Deploy to csoai-site/.test(s.name));
  const checkout = steps.findIndex((s) => /uses:\s*actions\/checkout@/.test(s.block) && /scripts\/csoai-site/.test(s.block));

  it("builds the list in the last step before the upload, after every step that adds a file", () => {
    expect(inject).toBeGreaterThan(0);
    expect(deploy).toBe(inject + 1);
    expect(code(steps[deploy].block)).toMatch(/wrangler pages deploy _site --project-name=csoai-site/);
  });

  it("runs the builder from this repository, in the directory the upload runs in", () => {
    expect(checkout).toBeGreaterThan(-1);
    expect(checkout).toBeLessThan(inject);
    const path = (steps[checkout].block.match(/^\s+path:\s*(\S+)\s*$/m) || [])[1];
    expect(path).toBeTruthy();
    expect(steps[checkout].block).toMatch(/persist-credentials:\s*false/);
    const run = code(steps[inject].block);
    expect(run).toContain(`node ../${path}/scripts/csoai-site/build-apex-functions.mjs _site functions`);
    expect(steps[inject].block).toMatch(/working-directory:\s*src/);
    expect(steps[deploy].block).toMatch(/working-directory:\s*src/);
  });

  it("no longer writes a pass-through handler by hand", () => {
    const all = code(WORKFLOW);
    expect(all).not.toMatch(/context\.next\(\)/);
    expect(all).not.toMatch(/cat\s*>\s*functions\/_middleware\.js/);
    expect(all).not.toMatch(/Response\.redirect\(/);
  });

  it("reads an unknown /.well-known/ path on the live apex after the deploy and requires 404", () => {
    const verify = steps.find((s) => /^Verify trust root live on the apex/.test(s.name));
    expect(verify).toBeTruthy();
    const run = code(verify.block);
    expect(run).toMatch(/https:\/\/csoai\.org\/\.well-known\/no-such-file-\$\{GITHUB_RUN_ID\}/);
    expect(run).toMatch(/expected 404/);
  });
});
