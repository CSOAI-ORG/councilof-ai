/**
 * CSOAI vs Competitors Comparison Table
 * Shows why CSOAI is the only platform solving all problems
 */

import { motion } from "framer-motion";
import { CheckCircle, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";

const features = [
  { name: "Jobs for AI Analysts", csoai: true, competitors: false },
  { name: "Human Oversight", csoai: true, competitors: false },
  { name: "Compliance Framework", csoai: true, competitors: false },
  { name: "Transparency", csoai: true, competitors: false },
  { name: "Integrated Ecosystem", csoai: true, competitors: false },
  { name: "Multi-Framework Support (7+)", csoai: true, competitors: false },
  { name: "Free Training", csoai: true, competitors: false },
  { name: "Prosperity Fund / UBI", csoai: true, competitors: false },
];

export default function ComparisonTable() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      <Card className="overflow-hidden border-2 border-emerald-200">
        <div className="bg-gradient-to-r from-emerald-600 to-green-600 p-4">
          <div className="grid grid-cols-3 text-white font-semibold">
            <div>Solution</div>
            <div className="text-center">CSOAI</div>
            <div className="text-center">Competitors</div>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {features.map((feature, index) => (
            <motion.div
              key={feature.name}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="grid grid-cols-3 p-4 hover:bg-emerald-50/50 transition-colors"
            >
              <div className="text-gray-700 font-medium">{feature.name}</div>
              <div className="flex justify-center">
                {feature.csoai ? (
                  <CheckCircle className="h-6 w-6 text-emerald-500" />
                ) : (
                  <XCircle className="h-6 w-6 text-gray-300" />
                )}
              </div>
              <div className="flex justify-center">
                {feature.competitors ? (
                  <CheckCircle className="h-6 w-6 text-emerald-500" />
                ) : (
                  <XCircle className="h-6 w-6 text-gray-300" />
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
}
