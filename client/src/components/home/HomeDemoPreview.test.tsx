// @vitest-environment jsdom
import { act } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import HomeDemoPreview from "./HomeDemoPreview";

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

describe("homepage product walkthrough", () => {
  it("does not request the video until a visitor chooses to play it", () => {
    const html = renderToStaticMarkup(<HomeDemoPreview />);
    expect(html).toContain('data-testid="home-demo-preview"');
    expect(html).toContain('aria-label="Play the Council of AI product walkthrough"');
    expect(html).toContain('/videos/csoai-demo.jpg');
    expect(html).not.toContain("<video");
  });

  it("mounts the video only after the visitor presses Play", () => {
    act(() => root.render(<HomeDemoPreview />));
    expect(container.querySelector("video")).toBeNull();

    const play = container.querySelector<HTMLButtonElement>(
      'button[aria-label="Play the Council of AI product walkthrough"]',
    );
    expect(play).not.toBeNull();

    act(() => play!.click());

    const video = container.querySelector<HTMLVideoElement>("video");
    expect(video).not.toBeNull();
    expect(video?.getAttribute("preload")).toBe("none");
    expect(video?.querySelector("source")?.getAttribute("src")).toBe(
      "/videos/csoai-demo.mp4",
    );
  });
});
