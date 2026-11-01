import { describe, expect, it, vi } from "vitest";
import { createPrivateProfileController, type PrivateProfileState } from "./councilProfile";

type Fetcher = (url: string, init: RequestInit) => Promise<Response>;
const owner = { email: "alice@example.test", token: "owner-token" };
const card = (name = "Alice", email = owner.email, extras = {}) =>
  new Response(JSON.stringify({ user: { email, name }, visibility: "private", ...extras }), { status: 200 });
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}
function fixture(fetcher: (url: string, init: RequestInit) => Promise<Response>) {
  let identity: typeof owner | null = owner;
  const states: PrivateProfileState[] = [];
  const controller = createPrivateProfileController({
    identity: owner, currentIdentity: () => identity, fetcher,
    publish: (state) => states.push(state),
  });
  return { controller, states, last: () => states.at(-1)!,
    changeIdentity: (next: typeof owner | null) => { identity = next; } };
}

describe("private profile client contract", () => {
  it("reopens a stored owner profile through the same-origin signed session", async () => {
    const fetcher = vi.fn(async (_url: string, _init: RequestInit) => card("Current stored name"));
    const f = fixture(fetcher);
    await f.controller.load();
    expect(f.last()).toEqual({ phase: "ready", profile: { email: owner.email, name: "Current stored name" }, message: null });
    const [url, init] = fetcher.mock.calls[0];
    expect(url).toBe("/api/auth/profile");
    expect(init).toMatchObject({ method: "GET", cache: "no-store", headers: { Authorization: "Bearer owner-token" } });
    expect(init.body).toBeUndefined();
  });
  it("writes only a trimmed name and confirms a separately reopened read before success", async () => {
    const fetcher = vi.fn<Fetcher>().mockResolvedValueOnce(card())
      .mockResolvedValueOnce(card("Alice 王", owner.email, { saved: true }))
      .mockResolvedValueOnce(card("Alice 王"));
    const f = fixture(fetcher);
    await f.controller.load();
    await f.controller.save("  Alice 王  ");
    expect(fetcher.mock.calls.map(([, init]) => init.method)).toEqual(["GET", "PUT", "GET"]);
    expect(JSON.parse(String(fetcher.mock.calls[1][1].body))).toEqual({ name: "Alice 王" });
    expect(f.last().phase).toBe("saved");
    expect(f.last().profile?.name).toBe("Alice 王");
  });
  it("refuses a false saved claim and a stale reopened name, without automatic resubmission", async () => {
    const fetcher = vi.fn<Fetcher>().mockResolvedValueOnce(card())
      .mockResolvedValueOnce(card("New name", owner.email, { saved: true }))
      .mockResolvedValueOnce(card("Alice"));
    const f = fixture(fetcher);
    await f.controller.load();
    await f.controller.save("New name");
    expect(f.last().phase).toBe("unconfirmed");
    await f.controller.save("Yet another name");
    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(f.states.filter((s) => s.phase === "saved")).toHaveLength(0);
  });
  it("reopens a matching stored name without claiming an acknowledged write", async () => {
    const fetcher = vi.fn<Fetcher>().mockResolvedValueOnce(card())
      .mockRejectedValueOnce(new Error("connection lost after sending"))
      .mockResolvedValueOnce(card("Recovered name"));
    const f = fixture(fetcher);
    await f.controller.load();
    await f.controller.save("Recovered name");
    expect(f.last().phase).toBe("unconfirmed");
    await f.controller.load();
    expect(fetcher.mock.calls.map(([, init]) => init.method)).toEqual(["GET", "PUT", "GET"]);
    expect(f.last().phase).toBe("ready");
    expect(f.last().message).toContain("earlier save response remains unconfirmed");
    expect(f.states.some((state) => state.phase === "saved")).toBe(false);
  });
  it("keeps failed writes unconfirmed when another read does not match", async () => {
    const fetcher = vi.fn<Fetcher>().mockResolvedValueOnce(card())
      .mockResolvedValueOnce(new Response(JSON.stringify({ state: "write_unconfirmed" }), { status: 503 }))
      .mockResolvedValueOnce(card());
    const f = fixture(fetcher);
    await f.controller.load();
    await f.controller.save("Unconfirmed name");
    await f.controller.load();
    await f.controller.save("Blind retry");
    expect(f.last().phase).toBe("unconfirmed");
    expect(fetcher).toHaveBeenCalledTimes(3);
  });
  it.each([
    { user: { email: "bob@example.test", name: "Bob" }, visibility: "private" },
    { user: { email: owner.email, name: "Alice" }, visibility: "public" },
    { user: { email: owner.email }, visibility: "private" },
    null,
  ])("does not accept another account or malformed profile: %j", async (body) => {
    const f = fixture(async () => new Response(JSON.stringify(body)));
    await f.controller.load();
    expect(f.last().phase).toBe("error");
    expect(f.last().profile).toBeNull();
  });
  it("never claims save from an unconfirmed PUT response", async () => {
    const fetcher = vi.fn<Fetcher>().mockResolvedValueOnce(card()).mockResolvedValueOnce(card("New name"));
    const f = fixture(fetcher);
    await f.controller.load();
    await f.controller.save("New name");
    expect(f.last().phase).toBe("unconfirmed");
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it("rejects invalid names and unchanged names before making any write", async () => {
    const fetcher = vi.fn(async (_url: string, _init: RequestInit) => card());
    const f = fixture(fetcher);
    await f.controller.load();
    for (const name of ["", "  ", "x".repeat(121), "bad\nname", "bad\u007fname", " Alice "]) {
      await f.controller.save(name);
    }
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("serializes user actions so simultaneous saves cannot create duplicate writes", async () => {
    const put = deferred<Response>();
    const fetcher = vi.fn<Fetcher>().mockResolvedValueOnce(card()).mockImplementationOnce(() => put.promise)
      .mockResolvedValueOnce(card("First"));
    const f = fixture(fetcher);
    await f.controller.load();
    const saving = f.controller.save("First");
    await f.controller.save("Second");
    await f.controller.load();
    expect(fetcher).toHaveBeenCalledTimes(2);
    put.resolve(card("First", owner.email, { saved: true }));
    await saving;
    expect(f.last().phase).toBe("saved");
  });
  it.each(["logout", "other account", "token replacement", "dispose"] as const)(
    "ignores late write responses after %s even when fetch ignores abort", async (reason) => {
      const put = deferred<Response>();
      const fetcher = vi.fn<Fetcher>().mockResolvedValueOnce(card()).mockImplementationOnce(() => put.promise);
      const f = fixture(fetcher);
      await f.controller.load();
      const saving = f.controller.save("Old result");
      const count = f.states.length;
      if (reason === "logout") f.changeIdentity(null);
      if (reason === "other account") f.changeIdentity({ email: "bob@example.test", token: owner.token });
      if (reason === "token replacement") f.changeIdentity({ ...owner, token: "new-token" });
      if (reason === "dispose") f.controller.dispose();
      put.resolve(card("Old result", owner.email, { saved: true }));
      await saving;
      expect(f.states).toHaveLength(count);
      expect(fetcher).toHaveBeenCalledTimes(2);
      expect((fetcher.mock.calls[1][1].signal as AbortSignal).aborted).toBe(reason === "dispose");
    });
  it("does not publish a late reopened read for an account that has changed", async () => {
    const read = deferred<Response>();
    const fetcher = vi.fn<Fetcher>().mockResolvedValueOnce(card())
      .mockResolvedValueOnce(card("New", owner.email, { saved: true }))
      .mockImplementationOnce(() => read.promise);
    const f = fixture(fetcher);
    await f.controller.load();
    const saving = f.controller.save("New");
    await vi.waitFor(() => expect(fetcher).toHaveBeenCalledTimes(3));
    f.changeIdentity(null);
    const count = f.states.length;
    read.resolve(card("New"));
    await saving;
    expect(f.states).toHaveLength(count);
  });
});
