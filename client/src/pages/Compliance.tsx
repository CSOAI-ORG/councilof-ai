/*
 * COAI Compliance Page
 * Multi-framework compliance status and gap analysis
 * Connected to real backend API with PDF report generation
 */

import { motion } from "framer-motion";
import { FileCheck, AlertCircle, CheckCircle2, Clock, Loader2, PlayCircle, FileDown, Mail, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

// Fallback framework data for display
const defaultFrameworks = [
  {
    id: 1,
    code: "EU_AI_ACT",
    name: "EU AI Act",
    fullName: "Regulation 2024/1689",
    description: "European Union AI regulation",
    score: 72,
    status: "In Progress",
    deadline: "August 2026",
    requirements: { total: 113, completed: 81, inProgress: 20, notStarted: 12 },
    gaps: ["Human oversight documentation", "Technical documentation", "Risk management system"],
  },
  {
    id: 2,
    code: "NIST_RMF",
    name: "NIST AI RMF",
    fullName: "AI 100-1",
    description: "US National Institute of Standards and Technology AI Risk Management Framework",
    score: 85,
    status: "Compliant",
    deadline: "Voluntary",
    requirements: { total: 72, completed: 61, inProgress: 8, notStarted: 3 },
    gaps: ["Continuous monitoring metrics", "Stakeholder engagement records"],
  },
  {
    id: 3,
    code: "TC260",
    name: "TC260",
    fullName: "AI Safety Framework 2.0",
    description: "China's National Information Security Standardization Technical Committee",
    score: 68,
    status: "In Progress",
    deadline: "Q2 2025",
    requirements: { total: 56, completed: 38, inProgress: 12, notStarted: 6 },
    gaps: ["Content traceability", "Algorithm registration", "Security assessment"],
  },
];

export default function Compliance() {
  const [assessmentDialogOpen, setAssessmentDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [selectedSystem, setSelectedSystem] = useState<string>("");
  const [selectedFramework, setSelectedFramework] = useState<string>("");
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<number | null>(null);
  const [emailRecipient, setEmailRecipient] = useState("");
  const [reportOptions, setReportOptions] = useState({
    includeEvidence: true,
    includeRecommendations: true,
  });

  // Fetch frameworks from API
  const { data: apiFrameworks, isLoading: frameworksLoading } = trpc.compliance.getFrameworks.useQuery();
  const { data: summary } = trpc.compliance.getSummary.useQuery();
  const { data: aiSystems } = trpc.aiSystems.list.useQuery();
  const { data: assessmentsData } = trpc.compliance.getAssessments.useQuery({});

  // Generate report mutation
  const generateReportMutation = trpc.compliance.generateReport.useMutation({
    onSuccess: (data) => {
      // Download the PDF
      const link = document.createElement("a");
      link.href = `data:application/pdf;base64,${data.pdf}`;
      link.download = data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Report downloaded successfully!");
      setReportDialogOpen(false);
    },
    onError: (error) => {
      toast.error("Failed to generate report", { description: error.message });
    },
  });

  // Create assessment mutation
  const createAssessmentMutation = trpc.compliance.createAssessment.useMutation({
    onSuccess: (data) => {
      toast.success(`Assessment completed! Score: ${data.overallScore}%`, {
        description: `${data.compliantCount} compliant, ${data.partialCount} partial, ${data.nonCompliantCount} non-compliant`,
      });
      setAssessmentDialogOpen(false);
      setSelectedSystem("");
      setSelectedFramework("");
    },
    onError: (error) => {
      toast.error("Failed to run assessment", { description: error.message });
    },
  });

  // Send report mutation
  const sendReportMutation = trpc.compliance.sendReport.useMutation({
    onSuccess: (data) => {
      toast.success("Report sent successfully!", {
        description: data.previewUrl ? "Check your email for the report." : "Email sent.",
      });
      setEmailDialogOpen(false);
      setEmailRecipient("");
    },
    onError: (error) => {
      toast.error("Failed to send report", { description: error.message });
    },
  });

  // Use API frameworks if available, otherwise fallback
  const frameworks = apiFrameworks && apiFrameworks.length > 0 
    ? apiFrameworks.map(fw => ({
        ...fw,
        fullName: fw.version || fw.name,
        score: 75, // Would come from assessments
        status: "In Progress",
        deadline: "2026",
        requirements: { total: 50, completed: 30, inProgress: 15, notStarted: 5 },
        gaps: ["Documentation pending", "Review required"],
      }))
    : defaultFrameworks;

  // Get assessments list for the dropdown
  const assessments = assessmentsData?.map(a => ({
    id: a.assessment.id,
    aiSystemName: a.aiSystem?.name || "Unknown System",
    frameworkName: a.framework?.name || "Unknown Framework",
    frameworkCode: a.framework?.code || "",
    score: a.assessment.overallScore,
    status: a.assessment.status,
  })) || [];

  const handleRunAssessment = () => {
    if (!selectedSystem || !selectedFramework) {
      toast.error("Please select an AI system and framework");
      return;
    }
    
    createAssessmentMutation.mutate({
      aiSystemId: parseInt(selectedSystem),
      frameworkId: parseInt(selectedFramework),
    });
  };

  const handleGenerateReport = () => {
    if (!selectedAssessmentId) {
      toast.error("Please select an assessment");
      return;
    }
    generateReportMutation.mutate({
      assessmentId: selectedAssessmentId,
      ...reportOptions,
    });
  };

  const handleSendReport = () => {
    if (!selectedAssessmentId || !emailRecipient) {
      toast.error("Please select an assessment and enter an email");
      return;
    }
    sendReportMutation.mutate({
      assessmentId: selectedAssessmentId,
      email: emailRecipient,
      ...reportOptions,
    });
  };

  if (frameworksLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold font-primary">Compliance</h1>
            <p className="text-muted-foreground text-sm">
              Track compliance across multiple AI safety frameworks
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setReportDialogOpen(true)} className="gap-2">
              <FileDown className="h-4 w-4" />
              Generate Report
            </Button>
            <Button onClick={() => setAssessmentDialogOpen(true)} className="gap-2">
              <PlayCircle className="h-4 w-4" />
              Run Assessment
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{summary.totalSystems}</div>
                <div className="text-sm text-muted-foreground">Total Systems</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">{summary.compliantSystems}</div>
                <div className="text-sm text-muted-foreground">Compliant</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-amber-600">{summary.pendingAssessments}</div>
                <div className="text-sm text-muted-foreground">Pending Reviews</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{summary.overallScore}%</div>
                <div className="text-sm text-muted-foreground">Overall Score</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Frameworks */}
        <div className="space-y-4">
          {frameworks.map((fw, idx) => (
            <motion.div
              key={fw.id || fw.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: idx * 0.05 }}
            >
              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-secondary">
                        <FileCheck className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <CardTitle className="text-base font-medium">
                          {fw.name}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">{fw.fullName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="outline"
                        className={
                          fw.status === "Compliant"
                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                            : "bg-amber-500/10 text-amber-500 border-amber-500/30"
                        }
                      >
                        {fw.status}
                      </Badge>
                      <div className="text-right">
                        <p className="text-2xl font-semibold">{fw.score}%</p>
                        <p className="text-xs text-muted-foreground">Deadline: {fw.deadline}</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Requirements Progress</span>
                      <span>{fw.requirements.completed}/{fw.requirements.total} completed</span>
                    </div>
                    <Progress value={(fw.requirements.completed / fw.requirements.total) * 100} className="h-2" />
                  </div>

                  {/* Requirements Breakdown */}
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      <span>{fw.requirements.completed} Completed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-amber-500" />
                      <span>{fw.requirements.inProgress} In Progress</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                      <span>{fw.requirements.notStarted} Not Started</span>
                    </div>
                  </div>

                  {/* Gaps */}
                  {fw.gaps && fw.gaps.length > 0 && (
                    <div className="pt-2 border-t border-border">
                      <p className="text-sm font-medium mb-2">Key Gaps</p>
                      <div className="flex flex-wrap gap-2">
                        {fw.gaps.map((gap) => (
                          <Badge key={gap} variant="secondary" className="text-xs">
                            {gap}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Run Assessment Dialog */}
      <Dialog open={assessmentDialogOpen} onOpenChange={setAssessmentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Run Compliance Assessment</DialogTitle>
            <DialogDescription>
              Select an AI system and framework to run a compliance assessment.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>AI System</Label>
              <Select value={selectedSystem} onValueChange={setSelectedSystem}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an AI system" />
                </SelectTrigger>
                <SelectContent>
                  {aiSystems?.map((system) => (
                    <SelectItem key={system.id} value={system.id.toString()}>
                      {system.name}
                    </SelectItem>
                  ))}
                  {(!aiSystems || aiSystems.length === 0) && (
                    <SelectItem value="none" disabled>
                      No AI systems registered
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Framework</Label>
              <Select value={selectedFramework} onValueChange={setSelectedFramework}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a framework" />
                </SelectTrigger>
                <SelectContent>
                  {frameworks.map((fw) => (
                    <SelectItem key={fw.id || fw.name} value={fw.name}>
                      {fw.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssessmentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRunAssessment}>
              Run Assessment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate Report Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileDown className="h-5 w-5" />
              Generate Compliance Report
            </DialogTitle>
            <DialogDescription>
              Select an assessment and configure report options.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Assessment</Label>
              <Select 
                value={selectedAssessmentId?.toString() || ""} 
                onValueChange={(v) => setSelectedAssessmentId(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an assessment" />
                </SelectTrigger>
                <SelectContent>
                  {assessments.length > 0 ? (
                    assessments.map((a) => (
                      <SelectItem key={a.id} value={a.id.toString()}>
                        {a.aiSystemName} - {a.frameworkName}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      No assessments available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Report Options</Label>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="includeEvidence"
                  checked={reportOptions.includeEvidence}
                  onCheckedChange={(checked) => 
                    setReportOptions(prev => ({ ...prev, includeEvidence: !!checked }))
                  }
                />
                <label htmlFor="includeEvidence" className="text-sm">
                  Include evidence documentation
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="includeRecommendations"
                  checked={reportOptions.includeRecommendations}
                  onCheckedChange={(checked) => 
                    setReportOptions(prev => ({ ...prev, includeRecommendations: !!checked }))
                  }
                />
                <label htmlFor="includeRecommendations" className="text-sm">
                  Include recommendations
                </label>
              </div>
            </div>

            {assessments.length === 0 && (
              <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                No assessments found. Run an assessment first to generate a report.
              </div>
            )}
          </div>
          
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setReportDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                if (selectedAssessmentId) {
                  setReportDialogOpen(false);
                  setEmailDialogOpen(true);
                } else {
                  toast.error("Please select an assessment first");
                }
              }}
              disabled={!selectedAssessmentId}
            >
              <Mail className="h-4 w-4 mr-2" />
              Email
            </Button>
            <Button 
              onClick={handleGenerateReport}
              disabled={generateReportMutation.isPending || !selectedAssessmentId}
            >
              {generateReportMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileDown className="h-4 w-4 mr-2" />
                  Download
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Report Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Send Report via Email
            </DialogTitle>
            <DialogDescription>
              Enter the recipient's email address to send the compliance report.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Recipient Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="recipient@example.com"
                value={emailRecipient}
                onChange={(e) => setEmailRecipient(e.target.value)}
              />
            </div>
            
            {selectedAssessmentId && (
              <div className="rounded-lg bg-muted p-3 text-sm">
                <p className="font-medium">Report Details:</p>
                <p className="text-muted-foreground mt-1">
                  {assessments.find(a => a.id === selectedAssessmentId)?.aiSystemName} - {" "}
                  {assessments.find(a => a.id === selectedAssessmentId)?.frameworkName}
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSendReport}
              disabled={sendReportMutation.isPending || !emailRecipient || !emailRecipient.includes("@")}
            >
              {sendReportMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Report
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
