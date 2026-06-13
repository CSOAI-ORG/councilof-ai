/*
 * Watchdog Analyst Signup Page - LOI Collection
 * "Are you worried about AI safety? Earn money as an AI Watchdog!"
 * This page collects Letters of Intent for market validation
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  Shield,
  Users,
  DollarSign,
  Clock,
  Globe,
  CheckCircle,
  ArrowRight,
  Home,
  Briefcase,
  Award,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

const benefits = [
  {
    icon: Home,
    title: "Work From Home",
    description: "100% remote work. Audit AI systems from anywhere in the world.",
  },
  {
    icon: Clock,
    title: "Flexible Hours",
    description: "Choose your own schedule. Work 5-40 hours per week.",
  },
  {
    icon: DollarSign,
    title: "Competitive Pay",
    description: "Earn money while making AI safer for everyone.",
  },
  {
    icon: Award,
    title: "No Tech Background Required",
    description: "We provide full training. Critical thinking is what matters.",
  },
];

const stats = [
  { label: "AI Safety Incidents Reported Daily", value: "500+" },
  { label: "Companies Using AI Without Oversight", value: "10,000+" },
  { label: "Potential EU AI Act Fines", value: "€35M+" },
  { label: "Human Reviewers Needed", value: "1,000+" },
];

export default function WatchdogSignup() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    country: "",
    timezone: "",
    motivation: "",
    availableHoursPerWeek: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const { data: countData } = trpc.applications.getCount.useQuery();
  const submitMutation = trpc.applications.submit.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("Application submitted!", {
        description: "We'll be in touch soon. Thank you for joining the AI safety movement!",
      });
    },
    onError: (error) => {
      toast.error("Submission failed", {
        description: error.message,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.motivation) {
      toast.error("Please fill in all required fields");
      return;
    }

    submitMutation.mutate({
      name: formData.name,
      email: formData.email,
      country: formData.country || undefined,
      timezone: formData.timezone || undefined,
      motivation: formData.motivation,
      availableHoursPerWeek: formData.availableHoursPerWeek 
        ? parseInt(formData.availableHoursPerWeek) 
        : undefined,
    });
  };

  const loiCount = countData?.total || 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground font-bold text-[10px]">
                COAI
              </div>
              <span className="font-semibold">Council of AIs</span>
            </div>
          </Link>
          <Link href="/">
            <Button variant="ghost">Back to Dashboard</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Shield className="h-4 w-4" />
              <span>Join the AI Safety Movement</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Become an AI Safety{" "}
              <span className="text-primary">Watchdog Analyst</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Are you worried about AI safety? Earn money while protecting humanity.
              Work from home, set your own hours, and make a real difference.
            </p>

            {/* LOI Counter */}
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-card border border-border mb-8">
              <Users className="h-5 w-5 text-primary" />
              <div className="text-left">
                <div className="text-2xl font-bold text-foreground">
                  {loiCount.toLocaleString()}+
                </div>
                <div className="text-sm text-muted-foreground">
                  People have signed up
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-muted/30">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl font-bold text-primary mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4">
        <div className="container max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Become a Watchdog Analyst?
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {benefits.map((benefit, idx) => {
              const Icon = benefit.icon;
              return (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.1 }}
                  className="flex gap-4 p-6 rounded-xl bg-card border border-border"
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">
                      {benefit.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {benefit.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* What You'll Do Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            What You'll Do
          </h2>
          
          <div className="space-y-4">
            {[
              "Review AI safety incidents reported by the public",
              "Analyze cases where AI systems may have caused harm",
              "Make decisions when our 33-agent AI council can't reach consensus",
              "Help improve AI safety standards across industries",
              "Contribute to public accountability reports",
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.1 }}
                className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border"
              >
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span className="text-foreground">{item}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Signup Form Section */}
      <section className="py-20 px-4" id="signup">
        <div className="container max-w-xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold text-center mb-4">
              Express Your Interest
            </h2>
            <p className="text-center text-muted-foreground mb-8">
              Sign up now to be notified when positions open. No commitment required.
            </p>

            {submitted ? (
              <div className="text-center p-8 rounded-xl bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  You're on the list!
                </h3>
                <p className="text-muted-foreground mb-4">
                  Thank you for joining the AI safety movement. We'll be in touch soon.
                </p>
                <Link href="/">
                  <Button>
                    Explore COAI Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      placeholder="United Kingdom"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hours">Hours/Week Available</Label>
                    <Select
                      value={formData.availableHoursPerWeek}
                      onValueChange={(value) => setFormData({ ...formData, availableHoursPerWeek: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select hours" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5-10 hours</SelectItem>
                        <SelectItem value="10">10-20 hours</SelectItem>
                        <SelectItem value="20">20-30 hours</SelectItem>
                        <SelectItem value="30">30-40 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="motivation">Why do you want to become a Watchdog Analyst? *</Label>
                  <Textarea
                    id="motivation"
                    placeholder="Tell us about your interest in AI safety and why you'd be a good fit..."
                    rows={4}
                    value={formData.motivation}
                    onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Minimum 50 characters
                  </p>
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg"
                  disabled={submitMutation.isPending}
                >
                  {submitMutation.isPending ? (
                    "Submitting..."
                  ) : (
                    <>
                      Join the Waitlist
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  By signing up, you agree to receive updates about the Watchdog Analyst program.
                  We respect your privacy and won't share your information.
                </p>
              </form>
            )}
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© 2024 COAI - Council of AIs. Building the future of AI safety.</p>
          <p className="mt-2">
            Part of the SOAI (Safety Of AI) ecosystem.
          </p>
        </div>
      </footer>
    </div>
  );
}
