// csoai-websocket-server.ts - The CSOAI EAT WebSocket Server
// Streams EAT responses in real-time to all connected clients
// Powers the live dashboard + the live simulations + the live Mavis-7 commits + the live iOK Farm beacon readings

import http from "node:http"
import { WebSocketServer, WebSocket } from "ws"
import { EAT_ENDPOINT } from "./csoai-eat-endpoint"

interface ConnectedClient {
  id: string
  socket: WebSocket
  type: "dashboard" | "simulation" | "eatchat" | "mavis7" | "iok_farm"
  subscribedTopics: Set<string>
  connectedAt: number
}

class CSOAIWebSocketServer {
  private wss: WebSocketServer
  private server: http.Server
  private clients: Map<string, ConnectedClient> = new Map()
  private messageCount: number = 0
  private keyPair: any

  constructor(port: number = 8005) {
    this.keyPair = require("node:crypto").generateKeyPairSync("ed25519")
    this.server = http.createServer((req, res) => {
      if (req.url === "/health") { res.writeHead(200); res.end(JSON.stringify({ status: "ok", clients: this.clients.size })); return }
      res.writeHead(404); res.end()
    })
    this.wss = new WebSocketServer({ server: this.server })
    this.wss.on("connection", (socket, req) => this.handleConnection(socket, req))
    this.server.listen(port, () => console.log(`[WS] EAT WebSocket server listening on :${port}`))
  }

  private handleConnection(socket: WebSocket, req: http.IncomingMessage) {
    const clientId = `client-${Date.now()}-${require("node:crypto").randomBytes(4).toString("hex")}`
    const url = new URL(req.url || "/", `http://localhost:8005`)
    const type = (url.searchParams.get("type") || "dashboard") as ConnectedClient["type"]
    const topics = new Set<string>((url.searchParams.get("topics") || "").split(",").filter(Boolean))
    const client: ConnectedClient = { id: clientId, socket, type, subscribedTopics: topics, connectedAt: Date.now() }
    this.clients.set(clientId, client)
    this.send(socket, { type: "welcome", clientId, serverTime: new Date().toISOString() })
    socket.on("message", (data) => this.handleMessage(client, data.toString()))
    socket.on("close", () => this.clients.delete(clientId))
    console.log(`[WS] Client ${clientId} connected (type=${type}, topics=${Array.from(topics).join(",")})`)
  }

  private handleMessage(client: ConnectedClient, message: string) {
    try {
      const msg = JSON.parse(message)
      this.messageCount++
      // Handle EAT request from the client
      if (msg.type === "eat" && msg.action && msg.query) {
        EAT_ENDPOINT.handle({ action: msg.action, query: msg.query, context: msg.context }).then((response) => {
          this.send(client.socket, { type: "eat_response", requestId: msg.requestId, response })
        })
      }
    } catch (e) { console.error(`[WS] Error: ${e}`) }
  }

  private send(socket: WebSocket, data: any) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(data))
    }
  }

  // Broadcast a topic update to all subscribed clients
  broadcast(topic: string, data: any) {
    const payload = JSON.stringify({ type: "broadcast", topic, data, timestamp: new Date().toISOString() })
    for (const client of this.clients.values()) {
      if (client.subscribedTopics.has(topic) || client.subscribedTopics.has("*")) {
        if (client.socket.readyState === WebSocket.OPEN) client.socket.send(payload)
      }
    }
  }

  // Broadcast a hive status update
  broadcastHiveStatus(hiveId: string, status: any) {
    this.broadcast("hive_status", { hiveId, ...status })
  }

  // Broadcast an iOK Farm beacon reading
  broadcastIokFarmReading(pondId: string, reading: any) {
    this.broadcast("iok_farm_reading", { pondId, ...reading })
  }

  // Broadcast a Mavis-7 commit
  broadcastMavis7Commit(commit: any) {
    this.broadcast("mavis7_commit", commit)
  }

  getMetrics() {
    return {
      totalClients: this.clients.size,
      totalMessages: this.messageCount,
      byType: Array.from(this.clients.values()).reduce((acc, c) => { acc[c.type] = (acc[c.type] || 0) + 1; return acc }, {} as Record<string, number>),
    }
  }
}

export default CSOAIWebSocketServer
export { CSOAIWebSocketServer, ConnectedClient }
