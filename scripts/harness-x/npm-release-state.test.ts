/**
 * npm-release-state — the ONE derivation of the npm package's release state, and the contract
 * that every surface stating it renders that same state.
 *
 * WHY THIS EXISTS (3 Nov 2026). The npm package's deprecation state was hand-typed into five
 * public surfaces and was FALSE in all five: llms.txt (twice), the two .well-known discovery
 * documents, the live MCP door's own install block, and the site's npm flag. The typed claim came
 * from a 6 Oct 2026 observation — npm deprecates 0.1.0, 0.1.1, 0.2.0, 0.2.1 and 0.2.2 — and the
 * estate's own later releases (0.2.3, 0.2.4, 0.2.5) are NOT deprecated. So the sentence went false
 * the moment the estate published a release, and nothing in the build noticed, because a sentence
 * in a template, a generator constant and a hand-written TS note are not facts that anything
 * retires.
 *
 * The fix is one derivation (scripts/harness-x/npm-release-state.mjs) over one dated capture
 * (distribution/npm/npm-publish-check.json), and THIS test is what holds the surfaces to it: five
 * surfaces, one source, and a guard that fails if any of them states the deprecation claim in the
 * form that is false.
 *
 * WHAT IT PROVES:
 *   1. the live door's install line IS the derived line;
 *   2. the site's npm flag IS the derived note;
 *   3. both discovery documents carry the derived note;
 *   4. llms.txt carries the derived sentences;
 *   5. NO public surface states "the published release is deprecated" (the false form) — the
 *      derived form is "is not marked deprecated on npm";
 *   6. the derivation fails CLOSED on a capture with no deprecation flag: a missing measurement is
 *      not a negative measurement, and a surface that cannot derive the state must not invent it.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CAPTURE_PATH,
  cardNote,
  clientNote,
  doorInstallLine,
  llmsStdioSentence,
  llmsStdioShort,
  npmReleaseState,
} from "./npm-release-state.mjs";

const REPO = resolve(__dirname, "../..");
const readJson = (rel: string) => JSON.parse(readFileSync(resolve(REPO, rel), "utf8"));
const readText = (rel: string) => readFileSync(resolve(REPO, rel), "utf8");

const capture = readJson(CAPTURE_PATH);
const state = npmReleaseState(capture);
const doorTools = readJson("functions/mcp/gspc-tools.json").tools.length + readJson("functions/mcp/paid-tools.json").tools.length;
const preparedVersion = readJson("mcp/gspc-server/package.json").version;
const npmId = readJson("mcp/gspc-server/server.json").packages[0].identifier;
const freeDoor = "https://councilof.ai/mcp/free";

describe("npm release state — one capture, one sentence, five surfaces", () => {
  it("reads the published release's facts from the dated capture, and no fact it does not carry", () => {
    expect(state.version).toBe(capture.published.version);
    expect(state.deprecated).toBe(capture.published.deprecated);
    expect(state.publishedTools).toBe(capture.published.total_tools);
    expect(state.measuredDay).toBe(String(capture.checked_at).slice(0, 10));
    // The estate's current release is NOT deprecated. If this ever changes, the capture moves and
    // every surface moves with it — this test does not hardcode it on purpose.
    expect(state.deprecated).toBe(false);
  });

  it("fails closed when the capture carries no deprecation flag", () => {
    const noFlag = JSON.parse(JSON.stringify(capture));
    delete (noFlag.published as { deprecated?: boolean }).deprecated;
    expect(() => npmReleaseState(noFlag)).toThrow(/no published.deprecated flag/);
  });

  it("the live door's install line IS the derived line", async () => {
    const mod = await import("../../functions/mcp/[[path]]");
    const install = mod.fullDoorInstall("https://councilof.ai");
    expect(install.stdio_lite).toBe(
      doorInstallLine(state, {
        npmId,
        stdioLiteLine: mod.STDIO_LITE_LINE,
        freeDoor,
        doorTools,
        preparedVersion,
      }),
    );
    // The false form of the claim, spelled out.
    expect(install.stdio_lite).not.toMatch(/^deprecated on npm/);
    expect(install.stdio_lite).not.toMatch(/are deprecated on npm/);
  });

  it("the site's npm flag IS the derived note", async () => {
    const mod = await import("../../client/src/lib/nSitesFlags");
    const flag = mod.NSITES_FLAGS.find((f: { id: string }) => f.id === "npm-sdk");
    expect(flag).toBeTruthy();
    expect(flag.note).toBe(clientNote(state, { doorTools, freeDoor }));
    expect(flag.note).not.toMatch(/Every published npm release is marked deprecated/);
  });

  it("both discovery documents reflect the measured publication state", () => {
    const discovery = readJson("public/.well-known/mcp.json").servers[0];
    const card = readJson("public/.well-known/mcp/server-card.json").endpoints.mcp;
    const ready = capture.published.version === preparedVersion &&
      !capture.published.deprecated && capture.published.total_tools === doorTools &&
      capture.diff.live_only.length === 0 && capture.diff.published_only.length === 0;
    expect(discovery.stdio).toBe(ready ? `npx -y ${npmId}@${preparedVersion}` : null);
    if (ready) {
      expect(discovery.stdio_note).toBeUndefined();
      expect(card.stdio_note).toBeUndefined();
    } else {
      const expected = cardNote(state, { npmId, freeDoor, doorTools, preparedVersion });
      expect(discovery.stdio_note).toBe(expected);
      expect(card.stdio_note).toBe(expected);
      if (capture.published.version !== preparedVersion) {
        expect(expected).toContain(`the prepared release ${preparedVersion} is not on npm yet`);
      }
    }
  });

  it("llms.txt carries the derived sentences", () => {
    const llms = readText("public/llms.txt");
    expect(llms).toContain(
      llmsStdioSentence(state, { doorTools, freeDoor, preparedVersion }),
    );
    expect(llms).toContain(llmsStdioShort(state, { doorTools, freeDoor }));
    expect(llms).not.toContain("published releases are marked deprecated on npm");
    expect(llms).not.toContain("The published npm release is marked deprecated on npm");
  });

  it("a published matching pin reports dated tool-name parity without implying behavior parity", () => {
    // A matching name set supplies no tools/call or transport-behavior evidence.
    // Use a separate fixture so this branch stays covered when the prepared version moves.
    const matchingCapture = structuredClone(capture);
    matchingCapture.published.total_tools = matchingCapture.live_door.total_tools;
    matchingCapture.diff.live_only = [];
    matchingCapture.diff.published_only = [];
    const matchingState = npmReleaseState(matchingCapture);
    const sentence = llmsStdioSentence(matchingState, {
      doorTools: matchingState.capturedDoorTools,
      freeDoor,
      preparedVersion: matchingState.version,
    });
    expect(sentence).toContain(`measured ${matchingState.measuredDay}`);
    expect(sentence).toContain(`the same ${matchingState.publishedTools} tool names`);
    expect(sentence).toContain("This dated comparison is of tool names");
    expect(sentence).toContain("does not establish equivalent tool behavior");
    expect(sentence).not.toContain("matches the remote contract");
    expect(sentence).not.toContain("Until a published release");
  });

  it("no public surface states the deprecation claim in the form that is false", () => {
    // The false form is "marked deprecated on npm" WITHOUT a "not" in front of it. The derived
    // form is "is NOT marked deprecated on npm", so the lookbehind is what separates them: a
    // plain "not.toContain('marked deprecated on npm')" would fail the TRUE sentence too.
    const surfaces = [
      "public/llms.txt",
      "public/llms-full.txt",
      "public/.well-known/mcp.json",
      "public/.well-known/mcp/server-card.json",
    ];
    for (const file of surfaces) {
      const text = readText(file);
      expect(text, file).not.toMatch(/(?<!not )marked deprecated on npm/);
      expect(text, file).not.toMatch(/are deprecated on npm/);
      expect(text, file).not.toContain("deprecated on npm; npx");
      expect(text, file).not.toContain("published releases are deprecated");
    }
  });
});
