/**
 * FreeCoursePlayer - Wraps the widget course player for use on the main site
 * Self-contained, no backend required, localStorage progress tracking
 * Provides full course content with quizzes for all 7 regional framework courses
 */

import { useState, useEffect } from 'react';
import { Link, useParams } from 'wouter';
import ReactMarkdown from 'react-markdown';
import { widgetCourses } from '@/data/widget-courses';
import { getModuleQuiz } from '@/data/quizzes/index';
import { Quiz } from '@/components/Quiz';
import type { QuizResult } from '@/types/quiz';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, CheckCircle2, Circle, BookOpen, Award, Clock } from 'lucide-react';

const Separator = () => <hr className="my-6 border-gray-200" />;

export default function FreeCoursePlayer() {
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
    const progressKey = `free_progress_${course.id}`;
    const positionKey = `free_position_${course.id}`;
    const savedProgress = localStorage.getItem(progressKey);
    const savedPosition = localStorage.getItem(positionKey);
    if (savedProgress) {
      try { setCompletedModules(JSON.parse(savedProgress)); } catch (e) {}
    }
    if (savedPosition) {
      try { setCurrentModuleIndex(parseInt(JSON.parse(savedPosition))); } catch (e) {}
    }
  }, [course?.id]);

  // Save position
  useEffect(() => {
    if (!course) return;
    localStorage.setItem(`free_position_${course.id}`, JSON.stringify(currentModuleIndex));
  }, [currentModuleIndex, course?.id]);

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Course Not Found</h1>
          <p className="text-gray-600 mb-6">The requested course could not be found.</p>
          <Link href="/training">
            <Button variant="outline">Back to Training</Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentModule = course.modules[currentModuleIndex];
  const completionPercentage = Math.round((completedModules.length / course.moduleCount) * 100);
  const isAllComplete = completedModules.length === course.moduleCount;

  const handleModuleQuizComplete = (result: QuizResult) => {
    if (result.passed) {
      if (!completedModules.includes(currentModuleIndex)) {
        const updatedCompleted = [...completedModules, currentModuleIndex];
        setCompletedModules(updatedCompleted);
        localStorage.setItem(`free_progress_${course.id}`, JSON.stringify(updatedCompleted));
      }
      setQuizPassed(true);
      setShowQuiz(false);
    }
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Course Header */}
      <div className="bg-gradient-to-r from-[#1a1a2e] to-[#16213e] text-white py-6">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/training">
                <Button variant="ghost" size="sm" className="gap-2 text-white hover:bg-white/10">
                  <ChevronLeft className="w-4 h-4" />
                  Back to Training
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">{course.name}</h1>
                <div className="flex items-center gap-3 mt-1">
                  <Badge className="bg-green-500 text-white border-0">100% FREE</Badge>
                  <span className="text-sm text-gray-300 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {course.duration}
                  </span>
                  <span className="text-sm text-gray-300 flex items-center gap-1">
                    <BookOpen className="w-3 h-3" /> {course.moduleCount} modules
                  </span>
                </div>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm text-gray-300">Progress</p>
                <p className="text-lg font-bold">{completionPercentage}%</p>
              </div>
              <div className="w-32">
                <Progress value={completionPercentage} className="h-2" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 max-w-7xl py-8">
        {/* Completion celebration */}
        {isAllComplete && (
          <Card className="p-6 mb-8 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <div className="text-center space-y-3">
              <Award className="w-12 h-12 text-green-600 mx-auto" />
              <div>
                <h3 className="text-xl font-bold text-green-900">Course Complete!</h3>
                <p className="text-green-800 mt-1">
                  You have successfully completed all {course.moduleCount} modules and quizzes for {course.name}.
                </p>
              </div>
              <div className="flex justify-center gap-3">
                <Badge className="bg-green-600 text-white">CSOAI Certified</Badge>
                <Link href="/training">
                  <Button variant="outline" className="border-green-600 text-green-700">
                    Explore More Courses
                  </Button>
                </Link>
              </div>
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
                          ? 'bg-blue-100 border-2 border-blue-500'
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
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Badge variant="outline" className="bg-blue-50">
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
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-600 my-4">{children}</blockquote>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-bold text-gray-900">{children}</strong>
                    ),
                    hr: () => <hr className="my-6 border-gray-300" />,
                  }}
                >
                  {currentModule.content}
                </ReactMarkdown>
              </Card>
            ) : (
              <Card className="p-6 bg-white">
                <Quiz
                  questions={getModuleQuiz(courseIdNum, currentModuleIndex)}
                  onComplete={handleModuleQuizComplete}
                  title={`${currentModule.title} - Assessment`}
                  passingScore={70}
                />
              </Card>
            )}

            {/* Navigation and Quiz Buttons */}
            <div className="flex items-center justify-between pt-4">
              <Button
                variant="outline"
                onClick={handlePreviousModule}
                disabled={currentModuleIndex === 0}
                className="gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous Module
              </Button>

              <div className="flex items-center gap-3">
                {!showQuiz && !completedModules.includes(currentModuleIndex) && (
                  <Button
                    onClick={() => setShowQuiz(true)}
                    className="bg-[#1a1a2e] hover:bg-[#16213e] text-white gap-2"
                  >
                    Take Quiz
                  </Button>
                )}

                {quizPassed && currentModuleIndex < course.modules.length - 1 && (
                  <Button
                    onClick={handleNextModule}
                    className="bg-green-600 hover:bg-green-700 text-white gap-2"
                  >
                    Next Module
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <Button
                variant="outline"
                onClick={handleNextModule}
                disabled={currentModuleIndex === course.modules.length - 1}
                className="gap-2"
              >
                Next Module
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
