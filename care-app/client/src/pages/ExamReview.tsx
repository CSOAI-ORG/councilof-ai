/**
 * Exam Review Page
 * Displays post-exam review with answers and explanations
 */

import { useState, useMemo } from "react";
import { useLocation, useSearch } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Filter,
  BookOpen,
  Award,
  Clock,
  Target,
  Lightbulb,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";

type FilterType = "all" | "correct" | "incorrect" | "unanswered";

interface ReviewQuestion {
  id: number;
  questionText: string;
  questionType: string;
  options: { id: string; text: string }[];
  points: number;
  difficulty: string;
  userAnswer: string | null;
  correctAnswer: string;
  isCorrect: boolean;
  explanation: string | null;
}

export default function ExamReview() {
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const attemptId = parseInt(params.get("attemptId") || "0");

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [filter, setFilter] = useState<FilterType>("all");

  // Fetch review data
  const { data: reviewData, isLoading, error } = trpc.certification.getAttemptReview.useQuery(
    { attemptId },
    { enabled: attemptId > 0 }
  );

  // Filter questions based on selection
  const filteredQuestions = useMemo(() => {
    if (!reviewData?.questions) return [];

    const questions = reviewData.questions as unknown as ReviewQuestion[];

    switch (filter) {
      case "correct":
        return questions.filter((q) => q.isCorrect);
      case "incorrect":
        return questions.filter((q) => !q.isCorrect && q.userAnswer);
      case "unanswered":
        return questions.filter((q) => !q.userAnswer);
      default:
        return questions;
    }
  }, [reviewData?.questions, filter]);

  const currentQuestion = filteredQuestions[currentQuestionIndex] as ReviewQuestion | undefined;

  // Navigation handlers
  const handlePrevQuestion = () => {
    setCurrentQuestionIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNextQuestion = () => {
    setCurrentQuestionIndex((prev) => Math.min(filteredQuestions.length - 1, prev + 1));
  };

  const handleGoToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  // Reset index when filter changes
  const handleFilterChange = (newFilter: FilterType) => {
    setFilter(newFilter);
    setCurrentQuestionIndex(0);
  };

  // Format date
  const formatDate = (date: string | Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
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

  // Error state
  if (error || !reviewData) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <h2 className="text-xl font-semibold">Unable to load review</h2>
          <p className="text-muted-foreground">
            {error?.message || "The exam attempt could not be found."}
          </p>
          <Button onClick={() => navigate("/training")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Training
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  // Extract data - support both nested and flat structures
  const attempt = (reviewData as any).attempt || reviewData;
  const test = (reviewData as any).test || { title: reviewData.testTitle };
  const summary = (reviewData as any).summary || {
    totalQuestions: reviewData.questions?.length || 0,
    correct: reviewData.questions?.filter((q: any) => q.isCorrect).length || 0,
    incorrect: reviewData.questions?.filter((q: any) => !q.isCorrect && q.selectedAnswer !== undefined).length || 0,
    unanswered: reviewData.questions?.filter((q: any) => q.selectedAnswer === undefined).length || 0,
  };

  return (
    <DashboardLayout>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="border-b bg-card px-6 py-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate("/training")}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="text-xl font-semibold">Exam Review</h1>
                  <p className="text-sm text-muted-foreground">
                    {test?.title} • Completed {formatDate(attempt.completedAt!)}
                  </p>
                </div>
              </div>

              {/* Score Badge */}
              <div className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg",
                attempt.passed 
                  ? "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300"
                  : "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300"
              )}>
                {attempt.passed ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <XCircle className="h-5 w-5" />
                )}
                <span className="font-bold text-lg">{attempt.percentScore}%</span>
                <span className="text-sm">
                  ({attempt.score}/{attempt.totalPoints} points)
                </span>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-4 gap-4 mt-4">
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold">{summary.totalQuestions}</div>
                <div className="text-xs text-muted-foreground">Total Questions</div>
              </div>
              <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {summary.correctCount}
                </div>
                <div className="text-xs text-muted-foreground">Correct</div>
              </div>
              <div className="bg-red-50 dark:bg-red-950/30 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {summary.incorrectCount}
                </div>
                <div className="text-xs text-muted-foreground">Incorrect</div>
              </div>
              <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {summary.unansweredCount}
                </div>
                <div className="text-xs text-muted-foreground">Unanswered</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Question panel */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-3xl mx-auto">
              {/* Filter */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={filter} onValueChange={(v) => handleFilterChange(v as FilterType)}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filter questions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Questions</SelectItem>
                      <SelectItem value="correct">Correct Only</SelectItem>
                      <SelectItem value="incorrect">Incorrect Only</SelectItem>
                      <SelectItem value="unanswered">Unanswered Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-sm text-muted-foreground">
                  Showing {filteredQuestions.length} of {summary.totalQuestions} questions
                </div>
              </div>

              {/* Question Card */}
              {filteredQuestions.length > 0 && currentQuestion ? (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentQuestion.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className={cn(
                      "border-2",
                      currentQuestion.isCorrect 
                        ? "border-green-200 dark:border-green-800" 
                        : currentQuestion.userAnswer
                          ? "border-red-200 dark:border-red-800"
                          : "border-amber-200 dark:border-amber-800"
                    )}>
                      <CardHeader>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              Question {currentQuestionIndex + 1} of {filteredQuestions.length}
                            </Badge>
                            <Badge 
                              variant={
                                currentQuestion.difficulty === "easy" ? "secondary" :
                                currentQuestion.difficulty === "medium" ? "default" : "destructive"
                              }
                            >
                              {currentQuestion.difficulty}
                            </Badge>
                            <Badge variant="outline">
                              {currentQuestion.points} {currentQuestion.points === 1 ? "point" : "points"}
                            </Badge>
                          </div>
                          {currentQuestion.isCorrect ? (
                            <Badge className="bg-green-500 hover:bg-green-600">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Correct
                            </Badge>
                          ) : currentQuestion.userAnswer ? (
                            <Badge variant="destructive">
                              <XCircle className="h-3 w-3 mr-1" />
                              Incorrect
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-amber-500 text-amber-600">
                              <HelpCircle className="h-3 w-3 mr-1" />
                              Unanswered
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-lg leading-relaxed">
                          {currentQuestion.questionText}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Options */}
                        <div className="space-y-2">
                          {(currentQuestion.options as { id: string; text: string }[]).map((option) => {
                            const isUserAnswer = currentQuestion.userAnswer === option.id;
                            const isCorrectAnswer = currentQuestion.correctAnswer === option.id;

                            return (
                              <div
                                key={option.id}
                                className={cn(
                                  "p-4 rounded-lg border-2 transition-all",
                                  isCorrectAnswer && "border-green-500 bg-green-50 dark:bg-green-950/30",
                                  isUserAnswer && !isCorrectAnswer && "border-red-500 bg-red-50 dark:bg-red-950/30",
                                  !isUserAnswer && !isCorrectAnswer && "border-border"
                                )}
                              >
                                <div className="flex items-start gap-3">
                                  <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm shrink-0",
                                    isCorrectAnswer 
                                      ? "bg-green-500 text-white" 
                                      : isUserAnswer
                                        ? "bg-red-500 text-white"
                                        : "bg-muted"
                                  )}>
                                    {isCorrectAnswer ? (
                                      <CheckCircle2 className="h-4 w-4" />
                                    ) : isUserAnswer ? (
                                      <XCircle className="h-4 w-4" />
                                    ) : (
                                      option.id
                                    )}
                                  </div>
                                  <div className="flex-1 pt-1">
                                    <span>{option.text}</span>
                                    {isCorrectAnswer && (
                                      <span className="ml-2 text-sm text-green-600 dark:text-green-400 font-medium">
                                        (Correct Answer)
                                      </span>
                                    )}
                                    {isUserAnswer && !isCorrectAnswer && (
                                      <span className="ml-2 text-sm text-red-600 dark:text-red-400 font-medium">
                                        (Your Answer)
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Explanation */}
                        {currentQuestion.explanation && (
                          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                              <Lightbulb className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                              <div>
                                <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-1">
                                  Explanation
                                </h4>
                                <p className="text-sm text-blue-600 dark:text-blue-400">
                                  {currentQuestion.explanation}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Navigation buttons */}
                    <div className="flex justify-between mt-6">
                      <Button
                        variant="outline"
                        onClick={handlePrevQuestion}
                        disabled={currentQuestionIndex === 0}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                      </Button>
                      <Button
                        onClick={handleNextQuestion}
                        disabled={currentQuestionIndex === filteredQuestions.length - 1}
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </motion.div>
                </AnimatePresence>
              ) : (
                <Card className="text-center py-12">
                  <CardContent>
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <BookOpen className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No Questions Found</h3>
                    <p className="text-muted-foreground">
                      No questions match the current filter. Try selecting a different filter.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Question navigator sidebar */}
          <div className="w-64 border-l bg-muted/30 p-4 overflow-y-auto">
            <h3 className="font-semibold mb-3 text-sm">Question Navigator</h3>
            <div className="grid grid-cols-5 gap-2">
              {filteredQuestions.map((q, index) => {
                const question = q as ReviewQuestion;
                const isCurrent = index === currentQuestionIndex;

                return (
                  <button
                    key={question.id}
                    onClick={() => handleGoToQuestion(index)}
                    className={cn(
                      "w-10 h-10 rounded-lg text-sm font-medium relative transition-all",
                      isCurrent && "ring-2 ring-primary ring-offset-2",
                      question.isCorrect 
                        ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300" 
                        : question.userAnswer
                          ? "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300"
                          : "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300",
                    )}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-6 space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-100 dark:bg-green-900"></div>
                <span>Correct</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-100 dark:bg-red-900"></div>
                <span>Incorrect</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-amber-100 dark:bg-amber-900"></div>
                <span>Unanswered</span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 space-y-2">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate("/certification/exam")}
              >
                <Target className="h-4 w-4 mr-2" />
                Retake Exam
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate("/training")}
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Back to Training
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
