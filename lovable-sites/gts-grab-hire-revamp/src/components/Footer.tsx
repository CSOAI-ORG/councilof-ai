import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, Clock, Facebook, Linkedin } from "lucide-react";
import Logo from "@/components/Logo";
import WhatsAppButton from "@/components/WhatsAppButton";

const Footer = () => {
  return (
    <footer className="bg-[hsl(var(--gts-navy))] text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <Logo white height={44} />
            <p className="text-gray-300 leading-relaxed">
              Professional grab hire and waste management services across Kent, London, and Essex. 
              Family-run business with over 35 years of experience.
            </p>
            <div className="flex space-x-4">
              <a 
                href="https://facebook.com/gtsgrabhire" 
                className="text-gray-300 hover:text-[hsl(var(--gts-yellow))] transition-all duration-200 hover:scale-110"
                aria-label="Follow us on Facebook"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a 
                href="https://linkedin.com/company/gts-grab-hire" 
                className="text-gray-300 hover:text-[hsl(var(--gts-yellow))] transition-all duration-200 hover:scale-110"
                aria-label="Connect on LinkedIn"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <WhatsAppButton 
                size="sm"
                className="text-gray-300 hover:text-[hsl(var(--gts-yellow))] bg-transparent border-0"
              />
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-[hsl(var(--gts-yellow))]">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-300 hover:text-[hsl(var(--gts-yellow))] transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-300 hover:text-[hsl(var(--gts-yellow))] transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/services" className="text-gray-300 hover:text-[hsl(var(--gts-yellow))] transition-colors">
                  Services
                </Link>
              </li>
              <li>
                <Link to="/locations" className="text-gray-300 hover:text-[hsl(var(--gts-yellow))] transition-colors">
                  Locations
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-300 hover:text-[hsl(var(--gts-yellow))] transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-gray-300 hover:text-[hsl(var(--gts-yellow))] transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Our Services */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-[hsl(var(--gts-yellow))]">Our Services</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/services/grab-hire" className="text-gray-300 hover:text-[hsl(var(--gts-yellow))] transition-colors">
                  Grab Hire
                </Link>
              </li>
              <li>
                <Link to="/services/muck-away" className="text-gray-300 hover:text-[hsl(var(--gts-yellow))] transition-colors">
                  Muck Away
                </Link>
              </li>
              <li>
                <Link to="/services/aggregates" className="text-gray-300 hover:text-[hsl(var(--gts-yellow))] transition-colors">
                  Aggregates Supply
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-[hsl(var(--gts-yellow))]">Contact Info</h4>
            <div className="space-y-3">
              <div className="flex items-center">
                <Phone className="w-5 h-5 mr-3 text-[hsl(var(--gts-yellow))]" />
                <a 
                  href="tel:07958710548" 
                  className="text-gray-300 hover:text-[hsl(var(--gts-yellow))] transition-colors"
                >
                  07958 710 548
                </a>
              </div>
              <div className="flex items-center">
                <Mail className="w-5 h-5 mr-3 text-[hsl(var(--gts-yellow))]" />
                <a 
                  href="mailto:contact@gtsgrabhire.co.uk" 
                  className="text-gray-300 hover:text-[hsl(var(--gts-yellow))] transition-colors break-all"
                >
                  contact@gtsgrabhire.co.uk
                </a>
              </div>
              <div className="flex items-center">
                <MapPin className="w-5 h-5 mr-3 text-[hsl(var(--gts-yellow))]" />
                <span className="text-gray-300">Essex, UK</span>
              </div>
              <div className="flex items-center">
                <Clock className="w-5 h-5 mr-3 text-[hsl(var(--gts-yellow))]" />
                <span className="text-gray-300">24/7 Service Available</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <p className="text-gray-300 text-sm">
            © 2024 GTS Grab Hire. All rights reserved. | Environment Agency Licensed Waste Carrier | 
            <Link to="/privacy" className="hover:text-[hsl(var(--gts-yellow))] ml-1">Privacy Policy</Link> | 
            <Link to="/terms" className="hover:text-[hsl(var(--gts-yellow))] ml-1">Terms of Service</Link>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;