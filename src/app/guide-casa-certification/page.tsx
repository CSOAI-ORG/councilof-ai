import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How to Get CASA Certified | Complete Certification Guide",
  description: "Complete guide to CASA certification: 3 levels (Commercial $5-25K, Government $25-100K, Defense $100-500K), process, requirements, timeline, and post-certification support.",
  alternates: { canonical: "/guide-casa-certification" },
  openGraph: {
    title: "How to Get CASA Certified",
    description: "Step-by-step guide to AI safety certification across all three CASA levels.",
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
    { "@type": "ListItem", position: 3, name: "How to Get CASA Certified", item: "https://csoai.org/guide-casa-certification" },
  ],
};

export default function GuideCasaCertificationPage() {
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
            --easing: cubic-bezier(0.16, 1, 0.3, 1);
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
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-image: radial-gradient(circle, rgba(212, 168, 67, 0.15) 1px, transparent 1px);
            background-size: 50px 50px;
            pointer-events: none;
            z-index: 0;
            animation: drift 20s ease-in-out infinite;
        }

        @keyframes drift {
            0%, 100% { background-position: 0 0; }
            50% { background-position: 20px 20px; }
        }

        @keyframes fadeUp {
            from { opacity: 0; transform: translateY(60px); }
            to { opacity: 1; transform: translateY(0); }
        }

        @keyframes particle-float {
            0% { opacity: 0; transform: translateY(100px) translateX(0px); }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { opacity: 0; transform: translateY(-100px) translateX(50px); }
        }

        /* Particle background */
        .guide-content .particles {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 0;
        }

        .guide-content .particle {
            position: absolute;
            width: 3px;
            height: 3px;
            background: var(--color-accent);
            border-radius: 50%;
            opacity: 0.4;
        }

        .guide-content .particle:nth-child(1) { left: 10%; top: 20%; animation: particle-float 15s ease-in-out infinite; }
        .guide-content .particle:nth-child(2) { left: 20%; top: 60%; animation: particle-float 18s ease-in-out infinite; animation-delay: 2s; }
        .guide-content .particle:nth-child(3) { left: 30%; top: 30%; animation: particle-float 20s ease-in-out infinite; animation-delay: 4s; }
        .guide-content .particle:nth-child(4) { left: 50%; top: 50%; animation: particle-float 22s ease-in-out infinite; animation-delay: 1s; }
        .guide-content .particle:nth-child(5) { left: 70%; top: 40%; animation: particle-float 19s ease-in-out infinite; animation-delay: 3s; }
        .guide-content .particle:nth-child(6) { left: 80%; top: 70%; animation: particle-float 21s ease-in-out infinite; animation-delay: 0s; }
        .guide-content .particle:nth-child(7) { left: 15%; top: 80%; animation: particle-float 17s ease-in-out infinite; animation-delay: 5s; }
        .guide-content .particle:nth-child(8) { left: 85%; top: 20%; animation: particle-float 23s ease-in-out infinite; animation-delay: 2.5s; }
        .guide-content .particle:nth-child(9) { left: 40%; top: 15%; animation: particle-float 20s ease-in-out infinite; animation-delay: 3.5s; }
        .guide-content .particle:nth-child(10) { left: 60%; top: 75%; animation: particle-float 18s ease-in-out infinite; animation-delay: 1.5s; }

        .guide-content main { position: relative; z-index: 1; }

        .guide-content h1 { font-size: clamp(2.5rem, 5vw, 4rem); font-weight: 800; color: var(--color-white); margin-bottom: 1rem; }
        .guide-content h2 { font-size: 1.75rem; font-weight: 700; color: var(--color-white); margin-top: 2.5rem; margin-bottom: 1.5rem; }
        .guide-content h3 { font-size: 1.25rem; font-weight: 700; color: var(--color-white); margin-top: 1.75rem; margin-bottom: 1rem; }
        .guide-content p { font-size: 1rem; line-height: 1.8; color: var(--color-text); margin-bottom: 1.25rem; }

        .guide-content .progress-bar {
            position: fixed;
            top: 0;
            left: 0;
            height: 3px;
            background: linear-gradient(90deg, var(--color-accent) 0%, var(--color-accent-bright) 100%);
            z-index: 1000;
            animation: progressBar linear forwards;
        }

        @keyframes progressBar {
            0% { width: 0%; }
            100% { width: 100%; }
        }

        .guide-content .breadcrumb {
            max-width: 1200px;
            margin: 2rem auto 0;
            padding: 0 2rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.9rem;
            color: var(--color-text);
            position: relative;
            z-index: 2;
        }

        .guide-content .breadcrumb a {
            color: var(--color-accent);
            text-decoration: none;
            transition: color 0.3s;
        }

        .guide-content .breadcrumb a:hover {
            color: var(--color-accent-bright);
        }

        .guide-content .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            padding: 1rem 2rem;
            background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-bright) 100%);
            color: var(--color-dark);
            border: none;
            border-radius: 12px;
            font-weight: 600;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 10px 30px rgba(212, 168, 67, 0.25);
            text-decoration: none;
        }

        .guide-content .btn:hover { transform: translateY(-2px); box-shadow: 0 15px 45px rgba(212, 168, 67, 0.4); }
        .guide-content .btn-small { padding: 0.75rem 1.5rem; font-size: 0.95rem; }

        .guide-content nav {
            position: sticky;
            top: 0;
            z-index: 100;
            padding: 1.5rem 2rem;
            backdrop-filter: blur(10px);
            border-bottom: 1px solid rgba(212, 168, 67, 0.2);
            background: rgba(13, 11, 33, 0.7);
        }

        .guide-content .nav-container { max-width: 1400px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; }
        .guide-content .logo { display: flex; align-items: center; gap: 0.75rem; font-size: 1.5rem; font-weight: 800; color: var(--color-white); }
        .guide-content .logo-dot { width: 12px; height: 12px; background: var(--color-accent); border-radius: 50%; animation: pulse 2s ease-in-out infinite; }
        @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
        .guide-content .nav-links { display: flex; gap: 2rem; align-items: center; }
        .guide-content nav a { color: var(--color-text); text-decoration: none; font-weight: 500; transition: color 0.3s ease; }
        .guide-content nav a:hover { color: var(--color-accent); }

        .guide-content .guide-container { max-width: 1200px; margin: 0 auto; padding: 80px 2rem; position: relative; z-index: 1; display: grid; grid-template-columns: 1fr 300px; gap: 3rem; }
        .guide-content {
            background: var(--color-glass-bg);
            border: 1px solid var(--color-glass-border);
            backdrop-filter: blur(20px);
            border-radius: 16px;
            padding: 3rem;
            animation: fadeUp 0.8s ease-out;
        }

        .guide-content .step { margin-bottom: 3.5rem; padding-bottom: 2.5rem; border-bottom: 1px solid var(--color-glass-border); }
        .guide-content .step:last-child { border-bottom: none; }
        .guide-content .step-number {
            display: inline-flex;
            width: 50px;
            height: 50px;
            align-items: center;
            justify-content: center;
            font-size: 1.75rem;
            font-weight: 800;
            background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-bright) 100%);
            color: var(--color-dark);
            border-radius: 50%;
            margin-bottom: 1.25rem;
            box-shadow: 0 10px 30px rgba(212, 168, 67, 0.3);
        }

        .guide-content ul { margin-left: 1.5rem; margin-bottom: 1.25rem; }
        .guide-content li { margin-bottom: 0.75rem; color: var(--color-text); }

        .guide-content .sidebar { position: sticky; top: 120px; height: fit-content; }
        .guide-content .certification-tiers {
            background: var(--color-glass-bg);
            border: 1px solid var(--color-glass-border);
            backdrop-filter: blur(20px);
            border-radius: 16px;
            padding: 1.5rem;
            margin-bottom: 2rem;
        }

        .guide-content .tier-item {
            padding: 1rem;
            margin-bottom: 0.75rem;
            background: rgba(212, 168, 67, 0.08);
            border-left: 3px solid var(--color-accent);
            border-radius: 6px;
            font-size: 0.9rem;
            transition: all 0.3s;
        }

        .guide-content .tier-item:hover {
            background: rgba(212, 168, 67, 0.12);
            transform: translateX(4px);
        }

        .guide-content .tier-item strong { color: var(--color-accent); }

        .guide-content .checklist { background: var(--color-glass-bg); border: 1px solid var(--color-glass-border); backdrop-filter: blur(20px); border-radius: 16px; padding: 2rem; margin-bottom: 2rem; }
        .guide-content .checklist h4 { color: var(--color-accent); font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 1.5rem; font-weight: 700; }
        .guide-content .checklist-item { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; font-size: 0.9rem; color: var(--color-text); }
        .guide-content .checklist-item input { width: 18px; height: 18px; cursor: pointer; accent-color: var(--color-accent); }

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

        .guide-content .back-to-top {
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            width: 50px;
            height: 50px;
            background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-bright) 100%);
            border: none;
            border-radius: 50%;
            color: var(--color-dark);
            font-size: 1.2rem;
            cursor: pointer;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s;
            z-index: 999;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 10px 30px rgba(212, 168, 67, 0.4);
            font-weight: 800;
        }

        .guide-content .back-to-top.show {
            opacity: 1;
            visibility: visible;
        }

        .guide-content .back-to-top:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 40px rgba(212, 168, 67, 0.5);
        }

        .guide-content .sticky-bar {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            z-index: 99;
            padding: 1.5rem 2rem;
            background: rgba(13, 11, 33, 0.8);
            backdrop-filter: blur(10px);
            border-top: 1px solid rgba(212, 168, 67, 0.2);
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 2rem;
            flex-wrap: wrap;
        }

        .guide-content .sticky-message { font-size: 1rem; font-weight: 500; color: var(--color-text); flex: 1; min-width: 200px; }

        .guide-content .cookie-banner {
            position: fixed;
            bottom: 80px;
            left: 2rem;
            z-index: 98;
            background: var(--color-glass-bg);
            border: 1px solid var(--color-glass-border);
            backdrop-filter: blur(20px);
            border-radius: 16px;
            padding: 1.5rem;
            max-width: 300px;
            animation: slideUp 0.5s ease;
        }

        @keyframes slideUp {
            from { transform: translateY(100px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }

        .guide-content .cookie-text { font-size: 0.85rem; color: var(--color-text); margin-bottom: 1rem; }
        .guide-content .cookie-buttons { display: flex; gap: 0.75rem; flex-direction: column; }
        .guide-content .cookie-buttons button { padding: 0.5rem 1rem; border: none; border-radius: 6px; font-weight: 600; font-size: 0.85rem; cursor: pointer; transition: all 0.3s ease; }
        .guide-content .cookie-accept { background: var(--color-accent); color: var(--color-dark); }
        .guide-content .cookie-decline { background: transparent; color: var(--color-accent); border: 1px solid var(--color-accent); }

        .guide-content footer {
            background: linear-gradient(135deg, #0A0820 0%, #0D0B21 100%);
            padding: 4rem 2rem 2rem;
            margin-top: 6rem;
            border-top: 1px solid rgba(212, 168, 67, 0.1);
            position: relative;
            z-index: 2;
        }

        .guide-content .footer-content { max-width: 1400px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 3rem; margin-bottom: 3rem; }
        .guide-content .footer-section h4 { color: var(--color-accent); font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 1.5rem; font-weight: 700; }
        .guide-content .footer-section ul { list-style: none; }
        .guide-content .footer-section a { color: var(--color-text); text-decoration: none; font-size: 0.95rem; display: block; margin-bottom: 0.75rem; transition: color 0.3s ease; }
        .guide-content .footer-section a:hover { color: var(--color-accent); }

        .guide-content .footer-bottom { border-top: 1px solid rgba(212, 168, 67, 0.1); padding-top: 2rem; text-align: center; color: var(--color-text); font-size: 0.9rem; max-width: 1400px; margin: 0 auto; }

        @media (max-width: 1024px) {
            .guide-content .guide-container { grid-template-columns: 1fr; }
            .guide-content .sidebar { position: static; }
        }

        @media (max-width: 768px) {
            .guide-content .guide-container { padding: 60px 1.5rem; }
            .guide-content { padding: 1.5rem; }
            .guide-content .sticky-bar { bottom: 60px; }
            .guide-content .cookie-banner { left: 1rem; right: 1rem; max-width: none; bottom: 70px; }
        }
    
      `}</style>
      <div
        className="guide-content"
        dangerouslySetInnerHTML={{ __html: `<div class="breadcrumb">\n            <a href="/">Home</a>\n            <span>/</span>\n            <a href="/guides">Guides</a>\n            <span>/</span>\n            <span>CASA Certification</span>\n        </div>\n<div class="guide-container">\n            <div class="guide-content">\n                <h1>How to Get CASA Certified</h1>\n                <p>CASA Certification provides institutional recognition of AI safety and governance compliance. This guide covers all three certification levels, the complete process, requirements, timelines, and ongoing support.</p>\n\n                <div class="step">\n                    <div class="step-number">1</div>\n<button class="back-to-top" id="backToTop" onclick="scrollToTop()">↑</button>` }}
      />
    </div>
  );
}
