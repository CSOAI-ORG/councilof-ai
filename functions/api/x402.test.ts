// Tests for GET /api/x402 — the machine catalog. This is the door an agent comes through, so
// the things asserted here are the things a client does the moment it reads the document:
// fetch a URL field, and look for an amount it must NOT find.

import { describe, expect, it } from "vitest";
import { onRequestGet } from "./x402";

const CATALOG_URL = "https://councilof.ai/api/x402";

const catalog = async (env: Record<string, string> = {}) => {
  const res = await (onRequestGet as unknown as (c: unknown) => Promise<Response>)({
    request: new Request(CATALOG_URL),
    env,
  });
  return (await res.json()) as Record<string, any>;
};

/** Every key whose value the catalog documents as a URL — the ones a client will fetch. */
const URL_KEYS = new Set(["resource", "free_preview", "free_status", "well_known", "url", "href"]);

/** Walk the document and yield [jsonPath, value] for every documented-URL field. */
function urlFields(node: unknown, path = "$"): [string, unknown][] {
  const out: [string, unknown][] = [];
  if (Array.isArray(node)) {
    node.forEach((v, i) => out.push(...urlFields(v, `${path}[${i}]`)));
  } else if (node && typeof node === "object") {
    for (const [k, v] of Object.entries(node)) {
      if (URL_KEYS.has(k)) out.push([`${path}.${k}`, v]);
      // `also` and `recent_free` hold bare URLs under free-form keys, so descend and treat
      // every string inside them as a URL field too.
      else if (k === "also" || k === "recent_free") {
        const inner = Array.isArray(v) ? v.entries() : Object.entries(v as object);
        for (const [ik, iv] of inner as Iterable<[unknown, unknown]>) out.push([`${path}.${k}.${String(ik)}`, iv]);
      } else out.push(...urlFields(v, `${path}.${k}`));
    }
  }
  return out;
}

describe("/api/x402 — URL fields are URLs, not sentences", () => {
  // THE DEFECT THIS PINS (probed on the apex, 2026-09-04). Five of seven `free_preview` values
  // were a URL concatenated with an English sentence, and `witness.resource` carried THREE URLs
  // joined by " | " plus a parenthetical:
  //   "https://councilof.ai/api/witness?sha256=<64-hex> (the 402 body carries csoai.preview: …)"
  // A client doing the obvious `fetch(tier.free_preview)` got a mangled URL, so the documented
  // free door was unreachable BY MACHINE on most tiers — on the one document whose entire
  // purpose is to be read by machines. Placeholders like <id> and the `a|b|c` option lists are
  // fine: they are templates and contain no whitespace. A space is the tell.
  it("no documented-URL field contains prose", async () => {
    const fields = urlFields(await catalog());
    expect(fields.length).toBeGreaterThan(10); // the walker actually found the document
    const offenders = fields.filter(([, v]) => typeof v !== "string" || /\s/.test(v));
    expect(offenders).toEqual([]);
  });

  it("every documented-URL field parses as an absolute https URL on our origin", async () => {
    for (const [where, v] of urlFields(await catalog())) {
      const url = (() => {
        try {
          return new URL(String(v));
        } catch {
          return null;
        }
      })();
      expect(url, `${where} = ${String(v)}`).not.toBeNull();
      expect(url!.protocol, where).toBe("https:");
    }
  });

  // The catalog's own stated invariant: "amounts surface only inside a 402 challenge". It says
  // so in prose, so it should be enforced rather than trusted — a price that leaks here is the
  // same doctrine breach price-gate.mjs exists to stop on the HTML side.
  it("publishes no amount anywhere in the document", async () => {
    const json = JSON.stringify(await catalog());
    // The `amounts:` field NAMES the rule; strip it before looking for violations of it.
    const withoutTheRuleItself = json.replace(/"amounts":"[^"]*"/g, '""');
    expect(withoutTheRuleItself).not.toMatch(/[£$€]\s?\d/);
  });

  // A DUPLICATE KEY IN THIS LITERAL IS A SILENT PUBLISHED FALSEHOOD, and it has now happened
  // twice in this one file: `tier: 1, tier: 4` (recorded in a comment above the tier that kept
  // the wrong number), and TWO `free_forever` arrays — the second won, so the first was dropped
  // whole and /api/witness/status disappeared from the published set. The catalog advertised 8
  // free surfaces where 9 are free. esbuild only WARNS, and a warning in a test run scrolls past.
  // So assert the union directly: every free door either list ever named must still be named.
  it("free_forever names every door either duplicate list contained", async () => {
    const free: string[] = (await catalog()).free_forever;
    for (const path of [
      "/gspc-verify",
      "/api/gspc",
      "/root.json",
      "/api/fines",
      "/api/proof",
      "/api/witness/status", // only the DROPPED list had this one
      "/api/receipts/batch", // only the surviving list had this one
      "/receipts/root-history.json",
      "/methodology",
    ]) {
      expect(free.some((f) => new URL(f).pathname.startsWith(path)), `free_forever missing ${path}`).toBe(true);
    }
    expect(new Set(free).size, "free_forever repeats a door").toBe(free.length);
  });

  // The GENERIC form of the same defect, and it has to read the SOURCE to work.
  //
  // The obvious version of this test is vacuous, and was written and thrown away here before
  // anyone relied on it: comparing key counts in the response text against the same text after
  // a JSON round-trip can never fail, because JavaScript collapses duplicate keys when the
  // object LITERAL is evaluated — long before the response is serialised. By the time any
  // runtime assertion can see the document, the dropped key is already gone without trace.
  // Only the source still holds the evidence, so that is what is checked. esbuild reports the
  // duplicate as a warning, and a warning in a test run just scrolls past; this turns it red.
  it("the catalog source declares no key twice", async () => {
    const { transform } = await import("esbuild");
    const src = await import("node:fs/promises").then((fs) =>
      fs.readFile(new URL("./x402.ts", import.meta.url), "utf8"),
    );
    const { warnings } = await transform(src, { loader: "ts" });
    const dupes = warnings.filter((w) => /duplicate key/i.test(w.text));
    expect(dupes.map((w) => `${w.text} (line ${w.location?.line})`)).toEqual([]);
  });

  it("reports the rail mode from env rather than asserting one", async () => {
    expect((await catalog()).rail.mode).toBe("challenge-only");
    expect((await catalog({ X402_FACILITATOR_URL: "https://f.example" })).rail.mode).toBe("live");
  });
});
