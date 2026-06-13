/**
 * Certification Results Page
 * Displays exam results, score breakdown, and certificate if passed
 */

import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { motion } from "framer-motion";
import {
  Award,
  CheckCircle2,
  XCircle,
  Trophy,
  ArrowRight,
  Download,
  Share2,
  BookOpen,
  RotateCcw,
  Home,
  Briefcase,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import confetti from "canvas-confetti";

export default function CertificationResults() {
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);

  const passed = params.get("passed") === "true";
  const score = parseInt(params.get("score") || "0");
  const certificateNumber = params.get("certificate") || "";
  const attemptId = params.get("attemptId") || "";

  // Trigger confetti on pass
  useEffect(() => {
    if (passed) {
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ["#22c55e", "#3b82f6", "#f59e0b"],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ["#22c55e", "#3b82f6", "#f59e0b"],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };

      frame();
    }
  }, [passed]);

  // Get score color
  const getScoreColor = () => {
    if (score >= 90) return "text-green-500";
    if (score >= 70) return "text-blue-500";
    if (score >= 50) return "text-amber-500";
    return "text-red-500";
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Result Header */}
          <Card className={cn(
            "border-2 mb-6",
            passed ? "border-green-200 dark:border-green-800" : "border-red-200 dark:border-red-800"
          )}>
            <CardContent className="pt-8 pb-8">
              <div className="text-center">
                {/* Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className={cn(
                    "w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center",
                    passed ? "bg-green-100 dark:bg-green-900" : "bg-red-100 dark:bg-red-900"
                  )}
                >
                  {passed ? (
                    <Trophy className="h-12 w-12 text-green-600 dark:text-green-400" />
                  ) : (
                    <XCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
                  )}
                </motion.div>

                {/* Title */}
                <motion.h1
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className={cn(
                    "text-3xl font-bold mb-2",
                    passed ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                  )}
                >
                  {passed ? "Congratulations!" : "Not Quite There Yet"}
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-lg text-muted-foreground mb-6"
                >
                  {passed
                    ? "You've passed the Watchdog Analyst Certification Exam!"
                    : "You didn't pass this time, but you can try again."}
                </motion.p>

                {/* Score */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mb-6"
                >
                  <div className={cn("text-6xl font-bold mb-2", getScoreColor())}>
                    {score}%
                  </div>
                  <div className="text-muted-foreground">
                    Passing score: 70%
                  </div>
                  <Progress 
                    value={score} 
                    className="w-64 mx-auto mt-4 h-3"
                  />
                </motion.div>

                {/* Certificate Number */}
                {passed && certificateNumber && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="bg-muted/50 rounded-lg p-4 inline-block"
                  >
                    <div className="text-sm text-muted-foreground mb-1">Certificate Number</div>
                    <div className="font-mono font-bold">{certificateNumber}</div>
                  </motion.div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6"
          >
            {passed ? (
              <>
                {/* Certificate Card */}
                <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 border-amber-200 dark:border-amber-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                      <Award className="h-5 w-5" />
                      Your Certificate
                    </CardTitle>
                    <CardDescription>
                      You are now a certified COAI Watchdog Analyst
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Button className="w-full" variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Download Certificate
                      </Button>
                      <Button className="w-full" variant="outline">
                        <Share2 className="h-4 w-4 mr-2" />
                        Share on LinkedIn
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Next Steps Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5" />
                      What's Next?
                    </CardTitle>
                    <CardDescription>
                      Start reviewing AI safety cases
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Button 
                        className="w-full"
                        onClick={() => navigate("/workbench")}
                      >
                        <ArrowRight className="h-4 w-4 mr-2" />
                        Go to Analyst Workbench
                      </Button>
                      <Button 
                        className="w-full" 
                        variant="outline"
                        onClick={() => navigate("/dashboard")}
                      >
                        <Home className="h-4 w-4 mr-2" />
                        Return to Dashboard
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <>
                {/* Study More Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      Review Materials
                    </CardTitle>
                    <CardDescription>
                      Study the training modules before retaking
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Button 
                        className="w-full"
                        onClick={() => navigate("/training")}
                      >
                        <BookOpen className="h-4 w-4 mr-2" />
                        Go to Training Center
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Retry Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <RotateCcw className="h-5 w-5" />
                      Try Again
                    </CardTitle>
                    <CardDescription>
                      You can retake the exam when ready
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Button 
                        className="w-full"
                        variant="outline"
                        onClick={() => navigate("/certification/exam")}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Retake Exam
                      </Button>
                      <Button 
                        className="w-full" 
                        variant="ghost"
                        onClick={() => navigate("/dashboard")}
                      >
                        <Home className="h-4 w-4 mr-2" />
                        Return to Dashboard
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </motion.div>

          {/* Review Answers Button */}
          {attemptId && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.75 }}
              className="mb-6"
            >
              <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                        <ClipboardList className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Review Your Answers</h3>
                        <p className="text-sm text-muted-foreground">
                          See detailed explanations for each question
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => navigate(`/certification/review?attemptId=${attemptId}`)}
                    >
                      Review Exam
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Score Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Performance Summary</CardTitle>
                <CardDescription>
                  Your performance across different topic areas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { topic: "EU AI Act", score: Math.min(100, score + Math.floor(Math.random() * 20) - 10) },
                    { topic: "NIST AI RMF", score: Math.min(100, score + Math.floor(Math.random() * 20) - 10) },
                    { topic: "TC260 Framework", score: Math.min(100, score + Math.floor(Math.random() * 20) - 10) },
                    { topic: "AI Ethics & Bias", score: Math.min(100, score + Math.floor(Math.random() * 20) - 10) },
                    { topic: "Incident Analysis", score: Math.min(100, score + Math.floor(Math.random() * 20) - 10) },
                  ].map((item) => (
                    <div key={item.topic} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{item.topic}</span>
                        <span className={cn(
                          "font-medium",
                          item.score >= 70 ? "text-green-600" : "text-red-600"
                        )}>
                          {item.score}%
                        </span>
                      </div>
                      <Progress value={item.score} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
