/**
 * DiceBearCharacter — Procedural avatar from DiceBear API
 * Generates unique avatars for any character based on name + archetype.
 * Connected to SOV3 character state for emotion indicators.
 */

import { useState, useEffect } from "react";
import type { CharacterState } from "../hooks/useCharacterBridge";

const ARCHETYPE_STYLES: Record<string, string> = {
  scholar: "notionists",
  guardian: "bottts",
  healer: "lorelei",
  trickster: "adventurer",
  pioneer: "bottts",
  mystic: "avataaars",
};

const EMOTION_COLORS: Record<string, string> = {
  neutral: "#60B8F0",
  excited: "#FFD700",
  tired: "#8B7EC8",
  stressed: "#FF6B6B",
  curious: "#50C878",
  caring: "#FF69B4",
};

interface Props {
  name: string;
  archetype: string;
  state: CharacterState;
  size?: number;
  onClick?: () => void;
}

export function DiceBearCharacter({ name, archetype, state, size = 80, onClick }: Props) {
  const [breathPhase, setBreathPhase] = useState(0);
  const [thoughtVisible, setThoughtVisible] = useState(false);

  const style = ARCHETYPE_STYLES[archetype.toLowerCase()] || "personas";
  const emotionColor = EMOTION_COLORS[state.emotion] || EMOTION_COLORS.neutral;

  useEffect(() => {
    const interval = setInterval(() => setBreathPhase(p => (p + 1) % 360), 2000 / 60);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (state.speaking && state.lastText) {
      setThoughtVisible(true);
      const t = setTimeout(() => setThoughtVisible(false), 8000);
      return () => clearTimeout(t);
    }
  }, [state.speaking, state.lastText]);

  const breathScale = 1 + Math.sin(breathPhase * Math.PI / 180) * 0.02;

  return (
    <div
      onClick={onClick}
      style={{
        position: "relative",
        width: size,
        height: size,
        cursor: "pointer",
        transform: `scale(${breathScale})`,
        transition: "transform 0.3s ease",
      }}
    >
      {/* Emotion ring */}
      <div style={{
        position: "absolute",
        inset: -3,
        borderRadius: "50%",
        border: `2px solid ${state.connected ? emotionColor : "#666"}`,
        opacity: state.listening ? 0.8 : 0.4,
        animation: state.listening ? "pulse 1.5s ease-in-out infinite" : undefined,
      }} />

      {/* DiceBear avatar */}
      <img
        src={`https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(name)}&size=${size}&backgroundColor=0d0c18`}
        alt={name}
        width={size}
        height={size}
        style={{
          borderRadius: "50%",
          border: `2px solid ${emotionColor}30`,
          filter: state.thinking ? "brightness(1.2) hue-rotate(10deg)" : "none",
          transition: "filter 0.3s ease",
        }}
      />

      {/* Persona label */}
      <div style={{
        position: "absolute",
        bottom: -14,
        left: "50%",
        transform: "translateX(-50%)",
        fontSize: 9,
        color: emotionColor,
        opacity: 0.6,
        fontFamily: "monospace",
        whiteSpace: "nowrap",
      }}>
        {name.toUpperCase()}
      </div>

      {/* Speech bubble */}
      {thoughtVisible && state.lastText && (
        <div style={{
          position: "absolute",
          bottom: size + 8,
          left: size / 2,
          transform: "translateX(-50%)",
          background: "#1a1a2e",
          border: `1px solid ${emotionColor}30`,
          borderRadius: 12,
          padding: "8px 12px",
          maxWidth: 280,
          fontSize: 12,
          color: "#e0e0e0",
          lineHeight: 1.4,
          boxShadow: `0 4px 20px rgba(0,0,0,0.5)`,
          zIndex: 1000,
        }}>
          {state.lastText.slice(0, 200)}{state.lastText.length > 200 ? "..." : ""}
          <div style={{
            position: "absolute", bottom: -6, left: "50%",
            transform: "translateX(-50%) rotate(45deg)",
            width: 12, height: 12, background: "#1a1a2e",
            borderRight: `1px solid ${emotionColor}30`,
            borderBottom: `1px solid ${emotionColor}30`,
          }} />
        </div>
      )}

      {/* Listening indicator */}
      {state.listening && (
        <div style={{
          position: "absolute", top: -8, right: -8,
          width: 16, height: 16, borderRadius: "50%",
          background: "#FF4444",
          animation: "pulse 1s ease-in-out infinite",
          boxShadow: "0 0 8px #FF4444",
        }} />
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}
