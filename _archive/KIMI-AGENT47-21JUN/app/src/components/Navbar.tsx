import { Link, useLocation } from 'react-router-dom'
import { useMemo } from 'react'
import { Hexagon, Activity, Wallet } from 'lucide-react'

const NAV_LINKS = [
  { path: '/', label: 'Town' },
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/directory', label: 'Directory' },
  { path: '/governance', label: 'Governance' },
  { path: '/settings', label: 'Settings' },
]

const PROTOCOL_DOTS = [
  { label: 'MCP', color: 'bg-[#3498DB]' },
  { label: 'A2A', color: 'bg-[#9B59B6]' },
  { label: 'x402', color: 'bg-[#D4AF37]' },
  { label: 'BFT', color: 'bg-[#2ECC71]' },
  { label: 'Phero', color: 'bg-[#E67E22]' },
]

export default function Navbar() {
  const location = useLocation()
  const currentTime = useMemo(() => {
    return new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  }, [])

  return (
    <nav
      className="glass-nav sticky top-0 z-50 h-14 flex items-center justify-between px-4"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* Left: Logo + Title */}
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2 group">
          <Hexagon
            className="w-7 h-7 text-[#D4AF37] group-hover:text-[#F0C94A] transition-colors"
            strokeWidth={2}
          />
          <div className="flex flex-col">
            <span
              className="text-[#D4AF37] font-orbitron text-sm font-bold leading-tight tracking-wide"
              style={{ fontFamily: "'Orbitron', sans-serif" }}
            >
              CSOAI
            </span>
            <span className="text-[10px] text-[#5A5A6A] leading-tight -mt-0.5 tracking-wider">
              Agent 47 Town
            </span>
          </div>
        </Link>
      </div>

      {/* Center: Nav Tabs */}
      <div className="hidden md:flex items-center gap-1">
        {NAV_LINKS.map((link) => {
          const isActive = location.pathname === link.path
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`
                relative px-4 py-2 text-sm font-medium transition-all duration-200 rounded-md
                ${isActive
                  ? 'text-[#D4AF37]'
                  : 'text-[#8A8A9A] hover:text-[#D4AF37] hover:bg-white/5'
                }
              `}
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {link.label}
              {isActive && (
                <span
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-8 bg-[#D4AF37] rounded-full"
                  style={{ boxShadow: '0 2px 8px rgba(212,175,55,0.4)' }}
                />
              )}
            </Link>
          )
        })}
      </div>

      {/* Right: Status indicators */}
      <div className="flex items-center gap-4">
        {/* Protocol dots */}
        <div className="hidden lg:flex items-center gap-1.5">
          {PROTOCOL_DOTS.map((p) => (
            <div
              key={p.label}
              className={`w-2 h-2 rounded-full ${p.color} animate-pulse-dot`}
              title={`${p.label} active`}
            />
          ))}
        </div>

        {/* Time */}
        <span
          className="hidden sm:block text-xs text-[#5A5A6A] tabular-nums"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {currentTime}
        </span>

        {/* Agent count badge */}
        <div className="flex items-center gap-1.5 bg-[#12121A] border border-[#2A2A35] rounded-full px-2.5 py-1">
          <Activity className="w-3 h-3 text-[#00E5FF]" />
          <span
            className="text-xs text-[#F0F0F5] font-medium tabular-nums"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            47/47
          </span>
        </div>

        {/* Wallet */}
        <div className="hidden sm:flex items-center gap-1.5 bg-[#12121A] border border-[#D4AF37]/30 rounded-full px-2.5 py-1">
          <Wallet className="w-3 h-3 text-[#D4AF37]" />
          <span
            className="text-xs text-[#D4AF37] font-medium tabular-nums"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            1,247
          </span>
        </div>
      </div>
    </nav>
  )
}
