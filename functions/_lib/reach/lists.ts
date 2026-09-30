/**
 * Entity lists — ONE derivation for the hub pages' data, the per-type sitemaps and the feeds, so a
 * URL can only be listed if the same loader the page uses would render it (the sitemap lists what
 * the edge serves). Opted-out and robots-refused entities never reach a list; entities without data
 * are not listed.
 */
import { type Ctx, SITE } from "./core";
import { loadA2A } from "./agentCards";
import { loadMcpList } from "./mcp";
import { verifiedDays } from "./notes";
import { loadXl, pairs } from "./stablecoins";
import { TOPIC, pendingForDeployment, pendingForHost } from "./corrections";
import { loadCensus, loadDoors } from "./x402";

export const SITEMAP_CAP = 50_000;
export const TYPES = ["mcp-servers", "agent-cards", "x402", "stablecoins", "notes-daily"] as const;
export type EntityType = (typeof TYPES)[number];

export interface Listed { loc: string; lastmod: string | null; key: string; label: string; facets: Record<string, string | number | boolean | null> }

export async function listType(ctx: Ctx, t: EntityType): Promise<Listed[]> {
  switch (t) {
    case "mcp-servers": {
      const { rows } = await loadMcpList(ctx);
      // A host named in a pending correction keeps its page (which shows the correction) but its
      // finding counts are withheld here too, exactly as on the page.
      return rows.map((r) => {
        const held = pendingForHost(r[0] as string, undefined, TOPIC.mcp).length > 0;
        return {
          loc: `${SITE}/mcp-servers/${r[0]}/`, lastmod: (r[6] as string) || null, key: r[0] as string, label: r[0] as string,
          facets: held
            ? { endpoints: r[1] as number, CONSISTENT: null, INCONSISTENT: null, SINGLE_SURFACE: null, UNCHECKABLE: null, own_estate: !!r[7], withheld: true }
            : { endpoints: r[1] as number, CONSISTENT: r[2] as number, INCONSISTENT: r[3] as number, SINGLE_SURFACE: r[4] as number, UNCHECKABLE: r[5] as number, own_estate: !!r[7], withheld: false },
        };
      });
    }
    case "agent-cards": {
      const d = await loadA2A(ctx);
      return [...d.byHost.keys()].sort().map((h) => {
        const rows = d.byHost.get(h)!;
        const held = pendingForHost(h, undefined, TOPIC.a2a).length > 0;
        return { loc: `${SITE}/agent-cards/${h}/`, lastmod: d.record.as_of, key: h, label: h, facets: held ? { state: "WITHHELD", signatures: "WITHHELD", cards: rows.length } : { state: rows[0].state, signatures: rows[0].sig_state ?? "UNMEASURED", cards: rows.length } };
      });
    }
    case "x402": {
      const [{ doors }, census] = await Promise.all([loadDoors(ctx), loadCensus(ctx)]);
      return [
        ...doors.map((d) => ({ loc: `${SITE}/x402/${d.id}/`, lastmod: null, key: d.id, label: d.name || d.id, facets: { kind: "our door", observed: "UNMEASURED" } })),
        ...Object.keys(census.hosts).sort().map((h) => {
          const cards = census.hosts[h];
          const last = cards.map((c) => c.observed_at).filter(Boolean).sort().at(-1) || census.as_of;
          const held = pendingForHost(h, undefined, TOPIC.x402).length > 0;
          return { loc: `${SITE}/x402/${h}/`, lastmod: last, key: h, label: h, facets: { kind: "census host", observed: held ? "WITHHELD" : (cards[0].status ?? "UNMEASURED"), paid_observations: cards.length, series: "UNMEASURED" } };
        }),
      ];
    }
    case "stablecoins": {
      const d = await loadXl(ctx);
      return [...pairs(d).values()].sort((a, b) => `${a.asset}/${a.chain}`.localeCompare(`${b.asset}/${b.chain}`)).map((p) => {
        const symbols = [d.assets[p.asset]?.asset, ...d.deployments.filter((x) => x.asset_key === p.asset && x.ledger === p.chain).map((x) => x.product)].filter((x): x is string => !!x);
        const held = pendingForDeployment(symbols, p.chain).length > 0;
        return {
          loc: `${SITE}/stablecoins/${p.asset}/${p.chain}/`, lastmod: p.lastModified, key: `${p.asset}/${p.chain}`,
          label: `${(d.assets[p.asset]?.asset as string) || p.asset.toUpperCase()} on ${p.chain}`,
          facets: { asset: p.asset, chain: p.chain, issuer: d.assets[p.asset]?.issuer ?? null, parity: held ? "WITHHELD" : (d.parityStates[p.asset] ?? "UNMEASURED") },
        };
      });
    }
    case "notes-daily": {
      const days = await verifiedDays(ctx);
      return days.map((x) => ({ loc: `${SITE}/notes/daily/${x.date}/`, lastmod: x.as_of, key: x.date, label: x.date, facets: {} }));
    }
  }
}

const xmlEsc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const w3cDate = (iso: string | null) => (iso && /^\d{4}-\d{2}-\d{2}/.test(iso) ? iso.slice(0, 10) : null);

export function urlset(items: Listed[]): string {
  const body = items.slice(0, SITEMAP_CAP).map((i) => {
    const lm = w3cDate(i.lastmod);
    return `  <url>\n    <loc>${xmlEsc(i.loc)}</loc>\n${lm ? `    <lastmod>${lm}</lastmod>\n` : ""}  </url>`;
  }).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

export function chunk(items: Listed[], n: number): Listed[] {
  return items.slice((n - 1) * SITEMAP_CAP, n * SITEMAP_CAP);
}

export function sitemapIndex(entries: { loc: string; lastmod: string | null }[]): string {
  const body = entries.map((e) => `  <sitemap>\n    <loc>${xmlEsc(e.loc)}</loc>\n${w3cDate(e.lastmod) ? `    <lastmod>${w3cDate(e.lastmod)}</lastmod>\n` : ""}  </sitemap>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</sitemapindex>\n`;
}
