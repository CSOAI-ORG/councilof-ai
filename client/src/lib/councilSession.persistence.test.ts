// @vitest-environment node
import { describe, expect, it } from "vitest";
import { createCouncilSessionController, COUNCIL_TOKEN_KEY, CouncilSessionPersistenceError,
  type CouncilSessionState, type CouncilSessionStorage } from "./councilSession";

const subject = "fixture@example.test";
const candidate = "synthetic-session-not-an-actual-credential";
const user = { email: subject, name: "Fixture" };
function memoryStorage() {
  const values = new Map<string, string>();
  const storage: CouncilSessionStorage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value); },
    removeItem: key => { values.delete(key); },
  };
  return { values, storage };
}
function fixture(storage: CouncilSessionStorage | null,
  fetcher?: (url: string, init: RequestInit) => Promise<Response>) {
  const states: CouncilSessionState[] = [];
  const calls: { url: string; init: RequestInit }[] = [];
  const controller = createCouncilSessionController({ storage, publish: state => states.push(state),
    fetcher: async (url, init) => {
      calls.push({ url, init });
      return fetcher ? fetcher(url, init) : Response.json(url.endsWith("/me") ? { user } : { user, token: candidate });
    } });
  return { controller, states, calls };
}
describe("Council session persistence", () => {
  it.each(["absent", "unreadable"] as const)("reports %s storage before sending a password", async mode => {
    const storage = mode === "absent" ? null : {
      getItem() { throw new Error("synthetic denial"); }, setItem() {}, removeItem() {},
    };
    const f = fixture(storage);
    await expect(f.controller.login(subject, "synthetic-password")).rejects.toBeInstanceOf(CouncilSessionPersistenceError);
    expect(f.calls).toHaveLength(0);
    expect(f.states.every(state => !state.user && !state.token)).toBe(true);
    f.controller.dispose();
  });
  it.each(["throw", "silent"] as const)("does not publish a verified candidate when saving is %s", async mode => {
    const f = fixture({ getItem: () => null, removeItem() {},
      setItem() { if (mode === "throw") throw new Error("synthetic quota"); } });
    await expect(f.controller.login(subject, "synthetic-password")).rejects.toBeInstanceOf(CouncilSessionPersistenceError);
    expect(f.calls.map(call => call.url)).toEqual(["/api/auth/login", "/api/auth/me"]);
    expect(f.states.every(state => !state.user && !state.token)).toBe(true);
    f.controller.dispose();
  });
  it("restores the verified account in a fresh controller without another password POST", async () => {
    const { storage, values } = memoryStorage();
    const first = fixture(storage);
    await first.controller.login(subject, "synthetic-password");
    expect(first.states.at(-1)?.user?.email).toBe(subject);
    expect(values.get(COUNCIL_TOKEN_KEY)).toBe(candidate);
    first.controller.dispose();
    const fresh = fixture(storage);
    await fresh.controller.restore();
    expect(fresh.states.at(-1)?.user?.email).toBe(subject);
    expect(fresh.calls).toHaveLength(1);
    expect(fresh.calls[0]).toMatchObject({ url: "/api/auth/me", init: { method: "GET" } });
    fresh.controller.dispose();
  });
  it("refuses a different same-origin verified subject without caching an identity", async () => {
    const { storage, values } = memoryStorage();
    const f = fixture(storage, async url => Response.json(url.endsWith("/me")
      ? { user: { email: "other@example.test", name: "Other" } } : { user, token: candidate }));
    await expect(f.controller.login(subject, "synthetic-password")).rejects.toThrow("could not be verified");
    expect(values.size).toBe(0);
    expect(f.states.every(state => !state.user && !state.token)).toBe(true);
    f.controller.dispose();
  });
  it("cancels a stale verification without replacing a newer account token", async () => {
    const { storage, values } = memoryStorage();
    const f = fixture(storage, async url => {
      if (url.endsWith("/me")) values.set(COUNCIL_TOKEN_KEY, "synthetic-newer-session");
      return Response.json(url.endsWith("/me") ? { user } : { user, token: candidate });
    });
    await expect(f.controller.login(subject, "synthetic-password")).rejects.toMatchObject({ name: "AbortError" });
    expect(values.get(COUNCIL_TOKEN_KEY)).toBe("synthetic-newer-session");
    expect(f.states.every(state => !state.user && !state.token)).toBe(true);
    f.controller.dispose();
  });
});
