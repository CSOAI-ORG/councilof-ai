import { useEffect, useState } from "react";
import { Brain, Upload, Search, AlertTriangle, Calculator, FileCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface AIAnalysisLoadingStateProps {
  isAnalyzing: boolean;
}

const ANALYSIS_STEPS = [
  { id: 1, label: "Uploading image...", icon: Upload, duration: 800 },
  { id: 2, label: "Analyzing spoil composition...", icon: Brain, duration: 1200 },
  { id: 3, label: "Checking for contaminants...", icon: AlertTriangle, duration: 1000 },
  { id: 4, label: "Calculating disposal options...", icon: Calculator, duration: 800 },
  { id: 5, label: "Generating compliant quote...", icon: FileCheck, duration: 600 },
];

export const AIAnalysisLoadingState = ({ isAnalyzing }: AIAnalysisLoadingStateProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!isAnalyzing) {
      setCurrentStep(0);
      return;
    }

    let stepIndex = 0;
    const advanceStep = () => {
      if (stepIndex < ANALYSIS_STEPS.length - 1) {
        stepIndex++;
        setCurrentStep(stepIndex);
        setTimeout(advanceStep, ANALYSIS_STEPS[stepIndex].duration);
      }
    };

    setCurrentStep(0);
    setTimeout(advanceStep, ANALYSIS_STEPS[0].duration);

    return () => {
      stepIndex = ANALYSIS_STEPS.length;
    };
  }, [isAnalyzing]);

  if (!isAnalyzing) return null;

  return (
    <div className="bg-gradient-to-br from-primary/5 via-accent/5 to-primary/10 border border-primary/20 rounded-lg p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Brain className="w-6 h-6 text-primary animate-pulse" />
          <div className="absolute -inset-1 bg-primary/20 rounded-full animate-ping" />
        </div>
        <span className="text-lg font-semibold text-primary">AI Analysis in Progress</span>
      </div>

      <div className="space-y-3">
        {ANALYSIS_STEPS.map((step, index) => {
          const StepIcon = step.icon;
          const isActive = index === currentStep;
          const isComplete = index < currentStep;

          return (
            <div
              key={step.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg transition-all duration-300",
                isActive && "bg-primary/10 border border-primary/30",
                isComplete && "bg-accent/5 opacity-60",
                !isActive && !isComplete && "opacity-30"
              )}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
                  isActive && "bg-primary text-primary-foreground animate-pulse",
                  isComplete && "bg-accent/20 text-accent",
                  !isActive && !isComplete && "bg-muted text-muted-foreground"
                )}
              >
                <StepIcon className="w-4 h-4" />
              </div>
              <span
                className={cn(
                  "text-sm font-medium transition-colors duration-300",
                  isActive && "text-primary",
                  isComplete && "text-accent",
                  !isActive && !isComplete && "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
              {isActive && (
                <div className="ml-auto flex gap-1">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              )}
              {isComplete && (
                <div className="ml-auto">
                  <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center">
                    <svg className="w-3 h-3 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500 ease-out"
          style={{ width: `${((currentStep + 1) / ANALYSIS_STEPS.length) * 100}%` }}
        />
      </div>
    </div>
  );
};
