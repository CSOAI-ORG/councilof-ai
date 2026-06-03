import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Shield, Lock, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LEGAL_VERSIONS } from "@/config/legalConfig";
import { useToast } from "@/hooks/use-toast";

interface TermsAcceptanceModalProps {
  open: boolean;
  onAccept: () => void;
  onDecline?: () => void;
}

export const TermsAcceptanceModal = ({ open, onAccept, onDecline }: TermsAcceptanceModalProps) => {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [dpaAccepted, setDpaAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const canProceed = termsAccepted && privacyAccepted && dpaAccepted;

  const recordAcceptance = async () => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Get user agent and attempt to get IP (will be null on client-side)
      const userAgent = navigator.userAgent;
      const region = localStorage.getItem('muckaway-region');
      let regionCode = 'unknown';
      try {
        if (region) {
          const parsed = JSON.parse(region);
          regionCode = parsed.countryCode || 'unknown';
        }
      } catch (e) {
        // Ignore parse errors
      }

      await supabase.from('terms_acceptances').insert({
        user_id: user?.id || null,
        terms_version: LEGAL_VERSIONS.terms.version,
        privacy_version: LEGAL_VERSIONS.privacy.version,
        dpa_version: LEGAL_VERSIONS.dpa.version,
        user_agent: userAgent,
        region_detected: regionCode,
        consent_types: {
          terms: termsAccepted,
          privacy: privacyAccepted,
          dpa: dpaAccepted,
          timestamp: new Date().toISOString(),
        },
      });

      // Store acceptance in localStorage for quick checks
      localStorage.setItem('terms-accepted', JSON.stringify({
        version: LEGAL_VERSIONS.terms.version,
        acceptedAt: new Date().toISOString(),
      }));

      onAccept();
    } catch (error) {
      console.error('Failed to record terms acceptance:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to record acceptance. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-lg" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Accept Terms & Policies
          </DialogTitle>
          <DialogDescription>
            Please review and accept our legal agreements to continue using MuckAway.ai
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[400px] pr-4">
          <div className="space-y-6 py-4">
            {/* Terms of Service */}
            <div className="flex items-start space-x-3 p-4 border border-border rounded-lg">
              <Checkbox
                id="terms"
                checked={termsAccepted}
                onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
              />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="terms" className="flex items-center gap-2 cursor-pointer">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="font-medium">Terms of Service</span>
                  <span className="text-xs text-muted-foreground">v{LEGAL_VERSIONS.terms.version}</span>
                </Label>
                <p className="text-sm text-muted-foreground">
                  I have read and agree to the{" "}
                  <Link to="/terms" target="_blank" className="text-primary hover:underline">
                    Terms of Service
                  </Link>
                  , including the Global Terms, Regional Addendum, and Industry-Specific Terms.
                </p>
              </div>
            </div>

            {/* Privacy Policy */}
            <div className="flex items-start space-x-3 p-4 border border-border rounded-lg">
              <Checkbox
                id="privacy"
                checked={privacyAccepted}
                onCheckedChange={(checked) => setPrivacyAccepted(checked as boolean)}
              />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="privacy" className="flex items-center gap-2 cursor-pointer">
                  <Lock className="h-4 w-4 text-primary" />
                  <span className="font-medium">Privacy Policy</span>
                  <span className="text-xs text-muted-foreground">v{LEGAL_VERSIONS.privacy.version}</span>
                </Label>
                <p className="text-sm text-muted-foreground">
                  I have read and understand the{" "}
                  <Link to="/privacy" target="_blank" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                  {" "}including how my data is collected, used, and protected.
                </p>
              </div>
            </div>

            {/* Data Processing Agreement */}
            <div className="flex items-start space-x-3 p-4 border border-border rounded-lg">
              <Checkbox
                id="dpa"
                checked={dpaAccepted}
                onCheckedChange={(checked) => setDpaAccepted(checked as boolean)}
              />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="dpa" className="flex items-center gap-2 cursor-pointer">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="font-medium">Data Processing Agreement</span>
                  <span className="text-xs text-muted-foreground">v{LEGAL_VERSIONS.dpa.version}</span>
                </Label>
                <p className="text-sm text-muted-foreground">
                  I agree to the{" "}
                  <Link to="/data-processing" target="_blank" className="text-primary hover:underline">
                    Data Processing Agreement
                  </Link>
                  {" "}for GDPR/CCPA/PIPEDA compliance.
                </p>
              </div>
            </div>

            {/* Important Notice */}
            <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-500 mb-1">Important Notice</p>
                <p className="text-muted-foreground">
                  Your acceptance is electronically recorded with timestamp, browser information, 
                  and detected region for compliance purposes. You can withdraw consent by 
                  contacting{" "}
                  <a href="mailto:dpo@muckaway.ai" className="text-primary hover:underline">
                    dpo@muckaway.ai
                  </a>
                </p>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {onDecline && (
            <Button variant="outline" onClick={onDecline} disabled={isSubmitting}>
              Decline & Exit
            </Button>
          )}
          <Button 
            onClick={recordAcceptance} 
            disabled={!canProceed || isSubmitting}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? "Processing..." : "Accept All & Continue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
