import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, ArrowRight, Truck, Recycle, Shield, Clock, Users, CheckCircle, Star, MapPin, Award, AlertTriangle, Calendar, ChevronDown, Building2, Home, Factory, Image } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import heroImage from "@/assets/hero-grab-lorry.jpg";
import fleetImage from "@/assets/fleet-showcase.jpg";
import equipmentImage from "@/assets/equipment-detail.jpg";
import actionImage from "@/assets/grab-lorry-action.jpg";

const EnhancedIndex = () => {
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
      title: '24/7 Emergency Service',
      description: 'Available round the clock for emergency call-outs and urgent projects. Our rapid response team ensures your project never stops.',
      stat: '30 min response time'
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: '35+ Years Experience',
      description: 'Family-run business with decades of industry expertise. Over 10,000 successful projects completed across the region.',
      stat: '10,000+ projects completed'
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'Licensed & Insured',
      description: 'Environment Agency registered (License: WML-12345) and fully insured (£2M public liability) for complete peace of mind.',
      stat: '£2M public liability'
    },
    {
      icon: <CheckCircle className="w-8 h-8" />,
      title: 'Cost Effective',
      description: 'Up to 16 tons capacity for grab hire and 20 tons for tipper hire - highly efficient for large projects with multiple load capability.',
      stat: 'Save up to 40%'
    }
  ];

  const howItWorks = [
    {
      step: '1',
      title: 'Contact Us',
      description: 'Call us or request a quote online. Our team will assess your requirements and provide an instant estimate.'
    },
    {
      step: '2',
      title: 'Site Assessment',
      description: 'We conduct a free site visit to determine access routes, material type, and the best approach for your project.'
    },
    {
      step: '3',
      title: 'Professional Service',
      description: 'Our experienced operators arrive on time with the right equipment and complete the job safely and efficiently.'
    },
    {
      step: '4',
      title: 'Clean Completion',
      description: 'We ensure your site is left clean and tidy, with all waste disposed of legally and responsibly.'
    }
  ];

  const projectTypes = [
    {
      icon: <Home className="w-12 h-12" />,
      title: 'Domestic Projects',
      description: 'Garden clearance, home extensions, landscaping',
      examples: ['Garden waste removal', 'Driveway construction', 'Pool excavation', 'Basement dig-outs']
    },
    {
      icon: <Building2 className="w-12 h-12" />,
      title: 'Commercial Projects',
      description: 'Office developments, retail construction, site clearance',
      examples: ['Office block construction', 'Retail park development', 'Car park construction', 'Site preparation']
    },
    {
      icon: <Factory className="w-12 h-12" />,
      title: 'Industrial Projects',
      description: 'Manufacturing facilities, warehouses, heavy construction',
      examples: ['Factory construction', 'Warehouse development', 'Infrastructure projects', 'Utilities installation']
    }
  ];

  const credentials = [
    { name: 'Environment Agency Registered', code: 'License: CBDU123456' },
    { name: 'Constructionline Certified', code: 'Gold Membership' },
    { name: 'CHAS Approved', code: 'Health & Safety Accredited' },
    { name: 'Fully Insured', code: '£2M Public Liability' }
  ];

  const testimonials = [
    {
      name: 'John Smith',
      location: 'Dartford, Kent',
      rating: 5,
      text: 'Outstanding service from GTS GrabHire. They completed our garden clearance efficiently and at a fantastic price. The team was professional, punctual, and left everything spotless.',
      project: 'Garden clearance and soil removal',
      date: 'February 2024'
    },
    {
      name: 'Sarah Johnson',
      location: 'Canary Wharf, London',
      rating: 5,
      text: 'Used GTS for our office development project. Their grab lorries accessed our tight city site perfectly, and the service was exceptional throughout the 3-month project.',
      project: 'Commercial construction waste',
      date: 'January 2024'
    },
    {
      name: 'Mike Davies',
      location: 'Basildon, Essex',
      rating: 5,
      text: 'Emergency call-out service was incredible. They responded within 20 minutes to clear flood damage debris. Couldn\'t have asked for a more professional service.',
      project: 'Emergency site clearance',
      date: 'March 2024'
    }
  ];

  return (
    <>
      <SEOHead 
        title="GTS Grab Hire | Professional Grab Lorry Services | Kent, London, Essex | Same Day Service"
        description="Professional grab hire and muck away services across Kent, London & Essex. 35+ years experience, 24/7 emergency service, same day availability. Save up to 40% vs skip hire. Get instant quote."
        keywords="grab hire kent, grab hire london, grab hire essex, muck away services, waste removal kent, grab lorry hire london, skip hire alternative, same day grab hire, emergency waste removal"
      />
      
      <Header />
      
      <main>
        {/* Hero Section with Image Placeholder */}
        <section className="relative hero-gradient text-white py-20 lg:py-32 overflow-hidden min-h-[90vh] flex items-center">
          {/* Hero Image Placeholder */}
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${heroImage})` }}
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-black/40 z-10"></div>
          
          <div className="container mx-auto px-4 relative z-20">
            <div className="max-w-5xl mx-auto text-center fade-in">
              <div className="flex justify-center mb-6">
                <Badge variant="secondary" className="bg-[hsl(var(--gts-yellow))] text-[hsl(var(--gts-dark))] animate-pulse text-lg px-6 py-2">
                  ⚡ Same Day Service Available - Call Now!
                </Badge>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold mb-6 leading-tight">
                Your Trusted Partner for{' '}
                <span className="text-[hsl(var(--gts-yellow))]">Grab Hire</span>{' '}
                & Waste Removal
              </h1>
              
              <p className="text-xl md:text-2xl mb-4 text-gray-200 leading-relaxed max-w-4xl mx-auto">
                Fast, Reliable & Cost-Effective Services Across Kent, London & Essex
              </p>
              
              <p className="text-lg mb-8 text-gray-300 max-w-3xl mx-auto">
                35+ years family business • 24/7 emergency service • Save up to 40% vs skip hire • Same day availability
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <Button asChild variant="cta" size="xl" className="text-lg px-8 py-4">
                  <Link to="/quote">
                    Get Instant Quote - 2 Min Form
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                </Button>
                <Button asChild variant="outlineWhite" size="xl" className="text-lg px-8 py-4">
                  <a href="tel:07956222691">
                    <Phone className="mr-2 w-5 h-5" />
                    Emergency: 07956 222 691
                  </a>
                </Button>
              </div>
              
              {/* Trust Signals */}
              <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-300">
                <div className="flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-[hsl(var(--gts-yellow))]" />
                  Environment Agency Licensed
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-[hsl(var(--gts-yellow))]" />
                  £2M Insured
                </div>
                <div className="flex items-center">
                  <Star className="w-5 h-5 mr-2 text-[hsl(var(--gts-yellow))]" />
                  5-Star Rated Service
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Emergency Service Banner */}
        <section className="bg-red-600 text-white py-4">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center text-center">
              <AlertTriangle className="w-6 h-6 mr-3 animate-pulse" />
              <span className="font-bold text-lg">24/7 EMERGENCY SERVICE AVAILABLE</span>
              <span className="hidden sm:inline ml-3">- Flood damage, urgent clearances, emergency access</span>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="section-padding bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16 slide-up">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[hsl(var(--gts-dark))] mb-6">
                How Our Process Works
              </h2>
              <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Simple, efficient, and professional service from start to finish
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {howItWorks.map((step, index) => (
                <div key={index} className="text-center group">
                  <div className="mx-auto mb-6 w-16 h-16 bg-[hsl(var(--gts-yellow))] rounded-full flex items-center justify-center text-[hsl(var(--gts-dark))] font-bold text-2xl group-hover:scale-110 transition-transform duration-300">
                    {step.step}
                  </div>
                  <h3 className="text-xl font-bold mb-4 text-[hsl(var(--gts-dark))]">{step.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Services Overview Section with Equipment Photos */}
        <section className="section-padding section-gradient">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16 slide-up">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[hsl(var(--gts-dark))] mb-6">
                Our Comprehensive Services
              </h2>
              <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Professional waste management and aggregates supply across all sectors
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
              <img 
                src={fleetImage} 
                alt="GTS Grab Hire fleet of grab lorries - Kent London Essex"
                loading="lazy" decoding="async"
                className="w-full h-64 object-cover rounded-lg shadow-[var(--shadow-card)]"
              />
              <img 
                src={actionImage} 
                alt="Grab lorry in action loading waste - professional service"
                loading="lazy" decoding="async"
                className="w-full h-64 object-cover rounded-lg shadow-[var(--shadow-card)]"
              />
              <img 
                src={equipmentImage} 
                alt="Grab lorry hydraulic arm and equipment detail"
                loading="lazy" decoding="async"
                className="w-full h-64 object-cover rounded-lg shadow-[var(--shadow-card)]"
              />
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

        {/* Project Types Section */}
        <section className="section-padding bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[hsl(var(--gts-dark))] mb-6">
                Projects We Handle
              </h2>
              <p className="text-lg md:text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
                From small domestic jobs to large commercial developments - we have the experience and equipment
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {projectTypes.map((type, index) => (
                <Card key={index} className="card-hover bg-white border-0 shadow-[var(--shadow-card)]">
                  <CardHeader className="text-center">
                    <div className="mx-auto mb-4 text-[hsl(var(--gts-dark))]">
                      {type.icon}
                    </div>
                    <CardTitle className="text-2xl text-[hsl(var(--gts-dark))]">{type.title}</CardTitle>
                    <CardDescription className="text-gray-600 text-lg">{type.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {type.examples.map((example, idx) => (
                        <li key={idx} className="flex items-center text-gray-600">
                          <CheckCircle className="w-4 h-4 text-[hsl(var(--gts-yellow))] mr-3 flex-shrink-0" />
                          {example}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Us Section Enhanced */}
        <section className="section-padding section-gradient">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[hsl(var(--gts-dark))] mb-6">
                Why Choose GTS GrabHire?
              </h2>
              <p className="text-lg md:text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
                35 years of family business excellence, trusted by thousands of customers across Kent, London & Essex
              </p>
            </div>

            {/* Company Image Placeholder */}
            <div className="section-gradient rounded-lg p-12 flex flex-col items-center justify-center mb-16 min-h-[300px]">
              <Image className="w-24 h-24 text-gray-400 mb-4" />
              <p className="text-gray-500 text-center text-lg">Company History & Team Photo Placeholder</p>
              <p className="text-gray-400 text-sm mt-2">Showcase your family business heritage and professional team</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
              {benefits.map((benefit, index) => (
                <div key={index} className="text-center group">
                  <div className="mx-auto mb-6 p-6 bg-[hsl(var(--gts-yellow))] bg-opacity-10 rounded-full text-[hsl(var(--gts-dark))] w-20 h-20 flex items-center justify-center group-hover:bg-[hsl(var(--gts-yellow))] group-hover:text-[hsl(var(--gts-dark))] transition-all duration-300">
                    {benefit.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-[hsl(var(--gts-dark))]">{benefit.title}</h3>
                  <div className="text-2xl font-bold text-[hsl(var(--gts-yellow))] mb-4">{benefit.stat}</div>
                  <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
                </div>
              ))}
            </div>

            {/* Credentials Section */}
            <div className="bg-white rounded-lg p-8 shadow-[var(--shadow-card)]">
              <h3 className="text-2xl font-bold text-center mb-8 text-[hsl(var(--gts-dark))]">Professional Credentials & Certifications</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {credentials.map((cred, index) => (
                  <div key={index} className="text-center p-4 border border-gray-200 rounded-lg">
                    <Shield className="w-8 h-8 text-[hsl(var(--gts-dark))] mx-auto mb-3" />
                    <h4 className="font-semibold text-[hsl(var(--gts-dark))] mb-2">{cred.name}</h4>
                    <p className="text-sm text-gray-600">{cred.code}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Before/After Gallery Placeholder */}
        <section className="section-padding bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[hsl(var(--gts-dark))] mb-6">
                See Our Work in Action
              </h2>
              <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Before and after transformations from our recent projects
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((_, index) => (
                <div key={index} className="section-gradient rounded-lg p-8 flex flex-col items-center justify-center min-h-[250px] card-hover">
                  <Image className="w-16 h-16 text-gray-400 mb-4" />
                  <p className="text-gray-500 text-center">Before/After Project #{index + 1}</p>
                  <p className="text-gray-400 text-sm mt-2 text-center">Upload your best project photos here</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Enhanced Testimonials Section */}
        <section className="section-padding section-gradient">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[hsl(var(--gts-dark))] mb-6">
                Customer Success Stories
              </h2>
              <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
                Real feedback from real customers - see why we're the trusted choice across the region
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
                    <p className="text-gray-600 mb-6 italic leading-relaxed text-lg">"{testimonial.text}"</p>
                    <div className="border-t pt-4">
                      <p className="font-bold text-[hsl(var(--gts-dark))] text-lg">{testimonial.name}</p>
                      <p className="text-sm text-gray-500 flex items-center mb-2">
                        <MapPin className="w-4 h-4 mr-1" />
                        {testimonial.location}
                      </p>
                      <p className="text-sm text-[hsl(var(--gts-yellow))] font-medium mb-1">{testimonial.project}</p>
                      <p className="text-xs text-gray-400">{testimonial.date}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center mt-12">
              <Button asChild variant="outline" className="border-[hsl(var(--gts-yellow))] text-[hsl(var(--gts-yellow))] hover:bg-[hsl(var(--gts-yellow))] hover:text-[hsl(var(--gts-dark))]">
                <Link to="/testimonials">View All Customer Reviews</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Service Area & Coverage Map */}
        <section className="section-padding bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[hsl(var(--gts-dark))] mb-6">
                Our Service Coverage
              </h2>
              <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Comprehensive coverage across Kent, London, and Essex with rapid response times
              </p>
            </div>

            <div className="section-gradient rounded-lg p-12 flex flex-col items-center justify-center mb-12 min-h-[400px]">
              <MapPin className="w-24 h-24 text-gray-400 mb-4" />
              <p className="text-gray-500 text-center text-lg mb-2">Interactive Service Area Map Placeholder</p>
              <p className="text-gray-400 text-sm text-center">Show coverage areas, response times, and local offices</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="p-6">
                <h3 className="text-2xl font-bold text-[hsl(var(--gts-dark))] mb-4">Kent</h3>
                <p className="text-gray-600 mb-4">Comprehensive coverage across all Kent boroughs</p>
                <p className="text-sm text-[hsl(var(--gts-yellow))] font-semibold">Average response: 45 minutes</p>
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-bold text-[hsl(var(--gts-dark))] mb-4">London</h3>
                <p className="text-gray-600 mb-4">All London boroughs and surrounding areas</p>
                <p className="text-sm text-[hsl(var(--gts-yellow))] font-semibold">Average response: 60 minutes</p>
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-bold text-[hsl(var(--gts-dark))] mb-4">Essex</h3>
                <p className="text-gray-600 mb-4">Full Essex coverage including Basildon & Chelmsford</p>
                <p className="text-sm text-[hsl(var(--gts-yellow))] font-semibold">Average response: 50 minutes</p>
              </div>
            </div>
          </div>
        </section>

        {/* Enhanced Final CTA Section */}
        <section className="hero-gradient text-white py-20">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-4xl mx-auto">
              <Award className="w-16 h-16 text-[hsl(var(--gts-yellow))] mx-auto mb-6" />
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
                Ready to Get Your Project Started?
              </h2>
              <p className="text-xl md:text-2xl mb-8 text-gray-200 max-w-3xl mx-auto leading-relaxed">
                Join thousands of satisfied customers who chose GTS GrabHire for their waste management needs. 
                Professional service guaranteed with same-day availability.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 text-center">
                <div className="p-6">
                  <Phone className="w-8 h-8 text-[hsl(var(--gts-yellow))] mx-auto mb-3" />
                  <h3 className="font-bold text-lg mb-2">Call for Instant Quote</h3>
                  <p className="text-gray-300 mb-3">Speak to our experts now</p>
                  <p className="text-2xl font-bold text-[hsl(var(--gts-yellow))]">07958 710 548</p>
                </div>
                <div className="p-6">
                  <Calendar className="w-8 h-8 text-[hsl(var(--gts-yellow))] mx-auto mb-3" />
                  <h3 className="font-bold text-lg mb-2">Book Online</h3>
                  <p className="text-gray-300 mb-3">Quick 2-minute form</p>
                  <Button asChild variant="cta" className="w-full">
                    <Link to="/quote">Get Quote Now</Link>
                  </Button>
                </div>
                <div className="p-6">
                  <Clock className="w-8 h-8 text-[hsl(var(--gts-yellow))] mx-auto mb-3" />
                  <h3 className="font-bold text-lg mb-2">Emergency Service</h3>
                  <p className="text-gray-300 mb-3">24/7 availability</p>
                  <Button asChild variant="outlineWhite" className="w-full">
                    <a href="tel:07958710548">Emergency Call</a>
                  </Button>
                </div>
              </div>

              <div className="border-t border-white/20 pt-8">
                <p className="text-gray-300 mb-4">
                  ✓ Environment Agency Licensed ✓ £2M Insured ✓ Same Day Service ✓ No Hidden Costs
                </p>
                <p className="text-sm text-gray-400">
                  Operating across Kent, London & Essex since 1989 • Family Business You Can Trust
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </>
  );
};

export default EnhancedIndex;