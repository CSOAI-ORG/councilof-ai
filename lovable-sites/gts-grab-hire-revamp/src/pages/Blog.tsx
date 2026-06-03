import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, User, ArrowRight, Mail } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import Badge from "@/components/Badge";

const Blog = () => {
  const blogPosts = [
    {
      title: "Grab Hire vs Skip Hire: Complete Comparison Guide",
      excerpt: "Discover the key differences between grab hire and skip hire services. Learn which option is more cost-effective and suitable for your project needs.",
      category: "Comparison Guide",
      date: "2024-01-15",
      author: "GTS Team",
      readTime: "5 min read",
      // image removed
    },
    {
      title: "What Size Grab Lorry Do I Need? Complete Guide",
      excerpt: "Choosing the right grab lorry size for your project is crucial for cost-effectiveness. Our comprehensive guide helps you make the right decision.",
      category: "How-To Guide",
      date: "2024-01-10",
      author: "GTS Team", 
      readTime: "4 min read",
      // image removed
    },
    {
      title: "Environmental Benefits of Professional Waste Removal",
      excerpt: "Learn how professional waste removal services contribute to environmental protection through proper recycling and disposal methods.",
      category: "Environmental",
      date: "2024-01-05",
      author: "GTS Team",
      readTime: "6 min read",
      // image removed
    },
    {
      title: "Construction Site Waste Management Best Practices",
      excerpt: "Essential tips for managing waste efficiently on construction sites, including planning, segregation, and choosing the right removal services.",
      category: "Construction",
      date: "2023-12-20",
      author: "GTS Team",
      readTime: "7 min read",
      // image removed
    },
    {
      title: "Garden Clearance: When to Choose Grab Hire Services",
      excerpt: "Planning a major garden clearance project? Discover when grab hire is the most efficient and cost-effective solution for your needs.",
      category: "Garden & Landscaping",
      date: "2023-12-15",
      author: "GTS Team",
      readTime: "4 min read",
      // image removed
    },
    {
      title: "Understanding Waste Disposal Regulations in the UK",
      excerpt: "Stay compliant with UK waste disposal regulations. Learn about legal requirements, licensing, and proper documentation for waste removal.",
      category: "Legal & Compliance",
      date: "2023-12-10",
      author: "GTS Team",
      readTime: "8 min read",
      // image removed
    }
  ];

  const categories = [
    "All Posts",
    "How-To Guide", 
    "Comparison Guide",
    "Construction",
    "Environmental",
    "Garden & Landscaping",
    "Legal & Compliance"
  ];

  return (
    <>
      <SEOHead 
        title="Blog | Grab Hire Tips & News | Waste Management Insights | GTS Grab Hire"
        description="Latest news, tips, and insights from GTS Grab Hire. Expert advice on grab hire, waste management, and construction services. Industry updates and guides."
        keywords="grab hire blog, waste management tips, construction advice, environmental insights, industry news"
      />
      
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="hero-gradient text-white py-20">
          <div className="container mx-auto px-4 text-center">
            <Badge variant="yellow" className="mb-6">
              Blog & News
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Latest News, Insights, and Tips from GTS GrabHire
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 max-w-4xl mx-auto leading-relaxed">
              Expert advice on grab hire, waste management, and industry best practices
            </p>
          </div>
        </section>

        {/* Blog Posts Section */}
        <section className="section-padding section-gradient">
          <div className="container mx-auto px-4">
            {/* Featured Post */}
            <div className="mb-16">
              <h2 className="text-2xl font-bold text-[hsl(var(--gts-dark))] mb-8">Featured Article</h2>
              <Card className="bg-white shadow-[var(--shadow-card)] border-0 overflow-hidden">
                <div className="p-8">
                  <Badge variant="yellow" className="mb-4">
                    {blogPosts[0].category}
                  </Badge>
                  <h3 className="text-2xl md:text-3xl font-bold text-[hsl(var(--gts-dark))] mb-4">
                    {blogPosts[0].title}
                  </h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    {blogPosts[0].excerpt}
                  </p>
                  <div className="flex items-center text-sm text-gray-500 mb-6">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span className="mr-4">{new Date(blogPosts[0].date).toLocaleDateString()}</span>
                    <User className="w-4 h-4 mr-2" />
                    <span className="mr-4">{blogPosts[0].author}</span>
                    <span>{blogPosts[0].readTime}</span>
                  </div>
                  <Button asChild variant="primary">
                    <Link to="/blog/grab-hire-vs-skip-hire">
                      Read Full Article
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              </Card>
            </div>

            {/* Category Filter */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-[hsl(var(--gts-dark))] mb-6">Browse by Category</h2>
              <div className="flex flex-wrap gap-3">
                {categories.map((category, index) => (
                  <Badge 
                    key={index}
                    variant={index === 0 ? "yellow" : "default"}
                    className={`cursor-pointer transition-all ${
                      index === 0 
                        ? "bg-[hsl(var(--gts-yellow))] text-[hsl(var(--gts-dark))]" 
                        : "section-gradient text-gray-700 hover:bg-[hsl(var(--gts-yellow))] hover:text-[hsl(var(--gts-dark))]"
                    }`}
                  >
                    {category}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Blog Posts Grid */}
            <div className="mb-16">
              <h2 className="text-2xl font-bold text-[hsl(var(--gts-dark))] mb-8">Recent Articles</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {blogPosts.slice(1).map((post, index) => (
                  <Card key={index} className="bg-white shadow-[var(--shadow-card)] border-0 card-hover overflow-hidden">
                    <CardHeader>
                      <Badge variant="default" className="w-fit mb-2 section-gradient text-gray-700">
                        {post.category}
                      </Badge>
                      <CardTitle className="text-xl text-[hsl(var(--gts-dark))] leading-tight">
                        {post.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="mb-4 leading-relaxed">
                        {post.excerpt}
                      </CardDescription>
                      <div className="flex items-center text-xs text-gray-500 mb-4">
                        <Calendar className="w-3 h-3 mr-1" />
                        <span className="mr-3">{new Date(post.date).toLocaleDateString()}</span>
                        <span>{post.readTime}</span>
                      </div>
                      <Button asChild variant="outline" size="sm" className="w-full border-[hsl(var(--gts-yellow))] text-[hsl(var(--gts-yellow))] hover:bg-[hsl(var(--gts-yellow))] hover:text-[hsl(var(--gts-dark))]">
                        <Link to={
                          index === 0 ? "/blog/grab-lorry-size-guide" :
                          index === 1 ? "/blog/environmental-benefits-waste-removal" :
                          index === 2 ? "/blog/construction-waste-management" :
                          index === 3 ? "/blog/garden-clearance-grab-hire" :
                          "/blog/uk-waste-disposal-regulations"
                        }>
                          Read More
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Newsletter Signup */}
            <Card className="bg-[hsl(var(--gts-navy))] text-white border-0">
              <CardContent className="p-12 text-center">
                <Mail className="w-16 h-16 text-[hsl(var(--gts-dark))] mx-auto mb-6" />
                <h3 className="text-2xl md:text-3xl font-bold mb-4">
                  Stay Updated with Industry Insights
                </h3>
                <p className="text-gray-200 mb-8 max-w-2xl mx-auto leading-relaxed">
                  Subscribe to our newsletter for the latest tips, industry news, and expert advice on grab hire and waste management.
                </p>
                <div className="max-w-md mx-auto flex flex-col sm:flex-row gap-4">
                  <input 
                    type="email" 
                    placeholder="Enter your email address"
                    className="flex-1 px-4 py-3 rounded-lg border-0 text-[hsl(var(--gts-dark))] focus:ring-2 focus:ring-[hsl(var(--gts-yellow))]"
                  />
                  <Button variant="cta" size="lg">
                    Subscribe
                  </Button>
                </div>
                <p className="text-sm text-gray-300 mt-4">
                  No spam. Unsubscribe at any time.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="section-padding bg-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-[hsl(var(--gts-dark))] mb-6">
              Need Professional Grab Hire Services?
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Put our expertise to work for your project. Get a free quote for professional grab hire and waste management services.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild variant="primary" size="lg">
                <Link to="/quote">Get Free Quote</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-[hsl(var(--gts-yellow))] text-[hsl(var(--gts-yellow))] hover:bg-[hsl(var(--gts-yellow))] hover:text-[hsl(var(--gts-dark))]">
                <Link to="/services">Our Services</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </>
  );
};

export default Blog;