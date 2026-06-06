import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CustomerSelfService } from '@/components/CustomerSelfService';
import { CustomerQuoteRequest } from '@/components/CustomerQuoteRequest';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { Briefcase, FileText, Phone, Loader2, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Portal() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [customerEmail, setCustomerEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRequestingAccess, setIsRequestingAccess] = useState(false);
  const [accessRequested, setAccessRequested] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (token) {
      validateToken(token);
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const validateToken = async (accessToken: string) => {
    try {
      const { data, error } = await supabase
        .from('customer_portal_access')
        .select('*')
        .eq('access_token', accessToken)
        .eq('active', true)
        .single();

      if (error || !data) {
        setIsValidToken(false);
      } else if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setIsValidToken(false);
      } else {
        setIsValidToken(true);
        // Update last login
        await supabase
          .from('customer_portal_access')
          .update({ last_login: new Date().toISOString() })
          .eq('id', data.id);
      }
    } catch (error) {
      console.error('Error validating token:', error);
      setIsValidToken(false);
    } finally {
      setIsLoading(false);
    }
  };

  const requestAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerEmail) return;

    setIsRequestingAccess(true);
    try {
      // In production, this would send an email with a portal access link
      toast({
        title: 'Access Link Sent',
        description: 'Check your email for your portal access link',
      });
      setAccessRequested(true);
    } catch (error) {
      console.error('Error requesting access:', error);
      toast({
        title: 'Error',
        description: 'Could not send access link. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsRequestingAccess(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  // No token or invalid token - show login form
  if (!token || isValidToken === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Customer Portal</CardTitle>
            <CardDescription>
              {isValidToken === false
                ? 'Your access link has expired or is invalid'
                : 'Enter your email to receive a portal access link'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {accessRequested ? (
              <div className="text-center py-4">
                <p className="text-green-600 font-medium mb-2">Check your email!</p>
                <p className="text-sm text-muted-foreground">
                  We've sent a secure access link to {customerEmail}
                </p>
              </div>
            ) : (
              <form onSubmit={requestAccess} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isRequestingAccess}>
                  {isRequestingAccess ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Get Access Link'
                  )}
                </Button>
              </form>
            )}

            <div className="mt-6 pt-6 border-t text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Not a customer yet?
              </p>
              <Link to="/auth">
                <Button variant="outline" className="w-full">
                  Create an Account
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Valid token - show customer portal
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">M</span>
            </div>
            <span className="font-semibold">MuckAway.ai Customer Portal</span>
          </div>
          <Link to="/">
            <Button variant="ghost" size="sm">
              Exit Portal
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="jobs" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="jobs" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              My Jobs
            </TabsTrigger>
            <TabsTrigger value="quote" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Get Quote
            </TabsTrigger>
            <TabsTrigger value="contact" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Contact
            </TabsTrigger>
          </TabsList>

          <TabsContent value="jobs">
            <CustomerSelfService />
          </TabsContent>

          <TabsContent value="quote">
            <div className="max-w-xl">
              <CustomerQuoteRequest />
            </div>
          </TabsContent>

          <TabsContent value="contact">
            <Card className="max-w-xl">
              <CardHeader>
                <CardTitle>Contact Us</CardTitle>
                <CardDescription>
                  Get in touch with our support team
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <p className="font-medium">Phone Support</p>
                  <p className="text-2xl font-bold text-primary">0800 123 4567</p>
                  <p className="text-sm text-muted-foreground">Mon-Fri 8am-6pm</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="font-medium">Email Support</p>
                  <p className="text-lg">support@muckaway.ai</p>
                  <p className="text-sm text-muted-foreground">We respond within 24 hours</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="font-medium">Emergency Line</p>
                  <p className="text-lg">0800 999 8888</p>
                  <p className="text-sm text-muted-foreground">24/7 for urgent issues</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
