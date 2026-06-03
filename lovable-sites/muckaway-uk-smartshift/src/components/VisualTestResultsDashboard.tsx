import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Camera, 
  Play, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Image as ImageIcon,
  Trash2,
  RefreshCw,
  Eye,
  Download,
  Clock
} from 'lucide-react';
import { useVisualTests } from '@/hooks/useVisualTests';
import { VisualTestResult, VisualBaseline, TestStatus } from '@/config/visualTestConfig';
import { e2eRoutes } from '@/config/e2eRoutes';
import { toast } from 'sonner';

const statusConfig: Record<TestStatus, { icon: React.ReactNode; color: string; label: string }> = {
  pending: { icon: <Clock className="h-4 w-4" />, color: 'bg-muted', label: 'Pending' },
  running: { icon: <RefreshCw className="h-4 w-4 animate-spin" />, color: 'bg-blue-500', label: 'Running' },
  passed: { icon: <CheckCircle className="h-4 w-4" />, color: 'bg-green-500', label: 'Passed' },
  failed: { icon: <XCircle className="h-4 w-4" />, color: 'bg-destructive', label: 'Failed' },
  new: { icon: <AlertTriangle className="h-4 w-4" />, color: 'bg-yellow-500', label: 'New' },
  error: { icon: <XCircle className="h-4 w-4" />, color: 'bg-red-700', label: 'Error' },
};

export function VisualTestResultsDashboard() {
  const {
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
    approveAsBaseline,
    deleteBaseline,
  } = useVisualTests();

  const [selectedResult, setSelectedResult] = useState<VisualTestResult | null>(null);
  const [selectedBaseline, setSelectedBaseline] = useState<VisualBaseline | null>(null);
  const [activeTab, setActiveTab] = useState('results');

  useEffect(() => {
    loadBaselines();
  }, [loadBaselines]);

  const handleRunTests = async () => {
    toast.info('Starting visual regression tests...');
    await startTestRun();
    toast.success('Visual tests completed!');
  };

  const handleCaptureBaselines = async () => {
    toast.info('Capturing baselines for current page...');
    await captureAllBaselines();
    toast.success('Baselines captured!');
  };

  const handleApproveBaseline = async (resultId: string) => {
    const success = await approveAsBaseline(resultId);
    if (success) {
      toast.success('New baseline approved');
    } else {
      toast.error('Failed to approve baseline');
    }
  };

  const handleDeleteBaseline = async (baselineId: string) => {
    const success = await deleteBaseline(baselineId);
    if (success) {
      toast.success('Baseline deleted');
    } else {
      toast.error('Failed to delete baseline');
    }
  };

  const passedCount = results.filter(r => r.status === 'passed').length;
  const failedCount = results.filter(r => r.status === 'failed').length;
  const newCount = results.filter(r => r.status === 'new').length;
  const totalRoutes = e2eRoutes.filter(r => r.requiresAuth).length;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{totalRoutes}</div>
            <div className="text-sm text-muted-foreground">Total Routes</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-500">{baselines.length}</div>
            <div className="text-sm text-muted-foreground">Baselines</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-500">{passedCount}</div>
            <div className="text-sm text-muted-foreground">Passed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-destructive">{failedCount}</div>
            <div className="text-sm text-muted-foreground">Failed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-500">{newCount}</div>
            <div className="text-sm text-muted-foreground">New</div>
          </CardContent>
        </Card>
      </div>

      {/* Progress */}
      {isRunning && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Testing: {currentRoute}</span>
              <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={handleRunTests} disabled={isRunning}>
          <Play className="h-4 w-4 mr-2" />
          Run Visual Tests
        </Button>
        <Button variant="outline" onClick={handleCaptureBaselines} disabled={isRunning}>
          <Camera className="h-4 w-4 mr-2" />
          Capture All Baselines
        </Button>
        <Button variant="outline" onClick={loadBaselines}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="results">Test Results ({results.length})</TabsTrigger>
          <TabsTrigger value="baselines">Baselines ({baselines.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="results" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
              <CardDescription>
                {testRun 
                  ? `Run started ${new Date(testRun.startedAt).toLocaleString()}`
                  : 'No test run yet. Click "Run Visual Tests" to start.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  {results.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No test results. Run visual tests to see results here.
                    </div>
                  ) : (
                    results.map((result) => (
                      <div 
                        key={result.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Badge className={statusConfig[result.status].color}>
                            {statusConfig[result.status].icon}
                          </Badge>
                          <div>
                            <div className="font-medium">{result.routePath}</div>
                            <div className="text-xs text-muted-foreground">
                              {result.viewport} • {result.loadTimeMs}ms • 
                              {result.pixelDiffPercentage.toFixed(2)}% diff
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {result.status === 'new' && (
                            <Button 
                              size="sm" 
                              onClick={() => handleApproveBaseline(result.id)}
                            >
                              Approve
                            </Button>
                          )}
                          {result.status === 'failed' && (
                            <>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => setSelectedResult(result)}
                                  >
                                    <Eye className="h-4 w-4 mr-1" />
                                    View Diff
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl">
                                  <DialogHeader>
                                    <DialogTitle>Visual Diff: {result.routePath}</DialogTitle>
                                  </DialogHeader>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <h4 className="text-sm font-medium mb-2">Current</h4>
                                      {result.currentScreenshotData && (
                                        <img 
                                          src={result.currentScreenshotData} 
                                          alt="Current" 
                                          className="w-full rounded border"
                                        />
                                      )}
                                    </div>
                                    <div>
                                      <h4 className="text-sm font-medium mb-2">Diff Overlay</h4>
                                      {result.diffScreenshotData && (
                                        <img 
                                          src={result.diffScreenshotData} 
                                          alt="Diff" 
                                          className="w-full rounded border"
                                        />
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex justify-end gap-2 mt-4">
                                    <Button 
                                      variant="outline"
                                      onClick={() => handleApproveBaseline(result.id)}
                                    >
                                      Approve as New Baseline
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="baselines" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Baseline Screenshots</CardTitle>
              <CardDescription>
                Reference screenshots for visual regression comparison
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {baselines.length === 0 ? (
                    <div className="col-span-full text-center py-8 text-muted-foreground">
                      No baselines captured yet. Click "Capture All Baselines" to create them.
                    </div>
                  ) : (
                    baselines.map((baseline) => (
                      <Card key={baseline.id} className="overflow-hidden">
                        <div className="aspect-video bg-muted relative">
                          {baseline.screenshotData ? (
                            <img 
                              src={baseline.screenshotData} 
                              alt={baseline.routePath}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <ImageIcon className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <CardContent className="p-3">
                          <div className="font-medium text-sm truncate">{baseline.routePath}</div>
                          <div className="flex items-center justify-between mt-2">
                            <Badge variant="outline">{baseline.viewport}</Badge>
                            <div className="flex gap-1">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    size="icon" 
                                    variant="ghost"
                                    onClick={() => setSelectedBaseline(baseline)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-3xl">
                                  <DialogHeader>
                                    <DialogTitle>{baseline.routePath}</DialogTitle>
                                  </DialogHeader>
                                  {baseline.screenshotData && (
                                    <img 
                                      src={baseline.screenshotData} 
                                      alt={baseline.routePath}
                                      className="w-full rounded"
                                    />
                                  )}
                                </DialogContent>
                              </Dialog>
                              <Button 
                                size="icon" 
                                variant="ghost"
                                onClick={() => handleDeleteBaseline(baseline.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            v{baseline.version} • {new Date(baseline.updatedAt).toLocaleDateString()}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default VisualTestResultsDashboard;
