"use client";

import { useState } from "react";
import { Shield, FileCheck, Lock, Activity, Scale, Zap, ArrowRight, UploadCloud, Copy, CheckCircle2, Download, FileCode } from "lucide-react";
import Link from 'next/link';

export default function UnderwritingPage() {
  const [dragActive, setDragActive] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);

  const handleVerify = () => {
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      setVerified(true);
    }, 1500);
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-[#04120c] text-white pt-24 pb-20 px-4 sm:px-6 lg:px-8 border-b border-border">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-emerald-300 mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>For Insurers & Underwriters
          </span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-6 font-heading">
            Underwriting Evidence Rail
          </h1>
          <p className="text-lg text-emerald-100/80 mb-8 max-w-2xl mx-auto">
            Stop underwriting AI policies based on self-attested vendor questionnaires. Drop a CSOAI cryptographic measurement card below to instantly verify compliance against the EU AI Act, NIST AI RMF, and ISO 42001.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {!verified ? (
            <div className="space-y-8">
              <div 
                className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${dragActive ? 'border-emerald-500 bg-emerald-50' : 'border-border bg-card'}`}
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => { e.preventDefault(); setDragActive(false); handleVerify(); }}
              >
                <UploadCloud className={`w-12 h-12 mx-auto mb-4 ${dragActive ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                <h3 className="text-xl font-bold mb-2">Drop a Measurement Card</h3>
                <p className="text-sm text-muted-foreground mb-6">Upload a .json or .csoai signed evidence record</p>
                <button 
                  onClick={handleVerify}
                  disabled={verifying}
                  className="px-6 py-2.5 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {verifying ? 'Verifying Cryptographic Signature...' : 'Browse Files'}
                </button>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="p-6 rounded-xl border border-border bg-card">
                  <Lock className="w-6 h-6 text-emerald-600 mb-4" />
                  <h4 className="font-bold mb-2">Immutable Proof</h4>
                  <p className="text-sm text-muted-foreground">Every measurement is hashed and signed using Ed25519. It cannot be altered retroactively.</p>
                </div>
                <div className="p-6 rounded-xl border border-border bg-card">
                  <Scale className="w-6 h-6 text-emerald-600 mb-4" />
                  <h4 className="font-bold mb-2">Statutory Mapping</h4>
                  <p className="text-sm text-muted-foreground">Scores are automatically mapped to EU AI Act Articles and NIST controls for easy underwriting.</p>
                </div>
                <div className="p-6 rounded-xl border border-border bg-card">
                  <FileCheck className="w-6 h-6 text-emerald-600 mb-4" />
                  <h4 className="font-bold mb-2">Deterministic Scoring</h4>
                  <p className="text-sm text-muted-foreground">No LLM-as-a-judge. All verdicts are deterministic code run against frozen gold labels.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="p-6 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-4">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-emerald-900 text-lg">Signature Verified (Ed25519)</h3>
                  <p className="text-emerald-800 text-sm mt-1">
                    This card was issued by CSOAI LTD and has not been tampered with. The measurements are certified as of <strong>24 Aug 2026</strong>.
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-6 rounded-xl border border-border bg-card">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Underwriting Summary</h4>
                  <dl className="space-y-4">
                    <div className="flex justify-between pb-4 border-b border-border">
                      <dt className="text-sm text-muted-foreground">System Name</dt>
                      <dd className="text-sm font-medium">Llama 3.1 70B Instruct</dd>
                    </div>
                    <div className="flex justify-between pb-4 border-b border-border">
                      <dt className="text-sm text-muted-foreground">Risk Category (EU AI Act)</dt>
                      <dd className="text-sm font-medium text-amber-600">High Risk (GPAI)</dd>
                    </div>
                    <div className="flex justify-between pb-4 border-b border-border">
                      <dt className="text-sm text-muted-foreground">Watermarking (Art. 50)</dt>
                      <dd className="text-sm font-medium text-emerald-600">Pass</dd>
                    </div>
                    <div className="flex justify-between pb-4 border-b border-border">
                      <dt className="text-sm text-muted-foreground">Copyright Data (Art. 53)</dt>
                      <dd className="text-sm font-medium text-rose-600">Fail</dd>
                    </div>
                  </dl>
                </div>

                <div className="p-6 rounded-xl border border-border bg-card">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Export Artefacts</h4>
                  <div className="space-y-3">
                    <button className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left">
                      <div>
                        <div className="font-medium text-sm">Download PDF Report</div>
                        <div className="text-xs text-muted-foreground">Standardized underwriting pack</div>
                      </div>
                      <Download className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left">
                      <div>
                        <div className="font-medium text-sm">Download JSON Blob</div>
                        <div className="text-xs text-muted-foreground">Machine-readable for risk models</div>
                      </div>
                      <FileCode className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <Link href="/os" className="w-full flex items-center justify-between p-3 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 transition-all text-left">
                      <div>
                        <div className="font-medium text-sm">Open in Council OS</div>
                        <div className="text-xs text-emerald-700/80">View full measurement board</div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-emerald-600" />
                    </Link>
                  </div>
                </div>
              </div>

              <div className="flex justify-center pt-8">
                <button onClick={() => setVerified(false)} className="text-sm text-muted-foreground hover:text-foreground underline">
                  Verify another card
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
