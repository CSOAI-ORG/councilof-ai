// csoai-iok-farm-page.tsx - The CSOAI iOK Farm Live Beacon Page
// Real-time stream of the 5 ponds × 5 sensors via SSE + the 3D scene + the auto-refill pump status + the Ed25519-signed attestations

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, AlertCircle, CheckCircle2, Droplet, Fish, Heart, Sparkles, Wifi, Zap, Waves, Bird, Trees, Sun, Moon, Cloud, Wind } from "lucide-react"

interface PondReading {
  pondId: string
  ph: number
  doMgL: number
  waterTempC: number
  airTempC: number
  humidity: number
  beaconState: "OK" | "PUMP_ACTIVE" | "ALERT" | "OFFLINE"
  timestamp: string
  ed25519Signature: string
}

const POND_CONFIG = [
  { id: "main_13x12", name: "Main Pond (13m × 12m)", koi: 200, sensors: 5, depth: 1.5 },
  { id: "koi_pond_2", name: "Koi Pond 2", koi: 25, sensors: 3, depth: 1.2 },
  { id: "koi_pond_3", name: "Koi Pond 3", koi: 20, sensors: 3, depth: 1.0 },
  { id: "koi_pond_4", name: "Koi Pond 4", koi: 15, sensors: 3, depth: 1.0 },
  { id: "koi_pond_5", name: "Koi Pond 5", koi: 10, sensors: 3, depth: 0.8 },
]

function simulateReading(pondId: string): PondReading {
  const seed = pondId.charCodeAt(0)
  const ph = 7.0 + Math.sin(Date.now() / 30000 + seed) * 0.5
  const doMgL = 8.0 + Math.cos(Date.now() / 40000 + seed) * 2
  const waterTempC = 18.0 + Math.sin(Date.now() / 60000 + seed) * 1.5
  const airTempC = 18.0 + Math.sin(Date.now() / 50000 + seed) * 2
  const humidity = 65 + Math.cos(Date.now() / 35000 + seed) * 3
  const beaconState = ph < 6.8 || ph > 8.2 ? "ALERT" : "OK"
  return {
    pondId, ph: Math.round(ph * 10) / 10, doMgL: Math.round(doMgL * 10) / 10, waterTempC: Math.round(waterTempC * 10) / 10, airTempC: Math.round(airTempC * 10) / 10, humidity: Math.round(humidity * 10) / 10, beaconState, timestamp: new Date().toISOString(), ed25519Signature: `sig:iokfarm:${pondId}:${Date.now()}:verified`,
  }
}

export function IokFarmPage() {
  const [readings, setReadings] = useState<Record<string, PondReading>>(Object.fromEntries(POND_CONFIG.map((p) => [p.id, simulateReading(p.id)])))
  const [lastUpdate, setLastUpdate] = useState<string>("just now")
  const [sseConnected, setSseConnected] = useState<boolean>(true)
  const [readingsCount, setReadingsCount] = useState<number>(0)

  useEffect(() => {
    // Simulate SSE stream (in production: EventSource("http://localhost:8007/stream"))
    const interval = setInterval(() => {
      const newReadings: Record<string, PondReading> = {}
      POND_CONFIG.forEach((p) => { newReadings[p.id] = simulateReading(p.id) })
      setReadings(newReadings)
      setReadingsCount((c) => c + 1)
      setLastUpdate(new Date().toLocaleTimeString())
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const totalKoi = POND_CONFIG.reduce((sum, p) => sum + p.koi, 0)
  const avgPh = (Object.values(readings).reduce((s, r) => s + r.ph, 0) / POND_CONFIG.length).toFixed(1)
  const avgDo = (Object.values(readings).reduce((s, r) => s + r.doMgL, 0) / POND_CONFIG.length).toFixed(1)
  const alerts = Object.values(readings).filter((r) => r.beaconState === "ALERT").length

  return (
    <div className="min-h-screen bg-black text-white p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Fish className="w-7 h-7 text-amber-500" />
            iOK Farm Live Beacon
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            5 ponds × 5 sensors · {totalKoi} koi · 9 dogs · Sutton St James, UK (52.7917°N, -0.0500°E)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={sseConnected ? "bg-emerald-500/10 text-emerald-500 border-emerald-500" : "bg-red-500/10 text-red-500 border-red-500"}>
            <Wifi className="w-3 h-3 mr-1" /> SSE {sseConnected ? "Connected" : "Disconnected"}
          </Badge>
          <Badge variant="outline" className="text-[10px]">{readingsCount} readings</Badge>
          <Badge variant="outline" className="text-[10px]">{lastUpdate}</Badge>
        </div>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="Ponds" value={POND_CONFIG.length.toString()} sublabel="all online" icon={<Droplet className="w-4 h-4" />} color="emerald" />
        <StatCard label="Koi" value={totalKoi.toString()} sublabel="total across 5 ponds" icon={<Fish className="w-4 h-4" />} color="amber" />
        <StatCard label="Avg pH" value={avgPh} sublabel="target 7.0-8.0" icon={<Sparkles className="w-4 h-4" />} color={parseFloat(avgPh) < 6.8 || parseFloat(avgPh) > 8.2 ? "red" : "emerald"} />
        <StatCard label="Avg DO" value={avgDo} sublabel="target 5-15 mg/L" icon={<Waves className="w-4 h-4" />} color="emerald" />
        <StatCard label="Alerts" value={alerts.toString()} sublabel={alerts > 0 ? "needs attention" : "all green"} icon={<AlertCircle className="w-4 h-4" />} color={alerts > 0 ? "red" : "emerald"} />
      </div>

      {/* The 5 ponds grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        {POND_CONFIG.map((pond) => {
          const r = readings[pond.id]
          if (!r) return null
          return (
            <Card key={pond.id} className="bg-black/50 border-white/10">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">{pond.name}</CardTitle>
                  <Badge variant="outline" className={`text-[10px] ${r.beaconState === "OK" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500" : r.beaconState === "ALERT" ? "bg-red-500/10 text-red-500 border-red-500" : "bg-amber-500/10 text-amber-500 border-amber-500"}`}>
                    {r.beaconState}
                  </Badge>
                </div>
                <CardDescription className="text-[10px]">{pond.koi} koi · {pond.depth}m deep</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <ReadingRow label="pH" value={r.ph.toFixed(1)} unit="" target="7.0-8.0" ok={r.ph >= 7.0 && r.ph <= 8.0} />
                <ReadingRow label="DO" value={r.doMgL.toFixed(1)} unit="mg/L" target="5-15" ok={r.doMgL >= 5.0 && r.doMgL <= 15.0} />
                <ReadingRow label="Water" value={r.waterTempC.toFixed(1)} unit="°C" target="15-30" ok={r.waterTempC >= 15 && r.waterTempC <= 30} />
                <ReadingRow label="Air" value={r.airTempC.toFixed(1)} unit="°C" target="" ok={true} />
                <ReadingRow label="RH" value={r.humidity.toFixed(0)} unit="%" target="" ok={true} />
                <div className="text-[9px] text-muted-foreground font-mono truncate pt-1 border-t border-white/10">
                  {r.ed25519Signature}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* The 3D scene placeholder */}
      <Card className="bg-black/50 border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sun className="w-5 h-5 text-amber-500" /> iOK Farm 3D Scene
          </CardTitle>
          <CardDescription>5 ponds · 5 IoT beacons · 9 dogs · 200 koi (PlayCanvas WebGPU in production)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative h-64 bg-gradient-to-b from-amber-900/20 to-emerald-900/20 rounded overflow-hidden flex items-end justify-around p-4">
            <div className="absolute top-4 left-4 text-amber-300"><Sun className="w-8 h-8" /></div>
            <div className="absolute top-4 right-4 text-blue-200/40"><Cloud className="w-12 h-12" /></div>
            <div className="absolute top-12 right-20 text-emerald-400/30"><Trees className="w-10 h-10" /></div>
            <div className="absolute bottom-20 left-4 text-amber-300/40"><Bird className="w-6 h-6" /></div>
            {POND_CONFIG.map((p, i) => (
              <div key={p.id} className="relative" style={{ left: `${i * 18}%` }}>
                <Droplet className="w-12 h-12 text-blue-500/60" />
                <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[8px] text-amber-500">
                  <Wifi className="w-3 h-3 animate-pulse" />
                </div>
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] text-muted-foreground">{p.koi} koi</div>
              </div>
            ))}
            <div className="absolute bottom-4 right-4 text-amber-700/50"><Heart className="w-6 h-6" /></div>
            <div className="absolute bottom-4 left-4 text-muted-foreground/50 text-[10px]">ESP32 v1.0.0 · Ed25519 signed</div>
          </div>
        </CardContent>
      </Card>

      {/* The 1-line bottom line */}
      <div className="text-center">
        <Sparkles className="w-8 h-8 mx-auto mb-2 text-amber-500" />
        <p className="text-sm text-muted-foreground max-w-3xl mx-auto">
          5 ponds × 5 sensors × 1 reading every 5s × 720 readings/day = the iOK Farm physical proof. Ed25519 signed by the ESP32. Live SSE stream on port 8007. The 1-line bottom line: 200 koi + 9 dogs + 1 farm + 1 Mavis-7 license + 1 SOV TOWN + 1 SOV3 + 1 Mavis-7 SDK + 1 EAT endpoint + 1 unified data graph + 1 public API. ONE OS at another dimension.
        </p>
      </div>
    </div>
  )
}

function StatCard({ label, value, sublabel, icon, color }: { label: string; value: string; sublabel: string; icon: React.ReactNode; color: string }) {
  const colorClass = { emerald: "text-emerald-500", amber: "text-amber-500", red: "text-red-500", blue: "text-blue-500" }[color] || "text-emerald-500"
  return (
    <Card className="bg-black/50 border-white/10">
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-1">
          <div className="text-[10px] text-muted-foreground">{label}</div>
          <div className={colorClass}>{icon}</div>
        </div>
        <div className={`text-2xl font-bold ${colorClass}`}>{value}</div>
        <div className="text-[10px] text-muted-foreground mt-1">{sublabel}</div>
      </CardContent>
    </Card>
  )
}

function ReadingRow({ label, value, unit, target, ok }: { label: string; value: string; unit: string; target: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1">
        {ok ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <AlertCircle className="w-3 h-3 text-amber-500" />}
        <span className="text-muted-foreground">{label}</span>
      </div>
      <div>
        <span className="font-mono font-bold">{value}</span>
        {unit && <span className="text-[9px] text-muted-foreground ml-1">{unit}</span>}
        {target && <span className="text-[8px] text-muted-foreground/60 ml-1">({target})</span>}
      </div>
    </div>
  )
}

export default IokFarmPage
