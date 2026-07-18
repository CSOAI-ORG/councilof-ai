/**
 * Public Dashboard - Transparency Portal
 * Real-time AI safety monitoring for the public
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  Users,
  FileText,
  TrendingUp,
  Globe,
  Building2,
  Scale,
  Eye,
  BarChart3,
  Clock,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { Link } from "wouter";

export default function PublicDashboard() {
  const [selectedFramework, setSelectedFramework] = useState<string>("all");

  // Fetch public statistics
  const { data: councilStats } = trpc.council.getStats.useQuery();
  const { data: recentReports } = trpc.watchdog.list.useQuery();

  // Calculate watchdog stats from reports
  const watchdogStats = {
    total: recentReports?.length || 0,
    verified: recentReports?.filter(r => r.status === "resolved").length || 0,
  };

  // Calculate aggregate stats
  const totalIncidents = watchdogStats?.total || 0;
  const resolvedIncidents = watchdogStats?.verified || 0;
  const councilSessions = councilStats?.totalSessions || 0;
  const consensusRate = councilStats?.totalSessions
    ? Math.round((councilStats.consensusReached / councilStats.totalSessions) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <div className="flex items-center gap-3 cursor-pointer">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">CSOAI</h1>
                  <p className="text-xs text-zinc-400">Public Transparency Dashboard</p>
                </div>
              </div>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/watchdog">
                <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Report Incident
                </Button>
              </Link>
              <Link href="/login">
                <Button className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center">
          <Badge className="mb-4 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
            <Globe className="w-3 h-3 mr-1" />
            Real-Time AI Safety Monitoring
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Global AI Safety <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Transparency</span>
          </h1>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto mb-8">
            Track AI safety incidents, compliance assessments, and council decisions in real-time.
            CSOAI provides unprecedented transparency into AI governance worldwide.
          </p>
        </div>
      </section>

      {/* Key Metrics */}
      <section className="py-8 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-6">
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-500/10 rounded-lg">
                    <AlertTriangle className="h-6 w-6 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-400">Incidents Reported</p>
                    <p className="text-3xl font-bold text-white">{totalIncidents}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-500/10 rounded-lg">
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-400">Resolved</p>
                    <p className="text-3xl font-bold text-white">{resolvedIncidents}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/10 rounded-lg">
                    <Users className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-400">Council Sessions</p>
                    <p className="text-3xl font-bold text-white">{councilSessions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-500/10 rounded-lg">
                    <Scale className="h-6 w-6 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-400">Consensus Rate</p>
                    <p className="text-3xl font-bold text-white">{consensusRate}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Framework Tabs */}
      <section className="py-8 px-4">
        <div className="container mx-auto">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Compliance Frameworks</CardTitle>
              <CardDescription className="text-zinc-400">
                Monitor compliance across major AI safety frameworks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={selectedFramework} onValueChange={setSelectedFramework}>
                <TabsList className="bg-zinc-800">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="euai">EU AI Act</TabsTrigger>
                  <TabsTrigger value="nist">NIST AI RMF</TabsTrigger>
                  <TabsTrigger value="iso">ISO 42001</TabsTrigger>
                </TabsList>
                <TabsContent value="all" className="mt-6">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-4 bg-zinc-800/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Globe className="h-5 w-5 text-blue-400" />
                        <span className="font-medium text-white">EU AI Act</span>
                      </div>
                      <p className="text-sm text-zinc-400">113 articles, 88% compliance</p>
                      <Progress value={88} className="mt-2 h-2" />
                    </div>
                    <div className="p-4 bg-zinc-800/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Building2 className="h-5 w-5 text-green-400" />
                        <span className="font-medium text-white">NIST AI RMF</span>
                      </div>
                      <p className="text-sm text-zinc-400">72 requirements, 92% compliance</p>
                      <Progress value={92} className="mt-2 h-2" />
                    </div>
                    <div className="p-4 bg-zinc-800/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-5 w-5 text-purple-400" />
                        <span className="font-medium text-white">ISO 42001</span>
                      </div>
                      <p className="text-sm text-zinc-400">10 clauses, 85% compliance</p>
                      <Progress value={85} className="mt-2 h-2" />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Join the AI Safety Movement</h2>
          <p className="text-zinc-400 mb-8 max-w-xl mx-auto">
            Become a certified AI Safety Analyst and help protect humanity from AI risks.
            100% free training and certification.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/training">
              <Button size="lg" className="bg-gradient-to-r from-emerald-600 to-cyan-600">
                Start Free Training
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/about">
              <Button size="lg" variant="outline" className="border-zinc-700 text-zinc-300">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
