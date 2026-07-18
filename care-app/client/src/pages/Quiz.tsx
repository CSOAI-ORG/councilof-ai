import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import type { QuizQuestion, QuizAttempt, QuizResult } from '@/types/quiz';
import { PASSING_SCORE } from '@/types/quiz';

interface QuizProps {
  questions: QuizQuestion[];
  onComplete: (result: QuizResult) => void;
}

export function Quiz({ questions, onComplete }: QuizProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [quizComplete, setQuizComplete] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  const handleAnswerSelect = (answerIndex: number) => {
    if (showFeedback) return; // Prevent changing answer after submission
    setSelectedAnswer(answerIndex);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return;

    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    const attempt: QuizAttempt = {
      questionId: currentQuestion.id,
      selectedAnswer,
      isCorrect,
    };

    setAttempts([...attempts, attempt]);
    setShowFeedback(true);
  };

  const handleNextQuestion = () => {
    if (isLastQuestion) {
      // Calculate final score
      const allAttempts = [...attempts, {
        questionId: currentQuestion.id,
        selectedAnswer: selectedAnswer!,
        isCorrect: selectedAnswer === currentQuestion.correctAnswer,
      }];
      
      const score = allAttempts.filter(a => a.isCorrect).length;
      const percentage = Math.round((score / questions.length) * 100);
      const passed = percentage >= PASSING_SCORE;

      const finalResult: QuizResult = {
        score,
        totalQuestions: questions.length,
        percentage,
        passed,
        attempts: allAttempts,
      };

      setResult(finalResult);
      setQuizComplete(true);
      onComplete(finalResult);
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    }
  };

  const handleRetry = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setAttempts([]);
    setQuizComplete(false);
    setResult(null);
  };

  if (quizComplete && result) {
    return (
      <Card className="p-8">
        <div className="text-center space-y-6">
          {result.passed ? (
            <>
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
              <div>
                <h3 className="text-2xl font-bold text-green-600">Congratulations!</h3>
                <p className="text-muted-foreground mt-2">
                  You passed the quiz with a score of {result.percentage}%
                </p>
              </div>
            </>
          ) : (
            <>
              <XCircle className="w-16 h-16 text-red-500 mx-auto" />
              <div>
                <h3 className="text-2xl font-bold text-red-600">Quiz Not Passed</h3>
                <p className="text-muted-foreground mt-2">
                  You scored {result.percentage}%. You need {PASSING_SCORE}% to pass.
                </p>
              </div>
            </>
          )}

          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm font-medium">
              Score: {result.score} / {result.totalQuestions} correct
            </p>
          </div>

          {!result.passed && (
            <Button onClick={handleRetry} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Retry Quiz
            </Button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Progress */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
          <span>{Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}% Complete</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all"
            style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
          />
        </div>

        {/* Question */}
        <div>
          <h3 className="text-lg font-semibold mb-4">{currentQuestion.question}</h3>

          {/* Options */}
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrect = index === currentQuestion.correctAnswer;
              const showCorrect = showFeedback && isCorrect;
              const showIncorrect = showFeedback && isSelected && !isCorrect;

              return (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={showFeedback}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    showCorrect
                      ? 'border-green-500 bg-green-50 dark:bg-green-950'
                      : showIncorrect
                      ? 'border-red-500 bg-red-50 dark:bg-red-950'
                      : isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  } ${showFeedback ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center justify-between">
                    <span>{option}</span>
                    {showCorrect && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                    {showIncorrect && <XCircle className="w-5 h-5 text-red-500" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Feedback */}
        {showFeedback && (
          <div className={`p-4 rounded-lg ${
            selectedAnswer === currentQuestion.correctAnswer
              ? 'bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800'
          }`}>
            <p className="text-sm font-medium mb-2">
              {selectedAnswer === currentQuestion.correctAnswer ? 'Correct!' : 'Incorrect'}
            </p>
            <p className="text-sm text-muted-foreground">{currentQuestion.explanation}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          {!showFeedback ? (
            <Button
              onClick={handleSubmitAnswer}
              disabled={selectedAnswer === null}
            >
              Submit Answer
            </Button>
          ) : (
            <Button onClick={handleNextQuestion}>
              {isLastQuestion ? 'View Results' : 'Next Question'}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
