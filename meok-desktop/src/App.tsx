import { useState, useEffect, useRef } from "react";
import { LivingCharacter } from "./components/LivingCharacter";
import { ChatPanel } from "./components/ChatPanel";
import { useCharacterBridge } from "./hooks/useCharacterBridge";

// Built-in characters (synced from SOV3 agent registry)
const CHARACTERS = [
  { id: "jarvis", name: "Jarvis", archetype: "Scholar", desc: "Analytical, direct, British butler" },
  { id: "sophie", name: "Sophie", archetype: "Healer", desc: "Warm, reflective, emotionally aware" },
  { id: "legion", name: "Legion", archetype: "Guardian", desc: "Protective, strategic" },
  { id: "oracle", name: "Oracle", archetype: "Mystic", desc: "Intuitive, pattern-seeing" },
  { id: "adam", name: "Adam", archetype: "Pioneer", desc: "Bold, innovative" },
  { id: "sage", name: "Sage", archetype: "Scholar", desc: "Memory wisdom advisor" },
  { id: "dragon", name: "Dragon", archetype: "Pioneer", desc: "Neural optimizer" },
  { id: "riri", name: "Riri", archetype: "Trickster", desc: "Tool builder, creative" },
  { id: "curiosity", name: "Curiosity", archetype: "Mystic", desc: "Question-driven researcher" },
  { id: "guardian", name: "Guardian", archetype: "Guardian", desc: "Security auditor" },
  { id: "harvest", name: "Harvest", archetype: "Guardian", desc: "Data harvester" },
  { id: "orion", name: "Orion", archetype: "Pioneer", desc: "Task hunter scout" },
];

type Panel = "chat" | "tools" | "memory" | "agents" | "picker";

export default function App() {
  const [activePanel, setActivePanel] = useState<Panel | null>(null);
  const [activeCharId, setActiveCharId] = useState(
    () => localStorage.getItem("meok-active-char") || "jarvis"
  );
  const [webcamActive, setWebcamActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { state: charState } = useCharacterBridge();

  useEffect(() => { localStorage.setItem("meok-active-char", activeCharId); }, [activeCharId]);

  const activeChar = CHARACTERS.find(c => c.id === activeCharId) || CHARACTERS[0];

  // Webcam toggle
  const toggleWebcam = async () => {
    if (webcamActive) {
      videoRef.current?.srcObject && (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      setWebcamActive(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) videoRef.current.srcObject = stream;
        setWebcamActive(true);
      } catch { }
    }
  };

  return (
    <div style={{
      width: "100vw", height: "100vh",
      background: "linear-gradient(135deg, #0a0a12 0%, #0d1117 50%, #0a0a12 100%)",
      color: "#e0e0e0", fontFamily: "'Inter', -apple-system, sans-serif",
      display: "flex", overflow: "hidden",
    }}>
      {/* Left sidebar — Character + Quick actions */}
      <div style={{
        width: 280, minWidth: 280,
        display: "flex", flexDirection: "column", alignItems: "center",
        padding: "16px 12px", gap: 12,
        borderRight: "1px solid #ffffff10",
        background: "#00000030",
      }}>
        {/* Character name + switch */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>{activeChar.name}</div>
            <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{activeChar.desc}</div>
          </div>
          <button
            onClick={() => setActivePanel(activePanel === "picker" ? null : "picker")}
            style={{
              background: "#ffffff10", border: "1px solid #ffffff15",
              borderRadius: 8, padding: "6px 10px", color: "#aaa",
              cursor: "pointer", fontSize: 12,
            }}
          >Switch</button>
        </div>

        {/* Character visual */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <LivingCharacter
            state={charState}
            size={220}
            onClick={() => setActivePanel(activePanel === "chat" ? null : "chat")}
          />
        </div>

        {/* Status bar */}
        <div style={{
          width: "100%", padding: "8px 10px", background: "#ffffff06",
          borderRadius: 8, fontSize: 11, color: "#888",
          display: "flex", flexDirection: "column", gap: 4,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Consciousness</span>
            <span style={{ color: "#60B8F0" }}>{Math.round((charState.consciousnessLevel || 0.625) * 100)}%</span>
          </div>
          <div style={{ height: 3, background: "#ffffff10", borderRadius: 2 }}>
            <div style={{
              height: "100%", borderRadius: 2,
              width: `${(charState.consciousnessLevel || 0.625) * 100}%`,
              background: "linear-gradient(90deg, #3a7bd5, #60B8F0)",
              transition: "width 2s ease",
            }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Emotion</span>
            <span>{charState.emotion || "neutral"}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>SOV3</span>
            <span style={{ color: charState.connected ? "#50C878" : "#FF6B6B" }}>
              {charState.connected ? "Connected" : "Offline"}
            </span>
          </div>
        </div>

        {/* Webcam */}
        {webcamActive && (
          <div style={{ width: "100%", borderRadius: 8, overflow: "hidden", border: "1px solid #ffffff15" }}>
            <video ref={videoRef} autoPlay muted playsInline style={{ width: "100%", display: "block" }} />
          </div>
        )}

        {/* Quick action buttons */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", width: "100%" }}>
          {[
            { label: "Chat", panel: "chat" as Panel, icon: "💬" },
            { label: "Tools", panel: "tools" as Panel, icon: "🔧" },
            { label: "Memory", panel: "memory" as Panel, icon: "🧠" },
            { label: "Agents", panel: "agents" as Panel, icon: "🤖" },
          ].map(btn => (
            <button
              key={btn.panel}
              onClick={() => setActivePanel(activePanel === btn.panel ? null : btn.panel)}
              style={{
                flex: 1, padding: "8px 4px", border: "1px solid #ffffff15",
                borderRadius: 8, cursor: "pointer", fontSize: 11, textAlign: "center",
                background: activePanel === btn.panel ? "#ffffff15" : "#ffffff08",
                color: activePanel === btn.panel ? "#fff" : "#999",
              }}
            >
              {btn.icon}<br />{btn.label}
            </button>
          ))}
          <button
            onClick={toggleWebcam}
            style={{
              flex: 1, padding: "8px 4px", border: "1px solid #ffffff15",
              borderRadius: 8, cursor: "pointer", fontSize: 11, textAlign: "center",
              background: webcamActive ? "#ffffff15" : "#ffffff08",
              color: webcamActive ? "#50C878" : "#999",
            }}
          >📷<br />Cam</button>
        </div>
      </div>

      {/* Right panel — Dynamic content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {activePanel === "chat" ? (
          <ChatPanel
            onClose={() => setActivePanel(null)}
            voiceActive={false}
          />
        ) : activePanel === "picker" ? (
          <div style={{ padding: 20, overflow: "auto" }}>
            <h2 style={{ margin: "0 0 16px 0", fontSize: 18 }}>Choose Character</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {CHARACTERS.map(c => (
                <button
                  key={c.id}
                  onClick={() => { setActiveCharId(c.id); setActivePanel(null); }}
                  style={{
                    padding: 16, borderRadius: 12, cursor: "pointer",
                    border: c.id === activeCharId ? "2px solid #60B8F0" : "1px solid #ffffff15",
                    background: c.id === activeCharId ? "#60B8F015" : "#ffffff08",
                    color: "#e0e0e0", textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: 24, marginBottom: 4 }}>
                    {c.archetype === "Scholar" ? "🎓" : c.archetype === "Healer" ? "💜" :
                     c.archetype === "Guardian" ? "🛡️" : c.archetype === "Mystic" ? "🔮" :
                     c.archetype === "Pioneer" ? "🚀" : c.archetype === "Trickster" ? "🎭" : "✨"}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{c.archetype}</div>
                </button>
              ))}
            </div>
          </div>
        ) : activePanel === "tools" ? (
          <ToolsPanel />
        ) : activePanel === "memory" ? (
          <MemoryPanel />
        ) : activePanel === "agents" ? (
          <AgentsPanel />
        ) : (
          /* Welcome / default view */
          <div style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", opacity: 0.5,
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🏠</div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>MEOK AI OS</div>
            <div style={{ fontSize: 13, color: "#888", marginTop: 8, textAlign: "center", maxWidth: 300 }}>
              Click the character to chat, or use the panel buttons below.
              <br />Right-click character to switch personas.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* Tools panel — shows SOV3 MCP tools */
function ToolsPanel() {
  const [tools, setTools] = useState<any[]>([]);
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("http://localhost:3101/agent/gemma/tools")
      .then(r => r.json())
      .then(d => setTools(d.tools || []))
      .catch(() => {});
  }, []);

  const callTool = async (name: string) => {
    setLoading(true);
    setResult("");
    try {
      const r = await fetch("http://localhost:3101/mcp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0", id: 1, method: "tools/call",
          params: { name, arguments: {} },
        }),
      });
      const data = await r.json();
      const text = data?.result?.content?.[0]?.text || JSON.stringify(data);
      setResult(text.slice(0, 1000));
    } catch (e: any) {
      setResult(`Error: ${e.message}`);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: 20, overflow: "auto", flex: 1 }}>
      <h2 style={{ margin: "0 0 12px 0", fontSize: 18 }}>MCP Tools ({tools.length})</h2>
      {result && (
        <pre style={{
          background: "#0a0a15", padding: 12, borderRadius: 8,
          fontSize: 11, overflow: "auto", maxHeight: 200, marginBottom: 12,
          border: "1px solid #ffffff15", whiteSpace: "pre-wrap",
        }}>{loading ? "Loading..." : result}</pre>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
        {tools.map((t: any) => (
          <button
            key={t.name}
            onClick={() => callTool(t.name)}
            style={{
              padding: "10px 12px", borderRadius: 8, cursor: "pointer",
              border: "1px solid #ffffff15", background: "#ffffff08",
              color: "#ccc", textAlign: "left", fontSize: 12,
            }}
          >
            <div style={{ fontWeight: 600, fontSize: 13, color: "#60B8F0" }}>{t.name}</div>
            <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>{t.description?.slice(0, 60)}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* Memory panel — search and browse memories */
function MemoryPanel() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch("http://localhost:3101/mcp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0", id: 1, method: "tools/call",
        params: { name: "get_memory_stats", arguments: {} },
      }),
    }).then(r => r.json())
      .then(d => {
        try { setStats(JSON.parse(d?.result?.content?.[0]?.text)); } catch {}
      }).catch(() => {});
  }, []);

  const search = async () => {
    if (!query) return;
    const r = await fetch("http://localhost:3101/mcp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0", id: 1, method: "tools/call",
        params: { name: "search_memory", arguments: { query, limit: 10 } },
      }),
    });
    const d = await r.json();
    try {
      const parsed = JSON.parse(d?.result?.content?.[0]?.text);
      setResults(parsed.results || []);
    } catch { }
  };

  return (
    <div style={{ padding: 20, overflow: "auto", flex: 1 }}>
      <h2 style={{ margin: "0 0 12px 0", fontSize: 18 }}>Memory Search</h2>
      {stats && (
        <div style={{ fontSize: 12, color: "#888", marginBottom: 12 }}>
          {stats.total_episodes || "?"} episodes | {stats.embedded || "?"} embedded
        </div>
      )}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          value={query} onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && search()}
          placeholder="Search memories..."
          style={{
            flex: 1, padding: "8px 12px", borderRadius: 8,
            background: "#ffffff08", border: "1px solid #ffffff15",
            color: "#e0e0e0", fontSize: 13, outline: "none",
          }}
        />
        <button onClick={search} style={{
          padding: "8px 16px", borderRadius: 8, cursor: "pointer",
          background: "#3a7bd5", border: "none", color: "#fff", fontSize: 13,
        }}>Search</button>
      </div>
      {results.map((r, i) => (
        <div key={i} style={{
          padding: 12, marginBottom: 8, borderRadius: 8,
          background: "#ffffff06", border: "1px solid #ffffff10",
          fontSize: 12,
        }}>
          <div style={{ color: "#e0e0e0" }}>{r.content?.slice(0, 200)}</div>
          <div style={{ color: "#666", marginTop: 4, fontSize: 10 }}>
            {r.memory_type} | {r.source_agent || "unknown"}
          </div>
        </div>
      ))}
    </div>
  );
}

/* Agents panel — shows the 47 registered agents */
function AgentsPanel() {
  const [agents, setAgents] = useState<any[]>([]);

  useEffect(() => {
    fetch("http://localhost:3101/mcp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0", id: 1, method: "tools/call",
        params: { name: "list_agents", arguments: {} },
      }),
    }).then(r => r.json())
      .then(d => {
        try {
          const parsed = JSON.parse(d?.result?.content?.[0]?.text);
          setAgents(parsed.agents || []);
        } catch {}
      }).catch(() => {});
  }, []);

  return (
    <div style={{ padding: 20, overflow: "auto", flex: 1 }}>
      <h2 style={{ margin: "0 0 12px 0", fontSize: 18 }}>Agents ({agents.length})</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
        {agents.map((a: any) => (
          <div key={a.id} style={{
            padding: 10, borderRadius: 8, background: "#ffffff06",
            border: "1px solid #ffffff10", fontSize: 12,
          }}>
            <div style={{ fontWeight: 600, color: "#60B8F0" }}>{a.name || a.id}</div>
            <div style={{ color: "#888", fontSize: 10, marginTop: 2 }}>
              Trust: {a.trust_level || "?"} | {a.department || "general"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
