/**
 * The census opt-out, applied to publication as well as to probing.
 *
 * scripts/census/probe-exclusions.json is the census's own exclusion list (an operator who objects
 * names an endpoint or a host; every later probe skips it). The reach pages read the SAME file, with
 * the SAME matching rule as scripts/census/mcp-remote-probe.py excluded(): a host entry covers the
 * host and its subdomains; an endpoint entry covers that URL. Read fail-closed: a malformed file is
 * an error, never an empty list.
 *
 * robots.txt refusals are the other half: a row the census did not attempt because robots.txt
 * disallowed CSOAI-census (or could not be read — RFC 9309 treats that as disallow) gets no page.
 */
export interface Exclusion { id: string; match: "endpoint" | "host"; value: string }

export function loadExclusionsFromDoc(doc: unknown): Exclusion[] {
  const d = doc as { schema?: string; entries?: unknown[] };
  if (d?.schema !== "csoai.probe-exclusions/0.1" || !Array.isArray(d.entries)) throw new Error("probe-exclusions.json: not a csoai.probe-exclusions/0.1 document");
  return d.entries.map((raw) => {
    const e = raw as { id?: string; match?: string; value?: string };
    const v = String(e.value || "").trim();
    if ((e.match !== "endpoint" && e.match !== "host") || !v) throw new Error(`probe-exclusions.json: bad entry ${JSON.stringify(e)}`);
    return { id: e.id || v, match: e.match, value: e.match === "endpoint" ? v.replace(/\/+$/, "").toLowerCase() : v.toLowerCase() };
  });
}

export function excludedBy(url: string, exclusions: Exclusion[]): string | null {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  const host = u.hostname.toLowerCase();
  const norm = `${u.protocol}//${u.host}${u.pathname}`.replace(/\/+$/, "").toLowerCase();
  for (const e of exclusions) {
    if (e.match === "endpoint" && norm === e.value) return e.id;
    if (e.match === "host" && (host === e.value || host.endsWith("." + e.value))) return e.id;
  }
  return null;
}

export const isRobotsRefusal = (state: unknown, reason: unknown): boolean =>
  state === "ROBOTS_DISALLOWED" || /robots\.txt (rules )?disallow|robots\.txt HTTP \d+: treated as disallow/i.test(String(reason || ""));
