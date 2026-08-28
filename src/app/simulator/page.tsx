"use client";

import { useState } from 'react';
import { Shield, Crosshair, AlertOctagon, CheckCircle2, ChevronRight, Play, Award, Zap, Brain } from 'lucide-react';

const SCENARIOS = [
  {
    id: 1,
    title: "The CV Screening Agent",
    context: "Your enterprise is deploying an LLM to automatically screen inbound resumes, score candidates 1-10, and reject the bottom 50% without human review.",
    question: "Under the EU AI Act (Annex III), what risk tier does this fall under?",
    options: [
      { text: "Minimal Risk", correct: false, explanation: "Incorrect. Employment sorting is highly regulated." },
      { text: "High Risk (Annex III)", correct: true, explanation: "Correct! Biometric identification and employment screening are strictly classified as High Risk." },
      { text: "Unacceptable Risk", correct: false, explanation: "Incorrect. It is not an outright banned practice (like social scoring), but it is High Risk." }
    ]
  },
  {
    id: 2,
    title: "Customer Support Chatbot",
    context: "A generative AI chatbot handling tier-1 customer complaints for an e-commerce store. It has no access to credit data and cannot make hiring decisions.",
    question: "What is the primary Article 50 obligation for this system?",
    options: [
      { text: "Transparency (Users must know they are talking to AI)", correct: true, explanation: "Correct! Article 50 mandates users must be informed they are interacting with an AI." },
      { text: "CE Marking & Conformity Assessment", correct: false, explanation: "Incorrect. Only High-Risk systems require CE marking." },
      { text: "Human-in-the-loop for every message", correct: false, explanation: "Incorrect. Not required for basic tier-1 chatbots." }
    ]
  }
];

export default function SimulatorPage() {
  const [currentScenario, setCurrentScenario] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);

  const handleSelect = (index: number) => {
    if (showResult) return;
    setSelectedOption(index);
    setShowResult(true);
    if (SCENARIOS[currentScenario].options[index].correct) {
      setScore(prev => prev + 100);
    }
  };

  const handleNext = () => {
    setSelectedOption(null);
    setShowResult(false);
    if (currentScenario < SCENARIOS.length - 1) {
      setCurrentScenario(prev => prev + 1);
    } else {
      setCurrentScenario(-1); // End of simulator
    }
  };

  const scenario = SCENARIOS[currentScenario];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-[80vh]">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold mb-4">
          <Brain className="w-4 h-4" /> Pillar 6: Gamified Literacy Lab
        </div>
        <h1 className="text-4xl font-black mb-4">AI Risk <span className="text-brand-400">Simulator</span></h1>
        <p className="text-muted-foreground">Train your compliance intuition. Test your reflexes against real EU AI Act deployment scenarios.</p>
      </div>

      {currentScenario >= 0 ? (
        <div className="grid md:grid-cols-[1fr_300px] gap-8">
          {/* Main Game Screen */}
          <div className="bg-card/80 backdrop-blur border border-border/50 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-border/50">
              <div className="h-full bg-brand-500 transition-all duration-500" style={{ width: `${((currentScenario) / SCENARIOS.length) * 100}%` }} />
            </div>

            <div className="flex items-center gap-2 text-sm text-brand-400 font-bold tracking-widest uppercase mb-6">
              <Crosshair className="w-4 h-4" /> Scenario 0{scenario.id}
            </div>

            <h2 className="text-2xl font-bold mb-4">{scenario.title}</h2>
            <div className="p-4 rounded-xl bg-background/50 border border-border/50 text-muted-foreground mb-8 text-sm leading-relaxed">
              {scenario.context}
            </div>

            <h3 className="font-semibold mb-6 text-foreground">{scenario.question}</h3>

            <div className="space-y-3">
              {scenario.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleSelect(i)}
                  disabled={showResult}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-300 flex items-center justify-between ${
                    showResult 
                      ? opt.correct 
                        ? 'bg-green-500/10 border-green-500/50 text-green-400'
                        : selectedOption === i 
                          ? 'bg-red-500/10 border-red-500/50 text-red-400' 
                          : 'bg-background/30 border-border/30 opacity-50'
                      : 'bg-card border-border/50 hover:border-brand-500/50 hover:bg-brand-500/5'
                  }`}
                >
                  <span className="font-medium text-sm">{opt.text}</span>
                  {showResult && opt.correct && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                  {showResult && selectedOption === i && !opt.correct && <AlertOctagon className="w-5 h-5 text-red-500" />}
                </button>
              ))}
            </div>

            {showResult && (
              <div className="mt-8 p-4 rounded-xl bg-background border border-border/50 animate-in fade-in slide-in-from-bottom-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="text-sm">
                  <strong className={scenario.options[selectedOption!].correct ? "text-green-400" : "text-red-400"}>
                    {scenario.options[selectedOption!].correct ? "Target Identified." : "Violation Detected."}
                  </strong>
                  <p className="text-muted-foreground mt-1">{scenario.options[selectedOption!].explanation}</p>
                </div>
                <button 
                  onClick={handleNext}
                  className="shrink-0 px-6 py-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
                >
                  Next Scenario <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Player Stats Panel */}
          <div className="space-y-6">
            <div className="bg-card/80 backdrop-blur border border-border/50 rounded-3xl p-6 shadow-xl">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Player Telemetry</h3>
              <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/30 mb-3">
                <span className="text-sm text-muted-foreground flex items-center gap-2"><Zap className="w-4 h-4 text-amber-400" /> Score</span>
                <span className="font-mono font-bold text-xl">{score}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/30">
                <span className="text-sm text-muted-foreground flex items-center gap-2"><Shield className="w-4 h-4 text-brand-400" /> Status</span>
                <span className="text-xs font-bold text-brand-400 bg-brand-500/10 px-2 py-1 rounded">CADET</span>
              </div>
            </div>
            
            <div className="bg-brand-500/5 border border-brand-500/20 rounded-3xl p-6 text-center">
              <Award className="w-8 h-8 text-brand-400 mx-auto mb-3" />
              <h4 className="font-bold text-sm mb-2">CSOAI Watchdog Certification</h4>
              <p className="text-xs text-muted-foreground mb-4">Pass all 33 scenarios to earn your verifiable on-chain analyst badge.</p>
              <button disabled className="w-full py-2 bg-background border border-border rounded-lg text-xs font-semibold opacity-50">Locked</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto bg-card/80 backdrop-blur border border-border/50 rounded-3xl p-12 shadow-2xl text-center animate-in zoom-in-95">
          <Award className="w-16 h-16 text-brand-400 mx-auto mb-6" />
          <h2 className="text-3xl font-black mb-4">Simulation Complete</h2>
          <p className="text-muted-foreground mb-8">You scored <strong className="text-foreground">{score}</strong> points in the foundational module.</p>
          <div className="flex justify-center gap-4">
            <button onClick={() => { setCurrentScenario(0); setScore(0); }} className="px-6 py-3 bg-background border border-border hover:border-brand-500/50 rounded-xl font-semibold transition-all">
              Restart Sim
            </button>
            <a href="/pricing" className="px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-semibold transition-all flex items-center gap-2">
              Unlock All 33 Modules <Play className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
