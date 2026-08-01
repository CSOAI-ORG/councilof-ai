import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './ProofOfTheme.css';
import StarsBackground from './components/StarsBackground';

// Import pages
import HomePage from './App'; // Original App.jsx as HomePage
import About from './pages/about/About';
import HowItWorks from './pages/how-it-works/HowItWorks';
import UseCases from './pages/use-cases/UseCases';
import BlogHub from './pages/blog/BlogHub';
import BlogPost from './pages/blog/BlogPost';
import Contact from './pages/contact/Contact';
import Terms from './pages/legal/Terms';
import Privacy from './pages/legal/Privacy';
import Cookies from './pages/legal/Cookies';
import SovereignTown from './pages/sovereign-town/SovereignTown';
import Layer0 from './pages/layer0/Layer0';
import OpenGridWorks from './pages/opengridworks/OpenGridWorks';
import System from './pages/system/System';
import FreeRiskCheck from './pages/free-risk-check/FreeRiskCheck';
import Atlas from './pages/atlas/Atlas';
import SoaiPdca from './pages/soai-pdca/SoaiPdca';
import McpFleet from './pages/mcp/McpFleet';
import Ledger from './pages/ledger/Ledger';
import Mythology from './pages/mythology/Mythology';

const Navigation = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <nav className="main-navigation">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <span className="logo-icon">CS</span>
          <span className="logo-text">CSOAI</span>
        </Link>

        <button
          className="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>

        <div className={`nav-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          <Link to="/about" onClick={() => setMobileMenuOpen(false)}>About</Link>
          <Link to="/how-it-works" onClick={() => setMobileMenuOpen(false)}>How It Works</Link>
          <Link to="/layer0" onClick={() => setMobileMenuOpen(false)}>Layer 0</Link>
          <Link to="/free-risk-check" onClick={() => setMobileMenuOpen(false)}>Free Check</Link>
          <Link to="/use-cases" onClick={() => setMobileMenuOpen(false)}>Use Cases</Link>
          <Link to="/blog" onClick={() => setMobileMenuOpen(false)}>Blog</Link>
          <Link to="/contact" onClick={() => setMobileMenuOpen(false)}>Contact</Link>
          <Link to="/contact" className="btn primary btn-nav" onClick={() => setMobileMenuOpen(false)}>
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
};

const Footer = () => {
  return (
    <footer className="main-footer">
      <div className="footer-container">
        <div className="footer-grid">
          <div className="footer-section">
            <h3>CSOAI</h3>
            <p>Council Safety of AI — AI governance, cybersecurity & safety</p>
            <div className="footer-social">
              <a href="https://www.linkedin.com/in/nicktempleman/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
              <a href="https://twitter.com/councilofai" target="_blank" rel="noopener noreferrer">Twitter</a>
              <a href="https://github.com/ai-safety-empire" target="_blank" rel="noopener noreferrer">GitHub</a>
            </div>
          </div>

          <div className="footer-section">
            <h4>Platform</h4>
            <Link to="/how-it-works">How It Works</Link>
            <Link to="/layer0">Layer 0</Link>
            <Link to="/free-risk-check">Free Risk Check</Link>
            <Link to="/use-cases">Use Cases</Link>
            <Link to="/soai-pdca">SOAI-PDCA</Link>
            <Link to="/atlas">Atlas</Link>
          </div>

          <div className="footer-section">
            <h4>Resources</h4>
            <Link to="/blog">Blog</Link>
            <Link to="/opengridworks">Reg Map</Link>
            <Link to="/mcp">MCP Fleet</Link>
            <Link to="/system">System</Link>
          </div>

          <div className="footer-section">
            <h4>Company</h4>
            <Link to="/about">About Us</Link>
            <Link to="/contact">Contact</Link>
            <a href="mailto:contact@councilof.ai">Support</a>
          </div>

          <div className="footer-section">
            <h4>Consumer</h4>
            <a href="https://meok.ai" target="_blank" rel="noopener noreferrer">MEOK — your AI world →</a>
          </div>

          <div className="footer-section">
            <h4>Legal</h4>
            <Link to="/legal/terms">Terms of Service</Link>
            <Link to="/legal/privacy">Privacy Policy</Link>
            <Link to="/legal/cookies">Cookie Policy</Link>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2026 AI Safety Governance Limited. All rights reserved.</p>
          <p>Registered in England & Wales</p>
        </div>
      </div>
    </footer>
  );
};

const AppWithRouter = () => {
  return (
    <Router>
      <div className="app-wrapper">
        <StarsBackground />
        <Navigation />
        
        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/layer0" element={<Layer0 />} />
            <Route path="/opengridworks" element={<OpenGridWorks />} />
            <Route path="/system" element={<System />} />
            <Route path="/free-risk-check" element={<FreeRiskCheck />} />
            <Route path="/atlas" element={<Atlas />} />
            <Route path="/soai-pdca" element={<SoaiPdca />} />
            <Route path="/mcp" element={<McpFleet />} />
            <Route path="/about" element={<About />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/use-cases" element={<UseCases />} />
            <Route path="/blog" element={<BlogHub />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/legal/terms" element={<Terms />} />
            <Route path="/legal/privacy" element={<Privacy />} />
            <Route path="/legal/cookies" element={<Cookies />} />
            <Route path="/sovereign-town" element={<SovereignTown />} />
            <Route path="/ledger" element={<Ledger />} />
            <Route path="/mythology" element={<Mythology />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </Router>
  );
};

export default AppWithRouter;
