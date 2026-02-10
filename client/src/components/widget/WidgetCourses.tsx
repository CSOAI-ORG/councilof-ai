/**
 * WidgetCourses - White-label course catalog for embedded widget
 * No tRPC, no auth, no backend dependencies - completely self-contained
 */

import { useState, useEffect, useMemo } from 'react';
import { Link } from 'wouter';
import { widgetCourses } from '@/data/widget-courses';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BookOpen, Clock, Award, CheckCircle2, Filter } from 'lucide-react';
export default function WidgetCourses() {
  const [selectedFramework, setSelectedFramework] = useState<string | undefined>();

  // Get unique frameworks
  const frameworks = useMemo(() => {
    const unique = Array.from(new Set(widgetCourses.map(c => c.framework)));
    return unique.sort();
  }, []);

  // Filter courses
  const filteredCourses = useMemo(() => {
    if (!selectedFramework) return widgetCourses;
    return widgetCourses.filter(c => c.framework === selectedFramework);
  }, [selectedFramework]);

  return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            AI Safety Training Courses
          </h1>
          <p className="text-lg text-gray-600">
            Free, self-paced learning on AI compliance and risk management frameworks
          </p>
        </div>

        {/* Filter */}
        <Card className="p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <Filter className="w-5 h-5 text-gray-600" />
            <label className="font-medium text-gray-700 min-w-fit">Filter by Framework:</label>
            <Select value={selectedFramework || ''} onValueChange={(value) => setSelectedFramework(value === '' ? undefined : value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Frameworks" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Frameworks</SelectItem>
                {frameworks.map((framework) => (
                  <SelectItem key={framework} value={framework}>
                    {framework}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Courses Grid */}
        {filteredCourses.length === 0 ? (
          <Card className="p-12 text-center">
            <BookOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-gray-900">No courses found</h3>
            <p className="text-gray-600">Try adjusting your filters</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}

        {/* Results count */}
        <p className="text-sm text-gray-500 text-right">
          Showing {filteredCourses.length} of {widgetCourses.length} courses
        </p>
      </div>
  );
}

function CourseCard({ course }: { course: any }) {
  const [progress, setProgress] = useState<number | null>(null);

  // Check localStorage for progress
  useEffect(() => {
    const progressKey = `widget_progress_${course.id}`;
    const savedProgress = localStorage.getItem(progressKey);
    if (savedProgress) {
      try {
        const completed = JSON.parse(savedProgress);
        const percentage = Math.round((completed.length / course.moduleCount) * 100);
        setProgress(percentage);
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, [course.id, course.moduleCount]);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'fundamentals':
        return 'bg-blue-100 text-blue-800';
      case 'advanced':
        return 'bg-purple-100 text-purple-800';
      case 'specialist':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow flex flex-col">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-xl font-bold text-gray-900 mb-3">{course.name}</h3>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className={getLevelColor(course.level)}>
            {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
          </Badge>
          <Badge variant="secondary">{course.framework}</Badge>
        </div>
      </div>

      {/* Description */}
      <p className="text-gray-600 mb-4 line-clamp-2 flex-grow">{course.description}</p>

      {/* Metadata */}
      <div className="grid grid-cols-3 gap-4 text-sm text-gray-700 mb-4 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-500" />
          <span>{course.duration}</span>
        </div>
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-gray-500" />
          <span>{course.moduleCount} modules</span>
        </div>
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-gray-500" />
          <span>Certification</span>
        </div>
      </div>

      {/* Progress indicator */}
      {progress !== null && (
        <div className="mb-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-gray-700">Progress</span>
            <span className="text-gray-600">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* CTA Button */}
      <Link href={`/widget/course/${course.id}`}>
        <Button className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white">
          {progress !== null && progress > 0 ? (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Continue Course
            </>
          ) : (
            <>
              <BookOpen className="w-4 h-4 mr-2" />
              Start Course
            </>
          )}
        </Button>
      </Link>
    </Card>
  );
}
