"use client";

import { usePathname } from 'next/navigation';
import { Navigation } from './components/Navigation';

export function LayoutWrapper({ children, footer }: { children: React.ReactNode, footer: React.ReactNode }) {
  const pathname = usePathname();
  const isAppRoute = pathname === '/os' || pathname === '/ag-ui' || pathname === '/chat';

  if (isAppRoute) {
    return <main className="flex-1">{children}</main>;
  }

  return (
    <>
      <Navigation />
      <main className="flex-1">{children}</main>
      {footer}
    </>
  );
}
