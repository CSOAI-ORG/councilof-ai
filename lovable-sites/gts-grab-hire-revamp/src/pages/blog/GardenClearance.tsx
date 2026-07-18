import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, User, ArrowLeft, Phone, TreePine, Leaf, Clock } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import Badge from "@/components/Badge";


const GardenClearance = () => {
  return (
    <>
      <SEOHead 
        title="Garden Clearance: When to Choose Grab Hire Services | GTS Grab Hire"
        description="Planning a major garden clearance? Discover when grab hire is the most efficient and cost-effective solution for your garden waste removal needs."
        keywords="garden clearance, garden waste removal, landscaping waste, green waste disposal, tree removal, garden grab hire"
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
              Garden & Landscaping
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Garden Clearance: When to Choose Grab Hire Services
            </h1>
            <div className="flex items-center text-gray-200 mb-8">
              <Calendar className="w-5 h-5 mr-2" />
              <span className="mr-6">December 15, 2023</span>
              <User className="w-5 h-5 mr-2" />
              <span className="mr-6">GTS Team</span>
              <span>4 min read</span>
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
                    Garden clearance projects can generate surprising volumes of waste, from tree branches and soil to old landscaping materials. Understanding when grab hire offers advantages over traditional skip hire or DIY disposal can save significant time, money, and effort.
                  </p>
                  
                  <div className="bg-[hsl(var(--gts-success))] bg-opacity-10 p-6 rounded-lg border-l-4 border-[hsl(var(--gts-success))]">
                    <h3 className="text-lg font-semibold text-[hsl(var(--gts-dark))] mb-2 flex items-center">
                      <TreePine className="w-5 h-5 mr-2" />
                      Garden Waste Reality Check
                    </h3>
                    <p className="text-gray-700">
                      A typical mature garden clearance produces 3-8 tons of waste. Large landscaping projects can generate 15+ tons, making professional removal essential for efficiency and cost-effectiveness.
                    </p>
                  </div>
                </div>

                {/* When Grab Hire is Ideal */}
                <Card className="bg-white shadow-[var(--shadow-card)] border-0 mb-8">
                  <CardContent className="p-8">
                    <h2 className="text-3xl font-bold text-[hsl(var(--gts-dark))] mb-6">When Grab Hire is the Perfect Solution</h2>
                    
                    <div className="space-y-6">
                      
                      {/* Large Volume Projects */}
                      <div className="bg-[hsl(var(--gts-yellow))] bg-opacity-10 p-6 rounded-lg">
                        <h3 className="text-xl font-semibold text-[hsl(var(--gts-dark))] mb-4 flex items-center">
                          <Clock className="w-5 h-5 mr-2 text-[hsl(var(--gts-yellow))]" />
                          High-Volume Garden Projects
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <ul className="space-y-2 text-gray-700">
                            <li>• <strong>Complete Garden Overhauls:</strong> Removing all existing landscaping</li>
                            <li>• <strong>Tree and Hedge Removal:</strong> Large volumes of branches and trunk sections</li>
                            <li>• <strong>Soil and Turf Replacement:</strong> Heavy materials requiring bulk removal</li>
                            <li>• <strong>Swimming Pool Installation:</strong> Excavated soil and construction debris</li>
                          </ul>
                          <ul className="space-y-2 text-gray-700">
                            <li>• <strong>Extension Groundwork:</strong> Garden area preparation for building</li>
                            <li>• <strong>Driveway Construction:</strong> Soil, old surfaces, and aggregate waste</li>
                            <li>• <strong>Pond Installation:</strong> Large volumes of excavated earth</li>
                            <li>• <strong>Decking/Patio Removal:</strong> Heavy materials and debris</li>
                          </ul>
                        </div>
                      </div>

                      {/* Access Challenges */}
                      <div className="bg-[hsl(var(--gts-success))] bg-opacity-10 p-6 rounded-lg">
                        <h3 className="text-xl font-semibold text-[hsl(var(--gts-dark))] mb-4">Access and Logistics Challenges</h3>
                        <p className="text-gray-700 mb-4">
                          Many garden clearance projects face access limitations that make grab hire the only viable professional solution.
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-semibold text-[hsl(var(--gts-dark))] mb-3">Physical Access Issues</h4>
                            <ul className="space-y-2 text-gray-700">
                              <li>• Rear gardens without side access</li>
                              <li>• Properties on busy main roads</li>
                              <li>• Narrow driveways or gateways</li>
                              <li>• Multi-story buildings requiring reach</li>
                              <li>• Gardens below street level</li>
                            </ul>
                          </div>
                          
                          <div>
                            <h4 className="font-semibold text-[hsl(var(--gts-dark))] mb-3">Grab Hire Advantages</h4>
                            <ul className="space-y-2 text-gray-700">
                              <li>• 6-8 meter reach capability</li>
                              <li>• No permits required for road positioning</li>
                              <li>• Can reach over walls and fences</li>
                              <li>• Immediate collection and removal</li>
                              <li>• Minimal disruption to neighbors</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Project Types and Grab Hire Suitability */}
                <Card className="bg-white shadow-[var(--shadow-card)] border-0 mb-8">
                  <CardContent className="p-8">
                    <h2 className="text-3xl font-bold text-[hsl(var(--gts-dark))] mb-6">Garden Project Types: Grab Hire Suitability</h2>
                    
                    <div className="space-y-6">
                      
                      {/* Excellent for Grab Hire */}
                      <div className="bg-[hsl(var(--gts-success))] bg-opacity-10 p-6 rounded-lg border-l-4 border-[hsl(var(--gts-success))]">
                        <h3 className="text-lg font-semibold text-[hsl(var(--gts-dark))] mb-4">Excellent for Grab Hire (High Efficiency)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-medium text-[hsl(var(--gts-dark))] mb-2">Tree and Shrub Removal</h4>
                            <p className="text-sm text-gray-600 mb-3">Large branches, trunk sections, root balls, and associated soil</p>
                            <ul className="text-xs text-gray-600 space-y-1">
                              <li>• Mature tree felling projects</li>
                              <li>• Large hedge removal and replacement</li>
                              <li>• Storm damage clearance</li>
                              <li>• Overgrown garden restoration</li>
                            </ul>
                          </div>
                          
                          <div>
                            <h4 className="font-medium text-[hsl(var(--gts-dark))] mb-2">Landscaping Overhauls</h4>
                            <p className="text-sm text-gray-600 mb-3">Complete garden transformation projects</p>
                            <ul className="text-xs text-gray-600 space-y-1">
                              <li>• Old patio and pathway removal</li>
                              <li>• Soil replacement and leveling</li>
                              <li>• Pond decommissioning</li>
                              <li>• Garden structure demolition</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* Good for Grab Hire */}
                      <div className="bg-[hsl(var(--gts-yellow))] bg-opacity-10 p-6 rounded-lg border-l-4 border-[hsl(var(--gts-yellow))]">
                        <h3 className="text-lg font-semibold text-[hsl(var(--gts-dark))] mb-4">Good for Grab Hire (Moderate Efficiency)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-medium text-[hsl(var(--gts-dark))] mb-2">Seasonal Clear-ups</h4>
                            <p className="text-sm text-gray-600 mb-3">Regular maintenance generating moderate volumes</p>
                            <ul className="text-xs text-gray-600 space-y-1">
                              <li>• Autumn leaf and branch clearance</li>
                              <li>• Spring garden preparation</li>
                              <li>• Annual pruning waste</li>
                              <li>• Greenhouse and shed clearance</li>
                            </ul>
                          </div>
                          
                          <div>
                            <h4 className="font-medium text-[hsl(var(--gts-dark))] mb-2">Construction Preparation</h4>
                            <p className="text-sm text-gray-600 mb-3">Site clearance before building work</p>
                            <ul className="text-xs text-gray-600 space-y-1">
                              <li>• Extension groundwork preparation</li>
                              <li>• Conservatory base clearance</li>
                              <li>• Garage construction site prep</li>
                              <li>• Garden office installation</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* Alternative Methods More Suitable */}
                      <div className="section-gradient p-6 rounded-lg border-l-4 border-gray-400">
                        <h3 className="text-lg font-semibold text-[hsl(var(--gts-dark))] mb-4">When Alternative Methods May Be Better</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-medium text-[hsl(var(--gts-dark))] mb-2">Small, Regular Projects</h4>
                            <p className="text-sm text-gray-600 mb-3">Low-volume, ongoing garden maintenance</p>
                            <ul className="text-xs text-gray-600 space-y-1">
                              <li>• Weekly grass cutting waste</li>
                              <li>• Small plant and flower bed maintenance</li>
                              <li>• Minimal pruning and trimming</li>
                              <li>• Compostable material only</li>
                            </ul>
                          </div>
                          
                          <div>
                            <h4 className="font-medium text-[hsl(var(--gts-dark))] mb-2">Consider Instead</h4>
                            <p className="text-sm text-gray-600 mb-3">More cost-effective alternatives for small volumes</p>
                            <ul className="text-xs text-gray-600 space-y-1">
                              <li>• Council green waste collection</li>
                              <li>• Home composting systems</li>
                              <li>• Small skip hire for extended projects</li>
                              <li>• Local waste transfer station trips</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Cost and Efficiency Analysis */}
                <Card className="bg-white shadow-[var(--shadow-card)] border-0 mb-8">
                  <CardContent className="p-8">
                    <h2 className="text-3xl font-bold text-[hsl(var(--gts-dark))] mb-6">Cost and Efficiency Analysis</h2>
                    
                    <p className="text-gray-700 leading-relaxed mb-6">
                      Understanding the true cost of garden waste removal extends beyond simple disposal fees. Time, effort, and access considerations often make grab hire the most economical choice for significant projects.
                    </p>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      
                      <div>
                        <h3 className="text-xl font-semibold text-[hsl(var(--gts-dark))] mb-4">Grab Hire Cost Benefits</h3>
                        <div className="space-y-4">
                          
                          <div className="bg-[hsl(var(--gts-success))] bg-opacity-10 p-4 rounded-lg">
                            <h4 className="font-medium text-[hsl(var(--gts-dark))] mb-2">Time Savings</h4>
                            <ul className="text-sm text-gray-700 space-y-1">
                              <li>• Same-day collection eliminates extended clearing</li>
                              <li>• No need to break down materials to fit containers</li>
                              <li>• Professional loading assistance available</li>
                              <li>• Single visit vs. multiple skip exchanges</li>
                            </ul>
                          </div>

                          <div className="bg-[hsl(var(--gts-success))] bg-opacity-10 p-4 rounded-lg">
                            <h4 className="font-medium text-[hsl(var(--gts-dark))] mb-2">Labor Efficiency</h4>
                            <ul className="text-sm text-gray-700 space-y-1">
                              <li>• Reduced manual handling requirements</li>
                              <li>• No need to transport waste to access points</li>
                              <li>• Grab arm can collect from multiple locations</li>
                              <li>• Less physical strain on homeowners/workers</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-xl font-semibold text-[hsl(var(--gts-dark))] mb-4">Cost Comparison Example</h3>
                        <div className="bg-[hsl(var(--gts-navy))] bg-opacity-10 p-6 rounded-lg">
                          <h4 className="font-semibold text-[hsl(var(--gts-dark))] mb-4">Large Garden Clearance (6 tons)</h4>
                          
                          <div className="space-y-4">
                            <div className="flex justify-between items-center py-2 border-b border-gray-200">
                              <span className="text-sm text-gray-600">Grab Hire (single visit)</span>
                              <span className="font-semibold text-[hsl(var(--gts-dark))]">£320</span>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Skip Hire (2 x 8 yard)</span>
                                <span className="text-sm text-gray-600">£280</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Road permits (2 weeks)</span>
                                <span className="text-sm text-gray-600">£30</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Additional labor (loading)</span>
                                <span className="text-sm text-gray-600">£120</span>
                              </div>
                              <div className="flex justify-between items-center py-2 border-t border-gray-200">
                                <span className="text-sm font-medium text-gray-700">Skip Hire Total</span>
                                <span className="font-semibold text-[hsl(var(--gts-dark))]">£430</span>
                              </div>
                            </div>

                            <div className="bg-[hsl(var(--gts-success))] bg-opacity-20 p-3 rounded text-center">
                              <span className="text-sm font-semibold text-[hsl(var(--gts-dark))]">
                                Grab Hire Savings: £110 (26% less)
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Seasonal Considerations */}
                <Card className="bg-white shadow-[var(--shadow-card)] border-0 mb-8">
                  <CardContent className="p-8">
                    <h2 className="text-3xl font-bold text-[hsl(var(--gts-dark))] mb-6 flex items-center">
                      <Leaf className="w-8 h-8 mr-3 text-[hsl(var(--gts-success))]" />
                      Seasonal Garden Clearance Planning
                    </h2>
                    
                    <p className="text-gray-700 leading-relaxed mb-6">
                      Timing your garden clearance project can significantly impact both cost and efficiency. Understanding seasonal patterns helps optimize grab hire scheduling and pricing.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Peak Season */}
                      <div className="bg-[hsl(var(--gts-yellow))] bg-opacity-10 p-6 rounded-lg">
                        <h3 className="text-lg font-semibold text-[hsl(var(--gts-dark))] mb-4">Peak Season (March-October)</h3>
                        <div className="space-y-3">
                          <div>
                            <h4 className="font-medium text-[hsl(var(--gts-dark))] mb-2">Advantages</h4>
                            <ul className="text-sm text-gray-700 space-y-1">
                              <li>• Optimal weather conditions for outdoor work</li>
                              <li>• Easier identification of plants and materials</li>
                              <li>• Ground conditions suitable for heavy machinery</li>
                              <li>• Extended daylight hours</li>
                            </ul>
                          </div>
                          
                          <div>
                            <h4 className="font-medium text-[hsl(var(--gts-dark))] mb-2">Considerations</h4>
                            <ul className="text-sm text-gray-700 space-y-1">
                              <li>• Higher demand may affect scheduling</li>
                              <li>• Peak pricing during busy periods</li>
                              <li>• Book early to secure preferred dates</li>
                              <li>• Wildlife nesting season restrictions (March-August)</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* Off-Peak Season */}
                      <div className="bg-[hsl(var(--gts-success))] bg-opacity-10 p-6 rounded-lg">
                        <h3 className="text-lg font-semibold text-[hsl(var(--gts-dark))] mb-4">Off-Peak Season (November-February)</h3>
                        <div className="space-y-3">
                          <div>
                            <h4 className="font-medium text-[hsl(var(--gts-dark))] mb-2">Advantages</h4>
                            <ul className="text-sm text-gray-700 space-y-1">
                              <li>• Better availability and competitive pricing</li>
                              <li>• No wildlife nesting restrictions</li>
                              <li>• Deciduous plants easier to remove</li>
                              <li>• Preparation for spring landscaping</li>
                            </ul>
                          </div>
                          
                          <div>
                            <h4 className="font-medium text-[hsl(var(--gts-dark))] mb-2">Considerations</h4>
                            <ul className="text-sm text-gray-700 space-y-1">
                              <li>• Weather-dependent scheduling flexibility needed</li>
                              <li>• Ground conditions may limit access</li>
                              <li>• Shorter working days due to daylight</li>
                              <li>• Material identification more challenging</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[hsl(var(--gts-navy))] bg-opacity-10 p-6 rounded-lg mt-6">
                      <h3 className="text-lg font-semibold text-[hsl(var(--gts-dark))] mb-4">Optimal Timing by Project Type</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-[hsl(var(--gts-success))]">Nov-Feb</div>
                          <p className="text-sm text-gray-600 font-medium">Tree & Hedge Removal</p>
                          <p className="text-xs text-gray-500">No nesting restrictions</p>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-[hsl(var(--gts-success))]">Mar-May</div>
                          <p className="text-sm text-gray-600 font-medium">Soil & Turf Projects</p>
                          <p className="text-xs text-gray-500">Optimal ground conditions</p>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-[hsl(var(--gts-success))]">Sep-Oct</div>
                          <p className="text-sm text-gray-600 font-medium">General Clearance</p>
                          <p className="text-xs text-gray-500">Good weather, lower demand</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Environmental Benefits */}
                <Card className="bg-white shadow-[var(--shadow-card)] border-0 mb-8">
                  <CardContent className="p-8">
                    <h2 className="text-3xl font-bold text-[hsl(var(--gts-dark))] mb-6">Environmental Benefits of Professional Garden Waste Removal</h2>
                    
                    <p className="text-gray-700 leading-relaxed mb-6">
                      Professional grab hire services ensure garden waste is processed through appropriate environmental channels, maximizing recycling and minimizing landfill disposal.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-[hsl(var(--gts-success))] bg-opacity-10 p-6 rounded-lg">
                        <h3 className="text-lg font-semibold text-[hsl(var(--gts-dark))] mb-4">Recycling and Reuse</h3>
                        <ul className="space-y-2 text-gray-700">
                          <li>• <strong>Composting:</strong> Organic waste processed into soil conditioner</li>
                          <li>• <strong>Biomass:</strong> Wood waste converted to renewable energy</li>
                          <li>• <strong>Mulch Production:</strong> Chipped branches for landscaping</li>
                          <li>• <strong>Soil Processing:</strong> Clean soil reused for other projects</li>
                        </ul>
                      </div>
                      
                      <div className="bg-[hsl(var(--gts-yellow))] bg-opacity-10 p-6 rounded-lg">
                        <h3 className="text-lg font-semibold text-[hsl(var(--gts-dark))] mb-4">Environmental Impact</h3>
                        <ul className="space-y-2 text-gray-700">
                          <li>• <strong>Landfill Diversion:</strong> 90%+ garden waste kept from landfill</li>
                          <li>• <strong>Carbon Reduction:</strong> Lower transport emissions through efficiency</li>
                          <li>• <strong>Resource Conservation:</strong> Materials returned to beneficial use</li>
                          <li>• <strong>Soil Health:</strong> Composted organic matter improves soil quality</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Call to Action */}
                <Card className="bg-[hsl(var(--gts-navy))] text-white border-0 mb-8">
                  <CardContent className="p-8">
                    <h2 className="text-3xl font-bold mb-6">Transform Your Garden with Professional Clearance</h2>
                    <p className="text-lg text-gray-200 leading-relaxed mb-6">
                      Whether you're planning a complete garden overhaul or need efficient clearance for construction work, GTS Grab Hire provides the expertise and equipment to handle projects of any scale. Our grab lorries can access challenging locations and remove large volumes quickly and cost-effectively.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button asChild variant="cta" size="lg">
                        <Link to="/quote">Get Garden Clearance Quote</Link>
                      </Button>
                      <Button asChild variant="outline" size="lg" className="border-[hsl(var(--gts-yellow))] text-[hsl(var(--gts-yellow))] hover:bg-[hsl(var(--gts-yellow))] hover:text-[hsl(var(--gts-dark))]">
                        <Link to="/services/garden-waste">Garden Waste Services</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

              </div>

              {/* Contact CTA */}
              <Card className="bg-white shadow-[var(--shadow-card)] border-0 mt-12">
                <CardContent className="p-8 text-center">
                  <h3 className="text-2xl font-bold text-[hsl(var(--gts-dark))] mb-4">
                    Planning Your Garden Project?
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                    Our garden clearance specialists can assess your project and recommend the most efficient waste removal solution for your specific needs.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button asChild size="lg" className="bg-[hsl(var(--gts-navy))] hover:bg-[hsl(var(--gts-navy))]/90">
                      <Link to="/contact">
                        <Phone className="w-4 h-4 mr-2" />
                        Free Project Assessment
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

export default GardenClearance;