/**
 * LivingCharacter — MEOK OS AI companion visual
 *
 * Modern, expressive AI character with:
 * - Smooth SVG-based face with proper proportions
 * - Animated eyes with iris tracking, pupils, reflections
 * - Expressive mouth with phoneme shapes
 * - Glow effects that respond to emotion
 * - Breathing, blinking, thinking animations
 * - Status ring showing consciousness level
 */

import { useState, useEffect } from "react";
import type { CharacterState } from "../hooks/useCharacterBridge";

interface Props {
  state: CharacterState;
  size?: number;
  onClick?: () => void;
}

const EMOTION_COLORS: Record<string, string> = {
  neutral:  "#60B8F0",
  excited:  "#FFD700",
  tired:    "#8B7EC8",
  stressed: "#FF6B6B",
  curious:  "#50C878",
  caring:   "#FF69B4",
  focused:  "#4A90D9",
  playful:  "#FFA500",
  tranquil: "#88C8E8",
};

export function LivingCharacter({ state, size = 200, onClick }: Props) {
  const [tick, setTick] = useState(0);
  const [isBlinking, setIsBlinking] = useState(false);
  const [mouthPhase, setMouthPhase] = useState(0);

  const color = EMOTION_COLORS[state.emotion] || EMOTION_COLORS.neutral;
  const isJarvis = state.persona === "jarvis";

  // Main animation loop (60fps)
  useEffect(() => {
    let frame: number;
    const animate = () => {
      setTick(t => t + 1);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  // Blink randomly
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() < 0.08) {
        setIsBlinking(true);
        setTimeout(() => setIsBlinking(false), 120);
      }
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Mouth animation when speaking
  useEffect(() => {
    if (!state.speaking) return;
    const interval = setInterval(() => {
      setMouthPhase(p => (p + 1) % 6);
    }, 120);
    return () => clearInterval(interval);
  }, [state.speaking]);

  // Derived values
  const breathe = Math.sin(tick * 0.04) * 0.015;
  const irisX = state.thinking ? 4 : state.listening ? 0 : Math.sin(tick * 0.015) * 2;
  const irisY = state.listening ? -2 : state.thinking ? -1 : Math.cos(tick * 0.012) * 1;
  const eyeOpen = isBlinking ? 0.05 : 1;
  const consciousnessArc = (state.consciousnessLevel || 0.625) * 360;

  // Mouth shapes
  const mouthShapes = ["M40,62 Q50,65 60,62", "M40,60 Q50,68 60,60", "M40,62 Q50,66 60,62",
                        "M42,60 Q50,69 58,60", "M40,62 Q50,64 60,62", "M43,61 Q50,67 57,61"];
  const mouthPath = state.speaking
    ? mouthShapes[mouthPhase]
    : isJarvis
      ? "M42,63 Q50,65 58,63"  // Slight line
      : "M40,62 Q50,66 60,62"; // Gentle smile

  const glowIntensity = state.speaking ? 0.6 : state.thinking ? 0.4 : state.listening ? 0.5 : 0.2;

  return (
    <div
      onClick={onClick}
      style={{
        width: size,
        height: size,
        cursor: "pointer",
        position: "relative",
        transform: `scale(${1 + breathe})`,
        transition: "transform 0.5s ease",
        filter: `drop-shadow(0 0 ${size * glowIntensity * 0.15}px ${color})`,
      }}
    >
      <svg viewBox="0 0 100 100" width={size} height={size}>
        <defs>
          {/* Face gradient */}
          <radialGradient id="faceGrad" cx="40%" cy="35%" r="60%">
            <stop offset="0%" stopColor={isJarvis ? "#1e2d42" : "#2a1f3d"} />
            <stop offset="100%" stopColor={isJarvis ? "#0c1220" : "#110e1c"} />
          </radialGradient>
          {/* Eye glow */}
          <radialGradient id="eyeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </radialGradient>
          {/* Consciousness ring gradient */}
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={color} stopOpacity="0.3" />
          </linearGradient>
        </defs>

        {/* Consciousness ring (background) */}
        <circle cx="50" cy="50" r="47" fill="none" stroke="#ffffff08" strokeWidth="1.5" />
        {/* Consciousness ring (active) */}
        <circle
          cx="50" cy="50" r="47" fill="none"
          stroke={`${color}60`} strokeWidth="1.5"
          strokeDasharray={`${consciousnessArc * 0.82} 1000`}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
          style={{ transition: "stroke-dasharray 2s ease" }}
        />

        {/* Face shape */}
        <ellipse
          cx="50" cy="50"
          rx={isJarvis ? 32 : 30}
          ry={isJarvis ? 34 : 33}
          fill="url(#faceGrad)"
          stroke={`${color}25`}
          strokeWidth="0.8"
        />

        {/* Ambient glow inside face */}
        <ellipse cx="50" cy="48" rx="20" ry="18" fill="url(#eyeGlow)" opacity={glowIntensity} />

        {/* Left eye */}
        <g transform={`translate(0, ${(1 - eyeOpen) * 4})`}>
          {/* Eye socket */}
          <ellipse cx="38" cy="46" rx="7" ry={6.5 * eyeOpen} fill="#0a0a15" stroke={`${color}15`} strokeWidth="0.5" />
          {/* Iris */}
          <circle cx={38 + irisX} cy={46 + irisY} r="3.5" fill={isJarvis ? "#3a7bd5" : "#9b59b6"} opacity={eyeOpen} />
          {/* Pupil */}
          <circle cx={38 + irisX} cy={46 + irisY} r="1.8" fill="#000" opacity={eyeOpen} />
          {/* Reflection */}
          <circle cx={36.5 + irisX} cy={44.5 + irisY} r="1" fill="#fff" opacity={0.6 * eyeOpen} />
          <circle cx={39 + irisX} cy={45 + irisY} r="0.5" fill="#fff" opacity={0.3 * eyeOpen} />
        </g>

        {/* Right eye */}
        <g transform={`translate(0, ${(1 - eyeOpen) * 4})`}>
          <ellipse cx="62" cy="46" rx="7" ry={6.5 * eyeOpen} fill="#0a0a15" stroke={`${color}15`} strokeWidth="0.5" />
          <circle cx={62 + irisX} cy={46 + irisY} r="3.5" fill={isJarvis ? "#3a7bd5" : "#9b59b6"} opacity={eyeOpen} />
          <circle cx={62 + irisX} cy={46 + irisY} r="1.8" fill="#000" opacity={eyeOpen} />
          <circle cx={60.5 + irisX} cy={44.5 + irisY} r="1" fill="#fff" opacity={0.6 * eyeOpen} />
          <circle cx={63 + irisX} cy={45 + irisY} r="0.5" fill="#fff" opacity={0.3 * eyeOpen} />
        </g>

        {/* Eyebrows (subtle) */}
        <path d={state.thinking ? "M31,39 Q38,36 44,38" : "M31,40 Q38,38 44,40"} fill="none" stroke={`${color}30`} strokeWidth="0.8" />
        <path d={state.thinking ? "M56,38 Q62,36 69,39" : "M56,40 Q62,38 69,40"} fill="none" stroke={`${color}30`} strokeWidth="0.8" />

        {/* Mouth */}
        <path
          d={mouthPath}
          fill={state.speaking ? "#1a0a25" : "none"}
          stroke={`${color}50`}
          strokeWidth={state.speaking ? "1" : "0.8"}
          strokeLinecap="round"
        />

        {/* Thinking indicator (orbiting dots) */}
        {state.thinking && [0, 1, 2].map(i => {
          const angle = (tick * 0.06 + i * 2.09);
          return (
            <circle
              key={i}
              cx={50 + Math.cos(angle) * 40}
              cy={50 + Math.sin(angle) * 40}
              r="1.5"
              fill={color}
              opacity={0.4 + i * 0.2}
            />
          );
        })}

        {/* Listening pulse ring */}
        {state.listening && (
          <circle
            cx="50" cy="50" r={38 + Math.sin(tick * 0.1) * 4}
            fill="none" stroke={color} strokeWidth="0.5"
            opacity={0.3 + Math.sin(tick * 0.1) * 0.2}
          />
        )}

        {/* Persona indicator */}
        <text
          x="50" y="88" textAnchor="middle"
          fill={`${color}60`} fontSize="5" fontFamily="monospace"
        >
          {isJarvis ? "SOV-3" : "SOF-3"}
        </text>
      </svg>

      {/* Speech bubble */}
      {state.speaking && state.lastText && (
        <div style={{
          position: "absolute",
          top: -10,
          left: size + 10,
          maxWidth: 280,
          padding: "8px 12px",
          background: "#1a1a2e",
          border: `1px solid ${color}30`,
          borderRadius: "12px 12px 12px 2px",
          color: "#e0e0e0",
          fontSize: 13,
          lineHeight: 1.4,
          boxShadow: `0 4px 20px ${color}15`,
          zIndex: 100,
        }}>
          {state.lastText.slice(0, 200)}{state.lastText.length > 200 ? "..." : ""}
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
