// @vitest-environment jsdom
import { act, createRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import TalkPanel, { type TalkPanelHandle } from "./TalkPanel";
let node: HTMLDivElement; let root: Root;
const posts: Record<string, any>[] = [];
beforeEach(() => {
  window.history.replaceState(null, "", "/");
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true); posts.length = 0;
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, value: vi.fn() });
  vi.stubGlobal("fetch", vi.fn(async (_url: string, init?: RequestInit) => {
    if (!init?.method || init.method === "GET") return Response.json({
      schema: "csoai.agui-run/0.1",
      execution: { version: 1, host: "cloud", provider: "council-tools", connectivity: "online", tools: ["board_totals"] },
    });
    posts.push(JSON.parse(String(init.body)));
    const frame = (type: string, value = {}) => "event: " + type + "\ndata: " + JSON.stringify({ type, ...value }) + "\n\n";
    return new Response(frame("RUN_STARTED", { runId: "server-run", threadId: "server-thread" }) +
      frame("RUN_FINISHED", { result: { grounded: false } }), { headers: { "content-type": "text/event-stream" } });
  }));
});
afterEach(async () => {
  if (root) await act(async () => root.unmount()); node?.remove(); vi.unstubAllGlobals();
});
it("the actual TalkPanel sends the selected tools and changing a choice never replays a question", async () => {
  node = document.createElement("div"); document.body.append(node); root = createRoot(node);
  const ref = createRef<TalkPanelHandle>();
  await act(async () => root.render(<TalkPanel ref={ref} hideSuggestions />));
  const toggle = node.querySelector<HTMLButtonElement>('[data-testid="ai-tools-control"] > button')!;
  await act(async () => toggle.click());
  const none = [...node.querySelectorAll("button")].find(button => button.textContent === "Select none")!;
  await act(async () => none.click());
  expect(posts).toHaveLength(0);
  await act(async () => ref.current!.ask("Show the board"));
  expect(posts).toHaveLength(1);
  expect(posts[0].forwardedProps.execution.enabledTools).toEqual([]);
  const select = [...node.querySelectorAll("button")].find(button => button.textContent === "Select published tools")!;
  await act(async () => select.click());
  expect(posts).toHaveLength(1);
  await act(async () => ref.current!.ask("Show the board"));
  expect(posts).toHaveLength(2);
  expect(posts[1].forwardedProps.execution.enabledTools).toEqual(["board_totals"]);
  expect(posts[0].forwardedProps.execution.enabledTools).toEqual([]);
});
