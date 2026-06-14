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

const Navigation = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <nav className="main-navigation">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <span className="logo-icon">CO</span>
          <span className="logo-text">councilof.ai</span>
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
          <Link to="/use-cases" onClick={() => setMobileMenuOpen(false)}>Use Cases</Link>
          <Link to="/blog" onClick={() => setMobileMenuOpen(false)}>Blog</Link>
          <Link to="/contact" onClick={() => setMobileMenuOpen(false)}>Contact</Link>
          <a href="/#pricing" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
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
            <h3>councilof.ai</h3>
            <p>Democratic AI governance through the Council of 12 AIs</p>
            <div className="footer-social">
              <a href="https://www.linkedin.com/in/nicktempleman/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
              <a href="https://twitter.com/councilofai" target="_blank" rel="noopener noreferrer">Twitter</a>
              <a href="https://github.com/ai-safety-empire" target="_blank" rel="noopener noreferrer">GitHub</a>
            </div>
          </div>

          <div className="footer-section">
            <h4>Product</h4>
            <Link to="/how-it-works">How It Works</Link>
            <Link to="/use-cases">Use Cases</Link>
            <a href="/#pricing">Pricing</a>
            <a href="/#documentation">Documentation</a>
          </div>

          <div className="footer-section">
            <h4>Company</h4>
            <Link to="/about">About Us</Link>
            <Link to="/blog">Blog</Link>
            <Link to="/contact">Contact</Link>
            <a href="mailto:contact@councilof.ai">Support</a>
          </div>

          <div className="footer-section">
            <h4>AI Safety Empire</h4>
            <a href="https://proofof.ai" target="_blank" rel="noopener noreferrer">proofof.ai</a>
            <a href="https://asisecurity.ai" target="_blank" rel="noopener noreferrer">asisecurity.ai</a>
            <a href="https://agisafe.ai" target="_blank" rel="noopener noreferrer">agisafe.ai</a>
            <a href="https://transparencyof.ai" target="_blank" rel="noopener noreferrer">transparencyof.ai</a>
          </div>

          <div className="footer-section">
            <h4>Legal</h4>
            <Link to="/legal/terms">Terms of Service</Link>
            <Link to="/legal/privacy">Privacy Policy</Link>
            <Link to="/legal/cookies">Cookie Policy</Link>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2024 AI Safety Governance Limited. All rights reserved.</p>
          <p>Registered in England & Wales | Patent Pending Technology</p>
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
            <Route path="/about" element={<About />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/use-cases" element={<UseCases />} />
            <Route path="/blog" element={<BlogHub />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/legal/terms" element={<Terms />} />
            <Route path="/legal/privacy" element={<Privacy />} />
            <Route path="/legal/cookies" element={<Cookies />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </Router>
  );
};

export default AppWithRouter;

