/**
 * "Built for everyone in AI governance" — persona value section.
 * Honest, non-fabricated framing: what CSOAI does for each role, with true
 * capability stats. No invented names, institutions, earnings, or review scores.
 */

import { motion } from "framer-motion";
import { Quote, Building2, GraduationCap, Landmark, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Persona {
  headline: string;
  body: string;
  role: string;
  category: "enterprise" | "analyst" | "government" | "citizen";
}

const personas: Persona[] = [
  {
    headline: "One platform, every framework",
    body: "Instead of navigating seven regulatory frameworks separately, map each AI system once and get comprehensive, crosswalked coverage — sealed to Layer 0 for audit.",
    role: "For compliance & risk teams",
    category: "enterprise",
  },
  {
    headline: "Learn it, then govern it",
    body: "Free open-source training plus the AI Safety Analyst course — build the skills, then run real assessments inside the OS. The Academy issues course-completion records; it certifies nothing and is not a conformity mark.",
    role: "For practitioners",
    category: "analyst",
  },
  {
    headline: "Accountability by design",
    body: "Scores come from a published harness on a frozen split, so no single vendor grades its own homework — and anyone can recompute the number and challenge it.",
    role: "For policy & research",
    category: "government",
  },
  {
    headline: "Report, and see action",
    body: "The public Watchdog lets anyone flag an AI incident and watch the transparency dashboard — real follow-through, not corporate promises.",
    role: "For the public",
    category: "citizen",
  },
  {
    headline: "Partnership, not adversarial control",
    body: "CSOAI is designed as partnership between people and AI — an approach built to scale with AI capability instead of fighting it.",
    role: "For governance leaders",
    category: "government",
  },
  {
    headline: "Provable when auditors ask",
    body: "Every decision is Ed25519-signed to Layer 0 and verifiable offline. Comply once, and it crosswalks everywhere.",
    role: "For teams under deadline",
    category: "enterprise",
  },
];

const categoryConfig = {
  enterprise: { icon: Building2, color: "bg-purple-100 text-purple-700", label: "Enterprise" },
  analyst: { icon: GraduationCap, color: "bg-emerald-100 text-emerald-700", label: "Practitioner" },
  government: { icon: Landmark, color: "bg-blue-100 text-blue-700", label: "Policy" },
  citizen: { icon: Users, color: "bg-amber-100 text-amber-700", label: "Public" },
};

export default function Testimonials() {
  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <Badge className="mb-4 bg-emerald-100 text-emerald-700 border-emerald-200">
            Built for everyone
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            One OS, every role in <span className="text-emerald-600">AI governance</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            From compliance officers to the public — here's what CSOAI does for each of you.
          </p>
        </motion.div>

        {/* Persona Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {personas.map((p, index) => {
            const config = categoryConfig[p.category];
            const IconComponent = config.icon;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full border-2 hover:border-emerald-300 transition-all hover:shadow-lg">
                  <CardContent className="p-6">
                    {/* Icon */}
                    <Quote className="h-8 w-8 text-emerald-200 mb-4" />

                    {/* Headline + body */}
                    <p className="text-lg font-bold text-gray-900 mb-2">{p.headline}</p>
                    <p className="text-gray-700 mb-6 leading-relaxed">{p.body}</p>

                    {/* Role */}
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full ${config.color} flex items-center justify-center`}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{p.role}</p>
                      </div>
                      <Badge className={config.color}>
                        {config.label}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Capability Stats Row — all true, no fabricated numbers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8"
        >
          {[
            { value: "Open", label: "Frameworks crosswalked" },
            { value: "Live", label: "Board at /api/gspc" },
            { value: "Layer 0", label: "Signed & verifiable" },
            { value: "Free", label: "Open-source core" },
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-emerald-600 mb-1">
                {stat.value}
              </div>
              <div className="text-gray-500 text-sm">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
