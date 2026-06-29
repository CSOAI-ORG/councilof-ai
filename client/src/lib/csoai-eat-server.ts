// csoai-eat-server.ts - The CSOAI EAT Endpoint HTTP Server
// Production-ready Express-compatible server that exposes the EAT endpoint at /api/eat
// 9 action types as REST endpoints + the /api/eat/health + the /api/eat/metrics + the /api/eat/help

import http from "node:http"
import { EAT_ENDPOINT, type EATRequest, type EATResponse, type EATAction } from "./csoai-eat-endpoint"

interface ServerOptions {
  port: number
  enableCors: boolean
  rateLimit: number  // requests per minute per IP
  enableAuth: boolean
}

const DEFAULT_OPTIONS: ServerOptions = { port: 8004, enableCors: true, rateLimit: 100, enableAuth: false }

class CSOAIEATServer {
  private options: ServerOptions
  private rateLimitMap: Map<string, { count: number; reset: number }> = new Map()

  constructor(options: Partial<ServerOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options }
  }

  // Rate limit check
  private checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
    const now = Date.now()
    const entry = this.rateLimitMap.get(ip) || { count: 0, reset: now + 60000 }
    if (now > entry.reset) { entry.count = 0; entry.reset = now + 60000 }
    entry.count++
    this.rateLimitMap.set(ip, entry)
    if (entry.count > this.options.rateLimit) return { allowed: false, remaining: 0 }
    return { allowed: true, remaining: this.options.rateLimit - entry.count }
  }

  // Start the server
  start(): Promise<{ port: number; url: string }> {
    return new Promise((resolve) => {
      const server = http.createServer(async (req, res) => {
        const url = new URL(req.url || "/", `http://localhost:${this.options.port}`)
        const path = url.pathname
        const ip = req.socket.remoteAddress || "unknown"

        // CORS headers
        if (this.options.enableCors) {
          res.setHeader("Access-Control-Allow-Origin", "*")
          res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
          res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")
          if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return }
        }

        // Rate limit
        const rl = this.checkRateLimit(ip)
        if (!rl.allowed) { res.writeHead(429); res.end(JSON.stringify({ error: "Rate limit exceeded" })); return }
        res.setHeader("X-RateLimit-Remaining", rl.remaining.toString())

        // Health
        if (path === "/api/eat/health" && req.method === "GET") {
          res.writeHead(200, { "Content-Type": "application/json" })
          res.end(JSON.stringify({ status: "ok", action: "EAT endpoint live", version: "1.0.0", uptime: process.uptime() }))
          return
        }

        // Metrics
        if (path === "/api/eat/metrics" && req.method === "GET") {
          res.writeHead(200, { "Content-Type": "application/json" })
          res.end(JSON.stringify(EAT_ENDPOINT.getMetrics()))
          return
        }

        // Help
        if (path === "/api/eat/help" && req.method === "GET") {
          res.writeHead(200, { "Content-Type": "application/json" })
          res.end(JSON.stringify({
            endpoints: [
              { method: "GET", path: "/api/eat/health", description: "Health check" },
              { method: "GET", path: "/api/eat/metrics", description: "EAT metrics" },
              { method: "GET", path: "/api/eat/help", description: "This help page" },
              { method: "POST", path: "/api/eat", description: "Main EAT endpoint. Body: { action: 'ask'|'execute'|'simulate'|'verify'|'attest'|'deploy'|'audit'|'forecast'|'alibi', query: string, context?: { hiveId?, userId?, tenantId?, framework?, regulator?, jurisdiction? } }" },
              { method: "POST", path: "/api/eat/:action", description: "Shortcut: POST /api/eat/ask or /api/eat/execute or /api/eat/simulate or /api/eat/verify or /api/eat/attest or /api/eat/deploy or /api/eat/audit or /api/eat/forecast or /api/eat/alibi. Body: { query: string, context?: {...} }" },
            ],
            actions: ["ask", "execute", "simulate", "verify", "attest", "deploy", "audit", "forecast", "alibi"],
            examples: [
              { action: "ask", query: "What's my EU AI Act exposure?", expectedDuration: "< 50ms" },
              { action: "simulate", query: "What if 5 more Hives come online?", expectedDuration: "< 100ms" },
              { action: "audit", query: "Audit the CSOAI Sovereign OS", context: { framework: "EU AI Act" }, expectedDuration: "< 200ms" },
              { action: "forecast", query: "What's the 100-day ARR?", expectedDuration: "< 50ms" },
              { action: "alibi", query: "Generate audit-trail proof for compliance", expectedDuration: "< 100ms" },
            ],
          }))
          return
        }

        // Main EAT endpoint
        if (path === "/api/eat" && req.method === "POST") {
          let body = ""
          req.on("data", (chunk) => { body += chunk })
          req.on("end", async () => {
            try {
              const req_data = JSON.parse(body) as Omit<EATRequest, "id" | "timestamp">
              const response = await EAT_ENDPOINT.handle(req_data)
              res.writeHead(200, { "Content-Type": "application/json" })
              res.end(JSON.stringify(response, null, 2))
            } catch (e: any) {
              res.writeHead(500, { "Content-Type": "application/json" })
              res.end(JSON.stringify({ error: e.message }))
            }
          })
          return
        }

        // Shortcut: /api/eat/:action
        const actionMatch = path.match(/^\/api\/eat\/([a-z]+)$/)
        if (actionMatch && req.method === "POST") {
          const action = actionMatch[1] as EATAction
          if (!["ask", "execute", "simulate", "verify", "attest", "deploy", "audit", "forecast", "alibi"].includes(action)) {
            res.writeHead(400, { "Content-Type": "application/json" })
            res.end(JSON.stringify({ error: `Unknown action: ${action}. Available: ask, execute, simulate, verify, attest, deploy, audit, forecast, alibi` }))
            return
          }
          let body = ""
          req.on("data", (chunk) => { body += chunk })
          req.on("end", async () => {
            try {
              const req_data = JSON.parse(body)
              const response = await EAT_ENDPOINT.handle({ action, query: req_data.query, context: req_data.context })
              res.writeHead(200, { "Content-Type": "application/json" })
              res.end(JSON.stringify(response, null, 2))
            } catch (e: any) {
              res.writeHead(500, { "Content-Type": "application/json" })
              res.end(JSON.stringify({ error: e.message }))
            }
          })
          return
        }

        // 404
        res.writeHead(404, { "Content-Type": "application/json" })
        res.end(JSON.stringify({ error: "Not found. Try GET /api/eat/help" }))
      })
      server.listen(this.options.port, () => {
        const url = `http://localhost:${this.options.port}/api/eat`
        console.log(`[EAT] Server listening on :${this.options.port}`)
        console.log(`[EAT] Try: GET ${url}/help`)
        console.log(`[EAT] Try: POST ${url} with { "action": "ask", "query": "What's my EU AI Act exposure?" }`)
        resolve({ port: this.options.port, url })
      })
    })
  }
}

export default CSOAIEATServer
export { CSOAIEATServer }
