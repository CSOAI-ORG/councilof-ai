// Public /sov-os door is Council OS at /os. Not a second dockview OS.
// 2026-08-28: Lean homepage (832) ate the lobby panes; /?lobby=home crashes.
// /os is the AG-UI host now.
import { Redirect } from "wouter";

export default function SovOS() {
  return <Redirect to="/os?lobby=home" />;
}
