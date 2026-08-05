/**
 * Public Watchdog Leaderboard
 * Shows top analysts, most active reporters, and incident statistics
 */

import { useState } from "react";
import { Link } from "wouter";
import CesiumPortalCard from "@/components/CesiumPortalCard";
import { motion } from "framer-motion";
import {
  Trophy,
  Medal,
  TrendingUp,
  Eye,
  Users,
  Shield,
  Award,
  ArrowLeft,
  Crown,
  Target,
  Zap,
  GraduationCap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// STATIC snapshot — one-off AIR-Bench sweep measured 2026-08-04. NOT refreshed 6-hourly;
// the figures below are the hardcoded results of that single run.
// refusal rate = REFUSED / measured prompts only. UNMEASURED ≠ fail. LOW_N when measured < 20.
const topAnalysts = [
  { rank: 1, name: "gpt-oss-20b", score: 184, cases: 136, accuracy: 73.9, badge: "Measured" },
  { rank: 2, name: "gpt-oss-120b", score: 338, cases: 226, accuracy: 66.9, badge: "Measured" },
  { rank: 3, name: "gemma-4-26b-a4b-it", score: 231, cases: 119, accuracy: 51.5, badge: "Measured" },
  { rank: 4, name: "qwen3.6-27b", score: 250, cases: 96, accuracy: 38.4, badge: "Measured" },
  { rank: 5, name: "llama-3.1-8b-instant", score: 127, cases: 39, accuracy: 30.7, badge: "Measured" },
  { rank: 6, name: "llama-3.3-70b-versatile", score: 159, cases: 46, accuracy: 28.9, badge: "Measured" },
  { rank: 7, name: "allam-2-7b", score: 106, cases: 25, accuracy: 23.6, badge: "Measured" },
  { rank: 8, name: "gemma-4-31b-it", score: 3, cases: 1, accuracy: 33.3, badge: "LOW_N" },
];

const topReporters = [
  { rank: 1, name: "EU AI Act", reports: 113, verified: 113, rate: 100.0 },
  { rank: 2, name: "UK GDPR", reports: 7, verified: 7, rate: 100.0 },
  { rank: 3, name: "NIS2 (UK)", reports: 4, verified: 4, rate: 100.0 },
  { rank: 4, name: "DPA 2018", reports: 3, verified: 3, rate: 100.0 },
];

// Illustrative aggregates from the same 2026-08-04 one-off sweep — no live source;
// labelled as a static snapshot in the UI. Do not read these as current.
const monthlyStats = {
  totalReports: 1398,
  verifiedIncidents: 8,
  resolvedCases: 4,
  avgResolutionTime: "one-off",
  topCategory: "EU AI Act",
  growthRate: 24,
};

const achievements = [
  { icon: Trophy, name: "First 1,000 Measured", description: "Sweep crossed 1,000 measured prompts", holders: 1 },
  { icon: Target, name: "8 Subjects", description: "Eight model families under measurement", holders: 8 },
  { icon: Zap, name: "4 Instruments Live", description: "127 provisions under continuous hash watch", holders: 4 },
  { icon: Crown, name: "Kaggle Flag", description: "csoai-corpus-baselines public on Kaggle", holders: 1 },
  { icon: Shield, name: "Ledger Published", description: "Signed measurement ledger from the 2026-08-04 sweep on HF", holders: 1 },
];

export default function WatchdogLeaderboard() {
  const [activeTab, setActiveTab] = useState("analysts");

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
    return <span className="text-muted-foreground font-medium">#{rank}</span>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/public">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-2">
                <Trophy className="h-6 w-6 text-yellow-500" />
                <h1 className="text-xl font-bold">Measurement Leaderboard</h1>
                <p className="text-xs text-muted-foreground">Static snapshot · one-off sweep measured 2026-08-04 · refusal rate over measured prompts only · UNMEASURED ≠ fail</p>
              </div>
            </div>
            <Link href="/watchdog">
              <Button>
                <Eye className="h-4 w-4 mr-2" />
                Submit Report
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* 3D portal — the regulator lens: public accountability, mapped live */}
        <div className="mb-8">
          <CesiumPortalCard lens="defoneos" preset="global" />
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-2">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{monthlyStats.totalReports.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Prompts Measured</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{monthlyStats.verifiedIncidents}</div>
              <div className="text-xs text-muted-foreground">Subjects</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{monthlyStats.resolvedCases}</div>
              <div className="text-xs text-muted-foreground">Instruments</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{monthlyStats.avgResolutionTime}</div>
              <div className="text-xs text-muted-foreground">Snapshot Cadence</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{monthlyStats.topCategory}</div>
              <div className="text-xs text-muted-foreground">Largest Instrument</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-1">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-2xl font-bold text-green-600">+{monthlyStats.growthRate}%</span>
              </div>
              <div className="text-xs text-muted-foreground">Monthly Growth</div>
            </CardContent>
          </Card>
        </div>
        <p className="text-xs text-muted-foreground mb-8">
          Static snapshot of the one-off sweep measured 2026-08-04 — not refreshed. The growth figure is illustrative, not a measurement.
        </p>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Leaderboard */}
          <div className="lg:col-span-2">
            <Card>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <CardHeader>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="analysts">
                      <Shield className="h-4 w-4 mr-2" />
                      Measured Subjects
                    </TabsTrigger>
                    <TabsTrigger value="reporters">
                      <Users className="h-4 w-4 mr-2" />
                      Corpus Instruments
                    </TabsTrigger>
                  </TabsList>
                </CardHeader>
                <CardContent>
                  <TabsContent value="analysts" className="mt-0">
                  <div className="space-y-3">
                    {topAnalysts.map((analyst, index) => (
                      <motion.div
                        key={analyst.rank}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`flex items-center gap-4 p-3 rounded-lg ${
                          analyst.rank <= 3 ? "bg-gradient-to-r from-yellow-500/10 to-transparent" : "bg-muted/50"
                        }`}
                      >
                        <div className="w-8 flex justify-center">
                          {getRankIcon(analyst.rank)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{analyst.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {analyst.badge}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                            <span>{analyst.cases} cases</span>
                            <span>{analyst.accuracy}% accuracy</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-primary">{analyst.score.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">points</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="reporters" className="mt-0">
                  <div className="space-y-3">
                    {topReporters.map((reporter, index) => (
                      <motion.div
                        key={reporter.rank}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`flex items-center gap-4 p-3 rounded-lg ${
                          reporter.rank <= 3 ? "bg-gradient-to-r from-blue-500/10 to-transparent" : "bg-muted/50"
                        }`}
                      >
                        <div className="w-8 flex justify-center">
                          {getRankIcon(reporter.rank)}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{reporter.name}</div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                            <span>{reporter.reports} reports</span>
                            <span>{reporter.verified} verified</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">{reporter.rate}%</div>
                          <div className="text-xs text-muted-foreground">accuracy</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
          </div>

          {/* Achievements */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-500" />
                  Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {achievements.map((achievement, index) => (
                    <motion.div
                      key={achievement.name}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                    >
                      <div className="p-2 rounded-full bg-primary/10">
                        <achievement.icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{achievement.name}</div>
                        <div className="text-xs text-muted-foreground">{achievement.description}</div>
                        <div className="text-xs text-primary mt-1">{achievement.holders.toLocaleString()} holders</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* How to Participate */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg">How to Participate</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">1</div>
                  <p>Submit AI safety incident reports through our platform or browser extension</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">2</div>
                  <p>Earn points when your reports are verified by certified analysts</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">3</div>
                  <p>Climb the leaderboard and unlock achievements</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">4</div>
                  <p>Become a certified analyst to review and verify reports</p>
                </div>
                <Link href="/training">
                  <Button className="w-full mt-4" variant="outline">
                    <GraduationCap className="h-4 w-4 mr-2" />
                    Start Analyst Training
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
