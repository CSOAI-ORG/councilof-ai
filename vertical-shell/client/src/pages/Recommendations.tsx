/**
 * RLMAI Recommendations Page
 * 
 * Displays AI-powered compliance recommendations based on:
 * - Council decision patterns
 * - Incident analysis
 * - Compliance gaps
 * - Industry best practices
 * 
 * Includes full tracking of user interactions for improving future suggestions.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { trpc } from '@/lib/trpc';
import { 
  Brain, 
  ShieldAlert, 
  AlertTriangle, 
  Building, 
  Shield, 
  Star, 
  FileText,
  ChevronRight,
  CheckCircle2,
  Clock,
  Zap,
  Target,
  TrendingUp,
  RefreshCw,
  Loader2,
  ArrowRight,
  Lightbulb,
  X,
  ThumbsUp,
  ThumbsDown,
  History,
  Settings,
  PauseCircle,
  BarChart3,
} from 'lucide-react';
import { toast } from 'sonner';

// Priority colors and icons
const priorityConfig = {
  critical: { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: Zap, label: 'Critical' },
  high: { color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: AlertTriangle, label: 'High' },
  medium: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Clock, label: 'Medium' },
  low: { color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle2, label: 'Low' },
};

// Category icons
const categoryIcons: Record<string, typeof Shield> = {
  compliance_gap: ShieldAlert,
  incident_prevention: AlertTriangle,
  governance_improvement: Building,
  risk_mitigation: Shield,
  best_practice: Star,
  regulatory_update: FileText,
};

// Effort and impact colors
const effortColors = {
  low: 'text-green-400',
  medium: 'text-yellow-400',
  high: 'text-red-400',
};

const impactColors = {
  low: 'text-gray-400',
  medium: 'text-blue-400',
  high: 'text-purple-400',
};

// Snooze duration options
const snoozeDurations = [
  { value: 1, label: '1 day' },
  { value: 7, label: '1 week' },
  { value: 14, label: '2 weeks' },
  { value: 30, label: '1 month' },
  { value: 90, label: '3 months' },
];

export default function Recommendations() {
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [selectedPriority, setSelectedPriority] = useState<string | undefined>(undefined);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('recommendations');
  
  // Dialog states
  const [feedbackDialog, setFeedbackDialog] = useState<{
    open: boolean;
    recId: number;
    recType: string;
    action: 'implemented' | 'dismissed';
    title: string;
  } | null>(null);
  const [snoozeDialog, setSnoozeDialog] = useState<{
    open: boolean;
    recId: number;
    recType: string;
    title: string;
  } | null>(null);
  const [feedbackNote, setFeedbackNote] = useState('');
  const [selectedFeedback, setSelectedFeedback] = useState<'helpful' | 'not_helpful' | 'irrelevant' | null>(null);
  const [selectedSnoozeDays, setSelectedSnoozeDays] = useState(7);

  // Queries
  const { data: recommendations, isLoading, refetch } = trpc.recommendations.getRecommendations.useQuery({
    category: selectedCategory as any,
    priority: selectedPriority as any,
    limit: 20,
  });
  const { data: categories } = trpc.recommendations.getCategories.useQuery();
  const { data: dismissedData, refetch: refetchDismissed } = trpc.recommendations.getDismissedIds.useQuery();
  const { data: stats } = trpc.recommendations.getStats.useQuery();
  const { data: interactionHistory } = trpc.recommendations.getInteractionHistory.useQuery({ limit: 20 });
  const { data: analytics } = trpc.recommendations.getAnalytics.useQuery({ periodType: 'monthly', limit: 6 });

  // Mutations
  const trackMutation = trpc.recommendations.trackInteraction.useMutation({
    onSuccess: () => {
      refetchDismissed();
    },
  });

  // Filter out dismissed and snoozed recommendations
  const dismissedIds = new Set((dismissedData as any)?.dismissedIds || dismissedData?.ids || []);
  const snoozedIds = new Set((dismissedData as any)?.snoozedIds || []);

  const filteredRecommendations = (recommendations as any)?.recommendations?.filter(
    (r: any) => !dismissedIds.has(r.id) && !snoozedIds.has(r.id)
  ) || recommendations || [];

  const summary = (recommendations as any)?.summary || { critical: 0, high: 0, medium: 0, low: 0 };
  const totalActive = filteredRecommendations.length;

  // Track view when recommendation is expanded
  const handleExpand = (rec: any) => {
    if (expandedId !== rec.id) {
      setExpandedId(rec.id);
      // Track view
      trackMutation.mutate({
        recommendationId: rec.id,
        action: 'viewed',
        notes: `Viewed: ${rec.title}`,
      });
    } else {
      setExpandedId(null);
    }
  };

  const handleImplement = (rec: any) => {
    setFeedbackDialog({
      open: true,
      recId: rec.id,
      recType: rec.category,
      action: 'implemented',
      title: rec.title,
    });
  };

  const handleDismiss = (rec: any) => {
    setFeedbackDialog({
      open: true,
      recId: rec.id,
      recType: rec.category,
      action: 'dismissed',
      title: rec.title,
    });
  };

  const handleSnooze = (rec: any) => {
    setSnoozeDialog({
      open: true,
      recId: rec.id,
      recType: rec.category,
      title: rec.title,
    });
  };

  const submitFeedback = async () => {
    if (!feedbackDialog) return;

    await trackMutation.mutateAsync({
      recommendationId: feedbackDialog.recId,
      action: feedbackDialog.action,
      feedback: selectedFeedback || undefined,
      notes: feedbackNote || feedbackDialog.title,
    });

    toast.success(
      feedbackDialog.action === 'implemented'
        ? `Started implementing: ${feedbackDialog.title}`
        : 'Recommendation dismissed'
    );

    setFeedbackDialog(null);
    setFeedbackNote('');
    setSelectedFeedback(null);
  };

  const submitSnooze = async () => {
    if (!snoozeDialog) return;

    await trackMutation.mutateAsync({
      recommendationId: snoozeDialog.recId,
      action: 'snoozed',
      notes: `Snoozed for ${selectedSnoozeDays} days: ${snoozeDialog.title}`,
    });

    toast.success(`Snoozed for ${snoozeDurations.find(d => d.value === selectedSnoozeDays)?.label}`);

    setSnoozeDialog(null);
    setSelectedSnoozeDays(7);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Brain className="h-8 w-8 text-purple-500" />
              RLMAI Recommendations
            </h1>
            <p className="text-muted-foreground mt-1">
              AI-powered compliance recommendations that learn from your interactions
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => refetch()}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="recommendations" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Recommendations
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recommendations" className="space-y-6 mt-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-red-500/30 bg-red-500/5">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Critical</p>
                      <p className="text-3xl font-bold text-red-400">{summary.critical}</p>
                    </div>
                    <Zap className="h-8 w-8 text-red-400/50" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-orange-500/30 bg-orange-500/5">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">High Priority</p>
                      <p className="text-3xl font-bold text-orange-400">{summary.high}</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-orange-400/50" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-yellow-500/30 bg-yellow-500/5">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Medium Priority</p>
                      <p className="text-3xl font-bold text-yellow-400">{summary.medium}</p>
                    </div>
                    <Clock className="h-8 w-8 text-yellow-400/50" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-green-500/30 bg-green-500/5">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Low Priority</p>
                      <p className="text-3xl font-bold text-green-400">{summary.low}</p>
                    </div>
                    <CheckCircle2 className="h-8 w-8 text-green-400/50" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Category:</span>
                    <Select 
                      value={selectedCategory || "all"} 
                      onValueChange={(v) => setSelectedCategory(v === "all" ? undefined : v)}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {(categories as string[] || []).map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Priority:</span>
                    <Select 
                      value={selectedPriority || "all"} 
                      onValueChange={(v) => setSelectedPriority(v === "all" ? undefined : v)}
                    >
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="All Priorities" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Priorities</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="ml-auto flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{totalActive} active</span>
                    <span>{dismissedIds.size} dismissed</span>
                    <span>{snoozedIds.size} snoozed</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recommendations List */}
            <div className="space-y-4">
              {isLoading ? (
                <Card>
                  <CardContent className="p-8 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </CardContent>
                </Card>
              ) : filteredRecommendations.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Recommendations</h3>
                    <p className="text-muted-foreground">
                      {dismissedIds.size > 0 || snoozedIds.size > 0
                        ? "You've addressed all current recommendations. Great work!"
                        : "Register AI systems and run assessments to receive personalized recommendations."}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <AnimatePresence>
                  {filteredRecommendations.map((rec, index) => {
                    const PriorityIcon = priorityConfig[rec.priority as keyof typeof priorityConfig]?.icon || Clock;
                    const CategoryIcon = categoryIcons[rec.category] || Shield;
                    const isExpanded = expandedId === rec.id;

                    return (
                      <motion.div
                        key={rec.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        transition={{ duration: 0.2, delay: index * 0.05 }}
                      >
                        <Card className={`border-l-4 ${
                          rec.priority === 'critical' ? 'border-l-red-500' :
                          rec.priority === 'high' ? 'border-l-orange-500' :
                          rec.priority === 'medium' ? 'border-l-yellow-500' :
                          'border-l-green-500'
                        }`}>
                          <CardContent className="p-0">
                            {/* Main Row */}
                            <div 
                              className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                              onClick={() => handleExpand(rec)}
                            >
                              <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-lg ${priorityConfig[rec.priority as keyof typeof priorityConfig]?.color.split(' ')[0] || 'bg-gray-500/20'}`}>
                                  <PriorityIcon className={`h-5 w-5 ${priorityConfig[rec.priority as keyof typeof priorityConfig]?.color.split(' ')[1] || 'text-gray-400'}`} />
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-semibold">{rec.title}</h3>
                                    <Badge className={priorityConfig[rec.priority as keyof typeof priorityConfig]?.color || ''}>
                                      {priorityConfig[rec.priority as keyof typeof priorityConfig]?.label || rec.priority}
                                    </Badge>
                                    {rec.framework && (
                                      <Badge variant="outline">{rec.framework}</Badge>
                                    )}
                                  </div>
                                  
                                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                    {rec.description}
                                  </p>
                                  
                                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <CategoryIcon className="h-3 w-3" />
                                      {rec.category.replace(/_/g, ' ')}
                                    </span>
                                    {rec.aiSystemName && (
                                      <span className="flex items-center gap-1">
                                        <Target className="h-3 w-3" />
                                        {rec.aiSystemName}
                                      </span>
                                    )}
                                    <span className={`flex items-center gap-1 ${effortColors[rec.estimatedEffort as keyof typeof effortColors] || ''}`}>
                                      <Clock className="h-3 w-3" />
                                      {rec.estimatedEffort} effort
                                    </span>
                                    <span className={`flex items-center gap-1 ${impactColors[rec.potentialImpact as keyof typeof impactColors] || ''}`}>
                                      <TrendingUp className="h-3 w-3" />
                                      {rec.potentialImpact} impact
                                    </span>
                                  </div>
                                </div>
                                
                                <ChevronRight className={`h-5 w-5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                              </div>
                            </div>
                            
                            {/* Expanded Content */}
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <div className="px-4 pb-4 pt-2 border-t border-border">
                                    {/* Based On */}
                                    <div className="mb-4 p-3 rounded-lg bg-muted/50">
                                      <p className="text-xs text-muted-foreground mb-1">Based on:</p>
                                      <p className="text-sm">
                                        <span className="font-medium">{rec.basedOn.type.replace(/_/g, ' ')}</span>
                                        {' — '}
                                        {rec.basedOn.details}
                                      </p>
                                    </div>
                                    
                                    {/* Action Items */}
                                    <div className="mb-4">
                                      <p className="text-sm font-medium mb-2">Action Items:</p>
                                      <ul className="space-y-2">
                                        {rec.actionItems.map((item: string, i: number) => (
                                          <li key={i} className="flex items-start gap-2 text-sm">
                                            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                                            {item}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                    
                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                      <Button 
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleImplement(rec);
                                        }}
                                      >
                                        <CheckCircle2 className="h-4 w-4 mr-2" />
                                        Implement
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleSnooze(rec);
                                        }}
                                      >
                                        <PauseCircle className="h-4 w-4 mr-2" />
                                        Snooze
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDismiss(rec);
                                        }}
                                      >
                                        <X className="h-4 w-4 mr-2" />
                                        Dismiss
                                      </Button>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Interaction History</CardTitle>
                <CardDescription>
                  Your recent interactions with recommendations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {interactionHistory && interactionHistory.length > 0 ? (
                  <div className="space-y-3">
                    {interactionHistory.map((interaction: any) => (
                      <div 
                        key={interaction.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            interaction.action === 'implemented' ? 'bg-green-500/20' :
                            interaction.action === 'dismissed' ? 'bg-red-500/20' :
                            interaction.action === 'snoozed' ? 'bg-yellow-500/20' :
                            'bg-blue-500/20'
                          }`}>
                            {interaction.action === 'implemented' ? <CheckCircle2 className="h-4 w-4 text-green-400" /> :
                             interaction.action === 'dismissed' ? <X className="h-4 w-4 text-red-400" /> :
                             interaction.action === 'snoozed' ? <PauseCircle className="h-4 w-4 text-yellow-400" /> :
                             <Lightbulb className="h-4 w-4 text-blue-400" />}
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {interaction.metadata?.title || interaction.recommendationId}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {interaction.action} • {interaction.recommendationType.replace(/_/g, ' ')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">
                            {new Date(interaction.createdAt).toLocaleDateString()}
                          </p>
                          {interaction.feedback && (
                            <Badge variant="outline" className="text-xs">
                              {interaction.feedback === 'helpful' ? '👍' : interaction.feedback === 'not_helpful' ? '👎' : '🤷'}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No interaction history yet. Start by viewing and acting on recommendations.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6 mt-6">
            {/* Stats Overview */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Total Recommendations</p>
                    <p className="text-3xl font-bold">{stats.total}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Completed</p>
                    <p className="text-3xl font-bold text-green-400">
                      {stats.completed || 0}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Pending</p>
                    <p className="text-3xl font-bold text-yellow-400">
                      {stats.pending || 0}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">In Progress</p>
                    <p className="text-3xl font-bold text-purple-400">
                      {stats.inProgress || 0}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Monthly Analytics */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Trends</CardTitle>
                <CardDescription>
                  Recommendation engagement over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analytics ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-4 rounded-lg bg-muted/50">
                        <p className="text-2xl font-bold text-green-400">{analytics.implemented}</p>
                        <p className="text-xs text-muted-foreground">Implemented</p>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50">
                        <p className="text-2xl font-bold text-red-400">{analytics.dismissed}</p>
                        <p className="text-xs text-muted-foreground">Dismissed</p>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50">
                        <p className="text-2xl font-bold text-yellow-400">{analytics.pending}</p>
                        <p className="text-xs text-muted-foreground">Pending</p>
                      </div>
                    </div>
                    {analytics.trends && analytics.trends.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm text-muted-foreground mb-2">Recent Trends</p>
                        {analytics.trends.map((trend: any, idx: number) => (
                          <div key={idx} className="text-sm">{trend.label}: {trend.value}</div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No analytics data yet. Interact with recommendations to see trends.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* How It Works */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-500" />
              How RLMAI Recommendations Work
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-3">
                  <AlertTriangle className="h-6 w-6 text-blue-400" />
                </div>
                <h4 className="font-semibold mb-2">Incident Analysis</h4>
                <p className="text-sm text-muted-foreground">
                  Analyzes Watchdog incident patterns to identify emerging risks.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-3">
                  <Building className="h-6 w-6 text-purple-400" />
                </div>
                <h4 className="font-semibold mb-2">Council Learning</h4>
                <p className="text-sm text-muted-foreground">
                  Learns from 33-Agent Council voting patterns.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-3">
                  <Target className="h-6 w-6 text-green-400" />
                </div>
                <h4 className="font-semibold mb-2">Personalized Actions</h4>
                <p className="text-sm text-muted-foreground">
                  Tailored to your AI systems and compliance gaps.
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="h-6 w-6 text-orange-400" />
                </div>
                <h4 className="font-semibold mb-2">Continuous Learning</h4>
                <p className="text-sm text-muted-foreground">
                  Improves based on your feedback and interactions.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feedback Dialog */}
      <Dialog open={feedbackDialog?.open || false} onOpenChange={(open) => !open && setFeedbackDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {feedbackDialog?.action === 'implemented' ? 'Mark as Implemented' : 'Dismiss Recommendation'}
            </DialogTitle>
            <DialogDescription>
              {feedbackDialog?.title}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Was this recommendation helpful?
              </Label>
              <div className="flex gap-2">
                <Button
                  variant={selectedFeedback === 'helpful' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedFeedback('helpful')}
                >
                  <ThumbsUp className="h-4 w-4 mr-2" />
                  Helpful
                </Button>
                <Button
                  variant={selectedFeedback === 'not_helpful' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedFeedback('not_helpful')}
                >
                  <ThumbsDown className="h-4 w-4 mr-2" />
                  Not Helpful
                </Button>
                <Button
                  variant={selectedFeedback === 'irrelevant' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedFeedback('irrelevant')}
                >
                  Irrelevant
                </Button>
              </div>
            </div>
            
            <div>
              <Label htmlFor="feedback-note" className="text-sm font-medium mb-2 block">
                Additional feedback (optional)
              </Label>
              <Textarea
                id="feedback-note"
                placeholder="Tell us more about why this recommendation was or wasn't helpful..."
                value={feedbackNote}
                onChange={(e) => setFeedbackNote(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setFeedbackDialog(null)}>
              Cancel
            </Button>
            <Button onClick={submitFeedback} disabled={trackMutation.isPending}>
              {trackMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {feedbackDialog?.action === 'implemented' ? 'Mark Implemented' : 'Dismiss'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Snooze Dialog */}
      <Dialog open={snoozeDialog?.open || false} onOpenChange={(open) => !open && setSnoozeDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Snooze Recommendation</DialogTitle>
            <DialogDescription>
              {snoozeDialog?.title}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Label className="text-sm font-medium mb-2 block">
              Snooze for:
            </Label>
            <Select 
              value={String(selectedSnoozeDays)} 
              onValueChange={(v) => setSelectedSnoozeDays(Number(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {snoozeDurations.map(d => (
                  <SelectItem key={d.value} value={String(d.value)}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-2">
              This recommendation will reappear after the snooze period.
            </p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSnoozeDialog(null)}>
              Cancel
            </Button>
            <Button onClick={submitSnooze} disabled={trackMutation.isPending}>
              {trackMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Snooze
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
