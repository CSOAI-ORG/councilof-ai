/**
 * WidgetCoursePlayer - Self-contained course player with module navigation and quizzes
 * localStorage-based progress tracking, no backend dependencies
 */

import { useState, useEffect } from 'react';
import { Link, useParams } from 'wouter';
import ReactMarkdown from 'react-markdown';
import { widgetCourses } from '@/data/widget-courses';
import { getModuleQuiz } from '@/data/quizzes';
import { Quiz } from '@/components/Quiz';
import type { QuizResult } from '@/types/quiz';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, CheckCircle2, Circle, BookOpen } from 'lucide-react';
// Layout is handled by the WidgetRouter in App.tsx

// Simple separator component since shadcn separator may not be installed
const Separator = () => <hr className="my-6 border-gray-200" />;

export default function WidgetCoursePlayer() {
  const { courseId } = useParams<{ courseId: string }>();
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [completedModules, setCompletedModules] = useState<number[]>([]);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizPassed, setQuizPassed] = useState(false);

  const courseIdNum = parseInt(courseId || '0');
  const course = widgetCourses.find(c => c.id === courseIdNum);

  // Load progress from localStorage
  useEffect(() => {
    if (!course) return;

    const progressKey = `widget_progress_${course.id}`;
    const positionKey = `widget_position_${course.id}`;

    const savedProgress = localStorage.getItem(progressKey);
    const savedPosition = localStorage.getItem(positionKey);

    if (savedProgress) {
      try {
        setCompletedModules(JSON.parse(savedProgress));
      } catch (e) {
        // Ignore parse errors
      }
    }

    if (savedPosition) {
      try {
        setCurrentModuleIndex(parseInt(JSON.parse(savedPosition)));
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, [course?.id]);

  // Save position to localStorage when it changes
  useEffect(() => {
    if (!course) return;
    const positionKey = `widget_position_${course.id}`;
    localStorage.setItem(positionKey, JSON.stringify(currentModuleIndex));
  }, [currentModuleIndex, course?.id]);

  if (!course) {
    return (
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Course Not Found</h1>
          <p className="text-gray-600 mb-6">The requested course could not be found.</p>
          <Link href="/widget">
            <Button variant="outline">Back to Courses</Button>
          </Link>
        </div>
    );
  }

  const currentModule = course.modules[currentModuleIndex];
  const completionPercentage = Math.round((completedModules.length / course.moduleCount) * 100);
  const isAllComplete = completedModules.length === course.moduleCount;

  const handleModuleQuizComplete = (result: QuizResult) => {
    if (result.passed) {
      // Mark module as complete
      if (!completedModules.includes(currentModuleIndex)) {
        const updatedCompleted = [...completedModules, currentModuleIndex];
        setCompletedModules(updatedCompleted);
        localStorage.setItem(
          `widget_progress_${course.id}`,
          JSON.stringify(updatedCompleted)
        );
      }
      setQuizPassed(true);
      setShowQuiz(false);
    }
    // If failed, user can retry
  };

  const handleNextModule = () => {
    if (currentModuleIndex < course.modules.length - 1) {
      setCurrentModuleIndex(currentModuleIndex + 1);
      setShowQuiz(false);
      setQuizPassed(false);
      window.scrollTo(0, 0);
    }
  };

  const handlePreviousModule = () => {
    if (currentModuleIndex > 0) {
      setCurrentModuleIndex(currentModuleIndex - 1);
      setShowQuiz(false);
      setQuizPassed(false);
      window.scrollTo(0, 0);
    }
  };

  const handleStartQuiz = () => {
    setShowQuiz(true);
  };

  return (
      <div className="space-y-6">
        {/* Header with back button */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/widget">
              <Button variant="ghost" size="sm" className="gap-2">
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{course.name}</h1>
              <p className="text-sm text-gray-600">{course.framework}</p>
            </div>
          </div>
          <Badge variant="secondary">{course.level}</Badge>
        </div>

        {/* Progress bar */}
        <Card className="p-4 shadow-sm">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Overall Progress</span>
              <span className="text-sm font-semibold text-gray-900">{completionPercentage}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
            <p className="text-xs text-gray-500">
              {completedModules.length} of {course.moduleCount} modules completed
            </p>
          </div>
        </Card>

        {/* Completion celebration */}
        {isAllComplete && (
          <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <div className="text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto" />
              <div>
                <h3 className="text-xl font-bold text-green-900">Course Complete!</h3>
                <p className="text-green-800 mt-1">
                  You have successfully completed all modules and quizzes.
                </p>
              </div>
              <Badge className="bg-green-600 text-white">Certification Earned</Badge>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Module Navigation */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-2">
              <h3 className="font-semibold text-gray-900 mb-4 text-sm uppercase tracking-wider">
                Modules
              </h3>
              <div className="space-y-2">
                {course.modules.map((module, idx) => {
                  const isCompleted = completedModules.includes(idx);
                  const isCurrent = idx === currentModuleIndex;

                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setCurrentModuleIndex(idx);
                        setShowQuiz(false);
                        setQuizPassed(false);
                      }}
                      className={`w-full text-left p-3 rounded-lg transition-all ${
                        isCurrent
                          ? 'bg-emerald-100 border-2 border-emerald-500'
                          : isCompleted
                          ? 'bg-gray-100 hover:bg-gray-200'
                          : 'bg-white border border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Module {idx + 1}
                          </p>
                          <p className="text-sm font-medium text-gray-900 line-clamp-2">
                            {module.title}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Module Title */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Badge variant="outline" className="bg-emerald-50">
                  Module {currentModuleIndex + 1} of {course.moduleCount}
                </Badge>
                {completedModules.includes(currentModuleIndex) && (
                  <Badge className="bg-green-600 text-white gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Completed
                  </Badge>
                )}
              </div>
              <h2 className="text-3xl font-bold text-gray-900">{currentModule.title}</h2>
            </div>

            <Separator />

            {/* Module Content */}
            {!showQuiz ? (
              <Card className="p-8 prose prose-sm max-w-none bg-white">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => (
                      <h1 className="text-2xl font-bold mt-6 mb-4 text-gray-900">{children}</h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-xl font-bold mt-5 mb-3 text-gray-900">{children}</h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-lg font-bold mt-4 mb-2 text-gray-900">{children}</h3>
                    ),
                    p: ({ children }) => (
                      <p className="text-gray-700 mb-4 leading-relaxed">{children}</p>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc list-inside mb-4 space-y-2 text-gray-700">{children}</ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal list-inside mb-4 space-y-2 text-gray-700">{children}</ol>
                    ),
                    li: ({ children }) => (
                      <li className="text-gray-700">{children}</li>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-emerald-500 pl-4 italic text-gray-600 my-4">
                        {children}
                      </blockquote>
                    ),
                    code: ({ children }) => (
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm text-gray-800">{children}</code>
                    ),
                    table: ({ children }) => (
                      <table className="w-full border-collapse border border-gray-300 my-4">{children}</table>
                    ),
                    tr: ({ children }) => (
                      <tr className="border border-gray-300">{children}</tr>
                    ),
                    th: ({ children }) => (
                      <th className="border border-gray-300 bg-gray-100 px-4 py-2 text-left font-semibold text-gray-900">
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td className="border border-gray-300 px-4 py-2 text-gray-700">{children}</td>
                    ),
                  }}
                >
                  {currentModule.content}
                </ReactMarkdown>
              </Card>
            ) : (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Module Quiz</h3>
                <div className="space-y-4">
                  {getModuleQuiz(course.id, currentModuleIndex) ? (
                    <Quiz
                      questions={getModuleQuiz(course.id, currentModuleIndex)!}
                      onComplete={handleModuleQuizComplete}
                    />
                  ) : (
                    <Card className="p-6 text-center">
                      <p className="text-gray-600">Quiz not found for this module.</p>
                    </Card>
                  )}
                </div>
              </div>
            )}

            <Separator />

            {/* Quiz/Navigation Section */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <Button
                onClick={handlePreviousModule}
                disabled={currentModuleIndex === 0}
                variant="outline"
                className="gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous Module
              </Button>

              {!showQuiz && !quizPassed && !completedModules.includes(currentModuleIndex) && (
                <Button
                  onClick={handleStartQuiz}
                  className="bg-emerald-600 hover:bg-emerald-700 gap-2"
                >
                  <BookOpen className="w-4 h-4" />
                  Start Quiz
                </Button>
              )}

              {(quizPassed || completedModules.includes(currentModuleIndex)) && (
                <Button
                  onClick={handleNextModule}
                  disabled={currentModuleIndex === course.modules.length - 1}
                  className="bg-emerald-600 hover:bg-emerald-700 gap-2"
                >
                  Next Module
                  <ChevronRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
  );
}
