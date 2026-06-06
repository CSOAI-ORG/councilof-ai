import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronUp, Phone, Mail } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import Badge from "@/components/Badge";

const FAQ = () => {
  const [openFAQ, setOpenFAQ] = useState<number | null>(0);

  const faqCategories = [
    {
      category: "General Questions",
      questions: [
        {
          question: "What are your business hours?",
          answer: "We operate 24 hours a day, 7 days a week. This includes emergency call-outs for urgent waste removal requirements. Our office hours are Monday to Friday 8am-6pm, but our grab hire services are available around the clock."
        },
        {
          question: "Which areas do you cover?",
          answer: "We provide comprehensive grab hire and waste management services across Kent, London, and Essex. This includes all major towns and cities in these areas, with same-day or next-day service available depending on your location."
        },
        {
          question: "Are you licensed and insured?",
          answer: "Yes, we are fully licensed as a waste carrier with the Environment Agency and carry comprehensive public liability insurance. All our operators are professionally trained and our vehicles are regularly maintained and certified."
        },
        {
          question: "How quickly can you respond to requests?",
          answer: "We offer same-day service where possible, with next-day service guaranteed across all our coverage areas. For emergency situations, we can often respond within a few hours of your call."
        }
      ]
    },
    {
      category: "Grab Hire Questions", 
      questions: [
        {
          question: "What is the capacity of your grab lorries?",
          answer: "Our grab lorries have a capacity of up to 16 tons, which is equivalent to approximately 3 standard skip loads. This makes them highly cost-effective for larger waste removal projects."
        },
        {
          question: "How long can I hire a grab lorry for?",
          answer: "We offer flexible hire periods from hourly rates for quick jobs to full day rates for larger projects. Extended hire periods can be arranged for ongoing projects. Contact us to discuss your specific requirements."
        },
        {
          question: "Do I need a permit for grab hire?",
          answer: "No, you don't need a permit for grab hire services. Unlike skips that require permits when placed on public roads, our grab lorries collect waste directly from your site and leave immediately, eliminating permit requirements."
        },
        {
          question: "Can grab lorries access difficult areas?",
          answer: "Yes, one of the main advantages of grab hire is the ability to access difficult areas. Our grab lorries can reach over fences, walls, and obstacles, and can work in tight spaces where skips cannot be placed."
        }
      ]
    },
    {
      category: "Waste Removal Questions",
      questions: [
        {
          question: "What types of waste do you accept?",
          answer: "We accept most types of non-hazardous waste including soil, rubble, concrete, wood, metal, garden waste, and general construction debris. We cannot accept hazardous materials, asbestos, chemicals, or contaminated soils."
        },
        {
          question: "Do you recycle the waste you collect?",
          answer: "Yes, we are committed to environmental responsibility. We sort and recycle as much waste as possible at licensed facilities, diverting materials from landfill wherever feasible. We provide waste transfer notes as proof of responsible disposal."
        },
        {
          question: "Can you provide same-day waste removal?",
          answer: "Yes, subject to availability, we can provide same-day waste removal services. This is particularly useful for urgent situations or when you need to clear a site quickly for ongoing work."
        },
        {
          question: "What documentation do you provide?",
          answer: "We provide all necessary documentation including waste transfer notes, proof of disposal, and receipts for your records. This ensures full compliance with environmental regulations and provides audit trails for commercial customers."
        }
      ]
    }
  ];

  const allQuestions = faqCategories.flatMap((category, categoryIndex) => 
    category.questions.map((q, questionIndex) => ({
      ...q,
      id: categoryIndex * 100 + questionIndex,
      category: category.category
    }))
  );

  return (
    <>
      <SEOHead 
        title="FAQ | Grab Hire Questions | Waste Removal Help | GTS Grab Hire"
        description="Frequently asked questions about grab hire and waste removal services. Get answers about capacity, permits, pricing, and more. Professional advice from GTS Grab Hire."
        keywords="grab hire FAQ, waste removal questions, grab lorry capacity, permits, pricing, professional advice"
      />
      
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="hero-gradient text-white py-20">
          <div className="container mx-auto px-4 text-center">
            <Badge variant="yellow" className="mb-6">
              FAQ
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Frequently Asked Questions about Grab Hire and Waste Removal
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 max-w-4xl mx-auto leading-relaxed">
              Find answers to common questions about our services, pricing, and processes
            </p>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="section-padding section-gradient">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              {faqCategories.map((category, categoryIndex) => (
                <div key={categoryIndex} className="mb-12">
                  <h2 className="text-2xl font-bold text-[hsl(var(--gts-dark))] mb-6 border-b-2 border-[hsl(var(--gts-yellow))] pb-2">
                    {category.category}
                  </h2>
                  
                  <div className="space-y-4">
                    {category.questions.map((faq, questionIndex) => {
                      const faqId = categoryIndex * 100 + questionIndex;
                      const isOpen = openFAQ === faqId;
                      
                      return (
                        <Card key={questionIndex} className="bg-white shadow-[var(--shadow-card)] border-0">
                          <CardContent className="p-0">
                            <button
                              className="w-full p-6 text-left flex justify-between items-center hover:bg-[hsl(var(--gts-yellow))] hover:bg-opacity-10 transition-colors"
                              onClick={() => setOpenFAQ(isOpen ? null : faqId)}
                            >
                              <h3 className="text-lg font-semibold text-[hsl(var(--gts-dark))] pr-4">
                                {faq.question}
                              </h3>
                              {isOpen ? (
                                <ChevronUp className="w-5 h-5 text-[hsl(var(--gts-dark))] flex-shrink-0" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-[hsl(var(--gts-dark))] flex-shrink-0" />
                              )}
                            </button>
                            
                            {isOpen && (
                              <div className="px-6 pb-6">
                                <div className="border-t pt-4">
                                  <p className="text-gray-700 leading-relaxed">
                                    {faq.answer}
                                  </p>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Quick Facts Section */}
        <section className="section-padding bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-[hsl(var(--gts-dark))] mb-6">
                Quick Facts About GTS Grab Hire
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="text-center bg-[hsl(var(--gts-yellow))] bg-opacity-10 border-0">
                <CardContent className="p-6">
                  <h3 className="text-3xl font-bold text-[hsl(var(--gts-dark))] mb-2">35+</h3>
                  <p className="text-gray-700 font-medium">Years Experience</p>
                </CardContent>
              </Card>
              
              <Card className="text-center bg-[hsl(var(--gts-yellow))] bg-opacity-10 border-0">
                <CardContent className="p-6">
                  <h3 className="text-3xl font-bold text-[hsl(var(--gts-dark))] mb-2">18</h3>
                  <p className="text-gray-700 font-medium">Tonne Capacity</p>
                </CardContent>
              </Card>
              
              <Card className="text-center bg-[hsl(var(--gts-navy))] bg-opacity-10 border-0">
                <CardContent className="p-6">
                  <h3 className="text-3xl font-bold text-[hsl(var(--gts-dark))] mb-2">24/7</h3>
                  <p className="text-gray-700 font-medium">Service Available</p>
                </CardContent>
              </Card>
              
              <Card className="text-center section-gradient border-0">
                <CardContent className="p-6">
                  <h3 className="text-3xl font-bold text-[hsl(var(--gts-dark))] mb-2">3</h3>
                  <p className="text-gray-700 font-medium">Regions Covered</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Still Have Questions CTA */}
        <section className="hero-gradient text-white py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Still Have Questions?
            </h2>
            <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
              Can't find the answer you're looking for? Our friendly team is here to help with any questions about our grab hire and waste management services.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button asChild variant="cta" size="lg">
                <Link to="/contact">Contact Us</Link>
              </Button>
              <Button asChild variant="outlineWhite" size="lg">
                <a href="tel:07956222691">
                  <Phone className="mr-2 w-5 h-5" />
                  Call: 07956 222 691
                </a>
              </Button>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center text-gray-300">
              <div className="flex items-center">
                <Phone className="w-4 h-4 mr-2" />
                <span>Available 24/7 for urgent requests</span>
              </div>
              <div className="flex items-center">
                <Mail className="w-4 h-4 mr-2" />
                <span>Response within 24 hours</span>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </>
  );
};

export default FAQ;