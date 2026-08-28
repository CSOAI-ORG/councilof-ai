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
