import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Building2, Home, Factory, Zap, Truck, Users, CheckCircle, Phone, Clock, Shield } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";

const Industries = () => {
  const industries = [
    {
      icon: <Building2 className="w-12 h-12" />,
      title: "Construction & Development",
      description: "Complete waste management solutions for construction sites, from foundation to finish",
      projects: ["Office developments", "Retail construction", "Infrastructure projects", "Site preparation"],
      services: ["Muck away services", "Construction waste removal", "Material delivery", "Emergency clearance"],
      challenges: ["Tight deadlines", "Limited access", "Mixed waste types", "Health & safety compliance"],
      solutions: ["Same-day response", "Over-fence access", "Waste segregation", "Full documentation"],
      caseStudy: {
        project: "50-Unit Housing Development, Kent",
        challenge: "Remove 500+ tonnes of excavated material with restricted site access",
        solution: "6-month contract with daily grab lorry service, over-fence waste removal",
        result: "Project completed on schedule, 40% cost saving vs skip hire"
      }
    },
    {
      icon: <Home className="w-12 h-12" />,
      title: "Domestic & Residential",
      description: "Homeowner-friendly services for renovations, extensions, and garden projects",
      projects: ["Home extensions", "Garden clearance", "Driveway construction", "Landscaping projects"],
      services: ["Garden waste removal", "Soil disposal", "Aggregates delivery", "Same-day clearance"],
      challenges: ["Protecting property", "Neighbor considerations", "Small access routes", "Budget constraints"],
      solutions: ["Careful operation", "Minimal disruption", "Compact equipment", "Competitive pricing"],
      caseStudy: {
        project: "Victorian House Extension, London",
        challenge: "Remove foundation spoil from terraced property with no rear access",
        solution: "8-wheeler grab lorry with 10m reach over two-story house",
        result: "Clean removal without property damage, delighted homeowners"
      }
    },
    {
      icon: <Factory className="w-12 h-12" />,
      title: "Industrial & Manufacturing",
      description: "Heavy-duty waste management for industrial facilities and manufacturing sites",
      projects: ["Factory construction", "Warehouse development", "Industrial estates", "Manufacturing plants"],
      services: ["Heavy waste removal", "Hazardous material disposal", "Bulk aggregates", "24/7 operations"],
      challenges: ["Hazardous materials", "High volumes", "Continuous operations", "Strict regulations"],
      solutions: ["Specialist licensing", "Bulk capacity", "Flexible scheduling", "Full compliance"],
      caseStudy: {
        project: "Manufacturing Plant Expansion, Essex",
        challenge: "Remove contaminated soil and industrial waste during active operations",
        solution: "Night-shift operations with specialized equipment and documentation",
        result: "Zero production downtime, all regulatory requirements met"
      }
    },
    {
      icon: <Zap className="w-12 h-12" />,
      title: "Utilities & Infrastructure", 
      description: "Specialized services for utility companies and infrastructure projects",
      projects: ["Cable installations", "Pipeline projects", "Substation construction", "Road improvements"],
      services: ["Utility excavation support", "Emergency response", "Specialist equipment", "Rapid deployment"],
      challenges: ["Emergency callouts", "Critical infrastructure", "Public safety", "Rapid response needed"],
      solutions: ["24/7 availability", "Specialist training", "Emergency protocols", "30-min response"],
      caseStudy: {
        project: "Emergency Water Main Repair, South London",
        challenge: "Remove excavated material during emergency water main repair",
        solution: "Emergency response team on-site within 20 minutes, continuous support",
        result: "Water supply restored 4 hours faster than projected timeline"
      }
    }
  ];

  const whyChooseUs = [
    {
      icon: <Users className="w-8 h-8" />,
      title: "Industry Expertise",
      description: "35+ years serving diverse industries with specialized knowledge and solutions"
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: "Flexible Scheduling", 
      description: "24/7 availability with same-day service and emergency response capabilities"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Full Compliance",
      description: "All necessary licenses, insurance, and certifications for peace of mind"
    },
    {
      icon: <Truck className="w-8 h-8" />,
      title: "Modern Fleet",
      description: "State-of-the-art equipment maintained to the highest safety standards"
    }
  ];

  return (
    <>
      <SEOHead 
        title="Industry-Specific Grab Hire Services | Construction, Residential, Industrial | Kent, London, Essex"
        description="Specialized grab hire services for construction, residential, industrial & utilities sectors. 35+ years industry experience, same-day service, full compliance across Kent, London & Essex."
        keywords="construction grab hire, residential waste removal, industrial grab hire, utilities grab hire, sector specific grab hire, commercial waste management"
      />
      
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="hero-gradient text-white py-20 lg:py-32">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <Badge variant="secondary" className="bg-[hsl(var(--gts-yellow))] text-[hsl(var(--gts-dark))] mb-6 text-lg px-6 py-2">
                Industry Specialists Since 1988
              </Badge>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                <span className="text-[hsl(var(--gts-yellow))]">Industry-Specific</span> Grab Hire Solutions
              </h1>
              
              <p className="text-xl md:text-2xl mb-8 text-gray-200 leading-relaxed">
                Tailored services for construction, residential, industrial, and utilities sectors
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild variant="cta" size="lg" className="text-lg px-8 py-4">
                  <Link to="/quote">
                    Get Industry Quote
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                </Button>
                <Button asChild variant="outlineWhite" size="lg" className="text-lg px-8 py-4">
                  <a href="tel:07956222691">
                    <Phone className="mr-2 w-5 h-5" />
                    Industry Consultation
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Industries Overview */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-[hsl(var(--gts-dark))] mb-6">
                Industries We Serve
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Specialized expertise across multiple sectors with tailored solutions for each industry's unique requirements
              </p>
            </div>

            <div className="space-y-16">
              {industries.map((industry, index) => (
                <div key={index} className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                  <div className={`${index % 2 === 1 ? 'lg:order-2' : ''}`}>
                    <div className="flex items-center mb-6">
                       <div className="p-4 bg-[hsl(var(--gts-yellow))] bg-opacity-10 rounded-full text-[hsl(var(--gts-dark))] mr-4">
                         {industry.icon}
                       </div>
                      <h3 className="text-3xl font-bold text-[hsl(var(--gts-dark))]">{industry.title}</h3>
                    </div>
                    
                    <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                      {industry.description}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <div>
                        <h4 className="font-bold text-[hsl(var(--gts-dark))] mb-3">Typical Projects</h4>
                        <ul className="space-y-2">
                          {industry.projects.map((project, idx) => (
                            <li key={idx} className="flex items-center text-gray-600 text-sm">
                              <CheckCircle className="w-4 h-4 text-[hsl(var(--gts-success))] mr-2 flex-shrink-0" />
                              {project}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-bold text-[hsl(var(--gts-dark))] mb-3">Our Services</h4>
                        <ul className="space-y-2">
                          {industry.services.map((service, idx) => (
                            <li key={idx} className="flex items-center text-gray-600 text-sm">
                              <CheckCircle className="w-4 h-4 text-[hsl(var(--gts-success))] mr-2 flex-shrink-0" />
                              {service}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <Button asChild variant="outline" className="border-[hsl(var(--gts-yellow))] text-[hsl(var(--gts-yellow))] hover:bg-[hsl(var(--gts-yellow))] hover:text-[hsl(var(--gts-dark))]">
                      <Link to="/quote">Get Industry Quote</Link>
                    </Button>
                  </div>

                  <div className={`${index % 2 === 1 ? 'lg:order-1' : ''}`}>
                    <Card className="shadow-lg">
                      <CardHeader className="bg-[hsl(var(--gts-navy))] text-white">
                        <CardTitle className="text-xl">Case Study</CardTitle>
                      </CardHeader>
                      <CardContent className="p-6">
                        <h4 className="font-bold text-[hsl(var(--gts-dark))] mb-3">{industry.caseStudy.project}</h4>
                        
                        <div className="space-y-4">
                          <div>
                            <span className="font-semibold text-red-600">Challenge:</span>
                            <p className="text-gray-600 text-sm mt-1">{industry.caseStudy.challenge}</p>
                          </div>
                          
                          <div>
                            <span className="font-semibold text-[hsl(var(--gts-yellow))]">Solution:</span>
                            <p className="text-gray-600 text-sm mt-1">{industry.caseStudy.solution}</p>
                          </div>
                          
                          <div>
                            <span className="font-semibold text-[hsl(var(--gts-success))]">Result:</span>
                            <p className="text-gray-600 text-sm mt-1">{industry.caseStudy.result}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="py-16 section-gradient">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-[hsl(var(--gts-dark))] mb-6">
                Why Industries Choose GTS GrabHire
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Our deep industry knowledge and specialized approach delivers superior results across all sectors
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {whyChooseUs.map((reason, index) => (
                <Card key={index} className="text-center card-hover">
                  <CardHeader>
                    <div className="mx-auto mb-4 p-4 bg-[hsl(var(--gts-yellow))] bg-opacity-10 rounded-full text-[hsl(var(--gts-yellow))]">
                      {reason.icon}
                    </div>
                    <CardTitle className="text-xl text-[hsl(var(--gts-dark))]">{reason.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">{reason.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Industry Challenges & Solutions */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-[hsl(var(--gts-dark))] mb-6">
                  Common Industry Challenges We Solve
                </h2>
                <p className="text-lg text-gray-600">
                  Every industry faces unique waste management challenges - here's how we address them
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl text-[hsl(var(--gts-dark))]">Access Restrictions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">
                      Tight spaces, height restrictions, and challenging site access are common issues across all industries.
                    </p>
                    <div className="flex items-center text-[hsl(var(--gts-success))]">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      <span className="font-semibold">10m reach over obstacles</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl text-[hsl(var(--gts-dark))]">Time Constraints</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">
                      Project deadlines and operational requirements demand rapid waste removal solutions.
                    </p>
                    <div className="flex items-center text-[hsl(var(--gts-success))]">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      <span className="font-semibold">Same day service available</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl text-[hsl(var(--gts-dark))]">Compliance Requirements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">
                      Strict environmental and health & safety regulations must be met for all waste disposal.
                    </p>
                    <div className="flex items-center text-[hsl(var(--gts-success))]">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      <span className="font-semibold">Full documentation & licensing</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl text-[hsl(var(--gts-dark))]">Cost Management</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">
                      Budget constraints require efficient solutions that deliver maximum value for money.
                    </p>
                    <div className="flex items-center text-[hsl(var(--gts-success))]">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      <span className="font-semibold">40% savings vs skip hire</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-[hsl(var(--gts-success))] text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Discuss Your Industry Requirements?
            </h2>
            <p className="text-xl mb-8 max-w-3xl mx-auto">
              Speak to our industry specialists about your specific waste management challenges
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-[hsl(var(--gts-success))]">
                <Link to="/quote">Get Industry Quote</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-[hsl(var(--gts-success))]">
                <a href="tel:07958710548">Call Industry Expert: 07958 710 548</a>
              </Button>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </>
  );
};

export default Industries;