import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "James Wilson",
    company: "Wilson Construction Ltd",
    rating: 5,
    text: "Excellent service from TR8. The mini excavator was delivered on time and in perfect condition. Will definitely use again for our next project.",
    project: "Residential Groundworks"
  },
  {
    name: "Sarah Thompson",
    company: "Thompson Property Developments",
    rating: 5,
    text: "Professional demolition work completed safely and efficiently. The team were knowledgeable about asbestos removal regulations and handled everything perfectly.",
    project: "Commercial Demolition"
  },
  {
    name: "Mike Davies",
    company: "Davies Landscaping",
    rating: 5,
    text: "Been using TR8 for all our plant hire needs. Fair prices, reliable equipment, and the operated hire service is brilliant. Highly recommend!",
    project: "Garden Landscaping"
  },
  {
    name: "Emma Roberts",
    company: "Roberts Home Renovations",
    rating: 5,
    text: "Quick response to our enquiry and very competitive rates. The Brokk demolition robot made light work of our internal demolition job.",
    project: "House Renovation"
  }
];

const Testimonials = () => {
  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12 md:mb-16">
          <span className="text-primary font-semibold uppercase tracking-wider text-sm">
            Testimonials
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mt-3 mb-4">
            What Our Customers Say
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Don't just take our word for it - hear from some of our satisfied customers
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-card rounded-xl p-6 md:p-8 shadow-lg border border-border/50 relative group hover:border-primary/30 transition-colors duration-300"
            >
              <Quote className="absolute top-6 right-6 w-10 h-10 text-primary/20 group-hover:text-primary/30 transition-colors" />
              
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 fill-primary text-primary"
                  />
                ))}
              </div>

              <p className="text-foreground/90 mb-6 leading-relaxed text-base md:text-lg">
                "{testimonial.text}"
              </p>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">
                    {testimonial.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {testimonial.company}
                  </p>
                </div>
                <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">
                  {testimonial.project}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
