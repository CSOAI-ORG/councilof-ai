/**
 * Analytics Component
 * Tracks page views, events, and user interactions
 * Privacy-first: No personal data collected, only aggregated metrics
 */

import { useEffect } from "react";
import { useLocation } from "wouter";

// Event types for analytics
type AnalyticsEvent = {
  name: string;
  category: string;
  label?: string;
  value?: number;
  metadata?: Record<string, unknown>;
};

// Analytics configuration
const ANALYTICS_CONFIG = {
  enabled: true, // Can be toggled via environment variable
  endpoint: "/api/analytics", // Backend endpoint for analytics
  batchSize: 10, // Number of events to batch before sending
  flushInterval: 30000, // Flush events every 30 seconds
  debug: import.meta.env.DEV, // Enable debug logging in development
};

// Event queue for batching
let eventQueue: AnalyticsEvent[] = [];
let lastFlush = Date.now();

// Helper to generate anonymous session ID (no cookies, just memory)
const getSessionId = (() => {
  let sessionId: string | null = null;
  return () => {
    if (!sessionId) {
      sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    return sessionId;
  };
})();

// Track an analytics event
export function trackEvent(event: AnalyticsEvent): void {
  if (!ANALYTICS_CONFIG.enabled) return;

  const enrichedEvent = {
    ...event,
    timestamp: new Date().toISOString(),
    sessionId: getSessionId(),
    page: window.location.pathname,
    referrer: document.referrer || undefined,
  };

  eventQueue.push(enrichedEvent);

  if (ANALYTICS_CONFIG.debug) {
    console.log("[Analytics]", enrichedEvent);
  }

  // Flush if queue is full
  if (eventQueue.length >= ANALYTICS_CONFIG.batchSize) {
    flushEvents();
  }
}

// Flush events to backend
async function flushEvents(): Promise<void> {
  if (eventQueue.length === 0) return;

  const eventsToSend = [...eventQueue];
  eventQueue = [];
  lastFlush = Date.now();

  try {
    // Send to backend (will gracefully fail if endpoint doesn't exist)
    await fetch(ANALYTICS_CONFIG.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ events: eventsToSend }),
      keepalive: true, // Ensures request completes even if page unloads
    }).catch(() => {
      // Silently fail - analytics should never break the app
      if (ANALYTICS_CONFIG.debug) {
        console.log("[Analytics] Backend not available, events logged locally only");
      }
    });
  } catch {
    // Silently fail
  }
}

// Track page view
export function trackPageView(path: string, title?: string): void {
  trackEvent({
    name: "page_view",
    category: "navigation",
    label: path,
    metadata: {
      title: title || document.title,
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
    },
  });
}

// Track button clicks
export function trackClick(buttonName: string, category: string = "engagement"): void {
  trackEvent({
    name: "click",
    category,
    label: buttonName,
  });
}

// Track form submissions
export function trackFormSubmission(formName: string, success: boolean): void {
  trackEvent({
    name: "form_submit",
    category: "conversion",
    label: formName,
    value: success ? 1 : 0,
  });
}

// Track time on page
export function trackTimeOnPage(seconds: number): void {
  trackEvent({
    name: "time_on_page",
    category: "engagement",
    value: seconds,
  });
}

// Analytics Provider Component
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  // Track page views on route change
  useEffect(() => {
    trackPageView(location);
  }, [location]);

  // Set up periodic flush
  useEffect(() => {
    const interval = setInterval(() => {
      if (Date.now() - lastFlush >= ANALYTICS_CONFIG.flushInterval) {
        flushEvents();
      }
    }, ANALYTICS_CONFIG.flushInterval);

    return () => clearInterval(interval);
  }, []);

  // Flush on page unload
  useEffect(() => {
    const handleUnload = () => {
      flushEvents();
    };

    window.addEventListener("beforeunload", handleUnload);
    window.addEventListener("pagehide", handleUnload);

    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      window.removeEventListener("pagehide", handleUnload);
    };
  }, []);

  // Track time on page
  useEffect(() => {
    const startTime = Date.now();

    return () => {
      const timeSpent = Math.round((Date.now() - startTime) / 1000);
      if (timeSpent > 5) { // Only track if more than 5 seconds
        trackTimeOnPage(timeSpent);
      }
    };
  }, [location]);

  return <>{children}</>;
}

// Hook for tracking custom events
export function useAnalytics() {
  return {
    trackEvent,
    trackClick,
    trackFormSubmission,
    trackPageView,
    trackTimeOnPage,
  };
}

export default AnalyticsProvider;
