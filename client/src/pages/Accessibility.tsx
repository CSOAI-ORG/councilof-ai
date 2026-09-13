import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";

export default function Accessibility() {
  useEffect(() => {
    document.title = "Accessibility - CSOAI";
  }, []);

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  return (
    <div className="w-full bg-white">
      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-green-50 to-white">
        <div className="max-w-4xl mx-auto">
          <motion.div {...fadeInUp}>
            <h1 className="text-4xl md:text-4xl font-bold mb-6 text-gray-900">
              Accessibility Statement
            </h1>
            <p className="text-lg text-gray-600">
              Current accessibility posture, known limits and a direct route for
              feedback.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-12">
          <motion.div {...fadeInUp}>
            <h2 className="text-3xl font-bold mb-6 text-gray-900">
              Our Commitment
            </h2>
            <p className="text-gray-600 mb-4">
              CSOAI Ltd is working toward WCAG 2.2 Level AA across councilof.ai.
              This is a target, not a claim that every public route currently
              conforms.
            </p>
            <p className="text-gray-600">
              The site changes frequently. We test representative journeys and
              welcome reports that identify the page, device, assistive
              technology and problem encountered.
            </p>
          </motion.div>

          <motion.div {...fadeInUp}>
            <h2 className="text-3xl font-bold mb-6 text-gray-900">
              What should work
            </h2>
            <Card className="p-6">
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Zoom and text resizing in current browsers</li>
                <li>
                  Keyboard access to core navigation, forms and verification
                  journeys
                </li>
                <li>Visible focus on interactive controls</li>
                <li>
                  Semantic headings and labels on the main evidence surfaces
                </li>
              </ul>
              <p className="mt-4 text-sm text-gray-500">
                These are supported journeys, not a guarantee about every route
                or assistive-technology combination.
              </p>
            </Card>
          </motion.div>

          <motion.div {...fadeInUp}>
            <h2 className="text-3xl font-bold mb-6 text-gray-900">
              Known limits
            </h2>
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Large and changing surface
                </h3>
                <ul className="list-disc list-inside text-gray-600 space-y-2">
                  <li>
                    Some legacy and archived routes have not completed a WCAG
                    2.2 AA audit
                  </li>
                  <li>
                    Some diagrams and content images still need fuller text
                    alternatives
                  </li>
                  <li>
                    Dense evidence tables may require horizontal movement at
                    high zoom
                  </li>
                </ul>
              </Card>
              <Card className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Evidence downloads
                </h3>
                <ul className="list-disc list-inside text-gray-600 space-y-2">
                  <li>
                    JSON, signature and OpenTimestamps files are machine
                    evidence rather than formatted documents
                  </li>
                  <li>
                    The human pages link to those raw files so their exact bytes
                    remain inspectable
                  </li>
                </ul>
              </Card>
            </div>
          </motion.div>

          <motion.div {...fadeInUp}>
            <h2 className="text-3xl font-bold mb-6 text-gray-900">
              Accessibility Issues or Feedback
            </h2>
            <Card className="p-6 bg-green-50">
              <p className="text-gray-600 mb-4">
                If you encounter any accessibility issues while using our
                website or services, or if you have suggestions for improvement,
                please contact us:
              </p>
              <p className="text-gray-600">
                <strong>Email:</strong> accessibility@csoai.org
                <br />
                <strong>Address:</strong> CSOAI Ltd, 3rd Floor, 86–90 Paul
                Street, London EC2A 4NE
                <br />
                <strong>Website:</strong> councilof.ai
              </p>
            </Card>
          </motion.div>

          <motion.div {...fadeInUp}>
            <h2 className="text-3xl font-bold mb-6 text-gray-900">
              Standards & Compliance
            </h2>
            <Card className="p-6">
              <p className="text-gray-600 mb-4">
                Our current design target is WCAG 2.2 Level AA. Relevant legal
                and technical requirements vary by service and jurisdiction;
                this statement does not declare conformance with the standards
                below.
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>
                  Web Content Accessibility Guidelines (WCAG) 2.2 Level AA —
                  design target
                </li>
                <li>
                  European Accessibility Act and EN 301 549 — requirements
                  considered where applicable
                </li>
              </ul>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
