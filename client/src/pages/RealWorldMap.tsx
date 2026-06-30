import { useEffect, useRef, useState } from "react";

const KEY: string = ((import.meta as any).env && (import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY) || "";

function loadMaps3d(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).__maps3dLoaded) return resolve();
    if (!KEY) return reject(new Error("no-key"));
    const s = document.createElement("script");
    s.src = "https://maps.googleapis.com/maps/api/js?key=" + KEY + "&v=alpha&libraries=maps3d";
    s.async = true;
    s.onload = () => { (window as any).__maps3dLoaded = true; resolve(); };
    s.onerror = () => reject(new Error("script-failed"));
    document.head.appendChild(s);
  });
}

export default function RealWorldMap() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    document.title = "Real-World Sov Space - the living globe | CSOAI";
    if (!KEY) { setErr("Set VITE_GOOGLE_MAPS_API_KEY (Vercel) to load the real-world 3D map."); return; }
    let cancelled = false;
    loadMaps3d().then(() => {
      if (cancelled || !ref.current) return;
      ref.current.innerHTML = "";
      const map = document.createElement("gmp-map-3d");
      map.setAttribute("center", "51.5072,-0.1276,400");
      map.setAttribute("range", "2500");
      map.setAttribute("tilt", "67");
      map.setAttribute("heading", "30");
      (map as any).style.width = "100%";
      (map as any).style.height = "100%";
      ref.current.appendChild(map);
    }).catch((e) => { if (!cancelled) setErr("Could not load Google 3D Maps (" + e.message + "). Check the key referrer restrictions and that Map Tiles API is enabled."); });
    return () => { cancelled = true; };
  }, []);
  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50">
      <section className="mx-auto max-w-6xl px-6 pt-12 pb-4">
        <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">CSOAI OS - real-world Sov Space</p>
        <h1 className="mt-2 text-4xl sm:text-5xl font-black tracking-tight">The living globe.</h1>
        <p className="mt-3 max-w-2xl text-emerald-100/80">Photorealistic 3D Earth - the real-world layer of Sov Space. The 33 hives, the council and your Sovereign sit on the actual planet. The same world pixel-streams from Unreal Engine 5 in the full OS.</p>
      </section>
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="relative h-[520px] overflow-hidden rounded-2xl border border-emerald-500/20 bg-black">
          <div ref={ref} className="absolute inset-0" />
          {err && <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-emerald-200/80">{err}</div>}
        </div>
      </section>
    </div>
  );
}
