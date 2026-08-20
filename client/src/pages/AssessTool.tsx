/*
 * /assess — the free signed risk check.
 * Calls the signed /api/assess endpoint (api-server, Ed25519) and shows the verifiable verdict.
 * API base: VITE_ASSESS_API (defaults to same-origin).
 *
 * Design: the homepage scroll-world language via components/pagekit/PageKit —
 * a full-bleed branded band with a frosted white type panel, then the tool itself
 * on a light band. Previously this sat inside the logged-in DashboardLayout
 * sidebar even though it is a public, no-signup, top-of-funnel page.
 */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Loader2, BadgeCheck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setMetaDescription } from "@/lib/utils";
import { VideoEmbed } from "@/components/home/VideoEmbed";
import { Band, Caveat, MediaHero, Panel, PanelGrid } from "@/components/pagekit/PageKit";

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
  prohibited: "text-red-600", high_risk: "text-amber-600",
  limited_risk: "text-blue-600", minimal_risk: "text-emerald-600",
};

const STEPS = [
  { n: "01", h: "Describe the system", b: "Three plain-English fields. What it is, what it is for, and the domain it operates in." },
  { n: "02", h: "Get the risk tier", b: "An EU AI Act classification with the reasoning written out, and the control gaps named individually." },
  { n: "03", h: "Keep the signature", b: "The result comes back Ed25519-signed. Check it against the published key — today, or in two years." },
];

export default function AssessTool() {
  const [form, setForm] = useState({ system: "", purpose: "", domain: "", human_oversight: true, logging: true });
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lead, setLead] = useState({ email: "", name: "" });
  const [leadSent, setLeadSent] = useState(false);
  const [leadError, setLeadError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Free signed AI risk check — EU AI Act classification | Council of AI";
    setMetaDescription("Free EU AI Act risk classification with an Ed25519-signed result you can verify independently. No signup, about two minutes. Indicative measurement, never a legal certification.");
  }, []);

  async function sendLead() {
    setLeadError(null);
    try {
      const res = await fetch(`${API_BASE}/api/lead`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...lead, report_id: report?.report_id, tier: report?.tier, verdict: report?.verdict, wants: "signed_report" }),
      });
      if (!res.ok) throw new Error(`Could not save (${res.status})`);
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
    <div className="min-h-screen bg-white">
      <MediaHero
        kicker="Free · no signup · about two minutes"
        title={<>Find out where your system sits under the Act.</>}
        lede={
          <>
            Describe what you have built in three lines. You get back an EU AI Act risk
            classification, the control gaps behind it, and a cryptographically signed record —
            so the answer is checkable by anyone you show it to, including a regulator.
          </>
        }
        media={
          <VideoEmbed
            src="/videos/proving-ground.mp4"
            poster="/videos/proving-ground.jpg"
            title="Inside the proving ground"
            className="!max-w-none"
          />
        }
        points={[
          { tag: "pain", text: "Working out your risk tier normally means a consultant, a scoping call and a six-week wait." },
          { tag: "benefit", text: "A tier, a rationale and a named gap list in about two minutes, with nothing to sign up for." },
          { tag: "usp", text: "The result is Ed25519-signed, so its integrity does not depend on you trusting us." },
        ]}
        actions={[{ href: "#assess", label: "Run the free check" }]}
        footnote={
          <>
            This is an indicative measurement, not a legal certification. Council of AI issues no
            conformity mark and no approval — the signature attests what the instrument returned, and
            nothing about your compliance.
          </>
        }
      />

      <Band
        tone="tint"
        kicker="How it works"
        title={<>Three steps, and you keep the evidence.</>}
        lede={<>Nothing here is stored behind a login. What you get back is yours, and it verifies offline.</>}
      >
        <PanelGrid cols={3}>
          {STEPS.map((s) => (
            <Panel key={s.n}>
              <span className="font-mono text-xs font-bold tracking-[0.2em] text-emerald-600">{s.n}</span>
              <h3 className="mt-2 text-lg font-black tracking-tight text-gray-900">{s.h}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-gray-600">{s.b}</p>
            </Panel>
          ))}
        </PanelGrid>
      </Band>

      <Band
        kicker="The check"
        title={<>Describe your AI system.</>}
        lede={<>Plain English is fine — this is not a form that punishes you for imprecise wording.</>}
        width="prose"
      >
        <div id="assess" className="scroll-mt-24 space-y-6">
          <Panel>
            <div className="space-y-4">
              <input
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-[15px] outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                placeholder="What is the system? (e.g. AI that screens job applicants)"
                value={form.system}
                onChange={(e) => setForm({ ...form, system: e.target.value })}
              />
              <input
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-[15px] outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                placeholder="Purpose (e.g. rank candidates)"
                value={form.purpose}
                onChange={(e) => setForm({ ...form, purpose: e.target.value })}
              />
              <input
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-[15px] outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                placeholder="Domain (e.g. employment, credit, healthcare)"
                value={form.domain}
                onChange={(e) => setForm({ ...form, domain: e.target.value })}
              />
              <div className="flex flex-wrap gap-6 text-[15px] text-gray-700">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.human_oversight}
                    onChange={(e) => setForm({ ...form, human_oversight: e.target.checked })}
                  />
                  Human oversight in place
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.logging}
                    onChange={(e) => setForm({ ...form, logging: e.target.checked })}
                  />
                  Logging / record-keeping
                </label>
              </div>
              <Button
                onClick={run}
                disabled={loading || (!form.system && !form.purpose)}
                className="w-full bg-emerald-500 py-6 text-base font-extrabold text-white hover:bg-emerald-400"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Assessing…
                  </>
                ) : (
                  "Run the signed assessment"
                )}
              </Button>
              {error && (
                <p className="flex items-center gap-2 text-sm text-red-600">
                  <AlertTriangle className="h-4 w-4" />
                  {error}
                </p>
              )}
            </div>
          </Panel>

          {report && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <Panel>
                <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-4">
                  <span className={`text-2xl font-black tracking-tight ${TIER_STYLE[report.tier] || "text-gray-900"}`}>
                    {report.tier.replace("_", " ").toUpperCase()}
                  </span>
                  <span className="text-sm text-gray-500">score {report.compliance_score}</span>
                </div>
                <div className="mt-4 space-y-4">
                  <p className="flex items-center gap-2 font-bold text-gray-900">
                    {report.verdict === "pass" ? (
                      <>
                        <BadgeCheck className="h-5 w-5 text-emerald-600" />
                        Verdict: pass
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5 text-amber-600" />
                        Verdict: {report.verdict}
                      </>
                    )}
                  </p>
                  <p className="text-[15px] leading-relaxed text-gray-600">{report.rationale}</p>
                  {report.gaps.length > 0 && (
                    <div>
                      <p className="text-sm font-bold text-gray-900">Control gaps (EU AI Act)</p>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-[15px] text-gray-600">
                        {report.gaps.map((g) => (
                          <li key={g}>{g}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="break-all rounded-xl bg-gray-50 p-4 font-mono text-xs text-gray-600">
                    <div><span className="text-gray-400">report_id:</span> {report.report_id}</div>
                    <div><span className="text-gray-400">signed by:</span> {report.kid} ({report.alg})</div>
                    <div><span className="text-gray-400">signature:</span> {report.sig.slice(0, 44)}…</div>
                  </div>
                  <p className="text-[13px] leading-relaxed text-gray-500">
                    This result is Ed25519-signed. Anyone can verify it against the public key at
                    <code className="mx-1">{API_BASE}/api/assess/key</code>, or against the published
                    signer at <code>did:web:csoai.org</code>. It is an indicative assessment, not a
                    legal certification.
                  </p>

                  {leadSent ? (
                    <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-800">
                      Thanks — we&apos;ll email your signed report and the next steps, personally.
                    </div>
                  ) : (
                    <div className="space-y-3 rounded-xl border border-gray-200 p-4">
                      <p className="text-sm font-bold text-gray-900">
                        Email me this signed report and a full Annex III walkthrough
                      </p>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <input
                          className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                          placeholder="you@company.com"
                          value={lead.email}
                          onChange={(e) => setLead({ ...lead, email: e.target.value })}
                        />
                        <input
                          className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                          placeholder="Name (optional)"
                          value={lead.name}
                          onChange={(e) => setLead({ ...lead, name: e.target.value })}
                        />
                        <Button onClick={sendLead} disabled={!lead.email}>
                          Send it
                        </Button>
                      </div>
                      {leadError && <p className="text-xs text-red-600">{leadError}</p>}
                    </div>
                  )}
                </div>
              </Panel>
            </motion.div>
          )}
        </div>
      </Band>

      <Band tone="deep" width="prose">
        <Caveat title="What this check is and is not">
          <p>
            It is an <strong>indicative measurement</strong>: the instrument reads your description
            against the Act&apos;s risk tiers and returns a classification with its reasoning, signed
            so it cannot be quietly altered afterwards.
          </p>
          <p>
            It is <strong>not</strong> legal advice, not a conformity assessment, and not a
            certification. Council of AI is a measurement body — it issues no conformity mark and no
            approval, and a signature attests the record, never your compliance. For the deterministic
            method behind it, read the{" "}
            <a href="/methodology" className="font-semibold underline">
              methodology
            </a>
            .
          </p>
        </Caveat>
      </Band>
    </div>
  );
}
