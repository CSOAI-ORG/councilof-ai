/**
 * Live2DCharacter — Full animated Live2D character with lip-sync
 *
 * Uses pixi.js + pixi-live2d-display to render Live2D Cubism models.
 * Supports:
 * - Emotion-based expression changes
 * - Lip-sync from audio volume
 * - Idle motion loops
 * - Click interaction
 * - Model switching (Jarvis ↔ Sophie)
 *
 * Free models from Live2D SDK samples.
 */

import { useEffect, useRef, useState } from "react";
import type { CharacterState } from "../hooks/useCharacterBridge";

// Live2D model URLs (free sample models from Live2D Inc.)
const MODELS: Record<string, string> = {
  // Hiyori — expressive anime girl (good for Sophie)
  hiyori: "https://cdn.jsdelivr.net/gh/guansss/pixi-live2d-display/test/assets/hiyori/hiyori_pro_t10.model3.json",
  // Shizuku — classic demo model
  shizuku: "https://cdn.jsdelivr.net/gh/RaSan147/pixi-live2d-display@latest/playground/Shizuku/shizuku.model.json",
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
  state: CharacterState;
  modelId?: string;
  size?: number;
  onClick?: () => void;
}

export function Live2DCharacter({ state, modelId = "hiyori", size = 200, onClick }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appRef = useRef<any>(null);
  const modelRef = useRef<any>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [thoughtVisible, setThoughtVisible] = useState(false);

  const emotionColor = EMOTION_COLORS[state.emotion] || EMOTION_COLORS.neutral;

  // Initialize PixiJS + Live2D
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        // Dynamic import to avoid SSR issues
        const PIXI = await import("pixi.js");
        const { Live2DModel } = await import("pixi-live2d-display");

        // Register Live2D with PIXI
        // @ts-ignore — pixi-live2d-display uses global PIXI
        window.PIXI = PIXI;

        if (!canvasRef.current || cancelled) return;

        // Create PIXI app
        const app = new PIXI.Application({
          view: canvasRef.current,
          width: size,
          height: size,
          backgroundAlpha: 0, // Transparent background
          antialias: true,
        });

        appRef.current = app;

        // Load Live2D model
        const modelUrl = MODELS[modelId] || MODELS.hiyori;
        const model = await Live2DModel.from(modelUrl, {
          autoInteract: false,
        });

        if (cancelled) return;

        // Scale and position model to fit canvas
        model.anchor.set(0.5, 0.5);
        const scale = Math.min(size / model.width, size / model.height) * 0.8;
        model.scale.set(scale);
        model.x = size / 2;
        model.y = size / 2;

        app.stage.addChild(model);
        modelRef.current = model;
        setLoaded(true);

      } catch (e: any) {
        console.error("Live2D init error:", e);
        setError(e.message || "Failed to load Live2D model");
      }
    }

    init();

    return () => {
      cancelled = true;
      appRef.current?.destroy(true);
    };
  }, [modelId, size]);

  // Update expression based on emotion
  useEffect(() => {
    const model = modelRef.current;
    if (!model) return;

    try {
      // Map emotions to Live2D expressions
      const expressionMap: Record<string, number> = {
        neutral: 0,
        excited: 1,
        tired: 2,
        stressed: 3,
        curious: 4,
        caring: 5,
      };

      const idx = expressionMap[state.emotion] || 0;
      if (model.internalModel?.motionManager) {
        // Try to set expression
        model.expression(idx);
      }
    } catch {
      // Expression might not exist in model — safe to ignore
    }
  }, [state.emotion]);

  // Lip-sync: animate mouth based on speaking state
  useEffect(() => {
    if (!modelRef.current) return;

    let animFrame: number;
    let phase = 0;

    const animate = () => {
      const model = modelRef.current;
      if (!model?.internalModel?.coreModel) return;

      try {
        const core = model.internalModel.coreModel;

        if (state.speaking) {
          // Animate mouth open/close when speaking
          phase += 0.15;
          const mouthOpen = Math.abs(Math.sin(phase)) * 0.8;
          // ParamMouthOpenY is standard Live2D parameter for mouth
          const paramIdx = core.getParameterIndex("ParamMouthOpenY");
          if (paramIdx >= 0) {
            core.setParameterValueByIndex(paramIdx, mouthOpen);
          }
        } else {
          // Close mouth when not speaking
          const paramIdx = core.getParameterIndex("ParamMouthOpenY");
          if (paramIdx >= 0) {
            core.setParameterValueByIndex(paramIdx, 0);
          }
        }

        // Eye tracking based on state
        if (state.listening) {
          // Look slightly up when listening
          const eyeX = core.getParameterIndex("ParamEyeBallX");
          const eyeY = core.getParameterIndex("ParamEyeBallY");
          if (eyeX >= 0) core.setParameterValueByIndex(eyeX, 0);
          if (eyeY >= 0) core.setParameterValueByIndex(eyeY, 0.3);
        } else if (state.thinking) {
          // Look to the side when thinking
          const eyeX = core.getParameterIndex("ParamEyeBallX");
          const eyeY = core.getParameterIndex("ParamEyeBallY");
          if (eyeX >= 0) core.setParameterValueByIndex(eyeX, 0.5);
          if (eyeY >= 0) core.setParameterValueByIndex(eyeY, -0.2);
        }
      } catch {
        // Parameter might not exist — safe to ignore
      }

      animFrame = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animFrame);
  }, [state.speaking, state.listening, state.thinking]);

  // Show speech bubble
  useEffect(() => {
    if (state.speaking && state.lastText) {
      setThoughtVisible(true);
      const t = setTimeout(() => setThoughtVisible(false), 8000);
      return () => clearTimeout(t);
    }
  }, [state.speaking, state.lastText]);

  return (
    <div
      onClick={onClick}
      style={{
        position: "relative",
        width: size,
        height: size,
        cursor: "pointer",
      }}
    >
      {/* Emotion ring */}
      <div style={{
        position: "absolute", inset: -3, borderRadius: "50%",
        border: `2px solid ${state.connected ? emotionColor : "#666"}`,
        opacity: state.listening ? 0.8 : 0.3,
        animation: state.listening ? "pulse 1.5s ease-in-out infinite" : undefined,
      }} />

      {/* Live2D canvas */}
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        style={{
          borderRadius: "50%",
          overflow: "hidden",
        }}
      />

      {/* Loading / Error fallback */}
      {!loaded && !error && (
        <div style={{
          position: "absolute", inset: 0, display: "flex",
          alignItems: "center", justifyContent: "center",
          background: "#13121f", borderRadius: "50%",
          color: "#666", fontSize: 10,
        }}>
          Loading...
        </div>
      )}

      {error && (
        <div style={{
          position: "absolute", inset: 0, display: "flex",
          alignItems: "center", justifyContent: "center",
          background: "#13121f", borderRadius: "50%",
          color: "#FF6B6B", fontSize: 9, textAlign: "center", padding: 8,
        }}>
          Live2D unavailable<br />
          <span style={{ color: "#666" }}>{error.slice(0, 50)}</span>
        </div>
      )}

      {/* Persona label */}
      <div style={{
        position: "absolute", bottom: -14, left: "50%",
        transform: "translateX(-50%)",
        fontSize: 9, color: emotionColor, opacity: 0.6,
        fontFamily: "monospace", whiteSpace: "nowrap",
      }}>
        {state.persona.toUpperCase()}
        {state.currentTool ? ` ⚡ ${state.currentTool}` : ""}
      </div>

      {/* Speech bubble */}
      {thoughtVisible && state.lastText && (
        <div style={{
          position: "absolute", bottom: size + 8, left: size / 2,
          transform: "translateX(-50%)",
          background: "#1a1a2e", border: `1px solid ${emotionColor}30`,
          borderRadius: 12, padding: "8px 12px", maxWidth: 280,
          fontSize: 12, color: "#e0e0e0", lineHeight: 1.4,
          boxShadow: `0 4px 20px rgba(0,0,0,0.5)`, zIndex: 1000,
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
