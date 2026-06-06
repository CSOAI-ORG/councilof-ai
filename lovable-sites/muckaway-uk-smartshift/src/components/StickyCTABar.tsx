import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Zap, Shield, Clock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { trackUserAction } from "@/lib/rlAnalytics";

export const StickyCTABar = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if already dismissed this session
    const dismissed = sessionStorage.getItem('sticky-cta-dismissed');
    if (dismissed) {
      setIsDismissed(true);
      return;
    }

    const handleScroll = () => {
      // Show after scrolling past 500px (past hero section)
      const shouldShow = window.scrollY > 500;
      setIsVisible(shouldShow);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('sticky-cta-dismissed', 'true');
    trackUserAction('sticky_cta_dismissed');
  };

  const handleCTAClick = () => {
    trackUserAction('sticky_cta_clicked', { action: 'get_quote' });
  };

  if (isDismissed || !isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
      <div className="bg-gradient-to-r from-card via-card to-card border-t border-primary/30 shadow-2xl backdrop-blur-lg">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Trust badges - hidden on small mobile */}
            <div className="hidden md:flex items-center gap-3">
              <Badge variant="outline" className="bg-primary/10 border-primary/30 text-xs">
                <Shield className="w-3 h-3 mr-1" />
                EA Verified
              </Badge>
              <Badge variant="outline" className="bg-accent/10 border-accent/30 text-xs">
                <Clock className="w-3 h-3 mr-1" />
                Instant Quotes
              </Badge>
              <Badge variant="outline" className="bg-primary/10 border-primary/30 text-xs">
                <Zap className="w-3 h-3 mr-1" />
                AI-Powered
              </Badge>
            </div>

            {/* Main CTA area */}
            <div className="flex items-center gap-3 flex-1 justify-center md:justify-end">
              <span className="text-sm text-muted-foreground hidden sm:inline">
                Join 50+ operators saving 40% on compliance
              </span>
              <Link to="/auth" onClick={handleCTAClick}>
                <Button variant="action" size="sm" className="whitespace-nowrap">
                  Get Instant Quote Free
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
              <button
                onClick={handleDismiss}
                className="p-1.5 rounded-full hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
