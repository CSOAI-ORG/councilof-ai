import { useEffect, useRef, useState } from "react";
const KEY: string = ((import.meta as any).env && (import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY) || "";
function loadMaps3d(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).__maps3dLoaded) return resolve();
    if (!KEY) return reject(new Error("no-key"));
    const s = document.createElement("script");
    s.src = "https://maps.googleapis.com/maps/api/js?key=" + KEY + "&v=alpha&libraries=maps3d";
    s.async = true; s.onload = () => { (window as any).__maps3dLoaded = true; resolve(); };
    s.onerror = () => reject(new Error("script-failed")); document.head.appendChild(s);
  });
}
export default function RealWorldMap() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    document.title = "Real-world 3D map | CSOAI";
    if (!KEY) { setErr("The photorealistic 3D map is temporarily unavailable. Explore the Council Globe instead — no key, no account, always on."); return; }
    let cancelled = false;
    loadMaps3d().then(() => {
      if (cancelled || !ref.current) return;
      ref.current.innerHTML = "";
      const map = document.createElement("gmp-map-3d");
      map.setAttribute("center", "51.5072,-0.1276,400"); map.setAttribute("range", "2500");
      map.setAttribute("tilt", "67"); map.setAttribute("heading", "30");
      (map as any).style.width = "100%"; (map as any).style.height = "100%";
      ref.current.appendChild(map);
    }).catch((e) => { if (!cancelled) setErr("Could not load Google 3D Maps (" + e.message + "). Check key referrer restrictions and that Map Tiles API is enabled."); });
    return () => { cancelled = true; };
  }, []);
  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50">
      <section className="relative overflow-hidden mx-auto max-w-6xl px-6 pt-16 pb-4">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(800px 380px at 50% -10%, rgba(16,185,129,.20), transparent 60%)" }} />
        <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">CSOAI OS - real-world Council Space</p>
        <h1 className="relative mt-2 text-4xl sm:text-5xl font-black tracking-tight">The real-world <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-teal-300 bg-clip-text text-transparent">globe.</span></h1>
        <p className="mt-3 max-w-2xl text-emerald-100/80">Photorealistic 3D Earth - the real-world layer of Council Space. The same world pixel-streams from Unreal Engine 5 in the full OS.</p>
      </section>
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="relative h-[520px] overflow-hidden rounded-2xl border border-emerald-500/20 bg-black">
          <div ref={ref} className="absolute inset-0" />
          {err && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
              <p className="text-sm text-emerald-200/80">{err}</p>
              <p className="text-sm text-emerald-200/80">
                Meanwhile:{" "}
                <a href="/globe" className="font-medium text-emerald-300 hover:underline">
                  open the council globe →
                </a>
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
