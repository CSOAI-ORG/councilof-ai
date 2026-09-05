import React, { useState, useEffect } from "react";

const PANES = [
  { id: "memory", label: "Memory", group: "Tools" },
  { id: "files", label: "Files", group: "Tools" },
  { id: "sandbox", label: "Sandbox", group: "Tools" },
  { id: "operator", label: "Operator", group: "Tools" },
  { id: "atlas", label: "Atlas", group: "Tools" },
  { id: "gspc", label: "GSPC Board", group: "Work" },
  { id: "evidence", label: "Evidence", group: "Work" },
  { id: "learning", label: "Learning", group: "Work" },
  { id: "watchdog", label: "Watchdog", group: "Work" },
  { id: "standards", label: "Standards", group: "Govern" },
  { id: "connections", label: "Connections", group: "Govern" },
];

export function CommandK() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!open) return null;
  const filtered = PANES.filter((p) => p.label.toLowerCase().includes(q.toLowerCase()));
  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-start", justifyContent: "center",
        paddingTop: 80, zIndex: 9998,
      }}
      onClick={() => setOpen(false)}
    >
      <div
        style={{
          background: "white", borderRadius: 12, width: 560, maxWidth: "90vw",
          boxShadow: "0 8px 24px rgba(0,0,0,0.2)", padding: 16,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search panes…"
          style={{ width: "100%", padding: 12, fontSize: 16, border: "1px solid #e5e7eb", borderRadius: 8 }}
        />
        <div style={{ marginTop: 12, maxHeight: 320, overflow: "auto" }}>
          {filtered.length === 0 ? (
            <div style={{ padding: 16, color: "#6b7280", fontSize: 14 }}>No matches.</div>
          ) : (
            filtered.map((p) => (
              <a
                key={p.id}
                href={`/dashboard/${p.id}`}
                style={{
                  display: "block", padding: "8px 12px", borderRadius: 6, color: "#1f2937",
                  textDecoration: "none", fontSize: 14,
                }}
                onClick={() => setOpen(false)}
              >
                <strong>{p.label}</strong>
                <span style={{ marginLeft: 8, color: "#6b7280", fontSize: 12 }}>{p.group}</span>
              </a>
            ))
          )}
        </div>
        <div style={{ marginTop: 8, fontSize: 12, color: "#6b7280", borderTop: "1px solid #e5e7eb", paddingTop: 8 }}>
          ⌘K to toggle · esc to close · click to navigate
        </div>
      </div>
    </div>
  );
}
