import { Phone, Mail, MapPin, Clock, Facebook } from "lucide-react";
import { Button } from "@/components/ui/button";

const Contact = () => {
  return (
    <section id="contact" className="py-24 bg-background relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="text-primary font-display uppercase tracking-wider text-sm">Get In Touch</span>
          <h2 className="font-display text-4xl md:text-5xl font-bold mt-4 mb-6">
            Ready to <span className="text-gradient">Start</span>?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Contact us today for a free quote. We're here to help with all your plant hire and demolition needs.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
          {/* Contact Info */}
          <div className="space-y-8">
            <div className="card-industrial p-6 flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Phone className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold mb-1">Phone</h3>
                <a href="tel:07746159640" className="text-primary text-xl font-bold hover:underline">
                  07746 159 640
                </a>
                <p className="text-muted-foreground text-sm mt-1">Call or WhatsApp anytime</p>
              </div>
            </div>

            <div className="card-industrial p-6 flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Facebook className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold mb-1">Facebook</h3>
                <a 
                  href="https://www.facebook.com/profile.php?id=100071545134459" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  TR8 Plant Hire & Services
                </a>
                <p className="text-muted-foreground text-sm mt-1">Message us on Facebook</p>
              </div>
            </div>

            <div className="card-industrial p-6 flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold mb-1">Working Hours</h3>
                <p className="text-foreground">Monday - Saturday: 7am - 6pm</p>
                <p className="text-muted-foreground text-sm mt-1">24/7 emergency callout available</p>
              </div>
            </div>

            <div className="card-industrial p-6 flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold mb-1">Service Area</h3>
                <p className="text-foreground">Covering the local area and beyond</p>
                <p className="text-muted-foreground text-sm mt-1">Delivery available nationwide</p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="card-industrial p-8">
            <h3 className="font-display text-2xl font-bold mb-6">Request a Quote</h3>
            <form className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2">Your Name</label>
                <input
                  type="text"
                  id="name"
                  className="w-full px-4 py-3 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  placeholder="John Smith"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium mb-2">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  className="w-full px-4 py-3 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  placeholder="07xxx xxxxxx"
                />
              </div>
              <div>
                <label htmlFor="service" className="block text-sm font-medium mb-2">Service Required</label>
                <select
                  id="service"
                  className="w-full px-4 py-3 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                >
                  <option value="">Select a service...</option>
                  <option value="plant-hire">Plant Hire</option>
                  <option value="demolition">Demolition</option>
                  <option value="asbestos">Asbestos Removal</option>
                  <option value="groundworks">Groundworks</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium mb-2">Project Details</label>
                <textarea
                  id="message"
                  rows={4}
                  className="w-full px-4 py-3 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
                  placeholder="Tell us about your project..."
                />
              </div>
              <Button type="submit" variant="hero" className="w-full">
                Send Enquiry
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
