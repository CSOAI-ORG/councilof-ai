import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SEOHead from "@/components/SEOHead";
import Badge from "@/components/Badge";

const Terms: React.FC = () => {
  return (
    <>
      <SEOHead 
        title="Terms of Service | GTS Grab Hire | Service Terms & Conditions"
        description="Terms and conditions for GTS Grab Hire services. Professional grab hire terms covering Kent, London, Essex. Clear service agreements and conditions."
        canonical="https://gtsgrabhire.com/terms"
      />
      
      <div className="min-h-screen section-gradient py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <Badge variant="yellow" className="mb-6">
              Legal Information
            </Badge>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[hsl(var(--gts-dark))] mb-6">
              Terms of Service
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Last updated: January 2024
            </p>
          </div>

          <Card className="bg-white shadow-[var(--shadow-card)] border-0">
            <CardContent className="p-8 space-y-8">
              <section>
                <h2 className="text-2xl font-bold text-[hsl(var(--gts-dark))] mb-4">1. Service Agreement</h2>
                <p className="text-gray-700">
                  By using GTS Grab Hire services, you agree to these terms and conditions. Our services include grab hire, muck away, tipper hire, and aggregates supply across Kent, London, and Essex.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-[hsl(var(--gts-dark))] mb-4">2. Booking and Payment</h2>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>All bookings are subject to availability and confirmation</li>
                  <li>Payment is due on completion of service unless agreed otherwise</li>
                  <li>We accept cash, card, and bank transfer</li>
                  <li>Account terms available for commercial customers</li>
                  <li>Prices may vary based on location, access, and waste type</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-[hsl(var(--gts-dark))] mb-4">3. Access Requirements</h2>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Customer must ensure safe vehicle access to collection point</li>
                  <li>Access routes must support vehicle weight (up to 26 tonnes)</li>
                  <li>Customer responsible for any damage to private property</li>
                  <li>We reserve the right to refuse access if unsafe</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-[hsl(var(--gts-dark))] mb-4">4. Acceptable Waste</h2>
                <p className="text-gray-700 mb-4">We accept:</p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>General construction and demolition waste</li>
                  <li>Garden waste and soil</li>
                  <li>Commercial and household clearance</li>
                  <li>Inert materials and aggregates</li>
                </ul>
                <p className="text-gray-700 mt-4">
                  <strong>We do NOT accept:</strong> Hazardous materials, asbestos, chemicals, liquids, or any prohibited waste types.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-[hsl(var(--gts-dark))] mb-4">5. Liability and Insurance</h2>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>We carry comprehensive public liability insurance</li>
                  <li>Fully licensed waste carriers with Environment Agency</li>
                  <li>Customer responsible for ensuring waste ownership</li>
                  <li>Our liability limited to the value of services provided</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-[hsl(var(--gts-dark))] mb-4">6. Cancellation Policy</h2>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>24 hours notice required for cancellations</li>
                  <li>Late cancellations may incur charges</li>
                  <li>Weather-related cancellations at our discretion</li>
                  <li>Emergency services may have different terms</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-[hsl(var(--gts-dark))] mb-4">7. Contact Information</h2>
                <p className="text-gray-700">
                  For questions about these terms or our services:
                </p>
                <div className="mt-4 p-4 section-gradient rounded-lg">
                  <p className="text-gray-700">
                    <strong>GTS Grab Hire</strong><br />
                    Email: contact@gtsgrabhire.co.uk<br />
                    Phone: 07958 710 548<br />
                    Operating Areas: Kent, London, Essex
                  </p>
                </div>
              </section>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Terms;