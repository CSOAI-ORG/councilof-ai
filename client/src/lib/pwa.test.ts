import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { registerCouncilServiceWorker } from "./pwa";

const publicDir = resolve(__dirname, "../../../public");
const manifest = JSON.parse(
  readFileSync(resolve(publicDir, "manifest.json"), "utf8"),
);

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

describe("Council OS web-app manifest", () => {
  it("ships the raster sizes Chromium needs to offer installation", () => {
    const icons = manifest.icons as Array<{
      src: string;
      sizes: string;
      type: string;
    }>;
    for (const [src, sizes] of [
      ["/council-os-192.png", "192x192"],
      ["/council-os-512.png", "512x512"],
    ]) {
      expect(icons).toContainEqual(
        expect.objectContaining({ src, sizes, type: "image/png" }),
      );
      expect(existsSync(resolve(publicDir, src.slice(1)))).toBe(true);
    }
  });

  it("launches the one canonical dashboard shell", () => {
    expect(manifest.id).toBe("/dashboard");
    expect(manifest.start_url).toBe("/dashboard?source=installed-app");
    expect(manifest.prefer_related_applications).toBe(false);
  });
});
