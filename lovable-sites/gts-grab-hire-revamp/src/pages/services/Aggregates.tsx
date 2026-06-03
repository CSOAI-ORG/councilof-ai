import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, CheckCircle, Clock, Phone, ArrowRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import Badge from "@/components/Badge";

const Aggregates = () => {
  const aggregateTypes = [
    {
      title: 'Sand',
      description: 'High-quality sand for construction and landscaping projects',
      types: ['Sharp Sand', 'Building Sand', 'Plastering Sand', 'Horticultural Sand'],
      uses: ['Concrete mixing', 'Mortar preparation', 'Landscaping', 'Drainage']
    },
    {
      title: 'Gravel',
      description: 'Various grades of gravel for different applications',
      types: ['Pea Gravel', '10mm Gravel', '20mm Gravel', 'Decorative Gravel'],
      uses: ['Driveways', 'Pathways', 'Drainage systems', 'Decorative landscaping']
    },
    {
      title: 'Crushed Stone',
      description: 'Different grades of crushed stone for construction use',
      types: ['Type 1 MOT', 'Type 2 MOT', 'Crushed Concrete', 'Limestone'],
      uses: ['Road base', 'Foundation work', 'Hardcore', 'Sub-base preparation']
    },
    {
      title: 'Topsoil',
      description: 'Premium quality topsoil for gardening and landscaping',
      types: ['Screened Topsoil', 'Garden Soil', 'Lawn Soil', 'Compost-enriched Soil'],
      uses: ['Garden beds', 'Lawn establishment', 'Planting', 'Landscaping projects']
    }
  ];

  const deliveryInfo = [
    {
      title: 'Fast Delivery',
      description: 'Same-day or next-day delivery across Kent, London, and Essex',
      icon: <Clock className="w-8 h-8" />
    },
    {
      title: 'Direct to Site',
      description: 'Precise placement using our grab lorries for maximum convenience',
      icon: <Truck className="w-8 h-8" />
    },
    {
      title: 'Quality Assured',
      description: 'All aggregates sourced from approved suppliers and quality tested',
      icon: <CheckCircle className="w-8 h-8" />
    }
  ];

  return (
    <>
      <SEOHead 
        title="Aggregates Supply Kent London Essex | Sand Gravel Topsoil | GTS Grab Hire"
        description="High-quality aggregates supply and delivery in Kent, London & Essex. Sand, gravel, crushed stone, topsoil. Fast delivery. Competitive prices. Professional service."
        keywords="aggregates supply, sand delivery, gravel supply, topsoil, crushed stone, kent london essex, construction materials"
      />
      
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="hero-gradient text-white py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <Badge variant="yellow" className="mb-6">
                Aggregates Supply
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                High-Quality Aggregates Delivered to Your Site
              </h1>
              <p className="text-xl md:text-2xl text-gray-200 mb-8 leading-relaxed">
                Professional aggregate supply and delivery service across Kent, London, and Essex. Sand, gravel, crushed stone, and topsoil delivered directly to your project.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild variant="cta" size="xl">
                  <Link to="/quote">Get Free Quote</Link>
                </Button>
                <Button asChild variant="outlineWhite" size="xl">
                  <a href="tel:07956222691">
                    <Phone className="mr-2 w-5 h-5" />
                    Call: 07956 222 691
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Service Overview */}
        <section className="section-padding section-gradient">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-[hsl(var(--gts-dark))] mb-6">
                Professional Aggregates Supply Service
              </h2>
              <p className="text-lg text-gray-600 max-w-4xl mx-auto leading-relaxed">
                Whether you're working on a small domestic project or a large commercial development, we supply high-quality 
                aggregates delivered directly to your site. Our grab hire vehicles can place materials exactly where you need 
                them, saving time and labor costs.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {deliveryInfo.map((info, index) => (
                <Card key={index} className="text-center bg-white shadow-[var(--shadow-card)] border-0 card-hover">
                  <CardHeader>
                    <div className="mx-auto mb-4 p-4 bg-[hsl(var(--gts-yellow))] bg-opacity-10 rounded-full text-[hsl(var(--gts-yellow))] w-16 h-16 flex items-center justify-center">
                      {info.icon}
                    </div>
                    <CardTitle className="text-xl text-[hsl(var(--gts-dark))]">{info.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-gray-600 leading-relaxed">
                      {info.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>


        {/* Aggregates List Section */}
        <section className="section-padding section-gradient">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-[hsl(var(--gts-dark))] mb-6">
                Our Aggregates Range
              </h2>
              <p className="text-lg text-gray-600">
                Comprehensive selection of high-quality aggregates for all your construction and landscaping needs
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {aggregateTypes.map((aggregate, index) => (
                <Card key={index} className="bg-white shadow-[var(--shadow-card)] border-0 card-hover">
                  <CardHeader>
                    <CardTitle className="text-2xl text-[hsl(var(--gts-dark))] flex items-center">
                      <div className="w-3 h-3 bg-[hsl(var(--gts-yellow))] rounded-full mr-3"></div>
                      {aggregate.title}
                    </CardTitle>
                    <CardDescription className="text-gray-600 leading-relaxed">
                      {aggregate.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h4 className="font-semibold text-[hsl(var(--gts-dark))] mb-3">Available Types:</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {aggregate.types.map((type, idx) => (
                          <div key={idx} className="flex items-center text-sm text-gray-600">
                            <CheckCircle className="w-4 h-4 text-[hsl(var(--gts-success))] mr-2" />
                            {type}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-[hsl(var(--gts-dark))] mb-3">Common Uses:</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {aggregate.uses.map((use, idx) => (
                          <div key={idx} className="flex items-center text-sm text-gray-600">
                            <div className="w-2 h-2 bg-[hsl(var(--gts-yellow))] rounded-full mr-2"></div>
                            {use}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Delivery Information */}
        <section className="section-padding section-gradient">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-[hsl(var(--gts-dark))] mb-6">
                  Professional Delivery Service
                </h2>
                <div className="space-y-4 text-lg text-gray-700 leading-relaxed">
                  <p>
                    Our aggregates delivery service combines the convenience of direct supply with the flexibility 
                    of grab hire. We can deliver materials to exactly where you need them on your site, whether 
                    that's over a fence, through a narrow access point, or into a specific location.
                  </p>
                  <p>
                    All our aggregates are sourced from approved suppliers and meet current industry standards. 
                    We provide delivery notes and can supply test certificates where required for commercial projects.
                  </p>
                  <p>
                    Our service areas cover the whole of Kent, London, and Essex with same-day delivery available 
                    for urgent requirements. We can also combine aggregate delivery with waste removal for 
                    maximum efficiency.
                  </p>
                </div>
              </div>
              <Card className="bg-white shadow-[var(--shadow-card)] border-0">
                <CardContent className="p-8">
                  <div className="bg-[hsl(var(--gts-yellow))] bg-opacity-10 rounded-lg p-8">
                    <h3 className="text-2xl font-bold text-[hsl(var(--gts-dark))] mb-6 text-center">Delivery Options</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-3 border-b border-gray-200">
                        <span className="font-medium text-[hsl(var(--gts-dark))]">Minimum Load:</span>
                        <span className="text-gray-600">1 tonne</span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-gray-200">
                        <span className="font-medium text-[hsl(var(--gts-dark))]">Maximum Load:</span>
                        <span className="text-gray-600">16 tons</span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-gray-200">
                        <span className="font-medium text-[hsl(var(--gts-dark))]">Delivery Areas:</span>
                        <span className="text-gray-600">Kent, London, Essex</span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-gray-200">
                        <span className="font-medium text-[hsl(var(--gts-dark))]">Response Time:</span>
                        <span className="text-gray-600">Same/next day</span>
                      </div>
                      <div className="flex justify-between items-center py-3">
                        <span className="font-medium text-[hsl(var(--gts-dark))]">Placement:</span>
                        <span className="text-gray-600">Precise positioning</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="section-padding bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-[hsl(var(--gts-dark))] mb-6">
                Competitive Pricing
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Transparent pricing with no hidden costs. Delivery charges included in all quotes.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="bg-[hsl(var(--gts-yellow))] bg-opacity-10 border-0 shadow-[var(--shadow-card)]">
                <CardHeader>
                  <CardTitle className="text-2xl text-[hsl(var(--gts-dark))]">Standard Pricing</CardTitle>
                  <CardDescription>Competitive rates for all aggregate types</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-[hsl(var(--gts-success))] mr-3" />
                    <span className="text-gray-700">Per tonne pricing available</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-[hsl(var(--gts-success))] mr-3" />
                    <span className="text-gray-700">Bulk discounts for large orders</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-[hsl(var(--gts-success))] mr-3" />
                    <span className="text-gray-700">Delivery included in price</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-[hsl(var(--gts-success))] mr-3" />
                    <span className="text-gray-700">No minimum order charges</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-0 shadow-[var(--shadow-card)]">
                <CardHeader>
                  <CardTitle className="text-2xl text-[hsl(var(--gts-dark))]">Combined Services</CardTitle>
                  <CardDescription>Save money by combining delivery with waste removal</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-[hsl(var(--gts-success))] mr-3" />
                    <span className="text-gray-700">Muck away + aggregate delivery</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-[hsl(var(--gts-success))] mr-3" />
                    <span className="text-gray-700">One visit for both services</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-[hsl(var(--gts-success))] mr-3" />
                    <span className="text-gray-700">Reduced overall costs</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-[hsl(var(--gts-success))] mr-3" />
                    <span className="text-gray-700">Maximum efficiency</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-8 bg-[hsl(var(--gts-navy))] text-white border-0">
              <CardContent className="p-8 text-center">
                <h3 className="text-2xl font-bold mb-4">Get Your Custom Quote Today</h3>
                <p className="text-gray-200 mb-6 max-w-2xl mx-auto">
                  Every project is different. Contact us for a personalized quote based on your specific aggregate needs and delivery requirements.
                </p>
                <Button asChild variant="cta" size="lg">
                  <Link to="/quote">
                    Get Free Quote
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="hero-gradient text-white py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Order Your Aggregates Today
            </h2>
            <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
              High-quality aggregates delivered directly to your site. Same-day delivery available across Kent, London, and Essex.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild variant="cta" size="lg">
                <Link to="/quote">Get Free Quote</Link>
              </Button>
              <Button asChild variant="outlineWhite" size="lg">
                <a href="tel:07958710548">Call: 07958 710 548</a>
              </Button>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </>
  );
};

export default Aggregates;