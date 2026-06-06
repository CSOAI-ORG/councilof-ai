import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Phone, Facebook, Linkedin, Menu, X, ChevronDown } from "lucide-react";
import Logo from "@/components/Logo";
import WhatsAppButton from "@/components/WhatsAppButton";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [servicesDropdownOpen, setServicesDropdownOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-[hsl(var(--gts-navy))] shadow-md">
      {/* Top Bar */}
      <div className="bg-[hsl(var(--gts-navy))] text-white py-2">
        <div className="container mx-auto px-4 flex justify-between items-center text-sm">
          <div className="flex items-center space-x-4">
            <Phone className="w-4 h-4 text-[hsl(var(--gts-yellow))]" />
            <a 
              href="tel:07958710548" 
              className="text-[hsl(var(--gts-yellow))] font-semibold transition-colors"
            >
              07958 710 548
            </a>
            <span className="hidden md:inline text-[hsl(var(--gts-yellow))]">|</span>
            <span className="hidden md:inline text-[hsl(var(--gts-yellow))]">24/7 Service Available</span>
          </div>
          <div className="flex items-center space-x-4">
            <a 
              href="https://facebook.com/gtsgrabhire" 
              className="text-[hsl(var(--gts-yellow))] transition-all duration-200 hover:scale-110"
              aria-label="Follow us on Facebook"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Facebook className="w-4 h-4" />
            </a>
            <a 
              href="https://linkedin.com/company/gts-grab-hire" 
              className="text-[hsl(var(--gts-yellow))] transition-all duration-200 hover:scale-110"
              aria-label="Connect on LinkedIn"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Linkedin className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="bg-[hsl(var(--gts-navy))] py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <Link to="/" className="flex items-center" aria-label="GTS Grab Hire home">
            <Logo height={60} />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            <NavLink 
              to="/" 
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              Home
            </NavLink>
            <NavLink 
              to="/about" 
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              About
            </NavLink>
            
            {/* Services Dropdown */}
            <div 
              className="relative group"
              onMouseEnter={() => setServicesDropdownOpen(true)}
              onMouseLeave={() => setServicesDropdownOpen(false)}
            >
              <button className="nav-link flex items-center">
                Services <ChevronDown className="ml-1 w-4 h-4" />
              </button>
              <div className={`absolute top-full left-0 bg-white shadow-lg rounded-md py-2 w-56 z-10 transition-all duration-200 ${
                servicesDropdownOpen ? 'opacity-100 visible transform translate-y-0' : 'opacity-0 invisible transform -translate-y-2'
              }`}>
                <Link 
                  to="/services" 
                  className="block px-4 py-2 text-sm text-[hsl(var(--gts-dark))] hover:bg-[hsl(var(--gts-yellow))] hover:bg-opacity-10 hover:text-[hsl(var(--gts-yellow))] transition-colors"
                >
                  Our Services Overview
                </Link>
                <Link 
                  to="/services/muck-away" 
                  className="block px-4 py-2 text-sm text-[hsl(var(--gts-dark))] hover:bg-[hsl(var(--gts-yellow))] hover:bg-opacity-10 hover:text-[hsl(var(--gts-yellow))] transition-colors"
                >
                  Muck Away Services
                </Link>
                <Link 
                  to="/services/grab-hire" 
                  className="block px-4 py-2 text-sm text-[hsl(var(--gts-dark))] hover:bg-[hsl(var(--gts-yellow))] hover:bg-opacity-10 hover:text-[hsl(var(--gts-yellow))] transition-colors"
                >
                  Grab Hire Services
                </Link>
                <Link 
                  to="/services/aggregates" 
                  className="block px-4 py-2 text-sm text-[hsl(var(--gts-dark))] hover:bg-[hsl(var(--gts-yellow))] hover:bg-opacity-10 hover:text-[hsl(var(--gts-yellow))] transition-colors"
                >
                  Aggregates Supply
                </Link>
                <Link 
                  to="/services/utilities" 
                  className="block px-4 py-2 text-sm text-[hsl(var(--gts-dark))] hover:bg-[hsl(var(--gts-yellow))] hover:bg-opacity-10 hover:text-[hsl(var(--gts-yellow))] transition-colors"
                >
                  Utilities Services
                </Link>
                <Link 
                  to="/services/tipper-hire" 
                  className="block px-4 py-2 text-sm text-[hsl(var(--gts-dark))] hover:bg-[hsl(var(--gts-yellow))] hover:bg-opacity-10 hover:text-[hsl(var(--gts-yellow))] transition-colors"
                >
                  Tipper Hire
                </Link>
                <Link 
                  to="/services/skip-hire-alternative" 
                  className="block px-4 py-2 text-sm text-[hsl(var(--gts-dark))] hover:bg-[hsl(var(--gts-yellow))] hover:bg-opacity-10 hover:text-[hsl(var(--gts-yellow))] transition-colors"
                >
                  Skip Hire Alternative
                </Link>
                <Link 
                  to="/services/construction-waste" 
                  className="block px-4 py-2 text-sm text-[hsl(var(--gts-dark))] hover:bg-[hsl(var(--gts-yellow))] hover:bg-opacity-10 hover:text-[hsl(var(--gts-yellow))] transition-colors"
                >
                  Construction Waste
                </Link>
                <Link 
                  to="/services/garden-waste" 
                  className="block px-4 py-2 text-sm text-[hsl(var(--gts-dark))] hover:bg-[hsl(var(--gts-yellow))] hover:bg-opacity-10 hover:text-[hsl(var(--gts-yellow))] transition-colors"
                >
                  Garden Waste
                </Link>
                <Link 
                  to="/services/commercial-waste" 
                  className="block px-4 py-2 text-sm text-[hsl(var(--gts-dark))] hover:bg-[hsl(var(--gts-yellow))] hover:bg-opacity-10 hover:text-[hsl(var(--gts-yellow))] transition-colors"
                >
                  Commercial Waste
                </Link>
                <Link 
                  to="/services/emergency-waste" 
                  className="block px-4 py-2 text-sm text-[hsl(var(--gts-dark))] hover:bg-[hsl(var(--gts-yellow))] hover:bg-opacity-10 hover:text-[hsl(var(--gts-yellow))] transition-colors"
                >
                  Emergency Waste
                </Link>
                <Link 
                  to="/services/soil-disposal" 
                  className="block px-4 py-2 text-sm text-[hsl(var(--gts-dark))] hover:bg-[hsl(var(--gts-yellow))] hover:bg-opacity-10 hover:text-[hsl(var(--gts-yellow))] transition-colors"
                >
                  Soil Disposal
                </Link>
                <Link 
                  to="/services/waste-removal" 
                  className="block px-4 py-2 text-sm text-[hsl(var(--gts-dark))] hover:bg-[hsl(var(--gts-yellow))] hover:bg-opacity-10 hover:text-[hsl(var(--gts-yellow))] transition-colors"
                >
                  Waste Removal
                </Link>
              </div>
            </div>
            
            
            <NavLink 
              to="/faq" 
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              FAQ
            </NavLink>
            
            <NavLink 
              to="/locations" 
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              Locations
            </NavLink>
            <NavLink 
              to="/contact" 
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              Contact
            </NavLink>
          </div>

          <WhatsAppButton />
          {/* CTA Button */}
          <Button asChild variant="cta" className="hidden md:flex">
            <Link to="/quote">Get Quote</Link>
          </Button>

          {/* Mobile Menu Button */}
          <button 
            className="lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-[hsl(var(--gts-yellow))]" />
            ) : (
              <Menu className="w-6 h-6 text-[hsl(var(--gts-yellow))]" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        <div className={`lg:hidden bg-white border-t backdrop-blur-lg bg-white/95 transform transition-all duration-300 ease-in-out overflow-hidden ${
          mobileMenuOpen 
            ? 'max-h-screen opacity-100 translate-y-0' 
            : 'max-h-0 opacity-0 -translate-y-2'
        }`}>
          <div className="container mx-auto px-4 py-4 space-y-4">
            <NavLink 
              to="/" 
              className="block nav-link text-[hsl(var(--gts-dark))] hover:text-[hsl(var(--gts-yellow))] py-2 transform transition-all duration-200 hover:translate-x-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </NavLink>
            <NavLink 
              to="/about" 
              className="block nav-link text-[hsl(var(--gts-dark))] hover:text-[hsl(var(--gts-yellow))] py-2 transform transition-all duration-200 hover:translate-x-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              About
            </NavLink>
            
            {/* Services Dropdown for Mobile */}
            <div className="space-y-2">
              <button
                onClick={() => setMobileServicesOpen(!mobileServicesOpen)}
                className="flex items-center justify-between w-full nav-link text-[hsl(var(--gts-dark))] hover:text-[hsl(var(--gts-yellow))] py-2 transform transition-all duration-200 hover:translate-x-2"
              >
                Services
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${mobileServicesOpen ? 'rotate-180' : ''}`} />
              </button>
              <div className={`overflow-hidden transition-all duration-300 ${mobileServicesOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="pl-4 space-y-2 border-l-2 border-[hsl(var(--gts-yellow))]">
                  <Link 
                    to="/services" 
                    className="block text-sm text-[hsl(var(--gts-dark))] hover:text-[hsl(var(--gts-yellow))] py-1"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Our Services Overview
                  </Link>
                  <Link 
                    to="/services/muck-away" 
                    className="block text-sm text-[hsl(var(--gts-dark))] hover:text-[hsl(var(--gts-yellow))] py-1"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Muck Away Services
                  </Link>
                  <Link 
                    to="/services/grab-hire" 
                    className="block text-sm text-[hsl(var(--gts-dark))] hover:text-[hsl(var(--gts-yellow))] py-1"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Grab Hire Services
                  </Link>
                  <Link 
                    to="/services/aggregates" 
                    className="block text-sm text-[hsl(var(--gts-dark))] hover:text-[hsl(var(--gts-yellow))] py-1"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Aggregates Supply
                  </Link>
                  <Link 
                    to="/services/utilities" 
                    className="block text-sm text-[hsl(var(--gts-dark))] hover:text-[hsl(var(--gts-yellow))] py-1"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Utilities Services
                  </Link>
                  <Link 
                    to="/services/tipper-hire" 
                    className="block text-sm text-[hsl(var(--gts-dark))] hover:text-[hsl(var(--gts-yellow))] py-1"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Tipper Hire
                  </Link>
                  <Link 
                    to="/services/skip-hire-alternative" 
                    className="block text-sm text-[hsl(var(--gts-dark))] hover:text-[hsl(var(--gts-yellow))] py-1"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Skip Hire Alternative
                  </Link>
                  <Link 
                    to="/services/construction-waste" 
                    className="block text-sm text-[hsl(var(--gts-dark))] hover:text-[hsl(var(--gts-yellow))] py-1"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Construction Waste
                  </Link>
                  <Link 
                    to="/services/garden-waste" 
                    className="block text-sm text-[hsl(var(--gts-dark))] hover:text-[hsl(var(--gts-yellow))] py-1"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Garden Waste
                  </Link>
                  <Link 
                    to="/services/commercial-waste" 
                    className="block text-sm text-[hsl(var(--gts-dark))] hover:text-[hsl(var(--gts-yellow))] py-1"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Commercial Waste
                  </Link>
                  <Link 
                    to="/services/emergency-waste" 
                    className="block text-sm text-[hsl(var(--gts-dark))] hover:text-[hsl(var(--gts-yellow))] py-1"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Emergency Waste
                  </Link>
                  <Link 
                    to="/services/soil-disposal" 
                    className="block text-sm text-[hsl(var(--gts-dark))] hover:text-[hsl(var(--gts-yellow))] py-1"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Soil Disposal
                  </Link>
                  <Link 
                    to="/services/waste-removal" 
                    className="block text-sm text-[hsl(var(--gts-dark))] hover:text-[hsl(var(--gts-yellow))] py-1"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Waste Removal
                  </Link>
                </div>
              </div>
            </div>

            
            <NavLink 
              to="/faq" 
              className="block nav-link text-[hsl(var(--gts-dark))] hover:text-[hsl(var(--gts-yellow))] py-2 transform transition-all duration-200 hover:translate-x-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              FAQ
            </NavLink>
            <NavLink 
              to="/locations" 
              className="block nav-link text-[hsl(var(--gts-dark))] hover:text-[hsl(var(--gts-yellow))] py-2 transform transition-all duration-200 hover:translate-x-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Locations
            </NavLink>
            <NavLink 
              to="/contact" 
              className="block nav-link text-[hsl(var(--gts-dark))] hover:text-[hsl(var(--gts-yellow))] py-2 transform transition-all duration-200 hover:translate-x-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Contact
            </NavLink>
            <div className="pt-4 border-t border-gray-200">
              <Button asChild className="btn-primary w-full transform transition-all duration-200 hover:scale-105">
                <Link to="/quote" onClick={() => setMobileMenuOpen(false)}>Get Quote</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;