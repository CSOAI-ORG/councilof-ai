import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

// Import all gallery images
import equipmentFleet from "@/assets/equipment-fleet.jpg";
import trackedDumper from "@/assets/tracked-dumper.jpg";
import excavatorTransport from "@/assets/excavator-transport.jpg";
import miniDiggerWork from "@/assets/mini-digger-work.jpg";
import excavatorAction from "@/assets/excavator-action.jpg";
import diggerGroundwork from "@/assets/digger-groundwork.jpg";
import miniExcavatorSite from "@/assets/mini-excavator-site.jpg";
import plantDelivery from "@/assets/plant-delivery.jpg";
import excavatorHero from "@/assets/excavator-hero.jpg";

const galleryImages = [
  {
    src: equipmentFleet,
    alt: "TR8 Plant Hire equipment fleet",
    caption: "Our Full Fleet Ready for Hire",
  },
  {
    src: excavatorAction,
    alt: "Excavator in action on site",
    caption: "Precision Groundwork",
  },
  {
    src: trackedDumper,
    alt: "Tracked dumper for site work",
    caption: "Tracked Dumpers for Material Transport",
  },
  {
    src: excavatorTransport,
    alt: "Equipment transport and delivery",
    caption: "Nationwide Delivery Available",
  },
  {
    src: miniDiggerWork,
    alt: "Mini digger at work",
    caption: "Compact Machines for Tight Spaces",
  },
  {
    src: diggerGroundwork,
    alt: "Digger performing groundwork",
    caption: "Professional Groundwork Services",
  },
  {
    src: miniExcavatorSite,
    alt: "Mini excavator on construction site",
    caption: "Quality Equipment, Expert Operators",
  },
  {
    src: plantDelivery,
    alt: "Plant equipment delivery",
    caption: "Reliable Equipment Delivery",
  },
  {
    src: excavatorHero,
    alt: "Main excavator",
    caption: "TR8 - Your Plant Hire Partner",
  },
];

const Gallery = () => {
  return (
    <section id="gallery" className="py-24 bg-card">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="text-primary font-display uppercase tracking-wider text-sm">
            Gallery
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold mt-4 mb-6">
            Our Fleet <span className="text-gradient">In Action</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            See our professional equipment at work on real job sites across the region.
          </p>
        </div>

        {/* Main Carousel */}
        <div className="relative max-w-5xl mx-auto">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {galleryImages.map((image, index) => (
                <CarouselItem key={index} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/2">
                  <div className="group relative overflow-hidden rounded-lg card-industrial">
                    <div className="aspect-[4/3] overflow-hidden">
                      <img
                        src={image.src}
                        alt={image.alt}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    </div>
                    {/* Overlay with caption */}
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-90" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
                      <p className="font-display text-lg md:text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                        {image.caption}
                      </p>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex -left-12 bg-card border-border hover:bg-primary hover:text-primary-foreground hover:border-primary" />
            <CarouselNext className="hidden md:flex -right-12 bg-card border-border hover:bg-primary hover:text-primary-foreground hover:border-primary" />
          </Carousel>

          {/* Mobile navigation hint */}
          <p className="text-center text-muted-foreground text-sm mt-6 md:hidden">
            ← Swipe to see more →
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 max-w-4xl mx-auto">
          {[
            { number: "15+", label: "Machines" },
            { number: "100+", label: "Projects Completed" },
            { number: "24/7", label: "Availability" },
            { number: "5★", label: "Customer Rating" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-display text-3xl md:text-4xl font-bold text-gradient">
                {stat.number}
              </div>
              <div className="text-muted-foreground text-sm uppercase tracking-wider mt-1">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Gallery;
