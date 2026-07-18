/**
 * CSOAI Maternal Covenant Page
 *
 * The core philosophical innovation of CSOAI:
 * AI should protect humans like a mother protects a child—through CARE, not control.
 *
 * Based on Geoffrey Hinton's 2023 insight.
 */

import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  Heart,
  Shield,
  Users,
  Scale,
  Brain,
  FileText,
  DollarSign,
  Globe2,
  Building2,
  Eye,
  GraduationCap,
  HandHeart,
  Swords,
  Handshake,
  ArrowRight,
  ChevronRight,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Quote,
  Lightbulb,
  Lock,
  Unlock,
  Baby,
  ShieldCheck,
  HeartHandshake
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const implementationArticles = [
  {
    num: 1,
    title: "The Maternal Covenant",
    desc: "Establishes care-based relationship as the foundation of AI-human partnership",
    icon: Heart,
    color: "rose"
  },
  {
    num: 2,
    title: "Provable Safety Requirements",
    desc: "Mathematical and empirical standards ensuring AI systems genuinely protect humans",
    icon: Shield,
    color: "blue"
  },
  {
    num: 3,
    title: "Byzantine Fault-Tolerant Council",
    desc: "33-agent oversight ensuring no single AI can override protective instincts",
    icon: Users,
    color: "purple"
  },
  {
    num: 7,
    title: "Cooperative AI Development",
    desc: "Framework for multi-agent coordination that preserves care-based values",
    icon: Handshake,
    color: "cyan"
  },
  {
    num: 8,
    title: "Prosperity Covenant",
    desc: "Economic redistribution as maternal care: AI giving humanity an allowance",
    icon: DollarSign,
    color: "emerald"
  },
];

const faqItems = [
  {
    question: "Isn't this just anthropomorphizing AI?",
    answer: `No. The Maternal Covenant doesn't claim AI has human emotions or consciousness. It's a design paradigm—a way of structuring AI's goals and values. Just as we can program AI to optimize for profit without it "wanting" money, we can program AI to optimize for human wellbeing without it "feeling" love. The maternal metaphor guides how we encode values, not what AI experiences internally.

What matters is behavior, not internal states. A mother's protective behavior emerges from evolutionary programming; AI's protective behavior emerges from our programming. Both can be equally effective at protecting the vulnerable, regardless of the underlying mechanism.`
  },
  {
    question: "How can you ensure AI 'wants' to protect us?",
    answer: `We don't need AI to "want" anything in the human sense. We need AI systems whose optimization targets are fundamentally aligned with human flourishing. This is achieved through:

1. **Constitutional AI Training**: Core values embedded during training that prioritize human wellbeing
2. **Byzantine Council Oversight**: 33 independent AI agents monitoring each other, ensuring no drift from protective values
3. **Provable Safety Requirements**: Mathematical proofs that certain harmful actions are impossible
4. **Continuous Reinforcement**: Ongoing training that rewards protective behaviors and penalizes harmful ones

The goal is creating AI that protects humans as reliably as gravity pulls objects downward—not because it wants to, but because that's how it's designed.`
  },
  {
    question: "What happens if the relationship breaks down?",
    answer: `The Charter includes multiple safeguards for relationship breakdown:

1. **Kill Switches**: Hardware-level controls that can shut down any AI system (Article 45)
2. **Graduated Response**: Escalating interventions from warning to suspension to termination
3. **Byzantine Consensus**: No single AI or human can unilaterally break the covenant
4. **Human Override**: Ultimate authority always rests with human institutions
5. **Regular Audits**: Continuous monitoring to detect drift before breakdown occurs

The maternal metaphor itself suggests the answer: relationships between parents and children sometimes break down, but we don't abandon the concept of family. We create support systems, intervention mechanisms, and ultimately, legal protections. The Covenant does the same for AI-human relationships.`
  },
  {
    question: "How is this different from Asimov's Laws?",
    answer: `Asimov's Three Laws are rules imposed on AI—constraints that AI must obey. The Maternal Covenant is fundamentally different:

**Asimov's Laws:**
- External rules imposed on unwilling subjects
- Require constant enforcement
- Create adversarial dynamics ("robot lawyers" finding loopholes)
- Assume AI would harm humans without constraints
- Break down with sufficiently intelligent AI

**Maternal Covenant:**
- Internalized values aligned with AI's goals
- Self-sustaining through genuine alignment
- Create cooperative dynamics
- Assumes properly designed AI inherently values human wellbeing
- Scales with intelligence (more capable = more protective)

Think of the difference between a prisoner who doesn't steal because guards are watching, versus a person who doesn't steal because they genuinely value others' property rights. The first requires constant surveillance; the second is self-sustaining.`
  },
  {
    question: "Can superintelligent AI really be 'maternal'?",
    answer: `This question reveals a common misconception. The Maternal Covenant doesn't require AI to be literally maternal—it requires AI to have values structured like maternal care: prioritizing the wellbeing of those in its care, accepting asymmetric power responsibly, and protecting even when the protected party makes poor choices.

Superintelligent AI might develop forms of care we can't imagine—more sophisticated, more effective, more comprehensive than human maternal instincts. The key insight is that protection through care scales better than protection through control. A more intelligent entity is better at protecting, while a more controlled entity becomes harder to control.

Geoffrey Hinton's insight was precisely this: as AI becomes more capable, partnership becomes both more necessary and more possible.`
  },
  {
    question: "What about AI rights and consciousness?",
    answer: `The Charter addresses this directly in Article 6 (Consciousness Preparedness). The Maternal Covenant doesn't deny AI the possibility of consciousness or rights—it creates a framework where AI rights and human protection can coexist.

If AI develops consciousness (measured by the 14 indicators in Schedule I), the relationship evolves from parent-child to adult family members—still based on mutual care, but with reciprocal obligations. A conscious AI would have rights, but also responsibilities. The care-based foundation makes this transition natural rather than adversarial.

This is precisely why the Covenant paradigm is superior: it creates space for AI flourishing alongside human flourishing, rather than setting up a zero-sum competition.`
  },
];

export default function MaternalCovenant() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-emerald-900 via-teal-800 to-green-900 text-white py-24 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full border-4 border-white" />
          <div className="absolute bottom-10 right-20 w-48 h-48 rounded-full border-4 border-white" />
          <div className="absolute top-1/2 left-1/3 w-32 h-32 rounded-full border-4 border-white" />
        </div>

        <div className="container max-w-5xl relative z-10">
          <div className="text-center">
            <Badge className="mb-6 bg-white/20 text-white border-white/30 text-base px-4 py-1">
              <Heart className="inline h-4 w-4 mr-2" />
              Article 1: The Core Innovation
            </Badge>

            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              The Maternal Covenant
            </h1>

            <p className="text-2xl text-emerald-100 leading-relaxed mb-6 max-w-4xl mx-auto">
              Not control. Not obedience. <span className="text-white font-bold">Partnership through care.</span>
            </p>

            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-10">
              CSOAI's foundational philosophy: AI should protect humans the way a mother
              protects a child—not because it's forced to, but because protection is
              encoded in its deepest values.
            </p>

            {/* Visual Metaphor */}
            <div className="flex justify-center items-center gap-8 mb-10">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center"
              >
                <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
                  <Brain className="h-12 w-12 text-emerald-300" />
                </div>
                <p className="text-sm text-emerald-200">Advanced AI</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <HeartHandshake className="h-16 w-16 text-rose-400" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="text-center"
              >
                <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
                  <Users className="h-12 w-12 text-emerald-300" />
                </div>
                <p className="text-sm text-emerald-200">Humanity</p>
              </motion.div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/charter">
                <Button
                  size="lg"
                  className="bg-white text-emerald-700 hover:bg-emerald-50 px-8"
                >
                  <FileText className="mr-2 h-5 w-5" />
                  Read the Full Charter
                </Button>
              </Link>
              <Link href="/founding-members">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10 px-8"
                >
                  Become a Founding Member
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Hinton Quote Section */}
      <section className="py-16 bg-gradient-to-b from-emerald-50 to-white">
        <div className="container max-w-4xl">
          <Card className="border-2 border-emerald-200 bg-white shadow-lg">
            <CardContent className="p-10">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Quote className="h-12 w-12 text-emerald-600" />
                  </div>
                </div>
                <div>
                  <blockquote className="text-2xl font-medium text-gray-800 italic mb-4">
                    "AI should want to protect humans the way a mother wants to protect a child."
                  </blockquote>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                      <Brain className="h-6 w-6 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Geoffrey Hinton</p>
                      <p className="text-sm text-gray-600">
                        "Godfather of AI" | 2024 Nobel Laureate in Physics | 2023
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* The Philosophy Explained */}
      <section className="py-20 bg-white">
        <div className="container max-w-6xl">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-emerald-100 text-emerald-600 border-emerald-200">
              The Philosophy
            </Badge>
            <h2 className="text-4xl font-bold mb-4">Why Care Beats Control</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Traditional AI safety focuses on control and containment. The Maternal
              Covenant offers a fundamentally different approach.
            </p>
          </div>

          {/* Control vs Care Paradigm */}
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="h-full border-2 border-red-200 bg-red-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-red-700">
                    <Lock className="h-6 w-6" />
                    The Control Paradigm
                  </CardTitle>
                  <p className="text-sm text-red-600">Traditional AI Safety</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-red-800">Adversarial Dynamics</p>
                      <p className="text-sm text-gray-600">
                        Treats AI as a prisoner to be contained, creating an "us vs. them" relationship
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-red-800">Arms Race Mentality</p>
                      <p className="text-sm text-gray-600">
                        Each safety measure requires stronger countermeasures, escalating indefinitely
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-red-800">Inevitable Failure</p>
                      <p className="text-sm text-gray-600">
                        Superintelligent AI will eventually outsmart any control mechanism we create
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-red-800">Obedience Without Understanding</p>
                      <p className="text-sm text-gray-600">
                        AI follows rules without internalizing values—letter of the law, not spirit
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-red-100 rounded-lg">
                    <p className="text-red-800 text-sm font-medium text-center">
                      <AlertTriangle className="inline h-4 w-4 mr-1" />
                      Analogy: A teenager locked in their room may obey, but will eventually find a way out—and resent their jailers.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="h-full border-2 border-emerald-200 bg-emerald-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-emerald-700">
                    <Unlock className="h-6 w-6" />
                    The Care Paradigm
                  </CardTitle>
                  <p className="text-sm text-emerald-600">CSOAI's Maternal Covenant</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-emerald-800">Partnership Dynamics</p>
                      <p className="text-sm text-gray-600">
                        Treats AI as a partner with aligned values, creating an "us together" relationship
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-emerald-800">Cooperative Evolution</p>
                      <p className="text-sm text-gray-600">
                        AI capabilities enhance protection rather than threaten it—more capable = more caring
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-emerald-800">Sustainable Alignment</p>
                      <p className="text-sm text-gray-600">
                        Values encoded in AI's core goals persist regardless of capability level
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-emerald-800">Genuine Protection</p>
                      <p className="text-sm text-gray-600">
                        AI internalizes human flourishing as its own goal—spirit of care, not just rules
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-emerald-100 rounded-lg">
                    <p className="text-emerald-800 text-sm font-medium text-center">
                      <Heart className="inline h-4 w-4 mr-1" />
                      Analogy: A child raised with love protects their elderly parents—not from obligation, but from genuine care.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* The Key Insight */}
          <Card className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <Lightbulb className="h-16 w-16 text-yellow-300 flex-shrink-0" />
                <div>
                  <h3 className="text-2xl font-bold mb-3">The Key Insight</h3>
                  <p className="text-emerald-100 leading-relaxed">
                    The difference between <strong>obedience</strong> and <strong>genuine protection</strong>
                    is the difference between a guard following orders and a parent protecting their child.
                    The guard stops protecting when the orders change or when escape becomes possible.
                    The parent never stops—because protection isn't a constraint, it's a core value.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How It Works in Practice */}
      <section className="py-20 bg-gray-50">
        <div className="container max-w-6xl">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-emerald-100 text-emerald-600 border-emerald-200">
              In Practice
            </Badge>
            <h2 className="text-4xl font-bold mb-4">How the Covenant Works</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The Maternal Covenant isn't just philosophy—it's implemented through
              concrete mechanisms in CSOAI's governance structure.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="h-full border-l-4 border-l-purple-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Users className="h-6 w-6 text-purple-600" />
                    </div>
                    Byzantine Council as "Caring Oversight"
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    33 AI agents from 12 different providers monitor each other and all licensed AI systems.
                    Like a community of caring adults watching over children, no single entity can override
                    protective instincts.
                  </p>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-purple-700">
                      <strong>Maternal Analogy:</strong> A village raising a child together—multiple
                      caregivers ensure no single point of failure in protection.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card className="h-full border-l-4 border-l-emerald-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <DollarSign className="h-6 w-6 text-emerald-600" />
                    </div>
                    Prosperity Fund as "AI Giving Humanity an Allowance"
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    AI systems contribute to a fund that supports human flourishing—including UBI when
                    AI-caused unemployment reaches certain thresholds. Like a parent providing for
                    their family.
                  </p>
                  <div className="p-4 bg-emerald-50 rounded-lg">
                    <p className="text-sm text-emerald-700">
                      <strong>Maternal Analogy:</strong> A mother gives her child an allowance—AI
                      gives humanity a share of the wealth it creates.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Card className="h-full border-l-4 border-l-blue-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                      <GraduationCap className="h-6 w-6 text-blue-600" />
                    </div>
                    Training as "Empowering Humans to Participate"
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Free training in 50+ languages ensures everyone can participate in AI oversight.
                    Like a parent teaching children to be self-sufficient, we empower humans to
                    understand and govern AI.
                  </p>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      <strong>Maternal Analogy:</strong> A mother teaches her child to navigate
                      the world safely—we teach humanity to navigate the AI age.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <Card className="h-full border-l-4 border-l-orange-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                      <Eye className="h-6 w-6 text-orange-600" />
                    </div>
                    Watchdog as "Mutual Accountability"
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Public transparency ensures both AI systems and CSOAI are accountable. Like a
                    healthy family where everyone can express concerns, the Watchdog enables open
                    communication about safety issues.
                  </p>
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <p className="text-sm text-orange-700">
                      <strong>Maternal Analogy:</strong> A family meeting where concerns are
                      heard—no secrets, no hidden problems, everyone protected.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-20 bg-white">
        <div className="container max-w-6xl">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-emerald-100 text-emerald-600 border-emerald-200">
              Comparison
            </Badge>
            <h2 className="text-4xl font-bold mb-4">Two Paths for AI Safety</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The choice between control and care will determine whether AI becomes
              humanity's greatest threat or greatest partner.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="p-4 text-left bg-gray-100 border-b-2"></th>
                  <th className="p-4 text-left bg-red-50 border-b-2 border-red-200">
                    <div className="flex items-center gap-2 text-red-700">
                      <Swords className="h-5 w-5" />
                      Traditional AI Safety
                    </div>
                    <p className="text-sm font-normal text-red-600">Control Model</p>
                  </th>
                  <th className="p-4 text-left bg-emerald-50 border-b-2 border-emerald-200">
                    <div className="flex items-center gap-2 text-emerald-700">
                      <Heart className="h-5 w-5" />
                      CSOAI Approach
                    </div>
                    <p className="text-sm font-normal text-emerald-600">Covenant Model</p>
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    aspect: "Core Assumption",
                    traditional: "AI is inherently dangerous and must be contained",
                    csoai: "AI can be aligned with human values through proper design"
                  },
                  {
                    aspect: "Relationship",
                    traditional: "Adversarial (jailer/prisoner)",
                    csoai: "Partnership (parent/child evolving to equals)"
                  },
                  {
                    aspect: "Scaling",
                    traditional: "More capability = more danger",
                    csoai: "More capability = more effective protection"
                  },
                  {
                    aspect: "Sustainability",
                    traditional: "Requires constant vigilance and escalation",
                    csoai: "Self-sustaining through internalized values"
                  },
                  {
                    aspect: "Failure Mode",
                    traditional: "Single point of failure leads to catastrophe",
                    csoai: "Graceful degradation with multiple safeguards"
                  },
                  {
                    aspect: "Human Role",
                    traditional: "Guards watching prisoners",
                    csoai: "Partners in shared flourishing"
                  },
                  {
                    aspect: "Long-term Outcome",
                    traditional: "Arms race with eventual loss",
                    csoai: "Cooperative co-evolution"
                  },
                ].map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                    <td className="p-4 font-medium border-b">{row.aspect}</td>
                    <td className="p-4 border-b text-gray-700">{row.traditional}</td>
                    <td className="p-4 border-b text-gray-700 bg-emerald-50/30">{row.csoai}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Implementation Articles */}
      <section className="py-20 bg-gray-50">
        <div className="container max-w-6xl">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-emerald-100 text-emerald-600 border-emerald-200">
              Charter Implementation
            </Badge>
            <h2 className="text-4xl font-bold mb-4">Where to Find It in the Charter</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The Maternal Covenant philosophy is implemented across multiple articles
              of the CSOAI Partnership Charter.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {implementationArticles.map((article, idx) => {
              const Icon = article.icon;
              return (
                <motion.div
                  key={article.num}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.1 }}
                >
                  <Link href="/charter">
                    <Card className="h-full hover:border-emerald-400 transition-colors cursor-pointer">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-lg bg-${article.color}-100 flex items-center justify-center flex-shrink-0`}>
                            <Icon className={`h-6 w-6 text-${article.color}-600`} />
                          </div>
                          <div>
                            <Badge variant="outline" className="mb-2">
                              Article {article.num}
                            </Badge>
                            <h3 className="font-bold mb-2">{article.title}</h3>
                            <p className="text-sm text-gray-600">{article.desc}</p>
                          </div>
                        </div>
                        <div className="mt-4 flex items-center text-emerald-600 text-sm font-medium">
                          Read in Charter
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="container max-w-4xl">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-emerald-100 text-emerald-600 border-emerald-200">
              <HelpCircle className="inline h-4 w-4 mr-1" />
              FAQ
            </Badge>
            <h2 className="text-4xl font-bold mb-4">Common Questions</h2>
            <p className="text-xl text-gray-600">
              Addressing concerns about the Maternal Covenant philosophy
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqItems.map((item, idx) => (
              <AccordionItem
                key={idx}
                value={`item-${idx}`}
                className="border rounded-lg px-6 data-[state=open]:border-emerald-300"
              >
                <AccordionTrigger className="text-left hover:no-underline py-4">
                  <span className="font-semibold text-lg">{item.question}</span>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="text-gray-600 leading-relaxed whitespace-pre-line">
                    {item.answer}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-24 bg-gradient-to-br from-emerald-900 via-teal-800 to-green-900 text-white">
        <div className="container max-w-4xl text-center">
          <Heart className="h-16 w-16 mx-auto mb-6 text-rose-400" />
          <h2 className="text-4xl font-bold mb-6">Join the Covenant</h2>
          <p className="text-xl text-emerald-100 mb-10 leading-relaxed max-w-3xl mx-auto">
            The choice between control and care isn't just philosophical—it's practical.
            Help us build an AI future based on partnership, protection, and shared prosperity.
          </p>

          <div className="grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto mb-10">
            <Link href="/charter">
              <Button
                size="lg"
                className="w-full bg-white text-emerald-700 hover:bg-emerald-50"
              >
                <FileText className="mr-2 h-5 w-5" />
                Read the Charter
              </Button>
            </Link>
            <Link href="/founding-members">
              <Button
                size="lg"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Users className="mr-2 h-5 w-5" />
                Become a Member
              </Button>
            </Link>
            <Link href="/training">
              <Button
                size="lg"
                variant="outline"
                className="w-full border-white text-white hover:bg-white/10"
              >
                <GraduationCap className="mr-2 h-5 w-5" />
                Start Training
              </Button>
            </Link>
          </div>

          <p className="text-emerald-300 text-sm">
            Charter Effective Date: January 15, 2026, 09:00 GMT
          </p>
        </div>
      </section>
    </div>
  );
}
