/**
 * Public Watchdog journey (/watchdog): state mapping, three separate results, stable re-fetch URL.
 * Reads the committed register and LIVE registries from public/, so counts come from the data.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  claimHref,
  claimState,
  claimsFromRegistry,
  conclusionResult,
  evidenceLinkState,
  parseJourney,
  registryPath,
  retrievalFailed,
  sidecarPath,
  signatureResult,
  summariseRegister,
  verifierHref,
  verifyInclusion,
  zenodoId,
} from "./watchdogJourney";
import { NLM_CHECKED_ON, NLM_IDS, ZENODO_REDIRECTED, ZENODO_TOMBSTONED } from "../data/nlmCrosswalk";

const PUB = join(__dirname, "../../../public");
const read = (p: string) => JSON.parse(readFileSync(join(PUB, p), "utf8"));
const register = read("spec/claim-maintenance/register.json");
const summary = summariseRegister(register);
const all = summary.live.flatMap((l) => claimsFromRegistry(read(l.url.slice(1))));

describe("watchdog — register and claims come from the data", () => {
  it("totals are read from register.totals, and the LIVE registries carry exactly that many claims", () => {
    expect(summary.subjects).toBe(register.totals.subjects);
    expect(summary.claims).toBe(register.totals.claims);
    expect(all.length).toBe(register.totals.claims);
    expect(new Set(all.map((c) => c.subject)).size).toBe(register.totals.subjects);
  });

  it("per-state tallies match register.totals.by_state", () => {
    for (const [s, n] of Object.entries(register.totals.by_state)) expect(all.filter((c) => c.state === s).length).toBe(n);
  });

  it("only LIVE, same-site /claims/*.json registries are followed", () => {
    expect(summary.live.length).toBeGreaterThan(0);
    for (const l of summary.live) expect(l.url).toMatch(/^\/claims\/[A-Za-z0-9._-]+\.json$/);
    const off = summariseRegister({ registries: [{ status: "LIVE", registry_id: "x", url: "https://evil.example/claims/x.json" }] });
    expect(off.live).toEqual([]);
  });
});

describe("watchdog — UNMEASURED and UNCHECKABLE", () => {
  it("a missing or unknown state word is UNMEASURED, never a guessed state", () => {
    expect(claimState(undefined)).toBe("UNMEASURED");
    expect(claimState("VERIFIED")).toBe("UNMEASURED");
    expect(claimState("UNCHECKABLE")).toBe("UNCHECKABLE");
    const [c] = claimsFromRegistry({ registry_id: "r", claims: [{ claim_id: "A-1", claim_verbatim: "x" }] });
    expect(c.state).toBe("UNMEASURED");
    expect(c.subject).toBe("UNMEASURED");
    expect(c.inclusion.kind).toBe("none");
  });

  it("a failed retrieval is UNCHECKABLE and records when it was tried", () => {
    expect(retrievalFailed("HTTP 404", "2026-10-14T03:00:00Z", 404)).toEqual({ state: "UNCHECKABLE", reason: "HTTP 404", fetchedAt: "2026-10-14T03:00:00Z", status: 404 });
  });

  it("an unreadable register summarises to nulls, not zeros", () => {
    const s = summariseRegister(null);
    expect(s.subjects).toBeNull();
    expect(s.claims).toBeNull();
  });

  it("tombstoned Zenodo records are UNCHECKABLE with the date checked; the crosswalk counts are array lengths", () => {
    expect(NLM_IDS.length).toBe(25);
    expect(ZENODO_TOMBSTONED.length).toBe(26);
    expect(ZENODO_TOMBSTONED.length + ZENODO_REDIRECTED.length).toBe(27);
    const t = { checkedOn: NLM_CHECKED_ON, ids: ZENODO_TOMBSTONED };
    expect(zenodoId("https://doi.org/10.5281/zenodo.22307626")).toBe("22307626");
    const s = evidenceLinkState("https://zenodo.org/records/22307626", t);
    expect(s.state).toBe("UNCHECKABLE");
    expect(s.note).toContain(NLM_CHECKED_ON);
    expect(evidenceLinkState("https://zenodo.org/records/21991104", t).state).toBe("LINKED");
  });
});

describe("watchdog — three separate results", () => {
  it("every claim in every LIVE registry is included in its published root (both registry shapes)", async () => {
    const res = await Promise.all(all.map((c) => verifyInclusion(c.inclusion)));
    expect(res.filter((r) => r.result !== "INCLUDED")).toEqual([]);
  });

  it("an edited claim is NOT INCLUDED, while its own state and the signature result are unaffected", async () => {
    const c = all[0];
    if (c.inclusion.kind !== "audit") throw new Error("expected an audit proof");
    const tampered = { ...c.inclusion, preimage: { ...(c.inclusion.preimage as object), claim_verbatim: "edited" } };
    expect((await verifyInclusion(tampered)).result).toBe("NOT INCLUDED");
    expect(conclusionResult(c).state).toBe(c.state);
    expect(signatureResult("VALID", "aa", "aa").result).toBe("VALID");
  });

  it("signature result passes the verifier's word through and never upgrades UNCHECKABLE", () => {
    expect(signatureResult(null, null, null).result).toBe("NOT RUN");
    expect(signatureResult("UNCHECKABLE", "a", "a").result).toBe("UNCHECKABLE");
    expect(signatureResult("SOMETHING", "a", "a").result).toBe("UNCHECKABLE");
    expect(signatureResult("VALID", "a", "b").detail).toContain("different sha256");
  });

  it("the conclusion is the claim's own state with its published reason, not a verdict", () => {
    const u = all.find((c) => c.state === "UNCHECKABLE")!;
    const r = conclusionResult(u);
    expect(r.state).toBe("UNCHECKABLE");
    expect(r.detail).toContain("not the subject");
  });
});

describe("watchdog — stable re-fetch URL", () => {
  it("claimHref round-trips through parseJourney for every real claim", () => {
    for (const c of all) {
      const href = claimHref(c.registryId, c.claimId);
      const p = parseJourney(href.slice(href.indexOf("?")));
      expect(p).toEqual({ view: "claims", registry: c.registryId, claim: c.claimId });
      expect(registryPath(p.registry!)).toBe(`/claims/${c.registryId}.json`);
    }
  });

  it("the URL names the published file and its sidecar, nothing else", () => {
    const id = summary.live[0].registryId;
    expect(registryPath(id)).toBe(summary.live[0].url);
    expect(sidecarPath(id)).toBe(`/claims/${id}.signed.json`);
    expect(verifierHref(id)).toBe(`/gspc-verify/?card=${encodeURIComponent(`/claims/${id}.signed.json`)}`);
  });

  it("malformed ids are dropped, never turned into a path", () => {
    const p = parseJourney("?registry=../../secret&claim=%3Cscript%3E&view=library");
    expect(p).toEqual({ view: "library", registry: null, claim: null });
    expect(registryPath("../x")).toBeNull();
  });
});
