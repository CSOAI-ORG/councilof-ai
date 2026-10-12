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
      await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
      await page.locator('[data-testid="dashboard-shell"]').waitFor({ state: "visible", timeout: 60_000 });
      // The original inline first-question regression remains covered after intentionally
      // closing the new default view of the existing Ask conversation.
      const entryAsk = page.getByTestId("ask-pane");
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

async function readyAsk(page: Page) {
  const pane = page.getByTestId("ask-pane");
  await expect(pane).toBeVisible({ timeout: 30_000 });
  await expect(pane.getByLabel("Your question", { exact: true })).toBeFocused({ timeout: 10_000 });
  await expect(pane.getByTestId("ask-introduction")).toContainText("Hi, I’m MEOK. How can I help?");
  await expect(pane.getByTestId("ask-introduction")).toContainText("saved customer cases are not connected here");
  await expect(pane.getByTestId("ask-rule-based")).toContainText("never from an AI model");
  await expect(pane.getByRole("switch", { name: "Let it move the page for me" })).toHaveAttribute("aria-checked", "false");
  await expect(pane.getByRole("switch", { name: /^Voice\b/ })).toHaveAttribute("aria-checked", "false");
  return pane;
}

test("root, Council OS home and plugin tools open the existing Ask only after hydration", async ({ page }) => {
  test.setTimeout(120_000);
  const posts: string[] = [];
  page.on("request", request => { if (request.method() === "POST") posts.push(request.url()); });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  let pane = await readyAsk(page);
  await pane.getByLabel("Your question", { exact: true }).press("Escape");
  await expect(pane).toBeHidden();
  // A rerender/close must not reopen or send the previous question. Navigation opens once.
  await page.evaluate(() => window.dispatchEvent(new Event("resize")));
  await expect(pane).toBeHidden();
  await navigateInApp(page, "/dashboard?tab=home");
  pane = await readyAsk(page);
  await pane.getByRole("button", { name: "Close Ask", exact: true }).click();
  await expect(pane).toBeHidden();
  await navigateInApp(page, "/dashboard?tab=board");
  await expect(pane).toBeHidden();
  await navigateInApp(page, "/tools");
  pane = await readyAsk(page);
  await expect(page.getByTestId("tools-mcp")).toBeVisible();
  await expect(pane.getByTestId("talk-transcript")).toHaveCount(0);
  expect(posts, "Opening routes does not submit, pay, start voice or execute a tool").toEqual([]);
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
  // The production component keeps its existing same-origin transport. This test-only adapter
  // maps that one free question to a DIRECT browser CORS POST, never a runner/server proxy.
  await page.addInitScript(({ endpoint, question }) => {
    const originalFetch = window.fetch.bind(window);
    let publicCalls = 0;
    window.fetch = (input, init) => {
      if (input !== "/api/agui/run") return originalFetch(input, init);
      const body = typeof init?.body === "string" ? JSON.parse(init.body) : null;
      const users = body?.messages?.filter((message: { role?: string }) => message.role === "user");
      if (init?.method !== "POST" || users?.length !== 1 || users[0].content !== question ||
          body?.forwardedProps?.confirm || body?.forwardedProps?.consent || ++publicCalls !== 1) {
        return Promise.reject(new Error("Only the single unconfirmed free board question is allowed by this acceptance adapter."));
      }
      return originalFetch(endpoint, { ...init, credentials: "omit", redirect: "error", referrerPolicy: "no-referrer" });
    };
  }, { endpoint: PUBLIC_ASK, question: BOARD_QUESTION });
  // Bound external traffic: the public question is the sole permitted production request.
  const localOrigin = new URL(baseURL || "http://127.0.0.1:4180").origin;
  await page.route(/^https:\/\//, async route => {
    const request = route.request();
    if (request.url() === PUBLIC_ASK && (request.method() === "POST" || request.method() === "OPTIONS")) return route.continue();
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
    const pane = await readyAsk(page);
    expect(requests).toHaveLength(0);
    const responsePending = page.waitForResponse(response => response.url() === PUBLIC_ASK && response.request().method() === "POST");
    await pane.getByLabel("Your question", { exact: true }).fill(BOARD_QUESTION);
    await pane.getByLabel("Your question", { exact: true }).press("Enter");
    const response = await responsePending;
    expect(await response.finished()).toBeNull();
    raw = await response.body();
    const headers = await response.allHeaders();
    const request = response.request(), sent = await request.allHeaders();
    const body = request.postDataJSON();
    // Retain actual transport observations before schema/UI assertions, including on failure.
    requestRecord = { url: request.url(), method: request.method(), body, origin: sent.origin ?? null, credentials_present: Boolean(sent.authorization || sent.cookie), transport: "DIRECT_BROWSER_CORS_POST_TEST_ONLY_ENDPOINT_MAPPING" };
    responseRecord = { status: response.status(), url: response.url(), headers: Object.fromEntries(["content-type", "access-control-allow-origin", "date", "cache-control", "x-csoai-agui"].filter(key => headers[key] !== undefined).map(key => [key, headers[key]])), complete: true, bytes: raw.length, sha256: sha(raw), raw_base64: raw.toString("base64") };
    expect(raw.length).toBeGreaterThan(0); expect(raw.length).toBeLessThanOrEqual(512 * 1024);
    expect(response.status()).toBe(200);
    expect(headers["content-type"]).toMatch(/^text\/event-stream/);
    expect(headers["access-control-allow-origin"]).toBe("*");
    expect(sent.authorization).toBeUndefined(); expect(sent.cookie).toBeUndefined();
    expect(sent.origin).toBe(new URL(page.url()).origin);
    expect(body.messages.filter((message: { role?: string }) => message.role === "user")).toEqual([{ id: "m1", role: "user", content: BOARD_QUESTION }]);
    expect(body.forwardedProps?.confirm).toBeUndefined(); expect(body.forwardedProps?.consent).toBeUndefined();
    const events = raw.toString("utf8").replace(/\r\n/g, "\n").split("\n\n")
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
    await expect.poll(() => completed.length).toBe(1);
    expect(requests).toHaveLength(1); expect(completed[0]).toBe(requests[0]); expect(failures).toEqual([]);
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
    const bodyPath = info.outputPath("published-source-agui-http-body.json");
    const lifecyclePath = info.outputPath("published-source-agui-request-lifecycle.json");
    await writeFile(bodyPath, JSON.stringify({ schema: "csoai.public-ask-browser-http-evidence/1", observed_at_utc: new Date().toISOString(), request: requestRecord, response: responseRecord, incomplete_body: raw && !responseRecord ? { bytes: raw.length, sha256: sha(raw), raw_base64: raw.toString("base64") } : null }, null, 2));
    await writeFile(lifecyclePath, JSON.stringify({ schema: "csoai.public-ask-browser-acceptance/1", observed_at_utc: new Date().toISOString(), accepted, question: BOARD_QUESTION, project: info.project.name, retry: info.retry, exact_url: PUBLIC_ASK, boundary: "Actual browser direct CORS POST to fixed public free route via test-only endpoint mapping; production AskHost keeps existing relative transport.", requests: requests.length, completed: completed.length, failures, same_view_close_reopen: accepted, refresh_or_customer_case_durability: false, model_inference: false, fresh_measurement: false, signature_verification: false, source_commit_of_served_backend: null, unsigned: true }, null, 2));
    await info.attach("published-source-agui-http-body", { path: bodyPath, contentType: "application/json" });
    await info.attach("published-source-agui-request-lifecycle", { path: lifecyclePath, contentType: "application/json" });
  }
});
