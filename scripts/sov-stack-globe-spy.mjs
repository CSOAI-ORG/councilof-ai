// The live smoke test and its local replacement-frame fixtures share this probe.
export async function installGlobeDriveSpy(page) {
  // Run before navigation, including in every newly attached/navigated child.
  await page.addInitScript(() => {
    window.__sovStackDriveEvents = [];
    window.addEventListener("message", (event) => {
      if (event?.data?.cmd) window.__sovStackDriveEvents.push({
        command: event.data.cmd, fromParent: event.source === window.parent,
      });
    });
  });
}

export async function waitForGlobeDriveReady(page, { timeout = 10000 } = {}) {
  // WorldGlobe's mount effect sends layer0 from the parent. The iframe also
  // sends layer0 to itself, which cannot establish that React handlers exist.
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    try {
      const ready = await page.frameLocator('iframe[src*="globe3d"]').first().locator("body")
        .evaluate(() => (window.__sovStackDriveEvents || []).some(
          (event) => event.fromParent && event.command === "layer0",
        ), undefined, { timeout: Math.max(1, deadline - Date.now()) });
      if (ready) return;
    } catch (error) {
      if (!/Frame was detached|Execution context was destroyed/i.test(error.message)) throw error;
    }
    await page.waitForTimeout(Math.min(100, Math.max(1, deadline - Date.now())));
  }
  throw new Error("No parent-origin layer0 readiness message before deadline");
}

export async function readGlobeDriveCommands(page, { timeout = 10000 } = {}) {
  // Locator evaluation resolves the current iframe after a SPA replacement.
  // Missing frames reject; an empty command list must remain a failed delivery.
  return page.frameLocator('iframe[src*="globe3d"]').first().locator("body")
    .evaluate(() => (window.__sovStackDriveEvents || []).filter((event) => event.fromParent)
      .map((event) => event.command), undefined, { timeout });
}
