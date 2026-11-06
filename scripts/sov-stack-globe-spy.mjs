// The live smoke test and its local replacement-frame fixtures share this probe.
export async function installGlobeDriveSpy(page) {
  // Run before navigation, including in every newly attached/navigated child.
  await page.addInitScript(() => {
    window.__sovStackDriveCommands = [];
    window.addEventListener("message", (event) => {
      if (event?.data?.cmd) window.__sovStackDriveCommands.push(event.data.cmd);
    });
  });
}

export async function readGlobeDriveCommands(page, { timeout = 10000 } = {}) {
  // Locator evaluation resolves the current iframe after a SPA replacement.
  // Missing frames reject; an empty command list must remain a failed delivery.
  return page.frameLocator('iframe[src*="globe3d"]').first().locator("body")
    .evaluate(() => window.__sovStackDriveCommands || [], undefined, { timeout });
}
