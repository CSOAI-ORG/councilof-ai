import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SEOHead from "@/components/SEOHead";
import Badge from "@/components/Badge";

const Privacy: React.FC = () => {
  return (
    <>
      <SEOHead 
        title="Privacy Policy | GTS Grab Hire | Data Protection & Privacy"
        description="Our comprehensive privacy policy explaining how GTS Grab Hire collects, uses, and protects your personal data. Transparent data practices for Kent, London, Essex."
        canonical="https://gtsgrabhire.com/privacy"
      />
      
      <div className="min-h-screen section-gradient py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <Badge variant="yellow" className="mb-6">
              Legal Information
            </Badge>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[hsl(var(--gts-dark))] mb-6">
              Privacy Policy
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Last updated: January 2024
            </p>
          </div>

          <Card className="bg-white shadow-[var(--shadow-card)] border-0">
            <CardContent className="p-8 space-y-8">
              <section>
                <h2 className="text-2xl font-bold text-[hsl(var(--gts-dark))] mb-4">1. Information We Collect</h2>
                <p className="text-gray-700 mb-4">
                  We collect information you provide directly to us, such as when you:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Request a quote or contact us for services</li>
                  <li>Fill out our contact forms</li>
                  <li>Call or email us directly</li>
                  <li>Subscribe to our newsletter</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-[hsl(var(--gts-dark))] mb-4">2. How We Use Your Information</h2>
                <p className="text-gray-700 mb-4">
                  We use the information we collect to:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Provide quotes and respond to your inquiries</li>
                  <li>Schedule and deliver our grab hire services</li>
                  <li>Send you important service updates</li>
                  <li>Improve our website and services</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-[hsl(var(--gts-dark))] mb-4">3. Information Sharing</h2>
                <p className="text-gray-700">
                  We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy or as required by law.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-[hsl(var(--gts-dark))] mb-4">4. Data Security</h2>
                <p className="text-gray-700">
                  We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-[hsl(var(--gts-dark))] mb-4">5. Your Rights</h2>
                <p className="text-gray-700 mb-4">
                  Under GDPR, you have the right to:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Access your personal data</li>
                  <li>Correct inaccurate data</li>
                  <li>Request deletion of your data</li>
                  <li>Object to processing</li>
                  <li>Data portability</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-[hsl(var(--gts-dark))] mb-4">6. Contact Us</h2>
                <p className="text-gray-700">
                  If you have any questions about this Privacy Policy, please contact us at:
                </p>
                <div className="mt-4 p-4 section-gradient rounded-lg">
                  <p className="text-gray-700">
                    <strong>GTS Grab Hire</strong><br />
                    Email: contact@gtsgrabhire.co.uk<br />
                    Phone: 07958 710 548
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

export default Privacy;