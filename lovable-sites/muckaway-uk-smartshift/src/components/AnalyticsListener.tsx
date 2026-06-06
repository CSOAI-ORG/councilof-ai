import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView } from "@/lib/analytics";

export const AnalyticsListener = () => {
  const location = useLocation();

  useEffect(() => {
    const fullPath = location.pathname + location.search;
    trackPageView(fullPath, {
      route: location.pathname,
    });
  }, [location]);

  return null;
};
