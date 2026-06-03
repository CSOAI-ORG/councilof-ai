import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { IntegrationCard } from '@/components/IntegrationCard';
import { SmartCSVImporter } from '@/components/SmartCSVImporter';
import { 
  integrationProviders, 
  categoryLabels,
  categoryIcons 
} from '@/config/integrationProviders';
import { 
  Upload, 
  Link2, 
  Activity, 
  Check, 
  Clock, 
  AlertCircle,
  RefreshCw,
  Plus,
  Settings,
  FileSpreadsheet,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';

interface ConnectedIntegration {
  providerId: string;
  status: 'connected' | 'syncing' | 'error';
  lastSync: string;
  recordsSynced: number;
}

export function IntegrationHub() {
  const [connectedIntegrations, setConnectedIntegrations] = useState<ConnectedIntegration[]>([
    // Demo connected integrations
    // { providerId: 'xero', status: 'connected', lastSync: '2 minutes ago', recordsSynced: 1247 },
  ]);
  const [activeTab, setActiveTab] = useState('overview');
  const [showImporter, setShowImporter] = useState(false);

  const connectedCount = connectedIntegrations.length;
  const syncStatus = connectedIntegrations.some(i => i.status === 'error') 
    ? 'error' 
    : connectedIntegrations.some(i => i.status === 'syncing') 
      ? 'syncing' 
      : 'ok';

  const handleConnect = (providerId: string) => {
    toast.info(`Connecting to ${providerId}...`, {
      description: 'OAuth flow would start here in production'
    });
    // In production, this would initiate OAuth flow
  };

  const handleDisconnect = (providerId: string) => {
    setConnectedIntegrations(prev => prev.filter(i => i.providerId !== providerId));
    toast.success('Integration disconnected');
  };

  const handleForceSync = (providerId: string) => {
    toast.success('Sync started', {
      description: 'Data will be synced shortly'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Connected Apps</p>
                <p className="text-3xl font-bold">{connectedCount}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Link2 className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sync Status</p>
                <div className="flex items-center gap-2">
                  {syncStatus === 'ok' && connectedCount > 0 && (
                    <>
                      <Check className="w-5 h-5 text-green-500" />
                      <span className="text-lg font-semibold text-green-500">All Synced</span>
                    </>
                  )}
                  {syncStatus === 'syncing' && (
                    <>
                      <RefreshCw className="w-5 h-5 text-primary animate-spin" />
                      <span className="text-lg font-semibold text-primary">Syncing...</span>
                    </>
                  )}
                  {syncStatus === 'error' && (
                    <>
                      <AlertCircle className="w-5 h-5 text-destructive" />
                      <span className="text-lg font-semibold text-destructive">Errors</span>
                    </>
                  )}
                  {connectedCount === 0 && (
                    <span className="text-lg font-semibold text-muted-foreground">Not Configured</span>
                  )}
                </div>
              </div>
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Activity className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">API Usage</p>
                <p className="text-3xl font-bold">0<span className="text-lg text-muted-foreground">/1000</span></p>
              </div>
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Zap className="w-6 h-6" />
              </div>
            </div>
            <Progress value={0} className="mt-2 h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card 
          className="cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => setShowImporter(true)}
        >
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Upload className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold">Import Data</p>
              <p className="text-sm text-muted-foreground">From CSV or Excel</p>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => setActiveTab('browse')}
        >
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Plus className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold">Add Integration</p>
              <p className="text-sm text-muted-foreground">Connect Apps</p>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => setActiveTab('activity')}
        >
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="font-semibold">View Sync Log</p>
              <p className="text-sm text-muted-foreground">Recent Activity</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CSV Importer Modal */}
      {showImporter && (
        <SmartCSVImporter onClose={() => setShowImporter(false)} />
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Connected Apps</TabsTrigger>
          <TabsTrigger value="browse">Browse Integrations</TabsTrigger>
          <TabsTrigger value="activity">Sync Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          {connectedIntegrations.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Link2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Integrations Connected</h3>
                <p className="text-muted-foreground mb-6">
                  Connect your first app to start syncing data automatically
                </p>
                <Button onClick={() => setActiveTab('browse')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Integration
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {connectedIntegrations.map((integration) => {
                const provider = integrationProviders.find(p => p.id === integration.providerId);
                if (!provider) return null;
                
                return (
                  <IntegrationCard
                    key={integration.providerId}
                    provider={provider}
                    isConnected
                    lastSync={integration.lastSync}
                    variant="dashboard"
                    onDisconnect={() => handleDisconnect(integration.providerId)}
                    onSettings={() => toast.info('Settings panel coming soon')}
                  />
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="browse" className="mt-6">
          <div className="space-y-6">
            {Object.entries(categoryLabels).map(([categoryKey, categoryLabel]) => {
              const categoryProviders = integrationProviders.filter(
                p => p.category === categoryKey && 
                !connectedIntegrations.some(c => c.providerId === p.id)
              );
              
              if (categoryProviders.length === 0) return null;

              return (
                <div key={categoryKey}>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span>{categoryIcons[categoryKey]}</span>
                    {categoryLabel}
                  </h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoryProviders.map((provider) => (
                      <IntegrationCard
                        key={provider.id}
                        provider={provider}
                        variant="dashboard"
                        onConnect={() => handleConnect(provider.id)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Sync Activity Log</CardTitle>
              <CardDescription>Recent data synchronization events</CardDescription>
            </CardHeader>
            <CardContent>
              {connectedIntegrations.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No sync activity yet. Connect an integration to get started.
                </p>
              ) : (
                <div className="space-y-4">
                  {/* Demo activity log entries */}
                  <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                    <Check className="w-5 h-5 text-green-500" />
                    <div className="flex-1">
                      <p className="font-medium">Xero sync completed</p>
                      <p className="text-sm text-muted-foreground">47 invoices synced</p>
                    </div>
                    <span className="text-sm text-muted-foreground">2 min ago</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
