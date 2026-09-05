import { describe, expect, it, vi } from "vitest";
import { registerCouncilServiceWorker } from "./pwa";

describe("registerCouncilServiceWorker", () => {
  it("does nothing outside a production build", async () => {
    const register = vi.fn();
    await expect(
      registerCouncilServiceWorker(false, {
        serviceWorker: { register } as unknown as ServiceWorkerContainer,
      }),
    ).resolves.toBeNull();
    expect(register).not.toHaveBeenCalled();
  });

  it("registers one root-scoped, no-cache worker when enabled", async () => {
    const registration = {} as ServiceWorkerRegistration;
    const register = vi.fn().mockResolvedValue(registration);
    await expect(
      registerCouncilServiceWorker(true, {
        serviceWorker: { register } as unknown as ServiceWorkerContainer,
      }),
    ).resolves.toBe(registration);
    expect(register).toHaveBeenCalledWith("/sw.js", {
      scope: "/",
      updateViaCache: "none",
    });
  });

  it("keeps the application usable when registration fails", async () => {
    const register = vi.fn().mockRejectedValue(new Error("blocked"));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    await expect(
      registerCouncilServiceWorker(true, {
        serviceWorker: { register } as unknown as ServiceWorkerContainer,
      }),
    ).resolves.toBeNull();
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });
});
