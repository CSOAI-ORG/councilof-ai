/**
 * openpatent.ai — Live Disclosure Feed
 * Real-time WebSocket feed of disclosure events.
 */
"use client";
import { useEffect, useState } from "react";
import { Header, Footer } from "../components/chrome";

export default function LivePage() {
  const [events, setEvents] = useState<any[]>([]);
  const [status, setStatus] = useState("connecting");

  useEffect(() => {
    const proto = typeof window !== "undefined" && window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = typeof window !== "undefined" ? window.location.host : "127.0.0.1:3000";
    const url = `${proto}//${host.replace(":3000", ":3211")}/v1/live`;
    const ws = new WebSocket(url);
    ws.onopen = () => setStatus("connected");
    ws.onclose = () => setStatus("disconnected");
    ws.onmessage = (e) => {
      try {
        const evt = JSON.parse(e.data);
        setEvents((prev) => [evt, ...prev].slice(0, 50));
      } catch (e) {
        console.error("parse error", e);
      }
    };
    return () => ws.close();
  }, []);

  return (
    <>
      <Header />
      <main style={{ minHeight: "100vh", background: "#0a0a0a", color: "#fff", padding: "40px 20px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ fontSize: 12, color: "#4ecdc4", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Live feed</div>
          <h1 style={{ fontSize: 36, margin: "0 0 8px" }}>Real-time disclosure stream</h1>
          <p style={{ color: "#888", marginBottom: 24 }}>
            WebSocket: <span style={{ color: status === "connected" ? "#4ecdc4" : "#ef4444" }}>{status}</span>
            {" · "}Last {events.length} events
          </p>
          <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 16, fontFamily: "monospace", fontSize: 12 }}>
            {events.length === 0 ? (
              <div style={{ color: "#888", textAlign: "center", padding: 40 }}>Waiting for events...</div>
            ) : (
              events.map((e, i) => (
                <div key={i} style={{ padding: "8px 0", borderBottom: i < events.length - 1 ? "1px solid #333" : "none" }}>
                  <span style={{ color: "#4ecdc4" }}>{e.event || "unknown"}</span>
                  {" · "}
                  <span style={{ color: "#fbbf24" }}>{e.hash || "?"}</span>
                  {" · "}
                  <span style={{ color: "#888" }}>{e.timestamp || ""}</span>
                  {e.extra && (
                    <div style={{ color: "#aaa", marginTop: 4, paddingLeft: 12 }}>{JSON.stringify(e.extra)}</div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
