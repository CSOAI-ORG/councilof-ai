import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, CheckCircle, Clock, Recycle, Phone, ArrowRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import Badge from "@/components/Badge";

const MuckAway = () => {
  const benefits = [
    {
      icon: <CheckCircle className="w-8 h-8" />,
      title: 'Cost-Effective',
      description: 'One grab lorry load equals approximately 3 skip loads, providing significant cost savings for larger projects.'
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: 'Time-Saving',
      description: 'Quick collection and removal in a single operation, allowing your project to continue without delays.'
    },
    {
      icon: <Truck className="w-8 h-8" />,
      title: 'Convenient',
      description: 'No need for permits or long-term site occupation. We arrive, load, and leave quickly and efficiently.'
    },
    {
      icon: <Recycle className="w-8 h-8" />,
      title: 'Environmentally Friendly',
      description: 'We sort and recycle materials wherever possible, ensuring responsible disposal and environmental protection.'
    }
  ];

  const process = [
    {
      step: 1,
      title: 'Booking',
      description: 'Contact us with your project details and we\'ll provide a competitive quote and schedule a convenient time.'
    },
    {
      step: 2,
      title: 'Collection',
      description: 'Our professional operator arrives with a modern grab lorry and efficiently loads your waste materials.'
    },
    {
      step: 3,
      title: 'Disposal',
      description: 'We transport your waste to licensed facilities for proper disposal and recycling, providing all documentation.'
    }
  ];

  const pricingTiers = [
    {
      title: 'Small Load',
      capacity: 'Up to 6 tonnes',
      description: 'Perfect for small domestic projects',
      features: ['Garden clearance', 'Small renovation waste', 'Soil removal', 'Quick collection']
    },
    {
      title: 'Medium Load', 
      capacity: 'Up to 12 tonnes',
      description: 'Ideal for medium commercial projects',
      features: ['Construction waste', 'Office clearance', 'Landscaping projects', 'Mixed materials']
    },
    {
      title: 'Large Load',
      capacity: 'Up to 20 tons',
      description: 'Best value for large-scale projects',
      features: ['Major construction', 'Site clearance', 'Bulk soil removal', 'Maximum capacity']
    }
  ];

  return (
    <>
      <SEOHead 
        title="Muck Away Services Kent London Essex | Soil Removal | GTS Grab Hire"
        description="Professional muck away services in Kent, London & Essex. Remove soil, rubble, green waste. Up to 20-ton capacity. Same day service. Licensed waste carrier. Free quotes."
        keywords="muck away, soil removal, waste removal, grab hire, kent london essex, licensed waste carrier, same day service"
      />
      
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="hero-gradient text-white py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <Badge variant="yellow" className="mb-6">
                Muck Away Services
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                Efficient and Reliable Muck Away Services in Kent, London & Essex
              </h1>
              <p className="text-xl md:text-2xl text-gray-200 mb-8 leading-relaxed">
                Professional waste removal with tipper lorries capable of carrying up to 20 tons - equivalent to 3 skip loads in one go
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-[hsl(var(--gts-dark))] mb-6">
                  What is Muck Away?
                </h2>
                <div className="space-y-4 text-lg text-gray-700 leading-relaxed">
                  <p>
                    Muck away is a specialized waste removal service that uses grab lorries to efficiently collect and 
                    remove large volumes of soil, rubble, and other waste materials from your site. This method is 
                    particularly effective for construction projects, landscaping work, and site clearances.
                  </p>
                  <p>
                     Our muck away service eliminates the need for multiple skip collections, reducing both cost and 
                     disruption to your project. With our 20-ton capacity tipper lorries, we can remove the equivalent 
                     of three standard skips in a single load.
                  </p>
                  <p>
                    We accept soil, clay, rubble, concrete, bricks, and most non-hazardous construction waste. 
                    All materials are disposed of responsibly at licensed facilities with full documentation provided.
                  </p>
                </div>
              </div>
              <Card className="bg-white shadow-[var(--shadow-card)] border-0">
                <CardContent className="p-8">
                  <div className="bg-[hsl(var(--gts-yellow))] bg-opacity-10 rounded-lg p-8 text-center">
                    <Truck className="w-16 h-16 text-[hsl(var(--gts-dark))] mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-[hsl(var(--gts-dark))] mb-4">20 Ton Capacity</h3>
                    <p className="text-gray-600 mb-4">Equivalent to 3 standard skip loads</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-white p-3 rounded">
                        <p className="font-semibold text-[hsl(var(--gts-dark))]">Volume</p>
                        <p className="text-gray-600">Up to 12 cubic meters</p>
                      </div>
                      <div className="bg-white p-3 rounded">
                        <p className="font-semibold text-[hsl(var(--gts-dark))]">Weight</p>
                        <p className="text-gray-600">Up to 20 tons</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="section-padding bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-[hsl(var(--gts-dark))] mb-6">
                Benefits of Our Muck Away Service
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Discover why our muck away service is the preferred choice for construction professionals and homeowners across Kent, London, and Essex
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {benefits.map((benefit, index) => (
                <Card key={index} className="text-center bg-white shadow-[var(--shadow-card)] border-0 card-hover">
                  <CardHeader>
                    <div className="mx-auto mb-4 p-4 bg-[hsl(var(--gts-yellow))] bg-opacity-10 rounded-full text-[hsl(var(--gts-dark))] w-16 h-16 flex items-center justify-center">
                      {benefit.icon}
                    </div>
                    <CardTitle className="text-xl text-[hsl(var(--gts-dark))]">{benefit.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-gray-600 leading-relaxed">
                      {benefit.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section className="section-padding section-gradient">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-[hsl(var(--gts-dark))] mb-6">
                Our Muck Away Process
              </h2>
              <p className="text-lg text-gray-600">
                Simple, efficient, and professional - here's how our muck away service works
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {process.map((step, index) => (
                <Card key={index} className="text-center bg-white shadow-[var(--shadow-card)] border-0">
                  <CardHeader>
                    <div className="mx-auto mb-4 w-16 h-16 bg-[hsl(var(--gts-yellow))] rounded-full flex items-center justify-center">
                      <span className="text-2xl font-bold text-[hsl(var(--gts-dark))]">{step.step}</span>
                    </div>
                    <CardTitle className="text-xl text-[hsl(var(--gts-dark))]">{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-gray-600 leading-relaxed">
                      {step.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>


        {/* Pricing Section */}
        <section className="section-padding section-gradient">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-[hsl(var(--gts-dark))] mb-6">
                Competitive Pricing Options
              </h2>
              <p className="text-lg text-gray-600">
                Transparent pricing based on load size - no hidden costs or surprises
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              {pricingTiers.map((tier, index) => (
                <Card key={index} className={`text-center shadow-[var(--shadow-card)] border-0 ${
                  index === 1 ? 'bg-[hsl(var(--gts-yellow))] bg-opacity-10 ring-2 ring-[hsl(var(--gts-yellow))]' : 'bg-white'
                }`}>
                  <CardHeader>
                    <CardTitle className="text-2xl text-[hsl(var(--gts-dark))]">{tier.title}</CardTitle>
                    <div className="text-3xl font-bold text-[hsl(var(--gts-yellow))] mb-2">{tier.capacity}</div>
                    <CardDescription className="text-gray-600">{tier.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 mb-6">
                      {tier.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center justify-center text-sm text-gray-600">
                          <CheckCircle className="w-4 h-4 text-[hsl(var(--gts-green))] mr-2" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button variant={index === 1 ? "primary" : "outline"} className="w-full">
                      Get Quote
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="bg-[hsl(var(--gts-yellow))] bg-opacity-10 border-0 text-center">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold text-[hsl(var(--gts-dark))] mb-4">
                  Need a Custom Quote?
                </h3>
                <p className="text-gray-600 mb-6">
                  Every project is unique. Contact us for a personalized quote based on your specific requirements.
                </p>
                <Button asChild variant="primary" size="lg">
                  <Link to="/quote">
                    Get Custom Quote
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
              Ready to Book Your Muck Away Service?
            </h2>
            <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
              Get professional muck away services with same-day availability. Licensed, insured, and environmentally responsible.
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

export default MuckAway;