// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it } from 'vitest';
import NotFound from './NotFound';

it('uses the existing head tags for a missing page and restores robots when leaving it', async () => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  const original = document.head.innerHTML;
  document.title = 'Missing Slug | Council of AI';
  const robots = document.createElement('meta'); robots.name = 'robots'; robots.content = 'index,follow'; document.head.append(robots);
  const host = document.createElement('div'); document.body.append(host); const root = createRoot(host);
  try {
    await act(async () => root.render(<NotFound />));
    expect(document.title).toBe('Page not found | Council of AI');
    expect(document.querySelectorAll('title')).toHaveLength(1);
    expect(document.querySelectorAll('meta[name="robots"]')).toHaveLength(1);
    expect(robots.content).toBe('noindex,follow');
    expect(host.querySelector('a button,button a')).toBeNull();
    await act(async () => root.render(<p>Next page</p>));
    expect(robots.content).toBe('index,follow');
  } finally { await act(async () => root.unmount()); host.remove(); document.head.innerHTML = original; }
});
