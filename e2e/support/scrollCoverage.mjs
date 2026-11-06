/** A long/infinite page must fail explicitly rather than claim a partial scroll was complete. */
export function nextViewportStop(metrics, progress = {}) {
  const { position, height, viewport } = metrics;
  if (
    ![position, height, viewport].every(Number.isFinite) ||
    viewport <= 0 ||
    height <= 0
  )
    throw new Error("Cannot measure scroll coverage");
  if (position + viewport >= height - 1)
    return { done: true, target: position };
  if ((progress.steps ?? 0) >= (progress.maxSteps ?? 300))
    throw new Error("Scroll coverage INCOMPLETE: viewport-step cap reached");
  if ((progress.elapsedMs ?? 0) >= (progress.maxMs ?? 20_000))
    throw new Error("Scroll coverage INCOMPLETE: time budget reached");
  return {
    done: false,
    target: Math.min(
      position + Math.max(200, Math.floor(viewport * 0.8)),
      height - viewport,
    ),
  };
}

/** Browser function: native Council OS canvases scroll independently of the window. */
export function primaryScrollMetrics() {
  const selectors = [
    '[data-testid="gspc-workspace-home"]',
    '[data-testid="dashboard-tool-canvas"]',
  ];
  const candidates = selectors
    .map((target) => ({ target, element: document.querySelector(target) }))
    .filter(
      ({ element }) =>
        element && element.getClientRects().length && element.clientHeight > 0,
    );
  const selected =
    candidates.find(
      ({ element }) => element.scrollHeight > element.clientHeight + 1,
    ) ?? candidates[0];
  const element = selected?.element;
  return {
    target: selected?.target ?? "window",
    position: element ? element.scrollTop : scrollY,
    height: element
      ? element.scrollHeight
      : document.documentElement.scrollHeight,
    viewport: element ? element.clientHeight : innerHeight,
    overflow: document.documentElement.scrollWidth - innerWidth,
    targetOverflow: element
      ? element.scrollWidth - element.clientWidth
      : document.documentElement.scrollWidth - innerWidth,
  };
}
