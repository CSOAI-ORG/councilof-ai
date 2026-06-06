import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, Home, LayoutDashboard, Rocket, Mail, Shield, Clock } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke("verify-payment", {
          body: { sessionId },
        });

        if (error) {
          throw new Error(error.message);
        }

        setPaymentDetails(data);
        
        if (data.paymentStatus === "paid") {
          // Track successful payment
          trackEvent("payment_succeeded", {
            session_id: sessionId,
            amount_total: data.amountTotal,
            amount_gbp: ((data.amountTotal || 0) / 100).toFixed(2),
            currency: data.currency || "gbp",
            customer_email: data.customerEmail,
            payment_method: data.paymentMethod,
            job_id: data.jobId,
          });
          
          toast({
            title: "Payment Successful!",
            description: "Your booking has been confirmed. We'll contact you shortly.",
          });
        }
      } catch (error) {
        console.error("Payment verification error:", error);
        
        trackEvent("payment_verification_error", {
          session_id: sessionId,
          error_message: error instanceof Error ? error.message : String(error),
        });
        
        toast({
          title: "Verification Error",
          description: "Unable to verify payment status. Please contact support.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [sessionId, toast]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  if (!sessionId || !paymentDetails) {
    // Track invalid payment link
    trackEvent("payment_link_invalid", { 
      session_id: sessionId || "missing",
      has_payment_details: !!paymentDetails,
    });
    
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-center text-destructive">Invalid Payment Link</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              This payment link is invalid or has expired.
            </p>
            <Link to="/">
              <Button>
                <Home className="w-4 h-4 mr-2" />
                Return Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Welcome Card */}
        <Card className="border-primary/20 shadow-xl">
          <CardHeader className="text-center pb-4">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-3xl text-green-600 dark:text-green-400">
              Welcome to MuckAway.ai!
            </CardTitle>
            <p className="text-lg text-muted-foreground mt-2">
              Your subscription is now active. Let's get started!
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Account Info */}
            <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Mail className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Your Account</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium">{paymentDetails.customerEmail}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="font-medium text-green-600 dark:text-green-400 flex items-center gap-1">
                    <Shield className="w-4 h-4" />
                    Active Subscription
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Amount Paid:</span>
                  <span className="font-medium">
                    £{((paymentDetails.amountTotal || 0) / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-3">
                <Rocket className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">Get Started</h3>
              </div>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Access your dashboard to create your first job</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Set up your company profile and preferences</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Explore AI-powered waste classification tools</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Download the mobile app for on-site access</span>
                </li>
              </ul>
            </div>

            {/* Support Note */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
              <Clock className="w-4 h-4 flex-shrink-0" />
              <span>Need help? Our support team is available Mon-Fri 9am-5pm GMT</span>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link to="/dashboard" className="flex-1">
                <Button className="w-full h-12 text-base" size="lg">
                  <LayoutDashboard className="w-5 h-5 mr-2" />
                  Go to Dashboard
                </Button>
              </Link>
              <Link to="/" className="flex-1">
                <Button variant="outline" className="w-full h-12 text-base" size="lg">
                  <Home className="w-5 h-5 mr-2" />
                  Return Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}