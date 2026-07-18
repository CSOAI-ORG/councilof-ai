"use client";

/**
 * sov-3d-map — Sovereign 3D Map of CSOAI Sites
 *
 * Real-world 3D map with sovereign sites overlaid as glowing markers.
 * Built on Leaflet + Three.js (we already use Leaflet in /go).
 * The sovereign.mom (Nick's farm) is the center.
 * All other sites radiate outward as sovereign hives.
 */

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import dynamic from "next/dynamic";

// ---- Sovereign sites (real-world coords) ----
// Each site = sovereign territory: farm, office, regulator, partner, agent, etc.
const SOVEREIGN_SITES = [
  {
    id: "sovereign-mom",
    name: "Sovereign Farm",
    lat: 53.96,
    lng: -1.08,
    type: "core",
    emoji: "🜏",
    color: "#fbbf24",
    radius: 28,
    description: "6.5-acre UK farm — sovereign substrate origin. Where the dragon sleeps.",
    meta: { sovereign_agents: 224, episode_cycles: 568, hours_alive: "24/7" },
  },
  {
    id: "csoai-london",
    name: "CSOAI Ltd (London)",
    lat: 51.5074,
    lng: -0.1278,
    type: "hq",
    emoji: "🏛️",
    color: "#3b82f6",
    radius: 18,
    description: "CSOAI Ltd HQ — Companies House 16939677.",
    meta: { entity: "UK Ltd", status: "Active" },
  },
  {
    id: "eu-ai-office",
    name: "EU AI Office (Brussels)",
    lat: 50.8466,
    lng: 4.3524,
    type: "regulator",
    emoji: "🇪🇺",
    color: "#06b6d4",
    radius: 16,
    description: "EU AI Act enforcement — Aug 2026 GPAI deadline.",
    meta: { framework: "EU AI Act", deadline: "2026-08-02" },
  },
  {
    id: "nist",
    name: "NIST AI RMF (Maryland)",
    lat: 39.1375,
    lng: -77.1927,
    type: "regulator",
    emoji: "🇺🇸",
    color: "#10b981",
    radius: 14,
    description: "NIST AI Risk Management Framework — 600-1 GenAI profile.",
    meta: { framework: "NIST AI RMF" },
  },
  {
    id: "iso-geneva",
    name: "ISO/IEC (Geneva)",
    lat: 46.2044,
    lng: 6.1432,
    type: "standards",
    emoji: "🌐",
    color: "#a855f7",
    radius: 14,
    description: "ISO/IEC 42001 (AI management), 42005 (impact assessment).",
    meta: { framework: "ISO 42001" },
  },
  {
    id: "enisa-athens",
    name: "ENISA (Athens)",
    lat: 37.9842,
    lng: 23.7351,
    type: "regulator",
    emoji: "🔒",
    color: "#f59e0b",
    radius: 12,
    description: "EU cybersecurity agency — NIS2 implementation.",
    meta: { framework: "NIS2" },
  },
  {
    id: "csa",
    name: "Cloud Security Alliance",
    lat: 47.6062,
    lng: -122.3321,
    type: "standards",
    emoji: "☁️",
    color: "#ec4899",
    radius: 12,
    description: "ATF (Agentic Trust Framework) — CSA-published.",
    meta: { framework: "ATF" },
  },
  {
    id: "owasp",
    name: "OWASP (Global)",
    lat: 39.7392,
    lng: -104.9903,
    type: "standards",
    emoji: "🛡️",
    color: "#84cc16",
    radius: 10,
    description: "OWASP Agentic Top 10 — agent security.",
    meta: { framework: "OWASP Agentic" },
  },
  {
    id: "cera",
    name: "Cera (Care)",
    lat: 51.5074,
    lng: -0.1278,
    type: "design-partner",
    emoji: "🏥",
    color: "#22d3ee",
    radius: 10,
    description: "Cera — care-sector AI Act design partner (target).",
    meta: { segment: "care" },
  },
  {
    id: "sap",
    name: "SAP (Enterprise)",
    lat: 49.4521,
    lng: 8.4351,
    type: "design-partner",
    emoji: "💼",
    color: "#22d3ee",
    radius: 10,
    description: "SAP — EU AI Act + DORA design partner (target).",
    meta: { segment: "enterprise" },
  },
  {
    id: "siemens",
    name: "Siemens (Industrial)",
    lat: 48.2628,
    lng: 11.4345,
    type: "design-partner",
    emoji: "🏭",
    color: "#22d3ee",
    radius: 10,
    description: "Siemens — AI Act + NIS2 design partner (target).",
    meta: { segment: "industrial" },
  },
];

// ---- 3D hubs (sovereign districts — virtual + physical) ----
const SOVEREIGN_HUBS = [
  { id: "koi", name: "koikeeper.ai", lat: 35.6762, lng: 139.6503, emoji: "🐟", color: "#06b6d4" },
  { id: "fish", name: "fishkeeper.ai", lat: -33.8688, lng: 151.2093, emoji: "🐠", color: "#06b6d4" },
  { id: "safety", name: "safetyof.ai", lat: 37.5665, lng: 126.9780, emoji: "🛡️", color: "#10b981" },
  { id: "agi", name: "agisafe.ai", lat: 1.3521, lng: 103.8198, emoji: "🦺", color: "#10b981" },
  { id: "landlaw", name: "landlaw.ai", lat: 40.7128, lng: -74.0060, emoji: "⚖️", color: "#fbbf24" },
  { id: "openpatent", name: "openpatent.ai", lat: 37.3861, lng: -122.0839, emoji: "📜", color: "#a855f7" },
  { id: "proofof", name: "proofof.ai", lat: 37.7749, lng: -122.4194, emoji: "🔐", color: "#3b82f6" },
  { id: "council", name: "councilof.ai", lat: 52.5200, lng: 13.4050, emoji: "🏛️", color: "#84cc16" },
  { id: "openmcp", name: "openmcp.ai", lat: 22.3193, lng: 114.1694, emoji: "🔌", color: "#22d3ee" },
  { id: "cobol", name: "cobolbridge.ai", lat: 41.8781, lng: -87.6298, emoji: "🏗️", color: "#f97316" },
];

// Custom sovereign marker icon (3D-styled divIcon)
function sovereignIcon(site: typeof SOVEREIGN_SITES[0]) {
  return typeof window !== "undefined" && (window as any).L
    ? (window as any).L.divIcon({
        className: "sovereign-marker",
        html: `<div style="
          width: ${site.radius * 2}px;
          height: ${site.radius * 2}px;
          border-radius: 50%;
          background: radial-gradient(circle, ${site.color}88 0%, ${site.color}22 60%, transparent 100%);
          border: 2px solid ${site.color};
          box-shadow: 0 0 ${site.radius}px ${site.color}88, inset 0 0 ${site.radius / 2}px ${site.color}44;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: ${site.radius * 0.8}px;
          line-height: 1;
          animation: sovereign-pulse 3s ease-in-out infinite;
        ">${site.emoji}</div>
        <style>
          @keyframes sovereign-pulse {
            0%, 100% { transform: scale(1); box-shadow: 0 0 ${site.radius}px ${site.color}88; }
            50% { transform: scale(1.1); box-shadow: 0 0 ${site.radius * 1.5}px ${site.color}cc; }
          }
        </style>`,
        iconSize: [site.radius * 2, site.radius * 2],
        iconAnchor: [site.radius, site.radius],
      })
    : null;
}

// The 3D globe overlay (Three.js canvas on top of Leaflet)
function ThreeGlobeOverlay({ sites }: { sites: typeof SOVEREIGN_SITES }) {
  const map = useMap();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current || typeof window === "undefined") return;

    // Lazy-load three.js so SSR doesn't break
    import("three").then((THREE) => {
      const canvas = canvasRef.current!;
      const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
      });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(window.devicePixelRatio);

      // Create overlay scene (transparent)
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.z = 5;

      // Glow ring at each site (3D billboard)
      sites.forEach((site) => {
        const ringGeo = new THREE.RingGeometry(0.05, 0.1, 32);
        const ringMat = new THREE.MeshBasicMaterial({
          color: site.color,
          transparent: true,
          opacity: 0.4,
          side: THREE.DoubleSide,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.set(
          ((site.lng + 180) / 360) * 8 - 4,
          ((90 - site.lat) / 180) * 4 - 2,
          0
        );
        scene.add(ring);
      });

      // Animate
      let frame = 0;
      const animate = () => {
        frame += 0.02;
        scene.children.forEach((child, i) => {
          if (child instanceof THREE.Mesh) {
            child.rotation.z = frame + i;
          }
        });
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
      };
      animate();

      return () => {
        renderer.dispose();
      };
    });
  }, [sites]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        pointerEvents: "none",
        zIndex: 400,
        opacity: 0.6,
      }}
    />
  );
}

export default function Sov3DMap() {
  const [selected, setSelected] = useState<typeof SOVEREIGN_SITES[0] | null>(null);
  const [view, setView] = useState<"map" | "globe">("map");

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh", background: "#0a0e27" }}>
      {/* Header */}
      <div style={{
        position: "absolute", top: 20, left: 20, right: 20, zIndex: 1000,
        background: "rgba(0,0,0,0.7)", padding: 16, borderRadius: 12,
        backdropFilter: "blur(10px)", border: "1px solid rgba(201,168,76,0.3)",
      }}>
        <h1 style={{ margin: 0, color: "#c9a84c", fontSize: "1.5rem" }}>
          🜏 SOVEREIGN SPACE — 3D MAP OF CSOAI TERRITORY
        </h1>
        <p style={{ margin: "4px 0 0", color: "#94a3b8", fontSize: "0.85rem" }}>
          {SOVEREIGN_SITES.length} core sites · {SOVEREIGN_HUBS.length} sovereign hubs · 33 hives · 13 layers · 224 agents live
        </p>
        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
          <button
            onClick={() => setView("map")}
            style={{
              background: view === "map" ? "#c9a84c" : "transparent",
              color: view === "map" ? "#0a0e27" : "#c9a84c",
              border: "1px solid #c9a84c", padding: "6px 12px",
              borderRadius: 6, cursor: "pointer", fontWeight: 700,
            }}
          >
            Map View
          </button>
          <button
            onClick={() => setView("globe")}
            style={{
              background: view === "globe" ? "#c9a84c" : "transparent",
              color: view === "globe" ? "#0a0e27" : "#c9a84c",
              border: "1px solid #c9a84c", padding: "6px 12px",
              borderRadius: 6, cursor: "pointer", fontWeight: 700,
            }}
          >
            3D Globe
          </button>
        </div>
      </div>

      {/* Legend */}
      <div style={{
        position: "absolute", bottom: 20, left: 20, zIndex: 1000,
        background: "rgba(0,0,0,0.7)", padding: 12, borderRadius: 8,
        backdropFilter: "blur(10px)", maxWidth: 280,
      }}>
        <strong style={{ color: "#fbbf24" }}>Sovereign Sites</strong>
        {["core", "hq", "regulator", "standards", "design-partner"].map((t) => {
          const sitesOfType = SOVEREIGN_SITES.filter((s) => s.type === t);
          return (
            <div key={t} style={{ marginTop: 4, fontSize: "0.8rem" }}>
              <span style={{
                display: "inline-block", width: 10, height: 10, borderRadius: "50%",
                background: sitesOfType[0]?.color || "#94a3b8", marginRight: 6,
                boxShadow: `0 0 8px ${sitesOfType[0]?.color || "#94a3b8"}88`,
              }} />
              {t} ({sitesOfType.length})
            </div>
          );
        })}
        <strong style={{ color: "#fbbf24", display: "block", marginTop: 10 }}>Sovereign Hubs</strong>
        {SOVEREIGN_HUBS.map((h) => (
          <div key={h.id} style={{ fontSize: "0.75rem", marginTop: 2 }}>
            <span style={{ marginRight: 4 }}>{h.emoji}</span> {h.name}
          </div>
        ))}
      </div>

      {/* Selected site detail */}
      {selected && (
        <div style={{
          position: "absolute", bottom: 20, right: 20, zIndex: 1000,
          background: "rgba(0,0,0,0.85)", padding: 16, borderRadius: 12,
          backdropFilter: "blur(10px)", border: `2px solid ${selected.color}`,
          maxWidth: 340,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
            <div>
              <div style={{ fontSize: "2rem" }}>{selected.emoji}</div>
              <h3 style={{ margin: "4px 0", color: selected.color }}>{selected.name}</h3>
            </div>
            <button
              onClick={() => setSelected(null)}
              style={{ background: "transparent", color: "#94a3b8", border: "none", cursor: "pointer", fontSize: "1.2rem" }}
            >
              ✕
            </button>
          </div>
          <p style={{ fontSize: "0.85rem", color: "#cbd5e1", marginTop: 8 }}>
            {selected.description}
          </p>
          <div style={{ marginTop: 10, fontSize: "0.8rem" }}>
            <strong style={{ color: "#94a3b8" }}>Coordinates:</strong>{" "}
            <code style={{ background: "rgba(0,0,0,0.4)", padding: "2px 6px", borderRadius: 4 }}>
              {selected.lat.toFixed(4)}, {selected.lng.toFixed(4)}
            </code>
          </div>
          {Object.entries(selected.meta).map(([k, v]) => (
            <div key={k} style={{ marginTop: 4, fontSize: "0.8rem" }}>
              <strong style={{ color: "#94a3b8" }}>{k}:</strong> {v}
            </div>
          ))}
        </div>
      )}

      {/* Leaflet map */}
      {view === "map" && (
        <MapContainer
          center={[53.96, -1.08]}
          zoom={3}
          minZoom={2}
          maxZoom={10}
          style={{ height: "100vh", width: "100vw" }}
          worldCopyJump
        >
          {/* Dark satellite-style tiles (CartoDB Dark Matter) */}
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            subdomains="abcd"
            maxZoom={19}
          />

          {/* Sovereign core sites (larger markers) */}
          {SOVEREIGN_SITES.map((site) => (
            <CircleMarker
              key={site.id}
              center={[site.lat, site.lng]}
              radius={site.radius}
              pathOptions={{
                color: site.color,
                fillColor: site.color,
                fillOpacity: 0.3,
                weight: 2,
              }}
              eventHandlers={{
                click: () => setSelected(site),
              }}
            >
              <Popup>
                <strong>{site.emoji} {site.name}</strong>
                <br />
                {site.description}
              </Popup>
            </CircleMarker>
          ))}

          {/* Sovereign hubs (smaller markers) */}
          {SOVEREIGN_HUBS.map((hub) => (
            <CircleMarker
              key={hub.id}
              center={[hub.lat, hub.lng]}
              radius={6}
              pathOptions={{
                color: hub.color,
                fillColor: hub.color,
                fillOpacity: 0.6,
                weight: 1,
              }}
              eventHandlers={{
                click: () => setSelected({
                  ...hub,
                  type: "hub",
                  radius: 6,
                  description: `Sovereign hub: ${hub.name}`,
                  meta: {},
                } as any),
              }}
            >
              <Popup>
                <strong>{hub.emoji} {hub.name}</strong>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      )}

      {/* 3D Globe View (placeholder - using Three.js sphere) */}
      {view === "globe" && <SovGlobeView sites={SOVEREIGN_SITES} hubs={SOVEREIGN_HUBS} />}
    </div>
  );
}

// 3D Globe View using Three.js sphere + site markers
function SovGlobeView({
  sites,
  hubs,
}: {
  sites: typeof SOVEREIGN_SITES;
  hubs: typeof SOVEREIGN_HUBS;
}) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    let renderer: any;

    import("three").then((THREE) => {
      const mount = mountRef.current!;
      const w = mount.clientWidth;
      const h = mount.clientHeight;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0a0e27);

      const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
      camera.position.z = 5;

      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(w, h);
      mount.appendChild(renderer.domElement);

      // Globe (dark sphere with grid texture)
      const globeGeo = new THREE.SphereGeometry(2, 64, 64);
      const globeMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        emissive: 0x0a0e27,
        metalness: 0.3,
        roughness: 0.7,
      });
      const globe = new THREE.Mesh(globeGeo, globeMat);
      scene.add(globe);

      // Lights
      scene.add(new THREE.AmbientLight(0xffffff, 0.3));
      const sun = new THREE.DirectionalLight(0xfbbf24, 0.7);
      sun.position.set(5, 5, 5);
      scene.add(sun);

      // Convert lat/lng to 3D position on sphere
      const toPosition = (lat: number, lng: number) => {
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lng + 180) * (Math.PI / 180);
        const r = 2.05;
        return new THREE.Vector3(
          -r * Math.sin(phi) * Math.cos(theta),
          r * Math.cos(phi),
          r * Math.sin(phi) * Math.sin(theta)
        );
      };

      // Add site markers + lines to sovereign.mom
      const allSites = [...sites, ...hubs.map((h) => ({ ...h, type: "hub", radius: 0.05, description: h.name, meta: {} }))];
      const sovereignMom = toPosition(53.96, -1.08);

      allSites.forEach((s: any) => {
        const pos = toPosition(s.lat, s.lng);
        const color = s.color || "#fbbf24";

        // Glowing marker
        const dotGeo = new THREE.SphereGeometry(s.type === "core" ? 0.08 : 0.04, 16, 16);
        const dotMat = new THREE.MeshBasicMaterial({ color });
        const dot = new THREE.Mesh(dotGeo, dotMat);
        dot.position.copy(pos);
        scene.add(dot);

        // Line to sovereign.mom (the origin)
        if (s.type !== "core") {
          const lineGeo = new THREE.BufferGeometry().setFromPoints([sovereignMom, pos]);
          const lineMat = new THREE.LineBasicMaterial({
            color,
            transparent: true,
            opacity: 0.3,
          });
          scene.add(new THREE.Line(lineGeo, lineMat));
        }
      });

      // Auto-rotate
      let frame = 0;
      const animate = () => {
        frame += 0.003;
        globe.rotation.y = frame;
        scene.children.forEach((c) => {
          if (c.type === "Line" || (c as any).isLine) {
            // Keep lines attached to rotating globe
          }
        });
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
      };
      animate();

      // Cleanup
      return () => {
        mount.removeChild(renderer.domElement);
        renderer.dispose();
      };
    });

    return () => {
      if (renderer) {
        // best-effort cleanup
      }
    };
  }, [sites, hubs]);

  return (
    <div ref={mountRef} style={{ width: "100vw", height: "100vh" }}>
      <div style={{
        position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        color: "#fbbf24", fontSize: "1.2rem", textAlign: "center", pointerEvents: "none",
      }}>
        <div style={{ fontSize: "3rem" }}>🜏</div>
        <div>Sovereign Space — auto-rotating globe</div>
      </div>
    </div>
  );
}
