/** Bound the complete response read, including a stalled body. Never retry a write. */
export async function requestHitlJson(
  url: string,
  init: RequestInit = {},
): Promise<{ response: Response; body: any }> {
  const controller = new AbortController();
  const parent = init.signal;
  const abort = () => controller.abort();
  let rejectAbort: (reason: Error) => void = () => {};
  const interrupted = new Promise<never>((_, reject) => {
    rejectAbort = reject;
  });
  const onAbort = () =>
    rejectAbort(new Error("The response was not confirmed."));
  controller.signal.addEventListener("abort", onAbort, { once: true });
  parent?.addEventListener("abort", abort, { once: true });
  if (parent?.aborted) abort();
  const timeout = setTimeout(abort, 15000);
  try {
    return await Promise.race([
      interrupted,
      (async () => {
        if (controller.signal.aborted)
          throw new Error("Request cancelled before dispatch.");
        const response = await fetch(url, {
          ...init,
          cache: "no-store",
          signal: controller.signal,
        });
        const body = await response.json();
        return { response, body };
      })(),
    ]);
  } finally {
    clearTimeout(timeout);
    parent?.removeEventListener("abort", abort);
    controller.signal.removeEventListener("abort", onAbort);
  }
}