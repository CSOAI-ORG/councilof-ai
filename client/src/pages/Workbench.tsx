/*
 * COAI Analyst Workbench
 * Case review interface for certified Watchdog Analysts
 * Connected to real backend API
 */

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Briefcase,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  MessageSquare,
  Eye,
  Trophy,
  TrendingUp,
  Target,
  Timer,
  ChevronRight,
  Send,
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const severityColors: Record<string, string> = {
  low: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  critical: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

const priorityColors: Record<string, string> = {
  low: "border-blue-500",
  medium: "border-yellow-500",
  high: "border-orange-500",
  urgent: "border-red-500",
};

export default function Workbench() {
  const [, setLocation] = useLocation();
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);
  const [decision, setDecision] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<string>("medium");
  const [reasoning, setReasoning] = useState("");
  const [activeTab, setActiveTab] = useState("queue");

  // Fetch data from API
  const { data: myCases, isLoading: casesLoading, refetch: refetchCases } = trpc.workbench.getMyCases.useQuery();
  const { data: performance } = trpc.workbench.getMyPerformance.useQuery();
  const { data: certificates, isLoading: certsLoading } = trpc.certification.getMyCertificates.useQuery();
  
  // Get case details when selected
  const { data: caseDetails, isLoading: detailsLoading } = trpc.workbench.getCaseDetails.useQuery(
    { caseId: selectedCaseId! },
    { enabled: !!selectedCaseId }
  );

  // Submit decision mutation
  const submitDecisionMutation = trpc.workbench.submitDecision.useMutation({
    onSuccess: () => {
      toast.success("Decision submitted successfully!", {
        description: "Your review has been recorded and will contribute to the final outcome.",
      });
      refetchCases();
      setSelectedCaseId(null);
      setDecision(null);
      setReasoning("");
    },
    onError: (error) => {
      toast.error("Failed to submit decision", {
        description: error.message,
      });
    },
  });

  const isCertified = certificates && certificates.length > 0;

  // Split cases into pending and completed - cast to any for flexibility
  const pendingCases = useMemo(() =>
    (myCases as any[])?.filter(c => (c.assignment?.status || c.status) === "assigned" || (c.assignment?.status || c.status) === "in_progress" || (c.assignment?.status || c.status) === "active" || (c.assignment?.status || c.status) === "pending") || [],
    [myCases]
  );

  const completedCases = useMemo(() =>
    (myCases as any[])?.filter(c => (c.assignment?.status || c.status) === "completed") || [],
    [myCases]
  );

  // Loading state
  if (certsLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  // If not certified, show prompt to get certified
  if (!isCertified) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="max-w-2xl mx-auto text-center py-12">
            <div className="w-20 h-20 mx-auto bg-muted rounded-full flex items-center justify-center mb-6">
              <Briefcase className="h-10 w-10 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Certification Required</h1>
            <p className="text-muted-foreground mb-6">
              You need to complete the Watchdog Analyst certification before accessing the workbench.
            </p>
            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={() => setLocation("/training")}>
                Start Training
              </Button>
              <Button onClick={() => setLocation("/certification")}>
                Take Certification Test
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const handleSubmitDecision = () => {
    if (!decision || !reasoning || reasoning.length < 50 || !selectedCaseId) {
      toast.error("Please provide a decision and detailed reasoning (at least 50 characters)");
      return;
    }

    submitDecisionMutation.mutate({
      caseId: selectedCaseId,
      decision: decision as "approve" | "reject" | "escalate" | "request_more_info",
      notes: reasoning,
    });
  };

  const formatTimeRemaining = (dueAt: Date | string | null) => {
    if (!dueAt) return "No deadline";
    const due = new Date(dueAt);
    const now = new Date();
    const diff = due.getTime() - now.getTime();
    
    if (diff < 0) return "Overdue";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 24) return `${hours}h remaining`;
    
    const days = Math.floor(hours / 24);
    return `${days}d remaining`;
  };

  const selectedCase = caseDetails;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Analyst Workbench</h1>
            <p className="text-muted-foreground text-sm">
              Review AI safety cases and contribute to the COAI ecosystem
            </p>
          </div>
          <Badge variant="outline" className="gap-1">
            <Trophy className="h-3 w-3" />
            Certified Analyst
          </Badge>
        </div>

        {/* Performance Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{performance?.casesCompleted || 0}</p>
                  <p className="text-xs text-muted-foreground">Cases Reviewed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{performance?.accuracyRate || "N/A"}%</p>
                  <p className="text-xs text-muted-foreground">Accuracy Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                  <Timer className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{performance?.averageTimeToResolve || "N/A"}</p>
                  <p className="text-xs text-muted-foreground">Avg Resolve Time</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{performance?.qualityScore || "—"}</p>
                  <p className="text-xs text-muted-foreground">Leaderboard Rank</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-3 gap-6">
          {/* Case Queue */}
          <div className="col-span-1 space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full">
                <TabsTrigger value="queue" className="flex-1">Queue ({pendingCases.length})</TabsTrigger>
                <TabsTrigger value="completed" className="flex-1">Completed ({completedCases.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="queue" className="space-y-3 mt-4">
                {casesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : pendingCases.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No cases assigned yet</p>
                    <p className="text-xs mt-1">Check back later for new cases</p>
                  </div>
                ) : (
                  pendingCases.map((caseItem) => (
                    <motion.div
                      key={caseItem.assignment.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card 
                        className={`cursor-pointer transition-all hover:shadow-md border-l-4 ${
                          priorityColors[caseItem.assignment.priority || "medium"]
                        } ${selectedCaseId === caseItem.assignment.id ? "ring-2 ring-primary" : ""}`}
                        onClick={() => setSelectedCaseId(caseItem.assignment.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="font-medium text-sm line-clamp-2">
                              {caseItem.report?.title || "Untitled Case"}
                            </h3>
                            <Badge className={severityColors[caseItem.report?.severity || "medium"]} variant="secondary">
                              {caseItem.report?.severity || "medium"}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTimeRemaining(caseItem.assignment.dueAt)}
                            </span>
                            <span>{caseItem.report?.companyName || "Unknown"}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
                )}
              </TabsContent>

              <TabsContent value="completed" className="mt-4">
                {completedCases.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No completed cases yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {completedCases.map((caseItem) => (
                      <Card key={caseItem.assignment.id} className="opacity-75">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-medium text-sm line-clamp-2">
                              {caseItem.report?.title || "Untitled Case"}
                            </h3>
                            <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Case Detail & Review */}
          <div className="col-span-2">
            {detailsLoading ? (
              <Card className="h-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </Card>
            ) : selectedCase ? (
              <Card className="h-full">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <Badge className={severityColors[selectedCase.report?.severity || "medium"]} variant="secondary">
                        {selectedCase.report?.severity || "medium"} severity
                      </Badge>
                      <CardTitle className="mt-2">{selectedCase.report?.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Reported by user • {selectedCase.report?.companyName || "Unknown Company"}
                      </p>
                    </div>
                    <Badge variant="outline" className="gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTimeRemaining(selectedCase.assignment?.dueAt)}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {/* Incident Description */}
                  <div>
                    <h4 className="font-medium mb-2">Incident Description</h4>
                    <p className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
                      {selectedCase.report?.description || "No description provided."}
                    </p>
                  </div>

                  {/* Council Votes */}
                  {selectedCase.councilVotes && (
                    <div>
                      <h4 className="font-medium mb-3">33-Agent Council Votes</h4>
                      <div className="space-y-2">
                        {(() => {
                          const votes = selectedCase.councilVotes as any;
                          const approveCount = votes.approve || 0;
                          const rejectCount = votes.reject || 0;
                          const escalateCount = votes.escalate || 0;
                          const total = votes.total || 33;
                          
                          return (
                            <>
                              <div className="flex items-center gap-3">
                                <span className="text-sm w-20">Approve</span>
                                <Progress value={(approveCount / total) * 100} className="flex-1 h-2" />
                                <span className="text-sm text-muted-foreground w-8">{approveCount}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-sm w-20">Reject</span>
                                <Progress value={(rejectCount / total) * 100} className="flex-1 h-2" />
                                <span className="text-sm text-muted-foreground w-8">{rejectCount}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-sm w-20">Escalate</span>
                                <Progress value={(escalateCount / total) * 100} className="flex-1 h-2" />
                                <span className="text-sm text-muted-foreground w-8">{escalateCount}</span>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        No consensus reached (22/33 required). Human review needed.
                      </p>
                    </div>
                  )}

                  {/* Your Decision */}
                  <div>
                    <h4 className="font-medium mb-3">Your Decision</h4>
                    <div className="grid grid-cols-4 gap-3 mb-4">
                      <Button
                        variant={decision === "approve" ? "default" : "outline"}
                        className={`flex-col h-auto py-4 ${
                          decision === "approve" ? "bg-green-600 hover:bg-green-700" : ""
                        }`}
                        onClick={() => setDecision("approve")}
                      >
                        <ThumbsUp className="h-5 w-5 mb-1" />
                        <span className="text-xs">Approve</span>
                      </Button>
                      <Button
                        variant={decision === "reject" ? "default" : "outline"}
                        className={`flex-col h-auto py-4 ${
                          decision === "reject" ? "bg-red-600 hover:bg-red-700" : ""
                        }`}
                        onClick={() => setDecision("reject")}
                      >
                        <ThumbsDown className="h-5 w-5 mb-1" />
                        <span className="text-xs">Reject</span>
                      </Button>
                      <Button
                        variant={decision === "escalate" ? "default" : "outline"}
                        className={`flex-col h-auto py-4 ${
                          decision === "escalate" ? "bg-orange-600 hover:bg-orange-700" : ""
                        }`}
                        onClick={() => setDecision("escalate")}
                      >
                        <ArrowUpRight className="h-5 w-5 mb-1" />
                        <span className="text-xs">Escalate</span>
                      </Button>
                      <Button
                        variant={decision === "needs_more_info" ? "default" : "outline"}
                        className={`flex-col h-auto py-4 ${
                          decision === "needs_more_info" ? "bg-blue-600 hover:bg-blue-700" : ""
                        }`}
                        onClick={() => setDecision("needs_more_info")}
                      >
                        <HelpCircle className="h-5 w-5 mb-1" />
                        <span className="text-xs">Need Info</span>
                      </Button>
                    </div>

                    <div className="mb-4">
                      <label className="text-sm font-medium mb-2 block">Confidence Level</label>
                      <Select value={confidence} onValueChange={setConfidence}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low Confidence</SelectItem>
                          <SelectItem value="medium">Medium Confidence</SelectItem>
                          <SelectItem value="high">High Confidence</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Textarea
                      placeholder="Provide your reasoning for this decision (minimum 50 characters)..."
                      value={reasoning}
                      onChange={(e) => setReasoning(e.target.value)}
                      className="min-h-[100px]"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {reasoning.length}/50 characters minimum
                    </p>
                  </div>

                  {/* Submit */}
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={handleSubmitDecision}
                    disabled={!decision || reasoning.length < 50 || submitDecisionMutation.isPending}
                  >
                    {submitDecisionMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Submit Decision
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-full flex items-center justify-center">
                <CardContent className="text-center py-12">
                  <Eye className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-medium text-lg mb-2">Select a Case to Review</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose a case from the queue to view details and submit your decision
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
