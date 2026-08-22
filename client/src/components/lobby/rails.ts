/**
 * rails — persisted open/closed state for the two Council OS sidebars.
 *
 * Left is Destinations (the pane list). Right is Reports / Tasks / Chats.
 * Both can be hidden so the centre pane and the ask bar take the workspace.
 * First visit: left open (you need to find a pane), right closed (the centre
 * should read first). After that, the last choice is restored.
 */

export const LEFT_KEY = "coai.lobby.left";
export const RIGHT_KEY = "coai.lobby.right";

export const LEFT_DEFAULT = true;
export const RIGHT_DEFAULT = false;

export function readOpen(key: string, fallback: boolean): boolean {
  try {
    const v = localStorage.getItem(key);
    if (v === "1") return true;
    if (v === "0") return false;
  } catch { /* private mode / storage disabled */ }
  return fallback;
}

export function writeOpen(key: string, open: boolean): void {
  try { localStorage.setItem(key, open ? "1" : "0"); } catch { /* ignore */ }
}
