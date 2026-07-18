/**
 * Quiz Component
 * Interactive quiz for course modules
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, ArrowRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { Quiz as QuizType, QuizQuestion } from "@/data/quizzes";

interface QuizProps {
  quiz?: QuizType;
  questions?: QuizQuestion[];
  onComplete: (result: { score: number; totalQuestions: number; percentage: number; passed: boolean; answers: any[] }) => void;
}

function QuizComponent({ quiz, questions: propsQuestions, onComplete }: QuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  // Support both quiz object and questions array
  const questions = quiz?.questions || propsQuestions || [];
  const quizTitle = quiz?.title || 'Module Quiz';

  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  const handleAnswerSelect = (index: number) => {
    if (showResult) return;
    setSelectedAnswer(index);
  };

  const handleSubmit = () => {
    if (selectedAnswer === null) return;

    setShowResult(true);
    if (selectedAnswer === question.correctAnswer) {
      setScore(score + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setIsComplete(true);
      const finalScore = score + (selectedAnswer === question.correctAnswer ? 1 : 0);
      const percentage = Math.round((finalScore / questions.length) * 100);
      onComplete({
        score: finalScore,
        totalQuestions: questions.length,
        percentage,
        passed: percentage >= 70,
        answers: [],
      });
    }
  };

  const handleRetry = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setIsComplete(false);
  };

  if (isComplete) {
    const finalScore = score + (selectedAnswer === question.correctAnswer ? 1 : 0);
    const percentage = Math.round((finalScore / questions.length) * 100);
    const passed = percentage >= 70;

    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 ${
              passed ? 'bg-green-100' : 'bg-red-100'
            }`}
          >
            {passed ? (
              <CheckCircle className="h-10 w-10 text-green-600" />
            ) : (
              <XCircle className="h-10 w-10 text-red-600" />
            )}
          </motion.div>

          <h2 className="text-2xl font-bold mb-2">
            {passed ? 'Congratulations!' : 'Keep Learning!'}
          </h2>

          <p className="text-muted-foreground mb-4">
            You scored {finalScore} out of {questions.length} ({percentage}%)
          </p>

          <p className="text-sm text-muted-foreground mb-6">
            {passed
              ? 'You have successfully completed this quiz.'
              : 'You need at least 70% to pass. Review the material and try again.'}
          </p>

          {!passed && (
            <Button onClick={handleRetry} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center mb-2">
          <CardTitle className="text-lg">{quizTitle}</CardTitle>
          <span className="text-sm text-muted-foreground">
            Question {currentQuestion + 1} of {questions.length}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </CardHeader>

      <CardContent className="space-y-6">
        <h3 className="text-lg font-medium">{question.question}</h3>

        <div className="space-y-3">
          {question.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrect = index === question.correctAnswer;
            const showCorrect = showResult && isCorrect;
            const showIncorrect = showResult && isSelected && !isCorrect;

            return (
              <motion.button
                key={index}
                whileHover={{ scale: showResult ? 1 : 1.01 }}
                whileTap={{ scale: showResult ? 1 : 0.99 }}
                onClick={() => handleAnswerSelect(index)}
                disabled={showResult}
                className={`w-full p-4 rounded-lg border text-left transition-colors ${
                  showCorrect
                    ? 'border-green-500 bg-green-50 text-green-900'
                    : showIncorrect
                    ? 'border-red-500 bg-red-50 text-red-900'
                    : isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full border flex items-center justify-center text-sm ${
                    showCorrect
                      ? 'border-green-500 bg-green-500 text-white'
                      : showIncorrect
                      ? 'border-red-500 bg-red-500 text-white'
                      : isSelected
                      ? 'border-primary bg-primary text-white'
                      : 'border-border'
                  }`}>
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span>{option}</span>
                </div>
              </motion.button>
            );
          })}
        </div>

        {showResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-lg ${
              selectedAnswer === question.correctAnswer
                ? 'bg-green-50 border border-green-200'
                : 'bg-amber-50 border border-amber-200'
            }`}
          >
            <p className="text-sm">{question.explanation}</p>
          </motion.div>
        )}

        <div className="flex justify-end gap-3">
          {!showResult ? (
            <Button
              onClick={handleSubmit}
              disabled={selectedAnswer === null}
            >
              Submit Answer
            </Button>
          ) : (
            <Button onClick={handleNext} className="gap-2">
              {currentQuestion < questions.length - 1 ? 'Next Question' : 'Complete Quiz'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}


// Named export for compatibility
export { QuizComponent as Quiz };
export default QuizComponent;
