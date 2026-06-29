// csoai-mcp-marketplace.ts - The CSOAI MCP Marketplace web UI
// Production-ready React/Next.js page that lists the 619 MCPs as a searchable filterable catalog
// Compatible with Next.js 14+ / React 18+ / Tailwind CSS / shadcn/ui

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Package, Code, Copy, CheckCheck, Zap, GitBranch, Users, Star, Download, ExternalLink, Filter } from 'lucide-react'

interface Mcp {
  name: string
  description: string
  tools: string[]
  tier?: 'first_class' | 'production'
  license?: string
  category?: string
}

interface Category {
  name: string
  description: string
  count: number
}

const MCP_BRIDGE_URL = process.env.NEXT_PUBLIC_MCP_BRIDGE_URL || 'https://mcp-bridge.herokuapp.com'

export default function McpMarketplace() {
  const [mcps, setMcps] = useState<Mcp[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedTier, setSelectedTier] = useState<'all' | 'first_class' | 'production'>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedName, setCopiedName] = useState<string | null>(null)

  // Load MCPs on mount
  useEffect(() => {
    async function loadMcps() {
      try {
        const [listRes, catRes] = await Promise.all([
          fetch(`${MCP_BRIDGE_URL}/mcp/list`).then((r) => r.json()),
          fetch(`${MCP_BRIDGE_URL}/mcp/categories`).then((r) => r.json()),
        ])
        setMcps(listRes.mcps || [])
        setCategories(catRes.categories || [])
        setLoading(false)
      } catch (e) {
        setError(`Failed to load MCPs: ${e instanceof Error ? e.message : String(e)}`)
        setLoading(false)
      }
    }
    loadMcps()
  }, [])

  // Filter + search
  const filteredMcps = useMemo(() => {
    return mcps.filter((mcp) => {
      const matchesSearch = search === '' ||
        mcp.name.toLowerCase().includes(search.toLowerCase()) ||
        mcp.description.toLowerCase().includes(search.toLowerCase()) ||
        (mcp.category || '').toLowerCase().includes(search.toLowerCase())
      const matchesCategory = !selectedCategory || mcp.category === selectedCategory
      const matchesTier = selectedTier === 'all' || mcp.tier === selectedTier
      return matchesSearch && matchesCategory && matchesTier
    })
  }, [mcps, search, selectedCategory, selectedTier])

  const handleCopyInstall = async (mcp: Mcp) => {
    const installCmd = `# Python
from mcp_server_sdk import CSOAIClient
client = CSOAIClient("${MCP_BRIDGE_URL}")
result = client.call("${mcp.name}", "${mcp.tools[0]}", {"example": "input"})
print(result)`
    await navigator.clipboard.writeText(installCmd)
    setCopiedName(mcp.name)
    setTimeout(() => setCopiedName(null), 2000)
  }

  if (loading) {
    return (
      <div className="container mx-auto py-16 max-w-7xl">
        <div className="text-center">
          <div className="text-2xl font-bold mb-4">Loading the CSOAI MCP marketplace…</div>
          <div className="text-muted-foreground">Fetching the 619 MCPs from the bridge…</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-16 max-w-7xl">
        <div className="text-center text-red-500">
          <div className="text-2xl font-bold mb-4">Error loading MCPs</div>
          <div className="text-sm">{error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      {/* Hero */}
      <div className="text-center mb-12">
        <Badge variant="outline" className="mb-4">
          <Package className="w-4 h-4 mr-2" />
          The CSOAI MCP Marketplace
        </Badge>
        <h1 className="text-5xl font-bold mb-4">
          {mcps.length} MCPs. 9 categories. 1 sovereign OS.
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          The largest open ecosystem of CSOAI MCPs (Model Context Protocol servers) for AI safety governance.
          100% MIT/Apache 2.0 licensed. Fork the architecture. Ship under your brand.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total MCPs" value={mcps.length} icon={Package} />
        <StatCard title="Categories" value={categories.length} icon={Filter} />
        <StatCard title="Total Tools" value={mcps.reduce((sum, m) => sum + m.tools.length, 0)} icon={Zap} />
        <StatCard title="First-Class" value={mcps.filter((m) => m.tier === 'first_class').length} icon={Star} />
      </div>

      {/* Search + filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search 619 MCPs by name, description, or category…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={selectedTier}
          onChange={(e) => setSelectedTier(e.target.value as any)}
          className="border rounded-md px-3 py-2"
        >
          <option value="all">All tiers</option>
          <option value="first_class">First-class only</option>
          <option value="production">Production only</option>
        </select>
        {selectedCategory && (
          <Button variant="outline" onClick={() => setSelectedCategory(null)}>
            Clear category
          </Button>
        )}
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map((cat) => (
          <Badge
            key={cat.name}
            variant={selectedCategory === cat.name ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setSelectedCategory(selectedCategory === cat.name ? null : cat.name)}
          >
            {cat.name} ({cat.count})
          </Badge>
        ))}
      </div>

      {/* MCP grid */}
      <div className="text-sm text-muted-foreground mb-4">
        Showing {filteredMcps.length} of {mcps.length} MCPs
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMcps.map((mcp) => (
          <Card key={mcp.name} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base font-mono break-all">{mcp.name}</CardTitle>
                  <CardDescription className="mt-2">{mcp.description}</CardDescription>
                </div>
                {mcp.tier === 'first_class' && (
                  <Badge variant="default" className="ml-2">
                    <Star className="w-3 h-3 mr-1" />
                    First
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-3">
                {mcp.category && (
                  <Badge variant="secondary" className="text-xs">
                    {mcp.category}
                  </Badge>
                )}
                {mcp.license && (
                  <Badge variant="outline" className="text-xs">
                    {mcp.license}
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs">
                  {mcp.tools.length} tools
                </Badge>
              </div>
              <details className="mb-3">
                <summary className="text-xs font-mono cursor-pointer text-muted-foreground">
                  Show {mcp.tools.length} tools
                </summary>
                <div className="mt-2 space-y-1">
                  {mcp.tools.map((tool) => (
                    <div key={tool} className="text-xs font-mono text-muted-foreground pl-2">
                      • {mcp.name}/{tool}
                    </div>
                  ))}
                </div>
              </details>
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => handleCopyInstall(mcp)}
              >
                {copiedName === mcp.name ? (
                  <>
                    <CheckCheck className="w-4 h-4 mr-2" />
                    Copied install snippet
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy install snippet
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-16 p-8 bg-muted rounded-lg text-center">
        <h2 className="text-3xl font-bold mb-4">Use the SDK in 3 lines</h2>
        <pre className="bg-background p-4 rounded-md overflow-x-auto text-left text-sm font-mono">
{`# Install
pip install mcp_server_sdk

# Use
from mcp_server_sdk import CSOAIClient
client = CSOAIClient("https://mcp-bridge.herokuapp.com")
result = client.call("eu-ai-act-compliance-mcp", "audit_article_50", {
    "system_description": "My AI chatbot",
    "use_case": "chatbot"
})
print(result)`}
        </pre>
        <div className="mt-6 flex flex-col md:flex-row gap-4 justify-center">
          <Button size="lg" asChild>
            <a href="/commit">
              <GitBranch className="w-5 h-5 mr-2" />
              Commit to the Mavis-7 license
            </a>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <a href="https://github.com/CSOAI-ORG/councilof-ai" target="_blank">
              <ExternalLink className="w-5 h-5 mr-2" />
              Fork the architecture
            </a>
          </Button>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon: Icon }: { title: string; value: number; icon: any }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-2">{value.toLocaleString()}</p>
          </div>
          <Icon className="w-8 h-8 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  )
}
