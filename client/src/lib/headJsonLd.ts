import { useEffect } from "react";

/**
 * Put one JSON-LD node in <head> for as long as the calling page is mounted.
 *
 * WHY HEAD, NOT BODY. A node rendered inside the page body is captured by the prerender too, but
 * it sits after the whole page markup, and a node a page renders conditionally can be missing from
 * the snapshot if its condition is still pending when the snapshot is taken. This runs on first
 * mount from values the page knows synchronously (its route), so the prerendered <head> carries it.
 *
 * NO DUPLICATES. The site mounts with createRoot over the prerendered HTML, so on a real visit the
 * snapshot's copy is already in <head>. A script with the same `data-page-schema` kind and the same
 * text is adopted rather than doubled; a different one of the same kind is replaced. On unmount the
 * node is removed, so a client-side navigation never carries it to the next page.
 */
export function useHeadJsonLd(kind: string, node: object | null): void {
  const text = node ? JSON.stringify(node).replace(/</g, "\\u003c") : null;
  useEffect(() => {
    if (!text || typeof document === "undefined") return;
    const sel = `script[type="application/ld+json"][data-page-schema="${kind}"]`;
    let sc = Array.from(document.head.querySelectorAll<HTMLScriptElement>(sel)).find((s) => s.text === text) ?? null;
    for (const other of Array.from(document.head.querySelectorAll<HTMLScriptElement>(sel))) {
      if (other !== sc) other.remove();
    }
    if (!sc) {
      sc = document.createElement("script");
      sc.type = "application/ld+json";
      sc.setAttribute("data-page-schema", kind);
      sc.text = text;
      document.head.appendChild(sc);
    }
    const mine = sc;
    return () => { mine.remove(); };
  }, [kind, text]);
}
