/** Unit-only contract cases, shared by Vitest and the dependency-free Node verification harness. */
import assert from "node:assert/strict";
import { createCouncilSessionController, COUNCIL_TOKEN_KEY, COUNCIL_USER_KEY, type CouncilSessionState } from "./councilSession.ts";
import { companyWorkspaceHref, councilLoginHref, councilLoginReturnFromSearch, councilLoginDestination, safeCouncilLoginReturn } from "./councilLoginReturn.ts";

type UnitCase = (name: string, body: () => void | Promise<void>) => unknown;
const owner = { email: "owner@example.test", name: "Unit owner" };
const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const session = (token = "unit-opaque-session", user = owner) => response({ token, user });
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
const bearer = (init: RequestInit) => (init.headers as Record<string, string> | undefined)?.Authorization;
/** Fresh responses per call: POST returns the candidate session, GET /me verifies it by Bearer. */
const verifying = (post: (url: string, init: RequestInit) => Promise<Response>, me: (token: string | undefined, init: RequestInit) => Promise<Response> = async () => response({ user: owner })) =>
  async (url: string, init: RequestInit) => (init.method === "GET" ? me(bearer(init), init) : post(url, init));
function fixture(fetcher: (url: string, init: RequestInit) => Promise<Response>, options: { token?: string; user?: unknown; authApiBase?: string } = {}) {
  const cache = new Map<string, string>();
  if (options.token !== undefined) cache.set(COUNCIL_TOKEN_KEY, options.token);
  if (options.user !== undefined) cache.set(COUNCIL_USER_KEY, JSON.stringify(options.user));
  const published: CouncilSessionState[] = [];
  const controller = createCouncilSessionController({
    storage: { getItem: (key) => cache.get(key) ?? null, setItem: (key, value) => { cache.set(key, value); }, removeItem: (key) => { cache.delete(key); } },
    fetcher, authApiBase: options.authApiBase, publish: (value) => { published.push(value); },
  });
  return { controller, cache, published, latest: () => published.at(-1) };
}

export function registerCouncilAuthContractCases(test: UnitCase) {
  test("cached presentation never becomes a user before same-origin verification", async () => {
    const pending = deferred<Response>();
    const calls: { url: string; init: RequestInit }[] = [];
    const f = fixture(async (url, init) => { calls.push({ url, init }); return pending.promise; }, {
      token: "unit-restored-token", user: { email: "untrusted@example.test", role: "admin" }, authApiBase: "https://other-api.example.test",
    });
    const restoring = f.controller.restore();
    assert.deepEqual(f.latest(), { user: null, token: null, loading: true });
    assert.equal(f.cache.has(COUNCIL_USER_KEY), false);
    assert.equal(calls[0].url, "/api/auth/me");
    assert.equal(calls[0].init.method, "GET");
    assert.deepEqual(calls[0].init.headers, { Authorization: "Bearer unit-restored-token" });
    assert.equal(calls[0].init.cache, "no-store");
    pending.resolve(response({ user: owner }));
    await restoring;
    assert.equal(f.latest()?.user?.email, owner.email);
    assert.equal(f.latest()?.user?.role, "user");
    assert.equal(f.latest()?.loading, false);
    assert.equal(f.latest()?.token, "unit-restored-token");
  });

  test("a user cache without a token is cleared without an auth request", async () => {
    let calls = 0;
    const f = fixture(async () => { calls += 1; throw new Error("unexpected"); }, { user: owner });
    await f.controller.restore();
    assert.equal(calls, 0);
    assert.deepEqual(f.latest(), { user: null, token: null, loading: false });
    assert.equal(f.cache.size, 0);
  });

  test("401 removes both expired token and cached presentation", async () => {
    const f = fixture(async () => response({ error: "invalid or expired token" }, 401), { token: "unit-expired", user: owner });
    await f.controller.restore();
    assert.deepEqual(f.latest(), { user: null, token: null, loading: false });
    assert.equal(f.cache.size, 0);
  });

  test("denied or unavailable verification never authenticates the cached user", async () => {
    for (const status of [403, 503]) {
      const f = fixture(async () => response({ error: "unavailable" }, status), { token: "unit-retryable", user: owner });
      await f.controller.restore();
      assert.deepEqual(f.latest(), { user: null, token: null, loading: false });
      assert.equal(f.cache.get(COUNCIL_TOKEN_KEY), "unit-retryable");
      assert.equal(f.cache.has(COUNCIL_USER_KEY), false);
    }
  });

  test("a network failure keeps only the retryable token, with no authenticated UI", async () => {
    const f = fixture(async () => { throw new TypeError("unit network failure"); }, { token: "unit-retryable", user: owner });
    await f.controller.restore();
    assert.deepEqual(f.latest(), { user: null, token: null, loading: false });
    assert.equal(f.cache.has(COUNCIL_USER_KEY), false);
  });

  test("malformed successful verification responses clear unusable sessions", async () => {
    for (const body of [null, {}, { user: null }, { user: { email: "" , name: "" } }, { user: { email: owner.email } }, { user: { email: owner.email, name: 12 } }, { user: [owner] }]) {
      const f = fixture(async () => response(body), { token: "unit-unusable", user: owner });
      await f.controller.restore();
      assert.equal(f.latest()?.user, null);
      assert.equal(f.cache.size, 0);
    }
  });

  test("invalid JSON from a successful verification is rejected and cleared", async () => {
    const f = fixture(async () => new Response("not JSON", { status: 200 }), { token: "unit-unusable", user: owner });
    await f.controller.restore();
    assert.equal(f.latest()?.user, null);
    assert.equal(f.cache.size, 0);
  });

  test("logout beats a late restore even when the transport ignores cancellation", async () => {
    const pending = deferred<Response>();
    const signals: AbortSignal[] = [];
    const f = fixture(async (_url, init) => { if (init.signal) signals.push(init.signal); return pending.promise; }, { token: "unit-old", user: owner });
    const restoring = f.controller.restore();
    f.controller.logout();
    assert.equal(signals[0].aborted, true);
    pending.resolve(response({ user: owner }));
    await restoring;
    assert.deepEqual(f.latest(), { user: null, token: null, loading: false });
    assert.equal(f.cache.size, 0);
  });

  test("a new login wins over an older restored token", async () => {
    const old = deferred<Response>();
    const f = fixture(async (_url, init) => init.method === "POST" ? session("unit-new")
      : bearer(init) === "Bearer unit-old" ? old.promise : response({ user: owner }), { token: "unit-old", user: owner });
    const restoring = f.controller.restore();
    await f.controller.login(owner.email, "unit-password");
    old.resolve(response({ user: { email: "old@example.test", name: "Old unit owner" } }));
    await restoring;
    assert.equal(f.latest()?.user?.email, owner.email);
    assert.equal(f.latest()?.token, "unit-new");
    assert.equal(f.cache.get(COUNCIL_TOKEN_KEY), "unit-new");
  });

  test("unmount disposal aborts restoration and prevents later UI or cache writes", async () => {
    const pending = deferred<Response>();
    const f = fixture(async () => pending.promise, { token: "unit-old", user: owner });
    const restoring = f.controller.restore();
    f.controller.dispose();
    const count = f.published.length;
    pending.resolve(response({ user: owner }));
    await restoring;
    assert.equal(f.published.length, count);
    assert.equal(f.cache.has(COUNCIL_USER_KEY), false);
  });

  test("logout also wins while a successful response body is still being read", async () => {
    const body = deferred<unknown>();
    const r = response({});
    r.json = () => body.promise;
    const f = fixture(async () => r, { token: "unit-old" });
    const restoring = f.controller.restore();
    await Promise.resolve();
    f.controller.logout();
    body.resolve({ user: owner });
    await restoring;
    assert.equal(f.latest()?.user, null);
    assert.equal(f.cache.size, 0);
  });

  test("login preserves the real API contract and stores only its valid session", async () => {
    const captured: { url: string; init: RequestInit }[] = [];
    const f = fixture(async (url, init) => { captured.push({ url, init }); return session(); }, { authApiBase: "https://existing-api.example.test" });
    await f.controller.login(owner.email, "unit-password");
    assert.equal(captured[0].url, "https://existing-api.example.test/api/auth/login");
    assert.equal(captured[0].init.method, "POST");
    assert.deepEqual(JSON.parse(String(captured[0].init.body)), { email: owner.email, password: "unit-password" });
    assert.equal(f.latest()?.user?.email, owner.email);
    assert.equal(f.cache.get(COUNCIL_TOKEN_KEY), "unit-opaque-session");
  });

  test("registration preserves name and existing API behavior without creating a test account", async () => {
    const captured: { url: string; init: RequestInit }[] = [];
    const f = fixture(async (url, init) => { captured.push({ url, init }); return session(); });
    await f.controller.signup(owner.email, "unit-password", "Unit supplied name");
    assert.equal(captured[0].url, "/api/auth/register");
    assert.deepEqual(JSON.parse(String(captured[0].init.body)), { email: owner.email, password: "unit-password", name: "Unit supplied name" });
  });

  test("malformed auth successes or a different returned account cannot become a session", async () => {
    for (const body of [{}, { token: "unit-token", user: {} }, { token: "", user: owner }, { token: null, user: owner }, { token: "unit-token", user: { ...owner, name: null } }, { token: "unit-token", user: { email: "other@example.test", name: "Other" } }]) {
      const f = fixture(async () => response(body));
      await assert.rejects(f.controller.login(owner.email, "unit-password"), /invalid session/);
      assert.equal(f.latest()?.user, null);
      assert.equal(f.cache.size, 0);
    }
  });

  test("failed auth stays failed instead of creating a fallback identity", async () => {
    const f = fixture(async () => response({ error: "invalid credentials" }, 401));
    await assert.rejects(f.controller.login(owner.email, "unit-password"), /invalid credentials/);
    assert.equal(f.latest()?.user, null);
    assert.equal(f.cache.size, 0);
  });

  test("invalid JSON from a successful login cannot be cached as a session", async () => {
    const f = fixture(async () => new Response("not JSON", { status: 200 }));
    await assert.rejects(f.controller.login(owner.email, "unit-password"), /invalid session/);
    assert.equal(f.latest()?.user, null);
    assert.equal(f.cache.size, 0);
  });

  test("a late first login cannot overwrite a newer login", async () => {
    const first = deferred<Response>();
    const second = deferred<Response>();
    let posts = 0;
    const f = fixture(verifying(async () => (++posts === 1 ? first.promise : second.promise)));
    const oldLogin = f.controller.login(owner.email, "unit-password");
    const rejected = assert.rejects(oldLogin, { name: "AbortError" });
    const newLogin = f.controller.login(owner.email, "unit-password");
    second.resolve(session("unit-second"));
    await newLogin;
    first.resolve(session("unit-first"));
    await rejected;
    assert.equal(f.latest()?.token, "unit-second");
    assert.equal(f.cache.get(COUNCIL_TOKEN_KEY), "unit-second");
  });

  test("logout cancels an in-flight login without reviving its eventual session", async () => {
    const pending = deferred<Response>();
    const f = fixture(async () => pending.promise);
    const login = f.controller.login(owner.email, "unit-password");
    const rejected = assert.rejects(login, { name: "AbortError" });
    f.controller.logout();
    pending.resolve(session());
    await rejected;
    assert.equal(f.latest()?.user, null);
    assert.equal(f.cache.size, 0);
  });

  test("unmount disposal cancels an in-flight login without UI or cache writes", async () => {
    const pending = deferred<Response>();
    const f = fixture(async () => pending.promise);
    const login = f.controller.login(owner.email, "unit-password");
    const rejected = assert.rejects(login, { name: "AbortError" });
    f.controller.dispose();
    pending.resolve(session());
    await rejected;
    assert.equal(f.published.length, 0);
    assert.equal(f.cache.size, 0);
  });

  test("unreadable browser storage fails closed without submitting authentication", async () => {
    const published: CouncilSessionState[] = [];
    let calls = 0;
    const controller = createCouncilSessionController({
      storage: { getItem: () => { throw new Error("disabled"); }, setItem: () => { throw new Error("disabled"); }, removeItem: () => { throw new Error("disabled"); } },
      fetcher: async () => { calls += 1; return session(); }, publish: (value) => { published.push(value); },
    });
    await controller.restore();
    assert.equal(published.at(-1)?.user, null);
    await assert.rejects(controller.login(owner.email, "unit-password"), { name: "AbortError" });
    assert.equal(published.at(-1)?.user, null);
    assert.equal(calls, 0);
    controller.logout();
    assert.equal(published.at(-1)?.user, null);
  });

  const nextOwner = { email: "other-tab@example.test", name: "Other tab unit owner" };
  const otherToken = "unit-other-tab-token";
  const replaceCachedIdentity = (cache: Map<string, string>) => {
    cache.set(COUNCIL_TOKEN_KEY, otherToken);
    cache.set(COUNCIL_USER_KEY, JSON.stringify(nextOwner));
  };
  const expectReplacementPreserved = (f: ReturnType<typeof fixture>) => {
    assert.equal(f.cache.get(COUNCIL_TOKEN_KEY), otherToken);
    assert.equal(f.cache.get(COUNCIL_USER_KEY), JSON.stringify(nextOwner));
    assert.deepEqual(f.latest(), { user: null, token: null, loading: false });
    assert.equal(f.published.some(value => value.user !== null), false);
  };

  for (const variant of ["success", "401", "403", "malformed user", "fetch rejection"] as const) {
    test(`another tab's token survives a late restore ${variant} response`, async () => {
      const pending = deferred<Response>();
      const f = fixture(async () => pending.promise, { token: "unit-tab-A", user: owner });
      const restoring = f.controller.restore();
      replaceCachedIdentity(f.cache);
      if (variant === "fetch rejection") pending.reject(new TypeError("unit deferred network failure"));
      else pending.resolve(response(variant === "malformed user" ? { user: {} } : { user: owner }, variant === "401" ? 401 : variant === "403" ? 403 : 200));
      await restoring;
      expectReplacementPreserved(f);
    });
  }

  for (const variant of ["success", "malformed user", "JSON rejection"] as const) {
    test(`another tab's token survives a late restore ${variant} body`, async () => {
      const body = deferred<unknown>();
      const reading = deferred<void>();
      const r = response({});
      r.json = () => { reading.resolve(); return body.promise; };
      const f = fixture(async () => r, { token: "unit-tab-A", user: owner });
      const restoring = f.controller.restore();
      await reading.promise;
      replaceCachedIdentity(f.cache);
      if (variant === "JSON rejection") body.reject(new SyntaxError("unit deferred JSON failure"));
      else body.resolve(variant === "malformed user" ? { user: {} } : { user: owner });
      await restoring;
      expectReplacementPreserved(f);
    });
  }

  for (const stage of ["response", "body"] as const) {
    test(`cross-tab removal during restore ${stage} cannot revive the removed token`, async () => {
      const pending = deferred<Response>();
      const body = deferred<unknown>();
      const reading = deferred<void>();
      const r = response({});
      r.json = () => { reading.resolve(); return body.promise; };
      const f = fixture(async () => stage === "response" ? pending.promise : r, { token: "unit-tab-A", user: owner });
      const restoring = f.controller.restore();
      if (stage === "body") await reading.promise;
      f.cache.delete(COUNCIL_TOKEN_KEY);
      f.cache.delete(COUNCIL_USER_KEY);
      if (stage === "response") pending.resolve(response({ user: owner }));
      else body.resolve({ user: owner });
      await restoring;
      assert.equal(f.cache.size, 0);
      assert.deepEqual(f.latest(), { user: null, token: null, loading: false });
      assert.equal(f.published.some(value => value.user !== null), false);
    });
  }

  test("successful restoration never writes its captured token back to shared storage", async () => {
    const cache = new Map([[COUNCIL_TOKEN_KEY, "unit-still-current"]]);
    const tokenWrites: string[] = [];
    const published: CouncilSessionState[] = [];
    const controller = createCouncilSessionController({
      storage: { getItem: key => cache.get(key) ?? null, setItem: (key, value) => { if (key === COUNCIL_TOKEN_KEY) tokenWrites.push(value); cache.set(key, value); }, removeItem: key => { cache.delete(key); } },
      fetcher: async () => response({ user: owner }), publish: value => { published.push(value); },
    });
    await controller.restore();
    assert.equal(published.at(-1)?.user?.email, owner.email);
    assert.equal(published.at(-1)?.token, "unit-still-current");
    assert.deepEqual(tokenWrites, []);
  });

  for (const stage of ["response", "body", "fetch rejection"] as const) {
    test(`unreadable storage during restore ${stage} preserves the shared cache and publishes no identity`, async () => {
      const cache = new Map([[COUNCIL_TOKEN_KEY, "unit-tab-A"], [COUNCIL_USER_KEY, JSON.stringify(owner)]]);
      let readable = true;
      const published: CouncilSessionState[] = [];
      const pending = deferred<Response>();
      const body = deferred<unknown>();
      const reading = deferred<void>();
      const r = response({});
      r.json = () => { reading.resolve(); return body.promise; };
      const controller = createCouncilSessionController({
        storage: { getItem: key => { if (!readable) throw new Error("unit storage denied"); return cache.get(key) ?? null; }, setItem: (key, value) => { cache.set(key, value); }, removeItem: key => { cache.delete(key); } },
        fetcher: async () => stage === "body" ? r : pending.promise, publish: value => { published.push(value); },
      });
      const restoring = controller.restore();
      if (stage === "body") await reading.promise;
      replaceCachedIdentity(cache);
      readable = false;
      if (stage === "fetch rejection") pending.reject(new TypeError("unit network failure"));
      else if (stage === "body") body.resolve({ user: owner });
      else pending.resolve(response({ user: owner }));
      await restoring;
      assert.equal(cache.get(COUNCIL_TOKEN_KEY), otherToken);
      assert.equal(cache.get(COUNCIL_USER_KEY), JSON.stringify(nextOwner));
      assert.deepEqual(published.at(-1), { user: null, token: null, loading: false });
      assert.equal(published.some(value => value.user !== null), false);
    });
  }

  for (const action of ["login", "signup"] as const) {
    for (const stage of ["response", "body"] as const) {
      test(`another tab's identity cancels a pending ${action} ${stage} without overwriting it`, async () => {
        const pending = deferred<Response>();
        const body = deferred<unknown>();
        const reading = deferred<void>();
        const r = response({});
        r.json = () => { reading.resolve(); return body.promise; };
        const f = fixture(async () => stage === "response" ? pending.promise : r, { token: "unit-tab-A", user: owner });
        const authenticating = f.controller[action](owner.email, "unit-password");
        const rejected = assert.rejects(authenticating, { name: "AbortError" });
        if (stage === "body") await reading.promise;
        replaceCachedIdentity(f.cache);
        if (stage === "response") pending.resolve(session("unit-late-login"));
        else body.resolve({ token: "unit-late-login", user: owner });
        await rejected;
        expectReplacementPreserved(f);
      });
    }
  }

  test("a new other-tab login also cancels a pending login that began without any cached token", async () => {
    const pending = deferred<Response>();
    const f = fixture(async () => pending.promise);
    const login = f.controller.login(owner.email, "unit-password");
    const rejected = assert.rejects(login, { name: "AbortError" });
    replaceCachedIdentity(f.cache);
    pending.resolve(session("unit-late-login"));
    await rejected;
    expectReplacementPreserved(f);
  });

  test("cross-tab removal cancels pending authentication rather than writing a new token", async () => {
    const pending = deferred<Response>();
    const f = fixture(async () => pending.promise, { token: "unit-tab-A" });
    const login = f.controller.login(owner.email, "unit-password");
    const rejected = assert.rejects(login, { name: "AbortError" });
    f.cache.delete(COUNCIL_TOKEN_KEY);
    pending.resolve(session("unit-late-login"));
    await rejected;
    assert.equal(f.cache.size, 0);
    assert.deepEqual(f.latest(), { user: null, token: null, loading: false });
  });

  test("a failed pending login cannot retain an old ready UI after another tab replaces its token", async () => {
    const pending = deferred<Response>();
    const f = fixture(async url => url === "/api/auth/me" ? response({ user: owner }) : pending.promise, { token: "unit-tab-A" });
    await f.controller.restore();
    assert.equal(f.latest()?.user?.email, owner.email);
    const login = f.controller.login(owner.email, "unit-password");
    const rejected = assert.rejects(login, { name: "AbortError" });
    replaceCachedIdentity(f.cache);
    pending.resolve(response({ error: "invalid credentials" }, 401));
    await rejected;
    assert.equal(f.cache.get(COUNCIL_TOKEN_KEY), otherToken);
    assert.equal(f.cache.get(COUNCIL_USER_KEY), JSON.stringify(nextOwner));
    assert.deepEqual(f.latest(), { user: null, token: null, loading: false });
  });

  test("a rejected login body cannot overwrite or clear another tab's newer identity", async () => {
    const body = deferred<unknown>();
    const reading = deferred<void>();
    const r = response({});
    r.json = () => { reading.resolve(); return body.promise; };
    const f = fixture(async () => r, { token: "unit-tab-A", user: owner });
    const login = f.controller.login(owner.email, "unit-password");
    const rejected = assert.rejects(login, { name: "AbortError" });
    await reading.promise;
    replaceCachedIdentity(f.cache);
    body.reject(new SyntaxError("unit late login JSON failure"));
    await rejected;
    expectReplacementPreserved(f);
  });

  for (const stage of ["response", "body"] as const) {
    test(`unreadable storage during pending login ${stage} cannot publish or overwrite identity`, async () => {
      const cache = new Map([[COUNCIL_TOKEN_KEY, "unit-tab-A"], [COUNCIL_USER_KEY, JSON.stringify(owner)]]);
      let readable = true;
      const published: CouncilSessionState[] = [];
      const pending = deferred<Response>();
      const body = deferred<unknown>();
      const reading = deferred<void>();
      const r = response({});
      r.json = () => { reading.resolve(); return body.promise; };
      const controller = createCouncilSessionController({
        storage: { getItem: key => { if (!readable) throw new Error("unit storage denied"); return cache.get(key) ?? null; }, setItem: (key, value) => { cache.set(key, value); }, removeItem: key => { cache.delete(key); } },
        fetcher: async () => stage === "body" ? r : pending.promise, publish: value => { published.push(value); },
      });
      const login = controller.login(owner.email, "unit-password");
      const rejected = assert.rejects(login, { name: "AbortError" });
      if (stage === "body") await reading.promise;
      replaceCachedIdentity(cache);
      readable = false;
      if (stage === "body") body.resolve({ token: "unit-late-login", user: owner });
      else pending.resolve(session("unit-late-login"));
      await rejected;
      assert.equal(cache.get(COUNCIL_TOKEN_KEY), otherToken);
      assert.equal(cache.get(COUNCIL_USER_KEY), JSON.stringify(nextOwner));
      assert.deepEqual(published.at(-1), { user: null, token: null, loading: false });
      assert.equal(published.some(value => value.user !== null), false);
    });
  }

  test("a token write failure cannot publish an untracked authenticated identity", async () => {
    for (const writeBehavior of ["throw", "ignore"] as const) {
      const methods: string[] = [];
      const published: CouncilSessionState[] = [];
      const controller = createCouncilSessionController({
        storage: { getItem: () => null, setItem: () => { if (writeBehavior === "throw") throw new Error("unit write denied"); }, removeItem: () => {} },
        fetcher: async (_url, init) => { methods.push(String(init.method)); return init.method === "GET" ? response({ user: owner }) : session(); }, publish: value => { published.push(value); },
      });
      await assert.rejects(controller.login(owner.email, "unit-password"), { name: "AbortError" });
      assert.deepEqual(methods, ["POST", "GET"]);
      assert.deepEqual(published.at(-1), { user: null, token: null, loading: false });
    }
  });

  test("ordinary login keeps the existing dashboard default", () => {
    for (const value of [undefined, null, "", "/dashboard", "/dashboard/"]) assert.equal(safeCouncilLoginReturn(value), "/dashboard");
    assert.equal(councilLoginHref(), "/login/");
    assert.equal(councilLoginReturnFromSearch(""), "/dashboard");
  });

  test("company and opaque case navigation survive safe login encoding", () => {
    for (const id of [undefined, "case:opaque/one?&=", "a value with spaces", "界".repeat(256)]) {
      const target = companyWorkspaceHref(id);
      const url = new URL(councilLoginHref(target), "https://councilof.ai");
      assert.equal(councilLoginReturnFromSearch(url.search), target);
      assert.equal(new URL(target, url.origin).searchParams.get("case"), id ?? null);
    }
  });

  test("external, protocol-relative, escaped-host and unsupported destinations are rejected", () => {
    for (const target of ["https://evil.example/dashboard", "//evil.example/dashboard", "/\\evil.example/dashboard", "javascript:alert(1)", "/settings", "/private/../dashboard/?workspace=company", "/dashboard%2f?workspace=company", "/dashboard/?workspace=company#fragment", "/dashboard/?workspace=company\n", "/dashboard//?workspace=company"]) {
      assert.equal(safeCouncilLoginReturn(target), "/dashboard", target);
    }
  });

  test("only the two known company navigation keys may be retained", () => {
    for (const target of ["/dashboard/?token=unit-secret", "/dashboard/?workspace=company&password=unit-secret", "/dashboard/?workspace=company&question=private+text", "/dashboard/?workspace=other", "/dashboard/?case=one", "/dashboard/?workspace=company&workspace=company", "/dashboard/?workspace=company&case=one&case=two"]) {
      assert.equal(safeCouncilLoginReturn(target), "/dashboard", target);
    }
    assert.equal(councilLoginReturnFromSearch("?next=%2Fdashboard%2F%3Fworkspace%3Dcompany&next=%2Fdashboard"), "/dashboard");
  });

  test("case IDs are bounded opaque query values, with controls and surrounding whitespace rejected", () => {
    for (const id of ["", "x".repeat(257), "unit\ncase", "unit\u0000case", "unit\u007fcase", "unit\u0080case", "unit\u0085case", "unit\u009fcase", " case", "case ", "\u00a0case", "case\u3000"]) assert.throws(() => companyWorkspaceHref(id));
    assert.equal(safeCouncilLoginReturn("/dashboard/?workspace=company&case=bad%0Avalue"), "/dashboard");
    assert.equal(safeCouncilLoginReturn("/dashboard/?workspace=company&case=" + "x".repeat(257)), "/dashboard");
    assert.equal(safeCouncilLoginReturn("/dashboard/?workspace=company&case=%20case"), "/dashboard");
    assert.equal(safeCouncilLoginReturn("/dashboard/?workspace=company&case=case%20"), "/dashboard");
    assert.equal(safeCouncilLoginReturn("/dashboard/?workspace=company&case=unit%C2%80case"), "/dashboard");
    assert.equal(safeCouncilLoginReturn("/dashboard/?workspace=company&case=unit%C2%85case"), "/dashboard");
  });

  test("the public demo and absent identity do not navigate into the company workspace", () => {
    const target = companyWorkspaceHref("opaque-case");
    assert.equal(councilLoginDestination(target, "demo@csoai.com"), "/dashboard");
    assert.equal(councilLoginDestination(target, "DEMO@CSOAI.COM"), "/dashboard");
    assert.equal(councilLoginDestination(target, null), "/dashboard");
    assert.equal(councilLoginDestination(target, owner.email), target);
  });
  test("server-verified identities keep distinct canonical IDs across owner changes", async () => {
    const next = { email: "second-owner@example.test", name: "Second unit owner" };
    let reads = 0;
    const f = fixture(async () => response({ user: ++reads === 1 ? owner : next }), { token: "unit-first", user: { id: 0, email: owner.email, name: "Untrusted cache" } });
    await f.controller.restore();
    const firstId = f.latest()?.user?.id;
    assert.equal(firstId, owner.email);
    f.controller.logout();
    f.cache.set(COUNCIL_TOKEN_KEY, "unit-second");
    await f.controller.restore();
    assert.equal(f.latest()?.user?.id, next.email);
    assert.notEqual(f.latest()?.user?.id, firstId);
    assert.equal(JSON.parse(f.cache.get(COUNCIL_USER_KEY)!).id, next.email);
  });

  test("login, registration and restore preserve canonical normalized subject IDs", async () => {
    const mixed = { email: "OWNER@EXAMPLE.TEST", name: "Unit owner" };
    for (const action of ["login", "signup"] as const) {
      const f = fixture(verifying(async () => session("unit-issued", mixed), async (token) => token === "Bearer unit-issued" ? response({ user: mixed }) : response({}, 401)));
      await f.controller[action](owner.email, "unit-password");
      assert.equal(f.latest()?.user?.id, owner.email);
      assert.equal(f.latest()?.user?.email, owner.email);
      assert.equal(JSON.parse(f.cache.get(COUNCIL_USER_KEY)!).id, owner.email);
    }
    const restored = fixture(async () => response({ user: mixed }), { token: "unit-restored", user: { id: 0, ...mixed } });
    await restored.controller.restore();
    assert.equal(restored.latest()?.user?.id, owner.email);
    assert.equal(restored.latest()?.user?.email, owner.email);
  });


  // ---- Post-login/register same-origin /me verification (new behavior beyond the donor) ----
  const actions = ["login", "signup"] as const;
  const run = (f: ReturnType<typeof fixture>, action: (typeof actions)[number]) =>
    action === "login" ? f.controller.login(owner.email, "unit-password") : f.controller.signup(owner.email, "unit-password", "Unit supplied name");
  const unrelated = (f: ReturnType<typeof fixture>) => f.cache.set("unit-unrelated", "kept");
  const expectNoCandidate = (f: ReturnType<typeof fixture>, priorToken: string | undefined) => {
    assert.equal(f.cache.get(COUNCIL_TOKEN_KEY), priorToken);
    assert.equal(f.cache.has(COUNCIL_USER_KEY), false);
    assert.equal(f.cache.get("unit-unrelated"), "kept");
    assert.equal(f.published.some(value => value.token === "unit-candidate" || (value.user !== null && value.token !== null)), false);
  };

  for (const action of actions) {
    test(`${action}: the verified /me name wins over the POST response`, async () => {
      const f = fixture(verifying(async () => session("unit-candidate", { ...owner, name: "POST name" }),
        async token => token === "Bearer unit-candidate" ? response({ user: { ...owner, name: "Verified name" } }) : response({}, 401)));
      await run(f, action);
      assert.equal(f.latest()?.user?.name, "Verified name");
      assert.equal(f.latest()?.user?.role, "user");
      assert.equal(f.latest()?.user?.subscriptionTier, "free");
      assert.equal(JSON.parse(f.cache.get(COUNCIL_USER_KEY)!).name, "Verified name");
      assert.equal(f.cache.get(COUNCIL_TOKEN_KEY), "unit-candidate");
    });

    test(`${action}: verification is a relative same-origin GET with the candidate Bearer, no-store and the same signal`, async () => {
      const calls: { url: string; init: RequestInit }[] = [];
      const f = fixture(async (url, init) => { calls.push({ url, init }); return init.method === "GET" ? response({ user: owner }) : session("unit-candidate"); },
        { authApiBase: "https://existing-api.example.test" });
      await run(f, action);
      assert.equal(calls.length, 2);
      assert.equal(calls[0].url, `https://existing-api.example.test/api/auth/${action === "login" ? "login" : "register"}`);
      assert.equal(calls[1].url, "/api/auth/me");
      assert.equal(calls[1].init.method, "GET");
      assert.deepEqual(calls[1].init.headers, { Authorization: "Bearer unit-candidate" });
      assert.equal(calls[1].init.cache, "no-store");
      assert.ok(calls[1].init.signal);
      assert.equal(calls[1].init.signal, calls[0].init.signal);
    });

    test(`${action}: the candidate is neither cached nor published while /me is pending`, async () => {
      const me = deferred<Response>();
      const asked = deferred<void>();
      const f = fixture(verifying(async () => session("unit-candidate"), async () => { asked.resolve(); return me.promise; }), { token: "unit-prior" });
      unrelated(f);
      const authenticating = run(f, action);
      await asked.promise;
      expectNoCandidate(f, "unit-prior");
      me.resolve(response({ user: owner }));
      await authenticating;
      assert.equal(f.cache.get(COUNCIL_TOKEN_KEY), "unit-candidate");
      assert.equal(f.latest()?.user?.email, owner.email);
    });

    const failures: [string, () => Promise<Response>][] = [
      ["401", async () => response({ error: "invalid or expired token" }, 401)],
      ["403", async () => response({ error: "denied" }, 403)],
      ["503", async () => response({ error: "unavailable" }, 503)],
      ["network failure", async () => { throw new TypeError("unit network failure"); }],
      ["bad JSON", async () => new Response("not JSON", { status: 200 })],
      ["missing user", async () => response({})],
      ["malformed user", async () => response({ user: { email: owner.email } })],
      ["wrong subject", async () => response({ user: { email: "other@example.test", name: "Other" } })],
    ];
    for (const [variant, me] of failures) {
      test(`${action}: /me ${variant} rejects the candidate without caching or publishing it`, async () => {
        const f = fixture(verifying(async () => session("unit-candidate"), me), { token: "unit-prior" });
        unrelated(f);
        await assert.rejects(run(f, action));
        expectNoCandidate(f, "unit-prior");
        assert.equal(f.latest()?.loading, false);
      });
    }

    test(`${action}: a failed or malformed POST stops before any /me request`, async () => {
      for (const post of [response({ error: "invalid credentials" }, 401), response({}), new Response("not JSON", { status: 200 }),
        response({ token: "unit-candidate", user: { email: "other@example.test", name: "Other" } })]) {
        const methods: string[] = [];
        const f = fixture(async (_url, init) => { methods.push(String(init.method)); return init.method === "GET" ? response({ user: owner }) : post; });
        await assert.rejects(run(f, action));
        assert.deepEqual(methods, ["POST"]);
        assert.equal(f.cache.size, 0);
      }
    });

    const interruptions = ["logout", "dispose", "newer login", "cross-tab replacement", "cross-tab removal", "unreadable storage"] as const;
    for (const stage of ["response", "JSON"] as const) {
      for (const interruption of interruptions) {
        test(`${action}: a late /me ${stage} after ${interruption} cannot revive or overwrite identity`, async () => {
          const cache = new Map<string, string>([[COUNCIL_TOKEN_KEY, "unit-prior"], ["unit-unrelated", "kept"]]);
          let readable = true;
          const published: CouncilSessionState[] = [];
          const me = deferred<Response>();
          const body = deferred<unknown>();
          const asked = deferred<void>();
          const reading = deferred<void>();
          const late = response({});
          late.json = () => { reading.resolve(); return body.promise; };
          let posts = 0;
          const controller = createCouncilSessionController({
            storage: { getItem: key => { if (!readable) throw new Error("unit storage denied"); return cache.get(key) ?? null; }, setItem: (key, value) => { cache.set(key, value); }, removeItem: key => { cache.delete(key); } },
            fetcher: async (_url, init) => {
              if (init.method === "POST") return session(++posts === 1 ? "unit-candidate" : "unit-newer");
              if (bearer(init) === "Bearer unit-candidate") { asked.resolve(); return stage === "JSON" ? late : me.promise; }
              return response({ user: owner });
            },
            publish: value => { published.push(value); },
          });
          const authenticating = action === "login" ? controller.login(owner.email, "unit-password") : controller.signup(owner.email, "unit-password");
          const outcome = authenticating.then(() => "resolved", (error: unknown) => (error as Error).name);
          await asked.promise;
          if (stage === "JSON") await reading.promise;
          let newer: Promise<void> | null = null;
          if (interruption === "logout") controller.logout();
          else if (interruption === "dispose") controller.dispose();
          else if (interruption === "newer login") newer = controller.login(owner.email, "unit-password-2");
          else if (interruption === "cross-tab replacement") { cache.set(COUNCIL_TOKEN_KEY, otherToken); cache.set(COUNCIL_USER_KEY, JSON.stringify(nextOwner)); }
          else if (interruption === "cross-tab removal") cache.delete(COUNCIL_TOKEN_KEY);
          else readable = false;
          if (stage === "response") me.resolve(response({ user: owner }));
          else body.resolve({ user: owner });
          assert.equal(await outcome, "AbortError");
          if (newer) await newer;
          readable = true;
          assert.equal(cache.get("unit-unrelated"), "kept");
          const expectedToken = { logout: undefined, dispose: "unit-prior", "newer login": "unit-newer", "cross-tab replacement": otherToken, "cross-tab removal": undefined, "unreadable storage": "unit-prior" }[interruption];
          assert.equal(cache.get(COUNCIL_TOKEN_KEY), expectedToken);
          if (interruption === "cross-tab replacement") assert.equal(cache.get(COUNCIL_USER_KEY), JSON.stringify(nextOwner));
          if (interruption === "newer login") {
            assert.equal(published.at(-1)?.token, "unit-newer");
            assert.equal(published.some(value => value.token === "unit-candidate"), false);
          } else {
            assert.equal(published.some(value => value.user !== null), false);
          }
        });
      }
    }
  }

}
