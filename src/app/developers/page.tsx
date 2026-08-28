"use client";

import { useAuth } from '../context/AuthContext';
import { Terminal, Copy, CheckCircle2, BookOpen, Download, Server, Shield } from 'lucide-react';
import { useState } from 'react';

export default function DevelopersPage() {
  const { user } = useAuth();
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const activeKey = user?.apiKeys[0]?.key || 'csoai_live_YOUR_API_KEY_HERE';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-4xl font-bold mb-4">
            Developer <span className="text-brand-400">SDKs</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Integrate verifiable AI governance directly into your application. Authenticate using your Pro API key to fetch measurement cards and run statutory checks.
          </p>
        </div>
        <div className="hidden md:flex gap-4">
          <a href="https://github.com/CSOAI-ORG" target="_blank" rel="noopener noreferrer" className="px-4 py-2 border border-border hover:border-brand-500/50 rounded-lg flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
            GitHub
          </a>
        </div>
      </div>

      {!user || user.tier === 'free' ? (
        <div className="mb-12 p-6 bg-brand-500/10 border border-brand-500/20 rounded-xl flex items-center justify-between">
          <div>
            <h3 className="font-bold mb-1">API Access Restricted</h3>
            <p className="text-sm text-brand-400">You must be on a Pro or Enterprise plan to use live API keys.</p>
          </div>
          <a href="/pricing" className="px-6 py-2 bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600 transition-colors">
            Upgrade Now
          </a>
        </div>
      ) : null}

      <div className="grid md:grid-cols-2 gap-8 mb-16">
        {/* Python SDK */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-6 border-b border-border flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#3776AB]/10 flex items-center justify-center">
              <span className="text-xl font-bold text-[#3776AB]">Py</span>
            </div>
            <div>
              <h3 className="font-bold text-lg">csoai Python SDK</h3>
              <p className="text-sm text-muted-foreground">For backend compliance automation.</p>
            </div>
          </div>
          <div className="p-6 bg-[#0d1117]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground font-mono">Installation</span>
              <button onClick={() => copyToClipboard('pip install csoai', 'py-install')} className="text-muted-foreground hover:text-white">
                {copied === 'py-install' ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <pre className="text-sm font-mono text-green-400 mb-6 bg-black p-3 rounded">
              $ pip install csoai
            </pre>

            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground font-mono">Usage</span>
              <button onClick={() => copyToClipboard(`import csoai\n\nclient = csoai.Client(api_key="${activeKey}")\n\n# Run statutory check\nresult = client.evaluate.run("meta-llama/Llama-3")\nprint(result.compliance_score)`, 'py-usage')} className="text-muted-foreground hover:text-white">
                {copied === 'py-usage' ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <pre className="text-sm font-mono text-gray-300 bg-black p-4 rounded overflow-x-auto">
              <span className="text-purple-400">import</span> csoai{'\n\n'}
              client = csoai.Client(api_key=<span className="text-green-300">"{activeKey}"</span>){'\n\n'}
              <span className="text-muted-foreground"># Run statutory check against 22 axes</span>{'\n'}
              result = client.evaluate.run(<span className="text-green-300">"meta-llama/Llama-3-70b-instruct"</span>){'\n'}
              <span className="text-purple-400">print</span>(result.compliance_score)
            </pre>
          </div>
        </div>

        {/* Node.js SDK */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-6 border-b border-border flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#339933]/10 flex items-center justify-center">
              <span className="text-xl font-bold text-[#339933]">JS</span>
            </div>
            <div>
              <h3 className="font-bold text-lg">@meok-labs/ai-sdk</h3>
              <p className="text-sm text-muted-foreground">For Next.js / Node.js web applications.</p>
            </div>
          </div>
          <div className="p-6 bg-[#0d1117]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground font-mono">Installation</span>
              <button onClick={() => copyToClipboard('npm install @meok-labs/ai-sdk', 'js-install')} className="text-muted-foreground hover:text-white">
                {copied === 'js-install' ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <pre className="text-sm font-mono text-green-400 mb-6 bg-black p-3 rounded">
              $ npm install @meok-labs/ai-sdk
            </pre>

            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground font-mono">Usage</span>
              <button onClick={() => copyToClipboard(`import { CSOAI } from '@meok-labs/ai-sdk';\n\nconst client = new CSOAI({ apiKey: "${activeKey}" });\n\nconst verify = await client.verifyReceipt(signature);\nconsole.log(verify.isValid);`, 'js-usage')} className="text-muted-foreground hover:text-white">
                {copied === 'js-usage' ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <pre className="text-sm font-mono text-gray-300 bg-black p-4 rounded overflow-x-auto">
              <span className="text-purple-400">import</span> {'{ CSOAI }'} <span className="text-purple-400">from</span> <span className="text-green-300">'@meok-labs/ai-sdk'</span>;{'\n\n'}
              <span className="text-blue-400">const</span> client = <span className="text-blue-400">new</span> CSOAI({'{'} apiKey: <span className="text-green-300">"{activeKey}"</span> {'}'});{'\n\n'}
              <span className="text-muted-foreground">// Cryptographically verify a measurement card</span>{'\n'}
              <span className="text-blue-400">const</span> verify = <span className="text-purple-400">await</span> client.verifyReceipt(signature);{'\n'}
              console.log(verify.isValid);
            </pre>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <a href="/api/gspc" className="p-6 rounded-xl border border-border bg-card hover:border-brand-500/50 transition-colors group">
          <Server className="w-8 h-8 text-brand-400 mb-4 group-hover:scale-110 transition-transform" />
          <h3 className="font-bold text-lg mb-2">REST API Reference</h3>
          <p className="text-sm text-muted-foreground">Raw JSON endpoints for the GSPC canonical board and live estate state.</p>
        </a>
        <a href="https://pypi.org/project/proofof-ai-mcp/" target="_blank" className="p-6 rounded-xl border border-border bg-card hover:border-brand-500/50 transition-colors group">
          <Terminal className="w-8 h-8 text-purple-400 mb-4 group-hover:scale-110 transition-transform" />
          <h3 className="font-bold text-lg mb-2">FastMCP Mesh</h3>
          <p className="text-sm text-muted-foreground">Integrate Council OS logic directly into Claude Desktop or Cursor.</p>
        </a>
        <a href="/verify" className="p-6 rounded-xl border border-border bg-card hover:border-brand-500/50 transition-colors group">
          <Shield className="w-8 h-8 text-green-500 mb-4 group-hover:scale-110 transition-transform" />
          <h3 className="font-bold text-lg mb-2">WebCrypto Verifier</h3>
          <p className="text-sm text-muted-foreground">Client-side offline verification of Ed25519 payload signatures.</p>
        </a>
      </div>
    </div>
  );
}
