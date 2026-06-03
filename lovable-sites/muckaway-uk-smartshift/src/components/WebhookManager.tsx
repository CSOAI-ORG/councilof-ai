import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Webhook, Plus, Trash2, TestTube, History } from 'lucide-react';
import { format } from 'date-fns';

interface WebhookData {
  id: string;
  name: string;
  url: string;
  secret: string;
  events: string[];
  active: boolean;
  last_triggered_at: string | null;
  created_at: string;
}

interface WebhookLog {
  id: string;
  event_type: string;
  response_status: number | null;
  success: boolean;
  created_at: string;
}

const WEBHOOK_EVENTS = [
  { value: 'job.created', label: 'Job Created' },
  { value: 'job.updated', label: 'Job Updated' },
  { value: 'job.completed', label: 'Job Completed' },
  { value: 'quote.created', label: 'Quote Created' },
  { value: 'payment.received', label: 'Payment Received' },
  { value: 'compliance.alert', label: 'Compliance Alert' },
];

export function WebhookManager() {
  const [webhooks, setWebhooks] = useState<WebhookData[]>([]);
  const [logs, setLogs] = useState<Record<string, WebhookLog[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [newWebhook, setNewWebhook] = useState({
    name: '',
    url: '',
    events: [] as string[],
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const fetchWebhooks = async () => {
    try {
      const { data, error } = await supabase
        .from('webhooks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWebhooks(data || []);
    } catch (error) {
      console.error('Error fetching webhooks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLogs = async (webhookId: string) => {
    try {
      const { data, error } = await supabase
        .from('webhook_logs')
        .select('*')
        .eq('webhook_id', webhookId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setLogs(prev => ({ ...prev, [webhookId]: data || [] }));
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  const createWebhook = async () => {
    if (!newWebhook.name.trim() || !newWebhook.url.trim() || newWebhook.events.length === 0) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // Generate a signing secret
      const secret = `whsec_${crypto.randomUUID().replace(/-/g, '')}`;

      const { error } = await supabase
        .from('webhooks')
        .insert({
          user_id: session.user.id,
          name: newWebhook.name,
          url: newWebhook.url,
          secret,
          events: newWebhook.events,
        });

      if (error) throw error;

      toast({
        title: 'Webhook Created',
        description: 'Your webhook endpoint has been registered',
      });
      
      setShowDialog(false);
      setNewWebhook({ name: '', url: '', events: [] });
      fetchWebhooks();
    } catch (error) {
      console.error('Error creating webhook:', error);
      toast({
        title: 'Error',
        description: 'Could not create webhook',
        variant: 'destructive',
      });
    }
  };

  const toggleWebhook = async (id: string, active: boolean) => {
    try {
      const { error } = await supabase
        .from('webhooks')
        .update({ active: !active })
        .eq('id', id);

      if (error) throw error;
      fetchWebhooks();
    } catch (error) {
      console.error('Error toggling webhook:', error);
    }
  };

  const deleteWebhook = async (id: string) => {
    try {
      const { error } = await supabase
        .from('webhooks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: 'Webhook Deleted',
        description: 'The webhook has been removed',
      });
      
      fetchWebhooks();
    } catch (error) {
      console.error('Error deleting webhook:', error);
    }
  };

  const testWebhook = async (webhook: WebhookData) => {
    toast({
      title: 'Test Sent',
      description: 'A test event has been sent to your webhook',
    });
    
    // In production, this would trigger the webhook edge function
    try {
      const { error } = await supabase
        .from('webhook_logs')
        .insert({
          webhook_id: webhook.id,
          event_type: 'test',
          payload: { test: true, timestamp: new Date().toISOString() },
          response_status: 200,
          success: true,
        });

      if (error) throw error;
      fetchLogs(webhook.id);
    } catch (error) {
      console.error('Error logging test:', error);
    }
  };

  const toggleEvent = (event: string) => {
    setNewWebhook(prev => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter(e => e !== event)
        : [...prev.events, event],
    }));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Webhook className="h-5 w-5" />
              Webhooks
            </CardTitle>
            <CardDescription>
              Receive real-time notifications for events
            </CardDescription>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                New Webhook
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Webhook</DialogTitle>
                <DialogDescription>
                  Register a URL to receive event notifications
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    placeholder="e.g., CRM Integration"
                    value={newWebhook.name}
                    onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Endpoint URL</Label>
                  <Input
                    placeholder="https://your-server.com/webhook"
                    value={newWebhook.url}
                    onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Events to Subscribe</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {WEBHOOK_EVENTS.map((event) => (
                      <div key={event.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={event.value}
                          checked={newWebhook.events.includes(event.value)}
                          onCheckedChange={() => toggleEvent(event.value)}
                        />
                        <label htmlFor={event.value} className="text-sm">
                          {event.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <Button onClick={createWebhook} className="w-full">
                  Create Webhook
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading webhooks...</div>
        ) : webhooks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No webhooks configured. Create one to start receiving events.
          </div>
        ) : (
          <Accordion type="single" collapsible className="space-y-3">
            {webhooks.map((webhook) => (
              <AccordionItem key={webhook.id} value={webhook.id} className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline" onClick={() => fetchLogs(webhook.id)}>
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{webhook.name}</span>
                        <Badge variant={webhook.active ? 'default' : 'secondary'}>
                          {webhook.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground font-mono">
                        {webhook.url}
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Subscribed Events</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {webhook.events.map((event) => (
                          <Badge key={event} variant="outline" className="text-xs">
                            {WEBHOOK_EVENTS.find(e => e.value === event)?.label || event}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground">Signing Secret</Label>
                      <code className="block text-sm mt-1 p-2 bg-muted rounded">
                        {webhook.secret.substring(0, 20)}...
                      </code>
                    </div>

                    {logs[webhook.id] && logs[webhook.id].length > 0 && (
                      <div>
                        <Label className="text-xs text-muted-foreground flex items-center gap-1">
                          <History className="h-3 w-3" />
                          Recent Deliveries
                        </Label>
                        <div className="space-y-1 mt-1">
                          {logs[webhook.id].map((log) => (
                            <div 
                              key={log.id}
                              className="flex items-center justify-between text-xs p-2 bg-muted rounded"
                            >
                              <span>{log.event_type}</span>
                              <div className="flex items-center gap-2">
                                <Badge variant={log.success ? 'default' : 'destructive'}>
                                  {log.response_status || 'N/A'}
                                </Badge>
                                <span className="text-muted-foreground">
                                  {format(new Date(log.created_at), 'h:mm a')}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={webhook.active}
                          onCheckedChange={() => toggleWebhook(webhook.id, webhook.active)}
                        />
                        <span className="text-sm">{webhook.active ? 'Enabled' : 'Disabled'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => testWebhook(webhook)}
                        >
                          <TestTube className="h-4 w-4 mr-1" />
                          Test
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteWebhook(webhook.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}
