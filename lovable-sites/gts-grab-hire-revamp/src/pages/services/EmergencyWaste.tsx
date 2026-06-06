import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { CheckCircle, Phone, AlertTriangle, Clock, Zap, Shield } from "lucide-react";

const EmergencyWaste = () => {
  return (
    <>
      <SEOHead
        title="Emergency Waste Removal Kent | 24/7 Urgent Clearance | GTS Grab Hire"
        description="24/7 emergency waste removal in Kent. Flood cleanup, storm damage, urgent clearances. Same-day response for crisis situations. Call now for immediate help."
        keywords="emergency waste removal, urgent clearance Kent, 24/7 waste collection, flood cleanup, storm damage clearance, crisis waste management"
        canonical="https://gtsgrabhire.com/services/emergency-waste"
      />
      <div className="min-h-screen bg-background">
        <Header />
        
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-red-600 to-[hsl(var(--gts-dark))] text-white py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Emergency Waste Removal <span className="text-[hsl(var(--gts-yellow))]">24/7</span>
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-gray-200">
                Urgent waste clearance when you need it most. Flood damage, storm cleanup, crisis situations - we respond within hours.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="btn-secondary animate-pulse">
                  <a href="tel:07956222691">EMERGENCY: 07956 222 691</a>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-red-600">
                  <Link to="/quote">Get Emergency Quote</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Emergency Services */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-[hsl(var(--gts-dark))]">
                Emergency Situations We Handle
              </h2>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="border-red-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-6 h-6 text-red-600" />
                      Flood Damage Cleanup
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-gray-600">
                      <li>• Water-damaged furniture</li>
                      <li>• Contaminated materials</li>
                      <li>• Carpets & flooring</li>
                      <li>• Appliances & electronics</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-red-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-6 h-6 text-red-600" />
                      Storm Damage
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-gray-600">
                      <li>• Fallen trees & branches</li>
                      <li>• Damaged roofing materials</li>
                      <li>• Broken fencing & structures</li>
                      <li>• Debris clearance</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-red-200">
                  <CardHeader>
                    <CardTitle>Fire Damage Clearance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-gray-600">
                      <li>• Smoke-damaged contents</li>
                      <li>• Charred materials</li>
                      <li>• Structural debris</li>
                      <li>• Hazardous waste removal</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-red-200">
                  <CardHeader>
                    <CardTitle>Industrial Accidents</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-gray-600">
                      <li>• Chemical spill cleanup</li>
                      <li>• Machinery failure debris</li>
                      <li>• Emergency site clearance</li>
                      <li>• Contaminated soil removal</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-red-200">
                  <CardHeader>
                    <CardTitle>Property Emergencies</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-gray-600">
                      <li>• Burst pipe damage</li>
                      <li>• Ceiling collapse cleanup</li>
                      <li>• Emergency evictions</li>
                      <li>• Vandalism clearance</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-red-200">
                  <CardHeader>
                    <CardTitle>Health & Safety Issues</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-gray-600">
                      <li>• Biohazard waste</li>
                      <li>• Pest infestation cleanup</li>
                      <li>• Hoarding situations</li>
                      <li>• Asbestos emergencies</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Response Times */}
        <section className="py-16 bg-red-50">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-[hsl(var(--gts-dark))]">
                Emergency Response Times
              </h2>
              
              <div className="grid md:grid-cols-3 gap-8">
                <Card className="text-center border-red-300">
                  <CardHeader>
                    <Clock className="w-16 h-16 text-red-600 mx-auto mb-4" />
                    <CardTitle className="text-red-600">Critical Emergency</CardTitle>
                    <CardDescription>Life safety, health hazards</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-red-600 mb-4">2 Hours</div>
                    <p className="text-gray-600">Immediate response for situations threatening health and safety</p>
                  </CardContent>
                </Card>

                <Card className="text-center border-orange-300">
                  <CardHeader>
                    <AlertTriangle className="w-16 h-16 text-orange-600 mx-auto mb-4" />
                    <CardTitle className="text-orange-600">Urgent Emergency</CardTitle>
                    <CardDescription>Property damage, business impact</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-orange-600 mb-4">4 Hours</div>
                    <p className="text-gray-600">Fast response for property emergencies and business disruption</p>
                  </CardContent>
                </Card>

                <Card className="text-center border-yellow-400">
                  <CardHeader>
                    <Zap className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
                    <CardTitle className="text-yellow-600">Same Day Service</CardTitle>
                    <CardDescription>Non-critical but urgent</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-yellow-600 mb-4">8 Hours</div>
                    <p className="text-gray-600">Same-day clearance for urgent but non-critical situations</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose Emergency Service */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-[hsl(var(--gts-dark))]">
                Why Choose Our Emergency Service?
              </h2>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-2xl font-bold mb-6 text-red-600">24/7 Availability</h3>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-red-600 mt-1" />
                      <span>Round-the-clock emergency response</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-red-600 mt-1" />
                      <span>Weekend and holiday availability</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-red-600 mt-1" />
                      <span>Immediate dispatch capability</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-red-600 mt-1" />
                      <span>Multiple crews on standby</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-2xl font-bold mb-6 text-red-600">Emergency Expertise</h3>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-red-600 mt-1" />
                      <span>Specialized emergency equipment</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-red-600 mt-1" />
                      <span>Hazardous material handling</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-red-600 mt-1" />
                      <span>Insurance claim support</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-red-600 mt-1" />
                      <span>Disaster recovery planning</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Emergency Pricing */}
        <section className="py-16 section-gradient">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-[hsl(var(--gts-dark))]">
                Emergency Service Pricing
              </h2>
              
              <div className="bg-white p-8 rounded-lg shadow-lg">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-red-600 mb-4">Emergency Callout</h3>
                  <div className="text-5xl font-bold text-red-600 mb-4">£150</div>
                  <p className="text-gray-600">Plus standard collection rates</p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-red-600">What's Included</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        <li>• Priority response dispatch</li>
                        <li>• Site assessment & safety check</li>
                        <li>• Emergency containment</li>
                        <li>• Initial debris removal</li>
                        <li>• Safety barrier setup</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-red-600">Additional Services</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        <li>• Hazmat handling: +£200</li>
                        <li>• Out-of-hours (9pm-6am): +50%</li>
                        <li>• Same-day completion: +30%</li>
                        <li>• Weekend service: +25%</li>
                        <li>• Insurance direct billing available</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-16 bg-red-600 text-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Emergency? Don't Wait - Call Now!
              </h2>
              <p className="text-xl mb-8">
                Our emergency response team is standing by 24/7 to help
              </p>
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <Card className="bg-white text-red-600">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Phone className="w-6 h-6" />
                      Emergency Hotline
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-2">07956 222 691</div>
                    <p className="text-gray-600">24/7 Emergency Response</p>
                  </CardContent>
                </Card>

                <Card className="bg-white text-red-600">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-6 h-6" />
                      Average Response
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-2">2-4 Hours</div>
                    <p className="text-gray-600">Emergency Situations</p>
                  </CardContent>
                </Card>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="btn-secondary animate-pulse">
                  <a href="tel:07956222691">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    CALL EMERGENCY LINE
                  </a>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-red-600">
                  <Link to="/quote">Get Emergency Quote</Link>
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

export default EmergencyWaste;