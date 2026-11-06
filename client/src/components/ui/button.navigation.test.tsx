// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './button';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
describe('link buttons', () => {
  it.each(['disabled', 'loading'] as const)('blocks nested child actions while %s and restores them when enabled', async state => {
    const host = document.createElement('div'); document.body.append(host); const root = createRoot(host);
    const activate = vi.fn((event: React.MouseEvent) => event.preventDefault());
    const show = (unavailable: boolean) => act(async () => root.render(<Button asChild {...{ [state]: unavailable }}><a href="/next" onClick={activate}>Open next page</a></Button>));
    try {
      await show(true); const link = host.querySelector('a')!;
      expect(link.getAttribute('aria-disabled')).toBe('true'); expect(link.tabIndex).toBe(-1);
      await act(async () => link.click()); expect(activate).not.toHaveBeenCalled();
      const key = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
      link.dispatchEvent(key); expect(key.defaultPrevented).toBe(true);
      await show(false); await act(async () => link.click()); expect(activate).toHaveBeenCalledOnce();
      expect(link.getAttribute('aria-disabled')).toBeNull();
      expect(host.querySelector('a button,button a')).toBeNull();
    } finally { await act(async () => root.unmount()); host.remove(); }
  });
});
