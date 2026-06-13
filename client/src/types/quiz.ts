/**
 * Quiz Type Definitions
 */

// Passing score percentage required to pass quizzes
export const PASSING_SCORE = 70;

export interface QuizQuestion {
  id: number | string;
  questionText: string;
  options: string[];
  correctAnswer?: number;
  explanation?: string;
  type?: 'multiple_choice' | 'true_false' | 'multi_select';
}

export interface Quiz {
  id: number | string;
  title: string;
  description?: string;
  questions: QuizQuestion[];
  timeLimit?: number; // in minutes
  passingScore?: number; // percentage
}

export interface QuizAnswer {
  questionId: string | number;
  selectedAnswer: number;
  correctAnswer: number;
  isCorrect: boolean;
  answer?: number | number[];
}

export interface QuizResult {
  quizId?: string | number;
  moduleId?: string | number;
  score: number;
  totalQuestions: number;
  percentage?: number;
  passed: boolean;
  completedAt?: string | Date;
  correctAnswers?: number;
  timeSpent?: number;
  answers: QuizAnswer[];
}

export interface QuizAttempt {
  id: number | string;
  quizId: number | string;
  userId?: number;
  startedAt: Date | string;
  completedAt?: Date | string;
  score?: number;
  passed?: boolean;
}

export interface QuizProps {
  quiz?: Quiz;
  questions?: QuizQuestion[];
  courseId?: number | string;
  moduleId?: number | string;
  onComplete: (result: QuizResult) => void;
  onCancel?: () => void;
  showResults?: boolean;
}
