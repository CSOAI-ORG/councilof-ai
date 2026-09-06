/*
 * CSOAI Live Assessment Tool
 *
 * /assess must match /measure: paid measurement, booking not live, public
 * verifies free, never a bought rank. This page must not claim a free signed
 * run. Do not put any payment-processor checkout chrome here (and never on
 * /honesty). OWNER RULING 6 Sep 2026: no prices, no tiers, no payment-processor
 * names anywhere — free, or pay-as-you-go x402 at the 402.
 *
 * This page used to say "Pay-as-you-go x402 (not live yet)" in three places.
 * Measured 2026-09-06 that was false: /.well-known/x402.json publishes
 * mode "live" with 9 resources on eip155:8453, and GET /api/free-door answers
 * 402 — the rail issues real payment challenges today.
 *
 * What is genuinely unavailable is paying for an ASSESSMENT that way:
 * /api/assess is NOT one of the 9 published doors. The page now separates the
 * two claims instead of understating the rail to stay safe. Understating is
 * still misstating, and "not live yet" on a live rail is the same class of
 * error as a stale count on /products — a typed claim about a moving surface
 * that nobody re-read.
 *
 * assessHonesty.test.ts binds this to the rail's own bytes: it asserts
 * /api/assess is absent from the committed manifest fixture, so the day
 * assessment IS published as a door, the test reds and this copy must change.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, SearchCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";


// Same-origin by default: /api/assess is a Pages Function on this deployment. The old
// default, https://api.csoai.org, was a hostname with NO DNS record — every click on the
// assess button failed from the day this page shipped. VITE_ASSESS_API still overrides.
const API_BASE: string =
  ((import.meta as any).env && (import.meta as any).env.VITE_ASSESS_API) || "";

type Report = {
  result_id: string; screening_state: string; explanation: string;
  claimed_control_coverage: { claimed: number; total: number; percent: number; evidence_state: string; note: string };
  unclaimed_controls: string[]; rationale: string; basis: string;
  signed_payload: string; sig: string; pub: string; kid: string; alg: string;
};

const SCREEN_STYLE: Record<string, string> = {
  POSSIBLE_PROHIBITED_TEXT_MATCH: "text-red-600",
  POSSIBLE_ANNEX_III_TEXT_MATCH: "text-amber-600",
  NO_MATCH_IN_LIMITED_KEYWORD_SET: "text-blue-600",
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
        body: JSON.stringify({ ...lead, result_id: report?.result_id, screening_state: report?.screening_state, explanation: report?.explanation, wants: "measurement_enquiry" }),
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
        <p className="text-muted-foreground mb-4">
          Paid measurement. Booking is not live. The x402 rail is live for the doors it
          publishes at <code>/.well-known/x402.json</code>, and assessment is not one of
          them yet — so there is nothing to pay at a 402 here today. The public verifies free.
          Never a bought rank. Empty means we have not measured that system — we do not guess.
          Not a certificate.
        </p>
        <p className="mb-8 text-sm text-muted-foreground">
          Waitlist and scope live on <a href="/measure" className="font-semibold text-emerald-800 underline-offset-2 hover:underline">/measure</a>.
          Verify a published card at <a href="/gspc-verify" className="font-semibold text-emerald-800 underline-offset-2 hover:underline">/gspc-verify</a> — free, no account.
          {" "}
          <a href="/contact?arm=ledger" className="font-semibold text-emerald-800 underline-offset-2 hover:underline">
            Need this for an insurer?
          </a>
          <span> — enquiry for a signed pack. Never a bought rank.</span>
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
            <Button onClick={run} disabled={true} className="w-full" aria-disabled="true">
              Booking is not live
            </Button>
            <p className="text-xs text-muted-foreground">
              Signed measurement is a paid engagement. Checkout is not on this page. Do not treat a disabled
              button as a free run. {loading ? "Not running." : null}
              {error && <span className="text-red-600"> {error}</span>}
            </p>
          </CardContent>
        </Card>

        {report && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className={SCREEN_STYLE[report.screening_state] || ""}>
                    {report.screening_state.replaceAll("_", " ")}
                  </span>
                  <span className="text-sm font-normal text-muted-foreground">
                    claimed {report.claimed_control_coverage.claimed}/{report.claimed_control_coverage.total}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="flex items-start gap-2 font-semibold">
                  <SearchCheck className="h-5 w-5 text-amber-600 shrink-0" />
                  {report.explanation}
                </p>
                <p className="text-sm text-muted-foreground">{report.rationale}</p>
                {report.unclaimed_controls.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold mb-1">Controls not claimed by the caller:</p>
                    <ul className="text-sm list-disc pl-5">{report.unclaimed_controls.map((g) => <li key={g}>{g}</li>)}</ul>
                    <p className="mt-2 text-xs text-muted-foreground">Not claiming a control is not proof of a deficiency. Claimed controls were not verified.</p>
                  </div>
                )}
                <div className="rounded-lg bg-muted/50 p-3 text-xs font-mono break-all">
                  <div><span className="text-muted-foreground">result_id:</span> {report.result_id}</div>
                  <div><span className="text-muted-foreground">signed by:</span> {report.kid} ({report.alg})</div>
                  <div><span className="text-muted-foreground">signature:</span> {report.sig.slice(0, 44)}…</div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {report.alg === "Ed25519"
                    ? <>These screening bytes are Ed25519-signed. Anyone can verify byte integrity against the public key at
                      <code className="mx-1">{API_BASE || ""}/api/assess/key</code>.</>
                    : <>This result is <strong>UNSIGNED</strong> — the signing key is not bound on this deploy.</>}
                  {" "}A signature does not validate the input or establish legal tier, lawfulness,
                  compliance, conformity, or certification. No remediation occurred.
                </p>

                {leadSent ? (
                  <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-800">
                    Thanks — we'll email your signed report and next steps. We'll be in touch personally.
                  </div>
                ) : (
                  <div className="rounded-lg border p-4 space-y-3">
                    <p className="text-sm font-semibold">Ask about a scoped measurement engagement</p>
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
