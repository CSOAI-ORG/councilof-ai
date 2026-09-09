import { motion } from "framer-motion";
import { Briefcase, Users, Globe, BookOpen, Shield, Clock, MapPin, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const collaborationAreas = [
  {
    title: "Measurement & Safety Research",
    department: "Research",
    location: "Remote",
    type: "Research collaboration",
    description: "Propose a bounded experiment, dataset, or reproducibility study that can strengthen an existing GSPC instrument."
  },
  {
    title: "Open-source Engineering",
    department: "Engineering",
    location: "Remote",
    type: "Contributor collaboration",
    description: "Improve verifiers, adapters, measurement harnesses, accessibility, or end-to-end tests through a clearly scoped contribution."
  },
  {
    title: "Standards & Reproducibility",
    department: "Standards",
    location: "Remote",
    type: "Technical collaboration",
    description: "Bring test vectors, implementation evidence, or a standards mapping that other people can independently recompute."
  }
];

const collaborationPrinciples = [
  { icon: Globe, title: "Remote by default", description: "Collaborate from wherever the work can be reproduced" },
  { icon: Clock, title: "Bounded scope", description: "Agree the question, evidence and finish line before work begins" },
  { icon: BookOpen, title: "Open methods", description: "Prefer publishable methods, test vectors and transparent limitations" },
  { icon: Users, title: "Named contribution", description: "Credit work clearly and preserve authorship and provenance" },
  { icon: Shield, title: "Evidence first", description: "A signature proves the record; it does not turn a result into certification" }
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
              Work with Council of AI
            </Badge>
            <h1 className="text-4xl md:text-4xl font-bold mb-6">
              Collaborate on Independent AI Measurement
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Bring a research question, test vector, dataset, or open-source contribution.
              We will define the scope, evidence and terms before any work begins.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a href="#positions">
                <Button size="lg">
                  View Collaboration Areas
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
              CSOAI builds measurement instruments, signed evidence records, reproducible
              verification and learning workflows. We measure scoped runs; we do not sell a
              certification or substitute for a regulator, assessor, employer, or legal adviser.
            </p>
            <div className="p-6 rounded-xl bg-primary/5 border border-primary/20">
              <p className="text-xl font-medium text-primary">
                "If a result matters, another person should be able to recompute it."
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

      {/* Collaboration terms — no invented employment benefits */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <motion.div {...fadeInUp} className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How Collaboration Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We are not currently advertising paid full-time vacancies. This page is an invitation
              to discuss collaboration, not a promise of employment, salary, benefits, or equity.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {collaborationPrinciples.map((principle, index) => {
              const Icon = principle.icon;
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
                        <h3 className="font-semibold mb-1">{principle.title}</h3>
                        <p className="text-sm text-muted-foreground">{principle.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Collaboration areas */}
      <section id="positions" className="py-16 scroll-mt-20">
        <div className="container mx-auto px-4">
          <motion.div {...fadeInUp} className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Collaboration Areas</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              These are active problem areas, not advertised jobs. Send a concrete proposal and
              we will reply honestly about fit, scope, funding and timing.
            </p>
          </motion.div>
          <div className="max-w-4xl mx-auto space-y-6">
            {collaborationAreas.map((position, index) => (
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
                      <a href="mailto:nicholas@csoai.org?subject=CSOAI%20collaboration%20proposal">
                        Start a conversation
                        <Send className="ml-2 h-4 w-4" />
                      </a>
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
            <h2 className="text-2xl font-bold mb-4">Have a Concrete Experiment?</h2>
            <p className="text-muted-foreground mb-6">
              Tell us the question, the evidence you can bring, what another person should be able
              to reproduce, and the time or funding constraints. Please do not send sensitive data.
            </p>
            <a href="mailto:research@csoai.org?subject=Reproducible%20research%20proposal">
              <Button size="lg" variant="outline">
                Propose a collaboration
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
                <h2 className="text-2xl font-bold mb-4">Prefer to Start by Reproducing?</h2>
                <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                  Inspect the public method, verify a signed card, or run a learning module before
                  proposing work. A useful challenge to the evidence is a contribution too.
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <a href="#positions">
                    <Button size="lg">
                      View Collaboration Areas
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
