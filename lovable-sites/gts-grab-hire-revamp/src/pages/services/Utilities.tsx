import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, CheckCircle, Clock, Phone, ArrowRight, Award, AlertTriangle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import Badge from "@/components/Badge";

const Utilities = () => {
  const services = [
    {
      title: 'Cable and Pipe Laying',
      description: 'Specialized support for underground cable and pipe installation projects',
      features: [
        'Excavation and backfill services',
        'Spoil removal and disposal',
        'Precise material placement',
        'Reinstatement support'
      ]
    },
    {
      title: 'Excavation and Reinstatement',
      description: 'Complete excavation services with professional reinstatement to original condition',
      features: [
        'Road and footpath excavation',
        'Utility trench digging',
        'Proper backfilling procedures',
        'Surface reinstatement'
      ]
    },
    {
      title: 'Emergency Call-Outs',
      description: '24/7 emergency response for urgent utilities work and repairs',
      features: [
        '24/7 availability',
        'Rapid response times',
        'Emergency waste removal',
        'Crisis management support'
      ]
    }
  ];

  const certifications = [
    {
      title: 'CHAS Accreditation',
      description: 'CHAS (Contractors Health and Safety Assessment Scheme) approved for utilities work'
    },
    {
      title: 'SafeContractor Certified',
      description: 'SafeContractor certification demonstrating our commitment to health and safety excellence'
    },
    {
      title: 'Utilities Training',
      description: 'All operators trained in utilities-specific procedures and safety requirements'
    },
    {
      title: 'Live Services Awareness',
      description: 'Extensive training in working safely around live utility services'
    }
  ];

  const safetyFeatures = [
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Comprehensive Safety Policy',
      description: 'Detailed safety procedures specific to utilities sector requirements'
    },
    {
      icon: <Award className="w-6 h-6" />,
      title: 'Certified Operators',
      description: 'All operators hold relevant certifications and receive regular safety training'
    },
    {
      icon: <AlertTriangle className="w-6 h-6" />,
      title: 'Risk Assessment',
      description: 'Thorough risk assessments conducted for all utilities projects'
    },
    {
      icon: <CheckCircle className="w-6 h-6" />,
      title: 'Compliance Assurance',
      description: 'Full compliance with all relevant utilities industry standards and regulations'
    }
  ];

  return (
    <>
      <SEOHead 
        title="Utilities Grab Hire Services | Specialist Waste Management | GTS Grab Hire"
        description="Specialist grab hire and waste management for utilities sector. 18+ years experience. Health & safety certified. Emergency call-outs. Professional service."
        keywords="utilities grab hire, specialist waste management, emergency call-outs, CHAS approved, SafeContractor, utilities sector"
      />
      
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="hero-gradient text-white py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <Badge variant="yellow" className="mb-6">
                Utilities Services
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                Specialist Grab Hire and Waste Management for the Utilities Sector
              </h1>
              <p className="text-xl md:text-2xl text-gray-200 mb-8 leading-relaxed">
                Over 18 years of specialized experience serving the utilities industry with professional, safety-focused grab hire and waste management services.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild variant="cta" size="xl">
                  <Link to="/quote">Get Free Quote</Link>
                </Button>
                <Button asChild variant="outlineWhite" size="xl">
                  <a href="tel:07956222691">
                    <Phone className="mr-2 w-5 h-5" />
                    Call: 07956 222 691
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Experience Section */}
        <section className="section-padding section-gradient">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-[hsl(var(--gts-dark))] mb-6">
                  18+ Years of Utilities Experience
                </h2>
                <div className="space-y-4 text-lg text-gray-700 leading-relaxed">
                  <p>
                    With over 18 years of dedicated experience in the utilities sector, GTS GrabHire understands 
                    the unique challenges and requirements of working with gas, water, electricity, and telecoms companies.
                  </p>
                  <p>
                    We have built our reputation on delivering safe, efficient, and compliant services that meet 
                    the exacting standards required by the utilities industry. Our team is trained to work around 
                    live services and understand the critical nature of utilities infrastructure.
                  </p>
                  <p>
                    From emergency call-outs to planned maintenance projects, we provide the specialized equipment, 
                    expertise, and responsiveness that utilities companies depend on to keep essential services running.
                  </p>
                </div>
              </div>
              <Card className="bg-white shadow-[var(--shadow-card)] border-0">
                <CardContent className="p-8">
                  <div className="bg-[hsl(var(--gts-yellow))] bg-opacity-10 rounded-lg p-8 text-center">
                    <Shield className="w-16 h-16 text-[hsl(var(--gts-dark))] mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-[hsl(var(--gts-dark))] mb-4">Utilities Expertise</h3>
                    <div className="grid grid-cols-1 gap-4 text-sm">
                      <div className="bg-white p-3 rounded">
                        <p className="font-semibold text-[hsl(var(--gts-dark))]">Experience</p>
                        <p className="text-gray-600">18+ years in utilities</p>
                      </div>
                      <div className="bg-white p-3 rounded">
                        <p className="font-semibold text-[hsl(var(--gts-dark))]">Response</p>
                        <p className="text-gray-600">24/7 emergency service</p>
                      </div>
                      <div className="bg-white p-3 rounded">
                        <p className="font-semibold text-[hsl(var(--gts-dark))]">Compliance</p>
                        <p className="text-gray-600">CHAS & SafeContractor</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section className="section-padding bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-[hsl(var(--gts-dark))] mb-6">
                Specialized Utilities Services
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Comprehensive grab hire and waste management solutions tailored specifically for utilities sector requirements
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {services.map((service, index) => (
                <Card key={index} className="bg-white shadow-[var(--shadow-card)] border-0 card-hover">
                  <CardHeader>
                    <CardTitle className="text-xl text-[hsl(var(--gts-dark))]">{service.title}</CardTitle>
                    <CardDescription className="text-gray-600 leading-relaxed">
                      {service.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {service.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center text-sm text-gray-600">
                          <CheckCircle className="w-4 h-4 text-[hsl(var(--gts-green))] mr-2 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Health and Safety Section */}
        <section className="section-padding section-gradient">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-[hsl(var(--gts-dark))] mb-6">
                Health & Safety Excellence
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Safety is paramount in utilities work. We maintain the highest standards of health and safety compliance across all our operations.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {safetyFeatures.map((feature, index) => (
                <Card key={index} className="text-center bg-white shadow-[var(--shadow-card)] border-0">
                  <CardContent className="p-6">
                    <div className="mx-auto mb-4 p-3 bg-[hsl(var(--gts-yellow))] bg-opacity-10 rounded-full text-[hsl(var(--gts-yellow))] w-12 h-12 flex items-center justify-center">
                      {feature.icon}
                    </div>
                    <h3 className="font-semibold text-[hsl(var(--gts-dark))] mb-2">{feature.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Certifications */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {certifications.map((cert, index) => (
                <Card key={index} className="bg-white shadow-[var(--shadow-card)] border-0">
                  <CardHeader>
                    <div className="flex items-center mb-2">
                      <Award className="w-6 h-6 text-[hsl(var(--gts-green))] mr-3" />
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

        {/* Emergency Services */}
        <section className="section-padding bg-white">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <Card className="bg-red-50 border-red-200 shadow-[var(--shadow-card)]">
                <CardContent className="p-8">
                  <div className="text-center">
                    <Clock className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-red-700 mb-4">24/7 Emergency Response</h3>
                    <p className="text-gray-700 mb-6 leading-relaxed">
                      Utilities emergencies don't wait for business hours. Our emergency response team is available 
                      24/7 to support urgent utilities work across Kent, London, and Essex.
                    </p>
                    <div className="space-y-3 text-left">
                      <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-red-500 mr-3" />
                        <span className="text-gray-700">Rapid deployment within hours</span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-red-500 mr-3" />
                        <span className="text-gray-700">Emergency excavation support</span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-red-500 mr-3" />
                        <span className="text-gray-700">Critical waste removal</span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-red-500 mr-3" />
                        <span className="text-gray-700">Crisis management assistance</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-[hsl(var(--gts-dark))] mb-6">
                  When Every Minute Counts
                </h2>
                <div className="space-y-4 text-lg text-gray-700 leading-relaxed">
                  <p>
                    Utilities emergencies require immediate response and specialized expertise. Our emergency call-out 
                    service provides rapid deployment of grab hire equipment and experienced operators when time is critical.
                  </p>
                  <p>
                    Whether it's a burst main, cable fault, or emergency maintenance requirement, our team understands 
                    the urgency and importance of utilities infrastructure. We work quickly and safely to support 
                    restoration efforts and minimize service disruption.
                  </p>
                  <p>
                    Our 24/7 emergency number connects you directly to our dispatch team who can mobilize equipment 
                    and operators within hours of your call.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="hero-gradient text-white py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Contact Us for Your Utilities Project
            </h2>
            <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
              Specialized utilities services with 18+ years experience. CHAS approved, SafeContractor certified, and available 24/7 for emergencies.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild variant="cta" size="lg">
                <Link to="/quote">
                  Get Specialist Quote
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
              <Button asChild variant="outlineWhite" size="lg">
                <a href="tel:07956222691">
                  <Phone className="mr-2 w-5 h-5" />
                  Emergency: 07956 222 691
                </a>
              </Button>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </>
  );
};

export default Utilities;