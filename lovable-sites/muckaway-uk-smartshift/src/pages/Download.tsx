import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Download as DownloadIcon, 
  Smartphone, 
  Monitor, 
  Apple, 
  Chrome,
  WifiOff,
  Bell,
  Zap,
  RefreshCw,
  Check,
  Globe,
  Share2,
  MoreVertical,
  Plus,
  Menu
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type Platform = 'macos' | 'windows' | 'ios' | 'android' | 'unknown';
type Browser = 'chrome' | 'safari' | 'edge' | 'firefox' | 'samsung' | 'other';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DownloadPage = () => {
  const [platform, setPlatform] = useState<Platform>('unknown');
  const [browser, setBrowser] = useState<Browser>('other');
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setPlatform('ios');
    } else if (/android/.test(userAgent)) {
      setPlatform('android');
    } else if (/macintosh|mac os x/.test(userAgent)) {
      setPlatform('macos');
    } else if (/windows/.test(userAgent)) {
      setPlatform('windows');
    }

    // Detect browser
    if (/edg/.test(userAgent)) {
      setBrowser('edge');
    } else if (/chrome/.test(userAgent) && !/edg/.test(userAgent)) {
      setBrowser('chrome');
    } else if (/safari/.test(userAgent) && !/chrome/.test(userAgent)) {
      setBrowser('safari');
    } else if (/firefox/.test(userAgent)) {
      setBrowser('firefox');
    } else if (/samsungbrowser/.test(userAgent)) {
      setBrowser('samsung');
    }

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    }
  };

  const getPlatformTab = (): string => {
    switch (platform) {
      case 'macos': return 'macos';
      case 'windows': return 'windows';
      case 'ios': return 'ios';
      case 'android': return 'android';
      default: return 'windows';
    }
  };

  const benefits = [
    { icon: WifiOff, title: "Works Offline", description: "Access your data even without internet connection" },
    { icon: Bell, title: "Push Notifications", description: "Get real-time alerts for jobs, compliance, and updates" },
    { icon: Zap, title: "Instant Launch", description: "Open directly from your home screen or dock" },
    { icon: RefreshCw, title: "Auto Updates", description: "Always get the latest features automatically" },
  ];

  const faqItems = [
    {
      question: "Is this a real app?",
      answer: "Yes! MuckAway.ai is a Progressive Web App (PWA), which means it works just like a native app on your device. It appears on your home screen, works offline, and provides push notifications."
    },
    {
      question: "Does it work offline?",
      answer: "Yes, the app caches essential data so you can view your dashboard, jobs, and reports even without internet. Any changes made offline will sync when you're back online."
    },
    {
      question: "Is it safe to install?",
      answer: "Absolutely. PWAs are installed directly from your browser and don't require app store downloads. They run in a secure sandbox and can't access sensitive device data without your permission."
    },
    {
      question: "Can I uninstall it?",
      answer: "Yes, you can uninstall it just like any other app. On Windows, use Add/Remove Programs. On Mac, drag from Applications to Trash. On mobile, long-press the icon and select Uninstall/Delete."
    },
    {
      question: "Why not a native app from the App Store?",
      answer: "PWAs offer the same experience as native apps but are faster to update, don't require store approval, and work across all platforms. You get the best experience without the hassle."
    },
  ];

  return (
    <>
      <Helmet>
        <title>Download MuckAway.ai App | Install on Desktop & Mobile</title>
        <meta name="description" content="Download MuckAway.ai app for Windows, Mac, iPhone, iPad, and Android. Get offline access, push notifications, and a native app experience." />
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        
        <main className="flex-1">
          {/* Hero Section */}
          <section className="py-16 md:py-24 bg-gradient-to-b from-primary/5 to-background">
            <div className="container mx-auto px-4">
              <div className="max-w-3xl mx-auto text-center">
                <Badge variant="outline" className="mb-4">
                  <DownloadIcon className="w-3 h-3 mr-1" />
                  Free Download
                </Badge>
                <h1 className="text-4xl md:text-5xl font-bold mb-6">
                  Download <span className="text-primary">MuckAway.ai</span>
                </h1>
                <p className="text-xl text-muted-foreground mb-8">
                  Install our app for the best experience on any device. Works on Mac, Windows, iPhone, iPad, and Android.
                </p>

                {isInstalled ? (
                  <div className="flex items-center justify-center gap-2 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <Check className="w-5 h-5 text-green-500" />
                    <span className="text-green-500 font-medium">MuckAway.ai is already installed on this device!</span>
                  </div>
                ) : deferredPrompt ? (
                  <Button size="lg" onClick={handleInstallClick} className="gap-2">
                    <DownloadIcon className="w-5 h-5" />
                    Install Now - One Click
                  </Button>
                ) : (
                  <p className="text-muted-foreground">
                    Follow the instructions below for your device
                  </p>
                )}

                {platform !== 'unknown' && (
                  <p className="mt-4 text-sm text-muted-foreground">
                    Detected: <span className="font-medium text-foreground">{platform.toUpperCase()}</span> • <span className="font-medium text-foreground">{browser.charAt(0).toUpperCase() + browser.slice(1)}</span>
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Installation Instructions */}
          <section className="py-16">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold text-center mb-8">Installation Instructions</h2>
                
                <Tabs defaultValue={getPlatformTab()} className="w-full">
                  <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full mb-8">
                    <TabsTrigger value="macos" className="gap-2">
                      <Apple className="w-4 h-4" />
                      <span className="hidden sm:inline">macOS</span>
                      <span className="sm:hidden">Mac</span>
                    </TabsTrigger>
                    <TabsTrigger value="windows" className="gap-2">
                      <Monitor className="w-4 h-4" />
                      Windows
                    </TabsTrigger>
                    <TabsTrigger value="ios" className="gap-2">
                      <Smartphone className="w-4 h-4" />
                      <span className="hidden sm:inline">iPhone/iPad</span>
                      <span className="sm:hidden">iOS</span>
                    </TabsTrigger>
                    <TabsTrigger value="android" className="gap-2">
                      <Smartphone className="w-4 h-4" />
                      Android
                    </TabsTrigger>
                  </TabsList>

                  {/* macOS Instructions */}
                  <TabsContent value="macos">
                    <div className="space-y-6">
                      <Card>
                        <CardHeader>
                          <div className="flex items-center gap-2">
                            <Chrome className="w-5 h-5 text-primary" />
                            <CardTitle className="text-lg">Google Chrome (Recommended)</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">1</div>
                            <div>
                              <p className="font-medium">Click the install icon in the address bar</p>
                              <p className="text-sm text-muted-foreground">Look for the <Plus className="w-4 h-4 inline" /> icon on the right side of the URL bar</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">2</div>
                            <div>
                              <p className="font-medium">Or click the three-dot menu <MoreVertical className="w-4 h-4 inline" /></p>
                              <p className="text-sm text-muted-foreground">Select "Cast, save, and share" → "Install MuckAway.ai..."</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">3</div>
                            <div>
                              <p className="font-medium">Click "Install" in the popup</p>
                              <p className="text-sm text-muted-foreground">The app will be added to your Applications folder and Dock</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <div className="flex items-center gap-2">
                            <Globe className="w-5 h-5 text-muted-foreground" />
                            <CardTitle className="text-lg">Microsoft Edge</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">1</div>
                            <div>
                              <p className="font-medium">Click the three-dot menu <MoreVertical className="w-4 h-4 inline" /></p>
                              <p className="text-sm text-muted-foreground">Located in the top-right corner of the browser</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">2</div>
                            <div>
                              <p className="font-medium">Navigate to "Apps" → "Install this site as an app"</p>
                              <p className="text-sm text-muted-foreground">Confirm the installation in the popup</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-dashed">
                        <CardHeader>
                          <div className="flex items-center gap-2">
                            <Globe className="w-5 h-5 text-muted-foreground" />
                            <CardTitle className="text-lg text-muted-foreground">Safari</CardTitle>
                          </div>
                          <CardDescription>
                            Safari on macOS has limited PWA support. For the best experience, we recommend using Chrome or Edge.
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* Windows Instructions */}
                  <TabsContent value="windows">
                    <div className="space-y-6">
                      <Card>
                        <CardHeader>
                          <div className="flex items-center gap-2">
                            <Chrome className="w-5 h-5 text-primary" />
                            <CardTitle className="text-lg">Google Chrome (Recommended)</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">1</div>
                            <div>
                              <p className="font-medium">Click the install icon in the address bar</p>
                              <p className="text-sm text-muted-foreground">Look for the computer with download arrow icon on the right side of the URL bar</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">2</div>
                            <div>
                              <p className="font-medium">Or click the three-dot menu <MoreVertical className="w-4 h-4 inline" /></p>
                              <p className="text-sm text-muted-foreground">Select "Cast, save, and share" → "Install MuckAway.ai..."</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">3</div>
                            <div>
                              <p className="font-medium">Click "Install" in the popup</p>
                              <p className="text-sm text-muted-foreground">The app will be added to your Start Menu and can be pinned to taskbar</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <div className="flex items-center gap-2">
                            <Globe className="w-5 h-5 text-primary" />
                            <CardTitle className="text-lg">Microsoft Edge (Native Support)</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">1</div>
                            <div>
                              <p className="font-medium">Click the three-dot menu <MoreVertical className="w-4 h-4 inline" /></p>
                              <p className="text-sm text-muted-foreground">Located in the top-right corner of the browser</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">2</div>
                            <div>
                              <p className="font-medium">Navigate to "Apps" → "Install this site as an app"</p>
                              <p className="text-sm text-muted-foreground">Edge offers excellent PWA support on Windows</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">3</div>
                            <div>
                              <p className="font-medium">Click "Install" to confirm</p>
                              <p className="text-sm text-muted-foreground">The app integrates fully with Windows, including taskbar and Start Menu</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-dashed">
                        <CardHeader>
                          <div className="flex items-center gap-2">
                            <Globe className="w-5 h-5 text-muted-foreground" />
                            <CardTitle className="text-lg text-muted-foreground">Firefox</CardTitle>
                          </div>
                          <CardDescription>
                            Firefox doesn't support PWA installation natively. Please use Chrome or Edge for the best experience.
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* iOS Instructions */}
                  <TabsContent value="ios">
                    <div className="space-y-6">
                      <Card>
                        <CardHeader>
                          <div className="flex items-center gap-2">
                            <Globe className="w-5 h-5 text-primary" />
                            <CardTitle className="text-lg">Safari (Required for iOS)</CardTitle>
                          </div>
                          <CardDescription>
                            On iPhone and iPad, you must use Safari to install web apps. Other browsers like Chrome on iOS cannot install PWAs.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">1</div>
                            <div>
                              <p className="font-medium">Open this page in Safari</p>
                              <p className="text-sm text-muted-foreground">If you're using another browser, copy the URL and paste it in Safari</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">2</div>
                            <div>
                              <p className="font-medium">Tap the Share button <Share2 className="w-4 h-4 inline" /></p>
                              <p className="text-sm text-muted-foreground">Located at the bottom of Safari (iPhone) or top (iPad)</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">3</div>
                            <div>
                              <p className="font-medium">Scroll down and tap "Add to Home Screen"</p>
                              <p className="text-sm text-muted-foreground">You may need to scroll down in the share menu to find this option</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">4</div>
                            <div>
                              <p className="font-medium">Tap "Add" in the top-right corner</p>
                              <p className="text-sm text-muted-foreground">The MuckAway.ai icon will appear on your Home Screen</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                        <p className="text-sm text-amber-600 dark:text-amber-400">
                          <strong>Tip:</strong> Make sure you're on the latest iOS version for the best PWA experience. iOS 16.4+ includes improved push notification support for web apps.
                        </p>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Android Instructions */}
                  <TabsContent value="android">
                    <div className="space-y-6">
                      <Card>
                        <CardHeader>
                          <div className="flex items-center gap-2">
                            <Chrome className="w-5 h-5 text-primary" />
                            <CardTitle className="text-lg">Google Chrome (Recommended)</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">1</div>
                            <div>
                              <p className="font-medium">Tap the three-dot menu <MoreVertical className="w-4 h-4 inline" /></p>
                              <p className="text-sm text-muted-foreground">Located in the top-right corner of Chrome</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">2</div>
                            <div>
                              <p className="font-medium">Tap "Install app" or "Add to Home Screen"</p>
                              <p className="text-sm text-muted-foreground">The option may vary slightly depending on your Chrome version</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">3</div>
                            <div>
                              <p className="font-medium">Tap "Install" to confirm</p>
                              <p className="text-sm text-muted-foreground">The app icon will appear on your Home Screen and in your app drawer</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <div className="flex items-center gap-2">
                            <Globe className="w-5 h-5" />
                            <CardTitle className="text-lg">Samsung Internet</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">1</div>
                            <div>
                              <p className="font-medium">Tap the menu button <Menu className="w-4 h-4 inline" /></p>
                              <p className="text-sm text-muted-foreground">Usually three horizontal lines at the bottom</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">2</div>
                            <div>
                              <p className="font-medium">Tap "Add page to" → "Home screen"</p>
                              <p className="text-sm text-muted-foreground">Samsung Internet fully supports PWA installation</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <div className="flex items-center gap-2">
                            <Globe className="w-5 h-5" />
                            <CardTitle className="text-lg">Microsoft Edge</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">1</div>
                            <div>
                              <p className="font-medium">Tap the three-dot menu <MoreVertical className="w-4 h-4 inline" /></p>
                              <p className="text-sm text-muted-foreground">Located at the bottom of the screen</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">2</div>
                            <div>
                              <p className="font-medium">Tap "Add to phone"</p>
                              <p className="text-sm text-muted-foreground">The app will be installed with full PWA capabilities</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </section>

          {/* Benefits Section */}
          <section className="py-16 bg-muted/30">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold text-center mb-8">Why Install the App?</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {benefits.map((benefit) => (
                    <Card key={benefit.title}>
                      <CardContent className="flex items-start gap-4 p-6">
                        <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <benefit.icon className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1">{benefit.title}</h3>
                          <p className="text-sm text-muted-foreground">{benefit.description}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="py-16">
            <div className="container mx-auto px-4">
              <div className="max-w-2xl mx-auto">
                <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
                <Accordion type="single" collapsible className="w-full">
                  {faqItems.map((item, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-left">{item.question}</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-16 bg-gradient-to-b from-primary/5 to-background">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
              <p className="text-muted-foreground mb-6">
                Install MuckAway.ai now and take your waste management to the next level.
              </p>
              {deferredPrompt && !isInstalled && (
                <Button size="lg" onClick={handleInstallClick} className="gap-2">
                  <DownloadIcon className="w-5 h-5" />
                  Install Now
                </Button>
              )}
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default DownloadPage;
