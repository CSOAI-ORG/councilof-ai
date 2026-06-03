import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  ShieldAlert, 
  AlertTriangle, 
  Eye, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  TrendingUp,
  Users,
  MapPin,
  Activity,
  FileWarning
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface RiskAssessment {
  id: string;
  customer_id: string;
  risk_score: number;
  risk_level: string;
  flagged_reasons: string[];
  assessment_notes: string;
  last_assessment_at: string;
  manual_override: boolean;
  customers?: {
    company_name: string;
    contact_name: string;
  };
}

interface SuspiciousActivity {
  id: string;
  customer_id: string;
  job_id: string;
  activity_type: string;
  severity: string;
  description: string;
  detected_at: string;
  status: string;
  review_notes: string;
  customers?: {
    company_name: string;
  };
}

interface Customer {
  id: string;
  company_name: string;
  contact_name: string;
}

export function FraudDetectionDashboard() {
  const [riskAssessments, setRiskAssessments] = useState<RiskAssessment[]>([]);
  const [suspiciousActivities, setSuspiciousActivities] = useState<SuspiciousActivity[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssessing, setIsAssessing] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<SuspiciousActivity | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewStatus, setReviewStatus] = useState<string>('pending_review');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch risk assessments
      const { data: assessments, error: assessmentsError } = await supabase
        .from('customer_risk_assessments')
        .select(`
          *,
          customers (
            company_name,
            contact_name
          )
        `)
        .order('risk_score', { ascending: false });

      if (assessmentsError) throw assessmentsError;
      setRiskAssessments(assessments || []);

      // Fetch suspicious activities
      const { data: activities, error: activitiesError } = await supabase
        .from('suspicious_activity_log')
        .select(`
          *,
          customers (
            company_name
          )
        `)
        .order('detected_at', { ascending: false })
        .limit(50);

      if (activitiesError) throw activitiesError;
      setSuspiciousActivities(activities || []);

      // Fetch customers for assessment
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('id, company_name, contact_name')
        .order('company_name');

      if (customersError) throw customersError;
      setCustomers(customersData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load fraud detection data');
    } finally {
      setIsLoading(false);
    }
  };

  const assessCustomerRisk = async () => {
    if (!selectedCustomer) {
      toast.error('Please select a customer');
      return;
    }

    setIsAssessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('assess-customer-risk', {
        body: { customerId: selectedCustomer },
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });

      if (error) throw error;

      toast.success(`Risk assessment complete: ${data.riskLevel} risk (${data.riskScore}/100)`);
      fetchData();
    } catch (error) {
      console.error('Assessment error:', error);
      toast.error('Failed to assess customer risk');
    } finally {
      setIsAssessing(false);
    }
  };

  const openReviewDialog = (activity: SuspiciousActivity) => {
    setSelectedActivity(activity);
    setReviewNotes(activity.review_notes || '');
    setReviewStatus(activity.status);
    setReviewDialogOpen(true);
  };

  const submitReview = async () => {
    if (!selectedActivity) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('suspicious_activity_log')
        .update({
          status: reviewStatus as 'pending_review' | 'dismissed' | 'confirmed_fraud' | 'under_investigation',
          review_notes: reviewNotes,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', selectedActivity.id);

      if (error) throw error;

      toast.success('Review submitted successfully');
      setReviewDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Review error:', error);
      toast.error('Failed to submit review');
    }
  };

  const getRiskLevelBadge = (level: string) => {
    switch (level) {
      case 'low':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Low Risk</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Medium Risk</Badge>;
      case 'high':
        return <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20">High Risk</Badge>;
      case 'critical':
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Critical Risk</Badge>;
      default:
        return <Badge variant="secondary">{level}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_review':
        return <Badge variant="outline" className="border-amber-500/50 text-amber-500">Pending Review</Badge>;
      case 'dismissed':
        return <Badge variant="secondary">Dismissed</Badge>;
      case 'confirmed_fraud':
        return <Badge className="bg-red-500/10 text-red-500">Confirmed Fraud</Badge>;
      case 'under_investigation':
        return <Badge className="bg-blue-500/10 text-blue-500">Investigating</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getRiskColor = (score: number) => {
    if (score <= 25) return 'bg-green-500';
    if (score <= 50) return 'bg-yellow-500';
    if (score <= 75) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getActivityTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'new_customer_large_job': 'Large First Job',
      'no_verified_licence': 'No Verified Licence',
      'multiple_postcodes': 'Multiple Locations',
      'fly_tipping_hotspot': 'Fly-Tipping Hotspot',
      'missing_company_details': 'Missing Company Info',
      'high_hazardous_ratio': 'High Hazardous Ratio',
      'over_credit_limit': 'Over Credit Limit'
    };
    return labels[type] || type;
  };

  // Stats
  const criticalRiskCount = riskAssessments.filter(a => a.risk_level === 'critical').length;
  const highRiskCount = riskAssessments.filter(a => a.risk_level === 'high').length;
  const pendingReviewCount = suspiciousActivities.filter(a => a.status === 'pending_review').length;
  const confirmedFraudCount = suspiciousActivities.filter(a => a.status === 'confirmed_fraud').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-red-500/10">
          <ShieldAlert className="h-6 w-6 text-red-500" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Fraud Detection Dashboard</h2>
          <p className="text-muted-foreground">Customer risk monitoring & suspicious activity tracking</p>
        </div>
      </div>

      {/* Critical Alerts */}
      {criticalRiskCount > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Critical Risk Customers</AlertTitle>
          <AlertDescription>
            {criticalRiskCount} customer(s) have been flagged as critical risk. 
            Manual review required before accepting new jobs.
          </AlertDescription>
        </Alert>
      )}

      {pendingReviewCount > 0 && (
        <Alert className="border-amber-500/50 bg-amber-500/10">
          <Eye className="h-4 w-4 text-amber-500" />
          <AlertTitle className="text-amber-500">Pending Reviews</AlertTitle>
          <AlertDescription>
            {pendingReviewCount} suspicious activity alert(s) require your review.
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/10">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{criticalRiskCount}</p>
                <p className="text-sm text-muted-foreground">Critical Risk</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-orange-500/10">
                <TrendingUp className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{highRiskCount}</p>
                <p className="text-sm text-muted-foreground">High Risk</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-amber-500/10">
                <Eye className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingReviewCount}</p>
                <p className="text-sm text-muted-foreground">Pending Review</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/10">
                <FileWarning className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{confirmedFraudCount}</p>
                <p className="text-sm text-muted-foreground">Confirmed Fraud</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assess Customer Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Assess Customer Risk
          </CardTitle>
          <CardDescription>
            Run a comprehensive risk assessment on a customer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
              <SelectTrigger className="max-w-md">
                <SelectValue placeholder="Select a customer" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.company_name || customer.contact_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={assessCustomerRisk} disabled={isAssessing || !selectedCustomer}>
              {isAssessing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Assessing...
                </>
              ) : (
                <>
                  <Activity className="h-4 w-4 mr-2" />
                  Assess Risk
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="assessments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="assessments">Risk Assessments</TabsTrigger>
          <TabsTrigger value="activities">
            Suspicious Activity
            {pendingReviewCount > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {pendingReviewCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Risk Assessments Tab */}
        <TabsContent value="assessments">
          <Card>
            <CardHeader>
              <CardTitle>Customer Risk Scores</CardTitle>
              <CardDescription>
                Risk assessments for all customers based on activity patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : riskAssessments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShieldAlert className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No risk assessments yet</p>
                  <p className="text-sm">Select a customer above to run an assessment</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Risk Score</TableHead>
                      <TableHead>Risk Level</TableHead>
                      <TableHead>Flagged Issues</TableHead>
                      <TableHead>Last Assessed</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {riskAssessments.map((assessment) => (
                      <TableRow key={assessment.id}>
                        <TableCell className="font-medium">
                          {assessment.customers?.company_name || assessment.customers?.contact_name || 'Unknown'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress 
                              value={assessment.risk_score} 
                              className={`w-20 h-2 ${getRiskColor(assessment.risk_score)}`}
                            />
                            <span className="text-sm font-mono">{assessment.risk_score}/100</span>
                          </div>
                        </TableCell>
                        <TableCell>{getRiskLevelBadge(assessment.risk_level)}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {assessment.flagged_reasons.slice(0, 2).map((reason, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {getActivityTypeLabel(reason)}
                              </Badge>
                            ))}
                            {assessment.flagged_reasons.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{assessment.flagged_reasons.length - 2} more
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(assessment.last_assessment_at), 'dd MMM yyyy HH:mm')}
                        </TableCell>
                        <TableCell>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setSelectedCustomer(assessment.customer_id);
                              assessCustomerRisk();
                            }}
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Reassess
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Suspicious Activity Tab */}
        <TabsContent value="activities">
          <Card>
            <CardHeader>
              <CardTitle>Suspicious Activity Log</CardTitle>
              <CardDescription>
                Detected fraud indicators and risk flags
              </CardDescription>
            </CardHeader>
            <CardContent>
              {suspiciousActivities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No suspicious activity detected</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Activity Type</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {suspiciousActivities.map((activity) => (
                      <TableRow key={activity.id}>
                        <TableCell className="text-sm">
                          {format(new Date(activity.detected_at), 'dd MMM yyyy HH:mm')}
                        </TableCell>
                        <TableCell className="font-medium">
                          {activity.customers?.company_name || 'Unknown'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{getActivityTypeLabel(activity.activity_type)}</Badge>
                        </TableCell>
                        <TableCell>{getRiskLevelBadge(activity.severity)}</TableCell>
                        <TableCell>{getStatusBadge(activity.status)}</TableCell>
                        <TableCell>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => openReviewDialog(activity)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Suspicious Activity</DialogTitle>
            <DialogDescription>
              {selectedActivity?.description}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Update Status</label>
              <Select value={reviewStatus} onValueChange={setReviewStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending_review">Pending Review</SelectItem>
                  <SelectItem value="under_investigation">Under Investigation</SelectItem>
                  <SelectItem value="dismissed">Dismissed</SelectItem>
                  <SelectItem value="confirmed_fraud">Confirmed Fraud</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Review Notes</label>
              <Textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add your review notes..."
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitReview}>
              Submit Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
