import { useEffect, useRef, useState, FormEvent } from "react";
import { useWebSocketChat as useSSEChat } from "../hooks/useWebSocketChat";
import { MessageBubble } from "./MessageBubble";
import { Send, X } from "lucide-react";

interface Props {
  onClose: () => void;
  activeGame?: string | null;
  gameAccent?: string;
  voiceActive?: boolean;
}

export function ChatPanel({ onClose, activeGame, gameAccent, voiceActive = false }: Props) {
  const { messages, isStreaming, sendMessage } = useSSEChat();
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-activate voice when Ctrl+Shift+V is pressed
  useEffect(() => {
    if (voiceActive && !isListening) {
      startRecording();
    }
  }, [voiceActive]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(",")[1];
          // Send audio to /transcribe endpoint
          fetch("http://localhost:3200/transcribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ audio_base64: base64 })
          }).then(r => r.json()).then(data => {
            if (data.transcript && data.transcript.trim()) {
              sendMessage(data.transcript);
            } else if (data.error) {
              console.error("Transcription error:", data.error);
            }
          }).catch(err => {
            console.error("Transcription failed:", err);
          });
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(t => t.stop());
      };
      
      recorder.start();
      setMediaRecorder(recorder);
      setIsListening(true);
    } catch (err) {
      console.error("Mic error:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
      setIsListening(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput("");
    sendMessage(text);
  };

  return (
    <div className="animate-fade-in-up flex flex-col bg-[#13121f] rounded-2xl shadow-2xl border border-white/10 overflow-hidden"
         style={{ width: 380, height: 520 }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#1a1930]"
           data-tauri-drag-region
           style={activeGame && gameAccent ? { borderBottom: `2px solid ${gameAccent}44` } : {}}>
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: activeGame && gameAccent ? gameAccent : "#00AA44" }}
          />
          <span className="text-sm font-semibold text-gray-800">MEOK</span>
          {activeGame ? (
            <span className="text-xs font-medium" style={{ color: gameAccent ?? "#60B8F0" }}>
              🎮 {activeGame}
            </span>
          ) : (
            <span className="text-xs text-gray-400">Sovereign AI</span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-[#0d0c18]">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 text-sm mt-8">
            <p className="text-2xl mb-2">{activeGame ? "🎮" : "✦"}</p>
            <p>
              {activeGame
                ? `Playing ${activeGame}? Ask me anything.`
                : "What matters most to you right now?"}
            </p>
          </div>
        )}
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit}
            className="flex items-center gap-2 px-3 py-3 border-t border-white/10 bg-[#13121f]">
        <button
          type="button"
          onClick={isListening ? stopRecording : startRecording}
          className={`p-2 rounded-xl transition-colors ${
            isListening 
              ? "bg-red-500 text-white animate-pulse" 
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
          title={isListening ? "Stop recording" : "Start voice input (Ctrl+Shift+V)"}
        >
          {isListening ? "⏹️" : "🎤"}
        </button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={activeGame ? `Ask about ${activeGame}...` : "Ask anything..."}
          disabled={isStreaming}
          className="flex-1 px-3 py-2 text-sm rounded-xl border border-white/10 focus:outline-none focus:border-[#60B8F0] disabled:opacity-50 bg-[#1a1930] text-white"
        />
        <button
          type="submit"
          disabled={!input.trim() || isStreaming}
          className="p-2 rounded-xl bg-[#0066FF] text-white disabled:opacity-40 hover:bg-blue-700 transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
