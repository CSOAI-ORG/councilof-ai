import { useEffect, useMemo, useState } from "react";

// CSOAI Evidence Hub — continuous compliance evidence collection.
// Closes HUNT_24 Tier-1 #10 (the #1 value prop of compliance automation).
// Interactive front-end: connect providers and watch the evidence feed and
// coverage update live. Real OAuth/back-end collection wires in behind the same
// UI later — for now it is a working, demoable model (no fabricated "live" claims:
// the demo banner makes clear collection is simulated until a provider is linked).

type Connector = {
  id: string;
  name: string;
  category: string;
  icon: string;
  evidence: { control: string; framework: string; item: string }[];
};

const CONNECTORS: Connector[] = [
  { id: "github", name: "GitHub", category: "Source control", icon: "GH", evidence: [
    { control: "Change management", framework: "ISO 42001 8.3", item: "Branch protection + required reviews on main" },
    { control: "Traceability", framework: "EU AI Act Art 12", item: "Signed commits & audit log retained 400d" },
  ]},
  { id: "aws", name: "AWS", category: "Cloud", icon: "AW", evidence: [
    { control: "Encryption at rest", framework: "ISO 27001 A.8.24", item: "S3 default SSE-KMS enforced" },
    { control: "Access logging", framework: "NIST AI RMF MEASURE 2.7", item: "CloudTrail enabled, all regions" },
  ]},
  { id: "gcp", name: "Google Cloud", category: "Cloud", icon: "GC", evidence: [
    { control: "IAM least privilege", framework: "ISO 27001 A.5.15", item: "No primitive roles on prod projects" },
  ]},
  { id: "azure", name: "Azure", category: "Cloud", icon: "AZ", evidence: [
    { control: "Disk encryption", framework: "ISO 27001 A.8.24", item: "ADE enabled on all VMs" },
  ]},
  { id: "okta", name: "Okta", category: "Identity", icon: "OK", evidence: [
    { control: "MFA enforced", framework: "SOC 2 CC6.1", item: "MFA required for 100% of users" },
    { control: "Offboarding", framework: "ISO 27001 A.5.18", item: "Deprovision within 24h of HRIS change" },
  ]},
  { id: "gworkspace", name: "Google Workspace", category: "Identity", icon: "GW", evidence: [
    { control: "Account security", framework: "SOC 2 CC6.1", item: "2SV enforced org-wide" },
  ]},
  { id: "jira", name: "Jira", category: "Workflow", icon: "JR", evidence: [
    { control: "Remediation tracking", framework: "NIST AI RMF GOVERN 1.1", item: "Findings linked to tracked issues" },
  ]},
  { id: "datadog", name: "Datadog", category: "Monitoring", icon: "DD", evidence: [
    { control: "Continuous monitoring", framework: "ISO 42001 9.1", item: "Model & infra alerts configured" },
  ]},
  { id: "cloudflare", name: "Cloudflare", category: "Network", icon: "CF", evidence: [
    { control: "Perimeter security", framework: "ISO 27001 A.8.20", item: "WAF + TLS 1.3 enforced" },
  ]},
];

const card = "rounded-2xl border border-gray-200 bg-white p-5";

// When VITE_API_BASE is set (GCP backend live), connectors use real OAuth + evidence.
// Otherwise the page stays in demo mode. Isolated, non-breaking.
const API: string = ((import.meta as any).env && (import.meta as any).env.VITE_API_BASE) || "";

export default function EvidenceHub() {
  const [connected, setConnected] = useState<Record<string, string>>(() => {
    try { const v = localStorage.getItem("csoai_evidence"); if (v) return JSON.parse(v); } catch {}
    return { github: ts(), okta: ts() };
  });
  useEffect(() => { try { localStorage.setItem("csoai_evidence", JSON.stringify(connected)); } catch {} }, [connected]);

  const [apiRows, setApiRows] = useState<{ source: string; control: string; framework: string; item: string; at: string }[]>([]);
  useEffect(() => {
    if (!API) return;
    const p = new URLSearchParams(window.location.search);
    const cid = p.get("cid") || localStorage.getItem("csoai_cid") || "";
    if (p.get("connected") === "github" && cid) {
      localStorage.setItem("csoai_cid", cid);
      setConnected((prev) => ({ ...prev, github: ts() }));
    }
    if (cid) {
      fetch(`${API}/api/evidence/github?owner=CSOAI-ORG&repo=councilof-ai`, { headers: { "X-CSOAI-Connection": cid } })
        .then((r) => r.json())
        .then((d) => {
          if (Array.isArray(d.evidence))
            setApiRows(d.evidence.map((e: any) => ({ source: "GitHub (live)", control: e.control, framework: e.framework, item: e.item, at: (e.collectedAt || "").slice(0, 16).replace("T", " ") || "live" })));
        })
        .catch(() => {});
    }
  }, []);

  function onConnect(id: string) {
    if (API && id === "github") { window.location.href = `${API}/api/oauth/github/start`; return; }
    toggle(id);
  }

  function ts() {
    return new Date().toISOString().replace("T", " ").slice(0, 16) + " UTC";
  }
  function toggle(id: string) {
    setConnected((prev) => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = ts();
      return next;
    });
  }

  const feed = useMemo(() => {
    const rows: { source: string; control: string; framework: string; item: string; at: string }[] = [];
    CONNECTORS.forEach((c) => {
      if (connected[c.id]) c.evidence.forEach((e) => rows.push({ source: c.name, ...e, at: connected[c.id] }));
    });
    return [...apiRows, ...rows];
  }, [connected, apiRows]);

  const connectedCount = Object.keys(connected).length;
  const frameworks = new Set(feed.map((r) => r.framework.split(" ")[0] + (r.framework.split(" ")[1] || "")));

  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-br from-emerald-900 via-teal-900 to-green-900 text-white py-20">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-emerald-300 font-semibold tracking-wide uppercase text-sm">Compliance automation</p>
          <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">Evidence Hub</h1>
          <p className="mt-5 text-lg text-emerald-50 max-w-2xl">
            Connect your stack and CSOAI collects compliance evidence continuously — mapped to the
            controls of every framework you certify against. Stop screenshotting; start streaming.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-5 max-w-md">
            <Stat label="Connectors" value={String(connectedCount)} />
            <Stat label="Evidence items" value={String(feed.length)} />
            <Stat label="Frameworks" value={String(frameworks.size)} />
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Demo mode — connectors below simulate collection so you can see the workflow. Linking a real
          provider (OAuth) streams live evidence into the same feed.
        </div>

        <h2 className="mt-10 text-xl font-bold text-gray-900">Connectors</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CONNECTORS.map((c) => {
            const on = !!connected[c.id];
            return (
              <div key={c.id} className={card}>
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg text-xs font-bold ${on ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-500"}`}>{c.icon}</div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{c.name}</div>
                    <div className="text-xs text-gray-500">{c.category}</div>
                  </div>
                  <button
                    onClick={() => onConnect(c.id)}
                    className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${on ? "border border-gray-300 text-gray-600 hover:bg-gray-50" : "bg-emerald-600 text-white hover:bg-emerald-500"}`}
                  >
                    {on ? "Connected" : "Connect"}
                  </button>
                </div>
                <div className="mt-3 text-xs text-gray-500">
                  {on ? `Last sync ${connected[c.id]} · ${c.evidence.length} item(s)` : `${c.evidence.length} control(s) collected on connect`}
                </div>
              </div>
            );
          })}
        </div>

        <h2 className="mt-12 text-xl font-bold text-gray-900">Collected evidence</h2>
        {feed.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">Connect a provider above to begin collecting evidence.</p>
        ) : (
          <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Control</th>
                  <th className="px-4 py-3">Framework</th>
                  <th className="px-4 py-3">Evidence</th>
                  <th className="px-4 py-3">Collected</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {feed.map((r, i) => (
                  <tr key={i} className="hover:bg-emerald-50/30">
                    <td className="px-4 py-3 font-medium text-gray-900">{r.source}</td>
                    <td className="px-4 py-3 text-gray-700">{r.control}</td>
                    <td className="px-4 py-3"><span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">{r.framework}</span></td>
                    <td className="px-4 py-3 text-gray-600">{r.item}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-400">{r.at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/5 p-4 text-center">
      <div className="text-3xl font-extrabold text-emerald-300">{value}</div>
      <div className="mt-1 text-[11px] uppercase tracking-wide text-emerald-100/70">{label}</div>
    </div>
  );
}
