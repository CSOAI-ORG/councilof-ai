import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Truck, FileText, Users, MapPin, Clock, CalendarDays, Building2, Leaf, Link2, CreditCard, Shield, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, Link } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import { ComplianceAlertWidget } from "@/components/dashboard/ComplianceAlertWidget";
import { AISuggestionCard } from "@/components/dashboard/AISuggestionCard";
import { UsageMetricsWidget } from "@/components/dashboard/UsageMetricsWidget";
import { WeatherWidget } from "@/components/dashboard/WeatherWidget";
import { DashboardLayout } from "@/components/DashboardLayout";
import OnboardingFlow from "@/components/OnboardingFlow";
import { useOnboarding } from "@/hooks/useOnboarding";

interface DashboardStats {
  totalJobs: number;
  activeJobs: number;
  completedJobs: number;
  totalTonnage: number;
}

interface Job {
  id: string;
  spoil_type: string;
  contamination_level: string;
  estimated_tonnage: number;
  quote_amount: number;
  status: string;
  scheduled_date: string;
  site_name?: string;
  customer_name?: string;
}

export const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalJobs: 0,
    activeJobs: 0,
    completedJobs: 0,
    totalTonnage: 0
  });
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const { showOnboarding, completeOnboarding, restartOnboarding, closeOnboarding } = useOnboarding();

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      
      if (!session?.user) {
        navigate("/auth");
        return;
      }

      // Get user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .single();
      
      setUserProfile(profile);
      await loadDashboardData();
      setLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
        if (!session?.user) {
          navigate("/auth");
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadDashboardData = async () => {
    try {
      if (!user) return;

      // Get customer ID for this user first
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!profile) {
        console.error("No profile found for user");
        return;
      }

      const { data: customer } = await supabase
        .from("customers")
        .select("id")
        .eq("profile_id", profile.id)
        .single();

      if (!customer) {
        console.error("No customer record found");
        return;
      }

      // Load jobs for this customer
      const { data: jobs, error } = await supabase
        .from("jobs")
        .select(`
          *,
          sites(name),
          customers(company_name)
        `)
        .eq("customer_id", customer.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Error loading jobs:", error);
        return;
      }

      // Calculate stats
      const totalJobs = jobs?.length || 0;
      const activeJobs = jobs?.filter(job => job.status === "booked" || job.status === "in_progress").length || 0;
      const completedJobs = jobs?.filter(job => job.status === "completed").length || 0;
      const totalTonnage = jobs?.reduce((sum, job) => sum + (job.estimated_tonnage || 0), 0) || 0;

      setStats({
        totalJobs,
        activeJobs,
        completedJobs,
        totalTonnage
      });

      // Format jobs for display
      const formattedJobs = jobs?.map(job => ({
        id: job.id,
        spoil_type: job.spoil_type,
        contamination_level: job.contamination_level,
        estimated_tonnage: job.estimated_tonnage,
        quote_amount: job.quote_amount,
        status: job.status,
        scheduled_date: job.scheduled_date,
        site_name: job.sites?.name,
        customer_name: job.customers?.company_name
      })) || [];

      setRecentJobs(formattedJobs);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
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

  if (loading) {
    return (
      <DashboardLayout onStartTour={restartOnboarding}>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-lg text-muted-foreground">Loading dashboard...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout onStartTour={restartOnboarding}>
      <OnboardingFlow 
        isOpen={showOnboarding} 
        onClose={closeOnboarding}
        onComplete={completeOnboarding}
      />
      <div className="p-6">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-1">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {userProfile?.contact_name || user?.email}
          </p>
        </div>
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-card border-border shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
              <FileText className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.totalJobs}</div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
              <Clock className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{stats.activeJobs}</div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Jobs</CardTitle>
              <Truck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.completedJobs}</div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tonnage</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.totalTonnage.toFixed(1)}t</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-card border-border shadow-card hover:shadow-construction transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Create New Quote
              </CardTitle>
              <CardDescription>
                Use our AI spoil classifier to generate instant quotes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="default" className="w-full" onClick={() => navigate("/")}>
                Start Quote
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-card hover:shadow-construction transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary" />
                Manage Fleet
              </CardTitle>
              <CardDescription>
                View vehicles, drivers, and job assignments
            </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/fleet">View Fleet</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-card hover:shadow-construction transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Compliance Vault
              </CardTitle>
              <CardDescription>
                Access WTNs, consignment notes, and reports
              </CardDescription>
              </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/hazardous">View Documents</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Phase 2 & 3 Features */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-card border-border shadow-card hover:shadow-construction transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Hazardous Notes
              </CardTitle>
              <CardDescription>
                Manage hazardous consignment documentation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/hazardous">Manage HCN</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-card hover:shadow-construction transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Driver Checks
              </CardTitle>
              <CardDescription>
                Daily HGV inspections and vehicle checks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/driver-checks">View Checks</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-card hover:shadow-construction transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Weighbridge OCR
              </CardTitle>
              <CardDescription>
                Capture and process weighbridge tickets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/weighbridge">Scan Tickets</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-card hover:shadow-construction transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Customer Portal
              </CardTitle>
              <CardDescription>
                Self-service customer access management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/customer-portal">Manage Portal</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Revolutionary AI Features */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20 shadow-card hover:shadow-construction transition-all duration-300 cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Revolutionary Image Analysis
              </CardTitle>
              <CardDescription>
                Batch upload photos for AI-powered spoil analysis with risk assessment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-primary hover:bg-primary/90" asChild>
                <Link to="/ai-tools">Try Now</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-card hover:shadow-construction transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-accent" />
                AI Business Insights
              </CardTitle>
              <CardDescription>
                Demand forecasting and profitability analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/ai-insights">View Insights</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-accent/5 to-primary/5 border-accent/20 shadow-card hover:shadow-construction transition-all duration-300 cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-accent" />
                Voice AI Assistant
              </CardTitle>
              <CardDescription>
                Talk to AI for instant quotes and job booking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-accent hover:bg-accent/90" asChild>
                <Link to="/ai-tools">Talk Now</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-card hover:shadow-construction transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-accent" />
                Predictive Maintenance
              </CardTitle>
              <CardDescription>
                AI-powered fleet maintenance alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/maintenance-alerts">View Alerts</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Operations Hub */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-primary mb-2">Operations Hub</h2>
          <p className="text-muted-foreground mb-6">Manage your fleet, schedule, and business operations</p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
            <WeatherWidget />
            
            <Card className="bg-card border-border shadow-card hover:shadow-construction transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  Schedule
                </CardTitle>
                <CardDescription className="text-sm">
                  Gantt chart planning
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link to="/schedule">View</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-card hover:shadow-construction transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin className="h-5 w-5 text-green-600" />
                  Live Tracking
                </CardTitle>
                <CardDescription className="text-sm">
                  Real-time GPS view
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link to="/live-tracking">Track</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-card hover:shadow-construction transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building2 className="h-5 w-5 text-accent" />
                  Subcontractors
                </CardTitle>
                <CardDescription className="text-sm">
                  Partner network
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link to="/subcontractors">Manage</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-card hover:shadow-construction transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Leaf className="h-5 w-5 text-green-500" />
                  Environmental
                </CardTitle>
                <CardDescription className="text-sm">
                  Sustainability reports
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link to="/environmental">Reports</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-card hover:shadow-construction transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Link2 className="h-5 w-5 text-blue-500" />
                  Integrations
                </CardTitle>
                <CardDescription className="text-sm">
                  QuickBooks & Xero
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link to="/integrations">Connect</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-card hover:shadow-construction transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Credit Limits
                </CardTitle>
                <CardDescription className="text-sm">
                  Customer credit control
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link to="/credit-management">Manage</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-card hover:shadow-construction transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Shield className="h-5 w-5 text-green-600" />
                  GDPR
                </CardTitle>
                <CardDescription className="text-sm">
                  Data compliance
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link to="/gdpr-compliance">Manage</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-card hover:shadow-construction transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Database className="h-5 w-5 text-blue-500" />
                  Anonymization
                </CardTitle>
                <CardDescription className="text-sm">
                  Data protection
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link to="/data-anonymization">View</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Intelligence Widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <UsageMetricsWidget />
          <ComplianceAlertWidget />
          <AISuggestionCard />
        </div>

        {/* Recent Jobs */}
        <Card className="bg-card border-border shadow-card">
          <CardHeader>
            <CardTitle>Recent Jobs</CardTitle>
            <CardDescription>Your latest spoil removal jobs</CardDescription>
          </CardHeader>
          <CardContent>
            {recentJobs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No jobs found. Create your first quote to get started!</p>
                <Button variant="default" className="mt-4" onClick={() => navigate("/")}>
                  Create Quote
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentJobs.map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={getStatusColor(job.status)}>
                          {job.status.replace("_", " ")}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {job.spoil_type} • {job.contamination_level}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {job.site_name || "Site"}
                        </span>
                        <span>{job.estimated_tonnage}t</span>
                        <span>£{job.quote_amount}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">
                        {job.scheduled_date ? new Date(job.scheduled_date).toLocaleDateString() : "Not scheduled"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};