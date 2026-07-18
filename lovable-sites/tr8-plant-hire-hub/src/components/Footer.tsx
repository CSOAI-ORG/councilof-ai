import { Phone, Facebook, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import tr8Logo from "@/assets/tr8-logo-main.jpg";

const Footer = () => {
  const services = [
    { label: "Plant Hire", href: "/services/plant-hire" },
    { label: "Demolition", href: "/services/demolition" },
    { label: "Asbestos Removal", href: "/services/asbestos-removal" },
    { label: "Operated Hire", href: "/services/operated-hire" },
    { label: "Groundworks", href: "/services/groundworks" },
  ];

  const quickLinks = [
    { label: "Home", href: "/" },
    { label: "Services", href: "/services" },
    { label: "Equipment Hire", href: "/equipment-hire" },
    { label: "About Us", href: "/about" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <footer className="bg-tr8-charcoal border-t border-border">
      {/* Main Footer */}
      <div className="container mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Logo & Description */}
          <div className="lg:col-span-1">
            <img src={tr8Logo} alt="TR8 Plant Hire" className="h-16 w-auto mb-6" />
            <p className="text-muted-foreground mb-6">
              Professional plant hire, demolition, and asbestos removal services. Quality equipment, experienced operators, reliable service.
            </p>
            <div className="flex gap-3">
              <a
                href="https://www.facebook.com/profile.php?id=100071545134459"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center hover:bg-primary transition-colors group"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5 text-muted-foreground group-hover:text-primary-foreground" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-display text-lg font-bold mb-6 text-foreground">Quick Links</h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group"
                  >
                    <ArrowRight className="w-4 h-4 opacity-0 -ml-6 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-display text-lg font-bold mb-6 text-foreground">Services</h3>
            <ul className="space-y-3">
              {services.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group"
                  >
                    <ArrowRight className="w-4 h-4 opacity-0 -ml-6 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-display text-lg font-bold mb-6 text-foreground">Contact Us</h3>
            <div className="space-y-4">
              <a 
                href="tel:07746159640" 
                className="flex items-center gap-3 text-primary font-display text-xl font-bold hover:text-accent transition-colors"
              >
                <Phone className="w-6 h-6" />
                07746 159 640
              </a>
              <p className="text-muted-foreground text-sm">
                <strong className="text-foreground">Hours:</strong><br />
                Mon - Sat: 7am - 6pm<br />
                24/7 Emergency Callout
              </p>
              <p className="text-muted-foreground text-sm">
                <strong className="text-foreground">Service Area:</strong><br />
                Local area and beyond<br />
                Nationwide delivery available
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border">
        <div className="container mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-muted-foreground text-sm text-center md:text-left">
              © {new Date().getFullYear()} TR8 Plant Hire & Services. All rights reserved.
            </p>
            <p className="text-muted-foreground text-xs">
              Demolition • Plant Hire • Asbestos Removal • Groundworks
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
