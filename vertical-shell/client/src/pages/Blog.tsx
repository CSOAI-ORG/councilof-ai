/**
 * Blog/News Section Placeholder
 * Will display AI safety news, COAI updates, and regulatory changes
 */

import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Newspaper,
  Calendar,
  User,
  ArrowRight,
  Tag,
  Bell,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

// Placeholder blog posts
const blogPosts = [
  {
    id: 1,
    title: "EU AI Act: What Enterprises Need to Know for 2025 Compliance",
    excerpt: "A comprehensive guide to the EU AI Act requirements and how COAI helps organizations achieve compliance before the deadline.",
    category: "Regulatory",
    author: "COAI Team",
    date: "Dec 20, 2024",
    readTime: "8 min read",
    featured: true,
  },
  {
    id: 2,
    title: "Introducing the 33-Agent Council: How AI Governs AI",
    excerpt: "Learn how our multi-agent council system provides transparent, balanced decisions on AI safety incidents.",
    category: "Product",
    author: "COAI Team",
    date: "Dec 15, 2024",
    readTime: "5 min read",
    featured: true,
  },
  {
    id: 3,
    title: "NIST AI RMF vs EU AI Act: A Framework Comparison",
    excerpt: "Understanding the differences and overlaps between major AI governance frameworks.",
    category: "Research",
    author: "COAI Team",
    date: "Dec 10, 2024",
    readTime: "12 min read",
    featured: false,
  },
  {
    id: 4,
    title: "Watchdog Program: Join Our Global Network of AI Safety Analysts",
    excerpt: "How certified analysts are helping identify and address AI safety concerns worldwide.",
    category: "Community",
    author: "COAI Team",
    date: "Dec 5, 2024",
    readTime: "4 min read",
    featured: false,
  },
  {
    id: 5,
    title: "TC260 Standards: China's Approach to AI Governance",
    excerpt: "An overview of China's TC260 AI safety standards and their global implications.",
    category: "Regulatory",
    author: "COAI Team",
    date: "Nov 30, 2024",
    readTime: "10 min read",
    featured: false,
  },
  {
    id: 6,
    title: "PDCA Methodology for Continuous AI Improvement",
    excerpt: "Implementing the Deming cycle for ongoing AI system governance and compliance.",
    category: "Best Practices",
    author: "COAI Team",
    date: "Nov 25, 2024",
    readTime: "6 min read",
    featured: false,
  },
];

const categories = ["All", "Regulatory", "Product", "Research", "Community", "Best Practices"];

export default function Blog() {
  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Thanks for subscribing! You'll receive our latest updates.");
  };

  const handleReadMore = () => {
    toast.info("Full blog posts coming soon!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/public">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-2">
                <Newspaper className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-bold">COAI Blog</h1>
              </div>
            </div>
            <Link href="/dashboard">
              <Button>Go to Dashboard</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">AI Safety News & Insights</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Stay informed about AI governance, regulatory updates, and best practices for building responsible AI systems.
          </p>
        </div>

        {/* Newsletter Signup */}
        <Card className="mb-12 bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Bell className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="font-semibold">Subscribe to our newsletter</h3>
                  <p className="text-sm text-muted-foreground">
                    Get weekly updates on AI safety and compliance
                  </p>
                </div>
              </div>
              <form onSubmit={handleSubscribe} className="flex gap-2 w-full md:w-auto">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full md:w-64"
                  required
                />
                <Button type="submit">Subscribe</Button>
              </form>
            </div>
          </CardContent>
        </Card>

        {/* Categories */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((category) => (
            <Button
              key={category}
              variant={category === "All" ? "default" : "outline"}
              size="sm"
              onClick={() => toast.info("Category filtering coming soon!")}
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Featured Posts */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {blogPosts.filter(p => p.featured).map((post, idx) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer" onClick={handleReadMore}>
                <div className="h-48 bg-gradient-to-br from-primary/20 to-primary/5 rounded-t-lg flex items-center justify-center">
                  <Newspaper className="h-16 w-16 text-primary/40" />
                </div>
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge>{post.category}</Badge>
                    <Badge variant="outline">Featured</Badge>
                  </div>
                  <CardTitle className="line-clamp-2">{post.title}</CardTitle>
                  <CardDescription className="line-clamp-2">{post.excerpt}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {post.author}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {post.date}
                      </span>
                    </div>
                    <span>{post.readTime}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* All Posts */}
        <h2 className="text-2xl font-bold mb-6">Latest Articles</h2>
        <div className="space-y-4">
          {blogPosts.filter(p => !p.featured).map((post, idx) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={handleReadMore}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{post.category}</Badge>
                      </div>
                      <h3 className="font-semibold mb-1">{post.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>{post.author}</span>
                        <span>{post.date}</span>
                        <span>{post.readTime}</span>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-2" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Coming Soon Notice */}
        <Card className="mt-12 text-center">
          <CardContent className="p-8">
            <Newspaper className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">More Content Coming Soon</h3>
            <p className="text-muted-foreground mb-4">
              We're working on bringing you in-depth articles, case studies, and expert insights on AI safety and governance.
            </p>
            <Button variant="outline" onClick={() => toast.info("Thanks for your interest!")}>
              Request a Topic
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
