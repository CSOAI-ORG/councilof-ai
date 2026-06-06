import { useState } from 'react';
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Cookie, Settings, Shield, ExternalLink, CheckCircle2, XCircle } from "lucide-react";
import { LEGAL_VERSIONS, formatLegalDate, COOKIE_CATEGORIES } from "@/config/legalConfig";
import { toast } from "sonner";

const CookiePolicy = () => {
  const version = LEGAL_VERSIONS.cookies;
  
  const [preferences, setPreferences] = useState({
    essential: true,
    functional: localStorage.getItem('cookie_functional') === 'true',
    analytics: localStorage.getItem('analytics_consent') === 'granted',
    marketing: localStorage.getItem('cookie_marketing') === 'true',
  });

  const handlePreferenceChange = (category: keyof typeof preferences, value: boolean) => {
    if (category === 'essential') return; // Cannot disable essential

    setPreferences(prev => ({ ...prev, [category]: value }));
    
    // Persist preferences
    if (category === 'analytics') {
      localStorage.setItem('analytics_consent', value ? 'granted' : 'denied');
    } else {
      localStorage.setItem(`cookie_${category}`, String(value));
    }
  };

  const savePreferences = () => {
    toast.success('Cookie preferences saved');
  };

  const acceptAll = () => {
    setPreferences({
      essential: true,
      functional: true,
      analytics: true,
      marketing: true,
    });
    localStorage.setItem('analytics_consent', 'granted');
    localStorage.setItem('cookie_functional', 'true');
    localStorage.setItem('cookie_marketing', 'true');
    toast.success('All cookies accepted');
  };

  const rejectAll = () => {
    setPreferences({
      essential: true,
      functional: false,
      analytics: false,
      marketing: false,
    });
    localStorage.setItem('analytics_consent', 'denied');
    localStorage.setItem('cookie_functional', 'false');
    localStorage.setItem('cookie_marketing', 'false');
    toast.success('Non-essential cookies rejected');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              <Cookie className="w-4 h-4 mr-2" />
              Cookie & Tracking
            </Badge>
            <h1 className="text-4xl font-bold text-foreground mb-4">Cookie Policy</h1>
            <p className="text-muted-foreground mb-2">
              Version {version.version} • Last updated: {formatLegalDate(version.lastUpdated)}
            </p>
          </div>

          {/* Quick Preferences Card */}
          <Card className="mb-8 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Your Cookie Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap gap-3">
                <Button onClick={acceptAll} className="bg-primary text-primary-foreground">
                  Accept All
                </Button>
                <Button onClick={rejectAll} variant="outline">
                  Reject Non-Essential
                </Button>
                <Button onClick={savePreferences} variant="secondary">
                  Save Current Preferences
                </Button>
              </div>

              <div className="space-y-4">
                {Object.entries(COOKIE_CATEGORIES).map(([key, category]) => (
                  <div 
                    key={key}
                    className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-foreground">{category.name}</h4>
                        {category.required && (
                          <Badge variant="secondary" className="text-xs">Required</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{category.description}</p>
                    </div>
                    <Switch
                      checked={preferences[key as keyof typeof preferences]}
                      onCheckedChange={(value) => handlePreferenceChange(key as keyof typeof preferences, value)}
                      disabled={category.required}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* What Are Cookies */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>What Are Cookies?</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm prose-invert max-w-none">
              <p className="text-muted-foreground">
                Cookies are small text files placed on your device when you visit a website. 
                They help websites remember your preferences, understand how you use the site, 
                and provide personalized experiences.
              </p>
              <p className="text-muted-foreground">
                We also use similar technologies like local storage, session storage, and pixels 
                to provide our services and improve your experience.
              </p>
            </CardContent>
          </Card>

          {/* Cookie Categories Detail */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Cookie Categories & Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {Object.entries(COOKIE_CATEGORIES).map(([key, category]) => (
                  <AccordionItem key={key} value={key}>
                    <AccordionTrigger className="text-left">
                      <div className="flex items-center gap-3">
                        {preferences[key as keyof typeof preferences] ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-muted-foreground" />
                        )}
                        <span>{category.name} Cookies</span>
                        <Badge variant="outline" className="ml-2">
                          {category.cookies.length} cookies
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm text-muted-foreground mb-4">{category.description}</p>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Cookie Name</TableHead>
                            <TableHead>Purpose</TableHead>
                            <TableHead>Duration</TableHead>
                            <TableHead>Provider</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {category.cookies.map((cookie, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-mono text-sm">{cookie.name}</TableCell>
                              <TableCell className="text-muted-foreground">{cookie.purpose}</TableCell>
                              <TableCell className="text-muted-foreground">{cookie.duration}</TableCell>
                              <TableCell className="text-muted-foreground">{cookie.provider}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          {/* Do Not Track */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Do Not Track (DNT)
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm prose-invert max-w-none">
              <p className="text-muted-foreground">
                We respect Do Not Track browser signals. If your browser sends a DNT signal, 
                we will automatically disable analytics and marketing cookies.
              </p>
              <p className="text-muted-foreground">
                Your current DNT status: <strong>{navigator.doNotTrack === '1' ? 'Enabled' : 'Not Enabled'}</strong>
              </p>
            </CardContent>
          </Card>

          {/* How to Control Cookies */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>How to Control Cookies in Your Browser</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                You can also control cookies through your browser settings. 
                Click the links below for instructions:
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                {[
                  { name: 'Google Chrome', url: 'https://support.google.com/chrome/answer/95647' },
                  { name: 'Mozilla Firefox', url: 'https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer' },
                  { name: 'Apple Safari', url: 'https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac' },
                  { name: 'Microsoft Edge', url: 'https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09' },
                ].map((browser) => (
                  <a
                    key={browser.name}
                    href={browser.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors"
                  >
                    <span className="text-foreground">{browser.name}</span>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Third-Party Cookies */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Third-Party Cookies</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm prose-invert max-w-none">
              <p className="text-muted-foreground">
                Some cookies are placed by third-party services that appear on our pages. 
                We don't control these cookies; they are governed by the privacy policies 
                of the respective third parties:
              </p>
              <ul className="text-muted-foreground">
                <li>
                  <strong>Stripe</strong> - Payment processing 
                  (<a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Privacy Policy</a>)
                </li>
                <li>
                  <strong>PostHog</strong> - Analytics 
                  (<a href="https://posthog.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Privacy Policy</a>)
                </li>
                <li>
                  <strong>Google</strong> - Maps integration 
                  (<a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Privacy Policy</a>)
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Updates */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Updates to This Policy</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm prose-invert max-w-none">
              <p className="text-muted-foreground">
                We may update this Cookie Policy from time to time. We will notify you of 
                any material changes by posting the new policy on this page and updating 
                the "Last updated" date.
              </p>
            </CardContent>
          </Card>

          {/* Contact */}
          <div className="text-center text-muted-foreground">
            <p className="mb-2">Questions about cookies?</p>
            <a href="mailto:privacy@muckaway.ai" className="text-primary hover:underline">
              privacy@muckaway.ai
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CookiePolicy;
