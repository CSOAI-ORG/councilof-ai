import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Every KV binding in wrangler.jsonc must name a real namespace id.
 *
 * 15 Sep 2026: #2487 bound WORKER_STATE_KV to the placeholder "TBD_CREATE_NAMESPACE". Unit tests
 * and every PR gate passed, then Cloudflare refused the Functions bundle on each master deploy
 * ("Error 8000022: Invalid KV namespace ID (TBD_CREATE_NAMESPACE). Not a valid hex string"),
 * so nothing merged after 05:06Z reached councilof.ai. A Cloudflare KV namespace id is 32 hex chars.
 */

/** Strip // and /* *\/ comments outside strings, then parse. */
export function parseJsonc(src: string): any {
  let out = "";
  let inStr = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inStr) {
      out += c;
      if (c === "\\") { out += src[++i] ?? ""; continue; }
      if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') { inStr = true; out += c; continue; }
    if (c === "/" && src[i + 1] === "/") { while (i < src.length && src[i] !== "\n") i++; out += "\n"; continue; }
    if (c === "/" && src[i + 1] === "*") { i += 2; while (i < src.length && !(src[i] === "*" && src[i + 1] === "/")) i++; i++; continue; }
    out += c;
  }
  return JSON.parse(out.replace(/,(\s*[}\]])/g, "$1"));
}

export function badKvIds(config: any): string[] {
  const ns: Array<{ binding?: string; id?: string; preview_id?: string }> = config?.kv_namespaces ?? [];
  const bad: string[] = [];
  for (const n of ns) {
    for (const key of ["id", "preview_id"] as const) {
      const v = n[key];
      if (key === "preview_id" && v === undefined) continue;
      if (typeof v !== "string" || !/^[0-9a-f]{32}$/.test(v)) bad.push(`${n.binding ?? "?"}.${key}=${String(v)}`);
    }
  }
  return bad;
}

describe("wrangler.jsonc KV bindings name real namespaces", () => {
  it("failing control: the placeholder that broke every deploy is caught", () => {
    const planted = `{
      // comment with a "quote" and a url https://example.com
      "kv_namespaces": [
        { "binding": "OK_KV", "id": "8244f80354c24a9ebadd227a8192a045" },
        { "binding": "WORKER_STATE_KV", "id": "TBD_CREATE_NAMESPACE" },
      ]
    }`;
    expect(badKvIds(parseJsonc(planted))).toEqual(["WORKER_STATE_KV.id=TBD_CREATE_NAMESPACE"]);
    expect(badKvIds({ kv_namespaces: [{ binding: "X" }] })).toEqual(["X.id=undefined"]);
    expect(badKvIds({ kv_namespaces: [{ binding: "Y", id: "8244F80354C24A9EBADD227A8192A045" }] })).toHaveLength(1);
  });

  it("the real wrangler.jsonc has no placeholder or malformed KV id", () => {
    const config = parseJsonc(readFileSync(resolve(__dirname, "../wrangler.jsonc"), "utf8"));
    expect(Array.isArray(config.kv_namespaces)).toBe(true);
    expect(config.kv_namespaces.length).toBeGreaterThan(0);
    expect(badKvIds(config)).toEqual([]);
  });
});
