import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  Activity,
  ArrowLeftRight,
  Brain,
  Zap,
  MemoryStick,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  Droplets,
  ShieldCheck,
  ArrowRight,
  ChevronUp,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts'
import {
  DISTRICT_COLORS,
  PROTOCOL_COLORS,
  AGENT_NAMES,
} from '@/types'
import type { District } from '@/types'

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number]

/* ──────────────────────── mock data ──────────────────────── */

const KPI_DATA = [
  {
    label: 'Total Agents',
    value: 47,
    sublabel: '46 AI + 1 Human',
    color: '#00E5FF',
    icon: Users,
    trend: '+2',
    trendUp: true,
  },
  {
    label: 'Active Now',
    value: 38,
    sublabel: 'agents awake',
    color: '#2ECC71',
    icon: Activity,
    trend: '+5',
    trendUp: true,
  },
  {
    label: 'Total Transactions',
    value: 1247,
    sublabel: 'x402 credits today',
    color: '#D4AF37',
    icon: ArrowLeftRight,
    trend: '+156',
    trendUp: true,
  },
  {
    label: 'Pheromone Density',
    value: 23.4,
    sublabel: '\u03BCg/m\u00B3 average',
    color: '#E67E22',
    icon: Droplets,
    trend: '-1.2',
    trendUp: false,
  },
  {
    label: 'BFT Consensus',
    value: 94.2,
    suffix: '%',
    sublabel: 'governance health',
    color: '#9B59B6',
    icon: ShieldCheck,
    trend: 'Stable',
    trendUp: null,
  },
]

const PROTOCOLS = [
  { key: 'mcp', label: 'MCP', full: 'Model Context', color: '#3498DB', rate: 234, max: 500 },
  { key: 'a2a', label: 'A2A', full: 'Agent-to-Agent', color: '#9B59B6', rate: 89, max: 300 },
  { key: 'x402', label: 'x402', full: 'Payments', color: '#D4AF37', rate: 12, max: 100 },
  { key: 'bft', label: 'BFT', full: 'Governance', color: '#2ECC71', rate: 3, max: 50 },
  { key: 'phero', label: 'Pheromones', full: 'Signals', color: '#E67E22', rate: 156, max: 400 },
]

const PROTOCOL_TIMELINE = Array.from({ length: 24 }, (_, h) => ({
  hour: `${h.toString().padStart(2, '0')}:00`,
  mcp: Math.floor(100 + Math.sin(h * 0.5) * 80 + Math.random() * 60),
  a2a: Math.floor(40 + Math.sin(h * 0.7) * 30 + Math.random() * 25),
  x402: Math.floor(5 + Math.sin(h * 0.3) * 4 + Math.random() * 8),
  bft: Math.floor(1 + Math.random() * 4),
  phero: Math.floor(60 + Math.sin(h * 0.6) * 50 + Math.random() * 40),
}))

const TX_SERVICES = [
  'coffee', 'taxi ride', 'meal', 'consulting', 'rent', 'freelance work',
  'data analysis', 'cleaning', 'security detail', 'teaching', 'repair',
  'design work', 'catering', 'entertainment', 'therapy session',
  'coding', 'research', 'translation', 'legal advice', 'gardening',
]

interface MockTx {
  id: number
  from: string
  to: string
  amount: number
  service: string
  protocol: string
  timeAgo: number
}

const MOCK_TRANSACTIONS: MockTx[] = Array.from({ length: 20 }, (_, i) => {
  const fromIdx = Math.floor(Math.random() * AGENT_NAMES.length)
  let toIdx = Math.floor(Math.random() * AGENT_NAMES.length)
  while (toIdx === fromIdx) toIdx = Math.floor(Math.random() * AGENT_NAMES.length)
  return {
    id: i,
    from: AGENT_NAMES[fromIdx],
    to: AGENT_NAMES[toIdx],
    amount: Math.round((Math.random() * 50 + 2) * 10) / 10,
    service: TX_SERVICES[Math.floor(Math.random() * TX_SERVICES.length)],
    protocol: ['x402', 'x402', 'x402', 'a2a', 'bft'][Math.floor(Math.random() * 5)],
    timeAgo: Math.floor(Math.random() * 120) + 1,
  }
}).sort((a, b) => a.timeAgo - b.timeAgo)

const ACTIVITY_DATA = [
  { name: 'Working', count: 18, color: '#00E5FF' },
  { name: 'Walking', count: 12, color: '#8A8A9A' },
  { name: 'Socializing', count: 8, color: '#2ECC71' },
  { name: 'Eating', count: 4, color: '#E67E22' },
  { name: 'Sleeping', count: 3, color: '#5A5A6A' },
  { name: 'Commuting', count: 2, color: '#D4AF37' },
]

const NEEDS_DATA = [
  { name: 'Hunger', value: 78, color: '#00E5FF' },
  { name: 'Energy', value: 65, color: '#D4AF37' },
  { name: 'Social', value: 82, color: '#2ECC71' },
  { name: 'Fun', value: 71, color: '#E67E22' },
  { name: 'Wealth', value: 54, color: '#1ABC9C' },
  { name: 'Comfort', value: 88, color: '#ECF0F1' },
  { name: 'Hygiene', value: 76, color: '#3498DB' },
  { name: 'Bladder', value: 91, color: '#9B59B6' },
]

const WEALTH_DISTRIBUTION = [
  { range: '0-10', count: 8 },
  { range: '10-20', count: 14 },
  { range: '20-30', count: 12 },
  { range: '30-40', count: 8 },
  { range: '40-50', count: 5 },
]

const PRICE_INDEX = Array.from({ length: 7 }, (_, d) => ({
  day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][d],
  food: 10 + Math.sin(d * 0.8) * 2 + Math.random() * 1.5,
  entertainment: 15 + Math.sin(d * 0.6) * 3 + Math.random() * 2,
  housing: 25 + Math.cos(d * 0.5) * 2 + Math.random() * 1,
}))

const TICK_RATE_DATA = Array.from({ length: 30 }, (_, i) => ({
  tick: i,
  rate: 18 + Math.sin(i * 0.4) * 3 + Math.random() * 4,
  expected: 20,
}))

const DISTRICTS: {
  id: District
  name: string
  agents: number
  buildings: number
  activity: number
}[] = [
  { id: 'central', name: 'Central', agents: 6, buildings: 4, activity: 85 },
  { id: 'governance', name: 'Governance', agents: 4, buildings: 3, activity: 62 },
  { id: 'commerce', name: 'Commerce', agents: 8, buildings: 6, activity: 91 },
  { id: 'wellness', name: 'Wellness', agents: 5, buildings: 4, activity: 74 },
  { id: 'innovation', name: 'Innovation', agents: 7, buildings: 5, activity: 88 },
  { id: 'safety', name: 'Safety', agents: 4, buildings: 3, activity: 56 },
  { id: 'legal', name: 'Legal', agents: 3, buildings: 3, activity: 48 },
  { id: 'media', name: 'Media', agents: 5, buildings: 4, activity: 71 },
  { id: 'residential', name: 'Residential', agents: 5, buildings: 6, activity: 63 },
]

/* ──────────────────────── animation variants ──────────────────────── */

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
}

const slideUpVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease } },
}

/* ──────────────────────── GaugeChart ──────────────────────── */

function GaugeChart({
  value,
  max,
  color,
  label,
  sublabel,
  size = 72,
}: {
  value: number
  max: number
  color: string
  label: string
  sublabel: string
  size?: number
}) {
  const pct = Math.min(value / max, 1)
  const strokeWidth = 7
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const arcLength = circumference * 0.75
  const offset = arcLength * (1 - pct)
  const rotation = 135

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#1A1A24"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference - arcLength}`}
            strokeLinecap="round"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference - arcLength}`}
            strokeDashoffset={offset}
            strokeLinecap="round"
            initial={{ strokeDashoffset: arcLength }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.8, ease, delay: 0.5 }}
          />
        </svg>
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ transform: 'rotate(0deg)' }}
        >
          <span
            className="text-sm font-semibold tabular-nums leading-tight"
            style={{ fontFamily: "'JetBrains Mono', monospace", color }}
          >
            {value}
          </span>
          <span
            className="text-[9px] text-[#5A5A6A] tabular-nums"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            /min
          </span>
        </div>
      </div>
      <span
        className="text-[11px] text-[#F0F0F5] font-medium whitespace-nowrap"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        {label}
      </span>
      <span
        className="text-[9px] text-[#5A5A6A]"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        {sublabel}
      </span>
    </div>
  )
}

/* ──────────────────────── StatsRow ──────────────────────── */

function StatsRow() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4"
    >
      {KPI_DATA.map((kpi) => (
        <motion.div
          key={kpi.label}
          variants={slideUpVariants}
          className="glass-panel p-5 glass-panel-hover cursor-default group"
          style={{ borderLeft: `3px solid ${kpi.color}` }}
        >
          <div className="flex items-start justify-between mb-3">
            <span
              className="text-[10px] uppercase tracking-wider"
              style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-muted)' }}
            >
              {kpi.label}
            </span>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${kpi.color}15` }}
            >
              <kpi.icon className="w-4 h-4" style={{ color: kpi.color }} />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 mb-1">
            <AnimatedNumber
              value={kpi.value}
              suffix={kpi.suffix || ''}
              color={kpi.color}
            />
          </div>
          <div className="flex items-center justify-between">
            <span
              className="text-[10px] text-[#5A5A6A]"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {kpi.sublabel}
            </span>
            {kpi.trendUp !== null && (
              <span
                className={`text-[10px] flex items-center gap-0.5 tabular-nums ${
                  kpi.trendUp === true
                    ? 'text-[#2ECC71]'
                    : kpi.trendUp === false
                      ? 'text-[#E74C3C]'
                      : 'text-[#8A8A9A]'
                }`}
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                {kpi.trendUp === true ? (
                  <TrendingUp className="w-3 h-3" />
                ) : kpi.trendUp === false ? (
                  <TrendingDown className="w-3 h-3" />
                ) : (
                  <Minus className="w-3 h-3" />
                )}
                {kpi.trend}
              </span>
            )}
          </div>
        </motion.div>
      ))}
    </motion.div>
  )
}

/* ──────────────────────── AnimatedNumber ──────────────────────── */

function AnimatedNumber({
  value,
  suffix = '',
  color,
  size = 'lg',
}: {
  value: number
  suffix?: string
  color: string
  size?: 'lg' | 'md' | 'sm'
}) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const duration = 800
    const start = performance.now()
    const from = 0
    const to = value

    function tick(now: number) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(from + (to - from) * eased)
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [value])

  const formatted =
    value % 1 !== 0 ? display.toFixed(1) : Math.floor(display).toLocaleString()

  const sizeClass =
    size === 'lg' ? 'text-[28px] lg:text-[32px]' : size === 'md' ? 'text-xl' : 'text-sm'

  return (
    <span
      className={`font-semibold tabular-nums ${sizeClass}`}
      style={{ fontFamily: "'JetBrains Mono', monospace", color }}
    >
      {formatted}
      {suffix}
    </span>
  )
}

/* ──────────────────────── ProtocolActivity ──────────────────────── */

function ProtocolActivity() {
  return (
    <motion.div
      variants={slideUpVariants}
      className="glass-panel p-5"
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3
            className="text-[15px] font-semibold text-[#F0F0F5]"
            style={{ fontFamily: "'Orbitron', sans-serif" }}
          >
            Protocol Activity
          </h3>
          <p
            className="text-xs text-[#5A5A6A] mt-0.5"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            Real-time protocol usage across all agents
          </p>
        </div>
        <div className="flex items-center gap-1 bg-[#12121A] rounded-lg p-0.5 border border-[#2A2A35]">
          {['1H', '6H', '24H', '7D'].map((t) => (
            <button
              key={t}
              className="px-2.5 py-1 text-[10px] rounded-md transition-all duration-150"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
              onClick={() => {}}
            >
              <span
                className={
                  t === '24H'
                    ? 'text-[#D4AF37] font-semibold'
                    : 'text-[#5A5A6A] hover:text-[#8A8A9A]'
                }
              >
                {t}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Gauges */}
      <div className="flex flex-wrap justify-around gap-4 mb-6">
        {PROTOCOLS.map((p) => (
          <GaugeChart
            key={p.key}
            value={p.rate}
            max={p.max}
            color={p.color}
            label={p.label}
            sublabel={p.full}
          />
        ))}
      </div>

      {/* Timeline chart */}
      <div className="h-[180px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={PROTOCOL_TIMELINE}>
            <defs>
              {PROTOCOLS.map((p) => (
                <linearGradient key={p.key} id={`grad-${p.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={p.color} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={p.color} stopOpacity={0.02} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A2A35" vertical={false} />
            <XAxis
              dataKey="hour"
              tick={{ fill: '#5A5A6A', fontSize: 9, fontFamily: "'JetBrains Mono', monospace" }}
              axisLine={false}
              tickLine={false}
              interval={3}
            />
            <YAxis
              tick={{ fill: '#5A5A6A', fontSize: 9, fontFamily: "'JetBrains Mono', monospace" }}
              axisLine={false}
              tickLine={false}
              width={30}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1A1A24',
                border: '1px solid #2A2A35',
                borderRadius: 8,
                fontSize: 11,
                fontFamily: "'JetBrains Mono', monospace",
              }}
              itemStyle={{ color: '#F0F0F5' }}
              labelStyle={{ color: '#5A5A6A', marginBottom: 4 }}
            />
            {PROTOCOLS.map((p) => (
              <Area
                key={p.key}
                type="monotone"
                dataKey={p.key}
                stroke={p.color}
                strokeWidth={1.5}
                fill={`url(#grad-${p.key})`}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}

/* ──────────────────────── TransactionFeed ──────────────────────── */

function TransactionFeed() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [txs] = useState(MOCK_TRANSACTIONS)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0
    }
  }, [])

  const formatTime = (min: number) => {
    if (min < 60) return `${min}m ago`
    const h = Math.floor(min / 60)
    return `${h}h ${min % 60}m ago`
  }

  return (
    <motion.div
      variants={slideUpVariants}
      className="glass-panel p-5 flex flex-col"
    >
      <div className="flex items-center justify-between mb-4">
        <h3
          className="text-[15px] font-semibold text-[#F0F0F5]"
          style={{ fontFamily: "'Orbitron', sans-serif" }}
        >
          Live Transaction Feed
        </h3>
        <div className="flex items-center gap-1.5">
          <span
            className="w-1.5 h-1.5 rounded-full bg-[#2ECC71] animate-pulse-dot"
          />
          <span
            className="text-[10px] text-[#5A5A6A] tabular-nums"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            47/hr
          </span>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto pr-1 space-y-1"
        style={{ maxHeight: 380, minHeight: 380 }}
      >
        {txs.map((tx, i) => {
          const protoColor = PROTOCOL_COLORS[tx.protocol] || '#8A8A9A'
          const isHighValue = tx.amount > 30
          return (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03, duration: 0.3, ease }}
              className="flex items-center gap-3 py-2.5 px-3 rounded-lg transition-colors duration-150 hover:bg-[#1A1A24] group"
              style={{
                borderLeft: `2px solid ${protoColor}`,
                backgroundColor: isHighValue ? `${protoColor}08` : undefined,
              }}
            >
              <div className="flex items-center gap-1 flex-shrink-0">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                  style={{ backgroundColor: `${protoColor}40` }}
                >
                  {tx.from[0]}
                </div>
                <ArrowRight className="w-3 h-3 text-[#5A5A6A]" />
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                  style={{ backgroundColor: `${protoColor}40` }}
                >
                  {tx.to[0]}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[#F0F0F5] truncate">
                  <span className="font-medium">{tx.from}</span>
                  {' '}
                  <span className="text-[#5A5A6A]">paid</span>
                  {' '}
                  <span className="font-medium">{tx.to}</span>
                  {' '}
                  <span className="text-[#5A5A6A]">{tx.amount} x402</span>
                </p>
                <p className="text-[10px] text-[#5A5A6A] truncate">
                  {tx.service} — {formatTime(tx.timeAgo)}
                </p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span
                  className="px-1.5 py-0.5 rounded text-[9px] font-semibold"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    backgroundColor: `${protoColor}15`,
                    color: protoColor,
                    border: `1px solid ${protoColor}30`,
                  }}
                >
                  {tx.protocol.toUpperCase()}
                </span>
              </div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

/* ──────────────────────── AgentActivityBreakdown ──────────────────────── */

function AgentActivityBreakdown() {
  const [activeTab, setActiveTab] = useState<'activity' | 'needs' | 'social'>('activity')
  const totalAgents = ACTIVITY_DATA.reduce((s, d) => s + d.count, 0)

  const pieData = ACTIVITY_DATA.map((d) => ({
    name: d.name,
    value: Math.round((d.count / totalAgents) * 100),
    color: d.color,
    count: d.count,
  }))

  return (
    <motion.div
      variants={slideUpVariants}
      className="glass-panel p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h3
          className="text-[15px] font-semibold text-[#F0F0F5]"
          style={{ fontFamily: "'Orbitron', sans-serif" }}
        >
          Agent Activity
        </h3>
        <div className="flex items-center gap-0.5 bg-[#12121A] rounded-lg p-0.5 border border-[#2A2A35]">
          {(['activity', 'needs', 'social'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className="px-2.5 py-1 text-[10px] rounded-md transition-all duration-150 capitalize"
              style={{
                fontFamily: "'Inter', sans-serif",
                ...(activeTab === t
                  ? { backgroundColor: '#D4AF3720', color: '#D4AF37', fontWeight: 600 }
                  : { color: '#5A5A6A' }),
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'activity' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Donut chart */}
          <div>
            <div className="h-[200px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1A1A24',
                      border: '1px solid #2A2A35',
                      borderRadius: 8,
                      fontSize: 11,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                    formatter={(value: number, name: string) => [`${value}%`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span
                  className="text-lg font-bold text-[#F0F0F5]"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {totalAgents}
                </span>
                <span className="text-[9px] text-[#5A5A6A]">agents</span>
              </div>
            </div>
            {/* Legend */}
            <div className="flex flex-wrap gap-2 mt-2 justify-center">
              {pieData.map((d) => (
                <div key={d.name} className="flex items-center gap-1">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: d.color }}
                  />
                  <span className="text-[10px] text-[#8A8A9A]">{d.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Horizontal bars */}
          <div className="space-y-3">
            {ACTIVITY_DATA.map((d, i) => (
              <motion.div
                key={d.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3, ease }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-[#8A8A9A]">{d.name}</span>
                  <span
                    className="text-[11px] tabular-nums"
                    style={{ fontFamily: "'JetBrains Mono', monospace", color: d.color }}
                  >
                    {d.count}
                  </span>
                </div>
                <div className="h-2 bg-[#1A1A24] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: d.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(d.count / 18) * 100}%` }}
                    transition={{ duration: 0.5, ease, delay: 0.3 + i * 0.05 }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'needs' && (
        <div className="space-y-3">
          {NEEDS_DATA.map((need, i) => {
            const warning = need.value < 50
            const alertLevel = need.value < 30
            return (
              <motion.div
                key={need.name}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.3, ease }}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-[#8A8A9A]">{need.name}</span>
                    {alertLevel && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#E74C3C]" />
                    )}
                    {warning && !alertLevel && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#F39C12]" />
                    )}
                  </div>
                  <span
                    className="text-[11px] tabular-nums"
                    style={{ fontFamily: "'JetBrains Mono', monospace", color: need.color }}
                  >
                    {need.value}%
                  </span>
                </div>
                <div className="h-2.5 bg-[#1A1A24] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      backgroundColor: need.color,
                      boxShadow: `0 0 8px ${need.color}40`,
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${need.value}%` }}
                    transition={{ duration: 0.5, ease, delay: 0.2 + i * 0.04 }}
                  />
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {activeTab === 'social' && <SocialNetworkGraph />}
    </motion.div>
  )
}

/* ──────────────────────── SocialNetworkGraph ──────────────────────── */

function SocialNetworkGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const agents = useMemo(
    () =>
      AGENT_NAMES.slice(0, 35).map((name, i) => {
        const districts: District[] = [
          'central', 'governance', 'commerce', 'wellness', 'innovation',
          'safety', 'legal', 'media', 'residential',
        ]
        const d = districts[i % districts.length]
        return {
          name,
          x: 0,
          y: 0,
          vx: 0,
          vy: 0,
          color: DISTRICT_COLORS[d],
          district: d,
        }
      }),
    []
  )

  const friendships = useMemo(() => {
    const edges: [number, number, number][] = []
    for (let i = 0; i < agents.length; i++) {
      for (let j = i + 1; j < agents.length; j++) {
        if (Math.random() < 0.08) {
          edges.push([i, j, Math.random() * 0.8 + 0.2])
        }
      }
    }
    return edges
  }, [agents])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const w = canvas.offsetWidth
    const h = canvas.offsetHeight
    canvas.width = w * dpr
    canvas.height = h * dpr
    ctx.scale(dpr, dpr)

    // Seed positions in clusters by district
    const districtGroups: Record<string, { cx: number; cy: number }> = {
      central: { cx: w * 0.5, cy: h * 0.5 },
      governance: { cx: w * 0.25, cy: h * 0.3 },
      commerce: { cx: w * 0.75, cy: h * 0.3 },
      wellness: { cx: w * 0.2, cy: h * 0.6 },
      innovation: { cx: w * 0.8, cy: h * 0.6 },
      safety: { cx: w * 0.35, cy: h * 0.75 },
      legal: { cx: w * 0.65, cy: h * 0.75 },
      media: { cx: w * 0.5, cy: h * 0.2 },
      residential: { cx: w * 0.5, cy: h * 0.85 },
    }

    agents.forEach((a) => {
      const g = districtGroups[a.district] || districtGroups.central
      a.x = g.cx + (Math.random() - 0.5) * 60
      a.y = g.cy + (Math.random() - 0.5) * 60
    })

    // Simple force-directed iterations
    for (let iter = 0; iter < 80; iter++) {
      // Repulsion
      for (let i = 0; i < agents.length; i++) {
        for (let j = i + 1; j < agents.length; j++) {
          const dx = agents[j].x - agents[i].x
          const dy = agents[j].y - agents[i].y
          const dist = Math.sqrt(dx * dx + dy * dy) || 1
          const force = 200 / (dist * dist + 1)
          const fx = (dx / dist) * force
          const fy = (dy / dist) * force
          agents[i].x -= fx
          agents[i].y -= fy
          agents[j].x += fx
          agents[j].y += fy
        }
      }
      // Attraction for friends
      friendships.forEach(([a, b, strength]) => {
        const dx = agents[b].x - agents[a].x
        const dy = agents[b].y - agents[a].y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const force = dist * 0.001 * strength
        agents[a].x += (dx / dist) * force
        agents[a].y += (dy / dist) * force
        agents[b].x -= (dx / dist) * force
        agents[b].y -= (dy / dist) * force
      })
      // Center gravity
      agents.forEach((a) => {
        a.x += (w * 0.5 - a.x) * 0.005
        a.y += (h * 0.5 - a.y) * 0.005
      })
    }

    // Draw
    ctx.clearRect(0, 0, w, h)

    // Edges
    friendships.forEach(([a, b, strength]) => {
      ctx.beginPath()
      ctx.moveTo(agents[a].x, agents[a].y)
      ctx.lineTo(agents[b].x, agents[b].y)
      ctx.strokeStyle = `rgba(212,175,55,${strength * 0.2})`
      ctx.lineWidth = strength * 1.5
      ctx.stroke()
    })

    // Nodes
    agents.forEach((a) => {
      ctx.beginPath()
      ctx.arc(a.x, a.y, 4, 0, Math.PI * 2)
      ctx.fillStyle = a.color
      ctx.fill()
      ctx.shadowColor = a.color
      ctx.shadowBlur = 8
      ctx.stroke()
      ctx.shadowBlur = 0
    })

    // Labels for a few
    const labelIndices = [0, 5, 10, 15, 20, 25, 30]
    ctx.font = "9px 'JetBrains Mono', monospace"
    ctx.fillStyle = '#8A8A9A'
    ctx.textAlign = 'center'
    labelIndices.forEach((i) => {
      if (agents[i]) {
        ctx.fillText(agents[i].name, agents[i].x, agents[i].y + 14)
      }
    })
  }, [agents, friendships])

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: 260, borderRadius: 8 }}
      />
      <div className="flex flex-wrap gap-2 mt-2 justify-center">
        {Object.entries(DISTRICT_COLORS).slice(0, 6).map(([name, color]) => (
          <div key={name} className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-[9px] text-[#5A5A6A] capitalize">{name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ──────────────────────── EconomyDashboard ──────────────────────── */

function EconomyDashboard() {
  return (
    <motion.div variants={slideUpVariants} className="glass-panel p-5">
      <div className="mb-4">
        <h3
          className="text-[15px] font-semibold text-[#F0F0F5]"
          style={{ fontFamily: "'Orbitron', sans-serif" }}
        >
          Economy
        </h3>
        <p
          className="text-xs text-[#5A5A6A] mt-0.5"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          Town wealth distribution and transaction volume
        </p>
      </div>

      {/* Treasury */}
      <div className="bg-[#12121A] rounded-xl p-4 mb-4 border border-[#2A2A35]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-[#5A5A6A] uppercase tracking-wider">Town Treasury</span>
          <TrendingUp className="w-3.5 h-3.5 text-[#2ECC71]" />
        </div>
        <div className="flex items-baseline gap-2">
          <AnimatedNumber value={245.8} suffix=" x402" color="#D4AF37" size="lg" />
          <span className="text-[10px] text-[#2ECC71] flex items-center gap-0.5">
            <ChevronUp className="w-3 h-3" />
            +3.2%
          </span>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t border-[#2A2A35]">
          <div>
            <p className="text-[9px] text-[#5A5A6A]">Daily Tax</p>
            <p className="text-xs font-semibold text-[#00E5FF] tabular-nums" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              42.5
            </p>
          </div>
          <div>
            <p className="text-[9px] text-[#5A5A6A]">Spending</p>
            <p className="text-xs font-semibold text-[#E67E22] tabular-nums" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              38.2
            </p>
          </div>
          <div>
            <p className="text-[9px] text-[#5A5A6A]">Net Flow</p>
            <p className="text-xs font-semibold text-[#2ECC71] tabular-nums" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              +4.3
            </p>
          </div>
        </div>
      </div>

      {/* Wealth Distribution */}
      <div className="mb-4">
        <span className="text-[10px] text-[#5A5A6A] uppercase tracking-wider mb-2 block">
          Wealth Distribution
        </span>
        <div className="h-[120px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={WEALTH_DISTRIBUTION}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2A35" vertical={false} />
              <XAxis
                dataKey="range"
                tick={{ fill: '#5A5A6A', fontSize: 9, fontFamily: "'JetBrains Mono', monospace" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#5A5A6A', fontSize: 9, fontFamily: "'JetBrains Mono', monospace" }}
                axisLine={false}
                tickLine={false}
                width={20}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1A1A24',
                  border: '1px solid #2A2A35',
                  borderRadius: 8,
                  fontSize: 11,
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              />
              <Bar dataKey="count" fill="#D4AF37" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Price Index */}
      <div>
        <span className="text-[10px] text-[#5A5A6A] uppercase tracking-wider mb-2 block">
          Price Index (7 days)
        </span>
        <div className="h-[100px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={PRICE_INDEX}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2A35" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fill: '#5A5A6A', fontSize: 9, fontFamily: "'JetBrains Mono', monospace" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide domain={['dataMin - 2', 'dataMax + 2']} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1A1A24',
                  border: '1px solid #2A2A35',
                  borderRadius: 8,
                  fontSize: 11,
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              />
              <Line type="monotone" dataKey="food" stroke="#00E5FF" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="entertainment" stroke="#9B59B6" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="housing" stroke="#D4AF37" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex gap-4 mt-2 justify-center">
          {[
            { label: 'Food', color: '#00E5FF' },
            { label: 'Entertainment', color: '#9B59B6' },
            { label: 'Housing', color: '#D4AF37' },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-1">
              <span className="w-2 h-0.5 rounded" style={{ backgroundColor: l.color }} />
              <span className="text-[9px] text-[#5A5A6A]">{l.label}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

/* ──────────────────────── DistrictOverview ──────────────────────── */

function DistrictOverview() {
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null)

  return (
    <motion.div variants={slideUpVariants} className="glass-panel p-5">
      <h3
        className="text-[15px] font-semibold text-[#F0F0F5] mb-4"
        style={{ fontFamily: "'Orbitron', sans-serif" }}
      >
        District Overview
      </h3>

      {/* Mini Map */}
      <div className="relative bg-[#0A0A0F] rounded-xl border border-[#2A2A35] mb-4 overflow-hidden" style={{ height: 220 }}>
        <svg viewBox="0 0 300 200" className="w-full h-full">
          {/* District zones */}
          {DISTRICTS.map((d, i) => {
            const positions = [
              { x: 110, y: 80, w: 80, h: 60 },
              { x: 20, y: 20, w: 80, h: 60 },
              { x: 200, y: 20, w: 80, h: 60 },
              { x: 10, y: 100, w: 70, h: 50 },
              { x: 220, y: 100, w: 70, h: 50 },
              { x: 70, y: 140, w: 70, h: 50 },
              { x: 160, y: 140, w: 70, h: 50 },
              { x: 110, y: 5, w: 80, h: 50 },
              { x: 100, y: 155, w: 100, h: 40 },
            ]
            const p = positions[i]
            const isSelected = selectedDistrict === d.id
            return (
              <g
                key={d.id}
                onClick={() =>
                  setSelectedDistrict(isSelected ? null : d.id)
                }
                className="cursor-pointer"
              >
                <rect
                  x={p.x}
                  y={p.y}
                  width={p.w}
                  height={p.h}
                  rx={6}
                  fill={`${DISTRICT_COLORS[d.id]}15`}
                  stroke={isSelected ? DISTRICT_COLORS[d.id] : `${DISTRICT_COLORS[d.id]}40`}
                  strokeWidth={isSelected ? 2 : 1}
                  style={{
                    filter: isSelected
                      ? `drop-shadow(0 0 8px ${DISTRICT_COLORS[d.id]}60)`
                      : 'none',
                    transition: 'all 0.2s ease-out',
                  }}
                />
                <text
                  x={p.x + p.w / 2}
                  y={p.y + p.h / 2 - 4}
                  textAnchor="middle"
                  fill={DISTRICT_COLORS[d.id]}
                  fontSize={8}
                  fontFamily="'Orbitron', sans-serif"
                  fontWeight={600}
                >
                  {d.name}
                </text>
                <text
                  x={p.x + p.w / 2}
                  y={p.y + p.h / 2 + 8}
                  textAnchor="middle"
                  fill="#8A8A9A"
                  fontSize={7}
                  fontFamily="'JetBrains Mono', monospace"
                >
                  {d.agents} agents
                </text>
              </g>
            )
          })}
          {/* Connecting lines */}
          <line x1="150" y1="80" x2="60" y2="50" stroke="#2A2A35" strokeWidth={1} strokeDasharray="2 2" />
          <line x1="150" y1="80" x2="240" y2="50" stroke="#2A2A35" strokeWidth={1} strokeDasharray="2 2" />
          <line x1="150" y1="80" x2="45" y2="125" stroke="#2A2A35" strokeWidth={1} strokeDasharray="2 2" />
          <line x1="150" y1="80" x2="255" y2="125" stroke="#2A2A35" strokeWidth={1} strokeDasharray="2 2" />
          <line x1="150" y1="140" x2="105" y2="165" stroke="#2A2A35" strokeWidth={1} strokeDasharray="2 2" />
          <line x1="150" y1="140" x2="195" y2="165" stroke="#2A2A35" strokeWidth={1} strokeDasharray="2 2" />
        </svg>
      </div>

      {/* District cards grid */}
      <div className="grid grid-cols-3 gap-2">
        {DISTRICTS.map((d, i) => {
          const isSelected = selectedDistrict === d.id
          return (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.3, ease }}
              onClick={() => setSelectedDistrict(isSelected ? null : d.id)}
              className="rounded-lg p-2.5 cursor-pointer transition-all duration-200"
              style={{
                backgroundColor: isSelected ? `${DISTRICT_COLORS[d.id]}15` : '#12121A',
                border: `1px solid ${isSelected ? `${DISTRICT_COLORS[d.id]}60` : '#2A2A35'}`,
              }}
            >
              <div
                className="h-[3px] rounded-full mb-2"
                style={{ backgroundColor: DISTRICT_COLORS[d.id] }}
              />
              <p className="text-[10px] text-[#F0F0F5] font-medium">{d.name}</p>
              <p
                className="text-[11px] tabular-nums mt-0.5"
                style={{ fontFamily: "'JetBrains Mono', monospace", color: DISTRICT_COLORS[d.id] }}
              >
                {d.agents}
              </p>
              <div className="mt-1.5 h-1 bg-[#1A1A24] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${d.activity}%`,
                    backgroundColor: DISTRICT_COLORS[d.id],
                  }}
                />
              </div>
              <p className="text-[8px] text-[#5A5A6A] mt-0.5">{d.buildings} buildings</p>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

/* ──────────────────────── SystemHealth ──────────────────────── */

function SystemHealth() {
  const [fps, setFps] = useState(60)
  const [latency, setLatency] = useState(245)
  const [memory, setMemory] = useState(78)

  useEffect(() => {
    const interval = setInterval(() => {
      setFps(58 + Math.floor(Math.random() * 4))
      setLatency(235 + Math.floor(Math.random() * 20))
      setMemory(75 + Math.floor(Math.random() * 6))
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (value: number, type: 'fps' | 'latency' | 'memory') => {
    if (type === 'fps') return value >= 55 ? '#2ECC71' : value >= 30 ? '#F39C12' : '#E74C3C'
    if (type === 'latency') return value <= 300 ? '#2ECC71' : value <= 500 ? '#F39C12' : '#E74C3C'
    return value <= 80 ? '#2ECC71' : value <= 90 ? '#F39C12' : '#E74C3C'
  }

  const getStatusLabel = (value: number, type: 'fps' | 'latency' | 'memory') => {
    if (type === 'fps') return value >= 55 ? 'Excellent' : value >= 30 ? 'Fair' : 'Poor'
    if (type === 'latency') return value <= 300 ? 'Good' : value <= 500 ? 'Elevated' : 'High'
    return value <= 80 ? 'Normal' : value <= 90 ? 'Warning' : 'Critical'
  }

  return (
    <motion.div variants={slideUpVariants} className="glass-panel p-5">
      <div className="flex items-center justify-between mb-4">
        <h3
          className="text-[15px] font-semibold text-[#F0F0F5]"
          style={{ fontFamily: "'Orbitron', sans-serif" }}
        >
          System Health
        </h3>
        <div className="flex items-center gap-1.5">
          <span
            className="w-1.5 h-1.5 rounded-full bg-[#2ECC71] animate-pulse-dot"
          />
          <span className="text-[10px] text-[#2ECC71] font-medium">Operational</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* ECS Performance */}
        <div className="bg-[#12121A] rounded-xl p-4 border border-[#2A2A35]">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-[#2ECC7115] flex items-center justify-center">
              <Zap className="w-4 h-4 text-[#2ECC71]" />
            </div>
            <div>
              <p className="text-[10px] text-[#5A5A6A] uppercase tracking-wider">ECS Performance</p>
            </div>
          </div>
          <p
            className="text-2xl font-bold tabular-nums"
            style={{ fontFamily: "'JetBrains Mono', monospace", color: getStatusColor(fps, 'fps') }}
          >
            {fps}
            <span className="text-xs font-medium text-[#5A5A6A] ml-1">fps</span>
          </p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[9px] text-[#5A5A6A]">Frame time: 16.7ms</span>
            <span
              className="text-[9px] font-medium px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: `${getStatusColor(fps, 'fps')}15`,
                color: getStatusColor(fps, 'fps'),
              }}
            >
              {getStatusLabel(fps, 'fps')}
            </span>
          </div>
        </div>

        {/* LLM API Latency */}
        <div className="bg-[#12121A] rounded-xl p-4 border border-[#2A2A35]">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-[#3498DB15] flex items-center justify-center">
              <Brain className="w-4 h-4 text-[#3498DB]" />
            </div>
            <div>
              <p className="text-[10px] text-[#5A5A6A] uppercase tracking-wider">LLM API Latency</p>
            </div>
          </div>
          <p
            className="text-2xl font-bold tabular-nums"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              color: getStatusColor(latency, 'latency'),
            }}
          >
            {latency}
            <span className="text-xs font-medium text-[#5A5A6A] ml-1">ms</span>
          </p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[9px] text-[#5A5A6A]">OpenAI GPT-4o</span>
            <span
              className="text-[9px] font-medium px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: `${getStatusColor(latency, 'latency')}15`,
                color: getStatusColor(latency, 'latency'),
              }}
            >
              {getStatusLabel(latency, 'latency')}
            </span>
          </div>
        </div>

        {/* Memory Usage */}
        <div className="bg-[#12121A] rounded-xl p-4 border border-[#2A2A35]">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-[#E67E2215] flex items-center justify-center">
              <MemoryStick className="w-4 h-4 text-[#E67E22]" />
            </div>
            <div>
              <p className="text-[10px] text-[#5A5A6A] uppercase tracking-wider">Memory Usage</p>
            </div>
          </div>
          <p
            className="text-2xl font-bold tabular-nums"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              color: getStatusColor(memory, 'memory'),
            }}
          >
            {memory}
            <span className="text-xs font-medium text-[#5A5A6A] ml-1">%</span>
          </p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[9px] text-[#5A5A6A]">234 MB / 300 MB</span>
            <span
              className="text-[9px] font-medium px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: `${getStatusColor(memory, 'memory')}15`,
                color: getStatusColor(memory, 'memory'),
              }}
            >
              {getStatusLabel(memory, 'memory')}
            </span>
          </div>
          <div className="mt-2 h-1.5 bg-[#1A1A24] rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: getStatusColor(memory, 'memory') }}
              animate={{ width: `${memory}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>

      {/* Tick rate graph */}
      <div className="mt-4">
        <span className="text-[10px] text-[#5A5A6A] uppercase tracking-wider mb-2 block">
          Simulation Tick Rate
        </span>
        <div className="h-[100px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={TICK_RATE_DATA}>
              <defs>
                <linearGradient id="tickGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00E5FF" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#00E5FF" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2A35" vertical={false} />
              <XAxis hide />
              <YAxis hide domain={[10, 25]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1A1A24',
                  border: '1px solid #2A2A35',
                  borderRadius: 8,
                  fontSize: 11,
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              />
              <Area
                type="monotone"
                dataKey="rate"
                stroke="#00E5FF"
                strokeWidth={1.5}
                fill="url(#tickGrad)"
              />
              <Line
                type="monotone"
                dataKey="expected"
                stroke="#D4AF37"
                strokeWidth={1}
                strokeDasharray="4 4"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex gap-4 mt-1 justify-center">
          <div className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-[#00E5FF] rounded" />
            <span className="text-[9px] text-[#5A5A6A]">Actual</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-[#D4AF37] rounded" style={{ background: 'repeating-linear-gradient(90deg, #D4AF37 0, #D4AF37 3px, transparent 3px, transparent 6px)' }} />
            <span className="text-[9px] text-[#5A5A6A]">Expected (20 tps)</span>
          </div>
        </div>
      </div>

      {/* Recent Logs */}
      <div className="mt-4 pt-3 border-t border-[#2A2A35]">
        <span className="text-[10px] text-[#5A5A6A] uppercase tracking-wider mb-2 block">
          Recent System Logs
        </span>
        <div className="space-y-1.5">
          {[
            { time: '14:32:01', msg: 'Agent #23 pathfinding recalculated', color: '#5A5A6A' },
            { time: '14:31:58', msg: 'x402 transaction batch processed: 12 tx', color: '#00E5FF' },
            { time: '14:31:55', msg: 'Weather transition: clear→rain initiated', color: '#3498DB' },
          ].map((log, i) => (
            <div key={i} className="flex items-center gap-2">
              <span
                className="text-[9px] tabular-nums"
                style={{ fontFamily: "'JetBrains Mono', monospace", color: '#5A5A6A' }}
              >
                [{log.time}]
              </span>
              <span className="text-[9px]" style={{ color: log.color }}>
                {log.msg}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

/* ──────────────────────── Main Dashboard ──────────────────────── */

export default function Dashboard() {
  const [lastUpdated, setLastUpdated] = useState(new Date())

  const handleRefresh = useCallback(() => {
    setLastUpdated(new Date())
  }, [])

  return (
    <div
      className="min-h-[100dvh] px-4 sm:px-6 py-6 lg:py-8"
      style={{
        background: `var(--bg-base)`,
      }}
    >
      {/* Radial glow background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'var(--gradient-radial-glow)',
          zIndex: 0,
        }}
      />

      <div className="relative z-10" style={{ maxWidth: 1440, margin: '0 auto' }}>
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease }}
          className="mb-8"
        >
          <h1
            className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#D4AF37] mb-2"
            style={{
              fontFamily: "'Orbitron', sans-serif",
              textShadow: '0 0 30px rgba(212,175,55,0.3)',
            }}
          >
            Agent 47 Town Dashboard
          </h1>
          <p
            className="text-base lg:text-lg text-[#8A8A9A] mb-3"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            Real-time simulation metrics and analytics
          </p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-[#2ECC71] animate-pulse-dot" />
              <span
                className="text-[11px] text-[#5A5A6A] tabular-nums"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                Last updated:{` ${lastUpdated.toLocaleTimeString('en-US', { hour12: false })}`}
                {' '}(live)
              </span>
            </div>
            <button
              onClick={handleRefresh}
              className="p-1.5 rounded-md transition-all duration-150 hover:bg-[#1A1A24] text-[#5A5A6A] hover:text-[#D4AF37]"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>

        {/* Stats Row */}
        <div className="mb-5">
          <StatsRow />
        </div>

        {/* Main Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-2 gap-5"
        >
          {/* Left column */}
          <div className="space-y-5">
            <ProtocolActivity />
            <AgentActivityBreakdown />
            <DistrictOverview />
          </div>

          {/* Right column */}
          <div className="space-y-5">
            <TransactionFeed />
            <EconomyDashboard />
            <SystemHealth />
          </div>
        </motion.div>
      </div>
    </div>
  )
}
