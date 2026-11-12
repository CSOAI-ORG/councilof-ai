import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseGpaiMatrix, safeToolHref } from "./gpaiMatrix";

const snapshot = () => JSON.parse(readFileSync(resolve("public/interop/gpai-matrix.json"), "utf8"));

describe("GPAI matrix response boundary", () => {
  it("preserves the published snapshot and its exact status counts", () => {
    const source = snapshot();
    const before = JSON.stringify(source);
    const result = parseGpaiMatrix(source);
    expect(result.counts.total).toBe(result.provisions.length);
    expect(JSON.stringify(result)).toBe(before);
  });

  it("rejects missing required arrays before the view can render partial coverage", () => {
    for (const key of ["provisions", "truth_boundaries", "discovery_doors", "grounded_in"]) {
      const data = snapshot();
      delete data[key];
      expect(() => parseGpaiMatrix(data), key).toThrow();
    }
  });

  it("rejects counts inconsistent with rows or the inventory scope", () => {
    for (const mutate of [
      (data: any) => { data.counts.WIRED += 1; },
      (data: any) => { data.counts.total -= 1; },
      (data: any) => { data.instrument_scope.frozen_identifier_count += 1; },
      (data: any) => { data.provisions[0].status = "SUPPORTED"; },
    ]) {
      const data = snapshot(); mutate(data);
      expect(() => parseGpaiMatrix(data)).toThrow();
    }
  });

  it("rejects duplicate provision identities and malformed nested records", () => {
    for (const mutate of [
      (data: any) => { data.provisions[1].provision_id = data.provisions[0].provision_id; },
      (data: any) => { data.provisions[0].tooling_wired = null; },
      (data: any) => { data.provisions[0].title_or_label_from_artifacts = [{ label: {} }]; },
      (data: any) => { data.gpai_code_of_practice.artifacts = {}; },
      (data: any) => { data.grounded_in[0].sha256 = "missing"; },
      (data: any) => { data.status_vocabulary.WIRED = {}; },
      (data: any) => { data.as_of = "recently"; },
    ]) {
      const data = snapshot(); mutate(data);
      expect(() => parseGpaiMatrix(data)).toThrow();
    }
  });

  it("rejects unsafe links in discovery and provision tooling", () => {
    for (const href of ["javascript:alert(1)", "data:text/html,test", "http://example.org", "//example.org", "/\\example.org", "https://user:password@example.org", " https://example.org", "/api/\nendpoint"]) {
      const data = snapshot();
      data.discovery_doors[0].href = href;
      expect(() => parseGpaiMatrix(data), href).toThrow();
      const provision = snapshot();
      provision.provisions.find((p: any) => p.tooling_wired.length).tooling_wired[0].href = href;
      expect(() => parseGpaiMatrix(provision), href).toThrow();
    }
  });

  it("allows same-origin paths and credential-free HTTPS references", () => {
    for (const href of ["/api/evidence-bundle?obligation=article-53", "/reports/daily-signal/index.html", "https://councilof.ai/gspc-verify", "https://example.org/source#section"]) {
      expect(safeToolHref(href)).toBe(href);
    }
  });
});
