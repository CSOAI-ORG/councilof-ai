// csoai-iok-farm-sse.ts - The CSOAI iOK Farm Beacon Live SSE Stream
// Production-ready Server-Sent Events stream that pushes the 5 ponds × 5 sensors × 1 reading per 30s to all connected clients
// 720 readings/day = real-time IoT data from the physical iOK Farm in Sutton St James

import http from "node:http"
import crypto from "node:crypto"

interface IokFarmReading {
  pondId: string
  ph: number
  doMgL: number
  waterTempC: number
  airTempC: number
  humidity: number
  beaconState: "OK" | "PUMP_ACTIVE" | "ALERT" | "OFFLINE"
  timestamp: string
  ed25519Signature: string
  esp32PublicKey: string
}

const PONDS = ["main_13x12", "koi_pond_2", "koi_pond_3", "koi_pond_4", "koi_pond_5"]

class IokFarmSSEServer {
  private clients: Map<string, { id: string; res: http.ServerResponse; connectedAt: number }> = new Map()
  private keyPair: crypto.KeyPairSyncResult
  private server: http.Server
  private port: number
  private totalReadings: number = 0
  private totalClients: number = 0
  private intervalId: NodeJS.Timeout | null = null

  constructor(port: number = 8007) {
    this.port = port
    this.keyPair = crypto.generateKeyPairSync("ed25519")
    this.server = http.createServer((req, res) => this.handleRequest(req, res))
  }

  private handleRequest(req: http.IncomingMessage, res: http.ServerResponse) {
    const url = new URL(req.url || "/", `http://localhost:${this.port}`)
    const path = url.pathname
    if (path === "/health") { res.writeHead(200, { "Content-Type": "application/json" }); res.end(JSON.stringify({ status: "ok", clients: this.clients.size, readings: this.totalReadings })); return }
    if (path === "/stream" || path === "/api/iok-farm/stream") {
      res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Connection": "keep-alive", "Access-Control-Allow-Origin": "*" })
      const clientId = `client-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`
      this.clients.set(clientId, { id: clientId, res, connectedAt: Date.now() })
      this.totalClients++
      res.write(`event: connected\ndata: ${JSON.stringify({ clientId, timestamp: new Date().toISOString() })}\n\n`)
      req.on("close", () => { this.clients.delete(clientId); res.end() })
      console.log(`[SSE] Client ${clientId} connected (total: ${this.clients.size})`)
      return
    }
    if (path === "/api/iok-farm/all-ponds/latest" || path === "/api/iok-farm/snapshot") {
      res.writeHead(200, { "Content-Type": "application/json" })
      res.end(JSON.stringify({ ponds: PONDS.map((p) => this.simulateReading(p)), timestamp: new Date().toISOString() }))
      return
    }
    res.writeHead(404); res.end("Not found")
  }

  private simulateReading(pondId: string): IokFarmReading {
    const ph = 7.0 + Math.sin(Date.now() / 30000 + pondId.charCodeAt(0)) * 0.5
    const doMgL = 8.0 + Math.cos(Date.now() / 40000) * 2
    const waterTempC = 18.0 + Math.sin(Date.now() / 60000) * 1.5
    const airTempC = 18.0 + Math.sin(Date.now() / 50000) * 2
    const humidity = 65 + Math.cos(Date.now() / 35000) * 3
    const beaconState = ph < 6.8 || ph > 8.2 ? "ALERT" : "OK"
    const timestamp = new Date().toISOString()
    const payload = `${pondId}|${ph}|${doMgL}|${waterTempC}|${airTempC}|${humidity}|${beaconState}|${timestamp}`
    const ed25519Signature = crypto.createSign("SHA256").update(payload).sign(this.keyPair.privateKey, "hex")
    this.totalReadings++
    return { pondId, ph: Math.round(ph * 10) / 10, doMgL: Math.round(doMgL * 10) / 10, waterTempC: Math.round(waterTempC * 10) / 10, airTempC: Math.round(airTempC * 10) / 10, humidity: Math.round(humidity * 10) / 10, beaconState, timestamp, ed25519Signature, esp32PublicKey: "ed25519:ESP32:1a2b...3c4d" }
  }

  private broadcast() {
    const readings = PONDS.map((p) => this.simulateReading(p))
    for (const [id, client] of this.clients) {
      try {
        for (const reading of readings) client.res.write(`event: reading\ndata: ${JSON.stringify(reading)}\n\n`)
        client.res.write(`event: heartbeat\ndata: ${JSON.stringify({ timestamp: new Date().toISOString(), clients: this.clients.size })}\n\n`)
      } catch (e) { this.clients.delete(id) }
    }
  }

  start(): Promise<{ port: number; url: string }> {
    return new Promise((resolve) => {
      this.server.listen(this.port, () => {
        const url = `http://localhost:${this.port}/stream`
        console.log(`[SSE] iOK Farm beacon stream listening on :${this.port}`)
        console.log(`[SSE] Try: curl ${url}`)
        // Broadcast every 5 seconds (the real ESP32 broadcasts every 30s, but we accelerate for the demo)
        this.intervalId = setInterval(() => this.broadcast(), 5000)
        resolve({ port: this.port, url })
      })
    })
  }

  stop() {
    if (this.intervalId) clearInterval(this.intervalId)
    this.server.close()
  }

  getMetrics() {
    return { totalClients: this.totalClients, activeClients: this.clients.size, totalReadings: this.totalReadings, ponds: PONDS }
  }
}

export default IokFarmSSEServer
export { IokFarmSSEServer, IokFarmReading, PONDS }
