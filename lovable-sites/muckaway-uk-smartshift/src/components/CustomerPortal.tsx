import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Mail, 
  Calendar, 
  FileText, 
  Download, 
  Eye, 
  Truck,
  MapPin,
  Clock,
  Plus
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Customer {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  address: string;
  postcode: string;
  created_at: string;
}

interface PortalAccess {
  id: string;
  customer_id: string;
  access_token: string;
  email: string;
  active: boolean;
  last_login: string;
  created_at: string;
}

interface Job {
  id: string;
  customer_id: string;
  spoil_type: string;
  contamination_level: string;
  estimated_tonnage: number;
  quote_amount: number;
  status: string;
  scheduled_date: string;
  completed_date: string;
  created_at: string;
  site_name?: string;
}

export const CustomerPortal = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [portalAccess, setPortalAccess] = useState<PortalAccess[]>([]);
  const [customerJobs, setCustomerJobs] = useState<{ [key: string]: Job[] }>({});
  const [loading, setLoading] = useState(true);
  const [showCreateAccess, setShowCreateAccess] = useState(false);
  const { toast } = useToast();

  const [newAccess, setNewAccess] = useState({
    customer_id: "",
    email: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load customers
      const { data: customersData, error: customersError } = await supabase
        .from("customers")
        .select("*")
        .order("company_name");

      if (customersError) {
        console.error("Error loading customers:", customersError);
      } else {
        setCustomers(customersData || []);
      }

      // Load portal access
      const { data: accessData, error: accessError } = await supabase
        .from("customer_portal_access")
        .select("*")
        .order("created_at", { ascending: false });

      if (accessError) {
        console.error("Error loading portal access:", accessError);
      } else {
        setPortalAccess(accessData || []);
      }

      // Load jobs for each customer
      const { data: jobsData, error: jobsError } = await supabase
        .from("jobs")
        .select(`
          *,
          sites(name)
        `)
        .order("created_at", { ascending: false });

      if (jobsError) {
        console.error("Error loading jobs:", jobsError);
      } else {
        // Group jobs by customer
        const jobsByCustomer: { [key: string]: Job[] } = {};
        jobsData?.forEach(job => {
          if (!jobsByCustomer[job.customer_id]) {
            jobsByCustomer[job.customer_id] = [];
          }
          jobsByCustomer[job.customer_id].push({
            ...job,
            site_name: job.sites?.name
          });
        });
        setCustomerJobs(jobsByCustomer);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const createPortalAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Generate cryptographically secure access token
      const accessToken = crypto.randomUUID();
      
      // Hash the token before storing (using SubtleCrypto)
      const encoder = new TextEncoder();
      const data = encoder.encode(accessToken);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const tokenHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      // Calculate expiry date (30 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
      
      const { error } = await supabase
        .from("customer_portal_access")
        .insert({
          customer_id: newAccess.customer_id,
          email: newAccess.email,
          access_token: accessToken, // Keep original for immediate display
          token_hash: tokenHash,
          expires_at: expiresAt.toISOString(),
          active: true
        });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to create portal access",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: "Portal access created successfully. Token expires in 30 days.",
      });

      setNewAccess({ customer_id: "", email: "" });
      setShowCreateAccess(false);
      loadData();
    } catch (error) {
      console.error("Error creating portal access:", error);
    }
  };

  const togglePortalAccess = async (accessId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("customer_portal_access")
        .update({ active: !currentStatus })
        .eq("id", accessId);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update portal access",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: `Portal access ${!currentStatus ? 'activated' : 'deactivated'}`,
      });

      loadData();
    } catch (error) {
      console.error("Error updating portal access:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "quote":
        return "bg-muted text-muted-foreground";
      case "booked":
        return "bg-primary/10 text-primary";
      case "in_progress":
        return "bg-accent/10 text-accent";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getCustomerName = (customerId: string) => {
    return customers.find(c => c.id === customerId)?.company_name || "Unknown Customer";
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading customer portal data...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Customer Portal</h1>
          <p className="text-muted-foreground">Manage customer access and self-service capabilities</p>
        </div>
        <Button variant="action" onClick={() => setShowCreateAccess(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Grant Access
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-card border-border shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{customers.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Portal Access</CardTitle>
            <Eye className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{portalAccess.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Access</CardTitle>
            <Mail className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {portalAccess.filter(a => a.active).length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {Object.values(customerJobs).reduce((sum, jobs) => sum + jobs.length, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="access" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="access">Portal Access</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="access" className="space-y-6">
          <div className="space-y-4">
            {portalAccess.map((access) => {
              const customer = customers.find(c => c.id === access.customer_id);
              const customerJobCount = customerJobs[access.customer_id]?.length || 0;
              
              return (
                <Card key={access.id} className="bg-card border-border shadow-card">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="h-5 w-5 text-primary" />
                          {customer?.company_name || "Unknown Customer"}
                        </CardTitle>
                        <CardDescription>
                          {access.email} • Created {new Date(access.created_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={access.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                          {access.active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <span className="text-muted-foreground text-sm">Customer:</span>
                        <div className="font-semibold">{customer?.contact_name}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-sm">Email:</span>
                        <div className="font-semibold">{customer?.email}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-sm">Jobs:</span>
                        <div className="font-semibold">{customerJobCount}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-sm">Last Login:</span>
                        <div className="font-semibold">
                          {access.last_login ? new Date(access.last_login).toLocaleDateString() : "Never"}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant={access.active ? "outline" : "action"}
                        size="sm"
                        onClick={() => togglePortalAccess(access.id, access.active)}
                      >
                        {access.active ? "Deactivate" : "Activate"}
                      </Button>
                      <Button variant="outline" size="sm">
                        <Mail className="w-3 h-3 mr-1" />
                        Send Invite
                      </Button>
                      <Button variant="outline" size="sm">
                        <Eye className="w-3 h-3 mr-1" />
                        View Portal
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {portalAccess.length === 0 && (
              <Card className="bg-card border-border shadow-card">
                <CardContent className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No portal access granted yet</p>
                  <Button variant="action" className="mt-4" onClick={() => setShowCreateAccess(true)}>
                    Grant First Access
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          <div className="space-y-4">
            {customers.map((customer) => {
              const hasPortalAccess = portalAccess.some(a => a.customer_id === customer.id);
              const jobs = customerJobs[customer.id] || [];
              
              return (
                <Card key={customer.id} className="bg-card border-border shadow-card">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="h-5 w-5 text-primary" />
                          {customer.company_name}
                        </CardTitle>
                        <CardDescription>
                          {customer.contact_name} • {customer.email}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {hasPortalAccess ? (
                          <Badge className="bg-green-100 text-green-800">Portal Access</Badge>
                        ) : (
                          <Badge className="bg-muted text-muted-foreground">No Access</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <span className="text-muted-foreground text-sm">Phone:</span>
                        <div className="font-semibold">{customer.phone || "N/A"}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-sm">Postcode:</span>
                        <div className="font-semibold">{customer.postcode}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-sm">Total Jobs:</span>
                        <div className="font-semibold">{jobs.length}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-sm">Customer Since:</span>
                        <div className="font-semibold">{new Date(customer.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>

                    {!hasPortalAccess && (
                      <Button
                        variant="action"
                        size="sm"
                        onClick={() => {
                          setNewAccess({ customer_id: customer.id, email: customer.email });
                          setShowCreateAccess(true);
                        }}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Grant Portal Access
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <div className="space-y-4">
            {Object.entries(customerJobs).map(([customerId, jobs]) => {
              const customer = customers.find(c => c.id === customerId);
              if (!customer || jobs.length === 0) return null;
              
              return (
                <Card key={customerId} className="bg-card border-border shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="h-5 w-5 text-primary" />
                      {customer.company_name}
                    </CardTitle>
                    <CardDescription>Recent job activity</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {jobs.slice(0, 3).map((job) => (
                        <div key={job.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className={getStatusColor(job.status)}>
                                {job.status.replace("_", " ")}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {job.spoil_type} • {job.estimated_tonnage}t
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {job.site_name || "Site"}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(job.created_at).toLocaleDateString()}
                              </span>
                              <span>£{job.quote_amount}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                      {jobs.length > 3 && (
                        <div className="text-center text-sm text-muted-foreground">
                          +{jobs.length - 3} more jobs
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Access Modal */}
      {showCreateAccess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md bg-card border-border shadow-card">
            <CardHeader>
              <CardTitle>Grant Portal Access</CardTitle>
              <CardDescription>Allow customer to access their jobs and documents</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={createPortalAccess} className="space-y-4">
                <div>
                  <Label htmlFor="customer_id">Customer</Label>
                  <select
                    id="customer_id"
                    value={newAccess.customer_id}
                    onChange={(e) => setNewAccess({...newAccess, customer_id: e.target.value})}
                    className="w-full p-2 border border-border rounded-md bg-input"
                    required
                  >
                    <option value="">Select customer</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.company_name} - {customer.contact_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newAccess.email}
                    onChange={(e) => setNewAccess({...newAccess, email: e.target.value})}
                    className="bg-input border-border"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" variant="action" className="flex-1">
                    Grant Access
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowCreateAccess(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};