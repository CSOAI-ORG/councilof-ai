import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, User, ArrowLeft, Phone, Truck, Package } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import Badge from "@/components/Badge";


const GrabLorrySize = () => {
  return (
    <>
      <SEOHead 
        title="What Size Grab Lorry Do I Need? Complete Size Guide 2024 | GTS Grab Hire"
        description="Choose the right grab lorry size for your project. Complete guide to grab lorry capacities, costs, and which size suits your waste removal needs."
        keywords="grab lorry sizes, grab hire capacity, waste removal volume, grab lorry guide, Essex grab hire sizes"
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
              How-To Guide
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              What Size Grab Lorry Do I Need? Complete Guide
            </h1>
            <div className="flex items-center text-gray-200 mb-8">
              <Calendar className="w-5 h-5 mr-2" />
              <span className="mr-6">January 10, 2024</span>
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
                    Choosing the right grab lorry size is crucial for project efficiency and cost-effectiveness. This comprehensive guide helps you determine the perfect grab lorry capacity for your specific waste removal needs.
                  </p>
                  
                  <div className="bg-[hsl(var(--gts-yellow))] bg-opacity-10 p-6 rounded-lg border-l-4 border-[hsl(var(--gts-yellow))]">
                    <h3 className="text-lg font-semibold text-[hsl(var(--gts-dark))] mb-2">Quick Size Calculator</h3>
                    <p className="text-gray-700">
                      As a general rule: 1 cubic meter of mixed construction waste ≈ 1.5 tons. Garden waste is lighter at approximately 0.8 tons per cubic meter.
                    </p>
                  </div>
                </div>

                {/* Size Overview */}
                <Card className="bg-white shadow-[var(--shadow-card)] border-0 mb-8">
                  <CardContent className="p-8">
                    <h2 className="text-3xl font-bold text-[hsl(var(--gts-dark))] mb-6">GTS Grab Lorry Size Options</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      
                      {/* 6-Wheeler */}
                      <div className="bg-[hsl(var(--gts-yellow))] bg-opacity-10 p-6 rounded-lg border-2 border-[hsl(var(--gts-yellow))]">
                        <div className="flex items-center mb-4">
                          <Truck className="w-6 h-6 text-[hsl(var(--gts-dark))] mr-3" />
                          <h3 className="text-xl font-bold text-[hsl(var(--gts-dark))]">6-Wheeler</h3>
                        </div>
                        <ul className="space-y-2 text-gray-700 mb-4">
                          <li>• <strong>Capacity:</strong> Up to 4 tons</li>
                          <li>• <strong>Volume:</strong> 2-3 cubic meters</li>
                          <li>• <strong>Best for:</strong> Small residential projects</li>
                          <li>• <strong>Examples:</strong> Garden clearance, small renovations</li>
                        </ul>
                        <p className="text-sm text-[hsl(var(--gts-dark))] font-medium">From £180</p>
                      </div>

                      {/* 8-Wheeler */}
                      <div className="bg-[hsl(var(--gts-success))] bg-opacity-10 p-6 rounded-lg border-2 border-[hsl(var(--gts-success))]">
                        <div className="flex items-center mb-4">
                          <Truck className="w-6 h-6 text-[hsl(var(--gts-dark))] mr-3" />
                          <h3 className="text-xl font-bold text-[hsl(var(--gts-dark))]">8-Wheeler (Most Popular)</h3>
                        </div>
                        <ul className="space-y-2 text-gray-700 mb-4">
                          <li>• <strong>Capacity:</strong> Up to 8 tons</li>
                          <li>• <strong>Volume:</strong> 4-6 cubic meters</li>
                          <li>• <strong>Best for:</strong> Medium commercial projects</li>
                          <li>• <strong>Examples:</strong> House renovations, small construction sites</li>
                        </ul>
                        <p className="text-sm text-[hsl(var(--gts-dark))] font-medium">From £280</p>
                      </div>

                      {/* 10-Wheeler */}
                      <div className="bg-[hsl(var(--gts-navy))] bg-opacity-10 p-6 rounded-lg border-2 border-[hsl(var(--gts-navy))]">
                        <div className="flex items-center mb-4">
                          <Truck className="w-6 h-6 text-[hsl(var(--gts-dark))] mr-3" />
                          <h3 className="text-xl font-bold text-[hsl(var(--gts-dark))]">10-Wheeler</h3>
                        </div>
                        <ul className="space-y-2 text-gray-700 mb-4">
                          <li>• <strong>Capacity:</strong> Up to 12 tons</li>
                          <li>• <strong>Volume:</strong> 8-10 cubic meters</li>
                          <li>• <strong>Best for:</strong> Large construction projects</li>
                          <li>• <strong>Examples:</strong> Commercial builds, major clearances</li>
                        </ul>
                        <p className="text-sm text-[hsl(var(--gts-dark))] font-medium">From £380</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Project Type Guide */}
                <Card className="bg-white shadow-[var(--shadow-card)] border-0 mb-8">
                  <CardContent className="p-8">
                    <h2 className="text-3xl font-bold text-[hsl(var(--gts-dark))] mb-6">Size Recommendations by Project Type</h2>
                    
                    <div className="space-y-6">
                      
                      {/* Residential Projects */}
                      <div className="section-gradient p-6 rounded-lg">
                        <h3 className="text-xl font-semibold text-[hsl(var(--gts-dark))] mb-4 flex items-center">
                          <Package className="w-5 h-5 mr-2 text-[hsl(var(--gts-yellow))]" />
                          Residential Projects
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium text-[hsl(var(--gts-dark))] mb-2">Garden Clearance</h4>
                            <p className="text-sm text-gray-600 mb-2">Recommended: 6-Wheeler (up to 4 tons)</p>
                            <p className="text-xs text-gray-500">Typical load: Green waste, soil, small shrubs</p>
                          </div>
                          <div>
                            <h4 className="font-medium text-[hsl(var(--gts-dark))] mb-2">Kitchen Renovation</h4>
                            <p className="text-sm text-gray-600 mb-2">Recommended: 8-Wheeler (up to 8 tons)</p>
                            <p className="text-xs text-gray-500">Typical load: Cabinets, appliances, tiles, debris</p>
                          </div>
                          <div>
                            <h4 className="font-medium text-[hsl(var(--gts-dark))] mb-2">Bathroom Renovation</h4>
                            <p className="text-sm text-gray-600 mb-2">Recommended: 6-Wheeler (up to 4 tons)</p>
                            <p className="text-xs text-gray-500">Typical load: Tiles, fixtures, small debris</p>
                          </div>
                          <div>
                            <h4 className="font-medium text-[hsl(var(--gts-dark))] mb-2">Whole House Clearance</h4>
                            <p className="text-sm text-gray-600 mb-2">Recommended: 8-10 Wheeler (up to 12 tons)</p>
                            <p className="text-xs text-gray-500">Typical load: Furniture, personal items, mixed waste</p>
                          </div>
                        </div>
                      </div>

                      {/* Commercial Projects */}
                      <div className="section-gradient p-6 rounded-lg">
                        <h3 className="text-xl font-semibold text-[hsl(var(--gts-dark))] mb-4 flex items-center">
                          <Package className="w-5 h-5 mr-2 text-[hsl(var(--gts-success))]" />
                          Commercial Projects
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium text-[hsl(var(--gts-dark))] mb-2">Office Clearance</h4>
                            <p className="text-sm text-gray-600 mb-2">Recommended: 8-Wheeler (up to 8 tons)</p>
                            <p className="text-xs text-gray-500">Typical load: Furniture, IT equipment, documents</p>
                          </div>
                          <div>
                            <h4 className="font-medium text-[hsl(var(--gts-dark))] mb-2">Retail Strip-Out</h4>
                            <p className="text-sm text-gray-600 mb-2">Recommended: 10-Wheeler (up to 12 tons)</p>
                            <p className="text-xs text-gray-500">Typical load: Fittings, displays, construction debris</p>
                          </div>
                          <div>
                            <h4 className="font-medium text-[hsl(var(--gts-dark))] mb-2">Construction Site</h4>
                            <p className="text-sm text-gray-600 mb-2">Recommended: 10-Wheeler (up to 12 tons)</p>
                            <p className="text-xs text-gray-500">Typical load: Concrete, bricks, mixed construction waste</p>
                          </div>
                          <div>
                            <h4 className="font-medium text-[hsl(var(--gts-dark))] mb-2">Landscaping Project</h4>
                            <p className="text-sm text-gray-600 mb-2">Recommended: 8-Wheeler (up to 8 tons)</p>
                            <p className="text-xs text-gray-500">Typical load: Soil, turf, garden waste, small trees</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Weight vs Volume Guide */}
                <Card className="bg-white shadow-[var(--shadow-card)] border-0 mb-8">
                  <CardContent className="p-8">
                    <h2 className="text-3xl font-bold text-[hsl(var(--gts-dark))] mb-6">Understanding Weight vs Volume</h2>
                    
                    <div className="bg-[hsl(var(--gts-yellow))] bg-opacity-10 p-6 rounded-lg mb-6">
                      <h3 className="text-lg font-semibold text-[hsl(var(--gts-dark))] mb-4">Important: Weight Limits vs Volume Limits</h3>
                      <p className="text-gray-700 mb-4">
                        Grab lorries have both weight and volume limitations. Dense materials like concrete may reach the weight limit before filling the lorry, while light materials like garden waste may fill the volume before reaching weight capacity.
                      </p>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b-2 border-[hsl(var(--gts-yellow))]">
                            <th className="text-left py-3 px-4 font-semibold text-[hsl(var(--gts-dark))]">Material Type</th>
                            <th className="text-center py-3 px-4 font-semibold text-[hsl(var(--gts-dark))]">Approximate Weight (per m³)</th>
                            <th className="text-center py-3 px-4 font-semibold text-[hsl(var(--gts-dark))]">Limiting Factor</th>
                          </tr>
                        </thead>
                        <tbody className="text-gray-700">
                          <tr className="border-b border-gray-200">
                            <td className="py-3 px-4">Garden Waste</td>
                            <td className="py-3 px-4 text-center">0.5 - 0.8 tons</td>
                            <td className="py-3 px-4 text-center">Volume</td>
                          </tr>
                          <tr className="border-b border-gray-200">
                            <td className="py-3 px-4">Mixed Construction</td>
                            <td className="py-3 px-4 text-center">1.2 - 1.5 tons</td>
                            <td className="py-3 px-4 text-center">Weight</td>
                          </tr>
                          <tr className="border-b border-gray-200">
                            <td className="py-3 px-4">Concrete/Bricks</td>
                            <td className="py-3 px-4 text-center">2.0 - 2.5 tons</td>
                            <td className="py-3 px-4 text-center">Weight</td>
                          </tr>
                          <tr className="border-b border-gray-200">
                            <td className="py-3 px-4">Soil/Earth</td>
                            <td className="py-3 px-4 text-center">1.3 - 1.7 tons</td>
                            <td className="py-3 px-4 text-center">Weight</td>
                          </tr>
                          <tr>
                            <td className="py-3 px-4">General Household</td>
                            <td className="py-3 px-4 text-center">0.8 - 1.2 tons</td>
                            <td className="py-3 px-4 text-center">Volume</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* Cost Optimization Tips */}
                <Card className="bg-white shadow-[var(--shadow-card)] border-0 mb-8">
                  <CardContent className="p-8">
                    <h2 className="text-3xl font-bold text-[hsl(var(--gts-dark))] mb-6">Cost Optimization Tips</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <h3 className="text-xl font-semibold text-[hsl(var(--gts-dark))] mb-4">Maximize Efficiency</h3>
                        <ul className="space-y-3 text-gray-700">
                          <li>• <strong>Pre-sort materials:</strong> Separate heavy from light waste</li>
                          <li>• <strong>Prepare access:</strong> Ensure lorry can position optimally</li>
                          <li>• <strong>Load strategically:</strong> Heavy items first, light materials on top</li>
                          <li>• <strong>Timing:</strong> Book during off-peak hours for better availability</li>
                        </ul>
                      </div>
                      
                      <div>
                        <h3 className="text-xl font-semibold text-[hsl(var(--gts-dark))] mb-4">Avoid Extra Costs</h3>
                        <ul className="space-y-3 text-gray-700">
                          <li>• <strong>Don't overestimate:</strong> Larger lorries cost more</li>
                          <li>• <strong>Clear pathways:</strong> Avoid access delays</li>
                          <li>• <strong>Accurate description:</strong> Ensure correct lorry is sent</li>
                          <li>• <strong>Single visit:</strong> Combine multiple clearance tasks</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Expert Advice */}
                <Card className="bg-[hsl(var(--gts-navy))] text-white border-0 mb-8">
                  <CardContent className="p-8">
                    <h2 className="text-3xl font-bold mb-6">Expert Recommendation</h2>
                    <p className="text-lg text-gray-200 leading-relaxed mb-6">
                      When in doubt, consult with GTS Grab Hire's experienced team. We can assess your project requirements and recommend the optimal lorry size based on 35+ years of industry experience. Our free site assessments ensure you get the right equipment for maximum efficiency and value.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button asChild variant="cta" size="lg">
                        <Link to="/quote">Get Size Recommendation & Quote</Link>
                      </Button>
                      <Button asChild variant="outline" size="lg" className="border-[hsl(var(--gts-yellow))] text-[hsl(var(--gts-yellow))] hover:bg-[hsl(var(--gts-yellow))] hover:text-[hsl(var(--gts-dark))]">
                        <Link to="/contact">Speak to Our Experts</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

              </div>

              {/* Contact CTA */}
              <Card className="bg-white shadow-[var(--shadow-card)] border-0 mt-12">
                <CardContent className="p-8 text-center">
                  <h3 className="text-2xl font-bold text-[hsl(var(--gts-dark))] mb-4">
                    Still Unsure About the Right Size?
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                    Our grab hire specialists provide free consultations to help you choose the perfect lorry size for your specific project requirements.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button asChild size="lg" className="bg-[hsl(var(--gts-navy))] hover:bg-[hsl(var(--gts-navy))]/90">
                      <Link to="/contact">
                        <Phone className="w-4 h-4 mr-2" />
                        Free Consultation
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg">
                      <Link to="/quote">Calculate Your Needs</Link>
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

export default GrabLorrySize;