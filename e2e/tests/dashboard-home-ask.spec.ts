import { test, expect, type Page, type Request } from "@playwright/test";
import { writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";

/**
 * The first question typed on the Council OS start screen gets an answer (tools audit, 6 Oct 2026).
 *
 * Before: askTalk also recorded the question as a lobby chat turn, the canvas swapped to the chat
 * log, the Answers panel unmounted and its cleanup aborted POST /api/agui/run. No tool card and no
 * answer ever appeared for the first question.
 *
 * Local runs (npm run test:e2e:shell) have no /api on the static server, so /api/agui/run is
 * answered here with the event stream the live endpoint sent for this question on 6 Oct 2026:
 * the same AG-UI event types and field names, and the server_evidence result it returned
 * (NOT_MEASURED for github.com), with the single call the router now plans. With BASE_URL set the
 * real endpoint answers instead.
 */

const QUESTION = "What is measured about github.com?";

const RESULT = {
  tool: "server_evidence",
  args: { endpoint_url: "https://github.com/mcp" },
  label: "NOT_MEASURED",
  summary:
    "NOT_MEASURED — No published capsule is keyed to this endpoint. NOT_MEASURED is not a finding about the endpoint — nothing here says it is clean or unclean.",
  citation: {
    tool: "server_evidence",
    record_id: "9bd216a1ce7360312aa62926f2be25690ee0bddab306d4d0a0c38a1736cddb67",
    url: "https://councilof.ai/measurement-capsules/v0.2/endpoints/9b.json",
  },
  output: {
    doctrine: "measurement, not endorsement",
    state: "NOT_MEASURED",
    endpoint: "https://github.com/mcp",
    key: "9bd216a1ce7360312aa62926f2be25690ee0bddab306d4d0a0c38a1736cddb67",
    version: "0.2",
    shard_url: "https://councilof.ai/measurement-capsules/v0.2/endpoints/9b.json",
    as_of: "2026-10-01T08:11:31Z",
    n_capsules: 0,
    by_adapter: {},
    capsules: [],
    other_endpoints_measured_at_this_origin: [],
    note: "No published capsule is keyed to this endpoint. NOT_MEASURED is not a finding about the endpoint — nothing here says it is clean or unclean.",
  },
};

function aguiStream(): string {
  const t = Date.now();
  const events = [
    { type: "RUN_STARTED", threadId: "t-e2e", runId: "r-e2e", timestamp: t },
    { type: "TOOL_CALL_START", toolCallId: "call_1", toolCallName: "server_evidence", parentMessageId: "m-e2e", timestamp: t },
    { type: "TOOL_CALL_ARGS", toolCallId: "call_1", delta: JSON.stringify(RESULT.args), timestamp: t },
    { type: "TOOL_CALL_END", toolCallId: "call_1", timestamp: t },
    { type: "TOOL_CALL_RESULT", messageId: "tr-e2e", toolCallId: "call_1", role: "tool", content: JSON.stringify(RESULT), timestamp: t },
    { type: "TEXT_MESSAGE_START", messageId: "a-e2e", role: "assistant", timestamp: t },
    { type: "TEXT_MESSAGE_CONTENT", messageId: "a-e2e", delta: `**server_evidence** → ${RESULT.summary}\n- state: **NOT_MEASURED**`, timestamp: t },
    { type: "TEXT_MESSAGE_END", messageId: "a-e2e", timestamp: t },
    {
      type: "RUN_FINISHED",
      threadId: "t-e2e",
      runId: "r-e2e",
      result: { grounded: true, intent: "what is measured about this server", label: "NOT_MEASURED", answered_by: "tool:server_evidence", citations: [RESULT.citation] },
      timestamp: t,
    },
  ];
  return events.map((e) => `event: ${e.type}\ndata: ${JSON.stringify(e)}\n\n`).join("");
}

async function answerLocally(page: Page) {
  if (process.env.BASE_URL) return;
  await page.route("**/api/agui/run", (route) =>
    route.fulfill({ status: 200, headers: { "content-type": "text/event-stream", "cache-control": "no-store" }, body: aguiStream() }),
  );
}

const VIEWPORTS = [
  { name: "1440", project: "desktop", size: { width: 1440, height: 900 } },
  { name: "375", project: "mobile", size: { width: 375, height: 812 } },
];

test.beforeEach(async ({ context }) => {
  await context.route(/hf\.space/, (r) => r.abort());
});

/** Passive test diagnostics only: never clone, consume, cancel, or replace native transport. */
async function observeRunTransport(page: Page) {
  await page.addInitScript(() => {
    type Run = {
      nativeFetchId: number; signalId: number | null; url: string;
      signalAbortedAtFetch: boolean | null; signalReasonAtFetch: unknown;
      nativeReadCalls: number; nativeBytesObserved: number; nativeEOFObserved: boolean;
    };
    const diagnostics = {
      schema: "csoai.agui-native-transport-diagnostic/0.1", eventLimit: 50,
      eventsTruncated: false, faultsTruncated: false, events: [] as Record<string, unknown>[],
      requests: [] as Run[], faults: [] as unknown[],
    };
    (window as Window & { __aguiNativeTransport?: unknown }).__aguiNativeTransport = diagnostics;
    const reason = (value: unknown): unknown => {
      try {
        if (value instanceof DOMException || value instanceof Error)
          return { name: value.name.slice(0, 80), message: value.message.slice(0, 512) };
        if (value === null || value === undefined) return null;
        if (typeof value === "string") return { type: "string", value: value.slice(0, 512) };
        if (typeof value === "number" || typeof value === "boolean") return value;
        return { type: typeof value };
      } catch { return { type: "unreadable" }; }
    };
    const observe = (read: () => void) => {
      try { read(); } catch (error) {
        if (diagnostics.faults.length < 10) diagnostics.faults.push(reason(error));
        else diagnostics.faultsTruncated = true;
      }
    };
    const record = (run: Run, event: string, detail: Record<string, unknown> = {}) => observe(() => {
      if (diagnostics.events.length >= diagnostics.eventLimit) {
        diagnostics.eventsTruncated = true; return;
      }
      diagnostics.events.push({
        nativeFetchId: run.nativeFetchId, signalId: run.signalId, event,
        observedAt: new Date().toISOString(), monotonicMs: performance.now(), ...detail,
      });
    });
    const signalIds = new WeakMap<AbortSignal, number>();
    const signalRuns = new WeakMap<AbortSignal, Run[]>();
    const controllerIds = new WeakMap<AbortController, number>();
    const bodies = new WeakMap<object, Run>();
    const readers = new WeakMap<object, Run>();
    let nextSignalId = 0, nextControllerId = 0;
    const nativeFetch = window.fetch;
    const nativeAbort = AbortController.prototype.abort;
    const nativeGetReader = ReadableStream.prototype.getReader;
    const nativeRead = ReadableStreamDefaultReader.prototype.read;

    observe(() => {
      window.fetch = function (this: Window, ...args: Parameters<typeof fetch>) {
        const promise = Reflect.apply(nativeFetch, this, args) as ReturnType<typeof fetch>;
        observe(() => {
          const [input, init] = args;
          const request = input instanceof Request ? input : null;
          const url = new URL(request ? request.url : String(input), location.href);
          if ((init?.method ?? request?.method ?? "GET").toUpperCase() !== "POST" ||
              url.origin !== location.origin || url.pathname !== "/api/agui/run") return;
          if (diagnostics.requests.length >= diagnostics.eventLimit) {
            diagnostics.eventsTruncated = true; return;
          }
          const signal = init && "signal" in init ? init.signal ?? null : request?.signal ?? null;
          if (signal && !signalIds.has(signal)) signalIds.set(signal, ++nextSignalId);
          const run: Run = {
            nativeFetchId: diagnostics.requests.length + 1,
            signalId: signal ? signalIds.get(signal)! : null, url: url.href,
            signalAbortedAtFetch: signal?.aborted ?? null,
            signalReasonAtFetch: signal ? reason(signal.reason) : null,
            nativeReadCalls: 0, nativeBytesObserved: 0, nativeEOFObserved: false,
          };
          diagnostics.requests.push(run);
          record(run, "fetch", {
            aborted: signal?.aborted ?? null, reason: run.signalReasonAtFetch,
            stack: new Error("AGUI native fetch").stack?.slice(0, 8192) ?? null,
            earlierAbortCallerUnavailable: signal?.aborted ?? false,
          });
          if (signal) {
            signalRuns.set(signal, [...(signalRuns.get(signal) ?? []), run]);
            signal.addEventListener("abort", () => observe(() => record(run, "signal.abort", {
              aborted: signal.aborted, reason: reason(signal.reason),
              stack: new Error("AGUI signal abort event").stack?.slice(0, 8192) ?? null,
            })), { once: true });
          }
          void promise.then(
            (response) => observe(() => {
              if (response.body) bodies.set(response.body, run);
              record(run, "fetch.resolved", { status: response.status, bodyPresent: response.body !== null });
            }),
            (error: unknown) => record(run, "fetch.rejected", { error: reason(error) }),
          );
        });
        return promise;
      };
      AbortController.prototype.abort = function (this: AbortController, ...args: Parameters<typeof nativeAbort>) {
        observe(() => {
          const runs = signalRuns.get(this.signal);
          if (!runs) return;
          if (!controllerIds.has(this)) controllerIds.set(this, ++nextControllerId);
          for (const run of runs) record(run, "controller.abort.call", {
            controllerId: controllerIds.get(this), abortedBeforeCall: this.signal.aborted,
            requestedReason: reason(args[0]), argumentCount: args.length,
            stack: new Error("AGUI controller abort caller").stack?.slice(0, 8192) ?? null,
          });
        });
        return Reflect.apply(nativeAbort, this, args);
      };
      Object.defineProperty(ReadableStream.prototype, "getReader", {
        ...Object.getOwnPropertyDescriptor(ReadableStream.prototype, "getReader"),
        value: function (this: ReadableStream<unknown>, ...args: unknown[]) {
          const reader = Reflect.apply(nativeGetReader, this, args) as object;
          observe(() => {
            const run = bodies.get(this);
            if (run) { readers.set(reader, run); record(run, "body.getReader"); }
          });
          return reader;
        },
      });
      Object.defineProperty(ReadableStreamDefaultReader.prototype, "read", {
        ...Object.getOwnPropertyDescriptor(ReadableStreamDefaultReader.prototype, "read"),
        value: function (this: ReadableStreamDefaultReader<unknown>, ...args: unknown[]) {
          const promise = Reflect.apply(nativeRead, this, args) as Promise<ReadableStreamReadResult<unknown>>;
          observe(() => {
            const run = readers.get(this);
            if (!run) return;
            run.nativeReadCalls += 1;
            void promise.then(
              (chunk) => observe(() => {
                if (chunk.done === true) {
                  run.nativeEOFObserved = true; record(run, "body.nativeEOF");
                } else {
                  const bytes = ArrayBuffer.isView(chunk.value) ? chunk.value.byteLength : 0;
                  run.nativeBytesObserved += bytes; record(run, "body.nativeChunk", { bytes });
                }
              }),
              (error: unknown) => record(run, "body.nativeReadRejected", { error: reason(error) }),
            );
          });
          return promise;
        },
      });
    });
  });
}

for (const vp of VIEWPORTS) {
  test(`the first question typed on the start screen gets an answer at ${vp.name}px`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== vp.project, `${vp.name}px runs in the ${vp.project} project`);
    await page.setViewportSize(vp.size);
    await answerLocally(page);
    const aborted: string[] = [];
    page.on("requestfailed", (r) => {
      if (r.url().includes("/api/agui/run")) aborted.push(r.failure()?.errorText ?? "failed");
    });


    const postRequests: Request[] = [];
    const completedPostRequests: Request[] = [];
    const requestIds = new Map<Request, number>();
    const events: Record<string, unknown>[] = [];
    const eventLimit = 50;
    let eventsTruncated = false;
    const isRunPost = (r: Request) =>
      r.method() === "POST" && new URL(r.url()).pathname === "/api/agui/run";
    const record = (event: string, r: Request) => {
      if (!r.url().includes("/api/agui/run")) return;
      if (!requestIds.has(r)) requestIds.set(r, requestIds.size + 1);
      if (events.length >= eventLimit) {
        eventsTruncated = true;
        return;
      }
      let frameUrl: string | null = null;
      try {
        frameUrl = r.frame().url();
      } catch {
        // Service-worker requests may not expose a frame.
      }
      const body = r.postData();
      events.push({
        requestId: requestIds.get(r),
        event,
        observedAt: new Date().toISOString(),
        method: r.method(),
        url: r.url(),
        frameUrl,
        body: body?.slice(0, 4096) ?? null,
        bodyTruncated: body !== null && body.length > 4096,
        failure: event === "requestfailed" ? r.failure()?.errorText ?? "failed" : null,
      });
    };
    const onRequest = (r: Request) => {
      record("request", r);
      if (isRunPost(r)) postRequests.push(r);
    };
    const onFinished = (r: Request) => {
      record("requestfinished", r);
      if (isRunPost(r)) completedPostRequests.push(r);
    };
    const onFailed = (r: Request) => record("requestfailed", r);
    page.on("request", onRequest);
    page.on("requestfinished", onFinished);
    page.on("requestfailed", onFailed);

    try {
      await observeRunTransport(page);
      await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
      await page.locator('[data-testid="dashboard-shell"]').waitFor({ state: "visible", timeout: 60_000 });
      // The original inline first-question regression remains covered after intentionally
      // closing the new default view of the existing Ask conversation.
      const entryAsk = page.getByTestId("ask-pane");
      // 12 Oct 2026: on mobile the entry route keeps Ask closed; the launcher opens it on tap.
      if (vp.project === "mobile") await openFromLauncher(page);
      await expect(entryAsk).toBeVisible({ timeout: 30_000 });
      await entryAsk.getByRole("button", { name: "Close Ask", exact: true }).click();
      await expect(entryAsk).toBeHidden();
      const composer = page.getByLabel("Ask the Council, or name a pane to open");
      await expect(composer).toBeEnabled({ timeout: 30_000 });
      await composer.fill(QUESTION);
      await page.getByRole("button", { name: "Ask", exact: true }).click();
  
      const answered = page.getByTestId("talk-tool-card").or(page.getByTestId("talk-answer")).first();
      await expect(answered).toBeVisible({ timeout: 10_000 });
      expect(aborted, "POST /api/agui/run was not aborted").toEqual([]);
      // The answer stays on the start screen; the question did not swap the canvas to the chat log.
      await expect(page.getByTestId("gspc-workspace-home")).toBeVisible();
      await expect(page.getByRole("log", { name: "Council of AI conversation" })).toHaveCount(0);
      // One server question, one card: no census card about other hosts beside it.
      await expect(page.getByTestId("talk-tool-card")).toHaveCount(1);
      await expect(page.getByTestId("talk-tool-card").getByTestId("talk-state")).toHaveText(/NOT.MEASURED/);
      // A visible partial card is not complete-run acceptance.
      await expect.poll(() => completedPostRequests.length, "Question POST completed").toBe(1);
      expect(postRequests, "Exactly one question POST").toHaveLength(1);
      expect(completedPostRequests[0]).toBe(postRequests[0]);
      expect(aborted, "POST /api/agui/run was not aborted").toEqual([]);
    } finally {
      page.off("request", onRequest);
      page.off("requestfinished", onFinished);
      page.off("requestfailed", onFailed);
      const lifecyclePath = testInfo.outputPath("agui-request-lifecycle.json");
      await writeFile(lifecyclePath, JSON.stringify({
          question: QUESTION,
          project: testInfo.project.name,
          retry: testInfo.retry,
          viewport: vp.size,
          localFixture: !process.env.BASE_URL,
          postRequests: postRequests.length,
          completedPostRequests: completedPostRequests.length,
          eventLimit,
          eventsTruncated,
          events,
          nativeTransport: await page.evaluate(() =>
            (window as Window & { __aguiNativeTransport?: unknown }).__aguiNativeTransport ?? null,
          ).catch((error: unknown) => ({ unavailable: true, error: String(error).slice(0, 1024) })),
        }, null, 2));
      await testInfo.attach("agui-request-lifecycle", {
        path: lifecyclePath,
        contentType: "application/json",
      });
    }
  });
}

const PUBLIC_ASK = "https://councilof.ai/api/agui/run";
const BOARD_QUESTION = "What does Council measure?";

/** Controlled SPA navigation exercises the actual route owner before tools are prerendered. */
async function navigateInApp(page: Page, href: string) {
  await page.evaluate((next) => {
    window.history.pushState(null, "", next);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, href);
  await expect(page).toHaveURL(new RegExp(href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$"));
}

/**
 * 12 Oct 2026 (Nick, item 1): on mobile an entry route shows the page first, Ask stays closed and
 * nothing is POSTed; the floating launcher opens the same pane on tap.
 */
async function openFromLauncher(page: Page) {
  const fab = page.getByRole("button", { name: "Open Council of AI chat", exact: true });
  await expect(fab).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("ask-pane")).toBeHidden();
  await fab.click();
  await expect(fab).toBeHidden();
}

/** Desktop entry routes open Ask by themselves; mobile ones need the launcher tap first. */
async function enterAsk(page: Page, mobile: boolean) {
  if (mobile) await openFromLauncher(page);
  return readyAsk(page);
}

async function readyAsk(page: Page) {
  const pane = page.getByTestId("ask-pane");
  await expect(pane).toBeVisible({ timeout: 30_000 });
  await expect(pane.getByLabel("Your question", { exact: true })).toBeFocused({ timeout: 10_000 });
  await expect(pane.getByTestId("ask-introduction")).toContainText("Hi, this is Council of AI. How can I help?");
  await expect(pane.getByTestId("ask-introduction")).not.toContainText("MEOK");
  await expect(pane.getByTestId("ask-introduction")).toContainText("saved customer cases are not connected here");
  await expect(pane.getByTestId("ask-rule-based")).toContainText("never from an AI model");
  await expect(pane.getByRole("switch", { name: "Let it move the page for me" })).toHaveAttribute("aria-checked", "false");
  await expect(pane.getByRole("switch", { name: /^Voice\b/ })).toHaveAttribute("aria-checked", "false");
  return pane;
}

/** MCP route discovery is a read-only POST, separate from invoking an Ask/tool/payment. */
function isMcpDiscovery(request: Request, localOrigin: string): boolean {
  if (request.method() !== "POST" || !new Set([`${localOrigin}/mcp`, "https://councilof.ai/mcp"]).has(request.url())) return false;
  try {
    const body = request.postDataJSON();
    return body !== null && typeof body === "object" && !Array.isArray(body) &&
      body.jsonrpc === "2.0" &&
      ["initialize", "tools/list", "notifications/initialized"].includes(body.method) &&
      Object.keys(body).every(key => ["jsonrpc", "id", "method", "params"].includes(key));
  } catch { return false; }
}

type NativeAskCapture = {
  state: "pending" | "reading" | "complete" | "failed";
  started_at_utc: string;
  finished_at_utc: string | null;
  url: string | null;
  status: number | null;
  response_type: string | null;
  complete_eof: boolean;
  bytes: number;
  sha256: string | null;
  raw_base64: string;
  error: string | null;
  byte_limit: number;
  deadline_ms: number;
};
type AskCaptureWindow = Window & { __CSOAI_ASK_NATIVE_CAPTURE__?: NativeAskCapture };

test("root, Council OS home and plugin tools open the existing Ask only after hydration", async ({ page, baseURL }, info) => {
  test.setTimeout(120_000);
  const posts: Request[] = [];
  const localOrigin = new URL(baseURL || "http://127.0.0.1:4180").origin;
  page.on("request", request => { if (request.method() === "POST") posts.push(request); });
  const mobile = info.project.name === "mobile";
  await page.goto("/", { waitUntil: "domcontentloaded" });
  if (mobile) {
    // Hero first: no Ask overlay on a cold / at 375px, only the launcher.
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeInViewport({ timeout: 30_000 });
    await expect(page.getByRole("button", { name: "Open Council of AI chat", exact: true })).toBeVisible();
    await expect(page.getByTestId("ask-pane")).toHaveCount(0);
  }
  let pane = await enterAsk(page, mobile);
  await pane.getByLabel("Your question", { exact: true }).press("Escape");
  await expect(pane).toBeHidden();
  // A rerender/close must not reopen or send the previous question. Navigation opens once.
  await page.evaluate(() => window.dispatchEvent(new Event("resize")));
  await expect(pane).toBeHidden();
  await navigateInApp(page, "/dashboard?tab=home");
  pane = await enterAsk(page, mobile);
  await pane.getByRole("button", { name: "Close Ask", exact: true }).click();
  await expect(pane).toBeHidden();
  await navigateInApp(page, "/dashboard?tab=board");
  await expect(pane).toBeHidden();
  await navigateInApp(page, "/tools");
  pane = await enterAsk(page, mobile);
  await expect(page.getByTestId("tools-mcp")).toBeVisible();
  await expect(pane.getByTestId("talk-transcript")).toHaveCount(0);
  const discovery = posts.filter(request => isMcpDiscovery(request, localOrigin));
  const unexpected = posts.filter(request => !isMcpDiscovery(request, localOrigin));
  const postPath = info.outputPath("published-source-route-opening-posts.json");
  await writeFile(postPath, JSON.stringify({
    schema: "csoai.ask-route-opening-posts/1", observed_at_utc: new Date().toISOString(),
    discovery: discovery.map(request => ({ url: request.url(), method: request.postDataJSON().method })),
    unexpected: unexpected.map(request => ({ url: request.url(), method: request.method() })),
    allowed_discovery_methods: ["initialize", "tools/list", "notifications/initialized"],
    ask_tool_call_or_payment_allowed: false,
  }, null, 2));
  await info.attach("published-source-route-opening-posts", { path: postPath, contentType: "application/json" });
  expect(unexpected, "Only exact read-only MCP discovery may POST while routes open; no Ask, tools/call, payment or voice dispatch").toEqual([]);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test("prerender never opens or focuses the Ask conversation", async ({ page }) => {
  await page.addInitScript(() => { (window as Window & { __CSOAI_PRERENDER__?: boolean }).__CSOAI_PRERENDER__ = true; });
  const posts: string[] = [];
  page.on("request", request => { if (request.method() === "POST") posts.push(request.url()); });
  await page.goto("/dashboard?tab=home", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("gspc-workspace-home")).toBeVisible({ timeout: 60_000 });
  // Wait for existing hydration effects, not a fixed delay or an SSR-only DOM snapshot.
  await expect(page.getByLabel("Ask the Council, or name a pane to open")).toBeDisabled();
  await navigateInApp(page, "/tools");
  await expect(page.getByTestId("tools-mcp")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("ask-pane")).toHaveCount(0);
  expect(posts).toEqual([]);
});

test("existing Ask renders one genuine free public AGUI answer and retains its complete response", async ({ page, baseURL }, info) => {
  test.setTimeout(90_000);
  const requests: Request[] = [], completed: Request[] = [], failures: string[] = [];
  const sha = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");
  let raw: Buffer | null = null;
  let requestRecord: Record<string, unknown> | null = null;
  let responseRecord: Record<string, unknown> | null = null;
  let accepted = false;
  let browserCapture: NativeAskCapture | null = null;
  const retainBrowserCapture = async () => {
    const capture = await page.evaluate(() => (window as AskCaptureWindow).__CSOAI_ASK_NATIVE_CAPTURE__ ?? null).catch(() => null);
    if (!capture) return;
    browserCapture = capture;
    raw = Buffer.from(capture.raw_base64, "base64");
    if (responseRecord) Object.assign(responseRecord, {
      complete: capture.state === "complete" && capture.complete_eof,
      bytes: raw.length, sha256: sha(raw), raw_base64: raw.toString("base64"),
      browser_capture: { ...capture, raw_base64: undefined },
    });
  };
  // The production component keeps its existing same-origin transport. This test-only adapter
  // maps that one free question to a DIRECT browser CORS POST, never a runner/server proxy.
  await page.addInitScript(({ endpoint, question }) => {
    const originalFetch = window.fetch.bind(window);
    let publicCalls = 0;
    window.fetch = async (input, init) => {
      if (input !== "/api/agui/run") return originalFetch(input, init);
      const body = typeof init?.body === "string" ? JSON.parse(init.body) : null;
      const users = Array.isArray(body?.messages) ? body.messages.filter((message: { role?: string }) => message.role === "user") : [];
      if (init?.method !== "POST" || users.length !== 1 || users[0].content !== question ||
          body?.forwardedProps?.confirm || body?.forwardedProps?.consent || ++publicCalls !== 1) {
        throw new Error("Only the single unconfirmed free board question is allowed by this acceptance adapter.");
      }
      const capture: NativeAskCapture = {
        state: "pending", started_at_utc: new Date().toISOString(), finished_at_utc: null,
        url: null, status: null, response_type: null, complete_eof: false,
        bytes: 0, sha256: null, raw_base64: "", error: null,
        byte_limit: 512 * 1024, deadline_ms: 15_000,
      };
      (window as AskCaptureWindow).__CSOAI_ASK_NATIVE_CAPTURE__ = capture;
      const controller = new AbortController();
      const upstreamSignal = init?.signal;
      const relayAbort = () => controller.abort();
      if (upstreamSignal?.aborted) controller.abort();
      else upstreamSignal?.addEventListener("abort", relayAbort, { once: true });
      let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
      const fail = (error: unknown) => {
        if (capture.state === "complete" || capture.state === "failed") return;
        capture.state = "failed"; capture.complete_eof = false;
        capture.error = error instanceof Error ? error.message : String(error);
        capture.finished_at_utc = new Date().toISOString();
        controller.abort();
        void reader?.cancel().catch(() => undefined);
      };
      let timer = 0;
      const deadline = new Promise<never>((_, reject) => {
        timer = window.setTimeout(() => {
          controller.abort();
          reject(new Error("Native browser SSE capture did not reach complete EOF within 15000ms."));
        }, capture.deadline_ms);
      });
      const cleanup = () => {
        window.clearTimeout(timer);
        upstreamSignal?.removeEventListener("abort", relayAbort);
      };
      try {
        const response = await Promise.race([originalFetch(endpoint, {
          ...init, signal: controller.signal, credentials: "omit", redirect: "error", referrerPolicy: "no-referrer",
        }), deadline]);
        Object.assign(capture, { state: "reading", url: response.url, status: response.status, response_type: response.type });
        const clone = response.clone();
        const readCapture = async () => {
          if (!clone.body) throw new Error("Native browser response has no readable SSE body.");
          const streamReader = clone.body.getReader();
          reader = streamReader;
          const chunks: Uint8Array[] = [];
          const joined = () => {
            const bytes = new Uint8Array(capture.bytes); let offset = 0;
            for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
            return bytes;
          };
          const encode = (bytes: Uint8Array) => {
            let text = "";
            for (let offset = 0; offset < bytes.length; offset += 32_768) text += String.fromCharCode(...bytes.subarray(offset, offset + 32_768));
            return btoa(text);
          };
          try {
            for (;;) {
              const next = await streamReader.read();
              if (controller.signal.aborted) throw new Error("Native browser SSE capture was aborted before complete EOF.");
              if (next.done) break;
              if (capture.bytes + next.value.length > capture.byte_limit) throw new Error("Native browser SSE body exceeds 512KiB; retained bytes are incomplete.");
              chunks.push(next.value); capture.bytes += next.value.length;
              capture.raw_base64 = encode(joined()); // Retain bounded partial bytes even if the stream later fails.
            }
            const bytes = joined();
            const digest = await crypto.subtle.digest("SHA-256", bytes);
            if (controller.signal.aborted || capture.state === "failed") throw new Error("Native browser capture expired before its receipt completed.");
            capture.sha256 = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
            capture.complete_eof = true; capture.state = "complete";
            capture.finished_at_utc = new Date().toISOString();
          } finally { try { streamReader.releaseLock(); } catch { /* A timed-out read remains explicitly incomplete. */ } }
        };
        // The product receives its original Response. A native cloned stream, not CDP's
        // EventSource completion notification, establishes complete body acceptance.
        void Promise.race([readCapture(), deadline]).catch(fail).finally(cleanup);
        return response;
      } catch (error) { fail(error); cleanup(); throw error; }
    };
  }, { endpoint: PUBLIC_ASK, question: BOARD_QUESTION });
  // Bound external traffic: the public question is the sole permitted production request.
  const localOrigin = new URL(baseURL || "http://127.0.0.1:4180").origin;
  let allowedPublicPosts = 0;
  await page.route(/^https:\/\//, async route => {
    const request = route.request();
    if (request.url() === PUBLIC_ASK) {
      if (request.method() === "OPTIONS") return route.continue();
      if (request.method() === "POST") {
        try {
          const body = request.postDataJSON();
          const users = Array.isArray(body?.messages) ? body.messages.filter((message: { role?: string }) => message.role === "user") : [];
          if (users.length === 1 && users[0].content === BOARD_QUESTION &&
              !body?.forwardedProps?.confirm && !body?.forwardedProps?.consent && ++allowedPublicPosts === 1) return route.continue();
        } catch { /* Invalid requests are never forwarded to the public endpoint. */ }
      }
      return route.abort("blockedbyclient");
    }
    if (new URL(request.url()).origin === localOrigin) return route.continue();
    return route.abort("blockedbyclient");
  });
  page.on("request", request => {
    if (request.url() === PUBLIC_ASK && request.method() === "POST") requests.push(request);
  });
  page.on("requestfinished", request => {
    if (request.url() === PUBLIC_ASK && request.method() === "POST") completed.push(request);
  });
  page.on("requestfailed", request => {
    if (request.url() === PUBLIC_ASK) failures.push(request.failure()?.errorText ?? "failed");
  });
  try {
    await page.goto("/dashboard?tab=home", { waitUntil: "domcontentloaded" });
    expect(new URL(page.url()).origin, "This case must actually exercise cross-origin browser CORS").not.toBe(new URL(PUBLIC_ASK).origin);
    const pane = await enterAsk(page, info.project.name === "mobile");
    expect(requests).toHaveLength(0);
    const responsePending = page.waitForResponse(response => response.url() === PUBLIC_ASK && response.request().method() === "POST");
    await pane.getByLabel("Your question", { exact: true }).fill(BOARD_QUESTION);
    await pane.getByLabel("Your question", { exact: true }).press("Enter");
    const response = await responsePending;
    const headers = await response.allHeaders();
    const request = response.request(), sent = await request.allHeaders();
    const body = request.postDataJSON();
    // Retain actual transport observations before schema/UI assertions, including on failure.
    requestRecord = { url: request.url(), method: request.method(), body, origin: sent.origin ?? null, credentials_present: Boolean(sent.authorization || sent.cookie), transport: "DIRECT_BROWSER_CORS_POST_TEST_ONLY_ENDPOINT_MAPPING" };
    responseRecord = { status: response.status(), url: response.url(), headers: Object.fromEntries(["content-type", "access-control-allow-origin", "date", "cache-control", "x-csoai-agui"].filter(key => headers[key] !== undefined).map(key => [key, headers[key]])), complete: false };
    await page.waitForFunction(() => {
      const state = (window as AskCaptureWindow).__CSOAI_ASK_NATIVE_CAPTURE__?.state;
      return state === "complete" || state === "failed";
    }, null, { timeout: 20_000 });
    await retainBrowserCapture();
    const capture = browserCapture as NativeAskCapture | null;
    expect(capture, "The browser retained its own native Response clone").not.toBeNull();
    if (!capture) throw new Error("No native browser response capture was retained.");
    expect(capture.state, capture.error || "Native browser capture must reach complete EOF").toBe("complete");
    expect(capture?.complete_eof).toBe(true); expect(capture?.error).toBeNull();
    expect(capture?.url).toBe(PUBLIC_ASK); expect(capture?.status).toBe(200); expect(capture?.response_type).toBe("cors");
    expect(raw).not.toBeNull();
    const completeRaw = Buffer.from(capture.raw_base64, "base64");
    expect(completeRaw.length).toBeGreaterThan(0); expect(completeRaw.length).toBeLessThanOrEqual(512 * 1024);
    expect(capture?.bytes).toBe(completeRaw.length); expect(capture?.sha256).toBe(sha(completeRaw));
    expect(response.status()).toBe(200);
    expect(headers["content-type"]).toMatch(/^text\/event-stream/);
    expect(headers["access-control-allow-origin"]).toBe("*");
    expect(sent.authorization).toBeUndefined(); expect(sent.cookie).toBeUndefined();
    expect(sent.origin).toBe(new URL(page.url()).origin);
    expect(body.messages.filter((message: { role?: string }) => message.role === "user")).toEqual([{ id: "m1", role: "user", content: BOARD_QUESTION }]);
    expect(body.forwardedProps?.confirm).toBeUndefined(); expect(body.forwardedProps?.consent).toBeUndefined();
    const events = completeRaw.toString("utf8").replace(/\r\n/g, "\n").split("\n\n")
      .flatMap(block => { const data = block.split("\n").filter(line => line.startsWith("data:")).map(line => line.slice(5).trimStart()).join("\n"); return data ? [JSON.parse(data)] : []; });
    const started = events.filter(event => event.type === "RUN_STARTED");
    const finished = events.filter(event => event.type === "RUN_FINISHED");
    expect(started).toHaveLength(1); expect(finished).toHaveLength(1);
    expect(finished[0].threadId).toBe(started[0].threadId); expect(finished[0].runId).toBe(started[0].runId);
    expect(events.filter(event => event.type === "RUN_ERROR")).toHaveLength(0);
    const results = events.filter(event => event.type === "TOOL_CALL_RESULT").map(event => JSON.parse(event.content));
    expect(results).toHaveLength(1); expect(results[0].tool).toBe("board_totals");
    expect(events.filter(event => event.type === "TOOL_CALL_START").map(event => event.toolCallName)).toEqual(["board_totals"]);
    expect(events.filter(event => event.type === "CUSTOM" && ["confirm_required", "consent_required"].includes(event.name))).toHaveLength(0);
    expect(finished[0].result.answered_by).toBe("tool:board_totals");
    expect(finished[0].result.grounded).toBe(true);
    expect(finished[0].result.awaiting_confirmation).not.toBe(true);
    expect(Array.isArray(results[0].output?.counts)).toBe(true);
    const measured = results[0].output.counts.find((count: { name?: string }) => count.name === "measured")?.value;
    const slots = results[0].output.counts.find((count: { name?: string }) => count.name === "axis_slots")?.value;
    expect(Number.isInteger(measured)).toBe(true); expect(Number.isInteger(slots)).toBe(true);
    expect(measured).toBeGreaterThanOrEqual(0); expect(slots).toBeGreaterThan(0); expect(measured).toBeLessThanOrEqual(slots);
    expect(typeof results[0].summary).toBe("string"); expect(results[0].summary.length).toBeGreaterThan(0);
    const card = pane.getByTestId("talk-tool-card");
    await expect(card).toHaveCount(1); await expect(card).toBeVisible();
    await expect(card.getByTestId("talk-state")).toHaveText(results[0].label);
    await expect(card).toContainText(results[0].summary);
    await expect(pane.getByTestId("talk-answer")).toBeVisible();
    // Playwright requestfinished remains an observation; native EOF + byte/digest/schema/UI
    // joins above are the required completion proof for this actual browser SSE response.
    expect(requests).toHaveLength(1); expect(allowedPublicPosts).toBe(1); expect(response.request()).toBe(requests[0]); expect(failures).toEqual([]);
    // Closing and reopening the SAME mounted view retains the actual answer. Refresh/case
    // persistence is not supplied by this existing component and is not asserted here.
    await pane.getByLabel("Your question", { exact: true }).press("Escape");
    await expect(pane).toBeHidden();
    await page.evaluate(() => window.dispatchEvent(new CustomEvent("council:ask-open")));
    await expect(pane).toBeVisible(); await expect(card).toBeVisible(); expect(requests).toHaveLength(1);
    Object.assign(responseRecord, { server_thread_id: started[0].threadId, server_run_id: started[0].runId, tool: results[0].tool, label: results[0].label });
    await page.screenshot({ path: info.outputPath("published-source-agui-ready.png"), fullPage: true });
    accepted = true;
  } finally {
    await retainBrowserCapture();
    const retainedRaw = raw as Buffer | null;
    const retainedCapture = browserCapture as NativeAskCapture | null;
    const bodyPath = info.outputPath("published-source-agui-http-body.json");
    const lifecyclePath = info.outputPath("published-source-agui-request-lifecycle.json");
    await writeFile(bodyPath, JSON.stringify({ schema: "csoai.public-ask-browser-http-evidence/2", observed_at_utc: new Date().toISOString(), request: requestRecord, response: responseRecord, browser_capture: browserCapture, incomplete_body: retainedRaw && !responseRecord ? { bytes: retainedRaw.length, sha256: sha(retainedRaw), raw_base64: retainedRaw.toString("base64") } : null }, null, 2));
    await writeFile(lifecyclePath, JSON.stringify({ schema: "csoai.public-ask-browser-acceptance/2", observed_at_utc: new Date().toISOString(), accepted, question: BOARD_QUESTION, project: info.project.name, retry: info.retry, exact_url: PUBLIC_ASK, boundary: "Actual browser direct CORS POST to fixed public free route via test-only endpoint mapping; production AskHost keeps existing relative transport.", requests: requests.length, allowed_public_posts: allowedPublicPosts, playwright_requestfinished_observed: completed.length, native_complete_eof: retainedCapture?.complete_eof === true, completion_basis: "Native browser Response.clone() EOF within 15000ms and 512KiB, full byte/SHA/schema/UI join; Playwright requestfinished is observational.", failures, same_view_close_reopen: accepted, refresh_or_customer_case_durability: false, model_inference: false, fresh_measurement: false, signature_verification: false, source_commit_of_served_backend: null, unsigned: true }, null, 2));
    await info.attach("published-source-agui-http-body", { path: bodyPath, contentType: "application/json" });
    await info.attach("published-source-agui-request-lifecycle", { path: lifecyclePath, contentType: "application/json" });
  }
});
