import { useLayoutEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { applyHead, resolveHead } from '@/lib/seoHead';

export default function NotFound() {
  const [path] = useLocation();
  useLayoutEffect(() => {
    const title = 'Page not found | Council of AI';
    const description = 'This address is unavailable. Return home or open Council OS to find a published page.';
    applyHead({ ...resolveHead(path), title, description, ogTitle: title, ogDescription: description });
    // Reuse the document's robots tag; appending a second one leaves the shell's directive first.
    let robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    const created = !robots;
    const previous = robots?.getAttribute('content');
    if (!robots) {
      robots = document.createElement('meta');
      robots.name = 'robots';
      document.head.append(robots);
    }
    robots.content = 'noindex,follow';
    return () => {
      if (created) robots?.remove();
      else if (previous === null) robots?.removeAttribute('content');
      else robots?.setAttribute('content', previous!);
    };
  }, [path]);
  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="text-center p-8 max-w-md">
        <div className="text-8xl font-bold text-muted-foreground mb-4">404</div>
        <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
        <p className="text-muted-foreground mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Button className="min-h-11" asChild><Link href="/">Return home</Link></Button>
          <Button className="min-h-11" variant="outline" asChild><Link href="/dashboard">Open Council OS</Link></Button>
        </div>
      </div>
    </div>
  );
}
