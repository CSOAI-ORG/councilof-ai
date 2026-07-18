import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, Recycle, Shield, ArrowRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import Badge from "@/components/Badge";

const Services = () => {
  const services = [
    {
      title: 'Muck Away Services',
      description: 'Efficiently remove large volumes of waste from your site with our professional muck away services. Our tipper lorries can carry up to 20 tons of waste in a single load, which is the equivalent of up to three skip loads of waste.',
      icon: <Truck className="w-12 h-12" />,
      link: '/services/muck-away',
      features: [
        'Up to 20 tons capacity per load',
        'Same day and next day service available',
        'Licensed waste disposal and recycling',
        'Competitive pricing with no hidden costs',
        'Professional, uniformed operators',
        'Full public liability insurance'
      ],
      benefits: [
        'Save time compared to multiple skip collections',
        'No permits required for grab hire',
        'Access difficult areas over fences and walls',
        'Environmentally responsible disposal'
      ]
    },
    {
      title: 'Grab Hire Services',
      description: 'Flexible and cost-effective grab hire solutions for projects of all sizes. Our grab lorries can access difficult areas and work over fences and walls, making them ideal for a wide range of projects from domestic to commercial.',
      icon: <Truck className="w-12 h-12" />,
      link: '/services/grab-hire',
      features: [
        'Flexible hire periods - hourly to daily',
        'Modern, well-maintained grab lorries',
        'Experienced, professional operators',
        '24/7 availability for emergency work',
        'No skip permits required',
        'Comprehensive insurance coverage'
      ],
      benefits: [
        'Access areas skips cannot reach',
        'Load and remove waste in one operation',
        'Perfect for tight spaces and restricted access',
        'Faster than traditional skip hire methods'
      ]
    },
    {
      title: 'Aggregates Supply',
      description: 'High-quality aggregates delivered directly to your site, on time and on budget. We can supply and deliver a wide range of aggregates including sand, gravel, crushed stone, and topsoil using our grab hire vehicles.',
      icon: <Recycle className="w-12 h-12" />,
      link: '/services/aggregates',
      features: [
        'High-quality sand, gravel, and stone',
        'Premium topsoil and landscaping materials',
        'Fast delivery across Kent, London & Essex',
        'Competitive wholesale pricing',
        'Various aggregate grades available',
        'Bulk delivery options'
      ],
      benefits: [
        'Direct delivery to your exact location',
        'Quality materials from trusted suppliers',
        'Flexible delivery scheduling',
        'Can combine with waste removal services'
      ]
    },
    {
      title: 'Utilities Services',
      description: 'Specialized grab hire and waste management for the utilities sector, with over 18 years of experience. We understand the unique requirements of utilities work and provide tailored solutions for cable laying, excavation, and emergency call-outs.',
      icon: <Shield className="w-12 h-12" />,
      link: '/services/utilities',
      features: [
        '18+ years utilities sector experience',
        'Health & safety certified operators',
        'Emergency 24/7 call-out service',
        'Specialist equipment for utilities work',
        'CHAS and SafeContractor approved',
        'Comprehensive safety policies'
      ],
      benefits: [
        'Deep understanding of utilities requirements',
        'Rapid response for emergency situations',
        'Fully compliant with industry standards',
        'Experienced in working around live services'
      ]
    }
  ];

  return (
    <>
      <SEOHead 
        title="Professional Waste Management Services | Grab Hire, Muck Away, Aggregates | GTS"
        description="Complete waste management solutions: Grab hire (1-16 tons), muck away & tipper hire (up to 20 tons), aggregates supply. Kent, London, Essex. Professional, licensed, insured."
        keywords="waste management services, grab hire, muck away, tipper hire, aggregates supply, utilities services, kent london essex"
      />
      
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="hero-gradient text-white py-20">
          <div className="container mx-auto px-4 text-center">
            <Badge variant="yellow" className="mb-6">
              Our Services
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Comprehensive Grab Hire and Waste Management Solutions
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 max-w-4xl mx-auto leading-relaxed">
              Professional services tailored to meet your specific needs, from domestic garden clearance to large commercial projects
            </p>
          </div>
        </section>

        {/* Services Grid */}
        <section className="section-padding section-gradient">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {services.map((service, index) => (
                <Card key={index} className="bg-white border-0 shadow-[var(--shadow-card)] card-hover">
                  <CardHeader className="pb-6">
                    <div className="flex items-start space-x-4">
                      <div className="p-4 bg-[hsl(var(--gts-yellow))] bg-opacity-10 rounded-lg text-[hsl(var(--gts-dark))] flex-shrink-0">
                        {service.icon}
                      </div>
                      <div>
                        <CardTitle className="text-2xl text-[hsl(var(--gts-dark))] mb-2">{service.title}</CardTitle>
                        <CardDescription className="text-gray-600 leading-relaxed text-base">
                          {service.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-6">
                      <div>
                        <h4 className="font-semibold text-[hsl(var(--gts-dark))] mb-3">Service Features:</h4>
                        <ul className="space-y-2">
                          {service.features.map((feature, idx) => (
                            <li key={idx} className="flex items-start text-sm text-gray-600">
                              <div className="w-2 h-2 bg-[hsl(var(--gts-yellow))] rounded-full mr-3 mt-2 flex-shrink-0"></div>
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-[hsl(var(--gts-dark))] mb-3">Key Benefits:</h4>
                        <ul className="space-y-2">
                          {service.benefits.map((benefit, idx) => (
                            <li key={idx} className="flex items-start text-sm text-gray-600">
                              <div className="w-2 h-2 bg-[hsl(var(--gts-success))] rounded-full mr-3 mt-2 flex-shrink-0"></div>
                              {benefit}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <Button asChild className="w-full bg-[hsl(var(--gts-yellow))] hover:bg-[hsl(var(--gts-orange))] text-[hsl(var(--gts-dark))] font-semibold">
                        <Link to={service.link}>
                          Learn More About This Service
                          <ArrowRight className="ml-2 w-4 h-4 text-[hsl(var(--gts-dark))]" />
                        </Link>
                      </Button>
                    </div>
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
              Ready to Get Started?
            </h2>
            <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
              Get a free, no-obligation quote for any of our services. Professional service guaranteed across Kent, London, and Essex.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild variant="cta" size="lg">
                <Link to="/quote">Get Free Quote</Link>
              </Button>
              <Button asChild variant="outlineWhite" size="lg">
                <a href="tel:07958710548">Call: 07958 710 548</a>
              </Button>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </>
  );
};

export default Services;