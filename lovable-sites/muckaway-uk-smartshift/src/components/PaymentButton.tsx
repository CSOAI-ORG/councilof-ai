import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, Loader2 } from "lucide-react";

interface PaymentButtonProps {
  amount: number;
  currency?: string;
  jobData?: any;
  className?: string;
  children?: React.ReactNode;
  onSuccess?: () => void;
  priceId?: string; // Make Stripe price ID configurable
}

export const PaymentButton = ({
  amount,
  currency = "gbp",
  jobData,
  className,
  children,
  onSuccess,
  priceId,
}: PaymentButtonProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handlePayment = async () => {
    try {
      setLoading(true);

      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please log in to continue with payment.",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          amount,
          currency,
          jobData,
          priceId, // Pass price ID if provided
          metadata: {
            source: "web_app",
          },
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.url) {
        // Open Stripe checkout in a new tab
        window.open(data.url, '_blank');
        
        toast({
          title: "Redirecting to Payment",
          description: "Complete your payment in the new tab to confirm your booking.",
        });

        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast({
        title: "Payment Error",
        description: error instanceof Error ? error.message : "Failed to initiate payment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handlePayment}
      disabled={loading}
      className={className}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <CreditCard className="w-4 h-4 mr-2" />
      )}
      {children || `Pay £${amount.toFixed(2)}`}
    </Button>
  );
};