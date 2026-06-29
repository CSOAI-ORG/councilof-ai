// csoai-3d-simulation.tsx - The CSOAI 3D Force-Directed Simulation Component
// Real-time 3D visualization of the Unified Data Graph + UE5 Data Bridge
// 55 nodes: 33 Hives + 5 VKAs + 12 Council + 5 Beacons
// Live data flows + Ed25519 attestation particles + the £42.51M Year 3 ARR revenue bars

import { useState, useEffect, useRef } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { OrbitControls, Stars, Html, Float, Sparkles, Line, Text } from "@react-three/drei"
import * as THREE from "three"

interface SimulationNode {
  id: string
  type: "hive" | "vka" | "beacon" | "council"
  name: string
  position: [number, number, number]
  velocity: [number, number, number]
  size: number
  color: string
  metadata: Record<string, any>
}

interface SimulationEdge {
  source: string
  target: string
  type: "hive-vka" | "hive-beacon" | "hive-council" | "data-flow" | "attestation"
  weight: number
  color: string
}

interface ForceDirectedSimulationProps {
  dataSource: () => { nodes: SimulationNode[]; edges: SimulationEdge[] }
  onNodeClick?: (node: SimulationNode) => void
  onEdgeClick?: (edge: SimulationEdge) => void
  showAttestationParticles?: boolean
  showDataFlowLines?: boolean
  showLabels?: boolean
  autoRotate?: boolean
  simulationSpeed?: number
  backgroundColor?: string
  showStars?: boolean
  showRevenueBars?: boolean
}

export function CSOAI3DSimulation({ dataSource, onNodeClick, onEdgeClick, showAttestationParticles = true, showDataFlowLines = true, showLabels = true, autoRotate = true, simulationSpeed = 1, backgroundColor = "#000000", showStars = true, showRevenueBars = true }: ForceDirectedSimulationProps) {
  const [hoveredNode, setHoveredNode] = useState<SimulationNode | null>(null)
  const [hoveredEdge, setHoveredEdge] = useState<SimulationEdge | null>(null)
  const [data, setData] = useState<{ nodes: SimulationNode[]; edges: SimulationEdge[] }>({ nodes: [], edges: [] })
  const particlesRef = useRef<THREE.Points>(null)

  // Refresh data every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setData(dataSource())
    }, 5000)
    setData(dataSource())
    return () => clearInterval(interval)
  }, [dataSource])

  return (
    <div className="w-full h-full relative" style={{ background: backgroundColor }}>
      <Canvas camera={{ position: [0, 30, 80], fov: 60 }} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[20, 30, 20]} intensity={1} castShadow />
        <pointLight position={[-20, 10, -20]} intensity={0.5} color="#4ade80" />
        {showStars && <Stars radius={200} depth={100} count={3000} factor={6} fade speed={1} />}
        {/* The 55 nodes */}
        {data.nodes.map((node) => (
          <SimulationNode3D
            key={node.id}
            node={node}
            onClick={() => onNodeClick?.(node)}
            onHover={(h) => setHoveredNode(h ? node : null)}
            showLabel={showLabels}
            simulationSpeed={simulationSpeed}
          />
        ))}
        {/* The edges */}
        {showDataFlowLines && data.edges.map((edge, i) => (
          <SimulationEdge3D
            key={`${edge.source}-${edge.target}-${i}`}
            edge={edge}
            node1={data.nodes.find((n) => n.id === edge.source)}
            node2={data.nodes.find((n) => n.id === edge.target)}
            onHover={(h) => setHoveredEdge(h ? edge : null)}
          />
        ))}
        {/* The Ed25519 attestation particles (flying between active nodes) */}
        {showAttestationParticles && <AttestationParticles nodes={data.nodes} />}
        {/* The revenue bars (the £42.51M Year 3 ARR growing) */}
        {showRevenueBars && <RevenueBars />}
        <OrbitControls autoRotate={autoRotate} autoRotateSpeed={0.3} enableZoom enablePan={false} minDistance={20} maxDistance={150} />
      </Canvas>
      {/* HUD overlay */}
      <div className="absolute top-4 left-4 z-10 text-white font-mono text-xs bg-black/70 p-3 rounded border border-white/10">
        <div className="text-emerald-500 font-bold mb-1">🐉 CSOAI 3D Simulation</div>
        <div>Nodes: {data.nodes.length}</div>
        <div>Edges: {data.edges.length}</div>
        <div>Hover: {hoveredNode?.name || hoveredEdge?.type || "—"}</div>
        <div>Speed: {simulationSpeed}x</div>
      </div>
      {/* Bottom-right legend */}
      <div className="absolute bottom-4 right-4 z-10 text-white font-mono text-[10px] bg-black/70 p-3 rounded border border-white/10">
        <div className="text-emerald-500 font-bold mb-1">Legend</div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Hives (33)</div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500" /> VKAs (5)</div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500" /> Council (12)</div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-purple-500" /> Beacons (5)</div>
      </div>
    </div>
  )
}

function SimulationNode3D({ node, onClick, onHover, showLabel, simulationSpeed }: { node: SimulationNode; onClick: () => void; onHover: (h: boolean) => void; showLabel: boolean; simulationSpeed: number }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (ref.current) {
      // Float gently
      const pulse = 1 + Math.sin(clock.getElapsedTime() * simulationSpeed + node.position[0]) * 0.1
      ref.current.scale.setScalar(pulse)
      // Slow rotation
      ref.current.rotation.y = clock.getElapsedTime() * 0.05 * simulationSpeed
    }
  })
  const colorMap: Record<string, string> = { hive: "#4ade80", vka: "#fbbf24", beacon: "#a78bfa", council: "#60a5fa" }
  return (
    <group position={node.position}>
      <mesh
        ref={ref}
        onClick={onClick}
        onPointerOver={() => onHover(true)}
        onPointerOut={() => onHover(false)}
      >
        <icosahedronGeometry args={[node.size, 1]} />
        <meshStandardMaterial color={colorMap[node.type] || "#fff"} emissive={colorMap[node.type] || "#fff"} emissiveIntensity={0.5} metalness={0.7} roughness={0.2} />
      </mesh>
      {showLabel && (
        <Html position={[0, node.size + 1, 0]} center>
          <div style={{ background: "rgba(0,0,0,0.8)", color: "#fff", padding: "3px 6px", borderRadius: 3, fontSize: 9, fontFamily: "monospace", whiteSpace: "nowrap", border: `1px solid ${colorMap[node.type]}` }}>
            {node.name}
          </div>
        </Html>
      )}
    </group>
  )
}

function SimulationEdge3D({ edge, node1, node2, onHover }: { edge: SimulationEdge; node1?: SimulationNode; node2?: SimulationNode; onHover: (h: boolean) => void }) {
  if (!node1 || !node2) return null
  const colorMap: Record<string, string> = { "hive-vka": "#4ade80", "hive-beacon": "#a78bfa", "hive-council": "#60a5fa", "data-flow": "#fbbf24", "attestation": "#f87171" }
  return (
    <Line
      points={[node1.position, node2.position]}
      color={edge.color || colorMap[edge.type] || "#fff"}
      lineWidth={Math.max(1, edge.weight)}
      transparent
      opacity={0.6}
      onPointerOver={() => onHover(true)}
      onPointerOut={() => onHover(false)}
    />
  )
}

function AttestationParticles({ nodes }: { nodes: SimulationNode[] }) {
  const ref = useRef<THREE.Points>(null)
  const count = 100
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const node = nodes[Math.floor(Math.random() * nodes.length)]
    if (node) {
      positions[i * 3] = node.position[0]
      positions[i * 3 + 1] = node.position[1]
      positions[i * 3 + 2] = node.position[2]
    }
  }
  useFrame(({ clock }) => {
    if (ref.current) {
      const pos = ref.current.geometry.attributes.position as THREE.BufferAttribute
      for (let i = 0; i < count; i++) {
        const node = nodes[i % nodes.length]
        if (node) {
          const t = clock.getElapsedTime() * 0.3 + i
          pos.setX(i, node.position[0] + Math.sin(t) * 3)
          pos.setY(i, node.position[1] + Math.cos(t * 1.3) * 3)
          pos.setZ(i, node.position[2] + Math.sin(t * 0.7) * 3)
        }
      }
      pos.needsUpdate = true
    }
  })
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} count={count} />
      </bufferGeometry>
      <pointsMaterial color="#f87171" size={0.3} transparent opacity={0.7} />
    </points>
  )
}

function RevenueBars() {
  // The £42.51M Year 3 ARR as growing 3D bars
  const bars = [
    { label: "Compliance", value: 2.5, color: "#4ade80" },
    { label: "Optometry", value: 5.93, color: "#a78bfa" },
    { label: "COBOL", value: 1.45, color: "#60a5fa" },
    { label: "Haulage", value: 26.30, color: "#fbbf24" },
    { label: "Aquaculture", value: 7.57, color: "#f87171" },
  ]
  return (
    <group position={[-40, 0, 0]}>
      {bars.map((bar, i) => {
        const height = (bar.value / 30) * 20
        return (
          <group key={bar.label} position={[i * 8, 0, 0]}>
            <mesh position={[0, height / 2, 0]}>
              <boxGeometry args={[4, height, 4]} />
              <meshStandardMaterial color={bar.color} emissive={bar.color} emissiveIntensity={0.5} />
            </mesh>
            <Html position={[0, height + 2, 0]} center>
              <div style={{ background: "rgba(0,0,0,0.8)", color: "#fff", padding: "3px 6px", borderRadius: 3, fontSize: 9, fontFamily: "monospace", whiteSpace: "nowrap", border: `1px solid ${bar.color}` }}>
                {bar.label}<br />£{bar.value.toFixed(1)}M
              </div>
            </Html>
          </group>
        )
      })}
    </group>
  )
}

export default CSOAI3DSimulation
