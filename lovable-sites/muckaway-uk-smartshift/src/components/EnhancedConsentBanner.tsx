import { useState, useEffect } from "react";
import { Cookie, Settings, Check, X, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { grantConsent, revokeConsent } from "@/lib/analytics";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { COOKIE_CATEGORIES } from "@/config/legalConfig";

interface CookiePreferences {
  essential: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

export const EnhancedConsentBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true, // Always true, cannot be changed
    functional: false,
    analytics: false,
    marketing: false,
  });
  const { toast } = useToast();

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setShowBanner(true);
    } else {
      try {
        const savedPrefs = JSON.parse(consent);
        setPreferences(savedPrefs);
      } catch (e) {
        setShowBanner(true);
      }
    }
  }, []);

  const savePreferences = (prefs: CookiePreferences) => {
    localStorage.setItem('cookie-consent', JSON.stringify(prefs));
    localStorage.setItem('cookie-consent-timestamp', new Date().toISOString());
    
    if (prefs.analytics) {
      grantConsent();
    } else {
      revokeConsent();
    }
    
    setShowBanner(false);
    toast({
      title: "Preferences saved",
      description: "Your cookie preferences have been updated.",
    });
  };

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      essential: true,
      functional: true,
      analytics: true,
      marketing: true,
    };
    setPreferences(allAccepted);
    savePreferences(allAccepted);
  };

  const handleRejectAll = () => {
    const essentialOnly: CookiePreferences = {
      essential: true,
      functional: false,
      analytics: false,
      marketing: false,
    };
    setPreferences(essentialOnly);
    savePreferences(essentialOnly);
  };

  const handleSavePreferences = () => {
    savePreferences(preferences);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom-5">
      <Card className="max-w-2xl mx-auto border-border/50 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/90 shadow-xl">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-start gap-3 mb-4">
            <Cookie className="h-6 w-6 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">Cookie Preferences</h3>
              <p className="text-sm text-muted-foreground">
                We use cookies to enhance your experience, analyze site usage, and assist in our marketing efforts.
                You can customize your preferences below.{" "}
                <Link to="/cookie-policy" className="text-primary hover:underline">
                  Learn more
                </Link>
              </p>
            </div>
          </div>

          <Collapsible open={showDetails} onOpenChange={setShowDetails}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full mb-4 justify-between">
                <span className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Customize Preferences
                </span>
                {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 mb-4">
              {/* Essential Cookies */}
              <div className="flex items-start justify-between p-3 bg-secondary/50 rounded-lg">
                <div className="flex-1 mr-4">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-foreground text-sm">Essential</h4>
                    <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">Required</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {COOKIE_CATEGORIES.essential.description}
                  </p>
                </div>
                <Switch checked={true} disabled className="opacity-50" />
              </div>

              {/* Functional Cookies */}
              <div className="flex items-start justify-between p-3 bg-secondary/30 rounded-lg">
                <div className="flex-1 mr-4">
                  <h4 className="font-medium text-foreground text-sm">Functional</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {COOKIE_CATEGORIES.functional.description}
                  </p>
                </div>
                <Switch 
                  checked={preferences.functional}
                  onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, functional: checked }))}
                />
              </div>

              {/* Analytics Cookies */}
              <div className="flex items-start justify-between p-3 bg-secondary/30 rounded-lg">
                <div className="flex-1 mr-4">
                  <h4 className="font-medium text-foreground text-sm">Analytics</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {COOKIE_CATEGORIES.analytics.description}
                  </p>
                </div>
                <Switch 
                  checked={preferences.analytics}
                  onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, analytics: checked }))}
                />
              </div>

              {/* Marketing Cookies */}
              <div className="flex items-start justify-between p-3 bg-secondary/30 rounded-lg">
                <div className="flex-1 mr-4">
                  <h4 className="font-medium text-foreground text-sm">Marketing</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {COOKIE_CATEGORIES.marketing.description}
                  </p>
                </div>
                <Switch 
                  checked={preferences.marketing}
                  onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, marketing: checked }))}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          <div className="flex flex-col sm:flex-row gap-2">
            {showDetails ? (
              <Button onClick={handleSavePreferences} className="flex-1">
                <Check className="h-4 w-4 mr-2" />
                Save Preferences
              </Button>
            ) : (
              <>
                <Button onClick={handleAcceptAll} className="flex-1">
                  <Check className="h-4 w-4 mr-2" />
                  Accept All
                </Button>
                <Button onClick={handleRejectAll} variant="outline" className="flex-1">
                  <X className="h-4 w-4 mr-2" />
                  Essential Only
                </Button>
              </>
            )}
          </div>

          <p className="text-xs text-muted-foreground text-center mt-4">
            By continuing to use this site, you consent to our use of essential cookies.
            View our{" "}
            <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
            {" "}and{" "}
            <Link to="/cookie-policy" className="text-primary hover:underline">Cookie Policy</Link>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
