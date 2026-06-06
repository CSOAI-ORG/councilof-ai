import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MessageSquare, X, Phone, Calculator } from 'lucide-react';
import { cn } from '@/lib/utils';
import { trackUserAction } from '@/lib/rlAnalytics';

// Pages where the floating CTA should appear (marketing/public pages only)
const ALLOWED_PATHS = [
  '/',
  '/pricing',
  '/about',
  '/contact',
  '/faq',
  '/how-to-use',
  '/software',
  '/ai-tools',
  '/use-cases',
  '/global',
  '/demo',
  '/waste-calculator',
];

// Paths that start with these should also show the CTA
const ALLOWED_PATH_PREFIXES = [
  '/muck-away-',
  '/grab-',
  '/tipper-',
  '/spoil-',
  '/soil-',
  '/waste-',
  '/construction-',
  '/hazardous-',
  '/rubble-',
  '/same-day-',
  '/ewc-',
  '/landfill-',
  '/environment-',
  '/site-waste-',
  '/consignment-',
  '/how-to-',
  '/skip-',
  '/licensed-',
  '/cheap-',
];

export const FloatingCTA = () => {
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);

  // Check if current path should show the CTA
  const shouldShowOnPath = ALLOWED_PATHS.includes(location.pathname) ||
    ALLOWED_PATH_PREFIXES.some(prefix => location.pathname.startsWith(prefix));

  useEffect(() => {
    // Reset visibility when path changes
    if (!shouldShowOnPath) {
      setIsVisible(false);
      setHasScrolled(false);
      return;
    }

    const handleScroll = () => {
      const scrollY = window.scrollY;
      // Show after scrolling 300px
      if (scrollY > 300 && !hasScrolled) {
        setHasScrolled(true);
        setIsVisible(true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    
    // Also show after 5 seconds regardless of scroll
    const timer = setTimeout(() => {
      if (shouldShowOnPath) {
        setIsVisible(true);
      }
    }, 5000);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timer);
    };
  }, [hasScrolled, shouldShowOnPath, location.pathname]);

  const handleGetQuote = () => {
    trackUserAction('floating_cta_quote_click', { location: window.location.pathname });
    window.location.href = '/waste-calculator';
  };

  const handleCall = () => {
    trackUserAction('floating_cta_call_click', { location: window.location.pathname });
    window.location.href = 'tel:+448001234567';
  };

  const handleChat = () => {
    trackUserAction('floating_cta_chat_click', { location: window.location.pathname });
    // Open chatbot or chat widget
    const chatButton = document.querySelector('[data-chat-trigger]');
    if (chatButton) {
      (chatButton as HTMLElement).click();
    }
  };

  // Don't render if not on allowed path or not visible yet
  if (!shouldShowOnPath || !isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2 md:bottom-6 md:right-6">
      {/* Expanded Options */}
      <div
        className={cn(
          'flex flex-col gap-2 transition-all duration-300',
          isExpanded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        )}
      >
        <Button
          onClick={handleGetQuote}
          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg flex items-center gap-2"
          size="lg"
        >
          <Calculator className="h-4 w-4" />
          <span>Get Instant Quote</span>
        </Button>
        
        <Button
          onClick={handleCall}
          variant="secondary"
          className="shadow-lg flex items-center gap-2"
          size="lg"
        >
          <Phone className="h-4 w-4" />
          <span>Call Now</span>
        </Button>
        
        <Button
          onClick={handleChat}
          variant="outline"
          className="bg-background shadow-lg flex items-center gap-2"
          size="lg"
          data-chat-trigger
        >
          <MessageSquare className="h-4 w-4" />
          <span>Live Chat</span>
        </Button>
      </div>

      {/* Main Toggle Button */}
      <Button
        onClick={() => {
          setIsExpanded(!isExpanded);
          trackUserAction('floating_cta_toggle', { expanded: !isExpanded });
        }}
        className={cn(
          'h-14 w-14 rounded-full shadow-xl transition-all duration-300',
          isExpanded
            ? 'bg-muted hover:bg-muted/90'
            : 'bg-primary hover:bg-primary/90 animate-pulse'
        )}
        size="icon"
      >
        {isExpanded ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageSquare className="h-6 w-6" />
        )}
      </Button>

      {/* Attention Grabber Badge */}
      {!isExpanded && (
        <div className="absolute -top-2 -left-2 bg-destructive text-destructive-foreground text-xs px-2 py-1 rounded-full animate-bounce">
          Free Quote!
        </div>
      )}
    </div>
  );
};

export default FloatingCTA;
