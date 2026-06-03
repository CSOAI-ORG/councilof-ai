import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Key, Plus, Copy, Trash2, Eye, EyeOff } from 'lucide-react';
import { format } from 'date-fns';

interface APIKey {
  id: string;
  name: string;
  key_prefix: string;
  permissions: { read: boolean; write: boolean };
  last_used_at: string | null;
  active: boolean;
  created_at: string;
}

export function APIKeyManager() {
  const [keys, setKeys] = useState<APIKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyPermissions, setNewKeyPermissions] = useState({ read: true, write: false });
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setKeys((data || []).map(k => ({
        ...k,
        permissions: k.permissions as { read: boolean; write: boolean }
      })));
    } catch (error) {
      console.error('Error fetching API keys:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateKey = async () => {
    if (!newKeyName.trim()) {
      toast({
        title: 'Name Required',
        description: 'Please provide a name for the API key',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // Generate a secure random key
      const rawKey = `muck_${crypto.randomUUID().replace(/-/g, '')}`;
      const keyPrefix = rawKey.substring(0, 12);
      
      // Hash the key for storage (in production, use proper hashing)
      const keyHash = btoa(rawKey);

      const { error } = await supabase
        .from('api_keys')
        .insert({
          user_id: session.user.id,
          name: newKeyName,
          key_hash: keyHash,
          key_prefix: keyPrefix,
          permissions: newKeyPermissions,
        });

      if (error) throw error;

      setGeneratedKey(rawKey);
      fetchKeys();
      
      toast({
        title: 'API Key Created',
        description: 'Make sure to copy your key now - you won\'t be able to see it again!',
      });
    } catch (error) {
      console.error('Error generating key:', error);
      toast({
        title: 'Error',
        description: 'Could not generate API key',
        variant: 'destructive',
      });
    }
  };

  const copyKey = () => {
    if (generatedKey) {
      navigator.clipboard.writeText(generatedKey);
      toast({
        title: 'Copied',
        description: 'API key copied to clipboard',
      });
    }
  };

  const revokeKey = async (id: string) => {
    try {
      const { error } = await supabase
        .from('api_keys')
        .update({ active: false })
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: 'Key Revoked',
        description: 'The API key has been deactivated',
      });
      
      fetchKeys();
    } catch (error) {
      console.error('Error revoking key:', error);
    }
  };

  const deleteKey = async (id: string) => {
    try {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: 'Key Deleted',
        description: 'The API key has been removed',
      });
      
      fetchKeys();
    } catch (error) {
      console.error('Error deleting key:', error);
    }
  };

  const closeDialog = () => {
    setShowDialog(false);
    setNewKeyName('');
    setNewKeyPermissions({ read: true, write: false });
    setGeneratedKey(null);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              API Keys
            </CardTitle>
            <CardDescription>
              Manage API keys for external integrations
            </CardDescription>
          </div>
          <Dialog open={showDialog} onOpenChange={(open) => open ? setShowDialog(true) : closeDialog()}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                New Key
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create API Key</DialogTitle>
                <DialogDescription>
                  Generate a new API key for accessing the MuckAway API
                </DialogDescription>
              </DialogHeader>
              
              {generatedKey ? (
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-2">Your API Key</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-sm bg-background p-2 rounded break-all">
                        {generatedKey}
                      </code>
                      <Button variant="outline" size="icon" onClick={copyKey}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-destructive mt-2">
                      ⚠️ This is the only time you'll see this key. Copy it now!
                    </p>
                  </div>
                  <Button onClick={closeDialog} className="w-full">Done</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Key Name</Label>
                    <Input
                      placeholder="e.g., Production Integration"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label>Permissions</Label>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="read" className="font-normal">Read Access</Label>
                        <Switch
                          id="read"
                          checked={newKeyPermissions.read}
                          onCheckedChange={(v) => setNewKeyPermissions({ ...newKeyPermissions, read: v })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="write" className="font-normal">Write Access</Label>
                        <Switch
                          id="write"
                          checked={newKeyPermissions.write}
                          onCheckedChange={(v) => setNewKeyPermissions({ ...newKeyPermissions, write: v })}
                        />
                      </div>
                    </div>
                  </div>

                  <Button onClick={generateKey} className="w-full">
                    Generate Key
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading keys...</div>
        ) : keys.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No API keys yet. Create one to get started.
          </div>
        ) : (
          <div className="space-y-3">
            {keys.map((key) => (
              <div
                key={key.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{key.name}</span>
                    <Badge variant={key.active ? 'default' : 'secondary'}>
                      {key.active ? 'Active' : 'Revoked'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <code>{key.key_prefix}...</code>
                    <span>
                      {key.permissions.read && 'Read'}
                      {key.permissions.read && key.permissions.write && ' + '}
                      {key.permissions.write && 'Write'}
                    </span>
                    {key.last_used_at && (
                      <span>Last used: {format(new Date(key.last_used_at), 'MMM d')}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {key.active && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => revokeKey(key.id)}
                    >
                      Revoke
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteKey(key.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
