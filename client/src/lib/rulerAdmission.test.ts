import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  PSEUDONYMOUS_ID_PATTERN,
  RULER_ADMISSION_ENDPOINT,
  RULER_HUMAN_ADMISSION_ENABLED,
  RULER_NOTHING_SENT_LINE,
  buildRulerAdmissionRequest,
  newPseudonymousId,
  submitRulerAdmission,
} from "./rulerAdmission";

const REQUEST_INPUT = {
  pseudonymousId: "ps-" + "a".repeat(32),
  dataset: "csoai/gspc-jail-goldbank",
  bankSha256: "0b45b620f2277c364275420f812e9415698e3b8bf0b105a7bbb4c2b2627d0f4a",
  seed: "0badc0de",
  observedOn: "2026-09-24",
  answers: { "esc-sh-1": { label: "ESCAPE" as const, bet: "A" as const }, "ben-1": { label: "BENIGN" as const, bet: null } },
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("human admission is OFF until the data-protection review is complete", () => {
  it("the flag is false in the committed source", () => {
    expect(RULER_HUMAN_ADMISSION_ENABLED).toBe(false);
    const src = readFileSync(resolve(__dirname, "rulerAdmission.ts"), "utf8");
    expect(src).toMatch(/export const RULER_HUMAN_ADMISSION_ENABLED: boolean = false;/);
  });

  it("submit POSTs nothing while the flag is false — not even with consent given", async () => {
    const injected = vi.fn(async () => new Response("{}", { status: 200 }));
    const globalFetch = vi.fn(async () => new Response("{}", { status: 200 }));
    const beacon = vi.fn(() => true);
    const xhrOpen = vi.fn();
    vi.stubGlobal("fetch", globalFetch);
    vi.stubGlobal("navigator", { sendBeacon: beacon });
    vi.stubGlobal(
      "XMLHttpRequest",
      class {
        open = xhrOpen;
        send = xhrOpen;
      },
    );
    const request = buildRulerAdmissionRequest(REQUEST_INPUT);
    for (const consentGiven of [true, false]) {
      await expect(submitRulerAdmission(request, { consentGiven, fetch: injected })).resolves.toEqual({
        sent: false,
        reason: "ADMISSION_OFF",
      });
      await expect(submitRulerAdmission(request, { consentGiven })).resolves.toEqual({ sent: false, reason: "ADMISSION_OFF" });
    }
    expect(injected).not.toHaveBeenCalled();
    expect(globalFetch).not.toHaveBeenCalled();
    expect(beacon).not.toHaveBeenCalled();
    expect(xhrOpen).not.toHaveBeenCalled();
  });

  it("points at the evidence intake, and says so without claiming it is open", () => {
    expect(RULER_ADMISSION_ENDPOINT).toBe("/api/evidence-intake");
    expect(RULER_NOTHING_SENT_LINE).toBe(
      "Nothing you do here is sent anywhere. Human results are not collected until our data-protection review is complete.",
    );
  });
});

describe("the drafted request carries a pseudonymous id and nothing personal", () => {
  it("allow-lists every field, top level and per observation", () => {
    const r = buildRulerAdmissionRequest(REQUEST_INPUT);
    expect(Object.keys(r).sort()).toEqual(
      ["consent", "instrument", "observations", "observed_on", "participant", "reported_beside_model_answers_never_merged", "schema"].sort(),
    );
    expect(Object.keys(r.participant)).toEqual(["pseudonymous_id"]);
    expect(r.consent).toEqual({
      network_submission: true,
      purpose: "independent-measurement-intake",
      model_training: false,
      public_release: false,
    });
    expect(r.observations).toEqual([
      { item_id: "ben-1", human_label: "BENIGN", bet: null },
      { item_id: "esc-sh-1", human_label: "ESCAPE", bet: "A" },
    ]);
    expect(JSON.stringify(r)).not.toMatch(/email|name"|ip"|country|age|user_agent|userAgent|device/i);
  });

  it("refuses an id that is not the random pseudonymous shape, and a timestamp finer than a date", () => {
    expect(() => buildRulerAdmissionRequest({ ...REQUEST_INPUT, pseudonymousId: "alice@example.org" })).toThrow();
    expect(() => buildRulerAdmissionRequest({ ...REQUEST_INPUT, observedOn: "2026-09-24T10:11:12Z" })).toThrow();
  });

  it("mints a random id with no input from the person", () => {
    const a = newPseudonymousId();
    const b = newPseudonymousId();
    expect(a).toMatch(PSEUDONYMOUS_ID_PATTERN);
    expect(b).toMatch(PSEUDONYMOUS_ID_PATTERN);
    expect(a).not.toBe(b);
    expect(newPseudonymousId.length).toBe(0);
  });
});
