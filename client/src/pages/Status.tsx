import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  TrendingUp,
  Bell,
  RefreshCw
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function Status() {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [email, setEmail] = useState("");

  // Fetch data
  const { data: services, refetch: refetchServices } = trpc.status.getServiceStatus.useQuery();
  const { data: incidents } = trpc.status.getIncidents.useQuery({ limit: 10, includeResolved: false });
  const { data: uptime30 } = trpc.status.getOverallUptime.useQuery({ days: 30 });
  const { data: uptime60 } = trpc.status.getOverallUptime.useQuery({ days: 60 });
  const { data: uptime90 } = trpc.status.getOverallUptime.useQuery({ days: 90 });

  const subscribeMutation = trpc.status.subscribe.useMutation({
    onSuccess: () => {
      toast.success("Subscribed to status updates! Check your email for confirmation.");
      setEmail("");
    },
    onError: (error) => {
      toast.error(`Failed to subscribe: ${error.message}`);
    },
  });

  // Auto-refresh every 60 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      refetchServices();
    }, 60000);
    return () => clearInterval(interval);
  }, [autoRefresh, refetchServices]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "operational":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "degraded":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "partial_outage":
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case "major_outage":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      operational: { variant: "default", label: "Operational" },
      degraded: { variant: "secondary", label: "Degraded" },
      partial_outage: { variant: "destructive", label: "Partial Outage" },
      major_outage: { variant: "destructive", label: "Major Outage" },
    };
    const config = variants[status] || { variant: "outline" as const, label: "Unknown" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getIncidentStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      investigating: { variant: "destructive", label: "Investigating" },
      identified: { variant: "secondary", label: "Identified" },
      monitoring: { variant: "secondary", label: "Monitoring" },
      resolved: { variant: "default", label: "Resolved" },
    };
    const config = variants[status] || { variant: "outline" as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      minor: { variant: "secondary", label: "Minor" },
      major: { variant: "destructive", label: "Major" },
      critical: { variant: "destructive", label: "Critical" },
    };
    const config = variants[severity] || { variant: "outline" as const, label: severity };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const allOperational = services?.every((s) => s.status === "operational");

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">System Status</h1>
              <p className="text-muted-foreground mt-2">
                Real-time status and uptime monitoring for COAI Platform
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  refetchServices();
                  toast.success("Status refreshed");
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Bell className="h-4 w-4 mr-2" />
                    Subscribe to Updates
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Subscribe to Status Updates</DialogTitle>
                    <DialogDescription>
                      Get notified via email when incidents occur or are resolved.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={() => subscribeMutation.mutate({ email })}
                      disabled={!email || subscribeMutation.isPending}
                    >
                      {subscribeMutation.isPending ? "Subscribing..." : "Subscribe"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto py-8 space-y-8">
        {/* Overall Status */}
        <Card className="p-8">
          <div className="flex items-center gap-4">
            {allOperational ? (
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            ) : (
              <AlertTriangle className="h-12 w-12 text-yellow-500" />
            )}
            <div>
              <h2 className="text-2xl font-bold">
                {allOperational ? "All Systems Operational" : "Some Systems Experiencing Issues"}
              </h2>
              <p className="text-muted-foreground">
                {allOperational
                  ? "All services are running smoothly"
                  : "We're working to resolve any issues"}
              </p>
            </div>
          </div>
        </Card>

        {/* Uptime Statistics */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">30-Day Uptime</p>
                <p className="text-3xl font-bold mt-2">{uptime30?.uptime || 0}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              {uptime30?.successfulChecks || 0} / {uptime30?.totalChecks || 0} checks successful
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">60-Day Uptime</p>
                <p className="text-3xl font-bold mt-2">{uptime60?.uptime || 0}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              {uptime60?.successfulChecks || 0} / {uptime60?.totalChecks || 0} checks successful
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">90-Day Uptime</p>
                <p className="text-3xl font-bold mt-2">{uptime90?.uptime || 0}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              {uptime90?.successfulChecks || 0} / {uptime90?.totalChecks || 0} checks successful
            </p>
          </Card>
        </div>

        {/* Active Incidents */}
        {incidents && incidents.length > 0 && (
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4">Active Incidents</h3>
            <div className="space-y-4">
              {incidents.map((incident) => (
                <div
                  key={incident.id}
                  className="border rounded-lg p-4 space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{incident.title}</h4>
                        {getSeverityBadge(incident.severity)}
                        {getIncidentStatusBadge(incident.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {incident.description}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Started: {new Date(incident.startedAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Service Status */}
        <Card className="p-6">
          <h3 className="text-xl font-bold mb-4">Service Status</h3>
          <div className="space-y-3">
            {services?.map((service) => (
              <div
                key={service.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(service.status)}
                  <div>
                    <p className="font-medium">{service.displayName}</p>
                    {service.description && (
                      <p className="text-sm text-muted-foreground">
                        {service.description}
                      </p>
                    )}
                  </div>
                </div>
                {getStatusBadge(service.status)}
              </div>
            ))}
          </div>
        </Card>

        {/* SLA Compliance */}
        <Card className="p-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20">
          <div className="flex items-center gap-4">
            <CheckCircle2 className="h-10 w-10 text-green-500" />
            <div>
              <h3 className="text-xl font-bold">99.9% Uptime SLA</h3>
              <p className="text-muted-foreground">
                We're committed to maintaining enterprise-grade reliability. Current 90-day uptime:{" "}
                <span className="font-bold text-green-600">{uptime90?.uptime || 0}%</span>
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
