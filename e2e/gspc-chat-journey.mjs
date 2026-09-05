import { chromium, expect } from "@playwright/test";

const origin = process.env.PREVIEW_ORIGIN || "http://127.0.0.1:51026";
if (!["127.0.0.1", "localhost"].includes(new URL(origin).hostname)) {
  throw new Error("This journey is intended for a local preview only.");
}
const browser = await chromium.launch({ headless: true });
try {
  for (const viewport of [
    { width: 1440, height: 960 },
    { width: 390, height: 844 },
  ]) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    const errors = [];
    const streamRequests = [];
    const chatPosts = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("request", (request) => {
      if (new URL(request.url()).pathname === "/api/agui/gspc-state")
        streamRequests.push(request.url());
      if (
        new URL(request.url()).pathname === "/api/chat" &&
        request.method() === "POST"
      )
        chatPosts.push(request.url());
    });
    await page.goto(`${origin}/dashboard?tab=home`);
    const canvas = page.getByRole("region", {
      name: "Council workspace canvas",
    });
    const composer = page.getByRole("textbox", {
      name: "Ask the Council, or name a pane to open",
    });
    await page.getByRole("link", { name: "Read GSPC in chat" }).click();
    await expect(composer).toHaveValue("Show me the live GSPC board");
    expect(streamRequests).toHaveLength(0);
    await page.getByRole("button", { name: "Ask", exact: true }).click();
    const observations = canvas.getByRole("region", {
      name: "GSPC board observation",
    });
    await expect(observations).toHaveCount(1, { timeout: 20_000 });
    await expect(composer).toHaveValue("");
    expect(new URL(page.url()).searchParams.has("ask")).toBe(false);
    await expect(observations.first()).toContainText("Reported measured");
    await expect(page).toHaveURL(/tab=home/);
    expect(streamRequests).toHaveLength(1);
    const firstTime = await observations
      .first()
      .locator("time")
      .getAttribute("datetime");
    await canvas.getByRole("button", { name: "Read board again" }).click();
    await expect(observations).toHaveCount(2, { timeout: 20_000 });
    expect(streamRequests).toHaveLength(2);
    await page.reload();
    await expect(observations).toHaveCount(2);
    await expect(composer).toHaveValue("");
    expect(
      await observations.first().locator("time").getAttribute("datetime"),
    ).toBe(firstTime);
    expect(streamRequests).toHaveLength(2);

    // A failed refresh adds a retryable failure; historical observations remain dated.
    await page.route("**/api/agui/gspc-state", (route) =>
      route.fulfill({
        status: 503,
        contentType: "application/json",
        body: '{"error":"unavailable"}',
      }),
    );
    await canvas
      .getByRole("button", { name: "Read board again" })
      .last()
      .click();
    await expect(
      canvas.getByRole("button", { name: "Retry board read" }),
    ).toBeVisible();
    await expect(observations).toHaveCount(2);
    await expect(canvas.getByRole("log")).toContainText("HTTP 503");
    expect(streamRequests).toHaveLength(3);
    await page.unroute("**/api/agui/gspc-state");
    await canvas.getByRole("button", { name: "Retry board read" }).click();
    await expect(observations).toHaveCount(3, { timeout: 20_000 });

    // A HTTP 200 containing an incomplete stream must not become a board observation.
    await page.route("**/api/agui/gspc-state", (route) =>
      route.fulfill({
        status: 200,
        contentType: "text/event-stream",
        body: 'event: STATE_DELTA\ndata: {"type":"STATE_DELTA"}\n\n',
      }),
    );
    await canvas
      .getByRole("button", { name: "Read board again" })
      .last()
      .click();
    await expect(canvas.getByRole("log")).toContainText(
      "incomplete or could not be validated",
    );
    await expect(canvas.getByRole("log")).toContainText("unchecked · response");
    await expect(canvas.getByRole("log")).not.toContainText("MCP reply");
    await expect(observations).toHaveCount(3);
    expect(chatPosts).toHaveLength(0);
    expect(errors).toEqual([]);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflow).toBe(false);
    await page.screenshot({
      path: `/tmp/council-gspc-chat-${viewport.width}.png`,
      fullPage: true,
    });
    console.log(
      `PASS ${viewport.width}px: prefill → stream → in-chat result → refresh → reload → 503 → retry → incomplete stream; no model POST or horizontal overflow`,
    );
    await context.close();
  }
  console.log("Verified both desktop and mobile journeys.");
} finally {
  await browser.close();
}
