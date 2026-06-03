import SEO from "@/components/SEO";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import Equipment from "@/components/Equipment";
import About from "@/components/About";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <>
      <SEO
        title="Haulage.app — UK Trade Logistics & Compliance Hub | MEOK AI Labs"
        description="One platform for UK trade logistics + compliance. Plant hire, grab hire, muckaway, plus 9 PyPI-published MCP servers shipping signed compliance attestations."
        canonical="https://haulage.app"
      />

      <div className="min-h-screen bg-background">
        <Header />
        <main>
          <Hero />
          <Services />
          <Equipment />
          <About />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Index;
