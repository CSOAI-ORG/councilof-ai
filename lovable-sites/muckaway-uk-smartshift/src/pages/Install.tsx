import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Smartphone, CheckCircle, Globe, Zap, Wifi } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function Install() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);

    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(ios);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      toast({
        title: "Installation not available",
        description: "Your browser doesn't support app installation or the app is already installed.",
        variant: "destructive",
      });
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      toast({
        title: "Installation successful!",
        description: "MuckAway.ai has been installed to your device",
      });
    }

    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
              Install MuckAway.ai
            </h1>
            <p className="text-xl text-muted-foreground">
              Get the full app experience with offline support and native performance
            </p>
          </div>

          {isStandalone ? (
            <Card className="border-primary/20 shadow-glow">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-4 rounded-full bg-primary/10 w-fit">
                  <CheckCircle className="w-12 h-12 text-primary" />
                </div>
                <CardTitle className="text-2xl">App Already Installed!</CardTitle>
                <CardDescription>
                  You're currently using the installed version of MuckAway.ai
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <>
              <Card className="border-primary/20 shadow-glow mb-8">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">Installation Instructions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {isIOS ? (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">For iPhone/iPad:</h3>
                      <ol className="space-y-3 list-decimal list-inside text-muted-foreground">
                        <li>Tap the <strong>Share</strong> button (square with arrow) at the bottom of Safari</li>
                        <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
                        <li>Tap <strong>"Add"</strong> in the top right corner</li>
                        <li>The MuckAway.ai app will appear on your home screen</li>
                      </ol>
                    </div>
                  ) : deferredPrompt ? (
                    <div className="text-center">
                      <Button
                        size="lg"
                        onClick={handleInstallClick}
                        className="w-full md:w-auto"
                      >
                        <Download className="w-5 h-5 mr-2" />
                        Install MuckAway.ai Now
                      </Button>
                      <p className="text-sm text-muted-foreground mt-4">
                        Click the button above to install the app to your device
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">For Android/Chrome:</h3>
                      <ol className="space-y-3 list-decimal list-inside text-muted-foreground">
                        <li>Tap the <strong>menu</strong> (three dots) in the top right</li>
                        <li>Tap <strong>"Install app"</strong> or <strong>"Add to Home Screen"</strong></li>
                        <li>Tap <strong>"Install"</strong> to confirm</li>
                        <li>The MuckAway.ai app will appear on your home screen</li>
                      </ol>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <div className="p-3 rounded-full bg-primary/10 w-fit mb-2">
                      <Zap className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">Instant Access</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Launch directly from your home screen like a native app
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="p-3 rounded-full bg-primary/10 w-fit mb-2">
                      <Wifi className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">Offline Support</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Access key features even without an internet connection
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="p-3 rounded-full bg-primary/10 w-fit mb-2">
                      <Smartphone className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">Native Feel</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Enjoy a smooth, app-like experience with push notifications
                    </p>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
