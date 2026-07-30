import {useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import {
  FlaskConical,
  Plus,
  Play,
  Pause,
  CheckCircle2,
  TrendingUp,
  Users,
  Target,
  BarChart3,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ABTesting() {
  useEffect(() => { document.title = "ABTesting | CSOAI"; }, []);
  const { data: experiments, isLoading, refetch } = trpc.abTesting.getExperiments.useQuery();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedExperimentId, setSelectedExperimentId] = useState<number | null>(null);
  
  const { data: experimentDetails } = trpc.abTesting.getExperimentDetails.useQuery(
    { experimentId: selectedExperimentId! },
    { enabled: selectedExperimentId !== null }
  );

  const { data: experimentResults } = trpc.abTesting.getExperimentResults.useQuery(
    { experimentId: selectedExperimentId! },
    { enabled: selectedExperimentId !== null }
  );

  const createMutation = trpc.abTesting.createExperiment.useMutation();
  const updateStatusMutation = trpc.abTesting.updateExperimentStatus.useMutation();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    hypothesis: "",
    targetAudience: "at-risk-students",
    successMetric: "course-completion",
    variants: [
      { name: "Control", description: "No intervention", isControl: true, weight: 50 },
      { name: "Variant A", description: "Email reminder", isControl: false, weight: 50 },
    ],
  });

  const handleCreateExperiment = async () => {
    if (!formData.name) {
      toast.error("Please enter experiment name");
      return;
    }

    try {
      await createMutation.mutateAsync(formData);
      toast.success("Experiment created successfully");
      setShowCreateDialog(false);
      setFormData({
        name: "",
        description: "",
        hypothesis: "",
        targetAudience: "at-risk-students",
        successMetric: "course-completion",
        variants: [
          { name: "Control", description: "No intervention", isControl: true, weight: 50 },
          { name: "Variant A", description: "Email reminder", isControl: false, weight: 50 },
        ],
      });
      refetch();
    } catch (error) {
      toast.error("Failed to create experiment");
      console.error(error);
    }
  };

  const handleUpdateStatus = async (experimentId: number, status: string) => {
    try {
      await updateStatusMutation.mutateAsync({
        experimentId,
        status: status as any,
      });
      toast.success(`Experiment ${status}`);
      refetch();
    } catch (error) {
      toast.error("Failed to update experiment status");
      console.error(error);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-gray-100 text-gray-800",
      active: "bg-green-100 text-green-800",
      paused: "bg-yellow-100 text-yellow-800",
      completed: "bg-blue-100 text-blue-800",
    };

    return (
      <Badge className={colors[status] || "bg-gray-100 text-gray-800"}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">A/B Testing Framework</h1>
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i} className="p-6">
              <div className="h-32 bg-muted rounded animate-pulse" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">A/B Testing Framework</h1>
          <p className="text-muted-foreground">
            Test different intervention strategies and measure their effectiveness
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Experiment
        </Button>
      </div>

      {/* Experiments List */}
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        {experiments?.map((experiment) => (
          <Card
            key={experiment.id}
            className="p-6 cursor-pointer hover:shadow-md transition-all"
            onClick={() => setSelectedExperimentId(experiment.id)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <FlaskConical className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold">{experiment.name}</h3>
                  {getStatusBadge(experiment.status)}
                </div>
              </div>
            </div>
            
            {experiment.description && (
              <p className="text-sm text-muted-foreground mb-4">{experiment.description}</p>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-muted-foreground" />
                <span>{experiment.variantCount} variants</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span>{experiment.assignmentCount} participants</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t flex gap-2">
              {experiment.status === "draft" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpdateStatus(experiment.id, "active");
                  }}
                >
                  <Play className="w-4 h-4 mr-1" />
                  Start
                </Button>
              )}
              {experiment.status === "active" && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUpdateStatus(experiment.id, "paused");
                    }}
                  >
                    <Pause className="w-4 h-4 mr-1" />
                    Pause
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUpdateStatus(experiment.id, "completed");
                    }}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    Complete
                  </Button>
                </>
              )}
              {experiment.status === "paused" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpdateStatus(experiment.id, "active");
                  }}
                >
                  <Play className="w-4 h-4 mr-1" />
                  Resume
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Experiment Details */}
      {selectedExperimentId && experimentDetails && experimentResults && (
        <Card className="p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold">{experimentDetails.experiment.name}</h2>
              {getStatusBadge(experimentDetails.experiment.status)}
            </div>
            {experimentDetails.experiment.hypothesis && (
              <div className="p-4 bg-muted/50 rounded-lg mt-4">
                <p className="text-sm font-medium mb-1">Hypothesis</p>
                <p className="text-sm text-muted-foreground">{experimentDetails.experiment.hypothesis}</p>
              </div>
            )}
          </div>

          <h3 className="text-lg font-semibold mb-4">Variant Performance</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {experimentResults.map((variant) => (
              <Card key={variant.id} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold">{variant.name}</h4>
                  {variant.isControl && (
                    <Badge variant="outline" className="text-xs">
                      CONTROL
                    </Badge>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Conversion Rate</span>
                      <span className="font-bold text-lg">{variant.conversionRate}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${variant.conversionRate}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center p-2 bg-green-50 dark:bg-green-950/20 rounded">
                      <p className="text-green-600 font-semibold">{variant.successCount}</p>
                      <p className="text-muted-foreground">Success</p>
                    </div>
                    <div className="text-center p-2 bg-red-50 dark:bg-red-950/20 rounded">
                      <p className="text-red-600 font-semibold">{variant.failureCount}</p>
                      <p className="text-muted-foreground">Failure</p>
                    </div>
                    <div className="text-center p-2 bg-gray-50 dark:bg-gray-950/20 rounded">
                      <p className="text-gray-600 font-semibold">{variant.pendingCount}</p>
                      <p className="text-muted-foreground">Pending</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground">
                      Total: {variant.totalAssignments} participants
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      )}

      {/* Create Experiment Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New A/B Test Experiment</DialogTitle>
            <DialogDescription>
              Test different intervention strategies for at-risk students
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Experiment Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Email Reminder Test"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the experiment"
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="hypothesis">Hypothesis</Label>
              <Textarea
                id="hypothesis"
                value={formData.hypothesis}
                onChange={(e) => setFormData({ ...formData, hypothesis: e.target.value })}
                placeholder="What do you expect to happen?"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="targetAudience">Target Audience</Label>
                <Select
                  value={formData.targetAudience}
                  onValueChange={(value) => setFormData({ ...formData, targetAudience: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="at-risk-students">At-Risk Students</SelectItem>
                    <SelectItem value="all-students">All Students</SelectItem>
                    <SelectItem value="low-engagement">Low Engagement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="successMetric">Success Metric</Label>
                <Select
                  value={formData.successMetric}
                  onValueChange={(value) => setFormData({ ...formData, successMetric: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="course-completion">Course Completion</SelectItem>
                    <SelectItem value="engagement-increase">Engagement Increase</SelectItem>
                    <SelectItem value="test-score-improvement">Test Score Improvement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateExperiment} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Experiment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
