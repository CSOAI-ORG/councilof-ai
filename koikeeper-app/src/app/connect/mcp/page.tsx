import type { Metadata } from 'next';
import { Plug } from 'lucide-react';
import { vertical } from '@/lib/vertical';

export const metadata: Metadata = {
  title: 'Connect via MCP',
  description: 'Wire KoiKeeper.ai into your agent in 30 seconds via the Model Context Protocol.',
  alternates: { canonical: `${vertical.domain}/connect/mcp` },
};

export default function ConnectMcpPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center gap-2 mb-4">
        <Plug className="w-6 h-6 text-brand-400" />
        <span className="text-xs font-mono text-brand-400 uppercase tracking-wider">MCP</span>
      </div>
      <h1 className="text-3xl md:text-4xl font-bold">Connect KoiKeeper via MCP</h1>
      <p className="mt-4 text-muted-foreground">Wire KoiKeeper.ai into your agent in 30 seconds.</p>

      <h2 className="mt-10 text-xl font-semibold mb-3">Endpoint</h2>
      <pre className="rounded-lg border border-border bg-card p-4 overflow-x-auto">
        <code className="text-sm text-brand-400">https://koikeeper.ai/mcp</code>
      </pre>

      <h2 className="mt-8 text-xl font-semibold mb-3">Tools (2)</h2>
      <ul className="space-y-2">
        <li><code className="text-sm text-brand-400">fishkeeper-ai-mcp</code></li>
        <li><code className="text-sm text-brand-400">k25-vision</code></li>
      </ul>

      <h2 className="mt-8 text-xl font-semibold mb-3">Example</h2>
      <pre className="rounded-lg border border-border bg-card p-4 overflow-x-auto">
        <code className="text-sm text-brand-400">{`curl -X POST https://koikeeper.ai/mcp \\
  -H "Authorization: Bearer ***" \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'`}</code>
      </pre>

      <p className="mt-8 text-muted-foreground">
        <a href="/pricing" className="text-brand-400 hover:text-brand-300">Start at £29/mo</a>
        {' · '}
        <a href="/signup" className="text-brand-400 hover:text-brand-300">free score</a>
      </p>
    </div>
  );
}
