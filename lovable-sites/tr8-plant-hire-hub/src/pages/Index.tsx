import SEO from "@/components/SEO";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import TrustBadges from "@/components/TrustBadges";
import Services from "@/components/Services";
import Equipment from "@/components/Equipment";
import Gallery from "@/components/Gallery";
import Testimonials from "@/components/Testimonials";
import About from "@/components/About";
import FAQ from "@/components/FAQ";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <>
      <SEO
        title="TR8 Plant Hire & Services | Demolition, Excavators, Asbestos Removal | 07746 159 640"
        description="Professional plant hire, demolition & asbestos removal services. Mini excavators, Brokk robots, tracked dumpers. Competitive rates, fast delivery. Call 07746 159 640 for a free quote."
        canonical="https://tr8planthire.com"
      />

      <div className="min-h-screen bg-background">
        <Header />
        <main>
          <Hero />
          <TrustBadges />
          <Services />
          <Equipment />
          <Gallery />
          <Testimonials />
          <About />
          <FAQ />
          <Contact />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Index;
