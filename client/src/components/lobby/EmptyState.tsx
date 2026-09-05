import React from "react";

export interface EmptyStateProps {
  title: string;
  body?: string;
  cta?: { label: string; href: string };
  icon?: string;
}

export function EmptyState({ title, body, cta, icon = "📦" }: EmptyStateProps) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "48px 16px",
        color: "#6b7280",
        background: "#fafafa",
        border: "1px dashed #e5e7eb",
        borderRadius: 12,
      }}
    >
      <div style={{ fontSize: 48, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 18, fontWeight: 600, color: "#1f2937", marginBottom: 8 }}>{title}</div>
      {body && <div style={{ fontSize: 14, marginBottom: 16 }}>{body}</div>}
      {cta && (
        <a
          href={cta.href}
          style={{
            display: "inline-block",
            padding: "10px 20px",
            background: "#16a34a",
            color: "white",
            borderRadius: 8,
            textDecoration: "none",
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          {cta.label}
        </a>
      )}
    </div>
  );
}
