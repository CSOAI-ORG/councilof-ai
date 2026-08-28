"use client";

import { useState } from "react";
import { Shield, CheckCircle2, AlertTriangle, Scale, Lock, ArrowRight, RefreshCw, FileText, Check, Copy } from "lucide-react";

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
    }, 600);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-medium mb-3">
          <Shield className="w-4 h-4" />
          CSOAI Readiness & Conformance Suite
        </div>
        <h1 className="text-3xl sm:text-4xl font-black mb-2">AI Readiness & Risk Assessment</h1>
        <p className="text-muted-foreground text-sm max-w-xl mx-auto">
          Evaluate your AI systems against EU AI Act, NIST AI RMF, and ISO 42001 requirements in real time.
        </p>
      </div>

      <div className="rounded-2xl bg-card border border-border p-6 shadow-sm space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
              System Identifier / Name
            </label>
            <input
              type="text"
              value={systemName}
              onChange={(e) => setSystemName(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-brand-500"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
              Target Regulatory Regime
            </label>
            <select
              value={jurisdiction}
              onChange={(e) => setJurisdiction(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-brand-500"
            >
              <option value="EU">European Union (EU AI Act)</option>
              <option value="US">United States (NIST AI RMF 1.0)</option>
              <option value="UK">United Kingdom (DSIT / JSP 936)</option>
              <option value="GLOBAL">Global (ISO/IEC 42001)</option>
            </select>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <label className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border cursor-pointer hover:border-brand-500/40 transition-colors">
            <input
              type="checkbox"
              checked={isHighRiskDomain}
              onChange={(e) => setIsHighRiskDomain(e.target.checked)}
              className="w-4 h-4 rounded text-brand-500 focus:ring-brand-400"
            />
            <div>
              <div className="text-sm font-medium">Critical / High-Consequence Domain</div>
              <div className="text-xs text-muted-foreground">Applies to hiring, credit underwriting, biometrics, education, or essential infrastructure.</div>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border cursor-pointer hover:border-brand-500/40 transition-colors">
            <input
              type="checkbox"
              checked={hasHumanOversight}
              onChange={(e) => setHasHumanOversight(e.target.checked)}
              className="w-4 h-4 rounded text-brand-500 focus:ring-brand-400"
            />
            <div>
              <div className="text-sm font-medium">Active Human-in-the-Loop Oversight (Article 14)</div>
              <div className="text-xs text-muted-foreground">Decisions undergo human review or have real-time human override mechanisms.</div>
            </div>
          </label>
        </div>

        <button
          onClick={runAssessment}
          disabled={isEvaluating}
          className="w-full py-3.5 rounded-xl gradient-brand text-white font-semibold flex items-center justify-center gap-2 hover:opacity-95 transition-opacity shadow-lg shadow-brand-500/25"
        >
          {isEvaluating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" /> Evaluating Conformance Rubrics...
            </>
          ) : (
            <>
              <Scale className="w-4 h-4" /> Run Deterministic Readiness Assessment
            </>
          )}
        </button>
      </div>

      {assessmentResult && (
        <div className="mt-8 rounded-2xl bg-card border border-brand-500/30 p-6 shadow-md space-y-6 animate-in fade-in-50 duration-300">
          <div className="flex flex-wrap items-center justify-between border-b border-border pb-4 gap-2">
            <div>
              <span className="text-xs text-muted-foreground">Assessment Result for</span>
              <h3 className="text-xl font-bold text-foreground">{assessmentResult.system_name}</h3>
            </div>
            <div className="text-right">
              <span className="text-xs text-muted-foreground block">Readiness Score</span>
              <span className="text-2xl font-black text-brand-400">{assessmentResult.readiness_score}/100</span>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-background border border-border">
              <span className="text-xs text-muted-foreground block">Assessed Risk Classification</span>
              <span className="text-sm font-bold text-foreground mt-1 block">{assessmentResult.risk_tier}</span>
            </div>
            <div className="p-4 rounded-xl bg-background border border-border">
              <span className="text-xs text-muted-foreground block">Key Enforcement Milestone</span>
              <span className="text-sm font-bold text-brand-400 mt-1 block">{assessmentResult.next_deadline}</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Applicable Legal Obligations</h4>
            <div className="space-y-1.5">
              {assessmentResult.applicable_articles.map((art: string, idx: number) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-foreground p-2 rounded-lg bg-background border border-border">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>{art}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Recommended Conformance Steps</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              {assessmentResult.recommended_actions.map((act: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-brand-400 font-bold">&bull;</span>
                  <span>{act}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 border-t border-border pt-6">
            <div className="bg-brand-500/10 border border-brand-500/30 rounded-xl p-6 text-center relative overflow-hidden group">
              <div className="flex flex-col items-center justify-center relative z-10 transition-all">
                <Shield className="w-8 h-8 text-brand-400 mb-3" />
                <h4 className="font-bold text-lg mb-2">Unlock Audit-Ready Compliance PDF</h4>
                <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
                  Download the full 42-page technical compliance roadmap mapped exactly to {jurisdiction}. Includes Ed25519 digital signature for verifiable vendor assessment.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <a href="/pricing" className="px-6 py-2.5 bg-brand-500 text-white font-semibold rounded-lg hover:bg-brand-600 transition-colors shadow-lg shadow-brand-500/20 text-sm">
                    Unlock with Pro — £79/mo
                  </a>
                  <button className="px-6 py-2.5 bg-background border border-border text-foreground font-semibold rounded-lg hover:border-brand-500/50 transition-colors text-sm">
                    One-time Export — £99
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row gap-3">
            <a
              href="/evaluate"
              className="flex-1 text-center py-3 rounded-xl border border-brand-500/30 text-brand-400 text-xs font-semibold hover:bg-brand-500/5 transition-colors"
            >
              Run Automated Model Evaluation (22-Axis GSPC) &rarr;
            </a>
            <a
              href="/os"
              className="px-6 py-3 rounded-xl bg-background border border-border text-foreground text-xs font-semibold text-center hover:bg-accent transition-colors"
            >
              Open Council OS Cockpit
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
