import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Save, Mail, CheckCircle, Shield } from "lucide-react";
import { trackUserAction } from "@/lib/rlAnalytics";

interface SaveQuoteModalProps {
  quoteData: {
    materialType?: string;
    volumeTonnes?: number;
    estimatedPrice?: number;
    spoilType?: string;
    location?: string;
  };
  trigger?: React.ReactNode;
}

export const SaveQuoteModal = ({ quoteData, trigger }: SaveQuoteModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('saved_quotes').insert({
        email: email.toLowerCase().trim(),
        quote_data: quoteData,
        material_type: quoteData.materialType || quoteData.spoilType,
        volume_tonnes: quoteData.volumeTonnes,
        estimated_price: quoteData.estimatedPrice,
        source: 'manual_save'
      });

      if (error) throw error;

      trackUserAction('quote_saved', { 
        material: quoteData.materialType,
        volume: quoteData.volumeTonnes,
        page: window.location.pathname 
      });

      setIsSuccess(true);
      
      toast({
        title: "Quote Saved!",
        description: "We've emailed you a link to resume this quote.",
      });

      // Close after delay
      setTimeout(() => {
        setIsOpen(false);
        setIsSuccess(false);
        setEmail("");
      }, 2500);

    } catch (error) {
      console.error('Save quote error:', error);
      toast({
        title: "Error",
        description: "Failed to save quote. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="outline" size="sm">
              <Save className="w-4 h-4 mr-2" />
              Save Quote
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Quote Saved!</h3>
            <p className="text-muted-foreground">
              Check your inbox for a link to resume this quote anytime.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Save className="w-4 h-4 mr-2" />
            Save Quote
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            Save Your Quote
          </DialogTitle>
          <DialogDescription>
            We'll email you a link so you can resume this quote anytime.
          </DialogDescription>
        </DialogHeader>

        {/* Quote Summary */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <h4 className="font-medium text-sm text-foreground">Quote Summary</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {(quoteData.materialType || quoteData.spoilType) && (
              <div>
                <span className="text-muted-foreground">Material:</span>
                <span className="ml-2 text-foreground font-medium">
                  {quoteData.materialType || quoteData.spoilType}
                </span>
              </div>
            )}
            {quoteData.volumeTonnes && (
              <div>
                <span className="text-muted-foreground">Volume:</span>
                <span className="ml-2 text-foreground font-medium">
                  {quoteData.volumeTonnes}T
                </span>
              </div>
            )}
            {quoteData.estimatedPrice && (
              <div className="col-span-2">
                <span className="text-muted-foreground">Est. Price:</span>
                <span className="ml-2 text-accent font-bold">
                  £{quoteData.estimatedPrice.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="save-email">Email Address</Label>
            <Input
              id="save-email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-input"
            />
          </div>

          <Button 
            type="submit" 
            variant="action" 
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save & Email Quote"}
          </Button>

          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Shield className="w-3 h-3" />
            <span>Quote saved for 30 days. No spam.</span>
          </div>

          <div className="flex justify-center gap-2">
            <Badge variant="outline" className="text-xs">GDPR Compliant</Badge>
            <Badge variant="outline" className="text-xs">Secure</Badge>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
