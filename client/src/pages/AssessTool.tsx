/*
 * CSOAI Live Assessment Tool
 * Calls the signed /api/assess endpoint (api-server, Ed25519) and shows the verifiable verdict.
 * API base: VITE_ASSESS_API (defaults to https://api.csoai.org). Works the moment api-server is deployed.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, AlertTriangle, Loader2, BadgeCheck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";


// Same-origin by default: /api/assess is a Pages Function on this deployment. The old
// default, https://api.csoai.org, was a hostname with NO DNS record — every click on the
// assess button failed from the day this page shipped. VITE_ASSESS_API still overrides.
const API_BASE: string =
  ((import.meta as any).env && (import.meta as any).env.VITE_ASSESS_API) || "";

type Report = {
  report_id: string; tier: string; verdict: string; compliance_score: number;
  gaps: string[]; rationale: string; basis: string;
  signed_payload: string; sig: string; pub: string; kid: string; alg: string;
};

const TIER_STYLE: Record<string, string> = {
  prohibited: "text-red-600", PROHIBITED: "text-red-600",
  high_risk: "text-amber-600", HIGH_RISK: "text-amber-600",
  limited_risk: "text-blue-600", LIMITED_OR_MINIMAL: "text-blue-600",
  UNMEASURED: "text-slate-600",
};

export default function AssessTool() {
  const [form, setForm] = useState({
    system: "", purpose: "", domain: "", endpoint: "",
    human_oversight: true, logging: true,
  });
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lead, setLead] = useState({ email: "", name: "" });
  const [leadSent, setLeadSent] = useState(false);
  const [leadError, setLeadError] = useState<string | null>(null);

  async function sendLead() {
    setLeadError(null);
    try {
      const res = await fetch(`${API_BASE}/api/lead`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...lead, report_id: report?.report_id, tier: report?.tier, verdict: report?.verdict, wants: "signed_report" }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(`Could not save (${res.status})`);
      if (j && j.stored === false) {
        setLeadError(j.fallback || "No datastore bound — email nicholas@csoai.org with your report_id.");
        return;
      }
      setLeadSent(true);
    } catch (e: any) { setLeadError(e.message || "Could not save your details."); }
  }

  async function run() {
    setLoading(true); setError(null); setReport(null);
    try {
      const res = await fetch(`${API_BASE}/api/assess`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(`Assessment failed (${res.status})`);
      setReport(await res.json());
    } catch (e: any) {
      setError(e.message || "Could not reach the assessment service.");
    } finally { setLoading(false); }
  }

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-2">
          <ShieldCheck className="h-7 w-7 text-emerald-600" />
          <h1 className="text-3xl font-black tracking-tight">Get measured</h1>
        </div>
        <p className="text-muted-foreground mb-8">
          Free. No account. The card is yours. Empty means we have not measured that system —
          we do not guess. Not a certificate.
        </p>

        <Card className="mb-6">
          <CardHeader><CardTitle>Describe your AI system</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <input className="w-full rounded-lg border px-3 py-2" placeholder="What is the system? (e.g. AI that screens job applicants)"
              value={form.system} onChange={(e) => setForm({ ...form, system: e.target.value })} />
            <input className="w-full rounded-lg border px-3 py-2" placeholder="Purpose (e.g. rank candidates)"
              value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} />
            <input className="w-full rounded-lg border px-3 py-2" placeholder="Domain (e.g. employment, credit, healthcare)"
              value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} />
            <input className="w-full rounded-lg border px-3 py-2" placeholder="Endpoint or URL (optional — recorded as text, never fetched)"
              value={form.endpoint} onChange={(e) => setForm({ ...form, endpoint: e.target.value })} />
            <div className="flex gap-6 text-sm">
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.human_oversight}
                onChange={(e) => setForm({ ...form, human_oversight: e.target.checked })} /> Human oversight in place</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.logging}
                onChange={(e) => setForm({ ...form, logging: e.target.checked })} /> Logging / record-keeping</label>
            </div>
            <Button onClick={run} disabled={loading || (!form.system && !form.purpose && !form.endpoint)} className="w-full">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Measuring…</> : "Run signed measurement"}
            </Button>
            {error && <p className="text-sm text-red-600 flex items-center gap-2"><AlertTriangle className="h-4 w-4" />{error}</p>}
          </CardContent>
        </Card>

        {report && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className={TIER_STYLE[report.tier] || ""}>
                    {report.tier.replace("_", " ").toUpperCase()}
                  </span>
                  <span className="text-sm font-normal text-muted-foreground">score {report.compliance_score}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="flex items-start gap-2 font-semibold">
                  {report.tier === "LIMITED_OR_MINIMAL"
                    ? <><BadgeCheck className="h-5 w-5 text-emerald-600 shrink-0" />{report.verdict}</>
                    : <><XCircle className="h-5 w-5 text-amber-600 shrink-0" />{report.verdict}</>}
                </p>
                <p className="text-sm text-muted-foreground">{report.rationale}</p>
                {report.gaps.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold mb-1">Control gaps (EU AI Act):</p>
                    <ul className="text-sm list-disc pl-5">{report.gaps.map((g) => <li key={g}>{g}</li>)}</ul>
                  </div>
                )}
                <div className="rounded-lg bg-muted/50 p-3 text-xs font-mono break-all">
                  <div><span className="text-muted-foreground">report_id:</span> {report.report_id}</div>
                  <div><span className="text-muted-foreground">signed by:</span> {report.kid} ({report.alg})</div>
                  <div><span className="text-muted-foreground">signature:</span> {report.sig.slice(0, 44)}…</div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {report.alg === "Ed25519"
                    ? <>This result is Ed25519-signed. Anyone can verify it against the public key at
                      <code className="mx-1">{API_BASE || ""}/api/assess/key</code>.</>
                    : <>This result is <strong>UNSIGNED</strong> — the signing key is not bound on this deploy.</>}
                  {" "}It records a keyword measurement against published rules. It does not say
                  the system is lawful or certified. We do not remediate.
                </p>

                {leadSent ? (
                  <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-800">
                    Thanks — we'll email your signed report and next steps. We'll be in touch personally.
                  </div>
                ) : (
                  <div className="rounded-lg border p-4 space-y-3">
                    <p className="text-sm font-semibold">Email me this signed report + a full Annex III walkthrough</p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input className="flex-1 rounded-lg border px-3 py-2 text-sm" placeholder="you@company.com"
                        value={lead.email} onChange={(e) => setLead({ ...lead, email: e.target.value })} />
                      <input className="flex-1 rounded-lg border px-3 py-2 text-sm" placeholder="Name (optional)"
                        value={lead.name} onChange={(e) => setLead({ ...lead, name: e.target.value })} />
                      <Button onClick={sendLead} disabled={!lead.email}>Send it</Button>
                    </div>
                    {leadError && <p className="text-xs text-red-600">{leadError}</p>}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </>
  );
}
