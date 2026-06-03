import React from "react";
import SEOHead from "@/components/SEOHead";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Badge from "@/components/Badge";
import { 
  MapPin, 
  Clock, 
  Phone, 
  CheckCircle, 
  Truck,
  Building2,
  Shield,
  Zap,
  AlertTriangle
} from "lucide-react";
import { Link } from "react-router-dom";

const London = () => {
  const services = [
    "Grab Hire Services",
    "Construction Waste Removal", 
    "Commercial Office Clearance",
    "Emergency Waste Services",
    "Muck Away & Excavation",
    "Contaminated Land Clearance",
    "High-Rise Project Support",
    "Restricted Access Solutions"
  ];

  const areas = [
    { borough: "Bromley", postcode: "BR1-BR8", responseTime: "20 mins", specialty: "Construction" },
    { borough: "Croydon", postcode: "CR0-CR9", responseTime: "25 mins", specialty: "Commercial" },
    { borough: "Greenwich", postcode: "SE7-SE18", responseTime: "30 mins", specialty: "Utilities" },
    { borough: "Lewisham", postcode: "SE4-SE14", responseTime: "25 mins", specialty: "Residential" },
    { borough: "Bexley", postcode: "DA5-DA18", responseTime: "20 mins", specialty: "Industrial" },
    { borough: "Southwark", postcode: "SE1-SE17", responseTime: "35 mins", specialty: "Heritage" }
  ];

  const londonSpecialty = [
    {
      title: "High-Rise Construction",
      description: "Specialized equipment and procedures for London's tower developments and skyscraper projects.",
      icon: Building2
    },
    {
      title: "Restricted Access",
      description: "Expert navigation of London's narrow streets, parking restrictions, and access challenges.",
      icon: AlertTriangle
    },
    {
      title: "Emergency Response",
      description: "24/7 crisis management for urgent London clearances, including flood and fire damage.",
      icon: Zap
    },
    {
      title: "Compliance Expertise",
      description: "Full knowledge of London borough regulations, permits, and environmental requirements.",
      icon: Shield
    }
  ];

  const projects = [
    {
      title: "Canary Wharf Tower Development",
      location: "Isle of Dogs, E14",
      description: "6-month contaminated soil removal project for new financial district tower.",
      challenge: "Restricted access, contaminated materials, high security requirements"
    },
    {
      title: "Greenwich Hospital Modernization", 
      location: "Greenwich, SE10",
      description: "Heritage site clearance maintaining strict conservation protocols.",
      challenge: "Historic preservation, medical waste protocols, limited access hours"
    },
    {
      title: "Croydon Shopping Centre Redevelopment",
      location: "Croydon, CR0",
      description: "Major commercial clearance and construction waste management.",
      challenge: "Active shopping environment, phased clearance, public safety"
    }
  ];

  const boroughExpertise = [
    "Traffic Management Liaison",
    "Borough Permit Applications", 
    "Environmental Impact Assessments",
    "Heritage Site Protocols",
    "Security Clearance Procedures",
    "Multi-Phase Project Coordination",
    "Emergency Response Planning",
    "Noise Regulation Compliance"
  ];

  return (
    <>
      <SEOHead
        title="Grab Hire London | Professional Waste Removal Services | GTS Grab Hire"
        description="Professional grab hire services across London. Bromley, Croydon, Greenwich coverage. Restricted access specialists, high-rise projects. Licensed waste carrier."
        keywords="grab hire London, waste removal London, grab lorry London, construction waste London, Bromley grab hire, Croydon waste removal, Greenwich grab lorry, London waste management"
        canonical="https://gtsgrabhire.com/locations/london"
      />
      <div className="min-h-screen bg-background">
        <Header />
        
        {/* Hero Section */}
        <section className="hero-gradient text-white py-20">
          <div className="container mx-auto px-4">
            <div className="flex justify-center mb-4">
              <Badge>London Coverage</Badge>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-center">
              London Grab Hire Specialists
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-center">
              Expert waste removal across London's boroughs. Specialists in restricted access, high-rise projects, and complex urban clearances.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="btn-primary">
                <Phone className="mr-2 h-5 w-5" />
                Call 07958 710 548
              </Button>
              <Button size="lg" variant="outline" className="btn-outline-white" asChild>
                <Link to="/quote">Get London Quote</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* London Specializations */}
        <section className="section-padding">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">London Construction Expertise</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Specialized services designed for London's unique construction challenges and urban environment.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {londonSpecialty.map((specialty, index) => {
                const IconComponent = specialty.icon;
                return (
                  <Card key={index} className="text-center h-full">
                    <CardHeader>
                      <div className="service-icon mx-auto mb-4">
                        <IconComponent className="h-8 w-8" />
                      </div>
                      <CardTitle className="text-lg">{specialty.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{specialty.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Coverage Areas */}
        <section className="section-padding bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">London Borough Coverage</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Comprehensive coverage across London's boroughs with specialized expertise for each area's unique requirements.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {areas.map((area, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <CardTitle className="text-lg">{area.borough}</CardTitle>
                      <Badge variant="navy">{area.specialty}</Badge>
                    </div>
                    <CardDescription>{area.postcode}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 mr-1" />
                        {area.responseTime}
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 mr-1" />
                        Available 24/7
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Major Projects */}
        <section className="section-padding">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">London Project Portfolio</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Successfully completed major clearance projects across London's most challenging sites.
              </p>
            </div>
            
            <div className="grid lg:grid-cols-3 gap-8">
              {projects.map((project, index) => (
                <Card key={index} className="h-full">
                  <CardHeader>
                    <CardTitle className="text-lg">{project.title}</CardTitle>
                    <CardDescription className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {project.location}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm">{project.description}</p>
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Key Challenges:</h4>
                      <p className="text-sm text-muted-foreground">{project.challenge}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* London Expertise */}
        <section className="section-padding bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">London Construction Authority</h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Over 35 years operating in London's complex construction environment. We understand the unique challenges of working in the capital.
                </p>
                
                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-[hsl(var(--gts-navy))] mb-2">500+</div>
                    <div className="text-sm text-muted-foreground">London Projects</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-[hsl(var(--gts-navy))] mb-2">&lt;30min</div>
                    <div className="text-sm text-muted-foreground">Response Time</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-[hsl(var(--gts-navy))] mb-2">24/7</div>
                    <div className="text-sm text-muted-foreground">Emergency Cover</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-[hsl(var(--gts-navy))] mb-2">100%</div>
                    <div className="text-sm text-muted-foreground">Compliant</div>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <Button size="lg" className="btn-primary">
                    <Phone className="mr-2 h-5 w-5" />
                    Call Now
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link to="/quote">Get Quote</Link>
                  </Button>
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold mb-6">London Borough Expertise</h3>
                <div className="grid grid-cols-2 gap-3">
                  {boroughExpertise.map((expertise, index) => (
                    <div key={index} className="flex items-center p-3 bg-white rounded-lg shadow-sm">
                      <CheckCircle className="h-4 w-4 text-[hsl(var(--gts-yellow))] mr-2 flex-shrink-0" />
                      <span className="text-sm">{expertise}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Services Available */}
        <section className="section-padding">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">London Services</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Comprehensive waste management services tailored for London's demanding construction environment.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {services.map((service, index) => (
                <div key={index} className="flex items-center p-4 bg-white rounded-lg shadow-sm border-l-4 border-[hsl(var(--gts-yellow))]">
                  <Truck className="h-5 w-5 text-[hsl(var(--gts-navy))] mr-3 flex-shrink-0" />
                  <span className="font-medium text-sm">{service}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="cta-gradient text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              London's Trusted Grab Hire Partner
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Complex London project? We have the expertise, equipment, and experience to handle it. Available 24/7 for emergency response.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="btn-primary">
                <Phone className="mr-2 h-5 w-5" />
                Emergency: 07958 710 548
              </Button>
              <Button size="lg" variant="outline" className="btn-outline-white" asChild>
                <Link to="/quote">London Project Quote</Link>
              </Button>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default London;