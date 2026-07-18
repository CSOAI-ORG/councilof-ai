import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sliders,
  Monitor,
  Volume2,
  User,
  CreditCard,
  Play,
  Pause,
  RotateCcw,
  Sun,
  CloudRain,
  Snowflake,
  CloudFog,
  UserPlus,
  ChevronDown,
  Check,
  Copy,
  Crown,
  Wallet,
  Shield,
  Fingerprint,
  LogOut,
  AlertTriangle,
  Github,
  Globe,
  Hexagon,
  ExternalLink,
  Gamepad2,
  Eye,
  Video,
  Map,
  Sparkles,
  VolumeX,
  Music,
  Wand2,
  TreePine,
  Clock,
} from 'lucide-react'
import { useTownStore } from '@/store/useTownStore'
import { PHEROMONE_COLORS } from '@/types'
import type { PheromoneType } from '@/types'
import type { ReactNode } from 'react'

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number]

/* ─── sidebar tabs ─── */
interface TabDef {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}
const TABS: TabDef[] = [
  { id: 'simulation', label: 'Simulation', icon: Sliders },
  { id: 'display', label: 'Display', icon: Monitor },
  { id: 'audio', label: 'Audio', icon: Volume2 },
  { id: 'account', label: 'Account', icon: User },
  { id: 'credits', label: 'Credits', icon: CreditCard },
]

/* ─── easing / motion ─── */
const panelVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
}

/* ═══════════════════════════════════════════
   SHARED UI PRIMITIVES
   ═══════════════════════════════════════════ */

/** Gold-styled range slider */
function GoldSlider({
  value,
  min,
  max,
  step,
  onChange,
  label,
  valueLabel,
}: {
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  label: string
  valueLabel?: string
}) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span
          className="text-xs uppercase tracking-wider"
          style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-muted)' }}
        >
          {label}
        </span>
        {valueLabel && (
          <span
            className="text-sm font-semibold"
            style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--gold)' }}
          >
            {valueLabel}
          </span>
        )}
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full gold-slider"
        style={
          {
            '--pct': `${pct}%`,
          } as React.CSSProperties
        }
      />
    </div>
  )
}

/** Custom toggle switch (gold on / gray off) */
function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  description?: string
}) {
  return (
    <label className="flex items-center justify-between cursor-pointer group">
      <div className="flex-1 pr-4">
        <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          {label}
        </div>
        {description && (
          <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {description}
          </div>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`
          relative w-10 h-[22px] rounded-full transition-all duration-200
          ${checked ? 'bg-[#D4AF37]' : 'bg-[#1A1A24]'}
        `}
        style={checked ? { boxShadow: '0 0 10px rgba(212,175,55,0.4)' } : {}}
      >
        <span
          className={`
            absolute top-[2px] left-[2px] w-[18px] h-[18px] rounded-full bg-white
            transition-transform duration-200
            ${checked ? 'translate-x-[18px]' : 'translate-x-0'}
          `}
          style={checked ? { boxShadow: '0 0 6px rgba(212,175,55,0.6)' } : {}}
        />
      </button>
    </label>
  )
}

/** Section glass panel */
function SectionPanel({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`glass-panel p-6 mb-6 ${className}`}
    >
      {children}
    </div>
  )
}

/** Section header */
function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h2
        className="text-xl font-semibold mb-1"
        style={{ fontFamily: "'Orbitron', sans-serif", color: 'var(--text-primary)' }}
      >
        {title}
      </h2>
      {subtitle && (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {subtitle}
        </p>
      )}
    </div>
  )
}

/** Button group selector */
function ButtonGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; icon?: React.ComponentType<{ className?: string }> }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const Icon = opt.icon
        const isActive = value === opt.value
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`
              flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium
              transition-all duration-150 border
              ${isActive
                ? 'bg-[#D4AF37]/10 border-[#D4AF37] text-[#D4AF37]'
                : 'bg-transparent border-[#2A2A35] text-[#8A8A9A] hover:border-[#3A3A48] hover:text-[#F0F0F5]'
              }
            `}
          >
            {Icon && <Icon className="w-4 h-4" />}
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

/** Animated audio visualizer bars */
function AudioVisualizer({ color = 'var(--gold)', active = true }: { color?: string; active?: boolean }) {
  const bars = [0.4, 0.7, 0.5, 0.9, 0.6, 0.8, 0.45, 0.75]
  return (
    <div className="flex items-end gap-[3px] h-6">
      {bars.map((h, i) => (
        <motion.div
          key={i}
          className="w-[3px] rounded-full"
          style={{ backgroundColor: color }}
          animate={
            active
              ? { height: [`${h * 8}px`, `${h * 20}px`, `${h * 8}px`] }
              : { height: '3px' }
          }
          transition={
            active
              ? { duration: 0.8 + i * 0.1, repeat: Infinity, ease: 'easeInOut' }
              : { duration: 0.2 }
          }
        />
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════
   TAB PANEL COMPONENTS
   ═══════════════════════════════════════════ */

/** ─── Tab 1: Simulation ─── */
function SimulationTab() {
  const { isPaused, togglePaused, simulationSpeed, setSimulationSpeed, weather, setWeather } =
    useTownStore()
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [resetInput, setResetInput] = useState('')
  const [agentCount, setAgentCount] = useState(25)
  const [dayNightCycle, setDayNightCycle] = useState(true)
  const [showSummonDropdown, setShowSummonDropdown] = useState(false)
  const summonRef = useRef<HTMLDivElement>(null)

  // Pheromone toggles
  const [pheromones, setPheromones] = useState<Record<PheromoneType, boolean>>({
    alarm: true,
    trail: true,
    queen: true,
    food: true,
    danger: true,
  })

  const togglePheromone = (type: PheromoneType) => {
    setPheromones((prev) => ({ ...prev, [type]: !prev[type] }))
  }

  // Time scale presets
  const timePresets = [0.25, 0.5, 1, 2, 5, 10]

  // Close summon dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (summonRef.current && !summonRef.current.contains(e.target as Node)) {
        setShowSummonDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleReset = () => {
    if (resetInput === 'RESET') {
      setShowResetConfirm(false)
      setResetInput('')
    }
  }

  const archetypes = [
    'Professional',
    'Creative',
    'Engineer',
    'Scientist',
    'Security',
    'Socialite',
    'Worker',
    'Mystic',
  ]

  return (
    <motion.div
      key="simulation"
      variants={panelVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      transition={{ duration: 0.35, ease }}
    >
      <SectionPanel>
        <SectionHeader
          title="Simulation Controls"
          subtitle="Control time, speed, and simulation state"
        />

        {/* Time Scale Slider */}
        <div className="mb-6">
          <GoldSlider
            value={simulationSpeed}
            min={0.25}
            max={10}
            step={0.25}
            onChange={setSimulationSpeed}
            label="Time Scale"
            valueLabel={`${simulationSpeed}x`}
          />
          <div className="flex flex-wrap gap-2 mt-3">
            {timePresets.map((preset) => (
              <button
                key={preset}
                onClick={() => setSimulationSpeed(preset)}
                className={`
                  px-3 py-1 rounded-md text-xs font-medium transition-all duration-150
                  ${simulationSpeed === preset
                    ? 'bg-[#D4AF37] text-[#0A0A0F]'
                    : 'bg-[#1A1A24] text-[#8A8A9A] border border-[#2A2A35] hover:border-[#3A3A48]'
                  }
                `}
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                {preset}x
              </button>
            ))}
          </div>
        </div>

        {/* Pause / Resume */}
        <div className="mb-6">
          <button
            onClick={togglePaused}
            className={`
              w-full sm:w-auto px-8 py-4 rounded-xl font-semibold text-sm
              transition-all duration-300 flex items-center justify-center gap-2
              ${isPaused
                ? 'bg-[#D4AF37]/20 text-[#D4AF37] border-2 border-[#D4AF37] hover:bg-[#D4AF37]/30'
                : 'bg-[#2ECC71]/20 text-[#2ECC71] border-2 border-[#2ECC71] hover:bg-[#2ECC71]/30'
              }
            `}
            style={
              isPaused
                ? { boxShadow: '0 0 20px rgba(212,175,55,0.3)' }
                : { boxShadow: '0 0 20px rgba(46,204,113,0.3)' }
            }
          >
            {isPaused ? (
              <>
                <Pause className="w-5 h-5" /> SIMULATION PAUSED
              </>
            ) : (
              <>
                <Play className="w-5 h-5" /> SIMULATION RUNNING
              </>
            )}
          </button>
          {!isPaused && (
            <motion.div
              className="mt-2 flex items-center gap-1.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <span className="w-2 h-2 rounded-full bg-[#2ECC71] animate-pulse" />
              <span
                className="text-[10px] uppercase tracking-wider"
                style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-muted)' }}
              >
                Live — agents are active
              </span>
            </motion.div>
          )}
        </div>

        {/* Weather */}
        <div className="mb-6">
          <span
            className="text-xs uppercase tracking-wider block mb-3"
            style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-muted)' }}
          >
            Weather Override
          </span>
          <div className="flex flex-wrap gap-2">
            {([
              { value: 'clear', icon: Sun, label: 'Clear' },
              { value: 'rain', icon: CloudRain, label: 'Rain' },
              { value: 'snow', icon: Snowflake, label: 'Snow' },
              { value: 'fog', icon: CloudFog, label: 'Fog' },
            ] as const).map(({ value, icon: Icon, label }) => (
              <button
                key={value}
                onClick={() => setWeather(value)}
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium
                  transition-all duration-150 border
                  ${weather === value
                    ? 'bg-[#D4AF37]/10 border-[#D4AF37] text-[#D4AF37]'
                    : 'bg-transparent border-[#2A2A35] text-[#8A8A9A] hover:border-[#3A3A48]'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Day/Night + Agent Density */}
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <Toggle checked={dayNightCycle} onChange={setDayNightCycle} label="Day/Night Cycle" />
          <div>
            <GoldSlider
              value={agentCount}
              min={10}
              max={47}
              step={1}
              onChange={setAgentCount}
              label="Agent Density"
              valueLabel={`${agentCount}/47`}
            />
          </div>
        </div>

        {/* Pheromone Toggles */}
        <div className="mb-6">
          <span
            className="text-xs uppercase tracking-wider block mb-3"
            style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-muted)' }}
          >
            Pheromone Visibility
          </span>
          <div className="grid sm:grid-cols-2 gap-3">
            {(Object.entries(PHEROMONE_COLORS) as [PheromoneType, string][]).map(
              ([type, color]) => (
                <label
                  key={type}
                  className="flex items-center justify-between cursor-pointer group p-2 rounded-lg hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: color,
                        boxShadow: `0 0 8px ${color}80`,
                      }}
                    />
                    <span className="text-sm capitalize" style={{ color: 'var(--text-secondary)' }}>
                      {type === 'alarm'
                        ? 'Alarm Red'
                        : type === 'trail'
                          ? 'Trail Cyan'
                          : type === 'queen'
                            ? 'Queen Gold'
                            : type === 'food'
                              ? 'Food Green'
                              : 'Danger Purple'}
                    </span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={pheromones[type]}
                    onClick={() => togglePheromone(type)}
                    className={`
                      relative w-8 h-[18px] rounded-full transition-all duration-200
                      ${pheromones[type] ? 'bg-[#D4AF37]' : 'bg-[#1A1A24]'}
                    `}
                  >
                    <span
                      className={`
                        absolute top-[1px] left-[1px] w-4 h-4 rounded-full bg-white
                        transition-transform duration-200
                        ${pheromones[type] ? 'translate-x-[14px]' : 'translate-x-0'}
                      `}
                    />
                  </button>
                </label>
              )
            )}
          </div>
        </div>

        {/* Summon Agent */}
        <div className="mb-4">
          <span
            className="text-xs uppercase tracking-wider block mb-3"
            style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-muted)' }}
          >
            Agent Spawning
          </span>
          <div className="relative inline-block" ref={summonRef}>
            <button
              onClick={() => setShowSummonDropdown(!showSummonDropdown)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium
                bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/40
                hover:bg-[#D4AF37]/20 transition-all duration-150"
            >
              <UserPlus className="w-4 h-4" />
              Summon Agent
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-150 ${showSummonDropdown ? 'rotate-180' : ''}`}
              />
            </button>
            <AnimatePresence>
              {showSummonDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 mt-2 w-48 glass-panel z-30 py-1"
                >
                  {archetypes.map((a) => (
                    <button
                      key={a}
                      onClick={() => setShowSummonDropdown(false)}
                      className="w-full text-left px-4 py-2 text-sm text-[#8A8A9A] hover:text-[#F0F0F5]
                        hover:bg-[#1A1A24] transition-colors"
                    >
                      {a}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </SectionPanel>

      {/* Reset Section */}
      <SectionPanel>
        <div
          className="border-l-2 border-[#E74C3C] pl-4 rounded"
          style={{ backgroundColor: 'rgba(231,76,60,0.05)' }}
        >
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-[#E74C3C]" />
            <span className="text-sm font-medium text-[#E74C3C]">Reset Simulation</span>
          </div>
          <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
            Clear all agent memories, reset economy, return to Day 1. This cannot be undone.
          </p>
          <button
            onClick={() => setShowResetConfirm(true)}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-[#E74C3C]/10
              text-[#E74C3C] border border-[#E74C3C]/40 hover:bg-[#E74C3C]/20
              transition-all duration-150 flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Everything
          </button>
        </div>
      </SectionPanel>

      {/* Reset Confirmation Modal */}
      <AnimatePresence>
        {showResetConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(5,5,8,0.85)' }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-panel p-6 max-w-sm w-full"
            >
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-[#E74C3C]" />
                <h3
                  className="text-lg font-semibold"
                  style={{ fontFamily: "'Orbitron', sans-serif", color: 'var(--text-primary)' }}
                >
                  Confirm Reset
                </h3>
              </div>
              <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                This will erase all simulation data. Type <strong className="text-[#E74C3C]">RESET</strong> to confirm.
              </p>
              <input
                type="text"
                value={resetInput}
                onChange={(e) => setResetInput(e.target.value)}
                placeholder="Type RESET..."
                className="w-full px-3 py-2 rounded-lg mb-4 text-sm border outline-none
                  focus:border-[#E74C3C] transition-colors"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  borderColor: 'var(--bg-border)',
                  color: 'var(--text-primary)',
                }}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowResetConfirm(false)
                    setResetInput('')
                  }}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-medium
                    bg-[#1A1A24] text-[#8A8A9A] border border-[#2A2A35]
                    hover:bg-[#2A2A35] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReset}
                  disabled={resetInput !== 'RESET'}
                  className={`
                    flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all
                    ${resetInput === 'RESET'
                      ? 'bg-[#E74C3C] text-white hover:bg-[#ff5a5a]'
                      : 'bg-[#E74C3C]/30 text-[#E74C3C]/50 cursor-not-allowed'
                    }
                  `}
                >
                  Reset
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/** ─── Tab 2: Display ─── */
function DisplayTab() {
  const {
    cameraMode,
    setCameraMode,
    showAgentNames,
    setShowAgentNames,
    showBuildingLabels,
    setShowBuildingLabels,
    showPheromones,
    setShowPheromones,
  } = useTownStore()

  const [quality, setQuality] = useState<'low' | 'medium' | 'high' | 'ultra'>('high')
  const [drawDistance, setDrawDistance] = useState(200)
  const [showMinimap, setShowMinimap] = useState(true)
  const [uiScale, setUiScale] = useState(100)
  const [bloom, setBloom] = useState(true)
  const [fullscreen, setFullscreen] = useState(false)
  const [showLabelsLocal, setShowLabelsLocal] = useState(showAgentNames)
  const [showBuildingLabelsLocal, setShowBuildingLabelsLocal] = useState(showBuildingLabels)
  const [showPheromonesLocal, setShowPheromonesLocal] = useState(showPheromones)

  const handleAgentLabelsChange = (v: boolean) => {
    setShowLabelsLocal(v)
    setShowAgentNames(v)
  }

  const handleBuildingLabelsChange = (v: boolean) => {
    setShowBuildingLabelsLocal(v)
    setShowBuildingLabels(v)
  }

  const handlePheromonesChange = (v: boolean) => {
    setShowPheromonesLocal(v)
    setShowPheromones(v)
  }

  return (
    <motion.div
      key="display"
      variants={panelVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      transition={{ duration: 0.35, ease }}
    >
      <SectionPanel>
        <SectionHeader title="Display Settings" subtitle="Graphics quality and visual preferences" />

        {/* Graphics Quality */}
        <div className="mb-6">
          <span
            className="text-xs uppercase tracking-wider block mb-3"
            style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-muted)' }}
          >
            Graphics Quality
          </span>
          <ButtonGroup
            options={[
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
              { value: 'ultra', label: 'Ultra' },
            ]}
            value={quality}
            onChange={setQuality}
          />
        </div>

        {/* Camera Mode */}
        <div className="mb-6">
          <span
            className="text-xs uppercase tracking-wider block mb-3"
            style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-muted)' }}
          >
            Camera Mode
          </span>
          <ButtonGroup
            options={[
              { value: 'isometric', label: 'Isometric', icon: Gamepad2 },
              { value: 'first-person', label: 'First-Person', icon: Eye },
              { value: 'follow', label: 'Follow', icon: Video },
              { value: 'cinematic', label: 'Cinematic', icon: Map },
            ]}
            value={cameraMode}
            onChange={(v) => setCameraMode(v as typeof cameraMode)}
          />
        </div>

        {/* Draw Distance */}
        <div className="mb-6">
          <GoldSlider
            value={drawDistance}
            min={50}
            max={500}
            step={10}
            onChange={setDrawDistance}
            label="Draw Distance"
            valueLabel={`${drawDistance}m`}
          />
        </div>

        {/* Toggles */}
        <div className="space-y-4 mb-6">
          <Toggle
            checked={showLabelsLocal}
            onChange={handleAgentLabelsChange}
            label="Show Agent Labels"
            description="Display names above agents in the 3D view"
          />
          <Toggle
            checked={showBuildingLabelsLocal}
            onChange={handleBuildingLabelsChange}
            label="Show Building Labels"
            description="Building names on hover or always visible"
          />
          <Toggle
            checked={showMinimap}
            onChange={setShowMinimap}
            label="Show Minimap"
            description="Toggle the mini map overlay"
          />
        </div>

        {/* UI Scale */}
        <div className="mb-6">
          <GoldSlider
            value={uiScale}
            min={75}
            max={150}
            step={25}
            onChange={setUiScale}
            label="UI Scale"
            valueLabel={`${uiScale}%`}
          />
        </div>

        {/* More toggles */}
        <div className="space-y-4">
          <Toggle
            checked={showPheromonesLocal}
            onChange={handlePheromonesChange}
            label="Particle Effects"
            description="Show pheromone particles in the world"
          />
          <Toggle checked={bloom} onChange={setBloom} label="Bloom / Post-Processing" />
          <Toggle checked={fullscreen} onChange={setFullscreen} label="Fullscreen" />
        </div>
      </SectionPanel>
    </motion.div>
  )
}

/** ─── Tab 3: Audio ─── */
function AudioTab() {
  const [masterVol, setMasterVol] = useState(80)
  const [musicVol, setMusicVol] = useState(50)
  const [sfxVol, setSfxVol] = useState(70)
  const [ambientVol, setAmbientVol] = useState(40)
  const [muted, setMuted] = useState(false)

  const applyPreset = (preset: 'all' | 'music' | 'minimal' | 'mute') => {
    switch (preset) {
      case 'all':
        setMasterVol(85)
        setMusicVol(75)
        setSfxVol(75)
        setAmbientVol(70)
        setMuted(false)
        break
      case 'music':
        setMasterVol(80)
        setMusicVol(80)
        setSfxVol(30)
        setAmbientVol(50)
        setMuted(false)
        break
      case 'minimal':
        setMasterVol(30)
        setMusicVol(20)
        setSfxVol(50)
        setAmbientVol(20)
        setMuted(false)
        break
      case 'mute':
        setMuted(true)
        setMasterVol(0)
        setMusicVol(0)
        setSfxVol(0)
        setAmbientVol(0)
        break
    }
  }

  return (
    <motion.div
      key="audio"
      variants={panelVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      transition={{ duration: 0.35, ease }}
    >
      <SectionPanel>
        <SectionHeader title="Audio Settings" subtitle="Sound and music preferences" />

        {/* Master */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {muted ? (
                <VolumeX className="w-4 h-4 text-[#E74C3C]" />
              ) : (
                <Volume2 className="w-4 h-4 text-[#D4AF37]" />
              )}
              <span
                className="text-xs uppercase tracking-wider"
                style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-muted)' }}
              >
                Master Volume
              </span>
            </div>
            <div className="flex items-center gap-3">
              <AudioVisualizer color={muted ? '#5A5A6A' : 'var(--gold)'} active={!muted} />
              <span
                className="text-sm font-semibold w-10 text-right"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  color: muted ? 'var(--text-muted)' : 'var(--gold)',
                }}
              >
                {masterVol}%
              </span>
            </div>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={masterVol}
            onChange={(e) => {
              const v = Number(e.target.value)
              setMasterVol(v)
              if (v > 0) setMuted(false)
            }}
            className="w-full gold-slider"
            style={{ '--pct': `${masterVol}%` } as React.CSSProperties}
          />
        </div>

        {/* Music */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Music className="w-4 h-4 text-[#00E5FF]" />
              <span
                className="text-xs uppercase tracking-wider"
                style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-muted)' }}
              >
                Music Volume
              </span>
            </div>
            <span
              className="text-sm font-semibold"
              style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--cyan)' }}
            >
              {musicVol}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={musicVol}
            onChange={(e) => setMusicVol(Number(e.target.value))}
            className="w-full cyan-slider"
            style={{ '--pct': `${musicVol}%` } as React.CSSProperties}
          />
        </div>

        {/* SFX */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-[#2ECC71]" />
              <span
                className="text-xs uppercase tracking-wider"
                style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-muted)' }}
              >
                SFX Volume
              </span>
            </div>
            <span
              className="text-sm font-semibold"
              style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--success)' }}
            >
              {sfxVol}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={sfxVol}
            onChange={(e) => setSfxVol(Number(e.target.value))}
            className="w-full green-slider"
            style={{ '--pct': `${sfxVol}%` } as React.CSSProperties}
          />
        </div>

        {/* Ambient */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TreePine className="w-4 h-4 text-[#E67E22]" />
              <span
                className="text-xs uppercase tracking-wider"
                style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-muted)' }}
              >
                Ambient Volume
              </span>
            </div>
            <span
              className="text-sm font-semibold"
              style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--district-innovation)' }}
            >
              {ambientVol}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={ambientVol}
            onChange={(e) => setAmbientVol(Number(e.target.value))}
            className="w-full orange-slider"
            style={{ '--pct': `${ambientVol}%` } as React.CSSProperties}
          />
        </div>

        {/* Mute + Presets */}
        <div className="flex flex-wrap items-center gap-3">
          <Toggle checked={muted} onChange={setMuted} label="Mute All" />
          <div className="flex flex-wrap gap-2 ml-auto">
            {([
              { key: 'all', label: 'All On' },
              { key: 'music', label: 'Music Focus' },
              { key: 'minimal', label: 'Minimal' },
              { key: 'mute', label: 'Mute All' },
            ] as const).map((p) => (
              <button
                key={p.key}
                onClick={() => applyPreset(p.key)}
                className="px-3 py-1.5 rounded-md text-xs font-medium
                  bg-[#1A1A24] text-[#8A8A9A] border border-[#2A2A35]
                  hover:border-[#3A3A48] hover:text-[#F0F0F5] transition-all"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </SectionPanel>
    </motion.div>
  )
}

/** ─── Tab 4: Account ─── */
function AccountTab() {
  const [copied, setCopied] = useState(false)
  const [bioAuth, setBioAuth] = useState(true)
  const [showEndSession, setShowEndSession] = useState(false)
  const [showResetData, setShowResetData] = useState(false)

  const did = 'did:csoai:agent:47:founder'

  const handleCopy = () => {
    navigator.clipboard.writeText(did).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      key="account"
      variants={panelVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      transition={{ duration: 0.35, ease }}
    >
      {/* Profile Card */}
      <SectionPanel>
        <SectionHeader title="Agent 47 Profile" subtitle="Your identity in the simulation" />

        <div className="flex items-start gap-5 mb-6">
          {/* Avatar */}
          <div
            className="relative w-20 h-20 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #D4AF37 0%, #8B6914 100%)',
              boxShadow: '0 0 20px rgba(212,175,55,0.4)',
            }}
          >
            <Crown className="w-8 h-8 text-white" />
            <div
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'var(--bg-surface)', border: '2px solid var(--gold)' }}
            >
              <span className="text-[8px] font-bold text-[#D4AF37]">47</span>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3
              className="text-lg font-semibold text-[#D4AF37] mb-0.5"
              style={{ fontFamily: "'Orbitron', sans-serif" }}
            >
              Agent 47 (Nick)
            </h3>
            <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
              Sovereign Founder
            </p>

            {/* DID with copy */}
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg w-fit"
              style={{ backgroundColor: 'var(--bg-elevated)' }}
            >
              <code
                className="text-xs truncate max-w-[240px]"
                style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-muted)' }}
              >
                {did}
              </code>
              <button
                onClick={handleCopy}
                className="p-1 rounded hover:bg-white/10 transition-colors flex-shrink-0"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-[#2ECC71]" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-[#5A5A6A]" />
                )}
              </button>
            </div>

            {/* Compliance badge */}
            <div className="flex items-center gap-2 mt-2">
              <Shield className="w-3.5 h-3.5 text-[#2ECC71]" />
              <span
                className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  backgroundColor: 'rgba(46,204,113,0.15)',
                  color: '#2ECC71',
                  border: '1px solid rgba(46,204,113,0.3)',
                }}
              >
                Compliance Level 5
              </span>
            </div>
          </div>
        </div>

        {/* Wallet */}
        <div
          className="flex items-center justify-between p-4 rounded-xl mb-4"
          style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--bg-border)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'rgba(212,175,55,0.15)' }}
            >
              <Wallet className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                x402 Balance
              </div>
              <div
                className="text-lg font-bold text-[#D4AF37]"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                1,250.00
              </div>
            </div>
          </div>
          <button
            className="px-4 py-2 rounded-lg text-sm font-medium bg-[#D4AF37]/10
              text-[#D4AF37] border border-[#D4AF37]/40 hover:bg-[#D4AF37]/20
              transition-all duration-150"
          >
            Add Credits
          </button>
        </div>

        {/* Passkey */}
        <div className="flex items-center justify-between p-3 rounded-lg hover:bg-white/[0.02] transition-colors">
          <div className="flex items-center gap-2">
            <Fingerprint className="w-4 h-4 text-[#8A8A9A]" />
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Biometric Auth
            </span>
          </div>
          <Toggle checked={bioAuth} onChange={setBioAuth} label="" />
        </div>

        {/* Session */}
        <div className="flex items-center justify-between p-3 rounded-lg hover:bg-white/[0.02] transition-colors mt-1">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#8A8A9A]" />
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Session Active — 3h 24m
            </span>
          </div>
          <button
            onClick={() => setShowEndSession(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium
              bg-[#1A1A24] text-[#8A8A9A] border border-[#2A2A35]
              hover:text-[#E74C3C] hover:border-[#E74C3C]/40 transition-all
              flex items-center gap-1.5"
          >
            <LogOut className="w-3 h-3" />
            End Session
          </button>
        </div>
      </SectionPanel>

      {/* Danger Zone */}
      <SectionPanel>
        <div
          className="border-l-2 border-[#E74C3C] pl-4 rounded"
          style={{ backgroundColor: 'rgba(231,76,60,0.05)' }}
        >
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-[#E74C3C]" />
            <span className="text-sm font-medium text-[#E74C3C]">Danger Zone</span>
          </div>
          <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
            Reset all agent data, memories, and relationships. This action is irreversible.
          </p>
          <button
            onClick={() => setShowResetData(true)}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-[#E74C3C]/10
              text-[#E74C3C] border border-[#E74C3C]/40 hover:bg-[#E74C3C]/20
              transition-all duration-150"
          >
            Reset All Agent Data
          </button>
        </div>
      </SectionPanel>

      {/* End Session Modal */}
      <AnimatePresence>
        {showEndSession && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(5,5,8,0.85)' }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-panel p-6 max-w-sm w-full"
            >
              <h3
                className="text-lg font-semibold mb-3"
                style={{ fontFamily: "'Orbitron', sans-serif", color: 'var(--text-primary)' }}
              >
                End Session?
              </h3>
              <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                Your session data will be saved. You can resume later.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowEndSession(false)}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-medium
                    bg-[#1A1A24] text-[#8A8A9A] border border-[#2A2A35]
                    hover:bg-[#2A2A35] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowEndSession(false)}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-medium
                    bg-[#E74C3C] text-white hover:bg-[#ff5a5a] transition-all"
                >
                  End Session
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reset Data Modal */}
      <AnimatePresence>
        {showResetData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(5,5,8,0.85)' }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-panel p-6 max-w-sm w-full"
            >
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-[#E74C3C]" />
                <h3
                  className="text-lg font-semibold"
                  style={{ fontFamily: "'Orbitron', sans-serif", color: 'var(--text-primary)' }}
                >
                  Reset All Data?
                </h3>
              </div>
              <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                This will permanently delete all agent memories, relationships, and simulation state.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowResetData(false)}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-medium
                    bg-[#1A1A24] text-[#8A8A9A] border border-[#2A2A35]
                    hover:bg-[#2A2A35] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowResetData(false)}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-medium
                    bg-[#E74C3C] text-white hover:bg-[#ff5a5a] transition-all"
                >
                  Delete Everything
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/** ─── Tab 5: Credits ─── */
function CreditsTab() {
  const attributions = [
    { label: 'Powered by CSOAI', href: 'https://csoai.org' },
    { label: 'Emergence.ai Research Reference', href: 'https://world.emergence.ai' },
    { label: 'Three.js + React Three Fiber', href: 'https://r3f.docs.pmnd.rs' },
    { label: 'Agent models inspired by VRoid Studio', href: null },
    { label: 'Stanford Generative Agents Research (Park et al.)', href: null },
  ]

  const links = [
    { label: 'GitHub', href: 'https://github.com/CSOAI-ORG', icon: Github },
    { label: 'csoai.org', href: 'https://csoai.org', icon: Globe },
    { label: 'meok.ai', href: 'https://meok.ai', icon: Hexagon },
  ]

  return (
    <motion.div
      key="credits"
      variants={panelVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      transition={{ duration: 0.35, ease }}
    >
      <SectionPanel>
        <SectionHeader title="Credits & Attribution" />

        {/* Title + version */}
        <div className="mb-6 text-center sm:text-left">
          <h3
            className="text-2xl font-bold text-[#D4AF37] mb-1"
            style={{ fontFamily: "'Orbitron', sans-serif" }}
          >
            CSOAI Agent 47 Town
          </h3>
          <span
            className="text-xs px-2 py-0.5 rounded-full border"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              color: 'var(--text-muted)',
              borderColor: 'var(--bg-border)',
            }}
          >
            v1.0.0 POC
          </span>
          <p className="text-sm mt-3 max-w-lg" style={{ color: 'var(--text-secondary)' }}>
            A living simulation of the CSOAI superorganism. 46 AI agents + 1 human inhabit a town
            powered by CSOAI protocols.
          </p>
        </div>

        {/* Attributions */}
        <div className="mb-6">
          <span
            className="text-xs uppercase tracking-wider block mb-3"
            style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-muted)' }}
          >
            Attribution
          </span>
          <div className="space-y-2">
            {attributions.map((item) =>
              item.href ? (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm transition-colors hover:text-[#D4AF37] group"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <ExternalLink className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 transition-opacity" />
                  {item.label}
                </a>
              ) : (
                <div
                  key={item.label}
                  className="flex items-center gap-2 text-sm"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <Sparkles className="w-3.5 h-3.5 opacity-50" />
                  {item.label}
                </div>
              )
            )}
          </div>
        </div>

        {/* Links */}
        <div className="mb-6">
          <span
            className="text-xs uppercase tracking-wider block mb-3"
            style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-muted)' }}
          >
            Links
          </span>
          <div className="flex flex-wrap gap-3">
            {links.map((link) => {
              const Icon = link.icon
              return (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                    bg-[#1A1A24] text-[#8A8A9A] border border-[#2A2A35]
                    hover:border-[#D4AF37]/40 hover:text-[#D4AF37] transition-all"
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </a>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div
          className="pt-4 mt-2 text-center"
          style={{ borderTop: '1px solid var(--bg-border)' }}
        >
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Built by the CSOAI Hive Mind | &copy; 2026 CSOAI
          </p>
        </div>
      </SectionPanel>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════
   MAIN SETTINGS PAGE
   ═══════════════════════════════════════════ */

export default function Settings() {
  const [activeTab, setActiveTab] = useState('simulation')

  const renderTab = useCallback(() => {
    switch (activeTab) {
      case 'simulation':
        return <SimulationTab />
      case 'display':
        return <DisplayTab />
      case 'audio':
        return <AudioTab />
      case 'account':
        return <AccountTab />
      case 'credits':
        return <CreditsTab />
      default:
        return <SimulationTab />
    }
  }, [activeTab])

  return (
    <div className="min-h-[100dvh] flex flex-col sm:flex-row" style={{ background: 'var(--bg-base)' }}>
      {/* ── Mobile: horizontal tabs ── */}
      <div className="sm:hidden overflow-x-auto border-b" style={{ borderColor: 'var(--bg-border)', background: 'var(--bg-surface)' }}>
        <div className="flex p-2 gap-1 min-w-max">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium
                  transition-all duration-150 whitespace-nowrap
                  ${isActive
                    ? 'bg-[#D4AF37]/10 text-[#D4AF37]'
                    : 'text-[#8A8A9A] hover:text-[#F0F0F5] hover:bg-[#1A1A24]'
                  }
                `}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Desktop: sidebar ── */}
      <aside
        className="hidden sm:flex flex-col w-60 flex-shrink-0 sticky top-14 h-[calc(100dvh-3.5rem)] overflow-y-auto"
        style={{
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--bg-border)',
        }}
      >
        <div className="p-3 space-y-1">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  w-full flex items-center gap-3 px-3 h-11 rounded-lg text-sm font-medium
                  transition-all duration-150 relative
                  ${isActive
                    ? 'text-[#D4AF37]'
                    : 'text-[#8A8A9A] hover:text-[#F0F0F5] hover:bg-[#1A1A24]'
                  }
                `}
                style={
                  isActive
                    ? {
                        background: 'var(--bg-elevated)',
                        boxShadow: 'inset 3px 0 0 0 var(--gold), 0 0 12px rgba(212,175,55,0.08)',
                      }
                    : {}
                }
              >
                <Icon className="w-[18px] h-[18px] flex-shrink-0 ml-1" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </aside>

      {/* ── Content area ── */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-8">
        <div className="max-w-3xl mx-auto">
          <AnimatePresence mode="wait">{renderTab()}</AnimatePresence>
        </div>
      </main>
    </div>
  )
}
