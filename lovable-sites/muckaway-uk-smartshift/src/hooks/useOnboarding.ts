import { useState, useEffect, useCallback } from "react";

const ONBOARDING_STORAGE_KEY = "muckaway_onboarding_completed";
const ONBOARDING_VERSION = "1.0";

interface OnboardingState {
  isCompleted: boolean;
  completedAt: string | null;
  version: string;
}

export const useOnboarding = () => {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isFirstVisit, setIsFirstVisit] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    
    if (!stored) {
      // First visit - show onboarding
      setIsFirstVisit(true);
      setShowOnboarding(true);
    } else {
      try {
        const state: OnboardingState = JSON.parse(stored);
        // Check if version matches - if not, might want to show again
        if (state.version !== ONBOARDING_VERSION) {
          setShowOnboarding(true);
        }
      } catch {
        // Invalid stored data, show onboarding
        setShowOnboarding(true);
      }
    }
  }, []);

  const completeOnboarding = useCallback(() => {
    const state: OnboardingState = {
      isCompleted: true,
      completedAt: new Date().toISOString(),
      version: ONBOARDING_VERSION
    };
    localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(state));
    setShowOnboarding(false);
    setIsFirstVisit(false);
  }, []);

  const skipOnboarding = useCallback(() => {
    const state: OnboardingState = {
      isCompleted: true,
      completedAt: new Date().toISOString(),
      version: ONBOARDING_VERSION
    };
    localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(state));
    setShowOnboarding(false);
    setIsFirstVisit(false);
  }, []);

  const restartOnboarding = useCallback(() => {
    setShowOnboarding(true);
  }, []);

  const closeOnboarding = useCallback(() => {
    setShowOnboarding(false);
  }, []);

  return {
    showOnboarding,
    isFirstVisit,
    completeOnboarding,
    skipOnboarding,
    restartOnboarding,
    closeOnboarding
  };
};
