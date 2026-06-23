import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CSOAI Resources - Whitepapers, Toolkits, Templates & Reports",
  description: "Download CSOAI resources: whitepapers on AI governance, implementation toolkits, compliance templates, and industry reports. 12 resources for AI certification.",
  alternates: { canonical: "/resources" },
  openGraph: {
    title: "CSOAI Resources",
    description: "Whitepapers, toolkits, templates, and reports for AI governance.",
    type: "website",
    images: ["https://csoai.org/assets/og-image.png"],
  },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://csoai.org/" },
    { "@type": "ListItem", position: 2, name: "CSOAI Resources", item: "https://csoai.org/resources" },
  ],
};

export default function ResourcesPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <style>{`

        .legacy-content * { margin: 0; padding: 0; box-sizing: border-box; }
        .legacy-content :root { --color-dark: #0D0B21; --color-dark-light: #1A1145; --color-accent: #D4A843; --color-accent-bright: #E8B76D; --color-text: #E8E4F0; --color-white: #FFFFFF; --color-glass-bg: rgba(255, 255, 255, 0.03); --color-glass-border: rgba(255, 255, 255, 0.08); }
        .legacy-content html { scroll-behavior: smooth; }
        .legacy-content body { font-family: 'Inter', sans-serif; background: linear-gradient(135deg, var(--color-dark) 0%, var(--color-dark-light) 100%); color: var(--color-text); overflow-x: hidden; }
        .legacy-content body::before { content: ''; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-image: radial-gradient(circle, rgba(212, 168, 67, 0.15) 1px, transparent 1px); background-size: 50px 50px; pointer-events: none; z-index: 0; animation: drift 20s ease-in-out infinite; }
        @keyframes drift { 0%, 100% { background-position: 0 0; } 50% { background-position: 20px 20px; } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(60px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-20px); } }
        .legacy-content :root { --easing: cubic-bezier(0.16, 1, 0.3, 1); }
        .legacy-content main { position: relative; z-index: 1; }
        .legacy-content h1 { font-size: clamp(2.5rem, 5vw, 4rem); font-weight: 800; color: var(--color-white); }
        .legacy-content h2 { font-size: 1.5rem; font-weight: 700; color: var(--color-white); margin: 2.5rem 0 1.5rem; }
        .legacy-content p { font-size: 1rem; line-height: 1.7; }
        .legacy-content .btn { padding: 1rem 2rem; background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-bright) 100%); color: var(--color-dark); border: none; border-radius: 12px; font-weight: 600; font-size: 1rem; cursor: pointer; text-decoration: none; transition: all 0.3s; }
        .legacy-content .btn:hover { transform: scale(1.02); }
        .legacy-content .btn-small { padding: 0.75rem 1.5rem; font-size: 0.95rem; }
        .legacy-content nav { position: sticky; top: 0; z-index: 100; padding: 1.5rem 2rem; backdrop-filter: blur(10px); border-bottom: 1px solid rgba(255, 255, 255, 0.05); background: rgba(13, 11, 33, 0.7); }
        .legacy-content .nav-container { max-width: 1400px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; }
        .legacy-content .logo { display: flex; align-items: center; gap: 0.75rem; font-size: 1.5rem; font-weight: 800; color: var(--color-white); }
        .legacy-content .logo-dot { width: 12px; height: 12px; background: var(--color-accent); border-radius: 50%; animation: pulse 2s ease-in-out infinite; }
        @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
        .legacy-content .nav-links { display: flex; gap: 2rem; }
        .legacy-content nav a { color: var(--color-text); text-decoration: none; font-weight: 500; transition: color 0.3s; }
        .legacy-content nav a:hover { color: var(--color-accent); }
        .legacy-content section { max-width: 1400px; margin: 0 auto; padding: 80px 2rem; position: relative; z-index: 1; }
        .legacy-content .section-label { display: inline-block; padding: 0.5rem 1.5rem; background: rgba(212, 168, 67, 0.15); border: 1px solid rgba(212, 168, 67, 0.3); border-radius: 50px; font-size: 0.85rem; font-weight: 600; color: var(--color-accent); margin-bottom: 1.5rem; }
        .legacy-content .filters { display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 2rem; }
        .legacy-content .filter-btn { padding: 0.75rem 1.5rem; background: var(--color-glass-bg); border: 1px solid var(--color-glass-border); border-radius: 50px; color: var(--color-text); cursor: pointer; transition: all 0.3s; font-weight: 500; }
        .legacy-content .filter-btn:hover, .legacy-content .filter-btn.active { background: rgba(212, 168, 67, 0.2); border-color: var(--color-accent); color: var(--color-accent); }
        .legacy-content .resources-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 2rem; margin-top: 2rem; }
        .legacy-content .resource-card { background: var(--color-glass-bg); border: 1px solid var(--color-glass-border); backdrop-filter: blur(20px); border-radius: 16px; padding: 2.5rem; transition: all 0.3s; animation: fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) backwards; display: flex; flex-direction: column; }
        .legacy-content .resource-card:hover { box-shadow: 0 0 40px rgba(212, 168, 67, 0.3); transform: translateY(-8px); }
        .legacy-content .resource-type { display: inline-block; padding: 0.35rem 1rem; background: rgba(212, 168, 67, 0.15); color: var(--color-accent); border-radius: 20px; font-size: 0.75rem; font-weight: 600; margin-bottom: 1rem; width: fit-content; }
        .legacy-content .resource-title { font-size: 1.2rem; font-weight: 700; color: var(--color-white); margin-bottom: 0.75rem; }
        .legacy-content .resource-desc { font-size: 0.95rem; color: var(--color-text); margin-bottom: 1.5rem; flex-grow: 1; }
        .legacy-content .resource-meta { display: flex; justify-content: space-between; align-items: center; padding-top: 1.5rem; border-top: 1px solid var(--color-glass-border); margin-bottom: 1.5rem; font-size: 0.85rem; color: rgba(232, 228, 240, 0.7); }
        .legacy-content .resource-btn { display: inline-block; padding: 0.75rem 1.5rem; background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-bright) 100%); color: var(--color-dark); border-radius: 8px; text-decoration: none; font-weight: 600; text-align: center; transition: all 0.3s; }
        .legacy-content .resource-btn:hover { transform: scale(1.05); }
        .legacy-content .sticky-bar { position: fixed; bottom: 0; left: 0; right: 0; z-index: 99; padding: 1.5rem 2rem; background: rgba(13, 11, 33, 0.8); backdrop-filter: blur(10px); border-top: 1px solid rgba(255, 255, 255, 0.08); display: flex; justify-content: space-between; align-items: center; gap: 2rem; flex-wrap: wrap; }
        .legacy-content .sticky-message { font-size: 1rem; font-weight: 500; color: var(--color-text); }
        .legacy-content footer { background: linear-gradient(135deg, #0A0820 0%, #0D0B21 100%); padding: 4rem 2rem 2rem; margin-top: 6rem; border-top: 1px solid rgba(255, 255, 255, 0.05); position: relative; z-index: 2; }
        .legacy-content .footer-content { max-width: 1400px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 3rem; margin-bottom: 3rem; }
        .legacy-content .footer-section h4 { color: var(--color-accent); font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 1.5rem; font-weight: 700; }
        .legacy-content .footer-section ul { list-style: none; }
        .legacy-content .footer-section a { color: var(--color-text); text-decoration: none; font-size: 0.95rem; display: block; margin-bottom: 0.75rem; transition: color 0.3s; }
        .legacy-content .footer-section a:hover { color: var(--color-accent); }
        .legacy-content .footer-bottom { border-top: 1px solid rgba(255, 255, 255, 0.05); padding-top: 2rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; font-size: 0.9rem; color: var(--color-text); max-width: 1400px; margin: 0 auto; }
        .legacy-content .social-links { display: flex; gap: 1.5rem; }
        .legacy-content .social-links a { color: var(--color-text); text-decoration: none; transition: color 0.3s; }
        .legacy-content .social-links a:hover { color: var(--color-accent); }
        @media (max-width: 768px) { .legacy-content section { padding: 60px 1.5rem; } .legacy-content .resources-grid { grid-template-columns: 1fr; } }
    
      `}</style>
      <div
        className="legacy-content"
        dangerouslySetInnerHTML={{ __html: `<main>
        
<!-- ═══ MEGA NAV ═══ -->


        <section>
            <span class="section-label">Resource Center</span>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; align-items: center; margin-bottom: 3rem;">
                <div style="animation: fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) backwards;">
                    <h1>Resources</h1>
                    <p style="font-size: 1.15rem;">Download whitepapers, toolkits, templates, and reports to support your AI governance and certification journey.</p>
                </div>
                <div style="animation: float 6s ease-in-out infinite; filter: drop-shadow(0 0 30px rgba(212, 168, 67, 0.3)); display: flex; justify-content: center;">
                    <svg width="350" height="350" viewBox="0 0 350 350" fill="none">
                        <!-- Bookshelf frame -->
                        <rect x="40" y="50" width="270" height="280" rx="8" fill="none" stroke="#D4A843" stroke-width="2" opacity="0.4" />

                        <!-- Horizontal shelves -->
                        <line x1="50" y1="110" x2="300" y2="110" stroke="#D4A843" stroke-width="1.5" opacity="0.5" />
                        <line x1="50" y1="170" x2="300" y2="170" stroke="#D4A843" stroke-width="1.5" opacity="0.5" />
                        <line x1="50" y1="230" x2="300" y2="230" stroke="#D4A843" stroke-width="1.5" opacity="0.5" />
                        <line x1="50" y1="290" x2="300" y2="290" stroke="#D4A843" stroke-width="1.5" opacity="0.5" />

                        <!-- Vertical dividers for compartments -->
                        <line x1="100" y1="50" x2="100" y2="330" stroke="#D4A843" stroke-width="1" opacity="0.3" />
                        <line x1="175" y1="50" x2="175" y2="330" stroke="#D4A843" stroke-width="1" opacity="0.3" />
                        <line x1="250" y1="50" x2="250" y2="330" stroke="#D4A843" stroke-width="1" opacity="0.3" />

                        <!-- Books on shelves - various heights -->
                        <g opacity="0.8">
                            <!-- Shelf 1 -->
                            <rect x="55" y="95" width="12" height="15" fill="#D4A843" opacity="0.7" />
                            <rect x="72" y="88" width="12" height="22" fill="#D4A843" opacity="0.6" />
                            <rect x="89" y="93" width="12" height="17" fill="#D4A843" opacity="0.7" />

                            <!-- Shelf 2 -->
                            <rect x="108" y="150" width="12" height="20" fill="#D4A843" opacity="0.6" />
                            <rect x="125" y="145" width="12" height="25" fill="#D4A843" opacity="0.7" />
                            <rect x="142" y="152" width="12" height="18" fill="#D4A843" opacity="0.6" />

                            <!-- Shelf 3 -->
                            <rect x="183" y="215" width="12" height="15" fill="#D4A843" opacity="0.7" />
                            <rect x="200" y="210" width="12" height="20" fill="#D4A843" opacity="0.6" />
                            <rect x="217" y="220" width="12" height="10" fill="#D4A843" opacity="0.7" />

                            <!-- Shelf 4 -->
                            <rect x="258" y="280" width="12" height="10" fill="#D4A843" opacity="0.6" />
                            <rect x="275" y="273" width="12" height="17" fill="#D4A843" opacity="0.7" />
                        </g>

                        <!-- Floating documents/pages icon -->
                        <g opacity="0.6" style="animation: float 4s ease-in-out infinite;">
                            <rect x="180" y="120" width="35" height="50" rx="2" fill="none" stroke="#D4A843" stroke-width="1.5" />
                            <line x1="188" y1="135" x2="205" y2="135" stroke="#D4A843" stroke-width="1" opacity="0.7" />
                            <line x1="188" y1="145" x2="210" y2="145" stroke="#D4A843" stroke-width="1" opacity="0.7" />
                            <line x1="188" y1="155" x2="207" y2="155" stroke="#D4A843" stroke-width="1" opacity="0.7" />
                        </g>
                    </svg>
                </div>
            </div>

            <div class="filters">
                <button class="filter-btn active" onclick="filterResources('all')">All</button>
                <button class="filter-btn" onclick="filterResources('whitepaper')">Whitepapers</button>
                <button class="filter-btn" onclick="filterResources('toolkit')">Toolkits</button>
                <button class="filter-btn" onclick="filterResources('template')">Templates</button>
                <button class="filter-btn" onclick="filterResources('report')">Reports</button>
            </div>

            <div class="resources-grid">
                <div class="resource-card" data-category="whitepaper">
                    <span class="resource-type">Whitepaper</span>
                    <div class="resource-title">Byzantine Consensus in AI Governance</div>
                    <p class="resource-desc">Comprehensive technical whitepaper explaining Byzantine Fault Tolerance principles, 22/33 consensus mechanisms, and cryptographic verification in distributed AI governance systems.</p>
                    <div class="resource-meta">
                        <span>24 pages | PDF</span>
                        <span>2.4 MB</span>
                    </div>
                    <a href="#" class="resource-btn">Download →</a>
                </div>

                <div class="resource-card" data-category="whitepaper">
                    <span class="resource-type">Whitepaper</span>
                    <div class="resource-title">AI Governance Frameworks Comparison</div>
                    <p class="resource-desc">Detailed comparison of CSOAI, ISO 42001, NIST AI RMF, and EU AI Act requirements. Identifies overlaps, gaps, and integration strategies for multi-framework compliance.</p>
                    <div class="resource-meta">
                        <span>18 pages | PDF</span>
                        <span>1.8 MB</span>
                    </div>
                    <a href="#" class="resource-btn">Download →</a>
                </div>

                <div class="resource-card" data-category="toolkit">
                    <span class="resource-type">Toolkit</span>
                    <div class="resource-title">AI Risk Register Development Kit</div>
                    <p class="resource-desc">Complete toolkit for identifying, assessing, and documenting AI risks. Includes risk taxonomy, scoring methodology, mitigation templates, and monitoring procedures.</p>
                    <div class="resource-meta">
                        <span>Excel + PDF | ZIP</span>
                        <span>5.2 MB</span>
                    </div>
                    <a href="#" class="resource-btn">Download →</a>
                </div>

                <div class="resource-card" data-category="toolkit">
                    <span class="resource-type">Toolkit</span>
                    <div class="resource-title">Red Teaming Methodology Handbook</div>
                    <p class="resource-desc">Practical guide to designing and executing red teaming exercises for AI systems. Includes attack vectors, testing scenarios, metrics, and reporting templates.</p>
                    <div class="resource-meta">
                        <span>PDF + Tools | ZIP</span>
                        <span>8.4 MB</span>
                    </div>
                    <a href="#" class="resource-btn">Download →</a>
                </div>

                <div class="resource-card" data-category="template">
                    <span class="resource-type">Template</span>
                    <div class="resource-title">AI System Documentation Template</div>
                    <p class="resource-desc">Comprehensive documentation template covering architecture, data, training, governance, monitoring, and incident response. Optimized for certification requirements.</p>
                    <div class="resource-meta">
                        <span>Word + PDF | DOCX</span>
                        <span>2.1 MB</span>
                    </div>
                    <a href="#" class="resource-btn">Download →</a>
                </div>

                <div class="resource-card" data-category="template">
                    <span class="resource-type">Template</span>
                    <div class="resource-title">Governance Charter Template</div>
                    <p class="resource-desc">Customizable template for establishing AI governance charters. Covers principles, oversight structures, decision-making processes, and accountability mechanisms aligned with CSOAI standards.</p>
                    <div class="resource-meta">
                        <span>Word + PDF | DOCX</span>
                        <span>1.5 MB</span>
                    </div>
                    <a href="#" class="resource-btn">Download →</a>
                </div>

                <div class="resource-card" data-category="report">
                    <span class="resource-type">Report</span>
                    <div class="resource-title">2026 AI Governance Report</div>
                    <p class="resource-desc">Comprehensive analysis of global AI governance trends, regulatory updates, enforcement actions, and best practices. Updated quarterly with latest developments and compliance timelines.</p>
                    <div class="resource-meta">
                        <span>32 pages | PDF</span>
                        <span>3.8 MB</span>
                    </div>
                    <a href="#" class="resource-btn">Download →</a>
                </div>

                <div class="resource-card" data-category="report">
                    <span class="resource-type">Report</span>
                    <div class="resource-title">EU AI Act Compliance Assessment</div>
                    <p class="resource-desc">Detailed assessment of EU AI Act requirements, Article breakdown, compliance obligations by organization type, and pathway to certification. Updated for August 2026 deadline.</p>
                    <div class="resource-meta">
                        <span>28 pages | PDF</span>
                        <span>2.9 MB</span>
                    </div>
                    <a href="#" class="resource-btn">Download →</a>
                </div>

                <div class="resource-card" data-category="whitepaper">
                    <span class="resource-type">Whitepaper</span>
                    <div class="resource-title">Explainability and Transparency in AI</div>
                    <p class="resource-desc">Technical guide to implementing explainable AI (XAI) systems. Covers interpretability methods, audit trails, decision transparency, and user-facing explanations for governance.</p>
                    <div class="resource-meta">
                        <span>20 pages | PDF</span>
                        <span>2.2 MB</span>
                    </div>
                    <a href="#" class="resource-btn">Download →</a>
                </div>

                <div class="resource-card" data-category="toolkit">
                    <span class="resource-type">Toolkit</span>
                    <div class="resource-title">Bias Detection and Mitigation Toolkit</div>
                    <p class="resource-desc">Tools and procedures for identifying algorithmic bias across demographic groups. Includes testing frameworks, bias metrics, visualization tools, and remediation strategies.</p>
                    <div class="resource-meta">
                        <span>Python + PDF | ZIP</span>
                        <span>7.1 MB</span>
                    </div>
                    <a href="#" class="resource-btn">Download →</a>
                </div>

                <div class="resource-card" data-category="template">
                    <span class="resource-type">Template</span>
                    <div class="resource-title">Incident Response Plan Template</div>
                    <p class="resource-desc">Complete AI incident response framework. Covers detection, escalation, investigation, remediation, and post-incident review for governance and regulatory compliance.</p>
                    <div class="resource-meta">
                        <span>Word + PDF | DOCX</span>
                        <span>1.8 MB</span>
                    </div>
                    <a href="#" class="resource-btn">Download →</a>
                </div>

                <div class="resource-card" data-category="report">
                    <span class="resource-type">Report</span>
                    <div class="resource-title">CASA Certification Case Studies</div>
                    <p class="resource-desc">Detailed case studies from first-wave certified organizations. Real-world examples of certification processes, challenges overcome, and business impact achieved.</p>
                    <div class="resource-meta">
                        <span>22 pages | PDF</span>
                        <span>2.5 MB</span>
                    </div>
                    <a href="#" class="resource-btn">Download →</a>
                </div>
            </div>
        </section>
    </main>

    <div class="sticky-bar">
        <span class="sticky-message">Download resources to accelerate your AI governance and certification.</span>
        <a href="/contact" class="btn">Get in Touch →</a>
    </div>` }}
      />
    </div>
  );
}
