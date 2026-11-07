// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Login from "./Login";
import { CouncilSessionPersistenceError, COUNCIL_SESSION_PERSISTENCE_MESSAGE } from "@/lib/councilSession";

const mocks = vi.hoisted(() => ({ login: vi.fn(), navigate: vi.fn(), error: vi.fn(), success: vi.fn() }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: null, loading: false, login: mocks.login }) }));
vi.mock("wouter", () => ({ useLocation: () => ["/login", mocks.navigate],
  useSearch: () => "next=%2Fdashboard%2F%3Fworkspace%3Dcompany" }));
vi.mock("sonner", () => ({ toast: { error: mocks.error, success: mocks.success } }));
let host: HTMLDivElement;
let root: Root;
beforeEach(async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.clearAllMocks();
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  await act(async () => root.render(<Login />));
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
});
async function fill(id: string, value: string) {
  const input = host.querySelector<HTMLInputElement>("#" + id)!;
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
  await act(async () => {
    setter.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
}
async function submit() {
  await fill("email", "fixture@example.test");
  await fill("password", "synthetic-password");
  await act(async () => host.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
  expect(mocks.login).toHaveBeenCalledOnce();
  expect(mocks.login).toHaveBeenCalledWith("fixture@example.test", "synthetic-password");
}
describe("sign-in failure presentation", () => {
  it("reports the safe storage explanation without success or navigation", async () => {
    mocks.login.mockRejectedValueOnce(new CouncilSessionPersistenceError());
    await submit();
    expect(mocks.error).toHaveBeenCalledExactlyOnceWith(COUNCIL_SESSION_PERSISTENCE_MESSAGE);
    expect(mocks.success).not.toHaveBeenCalled();
    expect(mocks.navigate).not.toHaveBeenCalled();
    expect(host.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBe(false);
  });
  it("keeps unknown error details private and reports the generic failure", async () => {
    mocks.login.mockRejectedValueOnce(new Error("private server detail must not be shown"));
    await submit();
    expect(mocks.error).toHaveBeenCalledExactlyOnceWith("Login failed. Please try again.");
    expect(mocks.success).not.toHaveBeenCalled();
    expect(mocks.navigate).not.toHaveBeenCalled();
  });
  it("keeps intentionally cancelled authentication quiet without success or navigation", async () => {
    mocks.login.mockRejectedValueOnce(new DOMException("synthetic cancellation", "AbortError"));
    await submit();
    expect(mocks.error).not.toHaveBeenCalled();
    expect(mocks.success).not.toHaveBeenCalled();
    expect(mocks.navigate).not.toHaveBeenCalled();
  });
});
