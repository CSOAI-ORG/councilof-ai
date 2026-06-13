/**
 * 33-Agent Council Feature Page
 * Explains the transparent AI safety council with human oversight
 */

import { motion } from "framer-motion";
import { Shield, Users, Eye, CheckCircle, ArrowRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

export default function AgentCouncilFeature() {
  const councilBenefits = [
    {
      icon: Shield,
      title: "Unbiased AI Safety",
      description: "33 specialized AI agents work collaboratively to identify risks without human bias or conflicts of interest."
    },
    {
      icon: Users,
      title: "Human Oversight",
      description: "Every decision is reviewed by certified human Watchdog Analysts before implementation, ensuring accountability."
    },
    {
      icon: Eye,
      title: "Complete Transparency",
      description: "All council deliberations and decisions are publicly viewable in real-time through the Watchdog interface."
    },
    {
      icon: CheckCircle,
      title: "Continuous Monitoring",
      description: "24/7 automated monitoring of AI systems with instant alerts for potential safety issues or compliance violations."
    }
  ];

  const councilRoles = [
    { name: "Risk Assessment Agent", focus: "Identifies potential AI safety risks" },
    { name: "Compliance Agent", focus: "Ensures regulatory adherence" },
    { name: "Ethics Agent", focus: "Evaluates ethical implications" },
    { name: "Technical Agent", focus: "Analyzes system architecture" },
    { name: "Bias Detection Agent", focus: "Identifies unfair outcomes" },
    { name: "Security Agent", focus: "Monitors cybersecurity threats" },
    { name: "...and 27 more", focus: "Specialized safety domains" }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-green-500/10" />
        <div className="container max-w-6xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6"
          >
            <Badge variant="outline" className="text-lg px-4 py-2">
              <Shield className="h-4 w-4 mr-2" />
              Transparent AI Governance
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold">
              The 33-Agent
              <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent"> Safety Council</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              A revolutionary approach to AI safety combining 33 specialized AI agents with human oversight.
              Every decision is transparent, accountable, and designed to protect humanity.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/watchdog">
                <Button size="lg">
                  View Live Watchdog
                  <ExternalLink className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/courses">
                <Button size="lg" variant="outline">
                  Learn More
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="container max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">How the Council Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A multi-layered approach to AI safety that combines artificial intelligence efficiency
              with human wisdom and accountability.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <Card className="h-full">
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">1</span>
                  </div>
                  <CardTitle>AI Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    33 specialized AI agents continuously monitor and analyze AI systems across
                    multiple safety dimensions simultaneously.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <Card className="h-full">
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4">
                    <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">2</span>
                  </div>
                  <CardTitle>Collaborative Deliberation</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Agents debate findings, challenge assumptions, and reach consensus on risk
                    assessments and recommended actions.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <Card className="h-full">
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">3</span>
                  </div>
                  <CardTitle>Human Oversight</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Certified Watchdog Analysts review all council decisions and have final authority
                    to approve, modify, or reject recommendations.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 px-6">
        <div className="container max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Why the 33-Agent Council?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Combining the best of AI efficiency with human accountability and transparency.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {councilBenefits.map((benefit, idx) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-green-100 dark:from-blue-900/30 dark:to-green-900/30 flex items-center justify-center flex-shrink-0">
                        <benefit.icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <CardTitle className="mb-2">{benefit.title}</CardTitle>
                        <p className="text-muted-foreground">{benefit.description}</p>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Council Roles */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="container max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Meet the Council</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Each of the 33 agents specializes in a specific domain of AI safety, ensuring
              comprehensive coverage of all potential risks.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {councilRoles.map((role, idx) => (
              <motion.div
                key={role.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="hover:border-blue-500 transition-colors">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{role.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{role.focus}</p>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="container max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h2 className="text-4xl font-bold">
              See the Council in Action
            </h2>
            <p className="text-xl text-muted-foreground">
              Watch the 33-Agent Council analyze real AI systems in real-time.
              Complete transparency, complete accountability.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/watchdog">
                <Button size="lg">
                  View Live Watchdog
                  <ExternalLink className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/watchdog-signup">
                <Button size="lg" variant="outline">
                  Become a Watchdog Analyst
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
