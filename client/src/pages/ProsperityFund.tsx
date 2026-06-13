/**
 * CSOAI Prosperity Fund Dashboard
 *
 * Article 8: The Prosperity Covenant
 * Economic redistribution and UBI system tracking
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Users,
  Globe2,
  DollarSign,
  Building2,
  Heart,
  ArrowRight,
  CheckCircle2,
  Clock,
  Wallet,
  PieChart,
  BarChart3,
  Landmark
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ProsperityFundChart } from "@/components/charts";

// Prosperity Fund data
const contributionTiers = [
  { tier: "Startup", range: "<$10M", rate: "1%", example: "$5M → $50K" },
  { tier: "Growth", range: "$10M-$100M", rate: "3%", example: "$50M → $1.5M" },
  { tier: "Established", range: "$100M-$1B", rate: "6%", example: "$500M → $30M" },
  { tier: "Large", range: "$1B-$10B", rate: "12%", example: "$5B → $600M" },
  { tier: "Giant", range: ">$10B", rate: "20%", example: "$50B → $10B" },
];

const ubiThresholds = [
  { threshold: "20%", trigger: "20% AI unemployment", amount: "$500/month", status: "pending" },
  { threshold: "40%", trigger: "40% AI unemployment", amount: "$1,500/month", status: "pending" },
  { threshold: "70%", trigger: "70% AI unemployment", amount: "$3,000/month", status: "pending" },
];

const fundProjections = [
  { year: 2026, size: "£10M", status: "Accumulating" },
  { year: 2027, size: "£100M", status: "Accumulating" },
  { year: 2028, size: "£1B+", status: "Pilot UBI" },
  { year: 2030, size: "£100B+", status: "Regional UBI" },
  { year: 2035, size: "$500B+/year", status: "Post-scarcity" },
];

export default function ProsperityFund() {
  const [currentFundSize, setCurrentFundSize] = useState(0);
  const [animatedSize, setAnimatedSize] = useState(0);

  // Simulate real-time fund growth
  useEffect(() => {
    const targetSize = 847293; // £847,293 demo value
    setCurrentFundSize(targetSize);

    const duration = 2000;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedSize(Math.floor(targetSize * eased));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-emerald-900 via-teal-800 to-cyan-900 text-white py-24">
        <div className="container max-w-6xl">
          <div className="text-center">
            <Badge className="mb-6 bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-base px-4 py-1">
              Article 8: The Prosperity Covenant
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              AI Prosperity Fund
            </h1>
            <p className="text-2xl text-gray-300 leading-relaxed mb-4 max-w-4xl mx-auto">
              AI creates wealth. The Prosperity Fund ensures that wealth is shared with all of humanity—
              not just shareholders. This is the economic engine of the Maternal Covenant.
            </p>
            <p className="text-xl text-emerald-300 font-semibold mb-10">
              When AI takes jobs, it also funds Universal Basic Income.
            </p>
          </div>
        </div>
      </section>

      {/* Live Fund Dashboard */}
      <section className="py-16 bg-gray-50">
        <div className="container max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Live Fund Status</h2>
            <p className="text-gray-600">Real-time tracking of contributions and distributions</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                <CardContent className="p-6 text-center">
                  <Wallet className="h-10 w-10 mx-auto mb-3 opacity-80" />
                  <p className="text-sm opacity-80">Current Fund Size</p>
                  <p className="text-3xl font-bold mt-2">{formatCurrency(animatedSize)}</p>
                  <p className="text-xs mt-2 opacity-70">Updated in real-time</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card className="bg-white border-2 border-emerald-100">
                <CardContent className="p-6 text-center">
                  <Building2 className="h-10 w-10 mx-auto mb-3 text-emerald-600" />
                  <p className="text-sm text-gray-600">Contributing Organizations</p>
                  <p className="text-3xl font-bold mt-2 text-gray-900">47</p>
                  <p className="text-xs mt-2 text-emerald-600">+12 this month</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Card className="bg-white border-2 border-emerald-100">
                <CardContent className="p-6 text-center">
                  <Globe2 className="h-10 w-10 mx-auto mb-3 text-teal-600" />
                  <p className="text-sm text-gray-600">Countries Represented</p>
                  <p className="text-3xl font-bold mt-2 text-gray-900">23</p>
                  <p className="text-xs mt-2 text-teal-600">Global reach</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <Card className="bg-white border-2 border-emerald-100">
                <CardContent className="p-6 text-center">
                  <Users className="h-10 w-10 mx-auto mb-3 text-cyan-600" />
                  <p className="text-sm text-gray-600">Oversight Analysts</p>
                  <p className="text-3xl font-bold mt-2 text-gray-900">2,847</p>
                  <p className="text-xs mt-2 text-cyan-600">Earning $50-$5K/month</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* UBI Trigger Progress */}
          <Card className="mb-12">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
                Triggered UBI Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-6">
                UBI activates automatically when AI-caused unemployment reaches these thresholds:
              </p>
              <div className="space-y-6">
                {ubiThresholds.map((level, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge
                          variant="outline"
                          className={level.status === 'pending'
                            ? 'border-gray-300 text-gray-600'
                            : 'border-emerald-500 text-emerald-600 bg-emerald-50'
                          }
                        >
                          {level.threshold}
                        </Badge>
                        <span className="font-medium">{level.trigger}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-emerald-600 font-bold">{level.amount}</span>
                        {level.status === 'pending' ? (
                          <Clock className="h-4 w-4 text-gray-400" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        )}
                      </div>
                    </div>
                    <Progress
                      value={idx === 0 ? 8 : idx === 1 ? 3 : 1}
                      className="h-2"
                    />
                    <p className="text-xs text-gray-500">
                      Current AI displacement: ~{idx === 0 ? '8' : idx === 1 ? '3' : '1'}%
                      (Threshold: {level.threshold})
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Interactive Fund Analytics Charts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <ProsperityFundChart
              currentFundSize={animatedSize}
              title="Fund Growth & Contributions"
              description="Interactive projections and contribution breakdown"
              height={420}
            />
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="container max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">The Prosperity Circle</h2>
            <p className="text-xl text-gray-600">
              A regenerative economic system where AI wealth benefits everyone
            </p>
          </div>

          <div className="grid md:grid-cols-6 gap-4 items-center mb-16">
            {[
              { icon: Building2, label: "AI Creates Value", color: "bg-blue-100 text-blue-600" },
              { icon: DollarSign, label: "Companies Profit", color: "bg-green-100 text-green-600" },
              { icon: Landmark, label: "Mandatory Contributions", color: "bg-purple-100 text-purple-600" },
              { icon: PieChart, label: "CSOAI Administers", color: "bg-orange-100 text-orange-600" },
              { icon: Users, label: "Wealth Distributed", color: "bg-pink-100 text-pink-600" },
              { icon: Heart, label: "Humanity Prospers", color: "bg-red-100 text-red-600" },
            ].map((step, idx) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.1 }}
                  className="text-center"
                >
                  <div className={`w-16 h-16 rounded-full ${step.color} flex items-center justify-center mx-auto mb-3`}>
                    <Icon className="h-8 w-8" />
                  </div>
                  <p className="text-sm font-medium">{step.label}</p>
                  {idx < 5 && (
                    <ArrowRight className="h-4 w-4 mx-auto mt-2 text-gray-400 hidden md:block" />
                  )}
                </motion.div>
              );
            })}
          </div>

          <Card className="bg-emerald-50 border-emerald-200">
            <CardContent className="p-8 text-center">
              <p className="text-lg text-emerald-800 mb-4">
                <strong>CSOAI leads by example:</strong> We contribute 2% of our own net profit to the Prosperity Fund.
              </p>
              <p className="text-gray-600">
                If we profit from AI safety, humanity shares in that prosperity. No exceptions.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Contribution Tiers */}
      <section className="py-20 bg-gray-50">
        <div className="container max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Progressive Contribution Rates</h2>
            <p className="text-xl text-gray-600">
              Those who benefit most from AI contribute proportionally more
            </p>
          </div>

          <div className="grid md:grid-cols-5 gap-4">
            {contributionTiers.map((tier, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: idx * 0.1 }}
              >
                <Card className={`h-full ${idx === 4 ? 'border-2 border-emerald-500 bg-emerald-50' : ''}`}>
                  <CardContent className="p-6 text-center">
                    {idx === 4 && (
                      <Badge className="mb-2 bg-emerald-600 text-white">Highest Impact</Badge>
                    )}
                    <h3 className="font-bold text-lg mb-2">{tier.tier}</h3>
                    <p className="text-sm text-gray-600 mb-3">{tier.range}</p>
                    <p className="text-4xl font-bold text-emerald-600 mb-2">{tier.rate}</p>
                    <p className="text-xs text-gray-500">{tier.example}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Card className="inline-block bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
              <CardContent className="p-6">
                <p className="text-2xl font-bold mb-2">
                  Just 10 tech giants = $100B/year to Prosperity Fund
                </p>
                <p className="opacity-80">
                  Enough to fund pilot UBI for millions of displaced workers
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Fund Projections */}
      <section className="py-20 bg-white">
        <div className="container max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Prosperity Fund Roadmap</h2>
            <p className="text-xl text-gray-600">
              From accumulation to post-scarcity
            </p>
          </div>

          <div className="relative">
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-emerald-200" />

            <div className="space-y-12">
              {fundProjections.map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: idx % 2 === 0 ? -50 : 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.1 }}
                  className={`flex items-center gap-8 ${idx % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}
                >
                  <div className={`w-1/2 ${idx % 2 === 0 ? 'text-right' : 'text-left'}`}>
                    <Card className={item.year === 2026 ? 'border-2 border-emerald-500' : ''}>
                      <CardContent className="p-6">
                        <p className="text-sm text-gray-500 mb-1">{item.year}</p>
                        <p className="text-2xl font-bold text-emerald-600">{item.size}</p>
                        <Badge
                          variant="outline"
                          className={item.status === 'Accumulating'
                            ? 'mt-2 border-blue-300 text-blue-600'
                            : 'mt-2 border-emerald-300 text-emerald-600'
                          }
                        >
                          {item.status}
                        </Badge>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="relative z-10 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-sm">
                    {item.year.toString().slice(-2)}
                  </div>

                  <div className="w-1/2" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Who Contributes */}
      <section className="py-20 bg-gray-50">
        <div className="container max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Who Contributes?</h2>
            <p className="text-xl text-gray-600">
              If you profit from AI, you contribute. No exceptions.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "AI Development Companies",
                desc: "2% of net profit from AI operations",
                icon: Building2
              },
              {
                title: "Licensed AI Systems",
                desc: "€10,000/year + monitoring fees",
                icon: BarChart3
              },
              {
                title: "Data Centers",
                desc: "0.3-0.7% of AI-compute revenue",
                icon: Globe2
              },
              {
                title: "Robot Manufacturers",
                desc: "Per-robot fees + sales percentage",
                icon: Users
              },
              {
                title: "AI-Enabled Businesses",
                desc: "2% of AI-attributable profit",
                icon: PieChart
              },
              {
                title: "CSOAI Itself",
                desc: "2% of our net profit (we practice what we preach)",
                icon: Heart
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.1 }}
                >
                  <Card className="h-full hover:border-emerald-300 transition-colors">
                    <CardContent className="p-6">
                      <Icon className="h-10 w-10 text-emerald-600 mb-4" />
                      <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                      <p className="text-gray-600">{item.desc}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Universal AI Oversight Wage */}
      <section className="py-20 bg-gradient-to-br from-emerald-900 to-teal-900 text-white">
        <div className="container max-w-4xl text-center">
          <Users className="h-16 w-16 mx-auto mb-6 text-emerald-400" />
          <h2 className="text-4xl font-bold mb-6">Universal AI Oversight Wage</h2>
          <p className="text-xl text-gray-300 leading-relaxed mb-8">
            Anyone, anywhere can participate in AI governance. Free training in 50+ languages.
            Earn $50–$5,000/month based on your time commitment.
            <span className="text-emerald-300 font-semibold"> 10 million participants by 2030.</span>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/watchdog">
              <Button size="lg" className="bg-white text-emerald-600 hover:bg-gray-100 px-8">
                Become a Watchdog Analyst
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/training">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 px-8">
                Start Free Training
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Governance Separation */}
      <section className="py-20 bg-white">
        <div className="container max-w-6xl">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-purple-100 text-purple-600 border-purple-200">
              Critical Governance
            </Badge>
            <h2 className="text-4xl font-bold mb-4">Separation of Powers</h2>
            <p className="text-xl text-gray-600">
              CSOAI Board ≠ Prosperity Fund Board
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-2 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-600">
                  <Building2 className="h-5 w-5" />
                  CSOAI Board
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-blue-500 mt-0.5" />
                    <span>Oversees CSOAI Ltd operations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-blue-500 mt-0.5" />
                    <span>Licensing, training, Byzantine Council</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-blue-500 mt-0.5" />
                    <span>Business strategy and growth</span>
                  </li>
                  <li className="flex items-start gap-2 text-red-600">
                    <span className="font-bold">✗</span>
                    <span>Does NOT control fund distributions</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 border-emerald-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-emerald-600">
                  <Landmark className="h-5 w-5" />
                  Prosperity Fund Board
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5" />
                    <span>7 independent trustees</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5" />
                    <span>Decides UBI amounts and timing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5" />
                    <span>Investment strategy and fund management</span>
                  </li>
                  <li className="flex items-start gap-2 text-red-600">
                    <span className="font-bold">✗</span>
                    <span>Cannot be same people as CSOAI Board</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-emerald-50">
        <div className="container max-w-4xl text-center">
          <h2 className="text-4xl font-bold mb-6">Join the Prosperity Movement</h2>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Whether you're an AI company ready to contribute, an individual seeking to participate in oversight,
            or simply want to learn more—there's a place for you in building shared AI prosperity.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/pricing">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white px-8">
                View Licensing Tiers
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/charter">
              <Button size="lg" variant="outline" className="px-8">
                Read the Charter
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
