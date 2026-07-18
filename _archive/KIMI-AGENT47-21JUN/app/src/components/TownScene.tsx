// @ts-nocheck
// React Three Fiber JSX types are globally augmented by the package
// but this TS config has issues resolving them. Runtime works correctly.
import { useRef, useMemo, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Stars, Html, Billboard, Text } from '@react-three/drei'
import * as THREE from 'three'
import { useTownStore } from '@/store/useTownStore'
import type { Agent, Building } from '@/types'

// ─── Props ───────────────────────────────────────────────────────────────────

interface TownSceneProps {
  agents: Agent[]
  buildings: Building[]
  onAgentHover: (agent: Agent | null) => void
  onAgentClick: (id: string) => void
  showAgentNames: boolean
}

// ─── Ground Component ────────────────────────────────────────────────────────

function Ground() {
  const gridTexture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#0D0D14'
    ctx.fillRect(0, 0, 512, 512)
    ctx.strokeStyle = '#1A1A24'
    ctx.lineWidth = 1
    for (let i = 0; i <= 512; i += 32) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i, 512)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, i)
      ctx.lineTo(512, i)
      ctx.stroke()
    }
    const tex = new THREE.CanvasTexture(canvas)
    tex.wrapS = THREE.RepeatWrapping
    tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(50, 50)
    return tex
  }, [])

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
      <planeGeometry args={[800, 800]} />
      <meshStandardMaterial
        map={gridTexture}
        color="#0D0D14"
        roughness={0.8}
        metalness={0.2}
      />
    </mesh>
  )
}

// ─── Building Component ──────────────────────────────────────────────────────

function BuildingMesh({ building, onClick }: { building: Building; onClick: (id: string) => void }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const isTower = building.type === 'tower'

  // Pulsing glow for tower
  useFrame((state) => {
    if (isTower && meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshStandardMaterial
      if (mat && mat.emissiveIntensity !== undefined) {
        mat.emissiveIntensity = 0.5 + Math.sin(state.clock.elapsedTime * 2) * 0.3
      }
    }
  })

  const handleClick = useCallback((e: { stopPropagation: () => void }) => {
    e.stopPropagation()
    onClick(building.id)
  }, [building.id, onClick])

  return (
    <group position={building.position}>
      {/* District pad (raised platform) */}
      <mesh position={[0, 0.2, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[Math.max(building.size[0], building.size[2]) * 0.7, Math.max(building.size[0], building.size[2]) * 0.8, 0.4, 8]} />
        <meshStandardMaterial
          color={building.color}
          transparent
          opacity={0.15}
          roughness={0.5}
        />
      </mesh>

      {/* Main building body */}
      <mesh
        ref={meshRef}
        position={[0, building.size[1] / 2, 0]}
        castShadow
        receiveShadow
        onClick={handleClick}
        onPointerOver={() => { document.body.style.cursor = 'pointer' }}
        onPointerOut={() => { document.body.style.cursor = 'default' }}
      >
        <boxGeometry args={building.size} />
        <meshStandardMaterial
          color={building.color}
          emissive={building.emissiveColor}
          emissiveIntensity={isTower ? 0.5 : 0.3}
          roughness={0.4}
          metalness={0.6}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Top glow cap for tower */}
      {isTower && (
        <mesh position={[0, building.size[1] + 2, 0]}>
          <sphereGeometry args={[4, 16, 16]} />
          <meshStandardMaterial
            color="#FFD700"
            emissive="#FFD700"
            emissiveIntensity={2}
            transparent
            opacity={0.6}
          />
        </mesh>
      )}

      {/* LED strip (ring around building) */}
      <mesh position={[0, building.size[1] * 0.6, 0]}>
        <boxGeometry args={[building.size[0] + 0.5, 0.5, building.size[2] + 0.5]} />
        <meshStandardMaterial
          color={building.color}
          emissive={building.emissiveColor}
          emissiveIntensity={1}
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* Building label */}
      <Billboard position={[0, building.size[1] + 5, 0]}>
        <Html center style={{ pointerEvents: 'none' }}>
          <div
            className="px-2 py-1 rounded text-[10px] font-medium whitespace-nowrap"
            style={{
              fontFamily: "'Inter', sans-serif",
              backgroundColor: 'rgba(10, 10, 15, 0.8)',
              border: `1px solid ${building.color}40`,
              color: building.color,
              backdropFilter: 'blur(4px)',
            }}
          >
            {building.domain}
          </div>
        </Html>
      </Billboard>

      {/* Portal entrance glow */}
      <mesh position={[0, 1, building.size[2] / 2 + 0.5]}>
        <boxGeometry args={[4, 3, 0.3]} />
        <meshStandardMaterial
          color={building.color}
          emissive={building.emissiveColor}
          emissiveIntensity={1.5}
          transparent
          opacity={0.5}
        />
      </mesh>
    </group>
  )
}

// ─── Agent Component ─────────────────────────────────────────────────────────

function AgentOrb({
  agent,
  isSelected,
  onHover,
  onClick,
  showName,
}: {
  agent: Agent
  isSelected: boolean
  onHover: (agent: Agent | null) => void
  onClick: (id: string) => void
  showName: boolean
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const groupRef = useRef<THREE.Group>(null)
  const selectionRingRef = useRef<THREE.Mesh>(null)

  // Movement animation
  useFrame((state, delta) => {
    if (!groupRef.current) return

    // Bobbing motion
    const bobY = Math.sin(state.clock.elapsedTime * 2 + agent.id.charCodeAt(6)) * 0.15
    groupRef.current.position.y = 1 + bobY

    // Agent 47 crown glow pulse
    if (agent.isAgent47 && meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshStandardMaterial
      if (mat) {
        mat.emissiveIntensity = 0.8 + Math.sin(state.clock.elapsedTime * 3) * 0.4
      }
    }

    // Selection ring animation
    if (selectionRingRef.current && isSelected) {
      selectionRingRef.current.rotation.y += delta * 2
    }

    // Simple wander: lerp toward a target if set
    if (agent.targetPosition) {
      const current = groupRef.current.position
      const target = new THREE.Vector3(...agent.targetPosition)
      target.y = current.y
      current.lerp(target, delta * 0.5)
    }
  })

  const handleClick = useCallback((e: { stopPropagation: () => void }) => {
    e.stopPropagation()
    onClick(agent.id)
  }, [agent.id, onClick])

  const size = agent.isAgent47 ? 1.2 : 0.8

  return (
    <group
      ref={groupRef}
      position={agent.position}
      onClick={handleClick}
      onPointerOver={(e: { stopPropagation: () => void }) => { e.stopPropagation(); onHover(agent); document.body.style.cursor = 'pointer' }}
      onPointerOut={() => { onHover(null); document.body.style.cursor = 'default' }}
    >
      {/* Agent body (sphere) */}
      <mesh ref={meshRef} castShadow>
        <sphereGeometry args={[size, 16, 16]} />
        <meshStandardMaterial
          color={agent.color}
          emissive={agent.color}
          emissiveIntensity={agent.isAgent47 ? 1.2 : 0.5}
          roughness={0.3}
          metalness={0.7}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Agent 47 crown */}
      {agent.isAgent47 && (
        <mesh position={[0, size + 0.5, 0]}>
          <coneGeometry args={[0.5, 0.6, 5]} />
          <meshStandardMaterial
            color="#FFD700"
            emissive="#FFD700"
            emissiveIntensity={1.5}
            metalness={1}
            roughness={0.1}
          />
        </mesh>
      )}

      {/* Outer glow ring */}
      <mesh>
        <sphereGeometry args={[size * 1.4, 16, 16]} />
        <meshStandardMaterial
          color={agent.color}
          transparent
          opacity={0.1}
          depthWrite={false}
        />
      </mesh>

      {/* Selection ring */}
      {isSelected && (
        <mesh ref={selectionRingRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -size + 0.1, 0]}>
          <ringGeometry args={[size * 1.2, size * 1.5, 32]} />
          <meshStandardMaterial
            color="#D4AF37"
            emissive="#D4AF37"
            emissiveIntensity={1}
            transparent
            opacity={0.8}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Name label */}
      {showName && (
        <Billboard position={[0, size + 2, 0]}>
          <Html center style={{ pointerEvents: 'none' }}>
            <div
              className="px-1.5 py-0.5 rounded text-[9px] font-medium whitespace-nowrap"
              style={{
                fontFamily: "'Inter', sans-serif",
                backgroundColor: 'rgba(10, 10, 15, 0.7)',
                border: `1px solid ${agent.color}40`,
                color: agent.isAgent47 ? '#FFD700' : '#F0F0F5',
                backdropFilter: 'blur(4px)',
              }}
            >
              {agent.name}
            </div>
          </Html>
        </Billboard>
      )}
    </group>
  )
}

// ─── Pheromone Particles ─────────────────────────────────────────────────────

function PheromoneParticles({ agents }: { agents: Agent[] }) {
  const count = 200
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      position: new THREE.Vector3(
        (Math.random() - 0.5) * 300,
        Math.random() * 40 + 2,
        (Math.random() - 0.5) * 300
      ),
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.3,
        Math.random() * 0.2 + 0.05,
        (Math.random() - 0.5) * 0.3
      ),
      lifetime: Math.random() * 10,
      maxLifetime: 5 + Math.random() * 10,
      color: new THREE.Color(
        ['#FF3366', '#00E5FF', '#FFD700', '#39FF14', '#BF40BF'][i % 5]
      ),
      scale: 0.2 + Math.random() * 0.5,
    }))
  }, [count])

  const colorArray = useMemo(() => new Float32Array(count * 3), [count])

  useFrame((_state, delta) => {
    if (!meshRef.current) return

    for (let i = 0; i < count; i++) {
      const p = particles[i]
      p.lifetime += delta

      if (p.lifetime > p.maxLifetime) {
        // Reset particle near a random agent
        const agent = agents[Math.floor(Math.random() * agents.length)]
        if (agent) {
          p.position.set(
            agent.position[0] + (Math.random() - 0.5) * 10,
            2 + Math.random() * 5,
            agent.position[2] + (Math.random() - 0.5) * 10
          )
        } else {
          p.position.set(
            (Math.random() - 0.5) * 300,
            Math.random() * 40 + 2,
            (Math.random() - 0.5) * 300
          )
        }
        p.lifetime = 0
      }

      // Float upward with noise
      p.position.x += p.velocity.x * delta + Math.sin(performance.now() / 1000 + i) * 0.01
      p.position.y += p.velocity.y * delta
      p.position.z += p.velocity.z * delta + Math.cos(performance.now() / 1000 + i) * 0.01

      const lifeRatio = p.lifetime / p.maxLifetime
      const opacity = lifeRatio > 0.7 ? 1 - (lifeRatio - 0.7) / 0.3 : 1
      const scale = p.scale * opacity

      dummy.position.copy(p.position)
      dummy.scale.setScalar(scale)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)

      p.color.toArray(colorArray, i * 3)
    }

    meshRef.current.instanceMatrix.needsUpdate = true
    ;(meshRef.current.geometry as THREE.BufferGeometry).setAttribute(
      'color',
      new THREE.InstancedBufferAttribute(colorArray, 3)
    )
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshStandardMaterial
        vertexColors
        emissiveIntensity={0.5}
        transparent
        opacity={0.6}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </instancedMesh>
  )
}

// ─── Atmosphere Particles ────────────────────────────────────────────────────

function AtmosphereParticles() {
  const count = 50
  const meshRef = useRef<THREE.Points>(null)

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 400
      pos[i * 3 + 1] = Math.random() * 60 + 20
      pos[i * 3 + 2] = (Math.random() - 0.5) * 400
    }
    return pos
  }, [count])

  useFrame((state) => {
    if (!meshRef.current) return
    meshRef.current.rotation.y = state.clock.elapsedTime * 0.005
  })

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#D4AF37"
        size={0.5}
        transparent
        opacity={0.3}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

// ─── Floating District Labels ────────────────────────────────────────────────

function DistrictLabels({ buildings }: { buildings: Building[] }) {
  const districts = useMemo(() => {
    const map = new Map<string, { position: [number, number, number]; color: string; name: string }>()
    for (const b of buildings) {
      if (!map.has(b.district)) {
        const sameDistrict = buildings.filter((bb) => bb.district === b.district)
        const cx = sameDistrict.reduce((s, bb) => s + bb.position[0], 0) / sameDistrict.length
        const cz = sameDistrict.reduce((s, bb) => s + bb.position[2], 0) / sameDistrict.length
        map.set(b.district, {
          position: [cx, 5, cz],
          color: b.color,
          name: b.district.charAt(0).toUpperCase() + b.district.slice(1),
        })
      }
    }
    return Array.from(map.values())
  }, [buildings])

  return (
    <>
      {districts.map((d) => (
        <Billboard key={d.name} position={d.position}>
          <Text
            fontSize={3}
            color={d.color}
            anchorX="center"
            anchorY="middle"
            font={undefined}
            outlineWidth={0.2}
            outlineColor="#000000"
          >
            {d.name}
          </Text>
        </Billboard>
      ))}
    </>
  )
}

// ─── Main Scene ──────────────────────────────────────────────────────────────

export default function TownScene({
  agents,
  buildings,
  onAgentHover,
  onAgentClick,
  showAgentNames,
}: TownSceneProps) {
  const cameraMode = useTownStore((s) => s.cameraMode)
  const selectedAgentId = useTownStore((s) => s.selectedAgentId)
  const showPheromones = useTownStore((s) => s.showPheromones)
  const { camera } = useThree()

  // Camera setup
  useFrame(() => {
    if (cameraMode === 'follow' && selectedAgentId) {
      const agent = agents.find((a) => a.id === selectedAgentId)
      if (agent) {
        const targetPos = new THREE.Vector3(agent.position[0], agent.position[1], agent.position[2])
        const offset = new THREE.Vector3(0, 20, 40)
        camera.position.lerp(targetPos.clone().add(offset), 0.05)
        camera.lookAt(targetPos)
      }
    } else if (cameraMode === 'cinematic') {
      const t = performance.now() * 0.0002
      camera.position.x = Math.sin(t) * 150
      camera.position.z = Math.cos(t) * 150
      camera.position.y = 60 + Math.sin(t * 0.5) * 20
      camera.lookAt(0, 0, 0)
    }
  })

  return (
    <>
      {/* Fog */}
      <fog attach="fog" args={['#050508', 100, 500]} />

      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[100, 80, 50]}
        intensity={1}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={500}
        shadow-camera-left={-200}
        shadow-camera-right={200}
        shadow-camera-top={200}
        shadow-camera-bottom={-200}
      />
      <hemisphereLight
        args={['#050508', '#0A0A0F', 0.3]}
      />

      {/* Point lights at buildings */}
      {buildings.slice(0, 8).map((b) => (
        <pointLight
          key={b.id}
          position={[b.position[0], b.position[1] + 10, b.position[2]]}
          color={b.emissiveColor}
          intensity={0.5}
          distance={60}
        />
      ))}

      {/* Controls */}
      {cameraMode === 'isometric' && (
        <OrbitControls
          makeDefault
          enablePan
          enableZoom
          enableRotate
          minDistance={50}
          maxDistance={300}
          maxPolarAngle={Math.PI / 2.2}
          target={[0, 0, 0]}
        />
      )}

      {/* Stars */}
      <Stars radius={400} depth={100} count={3000} factor={4} saturation={0} fade speed={0.5} />

      {/* Ground */}
      <Ground />

      {/* Buildings */}
      {buildings.map((b) => (
        <BuildingMesh key={b.id} building={b} onClick={onAgentClick} />
      ))}

      {/* Agents */}
      {agents.map((a) => (
        <AgentOrb
          key={a.id}
          agent={a}
          isSelected={a.id === selectedAgentId}
          onHover={onAgentHover}
          onClick={onAgentClick}
          showName={showAgentNames}
        />
      ))}

      {/* Pheromones */}
      {showPheromones && <PheromoneParticles agents={agents} />}

      {/* Atmosphere */}
      <AtmosphereParticles />

      {/* District labels */}
      <DistrictLabels buildings={buildings} />
    </>
  )
}
