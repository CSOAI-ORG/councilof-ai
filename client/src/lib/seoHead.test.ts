/**
 * The head producer must be right BEFORE any data arrives: the prerender snapshots whatever
 * document.title says at ~900ms, and 2026-09-16's clean prerender shipped 68 shell titles,
 * 141 shared withdrawal titles, 14 literal "undefined" titles and 14 missing descriptions.
 * Everything here runs with no fetch, no DOM library and no page component mounted.
 */
import { describe, expect, it, vi } from "vitest";
import {
  applyHead,
  COMPONENT_HEAD,
  DESCRIPTION_MAX,
  DESCRIPTION_MIN,
  fitDescription,
  maintainHead,
  resolveHead,
  ROUTE_HEAD,
  SHELL_TITLE,
  TITLE_MAX,
  type HeadDocument,
} from "./seoHead";
import { ROUTE_MANIFEST } from "../data/route-manifest";
import { isWithdrawnPath } from "./publicationState";

const GENERIC_TITLES = new Set([SHELL_TITLE, "Evidence review in progress | Council of AI", "undefined", "", "councilof-ai"]);

// Five representative routes, home excluded: a hand-mapped primary page, a legal page reached
// through an alias, a page that only ever set its own title after mount, a component-level
// fallback shared by aliases, and a parametrised evidence-note page nobody has hand-mapped.
const REPRESENTATIVE = ["/methodology", "/legal/terms", "/glossary", "/faq", "/notes/governance-same-bank-gap"];

describe("resolveHead — representative routes with no data", () => {
  for (const path of REPRESENTATIVE) {
    it(`${path} has a specific title and a description of ${DESCRIPTION_MIN}–${DESCRIPTION_MAX} chars`, () => {
      const h = resolveHead(path);
      expect(GENERIC_TITLES.has(h.title), `generic title "${h.title}"`).toBe(false);
      expect(h.title).not.toMatch(/undefined|\[object/);
      expect(h.title.length, h.title).toBeLessThanOrEqual(TITLE_MAX);
      expect(h.description.length, h.description).toBeGreaterThanOrEqual(DESCRIPTION_MIN);
      expect(h.description.length, h.description).toBeLessThanOrEqual(DESCRIPTION_MAX);
      expect(h.canonical).toBe(`https://councilof.ai${path}/`);
      expect(h.ogTitle).toBe(h.title);
      expect(h.ogDescription).toBe(h.description);
    });
  }

  it("distinct routes get distinct titles", () => {
    const titles = REPRESENTATIVE.map((p) => resolveHead(p).title);
    expect(new Set(titles).size).toBe(titles.length);
  });
});

describe("resolveHead — every layer of the fallback chain", () => {
  it("home is the site title, canonical is the bare origin", () => {
    const h = resolveHead("/");
    expect(h.source).toBe("route");
    expect(h.canonical).toBe("https://councilof.ai");
  });

  it("a withdrawn route names the thing and says it is withdrawn, never the shared notice title", () => {
    const post = resolveHead("/blog/proof-of-ai");
    expect(post.source).toBe("withdrawn");
    expect(post.title).toMatch(/Blog post: Proof Of AI — withdrawn/);
    expect(post.title).not.toMatch(/Evidence review in progress/);
    const industry = resolveHead("/industries/media/");
    expect(industry.title).toMatch(/Industry page: Media — withdrawn/);
    expect(industry.title).not.toBe(post.title);
    for (const h of [post, industry]) {
      expect(h.description.length).toBeGreaterThanOrEqual(DESCRIPTION_MIN);
      expect(h.description.length).toBeLessThanOrEqual(DESCRIPTION_MAX);
    }
  });

  it("a page that knows the real name refines the withdrawn fallback", () => {
    const h = resolveHead("/blog/proof-of-ai", { name: "Proof of AI: what a signed measurement card proves" });
    expect(h.title).toMatch(/^Proof of AI: what a signed measurement card proves — withdrawn/);
    expect(h.description).toMatch(/^Proof of AI: what a signed measurement card proves is withdrawn/);
  });

  it("parametrised families derive from the URL and stay inside the length bands", () => {
    for (const p of ["/gspc/provenance", "/for/regulator", "/vs/vanta", "/model/gpt-5", "/mcp/some-server", "/library/regulation", "/answers/iso42001-vs-etsi304223"]) {
      const h = resolveHead(p);
      expect(h.source, p).toBe("family");
      expect(GENERIC_TITLES.has(h.title)).toBe(false);
      expect(h.description.length, `${p}: ${h.description}`).toBeGreaterThanOrEqual(DESCRIPTION_MIN);
      expect(h.description.length, `${p}: ${h.description}`).toBeLessThanOrEqual(DESCRIPTION_MAX);
    }
    expect(resolveHead("/library/regulation").title).toMatch(/EU AI Act & Regulation/);
  });

  it("an alias inherits its component's head", () => {
    const a = resolveHead("/frequently-asked-questions");
    expect(a.source).toBe("component");
    expect(a.title).toBe(resolveHead("/faq").title);
  });

  it("an unknown path still gets a specific, in-band head rather than the shell", () => {
    const h = resolveHead("/no-such-page-ever");
    expect(h.source).toBe("derived");
    expect(h.title).toBe("No Such Page Ever | Council of AI");
    expect(h.description.length).toBeGreaterThanOrEqual(DESCRIPTION_MIN);
    expect(h.description.length).toBeLessThanOrEqual(DESCRIPTION_MAX);
  });

  it("query strings and trailing slashes do not change the answer", () => {
    expect(resolveHead("/gspc-arena?view=globe").title).toBe(resolveHead("/gspc-arena").title);
    expect(resolveHead("/about/").canonical).toBe("https://councilof.ai/about/");
  });
});

describe("the map itself obeys the rules it was written under", () => {
  const BANNED = /\b(tier|tiers|plans?|subscription|per-seat)\b|[£$€]\s?\d|\b(paddle|stripe|paypal)\b|\bsovereign\b|\bCEASAI\b|\bbyzantine\b|\bBFT\b|\b\d{1,3}\s+(?:canonical\s+|public\s+|measured\s+|quotable\s+)?(?:axes|axis|slots)\b|\bwe certify\b|\bour certification\b|\baccredited by us\b|\bwe accredit\b|\bour accreditation\b|\bwe endorse\b|\bwe enforce\b|(?<!-)\bonly\b|world's first|revolutionary|\bget certified\b|\bcertified by CSOAI\b/i;
  const all = [...Object.entries(ROUTE_HEAD), ...Object.entries(COMPONENT_HEAD)];

  it("is not empty and covers the routes the prerender writes as client-only shells", () => {
    expect(all.length).toBeGreaterThan(200);
    for (const r of ["/art50", "/assess", "/assessment", "/countdown", "/health-inventory", "/mcp-tools", "/receipt", "/rlusd", "/status", "/tool-commons"]) {
      expect(ROUTE_HEAD[r], `${r} missing from seo-head.json routes`).toBeTruthy();
    }
  });

  it("every description is 110–160 chars and every title is non-empty", () => {
    const bad = all.filter(([, v]) => !v.title || v.description.length < DESCRIPTION_MIN || v.description.length > DESCRIPTION_MAX)
      .map(([k, v]) => `${k} (${v.description.length})`);
    expect(bad).toEqual([]);
  });

  it("no description sells a tier, prints a price, types an axis count or uses a banned word", () => {
    const bad = all.filter(([, v]) => BANNED.test(v.description)).map(([k, v]) => `${k}: ${BANNED.exec(v.description)?.[0]}`);
    expect(bad).toEqual([]);
  });

  it("every static route in the manifest resolves to an in-band description without the shell title", () => {
    const bad: string[] = [];
    for (const r of ROUTE_MANIFEST) {
      if (isWithdrawnPath(r.path)) continue;
      const h = resolveHead(r.path);
      if (GENERIC_TITLES.has(h.title) || h.description.length < DESCRIPTION_MIN || h.description.length > DESCRIPTION_MAX) bad.push(`${r.path} → "${h.title}" (${h.description.length})`);
    }
    expect(bad).toEqual([]);
  });
});

describe("fitDescription", () => {
  it("pads a short lead with doctrine and clamps a long one at a word boundary", () => {
    const short = fitDescription("Glossary on Council of AI.");
    expect(short.length).toBeGreaterThanOrEqual(DESCRIPTION_MIN);
    expect(short.length).toBeLessThanOrEqual(DESCRIPTION_MAX);
    const long = fitDescription("word ".repeat(60).trim());
    expect(long.length).toBeLessThanOrEqual(DESCRIPTION_MAX);
    expect(long.length).toBeGreaterThanOrEqual(DESCRIPTION_MIN);
    expect(long).not.toMatch(/\bwor\b/);
  });
});

describe("applyHead writes title, description, OG and canonical into a document", () => {
  function stubDocument() {
    const nodes: Record<string, Map<string, string>> = {};
    const appended: string[] = [];
    const writes: string[] = [];
    const el = (key: string) => {
      const attrs = (nodes[key] ||= new Map());
      return { setAttribute: (n: string, v: string) => { writes.push(`${key}:${n}`); attrs.set(n, v); }, getAttribute: (n: string) => attrs.get(n) ?? null };
    };
    const keyOf = (selector: string) => selector.replace(/^(meta|link)\[/, "").replace(/\]$/, "").replace(/"/g, "");
    const doc: HeadDocument & { nodes: typeof nodes; appended: string[]; writes: string[] } = {
      title: "Council of AI — we measure, we sign, we re-attest",
      nodes,
      appended,
      writes,
      head: { appendChild: (n: unknown) => { appended.push(String((n as { __key?: string }).__key ?? "")); return n; } },
      querySelector: (selector) => (nodes[keyOf(selector)] ? el(keyOf(selector)) : null),
      createElement: (tag) => {
        const created = { __tag: tag, __key: "", attrs: new Map<string, string>() };
        return {
          setAttribute: (n: string, v: string) => {
            writes.push(`${tag}:${n}`);
            created.attrs.set(n, v);
            if ((n === "name" || n === "property" || n === "rel")) { created.__key = `${n}=${v}`; nodes[created.__key] = created.attrs; }
          },
          getAttribute: (n: string) => created.attrs.get(n) ?? null,
        };
      },
    };
    return doc;
  }

  it("creates the tags when the shell lacks them and overwrites them when it has them", () => {
    const doc = stubDocument();
    applyHead(resolveHead("/methodology"), doc);
    expect(doc.title).toBe("Methodology | Council of AI");
    expect(doc.nodes["name=description"]?.get("content")).toMatch(/deterministic predicates/);
    expect(doc.nodes["property=og:title"]?.get("content")).toBe("Methodology | Council of AI");
    expect(doc.nodes["rel=canonical"]?.get("href")).toBe("https://councilof.ai/methodology/");
    applyHead(resolveHead("/about"), doc);
    expect(doc.title).toBe("About | Council of AI");
    expect(doc.nodes["property=og:url"]?.get("content")).toBe("https://councilof.ai/about/");
  });

  it("never writes 'undefined' into the title", () => {
    const doc = stubDocument();
    applyHead({ ...resolveHead("/about"), title: undefined as unknown as string, ogTitle: "" }, doc);
    expect(doc.title).not.toBe("undefined");
  });

  it("does not mutate an already correct head when an observer sees its own update", () => {
    const doc = stubDocument();
    const h = resolveHead("/standards");
    applyHead(h, doc);
    doc.writes.length = 0;
    const appended = doc.appended.length;
    applyHead(h, doc);
    expect(doc.writes).toEqual([]);
    expect(doc.appended.length).toBe(appended);
  });

  it("repairs a delayed legacy title and description, including social tags, and disconnects", () => {
    const doc = stubDocument();
    let onChange = () => {};
    const disconnect = vi.fn();
    vi.stubGlobal("MutationObserver", class {
      constructor(callback: () => void) { onChange = callback; }
      observe() {}
      disconnect = disconnect;
    });
    try {
      const h = resolveHead("/standards");
      const cleanup = maintainHead(h, doc as unknown as Document);
      doc.title = "Legacy institution equivalence";
      doc.nodes["name=description"].set("content", "Legacy coverage promise");
      onChange();
      expect(doc.title).toBe(h.title);
      expect(doc.nodes["name=description"].get("content")).toBe(h.description);
      expect(doc.nodes["property=og:title"].get("content")).toBe(h.title);
      expect(doc.nodes["property=og:description"].get("content")).toBe(h.description);
      doc.writes.length = 0;
      onChange();
      expect(doc.writes).toEqual([]);
      cleanup();
      expect(disconnect).toHaveBeenCalledOnce();
    } finally { vi.unstubAllGlobals(); }
  });

  it("allows a record page to refine its own title after data arrives", () => {
    const doc = stubDocument();
    const observer = vi.fn();
    vi.stubGlobal("MutationObserver", observer);
    try {
      maintainHead(resolveHead("/notes/a-specific-record"), doc as unknown as Document);
      doc.title = "The record's loaded headline | Council of AI";
      expect(observer).not.toHaveBeenCalled();
      expect(doc.title).toContain("loaded headline");
    } finally { vi.unstubAllGlobals(); }
  });
});
