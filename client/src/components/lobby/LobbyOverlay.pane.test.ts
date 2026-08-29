import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { paneLoadFor } from "./tabs";

const overlaySrc = readFileSync(resolve(__dirname, "LobbyOverlay.tsx"), "utf8");

describe("LobbyOverlay pane loader", () => {
  it("drives centre-pane loads through paneLoadFor", () => {
    expect(overlaySrc).toMatch(/paneLoadFor\(path\)/);
    expect(overlaySrc).toMatch(/load\.action === "navigate"/);
    expect(overlaySrc).toMatch(/window\.location\.assign\(load\.path\)/);
    expect(overlaySrc).toMatch(/setFrameSrc\(withEmbed\(load\.path\)\)/);
  });

  it("delegates embed-nav to handleEmbedNav and never iframes Software", () => {
    expect(overlaySrc).toMatch(/handleEmbedNav\(e,/);
    expect(overlaySrc).toMatch(/softwareLeavesOs\(t\)/);
    expect(overlaySrc).toMatch(/window\.location\.assign\(SOFTWARE_HREF\)/);
    expect(overlaySrc).toMatch(/setFrameSrc\(""\)/);
    expect(overlaySrc).not.toMatch(/setOverride\(\{ path: e\.data\.path/);
  });

  it("never sets iframe src for an unframeable path in loadPane", () => {
    expect(overlaySrc).toMatch(/if \(isUnframeable\(path\)\)/);
    expect(overlaySrc).toMatch(/window\.location\.assign\(withoutEmbed\(path\)\)/);
  });

  it("does not set an iframe src for /, /os, or /dashboard from the start-state loader", () => {
    const frames: string[] = [];
    const assign: string[] = [];
    const apply = (path: string) => {
      const load = paneLoadFor(path);
      if (load.action === "navigate") assign.push(load.path);
      else frames.push(load.path);
    };
    apply("/");
    apply("/os");
    apply("/dashboard");
    apply("/ag-ui");
    apply("/chat");
    apply("/library");
    expect(assign).toEqual(["/", "/os", "/dashboard", "/ag-ui", "/chat"]);
    expect(frames).toEqual(["/library"]);
  });

  it("does not iframe the software tab's /dashboard", () => {
    expect(paneLoadFor("/dashboard").action).toBe("navigate");
    expect(overlaySrc).not.toMatch(/setFrameSrc\(["'`]\/dashboard/);
  });
});
