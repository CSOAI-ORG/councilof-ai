import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { CheckCircle, Phone, Mountain, TestTube, Truck, Shield } from "lucide-react";

const SoilDisposal = () => {
  return (
    <>
      <SEOHead
        title="Soil Disposal Services Kent | Contaminated Soil Removal | GTS Grab Hire"
        description="Professional soil disposal in Kent. Clean & contaminated soil removal, excavation waste, licensed disposal facilities. Same-day collection available."
        keywords="soil disposal, contaminated soil removal, excavation waste Kent, soil removal services, topsoil disposal, subsoil clearance"
        canonical="https://gtsgrabhire.com/services/soil-disposal"
      />
      <div className="min-h-screen bg-background">
        <Header />
        
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-amber-700 to-[hsl(var(--gts-dark))] text-white py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Soil Disposal Services <span className="text-[hsl(var(--gts-yellow))]">Kent</span>
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-gray-200">
                Professional soil removal and disposal services. Clean soil, contaminated soil, excavation waste - fully licensed and compliant disposal.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="btn-secondary">
                  <Link to="/quote">Get Soil Quote</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-amber-700">
                  <a href="tel:07958710548">Expert Advice: 07958 710 548</a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Soil Types Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-[hsl(var(--gts-dark))]">
                Types of Soil We Handle
              </h2>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="border-green-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-700">
                      <Mountain className="w-6 h-6" />
                      Clean Topsoil
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-gray-600">
                      <li>• Garden soil removal</li>
                      <li>• Landscaping excavation</li>
                      <li>• Foundation preparation</li>
                      <li>• Agricultural soil</li>
                    </ul>
                    <div className="mt-4 p-3 bg-green-50 rounded">
                      <p className="text-sm text-green-700 font-semibold">✓ Can be recycled or reused</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-blue-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-700">
                      <Mountain className="w-6 h-6" />
                      Clean Subsoil
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-gray-600">
                      <li>• Clay excavation</li>
                      <li>• Sand & gravel</li>
                      <li>• Construction excavation</li>
                      <li>• Utility trenching soil</li>
                    </ul>
                    <div className="mt-4 p-3 bg-blue-50 rounded">
                      <p className="text-sm text-blue-700 font-semibold">✓ Suitable for backfill projects</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-orange-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-orange-700">
                      <TestTube className="w-6 h-6" />
                      Mixed/Unknown Soil
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-gray-600">
                      <li>• Demolition site soil</li>
                      <li>• Urban excavation</li>
                      <li>• Brownfield sites</li>
                      <li>• Unknown contamination</li>
                    </ul>
                    <div className="mt-4 p-3 bg-orange-50 rounded">
                      <p className="text-sm text-orange-700 font-semibold">⚠ Requires testing & analysis</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-red-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-700">
                      <Shield className="w-6 h-6" />
                      Contaminated Soil
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-gray-600">
                      <li>• Hydrocarbon contamination</li>
                      <li>• Chemical spill cleanup</li>
                      <li>• Industrial site soil</li>
                      <li>• Heavy metal contamination</li>
                    </ul>
                    <div className="mt-4 p-3 bg-red-50 rounded">
                      <p className="text-sm text-red-700 font-semibold">⚠ Hazardous waste procedures</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-purple-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-purple-700">
                      <TestTube className="w-6 h-6" />
                      Asbestos Contaminated
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-gray-600">
                      <li>• Asbestos-containing soil</li>
                      <li>• Demolition site material</li>
                      <li>• Historical building sites</li>
                      <li>• Licensed removal required</li>
                    </ul>
                    <div className="mt-4 p-3 bg-purple-50 rounded">
                      <p className="text-sm text-purple-700 font-semibold">⚠ Specialist handling required</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-gray-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-700">
                      <Mountain className="w-6 h-6" />
                      Excavation Spoil
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-gray-600">
                      <li>• Large volume excavation</li>
                      <li>• Basement construction</li>
                      <li>• Road construction</li>
                      <li>• Infrastructure projects</li>
                    </ul>
                    <div className="mt-4 p-3 section-gradient rounded">
                      <p className="text-sm text-gray-700 font-semibold">✓ Bulk handling available</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Testing & Classification */}
        <section className="py-16 section-gradient">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-[hsl(var(--gts-dark))]">
                Soil Testing & Classification
              </h2>
              
              <div className="grid md:grid-cols-2 gap-8 mb-12">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TestTube className="w-6 h-6 text-[hsl(var(--gts-green))]" />
                      When Soil Testing is Required
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-[hsl(var(--gts-green))] mt-1" />
                        <span>Unknown soil origin or history</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-[hsl(var(--gts-green))] mt-1" />
                        <span>Former industrial or commercial sites</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-[hsl(var(--gts-green))] mt-1" />
                        <span>Visible contamination or odors</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-[hsl(var(--gts-green))] mt-1" />
                        <span>Large volume disposals</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-6 h-6 text-[hsl(var(--gts-green))]" />
                      Our Testing Service
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-[hsl(var(--gts-green))] mt-1" />
                        <span>UKAS accredited laboratory analysis</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-[hsl(var(--gts-green))] mt-1" />
                        <span>Comprehensive contamination screening</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-[hsl(var(--gts-green))] mt-1" />
                        <span>Classification for disposal route</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-[hsl(var(--gts-green))] mt-1" />
                        <span>Fast turnaround results</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <div className="bg-white p-8 rounded-lg shadow-lg">
                <h3 className="text-2xl font-bold mb-6 text-center text-[hsl(var(--gts-dark))]">Soil Testing Process</h3>
                <div className="grid md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-[hsl(var(--gts-green))] text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">1</div>
                    <h4 className="font-semibold mb-2">Site Assessment</h4>
                    <p className="text-sm text-gray-600">Visual inspection and sampling plan</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-[hsl(var(--gts-green))] text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">2</div>
                    <h4 className="font-semibold mb-2">Sample Collection</h4>
                    <p className="text-sm text-gray-600">Representative soil samples taken</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-[hsl(var(--gts-green))] text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">3</div>
                    <h4 className="font-semibold mb-2">Laboratory Analysis</h4>
                    <p className="text-sm text-gray-600">Contamination testing & classification</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-[hsl(var(--gts-green))] text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">4</div>
                    <h4 className="font-semibold mb-2">Disposal Route</h4>
                    <p className="text-sm text-gray-600">Appropriate facility & documentation</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-[hsl(var(--gts-dark))]">
                Soil Disposal Pricing
              </h2>
              
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="border-green-200">
                  <CardHeader>
                    <CardTitle className="text-green-700">Clean Soil</CardTitle>
                    <CardDescription>Inert, uncontaminated soil</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-700 mb-4">£25/tonne</div>
                    <ul className="space-y-2 text-sm">
                      <li>• Garden soil & topsoil</li>
                      <li>• Clean excavation material</li>
                      <li>• No testing required</li>
                      <li>• Recycling facility disposal</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-orange-200">
                  <CardHeader>
                    <CardTitle className="text-orange-700">Mixed/Unknown Soil</CardTitle>
                    <CardDescription>Requires testing & classification</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-orange-700 mb-4">£45/tonne</div>
                    <ul className="space-y-2 text-sm">
                      <li>• Testing & analysis included</li>
                      <li>• Urban excavation sites</li>
                      <li>• Unknown contamination</li>
                      <li>• Appropriate disposal route</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-red-200">
                  <CardHeader>
                    <CardTitle className="text-red-700">Contaminated Soil</CardTitle>
                    <CardDescription>Hazardous waste procedures</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-red-700 mb-4">£120/tonne</div>
                    <ul className="space-y-2 text-sm">
                      <li>• Hazardous waste treatment</li>
                      <li>• Specialist handling required</li>
                      <li>• Licensed disposal facility</li>
                      <li>• Full documentation provided</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
              
              <p className="text-center text-gray-600 mt-8">
                Prices include collection, transport, testing (where required), and disposal. Additional charges may apply for asbestos-contaminated material.
              </p>
            </div>
          </div>
        </section>

        {/* Compliance Section */}
        <section className="py-16 section-gradient">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-8 text-[hsl(var(--gts-dark))]">
                Fully Compliant Soil Disposal
              </h2>
              <p className="text-lg mb-8 text-gray-600">
                We ensure all soil disposal meets UK environmental regulations and waste management requirements.
              </p>
              
              <div className="grid md:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Legal Compliance</CardTitle>
                  </CardHeader>
                  <CardContent className="text-left">
                    <ul className="space-y-2">
                      <li>• Environment Agency permits</li>
                      <li>• Waste acceptance procedures</li>
                      <li>• Contaminated land regulations</li>
                      <li>• Hazardous waste regulations</li>
                      <li>• Construction Code of Practice</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Documentation Provided</CardTitle>
                  </CardHeader>
                  <CardContent className="text-left">
                    <ul className="space-y-2">
                      <li>• Waste transfer notes</li>
                      <li>• Disposal certificates</li>
                      <li>• Soil analysis reports</li>
                      <li>• Chain of custody records</li>
                      <li>• Environmental permits</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-amber-700 text-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Need Professional Soil Disposal?
              </h2>
              <p className="text-xl mb-8">
                Get expert advice and competitive pricing for your soil disposal needs
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="btn-secondary">
                  <Link to="/quote">Get Soil Quote</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-amber-700">
                  <a href="tel:07956222691">
                    <Phone className="w-5 h-5 mr-2" />
                    Expert Advice: 07956 222 691
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

export default SoilDisposal;