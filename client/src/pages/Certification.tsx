/*
 * COAI Certification Test Page
 * Take the certification test to become a Watchdog Analyst
 */

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Award,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Download,
  Trophy,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// Sample test questions (will be loaded from database)
const sampleQuestions = [
  {
    id: 1,
    question: "What is the primary purpose of human-in-the-loop (HITL) in AI systems?",
    options: [
      "To replace AI completely",
      "To provide human oversight and intervention when AI confidence is low",
      "To slow down AI processing",
      "To increase AI costs"
    ],
    correctAnswer: 1,
  },
  {
    id: 2,
    question: "Under the EU AI Act, which of the following is classified as a 'high-risk' AI system?",
    options: [
      "A spam filter for emails",
      "A recommendation system for movies",
      "An AI system used for recruitment and hiring decisions",
      "A chatbot for customer service"
    ],
    correctAnswer: 2,
  },
  {
    id: 3,
    question: "What is 'algorithmic bias'?",
    options: [
      "When an algorithm runs too slowly",
      "When an AI system produces systematically unfair outcomes for certain groups",
      "When an algorithm uses too much memory",
      "When an AI system is too accurate"
    ],
    correctAnswer: 1,
  },
  {
    id: 4,
    question: "In the COAI 33-Agent Council, what percentage of votes is needed for consensus?",
    options: [
      "50% (simple majority)",
      "67% (two-thirds majority)",
      "75% (three-quarters majority)",
      "100% (unanimous)"
    ],
    correctAnswer: 1,
  },
  {
    id: 5,
    question: "When reviewing a Watchdog report, what should you do if you're uncertain about the decision?",
    options: [
      "Guess and submit quickly",
      "Always approve to be safe",
      "Always reject to be cautious",
      "Escalate to a senior reviewer or request more information"
    ],
    correctAnswer: 3,
  },
];

type TestState = "intro" | "testing" | "results";

export default function Certification() {
  const [, setLocation] = useLocation();
  const [testState, setTestState] = useState<TestState>("intro");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeRemaining, setTimeRemaining] = useState(60 * 60); // 60 minutes
  const [score, setScore] = useState<number | null>(null);
  const [passed, setPassed] = useState(false);

  const { data: certificates } = trpc.certification.getMyCertificates.useQuery();
  const hasCertificate = certificates && certificates.length > 0;

  const handleStartTest = () => {
    setTestState("testing");
    setCurrentQuestion(0);
    setAnswers({});
    // Start timer (would need useEffect for real implementation)
  };

  const handleAnswer = (questionId: number, answerIndex: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: answerIndex }));
  };

  const handleNext = () => {
    if (currentQuestion < sampleQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
    // Calculate score
    let correct = 0;
    sampleQuestions.forEach(q => {
      if (answers[q.id] === q.correctAnswer) {
        correct++;
      }
    });
    
    const percentScore = (correct / sampleQuestions.length) * 100;
    setScore(percentScore);
    setPassed(percentScore >= 70);
    setTestState("results");

    if (percentScore >= 70) {
      toast.success("Congratulations! You passed the certification test!");
    } else {
      toast.error("You didn't pass this time. Review the material and try again.");
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // If already certified, show certificate
  if (hasCertificate && testState === "intro") {
    return (
      <DashboardLayout>
        <div className="p-6 space-y-6">
          <div className="text-center py-12">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="w-24 h-24 mx-auto bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-6"
            >
              <Trophy className="h-12 w-12 text-green-600 dark:text-green-400" />
            </motion.div>
            
            <h1 className="text-3xl font-bold mb-2">You're Certified!</h1>
            <p className="text-muted-foreground mb-6">
              Certificate Number: {certificates[0].certificateNumber}
            </p>
            
            <div className="flex justify-center gap-4">
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Download Certificate
              </Button>
              <Button onClick={() => setLocation("/workbench")}>
                Go to Analyst Workbench
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {testState === "intro" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
          >
            <Card>
              <CardHeader className="text-center pb-2">
                <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Award className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">
                  COAI Watchdog Analyst Certification
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-center text-muted-foreground">
                  This certification test will assess your understanding of AI safety concepts,
                  compliance frameworks, and case review methodology.
                </p>

                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{sampleQuestions.length}</p>
                    <p className="text-sm text-muted-foreground">Questions</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">60</p>
                    <p className="text-sm text-muted-foreground">Minutes</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">70%</p>
                    <p className="text-sm text-muted-foreground">Passing Score</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">1 Year</p>
                    <p className="text-sm text-muted-foreground">Certificate Validity</p>
                  </div>
                </div>

                <div className="p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-amber-800 dark:text-amber-200">
                        Before you begin
                      </h4>
                      <ul className="text-sm text-amber-700 dark:text-amber-300 mt-1 space-y-1">
                        <li>• Ensure you have a stable internet connection</li>
                        <li>• You cannot pause once you start</li>
                        <li>• All questions must be answered to submit</li>
                        <li>• You can retake the test if you don't pass</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Button onClick={handleStartTest} className="w-full" size="lg">
                  Start Certification Test
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {testState === "testing" && (
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Progress Header */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    Question {currentQuestion + 1} of {sampleQuestions.length}
                  </span>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {formatTime(timeRemaining)}
                  </span>
                </div>
                <Progress 
                  value={((currentQuestion + 1) / sampleQuestions.length) * 100} 
                  className="h-2" 
                />
              </CardContent>
            </Card>

            {/* Question Card */}
            <motion.div
              key={currentQuestion}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold mb-6">
                    {sampleQuestions[currentQuestion].question}
                  </h2>

                  <RadioGroup
                    value={answers[sampleQuestions[currentQuestion].id]?.toString()}
                    onValueChange={(value) => 
                      handleAnswer(sampleQuestions[currentQuestion].id, parseInt(value))
                    }
                    className="space-y-3"
                  >
                    {sampleQuestions[currentQuestion].options.map((option, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center space-x-3 p-4 rounded-lg border transition-colors ${
                          answers[sampleQuestions[currentQuestion].id] === idx
                            ? "border-primary bg-primary/5"
                            : "border-border hover:bg-muted/50"
                        }`}
                      >
                        <RadioGroupItem value={idx.toString()} id={`option-${idx}`} />
                        <Label 
                          htmlFor={`option-${idx}`} 
                          className="flex-1 cursor-pointer"
                        >
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </CardContent>
              </Card>
            </motion.div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentQuestion === 0}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>

              <div className="flex gap-1">
                {sampleQuestions.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentQuestion(idx)}
                    className={`w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                      idx === currentQuestion
                        ? "bg-primary text-primary-foreground"
                        : answers[sampleQuestions[idx].id] !== undefined
                          ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>

              {currentQuestion === sampleQuestions.length - 1 ? (
                <Button 
                  onClick={handleSubmit}
                  disabled={Object.keys(answers).length < sampleQuestions.length}
                >
                  Submit Test
                  <CheckCircle2 className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleNext}>
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        )}

        {testState === "results" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto"
          >
            <Card>
              <CardContent className="p-8 text-center">
                <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6 ${
                  passed 
                    ? "bg-green-100 dark:bg-green-900" 
                    : "bg-red-100 dark:bg-red-900"
                }`}>
                  {passed ? (
                    <Trophy className="h-12 w-12 text-green-600 dark:text-green-400" />
                  ) : (
                    <XCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
                  )}
                </div>

                <h1 className="text-3xl font-bold mb-2">
                  {passed ? "Congratulations!" : "Not Quite There"}
                </h1>
                
                <p className="text-muted-foreground mb-6">
                  {passed 
                    ? "You've passed the COAI Watchdog Analyst Certification!"
                    : "You didn't pass this time, but you can try again."
                  }
                </p>

                <div className="text-6xl font-bold mb-2">
                  {score?.toFixed(0)}%
                </div>
                <p className="text-sm text-muted-foreground mb-6">
                  {Object.keys(answers).length} of {sampleQuestions.length} questions answered correctly
                </p>

                {passed ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                      <p className="text-green-700 dark:text-green-300">
                        Your certificate has been issued. You can now access the Analyst Workbench
                        and start reviewing AI safety cases.
                      </p>
                    </div>
                    
                    <div className="flex justify-center gap-4">
                      <Button variant="outline" className="gap-2">
                        <Download className="h-4 w-4" />
                        Download Certificate
                      </Button>
                      <Button onClick={() => setLocation("/workbench")}>
                        Go to Workbench
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Review the training materials and try again when you're ready.
                    </p>
                    <div className="flex justify-center gap-4">
                      <Button variant="outline" onClick={() => setLocation("/training")}>
                        Review Training
                      </Button>
                      <Button onClick={() => setTestState("intro")}>
                        Try Again
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
