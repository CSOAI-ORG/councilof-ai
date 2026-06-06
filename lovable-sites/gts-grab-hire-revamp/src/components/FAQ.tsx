import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Phone, Mail, MessageSquare, HelpCircle } from "lucide-react";
import Badge from "@/components/Badge";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'service' | 'pricing' | 'booking' | 'technical';
}

const faqItems: FAQItem[] = [
  {
    id: 'what-is-grab-hire',
    question: 'What is grab hire and how does it work?',
    answer: 'Grab hire involves using a grab lorry (truck with a hydraulic grab arm) to collect and remove waste directly from your site. The grab arm can reach over walls, fences, and obstacles to collect waste from hard-to-reach areas, making it more versatile than traditional skip hire.',
    category: 'service'
  },
  {
    id: 'grab-vs-skip',
    question: 'What are the advantages of grab hire over skip hire?',
    answer: 'Grab hire offers several advantages: no permits needed (the lorry doesn\'t stay on-site), can access difficult locations, immediate waste removal, more cost-effective for large volumes, and no risk of other people adding waste to your skip.',
    category: 'service'
  },
  {
    id: 'capacity',
    question: 'How much waste can a grab lorry carry?',
    answer: 'Our grab lorries can carry up to 16 tons of waste in a single load, equivalent to approximately 3-4 standard skips. The exact capacity depends on the type and density of the waste material.',
    category: 'technical'
  },
  {
    id: 'access-requirements',
    question: 'What access do you need for grab hire?',
    answer: 'We need vehicle access within approximately 6 meters of the waste. Our grab arm can reach over obstacles up to 3 meters high and extend up to 6 meters horizontally. We can work around most access challenges.',
    category: 'technical'
  },
  {
    id: 'waste-types',
    question: 'What types of waste can you collect?',
    answer: 'We collect most types of non-hazardous waste including: construction debris, garden waste, household clearance, soil and aggregates, commercial waste, and demolition materials. We cannot collect hazardous materials, asbestos, or chemical waste.',
    category: 'service'
  },
  {
    id: 'pricing-structure',
    question: 'How is grab hire pricing calculated?',
    answer: 'Pricing is based on the volume of waste, type of material, location, and disposal costs. We provide transparent, upfront pricing with no hidden charges. Contact us for a free, no-obligation quote tailored to your specific requirements.',
    category: 'pricing'
  },
  {
    id: 'booking-notice',
    question: 'How much notice do I need to give?',
    answer: 'We can often provide same-day service for urgent requirements. For planned projects, 24-48 hours notice is ideal. During busy periods, booking in advance ensures your preferred time slot.',
    category: 'booking'
  },
  {
    id: 'emergency-service',
    question: 'Do you offer emergency waste removal?',
    answer: 'Yes, we provide 24/7 emergency waste removal services. Whether it\'s a burst pipe cleanup, storm damage, or urgent site clearance, we can respond quickly to help resolve your emergency.',
    category: 'service'
  },
  {
    id: 'service-areas',
    question: 'Which areas do you cover?',
    answer: 'We provide comprehensive grab hire services across Kent, London, and Essex. This includes both urban and rural areas. Contact us to confirm coverage for your specific location.',
    category: 'service'
  },
  {
    id: 'permits-required',
    question: 'Do I need any permits for grab hire?',
    answer: 'No permits are required for grab hire services. Unlike skips that remain on public roads, our grab lorries arrive, collect the waste, and leave immediately, eliminating the need for council permits.',
    category: 'booking'
  },
  {
    id: 'mixed-waste',
    question: 'Can you collect mixed waste types?',
    answer: 'Yes, we can collect mixed waste loads. However, separating different waste types can sometimes reduce disposal costs. We\'ll advise you on the most cost-effective approach for your specific waste.',
    category: 'service'
  },
  {
    id: 'payment-terms',
    question: 'What are your payment terms?',
    answer: 'We accept various payment methods including cash, card, bank transfer, and we offer account terms for regular commercial customers. Payment is typically required on completion of service or as agreed for account customers.',
    category: 'pricing'
  },
  {
    id: 'weather-conditions',
    question: 'Do weather conditions affect the service?',
    answer: 'We operate in most weather conditions. However, extreme weather (heavy snow, ice, or severe storms) may affect access and safety. We\'ll always prioritize safety and reschedule if necessary.',
    category: 'technical'
  },
  {
    id: 'aggregates-delivery',
    question: 'Do you also deliver aggregates and materials?',
    answer: 'Yes, we supply and deliver various aggregates including sand, gravel, topsoil, and crushed concrete. Our grab lorries can deliver materials to your site as efficiently as they remove waste.',
    category: 'service'
  },
  {
    id: 'insurance-licensing',
    question: 'Are you fully licensed and insured?',
    answer: 'Yes, we are fully licensed waste carriers with comprehensive public liability insurance. We hold all necessary permits and certifications, and provide waste transfer documentation for all collections.',
    category: 'technical'
  }
];

const categories = [
  { id: 'service', name: 'Service Info', icon: HelpCircle },
  { id: 'pricing', name: 'Pricing', icon: MessageSquare },
  { id: 'booking', name: 'Booking', icon: Phone },
  { id: 'technical', name: 'Technical', icon: Mail }
];

const FAQ: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');

  const filteredFAQs = selectedCategory === 'all' 
    ? faqItems 
    : faqItems.filter(item => item.category === selectedCategory);

  return (
    <section className="section-padding">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge variant="yellow" className="mb-6">
            Frequently Asked Questions
          </Badge>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[hsl(var(--gts-dark))] mb-6">
            Got Questions? We've Got Answers
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            Find answers to common questions about our grab hire and waste management services.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          <Button
            variant={selectedCategory === 'all' ? 'primary' : 'outline'}
            onClick={() => setSelectedCategory('all')}
            className="hover:scale-105 transition-transform duration-200"
          >
            All Questions
          </Button>
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'primary' : 'outline'}
                onClick={() => setSelectedCategory(category.id)}
                className="hover:scale-105 transition-transform duration-200"
              >
                <Icon className="w-4 h-4 mr-2" />
                {category.name}
              </Button>
            );
          })}
        </div>

        {/* FAQ Accordion */}
        <Card className="bg-white shadow-[var(--shadow-card)] border-0 max-w-4xl mx-auto">
          <CardContent className="p-8">
            <Accordion type="single" collapsible className="space-y-4">
              {filteredFAQs.map((item) => (
                <AccordionItem 
                  key={item.id} 
                  value={item.id}
                  className="border border-gray-200 rounded-lg px-6 hover:border-[hsl(var(--gts-yellow))] transition-colors duration-200"
                >
                  <AccordionTrigger className="text-left font-semibold text-[hsl(var(--gts-dark))] hover:text-[hsl(var(--gts-yellow))] py-4">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-700 pb-4 leading-relaxed">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Still Have Questions CTA */}
        <Card className="bg-[hsl(var(--gts-yellow))] border-0 mt-16 hover:scale-105 transition-transform duration-300">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl md:text-3xl font-bold text-[hsl(var(--gts-dark))] mb-4">
              Still Have Questions?
            </h3>
            <p className="text-[hsl(var(--gts-dark))] mb-6 text-lg">
              Our friendly team is ready to help with any questions about our grab hire services.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild variant="navy" size="lg" className="hover:scale-105 transition-transform duration-200">
                <a href="tel:07958710548" className="flex items-center space-x-2">
                  <Phone className="w-5 h-5" />
                  <span>Call: 07958 710 548</span>
                </a>
              </Button>
              <Button asChild variant="outlineWhite" size="lg" className="border-[hsl(var(--gts-dark))] text-[hsl(var(--gts-dark))] hover:bg-[hsl(var(--gts-dark))] hover:text-white hover:scale-105 transition-all duration-200">
                <Link to="/contact" className="flex items-center space-x-2">
                  <Mail className="w-5 h-5" />
                  <span>Send Message</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default FAQ;