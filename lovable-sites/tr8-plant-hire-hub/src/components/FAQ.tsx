import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ = () => {
  const faqs = [
    {
      question: "What equipment do you have available for hire?",
      answer: "We offer a wide range of plant and equipment including mini excavators (0.8T to 8T), tracked dumpers, cement mixers, plate compactors, and specialist demolition equipment like Brokk robots. Visit our Equipment Hire page for the full list with specifications and pricing."
    },
    {
      question: "What are your hire rates?",
      answer: "We offer competitive daily, weekend, and weekly rates. Prices vary depending on the equipment and hire duration. Contact us on 07746 159 640 for a free, no-obligation quote tailored to your specific requirements."
    },
    {
      question: "Do you deliver equipment?",
      answer: "Yes! Delivery and collection is included within our local service area covering Hampshire, Surrey, and surrounding counties. We can arrange delivery further afield – just give us a call to discuss your location."
    },
    {
      question: "Do I need experience to hire equipment?",
      answer: "For self-drive hire, you'll need relevant experience and qualifications for certain machines. If you're not experienced, our operated hire service provides a CPCS-qualified operator along with the machinery – we do the work while you supervise."
    },
    {
      question: "What areas do you cover?",
      answer: "We're based locally and cover Hampshire, Surrey, West Sussex, and Berkshire. We regularly work further afield too – contact us with your postcode and we'll confirm availability in your area."
    },
    {
      question: "Are you insured?",
      answer: "Absolutely. We carry full public liability insurance and all our operators hold the necessary certifications and licences. We're happy to provide documentation on request."
    },
    {
      question: "How do I book equipment?",
      answer: "The quickest way is to call us on 07746 159 640 or send a WhatsApp message. We can usually confirm availability immediately and arrange delivery to suit your schedule."
    },
    {
      question: "Do you offer operated hire?",
      answer: "Yes, we provide experienced CPCS-qualified operators with our machinery. This is ideal if you need the job done but don't have the expertise or tickets to operate the equipment yourself."
    },
  ];

  // Structured data for FAQ schema
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <section id="faq" className="py-16 md:py-24 bg-secondary">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <span className="text-primary font-display uppercase tracking-wider text-sm">
            Got Questions?
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold mt-4 mb-4">
            Frequently Asked <span className="text-gradient">Questions</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about hiring equipment from TR8. Can't find your answer? Give us a call.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="border-border/50 bg-background/50 rounded-lg mb-3 px-6 border"
              >
                <AccordionTrigger className="text-left font-display font-semibold hover:no-underline hover:text-primary transition-colors">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            Still have questions? We're here to help.
          </p>
          <a 
            href="tel:07746159640" 
            className="inline-flex items-center gap-2 text-primary font-display font-bold text-xl hover:underline"
          >
            Call 07746 159 640
          </a>
        </div>
      </div>

      {/* FAQ Schema for SEO */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
    </section>
  );
};

export default FAQ;
