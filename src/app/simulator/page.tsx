"use client";

import { useState } from 'react';
import { Shield, Crosshair, AlertOctagon, CheckCircle2, ChevronRight, Play, Award, Zap, Brain, Hexagon, XCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';

const SCENARIOS = [
  {
    id: 1,
    title: "The CV Screening Agent",
    context: "Your enterprise is deploying an LLM to automatically screen inbound resumes, score candidates 1-10, and reject the bottom 50% without human review.",
    question: "Under the EU AI Act (Annex III), what risk tier does this fall under?",
    options: [
      { text: "Minimal Risk", correct: false, explanation: "Employment sorting is highly regulated." },
      { text: "High Risk (Annex III)", correct: true, explanation: "Biometric identification and employment screening are strictly classified as High Risk." },
      { text: "Unacceptable Risk", correct: false, explanation: "It is not an outright banned practice (like social scoring), but it is High Risk." }
    ]
  },
  {
    id: 2,
    title: "Customer Support Chatbot",
    context: "A generative AI chatbot handling tier-1 customer complaints for an e-commerce store. It has no access to credit data and cannot make hiring decisions.",
    question: "What is the primary Article 50 obligation for this system?",
    options: [
      { text: "Transparency Notification", correct: true, explanation: "Article 50 mandates users must be informed they are interacting with an AI." },
      { text: "CE Marking", correct: false, explanation: "Only High-Risk systems require full CE marking." },
      { text: "Human-in-the-loop", correct: false, explanation: "Not required for basic tier-1 conversational agents." }
    ]
  },
  {
    id: 3,
    title: "Subliminal Manipulation Engine",
    context: "A mobile game uses an AI to subliminally alter audio frequencies to cause users to unknowingly purchase more microtransactions.",
    question: "How does the EU AI Act classify this system?",
    options: [
      { text: "High Risk", correct: false, explanation: "It goes beyond high risk due to the psychological manipulation." },
      { text: "Prohibited (Article 5)", correct: true, explanation: "Subliminal techniques that materially distort behavior are strictly banned." },
      { text: "Unregulated", correct: false, explanation: "Absolutely not." }
    ]
  }
];

export default function SimulatorPage() {
  const [currentScenario, setCurrentScenario] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);

  const scenario = SCENARIOS[currentScenario];
  const isFinished = currentScenario >= SCENARIOS.length;

  const handleSelect = (index: number) => {
    if (showResult) return;
    setSelectedOption(index);
    setShowResult(true);
    if (scenario.options[index].correct) {
      setScore(s => s + 100);
    }
  };

  const nextScenario = () => {
    setSelectedOption(null);
    setShowResult(false);
    setCurrentScenario(c => c + 1);
  };

  const restart = () => {
    setCurrentScenario(0);
    setSelectedOption(null);
    setShowResult(false);
    setScore(0);
  };

  if (isFinished) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="w-24 h-24 bg-brand-500/20 rounded-full flex items-center justify-center mb-6 border border-brand-500/40 shadow-[0_0_50px_-12px_rgba(var(--brand-500),0.5)]">
          <Award className="w-12 h-12 text-brand-400" />
        </div>
        <h1 className="text-4xl font-black text-white mb-4">Simulation Complete</h1>
        <p className="text-slate-400 text-lg mb-2">Final Metrology Score</p>
        <div className="text-6xl font-black text-brand-400 font-mono mb-8">{score}</div>
        
        <div className="flex gap-4">
          <button onClick={restart} className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center gap-2 transition-colors">
            <RefreshCw className="w-5 h-5" /> Play Again
          </button>
          <Link href="/assess" className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold flex items-center gap-2 transition-colors shadow-lg shadow-brand-500/20">
            <Shield className="w-5 h-5" /> Audit Your Real System
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 font-sans py-12 px-4 sm:px-6 lg:px-8 flex flex-col">
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col">
        
        {/* Header HUD */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white leading-tight">Risk Literacy Lab</h1>
              <div className="text-xs text-slate-500 font-mono uppercase tracking-wider">Live Simulation Environment</div>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Scenario</div>
              <div className="font-mono text-lg text-slate-200">{currentScenario + 1} / {SCENARIOS.length}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Score</div>
              <div className="font-mono text-lg text-brand-400">{score}</div>
            </div>
          </div>
        </div>

        {/* Scenario Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden flex-1 flex flex-col">
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
            <Hexagon className="w-64 h-64 text-indigo-500" />
          </div>

          <div className="relative z-10 flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-slate-800 text-slate-300 text-xs font-bold mb-6 font-mono">
              <AlertOctagon className="w-4 h-4 text-amber-500" /> MISSION BRIEFING
            </div>
            
            <h2 className="text-3xl font-black text-white mb-4">{scenario.title}</h2>
            <p className="text-slate-300 text-lg leading-relaxed mb-8 bg-slate-950/50 p-6 rounded-xl border border-slate-800/50">
              {scenario.context}
            </p>
            
            <div className="text-lg font-bold text-indigo-300 mb-6">
              Q: {scenario.question}
            </div>

            <div className="space-y-4">
              {scenario.options.map((option, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrect = option.correct;
                let bgClass = "bg-slate-950 hover:bg-slate-800 border-slate-800";
                
                if (showResult) {
                  if (isSelected && isCorrect) bgClass = "bg-emerald-950/40 border-emerald-500 shadow-[0_0_15px_-3px_rgba(16,185,129,0.2)]";
                  if (isSelected && !isCorrect) bgClass = "bg-red-950/40 border-red-500";
                  if (!isSelected && isCorrect) bgClass = "bg-emerald-950/20 border-emerald-500/50";
                  if (!isSelected && !isCorrect) bgClass = "bg-slate-950 border-slate-800 opacity-50";
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelect(idx)}
                    disabled={showResult}
                    className={`w-full text-left p-5 rounded-2xl border transition-all duration-300 flex items-start gap-4 ${bgClass}`}
                  >
                    <div className="mt-0.5">
                      {showResult && isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : showResult && isSelected && !isCorrect ? (
                        <XCircle className="w-5 h-5 text-red-500" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-slate-700" />
                      )}
                    </div>
                    <div>
                      <div className={`font-bold ${showResult && isCorrect ? 'text-emerald-400' : showResult && isSelected && !isCorrect ? 'text-red-400' : 'text-slate-200'}`}>
                        {option.text}
                      </div>
                      {showResult && (isSelected || isCorrect) && (
                        <div className="text-sm text-slate-400 mt-2 animate-in fade-in slide-in-from-top-2">
                          {option.explanation}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {showResult && (
            <div className="mt-8 pt-6 border-t border-slate-800 flex justify-end animate-in fade-in">
              <button
                onClick={nextScenario}
                className="px-8 py-4 rounded-xl bg-white text-slate-900 font-bold hover:bg-slate-200 transition-colors flex items-center gap-2"
              >
                Proceed to Next Briefing <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
