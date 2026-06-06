import type { Metadata } from 'next';
import ProtocolStatus from '@/components/ProtocolStatus';

export const metadata: Metadata = {
  title: 'Protocols — councilof-ai',
  description: 'Live protocol integration: MCP, A2A, ACP, libp2p, ABCI, and unified API.',
};

export default function ProtocolsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Protocol Nexus</h1>
        <p className="text-muted-foreground max-w-2xl">
          councilof-ai is powered by the CSOAI Protocol Nexus — unified backend exposing
          MCP for tool execution, A2A for agent delegation, ACP for real-time messaging,
          libp2p for peer-to-peer communication, and ABCI for on-chain trust registry.
        </p>
      </div>
      <section>
        <h2 className="text-lg font-semibold mb-4">Protocol Health</h2>
        <ProtocolStatus />
      </section>
    </div>
  );
}
