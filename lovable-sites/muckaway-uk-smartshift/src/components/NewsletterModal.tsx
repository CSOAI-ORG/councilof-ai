import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Gift, X, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { trackConversion } from '@/lib/rlAnalytics';

interface NewsletterModalProps {
  delay?: number; // ms before showing
  scrollPercentage?: number; // show after scrolling X%
}

export const NewsletterModal = ({ 
  delay = 30000, // 30 seconds 
  scrollPercentage = 50 
}: NewsletterModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  useEffect(() => {
    // Check if already subscribed or dismissed
    const dismissed = localStorage.getItem('newsletter_dismissed');
    const subscribed = localStorage.getItem('newsletter_subscribed');
    
    if (dismissed || subscribed) return;

    // Timer-based trigger
    const timer = setTimeout(() => {
      if (!hasShown) {
        setIsOpen(true);
        setHasShown(true);
      }
    }, delay);

    // Scroll-based trigger
    const handleScroll = () => {
      const scrolled = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
      if (scrolled >= scrollPercentage && !hasShown) {
        setIsOpen(true);
        setHasShown(true);
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [delay, scrollPercentage, hasShown]);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem('newsletter_dismissed', 'true');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    setIsLoading(true);

    try {
      // Check if already subscribed
      const { data: existing } = await supabase
        .from('newsletter_subscribers')
        .select('id')
        .eq('email', email.toLowerCase())
        .single();

      if (existing) {
        toast.info('You\'re already subscribed! Check your inbox for our latest content.');
        setIsSuccess(true);
        localStorage.setItem('newsletter_subscribed', 'true');
        return;
      }

      // Add subscriber
      const { error } = await supabase
        .from('newsletter_subscribers')
        .insert({
          email: email.toLowerCase(),
          name: name || null,
          source_page: window.location.pathname,
          utm_source: new URLSearchParams(window.location.search).get('utm_source'),
          utm_medium: new URLSearchParams(window.location.search).get('utm_medium'),
          utm_campaign: new URLSearchParams(window.location.search).get('utm_campaign'),
        });

      if (error) throw error;

      trackConversion('newsletter_signup', 0, { source: 'modal', page: window.location.pathname });
      
      setIsSuccess(true);
      localStorage.setItem('newsletter_subscribed', 'true');
      toast.success('Welcome aboard! Check your email for your 10% discount code.');
    } catch (error) {
      console.error('Newsletter signup error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px] bg-gradient-to-br from-background to-muted border-primary/20">
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        {!isSuccess ? (
          <>
            <DialogHeader className="text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Gift className="h-8 w-8 text-primary" />
              </div>
              <DialogTitle className="text-2xl">Get 10% Off Your First Job</DialogTitle>
              <DialogDescription className="text-base">
                Join 5,000+ construction professionals getting weekly tips on waste management, compliance updates, and exclusive offers.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="newsletter-name">Name (optional)</Label>
                <Input
                  id="newsletter-name"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="newsletter-email">Email *</Label>
                <Input
                  id="newsletter-email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Subscribing...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Get My 10% Discount
                  </>
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                No spam. Unsubscribe anytime. By subscribing, you agree to our{' '}
                <a href="/privacy" className="underline hover:text-primary">Privacy Policy</a>.
              </p>
            </form>

            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground text-center">
                🎁 <strong>Bonus:</strong> Get our free "Waste Compliance Checklist" PDF
              </p>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <DialogTitle className="text-2xl mb-2">You're In!</DialogTitle>
            <DialogDescription className="text-base mb-4">
              Check your email for your 10% discount code and the free compliance checklist.
            </DialogDescription>
            <Button onClick={() => setIsOpen(false)} variant="outline">
              Continue Browsing
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default NewsletterModal;
