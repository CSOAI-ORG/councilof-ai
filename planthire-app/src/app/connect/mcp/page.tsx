import type { Metadata } from 'next';
import { Plug } from 'lucide-react';
import { vertical } from '@/lib/vertical';

export const metadata: Metadata = {
  title: `Connect via MCP — ${vertical.name}`,
  description: 'Wire PlantHire.ai into your agent in 30 seconds. Pro and Enterprise tiers include MCP access.',
};

const TOOLS = ['planthire-ai-mcp', 'logistics-ai-mcp', 'compliance-checker-ai-mcp'];

export default function ConnectMcpPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center gap-2 mb-4">
        <Plug className="w-6 h-6 text-brand-400" />
        <span className="text-xs font-mono text-brand-400 uppercase tracking-wider">Developers</span>
      </div>
      <h1 className="text-3xl md:text-4xl font-bold mb-4">Connect {vertical.name} via MCP</h1>
      <p className="text-muted-foreground mb-10">
        Wire {vertical.name} into your agent in 30 seconds. Pro and Enterprise tiers include MCP access.
      </p>

      <h2 className="text-xl font-semibold mb-3">Endpoint</h2>
      <pre className="rounded-lg border border-border bg-card p-4 overflow-x-auto text-sm mb-8">
        <code>https://planthire.ai/api/mcp</code>
      </pre>

      <h2 className="text-xl font-semibold mb-3">Tools ({TOOLS.length})</h2>
      <ul className="space-y-2 mb-8">
        {TOOLS.map((t) => (
          <li key={t}>
            <code className="rounded bg-card border border-border px-2 py-1 text-sm">{t}</code>
          </li>
        ))}
      </ul>

      <h2 className="text-xl font-semibold mb-3">Headers</h2>
      <pre className="rounded-lg border border-border bg-card p-4 overflow-x-auto text-sm mb-8">
        <code>{`Authorization: Bearer $MEOK_API_KEY
Content-Type: application/json
Accept: application/json, text/event-stream`}</code>
      </pre>

      <h2 className="text-xl font-semibold mb-3">Example</h2>
      <pre className="rounded-lg border border-border bg-card p-4 overflow-x-auto text-sm mb-10">
        <code>{`curl -X POST https://planthire.ai/api/mcp \\
  -H "Authorization: Bearer $MEOK_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'`}</code>
      </pre>

      <p className="text-muted-foreground">
        <a href="/pricing" className="text-brand-400 hover:underline">Start at £29/mo</a> or{' '}
        <a href="/signup" className="text-brand-400 hover:underline">get a free scorecard</a>.
      </p>
    </div>
  );
}
