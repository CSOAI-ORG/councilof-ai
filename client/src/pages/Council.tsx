/**
 * Byzantine Council Page
 * Dedicated page explaining the 33-agent fault-tolerant oversight system
 */

import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  Shield,
  Users,
  Network,
  Eye,
  CheckCircle,
  AlertTriangle,
  Zap,
  Lock,
  Brain,
  ArrowRight,
  Globe,
  Clock,
  Award,
  FileCheck,
  Server,
  Activity,
  BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CouncilVisualization from "@/components/CouncilVisualization";

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

// AI Agent providers
const agentProviders = [
  { name: "GPT-4o", provider: "OpenAI", count: 6, color: "bg-green-500" },
  { name: "Claude 3.5", provider: "Anthropic", count: 6, color: "bg-orange-500" },
  { name: "Gemini Pro", provider: "Google", count: 5, color: "bg-blue-500" },
  { name: "Llama 3", provider: "Meta", count: 5, color: "bg-purple-500" },
  { name: "Mistral Large", provider: "Mistral", count: 4, color: "bg-cyan-500" },
  { name: "Command R+", provider: "Cohere", count: 4, color: "bg-pink-500" },
  { name: "Qwen 2", provider: "Alibaba", count: 3, color: "bg-red-500" },
];

// Council roles
const councilRoles = [
  {
    title: "Compliance Validators",
    count: 11,
    description: "Check AI systems against regulatory frameworks (EU AI Act, NIST, etc.)",
    icon: FileCheck,
  },
  {
    title: "Risk Assessors",
    count: 8,
    description: "Evaluate potential harms and assign risk levels to AI deployments",
    icon: AlertTriangle,
  },
  {
    title: "Incident Analyzers",
    count: 7,
    description: "Investigate reported AI safety incidents and determine root causes",
    icon: Activity,
  },
  {
    title: "Watchdog Monitors",
    count: 7,
    description: "Continuous real-time monitoring of registered AI systems",
    icon: Eye,
  },
];

export default function Council() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative py-24 bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, rgba(16, 185, 129, 0.3) 1px, transparent 0)`,
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="text-center max-w-4xl mx-auto"
          >
            <Badge className="mb-4 bg-emerald-500/20 text-emerald-400 border-emerald-400/30">
              <Shield className="h-3.5 w-3.5 mr-1" />
              Byzantine Fault Tolerant
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              The <span className="text-emerald-400">Byzantine Council</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              33 AI agents from 7 different providers working together with Byzantine fault tolerance.
              No single company can manipulate safety decisions. Ever.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/training">
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Users className="mr-2 h-5 w-5" />
                  Become an Analyst
                </Button>
              </Link>
              <Link href="/transparency">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                  <Eye className="mr-2 h-5 w-5" />
                  View Live Dashboard
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* What is Byzantine Fault Tolerance */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-blue-100 text-blue-700 border-blue-200">
              Core Technology
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What is <span className="text-emerald-600">Byzantine Fault Tolerance?</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Named after the Byzantine Generals' Problem in distributed computing,
              our system ensures reliable consensus even when some agents fail or are compromised.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <Card className="border-2 border-emerald-200 bg-emerald-50/50">
                <CardContent className="p-8">
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Lock className="h-6 w-6 text-emerald-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 mb-2">23/33 Consensus Required</h4>
                        <p className="text-gray-600">
                          Every safety decision requires 70% agreement (23 of 33 agents).
                          This threshold ensures Byzantine fault tolerance.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Network className="h-6 w-6 text-emerald-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 mb-2">Multi-Provider Diversity</h4>
                        <p className="text-gray-600">
                          Agents span 7+ AI providers. No single company has more than 6 agents,
                          preventing any vendor from controlling outcomes.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Zap className="h-6 w-6 text-emerald-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 mb-2">Fail-Safe Operation</h4>
                        <p className="text-gray-600">
                          Even if up to 10 agents fail or are compromised, the remaining
                          23 can still reach valid consensus and continue operations.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="bg-slate-900 rounded-2xl p-4"
            >
              <div className="aspect-square">
                <CouncilVisualization autoAnimate={true} showLabels={true} useLiveData={false} />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Agent Distribution */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-emerald-500/20 text-emerald-400 border-emerald-400/30">
              Multi-Provider Architecture
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              33 Agents, <span className="text-emerald-400">7 Providers</span>
            </h2>
            <p className="text-lg text-gray-400 max-w-3xl mx-auto">
              Our agent distribution ensures no single AI company can dominate decisions.
              Each provider contributes unique perspectives and capabilities.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12"
          >
            {agentProviders.map((agent, index) => (
              <motion.div key={agent.name} variants={fadeInUp}>
                <Card className="bg-white/5 border-white/10 hover:border-emerald-500/30 transition-all">
                  <CardContent className="p-6">
                    <div className={`w-10 h-10 ${agent.color} rounded-lg flex items-center justify-center mb-4`}>
                      <Brain className="h-5 w-5 text-white" />
                    </div>
                    <h4 className="font-bold text-white mb-1">{agent.name}</h4>
                    <p className="text-gray-400 text-sm mb-3">{agent.provider}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-emerald-400">{agent.count}</span>
                      <span className="text-gray-500 text-sm">agents</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
            <motion.div variants={fadeInUp}>
              <Card className="bg-emerald-500/20 border-emerald-500/30 h-full">
                <CardContent className="p-6 flex flex-col justify-center h-full">
                  <div className="text-center">
                    <span className="text-4xl font-bold text-emerald-400">33</span>
                    <p className="text-emerald-300 mt-2">Total Agents</p>
                    <p className="text-gray-400 text-sm mt-1">23 needed for consensus</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Distribution Bar */}
          <div className="bg-white/5 rounded-xl p-6">
            <h4 className="text-white font-semibold mb-4">Agent Distribution</h4>
            <div className="flex rounded-full overflow-hidden h-8">
              {agentProviders.map((agent) => (
                <div
                  key={agent.name}
                  className={`${agent.color} flex items-center justify-center text-white text-xs font-medium`}
                  style={{ width: `${(agent.count / 33) * 100}%` }}
                >
                  {agent.count}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>0</span>
              <span className="text-emerald-400">23 = Consensus Threshold</span>
              <span>33</span>
            </div>
          </div>
        </div>
      </section>

      {/* Council Roles */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-purple-100 text-purple-700 border-purple-200">
              Specialized Functions
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Council <span className="text-emerald-600">Responsibilities</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Each agent is assigned to specialized roles based on their capabilities.
              Together, they provide comprehensive AI safety oversight.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 gap-6"
          >
            {councilRoles.map((role, index) => (
              <motion.div key={role.title} variants={fadeInUp}>
                <Card className="h-full border-2 hover:border-emerald-300 transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <role.icon className="h-7 w-7 text-emerald-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold text-gray-900">{role.title}</h4>
                          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                            {role.count} agents
                          </Badge>
                        </div>
                        <p className="text-gray-600">{role.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Human Oversight */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <Badge className="mb-4 bg-amber-100 text-amber-700 border-amber-200">
                Human-in-the-Loop
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Human <span className="text-emerald-600">Oversight</span>
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                While the Byzantine Council handles continuous monitoring, certified
                AI Safety Analysts provide essential human judgment for critical decisions.
              </p>

              <div className="space-y-4">
                {[
                  "Review and approve high-stakes Council decisions",
                  "Investigate escalated incidents requiring human judgment",
                  "Override Council decisions in edge cases",
                  "Provide contextual understanding AI may miss",
                  "Ensure ethical considerations are properly weighed",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <Link href="/training">
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    Become a Certified Analyst
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <Card className="border-2 border-amber-200 bg-amber-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-amber-600" />
                    Human + AI Collaboration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-white rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">Routine Monitoring</span>
                      <Badge className="bg-blue-100 text-blue-700">AI Council</Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      24/7 automated monitoring of registered AI systems
                    </p>
                  </div>

                  <div className="p-4 bg-white rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">Risk Assessment</span>
                      <Badge className="bg-purple-100 text-purple-700">Both</Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      AI proposes risk levels, humans validate high-risk cases
                    </p>
                  </div>

                  <div className="p-4 bg-white rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">Critical Decisions</span>
                      <Badge className="bg-amber-100 text-amber-700">Human</Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      License revocations, major violations require human approval
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Real-time Stats */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-emerald-500/20 text-emerald-400 border-emerald-400/30">
              <Activity className="h-3.5 w-3.5 mr-1" />
              Live Performance
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Council <span className="text-emerald-400">Performance</span>
            </h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-4 gap-6"
          >
            {[
              { value: "99.9%", label: "Uptime", icon: Server },
              { value: "<2s", label: "Avg Response", icon: Clock },
              { value: "100%", label: "Consensus Rate", icon: CheckCircle },
              { value: "0", label: "Security Breaches", icon: Shield },
            ].map((stat, index) => (
              <motion.div key={stat.label} variants={fadeInUp}>
                <Card className="bg-white/5 border-white/10 text-center">
                  <CardContent className="p-6">
                    <stat.icon className="h-8 w-8 text-emerald-400 mx-auto mb-4" />
                    <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                    <div className="text-gray-400">{stat.label}</div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-emerald-600 to-green-600">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Join the Byzantine Council
            </h2>
            <p className="text-xl text-emerald-100 mb-8">
              Become a certified AI Safety Analyst and work alongside the Council
              to ensure AI systems are safe for humanity.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/training">
                <Button size="lg" className="bg-white text-emerald-700 hover:bg-gray-100">
                  Start Free Training
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/transparency">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  View Dashboard
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
