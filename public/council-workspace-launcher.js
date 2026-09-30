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
    // 27 Sep 2026 (ux-unify): no floating "Open workspace" button is injected any more.
    // It covered cookie banners and content, and duplicated "Council OS" in the site
    // header. This script now only carries the embed contract above; the file name is
    // kept because static pages already reference it.
  } catch {
    // The page remains fully usable if a restrictive document blocks enhancement.
  }
})();
