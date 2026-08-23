import { useEffect } from "react";

/**
 * AgUiBridge — the seamless AG UI, embedded from the estate static surface.
 *
 * The AG UI lives on csoai-site.pages.dev/ag-ui (an independently deployable static
 * bundle — 15 side-menu tabs, chat-per-axis, tool windows). It has no X-Frame-Options /
 * CSP frame-ancestors restriction, so we render it full-height in an iframe here so the
 * whole councilof.ai experience stays on one domain and one URL (/ag-ui).
 *
 * Doctrine: the AG UI is measurement, not certification. The bridge itself adds no claim.
 */
export default function AgUiBridge() {
  const SRC = "https://csoai-site.pages.dev/ag-ui";

  // Keep the document title honest and scoped, and pop it back on leave.
  useEffect(() => {
    document.title = "AG UI — Council of AI";
    return () => {
      document.title = "Council of AI — we measure, we sign, we re-attest";
    };
  }, []);

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full bg-[#0b1020]">
      <div className="w-full">
        <iframe
          src={SRC}
          title="Council of AI — AG UI"
          className="block h-[calc(100vh-6rem)] w-full border-0"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </div>
  );
}
