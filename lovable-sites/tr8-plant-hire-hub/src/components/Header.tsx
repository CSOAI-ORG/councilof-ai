import { useState } from "react";
import { Menu, X, Phone, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import tr8Logo from "@/assets/tr8-logo-main.jpg";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);

  const serviceLinks = [
    { href: "/services/plant-hire", label: "Plant Hire" },
    { href: "/services/demolition", label: "Demolition" },
    { href: "/services/asbestos-removal", label: "Asbestos Removal" },
    { href: "/services/operated-hire", label: "Operated Hire" },
    { href: "/services/groundworks", label: "Groundworks" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img src={tr8Logo} alt="TR8 Plant Hire" className="h-14 w-auto" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            <Link to="/" className="font-display text-sm uppercase tracking-wider text-foreground/80 hover:text-primary transition-colors duration-300">
              Home
            </Link>
            
            {/* Services Dropdown */}
            <div className="relative group">
              <Link 
                to="/services" 
                className="font-display text-sm uppercase tracking-wider text-foreground/80 hover:text-primary transition-colors duration-300 flex items-center gap-1"
              >
                Services <ChevronDown className="w-4 h-4" />
              </Link>
              <div className="absolute top-full left-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <div className="bg-card border border-border rounded-lg shadow-xl py-2 min-w-[200px]">
                  {serviceLinks.map((link) => (
                    <Link
                      key={link.href}
                      to={link.href}
                      className="block px-4 py-2 text-sm text-foreground/80 hover:text-primary hover:bg-secondary transition-colors"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <Link to="/equipment-hire" className="font-display text-sm uppercase tracking-wider text-foreground/80 hover:text-primary transition-colors duration-300">
              Equipment
            </Link>
            <Link to="/about" className="font-display text-sm uppercase tracking-wider text-foreground/80 hover:text-primary transition-colors duration-300">
              About
            </Link>
            <Link to="/contact" className="font-display text-sm uppercase tracking-wider text-foreground/80 hover:text-primary transition-colors duration-300">
              Contact
            </Link>
          </nav>

          {/* CTA Button */}
          <div className="hidden lg:flex items-center gap-4">
            <a href="tel:07746159640" className="flex items-center gap-2 text-primary font-display">
              <Phone className="w-5 h-5" />
              <span className="font-bold">07746 159 640</span>
            </a>
            <Button variant="hero" size="lg" asChild>
              <Link to="/equipment-hire">Book Equipment</Link>
            </Button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="lg:hidden text-foreground p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden bg-background border-t border-border">
          <nav className="container mx-auto px-6 py-6 flex flex-col gap-2">
            <Link to="/" className="font-display text-lg uppercase tracking-wider text-foreground/80 hover:text-primary transition-colors py-3" onClick={() => setIsMenuOpen(false)}>
              Home
            </Link>
            
            {/* Mobile Services Accordion */}
            <button 
              onClick={() => setServicesOpen(!servicesOpen)}
              className="font-display text-lg uppercase tracking-wider text-foreground/80 hover:text-primary transition-colors py-3 flex items-center justify-between w-full"
            >
              Services <ChevronDown className={`w-5 h-5 transition-transform ${servicesOpen ? 'rotate-180' : ''}`} />
            </button>
            {servicesOpen && (
              <div className="pl-4 space-y-1 border-l-2 border-primary/30 ml-2">
                <Link to="/services" className="block py-2 text-foreground/70 hover:text-primary" onClick={() => setIsMenuOpen(false)}>
                  All Services
                </Link>
                {serviceLinks.map((link) => (
                  <Link key={link.href} to={link.href} className="block py-2 text-foreground/70 hover:text-primary" onClick={() => setIsMenuOpen(false)}>
                    {link.label}
                  </Link>
                ))}
              </div>
            )}

            <Link to="/equipment-hire" className="font-display text-lg uppercase tracking-wider text-foreground/80 hover:text-primary transition-colors py-3" onClick={() => setIsMenuOpen(false)}>
              Equipment
            </Link>
            <Link to="/about" className="font-display text-lg uppercase tracking-wider text-foreground/80 hover:text-primary transition-colors py-3" onClick={() => setIsMenuOpen(false)}>
              About
            </Link>
            <Link to="/contact" className="font-display text-lg uppercase tracking-wider text-foreground/80 hover:text-primary transition-colors py-3" onClick={() => setIsMenuOpen(false)}>
              Contact
            </Link>
            
            <div className="pt-4 border-t border-border mt-2">
              <a href="tel:07746159640" className="flex items-center gap-2 text-primary font-display py-2">
                <Phone className="w-5 h-5" />
                <span className="font-bold">07746 159 640</span>
              </a>
              <Button variant="hero" className="mt-4 w-full" asChild>
                <Link to="/equipment-hire" onClick={() => setIsMenuOpen(false)}>Book Equipment</Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
