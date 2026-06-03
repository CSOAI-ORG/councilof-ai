import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { CheckCircle, Phone, HardHat, Recycle, Shield, Clock } from "lucide-react";

const ConstructionWaste = () => {
  return (
    <>
      <SEOHead
        title="Construction Waste Removal Kent | Building Site Clearance | GTS Grab Hire"
        description="Professional construction waste removal in Kent. Fast, licensed disposal of building waste, rubble, concrete. Same-day collection available. Get quote now!"
        keywords="construction waste removal, building site clearance, rubble removal Kent, concrete disposal, construction debris, building waste collection"
        canonical="https://gtsgrabhire.com/services/construction-waste"
      />
      <div className="min-h-screen bg-background">
        <Header />
        
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-[hsl(var(--gts-dark))] to-[hsl(var(--gts-green))] text-white py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Construction Waste Removal <span className="text-[hsl(var(--gts-yellow))]">Kent</span>
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-gray-200">
                Professional building site clearance and construction debris removal. Licensed, insured, and compliant disposal services.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="btn-secondary">
                  <Link to="/quote">Get Construction Quote</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-[hsl(var(--gts-dark))]">
                  <a href="tel:07956222691">Emergency Collection: 07956 222 691</a>
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
                Construction Waste We Handle
              </h2>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <HardHat className="w-6 h-6 text-[hsl(var(--gts-green))]" />
                      Concrete & Rubble
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-gray-600">
                      <li>• Broken concrete slabs</li>
                      <li>• Brick and block waste</li>
                      <li>• Crushed masonry</li>
                      <li>• Foundation debris</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Recycle className="w-6 h-6 text-[hsl(var(--gts-green))]" />
                      Metal & Timber
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-gray-600">
                      <li>• Steel reinforcement bars</li>
                      <li>• Copper piping</li>
                      <li>• Timber off-cuts</li>
                      <li>• Metal framework</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-6 h-6 text-[hsl(var(--gts-green))]" />
                      Plasterboard & Tiles
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-gray-600">
                      <li>• Gypsum plasterboard</li>
                      <li>• Ceramic tiles</li>
                      <li>• Insulation materials</li>
                      <li>• Drywall waste</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Mixed Construction Waste</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-gray-600">
                      <li>• General building debris</li>
                      <li>• Packaging materials</li>
                      <li>• Site clearance waste</li>
                      <li>• Renovation debris</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Soil & Excavation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-gray-600">
                      <li>• Excavated soil</li>
                      <li>• Contaminated ground</li>
                      <li>• Subsoil and topsoil</li>
                      <li>• Foundation excavation</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Hazardous Materials</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-gray-600">
                      <li>• Asbestos (licensed disposal)</li>
                      <li>• Lead paint waste</li>
                      <li>• Contaminated soils</li>
                      <li>• Chemical containers</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="py-16 section-gradient">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-[hsl(var(--gts-dark))]">
                Why Construction Companies Choose GTS
              </h2>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-2xl font-bold mb-6 text-[hsl(var(--gts-green))]">Compliance & Safety</h3>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-[hsl(var(--gts-green))] mt-1" />
                      <span>Full waste carrier license and insurance</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-[hsl(var(--gts-green))] mt-1" />
                      <span>Compliant with CDM regulations</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-[hsl(var(--gts-green))] mt-1" />
                      <span>Hazardous waste handling certified</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-[hsl(var(--gts-green))] mt-1" />
                      <span>Full duty of care documentation</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-2xl font-bold mb-6 text-[hsl(var(--gts-green))]">Service Excellence</h3>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-[hsl(var(--gts-green))] mt-1" />
                      <span>Same-day emergency collections</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-[hsl(var(--gts-green))] mt-1" />
                      <span>Flexible scheduling around your project</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-[hsl(var(--gts-green))] mt-1" />
                      <span>Competitive trade pricing</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-[hsl(var(--gts-green))] mt-1" />
                      <span>Regular collections for large projects</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Compliance Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-8 text-[hsl(var(--gts-dark))]">
                Fully Compliant Construction Waste Disposal
              </h2>
              <p className="text-lg mb-8 text-gray-600">
                We ensure all construction waste is disposed of according to UK regulations, protecting your project from compliance issues.
              </p>
              
              <div className="grid md:grid-cols-2 gap-8 text-left">
                <Card>
                  <CardHeader>
                    <CardTitle>Legal Compliance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      <li>• Environment Agency registered</li>
                      <li>• SEPA approved waste carrier</li>
                      <li>• Construction waste regulations compliant</li>
                      <li>• Hazardous waste consignment notes</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Documentation Provided</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      <li>• Waste transfer notes</li>
                      <li>• Disposal certificates</li>
                      <li>• Chain of custody records</li>
                      <li>• Environmental compliance reports</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-[hsl(var(--gts-green))] text-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Need Construction Waste Removed Today?
              </h2>
              <p className="text-xl mb-8">
                Emergency collections available - we understand construction deadlines
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="btn-secondary">
                  <Link to="/quote">Get Trade Quote</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-[hsl(var(--gts-green))]">
                  <a href="tel:07956222691">
                    <Phone className="w-5 h-5 mr-2" />
                    Emergency: 07956 222 691
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

export default ConstructionWaste;