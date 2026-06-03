import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { CheckCircle, Phone, Building, Truck, Calendar, Shield } from "lucide-react";

const CommercialWaste = () => {
  return (
    <>
      <SEOHead
        title="Commercial Waste Services Kent | Business Waste Collection | GTS Grab Hire"
        description="Professional commercial waste collection in Kent. Office clearance, retail waste, industrial disposal. Licensed waste carrier. Scheduled collections available."
        keywords="commercial waste collection, business waste services, office clearance Kent, retail waste removal, industrial waste disposal, trade waste collection"
        canonical="https://gtsgrabhire.com/services/commercial-waste"
      />
      <div className="min-h-screen bg-background">
        <Header />
        
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-[hsl(var(--gts-navy))] to-[hsl(var(--gts-dark))] text-white py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Commercial Waste Services <span className="text-[hsl(var(--gts-yellow))]">Kent</span>
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-gray-200">
                Professional business waste collection and disposal. Scheduled services, one-off clearances, and emergency collections for all commercial sectors.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" variant="cta">
                  <Link to="/quote">Get Business Quote</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-[hsl(var(--gts-dark))]">
                  <a href="tel:07958710548">24/7 Service: 07958 710 548</a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-[hsl(var(--gts-dark))]">
                Commercial Waste Solutions
              </h2>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="w-6 h-6 text-[hsl(var(--gts-navy))]" />
                      Office Clearance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-gray-600">
                      <li>• Office furniture removal</li>
                      <li>• IT equipment disposal</li>
                      <li>• Document destruction</li>
                      <li>• Carpet & partition removal</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="w-6 h-6 text-[hsl(var(--gts-navy))]" />
                      Retail Waste
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-gray-600">
                      <li>• Shop fit-out waste</li>
                      <li>• Retail refurbishment</li>
                      <li>• Display unit removal</li>
                      <li>• Packaging waste</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-6 h-6 text-[hsl(var(--gts-navy))]" />
                      Industrial Waste
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-gray-600">
                      <li>• Manufacturing waste</li>
                      <li>• Metal & machinery</li>
                      <li>• Chemical disposal</li>
                      <li>• Production line clearance</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Healthcare Facilities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-gray-600">
                      <li>• Medical waste disposal</li>
                      <li>• Equipment decommissioning</li>
                      <li>• Renovation waste</li>
                      <li>• Confidential disposal</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Education Sector</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-gray-600">
                      <li>• School refurbishment</li>
                      <li>• Laboratory clearance</li>
                      <li>• Playground equipment</li>
                      <li>• Classroom furniture</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Hospitality & Leisure</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-gray-600">
                      <li>• Restaurant fit-outs</li>
                      <li>• Hotel refurbishment</li>
                      <li>• Kitchen equipment</li>
                      <li>• Event clearance</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Service Types */}
        <section className="py-16 section-gradient">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-[hsl(var(--gts-dark))]">
                Flexible Service Options
              </h2>
              
              <div className="grid md:grid-cols-3 gap-8">
                <Card>
                  <CardHeader>
                    <Calendar className="w-12 h-12 text-[hsl(var(--gts-dark))] mb-4" />
                    <CardTitle>Scheduled Collections</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4">Regular waste collection services tailored to your business needs.</p>
                    <ul className="space-y-2 text-gray-600">
                      <li>• Daily, weekly, or monthly</li>
                      <li>• Flexible timing</li>
                      <li>• Contract pricing</li>
                      <li>• Reliable service</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <Truck className="w-12 h-12 text-[hsl(var(--gts-success))] mb-4" />
                    <CardTitle>One-Off Clearances</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4">Single collections for office moves, refurbishments, or special projects.</p>
                    <ul className="space-y-2 text-gray-600">
                      <li>• Same-day service</li>
                      <li>• No contracts required</li>
                      <li>• Pay-as-you-go</li>
                      <li>• Instant quotes</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <Shield className="w-12 h-12 text-[hsl(var(--gts-success))] mb-4" />
                    <CardTitle>Emergency Collections</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4">24/7 emergency waste removal for urgent business situations.</p>
                    <ul className="space-y-2 text-gray-600">
                      <li>• 24-hour response</li>
                      <li>• Weekend availability</li>
                      <li>• Crisis management</li>
                      <li>• Priority service</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-[hsl(var(--gts-dark))]">
                Why Businesses Choose GTS
              </h2>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-2xl font-bold mb-6 text-[hsl(var(--gts-success))]">Professional Service</h3>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-[hsl(var(--gts-green))] mt-1" />
                      <span>Uniformed, professional staff</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-[hsl(var(--gts-green))] mt-1" />
                      <span>Minimal disruption to business</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-[hsl(var(--gts-green))] mt-1" />
                      <span>Flexible scheduling around operations</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-[hsl(var(--gts-green))] mt-1" />
                      <span>Clean and tidy service</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-2xl font-bold mb-6 text-[hsl(var(--gts-green))]">Compliance & Documentation</h3>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-[hsl(var(--gts-green))] mt-1" />
                      <span>Full business insurance coverage</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-[hsl(var(--gts-green))] mt-1" />
                      <span>Licensed waste carrier registration</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-[hsl(var(--gts-green))] mt-1" />
                      <span>Waste transfer documentation</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-[hsl(var(--gts-green))] mt-1" />
                      <span>Environmental compliance reporting</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="py-16 section-gradient">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-[hsl(var(--gts-dark))]">
                Commercial Waste Pricing
              </h2>
              
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="border-[hsl(var(--gts-green))] border-2">
                  <CardHeader>
                    <CardTitle className="text-[hsl(var(--gts-green))]">Small Business</CardTitle>
                    <CardDescription>Perfect for small offices & shops</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-[hsl(var(--gts-green))] mb-4">From £120</div>
                    <ul className="space-y-2 text-sm">
                      <li>• Up to 3 cubic meters</li>
                      <li>• Office furniture & equipment</li>
                      <li>• General commercial waste</li>
                      <li>• Same-day collection</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-[hsl(var(--gts-yellow))] border-2 relative">
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-[hsl(var(--gts-yellow))] text-[hsl(var(--gts-dark))] px-4 py-1 rounded-full text-sm font-bold">Popular</span>
                  </div>
                  <CardHeader>
                    <CardTitle className="text-[hsl(var(--gts-green))]">Medium Business</CardTitle>
                    <CardDescription>Ideal for retail & restaurants</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-[hsl(var(--gts-green))] mb-4">From £220</div>
                    <ul className="space-y-2 text-sm">
                      <li>• Up to 6 cubic meters</li>
                      <li>• Retail fit-out waste</li>
                      <li>• Mixed commercial materials</li>
                      <li>• Scheduled collections available</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-[hsl(var(--gts-green))] border-2">
                  <CardHeader>
                    <CardTitle className="text-[hsl(var(--gts-green))]">Large Business</CardTitle>
                    <CardDescription>For industrial & major clearances</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-[hsl(var(--gts-green))] mb-4">From £350</div>
                    <ul className="space-y-2 text-sm">
                      <li>• Up to 12 cubic meters</li>
                      <li>• Industrial machinery</li>
                      <li>• Large office clearances</li>
                      <li>• Contract pricing available</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
              
              <p className="text-center text-gray-600 mt-8">
                All prices include collection, transport, and compliant disposal. VAT invoices provided.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-[hsl(var(--gts-success))] text-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Need Commercial Waste Collection?
              </h2>
              <p className="text-xl mb-8">
                Get a tailored quote for your business waste requirements
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" variant="cta">
                  <Link to="/quote">Get Business Quote</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-[hsl(var(--gts-green))]">
                  <a href="tel:07956222691">
                    <Phone className="w-5 h-5 mr-2" />
                    Business Line: 07956 222 691
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default CommercialWaste;