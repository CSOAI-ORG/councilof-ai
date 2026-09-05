/**
 * GSPCVerify.privacy.test.ts — "nothing you paste leaves this device" is structural, not a hope.
 *
 * The verify surfaces make the estate's most sensitive public claim, in their own words:
 *
 *   GSPCVerify:      "Verify · nothing sent · no account"
 *   LobbyVerifyPane: "Nothing you paste leaves this device, and no account is asked for —
 *                     here or ever."
 *
 * /gspc-verify is also the single most-linked destination in the product: 25 public pages send
 * a reader there. If that sentence ever stopped being true, it would be false at the busiest
 * door in the estate, and it would break quietly — nobody notices an extra fetch.
 *
 * Audited 2026-09-05 and the claim holds STRUCTURALLY, which is stronger than holding today:
 * there is no mechanism by which pasted content could be transmitted. Both files contain zero
 * POSTs, zero sendBeacon, zero WebSocket, and no user input interpolated into a URL. The only
 * network calls are GETs that PULL published artifacts — the board, the card index, a card the
 * reader asked for by URL. Pulling a published file is the opposite of exfiltrating a pasted one.
 *
 * WHAT THIS GUARDS AGAINST is not malice. It is the ordinary next feature: a "share this
 * verification" button, an analytics ping, an error reporter that attaches the payload. Each is
 * a reasonable thing to build and each would silently falsify the sentence on the page.
 *
 * If a transmit is ever genuinely needed, this test must be changed in the same commit as the
 * copy — so the promise and the code can never drift apart.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const FILES = {
  "GSPCVerify.tsx": resolve(__dirname, "./GSPCVerify.tsx"),
  "LobbyVerifyPane.tsx": resolve(__dirname, "../components/lobby/LobbyVerifyPane.tsx"),
};

/** Comments quote the claim and discuss transmission; prose about code is not code. */
function code(path: string): string {
  return readFileSync(path, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

describe("the verify surfaces cannot transmit what you paste", () => {
  it("reads both files (guards against the paths silently going stale)", () => {
    for (const [name, p] of Object.entries(FILES)) {
      expect(code(p).length, `${name} is empty or missing`).toBeGreaterThan(500);
    }
  });

  it("neither surface makes a POST", () => {
    for (const [name, p] of Object.entries(FILES)) {
      expect(
        /method:\s*["']POST["']/i.test(code(p)),
        `${name} now POSTs. The page tells the reader "nothing you paste leaves this device". ` +
          `If a transmit is genuinely needed, change that copy in this same commit.`,
      ).toBe(false);
    }
  });

  it("neither surface uses a beacon or a socket", () => {
    for (const [name, p] of Object.entries(FILES)) {
      const src = code(p);
      expect(/sendBeacon/.test(src), `${name} uses navigator.sendBeacon`).toBe(false);
      expect(/new WebSocket/.test(src), `${name} opens a WebSocket`).toBe(false);
      expect(/XMLHttpRequest/.test(src), `${name} uses XMLHttpRequest`).toBe(false);
    }
  });

  it("no user input is interpolated into a request URL", () => {
    // A GET can exfiltrate just as well as a POST if the payload rides in the query string.
    for (const [name, p] of Object.entries(FILES)) {
      const src = code(p);
      expect(
        /fetch\(\s*[`"'][^`"']*\?[^`"']*\$\{/.test(src),
        `${name} builds a request URL with an interpolated value after a "?". A pasted card ` +
          `must never ride in a query string.`,
      ).toBe(false);
      expect(
        /encodeURIComponent/.test(src),
        `${name} now encodes something into a URL. Confirm it is not reader input before ` +
          `deleting this assertion.`,
      ).toBe(false);
    }
  });

  it("the page still makes the promise it is being held to", () => {
    // If the copy is removed, this guard is protecting a claim nobody makes any more — which
    // is its own kind of drift, and the reader has lost the assurance either way.
    const verify = readFileSync(FILES["GSPCVerify.tsx"], "utf8");
    const pane = readFileSync(FILES["LobbyVerifyPane.tsx"], "utf8");
    expect(verify).toMatch(/nothing sent/i);
    expect(pane).toMatch(/leaves this device/i);
    expect(pane).toMatch(/no account/i);
  });
});
