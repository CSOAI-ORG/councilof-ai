"use client";

import { useAuth } from '../context/AuthContext';
import { Shield, Key, FileText, CheckCircle2, Copy, Trash2, Cpu, BarChart3 } from 'lucide-react';
import { useState } from 'react';

export default function DashboardPage() {
  const { user, generateApiKey, revokeApiKey, logout } = useAuth();
  const [copied, setCopied] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Shield className="w-12 h-12 text-brand-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">Please sign in to view your dashboard.</p>
        </div>
      </div>
    );
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Enterprise Command Center</h1>
          <p className="text-muted-foreground mt-1">Manage your subscriptions, keys, and evaluation runs.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm">
            Signed in as <span className="font-semibold">{user.email}</span>
          </div>
          <button onClick={logout} className="text-sm text-red-400 hover:text-red-300">
            Sign out
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="p-6 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-md shadow-sm hover:shadow-md hover:border-brand-500/30 transition-all">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Active Plan</h3>
            <Shield className={`w-5 h-5 ${user.tier === 'pro' || user.tier === 'enterprise' ? 'text-green-500' : 'text-muted-foreground'}`} />
          </div>
          <div className="text-3xl font-bold mb-2 capitalize">{user.tier}</div>
          {user.tier === 'free' ? (
            <a href="/pricing" className="text-sm text-brand-400 hover:underline">Upgrade to Pro &rarr;</a>
          ) : (
            <div className="text-sm text-green-500 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Active & Verified
            </div>
          )}
        </div>

        <div className="p-6 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-md shadow-sm hover:shadow-md hover:border-brand-500/30 transition-all">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">API Requests</h3>
            <BarChart3 className="w-5 h-5 text-brand-400" />
          </div>
          <div className="text-3xl font-bold mb-2">
            {user.tier === 'free' ? '0 / 100' : '14,239 / ∞'}
          </div>
          <div className="text-sm text-muted-foreground">Requests this billing cycle</div>
        </div>

        <div className="p-6 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-md shadow-sm hover:shadow-md hover:border-brand-500/30 transition-all">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Evaluations</h3>
            <Cpu className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-3xl font-bold mb-2">0</div>
          <div className="text-sm text-muted-foreground">Models verified</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* API Keys */}
        <div className="border border-border/50 rounded-2xl bg-card/50 backdrop-blur-md shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg flex items-center gap-2"><Key className="w-4 h-4" /> Production API Keys</h3>
              <p className="text-sm text-muted-foreground mt-1">Use these to authenticate with the CSOAI SDKs.</p>
            </div>
            <button 
              onClick={generateApiKey}
              disabled={user.tier === 'free'}
              className="px-4 py-2 text-sm bg-brand-500 hover:bg-brand-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Generate New Key
            </button>
          </div>
          
          <div className="p-0">
            {user.tier === 'free' && (
              <div className="p-6 text-center border-b border-border bg-brand-500/5">
                <p className="text-sm text-brand-400 mb-2">API access requires a Pro subscription.</p>
                <a href="/pricing" className="text-sm font-semibold hover:underline">Upgrade Now</a>
              </div>
            )}
            
            {user.apiKeys.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                No active API keys found.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="px-6 py-3 font-medium">Key</th>
                    <th className="px-6 py-3 font-medium">Created</th>
                    <th className="px-6 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {user.apiKeys.map(key => (
                    <tr key={key.id}>
                      <td className="px-6 py-4 font-mono text-xs text-brand-300">
                        {key.key.substring(0, 15)}...
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {new Date(key.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right flex justify-end gap-2">
                        <button 
                          onClick={() => copyToClipboard(key.key)}
                          className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
                          title="Copy full key"
                        >
                          {copied === key.key ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                        <button 
                          onClick={() => revokeApiKey(key.id)}
                          className="p-1.5 hover:bg-red-500/20 rounded text-red-400"
                          title="Revoke key"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Evaluation History */}
        <div className="border border-border/50 rounded-2xl bg-card/50 backdrop-blur-md shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border">
            <h3 className="font-bold text-lg flex items-center gap-2"><FileText className="w-4 h-4" /> Compliance Runs</h3>
            <p className="text-sm text-muted-foreground mt-1">Recent model evaluations and generated certificates.</p>
          </div>
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <h4 className="font-medium mb-1">No evaluations yet</h4>
            <p className="text-sm text-muted-foreground mb-4">Run your first model through the 22-axis framework.</p>
            <a href="/evaluate" className="inline-flex px-4 py-2 text-sm border border-border hover:border-brand-500/50 rounded-lg transition-colors">
              Start Evaluation
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
