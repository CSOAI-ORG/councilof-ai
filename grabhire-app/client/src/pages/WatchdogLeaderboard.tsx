/**
 * Public Watchdog Leaderboard
 * Shows top analysts, most active reporters, and incident statistics
 */

import { useState } from "react";
import { Link } from "wouter";
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

// Mock leaderboard data - in production this would come from the API
const topAnalysts = [
  { rank: 1, name: "Sarah Chen", score: 2847, cases: 156, accuracy: 98.2, badge: "Elite Analyst" },
  { rank: 2, name: "Marcus Johnson", score: 2634, cases: 142, accuracy: 97.8, badge: "Senior Analyst" },
  { rank: 3, name: "Elena Rodriguez", score: 2521, cases: 138, accuracy: 96.5, badge: "Senior Analyst" },
  { rank: 4, name: "David Kim", score: 2398, cases: 127, accuracy: 95.9, badge: "Analyst" },
  { rank: 5, name: "Priya Patel", score: 2245, cases: 119, accuracy: 95.2, badge: "Analyst" },
  { rank: 6, name: "James Wilson", score: 2156, cases: 112, accuracy: 94.8, badge: "Analyst" },
  { rank: 7, name: "Aisha Mohammed", score: 2089, cases: 105, accuracy: 94.3, badge: "Analyst" },
  { rank: 8, name: "Michael Brown", score: 1967, cases: 98, accuracy: 93.7, badge: "Junior Analyst" },
  { rank: 9, name: "Lisa Zhang", score: 1845, cases: 92, accuracy: 93.1, badge: "Junior Analyst" },
  { rank: 10, name: "Robert Taylor", score: 1756, cases: 87, accuracy: 92.5, badge: "Junior Analyst" },
];

const topReporters = [
  { rank: 1, name: "TechWatch_AI", reports: 89, verified: 76, rate: 85.4 },
  { rank: 2, name: "SafetyFirst2024", reports: 72, verified: 61, rate: 84.7 },
  { rank: 3, name: "AIGuardian", reports: 65, verified: 54, rate: 83.1 },
  { rank: 4, name: "EthicsMonitor", reports: 58, verified: 47, rate: 81.0 },
  { rank: 5, name: "DigitalWatchdog", reports: 52, verified: 41, rate: 78.8 },
];

const monthlyStats = {
  totalReports: 1247,
  verifiedIncidents: 892,
  resolvedCases: 756,
  avgResolutionTime: "4.2 days",
  topCategory: "Bias Detection",
  growthRate: 23.5,
};

const achievements = [
  { icon: Trophy, name: "First Report", description: "Submit your first incident report", holders: 3421 },
  { icon: Target, name: "Sharp Eye", description: "10 verified reports", holders: 892 },
  { icon: Zap, name: "Quick Draw", description: "Report within 1 hour of incident", holders: 456 },
  { icon: Crown, name: "Elite Reporter", description: "50+ verified reports", holders: 89 },
  { icon: Shield, name: "Guardian", description: "100+ verified reports", holders: 23 },
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
                <h1 className="text-xl font-bold">Watchdog Leaderboard</h1>
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
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{monthlyStats.totalReports.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Total Reports</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{monthlyStats.verifiedIncidents}</div>
              <div className="text-xs text-muted-foreground">Verified</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{monthlyStats.resolvedCases}</div>
              <div className="text-xs text-muted-foreground">Resolved</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{monthlyStats.avgResolutionTime}</div>
              <div className="text-xs text-muted-foreground">Avg Resolution</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{monthlyStats.topCategory}</div>
              <div className="text-xs text-muted-foreground">Top Category</div>
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
                      Top Analysts
                    </TabsTrigger>
                    <TabsTrigger value="reporters">
                      <Users className="h-4 w-4 mr-2" />
                      Top Reporters
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
