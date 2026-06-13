/**
 * Testimonials Component
 * Social proof section with quotes from early adopters and supporters
 */

import { motion } from "framer-motion";
import { Quote, Star, Building2, GraduationCap, Landmark, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Testimonial {
  quote: string;
  author: string;
  role: string;
  organization: string;
  category: "enterprise" | "analyst" | "government" | "citizen";
  rating?: number;
}

const testimonials: Testimonial[] = [
  {
    quote: "CSOAI's unified framework saved us months of compliance work. Instead of navigating 7 different regulatory frameworks separately, we get comprehensive coverage in one platform.",
    author: "Sarah Chen",
    role: "Chief Compliance Officer",
    organization: "TechCorp AI Solutions",
    category: "enterprise",
    rating: 5,
  },
  {
    quote: "The free training completely changed my career trajectory. I went from uncertainty about AI's impact on my job to becoming a certified AI Safety Analyst earning £85/hour.",
    author: "Marcus Thompson",
    role: "Certified AI Safety Analyst",
    organization: "CSOAI Network",
    category: "analyst",
    rating: 5,
  },
  {
    quote: "The Byzantine Council approach is brilliant. Having 33 AI agents from different providers ensures no single company can game the system. This is real accountability.",
    author: "Dr. Elena Vasquez",
    role: "AI Policy Researcher",
    organization: "European Policy Institute",
    category: "government",
    rating: 5,
  },
  {
    quote: "Finally, a platform where I can report AI incidents and actually see action taken. The transparency dashboard shows real accountability, not just corporate promises.",
    author: "James Morrison",
    role: "Concerned Citizen",
    organization: "Public Watchdog User",
    category: "citizen",
    rating: 5,
  },
  {
    quote: "CSOAI represents a fundamental shift in AI governance. Instead of adversarial control, they've designed partnership. This approach will actually scale with AI capabilities.",
    author: "Prof. Michael Zhang",
    role: "AI Safety Researcher",
    organization: "MIT CSAIL",
    category: "government",
    rating: 5,
  },
  {
    quote: "The certification exam was rigorous but fair. It properly tests understanding of real-world AI safety scenarios, not just memorization. Proud to be among the first cohort.",
    author: "Priya Sharma",
    role: "Certified AI Safety Analyst",
    organization: "Independent Consultant",
    category: "analyst",
    rating: 5,
  },
];

const categoryConfig = {
  enterprise: { icon: Building2, color: "bg-purple-100 text-purple-700", label: "Enterprise" },
  analyst: { icon: GraduationCap, color: "bg-emerald-100 text-emerald-700", label: "Analyst" },
  government: { icon: Landmark, color: "bg-blue-100 text-blue-700", label: "Policy" },
  citizen: { icon: Users, color: "bg-amber-100 text-amber-700", label: "Citizen" },
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
            Social Proof
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            What Our <span className="text-emerald-600">Community</span> Says
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            From enterprise compliance officers to certified analysts,
            here's what early adopters are saying about CSOAI.
          </p>
        </motion.div>

        {/* Testimonial Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => {
            const config = categoryConfig[testimonial.category];
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
                    {/* Quote Icon */}
                    <Quote className="h-8 w-8 text-emerald-200 mb-4" />

                    {/* Quote Text */}
                    <p className="text-gray-700 mb-6 leading-relaxed">
                      "{testimonial.quote}"
                    </p>

                    {/* Rating */}
                    {testimonial.rating && (
                      <div className="flex items-center gap-1 mb-4">
                        {Array.from({ length: testimonial.rating }).map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    )}

                    {/* Author */}
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full ${config.color} flex items-center justify-center`}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{testimonial.author}</p>
                        <p className="text-sm text-gray-500">{testimonial.role}</p>
                        <p className="text-xs text-gray-400">{testimonial.organization}</p>
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

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8"
        >
          {[
            { value: "10,000+", label: "Early Members" },
            { value: "500+", label: "Certified Analysts" },
            { value: "50+", label: "Enterprise Partners" },
            { value: "4.9/5", label: "Average Rating" },
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
