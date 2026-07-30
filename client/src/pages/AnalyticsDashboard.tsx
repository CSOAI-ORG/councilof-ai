import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, CreditCard, TrendingUp, BookOpen } from 'lucide-react';
import { trpc } from '@/lib/trpc';

export default function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [dashboardMetrics, setDashboardMetrics] = useState<any>(null);

  const { data: metrics } = trpc.analytics.getDashboardMetrics.useQuery();
  const { data: funnel, isLoading: funnelLoading } = trpc.analytics.getSignupConversionFunnel.useQuery({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
  });
  const { data: payments, isLoading: paymentsLoading } = trpc.analytics.getPaymentMetrics.useQuery({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
  });
  const { data: courses, isLoading: coursesLoading } = trpc.analytics.getCourseCompletionStats.useQuery({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
  });

  useEffect(() => {
    if (metrics) setDashboardMetrics(metrics);
  }, [metrics]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600">Real-time metrics for user engagement and platform performance</p>
        </div>

        <div className="flex gap-2 mb-8">
          {(['24h', '7d', '30d'] as const).map((range) => (
            <Button
              key={range}
              variant={dateRange === range ? 'default' : 'outline'}
              onClick={() => setDateRange(range)}
              className={dateRange === range ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              {range === '24h' ? 'Last 24h' : range === '7d' ? 'Last 7 days' : 'Last 30 days'}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Signups (24h)</CardTitle>
                <Users className="h-5 w-5 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{dashboardMetrics?.signupsLast24h || 0}</div>
              <p className="text-xs text-gray-500 mt-1">New user registrations</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Payment Success (24h)</CardTitle>
                <CreditCard className="h-5 w-5 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{dashboardMetrics?.paymentsSuccessLast24h || 0}</div>
              <p className="text-xs text-gray-500 mt-1">Successful transactions</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-l-4 border-l-purple-500">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Success Rate</CardTitle>
                <TrendingUp className="h-5 w-5 text-purple-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{dashboardMetrics?.paymentSuccessRate || 0}%</div>
              <p className="text-xs text-gray-500 mt-1">Payment conversion rate</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-l-4 border-l-orange-500">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Completions (24h)</CardTitle>
                <BookOpen className="h-5 w-5 text-orange-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{dashboardMetrics?.courseCompletionsLast24h || 0}</div>
              <p className="text-xs text-gray-500 mt-1">Course completions</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Signup Conversion Funnel</CardTitle>
              <CardDescription>User journey from signup start to completion</CardDescription>
            </CardHeader>
            <CardContent>
              {funnelLoading ? (
                <div className="h-64 flex items-center justify-center text-gray-500">Loading...</div>
              ) : funnel ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Signup Starts</span>
                      <span className="text-sm font-bold">{funnel.signupStarts}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Completions</span>
                      <span className="text-sm font-bold">{funnel.signupCompletes}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(funnel.signupCompletes / funnel.signupStarts) * 100}%` }}></div>
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Conversion Rate</span>
                      <span className="text-sm font-bold text-green-600">{funnel.conversionRate?.toFixed(2) || 0}%</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">No data available</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Transactions</CardTitle>
              <CardDescription>Success vs failed transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {paymentsLoading ? (
                <div className="h-64 flex items-center justify-center text-gray-500">Loading...</div>
              ) : payments ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Successful</span>
                      <span className="text-sm font-bold text-green-600">{payments.successfulTransactions}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Failed</span>
                      <span className="text-sm font-bold text-red-600">{payments.failedTransactions}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-red-500 h-2 rounded-full" style={{ width: `${(payments.failedTransactions / (payments.successfulTransactions + payments.failedTransactions)) * 100}%` }}></div>
                    </div>
                  </div>
                  <div className="pt-4 border-t space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Total Revenue</span>
                      <span className="text-sm font-bold">${payments.totalRevenue?.toFixed(2) || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Avg Transaction</span>
                      <span className="text-sm font-bold">${payments.averageTransactionValue?.toFixed(2) || 0}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">No data available</div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Course Completion Statistics</CardTitle>
            <CardDescription>Enrollment and completion tracking</CardDescription>
          </CardHeader>
          <CardContent>
            {coursesLoading ? (
              <div className="h-64 flex items-center justify-center text-gray-500">Loading...</div>
            ) : courses ? (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Enrolled</span>
                    <span className="text-sm font-bold">{courses.enrolledCount}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Completed</span>
                    <span className="text-sm font-bold">{courses.completedCount}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(courses.completedCount / courses.enrolledCount) * 100}%` }}></div>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Completion Rate</span>
                    <span className="text-sm font-bold text-green-600">{courses.completionRate?.toFixed(2) || 0}%</span>
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-sm font-medium">Avg Time to Complete</span>
                    <span className="text-sm font-bold">{(courses as any).averageTimeToCompletion?.toFixed(0) || 0} hours</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">No data available</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
