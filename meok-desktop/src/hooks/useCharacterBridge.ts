/**
 * useCharacterBridge — WebSocket connection to SOV3 character bridge
 *
 * Connects the desktop character to the full SOV3 backend:
 * - Receive: speak, emotion, persona, listening, thinking, tool_use events
 * - Send: user_input, wake_word, click events
 *
 * This is what makes the character ALIVE.
 */

import { useState, useEffect, useRef, useCallback } from "react";

const WS_URL = "ws://localhost:3101/ws/character";

export interface CharacterState {
  persona: "jarvis" | "sophie";
  emotion: string;
  speaking: boolean;
  listening: boolean;
  thinking: boolean;
  lastText: string;
  consciousnessLevel: number;
  connected: boolean;
  currentTool: string | null;
}

interface CharacterMessage {
  type: string;
  text?: string;
  emotion?: string;
  persona?: string;
  intensity?: number;
  active?: boolean;
  tool?: string;
  status?: string;
  consciousness_level?: number;
}

export function useCharacterBridge() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>();

  const [state, setState] = useState<CharacterState>({
    persona: "jarvis",
    emotion: "neutral",
    speaking: false,
    listening: false,
    thinking: false,
    lastText: "",
    consciousnessLevel: 0.625,
    connected: false,
    currentTool: null,
  });

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        console.log("🎭 Character bridge connected");
        setState(prev => ({ ...prev, connected: true }));
      };

      ws.onmessage = (event) => {
        try {
          const msg: CharacterMessage = JSON.parse(event.data);

          switch (msg.type) {
            case "speak":
              setState(prev => ({
                ...prev,
                speaking: true,
                listening: false,
                thinking: false,
                lastText: msg.text || "",
                emotion: msg.emotion || prev.emotion,
                persona: (msg.persona as "jarvis" | "sophie") || prev.persona,
              }));
              break;

            case "emotion":
              setState(prev => ({
                ...prev,
                emotion: msg.emotion || prev.emotion,
              }));
              break;

            case "persona":
              setState(prev => ({
                ...prev,
                persona: (msg.persona as "jarvis" | "sophie") || prev.persona,
              }));
              break;

            case "listening":
              setState(prev => ({
                ...prev,
                listening: msg.active ?? true,
                speaking: false,
              }));
              break;

            case "thinking":
              setState(prev => ({
                ...prev,
                thinking: msg.active ?? true,
                listening: false,
              }));
              break;

            case "tool_use":
              setState(prev => ({
                ...prev,
                currentTool: msg.status === "executing" ? (msg.tool || null) : null,
              }));
              break;

            case "state":
              // Full state sync on connect
              setState(prev => ({
                ...prev,
                persona: (msg.persona as "jarvis" | "sophie") || prev.persona,
                emotion: msg.emotion || prev.emotion,
                consciousnessLevel: msg.consciousness_level || prev.consciousnessLevel,
              }));
              break;

            case "pong":
              break;

            default:
              console.log("🎭 Unknown message:", msg);
          }
        } catch (e) {
          console.error("🎭 Parse error:", e);
        }
      };

      ws.onclose = () => {
        console.log("🎭 Character bridge disconnected, reconnecting...");
        setState(prev => ({ ...prev, connected: false }));
        reconnectTimer.current = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };

      wsRef.current = ws;
    } catch {
      reconnectTimer.current = setTimeout(connect, 3000);
    }
  }, []);

  // Connect on mount
  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  // Ping every 30s to keep alive
  useEffect(() => {
    const interval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "ping" }));
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Send functions
  const sendUserInput = useCallback((text: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "user_input", text }));
    }
  }, []);

  const sendWakeWord = useCallback((word: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "wake_word", word }));
    }
  }, []);

  const sendClick = useCallback((action: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "click", action }));
    }
  }, []);

  return {
    state,
    sendUserInput,
    sendWakeWord,
    sendClick,
  };
}
