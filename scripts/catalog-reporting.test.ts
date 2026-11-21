import { test } from "vitest";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { statTiles, plainAnswer, x402Counts } from "../client/src/lib/resultCard.ts";

test("one mocked producer round reaches the user card with matching units, buckets and date", () => {
  const out = mkdtempSync(join(tmpdir(), "csoai-census-contract-"));
  try {
    const program = `
import contextlib, importlib.util, io, json, pathlib, sys
from unittest.mock import patch
spec=importlib.util.spec_from_file_location("catalog", "scripts/catalog-trust-round.py")
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
rows=[{"resource":"https://example.invalid/"+str(i)} for i in range(6)]+[{}]
codes=[402,200,400,404,-1,500]
with patch.object(m.urllib.request,"urlopen",return_value=io.BytesIO(json.dumps(rows).encode())), patch.object(m,"fetch",side_effect=lambda url:(codes[int(url.rsplit("/",1)[1])],"application/json","not a payment envelope")), patch.object(m.time,"sleep"), patch.object(m,"utc_now",return_value=m.datetime(2026,11,20,tzinfo=m.timezone.utc)), contextlib.redirect_stdout(io.StringIO()):
 m.run(sys.argv[1],"https://catalog.invalid/resources")
print(pathlib.Path(sys.argv[1],"latest.json").read_text())
`;
    const run = spawnSync("python3", ["-c", program, out], { encoding: "utf8", timeout: 15000 });
    assert.equal(run.status, 0, run.stderr);
    const snapshot = JSON.parse(run.stdout);
    assert.deepEqual(x402Counts(snapshot), { tried: 7, http402: 1, unreachableOr404: 2, otherErrors: 2 });
    assert.match(snapshot.headline, /^1 of 7 catalog rows returned HTTP 402; 2 returned HTTP 404 or were unreachable; 2 had other errors/);
    const tiles = statTiles(snapshot, 4, "x402_trust");
    assert.equal(tiles.length, 4);
    assert.equal(tiles[0].hint, "snapshot 2026-11-20");
    assert.deepEqual(tiles.map(t => t.value), ["7", "1", "2", "2"]);
    assert.match(plainAnswer("x402_trust", snapshot), /^Of 7 catalog rows, 1 returned HTTP 402; 2 returned HTTP 404 or were unreachable; 2 had other errors\./);
    assert.match(plainAnswer("x402_trust", snapshot), /does not establish a valid payment challenge, settlement or delivery/);
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});
