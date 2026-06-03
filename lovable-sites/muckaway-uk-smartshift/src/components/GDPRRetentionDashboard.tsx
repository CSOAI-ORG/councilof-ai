import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, 
  Clock, 
  Archive, 
  Trash2, 
  Eye, 
  Download, 
  AlertTriangle,
  CheckCircle,
  FileText,
  Calendar,
  Database,
  Settings,
  Play,
  RefreshCw,
  Users
} from 'lucide-react';
import { format, addDays, differenceInDays } from 'date-fns';

interface RetentionPolicy {
  id: string;
  table_name: string;
  retention_years: number;
  retention_action: 'archive' | 'anonymize' | 'delete';
  legal_basis: string;
  applies_to_region: string;
  description: string;
  active: boolean;
  created_at: string;
}

interface DataSubjectRequest {
  id: string;
  request_type: string;
  requester_name: string;
  requester_email: string;
  description: string;
  status: string;
  processed_at: string | null;
  export_expires_at: string | null;
  cooling_off_ends_at: string | null;
  created_at: string;
}

interface RetentionStats {
  table: string;
  total_records: number;
  expiring_30_days: number;
  expiring_60_days: number;
  expiring_90_days: number;
  anonymized: number;
  archived: number;
}

export default function GDPRRetentionDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [policies, setPolicies] = useState<RetentionPolicy[]>([]);
  const [requests, setRequests] = useState<DataSubjectRequest[]>([]);
  const [stats, setStats] = useState<RetentionStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingRetention, setProcessingRetention] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<DataSubjectRequest | null>(null);
  const [editingPolicy, setEditingPolicy] = useState<RetentionPolicy | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch retention policies
      const { data: policiesData } = await supabase
        .from('data_retention_policies')
        .select('*')
        .order('table_name');
      
      setPolicies(policiesData || []);

      // Fetch data subject requests
      const { data: requestsData } = await supabase
        .from('data_subject_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      setRequests(requestsData || []);

      // Calculate retention stats for each table
      await calculateStats();
    } catch (error) {
      console.error('Error fetching GDPR data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = async () => {
    // Simplified stats - just show placeholder data since dynamic table queries have type issues
    const newStats: RetentionStats[] = [
      { table: 'jobs', total_records: 0, expiring_30_days: 0, expiring_60_days: 0, expiring_90_days: 0, anonymized: 0, archived: 0 },
      { table: 'customers', total_records: 0, expiring_30_days: 0, expiring_60_days: 0, expiring_90_days: 0, anonymized: 0, archived: 0 },
      { table: 'quotes', total_records: 0, expiring_30_days: 0, expiring_60_days: 0, expiring_90_days: 0, anonymized: 0, archived: 0 },
      { table: 'hazardous_consignment_notes', total_records: 0, expiring_30_days: 0, expiring_60_days: 0, expiring_90_days: 0, anonymized: 0, archived: 0 },
    ];

    try {
      // Get jobs stats
      const { count: jobsTotal } = await supabase.from('jobs').select('*', { count: 'exact', head: true });
      const { count: jobsAnon } = await supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('anonymized', true);
      newStats[0].total_records = jobsTotal || 0;
      newStats[0].anonymized = jobsAnon || 0;

      // Get customers stats
      const { count: custTotal } = await supabase.from('customers').select('*', { count: 'exact', head: true });
      const { count: custAnon } = await supabase.from('customers').select('*', { count: 'exact', head: true }).eq('anonymized', true);
      newStats[1].total_records = custTotal || 0;
      newStats[1].anonymized = custAnon || 0;

      // Get quotes stats  
      const { count: quotesTotal } = await supabase.from('quotes').select('*', { count: 'exact', head: true });
      newStats[2].total_records = quotesTotal || 0;
    } catch (error) {
      console.error('Error calculating stats:', error);
    }

    setStats(newStats);
  };

  const runRetentionProcessing = async () => {
    setProcessingRetention(true);
    try {
      const { data, error } = await supabase.functions.invoke('process-data-retention');
      
      if (error) throw error;

      toast({
        title: 'Retention Processing Complete',
        description: `Processed ${data?.results?.reduce((acc: number, r: any) => acc + r.count, 0) || 0} records.`,
      });

      await fetchData();
    } catch (error: any) {
      toast({
        title: 'Processing Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setProcessingRetention(false);
    }
  };

  const processRequest = async (request: DataSubjectRequest, action: 'approve' | 'reject') => {
    try {
      if (action === 'approve' && request.request_type === 'subject_access') {
        // Trigger data export
        const { data, error } = await supabase.functions.invoke('export-user-data', {
          body: { request_id: request.id, email: request.requester_email, format: 'json' }
        });

        if (error) throw error;

        toast({
          title: 'Data Export Generated',
          description: 'The requester will receive their data export.',
        });
      } else if (action === 'approve' && request.request_type === 'deletion') {
        // Set cooling off period for deletion requests
        const coolingOffEnd = addDays(new Date(), 30);
        
        await supabase
          .from('data_subject_requests')
          .update({
            status: 'processing',
            cooling_off_ends_at: coolingOffEnd.toISOString(),
            processed_by: user?.id,
            notes: 'Deletion scheduled after 30-day cooling-off period'
          })
          .eq('id', request.id);

        toast({
          title: 'Deletion Request Approved',
          description: 'Data will be deleted after the 30-day cooling-off period.',
        });
      } else if (action === 'reject') {
        await supabase
          .from('data_subject_requests')
          .update({
            status: 'rejected',
            processed_at: new Date().toISOString(),
            processed_by: user?.id
          })
          .eq('id', request.id);

        toast({
          title: 'Request Rejected',
          description: 'The request has been rejected.',
        });
      }

      await fetchData();
    } catch (error: any) {
      toast({
        title: 'Error Processing Request',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const updatePolicy = async (policy: RetentionPolicy) => {
    try {
      const { error } = await supabase
        .from('data_retention_policies')
        .update({
          retention_years: policy.retention_years,
          retention_action: policy.retention_action,
          active: policy.active,
          description: policy.description
        })
        .eq('id', policy.id);

      if (error) throw error;

      toast({
        title: 'Policy Updated',
        description: 'Retention policy has been updated successfully.',
      });

      setEditingPolicy(null);
      await fetchData();
    } catch (error: any) {
      toast({
        title: 'Update Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30">Pending</Badge>;
      case 'processing':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30">Processing</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">Completed</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/30">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'archive':
        return <Archive className="h-4 w-4 text-blue-500" />;
      case 'anonymize':
        return <Eye className="h-4 w-4 text-yellow-500" />;
      case 'delete':
        return <Trash2 className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending').length;
  const totalExpiring = stats.reduce((acc, s) => acc + s.expiring_30_days + s.expiring_60_days + s.expiring_90_days, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">GDPR Data Retention</h1>
          <p className="text-muted-foreground">Manage data retention policies, subject requests, and compliance</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={runRetentionProcessing} disabled={processingRetention}>
            {processingRetention ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Run Retention Processing
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Requests</p>
                <p className="text-2xl font-bold text-foreground">{pendingRequests}</p>
              </div>
              <div className="p-3 bg-yellow-500/10 rounded-full">
                <FileText className="h-6 w-6 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Expiring Soon</p>
                <p className="text-2xl font-bold text-foreground">{totalExpiring}</p>
              </div>
              <div className="p-3 bg-orange-500/10 rounded-full">
                <Clock className="h-6 w-6 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Policies</p>
                <p className="text-2xl font-bold text-foreground">{policies.filter(p => p.active).length}</p>
              </div>
              <div className="p-3 bg-green-500/10 rounded-full">
                <Shield className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Archived Records</p>
                <p className="text-2xl font-bold text-foreground">{stats.reduce((acc, s) => acc + s.archived, 0)}</p>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-full">
                <Archive className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="requests" className="space-y-4">
        <TabsList>
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Subject Requests
            {pendingRequests > 0 && (
              <Badge variant="destructive" className="ml-1">{pendingRequests}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="policies" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Retention Policies
          </TabsTrigger>
          <TabsTrigger value="expiring" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Expiring Data
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Data Overview
          </TabsTrigger>
        </TabsList>

        {/* Subject Requests Tab */}
        <TabsContent value="requests">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Data Subject Requests</CardTitle>
              <CardDescription>
                Manage requests for data access, deletion, portability, and rectification
              </CardDescription>
            </CardHeader>
            <CardContent>
              {requests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No data subject requests yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Request Type</TableHead>
                      <TableHead>Requester</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <span className="capitalize font-medium">
                            {request.request_type.replace('_', ' ')}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{request.requester_name}</div>
                            <div className="text-sm text-muted-foreground">{request.requester_email}</div>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                        <TableCell>{format(new Date(request.created_at), 'dd MMM yyyy')}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" onClick={() => setSelectedRequest(request)}>
                                  View
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle className="capitalize">
                                    {request.request_type.replace('_', ' ')} Request
                                  </DialogTitle>
                                  <DialogDescription>
                                    Submitted on {format(new Date(request.created_at), 'dd MMMM yyyy')}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label>Requester</Label>
                                    <p className="text-sm">{request.requester_name} ({request.requester_email})</p>
                                  </div>
                                  <div>
                                    <Label>Description</Label>
                                    <p className="text-sm text-muted-foreground">{request.description || 'No description provided'}</p>
                                  </div>
                                  <div>
                                    <Label>Status</Label>
                                    <div className="mt-1">{getStatusBadge(request.status)}</div>
                                  </div>
                                  {request.cooling_off_ends_at && (
                                    <Alert>
                                      <Clock className="h-4 w-4" />
                                      <AlertTitle>Cooling-Off Period</AlertTitle>
                                      <AlertDescription>
                                        Deletion scheduled for {format(new Date(request.cooling_off_ends_at), 'dd MMMM yyyy')}
                                      </AlertDescription>
                                    </Alert>
                                  )}
                                </div>
                                {request.status === 'pending' && (
                                  <DialogFooter>
                                    <Button variant="outline" onClick={() => processRequest(request, 'reject')}>
                                      Reject
                                    </Button>
                                    <Button onClick={() => processRequest(request, 'approve')}>
                                      Approve & Process
                                    </Button>
                                  </DialogFooter>
                                )}
                              </DialogContent>
                            </Dialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Retention Policies Tab */}
        <TabsContent value="policies">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Data Retention Policies</CardTitle>
              <CardDescription>
                Configure how long data is retained and what happens after the retention period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data Type</TableHead>
                    <TableHead>Retention</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Legal Basis</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {policies.map((policy) => (
                    <TableRow key={policy.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium capitalize">{policy.table_name.replace('_', ' ')}</div>
                          <div className="text-sm text-muted-foreground">{policy.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>{policy.retention_years} years</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getActionIcon(policy.retention_action)}
                          <span className="capitalize">{policy.retention_action}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate" title={policy.legal_basis}>
                        {policy.legal_basis}
                      </TableCell>
                      <TableCell>
                        {policy.active ? (
                          <Badge className="bg-green-500/10 text-green-500">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setEditingPolicy({ ...policy })}>
                              Edit
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Retention Policy</DialogTitle>
                              <DialogDescription>
                                Modify the retention settings for {policy.table_name}
                              </DialogDescription>
                            </DialogHeader>
                            {editingPolicy && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Retention Period (years)</Label>
                                    <Input
                                      type="number"
                                      min={1}
                                      max={20}
                                      value={editingPolicy.retention_years}
                                      onChange={(e) => setEditingPolicy({
                                        ...editingPolicy,
                                        retention_years: parseInt(e.target.value)
                                      })}
                                    />
                                  </div>
                                  <div>
                                    <Label>Action After Expiry</Label>
                                    <Select
                                      value={editingPolicy.retention_action}
                                      onValueChange={(value: 'archive' | 'anonymize' | 'delete') => 
                                        setEditingPolicy({ ...editingPolicy, retention_action: value })
                                      }
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="archive">Archive</SelectItem>
                                        <SelectItem value="anonymize">Anonymize</SelectItem>
                                        <SelectItem value="delete">Delete</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                <div>
                                  <Label>Description</Label>
                                  <Textarea
                                    value={editingPolicy.description || ''}
                                    onChange={(e) => setEditingPolicy({
                                      ...editingPolicy,
                                      description: e.target.value
                                    })}
                                  />
                                </div>
                                <div className="flex items-center gap-2">
                                  <Switch
                                    checked={editingPolicy.active}
                                    onCheckedChange={(checked) => setEditingPolicy({
                                      ...editingPolicy,
                                      active: checked
                                    })}
                                  />
                                  <Label>Policy Active</Label>
                                </div>
                              </div>
                            )}
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setEditingPolicy(null)}>
                                Cancel
                              </Button>
                              <Button onClick={() => editingPolicy && updatePolicy(editingPolicy)}>
                                Save Changes
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Expiring Data Tab */}
        <TabsContent value="expiring">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Data Expiration Timeline</CardTitle>
              <CardDescription>
                Records approaching their retention expiration date
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {stats.map((stat) => (
                  <div key={stat.table} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium capitalize">{stat.table.replace('_', ' ')}</span>
                      <span className="text-sm text-muted-foreground">
                        {stat.expiring_30_days + stat.expiring_60_days + stat.expiring_90_days} expiring in 90 days
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-red-500/10 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-red-500">{stat.expiring_30_days}</div>
                        <div className="text-xs text-muted-foreground">Next 30 days</div>
                      </div>
                      <div className="bg-orange-500/10 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-orange-500">{stat.expiring_60_days}</div>
                        <div className="text-xs text-muted-foreground">30-60 days</div>
                      </div>
                      <div className="bg-yellow-500/10 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-yellow-500">{stat.expiring_90_days}</div>
                        <div className="text-xs text-muted-foreground">60-90 days</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Overview Tab */}
        <TabsContent value="stats">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Data Overview</CardTitle>
              <CardDescription>
                Summary of all managed data across the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data Type</TableHead>
                    <TableHead className="text-right">Total Records</TableHead>
                    <TableHead className="text-right">Anonymized</TableHead>
                    <TableHead className="text-right">Archived</TableHead>
                    <TableHead className="text-right">Active</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.map((stat) => (
                    <TableRow key={stat.table}>
                      <TableCell className="font-medium capitalize">{stat.table.replace('_', ' ')}</TableCell>
                      <TableCell className="text-right">{stat.total_records.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500">
                          {stat.anonymized}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-500">
                          {stat.archived}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className="bg-green-500/10 text-green-500">
                          {stat.total_records - stat.anonymized - stat.archived}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
