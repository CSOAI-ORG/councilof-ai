import { Link } from "wouter";
import type { AnchorHTMLAttributes, ReactNode } from "react";

/**
 * AxisLink — the one element that may carry an axisHref()/axisRoute() value.
 *
 * WHY THIS EXISTS. axisHref() partitions the board into two kinds of page:
 *
 *   - `/gspc/<axis>/` — a route of this single-page app (App.tsx), prerendered
 *     for the model-comparison axes. A router <Link> is the right element.
 *   - `/axis/<axis>/` — NOT a route of this app. It is a standalone HTML
 *     document written by scripts/surface/build-axis-pages.mjs into
 *     public/axis/<axis>.html, with no app bundle in it.
 *
 * A router <Link> to `/axis/<axis>/` never asks the server for that document:
 * wouter intercepts the click, pushes the path, and the app's catch-all route
 * renders its own "Page Not Found". Measured on 2026-11-13 at both 390 and
 * 1440 px: every one of the 18 fact and subject rows on /board/ did exactly
 * that, while a direct load of the same URL answered 200. Eight other surfaces
 * already rendered a plain <a>; the four that used <Link> were the ones that
 * broke. This component makes the choice once, from the href, so a row cannot
 * get it wrong again.
 *
 * null/undefined href renders an anchor with no href: an owner-gated axis has
 * no public page and must not link (see axisHref).
 */

type AxisLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href?: string | null;
  children?: ReactNode;
};

/** True when the href names a published static axis document outside the app. */
export function isStaticAxisHref(href: string | null | undefined): boolean {
  return typeof href === "string" && /^\/axis\//.test(href);
}

export default function AxisLink({ href, children, ...rest }: AxisLinkProps) {
  if (!href) return <a {...rest}>{children}</a>;
  if (isStaticAxisHref(href)) {
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} {...rest}>
      {children}
    </Link>
  );
}
