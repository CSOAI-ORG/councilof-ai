/**
 * Accessibility helpers for keyboard navigation and focus management.
 */

let _id = 0;
export function generateUniqueId(prefix = "id"): string {
  _id += 1;
  return `${prefix}-${_id}`;
}

export interface SkipLink {
  id: string;
  label: string;
  targetId: string;
}

export function navigateToSkipTarget(target: string) {
  const element = document.getElementById(target);
  if (element) {
    element.focus();
    element.scrollIntoView({ behavior: "smooth" });
  }
}

export function handleArrowNavigation(
  event: React.KeyboardEvent,
  items: HTMLElement[],
  onSelect: (index: number) => void,
  vertical = true
) {
  if (items.length === 0) return;

  const currentIndex = items.findIndex((item) => item === document.activeElement);
  let nextIndex = currentIndex;

  if (vertical) {
    if (event.key === "ArrowDown") nextIndex = (currentIndex + 1) % items.length;
    if (event.key === "ArrowUp") nextIndex = (currentIndex - 1 + items.length) % items.length;
  } else {
    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % items.length;
    if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + items.length) % items.length;
  }

  if (nextIndex !== currentIndex) {
    event.preventDefault();
    items[nextIndex]?.focus();
    onSelect(nextIndex);
  }
}

export function handleKeyDown(
  event: React.KeyboardEvent,
  handlers: {
    onEnter?: () => void;
    onEscape?: () => void;
    onArrowUp?: () => void;
    onArrowDown?: () => void;
  }
) {
  switch (event.key) {
    case "Enter":
      handlers.onEnter?.();
      break;
    case "Escape":
      handlers.onEscape?.();
      break;
    case "ArrowUp":
      handlers.onArrowUp?.();
      break;
    case "ArrowDown":
      handlers.onArrowDown?.();
      break;
  }
}

export function focusableSelectors(): string {
  return 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
}

export function trapFocus(container: HTMLElement, event: KeyboardEvent) {
  if (event.key !== "Tab") return;

  const focusable = Array.from(container.querySelectorAll(focusableSelectors()));
  const first = focusable[0] as HTMLElement | undefined;
  const last = focusable[focusable.length - 1] as HTMLElement | undefined;

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last?.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first?.focus();
  }
}
