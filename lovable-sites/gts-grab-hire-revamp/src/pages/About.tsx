import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Shield, Award, Clock, CheckCircle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import Badge from "@/components/Badge";
import fleetImage from "@/assets/fleet-showcase.jpg";
import actionImage from "@/assets/grab-lorry-action.jpg";

const About = () => {
  const values = [
    {
      icon: <Users className="w-8 h-8" />,
      title: 'Professionalism',
      description: 'We maintain the highest standards of professionalism in every aspect of our service.'
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'Integrity',
      description: 'Honest, transparent dealings with all our customers, building trust through our actions.'
    },
    {
      icon: <Award className="w-8 h-8" />,
      title: 'Hard Work',
      description: 'Dedicated to providing exceptional service through commitment and determination.'
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: 'Customer Satisfaction',
      description: 'Your satisfaction is our priority - we go the extra mile to exceed expectations.'
    }
  ];

  const certifications = [
    {
      title: 'Environment Agency Registration',
      description: 'Fully registered waste carrier with the Environment Agency, ensuring compliant waste disposal.'
    },
    {
      title: 'Full Public Liability Insurance',
      description: 'Comprehensive insurance coverage protecting your property and our operations.'
    },
    {
      title: 'Health & Safety Compliance',
      description: 'Strict adherence to health and safety regulations with regular training and certification.'
    },
    {
      title: 'Professional Accreditations',
      description: 'Industry recognized qualifications and memberships demonstrating our commitment to excellence.'
    }
  ];

  return (
    <>
      <SEOHead 
        title="About GTS Grab Hire | 35+ Years Family Business | Kent London Essex"
        description="Learn about GTS Grab Hire, a family-run business with 35+ years experience in professional waste removal and grab hire services across Kent, London & Essex."
        keywords="family business grab hire, 35 years experience, professional waste management, kent london essex, licensed waste carrier"
      />
      
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="hero-gradient text-white py-20">
          <div className="container mx-auto px-4 text-center">
            <Badge variant="yellow" className="mb-6">
              About GTS GrabHire
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-[hsl(var(--gts-yellow))]">
              Your Trusted Partner in Grab Hire for Over 35 Years
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 max-w-4xl mx-auto leading-relaxed">
              Built on a foundation of family values, professional excellence, and unwavering commitment to customer satisfaction
            </p>
          </div>
        </section>

        {/* Our Story Section */}
        <section className="section-padding bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-[hsl(var(--gts-yellow))] mb-6">
                  Our Story
                </h2>
                <div className="w-24 h-1 bg-[hsl(var(--gts-yellow))] mx-auto mb-8"></div>
              </div>
              
              <div className="space-y-8 text-lg text-gray-700 leading-relaxed">
                <p>
                  GTS GrabHire began its journey over three decades ago with a simple mission: to provide reliable, 
                  professional waste management solutions to communities across Kent, London, and Essex. What started 
                  as a single grab lorry operation has grown into one of the region's most trusted names in the industry.
                </p>
                
                <p>
                  Our growth has been built on the solid foundation of family values - honesty, integrity, and hard work. 
                  These principles have guided every decision we've made and every relationship we've built. From our 
                  humble beginnings to our current fleet of modern grab lorries, we've never lost sight of what matters 
                  most: exceptional service and customer satisfaction.
                </p>
                
                <p>
                  Over the years, we've had the privilege of working on thousands of projects, from small domestic 
                  garden clearances to major commercial construction sites. Each project has taught us something new 
                  and helped us refine our approach. Today, we're proud to be known not just for our equipment and 
                  capabilities, but for our reliability, professionalism, and genuine care for our customers.
                </p>
                
                <p>
                  As we look to the future, we remain committed to the values that got us here while continuously 
                  investing in new technology, training, and capabilities to serve our customers even better.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Enhanced About Section with Fleet Image */}
        <section className="section-padding bg-white">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="text-center mb-16 lg:text-left lg:mb-8">
                  <h2 className="text-3xl md:text-4xl font-bold text-[hsl(var(--gts-yellow))] mb-6">
                    Family Values, Professional Excellence
                  </h2>
                  <div className="w-24 h-1 bg-[hsl(var(--gts-yellow))] mx-auto lg:mx-0 mb-8"></div>
                </div>
                
                <div className="space-y-6 text-lg text-gray-700 leading-relaxed">
                  <p>
                    For over 35 years, GTS GrabHire has been the trusted choice for waste management solutions 
                    across Kent, London, and Essex. Our commitment to excellence is evident in every project we undertake.
                  </p>
                  
                  <p>
                    As a family-run business, we understand the importance of reliability, honesty, and hard work. 
                    These values have been the cornerstone of our success and continue to guide everything we do.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-[hsl(var(--gts-success))] mr-3 flex-shrink-0" />
                      <span>Environment Agency Licensed</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-[hsl(var(--gts-success))] mr-3 flex-shrink-0" />
                      <span>Fully Insured Operations</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-[hsl(var(--gts-success))] mr-3 flex-shrink-0" />
                      <span>24/7 Emergency Service</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-[hsl(var(--gts-success))] mr-3 flex-shrink-0" />
                      <span>Competitive Pricing</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <img 
                  src="/lovable-uploads/5e461372-7a35-4313-97ee-798c9daf9b4d.png" 
                  alt="Professional grab hire service in action - GTS team at work"
                  loading="lazy" decoding="async"
                  className="rounded-lg shadow-[var(--shadow-card)] w-full h-auto"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Mission and Values Section */}
        <section className="section-padding section-gradient">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-[hsl(var(--gts-yellow))] mb-6">
                Our Mission & Values
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                We are committed to providing professional, reliable, and environmentally responsible waste management 
                solutions while maintaining the personal touch that only a family business can provide.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value, index) => (
                <Card key={index} className="text-center bg-white border-0 shadow-[var(--shadow-card)] card-hover">
                  <CardHeader>
                     <div className="mx-auto mb-4 p-4 bg-[hsl(var(--gts-yellow))] bg-opacity-10 rounded-full text-[hsl(var(--gts-dark))] w-16 h-16 flex items-center justify-center">
                       {value.icon}
                     </div>
                    <CardTitle className="text-xl text-[hsl(var(--gts-dark))]">{value.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-gray-600 leading-relaxed">
                      {value.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Certifications Section */}
        <section className="section-padding bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-[hsl(var(--gts-yellow))] mb-6">
                Certifications & Compliance
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Your peace of mind is our priority. We maintain all necessary licenses, certifications, 
                and insurance to operate safely and legally across all our service areas.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {certifications.map((cert, index) => (
                <Card key={index} className="bg-white border-0 shadow-[var(--shadow-card)] card-hover">
                  <CardHeader>
                    <div className="flex items-center mb-2">
                      <CheckCircle className="w-6 h-6 text-[hsl(var(--gts-success))] mr-3" />
                      <CardTitle className="text-xl text-[hsl(var(--gts-dark))]">{cert.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-gray-600 leading-relaxed">
                      {cert.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="hero-gradient text-white py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Experience the GTS Difference?
            </h2>
            <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
              Join thousands of satisfied customers who trust GTS GrabHire for their waste management needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild variant="cta" size="lg">
                <Link to="/quote">Get Your Free Quote</Link>
              </Button>
              <Button asChild variant="outlineWhite" size="lg">
                <Link to="/contact">Contact Us Today</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </>
  );
};

export default About;