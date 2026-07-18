import type { Metadata } from 'next';
import { Wrench, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Connect via MCP',
  description: 'Wire FishKeeper.ai into your agent in 30 seconds via Model Context Protocol.',
};

const tools = ['fishkeeper-ai-mcp', 'pet-care-ai-mcp'];

const example = `curl -X POST https://fishkeeper.ai/mcp \\
  -H "Authorization: Bearer ***" \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'`;

export default function ConnectMcpPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <Wrench className="w-12 h-12 text-brand-400 mx-auto mb-4" />
        <h1 className="text-3xl sm:text-4xl font-bold mb-4">Connect FishKeeper via MCP</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Wire FishKeeper.ai into your agent in 30 seconds.
        </p>
      </div>

      <div className="space-y-6">
        <div className="rounded-xl bg-card border border-border p-6">
          <h2 className="text-sm font-mono text-brand-400 uppercase tracking-wider mb-2">Endpoint</h2>
          <code className="text-sm break-all">https://fishkeeper.ai/mcp</code>
        </div>

        <div className="rounded-xl bg-card border border-border p-6">
          <h2 className="text-sm font-mono text-brand-400 uppercase tracking-wider mb-3">Tools ({tools.length})</h2>
          <div className="flex flex-wrap gap-2">
            {tools.map((t) => (
              <span key={t} className="px-3 py-1 rounded-lg bg-brand-500/10 text-brand-400 text-sm font-mono">{t}</span>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-card border border-border p-6">
          <h2 className="text-sm font-mono text-brand-400 uppercase tracking-wider mb-3">Example</h2>
          <pre className="text-xs sm:text-sm overflow-x-auto bg-background rounded-lg p-4 border border-border">
            <code>{example}</code>
          </pre>
        </div>
      </div>

      <div className="text-center mt-12">
        <a href="/pricing" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-brand text-white font-semibold hover:opacity-90 transition-opacity">
          Start at £29/mo
          <ArrowRight className="w-4 h-4" />
        </a>
        <p className="text-muted-foreground text-sm mt-4">
          Or <a href="/signup" className="text-brand-400 hover:text-brand-300">get a free score</a>.
        </p>
      </div>
    </div>
  );
}
