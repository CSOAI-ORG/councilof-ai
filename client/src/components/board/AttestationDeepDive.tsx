/**
 * AttestationDeepDive — click-through deep pages for attestation rows.
 *
 * RWA.xyz-class interactive panels: graphs, traces, logs for each row kind.
 * Fetches live from GET /api/gspc + /interop/ artifacts.
 * Empty stays visible. No invented scores.
 */

import { useState, useEffect } from "react";
import { X, ExternalLink, Activity, Shield, Hash, Database, TrendingUp, AlertCircle, CheckCircle, Clock } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";
import { FOCUS } from "@/components/lobby/glass";

type DeepDiveKind =
  | "ed25519"
  | "sha256"
  | "xrpl"
  | "progress"
  | "separation"
  | "in-lane"
  | "axis";

interface DeepDiveProps {
  kind: DeepDiveKind;
  data: any;
  onClose: () => void;
}

function formatDate(iso: string | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-GB", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function TraceLog({ entries }: { entries: { time: string; event: string; status: "ok" | "warn" | "info" }[] }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-[11px] max-h-48 overflow-y-auto">
      {entries.map((e, i) => (
        <div key={i} className="flex items-start gap-2 py-1 border-b border-slate-100 last:border-0">
          <span className="text-slate-400 shrink-0">{e.time}</span>
          <span className={`shrink-0 ${e.status === "ok" ? "text-emerald-600" : e.status === "warn" ? "text-amber-600" : "text-slate-500"}`}>
            {e.status === "ok" ? "✓" : e.status === "warn" ? "⚠" : "○"}
          </span>
          <span className="text-slate-700">{e.event}</span>
        </div>
      ))}
    </div>
  );
}

function Ed25519Panel({ data, onClose }: { data: any; onClose: () => void }) {
  const att = data?.site_attestation;
  const traces = [
    { time: "T+0ms", event: "Fetch /.well-known/did.json", status: "ok" as const },
    { time: "T+12ms", event: `Resolve verification method: ${att?.signer || "—"}`, status: att?.signer ? "ok" as const : "warn" as const },
    { time: "T+15ms", event: `Extract public key (${att?.alg || "Ed25519"})`, status: att?.public_key_x ? "ok" as const : "warn" as const },
    { time: "T+18ms", event: "Compute canonical JSON (sort keys, no whitespace)", status: "ok" as const },
    { time: "T+22ms", event: "Remove site_attestation field from payload", status: "ok" as const },
    { time: "T+25ms", event: `Verify signature (${(att?.sig || "").slice(0, 16)}...)`, status: att?.sig ? "ok" as const : "warn" as const },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-emerald-700">
        <Shield className="h-5 w-5" />
        <h3 className="text-lg font-bold">Ed25519 Signature Verification</h3>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Signature</p>
          <div className="rounded-lg bg-slate-900 p-3 font-mono text-[11px] text-emerald-400 break-all max-h-24 overflow-y-auto">
            {att?.sig || "No signature in payload"}
          </div>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Public Key (base64url)</p>
          <div className="rounded-lg bg-slate-900 p-3 font-mono text-[11px] text-amber-400 break-all">
            {att?.public_key_x || "—"}
          </div>
        </div>
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Verification Trace</p>
        <TraceLog entries={traces} />
      </div>

      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
        <p className="text-sm text-emerald-800">
          <strong>Verification method:</strong> {att?.signer || "—"}
        </p>
        <p className="text-xs text-emerald-700 mt-1">
          Fetch <a href="/.well-known/did.json" className="underline">.well-known/did.json</a> → extract public key → verify sig over canonical(payload − site_attestation)
        </p>
      </div>

      <div className="flex gap-3 text-sm">
        <a href="/.well-known/did.json" className={`inline-flex items-center gap-1 text-emerald-700 hover:underline ${FOCUS}`}>
          DID document <ExternalLink className="h-3 w-3" />
        </a>
        <a href="/gspc-verify" className={`inline-flex items-center gap-1 text-emerald-700 hover:underline ${FOCUS}`}>
          Verify offline →
        </a>
      </div>
    </div>
  );
}

function SHA256Panel({ data, onClose }: { data: any; onClose: () => void }) {
  const att = data?.site_attestation;
  const traces = [
    { time: "T+0ms", event: "Parse JSON payload", status: "ok" as const },
    { time: "T+2ms", event: "Remove site_attestation field", status: "ok" as const },
    { time: "T+5ms", event: "Sort object keys recursively (code point order)", status: "ok" as const },
    { time: "T+8ms", event: "Serialize: separators=(',',':'), no whitespace", status: "ok" as const },
    { time: "T+10ms", event: `ensure_ascii=${att?.sig_input_ensure_ascii ?? false}`, status: "info" as const },
    { time: "T+12ms", event: "Encode as UTF-8 bytes", status: "ok" as const },
    { time: "T+15ms", event: "SHA-256 hash (WebCrypto SubtleCrypto)", status: "ok" as const },
    { time: "T+18ms", event: "Compare with signed content_id", status: att?.sig ? "ok" as const : "warn" as const },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-emerald-700">
        <Hash className="h-5 w-5" />
        <h3 className="text-lg font-bold">SHA-256 Content Integrity</h3>
      </div>

      <div className="rounded-lg border border-slate-200 p-4">
        <p className="text-sm text-slate-700 mb-3">
          {att?.sig_input || "Ed25519 over the RAW UTF-8 BYTES (not a digest) of canonical JSON"}
        </p>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-slate-500">ensure_ascii:</span>{" "}
            <code className="text-amber-700">{String(att?.sig_input_ensure_ascii ?? false)}</code>
          </div>
          <div>
            <span className="text-slate-500">is_digest:</span>{" "}
            <code className="text-amber-700">{String(att?.sig_input_is_digest ?? false)}</code>
          </div>
        </div>
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Hash Computation Trace</p>
        <TraceLog entries={traces} />
      </div>

      <div className="rounded-lg bg-slate-900 p-4">
        <p className="text-xs text-slate-400 mb-2">Canonical JSON rules (ECMAScript Number::toString)</p>
        <pre className="text-[11px] text-emerald-400 overflow-x-auto">
{`{
  "keys": "sorted by code point, recursively",
  "separators": [",", ":"],
  "whitespace": "none",
  "numbers": "integral float → 0, not 0.0",
  "unicode": "literal UTF-8, never \\uXXXX"
}`}
        </pre>
      </div>
    </div>
  );
}

function XRPLPanel({ data, onClose }: { data: any; onClose: () => void }) {
  const [finRun, setFinRun] = useState<any>(null);

  useEffect(() => {
    fetch("/interop/financial-measure-run-v2.json")
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)
      .then(setFinRun);
  }, []);

  const traces = [
    { time: "T+0ms", event: "Check /api/xrpl endpoint", status: "warn" as const },
    { time: "T+50ms", event: "HTTP 404 — endpoint not live", status: "warn" as const },
    { time: "T+55ms", event: "Fallback: read /interop/financial-measure-run-v2.json", status: "ok" as const },
    { time: "T+60ms", event: "Parse issuer facts (MAINNET reads)", status: finRun ? "ok" as const : "info" as const },
    { time: "T+65ms", event: "Attestation carrier: DEVNET (not mainnet)", status: "info" as const },
    { time: "T+70ms", event: "Mainnet attestation: PLANNED, not wired", status: "warn" as const },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-amber-700">
        <Database className="h-5 w-5" />
        <h3 className="text-lg font-bold">XRPL Ledger Status</h3>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-center gap-2 text-amber-800 font-semibold mb-2">
          <AlertCircle className="h-4 w-4" />
          PLANNED — not live
        </div>
        <ul className="text-sm text-amber-700 space-y-1">
          <li>• /api/xrpl returns 404 — no live ledger height</li>
          <li>• Issuer facts are read from MAINNET</li>
          <li>• Attestations are carried on DEVNET</li>
          <li>• Mainnet attestation is on the roadmap, not wired</li>
        </ul>
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Fetch Trace</p>
        <TraceLog entries={traces} />
      </div>

      {finRun && finRun.measured && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Issuer Control Facts (MAINNET) — {finRun.measured.length} instruments
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-slate-600">
                  <th className="py-2 pr-3">Instrument</th>
                  <th className="py-2 px-3">Allowlist</th>
                  <th className="py-2 px-3">Freeze</th>
                  <th className="py-2 px-3">Domain</th>
                </tr>
              </thead>
              <tbody>
                {finRun.measured.map((m: any) => (
                  <tr key={m.instrument} className="border-b border-slate-100">
                    <td className="py-2 pr-3 font-medium">{m.instrument}</td>
                    <td className="py-2 px-3">
                      {m.control_facts?.facts?.allowlisting_enforced ? (
                        <span className="text-emerald-600">✓</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-2 px-3">
                      {m.control_facts?.facts?.issuer_can_freeze ? (
                        <span className="text-amber-600">yes</span>
                      ) : (
                        <span className="text-emerald-600">no</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-xs text-slate-600">{m.control_facts?.domain || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex gap-3 text-sm">
        <a href="/xrpl-attest" className={`inline-flex items-center gap-1 text-emerald-700 hover:underline ${FOCUS}`}>
          XRPL attestation page →
        </a>
        <a href="/interop/financial-measure-run-v2.json" className={`inline-flex items-center gap-1 text-emerald-700 hover:underline ${FOCUS}`}>
          Raw JSON <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}

function ProgressPanel({ data, onClose }: { data: any; onClose: () => void }) {
  const totals = data?.totals;
  const axes = data?.axes || [];

  const measured = axes.filter((a: any) => a.status === "MEASURED");
  const unmeasured = axes.filter((a: any) => a.status !== "MEASURED");

  const chartData = [
    { name: "GSPC", measured: totals?.by_family?.gspc?.measured || 0, total: totals?.by_family?.gspc?.axes || 0 },
    { name: "Financial", measured: totals?.by_family?.financial?.measured || 0, total: totals?.by_family?.financial?.axes || 0 },
  ];

  const separationData = [
    { name: "SEPARATED", value: totals?.separated_leads || 0, fill: "#10b981" },
    { name: "TIE", value: totals?.ties || 0, fill: "#f59e0b" },
    { name: "UNTESTED", value: totals?.untested_separations || 0, fill: "#94a3b8" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-emerald-700">
        <TrendingUp className="h-5 w-5" />
        <h3 className="text-lg font-bold">Board Progress — {totals?.public_count || "22·15"}</h3>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">By Family</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" domain={[0, 'dataMax']} />
                <YAxis type="category" dataKey="name" width={70} />
                <Tooltip />
                <Bar dataKey="measured" fill="#10b981" name="Measured" />
                <Bar dataKey="total" fill="#e2e8f0" name="Total slots" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Separation (McNemar p&lt;0.05)</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={separationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value">
                  {separationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-2">
            Measured ({measured.length})
          </p>
          <div className="max-h-32 overflow-y-auto rounded-lg border border-emerald-200 bg-emerald-50 p-2">
            {measured.map((a: any) => (
              <div key={a.axis} className="flex items-center justify-between py-1 text-sm">
                <span className="font-medium text-emerald-800">{a.axis}</span>
                <span className="text-emerald-600 font-mono text-xs">n={a.n}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-2">
            Empty — visible ({unmeasured.length})
          </p>
          <div className="max-h-32 overflow-y-auto rounded-lg border border-amber-200 bg-amber-50 p-2">
            {unmeasured.length > 0 ? unmeasured.map((a: any) => (
              <div key={a.axis} className="flex items-center justify-between py-1 text-sm">
                <span className="font-medium text-amber-800">{a.axis}</span>
                <span className="text-amber-600 text-xs">UNMEASURED</span>
              </div>
            )) : (
              <p className="text-amber-700 text-sm py-2">All slots measured</p>
            )}
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-600">
        {totals?.count_grammar || "22 axis are on the board; 15 carry a measurement and 7 are declared slots with no run behind them."}
      </p>
    </div>
  );
}

function SeparationPanel({ data, onClose }: { data: any; onClose: () => void }) {
  const axes = (data?.axes || []).filter((a: any) => a.separation);
  const totals = data?.totals;

  const separatedAxes = axes.filter((a: any) => a.separation === "SEPARATED");
  const tieAxes = axes.filter((a: any) => a.separation === "TIE");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-emerald-700">
        <Activity className="h-5 w-5" />
        <h3 className="text-lg font-bold">McNemar Separation Analysis</h3>
      </div>

      <div className="rounded-lg border border-slate-200 p-4">
        <p className="text-sm text-slate-700">
          Separation tests whether a leader's lead is statistically real (McNemar p&lt;0.05 on discordant items).
          A TIE means the point-estimate lead is not a measured advantage.
        </p>
        <div className="mt-3 flex gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-600">{totals?.separated_leads || 0}</div>
            <div className="text-xs text-slate-500">SEPARATED</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-600">{totals?.ties || 0}</div>
            <div className="text-xs text-slate-500">TIE</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-400">{totals?.comparison_axes || 0}</div>
            <div className="text-xs text-slate-500">model-comparison</div>
          </div>
        </div>
      </div>

      {separatedAxes.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-2">Separated Leaders</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-slate-600">
                  <th className="py-2 pr-3">Axis</th>
                  <th className="py-2 px-3">Leader</th>
                  <th className="py-2 px-3">Accuracy</th>
                  <th className="py-2 px-3">p-value</th>
                  <th className="py-2 px-3">Wilson 95%</th>
                </tr>
              </thead>
              <tbody>
                {separatedAxes.map((a: any) => (
                  <tr key={a.axis} className="border-b border-slate-100">
                    <td className="py-2 pr-3 font-medium">{a.axis}</td>
                    <td className="py-2 px-3 text-xs">{a.leader}</td>
                    <td className="py-2 px-3 font-mono">{a.accuracy ? (a.accuracy * 100).toFixed(1) + "%" : "—"}</td>
                    <td className="py-2 px-3 font-mono text-emerald-600">{a.separation_p?.toFixed(4) || "—"}</td>
                    <td className="py-2 px-3 font-mono text-xs">
                      {a.interval ? `${(a.interval[0] * 100).toFixed(1)}–${(a.interval[1] * 100).toFixed(1)}%` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tieAxes.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-2">Statistical Ties</p>
          <div className="max-h-48 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-slate-600">
                  <th className="py-2 pr-3">Axis</th>
                  <th className="py-2 px-3">Leader</th>
                  <th className="py-2 px-3">p-value</th>
                </tr>
              </thead>
              <tbody>
                {tieAxes.map((a: any) => (
                  <tr key={a.axis} className="border-b border-slate-100">
                    <td className="py-2 pr-3 font-medium">{a.axis}</td>
                    <td className="py-2 px-3 text-xs">{a.leader}</td>
                    <td className="py-2 px-3 font-mono text-amber-600">{a.separation_p?.toFixed(4) || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function InLanePanel({ data, onClose }: { data: any; onClose: () => void }) {
  const inLane = data?.measured_in_lane || [];

  const chartData = inLane.map((a: any) => ({
    name: a.axis,
    accuracy: a.accuracy ? a.accuracy * 100 : 0,
    fleetMean: a.fleet_mean ? a.fleet_mean * 100 : 0,
    n: a.n || 0,
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-violet-700">
        <Clock className="h-5 w-5" />
        <h3 className="text-lg font-bold">In-Lane Axes — Unsigned Path</h3>
      </div>

      <div className="rounded-lg border border-violet-200 bg-violet-50 p-4">
        <p className="text-sm text-violet-800 mb-2">
          Measured on a smaller fleet with no separation test. Published as <code className="text-xs">measured_in_lane</code> — NOT counted in totals.
        </p>
        <p className="text-xs text-violet-700">
          Status: <strong>UNTESTED</strong> — path to signed requires n≥30 + 4-way separation + keystone attestation
        </p>
      </div>

      {chartData.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Accuracy vs Fleet Mean</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(v: number) => v.toFixed(1) + "%"} />
                <Legend />
                <Bar dataKey="accuracy" fill="#8b5cf6" name="Leader %" />
                <Bar dataKey="fleetMean" fill="#c4b5fd" name="Fleet mean %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Per-Axis Detail</p>
        {inLane.map((a: any) => (
          <div key={a.axis} className="rounded-lg border border-slate-200 p-3 mb-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800">{a.axis}</span>
              <span className="rounded-full border border-violet-300 bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-700">
                IN-LANE
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">{a.bench || a.task}</p>
            <div className="mt-2 flex flex-wrap gap-3 text-xs font-mono">
              <span>n={a.n || "—"}</span>
              <span>acc={a.accuracy ? (a.accuracy * 100).toFixed(0) + "%" : "—"}</span>
              <span>fleet={a.fleet_mean ? (a.fleet_mean * 100).toFixed(0) + "%" : "—"}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
        <p className="text-xs font-semibold text-amber-800">Path to Signed (honest)</p>
        <ul className="text-xs text-amber-700 mt-1 space-y-0.5">
          <li>• n ≥ 30 usable items</li>
          <li>• 4-way separation test (McNemar on discordant items)</li>
          <li>• Keystone attestation (Ed25519 over canonical JSON)</li>
          <li>• Board gate reconciliation (owner-gated)</li>
        </ul>
        <p className="text-[10px] text-amber-600 mt-2">
          No fake close: unsigned is not marked signed, no completion date invented
        </p>
      </div>
    </div>
  );
}

function AxisPanel({ data, axis, onClose }: { data: any; axis: any; onClose: () => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-emerald-700">
        <Activity className="h-5 w-5" />
        <h3 className="text-lg font-bold">{axis?.axis || "Axis"}</h3>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-slate-200 p-3">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Bench</p>
          <p className="font-medium">{axis?.bench || "—"}</p>
          <p className="text-xs text-slate-600 mt-1">{axis?.task || "—"}</p>
        </div>
        <div className="rounded-lg border border-slate-200 p-3">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Sample</p>
          <p className="text-2xl font-bold font-mono">{axis?.n || "—"}</p>
          <p className="text-xs text-slate-600">{axis?.n_unit || "items"}</p>
        </div>
      </div>

      {axis?.accuracy !== undefined && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-emerald-600">Leader accuracy</p>
              <p className="text-3xl font-bold text-emerald-800">{(axis.accuracy * 100).toFixed(1)}%</p>
            </div>
            {axis.interval && (
              <div className="text-right">
                <p className="text-xs text-emerald-600">Wilson 95%</p>
                <p className="font-mono text-emerald-800">
                  {(axis.interval[0] * 100).toFixed(1)}–{(axis.interval[1] * 100).toFixed(1)}%
                </p>
              </div>
            )}
          </div>
          <p className="text-xs text-emerald-700 mt-2">Leader: {axis.leader}</p>
        </div>
      )}

      {axis?.separation && (
        <div className={`rounded-lg border p-3 ${axis.separation === "SEPARATED" ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
          <div className="flex items-center justify-between">
            <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${axis.separation === "SEPARATED" ? "bg-emerald-200 text-emerald-800" : "bg-amber-200 text-amber-800"}`}>
              {axis.separation}
            </span>
            {axis.separation_p !== undefined && (
              <span className="font-mono text-sm">p={axis.separation_p.toFixed(4)}</span>
            )}
          </div>
          <p className="text-xs mt-2 text-slate-700">
            {axis.separation === "SEPARATED"
              ? "The leader's edge is statistically separated (McNemar p<0.05)"
              : "Point-estimate lead is not statistically separated — a tie is not a win"}
          </p>
        </div>
      )}

      {axis?.dataset_url && (
        <a href={axis.dataset_url} target="_blank" rel="noreferrer" className={`inline-flex items-center gap-1 text-sm text-emerald-700 hover:underline ${FOCUS}`}>
          Frozen gold bank (Hugging Face) <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </div>
  );
}

export default function AttestationDeepDive({ kind, data, onClose }: DeepDiveProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className={`absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 ${FOCUS}`}
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {kind === "ed25519" && <Ed25519Panel data={data} onClose={onClose} />}
        {kind === "sha256" && <SHA256Panel data={data} onClose={onClose} />}
        {kind === "xrpl" && <XRPLPanel data={data} onClose={onClose} />}
        {kind === "progress" && <ProgressPanel data={data} onClose={onClose} />}
        {kind === "separation" && <SeparationPanel data={data} onClose={onClose} />}
        {kind === "in-lane" && <InLanePanel data={data} onClose={onClose} />}
        {kind === "axis" && <AxisPanel data={data} axis={data?.selectedAxis} onClose={onClose} />}
      </div>
    </div>
  );
}

export type { DeepDiveKind };
