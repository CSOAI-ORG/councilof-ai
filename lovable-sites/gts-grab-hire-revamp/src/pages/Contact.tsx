import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, Mail, MapPin, Clock, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import Badge from "@/components/Badge";
import { submitForm, type FormSubmission } from "@/utils/emailService";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const submission: FormSubmission = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      subject: formData.subject,
      message: formData.message,
      formType: 'contact'
    };

    try {
      const result = await submitForm(submission);
      if (result.success) {
        setIsSubmitted(true);
        toast({
          title: "Message sent successfully!",
          description: result.message,
        });
      } else {
        toast({
          title: "Error sending message",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "There was a problem sending your message. Please try calling us directly.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <>
      <SEOHead 
        title="Contact GTS Grab Hire | Get Quote | Kent London Essex | 07958 710 548"
        description="Contact GTS Grab Hire for professional grab hire and waste management services. Phone: 07958 710 548. Email: contact@gtsgrabhire.co.uk. Free quotes available."
        keywords="contact grab hire, phone number, email, kent london essex, professional service, free quotes"
      />
      
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="hero-gradient text-white py-20">
          <div className="container mx-auto px-4 text-center">
            <Badge variant="yellow" className="mb-6">
              Contact Us
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Get in Touch with GTS GrabHire Today
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 max-w-4xl mx-auto leading-relaxed">
              Ready to discuss your project? We're here to help with professional advice and competitive quotes.
            </p>
          </div>
        </section>

        {/* Contact Section */}
        <section className="section-padding section-gradient">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Contact Information */}
              <div className="space-y-8">
                <Card className="bg-white shadow-[var(--shadow-card)] border-0">
                  <CardHeader>
                    <CardTitle className="text-2xl text-[hsl(var(--gts-dark))]">Contact Information</CardTitle>
                    <CardDescription>
                      Get in touch with our team for immediate assistance
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-start space-x-4 hover:bg-[hsl(var(--gts-yellow))] hover:bg-opacity-10 p-4 rounded-lg transition-colors duration-200">
                      <div className="p-3 bg-[hsl(var(--gts-yellow))] bg-opacity-10 rounded-lg group-hover:bg-opacity-20 transition-colors duration-200">
                        <Phone className="w-6 h-6 text-[hsl(var(--gts-dark))] transition-transform duration-200 group-hover:scale-110" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[hsl(var(--gts-dark))] mb-1">Phone</h3>
                        <a 
                          href="tel:07958710548" 
                          className="text-[hsl(var(--gts-yellow))] font-semibold text-lg hover:underline"
                        >
                          07958 710 548
                        </a>
                        <p className="text-gray-600 text-sm mt-1">Available 24/7 for urgent requests</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-4 hover:bg-[hsl(var(--gts-yellow))] hover:bg-opacity-10 p-4 rounded-lg transition-colors duration-200">
                      <div className="p-3 bg-[hsl(var(--gts-yellow))] bg-opacity-10 rounded-lg group-hover:bg-opacity-20 transition-colors duration-200">
                        <Mail className="w-6 h-6 text-[hsl(var(--gts-dark))] transition-transform duration-200 group-hover:scale-110" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[hsl(var(--gts-dark))] mb-1">Email</h3>
                        <a 
                          href="mailto:contact@gtsgrabhire.co.uk" 
                          className="text-[hsl(var(--gts-yellow))] font-semibold hover:underline break-all"
                        >
                          contact@gtsgrabhire.co.uk
                        </a>
                        <p className="text-gray-600 text-sm mt-1">We respond within 24 hours</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-4">
                      <div className="p-3 bg-[hsl(var(--gts-yellow))] bg-opacity-10 rounded-lg">
                        <MapPin className="w-6 h-6 text-[hsl(var(--gts-dark))]" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[hsl(var(--gts-dark))] mb-1">Service Area</h3>
                        <p className="text-gray-700">Essex, UK</p>
                        <p className="text-gray-600 text-sm mt-1">Covering Kent, London & Essex</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-4">
                      <div className="p-3 bg-[hsl(var(--gts-yellow))] bg-opacity-10 rounded-lg">
                        <Clock className="w-6 h-6 text-[hsl(var(--gts-dark))]" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[hsl(var(--gts-dark))] mb-1">Business Hours</h3>
                        <p className="text-gray-700">24/7 Service Available</p>
                        <p className="text-gray-600 text-sm mt-1">Emergency call-outs welcome</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Contact Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Button asChild variant="primary" size="lg" className="h-16 hover:scale-105 transition-all duration-200">
                    <a href="tel:07958710548" className="flex flex-col items-center space-y-1">
                      <Phone className="w-6 h-6" />
                      <span className="font-semibold">Call Now</span>
                    </a>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="h-16 border-2 border-[hsl(var(--gts-yellow))] text-[hsl(var(--gts-yellow))] hover:bg-[hsl(var(--gts-yellow))] hover:text-[hsl(var(--gts-dark))] hover:scale-105 transition-all duration-200 hover:[&_svg]:text-[hsl(var(--gts-dark))]">
                    <a href="mailto:contact@gtsgrabhire.co.uk" className="flex flex-col items-center space-y-1">
                      <Mail className="w-6 h-6" />
                      <span className="font-semibold">Send Email</span>
                    </a>
                  </Button>
                </div>
              </div>

              {/* Contact Form */}
              <div>
                {isSubmitted ? (
                  <Card className="bg-white shadow-[var(--shadow-card)] border-0 text-center">
                    <CardContent className="p-12">
                      <CheckCircle className="w-16 h-16 text-[hsl(var(--gts-yellow))] mx-auto mb-6" />
                      <h3 className="text-2xl font-bold text-[hsl(var(--gts-dark))] mb-4">
                        Message Sent Successfully!
                      </h3>
                      <p className="text-gray-600 mb-6">
                        Thank you for contacting us. We'll get back to you within 24 hours.
                      </p>
                      <Button 
                        onClick={() => setIsSubmitted(false)}
                        variant="primary"
                      >
                        Send Another Message
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="bg-white shadow-[var(--shadow-card)] border-0">
                    <CardHeader>
                      <CardTitle className="text-2xl text-[hsl(var(--gts-dark))]">Send us a Message</CardTitle>
                      <CardDescription>
                        Have a question or need more information? We're here to help.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                          <label htmlFor="name" className="form-label">Full Name *</label>
                          <input 
                            id="name"
                            name="name"
                            type="text" 
                            required
                            className="form-input" 
                            value={formData.name}
                            onChange={handleInputChange}
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="email" className="form-label">Email Address *</label>
                            <input 
                              id="email"
                              name="email"
                              type="email" 
                              required
                              className="form-input" 
                              value={formData.email}
                              onChange={handleInputChange}
                            />
                          </div>
                          <div>
                            <label htmlFor="phone" className="form-label">Phone Number</label>
                            <input 
                              id="phone"
                              name="phone"
                              type="tel" 
                              className="form-input" 
                              value={formData.phone}
                              onChange={handleInputChange}
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label htmlFor="subject" className="form-label">Subject</label>
                          <select 
                            id="subject"
                            name="subject"
                            className="form-input"
                            value={formData.subject}
                            onChange={handleInputChange}
                          >
                            <option value="">Select a subject</option>
                            <option value="quote">Request a Quote</option>
                            <option value="booking">Make a Booking</option>
                            <option value="question">General Question</option>
                            <option value="complaint">Complaint or Feedback</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        
                        <div>
                          <label htmlFor="message" className="form-label">Message *</label>
                          <textarea 
                            id="message"
                            name="message"
                            rows={5} 
                            required
                            placeholder="How can we help you?"
                            className="form-input resize-none" 
                            value={formData.message}
                            onChange={handleInputChange}
                          />
                        </div>
                        
                        <Button 
                          type="submit" 
                          variant="primary" 
                          size="lg" 
                          className="w-full" 
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? "Sending..." : "Send Message"}
                        </Button>
                        
                        <p className="text-sm text-gray-500 text-center">
                          For urgent requests, please call us directly at 07958 710 548
                        </p>
                      </form>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Map Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-[hsl(var(--gts-dark))] mb-4">
                Our Service Areas
              </h2>
              <p className="text-lg text-gray-600">
                We provide professional grab hire services across Kent, London, and Essex
              </p>
            </div>
            
            <Card className="section-gradient border-0 shadow-[var(--shadow-card)]">
              <CardContent className="p-8">
                <div className="bg-[hsl(var(--gts-yellow))] bg-opacity-10 rounded-lg h-64 flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="w-16 h-16 text-[hsl(var(--gts-dark))] mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-[hsl(var(--gts-dark))] mb-2">
                      Interactive Map Coming Soon
                    </h3>
                    <p className="text-gray-600">
                      Service areas include all of Kent, London, and Essex
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      
      <Footer />
    </>
  );
};

export default Contact;