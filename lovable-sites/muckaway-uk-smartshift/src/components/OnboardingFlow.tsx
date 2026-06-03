import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, ArrowRight, Sparkles, Shield, Zap, Users, Mic, Image, MessageSquare, Package } from "lucide-react";

interface OnboardingFlowProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

const OnboardingFlow = ({ isOpen, onClose, onComplete }: OnboardingFlowProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const navigate = useNavigate();

  const steps = [
    {
      title: "Welcome to MuckAway.ai",
      subtitle: "The UK's smartest waste management platform",
      icon: <Sparkles className="h-8 w-8 text-primary" />,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            You're about to experience the future of waste management. Our AI-powered platform makes complex waste operations simple, compliant, and profitable.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-sm">98.5% AI Accuracy</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-sm">Instant Compliance</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-sm">Real-time Tracking</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-sm">24/7 AI Support</span>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "AI-Powered Image Analysis",
      subtitle: "Upload photos, get instant waste classification",
      icon: <Image className="h-8 w-8 text-emerald-500" />,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Our Revolutionary Image Analyzer can identify soil types, contamination levels, and disposal requirements from photos. Upload up to 10 images for batch analysis.
          </p>
          <Card className="border-2 border-dashed border-primary/20">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">
                  <strong>Try it:</strong> Go to AI Tools → Image Analysis
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      ),
      navigateTo: "/ai-tools"
    },
    {
      title: "Voice AI Assistant",
      subtitle: "Speak naturally, book jobs hands-free",
      icon: <Mic className="h-8 w-8 text-blue-500" />,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Say "Create a job for 20 tonnes of excavated soil in Manchester" and watch our AI handle the rest. Perfect for operators in the field.
          </p>
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <Mic className="text-white h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">Voice Command Example</div>
                <div className="text-xs text-muted-foreground">
                  "Book collection for 15 tonnes of topsoil in Birmingham next Tuesday"
                </div>
              </div>
              <Badge variant="secondary">Recognized</Badge>
            </div>
          </div>
        </div>
      ),
      navigateTo: "/ai-tools"
    },
    {
      title: "Smart Chatbot",
      subtitle: "Get instant answers and generate quotes",
      icon: <MessageSquare className="h-8 w-8 text-purple-500" />,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Our AI chatbot remembers your conversation history and can help you with quotes, job status, compliance questions, and more.
          </p>
          <div className="space-y-2">
            <div className="bg-muted/30 rounded-lg p-3 text-sm">
              <strong>You:</strong> "What's the price for disposing 30 tonnes of clay?"
            </div>
            <div className="bg-primary/10 rounded-lg p-3 text-sm">
              <strong>AI:</strong> "Based on your location and current rates, disposing 30 tonnes of clay would cost approximately £450-£520..."
            </div>
          </div>
        </div>
      ),
      navigateTo: "/ai-tools"
    },
    {
      title: "Stock & Inventory Management",
      subtitle: "Track materials across all your depots",
      icon: <Package className="h-8 w-8 text-orange-500" />,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Manage your aggregates, recyclates, and waste materials across multiple depots. Track stock movements, generate purchase orders, and manage sales.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
              <div className="text-sm font-medium text-orange-800 dark:text-orange-200">Stock Levels</div>
              <div className="text-xs text-orange-600 dark:text-orange-400">Real-time tracking</div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <div className="text-sm font-medium text-blue-800 dark:text-blue-200">Multi-Depot</div>
              <div className="text-xs text-blue-600 dark:text-blue-400">Manage all yards</div>
            </div>
          </div>
        </div>
      ),
      navigateTo: "/stock"
    },
    {
      title: "UK Compliance Made Simple",
      subtitle: "Automated documentation and legal compliance",
      icon: <Shield className="h-8 w-8 text-red-500" />,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Never worry about compliance again. We automatically generate waste transfer notes, handle duty of care, and ensure Environment Agency requirements are met.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-3">
              <div className="text-sm font-medium text-green-800 dark:text-green-200">Waste Transfer Notes</div>
              <div className="text-xs text-green-600 dark:text-green-400">Auto-generated</div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <div className="text-sm font-medium text-blue-800 dark:text-blue-200">Hazardous Consignment</div>
              <div className="text-xs text-blue-600 dark:text-blue-400">Compliant</div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
              <div className="text-sm font-medium text-purple-800 dark:text-purple-200">Duty of Care</div>
              <div className="text-xs text-purple-600 dark:text-purple-400">Tracked</div>
            </div>
            <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
              <div className="text-sm font-medium text-orange-800 dark:text-orange-200">Environment Agency</div>
              <div className="text-xs text-orange-600 dark:text-orange-400">Approved</div>
            </div>
          </div>
        </div>
      ),
      navigateTo: "/hazardous"
    },
    {
      title: "Ready to Get Started?",
      subtitle: "Choose your first action",
      icon: <CheckCircle className="h-8 w-8 text-green-500" />,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            You're all set! Choose what you'd like to do first, and our AI will guide you through the process.
          </p>
          <div className="grid gap-3">
            <Button 
              variant="outline" 
              className="justify-start h-auto p-4"
              onClick={() => {
                onComplete?.();
                navigate("/ai-tools");
              }}
            >
              <div className="text-left">
                <div className="font-medium">Try AI Image Analysis</div>
                <div className="text-sm text-muted-foreground">Upload photos for instant spoil classification</div>
              </div>
            </Button>
            <Button 
              variant="outline" 
              className="justify-start h-auto p-4"
              onClick={() => {
                onComplete?.();
                navigate("/");
              }}
            >
              <div className="text-left">
                <div className="font-medium">Get an Instant Quote</div>
                <div className="text-sm text-muted-foreground">Use the homepage quote form</div>
              </div>
            </Button>
            <Button 
              variant="outline" 
              className="justify-start h-auto p-4"
              onClick={() => {
                onComplete?.();
                navigate("/stock");
              }}
            >
              <div className="text-left">
                <div className="font-medium">Manage Stock</div>
                <div className="text-sm text-muted-foreground">Set up your depots and materials</div>
              </div>
            </Button>
          </div>
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCompletedSteps([...completedSteps, currentStep]);
      setCurrentStep(currentStep + 1);
    } else {
      onComplete?.();
      onClose();
    }
  };

  const handleSkip = () => {
    onComplete?.();
    onClose();
  };

  const handleTryFeature = () => {
    const step = steps[currentStep];
    if (step.navigateTo) {
      onComplete?.();
      navigate(step.navigateTo);
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;
  const currentStepData = steps[currentStep];

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {currentStepData.icon}
              <div>
                <DialogTitle className="text-xl">{currentStepData.title}</DialogTitle>
                <DialogDescription>{currentStepData.subtitle}</DialogDescription>
              </div>
            </div>
            <Badge variant="secondary">
              Step {currentStep + 1} of {steps.length}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <Progress value={progress} className="w-full" />
          
          <div className="min-h-[300px]">
            {currentStepData.content}
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <Button variant="ghost" onClick={handleSkip}>
              Skip Tour
            </Button>
            <div className="flex items-center space-x-2">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(currentStep - 1)}
                >
                  Previous
                </Button>
              )}
              {currentStepData.navigateTo && currentStep < steps.length - 1 && (
                <Button variant="secondary" onClick={handleTryFeature}>
                  Try It Now
                </Button>
              )}
              <Button onClick={handleNext}>
                {currentStep === steps.length - 1 ? "Get Started" : "Next"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingFlow;