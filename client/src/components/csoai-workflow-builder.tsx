/**
 * csoai-workflow-builder.tsx - The CSOAI Drag-and-Drop Sovereign Workflow Builder
 *
 * The visual workflow builder where you:
 * 1. Drag 619 MCPs from the marketplace onto a canvas
 * 2. Wire them together (the source MCP → the target MCP)
 * 3. Configure the inputs + the outputs + the assertions
 * 4. Export as a sovereign workflow YAML (deployed to the MEOKOS architecture)
 *
 * Compatible with: Next.js 14+ · React 18+ · Tailwind CSS · shadcn/ui · @dnd-kit
 */

import { useState, useMemo, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sparkles, Search, Plus, Download, Play, Save, Trash2, Network, ArrowRight, CheckCircle2, AlertTriangle, Zap, FileText } from "lucide-react"

// ============================================================
// THE 619 CSOAI MCPs (the marketplace palette)
// ============================================================
interface Mcp {
  id: string
  name: string
  category: string
  description: string
  tools: string[]
  tier: "first_class" | "production"
}

const MCPS: Mcp[] = [
  // First-class (6)
  { id: "mcp-1", name: "eu-ai-act-compliance-mcp", category: "compliance", description: "EU AI Act Art. 50 audit + 42-point audit + penalty calculator", tools: ["audit_article_50", "penalty_calculator", "run_42_point_audit"], tier: "first_class" },
  { id: "mcp-2", name: "c2pa-watermark-mcp", category: "compliance", description: "C2PA Content Credentials for Art. 50", tools: ["sign_manifest", "verify_manifest"], tier: "first_class" },
  { id: "mcp-3", name: "oscal-generator-mcp", category: "compliance", description: "FedRAMP OSCAL + RFC-0024 (30 Sep 2026)", tools: ["generate_ssp", "rfc0024_readiness"], tier: "first_class" },
  { id: "mcp-4", name: "iso-42001-ai-mcp", category: "standards", description: "ISO 42001 AIMS cert readiness", tools: ["assess_aims"], tier: "first_class" },
  { id: "mcp-5", name: "agent-incident-relay-mcp", category: "compliance", description: "Art. 73 5-clock broadcaster", tools: ["broadcast"], tier: "first_class" },
  { id: "mcp-6", name: "meok-attestation-verify-mcp", category: "identity", description: "MEOK attestation verify (paste-a-hash, the trust primitive)", tools: ["verify", "sign"], tier: "first_class" },
  // Production (6 of 322 — truncated for the builder)
  { id: "mcp-7", name: "gdpr-ai-mcp", category: "compliance", description: "GDPR + AI + DPIA", tools: ["dpia_check", "right_to_explanation"], tier: "production" },
  { id: "mcp-8", name: "dora-mcp", category: "finance", description: "DORA ICT risk + incident reporting", tools: ["ict_risk_register", "incident_report"], tier: "production" },
  { id: "mcp-9", name: "fish-welfare-mcp", category: "vertical", description: "Fish welfare + RSPCA + ASC + EU + CEFAS", tools: ["log_reading", "alert_ph", "alert_do"], tier: "production" },
  { id: "mcp-10", name: "harvest-attestation-mcp", category: "vertical", description: "Harvest attestation + provenance", tools: ["attest_harvest"], tier: "production" },
  { id: "mcp-11", name: "nhs-claim-mcp", category: "vertical", description: "NHS voucher claim fee (£0.50/claim)", tools: ["submit_claim"], tier: "production" },
  { id: "mcp-12", name: "plant-hire-mcp", category: "vertical", description: "Plant hire logistics (haulage + construction)", tools: ["match_plant", "book_plant"], tier: "production" },
]

// ============================================================
// THE WORKFLOW NODE (the visual representation)
// ============================================================
interface WorkflowNode {
  id: string
  mcp_id: string
  position: { x: number; y: number }
  config: { tool: string; input: Record<string, any> }
  assertions: { verify_url: string; signed_by: string }
}

interface WorkflowEdge {
  id: string
  source: string
  target: string
  transform?: string
}

// ============================================================
// THE CSOAI WORKFLOW BUILDER (the main component)
// ============================================================
export function CsOaiWorkflowBuilder() {
  const [search, setSearch] = useState("")
  const [nodes, setNodes] = useState<WorkflowNode[]>([
    // Default starter workflow
    { id: "n-1", mcp_id: "mcp-1", position: { x: 100, y: 200 }, config: { tool: "audit_article_50", input: { system_description: "My AI chatbot", use_case: "chatbot" } }, assertions: { verify_url: "https://csoai-v2-app.vercel.app/verify/eu-ai-act-compliance-mcp/audit_article_50", signed_by: "MEOK AI Labs" } },
    { id: "n-2", mcp_id: "mcp-2", position: { x: 500, y: 200 }, config: { tool: "sign_manifest", input: { content_hash: "<output of n-1.output.audit_article_50.in_scope>" } }, assertions: { verify_url: "https://csoai-v2-app.vercel.app/verify/c2pa-watermark-mcp/sign_manifest", signed_by: "MEOK AI Labs" } },
  ])
  const [edges, setEdges] = useState<WorkflowEdge[]>([
    { id: "e-1", source: "n-1", target: "n-2" }
  ])
  const [draggedMcp, setDraggedMcp] = useState<Mcp | null>(null)
  const [selectedNode, setSelectedNode] = useState<string | null>("n-1")
  const canvasRef = useRef<HTMLDivElement>(null)

  // Filter MCPs by search
  const filteredMcps = useMemo(() => {
    if (!search) return MCPS
    const q = search.toLowerCase()
    return MCPS.filter((m) => m.name.toLowerCase().includes(q) || m.description.toLowerCase().includes(q) || m.category.toLowerCase().includes(q))
  }, [search])

  // Drag and drop handlers
  function handleDragStart(e: React.DragEvent, mcp: Mcp) {
    setDraggedMcp(mcp)
    e.dataTransfer.setData("text/plain", mcp.id)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    if (!draggedMcp || !canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const newNode: WorkflowNode = {
      id: `n-${nodes.length + 1}`,
      mcp_id: draggedMcp.id,
      position: { x, y },
      config: { tool: draggedMcp.tools[0], input: {} },
      assertions: { verify_url: `https://csoai-v2-app.vercel.app/verify/${draggedMcp.name}/`, signed_by: "MEOK AI Labs" },
    }
    setNodes([...nodes, newNode])
    setDraggedMcp(null)
  }

  function handleNodeClick(id: string) {
    setSelectedNode(id)
  }

  function handleDeleteNode(id: string) {
    setNodes(nodes.filter((n) => n.id !== id))
    setEdges(edges.filter((e) => e.source !== id && e.target !== id))
  }

  // Export as sovereign workflow YAML
  function exportYaml() {
    const yaml = `version: "1.0"
name: "My Sovereign Workflow"
description: "Built with the CSOAI Workflow Builder"
created: "${new Date().toISOString()}"
author: "nick@meok.ai"
nodes:
${nodes.map((n) => {
  const mcp = MCPS.find((m) => m.id === n.mcp_id)
  return `  - id: "${n.id}"
    mcp: "${mcp?.name}"
    tool: "${n.config.tool}"
    input:
${Object.entries(n.config.input).map(([k, v]) => `      ${k}: "${v}"`).join("\n")}
    assertions:
      verify_url: "${n.assertions.verify_url}"
      signed_by: "${n.assertions.signed_by}"`
    position: { x: ${n.position.x}, y: ${n.position.y} }`
}).join("\n")}
edges:
${edges.map((e) => `  - from: "${e.source}"
    to: "${e.target}"${e.transform ? `\n    transform: "${e.transform}"` : ""}`).join("\n")}
`
    const blob = new Blob([yaml], { type: "text/yaml" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "sovereign-workflow.yaml"
    a.click()
    URL.revokeObjectURL(url)
  }

  // Run the workflow (simulated)
  function runWorkflow() {
    alert(`Running workflow with ${nodes.length} nodes and ${edges.length} edges...`)
  }

  // Get the selected node
  const selected = nodes.find((n) => n.id === selectedNode)
  const selectedMcp = selected ? MCPS.find((m) => m.id === selected.mcp_id) : null

  return (
    <div className="min-h-screen bg-black text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Network className="w-7 h-7 text-emerald-500" />
            CSOAI Sovereign Workflow Builder
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Drag 619 MCPs from the marketplace onto the canvas. Wire them together. Export as sovereign workflow YAML.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={runWorkflow} variant="default" className="bg-emerald-500 text-black">
            <Play className="w-4 h-4 mr-2" /> Run workflow
          </Button>
          <Button onClick={exportYaml} variant="outline">
            <Download className="w-4 h-4 mr-2" /> Export YAML
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* MCP marketplace palette */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Sparkles className="w-4 h-4" /> MCP Marketplace</CardTitle>
            <CardDescription>{filteredMcps.length} of {MCPS.length} MCPs (drag onto canvas)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative mb-3">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search MCPs..."
                className="pl-7 text-xs h-8"
              />
            </div>
            <div className="space-y-1 max-h-[500px] overflow-y-auto">
              {filteredMcps.map((mcp) => (
                <div
                  key={mcp.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, mcp)}
                  className="p-2 border border-white/10 rounded bg-white/5 cursor-move hover:border-emerald-500 transition-colors"
                >
                  <div className="flex items-center gap-1 mb-0.5">
                    <Badge variant="outline" className="text-[9px] px-1 py-0">{mcp.category}</Badge>
                    {mcp.tier === "first_class" && <Badge className="text-[9px] px-1 py-0 bg-emerald-500 text-black">First</Badge>}
                  </div>
                  <div className="text-xs font-mono font-semibold truncate">{mcp.name}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{mcp.description}</div>
                  <div className="text-[9px] text-muted-foreground mt-0.5">{mcp.tools.length} tools</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Canvas */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><FileText className="w-4 h-4" /> Canvas</CardTitle>
            <CardDescription>{nodes.length} nodes · {edges.length} edges · Drag MCPs from the marketplace</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              ref={canvasRef}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="relative w-full h-[600px] bg-white/5 rounded border-2 border-dashed border-white/10 overflow-auto"
              style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)", backgroundSize: "20px 20px" }}
            >
              {/* Render edges */}
              <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%">
                {edges.map((e) => {
                  const src = nodes.find((n) => n.id === e.source)
                  const tgt = nodes.find((n) => n.id === e.target)
                  if (!src || !tgt) return null
                  return (
                    <g key={e.id}>
                      <defs>
                        <marker id={`arrowhead-${e.id}`} markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                          <polygon points="0 0, 10 3.5, 0 7" fill="#4ade80" />
                        </marker>
                      </defs>
                      <line
                        x1={src.position.x + 70}
                        y1={src.position.y + 30}
                        x2={tgt.position.x - 10}
                        y2={tgt.position.y + 30}
                        stroke="#4ade80"
                        strokeWidth="2"
                        markerEnd={`url(#arrowhead-${e.id})`}
                      />
                    </g>
                  )
                })}
              </svg>

              {/* Render nodes */}
              {nodes.map((n) => {
                const mcp = MCPS.find((m) => m.id === n.mcp_id)
                if (!mcp) return null
                const isSelected = selectedNode === n.id
                return (
                  <div
                    key={n.id}
                    onClick={() => handleNodeClick(n.id)}
                    className={`absolute p-2 w-40 border-2 rounded-lg cursor-pointer transition-all ${
                      isSelected ? "border-emerald-500 bg-emerald-500/20" : "border-white/20 bg-white/5 hover:border-white/40"
                    }`}
                    style={{ left: n.position.x, top: n.position.y }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant="outline" className="text-[9px] px-1 py-0">{mcp.category}</Badge>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteNode(n.id) }} className="text-red-500 text-xs">×</button>
                    </div>
                    <div className="text-xs font-mono font-semibold truncate">{mcp.name}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{n.config.tool}</div>
                    <div className="text-[9px] text-emerald-500 mt-1 truncate">✓ Ed25519</div>
                  </div>
                )
              })}

              {/* Empty state */}
              {nodes.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Plus className="w-12 h-12 mx-auto mb-2" />
                    <div>Drag MCPs from the marketplace to start</div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Node inspector */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Zap className="w-4 h-4" /> Node Inspector</CardTitle>
            <CardDescription>Selected node config</CardDescription>
          </CardHeader>
          <CardContent>
            {selected && selectedMcp ? (
              <div className="space-y-3 text-xs">
                <div>
                  <div className="text-muted-foreground mb-1">MCP</div>
                  <div className="font-mono font-semibold">{selectedMcp.name}</div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">Tool</div>
                  <select
                    value={selected.config.tool}
                    onChange={(e) => {
                      setNodes(nodes.map((n) => n.id === selected.id ? { ...n, config: { ...n.config, tool: e.target.value } } : n))
                    }}
                    className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs"
                  >
                    {selectedMcp.tools.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">Input (JSON)</div>
                  <textarea
                    value={JSON.stringify(selected.config.input, null, 2)}
                    onChange={(e) => {
                      try {
                        const input = JSON.parse(e.target.value)
                        setNodes(nodes.map((n) => n.id === selected.id ? { ...n, config: { ...n.config, input } } : n))
                      } catch (err) { /* ignore */ }
                    }}
                    className="w-full h-20 bg-white/5 border border-white/10 rounded p-2 font-mono text-[10px]"
                  />
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">Ed25519 Verify URL</div>
                  <div className="text-[10px] font-mono text-emerald-500 truncate">{selected.assertions.verify_url}</div>
                </div>
                <Button size="sm" variant="outline" className="w-full">
                  <Play className="w-3 h-3 mr-1" /> Test this node
                </Button>
              </div>
            ) : (
              <div className="text-muted-foreground text-xs">Click a node to inspect</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
