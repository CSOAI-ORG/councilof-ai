/**
 * CSOAI Founding Members Page
 *
 * First 100 members before March 31, 2026
 * Enhanced voting rights, board nomination, lifetime privileges
 */

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Crown,
  Star,
  Users,
  Vote,
  Award,
  CheckCircle2,
  Clock,
  ArrowRight,
  Building2,
  Globe2,
  Shield,
  Sparkles
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";

const foundingMemberBenefits = [
  {
    icon: Vote,
    title: "Enhanced Voting Rights",
    description: "2 votes vs 1 for standard members on all Charter amendments and governance decisions"
  },
  {
    icon: Crown,
    title: "Board Nomination Rights",
    description: "Exclusive right to nominate candidates for the CSOAI Board of Directors"
  },
  {
    icon: Star,
    title: "Lifetime Privileges",
    description: "Founding Member status never expires, regardless of future membership changes"
  },
  {
    icon: Award,
    title: "Recognition",
    description: "Listed on the Founding Members wall and in all official CSOAI documentation"
  },
  {
    icon: Shield,
    title: "Priority Access",
    description: "First access to new services, features, and Byzantine Council monitoring"
  },
  {
    icon: Users,
    title: "Exclusive Network",
    description: "Private Founding Members forum and annual summit with CSOAI leadership"
  },
];

const membershipTiers = [
  {
    tier: "Individual",
    price: "£500",
    period: "one-time",
    description: "For AI safety professionals and advocates",
    features: ["2x voting rights", "Board nomination rights", "Lifetime recognition", "Exclusive network access"]
  },
  {
    tier: "Organization",
    price: "£5,000",
    period: "one-time",
    description: "For companies committed to AI safety",
    features: ["5 individual memberships", "Corporate recognition", "Early pilot program access", "Direct board liaison"]
  },
  {
    tier: "Founding Patron",
    price: "£50,000",
    period: "one-time",
    description: "For major supporters of the mission",
    features: ["25 individual memberships", "Permanent plaque", "Named program sponsorship", "Strategic advisory role"]
  },
];

// Mock founding members (would come from API in production)
const currentFoundingMembers = [
  { name: "Nicholas Templeman", role: "Founder", org: "CSOAI", location: "UK" },
  // Add more as they join
];

export default function FoundingMembers() {
  const memberCount = currentFoundingMembers.length;
  const maxMembers = 100;
  const spotsRemaining = maxMembers - memberCount;
  const deadline = new Date("2026-03-31T23:59:59Z");
  const now = new Date();
  const daysRemaining = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-amber-900 via-yellow-800 to-orange-900 text-white py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-32 h-32 border-4 border-yellow-400 rounded-full" />
          <div className="absolute bottom-10 right-10 w-48 h-48 border-4 border-amber-400 rounded-full" />
          <div className="absolute top-1/2 left-1/2 w-24 h-24 border-4 border-orange-400 rounded-full transform -translate-x-1/2 -translate-y-1/2" />
        </div>

        <div className="container max-w-6xl relative z-10">
          <div className="text-center">
            <Badge className="mb-6 bg-yellow-500/20 text-yellow-300 border-yellow-500/30 text-base px-4 py-1">
              <Crown className="inline h-4 w-4 mr-2" />
              Founding Members Program
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Be Among the First 100
            </h1>
            <p className="text-2xl text-amber-100 leading-relaxed mb-4 max-w-4xl mx-auto">
              Founding Members shape the future of AI safety. Enhanced voting rights,
              board nomination privileges, and lifetime recognition await.
            </p>
            <p className="text-xl text-yellow-300 font-semibold mb-10">
              Only {spotsRemaining} spots remaining • Deadline: March 31, 2026
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8"
              >
                <Crown className="mr-2 h-5 w-5" />
                Become a Founding Member
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10 px-8"
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Progress Tracker */}
      <section className="py-12 bg-amber-50">
        <div className="container max-w-4xl">
          <Card className="border-2 border-amber-200">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Users className="h-6 w-6 text-amber-600" />
                  <span className="font-bold text-lg">Founding Members Progress</span>
                </div>
                <Badge className="bg-amber-100 text-amber-700 border-amber-300">
                  {memberCount} / {maxMembers}
                </Badge>
              </div>

              <Progress value={(memberCount / maxMembers) * 100} className="h-4 mb-4" />

              <div className="flex justify-between text-sm">
                <div className="flex items-center gap-2 text-amber-600">
                  <Clock className="h-4 w-4" />
                  <span>{daysRemaining} days remaining</span>
                </div>
                <div className="text-gray-600">
                  <span className="font-bold text-amber-600">{spotsRemaining}</span> spots left
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-white">
        <div className="container max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Founding Member Benefits</h2>
            <p className="text-xl text-gray-600">
              Exclusive privileges that never expire
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {foundingMemberBenefits.map((benefit, idx) => {
              const Icon = benefit.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.1 }}
                >
                  <Card className="h-full hover:border-amber-300 transition-colors">
                    <CardContent className="p-6">
                      <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center mb-4">
                        <Icon className="h-6 w-6 text-amber-600" />
                      </div>
                      <h3 className="font-bold text-lg mb-2">{benefit.title}</h3>
                      <p className="text-gray-600">{benefit.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Membership Tiers */}
      <section className="py-20 bg-gray-50">
        <div className="container max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Membership Tiers</h2>
            <p className="text-xl text-gray-600">
              Choose the level that matches your commitment
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {membershipTiers.map((tier, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: idx * 0.1 }}
              >
                <Card className={`h-full ${idx === 1 ? 'border-2 border-amber-500 relative' : ''}`}>
                  {idx === 1 && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-amber-500 text-white">
                      Most Popular
                    </Badge>
                  )}
                  <CardContent className="p-8">
                    <h3 className="font-bold text-xl mb-2">{tier.tier}</h3>
                    <p className="text-sm text-gray-600 mb-4">{tier.description}</p>
                    <div className="mb-6">
                      <span className="text-4xl font-bold">{tier.price}</span>
                      <span className="text-gray-500 ml-2">{tier.period}</span>
                    </div>
                    <ul className="space-y-3 mb-6">
                      {tier.features.map((feature, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-2">
                          <CheckCircle2 className="h-5 w-5 text-amber-500 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className={`w-full ${idx === 1 ? 'bg-amber-500 hover:bg-amber-600' : ''}`}
                      variant={idx === 1 ? 'default' : 'outline'}
                    >
                      Select {tier.tier}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Join */}
      <section className="py-20 bg-white">
        <div className="container max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Why Become a Founding Member?</h2>
          </div>

          <div className="space-y-6">
            <Card className="border-l-4 border-l-amber-500">
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  Shape the Future of AI Safety
                </h3>
                <p className="text-gray-600">
                  Founding Members have direct influence on Charter amendments, governance decisions,
                  and the strategic direction of CSOAI. Your voice carries twice the weight.
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-amber-500">
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                  <Globe2 className="h-5 w-5 text-amber-500" />
                  Join a Global Movement
                </h3>
                <p className="text-gray-600">
                  Connect with the 100 most committed AI safety advocates worldwide.
                  Network with researchers, policymakers, entrepreneurs, and thought leaders
                  who share your commitment to beneficial AI.
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-amber-500">
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-amber-500" />
                  Leave a Legacy
                </h3>
                <p className="text-gray-600">
                  Your name will be permanently recorded as a Founding Member of the organization
                  that changed how humanity relates to AI. This is history in the making.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 bg-amber-50">
        <div className="container max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Founding Members Timeline</h2>
          </div>

          <div className="space-y-6">
            {[
              { date: "January 15, 2026", event: "Charter Launch", status: "upcoming" },
              { date: "January - March 2026", event: "Founding Member Enrollment", status: "active" },
              { date: "March 31, 2026", event: "Founding Member Deadline", status: "upcoming" },
              { date: "April 2026", event: "First Founding Members Summit", status: "upcoming" },
              { date: "Q2 2026", event: "First Board Elections (Founding Members nominate)", status: "upcoming" },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <div className={`w-4 h-4 rounded-full ${
                  item.status === 'active' ? 'bg-amber-500' : 'bg-gray-300'
                }`} />
                <div className="flex-1">
                  <span className="font-medium">{item.event}</span>
                  <span className="text-gray-500 ml-2">• {item.date}</span>
                </div>
                {item.status === 'active' && (
                  <Badge className="bg-amber-100 text-amber-700">Active</Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-amber-600 to-orange-600 text-white">
        <div className="container max-w-4xl text-center">
          <Crown className="h-16 w-16 mx-auto mb-6 text-yellow-300" />
          <h2 className="text-4xl font-bold mb-6">Don't Miss Your Chance</h2>
          <p className="text-xl text-amber-100 mb-10 leading-relaxed">
            Only {spotsRemaining} Founding Member spots remain. Once filled, this opportunity
            closes forever. The deadline is March 31, 2026—but spots may fill sooner.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white text-amber-600 hover:bg-amber-50 font-bold px-8"
            >
              <Crown className="mr-2 h-5 w-5" />
              Become a Founding Member
            </Button>
            <Link href="/charter">
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10 px-8"
              >
                Read the Charter First
              </Button>
            </Link>
          </div>
          <p className="text-sm text-amber-200 mt-8">
            Questions? Contact founding@csoai.org
          </p>
        </div>
      </section>
    </div>
  );
}
