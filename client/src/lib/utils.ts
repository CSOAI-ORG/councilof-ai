import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * setMetaDescription — per-route <meta name="description">, prerender-visible.
 * (qa-sweep 2026-08-19) Every primary page set document.title but NOT the meta
 * description, so all prerendered routes shipped the identical shell fallback.
 * Call next to the document.title assignment inside the page's mount effect;
 * the prerenderer snapshots the DOM, so this becomes the route's static tag.
 */
export function setMetaDescription(content: string): void {
  let m = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
  if (!m) {
    m = document.createElement("meta");
    m.name = "description";
    document.head.appendChild(m);
  }
  m.content = content;
}

export function setPageMetadata({
  title,
  description,
  openGraphTitle = title,
  openGraphDescription = description,
  openGraphType = "website",
}: {
  title: string;
  description: string;
  openGraphTitle?: string;
  openGraphDescription?: string;
  openGraphType?: "website" | "article";
}): void {
  document.title = title;
  setMetaDescription(description);

  const setMeta = (selector: string, attribute: "name" | "property", key: string, content: string) => {
    let meta = document.querySelector(selector) as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute(attribute, key);
      document.head.appendChild(meta);
    }
    meta.content = content;
  };

  setMeta('meta[property="og:type"]', "property", "og:type", openGraphType);
  setMeta('meta[property="og:title"]', "property", "og:title", openGraphTitle);
  setMeta('meta[property="og:description"]', "property", "og:description", openGraphDescription);
  setMeta('meta[name="twitter:card"]', "name", "twitter:card", "summary");
  setMeta('meta[name="twitter:title"]', "name", "twitter:title", openGraphTitle);
  setMeta('meta[name="twitter:description"]', "name", "twitter:description", openGraphDescription);
}

export function formatCurrency(cents: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(cents / 100);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
}
