import { motion } from "framer-motion";
import { Briefcase, Users, Heart, Globe, BookOpen, Shield, Clock, MapPin, Send, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const openPositions = [
  {
    title: "AI Safety Researcher",
    department: "Research",
    location: "Remote / London",
    type: "Full-time",
    description: "Help develop and refine AI safety frameworks, contribute to the Byzantine Council architecture, and advance the field of AI governance."
  },
  {
    title: "Full Stack Developer",
    department: "Engineering",
    location: "Remote",
    type: "Full-time",
    description: "Build and maintain the CSOAI platform using React, TypeScript, and Node.js. Work on compliance tools, training systems, and monitoring infrastructure."
  },
  {
    title: "Training Content Developer",
    department: "Education",
    location: "Remote",
    type: "Full-time / Contract",
    description: "Create comprehensive AI safety training materials covering global frameworks like EU AI Act, NIST RMF, ISO 42001, and more."
  },
  {
    title: "Compliance Analyst",
    department: "Operations",
    location: "Remote / London",
    type: "Full-time",
    description: "Help organizations achieve AI safety compliance. Conduct assessments, develop compliance strategies, and maintain certification standards."
  },
  {
    title: "Community Manager",
    department: "Community",
    location: "Remote",
    type: "Full-time",
    description: "Build and nurture the CSOAI analyst community. Organize events, facilitate discussions, and support our growing network of AI safety professionals."
  }
];

const benefits = [
  { icon: Globe, title: "Remote-First", description: "Work from anywhere in the world" },
  { icon: Clock, title: "Flexible Hours", description: "Work when you're most productive" },
  { icon: BookOpen, title: "Learning Budget", description: "Annual budget for courses & conferences" },
  { icon: Heart, title: "Health & Wellness", description: "Comprehensive health coverage" },
  { icon: Users, title: "Equity Options", description: "Share in our mission's success" },
  { icon: Shield, title: "Mission-Driven", description: "Work that matters for humanity" }
];

const values = [
  {
    title: "Independence",
    description: "We maintain complete independence from AI vendors, ensuring unbiased oversight and trust."
  },
  {
    title: "Transparency",
    description: "Our processes, decisions, and code are open for public scrutiny and accountability."
  },
  {
    title: "Partnership",
    description: "We believe in collaboration over control, working with AI systems rather than against them."
  },
  {
    title: "Accessibility",
    description: "AI safety knowledge should be free and accessible to everyone, everywhere."
  }
];

export default function Careers() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-primary/5 via-background to-emerald-500/10">
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-4xl mx-auto text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="outline" className="mb-4">
              <Briefcase className="h-3 w-3 mr-1" />
              Join Our Team
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Build the Future of AI Safety
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Join CSOAI and help create a world where AI and humanity thrive together.
              We're building the infrastructure for responsible AI governance.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a href="#positions">
                <Button size="lg">
                  View Open Positions
                </Button>
              </a>
              <Link href="/about">
                <Button variant="outline" size="lg">
                  Learn About Us
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-4xl mx-auto text-center"
            {...fadeInUp}
          >
            <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
            <p className="text-lg text-muted-foreground mb-8">
              CSOAI is the world's first relationship-based AI safety infrastructure organization.
              We're not a think tank or policy shop—we're building real operational systems for
              AI governance, training, and economic redistribution through the Prosperity Fund.
            </p>
            <div className="p-6 rounded-xl bg-primary/5 border border-primary/20">
              <p className="text-xl font-medium text-primary">
                "Prosperity, safety, and abundance for all through responsible AI governance."
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <motion.div {...fadeInUp} className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Values</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              These principles guide everything we do at CSOAI.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {values.map((value, index) => (
              <motion.div
                key={index}
                {...fadeInUp}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full text-center hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-2">{value.title}</h3>
                    <p className="text-sm text-muted-foreground">{value.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <motion.div {...fadeInUp} className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Benefits & Perks</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We take care of our team so they can focus on taking care of humanity.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <motion.div
                  key={index}
                  {...fadeInUp}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6 flex items-start gap-4">
                      <div className="p-3 rounded-lg bg-primary/10">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">{benefit.title}</h3>
                        <p className="text-sm text-muted-foreground">{benefit.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Open Positions Section */}
      <section id="positions" className="py-16 scroll-mt-20">
        <div className="container mx-auto px-4">
          <motion.div {...fadeInUp} className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Open Positions</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Join our growing team and make a real impact on the future of AI.
            </p>
          </motion.div>
          <div className="max-w-4xl mx-auto space-y-6">
            {openPositions.map((position, index) => (
              <motion.div
                key={index}
                {...fadeInUp}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold">{position.title}</h3>
                          <Badge variant="secondary">{position.department}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{position.description}</p>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {position.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {position.type}
                          </span>
                        </div>
                      </div>
                      <Button>
                        Apply Now
                        <Send className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Don't See Your Role Section */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <motion.div {...fadeInUp} className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4">Don't See Your Role?</h2>
            <p className="text-muted-foreground mb-6">
              We're always looking for talented individuals passionate about AI safety.
              Send us your resume and tell us how you'd like to contribute.
            </p>
            <a href="mailto:careers@csoai.org">
              <Button size="lg" variant="outline">
                Send Us Your Resume
                <Send className="ml-2 h-4 w-4" />
              </Button>
            </a>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <motion.div {...fadeInUp}>
            <Card className="max-w-4xl mx-auto bg-gradient-to-br from-primary/5 to-emerald-500/10 border-primary/20">
              <CardContent className="p-8 text-center">
                <h2 className="text-2xl font-bold mb-4">Ready to Make an Impact?</h2>
                <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                  Join us in building the infrastructure for responsible AI governance.
                  Together, we can ensure AI serves humanity's best interests.
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <a href="#positions">
                    <Button size="lg">
                      View Open Positions
                    </Button>
                  </a>
                  <Link href="/training">
                    <Button variant="outline" size="lg">
                      Start Free Training
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
