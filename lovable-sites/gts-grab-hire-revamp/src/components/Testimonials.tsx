import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Star, Quote } from "lucide-react";
import Badge from "@/components/Badge";

interface Testimonial {
  id: number;
  name: string;
  location: string;
  rating: number;
  review: string;
  service: string;
  date: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Sarah Mitchell",
    location: "Canterbury, Kent",
    rating: 5,
    review: "Absolutely fantastic service! Gray arrived on time, cleared our garden waste efficiently, and the grab lorry was perfect for our tight access. Professional and reasonably priced.",
    service: "Garden Clearance",
    date: "2024-01-15"
  },
  {
    id: 2,
    name: "Mark Thompson",
    location: "Bromley, London", 
    rating: 5,
    review: "Used GTS for our construction site muck away. Outstanding service - very reliable, competitive pricing, and they handled all the paperwork. Will definitely use again.",
    service: "Muck Away",
    date: "2024-01-08"
  },
  {
    id: 3,
    name: "Emma Williams",
    location: "Chelmsford, Essex",
    rating: 5,
    review: "Emergency waste removal sorted within 2 hours of calling! Gray was incredibly helpful and professional. Can't recommend highly enough for urgent clearances.",
    service: "Emergency Waste",
    date: "2024-01-22"
  },
  {
    id: 4,
    name: "David Brown",
    location: "Sevenoaks, Kent",
    rating: 5,
    review: "Perfect aggregates delivery for our driveway project. High quality materials, precise delivery timing, and excellent customer service throughout.",
    service: "Aggregates Supply",
    date: "2024-01-10"
  },
  {
    id: 5,
    name: "Lisa Roberts",
    location: "Greenwich, London",
    rating: 5,
    review: "Chose GTS over skip hire and so glad we did! Much more efficient, cleaner process, and surprisingly cost-effective. Gray was professional and friendly.",
    service: "Skip Hire Alternative",
    date: "2024-01-18"
  },
  {
    id: 6,
    name: "James Wilson",
    location: "Basildon, Essex",
    rating: 5,
    review: "Commercial waste removal for our warehouse - consistently reliable service, competitive rates, and they always clean up after themselves. Top class operation.",
    service: "Commercial Waste",
    date: "2024-01-12"
  }
];

const StarRating: React.FC<{ rating: number }> = ({ rating }) => {
  return (
    <div className="flex space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-5 h-5 ${
            star <= rating 
              ? 'text-[hsl(var(--gts-yellow))] fill-[hsl(var(--gts-yellow))]' 
              : 'text-gray-300'
          }`}
        />
      ))}
    </div>
  );
};

const TestimonialCard: React.FC<{ testimonial: Testimonial }> = ({ testimonial }) => {
  return (
    <Card className="bg-white shadow-[var(--shadow-card)] border-0 h-full hover:shadow-[var(--shadow-hover)] hover:-translate-y-1 transition-all duration-300">
      <CardContent className="p-6 h-full flex flex-col">
        <div className="flex items-start justify-between mb-4">
          <Quote className="w-8 h-8 text-[hsl(var(--gts-dark))] opacity-30" />
          <StarRating rating={testimonial.rating} />
        </div>
        
        <p className="text-gray-700 mb-6 flex-grow leading-relaxed">
          "{testimonial.review}"
        </p>
        
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-[hsl(var(--gts-dark))]">
              {testimonial.name}
            </h4>
            <p className="text-sm text-gray-600">
              {testimonial.location}
            </p>
          </div>
          <Badge variant="yellow" className="text-xs">
            {testimonial.service}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

const Testimonials: React.FC = () => {
  return (
    <section className="section-padding section-gradient">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge variant="yellow" className="mb-6">
            Customer Reviews
          </Badge>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[hsl(var(--gts-dark))] mb-6">
            What Our Customers Say
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            Don't just take our word for it - see what our satisfied customers across Kent, London, and Essex have to say about our professional grab hire services.
          </p>
        </div>

        {/* Overall Rating */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-4 bg-white rounded-xl p-6 shadow-[var(--shadow-card)]">
            <div className="text-center">
              <div className="text-4xl font-bold text-[hsl(var(--gts-dark))]">5.0</div>
              <StarRating rating={5} />
              <p className="text-sm text-gray-600 mt-1">Average Rating</p>
            </div>
            <div className="border-l border-gray-200 pl-4">
              <div className="text-2xl font-bold text-[hsl(var(--gts-dark))]">150+</div>
              <p className="text-sm text-gray-600">Happy Customers</p>
            </div>
          </div>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <TestimonialCard key={testimonial.id} testimonial={testimonial} />
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <p className="text-lg text-gray-600 mb-6">
            Ready to experience our professional service?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="tel:07958710548"
              className="btn-primary inline-flex items-center justify-center space-x-2 text-center"
            >
              <span>Call Now: 07958 710 548</span>
            </a>
            <Link 
              to="/quote"
              className="btn-secondary inline-flex items-center justify-center space-x-2 text-center"
            >
              <span>Get Free Quote</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;