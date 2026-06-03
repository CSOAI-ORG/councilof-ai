import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, MessageCircle } from "lucide-react";

const ServiceAreaMap = () => {
  return (
    <Card className="w-full max-w-4xl mx-auto bg-white shadow-[var(--shadow-card)] border-0">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl text-[hsl(var(--gts-dark))]">Our Service Area</CardTitle>
        <p className="text-gray-600">30-mile radius from our Essex base (CM13 4JT)</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Map Placeholder */}
        <div className="relative bg-gradient-to-br from-[hsl(var(--gts-navy))]/10 to-[hsl(var(--gts-yellow))]/10 rounded-lg p-8 h-80 flex items-center justify-center border-2 border-dashed border-[hsl(var(--gts-yellow))]/30">
          <div className="text-center">
            <MapPin className="w-16 h-16 text-[hsl(var(--gts-yellow))] mx-auto mb-4" />
            <h3 className="text-xl font-bold text-[hsl(var(--gts-dark))] mb-2">Service Coverage Area</h3>
            <div className="space-y-2 text-gray-700">
              <p className="font-semibold">30-Mile Radius Coverage:</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="bg-white/80 p-3 rounded-lg">
                  <h4 className="font-bold text-[hsl(var(--gts-navy))]">Kent</h4>
                  <p className="text-sm">Medway, Dartford, Gravesend, Maidstone, Sevenoaks</p>
                </div>
                <div className="bg-white/80 p-3 rounded-lg">
                  <h4 className="font-bold text-[hsl(var(--gts-navy))]">London</h4>
                  <p className="text-sm">East London, South London, Central areas</p>
                </div>
                <div className="bg-white/80 p-3 rounded-lg">
                  <h4 className="font-bold text-[hsl(var(--gts-navy))]">Essex</h4>
                  <p className="text-sm">Basildon, Thurrock, Brentwood, Chelmsford</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Service Information */}
        <div className="bg-[hsl(var(--gts-yellow))]/10 p-6 rounded-lg">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-bold text-[hsl(var(--gts-dark))] mb-3">Service Capabilities</h4>
              <ul className="space-y-2 text-gray-700">
                <li>• <strong>Grab Hire:</strong> 1-16 tons capacity</li>
                <li>• <strong>Tipper Hire:</strong> Up to 20 tons</li>
                <li>• <strong>Aggregates:</strong> 16-ton minimum order</li>
                <li>• <strong>Muck Away:</strong> All volumes</li>
                <li>• <strong>Same Day Service:</strong> Available</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-[hsl(var(--gts-dark))] mb-3">Quick Contact</h4>
              <div className="space-y-3">
                <Button asChild className="w-full" variant="cta">
                  <a href="tel:07958710548" className="flex items-center justify-center gap-2">
                    <Phone className="w-4 h-4" />
                    Call: 07958 710 548
                  </a>
                </Button>
                <Button asChild className="w-full" variant="outline">
                  <a href="https://wa.me/447956222691" className="flex items-center justify-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp Us
                  </a>
                </Button>
                <p className="text-center text-sm text-gray-600">
                  📧 <a href="mailto:contact@gtsgrabhire.co.uk" className="text-[hsl(var(--gts-yellow))] hover:underline">contact@gtsgrabhire.co.uk</a>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center text-sm text-gray-600">
          <p><strong>Base Location:</strong> Essex CM13 4JT • <strong>Coverage:</strong> 30-mile radius</p>
          <p>Same-day service available • Emergency collections • Professional licensed service</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ServiceAreaMap;