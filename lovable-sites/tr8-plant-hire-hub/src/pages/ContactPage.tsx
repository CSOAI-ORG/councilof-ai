import { useState } from "react";
import { Phone, Clock, MapPin, Facebook, MessageCircle } from "lucide-react";
import SEO from "@/components/SEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const ContactPage = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    service: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.phone.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter your name and phone number.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    // Create WhatsApp message
    const message = `New Enquiry from TR8 Website

Name: ${formData.name}
Phone: ${formData.phone}
Email: ${formData.email || "Not provided"}
Service: ${formData.service || "General enquiry"}

Message:
${formData.message || "No message provided"}`;

    const whatsappUrl = `https://wa.me/447746159640?text=${encodeURIComponent(message)}`;
    
    // Open WhatsApp
    window.open(whatsappUrl, "_blank");

    toast({
      title: "Opening WhatsApp",
      description: "Complete your enquiry in WhatsApp to send directly to TR8.",
    });

    setIsSubmitting(false);
  };

  return (
    <>
      <SEO
        title="Contact TR8 Plant Hire | Get a Free Quote | 07746 159 640"
        description="Contact TR8 Plant Hire for a free quote on plant hire, demolition & asbestos removal. Call 07746 159 640 or send us a message. Fast response guaranteed."
        canonical="https://tr8planthire.com/contact"
      />

      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="pt-20">
          {/* Hero Section */}
          <section className="py-16 md:py-24 bg-secondary relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
            <div className="container mx-auto px-6 relative z-10">
              <div className="max-w-3xl">
                <span className="text-primary font-display uppercase tracking-wider text-sm">Contact Us</span>
                <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mt-4 mb-6">
                  Get In <span className="text-gradient">Touch</span>
                </h1>
                <p className="text-muted-foreground text-lg md:text-xl">
                  Ready to start your project? Contact us today for a free, no-obligation quote.
                </p>
              </div>
            </div>
          </section>

          {/* Contact Content */}
          <section className="py-16 md:py-24">
            <div className="container mx-auto px-6">
              <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
                
                {/* Contact Info */}
                <div className="space-y-8">
                  <div>
                    <h2 className="font-display text-2xl md:text-3xl font-bold mb-6">
                      Contact <span className="text-gradient">Information</span>
                    </h2>
                    <p className="text-muted-foreground mb-8">
                      The quickest way to reach us is by phone or WhatsApp. We aim to respond to all enquiries within 24 hours.
                    </p>
                  </div>

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
                  <h2 className="font-display text-2xl font-bold mb-2">Send an Enquiry</h2>
                  <p className="text-muted-foreground mb-6">
                    Fill in the form below and we'll get back to you as soon as possible.
                  </p>
                  
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium mb-2">
                        Your Name <span className="text-primary">*</span>
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                        placeholder="John Smith"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium mb-2">
                        Phone Number <span className="text-primary">*</span>
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                        placeholder="07xxx xxxxxx"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium mb-2">
                        Email (Optional)
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                        placeholder="john@example.com"
                      />
                    </div>

                    <div>
                      <label htmlFor="service" className="block text-sm font-medium mb-2">
                        Service Required
                      </label>
                      <select
                        id="service"
                        name="service"
                        value={formData.service}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                      >
                        <option value="">Select a service...</option>
                        <option value="Plant Hire">Plant Hire</option>
                        <option value="Equipment Hire">Equipment Hire</option>
                        <option value="Operated Hire">Operated Hire</option>
                        <option value="Demolition">Demolition</option>
                        <option value="Asbestos Removal">Asbestos Removal</option>
                        <option value="Groundworks">Groundworks</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="message" className="block text-sm font-medium mb-2">
                        Project Details
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        rows={4}
                        className="w-full px-4 py-3 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
                        placeholder="Tell us about your project..."
                      />
                    </div>

                    <Button 
                      type="submit" 
                      variant="hero" 
                      className="w-full" 
                      size="lg"
                      disabled={isSubmitting}
                    >
                      <MessageCircle className="w-5 h-5 mr-2" />
                      {isSubmitting ? "Opening WhatsApp..." : "Send via WhatsApp"}
                    </Button>

                    <p className="text-muted-foreground text-xs text-center">
                      Clicking send will open WhatsApp with your message ready to send.
                    </p>
                  </form>
                </div>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default ContactPage;
