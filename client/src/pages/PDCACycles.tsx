/**
 * PDCA Cycles Management Page
 * Plan-Do-Check-Act continuous improvement cycle management
 */

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Play,
  Pause,
  CheckCircle2,
  Target,
  Search,
  BarChart3,
  RefreshCw,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "sonner";
import { Link } from "wouter";

// Phase configuration based on Deming/Shewhart PDCA methodology
const PHASES = [
  {
    id: "plan",
    label: "Plan",
    icon: Target,
    color: "blue",
    description: "Recognize opportunity, analyze baseline, plan change",
  },
  {
    id: "do",
    label: "Do",
    icon: Play,
    color: "green",
    description: "Test the change through small-scale implementation",
  },
  {
    id: "check",
    label: "Check",
    icon: Search,
    color: "yellow",
    description: "Review the test results, analyze and compare",
  },
  {
    id: "act",
    label: "Act",
    icon: RefreshCw,
    color: "purple",
    description: "Take action based on results, standardize or adjust",
  },
];

// Mock cycles data
const mockCycles = [
  {
    id: 1,
    name: "EU AI Act Compliance Review",
    description: "Quarterly review of AI systems for EU AI Act compliance",
    currentPhase: "do",
    progress: 45,
    status: "active",
    createdAt: "2025-01-10",
    aiSystem: "Customer Service AI",
  },
  {
    id: 2,
    name: "Risk Assessment Update",
    description: "Update risk assessments for high-risk systems",
    currentPhase: "check",
    progress: 75,
    status: "active",
    createdAt: "2025-01-05",
    aiSystem: "ML Pipeline",
  },
  {
    id: 3,
    name: "Documentation Improvement",
    description: "Improve technical documentation standards",
    currentPhase: "act",
    progress: 90,
    status: "active",
    createdAt: "2024-12-20",
    aiSystem: "All Systems",
  },
];

export default function PDCACycles() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("active");

  const filteredCycles = mockCycles.filter(cycle =>
    cycle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cycle.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPhaseColor = (phaseId: string) => {
    const phase = PHASES.find(p => p.id === phaseId);
    switch(phase?.color) {
      case "blue": return "bg-blue-100 text-blue-800";
      case "green": return "bg-green-100 text-green-800";
      case "yellow": return "bg-yellow-100 text-yellow-800";
      case "purple": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">PDCA Cycles</h1>
            <p className="text-muted-foreground text-sm">
              Plan-Do-Check-Act continuous improvement management
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/pdca-simulator">
              <Button variant="outline">
                <BarChart3 className="mr-2 h-4 w-4" />
                Simulator
              </Button>
            </Link>
            <Button onClick={() => toast.info("Create cycle dialog coming soon")}>
              <Plus className="mr-2 h-4 w-4" />
              New Cycle
            </Button>
          </div>
        </div>

        {/* Phase Overview */}
        <div className="grid grid-cols-4 gap-4">
          {PHASES.map((phase, idx) => {
            const Icon = phase.icon;
            return (
              <motion.div
                key={phase.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="text-center">
                  <CardContent className="p-4">
                    <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-2 ${getPhaseColor(phase.id)}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold">{phase.label}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{phase.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search cycles..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Cycles List */}
        <div className="space-y-4">
          {filteredCycles.map((cycle, idx) => (
            <motion.div
              key={cycle.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{cycle.name}</h3>
                        <Badge className={getPhaseColor(cycle.currentPhase)}>
                          {PHASES.find(p => p.id === cycle.currentPhase)?.label}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground">{cycle.description}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Started {cycle.createdAt}
                        </span>
                        <span>AI System: {cycle.aiSystem}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => toast.info("View cycle details coming soon")}>
                        View Details
                      </Button>
                      {cycle.status === "active" && (
                        <Button size="sm">
                          Continue
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>Progress</span>
                      <span>{cycle.progress}%</span>
                    </div>
                    <Progress value={cycle.progress} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {filteredCycles.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <RefreshCw className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">No cycles found</h3>
              <p className="text-muted-foreground mb-4">
                Start a new PDCA cycle to begin continuous improvement
              </p>
              <Button onClick={() => toast.info("Create cycle dialog coming soon")}>
                <Plus className="mr-2 h-4 w-4" />
                Create First Cycle
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
