import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { captureScreenshot, getCaptureOptionsForRoute, getThresholdForRoute } from '@/utils/screenshotCapture';
import { compareImages } from '@/utils/visualDiff';
import { 
  VisualTestRun, 
  VisualTestResult, 
  VisualBaseline,
  TestStatus,
  visualTestConfig 
} from '@/config/visualTestConfig';
import { e2eRoutes, E2ERoute } from '@/config/e2eRoutes';

export interface UseVisualTestsReturn {
  testRun: VisualTestRun | null;
  results: VisualTestResult[];
  baselines: VisualBaseline[];
  isRunning: boolean;
  progress: number;
  currentRoute: string | null;
  startTestRun: (routes?: E2ERoute[], viewport?: string) => Promise<void>;
  captureBaseline: (routePath: string, viewport: string) => Promise<boolean>;
  captureAllBaselines: (viewport?: string) => Promise<void>;
  loadBaselines: () => Promise<void>;
  loadTestRuns: () => Promise<VisualTestRun[]>;
  approveAsBaseline: (resultId: string) => Promise<boolean>;
  deleteBaseline: (baselineId: string) => Promise<boolean>;
}

export function useVisualTests(): UseVisualTestsReturn {
  const { user } = useAuth();
  const [testRun, setTestRun] = useState<VisualTestRun | null>(null);
  const [results, setResults] = useState<VisualTestResult[]>([]);
  const [baselines, setBaselines] = useState<VisualBaseline[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentRoute, setCurrentRoute] = useState<string | null>(null);

  const loadBaselines = useCallback(async () => {
    const { data, error } = await supabase
      .from('visual_test_baselines')
      .select('*')
      .order('route_path');
    
    if (!error && data) {
      setBaselines(data.map(b => ({
        id: b.id,
        routePath: b.route_path,
        viewport: b.viewport,
        screenshotData: b.screenshot_data || undefined,
        screenshotUrl: b.screenshot_url || undefined,
        createdAt: b.created_at,
        updatedAt: b.updated_at,
        version: b.version,
      })));
    }
  }, []);

  const loadTestRuns = useCallback(async (): Promise<VisualTestRun[]> => {
    const { data, error } = await supabase
      .from('visual_test_runs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(10);
    
    if (error || !data) return [];
    
    return data.map(r => ({
      id: r.id,
      startedAt: r.started_at,
      completedAt: r.completed_at || undefined,
      totalTests: r.total_tests || 0,
      passedTests: r.passed_tests || 0,
      failedTests: r.failed_tests || 0,
      newTests: r.new_tests || 0,
      status: r.status as VisualTestRun['status'],
    }));
  }, []);

  const captureBaseline = useCallback(async (routePath: string, viewport: string): Promise<boolean> => {
    try {
      const options = getCaptureOptionsForRoute(routePath);
      const result = await captureScreenshot(options);
      
      if (!result.success || !result.screenshotData) {
        return false;
      }

      // Upsert baseline
      const { error } = await supabase
        .from('visual_test_baselines')
        .upsert({
          route_path: routePath,
          viewport,
          screenshot_data: result.screenshotData,
          user_id: user?.id,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'route_path,viewport',
        });

      if (error) {
        console.error('Failed to save baseline:', error);
        return false;
      }

      await loadBaselines();
      return true;
    } catch (error) {
      console.error('Capture baseline error:', error);
      return false;
    }
  }, [user?.id, loadBaselines]);

  const captureAllBaselines = useCallback(async (viewport: string = 'desktop') => {
    setIsRunning(true);
    setProgress(0);
    
    const routes = e2eRoutes.filter(r => r.requiresAuth);
    
    for (let i = 0; i < routes.length; i++) {
      const route = routes[i];
      setCurrentRoute(route.path);
      setProgress(((i + 1) / routes.length) * 100);
      
      // Note: In a real implementation, you'd navigate to each route
      // For now, we just capture the current page as a placeholder
      await captureBaseline(route.path, viewport);
      
      // Small delay between captures
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setIsRunning(false);
    setCurrentRoute(null);
    setProgress(100);
  }, [captureBaseline]);

  const startTestRun = useCallback(async (routes?: E2ERoute[], viewport: string = 'desktop') => {
    setIsRunning(true);
    setResults([]);
    setProgress(0);
    
    const testRoutes = routes || e2eRoutes.filter(r => r.requiresAuth);
    
    // Create test run record
    const { data: runData, error: runError } = await supabase
      .from('visual_test_runs')
      .insert({
        total_tests: testRoutes.length,
        status: 'running',
        user_id: user?.id,
      })
      .select()
      .single();
    
    if (runError || !runData) {
      console.error('Failed to create test run:', runError);
      setIsRunning(false);
      return;
    }

    const run: VisualTestRun = {
      id: runData.id,
      startedAt: runData.started_at,
      totalTests: testRoutes.length,
      passedTests: 0,
      failedTests: 0,
      newTests: 0,
      status: 'running',
    };
    setTestRun(run);

    const testResults: VisualTestResult[] = [];
    let passed = 0;
    let failed = 0;
    let newCount = 0;

    for (let i = 0; i < testRoutes.length; i++) {
      const route = testRoutes[i];
      setCurrentRoute(route.path);
      setProgress(((i + 1) / testRoutes.length) * 100);

      // Find baseline
      const baseline = baselines.find(
        b => b.routePath === route.path && b.viewport === viewport
      );

      // Capture current screenshot
      const options = getCaptureOptionsForRoute(route.path);
      const captureResult = await captureScreenshot(options);

      let status: TestStatus = 'pending';
      let diffPercentage = 0;
      let diffData: string | undefined;

      if (!captureResult.success) {
        status = 'error';
      } else if (!baseline?.screenshotData) {
        status = 'new';
        newCount++;
      } else {
        // Compare with baseline
        const threshold = getThresholdForRoute(route.path);
        const diffResult = await compareImages(
          baseline.screenshotData,
          captureResult.screenshotData!,
          threshold
        );

        diffPercentage = diffResult.diffPercentage;
        diffData = diffResult.diffImageData || undefined;
        status = diffResult.passed ? 'passed' : 'failed';
        
        if (diffResult.passed) {
          passed++;
        } else {
          failed++;
        }
      }

      const result: VisualTestResult = {
        id: crypto.randomUUID(),
        routePath: route.path,
        viewport,
        status,
        baselineId: baseline?.id,
        currentScreenshotData: captureResult.screenshotData,
        diffScreenshotData: diffData,
        pixelDiffPercentage: diffPercentage,
        errorMessage: captureResult.error,
        loadTimeMs: captureResult.loadTimeMs,
        createdAt: new Date().toISOString(),
      };

      testResults.push(result);
      setResults([...testResults]);

      // Save result to database
      await supabase.from('visual_test_results').insert({
        test_run_id: run.id,
        route_path: route.path,
        viewport,
        status,
        baseline_id: baseline?.id,
        current_screenshot_data: captureResult.screenshotData,
        diff_screenshot_data: diffData,
        pixel_diff_percentage: diffPercentage,
        error_message: captureResult.error,
        load_time_ms: captureResult.loadTimeMs,
        user_id: user?.id,
      });

      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    // Update test run with final stats
    await supabase
      .from('visual_test_runs')
      .update({
        completed_at: new Date().toISOString(),
        passed_tests: passed,
        failed_tests: failed,
        new_tests: newCount,
        status: 'completed',
      })
      .eq('id', run.id);

    // Send notification if there are failures
    if (failed > 0) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const failedRoutes = testResults
            .filter(r => r.status === 'failed')
            .map(r => ({
              routePath: r.routePath,
              viewport: r.viewport,
              diffPercentage: r.pixelDiffPercentage || 0,
            }));

          await supabase.functions.invoke('notify-visual-test-failure', {
            body: {
              testRunId: run.id,
              totalTests: testRoutes.length,
              passedTests: passed,
              failedTests: failed,
              newTests: newCount,
              failedRoutes,
              dashboardUrl: `${window.location.origin}/admin`,
            },
            headers: { Authorization: `Bearer ${session.access_token}` }
          });
          
          console.log('[useVisualTests] Sent failure notification');
        }
      } catch (notifyError) {
        console.error('[useVisualTests] Failed to send notification:', notifyError);
      }
    }

    setTestRun({
      ...run,
      completedAt: new Date().toISOString(),
      passedTests: passed,
      failedTests: failed,
      newTests: newCount,
      status: 'completed',
    });

    setIsRunning(false);
    setCurrentRoute(null);
  }, [baselines, user?.id]);

  const approveAsBaseline = useCallback(async (resultId: string): Promise<boolean> => {
    const result = results.find(r => r.id === resultId);
    if (!result || !result.currentScreenshotData) return false;

    const success = await captureBaseline(result.routePath, result.viewport);
    if (success) {
      // Update result status
      setResults(prev => prev.map(r => 
        r.id === resultId ? { ...r, status: 'passed' as TestStatus, pixelDiffPercentage: 0 } : r
      ));
    }
    return success;
  }, [results, captureBaseline]);

  const deleteBaseline = useCallback(async (baselineId: string): Promise<boolean> => {
    const { error } = await supabase
      .from('visual_test_baselines')
      .delete()
      .eq('id', baselineId);

    if (error) {
      console.error('Failed to delete baseline:', error);
      return false;
    }

    await loadBaselines();
    return true;
  }, [loadBaselines]);

  return {
    testRun,
    results,
    baselines,
    isRunning,
    progress,
    currentRoute,
    startTestRun,
    captureBaseline,
    captureAllBaselines,
    loadBaselines,
    loadTestRuns,
    approveAsBaseline,
    deleteBaseline,
  };
}
