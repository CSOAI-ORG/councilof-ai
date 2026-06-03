import { useState, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, HelpCircle, Zap, Shield, CreditCard, Settings, Code } from "lucide-react";

const FAQ = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const faqCategories = [
    {
      id: "getting-started",
      title: "Getting Started",
      icon: <HelpCircle className="h-5 w-5" />,
      color: "bg-blue-500",
      faqs: [
        {
          question: "How do I get started with MuckAway.ai?",
          answer: "Simply sign up for an account, complete the quick setup wizard, and you'll be ready to create your first job. Our AI will guide you through each step of the process."
        },
        {
          question: "What information do I need to provide for a waste removal quote?",
          answer: "You'll need the location, type of waste (our AI can help identify this), estimated volume, and any specific requirements. Our voice interface can capture this information naturally."
        },
        {
          question: "How accurate is the AI spoil classification?",
          answer: "Our AI classification system is 98.5% accurate, trained on thousands of UK waste samples. It instantly identifies soil types, contamination levels, and disposal requirements."
        },
        {
          question: "Can I track my vehicles in real-time?",
          answer: "Yes! Our fleet management system provides live GPS tracking, route optimization, and maintenance alerts for all your vehicles."
        }
      ]
    },
    {
      id: "waste-transfer-notes",
      title: "Waste Transfer Notes (WTN)",
      icon: <Shield className="h-5 w-5" />,
      color: "bg-green-500",
      faqs: [
        {
          question: "How long do I need to keep waste transfer notes?",
          answer: "In the UK, you must keep waste transfer notes for at least 2 years (or 3 years for hazardous waste consignment notes). MuckAway.ai automatically stores all your WTNs digitally with secure cloud backup, ensuring compliance and easy retrieval during Environment Agency audits."
        },
        {
          question: "What is a digital waste transfer note?",
          answer: "A digital waste transfer note (DWTN) is an electronic version of the traditional paper WTN. It contains all legally required information including waste description, EWC codes, carrier details, and signatures. Digital WTNs are legally valid in the UK and offer benefits like instant sharing, automatic archiving, and easier audit trails."
        },
        {
          question: "What information must be on a waste transfer note?",
          answer: "A compliant WTN must include: description of waste, quantity, EWC code, SIC code, producer/holder details, carrier details (including waste carrier licence number), destination facility details, transfer date, and signatures. MuckAway.ai auto-fills most fields using AI classification."
        },
        {
          question: "Can MuckAway.ai generate hazardous waste consignment notes?",
          answer: "Yes, our platform generates fully compliant hazardous waste consignment notes with all required sections including hazard codes, physical form, container type, and the full chain of custody signatures required by UK regulations."
        }
      ]
    },
    {
      id: "waste-carrier-licence",
      title: "Waste Carrier Licence",
      icon: <Shield className="h-5 w-5" />,
      color: "bg-amber-500",
      faqs: [
        {
          question: "What is a waste carrier licence and do I need one?",
          answer: "A waste carrier licence is required by anyone who transports controlled waste in the UK as part of their business. There are two tiers: Upper Tier (for those carrying others' waste as their main business) and Lower Tier (for those who only carry their own waste). MuckAway.ai automatically verifies carrier licences to ensure compliance."
        },
        {
          question: "How do I check if a waste carrier licence is valid?",
          answer: "You can check licence validity on the Environment Agency public register, or use MuckAway.ai's built-in licence verification which automatically checks carrier credentials when creating jobs, protecting you from using unlicensed operators."
        },
        {
          question: "What happens if I use an unlicensed waste carrier?",
          answer: "Using an unlicensed carrier is a criminal offence under the Environmental Protection Act 1990. You could face unlimited fines and prosecution. As the waste producer, you remain legally responsible for your waste even after it leaves your site - this is called Duty of Care."
        }
      ]
    },
    {
      id: "ai-tools",
      title: "AI Tools & Features",
      icon: <Zap className="h-5 w-5" />,
      color: "bg-emerald-500",
      faqs: [
        {
          question: "How does AI waste classification work?",
          answer: "Our AI analyzes photos of waste materials using computer vision trained on thousands of UK soil and waste samples. It identifies material type (clay, topsoil, hardcore, contaminated soil), estimates volume, detects contamination indicators, and suggests appropriate EWC codes - all in under 3 seconds."
        },
        {
          question: "What can I do with the Voice Interface?",
          answer: "Create jobs, check status, get pricing, and manage your fleet using natural speech. Just speak normally and our AI understands context and intent."
        },
        {
          question: "How intelligent is the AI Chatbot?",
          answer: "Our chatbot has comprehensive knowledge of UK waste regulations, pricing, logistics, and can handle complex multi-step processes. It learns from each interaction to provide better responses."
        },
        {
          question: "Can the AI handle hazardous waste classification?",
          answer: "Absolutely. Our AI is trained on UK hazardous waste regulations and can identify restricted materials, generate proper documentation, and recommend appropriate disposal methods."
        }
      ]
    },
    {
      id: "muck-away-services",
      title: "Muck Away Services",
      icon: <HelpCircle className="h-5 w-5" />,
      color: "bg-indigo-500",
      faqs: [
        {
          question: "What is muck away and how much does it cost?",
          answer: "Muck away refers to the removal and disposal of excavated soil, clay, and construction waste from building sites. Costs typically range from £15-50 per tonne depending on material type, contamination level, and distance to disposal site. MuckAway.ai provides instant AI-powered quotes based on these factors."
        },
        {
          question: "How do I find muck away near me?",
          answer: "MuckAway.ai connects you with verified waste carriers across the UK. Simply enter your postcode and waste details, and our AI matches you with licensed operators in your area, providing instant quotes and availability."
        },
        {
          question: "What types of spoil can be removed?",
          answer: "We handle all types of construction spoil including: topsoil, subsoil, clay, sand, gravel, hardcore/rubble, mixed demolition waste, and contaminated soils. Our AI classification helps identify material types for accurate pricing and compliant disposal."
        },
        {
          question: "Can you handle same-day muck away collection?",
          answer: "Yes, subject to availability. Many of our partnered carriers offer same-day collection for urgent jobs. Use our AI quote system to check real-time availability in your area."
        }
      ]
    },
    {
      id: "compliance",
      title: "Compliance & Legal",
      icon: <Shield className="h-5 w-5" />,
      color: "bg-red-500",
      faqs: [
        {
          question: "Are your waste transfer notes legally compliant?",
          answer: "Yes, all our documentation meets UK waste regulations and Environment Agency requirements. We automatically generate compliant WTNs and hazardous consignment notes."
        },
        {
          question: "How do you handle data protection and GDPR?",
          answer: "We're fully GDPR compliant with end-to-end encryption, data minimization, and clear consent processes. All personal data is processed securely and deleted when no longer needed."
        },
        {
          question: "What is Duty of Care in waste management?",
          answer: "Duty of Care is your legal responsibility under the Environmental Protection Act 1990 to ensure waste is handled correctly from creation to final disposal. This includes using licensed carriers, completing waste transfer notes, and ensuring waste goes to authorized facilities. MuckAway.ai automates Duty of Care compliance."
        },
        {
          question: "How do you ensure duty of care compliance?",
          answer: "Our system automatically tracks the complete waste journey, maintains proper documentation, and ensures all legal requirements are met from collection to final disposal."
        }
      ]
    },
    {
      id: "billing",
      title: "Billing & Pricing",
      icon: <CreditCard className="h-5 w-5" />,
      color: "bg-purple-500",
      faqs: [
        {
          question: "How is pricing calculated?",
          answer: "Our AI analyzes waste type, volume, location, and disposal requirements to provide instant, accurate pricing. Factors include transport costs, disposal fees, and any special handling requirements."
        },
        {
          question: "What is landfill tax and how much is it?",
          answer: "Landfill tax is a UK government levy on waste sent to landfill. As of 2024, the standard rate is £103.70 per tonne for active waste, and £3.25 per tonne for inactive/inert waste. MuckAway.ai automatically calculates and includes applicable landfill tax in all quotes."
        },
        {
          question: "Are there any hidden fees?",
          answer: "No hidden fees. Our transparent pricing includes all costs upfront: collection, transport, disposal, and documentation. The price you see is the price you pay."
        },
        {
          question: "What payment methods do you accept?",
          answer: "We accept all major credit cards, bank transfers, and can set up corporate accounts with monthly billing for regular customers."
        }
      ]
    },
    {
      id: "technical",
      title: "Technical Support",
      icon: <Settings className="h-5 w-5" />,
      color: "bg-orange-500",
      faqs: [
        {
          question: "What if I have technical issues with the platform?",
          answer: "Our support team is available 24/7 via live chat, email, or phone. Most issues are resolved within 15 minutes during business hours."
        },
        {
          question: "Is there mobile app support?",
          answer: "Yes! Our progressive web app works seamlessly on all devices and can be installed on your phone for offline access to essential features."
        },
        {
          question: "How do I integrate with my existing systems?",
          answer: "We offer RESTful APIs and webhooks for seamless integration with your ERP, accounting, or project management systems. Full documentation is available."
        },
        {
          question: "What browsers are supported?",
          answer: "All modern browsers including Chrome, Firefox, Safari, and Edge. We recommend keeping your browser updated for the best experience."
        }
      ]
    },
    {
      id: "integration",
      title: "Integration & API",
      icon: <Code className="h-5 w-5" />,
      color: "bg-cyan-500",
      faqs: [
        {
          question: "Do you offer API access?",
          answer: "Yes! Our comprehensive REST API allows you to integrate waste management directly into your existing workflows. Full documentation and SDKs are available."
        },
        {
          question: "Can I automate job creation?",
          answer: "Absolutely. Use our API to automatically create jobs from your project management system, with AI handling classification and pricing."
        },
        {
          question: "Is webhook support available?",
          answer: "Yes, we support webhooks for real-time updates on job status, vehicle locations, and completion notifications to keep your systems synchronized."
        },
        {
          question: "What data formats do you support?",
          answer: "We support JSON, XML, and CSV formats for data exchange, with flexible field mapping to match your existing data structures."
        }
      ]
    }
  ];

  const filteredCategories = faqCategories.map(category => ({
    ...category,
    faqs: category.faqs.filter(faq => 
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.faqs.length > 0);

  // Generate FAQPage JSON-LD Schema for SEO/AEO
  const faqSchema = useMemo(() => {
    const allFaqs = faqCategories.flatMap(category => category.faqs);
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": allFaqs.map(faq => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer
        }
      }))
    };
  }, []);

  // BreadcrumbList Schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://muckaway.ai"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "FAQ",
        "item": "https://muckaway.ai/faq"
      }
    ]
  };

  return (
    <>
      <Helmet>
        <title>FAQ - Frequently Asked Questions | MuckAway.ai</title>
        <meta name="description" content="Find answers to common questions about MuckAway.ai's AI-powered waste management platform. Learn about our features, pricing, compliance, and technical support." />
        <meta name="keywords" content="muckaway faq, waste management questions, digital waste transfer notes, AI waste classification, construction waste compliance" />
        <link rel="canonical" href="https://muckaway.ai/faq" />
        <script type="application/ld+json">
          {JSON.stringify(faqSchema)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
      </Helmet>
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Frequently Asked Questions
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Find answers to common questions about MuckAway.ai. Can't find what you're looking for? Our AI chatbot is here to help 24/7.
            </p>
            
            {/* Search Bar */}
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search FAQs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Categories */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid gap-8">
            {filteredCategories.map((category) => (
              <Card key={category.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${category.color} text-white`}>
                      {category.icon}
                    </div>
                    <div>
                      <CardTitle className="text-2xl">{category.title}</CardTitle>
                      <CardDescription>
                        <Badge variant="secondary">{category.faqs.length} questions</Badge>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {category.faqs.map((faq, index) => (
                      <AccordionItem key={index} value={`${category.id}-${index}`}>
                        <AccordionTrigger className="text-left">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredCategories.length === 0 && (
            <div className="text-center py-16">
              <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No results found</h3>
              <p className="text-muted-foreground mb-6">
                Try adjusting your search terms or browse our categories above.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Contact Support */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Still need help?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Our support team is available 24/7 to assist you with any questions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="#" 
              className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Start Live Chat
            </a>
            <a 
              href="mailto:support@muckaway.ai" 
              className="inline-flex items-center justify-center px-6 py-3 border border-border rounded-lg hover:bg-muted transition-colors"
            >
              Email Support
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
    </>
  );
};

export default FAQ;