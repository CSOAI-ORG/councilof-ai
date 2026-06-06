import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, User, ArrowLeft, Phone, HardHat, AlertTriangle, CheckCircle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import Badge from "@/components/Badge";


const ConstructionWasteManagement = () => {
  return (
    <>
      <SEOHead 
        title="Construction Site Waste Management Best Practices | GTS Grab Hire"
        description="Essential tips for efficient construction waste management. Learn planning, segregation, and disposal best practices for construction sites in Essex, Kent, and London."
        keywords="construction waste management, site waste planning, construction disposal, building site waste, contractor waste services"
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
              Construction
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Construction Site Waste Management Best Practices
            </h1>
            <div className="flex items-center text-gray-200 mb-8">
              <Calendar className="w-5 h-5 mr-2" />
              <span className="mr-6">December 20, 2023</span>
              <User className="w-5 h-5 mr-2" />
              <span className="mr-6">GTS Team</span>
              <span>7 min read</span>
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
                    Effective construction waste management is critical for project success, regulatory compliance, and environmental responsibility. Proper planning and execution of waste strategies can reduce costs by up to 30% while ensuring smooth project delivery.
                  </p>
                  
                  <div className="bg-[hsl(var(--gts-yellow))] bg-opacity-10 p-6 rounded-lg border-l-4 border-[hsl(var(--gts-yellow))]">
                    <h3 className="text-lg font-semibold text-[hsl(var(--gts-dark))] mb-2 flex items-center">
                      <HardHat className="w-5 h-5 mr-2" />
                      Key Success Factor
                    </h3>
                    <p className="text-gray-700">
                      Sites with comprehensive waste management plans achieve 85% recycling rates and reduce disposal costs by £2,000-£5,000 per project compared to reactive waste handling.
                    </p>
                  </div>
                </div>

                {/* Pre-Construction Planning */}
                <Card className="bg-white shadow-[var(--shadow-card)] border-0 mb-8">
                  <CardContent className="p-8">
                    <h2 className="text-3xl font-bold text-[hsl(var(--gts-dark))] mb-6">Pre-Construction Planning</h2>
                    <p className="text-gray-700 leading-relaxed mb-6">
                      Successful waste management begins before ground is broken. Comprehensive planning during the design and pre-construction phase sets the foundation for efficient waste handling throughout the project lifecycle.
                    </p>
                    
                    <div className="space-y-6">
                      <div className="bg-[hsl(var(--gts-navy))] bg-opacity-10 p-6 rounded-lg">
                        <h3 className="text-xl font-semibold text-[hsl(var(--gts-dark))] mb-4">Site Waste Management Plan (SWMP)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <ul className="space-y-2 text-gray-700">
                            <li>• <strong>Waste Type Identification:</strong> Predict material streams</li>
                            <li>• <strong>Volume Estimation:</strong> Calculate expected quantities</li>
                            <li>• <strong>Disposal Routes:</strong> Identify recycling opportunities</li>
                            <li>• <strong>Storage Requirements:</strong> Plan site layout</li>
                          </ul>
                          <ul className="space-y-2 text-gray-700">
                            <li>• <strong>Collection Schedule:</strong> Optimize removal timing</li>
                            <li>• <strong>Cost Budgeting:</strong> Accurate financial planning</li>
                            <li>• <strong>Regulatory Compliance:</strong> Meet legal requirements</li>
                            <li>• <strong>Monitoring Procedures:</strong> Track performance</li>
                          </ul>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-[hsl(var(--gts-success))] bg-opacity-10 p-6 rounded-lg">
                          <h4 className="font-semibold text-[hsl(var(--gts-dark))] mb-3">Design Stage Benefits</h4>
                          <ul className="space-y-2 text-gray-700">
                            <li>• Material optimization reduces waste by 15-25%</li>
                            <li>• Modular design minimizes off-cuts</li>
                            <li>• Standardized components improve efficiency</li>
                            <li>• BIM integration enables accurate prediction</li>
                          </ul>
                        </div>
                        
                        <div className="bg-[hsl(var(--gts-yellow))] bg-opacity-10 p-6 rounded-lg">
                          <h4 className="font-semibold text-[hsl(var(--gts-dark))] mb-3">Procurement Considerations</h4>
                          <ul className="space-y-2 text-gray-700">
                            <li>• Just-in-time delivery reduces waste</li>
                            <li>• Supplier take-back programs</li>
                            <li>• Reusable packaging specifications</li>
                            <li>• Material quality standards</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* On-Site Segregation */}
                <Card className="bg-white shadow-[var(--shadow-card)] border-0 mb-8">
                  <CardContent className="p-8">
                    <h2 className="text-3xl font-bold text-[hsl(var(--gts-dark))] mb-6">Effective On-Site Segregation</h2>
                    
                    <p className="text-gray-700 leading-relaxed mb-6">
                      Proper waste segregation at source is the cornerstone of successful construction waste management. Clear systems and worker training ensure maximum recycling and minimal contamination.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                      
                      {/* Inert Waste */}
                      <div className="section-gradient p-6 rounded-lg border-l-4 border-[hsl(var(--gts-success))]">
                        <h3 className="text-lg font-semibold text-[hsl(var(--gts-dark))] mb-3">Inert Waste</h3>
                        <ul className="space-y-1 text-sm text-gray-700 mb-3">
                          <li>• Concrete and masonry</li>
                          <li>• Bricks and blocks</li>
                          <li>• Tiles and ceramics</li>
                          <li>• Clean hardcore</li>
                        </ul>
                        <p className="text-xs text-[hsl(var(--gts-success))] font-medium">95% Recyclable</p>
                      </div>

                      {/* Metal Waste */}
                      <div className="section-gradient p-6 rounded-lg border-l-4 border-[hsl(var(--gts-yellow))]">
                        <h3 className="text-lg font-semibold text-[hsl(var(--gts-dark))] mb-3">Metal Waste</h3>
                        <ul className="space-y-1 text-sm text-gray-700 mb-3">
                          <li>• Steel and iron</li>
                          <li>• Aluminum and copper</li>
                          <li>• Reinforcement bars</li>
                          <li>• Pipe and conduit</li>
                        </ul>
                        <p className="text-xs text-[hsl(var(--gts-success))] font-medium">100% Recyclable</p>
                      </div>

                      {/* Timber Waste */}
                      <div className="section-gradient p-6 rounded-lg border-l-4 border-amber-500">
                        <h3 className="text-lg font-semibold text-[hsl(var(--gts-dark))] mb-3">Timber Waste</h3>
                        <ul className="space-y-1 text-sm text-gray-700 mb-3">
                          <li>• Structural timber</li>
                          <li>• Formwork and shuttering</li>
                          <li>• Packaging materials</li>
                          <li>• Offcuts and shavings</li>
                        </ul>
                        <p className="text-xs text-[hsl(var(--gts-success))] font-medium">85% Recyclable</p>
                      </div>

                      {/* Plasterboard */}
                      <div className="section-gradient p-6 rounded-lg border-l-4 border-[hsl(var(--gts-navy))]">
                        <h3 className="text-lg font-semibold text-[hsl(var(--gts-dark))] mb-3">Plasterboard</h3>
                        <ul className="space-y-1 text-sm text-gray-700 mb-3">
                          <li>• Clean plasterboard</li>
                          <li>• Dry lining waste</li>
                          <li>• Ceiling materials</li>
                          <li>• Partition walls</li>
                        </ul>
                        <p className="text-xs text-[hsl(var(--gts-success))] font-medium">90% Recyclable</p>
                      </div>

                      {/* Plastic & Packaging */}
                      <div className="section-gradient p-6 rounded-lg border-l-4 border-green-500">
                        <h3 className="text-lg font-semibold text-[hsl(var(--gts-dark))] mb-3">Plastic & Packaging</h3>
                        <ul className="space-y-1 text-sm text-gray-700 mb-3">
                          <li>• Plastic wrapping</li>
                          <li>• Pipe offcuts</li>
                          <li>• Packaging materials</li>
                          <li>• Container waste</li>
                        </ul>
                        <p className="text-xs text-orange-600 font-medium">60% Recyclable</p>
                      </div>

                      {/* Hazardous Waste */}
                      <div className="bg-red-50 p-6 rounded-lg border-l-4 border-red-500">
                        <h3 className="text-lg font-semibold text-[hsl(var(--gts-dark))] mb-3 flex items-center">
                          <AlertTriangle className="w-4 h-4 mr-2 text-red-500" />
                          Hazardous Waste
                        </h3>
                        <ul className="space-y-1 text-sm text-gray-700 mb-3">
                          <li>• Paint and solvents</li>
                          <li>• Adhesives and sealants</li>
                          <li>• Asbestos materials</li>
                          <li>• Contaminated items</li>
                        </ul>
                        <p className="text-xs text-red-600 font-medium">Special Handling Required</p>
                      </div>
                    </div>

                    <div className="bg-[hsl(var(--gts-yellow))] bg-opacity-10 p-6 rounded-lg">
                      <h3 className="text-lg font-semibold text-[hsl(var(--gts-dark))] mb-4">Segregation Best Practices</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ul className="space-y-2 text-gray-700">
                          <li>• <strong>Clear Labeling:</strong> Color-coded containers with visual guides</li>
                          <li>• <strong>Strategic Placement:</strong> Position bins near work areas</li>
                          <li>• <strong>Regular Collection:</strong> Prevent overflow and contamination</li>
                          <li>• <strong>Worker Training:</strong> Ensure all staff understand procedures</li>
                        </ul>
                        <ul className="space-y-2 text-gray-700">
                          <li>• <strong>Size Appropriate:</strong> Match container size to waste volume</li>
                          <li>• <strong>Weather Protection:</strong> Cover containers to prevent contamination</li>
                          <li>• <strong>Site Champion:</strong> Designate waste management coordinator</li>
                          <li>• <strong>Daily Monitoring:</strong> Track compliance and adjust as needed</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Collection and Logistics */}
                <Card className="bg-white shadow-[var(--shadow-card)] border-0 mb-8">
                  <CardContent className="p-8">
                    <h2 className="text-3xl font-bold text-[hsl(var(--gts-dark))] mb-6">Collection and Logistics Optimization</h2>
                    
                    <p className="text-gray-700 leading-relaxed mb-6">
                      Efficient collection scheduling and logistics coordination minimize site disruption while ensuring consistent waste removal. Professional grab hire services offer significant advantages over traditional skip hire for active construction sites.
                    </p>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      
                      <div>
                        <h3 className="text-xl font-semibold text-[hsl(var(--gts-dark))] mb-4 flex items-center">
                          <CheckCircle className="w-5 h-5 mr-2 text-[hsl(var(--gts-success))]" />
                          Grab Hire Advantages
                        </h3>
                        <ul className="space-y-3 text-gray-700 mb-6">
                          <li>• <strong>Immediate Collection:</strong> No waiting for skip exchange</li>
                          <li>• <strong>Flexible Access:</strong> Reach over obstacles and tight spaces</li>
                          <li>• <strong>Load Optimization:</strong> Driver can assist with loading</li>
                          <li>• <strong>No Permits:</strong> No road permits or parking restrictions</li>
                          <li>• <strong>Variable Capacity:</strong> Pay only for waste collected</li>
                        </ul>

                        <div className="bg-[hsl(var(--gts-success))] bg-opacity-10 p-4 rounded-lg">
                          <h4 className="font-semibold text-[hsl(var(--gts-dark))] mb-2">Productivity Benefits</h4>
                          <ul className="space-y-1 text-sm text-gray-700">
                            <li>• 40% faster than skip exchange</li>
                            <li>• Reduced labor time for loading</li>
                            <li>• Minimal site disruption</li>
                            <li>• Flexible scheduling around work activities</li>
                          </ul>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-xl font-semibold text-[hsl(var(--gts-dark))] mb-4">Collection Scheduling Strategies</h3>
                        <div className="space-y-4">
                          
                          <div className="section-gradient p-4 rounded-lg">
                            <h4 className="font-medium text-[hsl(var(--gts-dark))] mb-2">Phase-Based Collection</h4>
                            <p className="text-sm text-gray-600 mb-2">Align waste collection with project phases for maximum efficiency</p>
                            <ul className="text-xs text-gray-600 space-y-1">
                              <li>• Demolition phase: Daily collection for high volumes</li>
                              <li>• Construction phase: 2-3 times weekly</li>
                              <li>• Finishing phase: Weekly or on-demand</li>
                            </ul>
                          </div>

                          <div className="section-gradient p-4 rounded-lg">
                            <h4 className="font-medium text-[hsl(var(--gts-dark))] mb-2">Peak Time Avoidance</h4>
                            <p className="text-sm text-gray-600 mb-2">Schedule around productive work periods</p>
                            <ul className="text-xs text-gray-600 space-y-1">
                              <li>• Early morning collection (7-9 AM)</li>
                              <li>• Lunch break scheduling (12-1 PM)</li>
                              <li>• End of day clearance (4-6 PM)</li>
                            </ul>
                          </div>

                          <div className="section-gradient p-4 rounded-lg">
                            <h4 className="font-medium text-[hsl(var(--gts-dark))] mb-2">Emergency Collection</h4>
                            <p className="text-sm text-gray-600 mb-2">Same-day service for urgent requirements</p>
                            <ul className="text-xs text-gray-600 space-y-1">
                              <li>• Health and safety clearance</li>
                              <li>• Unexpected waste volumes</li>
                              <li>• Access route maintenance</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Cost Management */}
                <Card className="bg-white shadow-[var(--shadow-card)] border-0 mb-8">
                  <CardContent className="p-8">
                    <h2 className="text-3xl font-bold text-[hsl(var(--gts-dark))] mb-6">Cost Management and Budgeting</h2>
                    
                    <p className="text-gray-700 leading-relaxed mb-6">
                      Effective waste management cost control requires understanding the true cost of waste beyond disposal fees. Hidden costs of poor waste management can add 10-20% to project budgets.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      
                      <div className="bg-red-50 p-6 rounded-lg border-l-4 border-red-500">
                        <h3 className="text-lg font-semibold text-[hsl(var(--gts-dark))] mb-4">Hidden Cost Factors</h3>
                        <ul className="space-y-3 text-gray-700">
                          <li>• <strong>Labor Time:</strong> Loading and handling inefficiencies</li>
                          <li>• <strong>Site Delays:</strong> Blocked access and workflow disruption</li>
                          <li>• <strong>Contamination:</strong> Higher disposal costs for mixed waste</li>
                          <li>• <strong>Compliance:</strong> Fines and legal issues from poor handling</li>
                          <li>• <strong>Storage:</strong> Site space occupied by waste containers</li>
                          <li>• <strong>Equipment:</strong> Downtime due to waste-related delays</li>
                        </ul>
                      </div>

                      <div className="bg-[hsl(var(--gts-success))] bg-opacity-10 p-6 rounded-lg border-l-4 border-[hsl(var(--gts-success))]">
                        <h3 className="text-lg font-semibold text-[hsl(var(--gts-dark))] mb-4">Cost Optimization Strategies</h3>
                        <ul className="space-y-3 text-gray-700">
                          <li>• <strong>Volume Prediction:</strong> Accurate estimation prevents over-ordering</li>
                          <li>• <strong>Segregation ROI:</strong> Higher recycling rates reduce disposal costs</li>
                          <li>• <strong>Bulk Scheduling:</strong> Regular collections offer better rates</li>
                          <li>• <strong>Material Recovery:</strong> Revenue from high-value recyclables</li>
                          <li>• <strong>Efficiency Gains:</strong> Faster clearance reduces labor costs</li>
                          <li>• <strong>Partnership Benefits:</strong> Long-term relationships improve pricing</li>
                        </ul>
                      </div>
                    </div>

                    <div className="bg-[hsl(var(--gts-navy))] bg-opacity-10 p-6 rounded-lg mt-6">
                      <h3 className="text-lg font-semibold text-[hsl(var(--gts-dark))] mb-4">Typical Cost Breakdown (£/ton)</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-[hsl(var(--gts-success))]">£25-35</div>
                          <p className="text-sm text-gray-600">Segregated Inert Waste</p>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-[hsl(var(--gts-yellow))]">£85-120</div>
                          <p className="text-sm text-gray-600">Mixed Construction Waste</p>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-red-600">£200-400</div>
                          <p className="text-sm text-gray-600">Hazardous Waste</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Regulatory Compliance */}
                <Card className="bg-white shadow-[var(--shadow-card)] border-0 mb-8">
                  <CardContent className="p-8">
                    <h2 className="text-3xl font-bold text-[hsl(var(--gts-dark))] mb-6 flex items-center">
                      <AlertTriangle className="w-8 h-8 mr-3 text-[hsl(var(--gts-yellow))]" />
                      Regulatory Compliance
                    </h2>
                    
                    <p className="text-gray-700 leading-relaxed mb-6">
                      Construction waste management must comply with multiple regulations. Understanding these requirements prevents costly delays, fines, and legal complications.
                    </p>

                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="section-gradient p-6 rounded-lg">
                          <h3 className="text-lg font-semibold text-[hsl(var(--gts-dark))] mb-4">Key Regulations</h3>
                          <ul className="space-y-2 text-gray-700">
                            <li>• <strong>Environmental Protection Act:</strong> Duty of Care requirements</li>
                            <li>• <strong>Waste Regulations:</strong> Classification and handling</li>
                            <li>• <strong>CDM Regulations:</strong> Site safety and management</li>
                            <li>• <strong>WEEE Regulations:</strong> Electrical equipment disposal</li>
                          </ul>
                        </div>
                        
                        <div className="section-gradient p-6 rounded-lg">
                          <h3 className="text-lg font-semibold text-[hsl(var(--gts-dark))] mb-4">Documentation Requirements</h3>
                          <ul className="space-y-2 text-gray-700">
                            <li>• <strong>Waste Transfer Notes:</strong> Track all waste movements</li>
                            <li>• <strong>Carrier Licenses:</strong> Verify waste collector credentials</li>
                            <li>• <strong>Consignment Notes:</strong> Hazardous waste documentation</li>
                            <li>• <strong>Disposal Certificates:</strong> Proof of proper disposal</li>
                          </ul>
                        </div>
                      </div>

                      <div className="bg-[hsl(var(--gts-yellow))] bg-opacity-10 p-6 rounded-lg">
                        <h3 className="text-lg font-semibold text-[hsl(var(--gts-dark))] mb-4">GTS Compliance Support</h3>
                        <p className="text-gray-700 mb-4">
                          GTS Grab Hire manages all compliance requirements on your behalf, providing complete documentation and ensuring regulatory adherence.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                          <div>
                            <CheckCircle className="w-8 h-8 text-[hsl(var(--gts-success))] mx-auto mb-2" />
                            <p className="text-sm font-medium text-[hsl(var(--gts-dark))]">Full Documentation</p>
                          </div>
                          <div>
                            <CheckCircle className="w-8 h-8 text-[hsl(var(--gts-success))] mx-auto mb-2" />
                            <p className="text-sm font-medium text-[hsl(var(--gts-dark))]">Licensed Carriers</p>
                          </div>
                          <div>
                            <CheckCircle className="w-8 h-8 text-[hsl(var(--gts-success))] mx-auto mb-2" />
                            <p className="text-sm font-medium text-[hsl(var(--gts-dark))]">Audit Trail</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Call to Action */}
                <Card className="bg-[hsl(var(--gts-navy))] text-white border-0 mb-8">
                  <CardContent className="p-8">
                    <h2 className="text-3xl font-bold mb-6">Partner with Construction Waste Experts</h2>
                    <p className="text-lg text-gray-200 leading-relaxed mb-6">
                      GTS Grab Hire brings over 35 years of construction industry experience to your waste management challenges. Our comprehensive service covers planning, collection, compliance, and cost optimization, allowing you to focus on project delivery while we handle the waste.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button asChild variant="cta" size="lg">
                        <Link to="/quote">Get Construction Waste Quote</Link>
                      </Button>
                      <Button asChild variant="outline" size="lg" className="border-[hsl(var(--gts-yellow))] text-[hsl(var(--gts-yellow))] hover:bg-[hsl(var(--gts-yellow))] hover:text-[hsl(var(--gts-dark))]">
                        <Link to="/services/construction-waste">Construction Services</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

              </div>

              {/* Contact CTA */}
              <Card className="bg-white shadow-[var(--shadow-card)] border-0 mt-12">
                <CardContent className="p-8 text-center">
                  <h3 className="text-2xl font-bold text-[hsl(var(--gts-dark))] mb-4">
                    Need Site-Specific Waste Management Advice?
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                    Our construction waste specialists provide tailored solutions for projects of any size. Contact us for expert guidance and competitive pricing.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button asChild size="lg" className="bg-[hsl(var(--gts-navy))] hover:bg-[hsl(var(--gts-navy))]/90">
                      <Link to="/contact">
                        <Phone className="w-4 h-4 mr-2" />
                        Speak to Specialists
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg">
                      <Link to="/services">View All Services</Link>
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

export default ConstructionWasteManagement;