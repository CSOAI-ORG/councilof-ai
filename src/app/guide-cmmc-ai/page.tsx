import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CMMC Compliance for AI Systems | CSOAI Guide",
  description: "Complete guide to CMMC compliance for AI systems. Map AI controls to CMMC levels 1-3, implement safeguards, and achieve certification for defense contractors.",
  alternates: { canonical: "/guide-cmmc-ai" },
  openGraph: {
    title: "CMMC Compliance for AI Systems",
    description: "Defense contractor guide to integrating AI systems with CMMC requirements.",
    type: "article",
    images: ["https://csoai.org/assets/og-image.png"],
  },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://csoai.org/" },
    { "@type": "ListItem", position: 2, name: "Guides", item: "https://csoai.org/guides" },
    { "@type": "ListItem", position: 3, name: "CMMC Compliance for AI Systems", item: "https://csoai.org/guide-cmmc-ai" },
  ],
};

export default function GuideCmmcAiPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <style>{`

        .guide-content * { margin: 0; padding: 0; box-sizing: border-box; }
        .guide-content :root {
            --color-dark: #0D0B21;
            --color-dark-light: #1A1145;
            --color-accent: #D4A843;
            --color-accent-bright: #E8B76D;
            --color-text: #E8E4F0;
            --color-white: #FFFFFF;
            --color-glass-bg: rgba(255, 255, 255, 0.03);
            --color-glass-border: rgba(255, 255, 255, 0.08);
        }
        .guide-content html { scroll-behavior: smooth; }
        .guide-content body {
            font-family: 'Inter', sans-serif;
            background: linear-gradient(135deg, var(--color-dark) 0%, var(--color-dark-light) 100%);
            color: var(--color-text);
            line-height: 1.7;
            overflow-x: hidden;
        }
        .guide-content body::before {
            content: '';
            position: fixed;
            top: 0; left: 0; width: 100%; height: 100%;
            background-image: radial-gradient(circle, rgba(212, 168, 67, 0.15) 1px, transparent 1px);
            background-size: 50px 50px;
            pointer-events: none; z-index: 0;
            animation: drift 20s ease-in-out infinite;
        }
        .guide-content .particle { position: fixed; pointer-events: none; z-index: 1; }
        .guide-content .particle::before {
            content: '';
            position: absolute;
            width: 100%; height: 100%;
            background: radial-gradient(circle, var(--color-accent) 0%, transparent 70%);
            border-radius: 50%;
        }
        @keyframes drift { 0%, 100% { background-position: 0 0; } 50% { background-position: 20px 20px; } }
        @keyframes particleFloat { 0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.5; } 25% { transform: translateY(-60px) translateX(30px); opacity: 0.8; } 50% { transform: translateY(-120px) translateX(-20px); opacity: 0.4; } 75% { transform: translateY(-80px) translateX(40px); opacity: 0.7; } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(60px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes progressBar { from { width: 0%; } }
        .guide-content .progress-bar { position: fixed; top: 0; left: 0; height: 4px; background: linear-gradient(90deg, var(--color-accent) 0%, var(--color-accent-bright) 100%); width: 0%; z-index: 200; animation: progressBar ease-out; }
        .guide-content main { position: relative; z-index: 1; }
        .guide-content .hero-section {
            position: relative;
            padding: 80px 2rem 60px;
            background: linear-gradient(135deg, rgba(13, 11, 33, 0.5) 0%, rgba(26, 17, 69, 0.3) 100%);
            border-bottom: 1px solid var(--color-glass-border);
            z-index: 2;
            animation: slideDown 0.8s ease;
        }
        .guide-content .hero-content {
            max-width: 1400px;
            margin: 0 auto;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 3rem;
            align-items: center;
        }
        .guide-content .hero-text h1 { font-size: clamp(2rem, 5vw, 3.5rem); line-height: 1.2; margin-bottom: 1.5rem; }
        .guide-content .hero-text p { font-size: 1.1rem; color: var(--color-text); margin-bottom: 2rem; line-height: 1.8; }
        .guide-content .hero-svg { width: 100%; height: 350px; display: flex; align-items: center; justify-content: center; }
        .guide-content .breadcrumbs {
            max-width: 1400px;
            margin: 0 auto;
            padding: 1rem 2rem;
            font-size: 0.9rem;
            color: var(--color-text);
            z-index: 3;
            position: relative;
        }
        .guide-content .breadcrumbs a { color: var(--color-accent); text-decoration: none; transition: color 0.3s ease; }
        .guide-content .breadcrumbs a:hover { color: var(--color-accent-bright); }
        .guide-content h1 { font-size: clamp(2.5rem, 5vw, 4rem); font-weight: 800; color: var(--color-white); margin-bottom: 1rem; }
        .guide-content h2 { font-size: 1.75rem; font-weight: 700; color: var(--color-white); margin-top: 2.5rem; margin-bottom: 1.5rem; }
        .guide-content h3 { font-size: 1.25rem; font-weight: 700; color: var(--color-white); margin-top: 1.75rem; margin-bottom: 1rem; }
        .guide-content p { font-size: 1rem; line-height: 1.8; color: var(--color-text); margin-bottom: 1.25rem; }
        .guide-content .btn {
            display: inline-flex;
            align-items: center; justify-content: center;
            gap: 0.5rem;
            padding: 1rem 2rem;
            background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-bright) 100%);
            color: var(--color-dark);
            border: none; border-radius: 12px;
            font-weight: 600; font-size: 1rem;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 10px 30px rgba(212, 168, 67, 0.25);
            text-decoration: none;
        }
        .guide-content .btn:hover { transform: scale(1.02); box-shadow: 0 15px 45px rgba(212, 168, 67, 0.4); }
        .guide-content .btn-small { padding: 0.75rem 1.5rem; font-size: 0.95rem; }
        .guide-content nav { position: sticky; top: 0; z-index: 100; padding: 1.5rem 2rem; backdrop-filter: blur(10px); border-bottom: 1px solid rgba(255, 255, 255, 0.05); background: rgba(13, 11, 33, 0.7); }
        .guide-content .nav-container { max-width: 1400px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; }
        .guide-content .logo { display: flex; align-items: center; gap: 0.75rem; font-size: 1.5rem; font-weight: 800; color: var(--color-white); }
        .guide-content .logo-dot { width: 12px; height: 12px; background: var(--color-accent); border-radius: 50%; animation: pulse 2s ease-in-out infinite; }
        @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
        .guide-content .nav-links { display: flex; gap: 2rem; align-items: center; }
        .guide-content nav a { color: var(--color-text); text-decoration: none; font-weight: 500; transition: color 0.3s ease; }
        .guide-content nav a:hover { color: var(--color-accent); }
        .guide-content .guide-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 80px 2rem;
            position: relative;
            z-index: 1;
            display: grid;
            grid-template-columns: 1fr 300px;
            gap: 3rem;
        }
        .guide-content {
            background: var(--color-glass-bg);
            border: 1px solid var(--color-glass-border);
            backdrop-filter: blur(20px);
            border-radius: 16px;
            padding: 3rem;
        }
        .guide-content .step { margin-bottom: 3.5rem; padding-bottom: 2.5rem; border-bottom: 1px solid var(--color-glass-border); }
        .guide-content .step:last-child { border-bottom: none; }
        .guide-content .step-number {
            display: inline-flex;
            width: 50px; height: 50px;
            align-items: center; justify-content: center;
            font-size: 1.75rem; font-weight: 800;
            background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-bright) 100%);
            color: var(--color-dark);
            border-radius: 50%;
            margin-bottom: 1.25rem;
        }
        .guide-content ul, .guide-content ol { margin-left: 1.5rem; margin-bottom: 1.25rem; }
        .guide-content li { margin-bottom: 0.75rem; color: var(--color-text); }
        .guide-content .sidebar { position: sticky; top: 100px; height: fit-content; }
        .guide-content .checklist {
            background: var(--color-glass-bg);
            border: 1px solid var(--color-glass-border);
            backdrop-filter: blur(20px);
            border-radius: 16px;
            padding: 2rem;
            margin-bottom: 2rem;
        }
        .guide-content .checklist h4 { color: var(--color-accent); font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 1.5rem; font-weight: 700; }
        .guide-content .checklist-item {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            margin-bottom: 1rem;
            font-size: 0.9rem;
            color: var(--color-text);
        }
        .guide-content .checklist-item input { width: 18px; height: 18px; cursor: pointer; accent-color: var(--color-accent); }
        .guide-content .related-guides {
            background: var(--color-glass-bg);
            border: 1px solid var(--color-glass-border);
            backdrop-filter: blur(20px);
            border-radius: 16px;
            padding: 2rem;
        }
        .guide-content .related-guides h4 { color: var(--color-accent); font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 1.5rem; font-weight: 700; }
        .guide-content .related-guides a {
            display: block;
            padding: 0.75rem 0;
            color: var(--color-text);
            text-decoration: none;
            border-bottom: 1px solid var(--color-glass-border);
            font-size: 0.9rem;
            transition: color 0.3s ease;
        }
        .guide-content .related-guides a:last-child { border-bottom: none; }
        .guide-content .related-guides a:hover { color: var(--color-accent); }
        .guide-content .cta-section {
            background: var(--color-glass-bg);
            border: 2px solid var(--color-accent);
            backdrop-filter: blur(20px);
            border-radius: 16px;
            padding: 2.5rem;
            text-align: center;
            margin-top: 4rem;
        }
        .guide-content .cta-section h3 { margin-top: 0; }
        .guide-content .sticky-bar {
            position: fixed;
            bottom: 0; left: 0; right: 0;
            z-index: 99;
            padding: 1.5rem 2rem;
            background: rgba(13, 11, 33, 0.8);
            backdrop-filter: blur(10px);
            border-top: 1px solid rgba(255, 255, 255, 0.08);
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 2rem;
            flex-wrap: wrap;
        }
        .guide-content .sticky-message { font-size: 1rem; font-weight: 500; color: var(--color-text); flex: 1; min-width: 200px; }
        .guide-content .cookie-banner {
            position: fixed;
            bottom: 80px; left: 2rem;
            z-index: 98;
            background: var(--color-glass-bg);
            border: 1px solid var(--color-glass-border);
            backdrop-filter: blur(20px);
            border-radius: 16px;
            padding: 1.5rem;
            max-width: 300px;
            animation: slideUp 0.5s ease;
        }
        @keyframes slideUp { from { transform: translateY(100px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .guide-content .cookie-text { font-size: 0.85rem; color: var(--color-text); margin-bottom: 1rem; }
        .guide-content .cookie-buttons { display: flex; gap: 0.75rem; flex-direction: column; }
        .guide-content .cookie-buttons button { padding: 0.5rem 1rem; border: none; border-radius: 6px; font-weight: 600; font-size: 0.85rem; cursor: pointer; transition: all 0.3s ease; }
        .guide-content .cookie-accept { background: var(--color-accent); color: var(--color-dark); }
        .guide-content .cookie-decline { background: transparent; color: var(--color-accent); border: 1px solid var(--color-accent); }
        .guide-content .back-to-top {
            position: fixed;
            bottom: 100px; right: 2rem;
            width: 50px; height: 50px;
            background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-bright) 100%);
            color: var(--color-dark);
            border: none; border-radius: 50%;
            font-size: 1.5rem;
            cursor: pointer;
            display: none;
            align-items: center; justify-content: center;
            z-index: 150;
            box-shadow: 0 10px 30px rgba(212, 168, 67, 0.3);
            transition: all 0.3s ease;
            animation: fadeUp 0.3s ease;
        }
        .guide-content .back-to-top:hover { transform: scale(1.1) translateY(-5px); box-shadow: 0 15px 40px rgba(212, 168, 67, 0.5); }
        .guide-content .back-to-top.visible { display: flex; }
        .guide-content footer {
            background: linear-gradient(135deg, #0A0820 0%, #0D0B21 100%);
            padding: 4rem 2rem 2rem;
            margin-top: 6rem;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
            position: relative;
            z-index: 2;
        }
        .guide-content .footer-content { max-width: 1400px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 3rem; margin-bottom: 3rem; }
        .guide-content .footer-section h4 { color: var(--color-accent); font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 1.5rem; font-weight: 700; }
        .guide-content .footer-section ul { list-style: none; }
        .guide-content .footer-section a { color: var(--color-text); text-decoration: none; font-size: 0.95rem; display: block; margin-bottom: 0.75rem; transition: color 0.3s ease; }
        .guide-content .footer-section a:hover { color: var(--color-accent); }
        .guide-content .footer-bottom { border-top: 1px solid rgba(255, 255, 255, 0.05); padding-top: 2rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; font-size: 0.9rem; color: var(--color-text); max-width: 1400px; margin: 0 auto; }
        .guide-content .social-links { display: flex; gap: 1.5rem; }
        .guide-content .social-links a { color: var(--color-text); text-decoration: none; transition: color 0.3s ease; }
        .guide-content .social-links a:hover { color: var(--color-accent); }
        @media (max-width: 1024px) {
            .guide-content .guide-container { grid-template-columns: 1fr; }
            .guide-content .sidebar { position: static; }
            .guide-content .nav-links { gap: 1.5rem; }
            .guide-content .sticky-bar { flex-direction: column; padding: 1rem; }
            .guide-content .sticky-bar .btn { width: 100%; }
            .guide-content .footer-content { grid-template-columns: repeat(2, 1fr); }
            .guide-content .hero-content { grid-template-columns: 1fr; gap: 2rem; }
            .guide-content .hero-svg { height: 300px; }
        }
        @media (max-width: 768px) {
            .guide-content .hero-section { padding: 60px 1.5rem 40px; }
            .guide-content .guide-container { padding: 40px 1.5rem; }
            .guide-content nav { padding: 1rem 1.5rem; }
            .guide-content .nav-links { gap: 1rem; }
            .guide-content nav a { font-size: 0.9rem; }
            .guide-content h1 { font-size: 1.75rem; }
            .guide-content { padding: 1.5rem; }
            .guide-content .footer-content { grid-template-columns: 1fr; }
            .guide-content .sticky-bar { bottom: 60px; }
            .guide-content .cookie-banner { left: 1rem; right: 1rem; max-width: none; bottom: 70px; }
            .guide-content .back-to-top { right: 1rem; width: 45px; height: 45px; font-size: 1.25rem; }
        }
        @media (max-width: 480px) {
            .guide-content .nav-container { flex-direction: column; gap: 1rem; }
            .guide-content .nav-links { flex-direction: column; gap: 0.5rem; width: 100%; }
            .guide-content h1 { font-size: 1.5rem; }
            .guide-content .guide-container { padding: 50px 1rem; }
            .guide-content { padding: 1.25rem; }
            .guide-content .btn { width: 100%; }
            .guide-content .sticky-bar { bottom: 50px; padding: 0.75rem; }
            .guide-content .sticky-message { text-align: center; font-size: 0.9rem; }
            .guide-content .cookie-banner { left: 0.5rem; right: 0.5rem; bottom: 60px; padding: 1rem; }
        }
    
      `}</style>
      <div
        className="guide-content"
        dangerouslySetInnerHTML={{ __html: `<section class="hero-section">\n            <div class="hero-content">\n                <div class="hero-text">\n                    <h1>CMMC Compliance for AI Systems</h1>\n                    <p>Defense contractors must achieve CMMC certification for cybersecurity maturity. This guide shows how to integrate AI systems with CMMC requirements across all maturity levels and achieve compliance.</p>\n                    <a href="#steps" class="btn">Start Guide</a>\n                </div>\n                <div class="hero-svg">\n                    <svg viewBox="0 0 400 350" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 20px 40px rgba(212, 168, 67, 0.2));">\n                        <!-- Levels pyramid -->\n                        <g opacity="0.8">\n                            <rect x="50" y="280" width="300" height="50" fill="none" stroke="#D4A843" stroke-width="2"/>\n                            <rect x="100" y="210" width="200" height="50" fill="none" stroke="#D4A843" stroke-width="2"/>\n                            <rect x="150" y="140" width="100" height="50" fill="none" stroke="#D4A843" stroke-width="2"/>\n                            <text x="200" y="310" font-size="14" fill="#D4A843" text-anchor="middle" font-weight="600">Level 3</text>\n                            <text x="200" y="240" font-size="14" fill="#D4A843" text-anchor="middle" font-weight="600">Level 2</text>\n                            <text x="200" y="170" font-size="14" fill="#D4A843" text-anchor="middle" font-weight="600">Level 1</text>\n                        </g>\n                        <!-- Connection lines -->\n                        <g stroke="#E8B76D" stroke-width="1.5" opacity="0.6">\n                            <line x1="100" y1="210" x2="150" y2="140"/>\n                            <line x1="300" y1="210" x2="250" y2="140"/>\n                            <line x1="50" y1="280" x2="100" y2="210"/>\n                            <line x1="350" y1="280" x2="300" y2="210"/>\n                        </g>\n                        <!-- Checkmarks -->\n                        <g opacity="0.7">\n                            <text x="80" y="310" font-size="20" fill="#4CAF50">✓</text>\n                            <text x="180" y="240" font-size="20" fill="#4CAF50">✓</text>\n                            <text x="220" y="170" font-size="20" fill="#4CAF50">✓</text>\n                        </g>\n                    </svg>\n                </div>\n            </div>\n        </section>\n<div class="breadcrumbs">\n            <a href="/">Home</a> <span>/</span> <a href="/guides">Guides</a> <span>/</span> <span>CMMC for AI</span>\n        </div>\n<div class="guide-container" id="steps">\n            <div class="guide-content">\n\n                <div class="step">\n                    <div class="step-number">1</div>\n<button class="back-to-top" id="backToTop" title="Back to top"></button>` }}
      />
    </div>
  );
}
