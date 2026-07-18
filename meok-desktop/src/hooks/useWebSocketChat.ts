/**
 * useWebSocketChat — Chat via SOV3 WebSocket instead of SSE
 *
 * Replaces useSSEChat which tried to hit a non-existent /chat/stream endpoint.
 * This connects to ws://localhost:3101/ws/character and sends/receives messages.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import type { ChatMessage } from "../lib/types";

const WS_URL = "ws://localhost:3101/ws/character";

function makeId() {
  return Math.random().toString(36).slice(2);
}

export function useWebSocketChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  // Connect on mount
  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    ws.onopen = () => console.log("Chat WS connected");

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "speak" && msg.text) {
          // AI response received
          setMessages(prev => [...prev, {
            id: makeId(),
            role: "assistant",
            content: msg.text,
            timestamp: new Date(),
          }]);
          setIsStreaming(false);
        }
      } catch {}
    };

    ws.onclose = () => {
      console.log("Chat WS disconnected");
      // Reconnect after 3s
      setTimeout(() => {
        wsRef.current = new WebSocket(WS_URL);
      }, 3000);
    };

    wsRef.current = ws;
    return () => ws.close();
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    // Add user message to UI
    setMessages(prev => [...prev, {
      id: makeId(),
      role: "user",
      content,
      timestamp: new Date(),
    }]);
    setIsStreaming(true);

    // Send via WebSocket
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "user_input", text: content }));
    } else {
      // Fallback: direct HTTP to SOV3
      try {
        const resp = await fetch("http://localhost:3101/mcp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0", id: 1, method: "tools/call",
            params: { name: "ask_sovereign", arguments: { question: content } },
          }),
        });
        const data = await resp.json();
        const text = data?.result?.content?.[0]?.text || "No response from SOV3.";
        setMessages(prev => [...prev, {
          id: makeId(),
          role: "assistant",
          content: text,
          timestamp: new Date(),
        }]);
      } catch {
        setMessages(prev => [...prev, {
          id: makeId(),
          role: "assistant",
          content: "Can't reach SOV3. Is it running?",
          timestamp: new Date(),
        }]);
      }
      setIsStreaming(false);
    }
  }, []);

  return { messages, isStreaming, sendMessage };
}
