// /api/momentum — every figure read live, sourced and dated; a failed source is OMITTED, never 0.
//
// The fake upstream below answers each URL the producer reads with a small, shape-faithful body
// (the shapes were read from the live endpoints on 2026-09-27). Each failure test then breaks ONE
// source and asserts the figure is absent from `figures`, named in `omitted` with a reason, and
// that no figure anywhere carries the value 0.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";

import {
  EVIDENCE_INDEX,
  LISTING_LINE,
  PYPI_FOOTPRINT,
  RECENT_SOURCES,
  SCHEMA,
  SELF_READ_DATASETS,
  buildMomentum,
  floorCompact,
  type Deps,
  type Payload,
} from "./_momentum";
import { _resetMomentumCache, getMomentum, onRequestGet, onRequestHead } from "./momentum";

const ORIGIN = "https://councilof.ai";
const NOW = new Date("2026-09-27T09:00:00Z");
const HF = "https://huggingface.co";

type Route = (url: string, init?: RequestInit) => Response | Promise<Response> | "hang";

const json = (v: unknown, status = 200) => new Response(JSON.stringify(v), { status, headers: { "content-type": "application/json" } });
const text = (v: string, status = 200) => new Response(v, { status });

function upstream(): Record<string, Route> {
  const day = "2026-09-26";
  const dir = `measurement-index/${day}`;
  return {
    [`${ORIGIN}/api/gspc`]: () => json({ totals: { axes: 23, measured_axes: 23, unmeasured_axes: 0 } }),
    [`${ORIGIN}/api/state`]: () =>
      json({
        card_chain: {
          bodies_published: { value: 335, kind: "catalogued", as_of: "2026-08-19T09:24:39Z" },
          bodies_verified_valid: { value: 335, kind: "measured", as_of: "2026-08-19T09:24:39Z" },
        },
      }),
    [`${ORIGIN}/api/corrections`]: () =>
      json({
        signature_state: "VALID",
        corrections: [
          { id: "C-2026-0926-06", date: "2026-09-26" },
          { id: "C-2026-0925-01", date: "2026-09-25" },
          { id: "C-2026-0901-01", date: "2026-09-01" },
        ],
      }),
    [`${ORIGIN}/api/x402-quotes`]: () => json({ as_of: "2026-09-27T08:59:00Z", quotes: [{ http: 402 }, { http: 402 }, { http: 500 }] }),
    [`${ORIGIN}/mcp`]: () =>
      text(`event: message\ndata: ${JSON.stringify({ jsonrpc: "2.0", id: 1, result: { tools: [{ name: "a" }, { name: "b" }, { name: "c" }] } })}\n\n`),
    [`${ORIGIN}/state/2026-09/numbers.json`]: () => json({ as_of: "2026-09-26T10:34:15Z" }),
    [`${ORIGIN}${RECENT_SOURCES[1].date_url}`]: () => json({ day: "2026-09-25" }),
    [`${ORIGIN}/interop/memberships.json`]: () => json({ rows: [{ id: "nist-ai-200-2", since: "2026-09-17" }] }),
    [`${HF}/api/datasets/${EVIDENCE_INDEX}/tree/main/measurement-index`]: () => json([{ type: "directory", path: dir }, { type: "file", path: "measurement-index/README.md" }]),
    [`${HF}/api/datasets/${EVIDENCE_INDEX}/tree/main/${dir}`]: () =>
      json(
        [
          `measurement-index-v0.2-${day}.json`,
          `measurement-index-v0.2-${day}.signed.json`,
          `measurement-index-v0.2-${day}.json.ots`,
          `measurement-index-chain-head-${day}.json`,
          `measurement-index-v0.2-${day}.rekor-receipt.json`,
        ].map((f) => ({ type: "file", path: `${dir}/${f}` })),
      ),
    [`${HF}/datasets/${EVIDENCE_INDEX}/resolve/main/${dir}/measurement-index-v0.2-${day}.json`]: () => json({ as_of: "2026-09-26T10:34:15Z", n_capsules_total: 13184 }),
    [`${HF}/datasets/${EVIDENCE_INDEX}/resolve/main/${dir}/measurement-index-chain-head-${day}.json`]: () =>
      json({ as_of: "2026-09-26T13:28:46Z", head_date: day, bitcoin_attested_days: [{ date: day, heights: [968674] }], verification: { result: "CHAIN_INTACT" } }),
    [`${HF}/datasets/${EVIDENCE_INDEX}/resolve/main/${dir}/measurement-index-v0.2-${day}.rekor-receipt.json`]: () => json({ logIndex: 2968539665 }),
    [PYPI_FOOTPRINT]: () =>
      json({
        schema: "csoai.pypi-footprint/0.1",
        as_of: "2026-09-27T03:14:21Z",
        state: "PARTIAL",
        n_packages: 400,
        n_counted: 399,
        all_time_total: 2510807,
        last_30d: 282290,
        last_7d: 40829,
        last_7d_window: "2026-09-20..2026-09-26",
        last_30d_is_lower_bound: true,
        packages: [
          { name: "csoai-gspc", entity: "csoai", all_time: 4025, last_30d: 4025, last_7d: 528 },
          { name: "council-signal-mcp", entity: "csoai", all_time: 2705, last_30d: 1348, last_7d: 145 },
          { name: "csoai-new", entity: "csoai", all_time: 300, last_30d: 300, last_7d: 300 },
          { name: "meok-a", entity: "meok", all_time: 2400000, last_30d: 250000, last_7d: 38000 },
          { name: "meok-b", entity: "meok", all_time: 90000, last_30d: 20000, last_7d: 1500 },
          { name: "joint-a", entity: "joint", all_time: 10000, last_30d: 5000, last_7d: 300 },
          { name: "langchain-csoai", entity: "unattributed", all_time: 353, last_30d: 353, last_7d: 353 },
          { name: "list1", entity: "unattributed", all_time: null, last_30d: null, last_7d: null },
        ],
      }),
    "https://zenodo.org/api/records/22985467": () =>
      json({ doi: "10.5281/zenodo.22985467", metadata: { title: "Same model, same prompts, different answers", publication_date: "2026-09-27" }, stats: { unique_downloads: 0 } }),
    // The concept record id: Zenodo 302s it to the newest version, which is what this mock answers with.
    // A pin on one version (22811459, "22 axes") would not be answered here and the figure would be omitted.
    "https://zenodo.org/api/records/22293340": () =>
      json({ doi: "10.5281/zenodo.22987453", metadata: { title: "GSPC board snapshot", publication_date: "2026-09-22" }, stats: { unique_downloads: 223 } }),
    "https://registry.modelcontextprotocol.io/v0/servers?search=io.github.CSOAI-ORG/gspc&version=latest": () =>
      json({ servers: [{ server: { name: "io.github.CSOAI-ORG/gspc", version: "1.4.2" } }] }),
    "https://raw.githubusercontent.com/EthicalML/awesome-artificial-intelligence-regulation/master/README.md": () => text("# list\n* one\n* [Council of AI](https://councilof.ai) - measurement\n"),
    "https://raw.githubusercontent.com/awesomedata/awesome-public-datasets/master/README.rst": () => text("x\n* GSPC <https://huggingface.co/datasets/csoai/gspc-board>\n"),
    "https://glama.ai/mcp/connectors/io.github.CSOAI-ORG/gspc": () => text("<html>io.github.CSOAI-ORG/gspc</html>"),
    "https://smithery.ai/servers/csoai/gspc": () => text("<html>gspc https://councilof.ai/api-docs/</html>"),
    "https://402index.io/api/v1/services?q=councilof.ai&limit=100": () => json({ total: 1, services: [{ url: "https://councilof.ai/api/free-door" }] }),
    "https://raw.githubusercontent.com/api-evangelist/councilof-ai/main/README.md": () => text("profile of https://councilof.ai/openapi.json"),
  };
}

function hfList(): Route {
  return () =>
    json([
      { id: "csoai/gspc-board", private: false, downloads: 1000, downloadsAllTime: 3000, likes: 2, tags: ["doi:10.57967/hf/10114"] },
      { id: "csoai/mcp-census", private: false, downloads: 500, downloadsAllTime: 600, likes: 1, tags: [] },
      { id: "csoai/gspc-hub-cards", private: false, downloads: 700, downloadsAllTime: 900, likes: 0, tags: [] },
      { id: "csoai/secret", private: true, downloads: 99999, likes: 0, tags: [] },
    ]);
}

function deps(overrides: Record<string, Route> = {}, timeoutMs?: number): Deps {
  const routes = { ...upstream(), ...overrides };
  return {
    origin: ORIGIN,
    now: () => NOW,
    timeoutMs,
    fetch: (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      let route = routes[url];
      if (!route && url.startsWith(`${HF}/api/datasets?author=csoai`)) route = routes.__hf_list ?? hfList();
      if (!route && url.startsWith("https://datasets-server.huggingface.co/size?dataset=")) {
        route = routes.__dss ?? (() => json({ size: { dataset: { num_rows: 1234 } } }));
      }
      if (!route) return new Response("no route", { status: 404 });
      const out = route(url, init);
      if (out === "hang") {
        return new Promise<Response>((_, reject) => {
          init?.signal?.addEventListener("abort", () => reject(Object.assign(new Error("timed out"), { name: "TimeoutError" })));
        });
      }
      return out;
    }) as typeof fetch,
  };
}

const ids = (p: Payload) => p.figures.map((f) => f.id);
const noZeros = (p: Payload) => {
  for (const f of p.figures) {
    expect(f.value).toBeGreaterThan(0);
    expect(f.display).not.toMatch(/^0\b/);
  }
};

describe("/api/momentum — every figure is live, sourced and dated", () => {
  it("builds every figure from its source, each with value, as_of, source_url and label", async () => {
    const p = await buildMomentum(deps());
    expect(p.schema).toBe(SCHEMA);
    expect(ids(p)).toEqual([
      "board",
      "signed_cards",
      "corrections",
      "capsules",
      "pypi_csoai_all_time",
      "pypi_meok_all_time",
      "hf_datasets",
      "hf_downloads_30d_self_read",
      "hf_downloads_30d_other",
      "census_rows",
      "mcp_tools",
      "x402_doors",
      "zenodo_board_snapshot",
    ]);
    for (const f of p.figures) {
      expect(typeof f.value).toBe("number");
      expect(f.label.length).toBeGreaterThan(3);
      expect(f.source_url).toMatch(/^https:\/\//);
      expect(Number.isFinite(Date.parse(f.as_of))).toBe(true);
    }
    noZeros(p);
    const by = Object.fromEntries(p.figures.map((f) => [f.id, f]));
    expect(by.board.display).toBe("23 of 23");
    expect(by.signed_cards.value).toBe(335);
    expect(by.corrections.value).toBe(3);
    expect(by.corrections.trend?.text).toBe("+2 this week");
    expect(by.capsules.value).toBe(13184);
    expect(by.capsules.detail).toContain("Bitcoin block 968674");
    // 29 Sep 2026 (growth gaps A6): CSOAI's labelled packages and MEOK AI Labs' are separate figures.
    expect(by.pypi_csoai_all_time.value).toBe(4025 + 2705 + 300);
    expect(by.pypi_csoai_all_time.label).toBe("PyPI downloads, CSOAI packages, all-time");
    expect(by.pypi_csoai_all_time.detail).toContain("3 packages labelled CSOAI");
    expect(by.pypi_csoai_all_time.detail).toContain("1 package had every download in the last 7 days");
    expect(by.pypi_csoai_all_time.detail).toContain("1 package labelled joint and 2 packages unattributed are in neither figure");
    expect(by.pypi_csoai_all_time.trend?.delta).toBe(528 + 145 + 300);
    expect(by.pypi_meok_all_time.value).toBe(2490000);
    expect(by.pypi_meok_all_time.label).toContain("MEOK AI Labs");
    expect(by.pypi_meok_all_time.label).toContain("not CSOAI");
    expect(p.anchors.find((a) => a.id === "rekor")?.links?.[0].url).toBe("https://search.sigstore.dev/?logIndex=2968539665");
    expect(by.pypi_csoai_all_time.display).toBe("7,030");
    expect(by.pypi_csoai_all_time.lower_bound).toBe(true); // the record is PARTIAL
    // The combined figure is gone: no figure carries the estate total.
    expect(p.figures.some((f) => f.value === 2510807)).toBe(false);
    expect(by.hf_datasets.value).toBe(3); // the private dataset is not counted
    expect(by.hf_downloads_30d_self_read.value).toBe(700);
    expect(by.hf_downloads_30d_other.value).toBe(1500);
    expect(by.census_rows.value).toBe(1234); // one census dataset in the fake list
    expect(by.mcp_tools.value).toBe(3);
    expect(by.x402_doors.value).toBe(2);
    expect(by.x402_doors.detail).toBe("2 of 3 listed doors answered");
    expect(p.omitted).toEqual([]);
  });

  it("a paper with zero downloads is dated work, never a 0 on the strip", async () => {
    const p = await buildMomentum(deps());
    expect(ids(p)).not.toContain("zenodo_paper");
    expect(p.anchors.find((a) => a.id === "paper_doi")?.value).toBe("10.5281/zenodo.22985467");
    expect(p.recent.find((r) => r.id === "paper")?.date).toBe("2026-09-27");
  });

  it("OMITS a figure whose source fails (HTTP 500) - it is absent, named with a reason, and never zeroed", async () => {
    const p = await buildMomentum(deps({ [`${ORIGIN}/api/gspc`]: () => json({ error: "boom" }, 500) }));
    expect(ids(p)).not.toContain("board");
    const o = p.omitted.find((x) => x.id === "board");
    expect(o?.reason).toMatch(/HTTP 500/);
    noZeros(p);
    expect(ids(p)).toContain("signed_cards"); // one failure takes nothing else down
  });

  it("OMITS a figure whose source times out", async () => {
    const p = await buildMomentum(deps({ [PYPI_FOOTPRINT]: () => "hang" }, 50));
    expect(ids(p)).not.toContain("pypi_csoai_all_time");
    expect(p.omitted.find((x) => x.id === "pypi_csoai_all_time")?.reason).toMatch(/timeout/);
    noZeros(p);
  });

  it("OMITS a source that answers with an unreadable shape instead of printing 0", async () => {
    const p = await buildMomentum(deps({ [`${ORIGIN}/api/gspc`]: () => json({ totals: { axes: 23, measured_axes: null } }) }));
    expect(ids(p)).not.toContain("board");
    const p2 = await buildMomentum(deps({ __hf_list: () => json([]) }));
    expect(ids(p2)).not.toContain("hf_datasets");
    expect(ids(p2)).not.toContain("hf_downloads_30d_self_read");
    expect(ids(p2)).not.toContain("hf_downloads_30d_other");
    expect(ids(p2)).not.toContain("census_rows");
    noZeros(p2);
  });

  it("OMITS a stale PyPI record rather than showing it as today's figure", async () => {
    const stale = () =>
      json({ schema: "csoai.pypi-footprint/0.1", as_of: "2026-09-24T03:00:00Z", state: "READ", n_packages: 400, n_counted: 400, all_time_total: 2400000 });
    const p = await buildMomentum(deps({ [PYPI_FOOTPRINT]: stale }));
    expect(ids(p)).not.toContain("pypi_csoai_all_time");
    expect(p.omitted.find((x) => x.id === "pypi_csoai_all_time")?.reason).toMatch(/h old/);
  });

  it("never shows the combined CSOAI + MEOK figure as CSOAI's: a record with no entity split is omitted", async () => {
    const combined = () =>
      json({ schema: "csoai.pypi-footprint/0.1", as_of: "2026-09-27T03:14:21Z", state: "READ", n_packages: 400, n_counted: 400, all_time_total: 2400000 });
    const p = await buildMomentum(deps({ [PYPI_FOOTPRINT]: combined }));
    expect(ids(p).filter((i) => i.startsWith("pypi"))).toEqual([]);
    expect(p.omitted.find((x) => x.id === "pypi_csoai_all_time")?.reason).toMatch(/no per-entity split/);
    // by_entity alone is enough (no 7-day trend then).
    const byEntity = () =>
      json({ schema: "csoai.pypi-footprint/0.1", as_of: "2026-09-27T03:14:21Z", state: "READ", n_packages: 400, n_counted: 400, all_time_total: 2400000,
        by_entity: { csoai: { n_packages: 24, all_time: 96427, last_30d: 19780 }, meok: { n_packages: 318, all_time: 2358846, last_30d: 232524 } } });
    const q = await buildMomentum(deps({ [PYPI_FOOTPRINT]: byEntity }));
    const f = q.figures.find((x) => x.id === "pypi_csoai_all_time");
    expect(f?.value).toBe(96427);
    expect(f?.trend).toBeUndefined();
  });

  it("prints 'every one verifies' only when the source says every published card verifies", async () => {
    const p = await buildMomentum(
      deps({
        [`${ORIGIN}/api/state`]: () =>
          json({ card_chain: { bodies_published: { value: 335 }, bodies_verified_valid: { value: 334, kind: "measured" } } }),
      }),
    );
    expect(ids(p)).not.toContain("signed_cards");
    expect(p.omitted.find((x) => x.id === "signed_cards")?.reason).toMatch(/334 verify of 335/);
  });

  it("prints 'all dated' only when every correction carries a date", async () => {
    const p = await buildMomentum(deps({ [`${ORIGIN}/api/corrections`]: () => json({ corrections: [{ id: "a", date: "2026-09-26" }, { id: "b" }] }) }));
    expect(ids(p)).not.toContain("corrections");
  });

  it("labels a partial census sum 'at least' and marks it a lower bound", async () => {
    let n = 0;
    const p = await buildMomentum(
      deps({
        __hf_list: () =>
          json([
            { id: "csoai/a-census", private: false, downloads: 1, likes: 0, tags: [] },
            { id: "csoai/b-census", private: false, downloads: 1, likes: 0, tags: [] },
          ]),
        __dss: () => (n++ === 0 ? json({ size: { dataset: { num_rows: 500 } } }) : json({}, 503)),
      }),
    );
    const c = p.figures.find((f) => f.id === "census_rows");
    expect(c?.value).toBe(500);
    expect(c?.lower_bound).toBe(true);
    expect(c?.label).toMatch(/at least/);
  });

  it("shows a listing only when the index names us on this read, with the endorsement line", async () => {
    const p = await buildMomentum(deps({ "https://smithery.ai/servers/csoai/gspc": () => text("<html>some other server</html>"), "https://glama.ai/mcp/connectors/io.github.CSOAI-ORG/gspc": () => json({}, 403) }));
    const l = p.listings.map((x) => x.id);
    expect(l).toContain("ethicalml-awesome-ai-regulation");
    expect(p.listings.find((x) => x.id === "ethicalml-awesome-ai-regulation")?.evidence).toBe("README line 3 names councilof.ai");
    expect(l).not.toContain("smithery");
    expect(l).not.toContain("glama");
    expect(p.omitted.map((o) => o.id)).toEqual(expect.arrayContaining(["listing:smithery", "listing:glama"]));
    expect(p.listing_line).toBe(LISTING_LINE);
    expect(LISTING_LINE).toBe("A listing is not an endorsement.");
  });

  it("every recent-work href is a page the sitemap lists", async () => {
    const sitemap = readFileSync(resolve(__dirname, "../../public/sitemap.xml"), "utf8");
    const p = await buildMomentum(deps());
    for (const r of p.recent) {
      if (/^https?:/.test(r.href)) continue;
      const path = r.href.split("#")[0];
      expect(sitemap, r.href).toContain(`<loc>https://councilof.ai${path}</loc>`);
      expect(r.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
    expect(p.recent.length).toBeLessThanOrEqual(6);
    expect(p.recent.map((r) => r.date)).toEqual([...p.recent.map((r) => r.date)].sort().reverse());
  });

  it("reports HF downloads as two figures that are never added, with our own share in 'other' UNMEASURED", async () => {
    const p = await buildMomentum(deps());
    const by = Object.fromEntries(p.figures.map((f) => [f.id, f]));
    const self = by.hf_downloads_30d_self_read;
    const other = by.hf_downloads_30d_other;
    expect(self.value).toBe(700);
    expect(other.value).toBe(1500);
    // never added: no figure, detail or display anywhere carries the sum
    expect(ids(p)).not.toContain("hf_downloads_30d");
    expect(p.figures.map((f) => f.value)).not.toContain(2200);
    const s = JSON.stringify(p);
    expect(s).not.toMatch(/\b2,?200\b/);
    // the named list travels with the payload, with its readers
    expect(p.hf_self_read.datasets).toEqual(SELF_READ_DATASETS);
    expect(p.hf_self_read.rule_url).toBe("https://huggingface.co/docs/hub/datasets-download-stats");
    expect(self.detail).toMatch(/named in hf_self_read/);
    // the self share inside "other" is UNMEASURED: a state with a reason, never a number
    expect(other.unmeasured).toEqual([{ field: "self_share", state: "UNMEASURED", reason: expect.stringMatching(/cannot be\s+separated/) }]);
    expect(other.detail).toMatch(/our own share inside is UNMEASURED/);
    expect(self.unmeasured).toBeUndefined();
    expect(p.rules.some((r) => /never added/.test(r) && /UNMEASURED/.test(r))).toBe(true);
  });

  it("omits a download group with no downloads, never shows it as 0", async () => {
    const p = await buildMomentum(
      deps({
        __hf_list: () =>
          json([
            { id: "csoai/gspc-hub-cards", private: false, downloads: 0, downloadsAllTime: 5, likes: 0, tags: [] },
            { id: "csoai/mcp-census", private: false, downloads: 40, downloadsAllTime: 60, likes: 0, tags: [] },
          ]),
      }),
    );
    expect(ids(p)).not.toContain("hf_downloads_30d_self_read");
    expect(p.omitted.find((o) => o.id === "hf_downloads_30d_self_read")?.reason).toMatch(/no downloads/);
    expect(p.figures.find((f) => f.id === "hf_downloads_30d_other")?.value).toBe(40);
    noZeros(p);
  });

  it("carries no price, no conformity wording and no membership label", async () => {
    const s = JSON.stringify(await buildMomentum(deps()));
    expect(s).not.toMatch(/[$€£]\s?\d/);
    expect(s).not.toMatch(/certif/i);
    expect(s).not.toMatch(/Linux Foundation|\bLF\b/);
  });
});

describe("floorCompact rounds DOWN and says so", () => {
  it.each([
    [2_510_807, "2.5M+"],
    [2_499_999, "2.4M+"],
    [288_999, "288K+"],
    [95_073, "95,073"],
    [12_000_000, "12M+"],
  ])("%i -> %s", (n, want) => {
    expect(floorCompact(n).display).toBe(want);
  });
});

describe("GET /api/momentum handler", () => {
  beforeEach(() => _resetMomentumCache());

  it("serves the schema with a one-hour cache and reuses the read inside the TTL", async () => {
    const d = deps();
    const a = await getMomentum(d, 1_000_000);
    const b = await getMomentum(d, 1_000_000 + 60_000);
    expect(a.cache).toBe("MISS");
    expect(b.cache).toBe("HIT");
    const c = await getMomentum(d, 1_000_000 + 3_600_001);
    expect(c.cache).toBe("MISS");
  });

  it("answers HEAD with the GET's status and headers and no body (HEAD used to fall through to the /api 404)", async () => {
    const real = globalThis.fetch;
    globalThis.fetch = deps().fetch;
    try {
      for (const path of ["/api/momentum", "/api/momentum/"]) {
        const res = await onRequestHead({ request: new Request(`${ORIGIN}${path}`, { method: "HEAD" }), waitUntil: () => {} } as any);
        expect(res.status).toBe(200);
        expect(res.headers.get("content-type")).toMatch(/application\/json/);
        expect(res.headers.get("cache-control")).toMatch(/max-age=\d+/);
        expect(res.body).toBeNull();
      }
    } finally {
      globalThis.fetch = real;
    }
  });

  it("answers JSON with cache-control from the Pages handler", async () => {
    const real = globalThis.fetch;
    globalThis.fetch = deps().fetch;
    try {
      const res = await onRequestGet({ request: new Request(`${ORIGIN}/api/momentum`), waitUntil: () => {} } as any);
      expect(res.status).toBe(200);
      expect(res.headers.get("cache-control")).toMatch(/max-age=\d+/);
      const body = await res.json();
      expect(body.schema).toBe(SCHEMA);
    } finally {
      globalThis.fetch = real;
    }
  });
});
