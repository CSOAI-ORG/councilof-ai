import { useRef, useEffect, useCallback } from 'react'
import { DISTRICT_COLORS } from '@/types'
import type { Agent, Building } from '@/types'

interface MinimapProps {
  agents: Agent[]
  buildings: Building[]
}

const CANVAS_SIZE = 200
const MAP_RANGE = 200

export default function Minimap({ agents, buildings }: MinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = CANVAS_SIZE
    const h = CANVAS_SIZE
    const cx = w / 2
    const cy = h / 2
    const scale = w / (MAP_RANGE * 2)

    // Clear
    ctx.clearRect(0, 0, w, h)

    // Background
    ctx.fillStyle = 'rgba(10, 10, 15, 0.85)'
    ctx.fillRect(0, 0, w, h)

    // Grid
    ctx.strokeStyle = 'rgba(42, 42, 53, 0.5)'
    ctx.lineWidth = 0.5
    for (let i = 0; i < w; i += 20) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i, h)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, i)
      ctx.lineTo(w, i)
      ctx.stroke()
    }

    // Buildings
    for (const b of buildings) {
      const bx = cx + b.position[0] * scale
      const bz = cy + b.position[2] * scale
      const bw = Math.max(4, b.size[0] * scale)
      const bh = Math.max(4, b.size[2] * scale)
      ctx.fillStyle = b.color
      ctx.globalAlpha = 0.6
      ctx.fillRect(bx - bw / 2, bz - bh / 2, bw, bh)
      ctx.globalAlpha = 1
    }

    // Agents
    for (const a of agents) {
      const ax = cx + a.position[0] * scale
      const az = cy + a.position[2] * scale

      if (a.isAgent47) {
        // Gold pulse for Agent 47
        ctx.beginPath()
        ctx.arc(ax, az, 5, 0, Math.PI * 2)
        ctx.fillStyle = '#FFD700'
        ctx.fill()
        ctx.strokeStyle = '#FFD700'
        ctx.lineWidth = 1
        ctx.globalAlpha = 0.4
        ctx.beginPath()
        ctx.arc(ax, az, 7, 0, Math.PI * 2)
        ctx.stroke()
        ctx.globalAlpha = 1
      } else {
        ctx.beginPath()
        ctx.arc(ax, az, 2.5, 0, Math.PI * 2)
        ctx.fillStyle = DISTRICT_COLORS[a.district]
        ctx.fill()
      }
    }

    // Compass labels
    ctx.fillStyle = 'rgba(90, 90, 106, 0.6)'
    ctx.font = '8px Orbitron, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('N', cx, 10)
    ctx.fillText('S', cx, h - 2)
    ctx.textAlign = 'left'
    ctx.fillText('W', 2, cy + 3)
    ctx.textAlign = 'right'
    ctx.fillText('E', w - 2, cy + 3)

    // Border
    ctx.strokeStyle = 'rgba(42, 42, 53, 1)'
    ctx.lineWidth = 1
    ctx.strokeRect(0, 0, w, h)
  }, [agents, buildings])

  useEffect(() => {
    let raf: number
    const animate = () => {
      draw()
      raf = requestAnimationFrame(animate)
    }
    raf = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf)
  }, [draw])

  return (
    <div className="glass-panel overflow-hidden" style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}>
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        style={{ width: CANVAS_SIZE, height: CANVAS_SIZE, display: 'block' }}
      />
    </div>
  )
}
