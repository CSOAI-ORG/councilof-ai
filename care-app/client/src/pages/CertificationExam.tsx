/**
 * Certification Exam Page
 * Full exam taking interface with timer, progress tracking, and submission
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Flag,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Award,
  Timer,
  Send,
  X,
  HelpCircle,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";

interface Question {
  id: number;
  questionText: string;
  questionType: "multiple_choice" | "true_false" | "scenario";
  options: { id: string; text: string }[];
  points: number;
  difficulty: "easy" | "medium" | "hard";
}

interface ExamState {
  status: "instructions" | "in_progress" | "submitting" | "results";
  attemptId: number | null;
  currentQuestionIndex: number;
  answers: Record<string, string>;
  flaggedQuestions: Set<number>;
  startTime: Date | null;
  timeRemaining: number; // in seconds
}

export default function CertificationExam() {
  const [, navigate] = useLocation();
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showTimeWarning, setShowTimeWarning] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);

  // Exam state
  const [examState, setExamState] = useState<ExamState>({
    status: "instructions",
    attemptId: null,
    currentQuestionIndex: 0,
    answers: {},
    flaggedQuestions: new Set(),
    startTime: null,
    timeRemaining: 60 * 60, // 60 minutes default
  });

  // Fetch test data
  const { data: testData, isLoading } = trpc.certification.getTestQuestions.useQuery(
    { testId: 1 },
    { enabled: examState.status !== "results" }
  );

  const startTestMutation = trpc.certification.startTest.useMutation();
  const submitTestMutation = trpc.certification.submitTest.useMutation();

  // Timer effect
  useEffect(() => {
    if (examState.status !== "in_progress") return;

    const timer = setInterval(() => {
      setExamState((prev) => {
        const newTimeRemaining = prev.timeRemaining - 1;

        // Show warning at 5 minutes
        if (newTimeRemaining === 300 && !showTimeWarning) {
          setShowTimeWarning(true);
        }

        // Auto-submit at 0
        if (newTimeRemaining <= 0) {
          handleSubmit();
          return prev;
        }

        return { ...prev, timeRemaining: newTimeRemaining };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [examState.status]);

  // Format time remaining
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, []);

  // Questions array
  const questions = useMemo(() => {
    return (testData?.questions || []) as Question[];
  }, [testData]);

  const currentQuestion = questions[examState.currentQuestionIndex];

  // Calculate progress
  const answeredCount = Object.keys(examState.answers).length;
  const progressPercent = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

  // Start the exam
  const handleStartExam = async () => {
    try {
      const result = await startTestMutation.mutateAsync({ testId: 1 });
      setExamState((prev) => ({
        ...prev,
        status: "in_progress",
        attemptId: result.attemptId,
        startTime: new Date(),
        timeRemaining: (testData?.test?.timeLimitMinutes || 60) * 60,
      }));
    } catch (error) {
      console.error("Failed to start exam:", error);
    }
  };

  // Select answer
  const handleSelectAnswer = (questionId: number, answerId: string) => {
    setExamState((prev) => ({
      ...prev,
      answers: {
        ...prev.answers,
        [questionId.toString()]: answerId,
      },
    }));
  };

  // Toggle flag
  const handleToggleFlag = (questionId: number) => {
    setExamState((prev) => {
      const newFlagged = new Set(prev.flaggedQuestions);
      if (newFlagged.has(questionId)) {
        newFlagged.delete(questionId);
      } else {
        newFlagged.add(questionId);
      }
      return { ...prev, flaggedQuestions: newFlagged };
    });
  };

  // Navigate questions
  const handlePrevQuestion = () => {
    setExamState((prev) => ({
      ...prev,
      currentQuestionIndex: Math.max(0, prev.currentQuestionIndex - 1),
    }));
  };

  const handleNextQuestion = () => {
    setExamState((prev) => ({
      ...prev,
      currentQuestionIndex: Math.min(questions.length - 1, prev.currentQuestionIndex + 1),
    }));
  };

  const handleGoToQuestion = (index: number) => {
    setExamState((prev) => ({
      ...prev,
      currentQuestionIndex: index,
    }));
  };

  // Submit exam
  const handleSubmit = async () => {
    if (!examState.attemptId) return;

    setExamState((prev) => ({ ...prev, status: "submitting" }));
    setShowSubmitDialog(false);

    try {
      const result = await submitTestMutation.mutateAsync({
        attemptId: examState.attemptId,
        answers: examState.answers,
      });

      // Navigate to results page with result data
      navigate(`/certification/results?passed=${result.passed}&score=${result.percentScore}&certificate=${result.certificateNumber || ""}&attemptId=${result.attemptId}`);
    } catch (error) {
      console.error("Failed to submit exam:", error);
      setExamState((prev) => ({ ...prev, status: "in_progress" }));
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  // Instructions screen
  if (examState.status === "instructions") {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto p-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/training")}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Training
          </Button>

          <Card className="border-2">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Award className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">
                {testData?.test?.title || "Watchdog Analyst Certification Exam"}
              </CardTitle>
              <CardDescription className="text-base mt-2">
                {testData?.test?.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Exam Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <HelpCircle className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                  <div className="text-2xl font-bold">{questions.length}</div>
                  <div className="text-sm text-muted-foreground">Questions</div>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <Timer className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                  <div className="text-2xl font-bold">{testData?.test?.timeLimitMinutes || 60}</div>
                  <div className="text-sm text-muted-foreground">Minutes</div>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <CheckCircle2 className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                  <div className="text-2xl font-bold">{testData?.test?.passingScore || 70}%</div>
                  <div className="text-sm text-muted-foreground">Passing Score</div>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <Award className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                  <div className="text-2xl font-bold">1 Year</div>
                  <div className="text-sm text-muted-foreground">Validity</div>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Important Instructions
                </h3>
                <ul className="space-y-2 text-sm text-amber-700 dark:text-amber-300">
                  <li className="flex items-start gap-2">
                    <span className="font-bold">•</span>
                    <span>You have <strong>{testData?.test?.timeLimitMinutes || 60} minutes</strong> to complete the exam. The timer starts when you click "Start Exam".</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold">•</span>
                    <span>The exam will auto-submit when time expires. You'll receive a 5-minute warning.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold">•</span>
                    <span>You can flag questions for review and navigate freely between questions.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold">•</span>
                    <span>Scenario questions are worth 2 points; multiple-choice questions are worth 1 point.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold">•</span>
                    <span>You need <strong>{testData?.test?.passingScore || 70}%</strong> to pass and receive your certification.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold">•</span>
                    <span>Do not refresh the page or navigate away during the exam.</span>
                  </li>
                </ul>
              </div>

              {/* Topics Covered */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Topics Covered
                </h3>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">EU AI Act</Badge>
                  <Badge variant="secondary">NIST AI RMF</Badge>
                  <Badge variant="secondary">TC260 Framework</Badge>
                  <Badge variant="secondary">AI Ethics & Bias</Badge>
                  <Badge variant="secondary">Incident Analysis</Badge>
                  <Badge variant="secondary">Watchdog Procedures</Badge>
                </div>
              </div>

              {/* Start Button */}
              <div className="pt-4 flex justify-center">
                <Button
                  size="lg"
                  onClick={handleStartExam}
                  disabled={startTestMutation.isPending}
                  className="px-8"
                >
                  {startTestMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Starting...
                    </>
                  ) : (
                    <>
                      <Timer className="h-5 w-5 mr-2" />
                      Start Exam
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // Submitting state
  if (examState.status === "submitting") {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-lg font-medium">Submitting your exam...</p>
          <p className="text-muted-foreground">Please wait while we grade your answers.</p>
        </div>
      </DashboardLayout>
    );
  }

  // Exam in progress
  return (
    <DashboardLayout>
      <div className="h-full flex flex-col">
        {/* Header with timer and progress */}
        <div className="border-b bg-card px-6 py-3">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            {/* Timer */}
            <div className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg",
              examState.timeRemaining <= 300 
                ? "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300" 
                : "bg-muted"
            )}>
              <Clock className="h-5 w-5" />
              <span className="font-bold">{formatTime(examState.timeRemaining)}</span>
            </div>

            {/* Progress */}
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                {answeredCount} of {questions.length} answered
              </div>
              <Progress value={progressPercent} className="w-32" />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowExitDialog(true)}
              >
                <X className="h-4 w-4 mr-1" />
                Exit
              </Button>
              <Button
                size="sm"
                onClick={() => setShowSubmitDialog(true)}
              >
                <Send className="h-4 w-4 mr-1" />
                Submit Exam
              </Button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Question panel */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-3xl mx-auto">
              <AnimatePresence mode="wait">
                {currentQuestion && (
                  <motion.div
                    key={currentQuestion.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              Question {examState.currentQuestionIndex + 1} of {questions.length}
                            </Badge>
                            <Badge 
                              variant={
                                currentQuestion.difficulty === "easy" ? "secondary" :
                                currentQuestion.difficulty === "medium" ? "default" : "destructive"
                              }
                            >
                              {currentQuestion.difficulty}
                            </Badge>
                            {currentQuestion.questionType === "scenario" && (
                              <Badge variant="outline" className="bg-purple-50 dark:bg-purple-950">
                                Scenario (2 pts)
                              </Badge>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleFlag(currentQuestion.id)}
                            className={cn(
                              examState.flaggedQuestions.has(currentQuestion.id) && "text-amber-500"
                            )}
                          >
                            <Flag className={cn(
                              "h-4 w-4",
                              examState.flaggedQuestions.has(currentQuestion.id) && "fill-amber-500"
                            )} />
                          </Button>
                        </div>
                        <CardTitle className="text-lg leading-relaxed">
                          {currentQuestion.questionText}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {(currentQuestion.options as { id: string; text: string }[]).map((option) => {
                          const isSelected = examState.answers[currentQuestion.id.toString()] === option.id;
                          return (
                            <button
                              key={option.id}
                              onClick={() => handleSelectAnswer(currentQuestion.id, option.id)}
                              className={cn(
                                "w-full text-left p-4 rounded-lg border-2 transition-all",
                                "hover:border-primary/50 hover:bg-primary/5",
                                isSelected 
                                  ? "border-primary bg-primary/10" 
                                  : "border-border"
                              )}
                            >
                              <div className="flex items-start gap-3">
                                <div className={cn(
                                  "w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm shrink-0",
                                  isSelected 
                                    ? "bg-primary text-primary-foreground" 
                                    : "bg-muted"
                                )}>
                                  {option.id}
                                </div>
                                <span className="pt-1">{option.text}</span>
                              </div>
                            </button>
                          );
                        })}
                      </CardContent>
                    </Card>

                    {/* Navigation buttons */}
                    <div className="flex justify-between mt-6">
                      <Button
                        variant="outline"
                        onClick={handlePrevQuestion}
                        disabled={examState.currentQuestionIndex === 0}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                      </Button>
                      <Button
                        onClick={handleNextQuestion}
                        disabled={examState.currentQuestionIndex === questions.length - 1}
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Question navigator sidebar */}
          <div className="w-64 border-l bg-muted/30 p-4 overflow-y-auto">
            <h3 className="font-semibold mb-3 text-sm">Question Navigator</h3>
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, index) => {
                const isAnswered = examState.answers[q.id.toString()];
                const isFlagged = examState.flaggedQuestions.has(q.id);
                const isCurrent = index === examState.currentQuestionIndex;

                return (
                  <button
                    key={q.id}
                    onClick={() => handleGoToQuestion(index)}
                    className={cn(
                      "w-10 h-10 rounded-lg text-sm font-medium relative transition-all",
                      isCurrent && "ring-2 ring-primary ring-offset-2",
                      isAnswered 
                        ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300" 
                        : "bg-muted hover:bg-muted/80",
                    )}
                  >
                    {index + 1}
                    {isFlagged && (
                      <Flag className="absolute -top-1 -right-1 h-3 w-3 text-amber-500 fill-amber-500" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-6 space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-100 dark:bg-green-900"></div>
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-muted"></div>
                <span>Unanswered</span>
              </div>
              <div className="flex items-center gap-2">
                <Flag className="h-4 w-4 text-amber-500 fill-amber-500" />
                <span>Flagged for review</span>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-6 p-3 bg-card rounded-lg border">
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Answered:</span>
                  <span className="font-medium">{answeredCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Unanswered:</span>
                  <span className="font-medium">{questions.length - answeredCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Flagged:</span>
                  <span className="font-medium">{examState.flaggedQuestions.size}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit confirmation dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Exam?</AlertDialogTitle>
            <AlertDialogDescription>
              {questions.length - answeredCount > 0 ? (
                <span className="text-amber-600 dark:text-amber-400">
                  You have {questions.length - answeredCount} unanswered question(s). 
                  Are you sure you want to submit?
                </span>
              ) : (
                "You have answered all questions. Are you ready to submit your exam?"
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Exam</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit}>
              Submit Exam
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Time warning dialog */}
      <Dialog open={showTimeWarning} onOpenChange={setShowTimeWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              5 Minutes Remaining!
            </DialogTitle>
            <DialogDescription>
              You have 5 minutes left to complete your exam. 
              The exam will be automatically submitted when time expires.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowTimeWarning(false)}>
              Continue Exam
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Exit confirmation dialog */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Exit Exam?</AlertDialogTitle>
            <AlertDialogDescription>
              If you exit now, your progress will be lost and you'll need to start over.
              Are you sure you want to exit?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Exam</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => navigate("/training")}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Exit Exam
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
