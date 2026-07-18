/*
 * COAI 33-Agent Council Page
 * Visualize the Byzantine fault-tolerant voting system
 * Connected to real backend API
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { Users, Shield, Scale, FileText, CheckCircle2, XCircle, AlertTriangle, Clock, Play, Loader2, Zap, Radio, MessageSquare, Brain } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";

const agentGroups = [
  {
    name: "Guardian Agents",
    description: "Safety, Security, Privacy",
    icon: Shield,
    count: 11,
    color: "text-[#9CA6C9]",
    bgColor: "bg-[#9CA6C9]/10",
    providers: ["OpenAI (3)", "Anthropic (2)", "Google (2)", "Kimi (2)", "DeepSeek (2)"],
  },
  {
    name: "Arbiter Agents",
    description: "Fairness, Transparency, Accountability",
    icon: Scale,
    count: 11,
    color: "text-[#9CA6C9]",
    bgColor: "bg-[#9CA6C9]/10",
    providers: ["OpenAI (3)", "Anthropic (2)", "Google (2)", "Kimi (2)", "DeepSeek (2)"],
  },
  {
    name: "Scribe Agents",
    description: "Documentation, Compliance, Reporting",
    icon: FileText,
    count: 11,
    color: "text-primary",
    bgColor: "bg-primary/10",
    providers: ["OpenAI (3)", "Anthropic (2)", "Google (2)", "Kimi (2)", "DeepSeek (2)"],
  },
];

const getResultBadge = (result: string | null) => {
  switch (result) {
    case "approved":
      return (
        <Badge className="bg-primary/10 text-primary border-primary/30">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Approved
        </Badge>
      );
    case "rejected":
      return (
        <Badge className="bg-red-500/10 text-destructive border-destructive/30">
          <XCircle className="h-3 w-3 mr-1" />
          Rejected
        </Badge>
      );
    case "escalated":
      return (
        <Badge className="bg-amber-500/10 text-[#C8A873] border-[#C8A873]/30">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Escalated to Human
        </Badge>
      );
    default:
      return (
        <Badge className="bg-gray-500/10 text-muted-foreground border-gray-500/30">
          <Clock className="h-3 w-3 mr-1" />
          Voting
        </Badge>
      );
  }
};

const formatTimeAgo = (date: Date | string) => {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  
  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours} hours ago`;
  return `${Math.floor(diffHours / 24)} days ago`;
};

export default function AgentCouncil() {
  const [isVoteDialogOpen, setIsVoteDialogOpen] = useState(false);
  const [voteSubject, setVoteSubject] = useState({ title: "", description: "" });

  // SOV3 bridge state
  const [sov3Message, setSov3Message] = useState("");
  const [sov3Character, setSov3Character] = useState("sage");
  const [sov3Profile, setSov3Profile] = useState<"local_only" | "balanced" | "power" | "council">("balanced");

  // Real API data
  const { data: sessions, isLoading, refetch } = trpc.council.list.useQuery();
  const { data: stats } = trpc.council.getStats.useQuery();
  const { data: providersHealth } = trpc.council.providersHealth.useQuery();

  // Voting mutation
  const triggerVotingMutation = trpc.council.triggerVoting.useMutation({
    onSuccess: (result) => {
      toast.success("Council voting complete!", {
        description: `Decision: ${result.finalDecision} (${result.approveVotes} approve, ${result.rejectVotes} reject)`,
      });
      setIsVoteDialogOpen(false);
      setVoteSubject({ title: "", description: "" });
      refetch();
    },
    onError: (error) => {
      toast.error("Voting failed", {
        description: error.message || "Please try again later",
      });
    },
  });

  // SOV3 bridge mutation
  const sov3ThinkMutation = trpc.council.sov3Think.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success("SOV3 bridge replied");
      } else {
        toast.error("SOV3 bridge error", { description: result.error || "Unknown error" });
      }
    },
    onError: (error) => {
      toast.error("SOV3 bridge failed", { description: error.message || "Please try again later" });
    },
  });

  const handleSov3Think = () => {
    if (!sov3Message.trim()) {
      toast.error("Please enter a message");
      return;
    }
    sov3ThinkMutation.mutate({
      message: sov3Message,
      character: sov3Character,
      profile: sov3Profile,
    });
  };

  const providerStatus = providersHealth?.providers || {};
  const configuredCount = providersHealth?.totalConfigured || 0;

  const handleTriggerVote = async () => {
    if (!voteSubject.title || !voteSubject.description) {
      toast.error("Please fill in all fields");
      return;
    }

    toast.info("Council voting initiated!", {
      description: "33 agents are analyzing your proposal...",
    });

    // Trigger the council voting
    triggerVotingMutation.mutate({
      subjectType: "policy_proposal",
      subjectTitle: voteSubject.title,
      subjectDescription: voteSubject.description,
    });
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold font-primary">33-Agent Council</h1>
            <p className="text-muted-foreground text-sm">
              Like a jury of 33 AI watchdogs from competing companies — no single company can trick all of them
            </p>
          </div>
          <Dialog open={isVoteDialogOpen} onOpenChange={setIsVoteDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Zap className="h-4 w-4" />
                Trigger Council Vote
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Trigger 33-Agent Council Vote
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="bg-[#9CA6C9]/10 border border-[#9CA6C9]/30 rounded-lg p-3 text-sm">
                  <strong>⚡ Real LLM Voting:</strong> This will trigger all 33 agents (OpenAI, Anthropic, Google) 
                  to vote on your proposal using Byzantine fault-tolerant consensus.
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Subject Title</label>
                  <Input
                    placeholder="e.g., Privacy compliance for user data processing"
                    value={voteSubject.title}
                    onChange={(e) => setVoteSubject({ ...voteSubject, title: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    placeholder="Detailed description of what the council should evaluate..."
                    rows={4}
                    value={voteSubject.description}
                    onChange={(e) => setVoteSubject({ ...voteSubject, description: e.target.value })}
                  />
                </div>

                <Button
                  onClick={handleTriggerVote}
                  className="w-full gap-2"
                  disabled={triggerVotingMutation.isPending}
                >
                  {triggerVotingMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  {triggerVotingMutation.isPending ? "Council is Voting..." : "Start Council Voting"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Simple Explanation */}
        <Card className="bg-muted/40 border-primary/20">
          <CardContent className="p-6">
            <h3 className="font-bold text-lg mb-4 text-primary">🤔 How Does This Work? (Simple Version)</h3>
            <div className="grid md:grid-cols-3 gap-6 text-sm">
              <div>
                <div className="font-semibold text-primary mb-2">1. Diverse AI Jury</div>
                <p className="text-muted-foreground">
                  33 AI systems from 5 competing companies (OpenAI, Anthropic, Google, DeepSeek, Kimi)
                  each independently review your AI system.
                </p>
              </div>
              <div>
                <div className="font-semibold text-primary mb-2">2. Consensus Required</div>
                <p className="text-muted-foreground">
                  At least 22 out of 33 must agree for a decision. This prevents any single company
                  from manipulating results — like needing a supermajority jury verdict.
                </p>
              </div>
              <div>
                <div className="font-semibold text-primary mb-2">3. Human Escalation</div>
                <p className="text-muted-foreground">
                  If AIs disagree or detect something complex, it gets escalated to certified
                  human analysts for final review. AI assists, humans decide.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: "Total Sessions", value: stats?.totalSessions || 0, color: "text-[#9CA6C9]" },
            { label: "Consensus Reached", value: stats?.consensusReached || 0, color: "text-primary" },
            { label: "Escalated to Human", value: stats?.escalatedToHuman || 0, color: "text-[#C8A873]" },
            { label: "Pending Review", value: stats?.pendingReview || 0, color: "text-[#9CA6C9]" },
          ].map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: idx * 0.05 }}
            >
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className={`text-2xl font-semibold mt-1 ${stat.color}`}>{stat.value}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Agent Groups */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {agentGroups.map((group, idx) => {
            const Icon = group.icon;
            return (
              <motion.div
                key={group.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.05 }}
              >
                <Card className="bg-card border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`p-2 rounded-lg ${group.bgColor}`}>
                        <Icon className={`h-5 w-5 ${group.color}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{group.name}</h3>
                        <p className="text-xs text-muted-foreground">{group.description}</p>
                      </div>
                      <div className="text-2xl font-semibold">{group.count}</div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {group.providers.map((provider) => (
                        <Badge key={provider} variant="outline" className="text-xs">
                          {provider}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Provider Health */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Radio className="h-4 w-4" />
              AI Provider Health
              <span className="text-xs font-normal text-muted-foreground ml-2">
                {configuredCount}/5 configured
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { key: "openai", label: "OpenAI" },
                { key: "anthropic", label: "Anthropic" },
                { key: "google", label: "Google" },
                { key: "glm", label: "GLM" },
                { key: "hermes", label: "Hermes" },
              ].map(({ key, label }) => {
                const healthy = !!providerStatus[key as keyof typeof providerStatus];
                return (
                  <div
                    key={key}
                    className={`flex items-center gap-2 p-2 rounded-lg border ${
                      healthy
                        ? "bg-primary/10 border-primary/30 text-primary"
                        : "bg-gray-500/10 border-gray-500/30 text-muted-foreground"
                    }`}
                  >
                    <div
                      className={`h-2 w-2 rounded-full ${
                        healthy ? "bg-emerald-500" : "bg-gray-400"
                      }`}
                    />
                    <span className="text-sm font-medium">{label}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* SOV3 Town Bridge */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Sovereign Town Bridge
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Character</label>
                <Input
                  value={sov3Character}
                  onChange={(e) => setSov3Character(e.target.value)}
                  placeholder="e.g. sage"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Profile</label>
                <Select
                  value={sov3Profile}
                  onValueChange={(v) =>
                    setSov3Profile(v as "local_only" | "balanced" | "power" | "council")
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="local_only">Local only</SelectItem>
                    <SelectItem value="balanced">Balanced</SelectItem>
                    <SelectItem value="power">Power</SelectItem>
                    <SelectItem value="council">Council</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleSov3Think}
                  disabled={sov3ThinkMutation.isPending}
                  className="w-full gap-2"
                >
                  {sov3ThinkMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MessageSquare className="h-4 w-4" />
                  )}
                  Ask SOV3
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Message</label>
              <Textarea
                value={sov3Message}
                onChange={(e) => setSov3Message(e.target.value)}
                placeholder="Ask the Sovereign Town council a question..."
                rows={3}
              />
            </div>
            {sov3ThinkMutation.data?.success && (
              <div className="p-4 rounded-lg bg-secondary/50 space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Reply</h4>
                <p className="text-sm whitespace-pre-wrap">
                  {(() => {
                    const content = sov3ThinkMutation.data.bridge?.result?.content;
                    if (Array.isArray(content) && content[0]?.text) {
                      try {
                        const parsed = JSON.parse(content[0].text);
                        return parsed.reply || parsed.text || content[0].text;
                      } catch {
                        return content[0].text;
                      }
                    }
                    return JSON.stringify(sov3ThinkMutation.data.bridge, null, 2);
                  })()}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Votes */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Council Voting Sessions
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sessions && sessions.length > 0 ? (
              <div className="space-y-4">
                {sessions.map((session, idx) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.15, delay: idx * 0.03 }}
                    className="p-4 rounded-lg bg-secondary/50 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{session.subjectTitle}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {session.subjectDescription || "No description"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {getResultBadge(session.finalDecision)}
                        <span className="text-xs text-muted-foreground">
                          {formatTimeAgo(session.createdAt)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Vote Distribution */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="w-16 text-primary font-medium">Approve</span>
                        <Progress 
                          value={(session.approveVotes / 33) * 100} 
                          className="h-2 flex-1" 
                        />
                        <span className="w-8 text-right font-medium">{session.approveVotes}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="w-16 text-destructive font-medium">Reject</span>
                        <Progress 
                          value={(session.rejectVotes / 33) * 100} 
                          className="h-2 flex-1" 
                        />
                        <span className="w-8 text-right font-medium">{session.rejectVotes}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="w-16 text-[#C8A873] font-medium">Escalate</span>
                        <Progress 
                          value={(session.escalateVotes / 33) * 100} 
                          className="h-2 flex-1" 
                        />
                        <span className="w-8 text-right font-medium">{session.escalateVotes}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Total votes: {session.totalVotes}/33</span>
                      <span>Consensus threshold: 67% (22 votes)</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">No voting sessions yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Trigger a council vote to see the 33-agent Byzantine consensus in action.
                </p>
                <Button onClick={() => setIsVoteDialogOpen(true)}>
                  <Zap className="h-4 w-4 mr-2" />
                  Start First Vote
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
