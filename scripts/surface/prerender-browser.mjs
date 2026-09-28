// Explicit browser selection for constrained release hosts.
// Default remains Playwright's version-pinned Chromium.
export function prerenderBrowserOptions(env = process.env) {
  const channel = env.CSOAI_PRERENDER_CHANNEL;
  if (channel === undefined || channel === "") return {};
  const allowed = ["chrome", "chrome-beta", "msedge", "msedge-beta"];
  if (!allowed.includes(channel)) {
    throw new Error("CSOAI_PRERENDER_CHANNEL must name a supported installed browser channel");
  }
  return { channel };
}
