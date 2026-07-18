export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number; // Index of correct option
  explanation: string;
}

export interface QuizAttempt {
  questionId: number;
  selectedAnswer: number;
  isCorrect: boolean;
}

export interface QuizResult {
  score: number;
  totalQuestions: number;
  percentage: number;
  passed: boolean;
  attempts: QuizAttempt[];
}

export const PASSING_SCORE = 70; // 70% required to pass
