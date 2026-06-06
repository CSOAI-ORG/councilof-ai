'use client';

import { useEffect, useState } from 'react';
import { fetchProtocolHealth } from '@/lib/csoai';
import { Shield, Network, MessageSquare, Radio, Blocks, Server } from 'lucide-react';

interface ProtocolState {
  status: string;
  protocols: {
    mcp?: { status: string };
    a2a?: { status: string; agents?: string[] };
    acp?: { status: string };
    p2p?: { status: string };
    abci?: { status: string; height?: number; entries?: number };
  };
}

const protocolMeta = [
  { key: 'mcp', label: 'MCP', icon: Server, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  { key: 'a2a', label: 'A2A', icon: MessageSquare, color: 'text-green-400', bg: 'bg-green-400/10' },
  { key: 'acp', label: 'ACP', icon: Network, color: 'text-purple-400', bg: 'bg-purple-400/10' },
  { key: 'p2p', label: 'libp2p', icon: Radio, color: 'text-amber-400', bg: 'bg-amber-400/10' },
  { key: 'abci', label: 'ABCI', icon: Blocks, color: 'text-rose-400', bg: 'bg-rose-400/10' },
];

export default function ProtocolStatus() {
  const [health, setHealth] = useState<ProtocolState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProtocolHealth()
      .then((data: any) => {
        setHealth(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 animate-pulse">
        <div className="h-4 w-32 bg-muted rounded mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6">
        <div className="flex items-center gap-2 text-red-400 text-sm font-medium">
          <Shield className="w-4 h-4" />
          Protocol Nexus Offline
        </div>
        <p className="text-xs text-muted-foreground mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-brand-400" />
          <h3 className="font-semibold text-sm">Protocol Nexus</h3>
        </div>
        <span className="text-xs font-mono text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">
          {health?.status || 'unknown'}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {protocolMeta.map(({ key, label, icon: Icon, color, bg }) => {
          const proto = health?.protocols?.[key as keyof typeof health.protocols];
          const isActive = proto?.status === 'active' || proto?.status === 'standby';
          return (
            <div
              key={key}
              className={`rounded-lg border border-border p-3 flex flex-col items-center gap-2 ${
                isActive ? bg : 'bg-muted/50'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? color : 'text-muted-foreground'}`} />
              <span className="text-xs font-medium">{label}</span>
              <span className={`text-[10px] font-mono uppercase ${isActive ? color : 'text-muted-foreground'}`}>
                {proto?.status || 'offline'}
              </span>
              {key === 'abci' && proto && 'height' in proto && (
                <span className="text-[10px] font-mono text-muted-foreground">
                  H: {(proto as any).height}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
