import { useTownStore } from '@/store/useTownStore'
import { Box, Eye, Film, Pause, Play, Sun, CloudRain, CloudSnow } from 'lucide-react'

export default function ControlBar() {
  const cameraMode = useTownStore((s) => s.cameraMode)
  const isPaused = useTownStore((s) => s.isPaused)
  const simulationSpeed = useTownStore((s) => s.simulationSpeed)
  const timeOfDay = useTownStore((s) => s.timeOfDay)
  const day = useTownStore((s) => s.day)
  const weather = useTownStore((s) => s.weather)

  const setCameraMode = useTownStore((s) => s.setCameraMode)
  const togglePaused = useTownStore((s) => s.togglePaused)
  const setSimulationSpeed = useTownStore((s) => s.setSimulationSpeed)
  const setWeather = useTownStore((s) => s.setWeather)

  const timeStr = `${Math.floor(timeOfDay).toString().padStart(2, '0')}:${Math.floor((timeOfDay % 1) * 60).toString().padStart(2, '0')}`

  const weatherOptions: { key: typeof weather; icon: typeof Sun; label: string }[] = [
    { key: 'clear', icon: Sun, label: 'Clear' },
    { key: 'rain', icon: CloudRain, label: 'Rain' },
    { key: 'snow', icon: CloudSnow, label: 'Snow' },
    { key: 'fog', icon: CloudRain, label: 'Fog' },
  ]

  return (
    <div
      className="flex items-center gap-4 px-4 py-2 rounded-2xl"
      style={{
        backgroundColor: 'rgba(10, 10, 15, 0.9)',
        backdropFilter: 'blur(12px)',
        border: '1px solid var(--bg-border)',
        height: 52,
      }}
    >
      {/* Camera modes */}
      <div className="flex items-center gap-1">
        {[
          { mode: 'isometric' as const, icon: Box, label: 'ISO' },
          { mode: 'follow' as const, icon: Eye, label: 'Follow' },
          { mode: 'cinematic' as const, icon: Film, label: 'Cine' },
        ].map(({ mode, icon: Icon, label }) => (
          <button
            key={mode}
            onClick={() => setCameraMode(mode)}
            className={`
              relative w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200
              ${cameraMode === mode
                ? 'bg-[#D4AF37]/15 text-[#D4AF37]'
                : 'text-[#5A5A6A] hover:text-[#8A8A9A] hover:bg-white/5'
              }
            `}
            title={label}
          >
            <Icon className="w-4 h-4" />
            {cameraMode === mode && (
              <span className="absolute inset-0 rounded-lg" style={{ boxShadow: '0 0 10px rgba(212,175,55,0.3)' }} />
            )}
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-[#2A2A35]" />

      {/* Play/Pause */}
      <button
        onClick={togglePaused}
        className={`
          w-8 h-8 rounded-full flex items-center justify-center transition-all
          ${isPaused ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'text-[#5A5A6A] hover:text-[#F0F0F5] hover:bg-white/5'}
        `}
        title={isPaused ? 'Play' : 'Pause'}
      >
        {isPaused ? <Play className="w-3.5 h-3.5 ml-0.5" /> : <Pause className="w-3.5 h-3.5" />}
      </button>

      {/* Speed */}
      <div className="flex items-center gap-1">
        {[1, 2, 5].map((s) => (
          <button
            key={s}
            onClick={() => setSimulationSpeed(s)}
            className={`
              px-1.5 py-0.5 rounded text-[10px] font-mono font-medium transition-all
              ${simulationSpeed === s
                ? 'text-[#D4AF37] bg-[#D4AF37]/15'
                : 'text-[#5A5A6A] hover:text-[#8A8A9A]'
              }
            `}
          >
            {s}x
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-[#2A2A35]" />

      {/* Time display */}
      <div className="flex flex-col items-center min-w-[48px]">
        <span
          className="text-sm font-semibold text-[#F0F0F5] tabular-nums leading-tight"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {timeStr}
        </span>
        <span
          className="text-[9px] text-[#5A5A6A] tabular-nums leading-tight"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          Day {day}
        </span>
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-[#2A2A35]" />

      {/* Weather */}
      <div className="flex items-center gap-0.5">
        {weatherOptions.map(({ key, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setWeather(key)}
            className={`
              w-7 h-7 rounded-md flex items-center justify-center transition-all
              ${weather === key ? 'text-[#00E5FF]' : 'text-[#5A5A6A] hover:text-[#8A8A9A]'}
            `}
            title={key}
          >
            <Icon className="w-3.5 h-3.5" />
          </button>
        ))}
      </div>
    </div>
  )
}
