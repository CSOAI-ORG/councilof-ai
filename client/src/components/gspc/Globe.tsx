/**
 * Globe — interactive orthographic globe (no MapLibre, no pins, no vendor token).
 *
 * Ported from the csoai-web GapMap and rethemed to the master's dark-emerald
 * Ledger aesthetic. Country polygons: Natural Earth 110m (public domain),
 * vendored at client/src/data/world-geo.json, projected orthographically on
 * the client. Drag to rotate; slow auto-spin stops under
 * prefers-reduced-motion and while dragging.
 *
 *   GL1: Polygons, not pins. Jurisdiction-level resolution only.
 *   GL2: No IP geolocation anywhere.
 *   GL6: Keyless basemap — no vendor token in the client, data vendored.
 *   GL7: Licence attribution on the map surface itself (Natural Earth, public
 *        domain). No false credit.
 *
 * Node live-status comes from data/anchors.ts — the same registry the
 * /gspc-anchors page reads — and staleness is computed against the live
 * clock, never a hardcoded date.
 */

import { useEffect, useRef } from "react";
import worldGeo from "@/data/world-geo.json";
import { ANCHORS, hoursSinceLastPass, type Jurisdiction } from "@/data/anchors";
import { CONNECTED_NODES } from "@/data/nodes";

type Ring = number[][];
interface Country { id: string; rings: Ring[]; }
const COUNTRIES = (worldGeo as unknown as { countries: Country[] }).countries;

/* Anchor status by id. Missing id → hollow marker, never upgraded.
   Hours-since-last-pass is computed live at tooltip render time. */
const ANCHOR_BY_ID = new Map(ANCHORS.map((a) => [a.id, a]));

/* ISO 3166-1 numeric → jurisdiction. Malta (470) is below 110m resolution and
   simply never matches; listing it keeps the membership honest. */
const EU27 = new Set([
  "040", "056", "100", "191", "196", "203", "208", "233", "246", "250",
  "276", "300", "348", "372", "380", "428", "440", "442", "470", "528",
  "616", "620", "642", "703", "705", "724", "752",
]);

function jurisdictionOf(id: string): Jurisdiction | null {
  if (EU27.has(id)) return "EU";
  if (id === "826") return "UK";
  if (id === "840") return "US";
  return null;
}

interface JurisdictionMeta {
  status: "measured" | "blind";
  cellCount?: number;
  /** Geographic label anchor [lon, lat]. */
  anchor: [number, number];
}

const JURISDICTIONS: Record<Jurisdiction, JurisdictionMeta> = {
  EU: { status: "measured", cellCount: 4, anchor: [10, 50.5] },
  UK: { status: "measured", cellCount: 2, anchor: [-2.5, 54] },
  US: { status: "blind", anchor: [-98, 39.5] },
};

/* Dark-emerald palette — matches the Ledger-section pages. */
const COLORS = {
  ocean: "#052e22",
  sphereEdge: "rgba(16, 185, 129, 0.45)",
  graticule: "rgba(110, 231, 183, 0.10)",
  land: "#1a5c46",
  landEdge: "rgba(16, 185, 129, 0.30)",
  measured: "#10b981",   // emerald-500
  blind: "#ef4444",      // red-500
  highlight: "#f59e0b",  // amber-400/500 — the "gold" of the ledger pages
  label: "rgba(209, 250, 229, 0.85)",
  credit: "rgba(110, 231, 183, 0.55)",
};

/* Node status → marker paint. Solid diamonds; hollow = status unknown. */
const NODE_STATUS_COLORS: Record<string, string> = {
  live: "#34d399",      // emerald-400
  degraded: "#fbbf24",  // amber-400
  unreachable: "#ef4444",
};
const NODE_UNKNOWN = "#6ee7b7"; // emerald-300, rendered hollow

interface GlobeProps {
  /** Jurisdiction to highlight (lit amber when probed from any surface) */
  highlight?: string;
  /** Click handler for jurisdiction selection */
  onSelect?: (id: string) => void;
  /** Show measurement stats overlay */
  showStats?: boolean;
  /** Show connected live nodes (anchor institutions) around each jurisdiction */
  showNodes?: boolean;
}

const W = 720, H = 560, CX = W / 2, CY = H / 2, R = 235;
const DEG = Math.PI / 180;

/** Spin speed in degrees per frame; pause before resuming after a drag. */
const SPIN_PER_FRAME = 0.045;
const RESUME_AFTER_MS = 2500;

type Pt = [number, number, number]; // screen x, screen y, z (visible when > 0)

export function Globe({ highlight, onSelect, showStats = true, showNodes = true }: GlobeProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef({
    lambda: 15, // start facing the Atlantic — EU/UK/US all near front
    phi: 18,
    dragging: false,
    lastX: 0,
    lastY: 0,
    moved: 0,
    resumeAt: 0,
    reducedMotion: false,
    raf: 0,
    lastLambda: NaN,
    lastPhi: NaN,
    countryPaths: [] as { id: string; rings: Ring[]; el: SVGPathElement }[],
    labelEls: [] as { id: Jurisdiction; el: SVGTextElement }[],
    nodeEls: [] as { id: string; jurisdiction: Jurisdiction; cluster: number; el: SVGPathElement }[],
    gratEl: null as SVGPathElement | null,
  });

  /* Keep latest highlight/onSelect visible to the imperative layer. */
  const propsRef = useRef({ highlight, onSelect });
  propsRef.current = { highlight, onSelect };

  /* Build the SVG once; animation + interaction live here. */
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const st = stateRef.current;
    st.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const NS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "Jurisdiction coverage globe — polygons, not pins. Drag to rotate.");
    svg.style.width = "100%";
    svg.style.height = "auto";
    svg.style.display = "block";
    svg.style.touchAction = "none";

    const mk = <T extends SVGElement>(tag: string, attrs: Record<string, string>): T => {
      const el = document.createElementNS(NS, tag) as T;
      for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
      return el;
    };

    /* Ocean sphere. */
    svg.appendChild(mk("circle", { cx: String(CX), cy: String(CY), r: String(R), fill: COLORS.ocean }));

    /* Country layer. */
    const landG = mk<SVGGElement>("g", {});
    svg.appendChild(landG);
    st.countryPaths = COUNTRIES.map((c) => {
      const el = mk<SVGPathElement>("path", {
        fill: COLORS.land,
        stroke: COLORS.landEdge,
        "stroke-width": "0.5",
        "data-iso": c.id,
      });
      landG.appendChild(el);
      return { id: c.id, rings: c.rings, el };
    });

    /* Graticule layer (above land, subtle). */
    st.gratEl = mk<SVGPathElement>("path", {
      fill: "none", stroke: COLORS.graticule, "stroke-width": "0.5", d: "",
    });
    svg.appendChild(st.gratEl);

    /* Sphere outline. */
    svg.appendChild(mk("circle", {
      cx: String(CX), cy: String(CY), r: String(R),
      fill: "none", stroke: COLORS.sphereEdge, "stroke-width": "1",
    }));

    /* Jurisdiction labels. */
    st.labelEls = (Object.entries(JURISDICTIONS) as [Jurisdiction, JurisdictionMeta][]).map(([id]) => {
      const el = mk<SVGTextElement>("text", {
        "text-anchor": "middle",
        "font-family": "'SF Mono', 'Cascadia Code', Consolas, ui-monospace, monospace",
        "font-size": "12",
        "pointer-events": "none",
      });
      el.textContent = id;
      svg.appendChild(el);
      return { id, el };
    });

    /* Connected-node layer — institutional anchors clustered under each
       jurisdiction label (GL1: jurisdiction-level resolution only). */
    st.nodeEls = [];
    if (showNodes) {
      const clusterCount: Record<string, number> = {};
      for (const n of CONNECTED_NODES) {
        const idx = clusterCount[n.jurisdiction] ?? 0;
        clusterCount[n.jurisdiction] = idx + 1;
        const anchor = ANCHOR_BY_ID.get(n.id);
        const el = mk<SVGPathElement>("path", {
          d: "M 0 -4 L 4 0 L 0 4 L -4 0 Z",
          fill: anchor ? (NODE_STATUS_COLORS[anchor.status] ?? "none") : "none",
          stroke: anchor ? (NODE_STATUS_COLORS[anchor.status] ?? NODE_UNKNOWN) : NODE_UNKNOWN,
          "stroke-width": "1",
        });
        const title = mk<SVGTitleElement>("title", {});
        title.textContent = anchor
          ? `${n.name} — ${anchor.status} (${hoursSinceLastPass(anchor.last_passed).toFixed(1)}h since last pass)`
          : `${n.name} — status unknown (not in anchor registry)`;
        el.appendChild(title);
        svg.appendChild(el);
        st.nodeEls.push({ id: n.id, jurisdiction: n.jurisdiction, cluster: idx, el });
      }
    }

    /* On-surface attribution (GL7 — the true source, named). */
    const credit = mk<SVGTextElement>("text", {
      x: "8", y: String(H - 8),
      "font-family": "'SF Mono', 'Cascadia Code', Consolas, ui-monospace, monospace",
      "font-size": "8.5", fill: COLORS.credit,
    });
    credit.textContent = showNodes
      ? "Country shapes: Natural Earth (public domain) · Polygons, not pins (GL1) · ◆ live anchor node · drag to rotate"
      : "Country shapes: Natural Earth (public domain) · Polygons, not pins (GL1) · drag to rotate";
    svg.appendChild(credit);

    host.appendChild(svg);

    /* --- projection ---------------------------------------------------- */

    function project(lon: number, lat: number): Pt {
      const lam = (lon - st.lambda) * DEG;
      const ph = lat * DEG;
      const ph0 = st.phi * DEG;
      const x = Math.cos(ph) * Math.sin(lam);
      const y = Math.cos(ph0) * Math.sin(ph) - Math.sin(ph0) * Math.cos(ph) * Math.cos(lam);
      const z = Math.sin(ph0) * Math.sin(ph) + Math.cos(ph0) * Math.cos(ph) * Math.cos(lam);
      return [CX + R * x, CY - R * y, z];
    }

    /**
     * Path for one ring on the visible hemisphere.
     * Long spans are subdivided so 110m borders curve smoothly. Points behind
     * the horizon are clamped radially onto the rim circle, so fills reach the
     * sphere edge cleanly along the rim (no seam chords). Fully hidden rings
     * are skipped entirely — a fully clamped ring would paint a false wedge.
     */
    function ringPath(ring: Ring): string {
      const pts: Pt[] = [];
      const n = ring.length;
      for (let i = 0; i < n; i++) {
        const [lon, lat] = ring[i];
        const [nlon, nlat] = ring[(i + 1) % n];
        pts.push(project(lon, lat));
        if (Math.abs(nlon - lon) >= 180) continue; // antimeridian: no subdivision
        const steps = Math.ceil(Math.max(Math.abs(nlon - lon), Math.abs(nlat - lat)) / 3);
        for (let s = 1; s < steps; s++) {
          pts.push(project(lon + ((nlon - lon) * s) / steps, lat + ((nlat - lat) * s) / steps));
        }
      }
      if (!pts.some((p) => p[2] > 0.01)) return "";

      let d = "";
      for (const [px, py, z] of pts) {
        let sx = px, sy = py;
        if (z <= 0) {
          // Push the point out to the rim along its own azimuth.
          const vx = px - CX, vy = py - CY;
          const len = Math.hypot(vx, vy) || 1;
          sx = CX + (vx / len) * R;
          sy = CY + (vy / len) * R;
        }
        d += `${d ? " L" : "M"} ${sx.toFixed(1)} ${sy.toFixed(1)}`;
      }
      return d + " Z";
    }

    function graticulePath(): string {
      let d = "";
      for (let lon = -180; lon < 180; lon += 30) {
        let pen = false;
        for (let lat = -90; lat <= 90; lat += 3) {
          const [x, y, z] = project(lon, lat);
          if (z > 0) { d += `${pen ? " L" : "M"} ${x.toFixed(1)} ${y.toFixed(1)}`; pen = true; }
          else pen = false;
        }
      }
      for (let lat = -60; lat <= 60; lat += 30) {
        let pen = false;
        for (let lon = -180; lon <= 180; lon += 3) {
          const [x, y, z] = project(lon, lat);
          if (z > 0) { d += `${pen ? " L" : "M"} ${x.toFixed(1)} ${y.toFixed(1)}`; pen = true; }
          else pen = false;
        }
      }
      return d;
    }

    /* --- paint --------------------------------------------------------- */

    function paintFrame() {
      for (const { rings, el } of st.countryPaths) {
        el.setAttribute("d", rings.map(ringPath).filter(Boolean).join(" "));
      }
      st.gratEl?.setAttribute("d", graticulePath());
      for (const { id, el } of st.labelEls) {
        const [x, y, z] = project(...JURISDICTIONS[id].anchor);
        el.setAttribute("x", x.toFixed(1));
        el.setAttribute("y", y.toFixed(1));
        el.style.display = z > 0.02 ? "" : "none";
      }
      /* Node cluster: two rows of diamonds beneath each jurisdiction anchor. */
      const perJ: Record<string, number> = {};
      for (const n of st.nodeEls) perJ[n.jurisdiction] = (perJ[n.jurisdiction] ?? 0) + 1;
      for (const { jurisdiction, cluster, el } of st.nodeEls) {
        const [x, y, z] = project(...JURISDICTIONS[jurisdiction].anchor);
        if (z <= 0.02) { el.style.display = "none"; continue; }
        const total = perJ[jurisdiction];
        const row = cluster >= Math.ceil(total / 2) ? 1 : 0;
        const inRow = row === 0 ? Math.ceil(total / 2) : total - Math.ceil(total / 2);
        const col = row === 0 ? cluster : cluster - Math.ceil(total / 2);
        const dx = (col - (inRow - 1) / 2) * 13;
        const dy = 16 + row * 12;
        el.setAttribute("transform", `translate(${(x + dx).toFixed(1)} ${(y + dy).toFixed(1)})`);
        el.style.display = "";
      }
    }

    /* --- interaction --------------------------------------------------- */

    function frame() {
      const now = performance.now();
      const hl = propsRef.current.highlight as Jurisdiction | undefined;
      if (!st.reducedMotion && !st.dragging) {
        if (hl && JURISDICTIONS[hl]) {
          /* A jurisdiction is lit — ease the globe to face it and hold there,
             so the highlight is never spun out of view. */
          const [tlon, tlat] = JURISDICTIONS[hl].anchor;
          const dLam = ((tlon - st.lambda + 540) % 360) - 180;
          st.lambda += dLam * 0.06;
          st.phi += (Math.max(-70, Math.min(70, tlat)) - st.phi) * 0.06;
        } else if (now >= st.resumeAt) {
          st.lambda -= SPIN_PER_FRAME;
        }
      }
      // Skip repaints when the view hasn't moved (idle, reduced motion).
      if (st.lambda !== st.lastLambda || st.phi !== st.lastPhi) {
        paintFrame();
        st.lastLambda = st.lambda;
        st.lastPhi = st.phi;
      }
      st.raf = requestAnimationFrame(frame);
    }

    function onDown(e: PointerEvent) {
      st.dragging = true;
      st.moved = 0;
      st.lastX = e.clientX;
      st.lastY = e.clientY;
      svg.setPointerCapture(e.pointerId);
    }
    function onMove(e: PointerEvent) {
      if (!st.dragging) return;
      const dx = e.clientX - st.lastX;
      const dy = e.clientY - st.lastY;
      st.moved += Math.abs(dx) + Math.abs(dy);
      st.lastX = e.clientX;
      st.lastY = e.clientY;
      st.lambda += dx / R / DEG;
      st.phi = Math.max(-70, Math.min(70, st.phi + dy / R / DEG));
    }
    function onUp(e: PointerEvent) {
      if (!st.dragging) return;
      st.dragging = false;
      st.resumeAt = performance.now() + RESUME_AFTER_MS;
      if (st.moved < 4) {
        // Treat as click — hit-test the jurisdiction layer.
        const target = document.elementFromPoint(e.clientX, e.clientY);
        const iso = target instanceof SVGPathElement ? target.dataset.jurisdiction : undefined;
        if (iso) propsRef.current.onSelect?.(iso);
      }
    }

    svg.addEventListener("pointerdown", onDown);
    svg.addEventListener("pointermove", onMove);
    svg.addEventListener("pointerup", onUp);

    st.raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(st.raf);
      svg.removeEventListener("pointerdown", onDown);
      svg.removeEventListener("pointermove", onMove);
      svg.removeEventListener("pointerup", onUp);
      host.removeChild(svg);
    };
  }, []);

  /* Re-paint fills when highlight/onSelect change (cheap; geometry untouched). */
  useEffect(() => {
    const st = stateRef.current;
    if (!st.countryPaths.length) return;
    for (const { id, el } of st.countryPaths) {
      const j = jurisdictionOf(id);
      if (!j) {
        el.style.cursor = "default";
        delete el.dataset.jurisdiction;
        continue;
      }
      const isHl = highlight === j;
      el.setAttribute(
        "fill",
        isHl ? COLORS.highlight : JURISDICTIONS[j].status === "measured" ? COLORS.measured : COLORS.blind,
      );
      el.setAttribute("stroke", isHl ? COLORS.highlight : COLORS.landEdge);
      el.setAttribute("stroke-width", isHl ? "1.2" : "0.6");
      el.setAttribute("class", isHl ? "gspc-globe-pulse" : "");
      el.style.cursor = onSelect ? "pointer" : "default";
      el.dataset.jurisdiction = j;
    }
    for (const { id, el } of st.labelEls) {
      el.setAttribute("fill", highlight === id ? COLORS.highlight : COLORS.label);
      el.setAttribute("font-weight", highlight === id ? "700" : "600");
    }
    /* Nodes: amber ring when their jurisdiction is lit, dimmed when another is. */
    for (const { id, jurisdiction, el } of st.nodeEls) {
      const anchor = ANCHOR_BY_ID.get(id);
      const base = anchor ? (NODE_STATUS_COLORS[anchor.status] ?? NODE_UNKNOWN) : NODE_UNKNOWN;
      const isHl = highlight === jurisdiction;
      el.setAttribute("stroke", isHl ? COLORS.highlight : base);
      el.setAttribute("stroke-width", isHl ? "1.8" : "1");
      el.style.opacity = highlight && !isHl ? "0.3" : "1";
    }
  }, [highlight, onSelect]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-[#04150e]">
      <style>{`
        @keyframes gspc-globe-pulse-kf { 0%, 100% { opacity: 1; } 50% { opacity: 0.55; } }
        .gspc-globe-pulse { animation: gspc-globe-pulse-kf 1.6s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .gspc-globe-pulse { animation: none; } }
      `}</style>
      <div ref={hostRef} />

      {/* Stats overlay */}
      {showStats && (
        <div className="absolute top-2 right-2 rounded-lg border border-emerald-500/20 bg-[#03110b]/90 px-3 py-2 font-mono text-[11px] backdrop-blur-sm">
          <div className="mb-1 font-semibold text-emerald-100/70">Coverage</div>
          {(Object.entries(JURISDICTIONS) as [Jurisdiction, JurisdictionMeta][]).map(([id, j]) => {
            const isHighlighted = highlight === id;
            const nodesHere = showNodes ? CONNECTED_NODES.filter((n) => n.jurisdiction === id) : [];
            const liveHere = nodesHere.filter((n) => ANCHOR_BY_ID.get(n.id)?.status === "live").length;
            return (
              <div
                key={id}
                className={`flex justify-between gap-4 ${
                  isHighlighted
                    ? "font-semibold text-amber-300"
                    : j.status === "measured"
                      ? "text-emerald-300"
                      : "text-red-300"
                }`}
              >
                <span>{id}</span>
                <span>
                  {j.status === "measured" ? `${j.cellCount} cells` : "blind"}
                  {nodesHere.length > 0 && (
                    <span className={liveHere === nodesHere.length ? "text-emerald-400" : "text-amber-300"}>
                      {` · ${liveHere}/${nodesHere.length}◆`}
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Highlight label */}
      {highlight && JURISDICTIONS[highlight as Jurisdiction] && (
        <div className="absolute bottom-6 left-2 rounded bg-[#03110b] px-2 py-1 font-mono text-[11px] text-amber-300 border border-amber-400/30">
          probing {highlight}
        </div>
      )}
    </div>
  );
}
