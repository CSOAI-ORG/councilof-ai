import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

const BackToTop: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 400) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <button
      className={`fixed bottom-8 right-8 z-50 bg-[hsl(var(--gts-yellow))] hover:bg-[hsl(51_95%_45%)] text-[hsl(var(--gts-dark))] p-3 rounded-full shadow-[var(--shadow-glow)] transition-all duration-300 transform ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'
      }`}
      onClick={scrollToTop}
      aria-label="Back to top"
      style={{ pointerEvents: isVisible ? 'auto' : 'none' }}
    >
      <ArrowUp className="w-5 h-5" />
    </button>
  );
};

export default BackToTop;