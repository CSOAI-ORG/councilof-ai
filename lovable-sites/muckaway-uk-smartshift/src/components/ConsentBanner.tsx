import { useState, useEffect } from "react";
import { Cookie, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { grantConsent, revokeConsent } from "@/lib/analytics";
import { useToast } from "@/hooks/use-toast";

export const ConsentBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const consent = localStorage.getItem('analytics-consent');
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    grantConsent();
    setShowBanner(false);
    toast({
      title: "Preferences saved",
      description: "Analytics enabled to help us improve your experience",
    });
  };

  const handleReject = () => {
    revokeConsent();
    setShowBanner(false);
    toast({
      title: "Preferences saved",
      description: "Analytics disabled. You can change this in settings anytime.",
    });
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:bottom-4 md:left-auto md:right-4 md:max-w-md animate-in slide-in-from-bottom-5">
      <Card className="border-border/50 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/90">
        <CardContent className="flex flex-col gap-4 p-4 md:p-6">
          <div className="flex items-start gap-3">
            <Cookie className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium text-foreground">
                Cookie Consent
              </p>
              <p className="text-xs text-muted-foreground">
                We use cookies to improve your experience and analyze site usage. 
                Your data helps us optimize our waste management services.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              onClick={handleAccept}
              className="flex-1"
              size="sm"
            >
              Accept
            </Button>
            <Button 
              onClick={handleReject}
              variant="outline"
              className="flex-1"
              size="sm"
            >
              Reject
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            By accepting, you agree to our use of analytics cookies.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
