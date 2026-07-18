import { Wrench } from 'lucide-react';
import { vertical } from '@/lib/vertical';

export default function ToolsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
      <Wrench className="w-12 h-12 text-brand-400 mx-auto mb-4" />
      <h1 className="text-3xl sm:text-4xl font-bold mb-4">{vertical.name} Tools</h1>
      <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
        MCP-powered tools for {vertical.name} are being staged. Subscribe to get early access to the agent catalogue.
      </p>
      <a href="/pricing" className="inline-flex items-center px-6 py-3 rounded-xl gradient-brand text-white font-semibold hover:opacity-90 transition-opacity">
        Get Early Access
      </a>
    </div>
  );
}
