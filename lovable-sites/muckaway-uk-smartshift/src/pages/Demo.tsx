import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, Truck, FileText, Users, MapPin, Clock, 
  CalendarDays, Building2, Leaf, Link2, CreditCard, 
  AlertCircle, CheckCircle, TrendingUp, Camera
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

// Sample demo data
const DEMO_STATS = {
  totalJobs: 47,
  activeJobs: 12,
  completedJobs: 32,
  totalTonnage: 2450.5
};

const DEMO_JOBS = [
  {
    id: "demo-1",
    spoil_type: "Topsoil",
    contamination_level: "Clean",
    estimated_tonnage: 150,
    quote_amount: 2250,
    status: "completed",
    scheduled_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    site_name: "Canary Wharf Tower",
    customer_name: "BuildCorp Ltd"
  },
  {
    id: "demo-2",
    spoil_type: "Mixed C&D",
    contamination_level: "Low",
    estimated_tonnage: 280,
    quote_amount: 5600,
    status: "in_progress",
    scheduled_date: new Date().toISOString(),
    site_name: "King's Cross Development",
    customer_name: "Metro Construction"
  },
  {
    id: "demo-3",
    spoil_type: "Clay",
    contamination_level: "Clean",
    estimated_tonnage: 95,
    quote_amount: 1425,
    status: "booked",
    scheduled_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    site_name: "Stratford Olympic Park",
    customer_name: "Thames Builders"
  },
  {
    id: "demo-4",
    spoil_type: "Concrete",
    contamination_level: "Medium",
    estimated_tonnage: 420,
    quote_amount: 12600,
    status: "quote",
    scheduled_date: null,
    site_name: "Westminster Bridge",
    customer_name: "Heritage Demolition"
  }
];

const DEMO_VEHICLES = [
  { reg: "MA24 ABC", type: "8-Wheeler Tipper", status: "Active", driver: "John Smith" },
  { reg: "MA23 DEF", type: "Grab Lorry", status: "Active", driver: "Sarah Jones" },
  { reg: "MA22 GHI", type: "Skip Wagon", status: "Maintenance", driver: "Unassigned" }
];

export const Demo = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'fleet' | 'jobs'>('dashboard');

  const handleDemoAction = (action: string) => {
    toast({
      title: "Demo Mode",
      description: `This is a demo. "${action}" would be available in the full platform.`,
    });
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
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Demo Banner */}
        <div className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-lg p-4 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-primary" />
            <div>
              <h2 className="font-semibold text-foreground">Interactive Demo Mode</h2>
              <p className="text-sm text-muted-foreground">Explore the platform with sample data. No login required.</p>
            </div>
          </div>
          <Button asChild>
            <Link to="/auth">Sign Up for Full Access</Link>
          </Button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8">
          <Button 
            variant={activeTab === 'dashboard' ? 'default' : 'outline'}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </Button>
          <Button 
            variant={activeTab === 'fleet' ? 'default' : 'outline'}
            onClick={() => setActiveTab('fleet')}
          >
            Fleet
          </Button>
          <Button 
            variant={activeTab === 'jobs' ? 'default' : 'outline'}
            onClick={() => setActiveTab('jobs')}
          >
            Jobs
          </Button>
        </div>

        {activeTab === 'dashboard' && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="bg-card border-border shadow-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
                  <FileText className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">{DEMO_STATS.totalJobs}</div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-green-500" />
                    +12% this month
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border shadow-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
                  <Clock className="h-4 w-4 text-accent" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-accent">{DEMO_STATS.activeJobs}</div>
                  <p className="text-xs text-muted-foreground">In progress today</p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border shadow-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed Jobs</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{DEMO_STATS.completedJobs}</div>
                  <p className="text-xs text-muted-foreground">This quarter</p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border shadow-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Tonnage</CardTitle>
                  <Truck className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">{DEMO_STATS.totalTonnage.toFixed(1)}t</div>
                  <p className="text-xs text-muted-foreground">Moved this quarter</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="bg-card border-border shadow-card hover:shadow-construction transition-shadow cursor-pointer"
                    onClick={() => handleDemoAction("AI Quote Generation")}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5 text-primary" />
                    AI Spoil Classifier
                  </CardTitle>
                  <CardDescription>
                    Upload a photo for instant AI classification and quote
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="default" className="w-full">
                    Try AI Classification
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-card border-border shadow-card hover:shadow-construction transition-shadow cursor-pointer"
                    onClick={() => handleDemoAction("Fleet Management")}>
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
                  <Button variant="outline" className="w-full" onClick={() => setActiveTab('fleet')}>
                    View Fleet
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-card border-border shadow-card hover:shadow-construction transition-shadow cursor-pointer"
                    onClick={() => handleDemoAction("Compliance Documents")}>
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
                  <Button variant="outline" className="w-full">
                    View Documents
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Recent Jobs */}
            <Card className="bg-card border-border shadow-card">
              <CardHeader>
                <CardTitle>Recent Jobs</CardTitle>
                <CardDescription>Sample job data for demonstration</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {DEMO_JOBS.map((job) => (
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
                            {job.site_name}
                          </span>
                          <span>{job.estimated_tonnage}t</span>
                          <span>£{job.quote_amount.toLocaleString()}</span>
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
              </CardContent>
            </Card>
          </>
        )}

        {activeTab === 'fleet' && (
          <Card className="bg-card border-border shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary" />
                Fleet Overview
              </CardTitle>
              <CardDescription>Sample vehicle data for demonstration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {DEMO_VEHICLES.map((vehicle) => (
                  <div key={vehicle.reg} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-foreground">{vehicle.reg}</span>
                        <Badge variant={vehicle.status === 'Active' ? 'default' : 'secondary'}>
                          {vehicle.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {vehicle.type} • Driver: {vehicle.driver}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleDemoAction(`View ${vehicle.reg}`)}>
                      View Details
                    </Button>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex gap-4">
                <Button onClick={() => handleDemoAction("Add Vehicle")}>Add Vehicle</Button>
                <Button variant="outline" onClick={() => handleDemoAction("Add Driver")}>Add Driver</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'jobs' && (
          <Card className="bg-card border-border shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                All Jobs
              </CardTitle>
              <CardDescription>Full job listing with filters and search</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {DEMO_JOBS.map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={getStatusColor(job.status)}>
                          {job.status.replace("_", " ")}
                        </Badge>
                        <span className="font-medium text-foreground">{job.customer_name}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {job.site_name}
                        </span>
                        <span>{job.spoil_type}</span>
                        <span>{job.estimated_tonnage}t</span>
                        <span className="font-medium text-foreground">£{job.quote_amount.toLocaleString()}</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleDemoAction(`View Job ${job.id}`)}>
                      View
                    </Button>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <Button className="w-full" onClick={() => handleDemoAction("Create New Quote")}>
                  Create New Quote
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* CTA Section */}
        <div className="mt-12 text-center bg-gradient-to-r from-primary/5 to-accent/5 rounded-xl p-8 border border-primary/20">
          <h2 className="text-2xl font-bold text-foreground mb-4">Ready to Get Started?</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Sign up now to access the full platform with AI-powered spoil classification, 
            automated compliance, and real-time fleet management.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" asChild>
              <Link to="/auth">Start Free Trial</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/pricing">View Pricing</Link>
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
