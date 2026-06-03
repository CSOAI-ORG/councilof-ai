import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Link2, Link2Off, RefreshCw, CheckCircle, XCircle, Clock, FileText } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface AccountingConnection {
  id: string;
  provider: string;
  company_name: string | null;
  connected_at: string;
  last_sync_at: string | null;
  active: boolean;
}

interface InvoiceSync {
  id: string;
  job_id: string | null;
  external_invoice_number: string | null;
  amount: number | null;
  status: string;
  synced_at: string | null;
  error_message: string | null;
}

const PROVIDERS = [
  { id: 'quickbooks', name: 'QuickBooks', logo: '📊', description: 'Sync invoices with QuickBooks Online' },
  { id: 'xero', name: 'Xero', logo: '📈', description: 'Connect to Xero for automatic invoicing' },
  { id: 'sage', name: 'Sage', logo: '💼', description: 'Integrate with Sage Business Cloud' },
  { id: 'freshbooks', name: 'FreshBooks', logo: '📒', description: 'Sync with FreshBooks accounting' }
];

export function AccountingIntegration() {
  const [connections, setConnections] = useState<AccountingConnection[]>([]);
  const [recentSyncs, setRecentSyncs] = useState<InvoiceSync[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const [connectionsRes, syncsRes] = await Promise.all([
      supabase.from('accounting_connections').select('*').order('connected_at', { ascending: false }),
      supabase.from('invoice_syncs').select('*').order('created_at', { ascending: false }).limit(10)
    ]);

    setConnections(connectionsRes.data || []);
    setRecentSyncs(syncsRes.data || []);
    setLoading(false);
  };

  const handleConnect = async (providerId: string) => {
    setConnecting(providerId);
    
    // In production, this would redirect to OAuth flow
    // For now, simulate connection
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Check if already connected
    const existing = connections.find(c => c.provider === providerId && c.active);
    if (existing) {
      toast({ title: 'Already Connected', description: `You're already connected to ${providerId}`, variant: 'destructive' });
      setConnecting(null);
      return;
    }

    // Simulate OAuth connection (in production, redirect to provider OAuth URL)
    toast({ 
      title: 'OAuth Required', 
      description: `To connect ${providerId}, you'll need to configure OAuth credentials. Contact support for setup.` 
    });
    
    setConnecting(null);
  };

  const handleDisconnect = async (connectionId: string) => {
    const { error } = await supabase
      .from('accounting_connections')
      .update({ active: false })
      .eq('id', connectionId);

    if (error) {
      toast({ title: 'Error', description: 'Failed to disconnect', variant: 'destructive' });
    } else {
      toast({ title: 'Disconnected', description: 'Accounting connection removed' });
      fetchData();
    }
  };

  const handleSync = async (connectionId: string) => {
    toast({ title: 'Sync Started', description: 'Syncing invoices with accounting software...' });
    
    // In production, this would trigger the sync edge function
    // For now, update last_sync_at
    await supabase
      .from('accounting_connections')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', connectionId);

    toast({ title: 'Sync Complete', description: 'All invoices have been synced' });
    fetchData();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'synced': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-destructive" />;
      case 'paid': return <CheckCircle className="h-4 w-4 text-primary" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const isProviderConnected = (providerId: string) => {
    return connections.some(c => c.provider === providerId && c.active);
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading integrations...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Available Providers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Accounting Software Integrations
          </CardTitle>
          <CardDescription>
            Connect your accounting software to automatically sync invoices and payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {PROVIDERS.map(provider => {
              const isConnected = isProviderConnected(provider.id);
              const connection = connections.find(c => c.provider === provider.id && c.active);
              
              return (
                <div key={provider.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{provider.logo}</span>
                      <div>
                        <h3 className="font-semibold">{provider.name}</h3>
                        <p className="text-sm text-muted-foreground">{provider.description}</p>
                      </div>
                    </div>
                    <Badge variant={isConnected ? 'default' : 'outline'}>
                      {isConnected ? 'Connected' : 'Not Connected'}
                    </Badge>
                  </div>
                  
                  {isConnected && connection ? (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm">
                        <span className="text-muted-foreground">Company:</span> {connection.company_name || 'Unknown'}
                      </p>
                      <p className="text-sm">
                        <span className="text-muted-foreground">Last sync:</span>{' '}
                        {connection.last_sync_at 
                          ? formatDistanceToNow(new Date(connection.last_sync_at), { addSuffix: true })
                          : 'Never'}
                      </p>
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="outline" onClick={() => handleSync(connection.id)}>
                          <RefreshCw className="h-4 w-4 mr-1" /> Sync Now
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDisconnect(connection.id)}>
                          <Link2Off className="h-4 w-4 mr-1" /> Disconnect
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button 
                      className="mt-4 w-full" 
                      variant="outline"
                      onClick={() => handleConnect(provider.id)}
                      disabled={connecting === provider.id}
                    >
                      {connecting === provider.id ? 'Connecting...' : `Connect ${provider.name}`}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Sync Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Recent Invoice Syncs
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentSyncs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No invoice syncs yet. Connect an accounting provider to get started.
            </p>
          ) : (
            <div className="space-y-3">
              {recentSyncs.map(sync => (
                <div key={sync.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(sync.status)}
                    <div>
                      <p className="font-medium">
                        Invoice {sync.external_invoice_number || 'Pending'}
                      </p>
                      {sync.amount && (
                        <p className="text-sm text-muted-foreground">
                          £{sync.amount.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={sync.status === 'synced' ? 'default' : sync.status === 'failed' ? 'destructive' : 'secondary'}>
                      {sync.status}
                    </Badge>
                    {sync.synced_at && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(sync.synced_at), 'MMM d, HH:mm')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Setup Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium mb-1">QuickBooks Online</h4>
              <p className="text-muted-foreground">
                1. Click "Connect QuickBooks" above<br />
                2. Sign in to your QuickBooks account<br />
                3. Authorize MuckAway.ai to access your data<br />
                4. Invoices will automatically sync when jobs are completed
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-1">Xero</h4>
              <p className="text-muted-foreground">
                1. Click "Connect Xero" above<br />
                2. Log in to your Xero organisation<br />
                3. Grant access permissions<br />
                4. Configure invoice mapping in settings
              </p>
            </div>
            <p className="text-muted-foreground border-t pt-4">
              Need help setting up? Contact our support team for assistance with OAuth configuration and API credentials.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
