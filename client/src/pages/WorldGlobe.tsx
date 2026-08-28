import { useEffect, useRef, useState } from "react";
import { chargeSovereign } from "../lib/sovCharge";
import { askSovereign } from "../lib/sovAsk";
import { sovActions, describeActions } from "../lib/sovAgent";
import { flyAndConvene, drive } from "../lib/globeDrive";
import { REGIONS } from "../lib/locale";
import { Link } from "wouter";
import CouncilNav from "../components/CouncilNav";
import AISystemNotice from "../components/AISystemNotice";
import { LAYER0_NODES, PERSONA_TOURS, STATUS_COLOR, COUNTS, type Persona } from "../data/layer0Nodes";

// sovAgent region name → 3D globe REGIONS code + globe3d layer tag maps (module-level).
const REGION3D: Record<string, string> = { EU: "EU", UK: "UK", US: "US", CANADA: "CA", JAPAN: "JP", KOREA: "KR", CHINA: "CN", SINGAPORE: "SG", INDIA: "IN" };
const LAYER3D: Record<string, string> = { fw: "frameworks", council: "gov", watchdog: "cyber", ontology: "ontology", hive: "fortune" };

const GLOBE_GW = "/api";
const PLACE_HINTS: { re: RegExp; id: string }[] = [
  { re: /\beu\b|europe|brussels|german|france|spain|italy|ireland/i, id: "euaa" },
  { re: /fedramp|oscal|\bdc\b|washington/i, id: "fedramp" },
  { re: /\bus\b|usa|america|nist/i, id: "nist" },
  { re: /california|ccpa|cpra|sacramento/i, id: "ccpa" },
  { re: /new york|\bnyc\b|ll144/i, id: "nyc" },
  { re: /\buk\b|britain|london|england/i, id: "uk" },
  { re: /canada|aida|ottawa/i, id: "aida" },
  { re: /china|beijing|pipl/i, id: "pipl" },
  { re: /singapore/i, id: "sg" },
];
const GLOBE_IND = ["healthcare", "hospital", "clinical", "fintech", "finance", "banking", "insurance", "hr", "hiring", "recruiting", "education", "retail", "defense", "government", "pharma", "biotech", "energy", "telecom", "legal", "gaming", "crypto"];
async function globeChat(msg: string): Promise<string> { const res = await askSovereign(msg); return res.ok ? res.text : ""; }
async function globeGovern(q: string): Promise<any> { try { const r = await fetch(GLOBE_GW + "/govern?q=" + encodeURIComponent(q)); if (r.ok) { const d = await r.json(); if (d && d.matched) return d; } } catch (e) {} return null; }

// WorldGlobe - a living, layered, zero-dependency world globe. Auto-rotates (pure SVG
// orthographic projection), pins every framework temple at its real lat/long, layers
// the Council of AI, and lets you click any pin for its detail. No external deps.

type Pin = { id: string; name: string; region: string; lat: number; lng: number; color: string; href: string; note: string };
type HiveAccount = { id: string; name: string; type: string; region: string; country: string; hq: [number, number]; play: string; gap: number; maxGap: number; confidence: string; topUsp: string | null };
function hiveColor(h: HiveAccount): string {
  if (h.confidence === "n/a-authority") return "#38bdf8"; // regulator/authority - blue
  if (h.confidence === "verified") return "#34d399"; // real, cited governance posture - green
  return "#94a3b8"; // modeled/unconfirmed - grey
}
// Audit fix (2026-07-08): several real accounts share an identical or near-identical [lng,lat]
// (e.g. Citigroup/Goldman Sachs/Verizon all authored at the same Lower-Manhattan point) -- at
// world-globe zoom this stacks their dots exactly on top of each other, so only the last-rendered
// one is ever visible or clickable and the others are silently unreachable. Apply a small,
// deterministic (id-hash-seeded, so stable across reloads) offset to every member of a cluster
// after the first, spread in a ring so each stays clickable without moving anyone to a wrong city.
function deconflictHiveCoords(accounts: HiveAccount[]): HiveAccount[] {
  const seen = new Map<string, number>(); // "lng,lat" (rounded) -> count already placed
  const hashSeed = (id: string) => { let h = 0; for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0; return h; };
  return accounts.map((a) => {
    const key = a.hq[0].toFixed(2) + "," + a.hq[1].toFixed(2);
    const n = seen.get(key) || 0;
    seen.set(key, n + 1);
    if (n === 0) return a; // first one at this point keeps the real coordinate
    const angle = (hashSeed(a.id) % 360) * (Math.PI / 180);
    const ringRadius = 0.35 * n; // degrees -- small enough to stay visually "at" the same city
    const lng = a.hq[0] + ringRadius * Math.cos(angle);
    const lat = a.hq[1] + ringRadius * Math.sin(angle);
    return { ...a, hq: [lng, lat] as [number, number] };
  });
}
const FRAMEWORKS: Pin[] = [
  { id: "euaa", name: "EU AI Act", region: "EU", lat: 50.85, lng: 4.35, color: "#2563eb", href: "/readiness", note: "Transparency 2 Aug 2026; high-risk Dec 2027 (Omnibus). Brussels." },
  { id: "gdpr", name: "GDPR", region: "EU", lat: 50.85, lng: 4.36, color: "#1d4ed8", href: "/meok-law", note: "Data + automated-decision safeguards. Brussels." },
  { id: "coe", name: "Council of Europe AI Treaty", region: "EU", lat: 48.57, lng: 7.75, color: "#7c3aed", href: "/meok-law", note: "First binding AI human-rights treaty. Strasbourg." },
  { id: "oecd", name: "OECD AI Principles", region: "Global", lat: 48.85, lng: 2.35, color: "#0ea5e9", href: "/regions", note: "Soft-law baseline shaping allied policy. Paris." },
  { id: "iso", name: "ISO/IEC 42001", region: "GitHub", lat: 46.2, lng: 6.14, color: "#059669", href: "/temples", note: "AI management-system standard. Geneva." },
  { id: "nist", name: "NIST AI RMF", region: "US", lat: 39.14, lng: -77.22, color: "#dc2626", href: "/fedramp", note: "De-facto US risk-management baseline. Gaithersburg." },
  { id: "fedramp", name: "FedRAMP / OSCAL", region: "US", lat: 38.9, lng: -77.04, color: "#b91c1c", href: "/fedramp", note: "RFC-0024 machine-readable mandate, 30 Sep 2026. Washington DC." },
  { id: "ccpa", name: "CCPA / CPRA", region: "US", lat: 38.58, lng: -121.49, color: "#ea580c", href: "/regions", note: "Profiling + opt-out rights. Sacramento." },
  { id: "nyc", name: "NYC LL144", region: "US", lat: 40.71, lng: -74.0, color: "#f59e0b", href: "/sectors", note: "Annual AEDT bias-audit attestation. New York." },
  { id: "uk", name: "UK pro-innovation AI", region: "UK", lat: 51.5, lng: -0.12, color: "#9333ea", href: "/regions", note: "Principles-based, regulator-led. London." },
  { id: "aida", name: "Canada AIDA (C-27)", region: "Canada", lat: 45.42, lng: -75.7, color: "#e11d48", href: "/regions", note: "High-impact systems regime. Ottawa." },
  { id: "pipl", name: "China PIPL", region: "APAC", lat: 39.9, lng: 116.4, color: "#16a34a", href: "/meok-law", note: "Personal-information protection + algorithm rules. Beijing." },
  { id: "sg", name: "Singapore Model AI", region: "APAC", lat: 1.35, lng: 103.8, color: "#0d9488", href: "/regions", note: "Voluntary governance framework + testing. Singapore." },
];
