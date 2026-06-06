import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, User, ArrowLeft, Phone, Leaf, Recycle, TreePine } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import Badge from "@/components/Badge";


const EnvironmentalBenefits = () => {
  return (
    <>
      <SEOHead 
        title="Environmental Benefits of Professional Waste Removal | GTS Grab Hire"
        description="Discover how professional waste removal services protect the environment through proper recycling, disposal methods, and sustainable practices. Expert insights from GTS."
        keywords="environmental waste removal, sustainable disposal, recycling benefits, eco-friendly waste management, green grab hire"
      />
      
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="hero-gradient text-white py-20">
          <div className="container mx-auto px-4">
            <Link to="/blog" className="inline-flex items-center text-gray-200 hover:text-white mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blog
            </Link>
            <Badge variant="yellow" className="mb-6">
              Environmental
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Environmental Benefits of Professional Waste Removal
            </h1>
            <div className="flex items-center text-gray-200 mb-8">
              <Calendar className="w-5 h-5 mr-2" />
              <span className="mr-6">January 5, 2024</span>
              <User className="w-5 h-5 mr-2" />
              <span className="mr-6">GTS Team</span>
              <span>6 min read</span>
            </div>
          </div>
        </section>

        {/* Article Content */}
        <section className="section-padding section-gradient">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              

              {/* Article Body */}
              <div className="prose prose-lg max-w-none">
                
                {/* Introduction */}
                <div className="bg-white rounded-2xl p-8 shadow-[var(--shadow-card)] mb-8">
                  <p className="text-xl text-gray-700 leading-relaxed mb-6">
                    Professional waste removal services play a crucial role in environmental protection, far beyond simple collection and disposal. Through specialized knowledge, proper equipment, and established recycling networks, companies like GTS Grab Hire contribute significantly to sustainability and environmental conservation.
                  </p>
                  
                  <div className="bg-[hsl(var(--gts-success))] bg-opacity-10 p-6 rounded-lg border-l-4 border-[hsl(var(--gts-success))]">
                    <h3 className="text-lg font-semibold text-[hsl(var(--gts-dark))] mb-2 flex items-center">
                      <Leaf className="w-5 h-5 mr-2" />
                      Environmental Impact
                    </h3>
                    <p className="text-gray-700">
                      Professional waste services achieve up to 95% recycling rates compared to just 25% for DIY disposal methods, dramatically reducing landfill contributions and environmental harm.
                    </p>
                  </div>
                </div>

                {/* Proper Segregation */}
                <Card className="bg-white shadow-[var(--shadow-card)] border-0 mb-8">
                  <CardContent className="p-8">
                    <h2 className="text-3xl font-bold text-[hsl(var(--gts-dark))] mb-6 flex items-center">
                      <Recycle className="w-8 h-8 mr-3 text-[hsl(var(--gts-success))]" />
                      Expert Waste Segregation
                    </h2>
                    <p className="text-gray-700 leading-relaxed mb-6">
                      Professional waste removal begins with proper segregation at source. Trained operatives identify and separate different material types, ensuring each waste stream follows the most environmentally responsible disposal route.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-[hsl(var(--gts-success))] bg-opacity-10 p-6 rounded-lg">
                        <h3 className="text-lg font-semibold text-[hsl(var(--gts-dark))] mb-4">Recyclable Materials</h3>
                        <ul className="space-y-2 text-gray-700">
                          <li>• <strong>Metals:</strong> Steel, aluminum, copper separation</li>
                          <li>• <strong>Concrete:</strong> Crushed for aggregate reuse</li>
                          <li>• <strong>Timber:</strong> Processed for biomass or reuse</li>
                          <li>• <strong>Plastics:</strong> Sorted by polymer type</li>
                          <li>• <strong>Plasterboard:</strong> Gypsum recovery</li>
                        </ul>
                      </div>
                      
                      <div className="bg-[hsl(var(--gts-yellow))] bg-opacity-10 p-6 rounded-lg">
                        <h3 className="text-lg font-semibold text-[hsl(var(--gts-dark))] mb-4">Hazardous Materials</h3>
                        <ul className="space-y-2 text-gray-700">
                          <li>• <strong>Asbestos:</strong> Licensed removal and disposal</li>
                          <li>• <strong>Chemicals:</strong> Specialized treatment facilities</li>
                          <li>• <strong>Electronics:</strong> WEEE-compliant processing</li>
                          <li>• <strong>Batteries:</strong> Heavy metal recovery</li>
                          <li>• <strong>Paints:</strong> Solvent recovery programs</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recycling Networks */}
                <Card className="bg-white shadow-[var(--shadow-card)] border-0 mb-8">
                  <CardContent className="p-8">
                    <h2 className="text-3xl font-bold text-[hsl(var(--gts-dark))] mb-6">Established Recycling Networks</h2>
                    <p className="text-gray-700 leading-relaxed mb-6">
                      Professional waste companies maintain relationships with specialized recycling facilities that individual consumers cannot access. These partnerships enable higher recycling rates and more sophisticated material recovery processes.
                    </p>
                    
                    <div className="bg-[hsl(var(--gts-navy))] bg-opacity-10 p-6 rounded-lg mb-6">
                      <h3 className="text-xl font-semibold text-[hsl(var(--gts-dark))] mb-4">GTS Recycling Partnerships</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-[hsl(var(--gts-success))]">15+</div>
                          <p className="text-sm text-gray-600">Recycling Facilities</p>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-[hsl(var(--gts-success))]">85%</div>
                          <p className="text-sm text-gray-600">Average Recycling Rate</p>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-[hsl(var(--gts-success))]">50+</div>
                          <p className="text-sm text-gray-600">Material Categories</p>
                        </div>
                      </div>
                    </div>

                    <h3 className="text-xl font-semibold text-[hsl(var(--gts-dark))] mb-4">Specialized Processing Facilities</h3>
                    <div className="space-y-4">
                      <div className="flex items-start space-x-4">
                        <div className="w-2 h-2 bg-[hsl(var(--gts-success))] rounded-full mt-2"></div>
                        <div>
                          <h4 className="font-medium text-[hsl(var(--gts-dark))]">Construction Waste Recovery Centers</h4>
                          <p className="text-sm text-gray-600">Specialized crushing and sorting equipment for concrete, brick, and aggregate recovery</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-4">
                        <div className="w-2 h-2 bg-[hsl(var(--gts-success))] rounded-full mt-2"></div>
                        <div>
                          <h4 className="font-medium text-[hsl(var(--gts-dark))]">Material Recovery Facilities (MRF)</h4>
                          <p className="text-sm text-gray-600">Advanced sorting technology for mixed waste streams and contaminated materials</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-4">
                        <div className="w-2 h-2 bg-[hsl(var(--gts-success))] rounded-full mt-2"></div>
                        <div>
                          <h4 className="font-medium text-[hsl(var(--gts-dark))]">Energy Recovery Plants</h4>
                          <p className="text-sm text-gray-600">Converting non-recyclable waste to energy, reducing landfill dependency</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Carbon Footprint Reduction */}
                <Card className="bg-white shadow-[var(--shadow-card)] border-0 mb-8">
                  <CardContent className="p-8">
                    <h2 className="text-3xl font-bold text-[hsl(var(--gts-dark))] mb-6 flex items-center">
                      <TreePine className="w-8 h-8 mr-3 text-[hsl(var(--gts-success))]" />
                      Carbon Footprint Reduction
                    </h2>
                    
                    <p className="text-gray-700 leading-relaxed mb-6">
                      Professional waste services significantly reduce carbon emissions through efficient routing, modern vehicle fleets, and optimized disposal methods. The environmental benefits extend far beyond individual waste management.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <h3 className="text-xl font-semibold text-[hsl(var(--gts-dark))] mb-4">Efficient Collection</h3>
                        <ul className="space-y-3 text-gray-700">
                          <li>• <strong>Route Optimization:</strong> Advanced GPS and load planning reduces fuel consumption</li>
                          <li>• <strong>Larger Capacity:</strong> Fewer trips required vs multiple DIY disposal runs</li>
                          <li>• <strong>Modern Fleet:</strong> Euro 6 engines with lower emissions</li>
                          <li>• <strong>Load Consolidation:</strong> Multiple projects combined in efficient routes</li>
                        </ul>
                      </div>
                      
                      <div>
                        <h3 className="text-xl font-semibold text-[hsl(var(--gts-dark))] mb-4">Processing Efficiency</h3>
                        <ul className="space-y-3 text-gray-700">
                          <li>• <strong>Direct Facility Access:</strong> Bypass transfer stations and double handling</li>
                          <li>• <strong>Bulk Processing:</strong> Industrial-scale recycling efficiency</li>
                          <li>• <strong>Reduced Contamination:</strong> Proper segregation improves recycling rates</li>
                          <li>• <strong>Local Processing:</strong> Partnerships with nearby facilities reduce transport emissions</li>
                        </ul>
                      </div>
                    </div>

                    <div className="bg-[hsl(var(--gts-success))] bg-opacity-10 p-6 rounded-lg mt-6">
                      <h4 className="font-semibold text-[hsl(var(--gts-dark))] mb-3">Environmental Impact Comparison</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-[hsl(var(--gts-success))]">75%</div>
                          <p className="text-sm text-gray-600">Fewer Vehicle Movements</p>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-[hsl(var(--gts-success))]">60%</div>
                          <p className="text-sm text-gray-600">Lower CO₂ Emissions</p>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-[hsl(var(--gts-success))]">85%</div>
                          <p className="text-sm text-gray-600">Higher Recycling Rate</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Compliance and Standards */}
                <Card className="bg-white shadow-[var(--shadow-card)] border-0 mb-8">
                  <CardContent className="p-8">
                    <h2 className="text-3xl font-bold text-[hsl(var(--gts-dark))] mb-6">Regulatory Compliance & Standards</h2>
                    
                    <p className="text-gray-700 leading-relaxed mb-6">
                      Professional waste services operate under strict environmental regulations and industry standards, ensuring all disposal methods meet or exceed legal requirements for environmental protection.
                    </p>

                    <div className="space-y-6">
                      <div className="section-gradient p-6 rounded-lg">
                        <h3 className="text-lg font-semibold text-[hsl(var(--gts-dark))] mb-4">Key Compliance Areas</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <ul className="space-y-2 text-gray-700">
                            <li>• <strong>Waste Carrier License:</strong> Environment Agency authorization</li>
                            <li>• <strong>Duty of Care:</strong> Complete waste tracking documentation</li>
                            <li>• <strong>WEEE Compliance:</strong> Electrical waste proper processing</li>
                          </ul>
                          <ul className="space-y-2 text-gray-700">
                            <li>• <strong>Hazardous Waste Permits:</strong> Specialized disposal authorization</li>
                            <li>• <strong>ISO 14001:</strong> Environmental management systems</li>
                            <li>• <strong>FORS Accreditation:</strong> Fleet operator recognition scheme</li>
                          </ul>
                        </div>
                      </div>

                      <div className="bg-[hsl(var(--gts-navy))] bg-opacity-10 p-6 rounded-lg">
                        <h3 className="text-lg font-semibold text-[hsl(var(--gts-dark))] mb-4">GTS Environmental Commitments</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="text-center">
                            <div className="w-16 h-16 bg-[hsl(var(--gts-success))] bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                              <Leaf className="w-8 h-8 text-[hsl(var(--gts-success))]" />
                            </div>
                            <h4 className="font-semibold text-[hsl(var(--gts-dark))] mb-2">Zero to Landfill</h4>
                            <p className="text-sm text-gray-600">Goal to divert 100% of waste from landfill disposal</p>
                          </div>
                          <div className="text-center">
                            <div className="w-16 h-16 bg-[hsl(var(--gts-success))] bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                              <Recycle className="w-8 h-8 text-[hsl(var(--gts-success))]" />
                            </div>
                            <h4 className="font-semibold text-[hsl(var(--gts-dark))] mb-2">Circular Economy</h4>
                            <p className="text-sm text-gray-600">Supporting material reuse and recycling initiatives</p>
                          </div>
                          <div className="text-center">
                            <div className="w-16 h-16 bg-[hsl(var(--gts-success))] bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                              <TreePine className="w-8 h-8 text-[hsl(var(--gts-success))]" />
                            </div>
                            <h4 className="font-semibold text-[hsl(var(--gts-dark))] mb-2">Carbon Neutral</h4>
                            <p className="text-sm text-gray-600">Offsetting emissions through verified programs</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Economic Benefits */}
                <Card className="bg-white shadow-[var(--shadow-card)] border-0 mb-8">
                  <CardContent className="p-8">
                    <h2 className="text-3xl font-bold text-[hsl(var(--gts-dark))] mb-6">Economic Benefits of Environmental Practices</h2>
                    
                    <p className="text-gray-700 leading-relaxed mb-6">
                      Environmental responsibility also delivers economic benefits, creating a virtuous cycle where sustainable practices reduce costs and support local economies.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-[hsl(var(--gts-yellow))] bg-opacity-10 p-6 rounded-lg">
                        <h3 className="text-lg font-semibold text-[hsl(var(--gts-dark))] mb-4">Cost Savings</h3>
                        <ul className="space-y-2 text-gray-700">
                          <li>• Lower landfill tax through diversion</li>
                          <li>• Revenue from recyclable materials</li>
                          <li>• Reduced fuel costs through efficiency</li>
                          <li>• Bulk processing economies of scale</li>
                        </ul>
                      </div>
                      
                      <div className="bg-[hsl(var(--gts-success))] bg-opacity-10 p-6 rounded-lg">
                        <h3 className="text-lg font-semibold text-[hsl(var(--gts-dark))] mb-4">Local Economic Impact</h3>
                        <ul className="space-y-2 text-gray-700">
                          <li>• Supporting local recycling industries</li>
                          <li>• Creating green jobs and skills</li>
                          <li>• Reducing raw material imports</li>
                          <li>• Building sustainable supply chains</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Call to Action */}
                <Card className="bg-[hsl(var(--gts-navy))] text-white border-0 mb-8">
                  <CardContent className="p-8">
                    <h2 className="text-3xl font-bold mb-6">Choose Environmental Responsibility</h2>
                    <p className="text-lg text-gray-200 leading-relaxed mb-6">
                      Every waste removal project is an opportunity to make a positive environmental impact. By choosing GTS Grab Hire, you're not just removing waste – you're contributing to a sustainable future through responsible disposal, recycling, and environmental stewardship.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button asChild variant="cta" size="lg">
                        <Link to="/quote">Get Environmental Waste Solution</Link>
                      </Button>
                      <Button asChild variant="outline" size="lg" className="border-[hsl(var(--gts-yellow))] text-[hsl(var(--gts-yellow))] hover:bg-[hsl(var(--gts-yellow))] hover:text-[hsl(var(--gts-dark))]">
                        <Link to="/services">Our Green Services</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

              </div>

              {/* Contact CTA */}
              <Card className="bg-white shadow-[var(--shadow-card)] border-0 mt-12">
                <CardContent className="p-8 text-center">
                  <h3 className="text-2xl font-bold text-[hsl(var(--gts-dark))] mb-4">
                    Partner with Environmental Leaders
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                    Choose GTS Grab Hire for waste removal that prioritizes environmental protection alongside efficiency and value.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button asChild size="lg" className="bg-[hsl(var(--gts-navy))] hover:bg-[hsl(var(--gts-navy))]/90">
                      <Link to="/contact">
                        <Phone className="w-4 h-4 mr-2" />
                        Discuss Green Solutions
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg">
                      <Link to="/about">Learn About Our Practices</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </>
  );
};

export default EnvironmentalBenefits;