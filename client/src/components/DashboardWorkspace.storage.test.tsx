// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import DashboardWorkspace from "./DashboardWorkspace";
import { CANDIDATE_PENDING_KEY } from "@/lib/candidateEvidence";

const mocks = vi.hoisted(() => ({
  chat: { active: null, threads: [], turnCount: 0, recordUserMessage: vi.fn() },
  activity: [],
  listTools: vi.fn(),
  navigate: vi.fn(),
}));
vi.mock("wouter", () => ({
  useLocation: () => ["/dashboard", mocks.navigate],
  useSearch: () => "",
}));
vi.mock("@/lib/sovTools", () => ({ listTools: mocks.listTools }));
vi.mock("@/components/lobby/useLobbyChat", () => ({
  useLobbyChat: () => mocks.chat,
}));
vi.mock("@/components/lobby/workspace", () => ({
  useActivity: () => mocks.activity,
  recordActivity: vi.fn(),
}));
vi.mock("@/components/lobby/LobbyComposer", () => ({
  default: () => <div data-testid="test-composer">Composer remains usable</div>,
}));
vi.mock("@/components/lobby/LobbyThread", () => ({
  default: () => <div>Thread</div>,
}));
vi.mock("@/components/DashboardRightRail", () => ({
  default: () => <div>History</div>,
}));
vi.mock("@/components/CandidateEvidenceTray", () => ({
  default: () => <div data-testid="unexpected-intake">Intake</div>,
}));
vi.mock("@/components/gspc/GspcWorkspaceHome", () => ({
  default: () => <div>Home</div>,
}));
vi.mock("@/components/talk/TalkPanel", () => ({
  default: () => <div>Talk</div>,
}));
let host: HTMLDivElement;
let root: Root | undefined;
async function mount() {
  root = createRoot(host);
  await act(async () => {
    root!.render(
      <DashboardWorkspace
        activePane={<h1>Published tool pane</h1>}
        activeTab="tools"
        activeLabel="MCP tools"
      >
        {null}
      </DashboardWorkspace>,
    );
  });
}
beforeEach(() => {
  (
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
  vi.clearAllMocks();
  mocks.listTools.mockResolvedValue({
    state: "unreachable",
    reason: "fixture",
  });
  localStorage.clear();
  host = document.createElement("div");
  document.body.append(host);
});
afterEach(async () => {
  if (root)
    await act(async () => {
      root!.unmount();
    });
  root = undefined;
  host.remove();
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("Council OS with denied optional candidate storage", () => {
  it("keeps the pane and composer mounted when the localStorage getter is denied", async () => {
    vi.spyOn(window, "localStorage", "get").mockImplementation(() => {
      throw new DOMException("Denied", "SecurityError");
    });
    await expect(mount()).resolves.toBeUndefined();
    expect(host.textContent).toContain("Published tool pane");
    expect(host.querySelector('[data-testid="test-composer"]')).toBeTruthy();
    expect(host.querySelector('[data-testid="unexpected-intake"]')).toBeNull();
  });

  it("does not let a read failure followed by a cleanup failure crash the workspace", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("Denied", "SecurityError");
    });
    const remove = vi
      .spyOn(Storage.prototype, "removeItem")
      .mockImplementation(() => {
        throw new DOMException("Denied", "SecurityError");
      });
    await expect(mount()).resolves.toBeUndefined();
    expect(remove).toHaveBeenCalledWith(CANDIDATE_PENDING_KEY);
    expect(host.textContent).toContain("Composer remains usable");
  });

  it("keeps the workspace usable if malformed pending context cannot be removed", async () => {
    localStorage.setItem(CANDIDATE_PENDING_KEY, "{malformed");
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("blocked removal");
    });
    await expect(mount()).resolves.toBeUndefined();
    expect(host.textContent).toContain("Published tool pane");
    expect(localStorage.getItem(CANDIDATE_PENDING_KEY)).toBe("{malformed");
    expect(host.querySelector('[data-testid="unexpected-intake"]')).toBeNull();
  });

  it("still removes malformed pending local context when storage permits it", async () => {
    localStorage.setItem(CANDIDATE_PENDING_KEY, "{malformed");
    await mount();
    expect(localStorage.getItem(CANDIDATE_PENDING_KEY)).toBeNull();
    expect(host.textContent).toContain("Published tool pane");
  });
});
