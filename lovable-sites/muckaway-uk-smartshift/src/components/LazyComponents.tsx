import { lazy, Suspense, ComponentType } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

// Generic loading fallback
const LoadingFallback = ({ height = 400 }: { height?: number }) => (
  <Card className="w-full">
    <CardContent className="p-6">
      <div className="flex flex-col items-center justify-center" style={{ minHeight: height }}>
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground">Loading component...</p>
      </div>
    </CardContent>
  </Card>
);

// Map loading skeleton
const MapLoadingFallback = () => (
  <div className="w-full h-[500px] rounded-lg overflow-hidden relative bg-muted">
    <Skeleton className="absolute inset-0" />
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Loading map...</p>
      </div>
    </div>
  </div>
);

// Chart loading skeleton
const ChartLoadingFallback = () => (
  <Card>
    <CardContent className="p-6">
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <div className="flex items-end gap-2 h-64">
          {[...Array(12)].map((_, i) => (
            <Skeleton 
              key={i} 
              className="flex-1" 
              style={{ height: `${Math.random() * 60 + 40}%` }} 
            />
          ))}
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </CardContent>
  </Card>
);

// Gantt loading skeleton
const GanttLoadingFallback = () => (
  <Card>
    <CardContent className="p-6">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex gap-2">
              <Skeleton className="h-10 w-32" />
              <div className="flex-1 flex gap-1">
                {[...Array(7)].map((_, j) => (
                  <Skeleton key={j} className="flex-1 h-10" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </CardContent>
  </Card>
);

// Lazy loaded components
export const LazyLiveTrackingMap = lazy(() => 
  import('@/components/LiveTrackingMap').then(module => ({ default: module.LiveTrackingMap }))
);

export const LazyEnvironmentalDashboard = lazy(() => 
  import('@/components/EnvironmentalDashboard').then(module => ({ default: module.EnvironmentalDashboard }))
);

export const LazyGanttScheduler = lazy(() => 
  import('@/components/GanttScheduler').then(module => ({ default: module.GanttScheduler }))
);

export const LazyRouteOptimizer = lazy(() => 
  import('@/components/RouteOptimizer').then(module => ({ default: module.RouteOptimizer }))
);

export const LazyAIInsightsDashboard = lazy(() => 
  import('@/components/AIInsightsDashboard')
);

export const LazyReportGenerator = lazy(() => 
  import('@/components/ReportGenerator').then(module => ({ default: module.ReportGenerator }))
);

// Wrapper components with appropriate suspense boundaries
export const SuspendedLiveTrackingMap = (props: any) => (
  <Suspense fallback={<MapLoadingFallback />}>
    <LazyLiveTrackingMap {...props} />
  </Suspense>
);

export const SuspendedEnvironmentalDashboard = (props: any) => (
  <Suspense fallback={<ChartLoadingFallback />}>
    <LazyEnvironmentalDashboard {...props} />
  </Suspense>
);

export const SuspendedGanttScheduler = (props: any) => (
  <Suspense fallback={<GanttLoadingFallback />}>
    <LazyGanttScheduler {...props} />
  </Suspense>
);

export const SuspendedRouteOptimizer = (props: any) => (
  <Suspense fallback={<LoadingFallback height={300} />}>
    <LazyRouteOptimizer {...props} />
  </Suspense>
);

export const SuspendedAIInsightsDashboard = (props: any) => (
  <Suspense fallback={<ChartLoadingFallback />}>
    <LazyAIInsightsDashboard {...props} />
  </Suspense>
);

export const SuspendedReportGenerator = (props: any) => (
  <Suspense fallback={<LoadingFallback height={400} />}>
    <LazyReportGenerator {...props} />
  </Suspense>
);

// Helper to create lazy component with custom fallback
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  FallbackComponent: React.ReactNode = <LoadingFallback />
) {
  const LazyComponent = lazy(importFn);
  
  return function SuspendedComponent(props: React.ComponentProps<T>) {
    return (
      <Suspense fallback={FallbackComponent}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

export default {
  SuspendedLiveTrackingMap,
  SuspendedEnvironmentalDashboard,
  SuspendedGanttScheduler,
  SuspendedRouteOptimizer,
  SuspendedAIInsightsDashboard,
  SuspendedReportGenerator,
};
