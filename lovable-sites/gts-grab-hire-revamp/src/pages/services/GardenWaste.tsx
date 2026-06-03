import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { CheckCircle, Phone, Leaf, Truck, Clock, Recycle } from "lucide-react";

const GardenWaste = () => {
  return (
    <>
      <SEOHead
        title="Garden Waste Clearance Kent | Green Waste Removal | GTS Grab Hire"
        description="Professional garden waste clearance in Kent. Tree removal, hedge cutting waste, lawn clippings collection. Eco-friendly disposal. Same-day service available."
        keywords="garden waste clearance, green waste removal, tree removal Kent, hedge cutting waste, garden clearance, landscaping waste collection"
        canonical="https://gtsgrabhire.com/services/garden-waste"
      />
      <div className="min-h-screen bg-background">
        <Header />
        
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-green-600 to-[hsl(var(--gts-green))] text-white py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Garden Waste Clearance <span className="text-[hsl(var(--gts-yellow))]">Kent</span>
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-gray-200">
                Professional green waste removal and garden clearance services. Eco-friendly disposal with same-day collection available.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="btn-secondary">
                  <Link to="/quote">Get Garden Quote</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-green-600">
                  <a href="tel:07958710548">Same Day Service: 07958 710 548</a>
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
                Garden Waste We Collect
              </h2>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Leaf className="w-6 h-6 text-green-600" />
                      Tree & Hedge Waste
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-gray-600">
                      <li>• Tree branches & logs</li>
                      <li>• Hedge trimmings</li>
                      <li>• Shrub prunings</li>
                      <li>• Tree stumps & roots</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Recycle className="w-6 h-6 text-green-600" />
                      Lawn & Grass Waste
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-gray-600">
                      <li>• Grass clippings</li>
                      <li>• Lawn turf removal</li>
                      <li>• Moss & thatch</li>
                      <li>• Weed clearance</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Garden Clearance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-gray-600">
                      <li>• Full garden clearance</li>
                      <li>• Overgrown vegetation</li>
                      <li>• Plant & flower waste</li>
                      <li>• Bamboo removal</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Landscaping Projects</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-gray-600">
                      <li>• Site preparation waste</li>
                      <li>• Old fencing removal</li>
                      <li>• Decking demolition</li>
                      <li>• Patio clearance</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Seasonal Clearance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-gray-600">
                      <li>• Autumn leaf collection</li>
                      <li>• Storm damage cleanup</li>
                      <li>• Winter pruning waste</li>
                      <li>• Spring garden preparation</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Commercial Grounds</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-gray-600">
                      <li>• Office grounds maintenance</li>
                      <li>• School playing fields</li>
                      <li>• Council park clearance</li>
                      <li>• Hotel landscaping</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 section-gradient">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-[hsl(var(--gts-dark))]">
                Why Choose Our Garden Waste Service?
              </h2>
              
              <div className="grid md:grid-cols-3 gap-8">
                <Card>
                  <CardHeader>
                    <Recycle className="w-12 h-12 text-green-600 mb-4" />
                    <CardTitle>Eco-Friendly Disposal</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>All garden waste is composted or recycled at licensed facilities. We turn your waste into useful compost and biomass.</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <Clock className="w-12 h-12 text-green-600 mb-4" />
                    <CardTitle>Same Day Collection</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>Need garden waste removed today? We offer same-day collection services for urgent garden clearance projects.</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <Truck className="w-12 h-12 text-green-600 mb-4" />
                    <CardTitle>No Heavy Lifting</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>Our team loads all the garden waste for you. No need to struggle with heavy branches or multiple trips to the tip.</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Guide */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-[hsl(var(--gts-dark))]">
                Garden Waste Clearance Pricing
              </h2>
              
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="border-green-200">
                  <CardHeader>
                    <CardTitle className="text-green-600">Small Garden</CardTitle>
                    <CardDescription>Perfect for regular maintenance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600 mb-4">From £80</div>
                    <ul className="space-y-2 text-sm">
                      <li>• Up to 2 cubic meters</li>
                      <li>• Hedge trimmings</li>
                      <li>• Grass clippings</li>
                      <li>• Small branch removal</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-green-400 border-2 relative">
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-green-600 text-white px-4 py-1 rounded-full text-sm">Most Popular</span>
                  </div>
                  <CardHeader>
                    <CardTitle className="text-green-600">Medium Garden</CardTitle>
                    <CardDescription>Ideal for seasonal clearance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600 mb-4">From £150</div>
                    <ul className="space-y-2 text-sm">
                      <li>• Up to 4 cubic meters</li>
                      <li>• Tree branch removal</li>
                      <li>• Large hedge clearance</li>
                      <li>• Garden renovation waste</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-green-200">
                  <CardHeader>
                    <CardTitle className="text-green-600">Large Garden</CardTitle>
                    <CardDescription>Complete garden transformation</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600 mb-4">From £250</div>
                    <ul className="space-y-2 text-sm">
                      <li>• Up to 8 cubic meters</li>
                      <li>• Full garden clearance</li>
                      <li>• Tree stump removal</li>
                      <li>• Commercial projects</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
              
              <p className="text-center text-gray-600 mt-8">
                Prices include collection, transport, and eco-friendly disposal. No hidden fees.
              </p>
            </div>
          </div>
        </section>

        {/* Service Areas */}
        <section className="py-16 section-gradient">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-8 text-[hsl(var(--gts-dark))]">
                Garden Waste Collection Areas
              </h2>
              <p className="text-lg mb-8 text-gray-600">
                We provide garden waste clearance services across Kent, Essex, and South East London.
              </p>
              
              <div className="grid md:grid-cols-3 gap-6 text-left">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-green-600">Kent</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1 text-gray-600">
                      <li>• Canterbury & surrounding areas</li>
                      <li>• Maidstone & Medway towns</li>
                      <li>• Ashford & Romney Marsh</li>
                      <li>• Dartford & Gravesend</li>
                      <li>• Sevenoaks & Tonbridge</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-green-600">Essex</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1 text-gray-600">
                      <li>• Chelmsford & Colchester</li>
                      <li>• Southend & Basildon</li>
                      <li>• Harlow & Epping</li>
                      <li>• Brentwood & Thurrock</li>
                      <li>• Maldon & Braintree</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-green-600">London</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1 text-gray-600">
                      <li>• Greenwich & Lewisham</li>
                      <li>• Bexley & Bromley</li>
                      <li>• Croydon & Sutton</li>
                      <li>• Woolwich & Eltham</li>
                      <li>• Sidcup & Orpington</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-green-600 text-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Ready to Clear Your Garden?
              </h2>
              <p className="text-xl mb-8">
                Get an instant quote for eco-friendly garden waste removal
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="btn-secondary">
                  <Link to="/quote">Get Free Quote</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-green-600">
                  <a href="tel:07956222691">
                    <Phone className="w-5 h-5 mr-2" />
                    Call: 07956 222 691
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

export default GardenWaste;