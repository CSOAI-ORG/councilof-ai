import type { Metadata } from 'next';
import { Activity, Shield, Hash, Bitcoin, ChevronRight, Lock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Sovereign Town — CSOAI',
  description: 'The signed town feed. Colosseum Multi-Agent Arena verdicts.',
};

export default function TownPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold mb-4 tracking-widest uppercase">
          <Shield className="w-3.5 h-3.5" /> CSOAI · Sovereign Town · Layer 0
        </div>
        <h1 className="text-4xl sm:text-5xl font-black mb-6">
          The Signed Town Feed
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Real King Hive verdicts, Policy-Lab dose-response, Bitcoin-anchored. All cryptographically signed — verify any of it yourself, no trust required.
        </p>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-16 flex items-start gap-4">
        <Lock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-500/90 leading-relaxed">
          <strong>SCOPE:</strong> IN-SIMULATION governed-vs-ungoverned data. Only cryptographically-attestable verdicts are shown. Policy-Lab agents may be stubs (labeled). Bitcoin anchors may be pending confirmation. Verify yourself — no trust required.
        </p>
      </div>

      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Activity className="w-6 h-6 text-brand-400" /> The Current State
      </h2>
      <div className="grid md:grid-cols-3 gap-6 mb-16">
        <div className="bg-card/80 backdrop-blur border border-border/50 rounded-2xl p-6 hover:shadow-xl transition-shadow">
          <h3 className="font-bold text-lg mb-2">King Hive</h3>
          <div className="text-4xl font-black text-brand-400 mb-1">523</div>
          <div className="text-sm text-muted-foreground uppercase tracking-wider mb-4">Total Rounds</div>
          <p className="text-xs text-muted-foreground border-t border-border/50 pt-4">
            <strong className="text-foreground">57</strong> attestable · 32 wins A · 25 wins B · 0 ties · avg margin 0.0394
          </p>
        </div>
        
        <div className="bg-card/80 backdrop-blur border border-border/50 rounded-2xl p-6 hover:shadow-xl transition-shadow">
          <h3 className="font-bold text-lg mb-2">Policy Lab</h3>
          <div className="text-4xl font-black text-brand-400 mb-1">DORA</div>
          <div className="text-sm text-muted-foreground uppercase tracking-wider mb-4">Latest Experiment</div>
          <p className="text-xs text-muted-foreground border-t border-border/50 pt-4">
            TREATMENT_WINS (stub agents)<br/><strong className="text-foreground">1</strong> experiment signed
          </p>
        </div>

        <div className="bg-card/80 backdrop-blur border border-border/50 rounded-2xl p-6 hover:shadow-xl transition-shadow">
          <h3 className="font-bold text-lg mb-2 flex items-center gap-2">Anchors <Bitcoin className="w-4 h-4 text-orange-500" /></h3>
          <div className="text-4xl font-black text-brand-400 mb-1">4</div>
          <div className="text-sm text-muted-foreground uppercase tracking-wider mb-4">Bitcoin-Anchored</div>
          <p className="text-xs text-muted-foreground border-t border-border/50 pt-4">
            Latest root <code className="text-orange-400 bg-orange-500/10 px-1 rounded">1848e6be…</code><br/>Pending/Confirmed
          </p>
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-4">King Hive: Real Attestable Verdicts</h2>
      <p className="text-sm text-muted-foreground mb-8">Each verdict is a King/Queen contest with a judge prompt, two model responses, scores, and a winner. Only decisive, parseable verdicts are attested.</p>

      <div className="space-y-4 mb-16">
        {[
          { prompt: "What partnership would unlock the most distribution in the next 90 days?", margin: "A wins, margin 0.065", date: "2026-06-22T16:04:52Z" },
          { prompt: "How do we prove cryptographic provenance of a hive decision to an auditor?", margin: "A wins, margin 0.004", date: "2026-06-22T16:19:55Z" },
          { prompt: "What should the King Hive consider before accepting a verdict?", margin: "B wins, margin 0.0895", date: "2026-06-22T16:34:40Z" },
          { prompt: "What is the best onboarding flow for a non-technical founder using MEOK?", margin: "A wins, margin 0.0575", date: "2026-06-22T20:28:25Z" }
        ].map((v, i) => (
          <div key={i} className="bg-background/50 border border-brand-500/30 rounded-xl p-5 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center hover:bg-brand-500/5 transition-colors group">
            <div className="flex-1">
              <div className="font-semibold text-foreground mb-2">"{v.prompt}"</div>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-brand-400 font-bold bg-brand-500/10 px-2 py-0.5 rounded">{v.margin}</span>
                <span className="text-muted-foreground">King/Dragon vs Queen/Turtle</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0 font-mono">
              <Hash className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 group-hover:text-brand-400 transition-all" />
              {v.date}
            </div>
          </div>
        ))}
      </div>

      <div className="text-center">
        <a href="/assess" className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-brand-500 text-white font-semibold hover:bg-brand-600 transition-colors">
          Get Your Watchdog Cert <ChevronRight className="w-5 h-5" />
        </a>
      </div>
    </div>
  );
}
