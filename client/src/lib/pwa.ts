export type ServiceWorkerNavigator = Pick<Navigator, "serviceWorker">;

export async function registerCouncilServiceWorker(
  enabled: boolean,
  navigatorObject: ServiceWorkerNavigator | undefined =
    typeof navigator === "undefined" ? undefined : navigator,
): Promise<ServiceWorkerRegistration | null> {
  if (!enabled || !navigatorObject?.serviceWorker) return null;

  try {
    return await navigatorObject.serviceWorker.register("/sw.js", {
      scope: "/",
      updateViaCache: "none",
    });
  } catch (error) {
    // App installation is an enhancement. A registration failure must never
    // block the workspace, verifier, or a live evidence read.
    console.warn("Council OS app shell was not registered", error);
    return null;
  }
}
