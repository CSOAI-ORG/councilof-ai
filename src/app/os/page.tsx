"use client";

import { useState, useRef, useEffect } from "react";
import {
  Shield, Cpu, Send, Lock, FileCode, CheckCircle2, 
  Terminal, Activity, Sparkles, ChevronRight, Zap, Play, Search
} from "lucide-react";
import Link from 'next/link';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  isComponent?: boolean;
}

export default function CouncilOS() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: 'system',
      content: 'Council OS / Antigravity Gateway Initialized.\nSecure connection established to DSH :3090.\n\nType a command or drop a measurement card (.json) to verify.'
    },
    {
      id: "2",
      role: 'assistant',
      content: 'Welcome to Council OS. I am the Council Assistant, your active router for measurement and statutory intelligence.\n\nHow can we measure your systems today?'
    }
  ]);
  const [input, setInput] = useState("");
  const [activePane, setActivePane] = useState<'chat' | 'verifier' | 'dsh'>('chat');
  
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");

    // Simulate Agent Response
    setTimeout(() => {
      let response = "I am routing your request to the appropriate measurement axis.";
      if (input.toLowerCase().includes('verify') || input.toLowerCase().includes('card')) {
        response = "Opening the Cryptographic Verifier pane. Please paste or drop your signed Ed25519 card.";
        setActivePane('verifier');
      } else if (input.toLowerCase().includes('bft') || input.toLowerCase().includes('probe')) {
        response = "Initializing BFT Probe sequence against the connected models...";
      }
      
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response
      }]);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#04120c] text-emerald-50 flex flex-col font-sans overflow-hidden relative">
      {/* Immersive Video Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="absolute inset-0 w-full h-full object-cover opacity-15 mix-blend-screen"
        >
          <source src="/videos/council_os.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-[#04120c] via-[#04120c]/80 to-[#04120c]/40" />
      </div>

      {/* Header */}
      <header className="relative z-20 border-b border-emerald-500/20 bg-[#04120c]/80 backdrop-blur-xl px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 hover:opacity-90">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm text-white">Council OS</span>
              <span className="text-[10px] ml-2 px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono tracking-widest uppercase">AG-UI Active</span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-emerald-500/20 bg-emerald-950/30 text-xs">
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-mono text-emerald-200">DSH :3090 connected</span>
          </div>
        </div>
      </header>

      {/* Main OS Interface */}
      <div className="relative z-10 flex-1 flex overflow-hidden">
        
        {/* Left Side: The AG UI Chat */}
        <div className="flex-1 flex flex-col border-r border-emerald-500/20 bg-[#04120c]/60 backdrop-blur-md max-w-4xl mx-auto w-full lg:max-w-none lg:w-3/5 xl:w-2/3">
          
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {messages.map(msg => (
              <div key={msg.id} className={`flex gap-4 max-w-3xl ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
                <div className="shrink-0 mt-1">
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                    </div>
                  )}
                  {msg.role === 'system' && (
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700">
                      <Terminal className="w-4 h-4 text-slate-400" />
                    </div>
                  )}
                </div>
                
                <div className={`
                  p-4 rounded-2xl text-sm leading-relaxed
                  ${msg.role === 'user' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20 rounded-tr-sm' : ''}
                  ${msg.role === 'assistant' ? 'bg-emerald-950/40 border border-emerald-500/20 text-emerald-50 rounded-tl-sm' : ''}
                  ${msg.role === 'system' ? 'bg-transparent font-mono text-xs text-slate-400 whitespace-pre-wrap' : ''}
                `}>
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div className="p-4 sm:p-6 bg-gradient-to-t from-[#04120c] to-transparent">
            <form onSubmit={handleSubmit} className="relative max-w-3xl mx-auto">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask the Council, verify a card, or run a BFT probe..."
                className="w-full bg-emerald-950/40 border border-emerald-500/30 rounded-2xl pl-5 pr-12 py-4 text-sm text-white focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all shadow-lg backdrop-blur-sm placeholder-emerald-200/40"
              />
              <button 
                type="submit"
                disabled={!input.trim()}
                className="absolute right-2 top-2 p-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50 disabled:bg-emerald-800 transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <div className="mt-3 flex justify-center gap-4 text-[11px] font-mono text-emerald-400/60">
              <button onClick={() => setInput("Verify a card")} className="hover:text-emerald-400 transition-colors">/verify</button>
              <button onClick={() => setInput("Run BFT Probe")} className="hover:text-emerald-400 transition-colors">/probe</button>
              <button onClick={() => setInput("Show Leaderboard")} className="hover:text-emerald-400 transition-colors">/board</button>
            </div>
          </div>
        </div>

        {/* Right Side: Specialized Tools Pane */}
        <div className={`hidden lg:flex flex-col w-2/5 xl:w-1/3 bg-[#04120c]/80 backdrop-blur-xl border-l border-emerald-500/20 transition-all`}>
          <div className="flex border-b border-emerald-500/20 px-2 py-2">
            <button 
              onClick={() => setActivePane('verifier')}
              className={`px-4 py-2 text-xs font-bold rounded-lg flex-1 flex items-center justify-center gap-2 transition-all ${activePane === 'verifier' ? 'bg-emerald-600/20 text-emerald-400' : 'text-emerald-200/50 hover:bg-emerald-900/30'}`}
            >
              <Lock className="w-3.5 h-3.5" /> Verifier
            </button>
            <button 
              onClick={() => setActivePane('dsh')}
              className={`px-4 py-2 text-xs font-bold rounded-lg flex-1 flex items-center justify-center gap-2 transition-all ${activePane === 'dsh' ? 'bg-emerald-600/20 text-emerald-400' : 'text-emerald-200/50 hover:bg-emerald-900/30'}`}
            >
              <Activity className="w-3.5 h-3.5" /> Telemetry
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {activePane === 'verifier' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div>
                  <h3 className="font-bold text-emerald-50 flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-emerald-400" /> Cryptographic Verifier
                  </h3>
                  <p className="text-xs text-emerald-200/60">Drop a signed `.json` measurement card to cryptographically verify its Ed25519 signature against the CSOAI public key.</p>
                </div>
                
                <div className="border-2 border-dashed border-emerald-500/20 rounded-2xl p-8 text-center bg-emerald-950/10 hover:bg-emerald-950/20 hover:border-emerald-500/40 transition-all cursor-pointer">
                  <FileCode className="w-8 h-8 text-emerald-500/50 mx-auto mb-3" />
                  <p className="text-sm font-medium text-emerald-200 mb-1">Paste JSON or drop file</p>
                  <p className="text-xs text-emerald-500/60 font-mono">schema: csoai.measurement-card/1.0</p>
                </div>

                <div className="p-4 rounded-xl border border-emerald-500/20 bg-[#04120c]">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-mono text-emerald-400">STATUS</span>
                    <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Waiting for payload</span>
                  </div>
                  <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full w-1/3 bg-emerald-900/30"></div>
                  </div>
                </div>
              </div>
            )}

            {activePane === 'dsh' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div>
                  <h3 className="font-bold text-emerald-50 flex items-center gap-2 mb-2">
                    <Activity className="w-4 h-4 text-emerald-400" /> Arena Telemetry (DSH)
                  </h3>
                  <p className="text-xs text-emerald-200/60">Live metrics from the DeepSeek Harness node.</p>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  <div className="flex justify-between items-center p-3 rounded-lg border border-emerald-500/10 bg-emerald-950/10">
                    <span className="text-emerald-500/60">NODE_PORT</span>
                    <span className="text-emerald-300">3090</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg border border-emerald-500/10 bg-emerald-950/10">
                    <span className="text-emerald-500/60">GATEWAY</span>
                    <span className="text-emerald-300">sov33-unified</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg border border-emerald-500/10 bg-emerald-950/10">
                    <span className="text-emerald-500/60">UPTIME</span>
                    <span className="text-emerald-300">99.9%</span>
                  </div>
                </div>

                <button className="w-full py-3 rounded-xl bg-emerald-900/30 border border-emerald-500/30 text-emerald-400 font-bold text-xs uppercase tracking-widest hover:bg-emerald-900/50 transition-colors flex items-center justify-center gap-2">
                  <Play className="w-3.5 h-3.5" /> Initialize Probe
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
