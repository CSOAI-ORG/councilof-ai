/**
 * rails — persisted open/closed state for the two Council OS sidebars.
 *
 * Left is the master menu (panes + site routes). Right is the AG-UI control
 * rail (talk-to-drive chips, reports, tasks, chats, tooling). Both can hide
 * so the centre Ask bar owns the workspace. First visit: both open so end
 * users see Control chips immediately. After that, the last choice restores.
 */

export const LEFT_KEY = "coai.lobby.left";
export const RIGHT_KEY = "coai.lobby.right";

export const LEFT_DEFAULT = true;
export const RIGHT_DEFAULT = true;

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
