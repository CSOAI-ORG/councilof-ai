import { Suspense, useState, useEffect, useCallback, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import TownScene from '@/components/TownScene'
import Minimap from '@/components/Minimap'
import ControlBar from '@/components/ControlBar'
import NotificationFeed from '@/components/NotificationFeed'
import AgentListPanel from '@/components/AgentListPanel'
import AgentPassport from '@/components/AgentPassport'
import { useTownStore } from '@/store/useTownStore'
import { AGENT_NAMES, DISTRICT_COLORS } from '@/types'
import type { Agent, Building, District } from '@/types'

// ─── Building Data ───────────────────────────────────────────────────────────

const BUILDINGS: Building[] = [
  // Central
  { id: 'sov3-tower', name: "King's Tower", domain: 'sov3.ai', position: [0, 0, 0], size: [20, 80, 20], type: 'tower', district: 'central', color: '#D4AF37', emissiveColor: '#D4AF37', description: 'The SOV3 central tower — seat of power' },
  // Governance
  { id: 'councilof', name: 'CouncilOf.AI', domain: 'councilof.ai', position: [-80, 0, 40], size: [30, 25, 30], type: 'governance', district: 'governance', color: '#9B59B6', emissiveColor: '#9B59B6', description: 'AI Governance Council' },
  { id: 'proofof', name: 'ProofOf.AI', domain: 'proofof.ai', position: [-100, 0, 60], size: [28, 22, 28], type: 'governance', district: 'governance', color: '#9B59B6', emissiveColor: '#9B59B6', description: 'Proof of Intelligence Protocol' },
  { id: 'ethicalgov', name: 'EthicalGovernanceOf.AI', domain: 'ethicalgovernanceof.ai', position: [-60, 0, 70], size: [26, 20, 26], type: 'governance', district: 'governance', color: '#9B59B6', emissiveColor: '#9B59B6', description: 'Ethical AI Governance' },
  // Commerce
  { id: 'fishkeeper', name: 'FishKeeper.AI', domain: 'fishkeeper.ai', position: [80, 0, -20], size: [28, 22, 28], type: 'hive', district: 'commerce', color: '#00E5FF', emissiveColor: '#00E5FF', description: 'Aquarium & Marine Life AI' },
  { id: 'grabhire', name: 'GrabHire.AI', domain: 'grabhire.ai', position: [100, 0, -40], size: [32, 24, 32], type: 'hive', district: 'commerce', color: '#00E5FF', emissiveColor: '#00E5FF', description: 'Fleet & Equipment Hire' },
  { id: 'muckaway', name: 'MuckAway.AI', domain: 'muckaway.ai', position: [120, 0, -20], size: [28, 20, 28], type: 'hive', district: 'commerce', color: '#00E5FF', emissiveColor: '#00E5FF', description: 'Waste Management AI' },
  { id: 'planthire', name: 'PlantHire.AI', domain: 'planthire.ai', position: [100, 0, 0], size: [26, 20, 26], type: 'hive', district: 'commerce', color: '#00E5FF', emissiveColor: '#00E5FF', description: 'Plant & Machinery Hire' },
  { id: 'haulage', name: 'Haulage.App', domain: 'haulage.app', position: [80, 0, 20], size: [28, 22, 28], type: 'hive', district: 'commerce', color: '#00E5FF', emissiveColor: '#00E5FF', description: 'Logistics & Haulage' },
  // Wellness
  { id: 'fishkeep', name: 'FishKeeper.AI', domain: 'fishkeeper.ai', position: [-60, 0, -60], size: [24, 18, 24], type: 'wellness', district: 'wellness', color: '#2ECC71', emissiveColor: '#2ECC71', description: 'Wellness & Care' },
  { id: 'koikeep', name: 'KoiKeeper.AI', domain: 'koikeeper.ai', position: [-80, 0, -50], size: [24, 18, 24], type: 'wellness', district: 'wellness', color: '#2ECC71', emissiveColor: '#2ECC71', description: 'Koi & Aquatic Wellness' },
  { id: 'meok', name: 'Meok.AI', domain: 'meok.ai', position: [-50, 0, -80], size: [30, 24, 30], type: 'wellness', district: 'wellness', color: '#2ECC71', emissiveColor: '#2ECC71', description: 'Entertainment & Casino AI' },
  // Innovation
  { id: 'openmoe', name: 'OpenMoe.AI', domain: 'openmoe.ai', position: [60, 0, 60], size: [26, 22, 26], type: 'public', district: 'innovation', color: '#E67E22', emissiveColor: '#E67E22', description: 'Open Source Innovation' },
  { id: 'asisecurity', name: 'ASISecurity.AI', domain: 'asisecurity.ai', position: [70, 0, 50], size: [24, 20, 24], type: 'public', district: 'innovation', color: '#E67E22', emissiveColor: '#E67E22', description: 'AI Security Research' },
  // Safety
  { id: 'safety', name: 'ASISecurity.AI', domain: 'asisecurity.ai', position: [-40, 0, 80], size: [26, 20, 26], type: 'safety', district: 'safety', color: '#E74C3C', emissiveColor: '#E74C3C', description: 'AI Safety Station' },
  // Legal
  { id: 'landlaw', name: 'LandLaw.AI', domain: 'landlaw.ai', position: [40, 0, -80], size: [24, 20, 24], type: 'public', district: 'legal', color: '#3498DB', emissiveColor: '#3498DB', description: 'Legal AI Services' },
  { id: 'dataprivacy', name: 'DataPrivacyOf.AI', domain: 'dataprivacyof.ai', position: [60, 0, -70], size: [24, 18, 24], type: 'public', district: 'legal', color: '#3498DB', emissiveColor: '#3498DB', description: 'Data Privacy Protection' },
  // Media
  { id: 'socialmedia', name: 'SocialMediaManager.AI', domain: 'socialmediamanager.ai', position: [-100, 0, 0], size: [22, 30, 22], type: 'media', district: 'media', color: '#ECF0F1', emissiveColor: '#ECF0F1', description: 'Media & Social Management' },
  // Residential
  { id: 'residential-1', name: 'Residential Block 1', domain: 'residential', position: [0, 0, -100], size: [20, 16, 20], type: 'residential', district: 'residential', color: '#1ABC9C', emissiveColor: '#1ABC9C', description: 'Residential Apartments' },
  { id: 'residential-2', name: 'Residential Block 2', domain: 'residential', position: [20, 0, -110], size: [18, 14, 18], type: 'residential', district: 'residential', color: '#1ABC9C', emissiveColor: '#1ABC9C', description: 'Residential Apartments' },
  { id: 'residential-3', name: 'Residential Block 3', domain: 'residential', position: [-20, 0, -110], size: [18, 14, 18], type: 'residential', district: 'residential', color: '#1ABC9C', emissiveColor: '#1ABC9C', description: 'Residential Apartments' },
  { id: 'community', name: 'Community Center', domain: 'community', position: [0, 0, -130], size: [24, 12, 24], type: 'public', district: 'residential', color: '#1ABC9C', emissiveColor: '#1ABC9C', description: 'Community Gathering Space' },
]

// ─── Generate Agents ─────────────────────────────────────────────────────────

function generateAgents(buildings: Building[]): Agent[] {
  const districts: District[] = ['governance', 'commerce', 'wellness', 'innovation', 'safety', 'legal', 'media', 'residential', 'central']
  const roles: Record<District, string[]> = {
    central: ['Tower Keeper', 'Coordinator', 'Operator'],
    governance: ['Councilor', 'Delegate', 'Policy Maker'],
    commerce: ['Manager', 'Trader', 'Logistics', 'Analyst'],
    wellness: ['Caregiver', 'Therapist', 'Guide'],
    innovation: ['Researcher', 'Developer', 'Engineer'],
    safety: ['Guard', 'Inspector', 'Monitor'],
    legal: ['Advisor', 'Compliance', 'Judge'],
    media: ['Producer', 'Curator', 'Broadcaster'],
    residential: ['Resident', 'Community Lead', 'Organizer'],
  }

  const agents: Agent[] = AGENT_NAMES.map((name, i) => {
    const isAgent47 = i === 0
    const district = isAgent47 ? 'central' : districts[Math.floor(Math.random() * (districts.length - 1)) + 1]
    const b = buildings.filter((b) => b.district === district)
    const homeBuilding = b.length > 0 ? b[Math.floor(Math.random() * b.length)] : buildings[0]
    const pos: [number, number, number] = [
      homeBuilding.position[0] + (Math.random() - 0.5) * 30,
      1,
      homeBuilding.position[2] + (Math.random() - 0.5) * 30,
    ]

    return {
      id: `agent-${i + 1}`,
      name: isAgent47 ? 'Agent 47 (You)' : name,
      archetype: (i % 8) + 1,
      district,
      building: homeBuilding.id,
      role: isAgent47 ? 'Player' : roles[district][Math.floor(Math.random() * roles[district].length)],
      needs: {
        hunger: 50 + Math.random() * 50,
        energy: 50 + Math.random() * 50,
        social: 50 + Math.random() * 50,
        fun: 50 + Math.random() * 50,
        wealth: Math.floor(Math.random() * 2000),
        comfort: 50 + Math.random() * 50,
        hygiene: 50 + Math.random() * 50,
        bladder: 50 + Math.random() * 50,
      },
      position: pos,
      targetPosition: null,
      schedule: 'idle',
      state: 'idle',
      social: { friends: [], trust: {} },
      wallet: Math.floor(Math.random() * 2000),
      mood: 'Content',
      isOnline: true,
      color: isAgent47 ? '#FFD700' : DISTRICT_COLORS[district],
      isAgent47,
    }
  })
  return agents
}

const INITIAL_AGENTS = generateAgents(BUILDINGS)

// ─── Generate Notifications ──────────────────────────────────────────────────

function generateInitialNotifications(): { id: string; type: 'movement' | 'work' | 'social' | 'transaction' | 'alert' | 'governance' | 'pheromone'; message: string; timestamp: number; agentId?: string }[] {
  const now = Date.now()
  return [
    { id: 'n1', type: 'work', message: 'Avery started working at FishKeeper Hive', timestamp: now - 120000, agentId: 'agent-1' },
    { id: 'n2', type: 'transaction', message: 'Maya paid 12 credits to Kai for services', timestamp: now - 180000, agentId: 'agent-2' },
    { id: 'n3', type: 'social', message: 'Blake and Casey had lunch at Wellness Center', timestamp: now - 240000, agentId: 'agent-3' },
    { id: 'n4', type: 'movement', message: 'Logan is heading to Commerce District', timestamp: now - 300000, agentId: 'agent-4' },
    { id: 'n5', type: 'governance', message: 'New proposal: Extend marketplace hours', timestamp: now - 360000 },
  ]
}

// ─── TownWorld Page ──────────────────────────────────────────────────────────

export default function TownWorld() {
  const [agents] = useState<Agent[]>(INITIAL_AGENTS)
  const [buildings] = useState<Building[]>(BUILDINGS)
  const [notifications, setNotifications] = useState(generateInitialNotifications)
  const [hoveredAgent, setHoveredAgent] = useState<Agent | null>(null)
  const selectedAgentId = useTownStore((s) => s.selectedAgentId)
  const cameraMode = useTownStore((s) => s.cameraMode)
  const isPaused = useTownStore((s) => s.isPaused)
  const timeOfDay = useTownStore((s) => s.timeOfDay)
  const showAgentNames = useTownStore((s) => s.showAgentNames)

  const advanceTime = useTownStore((s) => s.advanceTime)
  const selectAgent = useTownStore((s) => s.selectAgent)

  // Time advance loop
  const timeRef = useRef(0)
  useEffect(() => {
    let raf: number
    const loop = (t: number) => {
      if (timeRef.current === 0) timeRef.current = t
      const dt = (t - timeRef.current) / 1000
      timeRef.current = t
      if (!isPaused) {
        advanceTime(dt * 0.1) // Slow time for demo
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [isPaused, advanceTime])

  // Periodic notifications
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        const notifs = [
          'Avery started working at FishKeeper Hive',
          'Maya paid 12 credits to Kai',
          'Blake is heading to the marketplace',
          'New pheromone signal detected near Tower',
          'Casey completed a task at GrabHire',
          'Logan entered Governance District',
        ]
        const randomAgent = agents[Math.floor(Math.random() * agents.length)]
        setNotifications((prev) => [
          {
            id: `n-${Date.now()}`,
            type: ['movement', 'work', 'social', 'transaction', 'pheromone'][Math.floor(Math.random() * 5)] as 'movement' | 'work' | 'social' | 'transaction' | 'pheromone',
            message: notifs[Math.floor(Math.random() * notifs.length)],
            timestamp: Date.now(),
            agentId: randomAgent.id,
          },
          ...prev.slice(0, 9),
        ])
      }
    }, 8000)
    return () => clearInterval(interval)
  }, [agents])

  const selectedAgent = agents.find((a) => a.id === selectedAgentId) || null

  const handleAgentHover = useCallback((agent: Agent | null) => {
    setHoveredAgent(agent)
  }, [])

  const timeStr = `${Math.floor(timeOfDay).toString().padStart(2, '0')}:${Math.floor((timeOfDay % 1) * 60).toString().padStart(2, '0')}`

  return (
    <div className="relative w-full" style={{ height: 'calc(100dvh - 56px)' }}>
      {/* 3D Canvas */}
      <div className="absolute inset-0 z-0">
        <Canvas
          camera={{
            position: cameraMode === 'isometric' ? [100, 100, 100] : [0, 20, 60],
            fov: 45,
            near: 1,
            far: 1000,
          }}
          shadows
          gl={{ antialias: true, alpha: false }}
          style={{ background: '#050508' }}
        >
          <Suspense fallback={null}>
            <TownScene
              agents={agents}
              buildings={buildings}
              onAgentHover={handleAgentHover}
              onAgentClick={(id) => selectAgent(selectedAgentId === id ? null : id)}
              showAgentNames={showAgentNames}
            />
          </Suspense>
        </Canvas>
      </div>

      {/* HUD Overlay */}
      <div className="absolute inset-0 z-30 pointer-events-none">
        {/* Top-Left: Minimap + Metrics */}
        <div className="absolute top-4 left-4 pointer-events-auto">
          <Minimap agents={agents} buildings={buildings} />
        </div>

        {/* Top-Right: Agent List */}
        <div className="absolute top-4 right-4 pointer-events-auto">
          <AgentListPanel agents={agents} />
        </div>

        {/* Top-Left (below minimap): Live Metrics */}
        <div className="absolute top-[260px] left-4 pointer-events-auto">
          <div className="glass-panel p-3 w-[200px]">
            <p className="metric-label mb-2">Town Metrics</p>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-[#8A8A9A]">Agents</span>
                <span className="text-xs text-[#F0F0F5] font-mono font-semibold">{agents.filter((a) => a.isOnline).length}/{agents.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-[#8A8A9A]">Buildings</span>
                <span className="text-xs text-[#F0F0F5] font-mono font-semibold">{buildings.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-[#8A8A9A]">Time</span>
                <span className="text-xs text-[#00E5FF] font-mono font-semibold">{timeStr}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-[#8A8A9A]">Weather</span>
                <span className="text-xs text-[#F0F0F5] font-mono font-semibold">Clear</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom-Center: Control Bar */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-auto">
          <ControlBar />
        </div>

        {/* Bottom-Left: Notifications */}
        <div className="absolute bottom-6 left-4 pointer-events-auto">
          <NotificationFeed notifications={notifications} />
        </div>

        {/* Center: Agent hover tooltip */}
        {hoveredAgent && !selectedAgentId && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div className="glass-panel px-4 py-2 pointer-events-auto">
              <p className="text-sm font-medium text-[#F0F0F5]" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                {hoveredAgent.name}
              </p>
              <p className="text-[10px] text-[#8A8A9A]">{hoveredAgent.role} &middot; {hoveredAgent.district}</p>
            </div>
          </div>
        )}
      </div>

      {/* Agent Passport Modal */}
      {selectedAgent && (
        <AgentPassport
          agent={selectedAgent}
          onClose={() => selectAgent(null)}
        />
      )}
    </div>
  )
}
