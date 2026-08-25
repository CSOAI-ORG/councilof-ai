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

/**
 * Lightweight OG / Twitter tags via the existing /api/og image helper.
 * Does not invent a full OG system — only title, description, and image URL.
 */
export function setOgMeta(opts: { title: string; description: string; path?: string }): void {
  const title = opts.title.slice(0, 90);
  const description = opts.description.slice(0, 160);
  const ogImage =
    `/api/og?title=${encodeURIComponent(title)}&desc=${encodeURIComponent(description.slice(0, 140))}`;
  const pairs: [string, string][] = [
    ["og:title", title],
    ["og:description", description],
    ["og:type", "website"],
    ["og:image", ogImage],
    ["twitter:card", "summary_large_image"],
    ["twitter:title", title],
    ["twitter:description", description],
    ["twitter:image", ogImage],
  ];
  if (opts.path) {
    pairs.push(["og:url", `https://councilof.ai${opts.path}`]);
  }
  for (const [property, content] of pairs) {
    let el = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute("property", property);
      document.head.appendChild(el);
    }
    el.content = content;
  }
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
