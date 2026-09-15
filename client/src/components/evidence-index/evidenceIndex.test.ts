import { describe, expect, it, vi } from "vitest";
import {
  COMPARE_LIMIT,
  applyCoverageRead,
  exportRows,
  filteredRows,
  formatCount,
  normalizeCoverage,
  readJSON,
  readView,
  reconcileSelection,
  relationshipRows,
  safeLink,
  scopeHint,
  toggleCompare,
  viewURL,
  workerView,
  type CoverageReadState,
} from "./evidenceIndex";

/** Shape copied from the live GET /api/coverage response (15 Sep 2026), trimmed to two rows. */
function coverageDoc(overrides: Record<string, unknown> = {}) {
  const absent = (source: string, field: string) => ({
    value: null,
    source,
    field,
    unavailable: "source did not publish this stage",
  });
  return {
    schema: "csoai.master-coverage/0.1",
    kind: "derived-reader",
    complete: true,
    rows: [
      {
        id: "stablecoins",
        label: "Stablecoin universe",
        href: "/dashboard?tab=swift#stablecoins",
        unit: "assets",
        indexed: { value: 425, source: "GET /readiness.json", field: "coverage.indexed_assets" },
        measured: { value: 1, source: "GET /readiness.json", field: "coverage.deeply_measured_assets" },
        signed: { value: 1, source: "GET /readiness.json", field: "coverage.asset_measurements_signed" },
        rooted: { value: 1, source: "GET /readiness.json", field: "rooted" },
        witnessed: { value: 1, source: "GET /readiness.json", field: "witnessed" },
        anchored: { value: 0, source: "GET /readiness.json", field: "anchored" },
        paid: { value: 0, source: "GET /readiness.json", field: "paid" },
        note: "catalogue commitment",
      },
      {
        id: "x402",
        label: "x402 resources",
        href: "/api/x402",
        unit: "doors",
        indexed: { value: 11, source: "GET /api/x402", field: "resources.length" },
        measured: absent("GET /api/x402", "measured_resources"),
        signed: absent("GET /api/x402", "signed_resources"),
        rooted: absent("GET /api/x402", "rooted_resources"),
        witnessed: absent("GET /api/x402", "witnessed_resources"),
        anchored: absent("GET /api/x402", "anchored_resources"),
        paid: { value: 1, source: "GET /api/revenue", field: "one_number.settlements" },
        note: "a listed door is not revenue",
      },
    ],
    sources: {
      stablecoins: { path: "/readiness.json", http: 200, parsed: true, error: null },
      x402: { path: "/api/x402", http: 200, parsed: true, error: null },
    },
    ...overrides,
  };
}

describe("normalizeCoverage", () => {
  it("keeps an explicit zero as 0 and an unpublished stage as null", () => {
    const { rows, complete } = normalizeCoverage(coverageDoc());
    const stable = rows.find((r) => r.id === "stablecoins")!;
    const x402 = rows.find((r) => r.id === "x402")!;
    expect(stable.cells.anchored.value).toBe(0);
    expect(stable.cells.anchored.state).toBe("reported");
    expect(x402.cells.measured.value).toBeNull();
    expect(x402.cells.measured.state).toBe("unavailable");
    expect(formatCount(stable.cells.anchored.value)).toBe("0");
    expect(formatCount(x402.cells.measured.value)).toBe("—");
    expect(complete).toBe(true);
  });

  it("rejects duplicate family ids — control: the same ids made unique pass", () => {
    const doc = coverageDoc();
    const dup = { ...doc, rows: [doc.rows[0], { ...doc.rows[1], id: "stablecoins" }] };
    expect(() => normalizeCoverage(dup)).toThrow(/duplicate/);
    expect(() => normalizeCoverage(doc)).not.toThrow();
  });

  it("rejects a missing id and a foreign schema", () => {
    const doc = coverageDoc();
    expect(() => normalizeCoverage({ ...doc, rows: [{ ...doc.rows[0], id: "" }] })).toThrow();
    expect(() => normalizeCoverage({ ...doc, schema: "csoai.master-coverage/0.2" })).toThrow(/Unsupported/);
  });

  it("nulls every cell of a row whose owning source failed — control: the healthy row keeps its counts", () => {
    const doc = coverageDoc({
      complete: false,
      sources: {
        stablecoins: { http: 503, parsed: false, error: "HTTP 503" },
        x402: { http: 200, parsed: true, error: null },
      },
    });
    const { rows, complete } = normalizeCoverage(doc);
    const failed = rows.find((r) => r.id === "stablecoins")!;
    for (const cell of Object.values(failed.cells)) {
      expect(cell.value).toBeNull();
      expect(cell.reason).toMatch(/Owning source failed: HTTP 503/);
    }
    expect(failed.sourceState).toBe("unavailable");
    expect(rows.find((r) => r.id === "x402")!.cells.indexed.value).toBe(11);
    expect(complete).toBe(false);
  });

  it("does not trust complete:true when a row has no published source read", () => {
    const doc = coverageDoc({ sources: { stablecoins: { http: 200, parsed: true, error: null } } });
    const { rows, complete } = normalizeCoverage(doc);
    expect(rows.find((r) => r.id === "x402")!.sourceState).toBe("not published");
    expect(complete).toBe(false);
  });

  it("refuses negative, non-finite or string counts and a value beside an `unavailable` marker", () => {
    const doc = coverageDoc();
    const row = {
      ...doc.rows[0],
      indexed: { value: -1, source: "s", field: "f" },
      measured: { value: "3", source: "s", field: "f" },
      signed: { value: Number.POSITIVE_INFINITY, source: "s", field: "f" },
      rooted: { value: 4, source: "s", field: "f", unavailable: "withdrawn" },
    };
    const { rows } = normalizeCoverage({ ...doc, rows: [row] });
    expect(rows[0].cells.indexed.value).toBeNull();
    expect(rows[0].cells.measured.value).toBeNull();
    expect(rows[0].cells.signed.value).toBeNull();
    expect(rows[0].cells.rooted.value).toBeNull();
    expect(rows[0].cells.rooted.reason).toBe("withdrawn");
  });

  it("keeps only https links", () => {
    expect(safeLink("/api/x402")).toBe("https://councilof.ai/api/x402");
    expect(safeLink("javascript:alert(1)")).toBeNull();
    expect(safeLink("http://example.com")).toBeNull();
    expect(safeLink("https://user:pw@example.com")).toBeNull();
  });
});

describe("filters and selection", () => {
  const { rows } = normalizeCoverage(coverageDoc());

  it("filters gaps and measured without treating null as a measurement", () => {
    expect(filteredRows(rows, "", "gaps").map((r) => r.id)).toEqual(["x402"]);
    expect(filteredRows(rows, "", "measured").map((r) => r.id)).toEqual(["stablecoins"]);
    expect(filteredRows(rows, "revenue").map((r) => r.id)).toEqual(["x402"]);
    expect(filteredRows(rows, "  ").length).toBe(2);
  });

  it("clears a selection once its family is filtered out — control: a visible selection survives", () => {
    const visible = filteredRows(rows, "", "measured");
    expect(reconcileSelection("x402", visible)).toBeNull();
    expect(reconcileSelection("stablecoins", visible)).toBe("stablecoins");
    expect(reconcileSelection(null, visible)).toBeNull();
  });
});

describe("toggleCompare", () => {
  it(`caps the comparison at ${COMPARE_LIMIT} — control: below the cap a family is added`, () => {
    let compare: string[] = [];
    for (const id of ["a", "b", "c"]) {
      const r = toggleCompare(compare, id, true);
      expect(r.refused).toBe(false);
      compare = r.compare;
    }
    expect(compare).toEqual(["a", "b", "c"]);
    const over = toggleCompare(compare, "d", true);
    expect(over.refused).toBe(true);
    expect(over.compare).toEqual(["a", "b", "c"]);
    const removed = toggleCompare(compare, "b", false);
    expect(removed.compare).toEqual(["a", "c"]);
    expect(toggleCompare(removed.compare, "d", true).compare).toEqual(["a", "c", "d"]);
    expect(toggleCompare(compare, "a", true).compare).toEqual(["a", "b", "c"]);
  });
});

describe("URL state", () => {
  it("viewURL preserves unrelated params (dashboard tab, embed) and drops defaults", () => {
    const href = "https://councilof.ai/dashboard?tab=evidence-index&embed=1&utm=x#frag";
    const out = new URL(
      viewURL(href, { view: "relationships", query: "xrpl", filter: "gaps", selected: "xrpl" }),
    );
    expect(out.searchParams.get("tab")).toBe("evidence-index");
    expect(out.searchParams.get("embed")).toBe("1");
    expect(out.searchParams.get("utm")).toBe("x");
    expect(out.hash).toBe("#frag");
    expect(out.searchParams.get("ei_view")).toBe("relationships");
    expect(out.searchParams.get("ei_subject")).toBe("xrpl");

    const reset = new URL(
      viewURL(out.href, { view: "index", query: "", filter: "all", selected: null }),
    );
    for (const k of ["ei_view", "ei_q", "ei_filter", "ei_subject"]) {
      expect(reset.searchParams.has(k)).toBe(false);
    }
    expect(reset.searchParams.get("tab")).toBe("evidence-index");
    expect(reset.searchParams.get("embed")).toBe("1");
  });

  it("readView round-trips and rejects unknown views and filters", () => {
    expect(readView("?ei_view=compute&ei_q=a&ei_filter=measured&ei_subject=gspc")).toEqual({
      view: "compute",
      query: "a",
      filter: "measured",
      selected: "gspc",
    });
    expect(readView("?ei_view=admin&ei_filter=everything")).toEqual({
      view: "index",
      query: "",
      filter: "all",
      selected: null,
    });
  });
});

describe("relationships, scope labels and export", () => {
  const { rows } = normalizeCoverage(coverageDoc());
  const x402 = rows.find((r) => r.id === "x402")!;

  it("emits only declared source/field edges, each disclaiming inclusion", () => {
    const edges = relationshipRows(x402);
    expect(edges).toHaveLength(7);
    expect(edges.find((e) => e.relation === "reports paid")).toMatchObject({
      to: "GET /api/revenue",
      field: "one_number.settlements",
      value: 1,
    });
    expect(edges.every((e) => /not an inclusion proof/.test(e.claim))).toBe(true);
    const noSource = { ...x402, cells: { ...x402.cells, paid: { ...x402.cells.paid, source: "" } } };
    expect(relationshipRows(noSource).some((e) => e.relation === "reports paid")).toBe(false);
  });

  it("labels the shared settlement ledger and never labels an ordinary cell", () => {
    expect(scopeHint(x402, "paid")).toBe("Shared ledger");
    expect(scopeHint(x402, "indexed")).toBe("");
  });

  it("export is unsigned, carries rows verbatim and holds no total", () => {
    const out = exportRows(rows, "2026-09-15T06:00:00Z");
    expect(out.kind).toBe("UNSIGNED_DERIVED_VIEW");
    expect(out.cryptography_verified).toBe(false);
    expect(out.rows).toBe(rows);
    expect(JSON.stringify(out)).not.toMatch(/"total"/);
  });
});

describe("applyCoverageRead", () => {
  const empty: CoverageReadState = { data: null, observedAt: null, mode: "not loaded", error: "" };

  it("marks a failed refresh as retained, not live, keeping the old observation time", () => {
    const live = applyCoverageRead(empty, { ok: true, body: coverageDoc() }, "2026-09-15T06:00:00Z");
    expect(live.mode).toBe("live read");
    const failed = applyCoverageRead(live, { ok: false, error: "Source returned HTTP 502." }, "2026-09-15T07:00:00Z");
    expect(failed.mode).toBe("retained, not live");
    expect(failed.data).toBe(live.data);
    expect(failed.observedAt).toBe("2026-09-15T06:00:00Z");
    expect(failed.error).toMatch(/502/);
  });

  it("substitutes nothing when the first read fails or the body is malformed", () => {
    const failed = applyCoverageRead(empty, { ok: false, error: "timeout" }, "t");
    expect(failed.data).toBeNull();
    expect(failed.mode).toBe("not loaded");
    const bad = applyCoverageRead(empty, { ok: true, body: { schema: "other" } }, "t");
    expect(bad.data).toBeNull();
    expect(bad.error).toMatch(/Unsupported/);
  });
});

describe("workerView", () => {
  const doc = {
    schema: "csoai.worker-state/0.1",
    status: "LIVE",
    worker: {
      state: "WAITING",
      detail_code: "NEXT_PLAYLIST_JOB",
      successful_runs: 157,
      failed_runs: 0,
      jobs_total: 168,
      last_success_at: "2026-09-15T03:17:16.523868Z",
      updated_at: "2026-09-15T06:33:30.043968Z",
    },
    counters_scope: "THIS worker process",
  };

  it("keeps a zero failure count as 0 and unpublished stamps as null", () => {
    const v = workerView(doc, Date.parse("2026-09-15T04:17:16Z"));
    expect(v.failures).toBe(0);
    expect(v.successes).toBe(157);
    expect(v.minutesSinceSuccess).toBe(59);
    expect(v.started).toBeNull();
    const bare = workerView({ schema: "csoai.worker-state/0.1" });
    expect(bare.successes).toBeNull();
    expect(bare.state).toBe("UNKNOWN");
  });

  it("rejects a foreign schema", () => {
    expect(() => workerView({ ...doc, schema: "csoai.runpod-gspc-worker/0.1" })).toThrow();
  });
});

describe("readJSON", () => {
  const json = (body: unknown, init: ResponseInit = {}) =>
    new Response(JSON.stringify(body), {
      headers: { "content-type": "application/json" },
      ...init,
    });

  it("returns JSON, and refuses HTTP errors and HTML pages without substituting a value", async () => {
    await expect(readJSON("https://x/api", { fetchImpl: async () => json({ a: 1 }) })).resolves.toEqual({ a: 1 });
    await expect(
      readJSON("https://x/api", { fetchImpl: async () => json({}, { status: 503 }) }),
    ).rejects.toThrow(/HTTP 503/);
    await expect(
      readJSON("https://x/api", {
        fetchImpl: async () => new Response("<html>", { headers: { "content-type": "text/html" } }),
      }),
    ).rejects.toThrow(/non-JSON/);
  });

  it("never sends credentials and times out explicitly", async () => {
    const seen = vi.fn(async (_u: string, init?: RequestInit) => {
      expect(init?.credentials).toBe("omit");
      return new Promise<Response>((_, reject) =>
        init?.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError"))),
      );
    });
    await expect(readJSON("https://x/api", { fetchImpl: seen, timeout: 5 })).rejects.toThrow(/timed out/);
    expect(seen).toHaveBeenCalledOnce();
  });
});
