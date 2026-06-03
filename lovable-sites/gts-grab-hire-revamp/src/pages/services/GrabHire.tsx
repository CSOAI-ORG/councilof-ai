import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, CheckCircle, Clock, Shield, Phone, ArrowRight, X } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import Badge from "@/components/Badge";

const GrabHire = () => {
  const specifications = [
    {
      title: 'Capacity',
      value: 'Up to 16 tons',
      description: 'Maximum legal load capacity for efficient waste removal'
    },
    {
      title: 'Reach',
      value: 'Over fences and walls',
      description: 'Access areas that skips and other vehicles cannot reach'
    },
    {
      title: 'Access',
      value: 'Difficult areas',
      description: 'Navigate tight spaces and restricted access points'
    },
    {
      title: 'Availability',
      value: '24/7 service',
      description: 'Round-the-clock availability for urgent requirements'
    },
    {
      title: 'Response',
      value: 'Same day or next day',
      description: 'Rapid response times across all service areas'
    },
    {
      title: 'Permits',
      value: 'No permits required',
      description: 'Unlike skips, no road permits or licenses needed'
    }
  ];

  const comparison = [
    {
      feature: 'Permits Required',
      grabHire: false,
      skipHire: true,
      grabHireText: 'No permits needed',
      skipHireText: 'Road permits required'
    },
    {
      feature: 'Access Flexibility',
      grabHire: true,
      skipHire: false,
      grabHireText: 'Can reach over obstacles',
      skipHireText: 'Limited to accessible areas'
    },
    {
      feature: 'Speed of Service',
      grabHire: true,
      skipHire: false,
      grabHireText: 'Immediate load & go',
      skipHireText: 'Multiple visits required'
    },
    {
      feature: 'Capacity per Visit',
      grabHire: true,
      skipHire: false,
      grabHireText: 'Up to 16 tons',
      skipHireText: 'Typically 6-8 tonnes'
    },
    {
      feature: 'Site Occupation',
      grabHire: true,
      skipHire: false,
      grabHireText: 'No long-term site use',
      skipHireText: 'Skip remains on site'
    }
  ];

  const pricingOptions = [
    {
      title: 'Half Day Hire',
      duration: 'Up to 4 hours',
      description: 'Perfect for quick clearance jobs',
      features: ['Professional operator included', 'Fuel and disposal costs', 'Public liability insurance', 'Same day availability']
    },
    {
      title: 'Full Day Hire',
      duration: 'Up to 8 hours',
      description: 'Ideal for larger projects',
      features: ['Dedicated operator', 'Multiple loads if needed', 'Flexible scheduling', 'Most popular option'],
      popular: true
    },
    {
      title: 'Extended Hire',
      duration: 'Multiple days',
      description: 'For ongoing construction projects',
      features: ['Reduced daily rates', 'Priority scheduling', 'Dedicated support', 'Custom arrangements']
    }
  ];

  return (
    <>
      <SEOHead 
        title="Grab Hire Services | 1-16 Tons Capacity | Kent London Essex | GTS Grab Hire"
        description="Professional grab hire services 1-16 tons capacity in Kent, London & Essex. No permits required. Same day service. Access difficult areas over fences. Free quotes from GTS."
        keywords="grab hire, grab lorry hire, 1-16 tons capacity, same day service, no permits, kent london essex, flexible hire, professional operators"
      />
      
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="hero-gradient text-white py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <Badge variant="yellow" className="mb-6">
                Grab Hire Services
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                Flexible and Affordable Grab Hire Solutions
              </h1>
              <p className="text-xl md:text-2xl text-gray-200 mb-8 leading-relaxed">
                Professional grab lorry hire with experienced operators. Access difficult areas, no permits required, and same-day service available.
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

        {/* Service Overview */}
        <section className="section-padding section-gradient">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-[hsl(var(--gts-dark))] mb-6">
                  Professional Grab Hire Services
                </h2>
                <div className="space-y-4 text-lg text-gray-700 leading-relaxed">
                  <p>
                    Our grab hire service provides the ultimate flexibility for waste removal and material handling. 
                    With experienced operators and modern grab lorries, we can access areas that traditional skip 
                    hire simply cannot reach.
                  </p>
                  <p>
                    Whether you need to clear a garden, remove construction waste, or handle materials on a building 
                    site, our grab hire service offers a fast, efficient, and cost-effective solution. No waiting 
                    for permits, no long-term site occupation - just professional service when you need it.
                  </p>
                  <p>
                    Our grab lorries can work over fences, walls, and other obstacles, making them perfect for 
                    properties with restricted access or tight spaces where skips cannot be positioned.
                  </p>
                </div>
              </div>
              <Card className="bg-white shadow-[var(--shadow-card)] border-0">
                <CardContent className="p-8">
                  <div className="bg-[hsl(var(--gts-yellow))] bg-opacity-10 rounded-lg p-8 text-center">
                    <Truck className="w-16 h-16 text-[hsl(var(--gts-dark))] mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-[hsl(var(--gts-dark))] mb-4">Modern Fleet</h3>
                    <p className="text-gray-600 mb-4">Well-maintained grab lorries with experienced operators</p>
                    <div className="grid grid-cols-1 gap-3 text-sm">
                      <div className="bg-white p-3 rounded flex items-center justify-between">
                        <span className="font-semibold text-[hsl(var(--gts-dark))]">Reach:</span>
                        <span className="text-gray-600">Up to 8 meters</span>
                      </div>
                      <div className="bg-white p-3 rounded flex items-center justify-between">
                        <span className="font-semibold text-[hsl(var(--gts-dark))]">Capacity:</span>
                        <span className="text-gray-600">16 tons max</span>
                      </div>
                      <div className="bg-white p-3 rounded flex items-center justify-between">
                        <span className="font-semibold text-[hsl(var(--gts-dark))]">Availability:</span>
                        <span className="text-gray-600">24/7 service</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Specifications Section */}
        <section className="section-padding bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-[hsl(var(--gts-dark))] mb-6">
                Grab Lorry Specifications
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Our modern, well-maintained grab lorries are equipped with the latest technology and operated by experienced professionals
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {specifications.map((spec, index) => (
                <Card key={index} className="text-center bg-white shadow-[var(--shadow-card)] border-0 card-hover">
                  <CardHeader>
                    <CardTitle className="text-xl text-[hsl(var(--gts-dark))]">{spec.title}</CardTitle>
                    <div className="text-2xl font-bold text-[hsl(var(--gts-yellow))] mb-2">{spec.value}</div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-gray-600 leading-relaxed">
                      {spec.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison Section */}
        <section className="section-padding section-gradient">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-[hsl(var(--gts-dark))] mb-6">
                Grab Hire vs Skip Hire
              </h2>
              <p className="text-lg text-gray-600">
                See why grab hire is often the superior choice for waste removal projects
              </p>
            </div>

            <Card className="bg-white shadow-[var(--shadow-card)] border-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[hsl(var(--gts-yellow))] bg-opacity-10">
                    <tr>
                      <th className="text-left p-6 font-semibold text-[hsl(var(--gts-dark))]">Feature</th>
                      <th className="text-center p-6 font-semibold text-[hsl(var(--gts-dark))]">Grab Hire</th>
                      <th className="text-center p-6 font-semibold text-[hsl(var(--gts-dark))]">Skip Hire</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparison.map((item, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-6 font-medium text-[hsl(var(--gts-dark))]">{item.feature}</td>
                        <td className="p-6 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            {item.grabHire ? (
                              <CheckCircle className="w-5 h-5 text-[hsl(var(--gts-green))]" />
                            ) : (
                              <X className="w-5 h-5 text-red-500" />
                            )}
                            <span className="text-gray-600">{item.grabHireText}</span>
                          </div>
                        </td>
                        <td className="p-6 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            {item.skipHire ? (
                              <CheckCircle className="w-5 h-5 text-[hsl(var(--gts-green))]" />
                            ) : (
                              <X className="w-5 h-5 text-red-500" />
                            )}
                            <span className="text-gray-600">{item.skipHireText}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="section-padding bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-[hsl(var(--gts-dark))] mb-6">
                Flexible Pricing Options
              </h2>
              <p className="text-lg text-gray-600">
                Choose the hire duration that best suits your project needs
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {pricingOptions.map((option, index) => (
                <Card key={index} className={`text-center shadow-[var(--shadow-card)] border-0 relative ${
                  option.popular ? 'bg-[hsl(var(--gts-yellow))] bg-opacity-10 ring-2 ring-[hsl(var(--gts-yellow))]' : 'bg-white'
                }`}>
                  {option.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge variant="yellow">Most Popular</Badge>
                    </div>
                  )}
                  <CardHeader className="pt-8">
                    <CardTitle className="text-2xl text-[hsl(var(--gts-dark))]">{option.title}</CardTitle>
                    <div className="text-xl font-bold text-[hsl(var(--gts-yellow))] mb-2">{option.duration}</div>
                    <CardDescription className="text-gray-600">{option.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 mb-6">
                      {option.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center justify-center text-sm text-gray-600">
                          <CheckCircle className="w-4 h-4 text-[hsl(var(--gts-green))] mr-2" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button variant={option.popular ? "primary" : "outline"} className="w-full">
                      Get Quote
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="hero-gradient text-white py-20">
          <div className="container mx-auto px-4 text-center">
            <Shield className="w-16 h-16 text-[hsl(var(--gts-yellow))] mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Hire a Grab Lorry?
            </h2>
            <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
              Professional grab hire services with no permits required. Same-day availability across Kent, London, and Essex.
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

export default GrabHire;