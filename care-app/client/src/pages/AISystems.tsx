/*
 * COAI AI Systems Page
 * Full CRUD functionality for managing AI systems
 * Connected to backend API with real data
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronRight,
  Pencil,
  Trash2,
  X,
  Loader2,
  Bot,
  Brain,
  Sparkles,
  BarChart3,
  MessageSquare,
  Boxes,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";

type SystemType = "chatbot" | "recommendation" | "classification" | "generation" | "analysis" | "other";
type RiskLevel = "minimal" | "limited" | "high" | "unacceptable";
type SystemStatus = "draft" | "active" | "archived" | "under_review";

interface AISystem {
  id: number;
  name: string;
  description: string | null;
  systemType: SystemType;
  riskLevel: RiskLevel;
  status: SystemStatus;
  createdAt: Date | string;
  updatedAt: Date | string;
}

const systemTypeIcons: Record<SystemType, React.ReactNode> = {
  chatbot: <MessageSquare className="h-5 w-5" />,
  recommendation: <Sparkles className="h-5 w-5" />,
  classification: <Boxes className="h-5 w-5" />,
  generation: <Brain className="h-5 w-5" />,
  analysis: <BarChart3 className="h-5 w-5" />,
  other: <Bot className="h-5 w-5" />,
};

const systemTypeLabels: Record<SystemType, string> = {
  chatbot: "Chatbot",
  recommendation: "Recommendation",
  classification: "Classification",
  generation: "Generation",
  analysis: "Analysis",
  other: "Other",
};

const riskLevelLabels: Record<RiskLevel, string> = {
  minimal: "Minimal",
  limited: "Limited",
  high: "High",
  unacceptable: "Unacceptable",
};

const statusLabels: Record<SystemStatus, string> = {
  draft: "Draft",
  active: "Active",
  archived: "Archived",
  under_review: "Under Review",
};

const getRiskColor = (risk: RiskLevel) => {
  switch (risk) {
    case "unacceptable":
      return "bg-red-500/10 text-red-500 border-red-500/30";
    case "high":
      return "bg-amber-500/10 text-amber-500 border-amber-500/30";
    case "limited":
      return "bg-blue-500/10 text-blue-500 border-blue-500/30";
    case "minimal":
      return "bg-emerald-500/10 text-emerald-500 border-emerald-500/30";
    default:
      return "bg-gray-500/10 text-gray-500 border-gray-500/30";
  }
};

const getStatusIcon = (status: SystemStatus) => {
  switch (status) {
    case "active":
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    case "under_review":
      return <Clock className="h-4 w-4 text-amber-500" />;
    case "draft":
      return <Clock className="h-4 w-4 text-muted-foreground" />;
    default:
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
  }
};

export default function AISystems() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSystem, setSelectedSystem] = useState<AISystem | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    systemType: "chatbot" as SystemType,
    riskLevel: "minimal" as RiskLevel,
    status: "draft" as SystemStatus,
  });

  // API queries and mutations
  const { data: systems = [], isLoading, refetch } = trpc.aiSystems.list.useQuery();
  
  const createMutation = trpc.aiSystems.create.useMutation({
    onSuccess: () => {
      toast.success("AI System registered successfully");
      setIsCreateModalOpen(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to register AI system", { description: error.message });
    },
  });

  const updateMutation = trpc.aiSystems.update.useMutation({
    onSuccess: () => {
      toast.success("AI System updated successfully");
      setIsEditModalOpen(false);
      setSelectedSystem(null);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to update AI system", { description: error.message });
    },
  });

  const deleteMutation = trpc.aiSystems.delete.useMutation({
    onSuccess: () => {
      toast.success("AI System deleted successfully");
      setIsDeleteDialogOpen(false);
      setSelectedSystem(null);
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to delete AI system", { description: error.message });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      systemType: "chatbot",
      riskLevel: "minimal",
      status: "draft",
    });
  };

  const handleCreate = () => {
    if (!formData.name.trim()) {
      toast.error("Please enter a system name");
      return;
    }
    createMutation.mutate({
      name: formData.name,
      description: formData.description || undefined,
      systemType: formData.systemType,
      riskLevel: formData.riskLevel,
    });
  };

  const handleEdit = (system: AISystem) => {
    setSelectedSystem(system);
    setFormData({
      name: system.name,
      description: system.description || "",
      systemType: system.systemType,
      riskLevel: system.riskLevel,
      status: system.status,
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = () => {
    if (!selectedSystem) return;
    if (!formData.name.trim()) {
      toast.error("Please enter a system name");
      return;
    }
    updateMutation.mutate({
      id: selectedSystem.id,
      name: formData.name,
      description: formData.description || undefined,
      systemType: formData.systemType,
      riskLevel: formData.riskLevel,
      status: formData.status,
    });
  };

  const handleDelete = (system: AISystem) => {
    setSelectedSystem(system);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!selectedSystem) return;
    deleteMutation.mutate({ id: selectedSystem.id });
  };

  const filteredSystems = (systems as AISystem[]).filter(
    (system) =>
      system.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (system.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold font-primary">AI Systems</h1>
            <p className="text-muted-foreground text-sm">
              Manage and monitor your registered AI systems
            </p>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Register System
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search AI systems..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Systems List */}
        {!isLoading && (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredSystems.map((system, idx) => (
                <motion.div
                  key={system.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15, delay: idx * 0.03 }}
                >
                  <Card className="bg-card border-border hover:bg-accent/30 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {/* Icon */}
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-secondary">
                          {systemTypeIcons[system.systemType] || <Shield className="h-5 w-5 text-muted-foreground" />}
                        </div>

                        {/* Main Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium truncate">{system.name}</h3>
                            {getStatusIcon(system.status)}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {system.description || `${systemTypeLabels[system.systemType]} system`}
                          </p>
                        </div>

                        {/* System Type Badge */}
                        <Badge variant="secondary" className="shrink-0 hidden lg:flex">
                          {systemTypeLabels[system.systemType]}
                        </Badge>

                        {/* Risk Badge */}
                        <Badge
                          variant="outline"
                          className={`${getRiskColor(system.riskLevel)} shrink-0`}
                        >
                          {riskLevelLabels[system.riskLevel]} Risk
                        </Badge>

                        {/* Status */}
                        <div className="text-right shrink-0 hidden sm:block">
                          <p className="text-sm font-medium">
                            {statusLabels[system.status]}
                          </p>
                          <p className="text-xs text-muted-foreground">Status</p>
                        </div>

                        {/* Actions */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="shrink-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => toast.info("View details coming soon")}>
                              <ChevronRight className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toast.info("Assessment wizard coming soon")}>
                              <Shield className="h-4 w-4 mr-2" />
                              Run Assessment
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => window.location.href = `/pdca?system=${system.id}`}>
                              <RefreshCw className="h-4 w-4 mr-2" />
                              PDCA Cycles
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleEdit(system)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit System
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(system)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredSystems.length === 0 && (
          <div className="text-center py-12">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium">No AI systems found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery ? "Try adjusting your search" : "Register your first AI system to get started"}
            </p>
            {!searchQuery && (
              <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Register System
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Register AI System</DialogTitle>
            <DialogDescription>
              Add a new AI system to track its compliance across multiple frameworks.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">System Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Customer Service Chatbot"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what this AI system does..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>System Type</Label>
                <Select
                  value={formData.systemType}
                  onValueChange={(value: SystemType) => setFormData({ ...formData, systemType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="chatbot">Chatbot</SelectItem>
                    <SelectItem value="recommendation">Recommendation</SelectItem>
                    <SelectItem value="classification">Classification</SelectItem>
                    <SelectItem value="generation">Generation</SelectItem>
                    <SelectItem value="analysis">Analysis</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Risk Level</Label>
                <Select
                  value={formData.riskLevel}
                  onValueChange={(value: RiskLevel) => setFormData({ ...formData, riskLevel: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minimal">Minimal Risk</SelectItem>
                    <SelectItem value="limited">Limited Risk</SelectItem>
                    <SelectItem value="high">High Risk</SelectItem>
                    <SelectItem value="unacceptable">Unacceptable Risk</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Register System
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit AI System</DialogTitle>
            <DialogDescription>
              Update the details of your AI system.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">System Name *</Label>
              <Input
                id="edit-name"
                placeholder="e.g., Customer Service Chatbot"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                placeholder="Describe what this AI system does..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>System Type</Label>
                <Select
                  value={formData.systemType}
                  onValueChange={(value: SystemType) => setFormData({ ...formData, systemType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="chatbot">Chatbot</SelectItem>
                    <SelectItem value="recommendation">Recommendation</SelectItem>
                    <SelectItem value="classification">Classification</SelectItem>
                    <SelectItem value="generation">Generation</SelectItem>
                    <SelectItem value="analysis">Analysis</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Risk Level</Label>
                <Select
                  value={formData.riskLevel}
                  onValueChange={(value: RiskLevel) => setFormData({ ...formData, riskLevel: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minimal">Minimal Risk</SelectItem>
                    <SelectItem value="limited">Limited Risk</SelectItem>
                    <SelectItem value="high">High Risk</SelectItem>
                    <SelectItem value="unacceptable">Unacceptable Risk</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: SystemStatus) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete AI System?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedSystem?.name}"? This action cannot be undone.
              All compliance data and assessments for this system will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
