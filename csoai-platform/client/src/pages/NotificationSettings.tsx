/**
 * Notification Settings Page
 * Configure email/Slack preferences and test notification delivery
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Bell,
  Mail,
  MessageSquare,
  AlertTriangle,
  Info,
  Award,
  Briefcase,
  FileText,
  Users,
  Send,
  Check,
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

export default function NotificationSettings() {
  const [slackWebhookUrl, setSlackWebhookUrl] = useState('');

  // Fetch current preferences
  const { data: preferences, refetch } = trpc.notifications.getPreferences.useQuery();

  // Update preferences mutation
  const updateMutation = trpc.notifications.updatePreferences.useMutation({
    onSuccess: () => {
      toast.success('Notification preferences updated');
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Test notification mutation
  const testMutation = trpc.notifications.testNotification.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleToggle = (field: string, value: boolean) => {
    updateMutation.mutate({ [field]: value });
  };

  const handleSlackWebhookSave = () => {
    if (!slackWebhookUrl) {
      toast.error('Please enter a Slack webhook URL');
      return;
    }

    if (!slackWebhookUrl.startsWith('https://hooks.slack.com/')) {
      toast.error('Invalid Slack webhook URL format');
      return;
    }

    updateMutation.mutate({
      slackWebhookUrl,
      slackEnabled: true,
    });
  };

  const handleTestNotification = (channel: 'email' | 'slack') => {
    testMutation.mutate({ channel });
  };

  if (!preferences) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-12 text-center text-gray-600">
            Loading preferences...
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Notification Settings</h1>
        <p className="text-gray-600 mt-1">
          Configure how you receive notifications about compliance alerts, system updates, and more
        </p>
      </div>

      {/* Delivery Channels */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-gray-600" />
            <CardTitle>Delivery Channels</CardTitle>
          </div>
          <CardDescription>Choose how you want to receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email Notifications */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Mail className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Email Notifications</p>
                <p className="text-sm text-gray-600">Receive notifications via email</p>
              </div>
            </div>
            <Switch
              checked={preferences.emailEnabled}
              onCheckedChange={(checked) => handleToggle('emailEnabled', checked)}
            />
          </div>

          <Separator />

          {/* Slack Notifications */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <MessageSquare className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Slack Notifications</p>
                  <p className="text-sm text-gray-600">Send notifications to Slack channel</p>
                </div>
              </div>
              <Switch
                checked={preferences.slackEnabled}
                onCheckedChange={(checked) => handleToggle('slackEnabled', checked)}
              />
            </div>

            {preferences.slackEnabled && (
              <div className="ml-12 space-y-3">
                <div>
                  <Label htmlFor="slackWebhook">Slack Webhook URL</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="slackWebhook"
                      type="url"
                      placeholder="https://hooks.slack.com/services/..."
                      value={slackWebhookUrl || preferences.slackWebhookUrl || ''}
                      onChange={(e) => setSlackWebhookUrl(e.target.value)}
                    />
                    <Button onClick={handleSlackWebhookSave} disabled={updateMutation.isPending}>
                      <Check className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Create a webhook in your Slack workspace settings
                  </p>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Test Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => handleTestNotification('email')}
              disabled={!preferences.emailEnabled || testMutation.isPending}
            >
              <Send className="h-4 w-4 mr-2" />
              Test Email
            </Button>
            <Button
              variant="outline"
              onClick={() => handleTestNotification('slack')}
              disabled={!preferences.slackEnabled || !preferences.slackWebhookUrl || testMutation.isPending}
            >
              <Send className="h-4 w-4 mr-2" />
              Test Slack
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notification Types */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-gray-600" />
            <CardTitle>Notification Types</CardTitle>
          </div>
          <CardDescription>Choose which types of notifications you want to receive</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Compliance Alerts */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Compliance Alerts</p>
                <p className="text-sm text-gray-600">Critical compliance issues and violations</p>
              </div>
            </div>
            <Switch
              checked={preferences.complianceAlerts}
              onCheckedChange={(checked) => handleToggle('complianceAlerts', checked)}
            />
          </div>

          <Separator />

          {/* System Updates */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Info className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">System Updates</p>
                <p className="text-sm text-gray-600">Platform updates and new features</p>
              </div>
            </div>
            <Switch
              checked={preferences.systemUpdates}
              onCheckedChange={(checked) => handleToggle('systemUpdates', checked)}
            />
          </div>

          <Separator />

          {/* Job Applications */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Briefcase className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Job Applications</p>
                <p className="text-sm text-gray-600">Updates on your job applications</p>
              </div>
            </div>
            <Switch
              checked={preferences.jobApplications}
              onCheckedChange={(checked) => handleToggle('jobApplications', checked)}
            />
          </div>

          <Separator />

          {/* Certificate Issued */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Award className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Certificates Issued</p>
                <p className="text-sm text-gray-600">When you earn new certifications</p>
              </div>
            </div>
            <Switch
              checked={preferences.certificateIssued}
              onCheckedChange={(checked) => handleToggle('certificateIssued', checked)}
            />
          </div>

          <Separator />

          {/* Council Decisions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Users className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Council Decisions</p>
                <p className="text-sm text-gray-600">33-Agent Council voting results</p>
              </div>
            </div>
            <Switch
              checked={preferences.councilDecisions}
              onCheckedChange={(checked) => handleToggle('councilDecisions', checked)}
            />
          </div>

          <Separator />

          {/* Report Updates */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-lg">
                <FileText className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Report Updates</p>
                <p className="text-sm text-gray-600">PDCA cycle and compliance report updates</p>
              </div>
            </div>
            <Switch
              checked={preferences.reportUpdates}
              onCheckedChange={(checked) => handleToggle('reportUpdates', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Email Digest Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-gray-600" />
            <CardTitle>Email Digest</CardTitle>
          </div>
          <CardDescription>Batch notifications into periodic email digests</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Enable Email Digest</p>
              <p className="text-sm text-gray-600">Receive batched notifications instead of individual emails</p>
            </div>
            <Switch
              checked={preferences.digestEnabled || false}
              onCheckedChange={(checked) => handleToggle('digestEnabled', checked)}
            />
          </div>

          {preferences.digestEnabled && (
            <div className="ml-0 space-y-3">
              <div>
                <Label>Digest Frequency</Label>
                <div className="flex gap-2 mt-2">
                  <Button
                    variant={preferences.digestFrequency === 'daily' ? 'default' : 'outline'}
                    onClick={() => updateMutation.mutate({ digestFrequency: 'daily' })}
                    className="flex-1"
                  >
                    Daily
                  </Button>
                  <Button
                    variant={preferences.digestFrequency === 'weekly' ? 'default' : 'outline'}
                    onClick={() => updateMutation.mutate({ digestFrequency: 'weekly' })}
                    className="flex-1"
                  >
                    Weekly
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {preferences.digestFrequency === 'daily'
                    ? 'You\'ll receive a daily summary of notifications'
                    : 'You\'ll receive a weekly summary of notifications'}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900 mb-1">About Notifications</p>
              <p className="text-sm text-blue-800">
                In-app notifications are always enabled. These settings control additional delivery channels
                like email and Slack. You can test each channel to ensure notifications are working correctly.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
