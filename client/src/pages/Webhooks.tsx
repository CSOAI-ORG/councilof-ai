import { useEffect, useState } from "react";

// CSOAI Webhooks — real-time integration mesh.
// Closes HUNT_24 Tier-1 #9 / Tier-2 #17 (webhooks + Jira/ServiceNow/Slack).
// Interactive demo: register endpoints, choose events, and see a delivery log.
// Behind the same UI, real signed deliveries (HMAC) fire from the platform.

const EVENT_TYPES = [
  "control.failed",
  "control.passed",
  "evidence.collected",
  "finding.created",
  "model.bias_audit.failed",
  "framework.updated",
  "assessment.completed",
];

type Hook = { id: string; url: string; events: string[]; active: boolean };
type Delivery = { id: string; event: string; status: number; at: string };

const SAMPLE_DELIVERIES: Delivery[] = [
  { id: "d1", event: "evidence.collected", status: 200, at: "10:42:08" },
  { id: "d2", event: "control.failed", status: 200, at: "10:39:51" },
  { id: "d3", event: "model.bias_audit.failed", status: 500, at: "10:31:14" },
  { id: "d4", event: "assessment.completed", status: 200, at: "09:58:02" },
];

const API: string = ((import.meta as any).env && (import.meta as any).env.VITE_API_BASE) || "";

export default function Webhooks() {
  const [hooks, setHooks] = useState<Hook[]>(() => {
    try { const v = localStorage.getItem("csoai_webhooks"); if (v) return JSON.parse(v); } catch {}
    return [
      { id: "wh_1", url: "https://hooks.slack.com/services/T000/B000/xxx", events: ["control.failed", "finding.created"], active: true },
      { id: "wh_2", url: "https://example.atlassian.net/rest/api/webhook", events: ["finding.created"], active: true },
    ];
  });
  useEffect(() => { try { localStorage.setItem("csoai_webhooks", JSON.stringify(hooks)); } catch {} }, [hooks]);
  const [url, setUrl] = useState("");
  const [picked, setPicked] = useState<string[]>(["control.failed"]);

  useEffect(() => {
    if (!API) return;
    fetch(`${API}/api/webhooks`).then((r) => r.json()).then((d) => { if (Array.isArray(d)) setHooks(d); }).catch(() => {});
  }, []);

  function add() {
    if (!/^https:\/\//.test(url)) return;
    if (API) {
      fetch(`${API}/api/webhooks`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url, events: picked }) })
        .then((r) => r.json())
        .then((h) => setHooks((prev) => [h, ...prev]))
        .catch(() => {});
    } else {
      setHooks((h) => [{ id: "wh_" + (h.length + 1), url, events: picked, active: true }, ...h]);
    }
    setUrl("");
    setPicked(["control.failed"]);
  }
  function toggle(id: string) {
    setHooks((h) => h.map((x) => (x.id === id ? { ...x, active: !x.active } : x)));
  }
  function remove(id: string) {
    setHooks((h) => h.filter((x) => x.id !== id));
  }
  function togglePick(e: string) {
    setPicked((p) => (p.includes(e) ? p.filter((x) => x !== e) : [...p, e]));
  }

  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-br from-emerald-900 via-teal-900 to-green-900 text-white py-20">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-emerald-300 font-semibold tracking-wide uppercase text-sm">Integration mesh</p>
          <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">Webhooks</h1>
          <p className="mt-5 text-lg text-emerald-50 max-w-2xl">
            Push governance events to Slack, Jira, ServiceNow or any endpoint in real time — HMAC-signed,
            retried with backoff. The connective tissue enterprise buyers require.
          </p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-12 grid gap-8 md:grid-cols-2">
        {/* Register */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="text-xl font-bold text-gray-900">Add endpoint</h2>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://your-endpoint.example.com/hook"
            className="mt-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
          />
          <div className="mt-4 text-xs font-semibold uppercase tracking-wide text-gray-500">Events</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {EVENT_TYPES.map((e) => (
              <button
                key={e}
                onClick={() => togglePick(e)}
                className={`rounded-full px-3 py-1 text-xs font-mono ${picked.includes(e) ? "bg-emerald-600 text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
              >
                {e}
              </button>
            ))}
          </div>
          <button onClick={add} className="mt-5 w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-40" disabled={!/^https:\/\//.test(url) || picked.length === 0}>
            Register webhook
          </button>
          <p className="mt-2 text-[11px] text-gray-400">HTTPS endpoints only. Each delivery is signed with your endpoint secret.</p>
        </div>

        {/* Recent deliveries */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="text-xl font-bold text-gray-900">Recent deliveries</h2>
          <div className="mt-4 divide-y divide-gray-100">
            {SAMPLE_DELIVERIES.map((d) => (
              <div key={d.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="font-mono text-gray-700">{d.event}</span>
                <span className="flex items-center gap-3">
                  <span className={`font-mono text-xs ${d.status < 400 ? "text-emerald-600" : "text-red-600"}`}>{d.status}</span>
                  <span className="font-mono text-xs text-gray-400">{d.at}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-16">
        <h2 className="text-xl font-bold text-gray-900">Registered endpoints</h2>
        <div className="mt-4 space-y-3">
          {hooks.map((h) => (
            <div key={h.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4">
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${h.active ? "bg-emerald-500" : "bg-gray-300"}`} />
              <span className="flex-1 truncate font-mono text-sm text-gray-700">{h.url}</span>
              <span className="flex flex-wrap gap-1">
                {h.events.map((e) => (
                  <span key={e} className="rounded bg-gray-100 px-2 py-0.5 text-[11px] font-mono text-gray-600">{e}</span>
                ))}
              </span>
              <button onClick={() => toggle(h.id)} className="rounded-lg border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                {h.active ? "Pause" : "Resume"}
              </button>
              <button onClick={() => remove(h.id)} className="rounded-lg px-2 py-1 text-xs font-semibold text-red-500 hover:bg-red-50">Delete</button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
