/**
 * npm-package-parity.test.mjs — what is published is what was reviewed, for EVERY package.
 *
 * WP-4 asks for one versioned capability registry across nine surfaces, SDK and plugin among
 * them, with actual host support tested. The npm packages are what a user installs.
 *
 * THE FIRST VERSION OF THIS FILE CHECKED ONE PACKAGE AND CLAIMED THE SURFACE WAS ASSESSED.
 * That was wrong. This repository ships eleven package.json files. Widening the check to all
 * of them immediately found a drift the single-package version could never have seen.
 *
 * Measured 2026-09-05 against the live registry:
 *
 *   csoai-gspc-mcp          repo 0.2.1  npm 0.2.1   MATCH, byte-identical on all four files
 *   csoai-governance-mcp    repo 0.1.1  npm 0.1.0   *** DRIFT ***
 *   gspc-card-verifier      repo 1.0.0  npm —       never published
 *   @csoai/gspc-{arith,cli,evm-bridge,pdf,svg}, @csoai/layer0,
 *   csoai-api-server, csoai-platform                 never published
 *
 * THE DRIFT MATTERS, and not as bookkeeping. docs/PHASE3_GO_LIVE.md records
 * `npx -y csoai-governance-mcp` as a live install path. npm serves 0.1.0. The repo moved to
 * 0.1.1, and the only change in it is a TRUTH FIX: 0.1.0's tool description advertises
 * "the 377 governed CSOAI tools / MCPs", and 0.1.1 replaces that hardcoded count with
 * "published governed tools". So every user who installs it today still receives the stale
 * count this estate's own doctrine forbids, and the correction has been sitting unpublished.
 *
 * Publishing is an owner gate: the npm account is WebAuthn, so `--otp=` can never work and a
 * Bypass-2FA token is required. That is exactly why drift is the DEFAULT failure here — an
 * ordinary commit changes the code, nobody can republish without the owner, and nothing else
 * in the estate notices.
 *
 * When this fails, the fix is to publish or to revert. Never to edit the expectation.
 *
 * Offline by default. LIVE_NPM=1 queries the registry and compares the flagship tarball.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, mkdtempSync, readdirSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "..");
const PKG_DIR = path.join(repo, "mcp/gspc-server");
const pkg = JSON.parse(readFileSync(path.join(PKG_DIR, "package.json"), "utf8"));

/** The files compared byte-for-byte on the flagship package. */
const FILES = ["index.mjs", "gspc-tools.json", "verify-card.mjs", "paid-tools.json"];

const sha = (buf) => createHash("sha256").update(buf).digest("hex").slice(0, 12);

/**
 * Every package.json in the repo, excluding node_modules and build output. Read from disk
 * rather than listed here, so a new package cannot escape the check by not being added.
 */
function packages() {
  const out = [];
  const walk = (dir) => {
    for (const e of readdirSync(dir)) {
      if (e === "node_modules" || e === "dist" || e === ".git") continue;
      const p = path.join(dir, e);
      let st;
      try {
        st = statSync(p);
      } catch {
        continue;
      }
      if (st.isDirectory()) walk(p);
      else if (e === "package.json") {
        try {
          const d = JSON.parse(readFileSync(p, "utf8"));
          if (d.name) {
            out.push({
              file: path.relative(repo, p),
              name: d.name,
              version: d.version,
              private: !!d.private,
            });
          }
        } catch {
          /* not ours to parse */
        }
      }
    }
  };
  walk(repo);
  return out;
}

/**
 * Packages known to be published, and the state npm must be in.
 * A `drift` entry is a DEFECT being tracked, never permission for it to persist.
 */
const PUBLISHED = {
  "csoai-gspc-mcp": { expect: "match" },
  "csoai-governance-mcp": {
    expect: "drift",
    npm: "0.1.0",
    why:
      "repo 0.1.1 removes the hardcoded '377 governed tools' count from the tool " +
      "description; npm 0.1.0 still advertises it. Publishing needs the owner's " +
      "Bypass-2FA token.",
  },
};

describe("the published packages are this repository", () => {
  it("finds every package.json (guards against the walk matching nothing)", () => {
    const p = packages();
    assert.ok(p.length >= 10, `only ${p.length} package.json files found`);
    assert.ok(p.some((x) => x.name === "csoai-gspc-mcp"));
  });

  it("the flagship package still declares the name the registry knows", () => {
    assert.equal(pkg.name, "csoai-gspc-mcp");
    assert.match(String(pkg.version), /^\d+\.\d+\.\d+$/);
  });

  it("live: every package's published state is the one recorded here", async () => {
    if (!process.env.LIVE_NPM) {
      console.log("      (offline: LIVE_NPM unset — npm registry NOT queried)");
      return;
    }
    const surprises = [];
    for (const p of packages()) {
      const res = await fetch(`https://registry.npmjs.org/${encodeURIComponent(p.name)}`);
      const known = PUBLISHED[p.name];
      if (res.status === 404) {
        if (known) surprises.push(`${p.name} is recorded as published but npm 404s`);
        continue;
      }
      const meta = await res.json();
      const latest = meta["dist-tags"]?.latest;
      if (!known) {
        surprises.push(
          `${p.name} is published on npm at ${latest} but is not recorded here. Every ` +
            `published package is a surface someone installs; record it with its state.`,
        );
        continue;
      }
      if (known.expect === "match" && latest !== p.version) {
        surprises.push(`${p.name}: repo ${p.version} but npm serves ${latest}`);
      }
      if (known.expect === "drift" && latest === p.version) {
        surprises.push(
          `${p.name} is NO LONGER drifted (npm serves ${latest}). Good — delete its entry ` +
            `from PUBLISHED so the record cannot rot into permission.`,
        );
      }
    }
    assert.deepEqual(surprises, [], surprises.join("; "));
  });

  it("live: the flagship tarball is byte-identical to mcp/gspc-server", async () => {
    if (!process.env.LIVE_NPM) {
      console.log("      (offline: LIVE_NPM unset — tarball NOT compared)");
      return;
    }
    const meta = await (await fetch("https://registry.npmjs.org/csoai-gspc-mcp")).json();
    const latest = meta["dist-tags"].latest;
    assert.equal(pkg.version, latest, `repo ${pkg.version} vs npm ${latest}`);
    const buf = Buffer.from(
      await (await fetch(meta.versions[latest].dist.tarball)).arrayBuffer(),
    );
    const dir = mkdtempSync(path.join(tmpdir(), "npmparity-"));
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
      `csoai-gspc-mcp@${latest} no longer matches this repository: ${drift.join("; ")}. ` +
        `Publish (owner action, Bypass-2FA token) or revert — do not relax this assertion.`,
    );
  });
});
