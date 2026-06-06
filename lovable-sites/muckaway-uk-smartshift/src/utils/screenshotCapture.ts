import html2canvas from 'html2canvas';
import { visualTestConfig, routeVisualConfigs } from '@/config/visualTestConfig';

export interface CaptureOptions {
  viewport?: string;
  waitForSelector?: string;
  ignoreRegions?: { x: number; y: number; width: number; height: number }[];
}

export interface CaptureResult {
  success: boolean;
  screenshotData?: string;
  error?: string;
  loadTimeMs?: number;
}

/**
 * Wait for a specific element to be visible on the page
 */
async function waitForElement(selector: string, timeout: number = 5000): Promise<boolean> {
  const startTime = Date.now();
  
  return new Promise((resolve) => {
    const check = () => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(true);
        return;
      }
      
      if (Date.now() - startTime > timeout) {
        resolve(false);
        return;
      }
      
      requestAnimationFrame(check);
    };
    
    check();
  });
}

/**
 * Wait for the page to be fully loaded
 */
async function waitForPageLoad(): Promise<void> {
  return new Promise((resolve) => {
    // Wait for any loading indicators to disappear
    const checkLoading = () => {
      const loadingIndicators = document.querySelectorAll('[data-loading="true"], .loading, .skeleton');
      const hasLoading = loadingIndicators.length > 0;
      
      if (!hasLoading) {
        // Additional wait for animations to settle
        setTimeout(resolve, 500);
      } else {
        setTimeout(checkLoading, 100);
      }
    };
    
    // Initial wait for React to render
    setTimeout(checkLoading, visualTestConfig.waitForLoadMs);
  });
}

/**
 * Capture a screenshot of the current page
 */
export async function captureScreenshot(options: CaptureOptions = {}): Promise<CaptureResult> {
  const startTime = performance.now();
  
  try {
    // Wait for page to load
    await waitForPageLoad();
    
    // Wait for specific selector if provided
    if (options.waitForSelector) {
      const found = await waitForElement(options.waitForSelector);
      if (!found) {
        console.warn(`Selector ${options.waitForSelector} not found, proceeding anyway`);
      }
    }
    
    // Capture screenshot using html2canvas
    const canvas = await html2canvas(document.body, {
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#0a0a0a', // Match dark theme background
      scale: 1,
      logging: false,
      width: window.innerWidth,
      height: window.innerHeight,
    });
    
    // Apply ignore regions if specified
    if (options.ignoreRegions && options.ignoreRegions.length > 0) {
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#888888';
      options.ignoreRegions.forEach((region) => {
        ctx.fillRect(region.x, region.y, region.width, region.height);
      });
    }
    
    const screenshotData = canvas.toDataURL('image/png', visualTestConfig.screenshotQuality);
    const loadTimeMs = Math.round(performance.now() - startTime);
    
    return {
      success: true,
      screenshotData,
      loadTimeMs,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown capture error',
      loadTimeMs: Math.round(performance.now() - startTime),
    };
  }
}

/**
 * Get capture options for a specific route
 */
export function getCaptureOptionsForRoute(routePath: string): CaptureOptions {
  const config = routeVisualConfigs[routePath] || {};
  
  return {
    waitForSelector: config.waitForSelector,
    ignoreRegions: config.ignoreRegions,
  };
}

/**
 * Check if a viewport should be skipped for a route
 */
export function shouldSkipViewport(routePath: string, viewportName: string): boolean {
  const config = routeVisualConfigs[routePath];
  return config?.skipViewports?.includes(viewportName) || false;
}

/**
 * Get threshold for a specific route
 */
export function getThresholdForRoute(routePath: string): number {
  const config = routeVisualConfigs[routePath];
  return config?.thresholdPercent ?? visualTestConfig.defaultThreshold;
}
