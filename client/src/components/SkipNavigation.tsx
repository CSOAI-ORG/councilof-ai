/**
 * SkipNavigation Component
 * Provides accessible skip links for keyboard users to bypass repetitive content.
 * Links are visually hidden until focused, meeting WCAG 2.1 Success Criterion 2.4.1.
 */

import { useState, useCallback } from 'react';
import { navigateToSkipTarget, type SkipLink } from '@/lib/accessibility';

interface SkipNavigationProps {
  /**
   * Custom skip links (defaults to main content and navigation)
   */
  links?: SkipLink[];
  /**
   * Additional CSS class for the container
   */
  className?: string;
}

const defaultLinks: SkipLink[] = [
  { id: 'skip-to-main', label: 'Skip to main content', targetId: 'main-content' },
  { id: 'skip-to-nav', label: 'Skip to navigation', targetId: 'navigation' },
];

export function SkipNavigation({ links = defaultLinks, className = '' }: SkipNavigationProps) {
  const [focusedLinkId, setFocusedLinkId] = useState<string | null>(null);

  const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    navigateToSkipTarget(targetId);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLAnchorElement>, targetId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigateToSkipTarget(targetId);
    }
  }, []);

  return (
    <div
      className={`skip-navigation ${className}`}
      role="navigation"
      aria-label="Skip links"
    >
      {links.map((link) => (
        <a
          key={link.id}
          id={link.id}
          href={`#${link.targetId}`}
          onClick={(e) => handleClick(e, link.targetId)}
          onKeyDown={(e) => handleKeyDown(e, link.targetId)}
          onFocus={() => setFocusedLinkId(link.id)}
          onBlur={() => setFocusedLinkId(null)}
          className={`
            skip-link
            ${focusedLinkId === link.id ? 'skip-link--visible' : 'skip-link--hidden'}
          `}
          style={focusedLinkId === link.id ? visibleStyles : hiddenStyles}
        >
          {link.label}
        </a>
      ))}
      <style>{skipNavigationCSS}</style>
    </div>
  );
}

// Inline styles for SSR compatibility
const hiddenStyles: React.CSSProperties = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

const visibleStyles: React.CSSProperties = {
  position: 'fixed',
  top: '0.5rem',
  left: '0.5rem',
  zIndex: 9999,
  padding: '0.75rem 1.25rem',
  backgroundColor: '#1e293b',
  color: '#ffffff',
  textDecoration: 'none',
  fontWeight: 600,
  fontSize: '0.875rem',
  borderRadius: '0.375rem',
  outline: '2px solid #3b82f6',
  outlineOffset: '2px',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  width: 'auto',
  height: 'auto',
  clip: 'auto',
  overflow: 'visible',
  margin: 0,
};

// CSS for hover and transition effects
const skipNavigationCSS = `
  .skip-link {
    transition: transform 0.15s ease-out, opacity 0.15s ease-out;
  }

  .skip-link:hover {
    background-color: #334155;
  }

  .skip-link:active {
    transform: scale(0.98);
  }

  .skip-link--visible {
    animation: skipLinkFadeIn 0.15s ease-out;
  }

  @keyframes skipLinkFadeIn {
    from {
      opacity: 0;
      transform: translateY(-0.5rem);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Respect reduced motion preferences */
  @media (prefers-reduced-motion: reduce) {
    .skip-link {
      transition: none;
    }

    .skip-link--visible {
      animation: none;
    }
  }
`;

export default SkipNavigation;
