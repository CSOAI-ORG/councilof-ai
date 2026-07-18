import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { MapPin, CheckCircle, TrendingUp } from "lucide-react";

const socialProofMessages = [
  { type: 'quote', name: 'James', location: 'London', action: 'generated a quote for 15T of clay', time: '2 min ago' },
  { type: 'quote', name: 'Sarah', location: 'Birmingham', action: 'classified hazardous waste instantly', time: '5 min ago' },
  { type: 'signup', name: 'BuildCorp Ltd', location: 'Manchester', action: 'joined MuckAway.ai', time: '12 min ago' },
  { type: 'quote', name: 'Mike', location: 'Leeds', action: 'saved £2,400 on disposal', time: '18 min ago' },
  { type: 'classification', name: 'GreenBuild', location: 'Bristol', action: 'AI classified 50T mixed spoil', time: '25 min ago' },
  { type: 'signup', name: 'Elite Haulage', location: 'Glasgow', action: 'started free trial', time: '32 min ago' },
  { type: 'quote', name: 'Dave', location: 'Sheffield', action: 'booked same-day collection', time: '45 min ago' },
  { type: 'classification', name: 'CityWorks', location: 'Liverpool', action: 'uploaded weighbridge tickets', time: '1 hour ago' },
];

export const SocialProofToast = () => {
  const [currentMessage, setCurrentMessage] = useState<typeof socialProofMessages[0] | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    // Check if user has dismissed social proof this session
    const dismissed = sessionStorage.getItem('social-proof-dismissed');
    if (dismissed) return;

    // Initial delay before first toast
    const initialDelay = setTimeout(() => {
      showNextMessage();
    }, 8000);

    return () => clearTimeout(initialDelay);
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    // Hide toast after 5 seconds
    const hideTimeout = setTimeout(() => {
      setIsVisible(false);
    }, 5000);

    // Show next message after 20-40 seconds
    const nextTimeout = setTimeout(() => {
      showNextMessage();
    }, 25000 + Math.random() * 15000);

    return () => {
      clearTimeout(hideTimeout);
      clearTimeout(nextTimeout);
    };
  }, [isVisible, messageIndex]);

  const showNextMessage = () => {
    const dismissed = sessionStorage.getItem('social-proof-dismissed');
    if (dismissed) return;

    const nextIndex = messageIndex % socialProofMessages.length;
    setCurrentMessage(socialProofMessages[nextIndex]);
    setMessageIndex(nextIndex + 1);
    setIsVisible(true);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('social-proof-dismissed', 'true');
  };

  if (!isVisible || !currentMessage) return null;

  const getIcon = () => {
    switch (currentMessage.type) {
      case 'signup':
        return <TrendingUp className="w-4 h-4 text-primary" />;
      case 'classification':
        return <CheckCircle className="w-4 h-4 text-accent" />;
      default:
        return <CheckCircle className="w-4 h-4 text-primary" />;
    }
  };

  return (
    <div 
      className="fixed bottom-20 left-4 z-40 max-w-xs animate-slide-up cursor-pointer"
      onClick={handleDismiss}
    >
      <div className="bg-card border border-border rounded-lg shadow-xl p-4 backdrop-blur-lg">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-sm text-foreground truncate">
                {currentMessage.name}
              </span>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                <MapPin className="w-2.5 h-2.5 mr-0.5" />
                {currentMessage.location}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {currentMessage.action}
            </p>
            <p className="text-[10px] text-muted-foreground/70 mt-1">
              {currentMessage.time}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
