export default function Page() {
  return <div dangerouslySetInnerHTML={{ __html: `<div class="app">
    <!-- TOP BAR -->
    <div class="topbar">
      <a href="/" class="logo">OpenGrid<span>CSOAI · v1.0</span></a>
      <div class="search">
        <span class="search-icon">🔍</span>
        <input type="text" placeholder="Search 88 pages · 29 endpoints · 271 servers · 15 verticals · 278 prospects…" id="searchInput">
      </div>
      <div class="header-actions">
        <span style="font-size:.78rem;color:#10b981"><span class="live-dot"></span>LIVE</span>
        <a href="/certify">→ Certify</a>
        <button class="icon-btn" title="Refresh">↻</button>
        <button class="icon-btn" title="Layers">◫</button>
        <button class="icon-btn" title="Settings">⚙</button>
        <button class="icon-btn" title="Profile">👤</button>
      </div>
    </div>

    <!-- SIDEBAR -->
    <div class="sidebar">
      <div class="section">
        <h3>🌐 Surfaces</h3>
        <a class="item" href="/">
          <span class="icon">🏠</span>
          <span>csoai.org (live)</span>
          <span class="badge badge-live">LIVE</span>
        </a>
        <a class="item" href="/api/playground">
          <span class="icon">⚡</span>
          <span>csoai-mcp-monetization:3400</span>
          <span class="badge badge-live">LIVE</span>
        </a>
        <a class="item" href="/dome.html">
          <span class="icon">🌐</span>
          <span>SOV3 substrate :3101</span>
          <span class="badge badge-live">LIVE</span>
        </a>
        <a class="item" href="/api-docs">
          <span class="icon">📚</span>
          <span>API docs (29 endpoints)</span>
          <span class="badge badge-new">v2</span>
        </a>
        <a class="item" href="/auditor">
          <span class="icon">🔍</span>
          <span>Auditor portal</span>
          <span class="badge badge-new">NEW</span>
        </a>
      </div>

      <div class="section">
        <h3>🧠 Council (200 voters)</h3>
        <a class="item" href="/charter.html">
          <span class="icon">📜</span>
          <span>52-Article Charter</span>
        </a>
        <a class="item" href="/crosswalks.html">
          <span class="icon">🔄</span>
          <span>Framework crosswalks</span>
        </a>
        <a class="item" href="/glossary">
          <span class="icon">📚</span>
          <span>Glossary (200+ terms)</span>
        </a>
        <a class="item" href="/regulators">
          <span class="icon">🏛</span>
          <span>Regulators (40+)</span>
        </a>
        <a class="item" href="/certification.html">
          <span class="icon">🏅</span>
          <span>CASA Certification</span>
        </a>
      </div>

      <div class="section">
        <h3>📦 Products</h3>
        <a class="item" href="/certify">
          <span class="icon">💰</span>
          <span>8 Tier Pricing</span>
          <span class="badge badge-live">LIVE</span>
        </a>
        <a class="item" href="/packs">
          <span class="icon">📦</span>
          <span>3 Packs</span>
        </a>
        <a class="item" href="/mcp-servers">
          <span class="icon">🛠</span>
          <span>271 MCP Servers</span>
          <span class="badge badge-live">LIVE</span>
        </a>
        <a class="item" href="/partner">
          <span class="icon">🤝</span>
          <span>3 White-label Partners</span>
        </a>
        <a class="item" href="/enterprise">
          <span class="icon">🏢</span>
          <span>Enterprise</span>
        </a>
      </div>

      <div class="section">
        <h3>📚 Content</h3>
        <a class="item" href="/sectors/">
          <span class="icon">🏛</span>
          <span>97 sector pages</span>
        </a>
        <a class="item" href="/industries/">
          <span class="icon">🏭</span>
          <span>12 industries</span>
        </a>
        <a class="item" href="/blog">
          <span class="icon">📰</span>
          <span>14 blog posts</span>
        </a>
        <a class="item" href="/case-studies">
          <span class="icon">📈</span>
          <span>3 case studies</span>
        </a>
        <a class="item" href="/onboarding">
          <span class="icon">🚀</span>
          <span>10-step onboarding</span>
        </a>
        <a class="item" href="/status">
          <span class="icon">📊</span>
          <span>Empire status</span>
        </a>
        <a class="item" href="/trust">
          <span class="icon">🤝</span>
          <span>Trust & promise</span>
        </a>
        <a class="item" href="/security">
          <span class="icon">🔐</span>
          <span>Security</span>
        </a>
        <a class="item" href="/evidence">
          <span class="icon">📄</span>
          <span>Per-cert evidence</span>
        </a>
      </div>

      <div class="section">
        <h3>🔌 Integrations</h3>
        <a class="item" href="/api/discover">
          <span class="icon">🔍</span>
          <span>AI agent discovery</span>
        </a>
        <a class="item" href="/coupon">
          <span class="icon">🎟</span>
          <span>Coupon validation</span>
        </a>
        <a class="item" href="/customer">
          <span class="icon">👤</span>
          <span>Customer portal</span>
        </a>
        <a class="item" href="/partner">
          <span class="icon">🤝</span>
          <span>Reseller program</span>
        </a>
        <a class="item" href="/recommend">
          <span class="icon">🧭</span>
          <span>5 use cases</span>
        </a>
      </div>
    </div>

    <!-- CANVAS (DOME) -->
    <div class="canvas">
      <div class="grid-overlay"></div>

      <!-- Layers toggle -->
      <div class="panel layers-panel">
        <div class="panel-header"><span class="dot" style="background:#22d3ee"></span>Layers</div>
        <div class="panel-body" style="padding:.4rem">
          <div class="item"><div class="toggle" style="background:#22d3ee"></div>Council</div>
          <div class="item"><div class="toggle" style="background:#a855f7"></div>Substrate</div>
          <div class="item"><div class="toggle" style="background:#ec4899"></div>MCP Servers</div>
          <div class="item"><div class="toggle" style="background:#fbbf24"></div>Prospects</div>
          <div class="item"><div class="toggle" style="background:#10b981"></div>Sigils</div>
          <div class="item"><div class="toggle" style="background:#ef4444"></div>Keystones</div>
        </div>
      </div>

      <!-- The Dome visualization -->
      <div class="dome-canvas">
        <div class="dome">
          <svg viewBox="-260 -260 520 520" fill="none">
            <!-- Outer ring -->
            <circle cx="0" cy="0" r="240" stroke="rgba(34,211,238,.3)" stroke-width="0.5" stroke-dasharray="2 4"/>
            <!-- Middle ring -->
            <circle cx="0" cy="0" r="180" stroke="rgba(168,85,247,.4)" stroke-width="0.5"/>
            <!-- Inner ring -->
            <circle cx="0" cy="0" r="120" stroke="rgba(236,72,153,.3)" stroke-width="0.5" stroke-dasharray="1 3"/>
            <!-- Core -->
            <circle cx="0" cy="0" r="60" fill="url(#coreGrad)" stroke="rgba(34,211,238,.6)" stroke-width="1"/>
            <!-- Orbital dots (Council = 200 voters) -->
            <g fill="#22d3ee">
              <circle cx="240" cy="0" r="3"/><circle cx="-240" cy="0" r="3"/>
              <circle cx="0" cy="240" r="3"/><circle cx="0" cy="-240" r="3"/>
              <circle cx="170" cy="170" r="2"/><circle cx="-170" cy="-170" r="2"/>
              <circle cx="170" cy="-170" r="2"/><circle cx="-170" cy="170" r="2"/>
              <circle cx="220" cy="80" r="2.5"/><circle cx="-220" cy="80" r="2.5"/>
              <circle cx="220" cy="-80" r="2.5"/><circle cx="-220" cy="-80" r="2.5"/>
              <circle cx="80" cy="220" r="2.5"/><circle cx="-80" cy="220" r="2.5"/>
              <circle cx="80" cy="-220" r="2.5"/><circle cx="-80" cy="-220" r="2.5"/>
            </g>
            <!-- Connection lines -->
            <g stroke="rgba(168,85,247,.4)" stroke-width="0.3">
              <line x1="60" y1="0" x2="220" y2="80"/>
              <line x1="-60" y1="0" x2="-220" y2="-80"/>
              <line x1="0" y1="60" x2="80" y2="220"/>
              <line x1="0" y1="-60" x2="-80" y2="-220"/>
              <line x1="60" y1="0" x2="220" y2="-80"/>
              <line x1="-60" y1="0" x2="-220" y2="80"/>
            </g>
            <!-- Dots on middle ring (MCP servers = 271) -->
            <g fill="#a855f7" opacity=".8">
              <!-- 24 visible dots distributed -->
              <circle cx="180" cy="0" r="1.5"/><circle cx="156" cy="90" r="1.5"/><circle cx="90" cy="156" r="1.5"/>
              <circle cx="0" cy="180" r="1.5"/><circle cx="-90" cy="156" r="1.5"/><circle cx="-156" cy="90" r="1.5"/>
              <circle cx="-180" cy="0" r="1.5"/><circle cx="-156" cy="-90" r="1.5"/><circle cx="-90" cy="-156" r="1.5"/>
              <circle cx="0" cy="-180" r="1.5"/><circle cx="90" cy="-156" r="1.5"/><circle cx="156" cy="-90" r="1.5"/>
              <circle cx="127" cy="127" r="1"/><circle cx="-127" cy="127" r="1"/>
              <circle cx="127" cy="-127" r="1"/><circle cx="-127" cy="-127" r="1"/>
              <circle cx="180" cy="40" r="1"/><circle cx="-180" cy="40" r="1"/>
              <circle cx="180" cy="-40" r="1"/><circle cx="-180" cy="-40" r="1"/>
              <circle cx="40" cy="180" r="1"/><circle cx="-40" cy="180" r="1"/>
              <circle cx="40" cy="-180" r="1"/><circle cx="-40" cy="-180" r="1"/>
            </g>
            <defs>
              <radialGradient id="coreGrad">
                <stop offset="0%" stop-color="#22d3ee" stop-opacity=".4"/>
                <stop offset="100%" stop-color="#a855f7" stop-opacity=".1"/>
              </radialGradient>
            </defs>
          </svg>
          <div class="dome-center">
            <div class="label">CSOAI Dome</div>
            <div class="name">v2.6.0-day11</div>
            <div class="stat">
              <div class="stat"><span class="value">610</span><span class="label">Sigils</span></div>
              <div class="stat"><span class="value">19</span><span class="label">Keystones</span></div>
              <div class="stat"><span class="value">271</span><span class="label">MCP</span></div>
              <div class="stat"><span class="value">71/71</span><span class="label">E2E</span></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Product tiles around the dome -->
      <a href="/certify" class="product-tile" style="top:60px;left:340px">
        <div class="name">💰 Pricing</div>
        <div class="meta">8 canonical tiers · £9 → £4,950</div>
        <div class="stat"><span class="pill badge-live">LIVE</span></div>
      </a>
      <a href="/mcp-servers" class="product-tile" style="top:60px;right:340px">
        <div class="name">🛠 MCP Marketplace</div>
        <div class="meta">271 servers · 12 sectors</div>
        <div class="stat"><span class="pill badge-live">LIVE</span></div>
      </a>
      <a href="/packs" class="product-tile" style="bottom:200px;left:340px">
        <div class="name">📦 Packs</div>
        <div class="meta">3 packs · £499 → £1,499</div>
        <div class="stat"><span class="pill badge-live">LIVE</span></div>
      </a>
      <a href="/charter" class="product-tile" style="bottom:200px;right:340px">
        <div class="name">📜 Charter</div>
        <div class="meta">52 articles · MEOK substrate</div>
        <div class="stat"><span class="pill badge-live">LIVE</span></div>
      </a>
      <a href="/blog" class="product-tile" style="top:240px;left:340px">
        <div class="name">📰 Blog</div>
        <div class="meta">14 posts · AI safety + compliance</div>
      </a>
      <a href="/api-docs" class="product-tile" style="top:240px;right:340px">
        <div class="name">📚 API Docs</div>
        <div class="meta">29 endpoints · full reference</div>
        <div class="stat"><span class="pill badge-new">v2</span></div>
      </a>
      <a href="/case-studies" class="product-tile" style="bottom:200px;left:50%;transform:translateX(-50%)">
        <div class="name">📈 Case Studies</div>
        <div class="meta">3 illustrative scenarios</div>
      </a>
      <a href="/onboarding" class="product-tile" style="top:50%;right:340px;transform:translateY(-50%)">
        <div class="name">🚀 Onboarding</div>
        <div class="meta">10 steps · 30-day plan</div>
      </a>

      <!-- Bottom panels: live metrics -->
      <div class="bottom-bar">
        <div class="mini-panel">
          <h4>📊 Empire Metrics</h4>
          <div class="row"><span>Pages</span><strong>88</strong></div>
          <div class="row"><span>API endpoints</span><strong>29</strong></div>
          <div class="row"><span>Sectors</span><strong>97</strong></div>
          <div class="row"><span>Industries</span><strong>12</strong></div>
          <div class="row"><span>Blog posts</span><strong>14</strong></div>
        </div>
        <div class="mini-panel">
          <h4>🛡 Substrate</h4>
          <div class="row"><span>SOV3 health</span><strong><span class="status-dot"></span>LIVE</strong></div>
          <div class="row"><span>Council voters</span><strong>200</strong></div>
          <div class="row"><span>Sigil chain</span><strong>610 records</strong></div>
          <div class="row"><span>Consciousness</span><strong>0.787</strong></div>
          <div class="row"><span>Keystones (24h)</span><strong>19</strong></div>
        </div>
        <div class="mini-panel">
          <h4>💰 Revenue</h4>
          <div class="row"><span>Total (test)</span><strong>£2,985</strong></div>
          <div class="row"><span>ARR potential</span><strong>£35,820/yr</strong></div>
          <div class="row"><span>Avg ticket</span><strong>£199</strong></div>
          <div class="row"><span>Subscriptions</span><strong>0</strong></div>
          <div class="row"><span>Stripe config</span><strong style="color:#ef4444">pending</strong></div>
        </div>
        <div class="mini-panel">
          <h4>📨 Outreach</h4>
          <div class="row"><span>Queue</span><strong>278</strong></div>
          <div class="row"><span>Sent today</span><strong>0</strong></div>
          <div class="row"><span>Strike counter</span><strong style="color:#10b981">1/9</strong></div>
          <div class="row"><span>Verticals</span><strong>15</strong></div>
          <div class="row"><span>Organisations</span><strong>95+</strong></div>
        </div>
      </div>
    </div>
  </div>

  <!-- Floating tooltip (initialised by JS) -->
  <div class="tooltip hidden" id="tooltip"></div>

  <script>
    // Simple search that filters sidebar items
    const input = document.getElementById("searchInput");
    input.addEventListener("input", (e) => {
      const q = e.target.value.toLowerCase();
      document.querySelectorAll(".sidebar .item").forEach((it) => {
        const text = it.textContent.toLowerCase();
        it.style.display = text.includes(q) || q === "" ? "flex" : "none";
      });
    });

    // Tooltip on product tiles
    const tooltip = document.getElementById("tooltip");
    document.querySelectorAll(".product-tile").forEach((tile) => {
      tile.addEventListener("mouseenter", () => {
        const name = tile.querySelector(".name")?.textContent || "";
        const meta = tile.querySelector(".meta")?.textContent || "";
        tooltip.innerHTML = \`<h4>\${name}</h4><p>\${meta}</p>\`;
        tooltip.classList.remove("hidden");
      });
      tile.addEventListener("mousemove", (e) => {
        tooltip.style.left = (e.clientX + 16) + "px";
        tooltip.style.top = (e.clientY + 16) + "px";
      });
      tile.addEventListener("mouseleave", () => {
        tooltip.classList.add("hidden");
      });
    });

    // Live pulse on the live dot
    document.querySelectorAll(".live-dot").forEach((d) => {
      d.style.animation = "pulse 2s ease-in-out infinite";
    });
  </script>` }} />;
}
