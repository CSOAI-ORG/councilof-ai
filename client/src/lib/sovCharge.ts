// sovCharge - the twin charge the whole OS shares. Every real interaction
// with your Council assistant (a question, a query, an experiment, a verdict) nudges the
// living egg toward hatching. Persisted in localStorage; read by CouncilTwin.

const KEY = "sov_charge";

export function getCharge(): number {
  try { return parseInt(localStorage.getItem(KEY) || "0", 10) || 0; } catch (e) { return 0; }
}

export function chargeSovereign(amount = 5): number {
  try {
    const cur = getCharge();
    const next = Math.max(0, Math.min(100, cur + amount));
    localStorage.setItem(KEY, String(next));
    // Let any listening surface (e.g. a live egg) react in the same tab.
    try { window.dispatchEvent(new CustomEvent("sov-charge", { detail: next })); } catch (e) {}
    return next;
  } catch (e) { return 0; }
}
