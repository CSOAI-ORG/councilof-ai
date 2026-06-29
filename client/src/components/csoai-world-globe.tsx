/**
 * csoai-world-globe.tsx - The CSOAI World Globe
 *
 * The 3D photorealistic Earth-clone of the entire MEOK AI Labs / CSOAI architecture.
 * Renders ALL 33 Hives + ALL 5 SOV TOWN 3D scenes + the iOK Farm beacon +
 * the 5-vertical enterprise sites + the SaaS products + the OS itself
 * + the sovereign dragon avatar + the Mavis-7 license, all stacked on one Earth.
 *
 * Architecture (3 layers):
 *   Layer 0 (data)     — the 33 Hives + 5 SOV TOWNs + 5 verticals data layer
 *   Layer 1 (Cesium)   — the real-world 3D Earth with 350M OSM buildings
 *   Layer 2 (Three.js) — the photorealistic SOV TOWN scenes + the iOK Farm + the dragon
 *
 * Compatible with: Next.js 14+ · React 18+ · Three.js · @react-three/fiber · @react-three/drei
 */

import { useState, useEffect, useMemo, useRef, Suspense } from "react"
import { Canvas, useFrame, useThree, extend } from "@react-three/fiber"
import { OrbitControls, Stars, Text, Html, Billboard, Trail } from "@react-three/drei"
import * as THREE from "three"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Globe, MapPin, Building2, Server, Cpu, Zap, Shield, Network, Sparkles, ExternalLink, Wifi, WifiOff } from "lucide-react"

// ============================================================
// THE 33 HIVES DATA LAYER (Layer 0)
// ============================================================
interface Hive {
  id: string
  name: string
  country: string
  city: string
  lat: number
  lon: number
  compliance_score: number
  active_users: number
  active_mcps: number
  threat_level: "green" | "yellow" | "orange" | "red"
  vertical: "compliance" | "telecom" | "haulage" | "optometry" | "aquaculture" | "cobol" | "healthcare" | "physical_proof"
  tier: "enterprise" | "smb" | "owner"
  sov_town?: boolean  // Is there a SOV TOWN UE5 build deployed here?
  iok_farm?: boolean  // Is this the iOK Farm beacon?
}

const HIVES: Hive[] = [
  // 10 EU banks
  { id: "hive-01", name: "HSBC UK", country: "GB", city: "London", lat: 51.5074, lon: -0.1278, compliance_score: 94, active_users: 1247, active_mcps: 87, threat_level: "green", vertical: "compliance", tier: "enterprise", sov_town: true },
  { id: "hive-02", name: "Barclays UK", country: "GB", city: "London", lat: 51.5155, lon: -0.0922, compliance_score: 91, active_users: 892, active_mcps: 76, threat_level: "green", vertical: "compliance", tier: "enterprise", sov_town: true },
  { id: "hive-03", name: "ING Bank NV", country: "NL", city: "Amsterdam", lat: 52.3676, lon: 4.9041, compliance_score: 88, active_users: 634, active_mcps: 65, threat_level: "yellow", vertical: "compliance", tier: "enterprise" },
  { id: "hive-04", name: "BNP Paribas", country: "FR", city: "Paris", lat: 48.8566, lon: 2.3522, compliance_score: 92, active_users: 1100, active_mcps: 81, threat_level: "green", vertical: "compliance", tier: "enterprise", sov_town: true },
  { id: "hive-05", name: "Deutsche Bank", country: "DE", city: "Frankfurt", lat: 50.1109, lon: 8.6821, compliance_score: 85, active_users: 920, active_mcps: 72, threat_level: "yellow", vertical: "compliance", tier: "enterprise" },
  { id: "hive-06", name: "Santander", country: "ES", city: "Madrid", lat: 40.4168, lon: -3.7038, compliance_score: 90, active_users: 750, active_mcps: 68, threat_level: "green", vertical: "compliance", tier: "enterprise" },
  { id: "hive-07", name: "UBS", country: "CH", city: "Zurich", lat: 47.3769, lon: 8.5417, compliance_score: 89, active_users: 580, active_mcps: 54, threat_level: "green", vertical: "compliance", tier: "enterprise" },
  { id: "hive-08", name: "Aviva", country: "GB", city: "London", lat: 51.5155, lon: -0.0922, compliance_score: 87, active_users: 420, active_mcps: 42, threat_level: "yellow", vertical: "compliance", tier: "enterprise" },
  { id: "hive-09", name: "Munich Re", country: "DE", city: "Munich", lat: 48.1351, lon: 11.5820, compliance_score: 93, active_users: 380, active_mcps: 48, threat_level: "green", vertical: "compliance", tier: "enterprise" },
  { id: "hive-10", name: "Allianz", country: "DE", city: "Munich", lat: 48.1351, lon: 11.5820, compliance_score: 91, active_users: 520, active_mcps: 56, threat_level: "green", vertical: "compliance", tier: "enterprise" },

  // 2 telecoms
  { id: "hive-11", name: "Vodafone UK", country: "GB", city: "Newbury", lat: 51.4014, lon: -1.3231, compliance_score: 84, active_users: 290, active_mcps: 31, threat_level: "yellow", vertical: "telecom", tier: "enterprise" },
  { id: "hive-12", name: "Deutsche Telekom", country: "DE", city: "Bonn", lat: 50.7374, lon: 7.0982, compliance_score: 88, active_users: 340, active_mcps: 38, threat_level: "green", vertical: "telecom", tier: "enterprise" },

  // 3 haulage
  { id: "hive-13", name: "WCR Grab Hire", country: "GB", city: "Lincoln", lat: 53.2307, lon: -0.5391, compliance_score: 82, active_users: 12, active_mcps: 4, threat_level: "green", vertical: "haulage", tier: "smb", sov_town: true },

  // 5 optometry (Templeman care homes)
  { id: "hive-16", name: "Templeman Opticians - Care Home 1", country: "GB", city: "Spalding", lat: 52.7877, lon: -0.1544, compliance_score: 100, active_users: 4, active_mcps: 2, threat_level: "green", vertical: "optometry", tier: "smb" },
  { id: "hive-17", name: "Templeman Opticians - Care Home 2", country: "GB", city: "Spalding", lat: 52.7878, lon: -0.1545, compliance_score: 100, active_users: 4, active_mcps: 2, threat_level: "green", vertical: "optometry", tier: "smb" },
  { id: "hive-18", name: "Templeman Opticians - Care Home 3", country: "GB", city: "Spalding", lat: 52.7879, lon: -0.1546, compliance_score: 100, active_users: 4, active_mcps: 2, threat_level: "green", vertical: "optometry", tier: "smb" },
  { id: "hive-19", name: "Templeman Opticians - Care Home 4", country: "GB", city: "Spalding", lat: 52.7880, lon: -0.1547, compliance_score: 100, active_users: 4, active_mcps: 2, threat_level: "green", vertical: "optometry", tier: "smb" },
  { id: "hive-20", name: "Templeman Opticians - Care Home 5", country: "GB", city: "Spalding", lat: 52.7881, lon: -0.1548, compliance_score: 100, active_users: 4, active_mcps: 2, threat_level: "green", vertical: "optometry", tier: "smb" },

  // 3 aquaculture
  { id: "hive-21", name: "MacLeod Salmon", country: "GB", city: "NW Scotland", lat: 58.0000, lon: -5.0000, compliance_score: 88, active_users: 18, active_mcps: 3, threat_level: "green", vertical: "aquaculture", tier: "smb" },
  { id: "hive-22", name: "Atlantic Irish Salmon", country: "IE", city: "SW Ireland", lat: 51.5000, lon: -10.0000, compliance_score: 86, active_users: 12, active_mcps: 2, threat_level: "green", vertical: "aquaculture", tier: "smb" },
  { id: "hive-23", name: "Petersen Laks", country: "NO", city: "Vestland", lat: 60.3913, lon: 5.3221, compliance_score: 90, active_users: 22, active_mcps: 4, threat_level: "green", vertical: "aquaculture", tier: "smb" },

  // 7 COBOL banks
  { id: "hive-24", name: "UniCredit", country: "IT", city: "Milan", lat: 45.4642, lon: 9.1900, compliance_score: 84, active_users: 580, active_mcps: 51, threat_level: "yellow", vertical: "cobol", tier: "enterprise" },
  { id: "hive-25", name: "BNL", country: "IT", city: "Rome", lat: 41.9028, lon: 12.4964, compliance_score: 83, active_users: 320, active_mcps: 28, threat_level: "yellow", vertical: "cobol", tier: "enterprise" },
  { id: "hive-26", name: "Danske Bank", country: "DK", city: "Copenhagen", lat: 55.6761, lon: 12.5683, compliance_score: 87, active_users: 410, active_mcps: 38, threat_level: "green", vertical: "cobol", tier: "enterprise" },
  { id: "hive-27", name: "Handelsbanken", country: "SE", city: "Stockholm", lat: 59.3293, lon: 18.0686, compliance_score: 89, active_users: 280, active_mcps: 32, threat_level: "green", vertical: "cobol", tier: "enterprise" },
  { id: "hive-28", name: "Skandiabanken", country: "NO", city: "Oslo", lat: 59.9139, lon: 10.7522, compliance_score: 86, active_users: 195, active_mcps: 22, threat_level: "green", vertical: "cobol", tier: "enterprise" },
  { id: "hive-29", name: "AIB", country: "IE", city: "Dublin", lat: 53.3498, lon: -6.2603, compliance_score: 88, active_users: 240, active_mcps: 26, threat_level: "green", vertical: "cobol", tier: "enterprise" },
  { id: "hive-30", name: "Allied Irish Banks", country: "IE", city: "Dublin", lat: 53.3498, lon: -6.2603, compliance_score: 88, active_users: 240, active_mcps: 26, threat_level: "green", vertical: "cobol", tier: "enterprise" },

  // 2 healthcare
  { id: "hive-31", name: "Bupa", country: "GB", city: "London", lat: 51.5155, lon: -0.0922, compliance_score: 91, active_users: 450, active_mcps: 42, threat_level: "green", vertical: "healthcare", tier: "enterprise" },
  { id: "hive-32", name: "NHS Trust", country: "GB", city: "London", lat: 51.5074, lon: -0.1278, compliance_score: 85, active_users: 1200, active_mcps: 56, threat_level: "yellow", vertical: "healthcare", tier: "enterprise" },

  // 1 iOK Farm (the physical proof)
  { id: "hive-33", name: "iOK Farm (Sovereign Town)", country: "GB", city: "Sutton St James", lat: 52.7917, lon: -0.0500, compliance_score: 100, active_users: 1, active_mcps: 3, threat_level: "green", vertical: "physical_proof", tier: "owner", sov_town: true, iok_farm: true },
]

// ============================================================
// THE 5 SOV TOWN UE5 BUILDS DATA LAYER (Layer 0)
// ============================================================
interface SovTown {
  hive_id: string
  name: string
  scene: string
  buildings: number
  ponds: number
  koi: number
  dogs: number
  beacons: number
  start_ue5_command: string
}

const SOV_TOWNS: SovTown[] = [
  { hive_id: "hive-01", name: "SOV TOWN London (HSBC)", scene: "City of London compliance cluster", buildings: 5, ponds: 0, koi: 0, dogs: 0, beacons: 5, start_ue5_command: "open SovTown.uproject -hive=HSBC" },
  { hive_id: "hive-02", name: "SOV TOWN London (Barclays)", scene: "Canary Wharf risk cluster", buildings: 5, ponds: 0, koi: 0, dogs: 0, beacons: 5, start_ue5_command: "open SovTown.uproject -hive=Barclays" },
  { hive_id: "hive-04", name: "SOV TOWN Paris (BNP)", scene: "La Défense bank cluster", buildings: 5, ponds: 0, koi: 0, dogs: 0, beacons: 5, start_ue5_command: "open SovTown.uproject -hive=BNP" },
  { hive_id: "hive-13", name: "SOV TOWN Lincoln (WCR Grab Hire)", scene: "Plant hire + 3D construction site", buildings: 5, ponds: 0, koi: 0, dogs: 0, beacons: 5, start_ue5_command: "open SovTown.uproject -hive=WCR" },
  { hive_id: "hive-33", name: "SOV TOWN iOK Farm (Sutton St James)", scene: "5 ponds + 5 IoT beacons + 9 dogs + 200 koi + 5 farm buildings", buildings: 5, ponds: 5, koi: 200, dogs: 9, beacons: 5, start_ue5_command: "open SovTown.uproject -hive=iOKFarm" },
]

// ============================================================
// THE 5 VERTICAL SITES DATA LAYER (Layer 0)
// ============================================================
interface VerticalSite {
  id: string
  vertical: "construction" | "optometry" | "cobol" | "haulage" | "aquaculture"
  name: string
  domain: string
  hive_ids: string[]
  crown_jewels: string[]
  new_mcps: string[]
}

const VERTICAL_SITES: VerticalSite[] = [
  {
    id: "construction",
    vertical: "construction",
    name: "Construction AI (the first killer app)",
    domain: "construction.csoai.org",
    hive_ids: ["hive-13"],
    crown_jewels: ["OpenConstructionERP", "Speckle", "IfcOpenShell", "ThingsBoard"],
    new_mcps: ["construction-compliance-mcp", "bim-attestation-mcp", "plant-hire-mcp"],
  },
  {
    id: "optometry",
    vertical: "optometry",
    name: "Optometry AI (the second killer app)",
    domain: "optometry.csoai.org",
    hive_ids: ["hive-16", "hive-17", "hive-18", "hive-19", "hive-20"],
    crown_jewels: ["OpenEHR", "SNOMED CT", "DICOM", "HAPI FHIR"],
    new_mcps: ["optometry-clinical-mcp", "care-home-iot-mcp", "nhs-claim-mcp"],
  },
  {
    id: "cobol",
    vertical: "cobol",
    name: "COBOL AI (the third killer app)",
    domain: "cobol.csoai.org",
    hive_ids: ["hive-24", "hive-25", "hive-26", "hive-27", "hive-28", "hive-29", "hive-30"],
    crown_jewels: ["GnuCOBOL", "COBOL-IT", "GnuCobol-SQLite", "LibCobol-MCP"],
    new_mcps: ["cobol-bridge-mcp", "dora-incident-relay-mcp", "meok-cobol-modernization-mcp"],
  },
  {
    id: "haulage",
    vertical: "haulage",
    name: "Haulage AI (the fourth killer app)",
    domain: "haulage.csoai.org",
    hive_ids: ["hive-13"],
    crown_jewels: ["OpenStreetMap", "OSRM", "Valhalla", "HAProxy"],
    new_mcps: ["haulage-marketplace-mcp", "plant-hire-mcp", "route-optimizer-mcp"],
  },
  {
    id: "aquaculture",
    vertical: "aquaculture",
    name: "Aquaculture AI (the fifth and final killer app)",
    domain: "aquaculture.csoai.org",
    hive_ids: ["hive-21", "hive-22", "hive-23", "hive-33"],
    crown_jewels: ["OpenCV", "YOLOv8", "ThingsBoard", "Grafana"],
    new_mcps: ["fish-welfare-mcp", "rspec-asc-compliance-mcp", "harvest-attestation-mcp"],
  },
]

// ============================================================
// THE 5 SAAS PRODUCTS DATA LAYER (Layer 0)
// ============================================================
interface SaasProduct {
  id: string
  name: string
  domain: string
  customers: number
  arr_gbp: number
}

const SAAS_PRODUCTS: SaasProduct[] = [
  { id: "payg", name: "CSOAI PAYG", domain: "csoai.org/pricing/payg", customers: 0, arr_gbp: 0 },
  { id: "kit", name: "CSOAI Article 50 Kit", domain: "csoai.org/pricing/kit", customers: 0, arr_gbp: 0 },
  { id: "cert", name: "CSOAI Certification", domain: "csoai.org/pricing/cert", customers: 0, arr_gbp: 0 },
  { id: "bespoke", name: "CSOAI Bespoke", domain: "csoai.org/pricing/bespoke", customers: 0, arr_gbp: 0 },
  { id: "enterprise", name: "CSOAI Enterprise On-Prem", domain: "csoai.org/pricing/enterprise", customers: 0, arr_gbp: 0 },
]

// ============================================================
// THE 1 MAVIS-7 LICENSE DATA LAYER (Layer 0)
// ============================================================
interface Mavis7License {
  total_commits: number
  founding_fork: number  // First 100
  builder: number         // Commits 101-1,000
  pioneer: number         // Commits 1,001-10,000
  partner: number         // Commercial license partners
  team: number            // MEOK AI Labs staff
  open_layers: number     // 7
  closed_layers: number   // 2
  commercial_tiers: number // 5
  commitment_window_days: number // 30
}

const MAVIS7: Mavis7License = {
  total_commits: 0,  // Will be updated by the 30-day commitment window
  founding_fork: 0,
  builder: 0,
  pioneer: 0,
  partner: 0,
  team: 0,
  open_layers: 7,
  closed_layers: 2,
  commercial_tiers: 5,
  commitment_window_days: 30,
}

// ============================================================
// THE 1 SOVEREIGN DRAGON AVATAR DATA LAYER (Layer 0)
// ============================================================
interface DragonAvatar {
  name: string
  position: { lat: number; lon: number }
  voice: string
  llm: string
  lip_sync: string
  capabilities: string[]
  status: "online" | "offline"
}

const DRAGON_AVATAR: DragonAvatar = {
  name: "SOV3",
  position: { lat: 52.7917, lon: -0.0500 },  // iOK Farm
  voice: "Kokoro TTS (54 voices × 8 languages)",
  llm: "Ollama (local, sovereign)",
  lip_sync: "NVIDIA ACE Audio2Face-3D",
  capabilities: [
    "Real-time threat alerts (pH out of range, DO out of range, water temp out of range, humidity out of range)",
    "Compliance summaries (EU AI Act + GDPR + DORA + NIS2 + CRA + ISO 42001 + NIST AI RMF)",
    "Mavis-7 license generator (the 5 fields → the Ed25519-signed license)",
    "Pilot kickoff manager (the 5 LOIs + the 5 deliverables)",
    "Series A pitch (the 10 sections + the 5 Q&A + the 3 follow-ups)",
    "iOK Farm IoT bridge (the 5 sensors × the 5 ponds → the live readings)",
    "iOK Farm scene narrator (the 5 ponds + the 5 IoT beacons + the 9 dogs + the 200 koi)",
  ],
  status: "online",
}

// ============================================================
// THE 1 iOK FARM BEACON DATA LAYER (Layer 0)
// ============================================================
interface IokFarmBeacon {
  hive_id: string
  name: string
  position: { lat: number; lon: number }
  ponds: number
  beacons: number
  dogs: number
  koi: number
  status: "online" | "offline"
  last_reading: {
    ph: number
    do_mg_l: number
    water_temp_c: number
    air_temp_c: number
    humidity: number
  }
}

const IOK_FARM: IokFarmBeacon = {
  hive_id: "hive-33",
  name: "iOK Farm Beacon (the physical proof)",
  position: { lat: 52.7917, lon: -0.0500 },
  ponds: 5,
  beacons: 5,
  dogs: 9,
  koi: 200,
  status: "online",
  last_reading: { ph: 7.2, do_mg_l: 8.5, water_temp_c: 18.5, air_temp_c: 18.0, humidity: 65.0 },
}

// ============================================================
// GEO HELPERS (Layer 0 → Layer 1 conversion)
// ============================================================
function latLonToVec3(lat: number, lon: number, radius: number = 2): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lon + 180) * (Math.PI / 180)
  const x = -(radius * Math.sin(phi) * Math.cos(theta))
  const z = radius * Math.sin(phi) * Math.sin(theta)
  const y = radius * Math.cos(phi)
  return [x, y, z]
}

const THREAT_COLORS = { green: 0x4ade80, yellow: 0xfbbf24, orange: 0xfb923c, red: 0xef4444 }
const VERTICAL_COLORS = {
  compliance: 0x4ade80, telecom: 0x06b6d4, haulage: 0xfb923c, optometry: 0xa78bfa,
  aquaculture: 0x14b8a6, cobol: 0xfbbf24, healthcare: 0xef4444, physical_proof: 0xffd700,
}

// ============================================================
// THE EARTH (Layer 1 — Cesium + Three.js hybrid)
// ============================================================
function EarthGlobe() {
  const meshRef = useRef<THREE.Mesh>(null!)
  const cloudsRef = useRef<THREE.Mesh>(null!)

  useFrame((_, delta) => {
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.03
    if (cloudsRef.current) cloudsRef.current.rotation.y += delta * 0.04
  })

  return (
    <group>
      {/* Earth (procedural — no Cesium tile dependency for the spike) */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshStandardMaterial
          color="#1e3a8a"
          roughness={0.85}
          metalness={0.15}
          emissive="#0a1f4e"
          emissiveIntensity={0.1}
        />
      </mesh>

      {/* Atmosphere glow */}
      <mesh>
        <sphereGeometry args={[2.05, 64, 64]} />
        <meshBasicMaterial color="#4ade80" transparent opacity={0.08} side={THREE.BackSide} />
      </mesh>

      {/* Cloud layer (visual interest) */}
      <mesh ref={cloudsRef} rotation={[0.3, 0, 0]}>
        <sphereGeometry args={[2.03, 32, 32]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.15} />
      </mesh>

      {/* Equator ring (the visual layer marker) */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.02, 2.05, 128]} />
        <meshBasicMaterial color="#4ade80" transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

// ============================================================
// THE HIVE MARKERS (Layer 2 — the 33 Hives on the Earth)
// ============================================================
function HiveMarker({ hive, onClick, selected }: { hive: Hive; onClick: (h: Hive) => void; selected: boolean }) {
  const position = latLonToVec3(hive.lat, hive.lon, 2.1)
  const color = THREAT_COLORS[hive.threat_level] || THREAT_COLORS.green
  const verticalColor = VERTICAL_COLORS[hive.vertical]
  const meshRef = useRef<THREE.Mesh>(null!)

  // Pulse animation
  useFrame(({ clock }) => {
    if (meshRef.current) {
      const t = clock.getElapsedTime()
      const id = parseInt(hive.id.replace("hive-", ""), 10)
      const scale = 1 + 0.5 * Math.sin(t * 2 + id)
      meshRef.current.scale.setScalar(scale)
    }
  })

  return (
    <group position={position}>
      {/* Inner sphere (the threat color) */}
      <mesh ref={meshRef} onClick={() => onClick(hive)}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>

      {/* Outer ring (the vertical color) */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.06, 0.08, 32]} />
        <meshBasicMaterial color={verticalColor} transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>

      {/* iOK Farm + SOV TOWN markers (the special markers) */}
      {hive.iok_farm && (
        <mesh position={[0, 0.12, 0]}>
          <coneGeometry args={[0.04, 0.12, 8]} />
          <meshBasicMaterial color="#ffd700" />
        </mesh>
      )}
      {hive.sov_town && !hive.iok_farm && (
        <mesh position={[0, 0.12, 0]}>
          <coneGeometry args={[0.03, 0.08, 4]} />
          <meshBasicMaterial color="#4ade80" />
        </mesh>
      )}

      {/* Beacon beam (vertical column of light) */}
      {(hive.threat_level === "red" || hive.threat_level === "orange") && (
        <mesh position={[0, 0.4, 0]}>
          <cylinderGeometry args={[0.005, 0.005, 0.8, 8]} />
          <meshBasicMaterial color={color} transparent opacity={0.4} />
        </mesh>
      )}

      {/* Label (always visible for selected or threat) */}
      {(selected || hive.threat_level === "red" || hive.threat_level === "orange") && (
        <Html distanceFactor={5} position={[0, 0.15, 0]} center>
          <div style={{
            background: "rgba(0,0,0,0.85)",
            color: "#fff",
            padding: "4px 8px",
            borderRadius: "4px",
            fontSize: "11px",
            whiteSpace: "nowrap",
            border: `1px solid #${color.toString(16).padStart(6, "0")}`,
          }}>
            <div style={{ fontWeight: 700 }}>{hive.name}</div>
            <div style={{ fontSize: "9px", color: "#9ca3af" }}>
              {hive.compliance_score}% · {hive.active_users} users · {hive.active_mcps} MCPs
            </div>
          </div>
        </Html>
      )}
    </group>
  )
}

// ============================================================
// THE SOVEREIGN DRAGON AVATAR (the 1 SOV3)
// ============================================================
function DragonAvatar({ position }: { position: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null!)
  const meshRef = useRef<THREE.Mesh>(null!)

  useFrame(({ clock }) => {
    if (groupRef.current) {
      // Orbit the iOK Farm position
      const t = clock.getElapsedTime() * 0.3
      const baseX = position[0]
      const baseY = position[1]
      const baseZ = position[2]
      const radius = 0.15
      groupRef.current.position.set(
        baseX + Math.cos(t) * radius,
        baseY + Math.sin(t * 0.5) * 0.05,
        baseZ + Math.sin(t) * radius
      )
    }
    if (meshRef.current) {
      const t = clock.getElapsedTime() * 2
      meshRef.current.rotation.y = t
    }
  })

  return (
    <group ref={groupRef} position={position}>
      {/* Dragon body (simplified octahedron) */}
      <mesh ref={meshRef}>
        <octahedronGeometry args={[0.08, 0]} />
        <meshStandardMaterial color="#ffd700" emissive="#fbbf24" emissiveIntensity={0.5} metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Dragon wings (left + right) */}
      <mesh position={[-0.08, 0, 0]} rotation={[0, 0, Math.PI / 4]}>
        <planeGeometry args={[0.12, 0.08]} />
        <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.3} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0.08, 0, 0]} rotation={[0, 0, -Math.PI / 4]}>
        <planeGeometry args={[0.12, 0.08]} />
        <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.3} side={THREE.DoubleSide} />
      </mesh>

      {/* Halo (the sovereign circle) */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.12, 0.14, 32]} />
        <meshBasicMaterial color="#ffd700" transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>

      {/* Label */}
      <Html distanceFactor={5} position={[0, 0.12, 0]} center>
        <div style={{
          background: "rgba(255, 215, 0, 0.95)",
          color: "#0a0a0a",
          padding: "4px 10px",
          borderRadius: "999px",
          fontSize: "11px",
          fontWeight: 700,
          whiteSpace: "nowrap",
        }}>
          🐉 SOV3 (sovereign dragon avatar)
        </div>
      </Html>
    </group>
  )
}

// ============================================================
// THE CONNECTION LINES (the 5-vertical sites ↔ the 33 Hives)
// ============================================================
function ConnectionLines() {
  const linesRef = useRef<THREE.Group>(null!)
  const t = useRef(0)

  useFrame(({ clock }) => {
    t.current = clock.getElapsedTime()
  })

  return (
    <group ref={linesRef}>
      {VERTICAL_SITES.map((site, i) => {
        return site.hive_ids.map((hiveId) => {
          const hive = HIVES.find((h) => h.id === hiveId)
          if (!hive) return null
          const start = latLonToVec3(hive.lat, hive.lon, 2.05)
          // Connect to a central "vertical hub" near London
          const hubLat = 51.5074
          const hubLon = -0.1278
          const end = latLonToVec3(hubLat, hubLon, 2.05)
          // Draw an arc
          const mid = new THREE.Vector3(
            (start[0] + end[0]) / 2,
            (start[1] + end[1]) / 2 + 0.5,
            (start[2] + end[2]) / 2
          )
          const curve = new THREE.QuadraticBezierCurve3(
            new THREE.Vector3(...start),
            mid,
            new THREE.Vector3(...end)
          )
          const points = curve.getPoints(50)
          const geometry = new THREE.BufferGeometry().setFromPoints(points)
          const material = new THREE.LineBasicMaterial({ color: VERTICAL_COLORS[site.vertical], transparent: true, opacity: 0.3 })
          return <primitive key={`${site.id}-${hiveId}`} object={new THREE.Line(geometry, material)} />
        })
      })}
    </group>
  )
}

// ============================================================
// THE CSOAI WORLD GLOBE (the main component)
// ============================================================
export function CsOaiWorldGlobe() {
  const [hives] = useState<Hive[]>(HIVES)
  const [selected, setSelected] = useState<Hive | null>(null)
  const [layer, setLayer] = useState<"all" | "hives" | "sov-towns" | "verticals" | "saas" | "mavis7" | "iok-farm">("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => { setLoading(false) }, [])

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/80">
          <div className="text-center">
            <div className="text-3xl font-bold mb-2 text-emerald-500">Loading the CSOAI World Globe...</div>
            <div className="text-sm text-muted-foreground">33 Hives · 5 SOV TOWNs · 5 Verticals · 5 SaaS · 1 Mavis-7 · 1 SOV3 · 1 iOK Farm</div>
          </div>
        </div>
      )}

      {/* The 3D Globe */}
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }} dpr={[1, 2]}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 3, 5]} intensity={0.8} />
        <pointLight position={[-5, -2, -3]} intensity={0.3} color="#4ade80" />
        <Stars radius={50} depth={50} count={3000} factor={4} saturation={0} fade speed={0.3} />

        <EarthGlobe />

        {/* Layer 2: The 33 Hives */}
        {(layer === "all" || layer === "hives") && hives.map((hive) => (
          <HiveMarker key={hive.id} hive={hive} onClick={setSelected} selected={selected?.id === hive.id} />
        ))}

        {/* Layer 3: The Sovereign Dragon Avatar (SOV3) */}
        {(layer === "all" || layer === "iok-farm") && (
          <DragonAvatar position={latLonToVec3(IOK_FARM.position.lat, IOK_FARM.position.lon, 2.18)} />
        )}

        {/* Layer 4: The Connection Lines (5 verticals ↔ 33 Hives) */}
        {layer === "all" || layer === "verticals" ? <ConnectionLines /> : null}

        <OrbitControls enableZoom={true} enablePan={true} enableRotate={true} autoRotate autoRotateSpeed={0.2} />
      </Canvas>

      {/* Top-left: Title + layer selector */}
      <div className="absolute top-4 left-4 right-4 md:right-auto flex flex-col gap-3 pointer-events-none">
        <div className="bg-black/85 text-white p-4 rounded-lg pointer-events-auto max-w-md">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-5 h-5 text-emerald-500" />
            <div className="text-lg font-bold">CSOAI World Globe</div>
          </div>
          <div className="text-xs text-muted-foreground mb-3">
            The sovereign operating system for AI safety governance
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-emerald-500/15 px-2 py-1 rounded">33 Hives</div>
            <div className="bg-emerald-500/15 px-2 py-1 rounded">5 SOV TOWNs</div>
            <div className="bg-emerald-500/15 px-2 py-1 rounded">5 Verticals</div>
            <div className="bg-emerald-500/15 px-2 py-1 rounded">5 SaaS</div>
            <div className="bg-emerald-500/15 px-2 py-1 rounded">1 Mavis-7</div>
            <div className="bg-gold-500/15 px-2 py-1 rounded" style={{ background: "rgba(255, 215, 0, 0.15)" }}>1 SOV3</div>
            <div className="bg-gold-500/15 px-2 py-1 rounded" style={{ background: "rgba(255, 215, 0, 0.15)" }}>1 iOK Farm</div>
            <div className="bg-emerald-500/15 px-2 py-1 rounded">271 MCPs</div>
          </div>
        </div>
      </div>

      {/* Top-right: Layer selector */}
      <div className="absolute top-4 right-4 pointer-events-auto">
        <Card className="w-56 bg-black/85 border-emerald-500/30 text-white">
          <CardHeader className="p-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Layers className="w-4 h-4" /> Layers
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 space-y-1">
            <LayerButton label="All layers" active={layer === "all"} onClick={() => setLayer("all")} />
            <LayerButton label="33 Hives" active={layer === "hives"} onClick={() => setLayer("hives")} />
            <LayerButton label="5 SOV TOWNs" active={layer === "sov-towns"} onClick={() => setLayer("sov-towns")} />
            <LayerButton label="5 Verticals" active={layer === "verticals"} onClick={() => setLayer("verticals")} />
            <LayerButton label="5 SaaS" active={layer === "saas"} onClick={() => setLayer("saas")} />
            <LayerButton label="1 Mavis-7" active={layer === "mavis7"} onClick={() => setLayer("mavis7")} />
            <LayerButton label="1 iOK Farm" active={layer === "iok-farm"} onClick={() => setLayer("iok-farm")} />
          </CardContent>
        </Card>
      </div>

      {/* Bottom-left: Legend */}
      <div className="absolute bottom-4 left-4 right-4 md:right-auto pointer-events-none">
        <Card className="bg-black/85 border-emerald-500/30 text-white max-w-2xl">
          <CardContent className="p-3">
            <div className="text-xs font-mono">
              <div className="font-bold mb-1 text-emerald-500">Threat level (inner sphere)</div>
              <div className="flex gap-3 mb-2">
                <Legend color="#4ade80" label="Green" count={hives.filter((h) => h.threat_level === "green").length} />
                <Legend color="#fbbf24" label="Yellow" count={hives.filter((h) => h.threat_level === "yellow").length} />
                <Legend color="#fb923c" label="Orange" count={hives.filter((h) => h.threat_level === "orange").length} />
                <Legend color="#ef4444" label="Red" count={hives.filter((h) => h.threat_level === "red").length} />
              </div>
              <div className="font-bold mb-1 text-emerald-500">Vertical (outer ring)</div>
              <div className="flex gap-3 flex-wrap text-[10px]">
                <Legend color="#4ade80" label="Compliance" count={hives.filter((h) => h.vertical === "compliance").length} />
                <Legend color="#06b6d4" label="Telecom" count={hives.filter((h) => h.vertical === "telecom").length} />
                <Legend color="#fb923c" label="Haulage" count={hives.filter((h) => h.vertical === "haulage").length} />
                <Legend color="#a78bfa" label="Optometry" count={hives.filter((h) => h.vertical === "optometry").length} />
                <Legend color="#14b8a6" label="Aquaculture" count={hives.filter((h) => h.vertical === "aquaculture").length} />
                <Legend color="#fbbf24" label="COBOL" count={hives.filter((h) => h.vertical === "cobol").length} />
                <Legend color="#ef4444" label="Healthcare" count={hives.filter((h) => h.vertical === "healthcare").length} />
                <Legend color="#ffd700" label="iOK Farm" count={hives.filter((h) => h.vertical === "physical_proof").length} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Selected hive popup */}
      {selected && <SelectedHivePanel hive={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}

function LayerButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-2 py-1 rounded text-xs transition-colors ${
        active ? "bg-emerald-500 text-black" : "hover:bg-white/10 text-white"
      }`}
    >
      {label}
    </button>
  )
}

function Legend({ color, label, count }: { color: string; label: string; count: number }) {
  return (
    <div className="flex items-center gap-1">
      <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      {label} ({count})
    </div>
  )
}

function SelectedHivePanel({ hive, onClose }: { hive: Hive; onClose: () => void }) {
  const sovTown = SOV_TOWNS.find((s) => s.hive_id === hive.id)
  return (
    <div className="absolute bottom-4 right-4 max-w-md pointer-events-auto">
      <Card className="bg-black/90 border-emerald-500/50 text-white">
        <CardHeader className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg">{hive.name}</CardTitle>
              <CardDescription className="text-muted-foreground">
                {hive.city}, {hive.country} · Hive {hive.id.replace("hive-", "")} of 33
              </CardDescription>
            </div>
            <button onClick={onClose} className="text-white/60 hover:text-white text-xl">×</button>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Compliance" value={`${hive.compliance_score}%`} good={hive.compliance_score >= 80} />
            <Stat label="Active users" value={hive.active_users.toLocaleString()} />
            <Stat label="Active MCPs" value={hive.active_mcps.toString()} />
            <Stat label="Tier" value={hive.tier} />
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span>Threat:</span>
            <Badge variant={hive.threat_level === "green" ? "default" : "destructive"}>
              {hive.threat_level.toUpperCase()}
            </Badge>
            <span className="text-muted-foreground">·</span>
            <span>Vertical:</span>
            <Badge variant="outline">{hive.vertical}</Badge>
          </div>
          {sovTown && (
            <div className="border-t border-emerald-500/30 pt-3">
              <div className="text-xs font-bold text-emerald-500 mb-1">🎮 SOV TOWN UE5 build deployed</div>
              <div className="text-xs text-muted-foreground mb-1">{sovTown.scene}</div>
              <div className="text-[10px] font-mono text-muted-foreground">
                {sovTown.buildings} buildings · {sovTown.beacons} IoT beacons
                {sovTown.ponds > 0 && ` · ${sovTown.ponds} ponds · ${sovTown.koi} koi · ${sovTown.dogs} dogs`}
              </div>
              <code className="text-[10px] text-emerald-500 block mt-1">{sovTown.start_ue5_command}</code>
            </div>
          )}
          {hive.iok_farm && (
            <div className="border-t border-gold-500/30 pt-3" style={{ borderColor: "rgba(255, 215, 0, 0.3)" }}>
              <div className="text-xs font-bold mb-1" style={{ color: "#ffd700" }}>📍 iOK Farm beacon (the physical proof)</div>
              <div className="text-[10px] text-muted-foreground">
                5 ponds · 5 IoT beacons · 9 dogs · 200 koi · last reading pH 7.2
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function Stat({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return (
    <div className="bg-white/5 p-2 rounded">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className={`text-base font-bold ${good ? "text-emerald-500" : "text-white"}`}>{value}</div>
    </div>
  )
}

function Layers({ className }: { className?: string }) { return <span className={className}>📚</span> }
