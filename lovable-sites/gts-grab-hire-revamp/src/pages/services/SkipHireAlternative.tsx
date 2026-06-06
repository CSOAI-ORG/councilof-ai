import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { CheckCircle, Phone, Truck, Clock, DollarSign } from "lucide-react";

const SkipHireAlternative = () => {
  return (
    <>
      <SEOHead
        title="Skip Hire Alternative Kent | Grab Hire vs Skip Hire | GTS Grab Hire"
        description="Discover why grab hire is the best skip hire alternative in Kent. More cost-effective, flexible and efficient waste removal. Get instant quote today!"
        keywords="skip hire alternative, grab hire vs skip hire, waste removal Kent, skip hire replacement, grab lorry hire Kent"
        canonical="https://gtsgrabhire.com/services/skip-hire-alternative"
      />
      <div className="min-h-screen bg-background">
        <Header />
        
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-[hsl(var(--gts-green))] to-[hsl(var(--gts-dark))] text-white py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Skip Hire Alternative in <span className="text-[hsl(var(--gts-yellow))]">Kent</span>
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-gray-200">
                Why pay for skip hire permits and wait weeks? Get same-day grab hire service that's more cost-effective and flexible.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="btn-secondary">
                  <Link to="/quote">Get Instant Quote</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-[hsl(var(--gts-dark))]">
                  <a href="tel:07958710548">Call Now: 07958 710 548</a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Comparison Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-[hsl(var(--gts-dark))]">
                Grab Hire vs Skip Hire: The Clear Winner
              </h2>
              
              <div className="grid md:grid-cols-2 gap-8">
                <Card className="border-[hsl(var(--gts-green))] border-2">
                  <CardHeader className="bg-[hsl(var(--gts-green))] text-white">
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="w-6 h-6" />
                      Grab Hire (Recommended)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ul className="space-y-3">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-[hsl(var(--gts-green))] mt-0.5" />
                        <span>No permits required - save £35+ per week</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-[hsl(var(--gts-green))] mt-0.5" />
                        <span>Same day service available</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-[hsl(var(--gts-green))] mt-0.5" />
                        <span>We load it for you - no heavy lifting</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-[hsl(var(--gts-green))] mt-0.5" />
                        <span>Access tight spaces skips can't reach</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-[hsl(var(--gts-green))] mt-0.5" />
                        <span>Pay only for what you use</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-[hsl(var(--gts-green))] mt-0.5" />
                        <span>No waiting around for collections</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-gray-300">
                  <CardHeader className="section-gradient">
                    <CardTitle className="text-gray-700">Traditional Skip Hire</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ul className="space-y-3 text-gray-600">
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 text-red-500 mt-0.5">✗</span>
                        <span>Permits required for road placement</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 text-red-500 mt-0.5">✗</span>
                        <span>2-3 day wait for delivery</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 text-red-500 mt-0.5">✗</span>
                        <span>You load the skip yourself</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 text-red-500 mt-0.5">✗</span>
                        <span>Limited access - needs 8ft+ clearance</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 text-red-500 mt-0.5">✗</span>
                        <span>Pay full price even if half empty</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 text-red-500 mt-0.5">✗</span>
                        <span>Wait days for collection</span>
                      </li>
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
                Why Choose Grab Hire Over Skip Hire?
              </h2>
              
              <div className="grid md:grid-cols-3 gap-8">
                <Card>
                  <CardHeader>
                    <DollarSign className="w-12 h-12 text-[hsl(var(--gts-green))] mb-4" />
                    <CardTitle>Cost Effective</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>Save money on permits, loading costs, and only pay for the waste you actually have. No hidden fees or surprise charges.</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <Clock className="w-12 h-12 text-[hsl(var(--gts-green))] mb-4" />
                    <CardTitle>Same Day Service</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>Need waste removed today? We can often provide same-day service, unlike skip hire that requires advance booking and permits.</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <Truck className="w-12 h-12 text-[hsl(var(--gts-green))] mb-4" />
                    <CardTitle>Better Access</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>Our grab lorries can reach areas skips can't access, perfect for rear gardens, tight spaces, and awkward locations.</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Service Areas */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-8 text-[hsl(var(--gts-dark))]">
                Skip Hire Alternative Across Kent & Essex
              </h2>
              <p className="text-lg mb-8 text-gray-600">
                We provide grab hire services as the superior skip hire alternative across all major areas in Kent and Essex.
              </p>
              
              <div className="grid md:grid-cols-3 gap-4 text-left">
                <div>
                  <h3 className="font-semibold text-[hsl(var(--gts-dark))] mb-2">Kent Areas:</h3>
                  <ul className="text-gray-600 space-y-1">
                    <li>• Canterbury</li>
                    <li>• Maidstone</li>
                    <li>• Ashford</li>
                    <li>• Dartford</li>
                    <li>• Gravesend</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-[hsl(var(--gts-dark))] mb-2">Essex Areas:</h3>
                  <ul className="text-gray-600 space-y-1">
                    <li>• Chelmsford</li>
                    <li>• Colchester</li>
                    <li>• Southend</li>
                    <li>• Basildon</li>
                    <li>• Harlow</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-[hsl(var(--gts-dark))] mb-2">London Areas:</h3>
                  <ul className="text-gray-600 space-y-1">
                    <li>• South East London</li>
                    <li>• Greenwich</li>
                    <li>• Bexley</li>
                    <li>• Bromley</li>
                    <li>• Lewisham</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-[hsl(var(--gts-green))] text-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Ready to Ditch Skip Hire for Good?
              </h2>
              <p className="text-xl mb-8">
                Get an instant quote for grab hire - the smarter skip hire alternative
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="btn-secondary">
                  <Link to="/quote">Get Free Quote Now</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-[hsl(var(--gts-green))]">
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

export default SkipHireAlternative;