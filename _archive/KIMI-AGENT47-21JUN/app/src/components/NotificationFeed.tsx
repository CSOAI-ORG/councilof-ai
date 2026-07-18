import { useState } from 'react'
import {
  Footprints,
  Briefcase,
  Users,
  Coins,
  AlertTriangle,
  Gavel,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import type { Notification } from '@/types'

interface NotificationFeedProps {
  notifications: Notification[]
}

const iconMap: Record<string, { icon: typeof Footprints; color: string }> = {
  movement: { icon: Footprints, color: 'text-[#8A8A9A]' },
  work: { icon: Briefcase, color: 'text-[#00E5FF]' },
  social: { icon: Users, color: 'text-[#2ECC71]' },
  transaction: { icon: Coins, color: 'text-[#D4AF37]' },
  alert: { icon: AlertTriangle, color: 'text-[#E74C3C]' },
  governance: { icon: Gavel, color: 'text-[#9B59B6]' },
  pheromone: { icon: Sparkles, color: 'text-[#E67E22]' },
}

export default function NotificationFeed({ notifications }: NotificationFeedProps) {
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? notifications.slice(0, 10) : notifications.slice(0, 3)

  return (
    <div
      className="glass-panel overflow-hidden"
      style={{ width: 320 }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <span
          className="text-[10px] text-[#5A5A6A] uppercase tracking-wider font-medium"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          Town Activity
        </span>
        {expanded ? (
          <ChevronUp className="w-3 h-3 text-[#5A5A6A]" />
        ) : (
          <ChevronDown className="w-3 h-3 text-[#5A5A6A]" />
        )}
      </div>

      {/* Items */}
      <div className="px-3 pb-2 space-y-1" style={{ maxHeight: expanded ? 280 : 108, overflowY: 'auto' }}>
        {visible.map((n) => {
          const config = iconMap[n.type] || iconMap.movement
          const Icon = config.icon
          const timeStr = new Date(n.timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          })
          return (
            <div
              key={n.id}
              className="flex items-center gap-2 py-1.5 animate-fade-in"
            >
              <Icon className={`w-3 h-3 ${config.color} flex-shrink-0`} />
              <span className="flex-1 text-[11px] text-[#F0F0F5] truncate">
                {n.message}
              </span>
              <span
                className="text-[9px] text-[#5A5A6A] tabular-nums flex-shrink-0"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                {timeStr}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
