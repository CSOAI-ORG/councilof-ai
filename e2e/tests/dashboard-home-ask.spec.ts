import { test, expect, type Page } from "@playwright/test";

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

    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await page.locator('[data-testid="dashboard-shell"]').waitFor({ state: "visible", timeout: 60_000 });
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
  });
}
