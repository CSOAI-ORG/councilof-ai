(() => {
  try {
    const embedded =
      window.self !== window.top ||
      new URLSearchParams(window.location.search).get("embed") === "1";
    if (embedded) {
      document.documentElement.setAttribute("data-council-embed", "1");
      const style = document.createElement("style");
      style.id = "council-embed-chrome";
      style.textContent = `
        html[data-council-embed="1"] body > header.site-header,
        html[data-council-embed="1"] body > footer.site-footer {
          display: none !important;
        }
      `;
      document.head.appendChild(style);
      return;
    }
    const workspaceRoute = /^\/(?:dashboard|os)(?:\/|$)/.test(window.location.pathname);
    if (workspaceRoute) return;
    if (document.getElementById("council-workspace-launcher")) return;

    const host = document.createElement("div");
    host.id = "council-workspace-launcher";
    const root = host.attachShadow({ mode: "open" });
    const context = `${window.location.pathname}${window.location.search}`;
    const href = `/dashboard/?${new URLSearchParams({ tab: "home", ctx: context }).toString()}`;
    root.innerHTML = `
      <style>
        :host { all: initial; }
        a {
          align-items: center; background: #04624a; border: 1px solid rgba(167,243,208,.3);
          border-radius: 999px; bottom: 20px; box-shadow: 0 12px 32px rgba(4,18,12,.25);
          color: #fff; display: inline-flex; font: 600 12px/1 system-ui,-apple-system,sans-serif;
          gap: 8px; min-height: 48px; padding: 0 14px; position: fixed; right: 20px;
          text-decoration: none; transition: background-color .15s ease, transform .15s ease;
          z-index: 2147483000;
        }
        a:hover { background: #034d3b; transform: translateY(-1px); }
        a:focus-visible { outline: 3px solid #10b981; outline-offset: 3px; }
        img { border-radius: 6px; height: 24px; width: 24px; }
        @media (max-width: 639px) { a { padding: 0; width: 48px; justify-content: center; } span { display: none; } }
        @media (prefers-reduced-motion: reduce) { a { transition: none; } }
        @media print { a { display: none; } }
      </style>
      <a href="${href}" aria-label="Open the Council of AI workspace" title="Open the Council of AI workspace">
        <img src="/csoai-icon.svg" alt="" aria-hidden="true" />
        <span>Open workspace</span>
      </a>`;
    document.body.appendChild(host);
  } catch {
    // The page remains fully usable if a restrictive document blocks enhancement.
  }
})();
