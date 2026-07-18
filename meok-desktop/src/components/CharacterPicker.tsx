/**
 * CharacterPicker — Choose your AI companion's visual style
 *
 * Three visual tiers:
 * 1. DiceBear — Instant procedural avatars (15+ styles, all 125 chars)
 * 2. CSS Face — Living animated face (current default)
 * 3. Live2D — Full animated character with lip-sync (premium)
 *
 * Users can switch at any time. Preference saved locally.
 */

import { useState } from "react";

interface Character {
  id: string;
  name: string;
  archetype: string;
}

interface Props {
  characters: Character[];
  activeCharacterId: string;
  onSelect: (characterId: string) => void;
  onStyleChange: (style: VisualStyle) => void;
  currentStyle: VisualStyle;
  onClose: () => void;
}

export type VisualStyle = "css-face" | "dicebear" | "live2d";

// DiceBear styles that map well to archetypes
const DICEBEAR_STYLES: Record<string, string> = {
  scholar: "notionists",
  guardian: "bottts",
  healer: "lorelei",
  trickster: "adventurer",
  pioneer: "bottts",
  mystic: "avataaars",
  default: "personas",
};

// DiceBear style showcase
const ALL_DICEBEAR_STYLES = [
  { id: "adventurer", name: "Adventurer", desc: "Illustrated characters" },
  { id: "avataaars", name: "Avataaars", desc: "Cartoon people" },
  { id: "bottts", name: "Bottts", desc: "Robot faces" },
  { id: "lorelei", name: "Lorelei", desc: "Elegant portraits" },
  { id: "notionists", name: "Notionists", desc: "Minimal sketches" },
  { id: "personas", name: "Personas", desc: "Full body characters" },
  { id: "pixel-art", name: "Pixel Art", desc: "Retro 8-bit" },
  { id: "thumbs", name: "Thumbs", desc: "Simple & friendly" },
];

function DiceBearAvatar({ seed, style, size = 48 }: { seed: string; style: string; size?: number }) {
  return (
    <img
      src={`https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}&size=${size}`}
      alt={seed}
      width={size}
      height={size}
      style={{ borderRadius: "50%", background: "#1a1a2e" }}
    />
  );
}

export function CharacterPicker({ characters, activeCharacterId, onSelect, onStyleChange, currentStyle, onClose }: Props) {
  const [tab, setTab] = useState<"characters" | "styles">("characters");
  const [dicebearStyle, setDicebearStyle] = useState("personas");

  return (
    <div style={{
      width: 440,
      maxHeight: 500,
      background: "#13121f",
      borderRadius: 16,
      border: "1px solid rgba(255,255,255,0.08)",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
    }}>
      {/* Header */}
      <div style={{
        padding: "12px 16px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#e0e0e0" }}>
          Choose Companion
        </span>
        <button onClick={onClose} style={{
          background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: 18,
        }}>✕</button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <button
          onClick={() => setTab("characters")}
          style={{
            flex: 1, padding: "8px", background: "none", border: "none",
            color: tab === "characters" ? "#60B8F0" : "#666",
            borderBottom: tab === "characters" ? "2px solid #60B8F0" : "2px solid transparent",
            cursor: "pointer", fontSize: 12, fontWeight: 600,
          }}
        >
          Characters ({characters.length})
        </button>
        <button
          onClick={() => setTab("styles")}
          style={{
            flex: 1, padding: "8px", background: "none", border: "none",
            color: tab === "styles" ? "#60B8F0" : "#666",
            borderBottom: tab === "styles" ? "2px solid #60B8F0" : "2px solid transparent",
            cursor: "pointer", fontSize: 12, fontWeight: 600,
          }}
        >
          Visual Style
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: 8 }}>
        {tab === "characters" ? (
          /* Character grid */
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 8,
          }}>
            {characters.map(char => (
              <button
                key={char.id}
                onClick={() => onSelect(char.id)}
                style={{
                  background: char.id === activeCharacterId ? "#60B8F020" : "#1a1a2e",
                  border: char.id === activeCharacterId ? "2px solid #60B8F0" : "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 12,
                  padding: 8,
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                  transition: "all 0.15s ease",
                }}
              >
                {currentStyle === "dicebear" ? (
                  <DiceBearAvatar
                    seed={char.name}
                    style={DICEBEAR_STYLES[char.archetype.toLowerCase()] || DICEBEAR_STYLES.default}
                    size={40}
                  />
                ) : (
                  <div style={{
                    width: 40, height: 40, borderRadius: "50%",
                    background: "radial-gradient(ellipse at 30% 30%, #2a1f3d, #13121f)",
                    border: "1px solid #60B8F030",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16,
                  }}>
                    {char.name.charAt(0)}
                  </div>
                )}
                <span style={{
                  fontSize: 9, color: "#aaa", textAlign: "center",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  width: "100%",
                }}>
                  {char.name}
                </span>
                <span style={{ fontSize: 8, color: "#555" }}>
                  {char.archetype}
                </span>
              </button>
            ))}
          </div>
        ) : (
          /* Style picker */
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {/* Visual style selector */}
            <div style={{ padding: "8px 4px" }}>
              <p style={{ fontSize: 11, color: "#888", marginBottom: 8 }}>Rendering Engine</p>
              {(["css-face", "dicebear", "live2d"] as VisualStyle[]).map(style => (
                <button
                  key={style}
                  onClick={() => onStyleChange(style)}
                  style={{
                    display: "block", width: "100%", textAlign: "left",
                    padding: "10px 12px", marginBottom: 4,
                    background: currentStyle === style ? "#60B8F015" : "transparent",
                    border: currentStyle === style ? "1px solid #60B8F040" : "1px solid rgba(255,255,255,0.04)",
                    borderRadius: 8, cursor: "pointer", color: "#ddd",
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    {style === "css-face" && "🎭 Living Face"}
                    {style === "dicebear" && "🎨 DiceBear Avatars"}
                    {style === "live2d" && "✨ Live2D Character"}
                  </div>
                  <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>
                    {style === "css-face" && "Animated CSS face with eyes, mouth, breathing. Lightweight."}
                    {style === "dicebear" && "Procedural avatars in 15+ styles. Every character unique."}
                    {style === "live2d" && "Full animated character with lip-sync. Premium experience."}
                  </div>
                </button>
              ))}
            </div>

            {/* DiceBear style selector (shown when dicebear is active) */}
            {currentStyle === "dicebear" && (
              <div style={{ padding: "8px 4px" }}>
                <p style={{ fontSize: 11, color: "#888", marginBottom: 8 }}>Avatar Style</p>
                <div style={{
                  display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6,
                }}>
                  {ALL_DICEBEAR_STYLES.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setDicebearStyle(s.id)}
                      style={{
                        background: dicebearStyle === s.id ? "#60B8F015" : "#1a1a2e",
                        border: dicebearStyle === s.id ? "1px solid #60B8F040" : "1px solid rgba(255,255,255,0.04)",
                        borderRadius: 8, padding: 6, cursor: "pointer",
                        display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                      }}
                    >
                      <DiceBearAvatar seed="jarvis" style={s.id} size={32} />
                      <span style={{ fontSize: 8, color: "#aaa" }}>{s.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: "8px 16px",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <span style={{ fontSize: 10, color: "#555" }}>
          MEOK OS • Sovereign AI
        </span>
        <span style={{ fontSize: 10, color: "#555" }}>
          {currentStyle === "css-face" ? "🎭" : currentStyle === "dicebear" ? "🎨" : "✨"}
          {" "}{currentStyle.replace("-", " ").toUpperCase()}
        </span>
      </div>
    </div>
  );
}
