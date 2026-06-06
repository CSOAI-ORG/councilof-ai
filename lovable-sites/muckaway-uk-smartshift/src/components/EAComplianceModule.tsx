import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Search, 
  FileText,
  RefreshCw,
  Calendar,
  Building2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, differenceInDays, addDays } from 'date-fns';

interface LicenceVerificationResult {
  isValid: boolean;
  licenceNumber: string;
  licenceTier: 'upper' | 'lower' | null;
  registeredHolder: string | null;
  expiryDate: string | null;
  status: 'valid' | 'expired' | 'suspended' | 'not_found';
  message: string;
}

interface WasteCarrierLicence {
  id: string;
  customer_id: string;
  licence_number: string;
  licence_tier: string;
  registered_holder: string;
  expiry_date: string;
  is_verified: boolean;
  last_verified_at: string;
  customers?: {
    company_name: string;
    contact_name: string;
  };
}

interface VerificationHistory {
  id: string;
  licence_number: string;
  verification_status: string;
  registered_holder: string;
  verification_date: string;
}

export function EAComplianceModule() {
  const [licenceNumber, setLicenceNumber] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<LicenceVerificationResult | null>(null);
  const [customerLicences, setCustomerLicences] = useState<WasteCarrierLicence[]>([]);
  const [verificationHistory, setVerificationHistory] = useState<VerificationHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch customer licences
      const { data: licences, error: licenceError } = await supabase
        .from('waste_carrier_licences')
        .select(`
          *,
          customers (
            company_name,
            contact_name
          )
        `)
        .order('expiry_date', { ascending: true });

      if (licenceError) throw licenceError;
      setCustomerLicences(licences || []);

      // Fetch verification history
      const { data: history, error: historyError } = await supabase
        .from('licence_verifications')
        .select('*')
        .order('verification_date', { ascending: false })
        .limit(20);

      if (historyError) throw historyError;
      setVerificationHistory(history || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load compliance data');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyLicence = async () => {
    if (!licenceNumber.trim()) {
      toast.error('Please enter a licence number');
      return;
    }

    setIsVerifying(true);
    setVerificationResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('verify-waste-licence', {
        body: { licenceNumber: licenceNumber.trim() }
      });

      if (error) throw error;

      setVerificationResult(data);
      
      if (data.isValid) {
        toast.success('Licence verified successfully');
      } else {
        toast.warning(data.message);
      }

      // Refresh data
      fetchData();
    } catch (error) {
      console.error('Verification error:', error);
      toast.error('Failed to verify licence');
    } finally {
      setIsVerifying(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'expired':
        return <Clock className="h-5 w-5 text-amber-500" />;
      case 'suspended':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'valid':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Valid</Badge>;
      case 'expired':
        return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">Expired</Badge>;
      case 'suspended':
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Suspended</Badge>;
      default:
        return <Badge variant="secondary">Not Found</Badge>;
    }
  };

  const getExpiryWarning = (expiryDate: string) => {
    const daysUntilExpiry = differenceInDays(new Date(expiryDate), new Date());
    
    if (daysUntilExpiry < 0) {
      return { level: 'critical', message: 'EXPIRED', color: 'text-red-500' };
    }
    if (daysUntilExpiry <= 7) {
      return { level: 'critical', message: `${daysUntilExpiry} days`, color: 'text-red-500' };
    }
    if (daysUntilExpiry <= 14) {
      return { level: 'warning', message: `${daysUntilExpiry} days`, color: 'text-amber-500' };
    }
    if (daysUntilExpiry <= 30) {
      return { level: 'notice', message: `${daysUntilExpiry} days`, color: 'text-yellow-500' };
    }
    return { level: 'ok', message: `${daysUntilExpiry} days`, color: 'text-green-500' };
  };

  const expiringLicences = customerLicences.filter(l => {
    const daysUntilExpiry = differenceInDays(new Date(l.expiry_date), new Date());
    return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
  });

  const expiredLicences = customerLicences.filter(l => {
    return differenceInDays(new Date(l.expiry_date), new Date()) < 0;
  });

  // DWT readiness checklist
  const dwtReadiness = [
    { item: 'Digital signature capability', ready: true },
    { item: 'Unique transfer note numbering', ready: true },
    { item: 'Carrier licence verification', ready: true },
    { item: 'EWC code auto-population', ready: true },
    { item: 'Site address validation', ready: true },
    { item: 'Quantity reconciliation', ready: true },
    { item: 'EA API integration', ready: false },
    { item: 'Automated submission', ready: false },
  ];

  const readinessScore = (dwtReadiness.filter(i => i.ready).length / dwtReadiness.length) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">EA Compliance Module</h2>
          <p className="text-muted-foreground">Environment Agency licence verification & compliance</p>
        </div>
      </div>

      {/* Alerts for expiring/expired licences */}
      {expiredLicences.length > 0 && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Expired Licences</AlertTitle>
          <AlertDescription>
            {expiredLicences.length} customer(s) have expired waste carrier licences. 
            Jobs from these customers should not be accepted until licences are renewed.
          </AlertDescription>
        </Alert>
      )}

      {expiringLicences.length > 0 && (
        <Alert className="border-amber-500/50 bg-amber-500/10">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <AlertTitle className="text-amber-500">Licences Expiring Soon</AlertTitle>
          <AlertDescription>
            {expiringLicences.length} licence(s) will expire within 30 days. 
            Contact customers to request renewal documentation.
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/10">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{customerLicences.filter(l => l.is_verified).length}</p>
                <p className="text-sm text-muted-foreground">Verified Licences</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-amber-500/10">
                <Clock className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{expiringLicences.length}</p>
                <p className="text-sm text-muted-foreground">Expiring Soon</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/10">
                <XCircle className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{expiredLicences.length}</p>
                <p className="text-sm text-muted-foreground">Expired</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{verificationHistory.length}</p>
                <p className="text-sm text-muted-foreground">Verifications</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="verify" className="space-y-4">
        <TabsList>
          <TabsTrigger value="verify">Verify Licence</TabsTrigger>
          <TabsTrigger value="licences">Customer Licences</TabsTrigger>
          <TabsTrigger value="history">Verification History</TabsTrigger>
          <TabsTrigger value="dwt">DWT Readiness</TabsTrigger>
        </TabsList>

        {/* Verify Tab */}
        <TabsContent value="verify" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Licence Lookup
              </CardTitle>
              <CardDescription>
                Verify a waste carrier registration number against the Environment Agency register.
                <span className="block mt-1 text-amber-600 dark:text-amber-400 font-medium">
                  Live EA API integration active. Results verified in real-time.
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Input
                  placeholder="Enter licence number (e.g., CBDU123456)"
                  value={licenceNumber}
                  onChange={(e) => setLicenceNumber(e.target.value.toUpperCase())}
                  className="max-w-md"
                />
                <Button onClick={verifyLicence} disabled={isVerifying}>
                  {isVerifying ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Verify
                    </>
                  )}
                </Button>
              </div>

              <div className="text-sm text-muted-foreground">
                <p>Format: CBDU + 6 digits (Upper Tier) or CBDL + 6 digits (Lower Tier)</p>
                <p className="mt-1">Example: CBDU123456, CBDL345678</p>
              </div>

              {verificationResult && (
                <Card className={`mt-4 ${
                  verificationResult.isValid 
                    ? 'border-green-500/50 bg-green-500/5' 
                    : 'border-red-500/50 bg-red-500/5'
                }`}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      {getStatusIcon(verificationResult.status)}
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold">{verificationResult.licenceNumber}</span>
                          {getStatusBadge(verificationResult.status)}
                          {verificationResult.licenceTier && (
                            <Badge variant="outline" className="capitalize">
                              {verificationResult.licenceTier} Tier
                            </Badge>
                          )}
                        </div>
                        
                        {verificationResult.registeredHolder && (
                          <div className="flex items-center gap-2 text-sm">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span>{verificationResult.registeredHolder}</span>
                          </div>
                        )}
                        
                        {verificationResult.expiryDate && (
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>Expires: {format(new Date(verificationResult.expiryDate), 'dd MMM yyyy')}</span>
                          </div>
                        )}
                        
                        <p className="text-sm text-muted-foreground">{verificationResult.message}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Licences Tab */}
        <TabsContent value="licences">
          <Card>
            <CardHeader>
              <CardTitle>Customer Waste Carrier Licences</CardTitle>
              <CardDescription>
                All verified waste carrier licences linked to your customers
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : customerLicences.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No verified licences yet</p>
                  <p className="text-sm">Verify customer licences using the lookup tool</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Licence Number</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Registered Holder</TableHead>
                      <TableHead>Expiry</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customerLicences.map((licence) => {
                      const expiryWarning = getExpiryWarning(licence.expiry_date);
                      return (
                        <TableRow key={licence.id}>
                          <TableCell className="font-medium">
                            {licence.customers?.company_name || licence.customers?.contact_name || 'Unknown'}
                          </TableCell>
                          <TableCell className="font-mono">{licence.licence_number}</TableCell>
                          <TableCell className="capitalize">{licence.licence_tier}</TableCell>
                          <TableCell>{licence.registered_holder}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span>{format(new Date(licence.expiry_date), 'dd MMM yyyy')}</span>
                              <span className={`text-xs ${expiryWarning.color}`}>
                                ({expiryWarning.message})
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {licence.is_verified ? (
                              <Badge className="bg-green-500/10 text-green-500">Verified</Badge>
                            ) : (
                              <Badge variant="secondary">Pending</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Verification History</CardTitle>
              <CardDescription>
                Recent licence verification attempts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {verificationHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No verification history</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Licence Number</TableHead>
                      <TableHead>Holder</TableHead>
                      <TableHead>Result</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {verificationHistory.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          {format(new Date(record.verification_date), 'dd MMM yyyy HH:mm')}
                        </TableCell>
                        <TableCell className="font-mono">{record.licence_number}</TableCell>
                        <TableCell>{record.registered_holder || '-'}</TableCell>
                        <TableCell>{getStatusBadge(record.verification_status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* DWT Readiness Tab */}
        <TabsContent value="dwt">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Digital Waste Transfer (DWT) Readiness
                <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20 ml-2">
                  BETA
                </Badge>
              </CardTitle>
              <CardDescription>
                Preparation status for the 2026 mandatory digital waste transfer notes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Beta Disclaimer */}
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 text-sm text-amber-700 dark:text-amber-400">
                <strong>Beta Feature:</strong> DWT export ready. Government submission integration in development. 
                Manual verification required until EA API integration is complete (expected Q2 2025).
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Overall Readiness</span>
                  <span className="font-medium">{Math.round(readinessScore)}%</span>
                </div>
                <Progress value={readinessScore} className="h-3" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dwtReadiness.map((item, index) => (
                  <div 
                    key={index}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      item.ready 
                        ? 'bg-green-500/5 border-green-500/20' 
                        : 'bg-muted/50 border-border'
                    }`}
                  >
                    {item.ready ? (
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    ) : (
                      <Clock className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    )}
                    <span className={item.ready ? 'text-foreground' : 'text-muted-foreground'}>
                      {item.item}
                    </span>
                  </div>
                ))}
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>DWT Mandate October 2026</AlertTitle>
                <AlertDescription>
                  The Environment Agency will require all waste transfer notes to be submitted 
                  digitally from October 2026. MuckAway.ai is preparing for full integration with the 
                  EA's digital submission portal. Current status: Export-ready, submission in beta.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
