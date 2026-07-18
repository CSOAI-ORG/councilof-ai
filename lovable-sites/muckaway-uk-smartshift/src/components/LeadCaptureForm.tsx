import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowRight, Gift, Shield, CheckCircle, Loader2 } from 'lucide-react';
import { trackUserAction } from '@/lib/rlAnalytics';

interface LeadCaptureFormProps {
  variant?: 'inline' | 'card' | 'compact';
  title?: string;
  description?: string;
  ctaText?: string;
  leadType?: 'quote' | 'newsletter' | 'lead_magnet' | 'general';
  showPhone?: boolean;
  showCompany?: boolean;
  className?: string;
  onSuccess?: () => void;
}

export const LeadCaptureForm = ({
  variant = 'card',
  title = 'Get Your Free Quote',
  description = 'Enter your details and we\'ll send you a personalized quote within 60 seconds.',
  ctaText = 'Get Quote',
  leadType = 'general',
  showPhone = false,
  showCompany = false,
  className = '',
  onSuccess
}: LeadCaptureFormProps) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

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

      // Insert lead
      const { error } = await supabase.from('leads').insert({
        email: email.toLowerCase().trim(),
        name: name.trim() || null,
        phone: phone.trim() || null,
        company: company.trim() || null,
        source_page: window.location.pathname,
        lead_type: leadType,
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
      });

      if (error) throw error;

      // Also add to newsletter if it's a quote lead
      if (leadType === 'quote' || leadType === 'general') {
        await supabase.from('newsletter_subscribers').upsert({
          email: email.toLowerCase().trim(),
          name: name.trim() || null,
          source_page: window.location.pathname,
          utm_source: utmSource,
          utm_medium: utmMedium,
          utm_campaign: utmCampaign,
        }, { onConflict: 'email' });
      }

      trackUserAction('lead_captured', { 
        lead_type: leadType,
        page: window.location.pathname,
        has_phone: !!phone,
        has_company: !!company
      });

      setSubmitted(true);
      toast({
        title: "Success!",
        description: leadType === 'quote' 
          ? "We'll send your personalized quote shortly."
          : "Thanks for signing up!",
      });

      onSuccess?.();

    } catch (error) {
      console.error('Lead capture error:', error);
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
      <div className={`text-center py-8 ${className}`}>
        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">You're All Set!</h3>
        <p className="text-muted-foreground">
          {leadType === 'quote' 
            ? "Check your inbox for your personalized quote."
            : "We'll be in touch soon."}
        </p>
      </div>
    );
  }

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-3">
        <div>
          <Label htmlFor="lead-email">Email Address *</Label>
          <Input
            id="lead-email"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-input"
          />
        </div>
        <div>
          <Label htmlFor="lead-name">Name</Label>
          <Input
            id="lead-name"
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-input"
          />
        </div>
        {showPhone && (
          <div>
            <Label htmlFor="lead-phone">Phone</Label>
            <Input
              id="lead-phone"
              type="tel"
              placeholder="07xxx xxx xxx"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="bg-input"
            />
          </div>
        )}
        {showCompany && (
          <div>
            <Label htmlFor="lead-company">Company</Label>
            <Input
              id="lead-company"
              type="text"
              placeholder="Your company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="bg-input"
            />
          </div>
        )}
      </div>

      <Button 
        type="submit" 
        className="w-full gap-2" 
        size="lg"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Submitting...
          </>
        ) : (
          <>
            {ctaText}
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </Button>

      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Shield className="w-3 h-3" />
        <span>Your data is secure. We never share your information.</span>
      </div>
    </form>
  );

  if (variant === 'inline') {
    return <div className={className}>{formContent}</div>;
  }

  if (variant === 'compact') {
    return (
      <div className={`bg-muted/50 rounded-lg p-4 border ${className}`}>
        <div className="flex items-center gap-2 mb-3">
          <Gift className="w-5 h-5 text-primary" />
          <span className="font-semibold">{title}</span>
        </div>
        {formContent}
      </div>
    );
  }

  return (
    <Card className={`border-primary/20 ${className}`}>
      <CardHeader className="text-center">
        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-2">
          <Gift className="w-6 h-6 text-primary" />
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {formContent}
        <div className="flex flex-wrap justify-center gap-2 mt-4">
          <Badge variant="outline" className="text-xs">Free Quote</Badge>
          <Badge variant="outline" className="text-xs">No Obligation</Badge>
          <Badge variant="outline" className="text-xs">60 Second Response</Badge>
        </div>
      </CardContent>
    </Card>
  );
};
