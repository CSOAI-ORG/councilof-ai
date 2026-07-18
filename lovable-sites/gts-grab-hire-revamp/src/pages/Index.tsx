import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, ArrowRight, Truck, Recycle, Shield, Clock, Users, CheckCircle, Star, MapPin, Award } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import Badge from "@/components/Badge";
import EnhancedCTA from "@/components/EnhancedCTA";
import Testimonials from "@/components/Testimonials";
const heroImage = "/lovable-uploads/445073f3-412f-4b31-9934-8b3cb7b44863.png";
const fleetImage = "/lovable-uploads/5e461372-7a35-4313-97ee-798c9daf9b4d.png";
const equipmentImage = "/lovable-uploads/3f8f4c29-6590-414d-9ade-72de01fc345e.png";
const actionImage = "/lovable-uploads/dee0277a-6164-441a-b387-500b42b3999b.png";
const constructionWasteImage = "/lovable-uploads/d1569387-dc17-4633-b01f-27bf724070f9.png";

const Index = () => {
  const services = [
    {
      title: 'Muck Away',
      description: 'Efficiently remove large volumes of waste from your site with our professional muck away services. Our tipper lorries can carry up to 20 tons of waste in a single load.',
      icon: <Truck className="w-8 h-8" />,
      link: '/services/muck-away',
      features: ['Up to 20 tons capacity', 'Same day service available', 'Licensed waste disposal', 'Competitive pricing']
    },
    {
      title: 'Grab Hire',
      description: 'Flexible and cost-effective grab hire solutions for projects of all sizes. Our grab lorries can access difficult areas and work over fences and walls.',
      icon: <Truck className="w-8 h-8" />,
      link: '/services/grab-hire',
      features: ['Flexible hire periods', 'No permits required', 'Access difficult areas', '24/7 availability']
    },
    {
      title: 'Aggregates Supply',
      description: 'High-quality aggregates delivered directly to your site, on time and on budget. We supply sand, gravel, crushed stone, and topsoil.',
      icon: <Recycle className="w-8 h-8" />,
      link: '/services/aggregates',
      features: ['High-quality materials', 'Fast delivery service', 'Competitive prices', 'Various aggregate types']
    },
    {
      title: 'Utilities Services',
      description: 'Specialized grab hire and waste management for the utilities sector, with over 18 years of experience in utilities work.',
      icon: <Shield className="w-8 h-8" />,
      link: '/services/utilities',
      features: ['18+ years utilities experience', 'Health & safety certified', 'Emergency call-outs', 'Specialist equipment']
    }
  ];

  const benefits = [
    {
      icon: <Clock className="w-8 h-8" />,
      title: '24/7 Availability',
      description: 'Available round the clock for emergency call-outs and urgent projects. We understand that waste removal needs can arise at any time.'
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: '35+ Years Experience',
      description: 'Family-run business with decades of industry expertise. Our experience means we understand the challenges.'
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'Licensed & Insured',
      description: 'Environment Agency registered and fully insured for your peace of mind. We comply with all regulations.'
    },
    {
      icon: <CheckCircle className="w-8 h-8" />,
      title: 'Cost Effective',
      description: '18-tonne capacity equals 3 skip loads - saving you time and money. Our efficient service reduces trips needed.'
    }
  ];

  const testimonials = [
    {
      name: 'John Smith',
      location: 'Kent',
      rating: 5,
      text: 'GTS GrabHire provided an excellent service. They were professional, reliable, and affordable. The team arrived on time and completed the job efficiently.',
      project: 'Garden clearance and soil removal'
    },
    {
      name: 'Jane Doe',
      location: 'London',
      rating: 5,
      text: 'I was very impressed with the speed and efficiency of the muck away service. The team was friendly and professional, and they left the site clean.',
      project: 'Construction waste removal'
    },
    {
      name: 'Mike Johnson',
      location: 'Essex',
      rating: 5,
      text: 'Outstanding service from start to finish. Quick response, competitive pricing, and excellent customer service. Will definitely use again.',
      project: 'Commercial site clearance'
    }
  ];

  return (
    <>
      <SEOHead 
        title="GTS Grab Hire | Professional Grab Lorry & Muck Away Services | Kent, London, Essex"
        description="Professional grab hire (1-16 tons) and muck away services (up to 20 tons) across Kent, London & Essex. Family-run business with 35+ years experience. Same day service available. Get free quote."
        keywords="grab hire kent, grab hire london, grab hire essex, muck away services, waste removal kent, grab lorry hire, skip hire alternative, tipper hire"
      />
      
      <Header />
      
      <main>
        {/* Hero Section with Background Image */}
        <section className="relative hero-gradient text-white py-20 lg:py-32 overflow-hidden min-h-[80vh] flex items-center">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url(${heroImage})`,
              backgroundPosition: 'center center'
            }}
          ></div>
          <div className="absolute inset-0 bg-black/50"></div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center fade-in">
              <Badge variant="yellow" className="mb-6 animate-pulse">
                Professional Grab Hire Services
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Your Trusted Partner for Grab Hire and Waste Removal in{' '}
                <span className="text-[hsl(var(--gts-yellow))]">Kent, London & Essex</span>
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-gray-200 leading-relaxed">
                Fast, Reliable, and Affordable Services for Construction, Commercial, and Domestic Needs
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild variant="cta" size="xl">
                  <Link to="/quote">
                    Get a Free Quote
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                </Button>
                  <Button asChild variant="outlineWhite" size="xl">
                    <a href="tel:07958710548">
                      <Phone className="mr-2 w-5 h-5" />
                      Call Now: 07958 710 548
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Services Overview Section */}
        <section className="section-padding section-gradient">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16 slide-up">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[hsl(var(--gts-yellow))] mb-6">
                Our Comprehensive Services
              </h2>
              <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                From muck away to aggregates supply, we provide complete waste management solutions for all your needs
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {services.map((service, index) => (
                <Card key={index} className="card-hover group bg-white border-0 shadow-[var(--shadow-card)]">
                  <CardHeader className="text-center pb-4">
                     <div className="mx-auto mb-4 p-4 bg-[hsl(var(--gts-yellow))] bg-opacity-10 rounded-full text-[hsl(var(--gts-dark))] service-icon">
                       {service.icon}
                     </div>
                    <CardTitle className="text-xl text-[hsl(var(--gts-dark))]">{service.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardDescription className="text-center mb-6 text-gray-600 leading-relaxed">
                      {service.description}
                    </CardDescription>
                    <div className="mb-6">
                      <h4 className="font-semibold text-[hsl(var(--gts-dark))] mb-3 text-sm">Key Features:</h4>
                      <ul className="space-y-2">
                        {service.features.map((feature, idx) => (
                          <li key={idx} className="flex items-center text-sm text-gray-600">
                            <div className="w-2 h-2 bg-[hsl(var(--gts-yellow))] rounded-full mr-3 flex-shrink-0"></div>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Button asChild variant="outline" className="w-full border-[hsl(var(--gts-yellow))] text-[hsl(var(--gts-yellow))] hover:bg-[hsl(var(--gts-yellow))] hover:text-[hsl(var(--gts-dark))]">
                      <Link to={service.link}>Learn More</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Equipment Showcase Section */}
        <section className="section-padding bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[hsl(var(--gts-yellow))] mb-6">
                Professional Equipment & Fleet
              </h2>
              <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Our modern fleet of grab lorries (up to 16 tons) and tipper lorries (up to 20 tons) is maintained to the highest standards
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
              <div>
                <img 
                  src={fleetImage} 
                  alt="GTS Grab Hire professional fleet of grab lorries"
                  loading="lazy" decoding="async"
                  className="rounded-lg shadow-[var(--shadow-card)] w-full h-auto"
                />
              </div>
              <div>
                <h3 className="text-2xl md:text-3xl font-bold text-[hsl(var(--gts-yellow))] mb-6">
                  Modern Fleet, Professional Service
                </h3>
                <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                  Our well-maintained fleet of grab lorries ensures reliable service for all your waste removal needs. 
                  Each vehicle is regularly serviced and operated by experienced professionals.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-[hsl(var(--gts-success))] mr-3 flex-shrink-0" />
                    <span>Up to 16/20 ton capacity</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-[hsl(var(--gts-success))] mr-3 flex-shrink-0" />
                    <span>Regular maintenance</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-[hsl(var(--gts-success))] mr-3 flex-shrink-0" />
                    <span>Skilled operators</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-[hsl(var(--gts-success))] mr-3 flex-shrink-0" />
                    <span>Safety certified</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1">
                <h3 className="text-2xl md:text-3xl font-bold text-[hsl(var(--gts-yellow))] mb-6">
                  Advanced Hydraulic Technology
                </h3>
                <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                  Our grab lorries feature state-of-the-art hydraulic systems that can reach over fences, 
                  walls, and into difficult access areas that traditional methods cannot reach.
                </p>
                <Button asChild variant="outline" className="border-[hsl(var(--gts-yellow))] text-[hsl(var(--gts-yellow))] hover:bg-[hsl(var(--gts-yellow))] hover:text-[hsl(var(--gts-dark))]">
                  <Link to="/services/grab-hire">Learn More About Our Services</Link>
                </Button>
              </div>
              <div className="order-1 lg:order-2">
                <img 
                  src={equipmentImage} 
                  alt="Grab lorry hydraulic arm and equipment detail"
                  loading="lazy" decoding="async"
                  className="rounded-lg shadow-[var(--shadow-card)] w-full h-auto"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Photo Gallery */}
        <section className="section-padding bg-white">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <img src={fleetImage} alt="GTS grab lorry fleet lined up" loading="lazy" decoding="async" className="w-full h-56 object-cover rounded-lg shadow-[var(--shadow-card)]" />
              <img src={actionImage} alt="Grab lorry loading construction waste on site" loading="lazy" decoding="async" className="w-full h-56 object-cover rounded-lg shadow-[var(--shadow-card)]" />
              <img src={equipmentImage} alt="Close-up of hydraulic grab equipment" loading="lazy" decoding="async" className="w-full h-56 object-cover rounded-lg shadow-[var(--shadow-card)]" />
              <img src={constructionWasteImage} alt="Construction waste cleared by grab lorry" loading="lazy" decoding="async" className="w-full h-56 object-cover rounded-lg shadow-[var(--shadow-card)]" />
            </div>
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section className="section-padding bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[hsl(var(--gts-yellow))] mb-6">
                Why Choose GTS GrabHire?
              </h2>
              <p className="text-lg md:text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
                With over 35 years of experience in the industry, GTS GrabHire is a family-run business that you can trust. 
                We are committed to providing a professional, reliable, and affordable service to all our customers.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {benefits.map((benefit, index) => (
                <div key={index} className="text-center group">
                   <div className="mx-auto mb-6 p-6 bg-[hsl(var(--gts-yellow))] bg-opacity-10 rounded-full text-[hsl(var(--gts-dark))] w-20 h-20 flex items-center justify-center group-hover:bg-[hsl(var(--gts-yellow))] group-hover:text-[hsl(var(--gts-dark))] transition-all duration-300">
                     {benefit.icon}
                   </div>
                  <h3 className="text-xl font-bold mb-4 text-[hsl(var(--gts-dark))]">{benefit.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="section-padding section-gradient">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[hsl(var(--gts-yellow))] mb-6">
                What Our Customers Say
              </h2>
              <p className="text-lg md:text-xl text-gray-600">
                Don't just take our word for it - hear from our satisfied customers across Kent, London, and Essex
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="bg-white shadow-[var(--shadow-card)] border-0 card-hover">
                  <CardContent className="p-8">
                    <div className="flex mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 text-[hsl(var(--gts-yellow))] fill-current" />
                      ))}
                    </div>
                    <p className="text-gray-600 mb-6 italic leading-relaxed">"{testimonial.text}"</p>
                    <div className="border-t pt-4">
                      <p className="font-bold text-[hsl(var(--gts-dark))] text-lg">{testimonial.name}</p>
                      <p className="text-sm text-gray-500 flex items-center mb-2">
                        <MapPin className="w-4 h-4 mr-1" />
                        {testimonial.location}
                      </p>
                      <p className="text-sm text-[hsl(var(--gts-yellow))] font-medium">{testimonial.project}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="hero-gradient text-white py-20">
          <div className="container mx-auto px-4 text-center">
            <Award className="w-16 h-16 text-[hsl(var(--gts-yellow))] mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-xl md:text-2xl mb-8 text-gray-200 max-w-2xl mx-auto leading-relaxed">
              Contact us today for a free, no-obligation quote for your project. 
              Professional service guaranteed across Kent, London, and Essex.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button asChild variant="cta" size="xl">
                <Link to="/quote">Get Free Quote</Link>
              </Button>
              <Button asChild variant="outlineWhite" size="xl">
                <a href="tel:07958710548">
                  <Phone className="mr-2 w-5 h-5" />
                  Call: 07958 710 548
                </a>
              </Button>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center text-gray-300 text-sm mt-6">
              <span>✓ Environment Agency Licensed</span>
              <span>✓ Fully Insured Operations</span>
              <span>✓ 24/7 Emergency Service</span>
              <span>✓ Same Day Service Available</span>
            </div>
          </div>
        </section>
        {/* Testimonials Section */}
        <Testimonials />
      </main>
      
      <Footer />
    </>
  );
};

export default Index;
