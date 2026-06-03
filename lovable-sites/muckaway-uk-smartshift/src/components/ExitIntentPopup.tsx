import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Gift, Download, ArrowRight, X, Shield, CheckCircle, Percent, Clock } from "lucide-react";
import { trackUserAction } from "@/lib/rlAnalytics";

interface ExitIntentPopupProps {
  quoteData?: {
    materialType?: string;
    volumeTonnes?: number;
    estimatedPrice?: number;
  };
  variant?: 'guide' | 'discount' | 'quote';
}

export const ExitIntentPopup = ({ quoteData, variant = 'guide' }: ExitIntentPopupProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasShown, setHasShown] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  // Check if popup was already dismissed this session
  useEffect(() => {
    const dismissed = sessionStorage.getItem('exit-intent-dismissed');
    if (dismissed) {
      setHasShown(true);
    }
  }, []);

  // Desktop: Mouse leave detection
  const handleMouseLeave = useCallback((e: MouseEvent) => {
    if (e.clientY <= 0 && !hasShown && !isOpen) {
      setIsOpen(true);
      setHasShown(true);
      trackUserAction('exit_intent_triggered', { trigger: 'mouse_leave', page: window.location.pathname, variant });
    }
  }, [hasShown, isOpen, variant]);

  // Mobile: Scroll behavior detection (rapid scroll up then stop)
  useEffect(() => {
    let lastScrollY = 0;
    let scrollVelocity = 0;
    let scrollTimer: NodeJS.Timeout;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      scrollVelocity = lastScrollY - currentScrollY;
      lastScrollY = currentScrollY;

      // If scrolling up rapidly from below fold
      if (scrollVelocity > 50 && currentScrollY < 200 && !hasShown && !isOpen) {
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(() => {
          if (!hasShown && !isOpen) {
            setIsOpen(true);
            setHasShown(true);
            trackUserAction('exit_intent_triggered', { trigger: 'scroll_up', page: window.location.pathname, variant });
          }
        }, 500);
      }
    };

    // Desktop mouse leave
    document.addEventListener('mouseleave', handleMouseLeave);
    
    // Mobile scroll
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimer);
    };
  }, [hasShown, isOpen, handleMouseLeave, variant]);

  const handleDismiss = () => {
    setIsOpen(false);
    sessionStorage.setItem('exit-intent-dismissed', 'true');
    trackUserAction('exit_intent_dismissed', { page: window.location.pathname, variant });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);

    try {
      // Get UTM params from URL
      const urlParams = new URLSearchParams(window.location.search);
      const utmSource = urlParams.get('utm_source');
      const utmMedium = urlParams.get('utm_medium');
      const utmCampaign = urlParams.get('utm_campaign');

      // Save to leads table
      await supabase.from('leads').insert({
        email: email.toLowerCase().trim(),
        name: name.trim() || null,
        source_page: window.location.pathname,
        lead_type: 'exit_intent',
        quote_data: quoteData || null,
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
      });

      // Save newsletter subscription
      await supabase.from('newsletter_subscribers').upsert({
        email: email.toLowerCase().trim(),
        name: name.trim() || null,
        source_page: window.location.pathname,
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
      }, { onConflict: 'email' });

      // If there's quote data, save it too
      if (quoteData && (quoteData.materialType || quoteData.volumeTonnes)) {
        await supabase.from('saved_quotes').insert({
          email: email.toLowerCase().trim(),
          quote_data: quoteData,
          material_type: quoteData.materialType,
          volume_tonnes: quoteData.volumeTonnes,
          estimated_price: quoteData.estimatedPrice,
          source: 'exit_intent'
        });
      }

      // Track exit intent event
      const sessionId = sessionStorage.getItem('session-id') || crypto.randomUUID();
      await supabase.from('exit_intent_events').insert({
        session_id: sessionId,
        event_type: 'email_captured',
        page_path: window.location.pathname,
        email_captured: true,
        quote_saved: !!(quoteData?.materialType)
      });

      trackUserAction('exit_intent_converted', { 
        has_quote: !!(quoteData?.materialType),
        page: window.location.pathname,
        variant
      });

      setSubmitted(true);
      toast({
        title: variant === 'discount' ? "Discount Applied!" : "You're in!",
        description: variant === 'discount' 
          ? "Your 10% discount code has been sent to your email."
          : "Check your email for the free compliance guide.",
      });

      // Close after showing success
      setTimeout(() => {
        setIsOpen(false);
        sessionStorage.setItem('exit-intent-dismissed', 'true');
      }, 2000);

    } catch (error) {
      console.error('Exit intent submission error:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md bg-card border-primary/20">
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">You're All Set!</h3>
            <p className="text-muted-foreground">
              {variant === 'discount' 
                ? "Check your inbox for your 10% discount code."
                : "Check your inbox for the free UK Waste Compliance Guide 2025."}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const getVariantContent = () => {
    switch (variant) {
      case 'discount':
        return {
          icon: Percent,
          title: "Wait! Get 10% Off Your First Order",
          description: "Enter your email to receive an exclusive 10% discount on your first muck away job.",
          buttonText: "Get My Discount",
          benefits: [
            "10% off first order",
            "Priority booking",
            "Free compliance check",
            "No minimum order"
          ]
        };
      case 'quote':
        return {
          icon: Clock,
          title: "Don't Leave Without Your Quote",
          description: "Get an instant quote sent to your inbox. No obligation, valid for 30 days.",
          buttonText: "Send My Quote",
          benefits: [
            "Instant AI-powered pricing",
            "Valid for 30 days",
            "Lock in today's rates",
            "No commitment required"
          ]
        };
      default:
        return {
          icon: Gift,
          title: "Wait! Get Your Free Guide",
          description: "Don't risk £50K in fines. Download our free UK Waste Compliance Guide 2025.",
          buttonText: "Get Free Guide",
          benefits: [
            "Complete WTN requirements checklist",
            "Hazardous waste classification guide",
            "Environment Agency audit preparation",
            "Landfill tax rate tables 2025"
          ]
        };
    }
  };

  const content = getVariantContent();
  const IconComponent = content.icon;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg bg-card border-primary/20">
        <button 
          onClick={handleDismiss}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/20">
              <IconComponent className="w-8 h-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-2xl">
            {content.title}
          </DialogTitle>
          <DialogDescription className="text-base">
            {content.description}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Lead Magnet Preview */}
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-4 border border-primary/20">
            <div className="flex items-start gap-3">
              <Download className="w-10 h-10 text-primary flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-foreground">
                  {variant === 'discount' ? "Your Exclusive Offer Includes:" : "Free Download Includes:"}
                </h4>
                <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                  {content.benefits.map((benefit, idx) => (
                    <li key={idx}>✓ {benefit}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {quoteData?.materialType && (
            <div className="bg-accent/10 rounded-lg p-3 border border-accent/20">
              <p className="text-sm text-foreground">
                <span className="font-medium">Your quote for {quoteData.volumeTonnes}T of {quoteData.materialType}</span>
                {quoteData.estimatedPrice && (
                  <span className="text-accent font-bold ml-2">≈ £{quoteData.estimatedPrice.toLocaleString()}</span>
                )}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                We'll save this quote and email you a link to complete it.
              </p>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <Label htmlFor="exit-email">Email Address</Label>
              <Input
                id="exit-email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-input"
              />
            </div>
            <div>
              <Label htmlFor="exit-name">Name (optional)</Label>
              <Input
                id="exit-name"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-input"
              />
            </div>
          </div>

          <Button 
            type="submit" 
            variant="default" 
            className="w-full" 
            size="lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              "Sending..."
            ) : (
              <>
                {content.buttonText}
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>

          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Shield className="w-3 h-3" />
            <span>We respect your privacy. Unsubscribe anytime.</span>
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="outline" className="text-xs">GDPR Compliant</Badge>
            <Badge variant="outline" className="text-xs">No Spam</Badge>
            <Badge variant="outline" className="text-xs">Free Forever</Badge>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
