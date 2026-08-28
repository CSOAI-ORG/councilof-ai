/**
 * CesiumPortalCard — Reusable per-landing-page 3D portal.
 *
 * Each landing page gets a custom 3D card that routes the right end-user to
 * the right lens (csoai=measurement, defoneos=regulator, meok=end-user OS),
 * with geolibre region lens (opt-in only) and demo-tour hook.
 *
 * Mounted on /, /article-50, /provenance-finding, /govbench, /leaderboard.
 * Each with its own lens preset.
 */

import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Globe2, MapPin, Play, ChevronRight, X, Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Lens = "csoai" | "defoneos" | "meok";

const LENS_PRESETS: Record<Lens, { title: string; subtitle: string; color: string; preset: string; tour: string; routes: { label: string; href: string; tour?: boolean }[] }> = {
  csoai: {
    title: "Measurement Lens",
    subtitle: "Frozen corpus · live axis · deterministic",
    color: "#10b981",
    preset: "EU_Brussels_50_85_4_35",
    tour: "measurement",
    routes: [
      { label: "Open Council Console", href: "/", tour: true },
      { label: "View Refutation Ledger", href: "/refutation-ledger" },
      { label: "GSPC Instrument", href: "/instrument" },
      { label: "Measured Results", href: "/benchmarks" },
    ],
  },
  defoneos: {
    title: "Regulator Lens",
    subtitle: "Cross-framework compliance · audit trail",
    color: "#3b82f6",
    preset: "EU_Brussels_50_85_4_35",
    tour: "regulator",
    routes: [
      { label: "Open the Regulator Atlas", href: "/regulators", tour: true },
      { label: "Why CSOAI vs the rest", href: "/why" },
      { label: "Read the Methodology", href: "/methodology" },
      { label: "Framework Crosswalk", href: "/crosswalk" },
    ],
  },
  meok: {
    title: "End-User OS Lens",
    subtitle: "Your Council AI · agentic governance",
    color: "#8b5cf6",
    preset: "US_SF_37_77_-122_42",
    tour: "sovspace",
    routes: [
      { label: "Open Council Space", href: "/gspc-arena", tour: true },
      { label: "Council OS", href: "/os?lobby=home" },
      { label: "Tool Commons (published MCP)", href: "/tools" },
      { label: "Your Council assistant Twin", href: "/sovereign-twin" },
    ],
  },
};

export interface CesiumPortalCardProps {
  lens: Lens;
  /** Optional custom iframe URL — defaults to /globe3d.html */
  globeUrl?: string;
  /** Camera target preset (lat/lng/height) — defaults to lens preset */
  preset?: string;
  /** Topic to pass to the demo-tour via SovereignDock */
  tourTopic?: string;
}

export default function CesiumPortalCard({
  lens,
  globeUrl = "/globe3d.html",
  preset,
  tourTopic,
}: CesiumPortalCardProps) {
  const [showIframe, setShowIframe] = useState(false);
  const [regionOptIn, setRegionOptIn] = useState(false);
  const meta = LENS_PRESETS[lens];
  const cameraPreset = preset || meta.preset;
  const tour = tourTopic || meta.tour;

  const openTour = () => {
    // SovereignDock is mounted globally; open it with ?tour=<topic>
    window.dispatchEvent(new CustomEvent("sov:openDock", { detail: { tour } }));
  };

  return (
    <Card className="overflow-hidden border-2 border-slate-200 bg-white">
      <div
        className="relative h-64 md:h-80 cursor-pointer group"
        onClick={() => setShowIframe(true)}
        style={{
          background: `radial-gradient(circle at 30% 40%, ${meta.color}30, transparent 60%), radial-gradient(circle at 70% 60%, ${meta.color}15, transparent 50%), #0a0a0f`,
        }}
      >
        {/* Placeholder 3D hint — real iframe loads on click */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <Globe2
              className="h-16 w-16 mx-auto mb-3 transition-transform group-hover:scale-110 group-hover:rotate-12"
              style={{ color: meta.color }}
            />
            <p className="text-xs text-gray-500 font-mono">click to launch {cameraPreset}</p>
          </div>
        </div>

        {/* Lens badge */}
        <Badge
          className="absolute top-3 left-3 text-[10px]"
          style={{ backgroundColor: meta.color + "30", color: meta.color, borderColor: meta.color + "50" }}
        >
          {meta.title}
        </Badge>

        {/* Iframe overlay */}
        {showIframe && (
          <div className="absolute inset-0 bg-black">
            <iframe
              src={`${globeUrl}?preset=${cameraPreset}&tour=${tour}`}
              className="w-full h-full border-0"
              title={`Cesium ${meta.title}`}
              loading="lazy"
            />
            <button
              onClick={(e) => { e.stopPropagation(); setShowIframe(false); }}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 text-base">{meta.title}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{meta.subtitle}</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={openTour}
            className="text-xs"
          >
            <Play className="h-3 w-3 mr-1" />
            Tour
          </Button>
        </div>

        {/* Region opt-in (never auto-resolve — register law) */}
        <div className="mt-3 flex items-center gap-2 text-[11px] text-gray-500">
          <MapPin className="h-3 w-3" />
          <button
            onClick={() => setRegionOptIn(!regionOptIn)}
            className="underline hover:text-gray-700"
          >
            {regionOptIn ? "Using my region" : "Use my region (opt-in)"}
          </button>
          <Info className="h-3 w-3 ml-1" />
          <span className="italic">never auto-resolved</span>
        </div>

        {/* Lens-specific routes */}
        <div className="mt-3 space-y-1">
          {meta.routes.map((r) => (
            <Link
              key={r.href}
              href={r.href}
              className="flex items-center justify-between text-xs text-gray-600 hover:text-gray-900 py-1 px-2 rounded hover:bg-gray-50"
            >
              <span>{r.label}</span>
              <ChevronRight className="h-3 w-3" />
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
