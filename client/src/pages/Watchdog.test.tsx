// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Watchdog from "./Watchdog";
import { readWatchdogJson } from "@/lib/watchdogRead";
import { verifyRecord } from "@/lib/recordVerify";
import { verifyInclusion } from "@/lib/watchdogJourney";

vi.mock("@/components/WorkingGroups", () => ({ default: () => null }));
vi.mock("@/lib/watchdogRead", () => ({ readWatchdogJson: vi.fn() }));
vi.mock("@/lib/recordVerify", () => ({ verifyRecord: vi.fn() }));
vi.mock("@/lib/watchdogJourney", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/watchdogJourney")>(),
  verifyInclusion: vi.fn(),
}));

const registry = (name: string) => ({
  registry_id: name,
  claims: [{ claim_id: "one", claim_verbatim: name + " claim", subject: { name },
    state: "UNMEASURED", first_captured_utc: "2026-11-04T00:00:00Z" }],
});
const ok = (json: unknown) => ({ state: "OK" as const, value: { json, text: JSON.stringify(json) },
  fetchedAt: "2026-11-04T00:00:00Z", status: 200, sha256: "aa" });
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => { resolve = r; });
  return { promise, resolve };
}
let host: HTMLDivElement;
let root: Root;
const read = vi.mocked(readWatchdogJson);
const record = vi.mocked(verifyRecord);
const inclusion = vi.mocked(verifyInclusion);
const button = (id: string) => host.querySelector<HTMLButtonElement>('[data-testid="' + id + '"]')!;
async function open() { await act(async () => root.render(<Watchdog />)); }
async function click(id: string) { await act(async () => button(id).click()); }

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  window.history.replaceState(null, "", "/watchdog/?registry=first&claim=one");
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  read.mockImplementation(async (url) => {
    if (url.endsWith(".signed.json")) return ok({ payload: { artifact: { sha256: "aa" } } });
    if (url === "/claims/first.json") return ok(registry("first"));
    if (url === "/claims/second.json") return ok(registry("second"));
    return ok({ registries: [], corrections: [] });
  });
  inclusion.mockResolvedValue({ result: "INCLUDED", detail: "included fixture" });
  record.mockResolvedValue({ state: "VALID", valid: true, reasons: [], family: "fixture", lines: [] });
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.resetAllMocks();
  vi.unstubAllGlobals();
});

describe("Watchdog verification and revision changes", () => {
  it("recovers from verifier failure without discarding an independent inclusion result", async () => {
    record.mockRejectedValueOnce(new Error("Unavailable crypto"));
    await open();
    await click("watchdog-verify");
    expect(button("watchdog-verify").disabled).toBe(false);
    expect(host.querySelector('[data-testid="watchdog-result-signature"]')?.textContent).toContain("UNCHECKABLE");
    expect(host.querySelector('[data-testid="watchdog-result-inclusion"]')?.textContent).toContain("INCLUDED");
    await click("watchdog-verify");
    expect(host.querySelector('[data-testid="watchdog-result-signature"]')?.textContent).toContain("VALID");
  });
  it("does not attach a verification started before a refetch to the new revision", async () => {
    const pending = deferred<Awaited<ReturnType<typeof verifyRecord>>>();
    record.mockReturnValueOnce(pending.promise);
    await open();
    await click("watchdog-verify");
    expect(button("watchdog-verify").disabled).toBe(true);
    await click("watchdog-refetch");
    await act(async () => pending.resolve({ state: "VALID", valid: true, reasons: [], family: "fixture", lines: [] }));
    expect(host.querySelector('[data-testid="watchdog-three-results"]')).toBeNull();
    expect(button("watchdog-verify").disabled).toBe(false);
  });
  it("keeps a late registry response from replacing the claim reached through navigation", async () => {
    const pending = deferred<ReturnType<typeof ok>>();
    const defaultRead = read.getMockImplementation()!;
    read.mockImplementation((url, signal) => url === "/claims/first.json" ? pending.promise : defaultRead(url, signal));
    await open();
    await act(async () => {
      window.history.pushState(null, "", "/watchdog/?registry=second&claim=one");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(host.querySelector("#wd-claim")?.textContent).toContain("second claim");
    await act(async () => pending.resolve(ok(registry("first"))));
    expect(host.querySelector("#wd-claim")?.textContent).toContain("second claim");
    expect(host.querySelector("#wd-claim")?.textContent).not.toContain("first claim");
  });
  it("keeps signature checking available when inclusion verification throws", async () => {
    inclusion.mockRejectedValueOnce(new Error("Unsupported crypto"));
    await open();
    await click("watchdog-verify");
    expect(host.querySelector('[data-testid="watchdog-result-inclusion"]')?.textContent).toContain("UNCHECKABLE");
    expect(host.querySelector('[data-testid="watchdog-result-signature"]')?.textContent).toContain("VALID");
    expect(button("watchdog-verify").disabled).toBe(false);
  });
});
