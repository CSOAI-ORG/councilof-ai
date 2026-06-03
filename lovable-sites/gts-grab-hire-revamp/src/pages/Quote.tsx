import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Phone, Clock, Award } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import Badge from "@/components/Badge";
import { submitForm, type FormSubmission } from "@/utils/emailService";

const Quote = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    service: '',
    location: '',
    details: '',
    timeline: '',
    accessRequirements: ''
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const submission: FormSubmission = {
      name: `${formData.firstName} ${formData.lastName}`,
      email: formData.email,
      phone: formData.phone,
      service: formData.service,
      message: formData.details,
      location: formData.location,
      timeline: formData.timeline,
      projectDetails: formData.accessRequirements,
      formType: 'quote'
    };

    try {
      const result = await submitForm(submission);
      if (result.success) {
        setIsSubmitted(true);
        toast({
          title: "Quote request sent!",
          description: result.message,
        });
      } else {
        toast({
          title: "Error sending quote request",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "There was a problem sending your quote request. Please try calling us directly.",
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

  if (isSubmitted) {
    return (
      <>
        <Header />
        <main className="min-h-screen flex items-center justify-center section-gradient py-20">
          <div className="container mx-auto px-4">
            <Card className="max-w-2xl mx-auto text-center bg-white shadow-[var(--shadow-card)]">
              <CardContent className="p-12">
                <CheckCircle className="w-16 h-16 text-[hsl(var(--gts-yellow))] mx-auto mb-6" />
                <h2 className="text-3xl font-bold text-[hsl(var(--gts-dark))] mb-4">
                  Quote Request Submitted!
                </h2>
                <p className="text-lg text-gray-600 mb-8">
                  Thank you for your quote request. We'll review your details and get back to you within 24 hours with a competitive quote.
                </p>
                <div className="space-y-4">
                  <p className="text-sm text-gray-500">
                    For urgent requests, please call us directly:
                  </p>
                  <Button asChild variant="primary" size="lg">
                    <a href="tel:07958710548">
                      <Phone className="mr-2 h-5 w-5" />
                      Call Now: 07958 710 548
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <SEOHead 
        title="Get Free Quote | Grab Hire Waste Removal | GTS Grab Hire Kent London Essex"
        description="Get a free, no-obligation quote for grab hire and waste removal services. Professional service across Kent, London & Essex. Quick response guaranteed."
        keywords="free quote grab hire, waste removal quote, grab hire prices, kent london essex, professional service"
      />
      
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="hero-gradient text-white py-20">
          <div className="container mx-auto px-4 text-center">
            <Badge variant="yellow" className="mb-6">
              Get Quote
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Get a Free, No-Obligation Quote for Your Project
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 max-w-4xl mx-auto leading-relaxed">
              Professional waste management solutions tailored to your needs. Quick response and competitive pricing guaranteed.
            </p>
          </div>
        </section>

        {/* Quote Form Section */}
        <section className="section-padding section-gradient">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* Quote Form */}
              <div className="lg:col-span-2">
                <Card className="bg-white shadow-[var(--shadow-card)] border-0">
                  <CardHeader>
                    <CardTitle className="text-2xl text-[hsl(var(--gts-dark))]">Request Your Free Quote</CardTitle>
                    <CardDescription>
                      Fill out the form below and we'll get back to you with a competitive quote within 24 hours
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="firstName" className="form-label">First Name *</label>
                          <input 
                            id="firstName"
                            name="firstName"
                            type="text" 
                            required
                            className="form-input" 
                            value={formData.firstName}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div>
                          <label htmlFor="lastName" className="form-label">Last Name *</label>
                          <input 
                            id="lastName"
                            name="lastName"
                            type="text" 
                            required
                            className="form-input" 
                            value={formData.lastName}
                            onChange={handleInputChange}
                          />
                        </div>
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
                          <label htmlFor="phone" className="form-label">Phone Number *</label>
                          <input 
                            id="phone"
                            name="phone"
                            type="tel" 
                            required
                            className="form-input" 
                            value={formData.phone}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="service" className="form-label">Service Required *</label>
                        <select 
                          id="service"
                          name="service"
                          required
                          className="form-input"
                          value={formData.service}
                          onChange={handleInputChange}
                        >
                          <option value="">Select a service</option>
                          <option value="grab-hire">Grab Hire</option>
                          <option value="muck-away">Muck Away</option>
                          <option value="aggregates">Aggregates Supply</option>
                          <option value="utilities">Utilities Services</option>
                          <option value="multiple">Multiple Services</option>
                          <option value="other">Other (please specify in details)</option>
                        </select>
                      </div>
                      
                      <div>
                        <label htmlFor="location" className="form-label">Project Location *</label>
                        <input 
                          id="location"
                          name="location"
                          type="text" 
                          required
                          placeholder="Full address or postcode"
                          className="form-input" 
                          value={formData.location}
                          onChange={handleInputChange}
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="timeline" className="form-label">Project Timeline</label>
                        <select 
                          id="timeline"
                          name="timeline"
                          className="form-input"
                          value={formData.timeline}
                          onChange={handleInputChange}
                        >
                          <option value="">Select timeline</option>
                          <option value="urgent">Urgent (within 24 hours)</option>
                          <option value="this-week">This week</option>
                          <option value="next-week">Next week</option>
                          <option value="this-month">This month</option>
                          <option value="flexible">Flexible</option>
                        </select>
                      </div>
                      
                      <div>
                        <label htmlFor="accessRequirements" className="form-label">Access Requirements</label>
                        <input 
                          id="accessRequirements"
                          name="accessRequirements"
                          type="text" 
                          placeholder="e.g., narrow access, over fence, restricted hours"
                          className="form-input" 
                          value={formData.accessRequirements}
                          onChange={handleInputChange}
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="details" className="form-label">Project Details *</label>
                        <textarea 
                          id="details"
                          name="details"
                          rows={4} 
                          required
                          placeholder="Please describe your project, estimated volume of waste, timeline, and any specific requirements"
                          className="form-input resize-none" 
                          value={formData.details}
                          onChange={handleInputChange}
                        />
                      </div>
                      
                      <Button type="submit" variant="primary" size="lg" className="w-full">
                        Submit Your Quote Request
                      </Button>
                      
                      <p className="text-sm text-gray-500 text-center">
                        We'll respond to your quote request within 24 hours. For urgent requests, please call us directly at 07958 710 548.
                      </p>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar Information */}
              <div className="space-y-6">
                {/* Contact Info */}
                <Card className="bg-white shadow-[var(--shadow-card)] border-0">
                  <CardHeader>
                    <CardTitle className="text-xl text-[hsl(var(--gts-dark))]">Need to Speak to Someone?</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center">
                      <Phone className="w-5 h-5 text-[hsl(var(--gts-yellow))] mr-3" />
                      <div>
                        <p className="font-medium text-[hsl(var(--gts-dark))]">Call Us Directly</p>
                        <a href="tel:07958710548" className="text-[hsl(var(--gts-yellow))] font-semibold">
                          07958 710 548
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-5 h-5 text-[hsl(var(--gts-yellow))] mr-3" />
                      <div>
                        <p className="font-medium text-[hsl(var(--gts-dark))]">Available</p>
                        <p className="text-gray-600">24/7 for urgent requests</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Why Choose Us */}
                <Card className="bg-white shadow-[var(--shadow-card)] border-0">
                  <CardHeader>
                    <CardTitle className="text-xl text-[hsl(var(--gts-dark))]">Why Choose GTS?</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-[hsl(var(--gts-success))] mr-3" />
                      <span className="text-gray-700">35+ years experience</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-[hsl(var(--gts-success))] mr-3" />
                      <span className="text-gray-700">Licensed & insured</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-[hsl(var(--gts-success))] mr-3" />
                      <span className="text-gray-700">Competitive pricing</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-[hsl(var(--gts-success))] mr-3" />
                      <span className="text-gray-700">Same day service available</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-[hsl(var(--gts-success))] mr-3" />
                      <span className="text-gray-700">Family-run business</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Pricing Info */}
                <Card className="bg-[hsl(var(--gts-yellow))] bg-opacity-10 border-0">
                  <CardHeader>
                    <CardTitle className="text-xl text-[hsl(var(--gts-dark))] flex items-center">
                      <Award className="w-6 h-6 mr-2" />
                      Competitive Pricing
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 mb-3">
                      Our grab hire services are cost-effective, with one 16-ton grab lorry load or 20-ton tipper load providing efficient waste removal. Our large fleet can handle multiple loads for bigger projects.
                    </p>
                    <p className="text-sm text-gray-600">
                      All quotes include: operator, fuel, disposal costs, and public liability insurance.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </>
  );
};

export default Quote;