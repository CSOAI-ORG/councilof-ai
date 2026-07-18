import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Phone, CheckCircle, Clock } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import Badge from "@/components/Badge";
import ServiceAreaMap from "@/components/ServiceAreaMap";

const Locations = () => {
  const serviceAreas = [
    {
      title: 'Kent',
      description: 'Comprehensive grab hire and waste management services throughout Kent',
      areas: [
        'Maidstone', 'Canterbury', 'Dartford', 'Gravesend', 'Tonbridge', 'Tunbridge Wells',
        'Ashford', 'Dover', 'Folkestone', 'Margate', 'Ramsgate', 'Chatham', 'Gillingham',
        'Sittingbourne', 'Faversham', 'Sevenoaks', 'Bromley', 'Orpington', 'Beckenham'
      ],
      postcodes: 'ME, CT, DA, TN, BR (South London)',
      responseTime: 'Same day service available'
    },
    {
      title: 'London',
      description: 'Professional grab hire services across Greater London and surrounding areas',
      areas: [
        'Central London', 'Croydon', 'Greenwich', 'Lewisham', 'Bromley', 'Bexley',
        'Southwark', 'Lambeth', 'Wandsworth', 'Merton', 'Kingston', 'Richmond',
        'Sutton', 'Camden', 'Islington', 'Hackney', 'Tower Hamlets', 'Newham'
      ],
      postcodes: 'All London postcodes (E, N, NW, SE, SW, W, WC)',
      responseTime: '24/7 emergency service'
    },
    {
      title: 'Essex',
      description: 'Reliable waste removal and grab hire throughout Essex and surrounding areas',
      areas: [
        'Chelmsford', 'Basildon', 'Southend-on-Sea', 'Colchester', 'Harlow', 'Brentwood',
        'Grays', 'Thurrock', 'Romford', 'Ilford', 'Dagenham', 'Barking', 'Epping',
        'Billericay', 'Wickford', 'Rayleigh', 'Benfleet', 'Canvey Island'
      ],
      postcodes: 'CM, SS, CO, RM, IG (East London)',
      responseTime: 'Next day service guaranteed'
    }
  ];

  const serviceFeatures = [
    {
      icon: <Clock className="w-6 h-6" />,
      title: 'Rapid Response',
      description: 'Same day or next day service available across all our service areas'
    },
    {
      icon: <CheckCircle className="w-6 h-6" />,
      title: 'Local Knowledge',
      description: 'Extensive local knowledge of access routes and site requirements'
    },
    {
      icon: <MapPin className="w-6 h-6" />,
      title: 'Wide Coverage',
      description: 'Comprehensive coverage across Kent, London, and Essex with no hidden travel charges'
    },
    {
      icon: <Phone className="w-6 h-6" />,
      title: '24/7 Availability',
      description: 'Emergency call-outs available for urgent waste removal requirements'
    }
  ];

  return (
    <>
      <SEOHead 
        title="Service Areas | Grab Hire Kent London Essex | Coverage Map | GTS"
        description="GTS Grab Hire service areas across Kent, London & Essex. Professional grab hire and waste management services. Check if we cover your area. Free quotes."
        keywords="service areas, grab hire kent, grab hire london, grab hire essex, coverage map, professional service"
      />
      
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="hero-gradient text-white py-20">
          <div className="container mx-auto px-4 text-center">
            <Badge variant="yellow" className="mb-6">
              Service Areas
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Serving Kent, London, and Essex with Reliable Grab Hire Services
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 max-w-4xl mx-auto leading-relaxed">
              Professional waste management and grab hire services across three major regions with local expertise and rapid response times
            </p>
          </div>
        </section>

        {/* Service Areas Section */}
        <section className="section-padding section-gradient">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-[hsl(var(--gts-dark))] mb-6">
                Our Service Areas
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                We provide comprehensive grab hire and waste management services across Kent, London, and Essex. 
                No matter where your project is located, we're here to help.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
              {serviceAreas.map((area, index) => (
                <Card key={index} className="bg-white shadow-[var(--shadow-card)] border-0 card-hover">
                  <CardHeader>
                    <div className="flex items-center mb-4">
                      <MapPin className="w-8 h-8 text-[hsl(var(--gts-dark))] mr-3" />
                      <CardTitle className="text-2xl text-[hsl(var(--gts-dark))]">{area.title}</CardTitle>
                    </div>
                    <CardDescription className="text-base leading-relaxed">
                      {area.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h4 className="font-semibold text-[hsl(var(--gts-dark))] mb-3">Areas Covered:</h4>
                      <div className="grid grid-cols-2 gap-1 text-sm text-gray-600">
                        {area.areas.map((location, idx) => (
                          <div key={idx} className="flex items-center">
                            <div className="w-1.5 h-1.5 bg-[hsl(var(--gts-yellow))] rounded-full mr-2"></div>
                            {location}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="border-t pt-4">
                      <div className="space-y-2 text-sm">
                        <p><span className="font-medium text-[hsl(var(--gts-dark))]">Postcodes:</span> {area.postcodes}</p>
                        <p><span className="font-medium text-[hsl(var(--gts-dark))]">Response Time:</span> {area.responseTime}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Service Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {serviceFeatures.map((feature, index) => (
                <Card key={index} className="bg-white shadow-[var(--shadow-card)] border-0 text-center">
                  <CardContent className="p-6">
                    <div className="mx-auto mb-4 p-3 bg-[hsl(var(--gts-yellow))] bg-opacity-10 rounded-full text-[hsl(var(--gts-yellow))] w-12 h-12 flex items-center justify-center">
                      {feature.icon}
                    </div>
                    <h3 className="font-semibold text-[hsl(var(--gts-dark))] mb-2">{feature.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Interactive Map Section */}
        <section className="section-padding bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-[hsl(var(--gts-dark))] mb-6">
                Service Coverage Map
              </h2>
              <p className="text-lg text-gray-600">
                Visual representation of our comprehensive service coverage across the three regions
              </p>
            </div>
            
            <ServiceAreaMap />

            {/* Coverage Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="text-center bg-[hsl(var(--gts-yellow))] bg-opacity-10 border-0">
                <CardContent className="p-8">
                  <h3 className="text-4xl font-bold text-[hsl(var(--gts-dark))] mb-2">50+</h3>
                  <p className="text-lg text-gray-700 font-medium">Towns & Cities Covered</p>
                </CardContent>
              </Card>
              <Card className="text-center bg-[hsl(var(--gts-yellow))] bg-opacity-10 border-0">
                <CardContent className="p-8">
                  <h3 className="text-4xl font-bold text-[hsl(var(--gts-dark))] mb-2">100+</h3>
                  <p className="text-lg text-gray-700 font-medium">Postcodes Served</p>
                </CardContent>
              </Card>
              <Card className="text-center bg-[hsl(var(--gts-navy))] bg-opacity-10 border-0">
                <CardContent className="p-8">
                  <h3 className="text-4xl font-bold text-[hsl(var(--gts-dark))] mb-2">24/7</h3>
                  <p className="text-lg text-gray-700 font-medium">Emergency Coverage</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="hero-gradient text-white py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Check if We Cover Your Area
            </h2>
            <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
              Not sure if we service your location? Contact us today and we'll confirm our availability in your area.
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

export default Locations;