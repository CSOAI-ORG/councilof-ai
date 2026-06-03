import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, CheckCircle, Clock, Shield, Phone, ArrowRight, Scale, MapPin } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import Badge from "@/components/Badge";

const TipperHire = () => {
  const benefits = [
    {
      icon: <Scale className="w-8 h-8" />,
      title: 'Flexible Capacity',
      description: 'Multiple tipper sizes available from 7.5 tons to 20 tons capacity, perfect for various project needs.'
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: 'Quick Turnaround',
      description: 'Fast loading and unloading times, allowing for multiple trips per day to maximize productivity.'
    },
    {
      icon: <Truck className="w-8 h-8" />,
      title: 'Versatile Access',
      description: 'Can access most standard roads and construction sites, ideal for aggregate delivery and waste collection.'
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'Reliable Service',
      description: 'Professional drivers with extensive experience in construction and utilities work across Kent, London & Essex.'
    }
  ];

  const useCases = [
    {
      title: 'Road Construction',
      description: 'Aggregate delivery and spoil removal for road building projects',
      icon: <MapPin className="w-6 h-6" />
    },
    {
      title: 'Landscaping Projects',
      description: 'Topsoil, bark chip, and stone delivery for landscaping work',
      icon: <Truck className="w-6 h-6" />
    },
    {
      title: 'Building Construction',
      description: 'Material delivery and waste removal for construction sites',
      icon: <Shield className="w-6 h-6" />
    }
  ];

  const fleet = [
    {
      title: '7.5 Tonne Tipper',
      capacity: 'Up to 7.5 tonnes',
      description: 'Perfect for smaller projects and restricted access areas',
      features: ['Compact size', 'Urban access', 'Quick maneuverability', 'Cost effective']
    },
    {
      title: '18 Ton Tipper',
      capacity: 'Up to 18 tons',
      description: 'Our most popular tipper for medium to large projects',
      features: ['Standard construction access', 'Optimal capacity', 'Versatile loading', 'Efficient operation']
    },
    {
      title: '20 Ton Tipper',
      capacity: 'Up to 20 tons',
      description: 'Maximum capacity for large-scale commercial projects',
      features: ['High volume loads', 'Major project capability', 'Maximum efficiency', 'Commercial grade']
    }
  ];

  return (
    <>
      <SEOHead 
        title="Tipper Hire & Muck Away | Up to 20 Tons | Kent London Essex | GTS Grab Hire"
        description="Professional tipper hire and muck away services up to 20 tons capacity in Kent, London & Essex. Aggregate delivery, waste collection. Experienced drivers. Competitive rates."
        keywords="tipper hire, muck away, up to 20 tons, aggregate delivery, kent london essex, construction transport, professional drivers"
      />
      
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="hero-gradient text-white py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <Badge variant="yellow" className="mb-6">
                Tipper Hire Services
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                Professional Tipper Hire Services in Kent, London & Essex
              </h1>
              <p className="text-xl md:text-2xl text-gray-200 mb-8 leading-relaxed">
                Flexible tipper hire from 7.5 to 20 tons capacity for aggregate delivery, waste collection, and construction projects
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
                  Tipper Hire vs Grab Hire
                </h2>
                <div className="space-y-4 text-lg text-gray-700 leading-relaxed">
                  <p>
                    While grab hire lorries are excellent for waste removal with their hydraulic arm capability, 
                    tipper trucks excel at material delivery and standard waste collection where loading can be 
                    done conventionally. Tipper hire offers more flexibility for certain projects.
                  </p>
                  <p>
                    Our tipper hire service is ideal when you need dedicated transport for aggregate delivery, 
                    or when you have machinery on-site that can load the tipper directly. This approach often 
                    provides better value for ongoing projects requiring multiple deliveries.
                  </p>
                  <p>
                     Available in multiple sizes from 7.5 tons for urban work to 20 tons for major commercial 
                     projects, our modern fleet is maintained to the highest standards with experienced drivers.
                  </p>
                </div>
              </div>
              <Card className="bg-white shadow-[var(--shadow-card)] border-0">
                <CardContent className="p-8">
                  <div className="bg-[hsl(var(--gts-yellow))] bg-opacity-10 rounded-lg p-8 text-center">
                    <Truck className="w-16 h-16 text-[hsl(var(--gts-dark))] mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-[hsl(var(--gts-dark))] mb-4">Flexible Fleet</h3>
                    <p className="text-gray-600 mb-4">7.5 to 20 tons capacity range</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-white p-3 rounded">
                        <p className="font-semibold text-[hsl(var(--gts-dark))]">Daily Hire</p>
                        <p className="text-gray-600">From £200/day</p>
                      </div>
                      <div className="bg-white p-3 rounded">
                        <p className="font-semibold text-[hsl(var(--gts-dark))]">Weekly Hire</p>
                        <p className="text-gray-600">Discounted rates</p>
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
                Benefits of Our Tipper Hire Service
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Discover why our tipper hire service is the preferred choice for construction professionals and contractors across Kent, London, and Essex
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

        {/* Fleet Section */}
        <section className="section-padding section-gradient">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-[hsl(var(--gts-dark))] mb-6">
                Our Tipper Fleet
              </h2>
              <p className="text-lg text-gray-600">
                Modern, well-maintained tippers available for hire with professional drivers
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              {fleet.map((tipper, index) => (
                <Card key={index} className={`text-center shadow-[var(--shadow-card)] border-0 ${
                  index === 1 ? 'bg-[hsl(var(--gts-yellow))] bg-opacity-10 ring-2 ring-[hsl(var(--gts-yellow))]' : 'bg-white'
                }`}>
                  <CardHeader>
                    <CardTitle className="text-2xl text-[hsl(var(--gts-dark))]">{tipper.title}</CardTitle>
                    <div className="text-3xl font-bold text-[hsl(var(--gts-yellow))] mb-2">{tipper.capacity}</div>
                    <CardDescription className="text-gray-600">{tipper.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 mb-6">
                      {tipper.features.map((feature, idx) => (
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
          </div>
        </section>

        {/* Use Cases Section */}
        <section className="section-padding bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-[hsl(var(--gts-dark))] mb-6">
                Ideal Use Cases
              </h2>
              <p className="text-lg text-gray-600">
                Our tipper hire service is perfect for a variety of construction and landscaping projects
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {useCases.map((useCase, index) => (
                <Card key={index} className="text-center bg-white shadow-[var(--shadow-card)] border-0">
                  <CardHeader>
                     <div className="mx-auto mb-4 p-4 bg-[hsl(var(--gts-yellow))] bg-opacity-10 rounded-full text-[hsl(var(--gts-dark))] w-16 h-16 flex items-center justify-center">
                       {useCase.icon}
                     </div>
                    <CardTitle className="text-xl text-[hsl(var(--gts-dark))]">{useCase.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-gray-600 leading-relaxed">
                      {useCase.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="hero-gradient text-white py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Hire a Tipper?
            </h2>
            <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
              Get professional tipper hire services with flexible terms. Daily, weekly, and monthly rates available.
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

export default TipperHire;