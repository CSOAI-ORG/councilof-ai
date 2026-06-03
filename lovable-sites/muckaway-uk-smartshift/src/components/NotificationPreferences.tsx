import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Bell, Mail, Loader2 } from 'lucide-react';

interface Preferences {
  email_job_updates: boolean;
  email_payment_updates: boolean;
  email_compliance_alerts: boolean;
  email_usage_warnings: boolean;
  inapp_job_updates: boolean;
  inapp_payment_updates: boolean;
  inapp_compliance_alerts: boolean;
  inapp_usage_warnings: boolean;
}

const DEFAULT_PREFERENCES: Preferences = {
  email_job_updates: true,
  email_payment_updates: true,
  email_compliance_alerts: true,
  email_usage_warnings: true,
  inapp_job_updates: true,
  inapp_payment_updates: true,
  inapp_compliance_alerts: true,
  inapp_usage_warnings: true,
};

export function NotificationPreferences() {
  const [preferences, setPreferences] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setPreferences({
          email_job_updates: data.email_job_updates ?? true,
          email_payment_updates: data.email_payment_updates ?? true,
          email_compliance_alerts: data.email_compliance_alerts ?? true,
          email_usage_warnings: data.email_usage_warnings ?? true,
          inapp_job_updates: data.inapp_job_updates ?? true,
          inapp_payment_updates: data.inapp_payment_updates ?? true,
          inapp_compliance_alerts: data.inapp_compliance_alerts ?? true,
          inapp_usage_warnings: data.inapp_usage_warnings ?? true,
        });
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: session.user.id,
          ...preferences,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast({
        title: 'Preferences Saved',
        description: 'Your notification preferences have been updated',
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: 'Error',
        description: 'Could not save preferences',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updatePreference = (key: keyof Preferences, value: boolean) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>
          Choose how you want to receive notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Mail className="h-4 w-4" />
            Email Notifications
          </div>
          
          <div className="space-y-3 pl-6">
            <div className="flex items-center justify-between">
              <Label htmlFor="email_job_updates">Job Updates</Label>
              <Switch
                id="email_job_updates"
                checked={preferences.email_job_updates}
                onCheckedChange={(v) => updatePreference('email_job_updates', v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="email_payment_updates">Payment Updates</Label>
              <Switch
                id="email_payment_updates"
                checked={preferences.email_payment_updates}
                onCheckedChange={(v) => updatePreference('email_payment_updates', v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="email_compliance_alerts">Compliance Alerts</Label>
              <Switch
                id="email_compliance_alerts"
                checked={preferences.email_compliance_alerts}
                onCheckedChange={(v) => updatePreference('email_compliance_alerts', v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="email_usage_warnings">Usage Warnings</Label>
              <Switch
                id="email_usage_warnings"
                checked={preferences.email_usage_warnings}
                onCheckedChange={(v) => updatePreference('email_usage_warnings', v)}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Bell className="h-4 w-4" />
            In-App Notifications
          </div>
          
          <div className="space-y-3 pl-6">
            <div className="flex items-center justify-between">
              <Label htmlFor="inapp_job_updates">Job Updates</Label>
              <Switch
                id="inapp_job_updates"
                checked={preferences.inapp_job_updates}
                onCheckedChange={(v) => updatePreference('inapp_job_updates', v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="inapp_payment_updates">Payment Updates</Label>
              <Switch
                id="inapp_payment_updates"
                checked={preferences.inapp_payment_updates}
                onCheckedChange={(v) => updatePreference('inapp_payment_updates', v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="inapp_compliance_alerts">Compliance Alerts</Label>
              <Switch
                id="inapp_compliance_alerts"
                checked={preferences.inapp_compliance_alerts}
                onCheckedChange={(v) => updatePreference('inapp_compliance_alerts', v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="inapp_usage_warnings">Usage Warnings</Label>
              <Switch
                id="inapp_usage_warnings"
                checked={preferences.inapp_usage_warnings}
                onCheckedChange={(v) => updatePreference('inapp_usage_warnings', v)}
              />
            </div>
          </div>
        </div>

        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Preferences'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
