import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { 
  Users, 
  FileCheck, 
  Shield, 
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Mail,
  Globe,
  Calendar
} from "lucide-react";

export default function Admin() {
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  
  const { data: stats, isLoading: statsLoading } = trpc.admin.getAdminStats.useQuery();
  const { data: applications, refetch: refetchApplications } = trpc.admin.getApplications.useQuery({
    status: statusFilter === 'all' ? undefined : statusFilter,
    limit: 50
  });
  const { data: analysts } = trpc.admin.getCertifiedAnalysts.useQuery();
  const { data: sessions } = trpc.admin.getCouncilSessions.useQuery();

  const approveApplication = trpc.admin.approveApplication.useMutation({
    onSuccess: () => {
      toast.success("Application approved!");
      refetchApplications();
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const rejectApplication = trpc.admin.rejectApplication.useMutation({
    onSuccess: () => {
      toast.success("Application rejected");
      refetchApplications();
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const handleApprove = (id: number) => {
    approveApplication.mutate({ id });
  };

  const handleReject = (id: number) => {
    rejectApplication.mutate({ id });
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage LOI applications, analysts, and council sessions</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.pendingApplications || 0}</p>
                  <p className="text-xs text-muted-foreground">Pending LOIs</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.totalUsers || 0}</p>
                  <p className="text-xs text-muted-foreground">Total Users</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <FileCheck className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.certifiedAnalysts || 0}</p>
                  <p className="text-xs text-muted-foreground">Certified</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.pendingApplications || 0}</p>
                  <p className="text-xs text-muted-foreground">Pending Apps</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.activeSessions || 0}</p>
                  <p className="text-xs text-muted-foreground">Active Sessions</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="applications" className="space-y-6">
          <TabsList>
            <TabsTrigger value="applications">LOI Applications</TabsTrigger>
            <TabsTrigger value="analysts">Certified Analysts</TabsTrigger>
            <TabsTrigger value="sessions">Council Sessions</TabsTrigger>
          </TabsList>

          {/* Applications Tab */}
          <TabsContent value="applications">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Watchdog Applications</CardTitle>
                  <div className="flex gap-2">
                    {(["all", "pending", "approved", "rejected"] as const).map((status) => (
                      <Button
                        key={status}
                        variant={statusFilter === status ? "default" : "outline"}
                        size="sm"
                        onClick={() => setStatusFilter(status)}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {!applications || applications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No applications found
                  </div>
                ) : (
                  <div className="space-y-4">
                    {applications.map((app: any) => (
                      <div key={app.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold">{app.name || app.userName}</h3>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                              <span className="flex items-center gap-1">
                                <Mail className="w-4 h-4" />
                                {app.email}
                              </span>
                              {app.country && (
                                <span className="flex items-center gap-1">
                                  <Globe className="w-4 h-4" />
                                  {app.country}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(app.createdAt || app.appliedAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <Badge variant={
                            app.status === "approved" ? "default" :
                            app.status === "rejected" ? "destructive" :
                            app.status === "pending" ? "secondary" : "outline"
                          }>
                            {app.status}
                          </Badge>
                        </div>

                        {app.motivation && (
                          <div className="bg-muted/50 rounded p-3 mb-3">
                            <p className="text-sm text-muted-foreground">
                              <strong>Motivation:</strong> {app.motivation}
                            </p>
                          </div>
                        )}

                        {app.experience && (
                          <div className="bg-muted/50 rounded p-3 mb-3">
                            <p className="text-sm text-muted-foreground">
                              <strong>Experience:</strong> {app.experience}
                            </p>
                          </div>
                        )}

                        {app.status === "pending" && (
                          <div className="flex gap-2 mt-3">
                            <Button 
                              size="sm" 
                              onClick={() => handleApprove(app.id)}
                              disabled={approveApplication.isPending}
                              className="gap-1"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Approve
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleReject(app.id)}
                              disabled={rejectApplication.isPending}
                              className="gap-1"
                            >
                              <XCircle className="w-4 h-4" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analysts Tab */}
          <TabsContent value="analysts">
            <Card>
              <CardHeader>
                <CardTitle>Certified Watchdog Analysts</CardTitle>
              </CardHeader>
              <CardContent>
                {!analysts || analysts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No certified analysts yet
                  </div>
                ) : (
                  <div className="space-y-4">
                    {analysts.map((analyst: any) => (
                      <div key={analyst.id} className="border rounded-lg p-4 flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{analyst.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {analyst.certificateNumber ? `#${analyst.certificateNumber}` : `Cases: ${analyst.casesCompleted}`}
                            {analyst.accuracy && ` | Accuracy: ${analyst.accuracy}%`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Certifications: {analyst.certifications?.join(', ') || 'N/A'}
                            {analyst.issuedAt && ` | Issued: ${new Date(analyst.issuedAt).toLocaleDateString()}`}
                          </p>
                        </div>
                        <Badge variant="default">Certified</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sessions Tab */}
          <TabsContent value="sessions">
            <Card>
              <CardHeader>
                <CardTitle>Council Voting Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                {!sessions || sessions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No council sessions yet
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sessions.map((session: any) => (
                      <div key={session.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold">{session.title || session.subjectTitle}</h3>
                            <p className="text-sm text-muted-foreground">
                              Type: {session.type || session.subjectType} | Votes: {session.votes || 0}
                            </p>
                          </div>
                          <Badge variant={
                            session.status === "completed" ? "default" :
                            session.status === "voting" || session.status === "in_progress" ? "secondary" :
                            session.status === "escalated_to_human" ? "destructive" : "outline"
                          }>
                            {session.status?.replace(/_/g, " ") || "Unknown"}
                          </Badge>
                        </div>
                        {session.finalDecision && (
                          <p className="text-sm">
                            <strong>Decision:</strong> {session.finalDecision}
                          </p>
                        )}
                        {session.consensus !== undefined && (
                          <p className="text-sm">
                            <strong>Consensus:</strong> {session.consensus ? 'Yes' : 'No'}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          Created: {new Date(session.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
