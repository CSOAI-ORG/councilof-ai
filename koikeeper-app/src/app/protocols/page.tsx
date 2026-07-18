import type { Metadata } from 'next';
import ProtocolStatus from '@/components/ProtocolStatus';
import { vertical } from '@/lib/vertical';

export const metadata: Metadata = {
  title: `Protocols — ${vertical.name}`,
  description: 'Live protocol integration powering KoiKeeper.ai: MCP tools, CSOAI governance, and proofof.ai attestation.',
};

export default function ProtocolsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Protocol Nexus</h1>
        <p className="text-muted-foreground max-w-2xl">
          KoiKeeper.ai is powered by the CSOAI Protocol Nexus — exposing
          MCP for koi pond tool execution, CSOAI governance for compliance,
          and proofof.ai for transparent attestation of every recommendation.
        </p>
      </div>
      <section>
        <h2 className="text-lg font-semibold mb-4">Protocol Health</h2>
        <ProtocolStatus />
      </section>
    </div>
  );
}
