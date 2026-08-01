import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Globe2, MapPin, Play, Loader2 } from "lucide-react";
import { useGeolibre, GEO_REGION_OPTIONS } from "@/lib/geolibre";
import { startTour, tourStartStep, TOUR } from "@/lib/demoTour";
import { drive } from "@/lib/globeDrive";

/**
 * CesiumPortalCard — the per-landing-page 3D portal.
 *
 * Each landing page mounts this card with the lens its end-user needs
 * (csoai = measurement, defoneos = regulator, meok = end-user OS), a camera
 * preset, and a demo-tour topic. The globe itself is the same /globe3d.html
 * engine DemoOS uses, driven through the shared globeDrive postMessage API.
 *
 * Two hard rules baked in (register, 2026-08-01):
 *
 *   GEO LAW — the camera starts GLOBAL, always. "Use my region" is ONE tap,
 *   disclosed (a single ipapi.co lookup via geolibre), or the visitor picks a
 *   region manually with zero network. Nothing auto-resolves. Ever.
 *
 *   HONEST LOADING — Cesium is several MB from a CDN, so the iframe only
 *   mounts after the visitor clicks "Load the 3D globe". An honest placeholder
 *   beats a silent multi-MB download on a landing page.
 */

export type PortalLens = "csoai" | "defoneos" | "meok";

/** Named camera targets. global mirrors the globe's own opening view. */
export const PORTAL_PRESETS = {
  global: { lng: 20, lat: 28, height: 26000000 },
  eu: { lng: 9.0, lat: 50.5, height: 3400000 },
  uk: { lng: -1.5, lat: 52.5, height: 2600000 },
  us: { lng: -98.0, lat: 39.5, height: 4600000 },
} as const;
export type PortalPreset = keyof typeof PORTAL_PRESETS;

const LENSES: Record<
  PortalLens,
  { kicker: string; title: string; blurb: string; tourTopic: string; tourLabel: string }
> = {
  csoai: {
    kicker: "CSOAI · measurement",
    title: "The measurement lens",
    blurb:
      "Every number on this site traces to a signed artefact you can recompute. Fly to where the rules are made — the measurement follows the same map.",
    tourTopic: "measurement",
    tourLabel: "Take the measurement tour",
  },
  defoneos: {
    kicker: "Regulator view",
    title: "The regulator lens",
    blurb:
      "Public, cryptographic accountability: incidents reported by people and agents, mapped where they happen, logged so nobody can quietly edit the record.",
    tourTopic: "regulator",
    tourLabel: "Take the regulator tour",
  },
  meok: {
    kicker: "Sovereign OS",
    title: "The OS lens",
    blurb:
      "Governance as a working operating system, not a dashboard — live tools on a sovereign brain, keyless and on-demand, one command into any agent you already run.",
    tourTopic: "os",
    tourLabel: "Take the OS tour",
  },
};

export default function CesiumPortalCard({
  lens,
  preset = "global",
  tourTopic,
  dark = false,
}: {
  lens: PortalLens;
  preset?: PortalPreset;
  tourTopic?: string;
  dark?: boolean;
}) {
  const L = LENSES[lens];
  const topic = tourTopic ?? L.tourTopic;
  const geo = useGeolibre();
  const [, nav] = useLocation();
  const frame = useRef<HTMLIFrameElement>(null);
  const [loaded, setLoaded] = useState(false);

  // Where the camera should be: the visitor's region if they opted in, else the page preset.
  const target =
    geo.enabled && geo.region.code !== "GLOBAL"
      ? { lng: geo.region.globe[0], lat: geo.region.globe[1], height: 3000000 }
      : PORTAL_PRESETS[preset];

  // The served globe drops commands posted before its viewer exists, so the
  // first flyTo fires on iframe load; region changes after that are live.
  const fly = () =>
    drive(frame.current?.contentWindow, {
      cmd: "flyTo",
      lng: target.lng,
      lat: target.lat,
      height: target.height,
      duration: 2.2,
    });

  useEffect(() => {
    if (loaded) fly();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geo.enabled, geo.region.code]);

  const beginTour = () => {
    startTour(topic);
    nav(TOUR[tourStartStep(topic)].path);
  };

  const shell = dark
    ? "border-emerald-500/25 bg-[#05140d] text-emerald-50"
    : "border-emerald-200 bg-white text-gray-900 shadow-sm";
  const sub = dark ? "text-emerald-100/60" : "text-gray-500";
  const kicker = dark ? "text-emerald-300/70" : "text-emerald-700";

  return (
    <div className={`w-full overflow-hidden rounded-2xl border ${shell}`}>
      {/* header — which lens, and why */}
      <div className="flex flex-wrap items-center gap-3 p-5 pb-4">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${dark ? "bg-emerald-500/15" : "bg-emerald-600"}`}>
          <Globe2 className={`h-5 w-5 ${dark ? "text-emerald-300" : "text-white"}`} />
        </span>
        <div className="min-w-0 flex-1">
          <p className={`font-mono text-[10px] uppercase tracking-[2px] ${kicker}`}>{L.kicker}</p>
          <p className="text-sm font-bold">{L.title}</p>
        </div>
        <button
          onClick={beginTour}
          className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
            dark
              ? "bg-emerald-500 text-[#03110b] hover:bg-emerald-400"
              : "bg-emerald-600 text-white hover:bg-emerald-700"
          }`}
        >
          <Play className="h-3 w-3" /> {L.tourLabel}
        </button>
      </div>

      {/* the portal — click-to-load, never silent */}
      {loaded ? (
        <div className="relative h-[260px] w-full sm:h-[340px]">
          <iframe
            ref={frame}
            src="/globe3d.html"
            title={`${L.title} — interactive 3D governance globe`}
            loading="lazy"
            onLoad={() => setTimeout(fly, 600)}
            className="h-full w-full border-0"
          />
        </div>
      ) : (
        <button
          onClick={() => setLoaded(true)}
          className={`flex h-[260px] w-full flex-col items-center justify-center gap-2 sm:h-[340px] ${
            dark ? "bg-[#03110b] hover:bg-[#04120c]" : "bg-emerald-50/60 hover:bg-emerald-50"
          } transition`}
        >
          <Globe2 className={`h-8 w-8 ${dark ? "text-emerald-400" : "text-emerald-600"}`} />
          <span className="text-sm font-semibold">Load the 3D globe</span>
          <span className={`max-w-xs px-4 text-center text-[11px] leading-relaxed ${sub}`}>
            {L.blurb} Loads Cesium from a CDN only when you ask.
          </span>
        </button>
      )}

      {/* region controls — opt-in or manual, never automatic */}
      <div className={`flex flex-wrap items-center gap-x-3 gap-y-2 border-t p-4 ${dark ? "border-emerald-500/15" : "border-emerald-100"}`}>
        {geo.enabled ? (
          <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${dark ? "text-emerald-200" : "text-emerald-700"}`}>
            <MapPin className="h-3.5 w-3.5" />
            {geo.region.code === "GLOBAL" ? "Global view" : `Viewing: ${geo.region.label}`}
            {geo.source === "ip" && geo.countryIso2 ? ` (${geo.countryIso2})` : ""}
          </span>
        ) : (
          <button
            onClick={() => geo.enable()}
            disabled={geo.resolving}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              dark
                ? "border-emerald-500/30 text-emerald-200 hover:bg-emerald-500/10"
                : "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            } disabled:opacity-50`}
            title="One tap: a single ipapi.co lookup picks your region. Nothing is sent to our servers."
          >
            {geo.resolving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MapPin className="h-3.5 w-3.5" />}
            Use my region
          </button>
        )}
        <select
          value={geo.enabled ? geo.region.code : "GLOBAL"}
          onChange={(e) => (e.target.value === "GLOBAL" ? geo.disable() : geo.pick(e.target.value))}
          aria-label="Pick a region manually"
          className={`rounded-lg border px-2 py-1.5 text-xs ${
            dark
              ? "border-emerald-500/30 bg-[#03110b] text-emerald-100"
              : "border-gray-300 bg-white text-gray-700"
          }`}
        >
          <option value="GLOBAL">Global (default)</option>
          {GEO_REGION_OPTIONS.filter((r) => r.code !== "GLOBAL").map((r) => (
            <option key={r.code} value={r.code}>
              {r.label}
            </option>
          ))}
        </select>
        <span className={`text-[10px] leading-snug ${sub}`}>
          Region is your choice — one disclosed tap or a manual pick. Never automatic.
        </span>
      </div>
    </div>
  );
}
