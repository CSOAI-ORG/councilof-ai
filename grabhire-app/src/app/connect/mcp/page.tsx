import type { Metadata } from 'next';
import { Plug, ArrowRight } from 'lucide-react';
import { vertical } from '@/lib/vertical';

export const metadata: Metadata = {
  title: 'Connect via MCP',
  description: `Wire ${vertical.name} into your agent in 30 seconds. Pro and Enterprise tiers include MCP access.`,
};

const tools = [
  'recruitment-ai-mcp',
  'resume-parser-ai-mcp',
  'compliance-checker-ai-mcp',
  'logistics-ai-mcp',
];

const curlExample = `curl -X POST https://grabhire.ai/mcp \\
  -H "Authorization: Bearer $MEOK_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"tool":"compliance-checker-ai-mcp","input":{}}'`;

export default function ConnectMcpPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 text-brand-400 text-xs font-medium mb-4">
          <Plug className="w-3 h-3" />
          Model Context Protocol
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold">Connect {vertical.name} via MCP</h1>
        <p className="mt-4 text-muted-foreground">
          Wire {vertical.name} into your agent in 30 seconds. Pro and Enterprise tiers include MCP access.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Endpoint</h2>
        <pre className="rounded-xl bg-card border border-border p-4 overflow-x-auto text-sm">
          <code>https://grabhire.ai/mcp</code>
        </pre>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Tools ({tools.length})</h2>
        <ul className="grid sm:grid-cols-2 gap-2">
          {tools.map((t) => (
            <li key={t} className="rounded-lg bg-card border border-border px-4 py-2 font-mono text-sm">
              {t}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Headers</h2>
        <pre className="rounded-xl bg-card border border-border p-4 overflow-x-auto text-sm">
          <code>{'Authorization: Bearer $MEOK_API_KEY\nContent-Type: application/json'}</code>
        </pre>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Example</h2>
        <pre className="rounded-xl bg-card border border-border p-4 overflow-x-auto text-sm">
          <code>{curlExample}</code>
        </pre>
      </section>

      <p className="text-muted-foreground">
        <a href="/pricing" className="inline-flex items-center gap-1 text-brand-400 hover:text-brand-300">
          Start at £29/mo <ArrowRight className="w-3 h-3" />
        </a>{' '}
        or{' '}
        <a href="/signup?plan=free" className="text-brand-400 hover:text-brand-300">
          get a free scorecard
        </a>
        .
      </p>
    </div>
  );
}
