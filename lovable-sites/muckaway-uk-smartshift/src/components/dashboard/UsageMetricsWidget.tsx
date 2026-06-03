import { useUsageMetering } from '@/hooks/useUsageMetering';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Loader2, TrendingUp, Zap, Calendar, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function UsageMetricsWidget() {
  const { usage, tier, period, isLoading, error } = useUsageMetering();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error || !usage) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="py-6">
          <p className="text-muted-foreground text-sm">Unable to load usage data</p>
        </CardContent>
      </Card>
    );
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-destructive';
    if (percentage >= 90) return 'bg-destructive';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-primary';
  };

  const formatLimit = (limit: number) => limit === -1 ? '∞' : limit.toString();

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <span className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Usage This Period
          </span>
          <span className="text-sm font-normal text-muted-foreground capitalize">
            {tier} Plan
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Jobs Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Jobs
            </span>
            <span className="text-muted-foreground">
              {usage.jobs.current} / {formatLimit(usage.jobs.limit)}
            </span>
          </div>
          <Progress 
            value={usage.jobs.limit === -1 ? 0 : Math.min(usage.jobs.percentage, 100)} 
            className="h-2"
          />
          {usage.jobs.percentage >= 75 && usage.jobs.limit !== -1 && (
            <div className="flex items-center gap-1 text-xs text-yellow-500">
              <AlertTriangle className="h-3 w-3" />
              {usage.jobs.percentage >= 100 ? 'Limit reached' : `${usage.jobs.percentage}% used`}
            </div>
          )}
        </div>

        {/* AI Requests Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              AI Requests
            </span>
            <span className="text-muted-foreground">
              {usage.ai_requests.current} / {formatLimit(usage.ai_requests.limit)}
            </span>
          </div>
          <Progress 
            value={usage.ai_requests.limit === -1 ? 0 : Math.min(usage.ai_requests.percentage, 100)} 
            className="h-2"
          />
          {usage.ai_requests.percentage >= 75 && usage.ai_requests.limit !== -1 && (
            <div className="flex items-center gap-1 text-xs text-yellow-500">
              <AlertTriangle className="h-3 w-3" />
              {usage.ai_requests.percentage >= 100 ? 'Limit reached' : `${usage.ai_requests.percentage}% used`}
            </div>
          )}
        </div>

        {/* Period Info */}
        {period && (
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {period.days_remaining} days remaining
            </span>
            {(usage.jobs.percentage >= 75 || usage.ai_requests.percentage >= 75) && (
              <Button 
                size="sm" 
                onClick={() => navigate('/subscribe')}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Upgrade
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
