/**
 * Compliance Monitoring Dashboard
 * Real-time AI system health metrics, compliance drift alerts, and automated incident detection
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Activity,
  TrendingUp,
  TrendingDown,
  Bell,
  Mail,
  MessageSquare,
  RefreshCw,
  Download,
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function ComplianceMonitoring() {
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Mock data - in production, this would come from real-time API
  const systemsHealth = [
    {
      id: 1,
      name: 'Customer Service AI',
      status: 'healthy',
      complianceScore: 94,
      lastCheck: '2 minutes ago',
      alerts: 0,
      trend: 'up',
    },
    {
      id: 2,
      name: 'Fraud Detection System',
      status: 'warning',
      complianceScore: 78,
      lastCheck: '5 minutes ago',
      alerts: 2,
      trend: 'down',
    },
    {
      id: 3,
      name: 'Recommendation Engine',
      status: 'critical',
      complianceScore: 62,
      lastCheck: '1 minute ago',
      alerts: 5,
      trend: 'down',
    },
    {
      id: 4,
      name: 'Content Moderation AI',
      status: 'healthy',
      complianceScore: 91,
      lastCheck: '3 minutes ago',
      alerts: 0,
      trend: 'stable',
    },
  ];

  const complianceTrend = [
    { date: 'Jan 20', score: 85 },
    { date: 'Jan 21', score: 87 },
    { date: 'Jan 22', score: 84 },
    { date: 'Jan 23', score: 82 },
    { date: 'Jan 24', score: 79 },
    { date: 'Jan 25', score: 76 },
    { date: 'Jan 26', score: 81 },
  ];

  const incidentsByType = [
    { type: 'Data Privacy', count: 12 },
    { type: 'Bias Detection', count: 8 },
    { type: 'Transparency', count: 15 },
    { type: 'Safety', count: 6 },
    { type: 'Accountability', count: 9 },
  ];

  const recentAlerts = [
    {
      id: 1,
      system: 'Recommendation Engine',
      severity: 'critical',
      message: 'Compliance score dropped below 65% threshold',
      time: '2 minutes ago',
      type: 'drift',
    },
    {
      id: 2,
      system: 'Fraud Detection System',
      severity: 'warning',
      message: 'Bias detected in age-based predictions',
      time: '15 minutes ago',
      type: 'bias',
    },
    {
      id: 3,
      system: 'Recommendation Engine',
      severity: 'critical',
      message: 'Data retention policy violation detected',
      time: '18 minutes ago',
      type: 'privacy',
    },
    {
      id: 4,
      system: 'Customer Service AI',
      severity: 'info',
      message: 'Scheduled compliance review due in 3 days',
      time: '1 hour ago',
      type: 'scheduled',
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Activity className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Compliance Monitoring</h1>
          <p className="text-gray-600 mt-1">
            Real-time health metrics, drift alerts, and automated incident detection
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'border-green-600 text-green-600' : ''}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto-Refresh On' : 'Auto-Refresh Off'}
          </Button>

          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Systems</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">24</div>
            <p className="text-sm text-gray-600 mt-1">4 monitored actively</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Active Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">7</div>
            <p className="text-sm text-gray-600 mt-1">3 critical, 4 warnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Avg Compliance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">81%</div>
            <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
              <TrendingDown className="h-4 w-4" />
              -3% from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Incidents (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">50</div>
            <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              -12% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="systems" className="space-y-6">
        <TabsList>
          <TabsTrigger value="systems">System Health</TabsTrigger>
          <TabsTrigger value="alerts">Active Alerts</TabsTrigger>
          <TabsTrigger value="trends">Compliance Trends</TabsTrigger>
          <TabsTrigger value="incidents">Incident Analysis</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        {/* System Health Tab */}
        <TabsContent value="systems" className="space-y-4">
          {systemsHealth.map((system) => (
            <Card key={system.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {getStatusIcon(system.status)}
                    <div>
                      <h3 className="font-semibold text-gray-900">{system.name}</h3>
                      <p className="text-sm text-gray-600">Last checked: {system.lastCheck}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">{system.complianceScore}%</div>
                      <p className="text-sm text-gray-600">Compliance Score</p>
                    </div>

                    <Badge className={getStatusColor(system.status)}>
                      {system.status.toUpperCase()}
                    </Badge>

                    {system.alerts > 0 && (
                      <Badge variant="destructive">{system.alerts} Alerts</Badge>
                    )}

                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Active Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          {recentAlerts.map((alert) => (
            <Card key={alert.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{alert.system}</h3>
                        <Badge className={getSeverityColor(alert.severity)}>
                          {alert.severity.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-gray-700 mb-2">{alert.message}</p>
                      <p className="text-sm text-gray-500">{alert.time}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      Acknowledge
                    </Button>
                    <Button size="sm">
                      Investigate
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Compliance Trends Tab */}
        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>7-Day Compliance Score Trend</CardTitle>
              <CardDescription>
                Average compliance score across all monitored systems
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={complianceTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Compliance Score"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Incident Analysis Tab */}
        <TabsContent value="incidents">
          <Card>
            <CardHeader>
              <CardTitle>Incidents by Type (Last 30 Days)</CardTitle>
              <CardDescription>
                Breakdown of detected compliance incidents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={incidentsByType}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#10b981" name="Incidents" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure how you receive compliance alerts and incident notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Email Notifications</h3>
                    <p className="text-sm text-gray-600">Receive alerts via email</p>
                  </div>
                </div>
                <Button variant="outline">Configure</Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-5 w-5 text-gray-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Slack Integration</h3>
                    <p className="text-sm text-gray-600">Send alerts to Slack channels</p>
                  </div>
                </div>
                <Button variant="outline">Connect Slack</Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-gray-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900">In-App Notifications</h3>
                    <p className="text-sm text-gray-600">Show alerts in the dashboard</p>
                  </div>
                </div>
                <Button variant="outline">Manage</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
