import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createServer } from "node:http";
import { chromium } from "playwright";
import { installGlobeDriveSpy, readGlobeDriveCommands, waitForGlobeDriveReady } from "./sov-stack-globe-spy.mjs";

let browser;
let server;
let origin;
before(async () => {
  server = createServer((request, response) => {
    response.setHeader("content-type", "text/html; charset=utf-8");
    if (request.url.startsWith("/globe3d")) {
      response.end("<!doctype html><body>Globe fixture<script>window.postMessage({cmd:'layer0'},'*')</script></body>");
      return;
    }
    response.end(`<!doctype html><body>
      <iframe src="/globe3d.html" onload="if(!location.search.includes('self-only')) this.contentWindow.postMessage({cmd:'layer0'},'*')"></iframe><button>Rogue swarm</button>
      <script>
        document.querySelector('button').onclick = () => {
          document.querySelector('iframe').remove();
          if (location.search.includes('remove')) return;
          const frame = document.createElement('iframe');
          frame.src = '/globe3d.html?replacement=1';
          frame.onload = () => {
            frame.contentWindow.postMessage({cmd:'layer0'}, '*');
            frame.contentWindow.postMessage({cmd: location.search.includes('omit') ? 'unrelated' : 'flyTo'}, '*');
          };
          document.body.append(frame);
        };
      </script>`);
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch();
});
after(async () => {
  await browser?.close();
  if (server) await new Promise((resolve) => server.close(resolve));
});

for (const [query, delivered] of [["", true], ["?omit", false]]) {
  test(`replacement iframe ${delivered ? "receives" : "does not receive"} a drive command`, { timeout: 15000 }, async () => {
    const page = await browser.newPage();
    try {
      await installGlobeDriveSpy(page);
      await page.goto(origin + query);
      await waitForGlobeDriveReady(page);
      const oldFrame = await page.locator("iframe").elementHandle().then((handle) => handle.contentFrame());
      await page.getByRole("button", { name: "Rogue swarm" }).click();
      // The unrelated message marks delivery completion in the negative case.
      await page.frameLocator("iframe").locator("body").evaluate(async () => {
        const delivered = (event) => event.fromParent && event.command !== "layer0";
        if (window.__sovStackDriveEvents.some(delivered)) return;
        await new Promise((resolve) => {
          const listener = (event) => {
            if (event.source === window.parent && ["flyTo", "unrelated"].includes(event.data?.cmd)) {
              window.removeEventListener("message", listener); resolve();
            }
          };
          window.addEventListener("message", listener);
        });
      });
      await assert.rejects(oldFrame.evaluate(() => true), /detached/i);
      const commands = await readGlobeDriveCommands(page);
      assert.equal(commands.includes("flyTo") || commands.includes("neutralize"), delivered);
      assert.deepEqual(commands, delivered ? ["layer0", "flyTo"] : ["layer0", "unrelated"]);
    } finally { await page.close(); }
  });
}

test("iframe self-messages cannot establish parent readiness or delivery", { timeout: 15000 }, async () => {
  const page = await browser.newPage();
  try {
    await installGlobeDriveSpy(page);
    await page.goto(origin + "?self-only");
    await assert.rejects(waitForGlobeDriveReady(page, { timeout: 300 }), /No parent-origin/);
    assert.deepEqual(await readGlobeDriveCommands(page), []);
  } finally { await page.close(); }
});

test("a removed iframe rejects instead of earning a pass or skip", { timeout: 15000 }, async () => {
  const page = await browser.newPage();
  try {
    await installGlobeDriveSpy(page);
    await page.goto(origin + "?remove");
    await page.getByRole("button", { name: "Rogue swarm" }).click();
    await assert.rejects(readGlobeDriveCommands(page, { timeout: 300 }), /Timeout/i);
  } finally { await page.close(); }
});
