/**
 * Courses Page - Monetized Training Catalog
 * Browse regional AI compliance courses with flexible payment plans
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Clock, Award, TrendingUp, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

export default function Courses() {
  const [selectedRegion, setSelectedRegion] = useState<number | undefined>();
  const [selectedLevel, setSelectedLevel] = useState<"fundamentals" | "advanced" | "specialist" | undefined>();
  const [selectedFramework, setSelectedFramework] = useState<string | undefined>();

  // Fetch regions
  const { data: regions = [] } = trpc.courses.getRegions.useQuery();

  // Fetch courses with filters
  const { data: courses = [], isLoading: coursesLoading } = trpc.courses.getCatalog.useQuery({
    regionId: selectedRegion,
    level: selectedLevel,
    framework: selectedFramework,
  });

  // Fetch bundles
  const { data: bundles = [] } = trpc.courses.getCourseBundles.useQuery();

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 text-white rounded-2xl p-8 shadow-xl">
          <div className="max-w-3xl">
            <Badge className="mb-3 bg-white/20 text-white border-white/30">
              <Award className="w-4 h-4 mr-2" />
              Professional Certification
            </Badge>
            <h1 className="text-4xl font-bold mb-4">
              AI Safety & Compliance Training
            </h1>
            <p className="text-lg text-emerald-100 mb-6">
              Master AI regulations worldwide. Get certified. Earn from home.
              <br />
              <strong>Flexible payment plans available</strong> - Pay monthly or save with one-time payment.
            </p>
            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-300" />
                <span>33 Regional Courses</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-300" />
                <span>3, 6, or 12-Month Plans</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-300" />
                <span>Official Certificates</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-6 shadow-lg">
          <h2 className="text-lg font-semibold mb-4">Filter Courses</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Region</label>
              <Select
                value={selectedRegion?.toString()}
                onValueChange={(value) => setSelectedRegion(value === "all" ? undefined : parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Regions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  {regions.map((region: any) => (
                    <SelectItem key={region.id} value={region.id.toString()}>
                      {region.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Level</label>
              <Select
                value={selectedLevel || "all"}
                onValueChange={(value: any) => setSelectedLevel(value === "all" ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="fundamentals">Fundamentals</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                  <SelectItem value="specialist">Specialist</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Framework</label>
              <Select
                value={selectedFramework || "all"}
                onValueChange={(value) => setSelectedFramework(value === "all" ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Frameworks" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Frameworks</SelectItem>
                  <SelectItem value="EU AI Act">EU AI Act</SelectItem>
                  <SelectItem value="NIST AI RMF">NIST AI RMF</SelectItem>
                  <SelectItem value="ISO/IEC 42001">ISO/IEC 42001</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Course Tabs */}
        <Tabs defaultValue="courses" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="courses">Individual Courses</TabsTrigger>
            <TabsTrigger value="bundles">Course Bundles</TabsTrigger>
          </TabsList>

          {/* Individual Courses */}
          <TabsContent value="courses" className="mt-6">
            {coursesLoading ? (
              <div className="text-center py-12">
                <Loader2 className="inline-block h-8 w-8 animate-spin text-emerald-600" />
                <p className="mt-4 text-gray-600">Loading courses...</p>
              </div>
            ) : courses.length === 0 ? (
              <Card className="p-12 text-center">
                <BookOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No courses found</h3>
                <p className="text-gray-600">Try adjusting your filters</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {courses.map((course: any) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Course Bundles */}
          <TabsContent value="bundles" className="mt-6">
            {bundles.length === 0 ? (
              <Card className="p-12 text-center">
                <TrendingUp className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No bundles available</h3>
                <p className="text-gray-600">Check back soon for bundle offers</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {bundles.map((bundle: any) => (
                  <BundleCard key={bundle.id} bundle={bundle} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

function CourseCard({ course }: { course: any }) {
  const [selectedPlan, setSelectedPlan] = useState<"oneTime" | "threeMonth" | "sixMonth" | "twelveMonth">("oneTime");
  const enrollMutation = trpc.courses.enrollInCourse.useMutation();

  const handleEnroll = async () => {
    try {
      const paymentTypeMap = {
        oneTime: "one_time",
        threeMonth: "3_month",
        sixMonth: "6_month",
        twelveMonth: "12_month",
      };

      const result = await enrollMutation.mutateAsync({
        courseId: course.id,
      });

      // Handle enrollment result
      if ((result as any).checkoutUrl) {
        window.location.href = (result as any).checkoutUrl;
      } else {
        toast.success(result.message || 'Successfully enrolled!');
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to enroll in course");
    }
  };

  const formatPrice = (cents: number | null | undefined) => {
    if (!cents) return "N/A";
    return `$${(cents / 100).toFixed(2)}`;
  };

  const calculateMonthlyPayment = (totalCents: number, months: number) => {
    return `$${((totalCents / months) / 100).toFixed(2)}/mo`;
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "fundamentals":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "advanced":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-blue-200";
      case "specialist":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  return (
    <Card className="p-6 hover:shadow-xl transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold mb-2">{course.title}</h3>
          <Badge className={getLevelColor(course.level)}>
            {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
          </Badge>
        </div>
        <Badge variant="outline" className="text-xs">
          {course.framework}
        </Badge>
      </div>

      <p className="text-muted-foreground mb-4 line-clamp-2">{course.description}</p>

      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          <span>{course.durationHours}h</span>
        </div>
        <div className="flex items-center gap-1">
          <BookOpen className="w-4 h-4" />
          <span>{course.modules?.length || 0} modules</span>
        </div>
      </div>

      {/* Payment Plan Selector */}
      <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950 dark:to-green-950 rounded-lg p-4 mb-4">
        <label className="text-sm font-semibold mb-3 block">Choose Payment Plan</label>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <button
            onClick={() => setSelectedPlan("oneTime")}
            className={`p-3 rounded-lg border-2 transition-all ${
              selectedPlan === "oneTime"
                ? "border-blue-600 bg-emerald-50 dark:bg-emerald-900 shadow-md"
                : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300"
            }`}
          >
            <div className="text-xs text-muted-foreground mb-1">One-Time</div>
            <div className="font-bold text-lg">{formatPrice(course.pricing.oneTime)}</div>
            <div className="text-xs text-green-600 font-medium">Best Value</div>
          </button>

          {course.pricing.threeMonth && (
            <button
              onClick={() => setSelectedPlan("threeMonth")}
              className={`p-3 rounded-lg border-2 transition-all ${
                selectedPlan === "threeMonth"
                  ? "border-blue-600 bg-emerald-50 dark:bg-emerald-900 shadow-md"
                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300"
              }`}
            >
              <div className="text-xs text-muted-foreground mb-1">3 Months</div>
              <div className="font-bold text-lg">
                {calculateMonthlyPayment(course.pricing.threeMonth, 3)}
              </div>
              <div className="text-xs text-muted-foreground">
                {formatPrice(course.pricing.threeMonth)} total
              </div>
            </button>
          )}

          {course.pricing.sixMonth && (
            <button
              onClick={() => setSelectedPlan("sixMonth")}
              className={`p-3 rounded-lg border-2 transition-all ${
                selectedPlan === "sixMonth"
                  ? "border-blue-600 bg-emerald-50 dark:bg-emerald-900 shadow-md"
                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300"
              }`}
            >
              <div className="text-xs text-muted-foreground mb-1">6 Months</div>
              <div className="font-bold text-lg">
                {calculateMonthlyPayment(course.pricing.sixMonth, 6)}
              </div>
              <div className="text-xs text-muted-foreground">
                {formatPrice(course.pricing.sixMonth)} total
              </div>
            </button>
          )}

          {course.pricing.twelveMonth && (
            <button
              onClick={() => setSelectedPlan("twelveMonth")}
              className={`p-3 rounded-lg border-2 transition-all ${
                selectedPlan === "twelveMonth"
                  ? "border-blue-600 bg-emerald-50 dark:bg-emerald-900 shadow-md"
                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300"
              }`}
            >
              <div className="text-xs text-muted-foreground mb-1">12 Months</div>
              <div className="font-bold text-lg">
                {calculateMonthlyPayment(course.pricing.twelveMonth, 12)}
              </div>
              <div className="text-xs text-muted-foreground">
                {formatPrice(course.pricing.twelveMonth)} total
              </div>
            </button>
          )}
        </div>
      </div>

      <Button
        onClick={handleEnroll}
        disabled={enrollMutation.isPending}
        className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
      >
        {enrollMutation.isPending ? "Processing..." : "Enroll Now"}
      </Button>
    </Card>
  );
}

function BundleCard({ bundle }: { bundle: any }) {
  const formatPrice = (cents: number | null | undefined) => {
    if (!cents) return "N/A";
    return `$${(cents / 100).toFixed(2)}`;
  };

  return (
    <Card className="p-6 border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 hover:shadow-xl transition-shadow">
      <Badge className="mb-4 bg-purple-600">Bundle Deal - Save {formatPrice(bundle.savings)}</Badge>
      <h3 className="text-2xl font-bold mb-2">{bundle.name}</h3>
      <p className="text-muted-foreground mb-4">{bundle.description}</p>

      <div className="bg-white dark:bg-gray-900 rounded-lg p-4 mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-muted-foreground">Regular Price:</span>
          <span className="text-muted-foreground line-through">{formatPrice(bundle.regularPrice)}</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="font-semibold">Bundle Price:</span>
          <span className="text-2xl font-bold text-purple-600">{formatPrice(bundle.pricing.oneTime)}</span>
        </div>
        {bundle.pricing.threeMonth && (
          <div className="text-sm text-muted-foreground mt-2">
            Or {formatPrice(bundle.pricing.threeMonth)} over 3 months
          </div>
        )}
      </div>

      <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
        Get Bundle
      </Button>
    </Card>
  );
}
