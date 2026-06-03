import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Mail, CheckCircle, ArrowRight, Shield } from "lucide-react";
import { trackUserAction } from "@/lib/rlAnalytics";

interface NewsletterSignupProps {
  variant?: 'inline' | 'card';
  source?: string;
}

export const NewsletterSignup = ({ variant = 'inline', source = 'footer' }: NewsletterSignupProps) => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);

    try {
      const urlParams = new URLSearchParams(window.location.search);
      
      const { error } = await supabase.from('newsletter_subscribers').upsert({
        email: email.toLowerCase().trim(),
        source_page: source,
        utm_source: urlParams.get('utm_source'),
        utm_medium: urlParams.get('utm_medium'),
        utm_campaign: urlParams.get('utm_campaign'),
      }, { onConflict: 'email' });

      if (error) throw error;

      trackUserAction('newsletter_signup', { source, page: window.location.pathname });
      
      setIsSuccess(true);
      setEmail("");
      
      toast({
        title: "Subscribed!",
        description: "You'll receive weekly waste industry updates.",
      });

    } catch (error) {
      console.error('Newsletter signup error:', error);
      toast({
        title: "Error",
        description: "Failed to subscribe. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className={`flex items-center gap-3 ${variant === 'card' ? 'p-6 bg-card rounded-lg border border-primary/20' : ''}`}>
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
          <CheckCircle className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="font-semibold text-foreground">You're subscribed!</p>
          <p className="text-sm text-muted-foreground">Check your inbox for the welcome email.</p>
        </div>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className="p-6 bg-gradient-to-br from-primary/10 via-card to-accent/5 rounded-xl border border-primary/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/20">
            <Mail className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Weekly Waste Industry Updates</h3>
            <p className="text-sm text-muted-foreground">Regulatory changes, tips & industry news</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-input"
          />
          <Button 
            type="submit" 
            variant="action" 
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Subscribing..." : (
              <>
                Subscribe Free
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </form>

        <div className="flex items-center justify-center gap-2 mt-3 text-xs text-muted-foreground">
          <Shield className="w-3 h-3" />
          <span>No spam. Unsubscribe anytime.</span>
        </div>
      </div>
    );
  }

  // Inline variant
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Mail className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-foreground">Weekly Industry Updates</span>
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="email"
          placeholder="Your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="bg-input flex-1"
        />
        <Button type="submit" variant="action" size="sm" disabled={isSubmitting}>
          {isSubmitting ? "..." : "Subscribe"}
        </Button>
      </form>
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className="text-xs">Free</Badge>
        <Badge variant="outline" className="text-xs">No Spam</Badge>
      </div>
    </div>
  );
};
