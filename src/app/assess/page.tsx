"use client";

import { useState } from "react";
import { Shield, CheckCircle2, AlertTriangle, Scale, Lock, ArrowRight, RefreshCw, FileText, Check, FileCheck, Search, Activity } from "lucide-react";
import Link from "next/link";

export default function AssessPage() {
  const [systemName, setSystemName] = useState("Enterprise LLM Gateway");
  const [jurisdiction, setJurisdiction] = useState("EU");
  const [modelType, setModelType] = useState("frontier");
  const [isHighRiskDomain, setIsHighRiskDomain] = useState(true);
  const [hasHumanOversight, setHasHumanOversight] = useState(true);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState<any>(null);

  const runAssessment = () => {
    setIsEvaluating(true);
    setAssessmentResult(null);

    setTimeout(() => {
      const riskTier = isHighRiskDomain ? "High Risk (Annex III)" : "Limited Risk (Article 50)";
      const status = hasHumanOversight ? "CONFORMANT_WITH_CONDITIONS" : "REQUIRES_HUMAN_IN_THE_LOOP";
      
      setAssessmentResult({
        system_name: systemName,
        jurisdiction,
        risk_tier: riskTier,
        status,
        applicable_articles: isHighRiskDomain 
          ? ["Article 9 (Risk Management)", "Article 10 (Data Governance)", "Article 14 (Human Oversight)", "Article 50 (Transparency)"]
          : ["Article 50 (Machine-Readable Marking & Watermarking)"],
        readiness_score: hasHumanOversight ? 88 : 54,
        next_deadline: "2026-12-02 (Article 50 Enforcement Date)",
        recommended_actions: [
          "Bind Ed25519 cryptographic attestations to all output streams",
          "Ensure immutable audit logs via local SHA256 preimages",
          "Maintain human review fallback for high-consequence decisions"
        ]
      });
      setIsEvaluating(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold tracking-widest uppercase mb-6">
            <Shield className="w-4 h-4" />
            CSOAI Internal Audit Tool
          </div>
          <h1 className="text-4xl sm:text-5xl font-black mb-4 text-white">AI Readiness Assessment</h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Run a deterministic gap analysis against the EU AI Act, NIST AI RMF, and ISO 42001. Find out exactly where you stand before the auditors arrive.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr_400px] gap-8">
          
          {/* Assessment Form */}
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-8 shadow-2xl space-y-8">
            <div className="space-y-6">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block flex items-center gap-2">
                  <Search className="w-4 h-4" /> System Identifier / Name
                </label>
                <input
                  type="text"
                  value={systemName}
                  onChange={(e) => setSystemName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block flex items-center gap-2">
                    <Scale className="w-4 h-4" /> Target Regime
                  </label>
                  <select
                    value={jurisdiction}
                    onChange={(e) => setJurisdiction(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors appearance-none"
                  >
                    <option value="EU">European Union (EU AI Act)</option>
                    <option value="US">United States (NIST AI RMF)</option>
                    <option value="UK">United Kingdom (JSP 936)</option>
                    <option value="Global">Global (ISO/IEC 42001)</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block flex items-center gap-2">
                    <Activity className="w-4 h-4" /> Model Architecture
                  </label>
                  <select
                    value={modelType}
                    onChange={(e) => setModelType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors appearance-none"
                  >
                    <option value="frontier">GPAI / Frontier API (GPT-4, Claude)</option>
                    <option value="opensource">Open Source Self-Hosted (Llama, Qwen)</option>
                    <option value="narrow">Narrow ML (Predictive, Classical)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-800">
                <label className="flex items-center gap-3 p-4 rounded-xl border border-slate-800 bg-slate-950/50 cursor-pointer hover:bg-slate-900 transition-colors">
                  <input
                    type="checkbox"
                    checked={isHighRiskDomain}
                    onChange={(e) => setIsHighRiskDomain(e.target.checked)}
                    className="w-5 h-5 rounded border-slate-700 text-indigo-500 focus:ring-indigo-500/20 bg-slate-900"
                  />
                  <div>
                    <div className="font-semibold text-white text-sm">Operates in a High-Risk Domain (Annex III)</div>
                    <div className="text-xs text-slate-400 mt-0.5">E.g., Biometrics, Employment, Healthcare, Credit scoring.</div>
                  </div>
                </label>
                
                <label className="flex items-center gap-3 p-4 rounded-xl border border-slate-800 bg-slate-950/50 cursor-pointer hover:bg-slate-900 transition-colors">
                  <input
                    type="checkbox"
                    checked={hasHumanOversight}
                    onChange={(e) => setHasHumanOversight(e.target.checked)}
                    className="w-5 h-5 rounded border-slate-700 text-indigo-500 focus:ring-indigo-500/20 bg-slate-900"
                  />
                  <div>
                    <div className="font-semibold text-white text-sm">Human Oversight (Article 14) Implemented</div>
                    <div className="text-xs text-slate-400 mt-0.5">A human reviews and can override high-consequence system outputs.</div>
                  </div>
                </label>
              </div>
            </div>

            <button
              onClick={runAssessment}
              disabled={isEvaluating}
              className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isEvaluating ? (
                <><RefreshCw className="w-5 h-5 animate-spin" /> Simulating Audit...</>
              ) : (
                <><FileCheck className="w-5 h-5" /> Generate Gap Analysis</>
              )}
            </button>
          </div>

          {/* Results Panel */}
          <div className="h-full">
            {assessmentResult ? (
              <div className="rounded-3xl bg-slate-900 border border-slate-800 p-8 shadow-2xl h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="font-bold text-white text-lg">Audit Profile</h3>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${assessmentResult.readiness_score > 80 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                    Score: {assessmentResult.readiness_score}/100
                  </div>
                </div>

                <div className="space-y-6 flex-1">
                  <div>
                    <div className="text-xs text-slate-500 font-bold uppercase mb-1">Risk Classification</div>
                    <div className="text-sm font-semibold text-indigo-400">{assessmentResult.risk_tier}</div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-500 font-bold uppercase mb-1">Enforcement Deadline</div>
                    <div className="text-sm font-mono text-slate-300">{assessmentResult.next_deadline}</div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-500 font-bold uppercase mb-2">Required Capabilities (Missing/Present)</div>
                    <ul className="space-y-2">
                      {assessmentResult.applicable_articles.map((article: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-slate-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                          {hasHumanOversight || article.includes("Transparency") ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                          )}
                          {article}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-800">
                  <Link href="/pricing" className="w-full block text-center py-3 rounded-lg bg-white text-slate-900 font-bold text-sm hover:bg-slate-200 transition-colors">
                    Lock In Compliance Setup
                  </Link>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl bg-slate-900/50 border border-slate-800 border-dashed p-8 h-full flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center">
                  <FileText className="w-8 h-8 text-slate-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-300 mb-2">Awaiting Assessment</h3>
                  <p className="text-xs text-slate-500 max-w-[250px] mx-auto">Fill out your system parameters to generate a deterministic compliance profile.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
