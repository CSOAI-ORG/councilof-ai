import { useEffect, useState } from "react";
import { Menu, X, Package } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Close on Escape + lock body scroll while mobile menu is open
  useEffect(() => {
    if (!isMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isMenuOpen]);

  // SPA-safe scroll to a hash on the home route
  const goToTrades = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsMenuOpen(false);
    if (window.location.pathname === "/") {
      const el = document.getElementById("trade-verticals");
      el?.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate("/#trade-verticals");
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo / Brand */}
          <Link to="/" className="flex items-center gap-2" aria-label="Haulage.app home">
            <Package className="w-7 h-7 text-primary" aria-hidden="true" />
            <div className="font-display text-2xl font-bold">
              <span className="text-foreground">Haulage</span>
              <span className="text-primary">.app</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8" aria-label="Primary">
            <Link to="/" className="font-display text-sm uppercase tracking-wider text-foreground/80 hover:text-primary transition-colors duration-300">
              Home
            </Link>
            <a href="/#trade-verticals" onClick={goToTrades} className="font-display text-sm uppercase tracking-wider text-foreground/80 hover:text-primary transition-colors duration-300">
              Trades
            </a>
            <Link to="/mcps" className="font-display text-sm uppercase tracking-wider text-foreground/80 hover:text-primary transition-colors duration-300">
              MCPs
            </Link>
            <Link to="/about" className="font-display text-sm uppercase tracking-wider text-foreground/80 hover:text-primary transition-colors duration-300">
              About
            </Link>
            <Link to="/contact" className="font-display text-sm uppercase tracking-wider text-foreground/80 hover:text-primary transition-colors duration-300">
              Contact
            </Link>
          </nav>

          {/* CTA */}
          <div className="hidden lg:flex items-center gap-4">
            <Button variant="hero" size="lg" asChild>
              <a href="https://buy.stripe.com/14A4gB3K4eUWgYR56o8k836" target="_blank" rel="noopener noreferrer">
                Pro £79/mo
              </a>
            </Button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="lg:hidden text-foreground p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-nav"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <nav id="mobile-nav" aria-label="Mobile" className="lg:hidden bg-background border-t border-border">
          <div className="container mx-auto px-6 py-6 flex flex-col gap-2">
            <Link to="/" className="font-display text-lg uppercase tracking-wider text-foreground/80 hover:text-primary transition-colors py-3" onClick={() => setIsMenuOpen(false)}>
              Home
            </Link>
            <a href="/#trade-verticals" onClick={goToTrades} className="font-display text-lg uppercase tracking-wider text-foreground/80 hover:text-primary transition-colors py-3">
              Trades
            </a>
            <Link to="/mcps" className="font-display text-lg uppercase tracking-wider text-foreground/80 hover:text-primary transition-colors py-3" onClick={() => setIsMenuOpen(false)}>
              MCPs
            </Link>
            <Link to="/about" className="font-display text-lg uppercase tracking-wider text-foreground/80 hover:text-primary transition-colors py-3" onClick={() => setIsMenuOpen(false)}>
              About
            </Link>
            <Link to="/contact" className="font-display text-lg uppercase tracking-wider text-foreground/80 hover:text-primary transition-colors py-3" onClick={() => setIsMenuOpen(false)}>
              Contact
            </Link>
            <div className="pt-4 border-t border-border mt-2">
              <Button variant="hero" className="w-full" asChild>
                <a href="https://buy.stripe.com/14A4gB3K4eUWgYR56o8k836" target="_blank" rel="noopener noreferrer" onClick={() => setIsMenuOpen(false)}>
                  Pro £79/mo
                </a>
              </Button>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
};

export default Header;
