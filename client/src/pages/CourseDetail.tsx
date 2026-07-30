/**
 * Course Detail Page
 * Display individual course information and enrollment options
 * Shows different UI based on enrollment status
 */

import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Clock, Award, Users, CheckCircle2, Loader2, ArrowLeft, Play, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import {useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";

export default function CourseDetail() {
  useEffect(() => { document.title = "CourseDetail | CSOAI"; }, []);
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [selectedPaymentType, setSelectedPaymentType] = useState<"one_time" | "3_month" | "6_month" | "12_month">("one_time");

  // Fetch course details
  const { data: course, isLoading, error } = trpc.courses.getCourseDetails.useQuery(
    { courseId: parseInt(id || "0") },
    { enabled: !!id }
  );

  // Fetch user's enrollments to check if already enrolled
  const { data: enrollments } = trpc.courses.getMyEnrollments.useQuery();
  
  // Check if user is enrolled in this course
  const enrollmentsList = Array.isArray(enrollments) ? enrollments : [];
  const enrollment = enrollmentsList.find((e: any) => e.courseId === parseInt(id || "0"));
  const isEnrolled = !!enrollment;

  // Enroll mutation
  const enrollMutation = trpc.courses.enrollInCourse.useMutation({
    onSuccess: (result) => {
      if (result.isFree) {
        toast.success("Successfully enrolled in course!");
        setLocation(`/courses/${id}/learn`);
      } else {
        // For paid courses, redirect to Stripe checkout
        toast.success("Redirecting to payment...");
        // The mutation should handle the redirect
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to enroll in course");
    },
  });

  const handleEnroll = async () => {
    if (!course) return;
    setIsEnrolling(true);
    try {
      await enrollMutation.mutateAsync({ 
        courseId: course.id,
        paymentType: course.isFree ? undefined : selectedPaymentType
      });
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleContinueLearning = () => {
    setLocation(`/courses/${id}/learn`);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !course) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <Button
            variant="ghost"
            onClick={() => setLocation("/courses")}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Courses
          </Button>
          <Card className="p-8 text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-2">Course Not Found</h1>
            <p className="text-gray-600 mb-6">
              The course you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => setLocation("/courses")}>
              Browse All Courses
            </Button>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => setLocation(isEnrolled ? "/my-courses" : "/courses")}
          className="mb-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {isEnrolled ? "Back to My Courses" : "Back to Courses"}
        </Button>

        {/* Hero Section - Different UI based on enrollment status */}
        <div className={`${isEnrolled ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600' : 'bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600'} text-white rounded-2xl p-8 shadow-xl`}>
          <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
            <div className="flex-1">
              {isEnrolled && (
                <Badge className="mb-3 bg-white/20 text-white border-white/30">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Enrolled
                </Badge>
              )}
              {!isEnrolled && (
                <Badge className="mb-3 bg-white/20 text-white border-white/30">
                  <Award className="w-4 h-4 mr-2" />
                  {course.level}
                </Badge>
              )}
              <h1 className="text-4xl font-bold mb-2">{course.title}</h1>
              <p className="text-white/90 text-lg mb-4">{course.description}</p>
              <div className="flex flex-wrap gap-6 text-white/80">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span>{course.durationHours} hours</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  <span>{course.enrollmentCount || 0} enrolled</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  <span>{course.modules?.length || 0} modules</span>
                </div>
              </div>
              
              {/* Progress bar for enrolled users */}
              {isEnrolled && enrollment && (
                <div className="mt-6 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/80">Your Progress</span>
                    <span className="font-semibold">{enrollment.progress || 0}%</span>
                  </div>
                  <Progress value={enrollment.progress || 0} className="h-2 bg-white/20" />
                </div>
              )}
            </div>
            
            <div className="text-right w-full lg:w-auto">
              {isEnrolled ? (
                /* Enrolled User UI */
                <div className="space-y-3">
                  <div className="text-lg font-medium text-white/90 mb-2">
                    {enrollment?.status === 'completed' ? (
                      <span className="flex items-center gap-2 justify-end">
                        <GraduationCap className="w-5 h-5" />
                        Course Completed!
                      </span>
                    ) : (
                      `${enrollment?.progress || 0}% Complete`
                    )}
                  </div>
                  <Button
                    size="lg"
                    className="bg-white text-indigo-600 hover:bg-white/90 w-full lg:w-auto"
                    onClick={handleContinueLearning}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {enrollment?.progress === 0 ? "Start Learning" : "Continue Learning"}
                  </Button>
                </div>
              ) : (
                /* Not Enrolled User UI */
                <>
                  {!course.isFree && (
                    <div className="text-4xl font-bold mb-2">£{course.pricing.oneTime}</div>
                  )}
                  {course.isFree && (
                    <div className="text-2xl font-bold mb-2 text-white/90">FREE</div>
                  )}
                  <Button
                    size="lg"
                    className="bg-white text-emerald-600 hover:bg-white/90"
                    onClick={handleEnroll}
                    disabled={isEnrolling || enrollMutation.isPending}
                  >
                    {isEnrolling || enrollMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Enrolling...
                      </>
                    ) : (
                      "Enroll Now"
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">About This Course</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">{course.description}</p>
              
              <h3 className="text-xl font-semibold mt-6 mb-3">Course Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Framework</p>
                  <p className="font-semibold capitalize">{course.framework}</p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Level</p>
                  <p className="font-semibold capitalize">{course.level}</p>
                </div>
              </div>
              
              {/* Quick action for enrolled users */}
              {isEnrolled && (
                <div className="mt-6 pt-6 border-t">
                  <Button 
                    className="w-full" 
                    onClick={handleContinueLearning}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {enrollment?.progress === 0 ? "Start Learning" : "Continue Learning"}
                  </Button>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Course Details & Pricing</h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Duration</p>
                  <p className="font-semibold text-lg">{course.durationHours} hours</p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Type</p>
                  <p className="font-semibold text-lg">
                    {course.isFree ? "Free" : "Paid"}
                  </p>
                </div>
              </div>

              {/* Show enrollment info for enrolled users */}
              {isEnrolled && enrollment && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-semibold mb-4 text-green-600 dark:text-green-400 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    You're Enrolled!
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Status</p>
                      <p className="font-semibold capitalize">{enrollment.status.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Progress</p>
                      <p className="font-semibold">{enrollment.progress || 0}%</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Show pricing options only for non-enrolled users */}
              {!isEnrolled && !course.isFree && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-semibold mb-4">Payment Plans</h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                      <input
                        type="radio"
                        value="one_time"
                        checked={selectedPaymentType === "one_time"}
                        onChange={(e) => setSelectedPaymentType(e.target.value as any)}
                        className="w-4 h-4"
                      />
                      <div>
                        <p className="font-semibold">One-Time Payment</p>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">£{course.pricing.oneTime}</p>
                      </div>
                    </label>
                    
                    {course.pricing.threeMonth && (
                      <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                        <input
                          type="radio"
                          value="3_month"
                          checked={selectedPaymentType === "3_month"}
                          onChange={(e) => setSelectedPaymentType(e.target.value as any)}
                          className="w-4 h-4"
                        />
                        <div>
                          <p className="font-semibold">3-Month Plan</p>
                          <p className="text-gray-600 dark:text-gray-400 text-sm">£{course.pricing.threeMonth}/month</p>
                        </div>
                      </label>
                    )}
                    
                    {course.pricing.sixMonth && (
                      <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                        <input
                          type="radio"
                          value="6_month"
                          checked={selectedPaymentType === "6_month"}
                          onChange={(e) => setSelectedPaymentType(e.target.value as any)}
                          className="w-4 h-4"
                        />
                        <div>
                          <p className="font-semibold">6-Month Plan</p>
                          <p className="text-gray-600 dark:text-gray-400 text-sm">£{course.pricing.sixMonth}/month</p>
                        </div>
                      </label>
                    )}
                    
                    {course.pricing.twelveMonth && (
                      <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                        <input
                          type="radio"
                          value="12_month"
                          checked={selectedPaymentType === "12_month"}
                          onChange={(e) => setSelectedPaymentType(e.target.value as any)}
                          className="w-4 h-4"
                        />
                        <div>
                          <p className="font-semibold">12-Month Plan</p>
                          <p className="text-gray-600 dark:text-gray-400 text-sm">£{course.pricing.twelveMonth}/month</p>
                        </div>
                      </label>
                    )}
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
