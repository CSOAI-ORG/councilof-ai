import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import {
  BookOpen,
  Award,
  Clock,
  TrendingUp,
  Target,
  Download,
  ExternalLink,
  X,
  Loader2,
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Link } from "wouter";
import { toast } from "sonner";

export default function StudentProgress() {
  const { user, loading: authLoading } = useAuth();
  
  // Fetch all progress data
  const { data: overallProgress, isLoading: loadingOverall } = trpc.progress.getOverallProgress.useQuery();
  const { data: quizAnalytics, isLoading: loadingQuiz } = trpc.progress.getQuizAnalytics.useQuery();
  const { data: certificates, isLoading: loadingCerts } = trpc.progress.getCertificates.useQuery();
  const { data: recommendations, isLoading: loadingRecs } = trpc.progress.getRecommendations.useQuery();

  const dismissRecommendation = trpc.progress.dismissRecommendation.useMutation({
    onSuccess: () => {
      toast.success("Recommendation dismissed");
      // Refresh recommendations
      trpc.useUtils().progress.getRecommendations.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  if (authLoading || loadingOverall) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Please log in to view your progress</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">My Learning Progress</h1>
          <p className="text-muted-foreground mt-1">
            Track your journey to becoming an AI Safety professional
          </p>
        </div>

        {/* Overview Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completion Rate</p>
                <p className="text-3xl font-bold mt-1">{overallProgress?.completionPercentage || 0}%</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {overallProgress?.completedCourses || 0} of {overallProgress?.totalCourses || 0} courses
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Target className="h-6 w-6 text-primary" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Hours Learned</p>
                <p className="text-3xl font-bold mt-1">{overallProgress?.totalHoursLearned || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Time invested</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Average Score</p>
                <p className="text-3xl font-bold mt-1">{overallProgress?.averageQuizScore || 0}%</p>
                <p className="text-xs text-muted-foreground mt-1">Quiz performance</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Certificates</p>
                <p className="text-3xl font-bold mt-1">{overallProgress?.certificatesEarned || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Earned credentials</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <Award className="h-6 w-6 text-yellow-500" />
              </div>
            </div>
          </Card>
        </div>

        {/* Quiz Performance Analytics */}
        {!loadingQuiz && quizAnalytics && quizAnalytics.totalAttempts > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Quiz Performance</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-secondary/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Total Attempts</p>
                <p className="text-2xl font-bold mt-1">{quizAnalytics.totalAttempts}</p>
              </div>
              <div className="text-center p-4 bg-secondary/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Pass Rate</p>
                <p className="text-2xl font-bold mt-1">{quizAnalytics.passRate}%</p>
              </div>
              <div className="text-center p-4 bg-secondary/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Average Score</p>
                <p className="text-2xl font-bold mt-1">{quizAnalytics.averageScore}%</p>
              </div>
            </div>

            {/* Score Trend Chart */}
            {quizAnalytics.recentScores && quizAnalytics.recentScores.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-3">Score Trend (Last 10 Quizzes)</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={quizAnalytics.recentScores}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="score" stroke="#0066CC" strokeWidth={2} name="Score %" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Topic Performance by Framework */}
            {quizAnalytics.byFramework && quizAnalytics.byFramework.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-3">Performance by Framework</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={quizAnalytics.byFramework}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="framework" angle={-45} textAnchor="end" height={100} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="avgScore" fill="#0066CC" name="Average Score %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        )}

        {/* Certificates Showcase */}
        {!loadingCerts && certificates && certificates.length > 0 && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">My Certificates</h2>
              <Link href="/certificates">
                <Button variant="outline" size="sm">
                  View All <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {certificates.slice(0, 3).map((cert) => (
                <Card key={cert.id} className="p-4 border-2 border-primary/20">
                  <div className="flex items-start justify-between mb-2">
                    <Award className="h-8 w-8 text-yellow-500" />
                    <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                      {(cert as any).framework || 'CSOAI'}
                    </span>
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{cert.title}</h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    Issued: {new Date(cert.earnedAt || '').toLocaleDateString()}
                  </p>
                  <Link href={`/verify/${cert.certificateNumber}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      <Download className="mr-2 h-3 w-3" />
                      Download
                    </Button>
                  </Link>
                </Card>
              ))}
            </div>
          </Card>
        )}

        {/* Personalized Recommendations */}
        {!loadingRecs && recommendations && recommendations.length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Recommended for You</h2>
            <div className="space-y-3">
              {recommendations.map((rec) => (
                <Card key={rec.id} className="p-4 border-l-4 border-l-primary">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <BookOpen className="h-4 w-4 text-primary" />
                        <h3 className="font-semibold">{rec.title}</h3>
                        <span className="text-xs px-2 py-0.5 bg-secondary rounded-full">
                          {rec.type}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                          {rec.priority}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{rec.description}</p>
                      <div className="flex items-center gap-2 mt-3">
                        <Link href="/courses">
                          <Button size="sm">
                            View Course
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => dismissRecommendation.mutate({ recommendationId: rec.id })}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        )}

        {/* Empty State */}
        {overallProgress?.totalCourses === 0 && (
          <Card className="p-12 text-center">
            <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Start Your Learning Journey</h3>
            <p className="text-muted-foreground mb-6">
              Enroll in your first course to begin tracking your progress
            </p>
            <Link href="/courses">
              <Button size="lg">
                Browse Courses
              </Button>
            </Link>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
