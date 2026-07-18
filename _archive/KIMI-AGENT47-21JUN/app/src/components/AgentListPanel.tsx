import { useState, useMemo } from 'react'
import { Search, Crown } from 'lucide-react'
import { useTownStore } from '@/store/useTownStore'
import { DISTRICT_COLORS } from '@/types'
import type { Agent } from '@/types'

interface AgentListPanelProps {
  agents: Agent[]
}

type FilterTab = 'all' | 'active' | 'working' | 'resting'

export default function AgentListPanel({ agents }: AgentListPanelProps) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterTab>('all')
  const selectedAgentId = useTownStore((s) => s.selectedAgentId)
  const selectAgent = useTownStore((s) => s.selectAgent)

  const filtered = useMemo(() => {
    let result = agents
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (a) => a.name.toLowerCase().includes(q) || a.role.toLowerCase().includes(q) || a.district.toLowerCase().includes(q)
      )
    }
    if (filter === 'active') result = result.filter((a) => a.isOnline)
    if (filter === 'working') result = result.filter((a) => a.state === 'working')
    if (filter === 'resting') result = result.filter((a) => a.state === 'idle' || a.state === 'sleeping')
    // Agent 47 always first
    return result.sort((a) => (a.isAgent47 ? -1 : 0))
  }, [agents, search, filter])

  const filters: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'working', label: 'Working' },
    { key: 'resting', label: 'Resting' },
  ]

  return (
    <div className="glass-panel" style={{ width: 280, height: 'calc(100dvh - 120px)' }}>
      {/* Header */}
      <div className="p-3 border-b border-[#2A2A35]">
        <div className="flex items-center justify-between mb-2">
          <h3
            className="text-sm font-semibold text-[#D4AF37]"
            style={{ fontFamily: "'Orbitron', sans-serif" }}
          >
            Active Agents
          </h3>
          <span
            className="text-[10px] text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.5 rounded-full font-mono"
          >
            {agents.length}/{agents.length}
          </span>
        </div>

        {/* Search */}
        <div className="relative mb-2">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#5A5A6A]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search agents..."
            className="w-full h-7 pl-7 pr-2 rounded-md bg-[#0A0A0F] border border-[#2A2A35] text-[11px] text-[#F0F0F5] placeholder:text-[#5A5A6A] focus:outline-none focus:border-[#00E5FF]"
            style={{ fontFamily: "'Inter', sans-serif" }}
          />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`
                px-2 py-0.5 rounded-full text-[9px] font-medium transition-all
                ${filter === f.key
                  ? 'bg-[#D4AF37]/15 text-[#D4AF37]'
                  : 'text-[#5A5A6A] hover:text-[#8A8A9A] hover:bg-white/5'
                }
              `}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Agent list */}
      <div className="overflow-y-auto" style={{ maxHeight: 'calc(100% - 100px)' }}>
        {filtered.map((a) => {
          const isSelected = a.id === selectedAgentId
          const districtColor = DISTRICT_COLORS[a.district]
          return (
            <button
              key={a.id}
              onClick={() => selectAgent(isSelected ? null : a.id)}
              className={`
                w-full flex items-center gap-2.5 px-3 py-2 transition-all text-left
                ${isSelected ? 'bg-[#D4AF37]/10' : 'hover:bg-[#1A1A24]'}
              `}
            >
              {/* Avatar with district ring */}
              <div className="relative flex-shrink-0 w-8 h-8">
                <div
                  className="w-full h-full rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: `${districtColor}20`,
                    border: `2px solid ${districtColor}`,
                  }}
                >
                  {a.isAgent47 ? (
                    <Crown className="w-3.5 h-3.5 text-[#FFD700]" />
                  ) : (
                    <span
                      className="text-[9px] font-semibold"
                      style={{ color: districtColor }}
                    >
                      {a.name.charAt(0)}
                    </span>
                  )}
                </div>
                {/* Online dot */}
                <div
                  className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#12121A]"
                  style={{ backgroundColor: a.isOnline ? '#2ECC71' : '#5A5A6A' }}
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={`text-[11px] font-medium truncate ${a.isAgent47 ? 'text-[#FFD700]' : 'text-[#F0F0F5]'}`}>
                    {a.name}
                  </span>
                  {a.isAgent47 && (
                    <span className="text-[8px] bg-[#D4AF37]/20 text-[#D4AF37] px-1 rounded font-medium">
                      YOU
                    </span>
                  )}
                </div>
                <span className="text-[9px] text-[#5A5A6A] truncate block">
                  {a.role} &middot; {a.district}
                </span>
              </div>

              {/* District color dot */}
              <div
                className="w-2 h-2 rounded-sm flex-shrink-0"
                style={{ backgroundColor: districtColor }}
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}
