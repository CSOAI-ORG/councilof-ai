import React, { useState, useEffect } from "react";

export type ToastKind = "info" | "success" | "warning" | "error";

export interface Toast {
  id: string;
  kind: ToastKind;
  title: string;
  body?: string;
  duration?: number;
  signed?: { hash: string; pubkey: string };
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    function onToast(e: Event) {
      const t = (e as CustomEvent<Toast>).detail;
      setToasts((cur) => [...cur, t]);
      const duration = t.duration ?? 4000;
      setTimeout(() => {
        setToasts((cur) => cur.filter((x) => x.id !== t.id));
      }, duration);
    }
    window.addEventListener("csoai:toast", onToast as EventListener);
    return () => window.removeEventListener("csoai:toast", onToast as EventListener);
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        maxWidth: 360,
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`csoai-toast csoai-toast-${t.kind}`}
          style={{
            background: t.kind === "success" ? "#16a34a" : t.kind === "error" ? "#dc2626" : t.kind === "warning" ? "#f59e0b" : "#1f2937",
            color: "white",
            padding: "12px 16px",
            borderRadius: 8,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            fontSize: 14,
          }}
        >
          <div style={{ fontWeight: 600 }}>{t.title}</div>
          {t.body && <div style={{ marginTop: 4, opacity: 0.9 }}>{t.body}</div>}
          {t.signed && (
            <div style={{ marginTop: 6, fontSize: 11, opacity: 0.7 }}>
              ✓ signed {t.signed.hash.slice(0, 12)}…
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function toast(t: Omit<Toast, "id">) {
  const id = `t-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const event = new CustomEvent("csoai:toast", { detail: { ...t, id } });
  window.dispatchEvent(event);
}
