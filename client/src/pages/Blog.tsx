/**
 * Blog/News Section
 * Displays AI safety news, CSOAI updates, and regulatory changes with professional design
 */

import { useState } from "react";
import { Link } from "wouter";
import {
  Newspaper,
  Calendar,
  User,
  ArrowRight,
  Bell,
  BookOpen,
  FileText,
  MessageCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

// Blog posts with featured flag
const blogPosts = [
  {
    id: 1,
    title: "EU AI Act: What Enterprises Need to Know for 2025 Compliance",
    excerpt: "A comprehensive guide to the EU AI Act requirements and how CSOAI helps organizations achieve compliance before the deadline.",
    category: "Regulatory",
    author: "CSOAI Team",
    date: "Dec 20, 2024",
    readTime: "8 min read",
    featured: true,
  },
  {
    id: 2,
    title: "Introducing the 33-Agent Council: How AI Governs AI",
    excerpt: "Learn how our multi-agent council system provides transparent, balanced decisions on AI safety incidents.",
    category: "Product",
    author: "CSOAI Team",
    date: "Dec 15, 2024",
    readTime: "5 min read",
    featured: false,
  },
  {
    id: 3,
    title: "NIST AI RMF vs EU AI Act: A Framework Comparison",
    excerpt: "Understanding the differences and overlaps between major AI governance frameworks.",
    category: "Research",
    author: "CSOAI Team",
    date: "Dec 10, 2024",
    readTime: "12 min read",
    featured: false,
  },
  {
    id: 4,
    title: "Watchdog Program: Join Our Global Network of AI Safety Analysts",
    excerpt: "How certified analysts are helping identify and address AI safety concerns worldwide.",
    category: "Community",
    author: "CSOAI Team",
    date: "Dec 5, 2024",
    readTime: "4 min read",
    featured: false,
  },
  {
    id: 5,
    title: "TC260 Standards: China's Approach to AI Governance",
    excerpt: "An overview of China's TC260 AI safety standards and their global implications.",
    category: "Regulatory",
    author: "CSOAI Team",
    date: "Nov 30, 2024",
    readTime: "10 min read",
    featured: false,
  },
  {
    id: 6,
    title: "PDCA Methodology for Continuous AI Improvement",
    excerpt: "Implementing the Deming cycle for ongoing AI system governance and compliance.",
    category: "Best Practices",
    author: "CSOAI Team",
    date: "Nov 25, 2024",
    readTime: "6 min read",
    featured: false,
  },
  {
    id: 7,
    title: "How to Prepare for ISO 42001 Certification",
    excerpt: "Step-by-step guide to achieving ISO 42001 certification for your organization's AI management system.",
    category: "Best Practices",
    author: "CSOAI Team",
    date: "Jan 5, 2025",
    readTime: "9 min read",
    featured: false,
  },
  {
    id: 8,
    title: "The Rise of AI Safety as a Career Path",
    excerpt: "Exploring emerging opportunities in AI safety roles and how to build expertise in this growing field.",
    category: "Community",
    author: "CSOAI Team",
    date: "Jan 10, 2025",
    readTime: "7 min read",
    featured: false,
  },
  {
    id: 9,
    title: "Understanding China's TC260 AI Standards: A Deep Dive",
    excerpt: "A comprehensive analysis of TC260 standards, requirements, and their implications for global AI development.",
    category: "Research",
    author: "CSOAI Team",
    date: "Jan 15, 2025",
    readTime: "14 min read",
    featured: false,
  },
];

const categories = ["All", "Regulatory", "Product", "Research", "Community", "Best Practices"];

// Category to gradient color mapping
const categoryGradients: Record<string, string> = {
  Regulatory: "from-blue-500 to-blue-600",
  Product: "from-emerald-500 to-emerald-600",
  Research: "from-purple-500 to-purple-600",
  Community: "from-orange-500 to-orange-600",
  "Best Practices": "from-teal-500 to-teal-600",
};

const categoryColors: Record<string, string> = {
  Regulatory: "bg-blue-100 text-blue-800",
  Product: "bg-emerald-100 text-emerald-800",
  Research: "bg-purple-100 text-purple-800",
  Community: "bg-orange-100 text-orange-800",
  "Best Practices": "bg-teal-100 text-teal-800",
};

export default function Blog() {
  const [subscribed, setSubscribed] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    setSubscribed(true);
    setTimeout(() => setSubscribed(false), 3000);
  };

  const filteredPosts = selectedCategory === "All"
    ? blogPosts
    : blogPosts.filter(post => post.category === selectedCategory);

  const featuredPost = filteredPosts.find(p => p.featured);
  const regularPosts = filteredPosts.filter(p => !p.featured);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Hero Section with Newsletter */}
      <div className="w-full bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-900 text-white py-16 sm:py-20 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Hero Title and Subtitle */}
            <div className="mb-12 text-center">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 tracking-tight">
                AI Safety News & Insights
              </h1>
              <p className="text-lg sm:text-xl text-slate-200 max-w-2xl mx-auto leading-relaxed">
                Stay informed about AI governance, regulatory updates, and best practices for building responsible AI systems.
              </p>
            </div>

            {/* Newsletter Signup Form */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-4">
                <Bell className="h-6 w-6 text-emerald-300" />
                <h3 className="text-lg font-semibold">Subscribe to our newsletter</h3>
              </div>
              <p className="text-slate-200 mb-6 text-sm">
                Get weekly updates on AI safety, compliance standards, and industry developments.
              </p>

              {subscribed ? (
                <div className="bg-emerald-500/20 border border-emerald-500/50 rounded-lg p-4 text-emerald-100 font-medium flex items-center gap-2">
                  <span className="text-lg">✓</span> Thanks for subscribing! Check your email for confirmation.
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
                  <Input
                    type="email"
                    placeholder="Enter your email address"
                    className="flex-1 bg-white/90 border-0 rounded-lg text-slate-900 placeholder-slate-500"
                    required
                  />
                  <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-8">
                    Subscribe
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-12 md:py-16">
        {/* Featured Post */}
        {featuredPost && (
          <div className="mb-16">
            <div className={`bg-gradient-to-br ${categoryGradients[featuredPost.category]} rounded-xl overflow-hidden shadow-xl transition-transform duration-300 hover:-translate-y-1`}>
              <div className="p-8 sm:p-10 md:p-12 text-white">
                <div className="flex items-center gap-3 mb-4">
                  <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm">
                    Featured
                  </Badge>
                  <Badge className={categoryColors[featuredPost.category]}>
                    {featuredPost.category}
                  </Badge>
                </div>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 leading-tight">
                  {featuredPost.title}
                </h2>
                <p className="text-lg text-white/90 mb-8 max-w-2xl leading-relaxed">
                  {featuredPost.excerpt}
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 mb-8">
                  <div className="flex items-center gap-2 text-white/80 text-sm">
                    <User className="h-4 w-4" />
                    <span>{featuredPost.author}</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/80 text-sm">
                    <Calendar className="h-4 w-4" />
                    <span>{featuredPost.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/80 text-sm">
                    <Newspaper className="h-4 w-4" />
                    <span>{featuredPost.readTime}</span>
                  </div>
                </div>
                <Button className="bg-white text-slate-900 hover:bg-slate-100 font-semibold">
                  Read Article
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Category Filter */}
        <div className="mb-12">
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 sm:px-5 py-2 rounded-full font-medium transition-all duration-200 ${
                  selectedCategory === category
                    ? `bg-gradient-to-r ${categoryGradients[category] || "from-slate-700 to-slate-800"} text-white shadow-lg`
                    : "bg-white border border-slate-200 text-slate-700 hover:border-slate-300"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Regular Posts Grid */}
        {regularPosts.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-slate-900">Latest Articles</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {regularPosts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col"
                >
                  {/* Category Gradient Header */}
                  <div className={`bg-gradient-to-r ${categoryGradients[post.category]} h-32 flex items-end p-4`}>
                    <Badge className={categoryColors[post.category]}>
                      {post.category}
                    </Badge>
                  </div>

                  {/* Content */}
                  <CardContent className="p-6 flex-1 flex flex-col">
                    <h3 className="text-lg font-bold text-slate-900 mb-3 line-clamp-2 leading-tight">
                      {post.title}
                    </h3>
                    <p className="text-sm text-slate-600 mb-4 line-clamp-2 flex-1">
                      {post.excerpt}
                    </p>

                    {/* Metadata */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 border-t border-slate-100 pt-4">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {post.author}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {post.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Newspaper className="h-3 w-3" />
                        {post.readTime}
                      </span>
                    </div>
                  </CardContent>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredPosts.length === 0 && (
          <div className="text-center py-12">
            <Newspaper className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No articles found</h3>
            <p className="text-slate-600">Try selecting a different category.</p>
          </div>
        )}

        {/* Resources Section */}
        <div className="mt-16 pt-12 border-t border-slate-200">
          <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-center text-slate-900">
            Explore More Resources
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {/* FAQ Card */}
            <Link href="/faq">
              <div className="bg-white rounded-xl p-8 text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer border border-slate-100">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">FAQ</h3>
                <p className="text-slate-600 text-sm">Find answers to common questions about AI safety and compliance.</p>
              </div>
            </Link>

            {/* Glossary Card */}
            <Link href="/glossary">
              <div className="bg-white rounded-xl p-8 text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer border border-slate-100">
                <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Glossary</h3>
                <p className="text-slate-600 text-sm">Learn key terms and concepts in AI governance and safety.</p>
              </div>
            </Link>

            {/* Case Studies Card */}
            <Link href="/case-studies">
              <div className="bg-white rounded-xl p-8 text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer border border-slate-100">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Case Studies</h3>
                <p className="text-slate-600 text-sm">See real-world examples of AI safety implementation.</p>
              </div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
