import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import SEO from "@/components/SEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Home, Phone } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <>
      <SEO
        title="Page Not Found | TR8 Plant Hire | 07746 159 640"
        description="The page you're looking for doesn't exist. Return to TR8 Plant Hire for professional plant hire, demolition & asbestos removal services. Call 07746 159 640."
        noIndex={true}
      />

      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="pt-20">
          <section className="py-24 md:py-32">
            <div className="container mx-auto px-6 text-center">
              <span className="text-primary font-display text-8xl md:text-9xl font-bold">404</span>
              <h1 className="font-display text-3xl md:text-4xl font-bold mt-6 mb-4">
                Page Not <span className="text-gradient">Found</span>
              </h1>
              <p className="text-muted-foreground text-lg max-w-md mx-auto mb-8">
                Sorry, the page you're looking for doesn't exist or has been moved.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="hero" size="lg" asChild>
                  <Link to="/" className="flex items-center gap-2">
                    <Home className="w-5 h-5" />
                    Back to Home
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <a href="tel:07746159640" className="flex items-center gap-2">
                    <Phone className="w-5 h-5" />
                    Call Us
                  </a>
                </Button>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default NotFound;
