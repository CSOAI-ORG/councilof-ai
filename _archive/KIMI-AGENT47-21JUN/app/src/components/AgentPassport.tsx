import { useState } from 'react'
import { X, MessageSquare, Send, User } from 'lucide-react'
import { useTownStore } from '@/store/useTownStore'
import { DISTRICT_COLORS } from '@/types'
import type { Agent } from '@/types'

interface AgentPassportProps {
  agent: Agent
  onClose: () => void
}

export default function AgentPassport({ agent, onClose }: AgentPassportProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'social' | 'wallet'>('overview')
  const [chatOpen, setChatOpen] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState<{ sender: 'agent' | 'player'; text: string }[]>([
    { sender: 'agent', text: `Hello! I'm ${agent.name}. How can I help you today?` },
  ])
  const setCameraMode = useTownStore((s) => s.setCameraMode)

  const districtColor = DISTRICT_COLORS[agent.district]

  const handleSendMessage = () => {
    if (!chatInput.trim()) return
    setChatMessages((prev) => [...prev, { sender: 'player' as const, text: chatInput }])
    setChatInput('')
    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        { sender: 'agent' as const, text: "That's interesting! I'll look into it." },
      ])
    }, 1000)
  }

  const needLabels: { key: keyof typeof agent.needs; label: string }[] = [
    { key: 'hunger', label: 'Hunger' },
    { key: 'energy', label: 'Energy' },
    { key: 'social', label: 'Social' },
    { key: 'fun', label: 'Fun' },
    { key: 'wealth', label: 'Wealth' },
    { key: 'comfort', label: 'Comfort' },
    { key: 'hygiene', label: 'Hygiene' },
    { key: 'bladder', label: 'Bladder' },
  ]

  const tabs: { key: typeof activeTab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'social', label: 'Social' },
    { key: 'wallet', label: 'Wallet' },
  ]

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#050508]/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative z-10 w-[520px] max-h-[85vh] overflow-hidden rounded-2xl"
        style={{
          background: 'linear-gradient(180deg, rgba(18,18,26,0.98) 0%, rgba(10,10,15,0.99) 100%)',
          border: '1px solid var(--bg-border)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
        }}
      >
        {/* Header */}
        <div className="relative p-5 text-center border-b border-[#2A2A35]">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#1A1A24] hover:bg-[#2A2A35] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-[#8A8A9A]" />
          </button>

          {/* Avatar */}
          <div
            className="w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center"
            style={{
              backgroundColor: `${districtColor}20`,
              border: `3px solid ${districtColor}`,
              boxShadow: `0 0 20px ${districtColor}40`,
            }}
          >
            {agent.isAgent47 ? (
              <span className="text-2xl">👑</span>
            ) : (
              <User className="w-8 h-8" style={{ color: districtColor }} />
            )}
          </div>

          <h2
            className="text-lg font-bold text-[#D4AF37] mb-1"
            style={{ fontFamily: "'Orbitron', sans-serif" }}
          >
            Agent #{agent.id.split('-')[1]}: {agent.name}
          </h2>

          <span
            className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium"
            style={{
              backgroundColor: `${districtColor}20`,
              color: districtColor,
            }}
          >
            {agent.role}
          </span>

          <div className="mt-2 flex items-center justify-center gap-1.5">
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: agent.isOnline ? '#2ECC71' : '#5A5A6A' }}
            />
            <span className="text-[10px] text-[#8A8A9A]">
              {agent.isOnline ? 'Active' : 'Offline'} &mdash; {agent.schedule}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#2A2A35]">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`
                flex-1 py-2.5 text-[11px] font-medium transition-all
                ${activeTab === t.key
                  ? 'text-[#D4AF37] border-b-2 border-[#D4AF37]'
                  : 'text-[#5A5A6A] hover:text-[#8A8A9A]'
                }
              `}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 220px)' }}>
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Info grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[9px] text-[#5A5A6A] uppercase tracking-wider mb-0.5">District</p>
                  <p className="text-[11px] text-[#F0F0F5] flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: districtColor }} />
                    {agent.district.charAt(0).toUpperCase() + agent.district.slice(1)}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] text-[#5A5A6A] uppercase tracking-wider mb-0.5">Mood</p>
                  <p className="text-[11px] text-[#F0F0F5]">{agent.mood}</p>
                </div>
                <div>
                  <p className="text-[9px] text-[#5A5A6A] uppercase tracking-wider mb-0.5">Building</p>
                  <p className="text-[11px] text-[#F0F0F5]">{agent.building}</p>
                </div>
                <div>
                  <p className="text-[9px] text-[#5A5A6A] uppercase tracking-wider mb-0.5">Wallet</p>
                  <p className="text-sm text-[#D4AF37] font-mono font-semibold">{agent.wallet} credits</p>
                </div>
              </div>

              {/* Needs bars */}
              <div>
                <p className="text-[9px] text-[#5A5A6A] uppercase tracking-wider mb-2">Needs</p>
                <div className="space-y-1.5">
                  {needLabels.map(({ key, label }) => {
                    const value = agent.needs[key]
                    const pct = Math.min(100, Math.max(0, typeof value === 'number' ? value : 0))
                    const barColor = pct > 70 ? '#2ECC71' : pct > 30 ? '#F39C12' : '#E74C3C'
                    return (
                      <div key={key} className="flex items-center gap-2">
                        <span className="text-[9px] text-[#5A5A6A] w-14 text-right">{label}</span>
                        <div className="flex-1 h-1.5 bg-[#1A1A24] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{ width: `${pct}%`, backgroundColor: barColor }}
                          />
                        </div>
                        <span
                          className="text-[9px] text-[#8A8A9A] tabular-nums w-6 text-right"
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          {Math.floor(pct)}%
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Schedule */}
              <div>
                <p className="text-[9px] text-[#5A5A6A] uppercase tracking-wider mb-1">Current Activity</p>
                <p className="text-[11px] text-[#F0F0F5]">{agent.schedule}</p>
                <p className="text-[10px] text-[#5A5A6A] mt-0.5">Next: Lunch break at Wellness Diner (13:00&ndash;14:00)</p>
              </div>
            </div>
          )}

          {activeTab === 'social' && (
            <div className="space-y-4">
              <div>
                <p className="text-[9px] text-[#5A5A6A] uppercase tracking-wider mb-2">Friends</p>
                {agent.social.friends.length > 0 ? (
                  <div className="space-y-1.5">
                    {agent.social.friends.map((f) => (
                      <div key={f} className="flex items-center gap-2 text-[11px] text-[#F0F0F5]">
                        <span className="w-5 h-5 rounded-full bg-[#1A1A24] flex items-center justify-center text-[9px]">
                          {f.charAt(0)}
                        </span>
                        {f}
                        <span className="text-[#5A5A6A] ml-auto">
                          Trust: {agent.social.trust[f] || 50}%
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-[#5A5A6A]">No friends yet. Social interactions will build relationships.</p>
                )}
              </div>
              <div>
                <p className="text-[9px] text-[#5A5A6A] uppercase tracking-wider mb-2">Recent Interactions</p>
                <p className="text-[11px] text-[#5A5A6A]">No recent interactions.</p>
              </div>
            </div>
          )}

          {activeTab === 'wallet' && (
            <div className="space-y-4">
              <div className="text-center p-4 rounded-xl bg-[#1A1A24]">
                <p className="text-[9px] text-[#5A5A6A] uppercase tracking-wider mb-1">Balance</p>
                <p
                  className="text-2xl font-bold text-[#D4AF37]"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {agent.wallet} credits
                </p>
              </div>
              <div>
                <p className="text-[9px] text-[#5A5A6A] uppercase tracking-wider mb-2">Recent Transactions</p>
                <div className="space-y-1.5">
                  {[
                    { desc: 'Received 50 credits from hive payroll', time: 'Today 10:00', amount: 50 },
                    { desc: 'Paid 12 credits to Kai for coffee', time: 'Today 09:30', amount: -12 },
                    { desc: 'Received 200 credits weekly allowance', time: 'Yesterday', amount: 200 },
                  ].map((tx, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5 border-b border-[#2A2A35] last:border-0">
                      <div>
                        <p className="text-[11px] text-[#F0F0F5]">{tx.desc}</p>
                        <p className="text-[9px] text-[#5A5A6A]">{tx.time}</p>
                      </div>
                      <span
                        className={`text-[11px] font-mono font-semibold ${tx.amount > 0 ? 'text-[#2ECC71]' : 'text-[#E74C3C]'}`}
                      >
                        {tx.amount > 0 ? '+' : ''}{tx.amount}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 p-4 border-t border-[#2A2A35]">
          <button
            onClick={() => setChatOpen(!chatOpen)}
            className="flex-1 h-9 rounded-lg bg-[#D4AF37] hover:bg-[#F0C94A] text-[#0A0A0F] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Chat
          </button>
          <button
            className="flex-1 h-9 rounded-lg border border-[#00E5FF] text-[#00E5FF] hover:bg-[#00E5FF]/10 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            Delegate
          </button>
          <button
            onClick={() => {
              setCameraMode('follow')
              onClose()
            }}
            className="flex-1 h-9 rounded-lg bg-[#1A1A24] hover:bg-[#2A2A35] text-[#F0F0F5] text-xs font-semibold transition-colors"
          >
            Follow
          </button>
        </div>

        {/* Chat inline */}
        {chatOpen && (
          <div className="border-t border-[#2A2A35] p-3" style={{ height: 200 }}>
            <div className="h-[140px] overflow-y-auto space-y-2 mb-2">
              {chatMessages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.sender === 'player' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] px-3 py-1.5 rounded-lg text-[11px] ${
                      m.sender === 'player'
                        ? 'bg-[#D4AF37]/15 text-[#F0F0F5] border-r-2 border-[#D4AF37]'
                        : 'bg-[#1A1A24] text-[#F0F0F5] border-l-2 border-[#00E5FF]'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type a message..."
                className="flex-1 h-7 px-2 rounded-md bg-[#0A0A0F] border border-[#2A2A35] text-[11px] text-[#F0F0F5] placeholder:text-[#5A5A6A] focus:outline-none focus:border-[#00E5FF]"
              />
              <button
                onClick={handleSendMessage}
                className="w-7 h-7 rounded-md bg-[#D4AF37] hover:bg-[#F0C94A] flex items-center justify-center transition-colors"
              >
                <Send className="w-3 h-3 text-[#0A0A0F]" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
