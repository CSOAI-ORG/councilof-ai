// The split cards bundle (22 Nov 2026): every published file is under the Pages cap, the shards
// together are exactly the corpus the single 0.1 file carried, and the committed bytes are what the
// producer writes. See scripts/cards-bundle-shards.mjs for the layout and why it exists.
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { buildBundleFiles, readCardsBundleFile, SHARD_PREFIXES } from "./cards-bundle-shards.mjs";
import { PAGES_FILE_BYTES_CAP } from "./pages-limits.mjs";

const REPO = fileURLToPath(new URL("..", import.meta.url));
const COPY = ["generate-cards-bundle.mjs", "card-feed-index.mjs", "cards-bundle-shards.mjs", "pages-limits.mjs"];
const sha = (n: number) => createHash("sha256").update(`fixture-card-${n}`).digest("hex");
const dirs: string[] = [];
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

type Wrapper = { card: Record<string, unknown>; proof: string[] };

/** 60 wrappers spread over the 16 prefixes; the root lists 25 of them. */
function corpus() {
  const cards: Record<string, Wrapper> = {};
  for (let n = 0; n < 60; n++) {
    const h = sha(n);
    cards[h] = { card: { sha256: h, surface: n % 3 ? "public.notice" : "xrpl.asset.state", subject: `card ${n}`, as_of: `2026-11-${String(1 + (n % 20)).padStart(2, "0")}T00:00:00Z`, sig_ed25519: "ab".repeat(64) }, proof: [sha(1000 + n)] };
  }
  const all = Object.keys(cards);
  const root = { as_of: "2026-11-21T23:11:50Z", merkle_root: sha(9999), card_count: 25, card_sha256: all.slice(0, 25) };
  return { root, cards };
}
const sorted = (o: Record<string, Wrapper>) => Object.fromEntries(Object.keys(o).sort().map((k) => [k, o[k]]));

function fixtureRepo() {
  const repo = mkdtempSync(join(tmpdir(), "cards-bundle-split-"));
  dirs.push(repo);
  mkdirSync(join(repo, "scripts"), { recursive: true });
  mkdirSync(join(repo, "public/cards"), { recursive: true });
  for (const f of COPY) copyFileSync(join(REPO, "scripts", f), join(repo, "scripts", f));
  const data = corpus();
  writeFileSync(join(repo, "public/root.json"), JSON.stringify(data.root) + "\n");
  for (const [h, w] of Object.entries(data.cards)) writeFileSync(join(repo, "public/cards", `${h.slice(0, 16)}.json`), JSON.stringify(w) + "\n");
  return { repo, data };
}
const run = (repo: string, args: string[] = []) =>
  spawnSync(process.execPath, ["scripts/generate-cards-bundle.mjs", ...args], { cwd: repo, encoding: "utf8", timeout: 60_000 });
const files17 = (repo: string) => [join(repo, "public/cards-bundle.json"), ...SHARD_PREFIXES.map((p) => join(repo, `public/cards-bundle/${p}.json`))];

describe("the producer writes an index and 16 shards", () => {
  it("the index keeps its URL and top-level fields and holds the root's wrappers; the shards partition every wrapper", () => {
    const { repo, data } = fixtureRepo();
    const r = run(repo);
    expect(r.status, r.stderr).toBe(0);
    const index = JSON.parse(readFileSync(join(repo, "public/cards-bundle.json"), "utf8"));
    expect(index.schema).toBe("csoai.cards-bundle/0.2");
    expect(index.as_of).toBe(data.root.as_of);
    expect(index.merkle_root).toBe(data.root.merkle_root);
    expect(index.card_count).toBe(60); // every wrapper on disk, as before
    expect(index.root_card_count).toBe(25);
    expect(index.cards_scope).toBe("root");
    expect(Object.keys(index.cards)).toEqual([...data.root.card_sha256].sort());
    for (const h of data.root.card_sha256) expect(index.cards[h]).toEqual(data.cards[h]);

    expect(index.shards.files.map((f: { prefix: string }) => f.prefix)).toEqual([...SHARD_PREFIXES]);
    let total = 0;
    const union: Record<string, Wrapper> = {};
    for (const f of index.shards.files) {
      const text = readFileSync(join(repo, "public", f.path), "utf8");
      expect(Buffer.byteLength(text)).toBe(f.bytes);
      expect(createHash("sha256").update(text).digest("hex")).toBe(f.sha256);
      const shard = JSON.parse(text);
      expect(shard.schema).toBe("csoai.cards-bundle-shard/0.1");
      expect(shard.prefix).toBe(f.prefix);
      expect([shard.as_of, shard.merkle_root]).toEqual([index.as_of, index.merkle_root]);
      const keys = Object.keys(shard.cards);
      expect(keys.length).toBe(f.card_count);
      expect(keys).toEqual([...keys].sort());
      for (const k of keys) {
        expect(k.startsWith(f.prefix)).toBe(true);
        expect(union[k]).toBeUndefined(); // in exactly one shard
        union[k] = shard.cards[k];
      }
      total += keys.length;
    }
    expect(total).toBe(60);
    // What the 0.1 single file carried, key for key and in the same order.
    expect(Object.keys(union)).toEqual(Object.keys(sorted(data.cards)));
    expect(union).toEqual(sorted(data.cards));
    expect(readCardsBundleFile(join(repo, "public/cards-bundle.json")).cards).toEqual(sorted(data.cards));
  });

  it("is byte-stable, its --check-bundle passes on fresh output, and goes red on a stale or stray shard", () => {
    const { repo } = fixtureRepo();
    expect(run(repo).status).toBe(0);
    const first = files17(repo).map((f) => readFileSync(f));
    expect(run(repo).status).toBe(0);
    expect(files17(repo).map((f) => readFileSync(f))).toEqual(first);
    expect(run(repo, ["--check-bundle"]).status).toBe(0);

    const shard = join(repo, "public/cards-bundle/7.json");
    writeFileSync(shard, readFileSync(shard, "utf8").replace("card ", "card-edited "));
    const stale = run(repo, ["--check-bundle"]);
    expect(stale.status).toBe(1);
    expect(stale.stderr).toMatch(/STALE or missing: public\/cards-bundle\/7\.json/);
    expect(() => readCardsBundleFile(join(repo, "public/cards-bundle.json"))).toThrow(/bytes do not match the index/);

    expect(run(repo).status).toBe(0);
    writeFileSync(join(repo, "public/cards-bundle/old.json"), "{}\n");
    const stray = run(repo, ["--check-bundle"]);
    expect(stray.status).toBe(1);
    expect(stray.stderr).toMatch(/UNEXPECTED file in the shard folder: public\/cards-bundle\/old\.json/);
    expect(run(repo).status).toBe(0); // the writer removes it
    expect(existsSync(join(repo, "public/cards-bundle/old.json"))).toBe(false);
    expect(run(repo, ["--check-bundle"]).status).toBe(0);
  });

  it("refuses to write a file over the Pages cap, and names the remedy", () => {
    const { repo, data } = fixtureRepo();
    // One wrapper whose card alone is over the cap: every output must still be refused, none written.
    const big = sha(424242);
    writeFileSync(join(repo, "public/cards", `${big.slice(0, 16)}.json`),
      JSON.stringify({ card: { sha256: big, surface: "public.notice", subject: "x".repeat(PAGES_FILE_BYTES_CAP), as_of: data.root.as_of }, proof: [] }) + "\n");
    const r = run(repo);
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(new RegExp(`public/cards-bundle/${big[0]}\\.json would be \\d+ bytes, over the Pages per-file cap of 26214400`));
    expect(r.stderr).toMatch(/Widen the shard key/);
    expect(existsSync(join(repo, "public/cards-bundle.json"))).toBe(false);
  });

  it("buildBundleFiles refuses a key that is not a full sha256", () => {
    expect(() => buildBundleFiles({ root: { card_sha256: [] }, cards: { ABC: { card: {}, proof: [] } } })).toThrow(/not a full lowercase sha256/);
  });
});

describe("the committed bundle on this branch", () => {
  const index = join(REPO, "public/cards-bundle.json");
  const shardDir = join(REPO, "public/cards-bundle");

  it("every published bundle file is under the Pages per-file cap", () => {
    const files = [index, ...readdirSync(shardDir).map((f) => join(shardDir, f))];
    expect(files.length).toBe(17);
    for (const f of files) {
      const { size } = statSync(f);
      expect(size, `${f} is ${size} bytes, ${(100 * size / PAGES_FILE_BYTES_CAP).toFixed(1)}% of the cap`).toBeLessThan(PAGES_FILE_BYTES_CAP);
    }
  });

  it("reads back whole: the index agrees with its 16 shards and covers every root hash", () => {
    const all = readCardsBundleFile(index);
    const onDisk = readdirSync(join(REPO, "public/cards")).filter((f) => f.endsWith(".json")).length;
    expect(Object.keys(all.cards).length).toBe(all.card_count);
    expect(all.card_count).toBe(onDisk);
    const root = JSON.parse(readFileSync(join(REPO, "public/root.json"), "utf8"));
    const head = JSON.parse(readFileSync(index, "utf8"));
    expect(Object.keys(head.cards).sort()).toEqual([...root.card_sha256].sort());
    for (const h of root.card_sha256) expect(head.cards[h]).toEqual(all.cards[h]);
  });
});
