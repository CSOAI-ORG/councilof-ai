import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, ArrowRight, Truck, Clock, CheckCircle, Phone, MapPin, Zap, TrendingDown } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";

const Pricing = () => {
  const [selectedService, setSelectedService] = useState("grab-hire");

  const pricingTiers = {
    "grab-hire": [
      {
        name: "Half Day Hire",
        duration: "Up to 4 hours",
        price: "From £180",
        features: [
          "Up to 4 hours on site",
          "10-tonne load capacity", 
          "Professional operator included",
          "All fuel and insurance included",
          "Perfect for small residential projects"
        ],
        popular: false
      },
      {
        name: "Full Day Hire", 
        duration: "Up to 8 hours",
        price: "From £280",
        features: [
          "Up to 8 hours on site",
          "18-tonne load capacity",
          "Professional operator included", 
          "Multiple loads if required",
          "Ideal for medium projects"
        ],
        popular: true
      },
      {
        name: "Load & Go",
        duration: "Single load",
        price: "From £120",
        features: [
          "Quick single load removal",
          "Up to 16 tons capacity",
          "Perfect for one-off clearances",
          "No minimum time commitment",
          "Great for urgent removals"
        ],
        popular: false
      }
    ],
    "muck-away": [
      {
        name: "Standard Muck Away",
        duration: "Per load",
        price: "From £140", 
        features: [
          "Up to 20 tons capacity per load",
          "Clean soil and hardcore only",
          "Licensed disposal included",
          "Same day service available",
          "Perfect for excavation projects"
        ],
        popular: false
      },
      {
        name: "Mixed Waste Removal",
        duration: "Per load", 
        price: "From £220",
        features: [
          "Mixed construction waste",
          "Sorting and recycling included",
          "Waste transfer notes provided",
          "Compliance documentation",
          "Ideal for renovation projects"  
        ],
        popular: true
      },
      {
        name: "Hazardous Waste",
        duration: "Per load",
        price: "From £350",
        features: [
          "Asbestos and contaminated soil", 
          "Specialist handling required",
          "Full compliance documentation",
          "Licensed disposal facility",
          "Expert safety protocols"
        ],
        popular: false
      }
    ],
    "aggregates": [
      {
        name: "Sand & Gravel",
        duration: "Per tonne",
        price: "From £35",
        features: [
          "High-quality washed materials",
          "Various grades available",
          "Delivered to your location", 
          "Bulk discounts available",
          "Perfect for foundations"
        ],
        popular: false
      },
      {
        name: "Crushed Stone",
        duration: "Per tonne", 
        price: "From £28",
        features: [
          "20mm, 40mm, and 75mm sizes",
          "Ideal for driveways and paths",
          "Compacts well for stability",
          "Weather-resistant material",
          "Professional delivery service"
        ],
        popular: true
      },
      {
        name: "Topsoil",
        duration: "Per tonne",
        price: "From £45", 
        features: [
          "Premium grade topsoil",
          "Screened and certified",
          "Perfect for landscaping",
          "Nutrient-rich composition",
          "Bulk orders welcome"
        ],
        popular: false
      }
    ]
  };

  const comparisonData = [
    {
      service: "GTS Grab Hire",
      capacity: "16 tons",
      time: "Same day",
      permits: "Not required",
      cost: "£180-280",
      access: "Over fences & walls"
    },
    {
      service: "Traditional Skip",
      capacity: "6-8 tonnes", 
      time: "2-3 days wait",
      permits: "Often required",
      cost: "£200-400+",
      access: "Road access only"
    },
    {
      service: "Multiple Skips",
      capacity: "20 tons (tipper)",
      time: "Extended hire",
      permits: "Multiple permits",
      cost: "£600-900+", 
      access: "Multiple locations"
    }
  ];

  const factors = [
    {
      title: "Material Type",
      description: "Clean soil costs less than mixed construction waste or hazardous materials",
      impact: "Low to High"
    },
    {
      title: "Location & Access",
      description: "Easy access locations may qualify for discounted rates",
      impact: "5-15% variation"
    },
    {
      title: "Load Size",
      description: "Partial loads and oversized materials affect pricing",
      impact: "10-25% variation"
    },
    {
      title: "Urgency",
      description: "Same-day and emergency services available with premium rates",
      impact: "20-30% premium"
    }
  ];

  return (
    <>
      <SEOHead 
        title="Grab Hire Pricing & Cost Calculator | Transparent Pricing | Kent, London, Essex"
        description="Transparent grab hire pricing from £120. Compare costs vs skip hire, get instant quotes, use our waste calculators. No hidden fees. Same day service across Kent, London & Essex."
        keywords="grab hire prices, grab hire costs, waste removal pricing, skip hire comparison, grab lorry prices kent, muck away costs, aggregates prices, cost calculator"
      />
      
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="hero-gradient text-white py-20 lg:py-32">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <Badge variant="secondary" className="bg-[hsl(var(--gts-yellow))] text-[hsl(var(--gts-dark))] mb-6 text-lg px-6 py-2">
                Transparent Pricing - No Hidden Costs
              </Badge>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                <span className="text-[hsl(var(--gts-yellow))]">Fair & Competitive</span> Grab Hire Pricing
              </h1>
              
              <p className="text-xl md:text-2xl mb-8 text-gray-200 leading-relaxed">
                Get instant quotes with our pricing calculator - no surprises, just honest pricing
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild variant="cta" size="lg" className="text-lg px-8 py-4">
                  <Link to="/quote">
                    <Calculator className="mr-2 w-5 h-5" />
                    Get Instant Quote
                  </Link>
                </Button>
                <Button asChild variant="outlineWhite" size="lg" className="text-lg px-8 py-4">
                  <a href="tel:07956222691">
                    <Phone className="mr-2 w-5 h-5" />
                    Call for Custom Quote
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Price Comparison */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-[hsl(var(--gts-dark))] mb-6">
                Why Choose Grab Hire?
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-8">
                Save money and time compared to traditional skip hire with our efficient grab lorry service
              </p>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-full">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {comparisonData.map((item, index) => (
                    <Card key={index} className={`${index === 0 ? 'border-[hsl(var(--gts-yellow))] border-2' : ''} relative`}>
                      {index === 0 && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <Badge className="bg-[hsl(var(--gts-yellow))] text-[hsl(var(--gts-dark))]">
                            Best Value
                          </Badge>
                        </div>
                      )}
                      <CardHeader className={index === 0 ? 'bg-[hsl(var(--gts-yellow))] bg-opacity-10' : ''}>
                        <CardTitle className={`text-xl ${index === 0 ? 'text-[hsl(var(--gts-dark))]' : 'text-gray-700'}`}>
                          {item.service}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex justify-between">
                          <span className="font-medium">Capacity:</span>
                          <span className={index === 0 ? 'text-[hsl(var(--gts-success))] font-semibold' : ''}>{item.capacity}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Availability:</span>
                          <span className={index === 0 ? 'text-[hsl(var(--gts-success))] font-semibold' : ''}>{item.time}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Permits:</span>
                          <span className={index === 0 ? 'text-[hsl(var(--gts-success))] font-semibold' : ''}>{item.permits}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Cost:</span>
                          <span className={`font-bold ${index === 0 ? 'text-[hsl(var(--gts-success))] text-lg' : ''}`}>{item.cost}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Access:</span>
                          <span className={index === 0 ? 'text-[hsl(var(--gts-success))] font-semibold' : ''}>{item.access}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>

            <div className="text-center mt-8">
              <Badge variant="outline" className="bg-[hsl(var(--gts-success))] text-white border-0 text-lg px-6 py-2">
                <TrendingDown className="w-4 h-4 mr-2" />
                Save up to 40% vs traditional skip hire
              </Badge>
            </div>
          </div>
        </section>

        {/* Service Pricing */}
        <section className="py-16 section-gradient">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-[hsl(var(--gts-dark))] mb-6">
                Service Pricing Guide
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Select your service to view detailed pricing options
              </p>
            </div>

            <Tabs value={selectedService} onValueChange={setSelectedService} className="w-full">
              <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto mb-12">
                <TabsTrigger value="grab-hire">Grab Hire</TabsTrigger>
                <TabsTrigger value="muck-away">Muck Away</TabsTrigger>
                <TabsTrigger value="aggregates">Aggregates</TabsTrigger>
              </TabsList>

              {Object.entries(pricingTiers).map(([service, tiers]) => (
                <TabsContent key={service} value={service}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {tiers.map((tier, index) => (
                      <Card key={index} className={`relative ${tier.popular ? 'border-[hsl(var(--gts-yellow))] border-2 shadow-lg' : ''}`}>
                        {tier.popular && (
                          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                            <Badge className="bg-[hsl(var(--gts-yellow))] text-[hsl(var(--gts-dark))]">
                              Most Popular
                            </Badge>
                          </div>
                        )}
                        <CardHeader className={tier.popular ? 'bg-[hsl(var(--gts-yellow))] bg-opacity-10' : ''}>
                          <CardTitle className="text-xl text-[hsl(var(--gts-dark))]">{tier.name}</CardTitle>
                          <div className="text-3xl font-bold text-[hsl(var(--gts-success))]">{tier.price}</div>
                          <p className="text-gray-600">{tier.duration}</p>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-3">
                            {tier.features.map((feature, idx) => (
                              <li key={idx} className="flex items-start">
                                <CheckCircle className="w-4 h-4 text-[hsl(var(--gts-success))] mr-3 mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-gray-600">{feature}</span>
                              </li>
                            ))}
                          </ul>
                          <Button asChild className="w-full mt-6" variant={tier.popular ? "default" : "outline"}>
                            <Link to="/quote">Get Quote</Link>
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </section>

        {/* Pricing Calculators */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-[hsl(var(--gts-dark))] mb-6">
                Cost Calculators
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Use our interactive calculators to estimate costs for your specific project
              </p>
            </div>

            <Tabs defaultValue="waste-calculator" className="w-full">
              <TabsList className="grid w-full grid-cols-2 max-w-lg mx-auto mb-12">
                <TabsTrigger value="waste-calculator">Waste Calculator</TabsTrigger>
                <TabsTrigger value="aggregates-calculator">Aggregates Calculator</TabsTrigger>
              </TabsList>

              <TabsContent value="waste-calculator">
                <Card className="max-w-2xl mx-auto">
                  <CardHeader>
                    <CardTitle className="text-center text-2xl text-[hsl(var(--gts-dark))]">
                      Waste Removal Cost Calculator
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Simple placeholder for now */}
                    <div className="text-center p-8 section-gradient rounded-lg">
                      <p className="text-gray-600">Waste Calculator Coming Soon</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="aggregates-calculator">
                <Card className="max-w-2xl mx-auto">
                  <CardHeader>
                    <CardTitle className="text-center text-2xl text-[hsl(var(--gts-dark))]">
                      Aggregates Cost Calculator
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Simple placeholder for now */}
                    <div className="text-center p-8 section-gradient rounded-lg">
                      <p className="text-gray-600">Aggregates Calculator Coming Soon</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* Pricing Factors */}
        <section className="py-16 section-gradient">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-[hsl(var(--gts-dark))] mb-6">
                  What Affects Pricing?
                </h2>
                <p className="text-lg text-gray-600">
                  Understanding the factors that influence grab hire costs helps you plan your budget accurately
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {factors.map((factor, index) => (
                  <Card key={index}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-bold text-[hsl(var(--gts-dark))]">{factor.title}</h3>
                        <Badge variant="outline">{factor.impact}</Badge>
                      </div>
                      <p className="text-gray-600">{factor.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-[hsl(var(--gts-success))] text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-xl mb-8 max-w-3xl mx-auto">
              Get an instant quote or speak to our team for a custom solution for your project
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-[hsl(var(--gts-success))]">
                <Link to="/quote">
                  <Calculator className="mr-2 w-5 h-5" />
                  Get Instant Quote
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-[hsl(var(--gts-success))]">
                <a href="tel:07956222691">
                  <Phone className="mr-2 w-5 h-5" />
                  Call: 07956 222 691
                </a>
              </Button>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </>
  );
};

export default Pricing;