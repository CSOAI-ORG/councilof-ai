import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { X, ExternalLink } from "lucide-react";

const ecosystemSites = [
  { name: "MuckAway.ai", url: "https://muckaway.ai", current: true },
  { name: "GrabHire.ai", url: "https://grabhire.ai", current: false },
  { name: "PlantHire.ai", url: "https://planthire.ai", current: false },
];

export const EcosystemBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if already dismissed this session
    const dismissed = localStorage.getItem('ecosystem-banner-dismissed');
    if (dismissed) {
      setIsDismissed(true);
      return;
    }

    // Show after 3 seconds
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsVisible(false);
    localStorage.setItem('ecosystem-banner-dismissed', 'true');
  };

  if (isDismissed || !isVisible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] animate-slide-down">
      <div className="bg-gradient-to-r from-primary/90 via-accent/80 to-primary/90 text-primary-foreground">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <span className="text-xs font-medium">
              Part of the <a href="https://csoai.org" target="_blank" rel="noopener noreferrer" className="underline hover:no-underline font-bold">CSOAI</a> & <a href="https://loopfactory.ai" target="_blank" rel="noopener noreferrer" className="underline hover:no-underline font-bold">LoopFactory AI</a> Ecosystem:
            </span>
            <div className="flex items-center gap-2">
              {ecosystemSites.map((site, index) => (
                <span key={index}>
                  {site.current ? (
                    <Badge variant="secondary" className="text-xs bg-background/20 text-primary-foreground border-none">
                      {site.name}
                    </Badge>
                  ) : (
                    <a 
                      href={site.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs hover:underline"
                    >
                      {site.name}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {index < ecosystemSites.length - 1 && <span className="mx-1">•</span>}
                </span>
              ))}
            </div>
            <button
              onClick={handleDismiss}
              className="p-1 rounded hover:bg-background/20 transition-colors ml-2"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
