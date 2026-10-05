import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  MANIFEST_PATH,
  checkRow,
  evaluateFetch,
  runChecks,
  selftest,
  selftestManifest,
  selftestFetcher,
  validateManifest,
  validateRow,
} from "./memberships-check.mjs";

/**
 * A check that has never been seen failing is decoration. These tests hold the check to the one
 * property that matters: a bogus row goes red. No network: the fetcher is injected.
 */

const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));

describe("memberships-check: the committed manifest", () => {
  it("passes the schema", () => {
    expect(validateManifest(manifest)).toEqual([]);
  });

  it("has a public https evidence URL or a dated mailbox record on every row", () => {
    for (const r of manifest.rows) {
      if (r.evidence_kind === "public_url") {
        expect(r.evidence, r.id).toMatch(/^https:\/\//);
        expect(r.public_evidence, r.id).toBe(true);
      } else {
        expect(r.evidence, r.id).toMatch(/\b(INBOX|Sent)\s+\d+\b/);
        expect(r.evidence, r.id).toMatch(/\d{4}-\d{2}-\d{2}/);
        expect(r.public_evidence, r.id).toBe(false);
      }
      expect(r.what_it_does_not_prove.length, r.id).toBeGreaterThan(20);
    }
  });

  it("never includes a row the evidence cannot carry (UNVERIFIED with no evidence)", () => {
    // The one sanctioned UNVERIFIED row is a RECORDED unavailability (e.g. the Zenodo 410 of
    // 29 Sep 2026): it keeps its evidence URL, says why it no longer resolves, and dates it.
    for (const r of manifest.rows) {
      if (r.state !== "UNVERIFIED") continue;
      expect(typeof r.status_note === "string" && r.status_note.length > 20, r.id).toBe(true);
      expect(r.status_since, r.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(r.what_it_proves, r.id).toContain(r.status_note);
    }
  });
});

describe("memberships-check: it can fail", () => {
  it("goes red on a 404 and on a 200 that no longer names us; green on a good row and a reachable PENDING docket", async () => {
    const out = await runChecks(selftestManifest(), selftestFetcher);
    expect(out.schemaProblems).toEqual([]);
    expect(out.failures.map((f) => f.id).sort()).toEqual(["gone", "renamed"]);
    expect(out.results.find((r) => r.id === "good")?.ok).toBe(true);
    expect(out.results.find((r) => r.id === "pending")?.ok).toBe(true);
    expect(out.exitCode).toBe(1);
  });

  it("the built-in selftest agrees", async () => {
    const r = await selftest();
    expect(r.ok).toBe(true);
  });

  it("a bogus row planted in the REAL manifest turns the whole run red", async () => {
    const planted = {
      ...manifest,
      rows: [
        ...manifest.rows,
        {
          id: "bogus-roster",
          org: "A roster that dropped us",
          short: "Bogus",
          group: manifest.groups[0].id,
          kind: "member",
          since: "2026-01-01",
          evidence: "https://example.test/roster",
          evidence_kind: "public_url",
          public_evidence: true,
          state: "VERIFIED",
          what_it_proves: "fixture",
          what_it_does_not_prove: "fixture — this row exists to prove the check fails",
        },
      ],
    };
    // Every real public row answers 200 with our name in this fake; only the bogus one does not.
    // Rows recorded as unavailable (status_note) answer 410 here, as they do live.
    const recordedGone = new Set(manifest.rows.filter((r: { status_note?: string }) => r.status_note).map((r: { evidence: string }) => r.evidence));
    const fetcher = async (url: string) =>
      recordedGone.has(url)
        ? { status: 410, body: "User was blocked" }
        : url === "https://example.test/roster"
        ? { status: 200, body: "Members: Somebody Else" }
        : { status: 200, body: JSON.stringify({ pagination: { total: 1 }, items: ["Council of AI CSOAI Templeman councilof.ai io.github.CSOAI-ORG csoai-gspc-mcp CSOAI LTD ai.councilof/gspc"] }) };
    const out = await runChecks(planted, fetcher);
    expect(out.failures.map((f) => f.id)).toEqual(["bogus-roster"]);
    expect(out.exitCode).toBe(1);
  });

  it("a recorded-unavailable row passes while it stays down and goes RED when it answers 200 again", async () => {
    const row = manifest.rows.find((r: { status_note?: string }) => r.status_note);
    expect(row, "the manifest carries the Zenodo row recorded unavailable").toBeTruthy();
    const down = await checkRow(row, async () => ({ status: 410, body: "User was blocked" }));
    expect(down.ok).toBe(true);
    expect(down.reason).toContain("recorded unavailable (HTTP 410)");
    const back = await checkRow(row, async () => ({ status: 200, body: "Council of AI" }));
    expect(back.ok).toBe(false);
    expect(back.reason).toContain("re-verify");
  });

  it("a network error is a failure, not a pass", () => {
    const row = manifest.rows.find((r: { evidence_kind: string }) => r.evidence_kind === "public_url");
    expect(evaluateFetch(row, { status: 0, body: "", error: "ECONNRESET" }).ok).toBe(false);
    expect(evaluateFetch(row, undefined).ok).toBe(false);
  });

  it("rejects a private row that cites no mailbox record, and a public row without https", () => {
    const base = manifest.rows[0];
    expect(validateRow({ ...base, evidence_kind: "private_email", public_evidence: false, evidence: "someone told me" }).length).toBeGreaterThan(0);
    expect(validateRow({ ...base, evidence_kind: "public_url", public_evidence: true, evidence: "http://insecure.example" }).length).toBeGreaterThan(0);
    expect(validateRow({ ...base, kind: "endorsed" }).length).toBeGreaterThan(0);
  });
});
