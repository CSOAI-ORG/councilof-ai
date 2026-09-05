/**
 * ai-crawler-access.test.mjs — the AEO surface is only worth building if crawlers can read it.
 *
 * This estate publishes llms.txt, ai.txt, llms-full.txt and a prerendered site so AI systems can
 * read the board. All of that is cancelled at a stroke if the edge blocks the crawlers, and the
 * setting that does it is ON BY DEFAULT on Cloudflare. It is not visible in the repository, it
 * leaves robots.txt looking perfectly correct, and it can be toggled from a dashboard by someone
 * who never touches this code.
 *
 * That is a bad combination: a silent, off-repo switch that voids a whole category of work. This
 * converts "remember to check after any cutover" into something that actually checks.
 *
 * Measured 2026-09-05 against production, all five returning HTTP 200 with the full 195,256-byte
 * page and no interstitial:
 *
 *   GPTBot · ClaudeBot · PerplexityBot · Google-Extended · OAI-SearchBot
 *
 * And what they receive is the real thing, not a shell: 24,634 characters of visible text
 * carrying "22 axis", "measured", "UNMEASURED" and "not a certificate". The prerender is doing
 * its job for crawlers specifically.
 *
 * robots.txt was checked at the same time and is correct — every agent appears exactly once, so
 * the 2026-08-06 defect (two `User-agent: *` groups listing ClaudeBot, GPTBot and Google-Extended
 * twice with OPPOSITE instructions, leaving the outcome undefined under RFC 9309) has stayed
 * fixed. CCBot and Bytespider are deliberately disallowed; that is a choice, not a fault, and
 * this file does not second-guess it.
 *
 * Live-only: there is nothing in the repository that can prove this. LIVE_CRAWLER=1 to run it.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

const AGENTS = {
  GPTBot: "GPTBot/1.2 (+https://openai.com/gptbot)",
  ClaudeBot: "ClaudeBot/1.0 (+claudebot@anthropic.com)",
  PerplexityBot: "PerplexityBot/1.0",
  "Google-Extended": "Mozilla/5.0 (compatible; Google-Extended)",
  "OAI-SearchBot": "OAI-SearchBot/1.0",
};

const CHALLENGE = /just a moment|checking your browser|cf-challenge|attention required|enable javascript and cookies/i;

function visibleText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

describe("AI crawlers can actually read the site", () => {
  it("robots.txt names each agent exactly once", async () => {
    if (!process.env.LIVE_CRAWLER) {
      console.log("      (offline: LIVE_CRAWLER unset — robots.txt NOT fetched)");
      return;
    }
    const txt = await (await fetch("https://councilof.ai/robots.txt")).text();
    const agents = [...txt.matchAll(/^\s*User-agent:\s*(.+)$/gim)].map((m) =>
      m[1].trim().toLowerCase(),
    );
    const dupes = agents.filter((a, i) => agents.indexOf(a) !== i);
    assert.deepEqual(
      [...new Set(dupes)],
      [],
      `robots.txt lists ${[...new Set(dupes)].join(", ")} more than once. Under RFC 9309 two ` +
        `equally specific groups leave the outcome UNDEFINED — implementations differ, and ` +
        `nobody can predict whether those crawlers read the site. This exact defect was ` +
        `corrected on 2026-08-06; it must not come back.`,
    );
  });

  it("the AEO files are served", async () => {
    if (!process.env.LIVE_CRAWLER) {
      console.log("      (offline: LIVE_CRAWLER unset — AEO files NOT fetched)");
      return;
    }
    for (const f of ["llms.txt", "ai.txt", "llms-full.txt"]) {
      const res = await fetch(`https://councilof.ai/${f}`);
      assert.equal(res.ok, true, `/${f} returned HTTP ${res.status}`);
      const body = await res.text();
      assert.ok(body.length > 500, `/${f} is only ${body.length} bytes — that is a stub`);
    }
  });

  it("no AI crawler is blocked or challenged at the edge", async () => {
    if (!process.env.LIVE_CRAWLER) {
      console.log("      (offline: LIVE_CRAWLER unset — crawler access NOT probed)");
      return;
    }
    const blocked = [];
    for (const [name, ua] of Object.entries(AGENTS)) {
      const res = await fetch("https://councilof.ai/", { headers: { "user-agent": ua } });
      const body = await res.text();
      if (!res.ok) blocked.push(`${name}: HTTP ${res.status}`);
      else if (CHALLENGE.test(body)) blocked.push(`${name}: interstitial, not the page`);
      else if (body.length < 20000) blocked.push(`${name}: only ${body.length} bytes`);
    }
    assert.deepEqual(
      blocked,
      [],
      `these crawlers cannot read the site: ${blocked.join("; ")}. Cloudflare's AI-crawler ` +
        `block is ON BY DEFAULT and is set outside this repository, so robots.txt will still ` +
        `look correct. Every llms.txt, ai.txt and prerender in this estate is void while this ` +
        `is true. Check the Cloudflare dashboard, not the code.`,
    );
  });

  it("a crawler receives the real page, not a shell", async () => {
    if (!process.env.LIVE_CRAWLER) {
      console.log("      (offline: LIVE_CRAWLER unset — prerender NOT verified)");
      return;
    }
    const res = await fetch("https://councilof.ai/", {
      headers: { "user-agent": AGENTS.GPTBot },
    });
    const text = visibleText(await res.text());
    assert.ok(
      text.length > 8000,
      `GPTBot sees only ${text.length} characters of visible text. A crawler that receives an ` +
        `empty SPA shell indexes nothing, which is the same outcome as being blocked.`,
    );
    for (const probe of ["22 axis", "measured", "not a certificate"]) {
      assert.ok(
        text.toLowerCase().includes(probe.toLowerCase()),
        `the crawler's copy of the homepage does not contain ${JSON.stringify(probe)} — the ` +
          `prerender is not delivering the board to crawlers`,
      );
    }
  });
});
