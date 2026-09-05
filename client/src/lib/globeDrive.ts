// globeDrive — the reusable postMessage drive API for the embedded 3D Sovereign globe
// (public/globe3d.html). The globe buffers commands until Cesium is ready (window.__sovBuf),
// so these can be sent any time after the iframe mounts. One shared driver → every surface
// that embeds the globe (Sov Space, account briefs, …) makes the Council assistant perform ON the map.

export type GlobeWin = Window | null | undefined;

export function drive(win: GlobeWin, cmd: any) { try { win?.postMessage(cmd, "*"); } catch (e) {} }

// Fly the camera to a point — the globe auto-fires __focusPulse there (an expanding ring),
// so narration lands exactly where the Council assistant is speaking. Optionally convene the
// 33-seat council spiral at the same point.
export function flyAndConvene(
  win: GlobeWin, lng: number, lat: number,
  opts?: { spiral?: boolean; height?: number; duration?: number; col?: string }
) {
  const height = opts?.height ?? 3200000;
  const duration = opts?.duration ?? 3.2;
  const col = opts?.col ?? "#34d399";
  drive(win, { cmd: "flyTo", lng, lat, height, duration, col }); // auto-pulses
  if (opts?.spiral) setTimeout(() => drive(win, { cmd: "bftSpiral", lng, lat }), duration * 1000 + 100);
}

export function neutralize(win: GlobeWin) { drive(win, { cmd: "neutralize" }); }
export function lightLayer(win: GlobeWin, tag: string, on = true, col?: string) { drive(win, { cmd: "layer", tag, on, col }); }
