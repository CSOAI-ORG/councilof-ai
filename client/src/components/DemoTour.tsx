// DemoTour — REMOVED 2026-08-14 (owner). The global self-driving "New here?" tour popup
// was buggy and annoying: it proactively interrupted every visitor, followed them across
// routes, auto-played speech, carried unreadable low-contrast text (emerald-on-white) and a
// residual "Sovereign tour" label. Stubbed to render nothing so the mount in App.tsx stays
// valid without any behaviour. If a redesigned, opt-in onboarding is wanted later, build a
// fresh component — do not restore this one. (git history holds the original.)
export default function DemoTour() {
  return null;
}
