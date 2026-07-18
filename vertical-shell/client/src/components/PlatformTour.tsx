/**
 * Interactive Platform Tour
 * Guided walkthrough for new users: Training → Certification → Job Board → Compliance
 */

import { useEffect } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

export function usePlatformTour() {
  useEffect(() => {
    // Check if user has seen the tour
    const hasSeenTour = localStorage.getItem("csoai_tour_completed");
    if (hasSeenTour) return;

    // Wait for page to load
    const timer = setTimeout(() => {
      startTour();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);
}

export function startTour() {
  const driverObj = driver({
    showProgress: true,
    showButtons: ["next", "previous", "close"],
    steps: [
      {
        popover: {
          title: "Welcome to CSOAI! 🎉",
          description: "Let's take a quick tour of the platform. You'll learn how to become a certified AI Safety Analyst and start earning.",
        },
      },
      {
        element: '[href="/training"]',
        popover: {
          title: "Step 1: Training",
          description: "Start with our comprehensive training modules. Learn AI safety principles, risk assessment, and compliance frameworks. All courses are 100% free.",
          side: "bottom",
          align: "start",
        },
      },
      {
        element: '[href="/certification"]',
        popover: {
          title: "Step 2: Certification",
          description: "After completing training, take the certification exam. Pass to become an official CSOAI Watchdog Analyst and join our global network.",
          side: "bottom",
          align: "start",
        },
      },
      {
        element: '[href="/jobs"]',
        popover: {
          title: "Step 3: Find Jobs",
          description: "Browse available AI Safety Analyst positions. Earn $45-150/hour working remotely. Apply directly through the platform with your certification.",
          side: "bottom",
          align: "start",
        },
      },
      {
        element: '[href="/watchdog"]',
        popover: {
          title: "Step 4: Monitor Compliance",
          description: "Use our Watchdog system to monitor AI systems for compliance. Submit reports, participate in the AI Council, and help keep AI safe for humanity.",
          side: "bottom",
          align: "start",
        },
      },
      {
        element: '[href="/get-started"]',
        popover: {
          title: "Ready to Start?",
          description: "Click 'Get Started' to begin your journey as an AI Safety Analyst. Join the movement protecting humanity from AI risks while building a rewarding career.",
          side: "left",
          align: "start",
        },
      },
    ],
    onDestroyStarted: () => {
      // Mark tour as completed
      localStorage.setItem("csoai_tour_completed", "true");
      driverObj.destroy();
    },
  });

  driverObj.drive();
}

// Custom styles for the tour
const tourStyles = `
  .driver-popover {
    background: white;
    color: #1f2937;
    border-radius: 12px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    max-width: 400px;
  }
  
  .driver-popover-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: #111827;
  }
  
  .driver-popover-description {
    font-size: 0.95rem;
    line-height: 1.6;
    color: #4b5563;
  }
  
  .driver-popover-next-btn,
  .driver-popover-prev-btn,
  .driver-popover-close-btn {
    background: #10b981;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
  }
  
  .driver-popover-next-btn:hover,
  .driver-popover-prev-btn:hover {
    background: #059669;
  }
  
  .driver-popover-close-btn {
    background: #6b7280;
  }
  
  .driver-popover-close-btn:hover {
    background: #4b5563;
  }
  
  .driver-popover-progress-text {
    color: #10b981;
    font-weight: 600;
  }
`;

// Inject styles
if (typeof document !== "undefined") {
  const styleEl = document.createElement("style");
  styleEl.textContent = tourStyles;
  document.head.appendChild(styleEl);
}

export default function PlatformTour() {
  usePlatformTour();
  return null;
}
