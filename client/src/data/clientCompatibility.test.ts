import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import compat from "../../../council-os/client-compatibility.json";

const REPO = fileURLToPath(new URL("../../../", import.meta.url));
const STATES = Object.keys(compat.states);

type Row = (typeof compat.clients)[number];

/** Every TESTED_* row needs tested_at, a receipt file that exists, and a receipt verdict equal to its state. */
function testedRowFailures(rows: Row[]): string[] {
  const failures: string[] = [];
  for (const row of rows) {
    if (!row.state.startsWith("TESTED_")) continue;
    if (!row.receipt || !row.tested_at) {
      failures.push(`${row.id}: tested row without receipt or tested_at`);
      continue;
    }
    const path = REPO + row.receipt;
    if (!existsSync(path)) {
      failures.push(`${row.id}: receipt missing at ${row.receipt}`);
      continue;
    }
    const verdict = JSON.parse(readFileSync(path, "utf8")).verdict;
    if (verdict !== row.state) failures.push(`${row.id}: receipt verdict ${verdict} != state ${row.state}`);
  }
  return failures;
}

describe("client compatibility register", () => {
  it("uses only the declared states", () => {
    expect(STATES.sort()).toEqual(
      ["NOT_APPLICABLE", "PREPARED_NOT_TESTED", "STORE_SUBMISSION_REQUIRED", "TESTED_FAIL", "TESTED_PASS"].sort(),
    );
    for (const row of compat.clients) expect(STATES, row.id).toContain(row.state);
  });

  it("backs every tested row with a receipt on disk that carries the same verdict", () => {
    expect(compat.clients.some((row: Row) => row.state.startsWith("TESTED_"))).toBe(true);
    expect(testedRowFailures(compat.clients as Row[])).toEqual([]);
  });

  it("never records an untested row as having discovered tools", () => {
    for (const row of compat.clients) {
      if (row.state === "PREPARED_NOT_TESTED" || row.state === "STORE_SUBMISSION_REQUIRED") {
        expect(row.tools_discovered, row.id).toBeNull();
        expect(row.tested_at, row.id).toBeNull();
      }
    }
  });

  it("claims no store listing without a public URL", () => {
    for (const row of compat.clients) {
      const store = row.store as { status?: string; url?: string | null } | null;
      if (store?.status === "PUBLISHED") expect(store.url, row.id).toMatch(/^https:\/\//);
    }
  });

  it("negative control: the receipt check fails on a tested row with no receipt, a missing file or a mismatched verdict", () => {
    const base = compat.clients.find((row: Row) => row.state === "TESTED_PASS") as Row;
    expect(testedRowFailures([{ ...base, receipt: null } as Row])).toHaveLength(1);
    expect(testedRowFailures([{ ...base, receipt: "council-os/does-not-exist.json" } as Row])).toHaveLength(1);
    expect(testedRowFailures([{ ...base, state: "TESTED_FAIL" } as Row])).toHaveLength(1);
  });
});
