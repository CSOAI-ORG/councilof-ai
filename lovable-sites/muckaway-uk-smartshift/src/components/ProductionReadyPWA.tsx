import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

// PWA functionality - vite-plugin-pwa handles service worker registration automatically
export const ProductionReadyPWA = () => {
  const { toast } = useToast();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Note: vite-plugin-pwa handles SW registration automatically
    // We only need to handle the install prompt and performance monitoring

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Show install prompt after 5 seconds
      setTimeout(() => {
        toast({
          title: "Install MuckAway.ai",
          description: "Add to home screen for the best experience",
          action: (
            <Button 
              size="sm"
              onClick={() => {
                (e as any)?.prompt?.();
                (e as any)?.userChoice?.then((choiceResult: any) => {
                  if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                  }
                  setDeferredPrompt(null);
                });
              }}
            >
              Install
            </Button>
          ),
        });
      }, 5000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Performance monitoring
    if ('performance' in window) {
      window.addEventListener('load', () => {
        const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const loadTime = perfData.loadEventEnd - perfData.loadEventStart;
        
        if (loadTime > 3000) {
          console.warn('Slow page load detected:', loadTime + 'ms');
        }
      });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [toast]);

  return null;
};
