import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Calendar, MapPin, Truck, FileText, CreditCard, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { trackEvent } from "@/lib/analytics";
import { useGlobal } from "@/components/GlobalProvider";
import { TermsAcceptanceModal } from "@/components/TermsAcceptanceModal";
import { LEGAL_VERSIONS } from "@/config/legalConfig";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { SupportHoursIndicator } from "@/components/SupportHoursIndicator";

interface BookingConfirmationProps {
  quote: any;
  jobId?: string;
}

export const BookingConfirmation = ({ quote, jobId }: BookingConfirmationProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [processingPayment, setProcessingPayment] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const { formatCurrency } = useGlobal();

  // Check for existing terms acceptance on mount
  useEffect(() => {
    const stored = localStorage.getItem('terms-accepted');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Check if stored version matches current version
        if (parsed.version === LEGAL_VERSIONS.terms.version) {
          setTermsAccepted(true);
        }
      } catch {
        // Invalid stored data, ignore
      }
    }
  }, []);

  // Track when booking confirmation is viewed
  useEffect(() => {
    if (!quote) return;
    
    trackEvent("booking_confirmation_viewed", {
      job_id: jobId,
      total: quote.total,
      volume_m3: quote.volume,
      material: quote.material,
      postcode: quote.postcode,
      haulage: quote.haulage,
      disposal: quote.disposal,
      landfill_tax: quote.landfillTax,
    });
  }, [quote, jobId]);

  const handleTermsAccepted = () => {
    setTermsAccepted(true);
    setShowTermsModal(false);
    // Proceed with payment after accepting
    processPayment();
  };

  const handlePayNowClick = () => {
    if (!termsAccepted) {
      setShowTermsModal(true);
      return;
    }
    processPayment();
  };

  const processPayment = async () => {
    if (!jobId) {
      toast({
        title: "Error",
        description: "Job ID not found. Please try again.",
        variant: "destructive",
      });
      return;
    }

    // Track payment initiation
    trackEvent("payment_started", {
      type: "one_off_job",
      job_id: jobId,
      amount: quote.total,
      material: quote.material,
      volume_m3: quote.volume,
      postcode: quote.postcode,
    });

    setProcessingPayment(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication required",
          description: "Please sign in to complete payment",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase.functions.invoke("create-job-payment", {
        body: {
          jobId,
          amount: quote.total,
          jobDetails: {
            material: quote.material,
            volume: quote.volume,
            postcode: quote.postcode,
          },
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      } else {
        throw new Error("No payment URL received");
      }
    } catch (error) {
      console.error("Payment error:", error);
      
      trackEvent("payment_error", {
        type: "one_off_job",
        job_id: jobId,
        error_message: error instanceof Error ? error.message : String(error),
      });
      
      toast({
        title: "Payment error",
        description: error instanceof Error ? error.message : "Failed to process payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingPayment(false);
    }
  };

  return (
    <Card className="border-primary/20 shadow-glow">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4">
          <CheckCircle className="w-16 h-16 text-primary" />
        </div>
        <CardTitle className="text-2xl">Booking Request Received!</CardTitle>
        <CardDescription>
          We're processing your muck away request. You'll receive confirmation shortly.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-muted/50 p-4 rounded-lg space-y-3">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Quote Reference</p>
              <p className="font-semibold">{jobId || 'Pending'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Truck className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Estimated Load</p>
              <p className="font-semibold">{quote.volume}m³ {quote.material}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Location</p>
              <p className="font-semibold">{quote.postcode}</p>
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-muted-foreground">Haulage</span>
            <span className="font-semibold">{formatCurrency(quote.haulage)}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-muted-foreground">Disposal</span>
            <span className="font-semibold">{formatCurrency(quote.disposal)}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-muted-foreground">Landfill Tax</span>
            <span className="font-semibold">{formatCurrency(quote.landfillTax)}</span>
          </div>
          <div className="flex justify-between items-center text-lg font-bold pt-2 border-t">
            <span>Total</span>
            <span className="text-primary">{formatCurrency(quote.total)}</span>
          </div>
        </div>

        <div className="space-y-3">
          <Button 
            className="w-full" 
            size="lg"
            onClick={handlePayNowClick}
            disabled={processingPayment}
          >
            {processingPayment ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing Payment...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-5 w-5" />
                Pay Now - {formatCurrency(quote.total)}
              </>
            )}
          </Button>

          <TermsAcceptanceModal
            open={showTermsModal}
            onAccept={handleTermsAccepted}
            onDecline={() => setShowTermsModal(false)}
          />

          {/* WhatsApp Updates Opt-in */}
          <WhatsAppButton
            jobId={jobId}
            bookingReference={jobId}
            materialType={quote.material}
            variant="optin"
          />
          
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              onClick={() => {
                trackEvent("booking_cta_clicked", { 
                  cta: "add_to_calendar",
                  job_id: jobId,
                });
                // Create calendar event URL
                const title = encodeURIComponent(`MuckAway Collection - ${quote.material}`);
                const details = encodeURIComponent(`Spoil removal: ${quote.volume}m³ ${quote.material}\nLocation: ${quote.postcode}\nReference: ${jobId || 'Pending'}`);
                const calUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}`;
                window.open(calUrl, '_blank');
                toast({
                  title: "Calendar",
                  description: "Opening Google Calendar to add event",
                });
              }}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Add to Calendar
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                trackEvent("booking_cta_clicked", { 
                  cta: "view_dashboard",
                  job_id: jobId,
                });
                navigate('/dashboard');
              }}
            >
              <FileText className="w-4 h-4 mr-2" />
              View Dashboard
            </Button>
          </div>
          
          <Button 
            variant="ghost" 
            className="w-full" 
            onClick={() => {
              trackEvent("booking_cta_clicked", { 
                cta: "get_another_quote",
                previous_job_id: jobId,
              });
              window.location.reload();
            }}
          >
            Get Another Quote
          </Button>
        </div>

        {/* Support Hours Indicator */}
        <SupportHoursIndicator showPhone className="mt-4" />

        <div className="bg-accent/10 p-4 rounded-lg">
          <div className="flex items-start gap-2">
            <Calendar className="w-5 h-5 text-accent mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-accent mb-1">Next Steps</p>
              <ul className="text-muted-foreground space-y-1">
                <li>• We'll contact you within 2 hours to confirm availability</li>
                <li>• Schedule your preferred collection date</li>
                <li>• Receive compliance documents before collection</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
