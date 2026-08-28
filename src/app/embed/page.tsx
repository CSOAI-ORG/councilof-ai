"use client";

import { Shield, Code, Copy, CheckCircle2, Zap } from "lucide-react";
import { useState } from "react";
import Link from 'next/link';

export default function EmbedPage() {
  const [copied, setCopied] = useState(false);
  const snippet = `<script src="https://councilof.ai/widget.js"></script>\n<csoai-badge model="llama-3.1" theme="light"></csoai-badge>`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="min-h-screen bg-background">
      <section className="bg-[#04120c] text-white pt-24 pb-20 px-4 sm:px-6 lg:px-8 border-b border-border">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-emerald-300 mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>Enterprise Integrations
          </span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-6 font-heading">
            Embed & White-label Kit
          </h1>
          <p className="text-lg text-emerald-100/80 mb-8 max-w-2xl mx-auto">
            Embed cryptographic proof directly on your own product pages. Let your customers verify your AI's compliance status without leaving your site.
          </p>
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h3 className="text-2xl font-bold mb-4">The Live Badge</h3>
            <p className="text-muted-foreground mb-6">
              Our embeddable web component automatically fetches your latest signed measurement card and re-verifies the Ed25519 signature directly in the visitor's browser. It only turns green if the bytes are true.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-sm">Zero dependencies. Just one script tag.</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-sm">Fully customizable to match your brand colors.</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-sm">Cryptographically secure verification.</p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg">
            <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono text-emerald-400">Installation Snippet</span>
              </div>
              <button 
                onClick={copyToClipboard}
                className="text-slate-400 hover:text-white transition-colors flex items-center gap-1 text-xs"
              >
                {copied ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="p-6">
              <pre className="text-sm font-mono text-slate-800 bg-slate-50 p-4 rounded-lg overflow-x-auto border border-slate-200">
                <code>{snippet}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
