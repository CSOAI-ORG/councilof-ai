import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Truck, Weight, Gauge, Users, CheckCircle, Clock, MapPin, Phone, Zap, Shield } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";

const Equipment = () => {
  const grabLorries = [
    {
      name: "6-Wheeler Grab Lorry",
      capacity: "8-12 tons",
      reach: "Up to 8 meters",
      features: ["Perfect for residential projects", "Access through standard gates", "Ideal for garden clearance", "Cost-effective for small loads"],
      applications: ["Domestic garden clearance", "Small building projects", "Driveway construction", "Pool excavation"],
      specs: {
        length: "7.5m",
        width: "2.5m",
        height: "3.2m",
        grabReach: "8m",
        grabCapacity: "1.2m³"
      }
    },
    {
      name: "8-Wheeler Grab Lorry",
      capacity: "12-16 tons",
      reach: "Up to 10 meters",
      features: ["Maximum capacity", "Extended reach capabilities", "Perfect for large projects", "Commercial grade performance"],
      applications: ["Commercial construction", "Large site clearance", "Utility installations", "Major excavations"],
      specs: {
        length: "10m", 
        width: "2.55m",
        height: "3.8m",
        grabReach: "10m",
        grabCapacity: "2.1m³"
      }
    }
  ];

  const capabilities = [
    {
      icon: <Weight className="w-8 h-8" />,
      title: "16-Ton Capacity",
      description: "Our largest grab lorries can carry up to 16 tons of waste - equivalent to 3 skip loads",
      highlight: "= 3 Skip Loads"
    },
    {
      icon: <Gauge className="w-8 h-8" />,
      title: "10-Meter Reach",
      description: "Extended grab arm reaches over buildings, fences, and obstacles up to 10 meters away",
      highlight: "Over walls & fences"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Precision Control",
      description: "Hydraulic grab with 360° rotation for precise material handling and placement",
      highlight: "360° rotation"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "All-Terrain Access",
      description: "4x4 capability and compact design allows access to challenging locations",
      highlight: "Goes anywhere"
    }
  ];

  const safetyFeatures = [
    "HIAB certified operators with 10+ years experience",
    "Full insurance coverage (£2M public liability)",
    "Daily vehicle safety inspections and maintenance",
    "Environment Agency waste carrier license",
    "Health & safety risk assessment on every job",
    "Emergency breakdown and recovery service"
  ];

  return (
    <>
      <SEOHead 
        title="Professional Grab Lorry Equipment | 6 & 8 Wheeler Fleet | Kent, London, Essex"
        description="Modern grab lorry fleet with 6 & 8 wheeler vehicles. Up to 16-ton capacity, 10m reach. Certified operators, fully insured. Same day service across Kent, London & Essex."
        keywords="grab lorry specifications, grab hire equipment, 6 wheeler grab lorry, 8 wheeler grab lorry, grab lorry capacity, professional grab hire fleet"
      />
      
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="hero-gradient text-white py-20 lg:py-32">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <Badge variant="secondary" className="bg-[hsl(var(--gts-yellow))] text-[hsl(var(--gts-dark))] mb-6 text-lg px-6 py-2">
                Professional Equipment Fleet
              </Badge>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                State-of-the-Art <span className="text-[hsl(var(--gts-yellow))]">Grab Lorry Fleet</span>
              </h1>
              
              <p className="text-xl md:text-2xl mb-8 text-gray-200 leading-relaxed">
                Modern, reliable equipment operated by certified professionals with decades of experience
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild variant="cta" size="lg" className="text-lg px-8 py-4">
                  <Link to="/quote">
                    Get Equipment Quote
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                </Button>
                <Button asChild variant="outlineWhite" size="lg" className="text-lg px-8 py-4">
                  <a href="tel:07956222691">
                    <Phone className="mr-2 w-5 h-5" />
                    Speak to Expert
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Equipment Overview */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-[hsl(var(--gts-dark))] mb-6">
                Our Grab Lorry Fleet
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Choose from our range of 6-wheeler and 8-wheeler grab lorries, each specifically designed for different project requirements
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {grabLorries.map((lorry, index) => (
                <Card key={index} className="overflow-hidden shadow-lg">
                  <CardHeader className="bg-[hsl(var(--gts-navy))] text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-2xl mb-2">{lorry.name}</CardTitle>
                        <div className="flex gap-4">
                          <Badge variant="secondary" className="bg-[hsl(var(--gts-yellow))] text-[hsl(var(--gts-dark))]">
                            {lorry.capacity}
                          </Badge>
                          <Badge variant="outline" className="border-white text-white">
                            {lorry.reach}
                          </Badge>
                        </div>
                      </div>
                      <Truck className="w-12 h-12 text-[hsl(var(--gts-dark))]" />
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-6">
                    <div className="mb-6">
                      <h4 className="font-semibold text-[hsl(var(--gts-dark))] mb-3">Key Features</h4>
                      <ul className="space-y-2">
                        {lorry.features.map((feature, idx) => (
                          <li key={idx} className="flex items-center text-gray-600">
                            <CheckCircle className="w-4 h-4 text-[hsl(var(--gts-success))] mr-3 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mb-6">
                      <h4 className="font-semibold text-[hsl(var(--gts-dark))] mb-3">Perfect For</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {lorry.applications.map((app, idx) => (
                          <div key={idx} className="text-sm text-gray-600 section-gradient p-2 rounded">
                            {app}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="font-semibold text-[hsl(var(--gts-dark))] mb-3">Specifications</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Length:</span> {lorry.specs.length}
                        </div>
                        <div>
                          <span className="font-medium">Width:</span> {lorry.specs.width}
                        </div>
                        <div>
                          <span className="font-medium">Height:</span> {lorry.specs.height}
                        </div>
                        <div>
                          <span className="font-medium">Grab Reach:</span> {lorry.specs.grabReach}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Capabilities Section */}
        <section className="py-16 section-gradient">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-[hsl(var(--gts-dark))] mb-6">
                Superior Equipment Capabilities
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Advanced hydraulic systems and precision engineering deliver unmatched performance
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {capabilities.map((capability, index) => (
                <Card key={index} className="text-center card-hover">
                  <CardHeader>
                     <div className="mx-auto mb-4 p-4 bg-[hsl(var(--gts-yellow))] bg-opacity-10 rounded-full text-[hsl(var(--gts-dark))]">
                       {capability.icon}
                     </div>
                    <CardTitle className="text-xl text-[hsl(var(--gts-dark))]">{capability.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">{capability.description}</p>
                    <Badge variant="outline" className="bg-[hsl(var(--gts-yellow))] text-[hsl(var(--gts-dark))] border-0">
                      {capability.highlight}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Safety & Certification */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-[hsl(var(--gts-dark))] mb-6">
                  Safety & Certification Standards
                </h2>
                <p className="text-lg text-gray-600">
                  Our equipment and operators meet the highest industry safety standards
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div>
                  <h3 className="text-2xl font-bold text-[hsl(var(--gts-dark))] mb-6">Safety Features</h3>
                  <ul className="space-y-3">
                    {safetyFeatures.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Shield className="w-5 h-5 text-[hsl(var(--gts-success))] mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-[hsl(var(--gts-dark))] mb-6">Certifications</h3>
                  <div className="space-y-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center">
                          <Badge variant="outline" className="mr-3">HIAB</Badge>
                          <span className="text-gray-600">Certified crane operators</span>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center">
                          <Badge variant="outline" className="mr-3">EA</Badge>
                          <span className="text-gray-600">Environment Agency licensed</span>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center">
                          <Badge variant="outline" className="mr-3">CHAS</Badge>
                          <span className="text-gray-600">Health & safety approved</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-[hsl(var(--gts-success))] text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Need Professional Equipment for Your Project?
            </h2>
            <p className="text-xl mb-8 max-w-3xl mx-auto">
              Get expert advice on the right grab lorry for your specific requirements
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-[hsl(var(--gts-success))]">
                <Link to="/quote">Get Equipment Quote</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-[hsl(var(--gts-success))]">
                <a href="tel:07958710548">Call Now: 07958 710 548</a>
              </Button>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </>
  );
};

export default Equipment;