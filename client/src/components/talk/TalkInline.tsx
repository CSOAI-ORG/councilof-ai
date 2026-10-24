/** Inline Markdown from deterministic answers; React escapes every label and text segment. */
function safeLink(href: string): boolean {
  if (!/^https:\/\//i.test(href) || /[\\\u0000-\u0020\u007f-\u009f]/.test(href) || /%(?:5c|0[0-9a-f]|1[0-9a-f]|7f)/i.test(href)) return false;
  try {
    const url = new URL(href);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}

export default function TalkInline({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]\r\n]+\]\([^\)\r\n]+\)|\*\*[^*]+\*\*|`[^`]+`|\b_[^_]+_\b)/g).filter(Boolean);
  return (
    <>
      {parts.map((p, i) => {
        const link = p.match(/^\[([^\]\r\n]+)\]\(([^\)\r\n]+)\)$/);
        if (link && safeLink(link[2])) {
          return <a key={i} href={link[2]} className="underline underline-offset-2">{link[1]}</a>;
        }
        return p.startsWith("**") && p.endsWith("**") ? (
          <strong key={i}>{p.slice(2, -2)}</strong>
        ) : p.startsWith("`") && p.endsWith("`") ? (
          <code key={i} className="rounded bg-muted px-1 font-mono text-[0.85em] break-all">{p.slice(1, -1)}</code>
        ) : p.startsWith("_") && p.endsWith("_") && p.length > 2 ? (
          <em key={i}>{p.slice(1, -1)}</em>
        ) : (
          <span key={i}>{p}</span>
        );
      })}
    </>
  );
}
