/**
 * Accessibility Enhancement Utilities
 * WCAG AA Compliant utilities for focus management, keyboard navigation,
 * ARIA labels, and color contrast checking.
 */

// ============================================================================
// Focus Trap Utilities
// ============================================================================

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
  ].join(', ');

  return Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors))
    .filter((el) => {
      // Filter out elements that are not visible
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });
}

/**
 * Create a focus trap within a container element
 * Returns cleanup function to remove the trap
 */
export function createFocusTrap(container: HTMLElement): () => void {
  const focusableElements = getFocusableElements(container);
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  // Store the element that had focus before the trap
  const previouslyFocused = document.activeElement as HTMLElement;

  // Focus the first element
  if (firstElement) {
    firstElement.focus();
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return;

    const currentFocusables = getFocusableElements(container);
    const first = currentFocusables[0];
    const last = currentFocusables[currentFocusables.length - 1];

    if (event.shiftKey) {
      // Shift + Tab: moving backward
      if (document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      }
    } else {
      // Tab: moving forward
      if (document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
  };

  container.addEventListener('keydown', handleKeyDown);

  // Return cleanup function
  return () => {
    container.removeEventListener('keydown', handleKeyDown);
    // Restore focus to previously focused element
    if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
      previouslyFocused.focus();
    }
  };
}

/**
 * React hook-compatible focus trap manager
 */
export interface FocusTrapManager {
  activate: () => void;
  deactivate: () => void;
  isActive: boolean;
}

export function createFocusTrapManager(container: HTMLElement | null): FocusTrapManager {
  let cleanup: (() => void) | null = null;
  let isActive = false;

  return {
    activate: () => {
      if (container && !isActive) {
        cleanup = createFocusTrap(container);
        isActive = true;
      }
    },
    deactivate: () => {
      if (cleanup) {
        cleanup();
        cleanup = null;
        isActive = false;
      }
    },
    get isActive() {
      return isActive;
    },
  };
}

// ============================================================================
// Skip Navigation Link Helpers
// ============================================================================

export interface SkipLink {
  id: string;
  label: string;
  targetId: string;
}

/**
 * Default skip navigation links
 */
export const defaultSkipLinks: SkipLink[] = [
  { id: 'skip-to-main', label: 'Skip to main content', targetId: 'main-content' },
  { id: 'skip-to-nav', label: 'Skip to navigation', targetId: 'navigation' },
];

/**
 * Navigate to a skip link target and focus it
 */
export function navigateToSkipTarget(targetId: string): void {
  const target = document.getElementById(targetId);
  if (target) {
    // Make element focusable if it's not already
    if (!target.hasAttribute('tabindex')) {
      target.setAttribute('tabindex', '-1');
    }
    target.focus();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/**
 * Create skip link styles (for visually hidden but focusable elements)
 */
export const skipLinkStyles = {
  // Visually hidden but accessible
  hidden: {
    position: 'absolute' as const,
    width: '1px',
    height: '1px',
    padding: '0',
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap' as const,
    border: '0',
  },
  // Visible on focus
  visible: {
    position: 'fixed' as const,
    top: '0',
    left: '0',
    zIndex: 9999,
    padding: '1rem',
    backgroundColor: '#1e293b',
    color: '#ffffff',
    textDecoration: 'none',
    fontWeight: 600,
    outline: '2px solid #3b82f6',
    outlineOffset: '2px',
  },
};

// ============================================================================
// ARIA Label Generators
// ============================================================================

/**
 * Generate ARIA label for navigation items
 */
export function generateNavLabel(itemName: string, isActive: boolean): string {
  return isActive ? `${itemName}, current page` : itemName;
}

/**
 * Generate ARIA label for expandable elements
 */
export function generateExpandableLabel(
  itemName: string,
  isExpanded: boolean,
  itemCount?: number
): string {
  const expandedState = isExpanded ? 'expanded' : 'collapsed';
  const countText = itemCount !== undefined ? `, ${itemCount} items` : '';
  return `${itemName}, ${expandedState}${countText}`;
}

/**
 * Generate ARIA label for progress indicators
 */
export function generateProgressLabel(
  current: number,
  total: number,
  context?: string
): string {
  const percentage = Math.round((current / total) * 100);
  const contextText = context ? ` for ${context}` : '';
  return `Progress${contextText}: ${current} of ${total} (${percentage}% complete)`;
}

/**
 * Generate ARIA label for toggle buttons
 */
export function generateToggleLabel(
  action: string,
  isActive: boolean
): string {
  return isActive ? `${action}, currently on` : `${action}, currently off`;
}

/**
 * Generate ARIA label for form fields with validation
 */
export function generateFieldLabel(
  fieldName: string,
  isRequired: boolean,
  errorMessage?: string
): string {
  let label = fieldName;
  if (isRequired) {
    label += ', required';
  }
  if (errorMessage) {
    label += `, ${errorMessage}`;
  }
  return label;
}

/**
 * Generate ARIA label for dialogs/modals
 */
export function generateDialogLabel(
  title: string,
  description?: string
): { labelledby: string; describedby?: string } {
  return {
    labelledby: `dialog-title-${title.toLowerCase().replace(/\s+/g, '-')}`,
    describedby: description
      ? `dialog-desc-${title.toLowerCase().replace(/\s+/g, '-')}`
      : undefined,
  };
}

/**
 * Generate ARIA live region announcements
 */
export function announceToScreenReader(
  message: string,
  politeness: 'polite' | 'assertive' = 'polite'
): void {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', politeness);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.style.cssText = `
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  `;

  document.body.appendChild(announcement);

  // Set the message after a brief delay to ensure screen readers pick it up
  setTimeout(() => {
    announcement.textContent = message;
  }, 100);

  // Remove the announcement after it's been read
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

// ============================================================================
// Keyboard Navigation Helpers
// ============================================================================

export type ArrowDirection = 'up' | 'down' | 'left' | 'right';

/**
 * Handle arrow key navigation within a list of elements
 */
export function handleArrowNavigation(
  event: KeyboardEvent,
  currentIndex: number,
  items: HTMLElement[],
  options: {
    orientation?: 'horizontal' | 'vertical' | 'both';
    loop?: boolean;
  } = {}
): number {
  const { orientation = 'vertical', loop = true } = options;
  const key = event.key;

  let newIndex = currentIndex;
  const isVertical = orientation === 'vertical' || orientation === 'both';
  const isHorizontal = orientation === 'horizontal' || orientation === 'both';

  if ((key === 'ArrowDown' && isVertical) || (key === 'ArrowRight' && isHorizontal)) {
    event.preventDefault();
    newIndex = currentIndex + 1;
    if (newIndex >= items.length) {
      newIndex = loop ? 0 : items.length - 1;
    }
  } else if ((key === 'ArrowUp' && isVertical) || (key === 'ArrowLeft' && isHorizontal)) {
    event.preventDefault();
    newIndex = currentIndex - 1;
    if (newIndex < 0) {
      newIndex = loop ? items.length - 1 : 0;
    }
  } else if (key === 'Home') {
    event.preventDefault();
    newIndex = 0;
  } else if (key === 'End') {
    event.preventDefault();
    newIndex = items.length - 1;
  }

  if (newIndex !== currentIndex && items[newIndex]) {
    items[newIndex].focus();
  }

  return newIndex;
}

/**
 * Create a roving tabindex manager for list navigation
 */
export function createRovingTabindex(
  container: HTMLElement,
  selector: string,
  options: { orientation?: 'horizontal' | 'vertical' } = {}
): () => void {
  const items = Array.from(container.querySelectorAll<HTMLElement>(selector));

  if (items.length === 0) return () => {};

  // Set initial tabindex values
  items.forEach((item, index) => {
    item.setAttribute('tabindex', index === 0 ? '0' : '-1');
  });

  let currentIndex = 0;

  const handleKeyDown = (event: KeyboardEvent) => {
    const target = event.target as HTMLElement;
    const itemIndex = items.indexOf(target);

    if (itemIndex === -1) return;

    const newIndex = handleArrowNavigation(event, itemIndex, items, {
      orientation: options.orientation,
      loop: true,
    });

    if (newIndex !== itemIndex) {
      items[itemIndex].setAttribute('tabindex', '-1');
      items[newIndex].setAttribute('tabindex', '0');
      currentIndex = newIndex;
    }
  };

  container.addEventListener('keydown', handleKeyDown);

  return () => {
    container.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Check if an element should respond to keyboard activation
 */
export function isActivationKey(event: KeyboardEvent): boolean {
  return event.key === 'Enter' || event.key === ' ';
}

/**
 * Handle keyboard activation (Enter/Space)
 */
export function handleKeyboardActivation(
  event: KeyboardEvent,
  callback: () => void
): void {
  if (isActivationKey(event)) {
    event.preventDefault();
    callback();
  }
}

// ============================================================================
// Color Contrast Checking Utilities
// ============================================================================

/**
 * Parse a color string to RGB values
 */
export function parseColor(color: string): { r: number; g: number; b: number } | null {
  // Handle hex colors
  const hexMatch = color.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (hexMatch) {
    return {
      r: parseInt(hexMatch[1], 16),
      g: parseInt(hexMatch[2], 16),
      b: parseInt(hexMatch[3], 16),
    };
  }

  // Handle short hex colors
  const shortHexMatch = color.match(/^#?([a-f\d])([a-f\d])([a-f\d])$/i);
  if (shortHexMatch) {
    return {
      r: parseInt(shortHexMatch[1] + shortHexMatch[1], 16),
      g: parseInt(shortHexMatch[2] + shortHexMatch[2], 16),
      b: parseInt(shortHexMatch[3] + shortHexMatch[3], 16),
    };
  }

  // Handle rgb/rgba colors
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1], 10),
      g: parseInt(rgbMatch[2], 10),
      b: parseInt(rgbMatch[3], 10),
    };
  }

  return null;
}

/**
 * Calculate relative luminance of a color (WCAG formula)
 */
export function getRelativeLuminance(r: number, g: number, b: number): number {
  const sRGB = [r, g, b].map((value) => {
    const normalized = value / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
}

/**
 * Calculate contrast ratio between two colors
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = parseColor(color1);
  const rgb2 = parseColor(color2);

  if (!rgb1 || !rgb2) {
    console.warn('Invalid color format');
    return 0;
  }

  const luminance1 = getRelativeLuminance(rgb1.r, rgb1.g, rgb1.b);
  const luminance2 = getRelativeLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(luminance1, luminance2);
  const darker = Math.min(luminance1, luminance2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if colors meet WCAG contrast requirements
 */
export interface ContrastResult {
  ratio: number;
  passesAA: boolean;
  passesAAA: boolean;
  passesAALarge: boolean;
  passesAAALarge: boolean;
}

export function checkContrast(
  foreground: string,
  background: string
): ContrastResult {
  const ratio = getContrastRatio(foreground, background);

  return {
    ratio: Math.round(ratio * 100) / 100,
    passesAA: ratio >= 4.5, // Normal text
    passesAAA: ratio >= 7, // Enhanced contrast
    passesAALarge: ratio >= 3, // Large text (18pt+)
    passesAAALarge: ratio >= 4.5, // Large text enhanced
  };
}

/**
 * Suggest accessible color alternatives
 */
export function suggestAccessibleColor(
  foreground: string,
  background: string,
  targetRatio: number = 4.5
): string | null {
  const fg = parseColor(foreground);
  const bg = parseColor(background);

  if (!fg || !bg) return null;

  const bgLuminance = getRelativeLuminance(bg.r, bg.g, bg.b);

  // Determine if we need a lighter or darker foreground
  const needsDarker = bgLuminance > 0.5;

  // Binary search for appropriate color
  let low = 0;
  let high = 255;
  let best = foreground;

  for (let i = 0; i < 8; i++) {
    const mid = Math.floor((low + high) / 2);
    const testColor = needsDarker
      ? `rgb(${mid}, ${mid}, ${mid})`
      : `rgb(${255 - mid}, ${255 - mid}, ${255 - mid})`;

    const ratio = getContrastRatio(testColor, background);

    if (ratio >= targetRatio) {
      best = testColor;
      if (needsDarker) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    } else {
      if (needsDarker) {
        high = mid - 1;
      } else {
        low = mid + 1;
      }
    }
  }

  return best;
}

// ============================================================================
// Additional Accessibility Helpers
// ============================================================================

/**
 * Generate unique IDs for accessibility relationships
 */
let idCounter = 0;
export function generateUniqueId(prefix: string = 'a11y'): string {
  return `${prefix}-${++idCounter}`;
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Check if user prefers high contrast
 */
export function prefersHighContrast(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-contrast: high)').matches;
}

/**
 * Check if user prefers dark color scheme
 */
export function prefersDarkMode(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Create visually hidden text for screen readers
 */
export const visuallyHiddenStyles = {
  position: 'absolute' as const,
  width: '1px',
  height: '1px',
  padding: '0',
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap' as const,
  border: '0',
};

/**
 * Focus visible utility class names
 */
export const focusVisibleStyles = {
  ring: 'focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 focus-visible:outline-none',
  outline: 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500',
};
