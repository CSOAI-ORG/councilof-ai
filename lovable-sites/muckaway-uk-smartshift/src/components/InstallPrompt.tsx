import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, X, Smartphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if running as standalone app
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);

    // Check if iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(ios);

    // Check if user has dismissed the prompt before
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        return; // Don't show for 7 days after dismissal
      }
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Show iOS prompt if on iOS and not standalone
    if (ios && !standalone) {
      setTimeout(() => setShowPrompt(true), 3000); // Show after 3 seconds
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      toast({
        title: "Installation started",
        description: "MuckAway.ai is being installed to your device",
      });
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    toast({
      title: "Reminder dismissed",
      description: "We'll remind you again in 7 days",
    });
  };

  if (isStandalone || !showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-bottom-5">
      <Card className="border-primary/20 shadow-glow bg-background/95 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <Smartphone className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Install MuckAway.ai</h3>
              {isIOS ? (
                <p className="text-sm text-muted-foreground mb-3">
                  Tap the <strong>Share</strong> button below and select <strong>"Add to Home Screen"</strong> to install MuckAway.ai as an app.
                </p>
              ) : (
                <p className="text-sm text-muted-foreground mb-3">
                  Install our app for faster access, offline support, and a native app experience.
                </p>
              )}
              <div className="flex gap-2">
                {!isIOS && deferredPrompt && (
                  <Button
                    size="sm"
                    onClick={handleInstallClick}
                    className="flex-1"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Install
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDismiss}
                  className={isIOS ? "flex-1" : ""}
                >
                  <X className="w-4 h-4 mr-2" />
                  {isIOS ? "Got it" : "Later"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
