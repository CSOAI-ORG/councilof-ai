/**
 * npm-package-parity.test.mjs — the published SDK is the repository, byte for byte.
 *
 * WP-4 asks for one versioned capability registry across HTTP, MCP, AG-UI, A2A, A2UI, SDK,
 * plugin, extension and app, with actual host support tested. Six of those nine were already
 * covered by the other guards in this directory. The SDK/plugin surface — the npm package
 * `csoai-gspc-mcp`, which is what anyone actually installs — was not assessed at all.
 *
 * Measured 2026-09-05 against the live registry: `csoai-gspc-mcp@0.2.1`, 4 published versions,
 * repo version 0.2.1. The published tarball and `mcp/gspc-server/` are IDENTICAL:
 *
 *   index.mjs         3c62f90a70cf
 *   gspc-tools.json   099178bc579c
 *   verify-card.mjs   7cc975b3ba16
 *   paid-tools.json   b4270382044b
 *
 * WHY THIS NEEDS A GUARD RATHER THAN A NOTE. Publishing to npm from this account requires a
 * Bypass-2FA token the owner holds — the account is WebAuthn, so `--otp=` can never work.
 * That makes drift the DEFAULT failure: anyone can edit `mcp/gspc-server/` in a normal commit,
 * nobody can republish without the owner, and the package a user installs quietly stops being
 * the code in this repository. Nothing else in the estate would notice.
 *
 * When this test fails, the fix is usually NOT to edit the test. It is either to publish (an
 * owner action) or to revert the local change. Bumping the version in package.json without
 * publishing does not help and is caught separately below.
 *
 * Offline by default. LIVE_NPM=1 fetches the published tarball and compares.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, mkdtempSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "..");
const PKG_DIR = path.join(repo, "mcp/gspc-server");
const pkg = JSON.parse(readFileSync(path.join(PKG_DIR, "package.json"), "utf8"));

/** The files that carry behaviour. package.json is compared on version only. */
const FILES = ["index.mjs", "gspc-tools.json", "verify-card.mjs", "paid-tools.json"];

const sha = (buf) => createHash("sha256").update(buf).digest("hex").slice(0, 12);

describe("the published package is this repository", () => {
  it("the package still declares the name the registry knows", () => {
    assert.equal(
      pkg.name,
      "csoai-gspc-mcp",
      "the package was renamed. A rename is a new package on npm and orphans every existing " +
        "install; say so deliberately rather than letting the old name go stale.",
    );
    assert.match(String(pkg.version), /^\d+\.\d+\.\d+$/);
  });

  it("every behaviour file is present to compare", () => {
    for (const f of FILES) {
      const b = readFileSync(path.join(PKG_DIR, f));
      assert.ok(b.length > 0, `${f} is empty`);
    }
  });

  it("live: the published tarball is byte-identical to mcp/gspc-server", async () => {
    if (!process.env.LIVE_NPM) {
      console.log("      (offline: LIVE_NPM unset — npm registry NOT queried)");
      return;
    }
    const meta = await (await fetch("https://registry.npmjs.org/csoai-gspc-mcp")).json();
    const latest = meta["dist-tags"]?.latest;
    assert.ok(latest, "the registry returned no latest tag");

    assert.equal(
      pkg.version,
      latest,
      `mcp/gspc-server/package.json is ${pkg.version} but npm's latest is ${latest}. Either a ` +
        `version bump was committed without publishing, or a publish happened from elsewhere. ` +
        `Publishing needs the owner's Bypass-2FA token; do not paper over this by editing the ` +
        `version to match.`,
    );

    const url = meta.versions[latest].dist.tarball;
    const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
    const dir = mkdtempSync(path.join(tmpdir(), "npmparity-"));
    const tgz = path.join(dir, "p.tgz");
    execFileSync("tar", ["xzf", "-", "-C", dir], { input: buf });

    const drift = [];
    for (const f of FILES) {
      const mine = sha(readFileSync(path.join(PKG_DIR, f)));
      let theirs;
      try {
        theirs = sha(readFileSync(path.join(dir, "package", f)));
      } catch {
        theirs = "ABSENT";
      }
      if (mine !== theirs) drift.push(`${f} repo=${mine} npm=${theirs}`);
    }
    assert.deepEqual(
      drift,
      [],
      `the published package no longer matches this repository: ${drift.join("; ")}. ` +
        `Whoever installs csoai-gspc-mcp@${latest} is running different code from the one ` +
        `reviewed here. Publish (owner action, Bypass-2FA token) or revert the local change — ` +
        `do not relax this assertion.`,
    );
  });
});
