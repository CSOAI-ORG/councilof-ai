/**
 * install-truth.test.mjs — what the install surfaces actually offer, per route.
 *
 * WP-4 says the extension's source/load-unpacked status is not a store release, and the earlier
 * brief adds that the web app install contract is a local candidate whose browser eligibility
 * must be proven on production HTTPS. Probed 2026-09-05: the manifest link IS served on every
 * route checked.
 *
 * A FALSE ALARM WORTH RECORDING, because the next person will hit it. A first probe reported
 * /dashboard and /gspc-verify as missing the link. They are not. Both return 308 to their
 * trailing-slash form, and a probe that does not follow redirects reads an empty body and counts
 * zero. `curl -s` finds nothing; `curl -sL` finds the link. The routes were never broken; the
 * measurement was. This test therefore follows redirects, and asserts a non-empty body first so
 * an empty response can never be mistaken for a missing tag again.
 *
 * The icons are the second half of the same question. Chrome's installability criteria want a
 * 192px and a 512px icon; the manifest ships ONE entry, an SVG with sizes:"any". Modern Chrome
 * accepts that, but nothing here has been proven against a real browser install prompt — so the
 * honest state is LOCAL_CANDIDATE and this test records the shape rather than asserting the
 * prompt appears.
 *
 * The extension is unambiguous: extensions/chrome-gspc-verify/manifest.json has no `key` field,
 * so it is load-unpacked, and host_permissions are councilof.ai plus huggingface.co only. It is
 * not a store release and does not cover every AI host.
 *
 * Offline by default. LIVE_INSTALL=1 probes production.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "..");
const read = (p) => readFileSync(path.join(repo, p), "utf8");

const webManifest = JSON.parse(read("public/manifest.json"));
const extManifest = JSON.parse(read("extensions/chrome-gspc-verify/manifest.json"));

/** Every route that must offer the install contract. All of these currently do. */
const MUST_LINK = ["/", "/dashboard", "/gspc-verify"];

describe("install surfaces state only what they are", () => {
  it("the source template links the manifest", () => {
    assert.match(
      read("client/index.html"),
      /rel="manifest"/,
      "client/index.html must link the manifest — this is the template every route inherits",
    );
  });

  it("the extension is load-unpacked and host-limited, not a store release", () => {
    assert.ok(
      !("key" in extManifest),
      "extensions/chrome-gspc-verify/manifest.json gained a `key` field. If it is now store-" +
        "signed, say so everywhere it is described as source/load-unpacked.",
    );
    const hosts = extManifest.host_permissions ?? extManifest.permissions ?? [];
    assert.deepEqual(
      [...hosts].sort(),
      ["https://councilof.ai/*", "https://huggingface.co/*"],
      `extension host_permissions changed to ${hosts.join(", ")}. It is described as ` +
        `Hugging-Face-only; update the copy in the same change or the claim goes stale.`,
    );
  });

  it("the web manifest carries the fields an install prompt needs", () => {
    for (const f of ["name", "start_url", "display", "icons"]) {
      assert.ok(webManifest[f], `manifest.json is missing ${f}`);
    }
    assert.equal(webManifest.display, "standalone");
    // Recorded, not asserted as sufficient: one SVG entry. No browser install prompt has been
    // observed, so nothing here may be described as installable — only as a candidate.
    assert.ok(Array.isArray(webManifest.icons) && webManifest.icons.length >= 1);
  });

  /**
   * The extension hardcodes councilof.ai URLs — the board endpoint, signed card fixtures its
   * tests verify against, and the HOW-TO-VERIFY documents it points a reader at. It also
   * injects a badge on huggingface.co linking to /gspc-verify, so a rotted URL is a broken
   * link on somebody else's site, published under our name.
   *
   * Probed 2026-09-05: all ten resolve. Nothing in the repository can prove that — a
   * hardcoded URL is only as good as the host, and the host is not this checkout.
   */
  it("live: every councilof.ai URL the extension hardcodes still resolves", async () => {
    if (!process.env.LIVE_INSTALL) {
      console.log("      (offline: LIVE_INSTALL unset — extension URLs NOT probed)");
      return;
    }
    const { readdirSync, statSync } = await import("node:fs");
    const dir = path.join(repo, "extensions/chrome-gspc-verify");
    const files = [];
    const walk = (d) => {
      for (const e of readdirSync(d)) {
        const p = path.join(d, e);
        if (statSync(p).isDirectory()) walk(p);
        else if (/\.(js|html|json|md)$/.test(e)) files.push(p);
      }
    };
    walk(dir);
    const urls = new Set();
    for (const f of files) {
      for (const m of readFileSync(f, "utf8").matchAll(/https:\/\/councilof\.ai[a-zA-Z0-9./_-]*/g)) {
        urls.add(m[0]);
      }
    }
    assert.ok(urls.size >= 5, `only ${urls.size} councilof.ai URLs found — the walk missed the extension`);

    const dead = [];
    for (const u of urls) {
      const res = await fetch(u, { redirect: "follow" });
      if (!res.ok) dead.push(`${u} -> ${res.status}`);
    }
    assert.deepEqual(
      dead,
      [],
      `the extension points at URLs that no longer resolve: ${dead.join("; ")}. One of these ` +
        `is injected as a badge link on huggingface.co, so a rot here is a broken link on ` +
        `someone else's site carrying our name.`,
    );
  });

  it("production serves the manifest link on the routes it claims to", async () => {
    if (!process.env.LIVE_INSTALL) {
      console.log("      (offline: LIVE_INSTALL unset — production NOT probed)");
      return;
    }
    for (const route of MUST_LINK) {
      const res = await fetch(`https://councilof.ai${route}`); // follows the 308 to /route/
      const html = await res.text();
      // Guard the measurement before the claim: an empty body is an unfollowed redirect, not a
      // missing tag. Asserting only the regex is how the first probe produced a false finding.
      assert.ok(
        html.length > 1000,
        `${route} returned ${html.length} bytes (status ${res.status}) — that is a redirect or ` +
          `an error, not a page. Do not read a missing manifest link out of an empty body.`,
      );
      assert.match(
        html,
        /rel="manifest"/,
        `${route} does not link the manifest, so no browser can offer to install from it`,
      );
    }
  });

});
