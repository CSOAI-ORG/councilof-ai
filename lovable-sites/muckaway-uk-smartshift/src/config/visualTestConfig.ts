export interface ViewportConfig {
  name: string;
  width: number;
  height: number;
}

export interface VisualTestConfig {
  viewports: ViewportConfig[];
  defaultThreshold: number;
  screenshotQuality: number;
  waitForLoadMs: number;
  maxRetries: number;
}

export const visualTestConfig: VisualTestConfig = {
  viewports: [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1440, height: 900 },
  ],
  defaultThreshold: 0.1, // 0.1% pixel difference tolerance
  screenshotQuality: 0.92,
  waitForLoadMs: 2000,
  maxRetries: 3,
};

export interface RouteVisualConfig {
  waitForSelector?: string;
  ignoreRegions?: { x: number; y: number; width: number; height: number }[];
  thresholdPercent?: number;
  criticalElements?: string[];
  skipViewports?: string[];
}

export const routeVisualConfigs: Record<string, RouteVisualConfig> = {
  '/dashboard': {
    waitForSelector: '[data-testid="dashboard-content"]',
    criticalElements: ['h1', '.quick-actions'],
  },
  '/ai-classification': {
    waitForSelector: '[data-testid="ai-classifier"]',
    thresholdPercent: 0.5, // Higher tolerance for dynamic AI content
  },
  '/ai-insights': {
    waitForSelector: '[data-testid="ai-insights"]',
    thresholdPercent: 0.5,
  },
  '/fleet': {
    waitForSelector: '[data-testid="fleet-management"]',
  },
  '/reports': {
    waitForSelector: '[data-testid="reports-content"]',
  },
  '/schedule': {
    waitForSelector: '[data-testid="schedule-content"]',
    thresholdPercent: 1.0, // Calendar views may have date changes
  },
};

export type TestStatus = 'pending' | 'running' | 'passed' | 'failed' | 'new' | 'error';

export interface VisualTestResult {
  id: string;
  routePath: string;
  viewport: string;
  status: TestStatus;
  baselineId?: string;
  currentScreenshotData?: string;
  diffScreenshotData?: string;
  pixelDiffPercentage: number;
  errorMessage?: string;
  loadTimeMs?: number;
  createdAt: string;
}

export interface VisualTestRun {
  id: string;
  startedAt: string;
  completedAt?: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  newTests: number;
  status: 'running' | 'completed' | 'failed';
}

export interface VisualBaseline {
  id: string;
  routePath: string;
  viewport: string;
  screenshotData?: string;
  screenshotUrl?: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}
