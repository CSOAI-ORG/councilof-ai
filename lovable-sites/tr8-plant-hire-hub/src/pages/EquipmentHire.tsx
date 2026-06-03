import { useState } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { equipmentList, equipmentCategories, Equipment } from "@/data/equipment";
import BookingForm from "@/components/BookingForm";
import SEO from "@/components/SEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const EquipmentHire = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(null);

  const filteredEquipment =
    selectedCategory === "all"
      ? equipmentList
      : equipmentList.filter((item) => item.category === selectedCategory);

  const handleBookNow = (equipmentId: string) => {
    setSelectedEquipment(equipmentId);
    // Scroll to booking form
    document.getElementById("booking-form")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <SEO
        title="Equipment Hire | Mini Excavators, Diggers, Dumpers | TR8 Plant Hire | 07746 159 640"
        description="Hire mini excavators, diggers, tracked dumpers & demolition equipment. Daily, weekly & weekend rates. Fast delivery in Hampshire & Surrey. Call 07746 159 640."
        canonical="https://tr8planthire.com/equipment-hire"
      />

      <Header />

      <main className="pt-20">
        {/* Hero Section */}
        <section className="bg-gradient-dark py-16 md:py-24">
          <div className="container mx-auto px-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>

            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground mb-6">
                Hire <span className="text-gradient">Equipment</span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Browse our full range of plant hire equipment. Select what you need
                and book directly via WhatsApp for the fastest response.
              </p>
            </div>
          </div>
        </section>

        {/* Category Filter */}
        <section className="py-8 border-b border-border sticky top-20 bg-background/95 backdrop-blur-sm z-40">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap gap-2">
              {equipmentCategories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "hero" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.label}
                </Button>
              ))}
            </div>
          </div>
        </section>

        {/* Equipment Grid */}
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEquipment.map((item) => (
                <EquipmentCard
                  key={item.id}
                  equipment={item}
                  onBookNow={handleBookNow}
                  isSelected={selectedEquipment === item.id}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Booking Form Section */}
        <section id="booking-form" className="py-12 md:py-20 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <BookingForm preselectedEquipment={selectedEquipment || undefined} />
            </div>
          </div>
        </section>

        {/* Why Hire From Us */}
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-display font-bold text-center text-foreground mb-12">
              Why Hire From <span className="text-gradient">TR8?</span>
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: "Modern Fleet", desc: "Well-maintained, reliable equipment" },
                { title: "Competitive Rates", desc: "Daily, weekly & weekend hire" },
                { title: "Fast Delivery", desc: "Same-day delivery available" },
                { title: "Expert Support", desc: "CPCS operators available" },
              ].map((item, i) => (
                <div key={i} className="card-industrial p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                    <Check className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-display font-bold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

interface EquipmentCardProps {
  equipment: Equipment;
  onBookNow: (id: string) => void;
  isSelected: boolean;
}

const EquipmentCard = ({ equipment, onBookNow, isSelected }: EquipmentCardProps) => {
  return (
    <div
      className={`card-industrial overflow-hidden transition-all duration-300 ${
        isSelected ? "ring-2 ring-primary" : ""
      }`}
    >
      <div className="aspect-video overflow-hidden">
        <img
          src={equipment.image}
          alt={`${equipment.name} available for hire from TR8 Plant Hire`}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
        />
      </div>

      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-display font-bold text-lg text-foreground">
            {equipment.name}
          </h3>
          {equipment.priceFrom && (
            <span className="text-sm font-bold text-primary whitespace-nowrap ml-2">
              {equipment.priceFrom}
            </span>
          )}
        </div>

        <p className="text-sm text-muted-foreground mb-4">{equipment.description}</p>

        <ul className="space-y-1 mb-6">
          {equipment.specs.slice(0, 3).map((spec, i) => (
            <li key={i} className="text-xs text-muted-foreground flex items-center gap-2">
              <Check className="w-3 h-3 text-primary" />
              {spec}
            </li>
          ))}
        </ul>

        <Button
          variant="hero"
          className="w-full"
          onClick={() => onBookNow(equipment.id)}
        >
          Book Now
        </Button>
      </div>
    </div>
  );
};

export default EquipmentHire;
