import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/providers/trpc';
import {
  Database,
  Activity,
  Key,
  FileText,
  Shield,
  TrendingUp,
  ArrowLeft,
  Server,
  Zap,
  Globe,
  Lock,
  Loader2,
} from 'lucide-react';
import { useState } from 'react';

const categoryIcons: Record<string, typeof Shield> = {
  governance: Shield,
  healthcare: FileText,
  financial: TrendingUp,
  cross_domain: Globe,
};

const categoryColors: Record<string, string> = {
  governance: '#007888',
  healthcare: '#00bca8',
  financial: '#8899aa',
  cross_domain: '#a0b0c0',
};

export default function Dashboard() {
  const { user } = useAuth();
  const [creatingKey, setCreatingKey] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');

  const { data: datasets, isLoading: datasetsLoading } = trpc.data.listDatasets.useQuery({});
  const { data: subscription } = trpc.data.getSubscription.useQuery();
  const { data: apiKeysList, refetch: refetchKeys } = trpc.data.listApiKeys.useQuery();
  const { data: usageStats } = trpc.data.getUsageStats.useQuery();
  const createKey = trpc.data.createApiKey.useMutation({
    onSuccess: () => {
      setCreatingKey(false);
      setNewKeyName('');
      refetchKeys();
    },
  });

  const tier = subscription?.tier || 'free';
  const tierColor = tier === 'enterprise' ? '#00bca8' : tier === 'pro' ? '#007888' : '#718096';
  const requestsUsed = subscription?.requestsUsed || 0;
  const requestsLimit = subscription?.requestsLimit || 100;
  const progressPct = Math.min((requestsUsed / requestsLimit) * 100, 100);

  const stats = [
    { label: 'API Requests Today', value: String(usageStats?.todayRequests || 0), limit: String(requestsLimit), progress: progressPct, icon: Activity },
    { label: 'Datasets Available', value: String(datasets?.length || 0), limit: '10+', progress: 0, icon: Database },
    { label: 'API Keys', value: String(apiKeysList?.length || 0), limit: '10 max', progress: 0, icon: Key },
    { label: 'Uptime', value: '99.97%', limit: 'SLA 99.9%', progress: 99, icon: Server },
  ];

  return (
    <div className="min-h-screen bg-[#0a141e]">
      {/* Top bar */}
      <div className="bg-[#0f1923] border-b border-[#00788820]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="sm" className="text-[#718096] hover:text-[#00bca8]">
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back
                </Button>
              </Link>
              <div className="h-6 w-px bg-[#00788830]" />
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-[#00bca8]" />
                <span className="text-sm font-semibold text-[#e2e8f0]">MEOK DATA Dashboard</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" style={{ borderColor: tierColor + '60', color: tierColor, backgroundColor: tierColor + '10' }}>
                <Zap className="h-3 w-3 mr-1" /> {tier.charAt(0).toUpperCase() + tier.slice(1)} Plan
              </Badge>
              <div className="text-sm text-[#a0b0c0]">{user?.name || 'Developer'}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <Card key={stat.label} className="bg-[#1a2a3a] border-[#00788820]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <stat.icon className="h-4 w-4 text-[#00bca8]" />
                  <span className="text-xs text-[#718096]">{stat.limit}</span>
                </div>
                <div className="text-2xl font-bold text-[#e2e8f0] mb-1">{stat.value}</div>
                <div className="text-xs text-[#718096] mb-2">{stat.label}</div>
                {stat.progress > 0 && (
                  <Progress value={stat.progress} className="h-1 bg-[#00788820]" />
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Datasets */}
          <div className="lg:col-span-2">
            <Card className="bg-[#1a2a3a] border-[#00788820]">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[#e2e8f0] text-base flex items-center gap-2">
                    <Database className="h-4 w-4 text-[#00bca8]" /> Available Datasets
                  </CardTitle>
                  <Badge variant="outline" className="border-[#00788830] text-[#718096] text-xs">
                    {datasets?.length || 0} datasets
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {datasetsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 text-[#00bca8] animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {datasets?.map((ds) => {
                      const Icon = categoryIcons[ds.category] || Database;
                      const color = categoryColors[ds.category] || '#718096';
                      return (
                        <div
                          key={ds.id}
                          className="flex items-center justify-between p-3 rounded-md bg-[#0f1923] hover:bg-[#0f192380] transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-1.5 rounded" style={{ backgroundColor: color + '15' }}>
                              <Icon className="h-3.5 w-3.5" style={{ color }} />
                            </div>
                            <div>
                              <div className="text-sm text-[#e2e8f0]">{ds.name}</div>
                              <div className="text-xs text-[#718096]">{(ds.recordCount || 0).toLocaleString()} records</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-[#718096]">{ds.sourceMcp}</span>
                            <Badge className={`text-xs ${
                              ds.status === 'live'
                                ? 'bg-[#00bca820] text-[#00bca8] border-[#00bca840]'
                                : 'bg-[#00788820] text-[#007888] border-[#00788840]'
                            }`}>
                              {ds.status}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* API Keys */}
            <Card className="bg-[#1a2a3a] border-[#00788820]">
              <CardHeader className="pb-3">
                <CardTitle className="text-[#e2e8f0] text-base flex items-center gap-2">
                  <Key className="h-4 w-4 text-[#00bca8]" /> API Keys
                </CardTitle>
              </CardHeader>
              <CardContent>
                {apiKeysList && apiKeysList.length > 0 ? (
                  <div className="space-y-2 mb-3">
                    {apiKeysList.map((key) => (
                      <div key={key.id} className="flex items-center justify-between p-2 rounded bg-[#0f1923] border border-[#00788820]">
                        <div>
                          <div className="text-xs text-[#e2e8f0]">{key.name}</div>
                          <div className="text-xs text-[#718096]">{key.keyPrefix}••••</div>
                        </div>
                        <Badge className={`text-xs ${key.isActive === 'yes'
                          ? 'bg-[#00bca820] text-[#00bca8]'
                          : 'bg-[#4a556820] text-[#4a5568]'
                          }`}>
                          {key.isActive === 'yes' ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-sm text-[#718096] mb-3">
                    No API keys yet
                  </div>
                )}

                {creatingKey ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder="Key name"
                      className="w-full px-3 py-2 rounded bg-[#0f1923] border border-[#00788830] text-sm text-[#e2e8f0] placeholder-[#4a5568] focus:outline-none focus:border-[#00bca8]"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-[#00bca8] text-[#0f1923] hover:bg-[#00d4be]"
                        onClick={() => createKey.mutate({ name: newKeyName || 'Production' })}
                        disabled={createKey.isPending}
                      >
                        {createKey.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Create'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-[#00788830] text-[#718096]"
                        onClick={() => { setCreatingKey(false); setNewKeyName(''); }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-[#00788830] text-[#a0b0c0] hover:text-[#00bca8]"
                    onClick={() => setCreatingKey(true)}
                  >
                    Create Key
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="bg-[#1a2a3a] border-[#00788820]">
              <CardHeader className="pb-3">
                <CardTitle className="text-[#e2e8f0] text-base flex items-center gap-2">
                  <Globe className="h-4 w-4 text-[#00bca8]" /> Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {usageStats && usageStats.recentRequests.length > 0 ? (
                  <div className="space-y-3">
                    {usageStats.recentRequests.slice(0, 5).map((req, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="mt-1 w-1.5 h-1.5 rounded-full bg-[#007888]" />
                        <div>
                          <div className="text-xs text-[#a0b0c0]">{req.endpoint}</div>
                          <div className="text-xs text-[#718096]">
                            {req.statusCode} | {req.recordsReturned} records | {req.responseTimeMs}ms
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-sm text-[#718096]">
                    No activity yet. Make your first API call!
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upgrade CTA */}
            {tier !== 'enterprise' && (
              <div className="p-4 rounded-lg bg-gradient-to-br from-[#00788820] to-[#00bca810] border border-[#00788830]">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="h-4 w-4 text-[#00bca8]" />
                  <span className="text-sm font-semibold text-[#e2e8f0]">
                    {tier === 'free' ? 'Upgrade to Pro' : 'Go Enterprise'}
                  </span>
                </div>
                <p className="text-xs text-[#8899aa] mb-3">
                  {tier === 'free'
                    ? 'Unlock real-time feeds, 10K daily requests, and signed exports.'
                    : 'Get unlimited requests, custom pipelines, and white-label licensing.'}
                </p>
                <Button size="sm" className="w-full bg-[#00bca8] text-[#0f1923] hover:bg-[#00d4be]">
                  {tier === 'free' ? 'Upgrade to Pro' : 'Contact Sales'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
