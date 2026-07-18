import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Loader2, Mail, Plus, Trash2, Users, Bell, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface NotificationRecipient {
  id: string;
  email: string;
  name: string | null;
  active: boolean;
  created_at: string;
}

export function VisualTestNotificationSettings() {
  const [recipients, setRecipients] = useState<NotificationRecipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const loadRecipients = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('visual_test_notification_recipients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecipients(data || []);
    } catch (error) {
      console.error('Error loading recipients:', error);
      toast({
        title: 'Error',
        description: 'Failed to load notification recipients.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadRecipients();
  }, [loadRecipients]);

  const handleAddRecipient = async () => {
    if (!newEmail.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Email is required.',
        variant: 'destructive'
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail.trim())) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a valid email address.',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('visual_test_notification_recipients')
        .insert({
          email: newEmail.trim().toLowerCase(),
          name: newName.trim() || null,
          active: true,
        });

      if (error) {
        if (error.code === '23505') {
          throw new Error('This email is already registered.');
        }
        throw error;
      }

      toast({
        title: 'Recipient Added',
        description: `${newEmail} will now receive visual test failure notifications.`,
      });

      setNewEmail('');
      setNewName('');
      setDialogOpen(false);
      loadRecipients();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add recipient.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from('visual_test_notification_recipients')
        .update({ active: !currentActive })
        .eq('id', id);

      if (error) throw error;

      setRecipients(prev =>
        prev.map(r => r.id === id ? { ...r, active: !currentActive } : r)
      );

      toast({
        title: 'Updated',
        description: `Notifications ${!currentActive ? 'enabled' : 'disabled'} for this recipient.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update recipient status.',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteRecipient = async (id: string, email: string) => {
    try {
      const { error } = await supabase
        .from('visual_test_notification_recipients')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setRecipients(prev => prev.filter(r => r.id !== id));

      toast({
        title: 'Recipient Removed',
        description: `${email} will no longer receive notifications.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove recipient.',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const activeCount = recipients.filter(r => r.active).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Visual Test Notification Recipients
            </CardTitle>
            <CardDescription className="mt-1">
              Team members who receive email alerts when visual regression tests fail
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Recipient
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Notification Recipient</DialogTitle>
                <DialogDescription>
                  This person will receive email alerts when visual regression tests detect failures.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="team@example.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="name">Name (Optional)</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddRecipient} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Add Recipient
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {recipients.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No notification recipients configured. Add team members to receive alerts when visual tests fail.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="flex items-center gap-4 mb-4">
              <Badge variant="outline" className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {recipients.length} recipient{recipients.length !== 1 ? 's' : ''}
              </Badge>
              <Badge variant={activeCount > 0 ? "default" : "secondary"} className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {activeCount} active
              </Badge>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recipients.map((recipient) => (
                  <TableRow key={recipient.id}>
                    <TableCell className="font-medium">{recipient.email}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {recipient.name || '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={recipient.active}
                          onCheckedChange={() => handleToggleActive(recipient.id, recipient.active)}
                        />
                        <span className={recipient.active ? 'text-green-600' : 'text-muted-foreground'}>
                          {recipient.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(recipient.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteRecipient(recipient.id, recipient.email)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </CardContent>
    </Card>
  );
}
