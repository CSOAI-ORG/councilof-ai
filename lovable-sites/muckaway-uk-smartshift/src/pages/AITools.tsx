import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Camera, MessageSquare, BarChart3, FileText, Zap, Mic } from "lucide-react";
import { RevolutionaryImageAnalyzer } from "@/components/RevolutionaryImageAnalyzer";
import VoiceInterface from "@/components/VoiceInterface";
import { SmartChatbot } from "@/components/SmartChatbot";
import imageAnalysisImage from "@/assets/image-analysis.jpg";
import voiceInterfaceImage from "@/assets/voice-interface.jpg";
import aiChatbotImage from "@/assets/ai-chatbot.jpg";
import { Link } from "react-router-dom";

const AITools = () => {
  const tools = [
    {
      icon: <Brain className="h-8 w-8" />,
      title: "Revolutionary Image Analysis",
      description: "Upload multiple images for instant AI-powered batch analysis with risk assessment",
      features: ["Batch processing", "99.9% accuracy", "Risk assessment", "Visual mapping"],
      badge: "Revolutionary",
      component: "analyzer"
    },
    {
      icon: <Mic className="h-8 w-8" />,
      title: "Voice AI Assistant",
      description: "Talk to our AI for instant quotes, spoil classification, and job booking",
      features: ["Voice commands", "Real-time responses", "Hands-free operation"],
      badge: "Game Changer",
      component: "voice"
    },
    {
      icon: <MessageSquare className="h-8 w-8" />,
      title: "Super-Intelligent Chatbot",
      description: "Advanced AI with complete waste management expertise and tool calling",
      features: ["Expert knowledge", "Tool integration", "Context awareness"],
      badge: "Enhanced",
      component: "chatbot"
    },
    {
      icon: <Camera className="h-8 w-8" />,
      title: "Weighbridge OCR",
      description: "Extract weight data from weighbridge tickets using optical character recognition",
      features: ["Instant processing", "Multiple formats", "Confidence scoring"],
      badge: "Time Saver"
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: "Predictive Analytics",
      description: "Forecast maintenance needs and optimize fleet performance",
      features: ["Predictive maintenance", "Cost optimization", "Performance insights"],
      badge: "Pro Feature"
    },
    {
      icon: <FileText className="h-8 w-8" />,
      title: "Smart Automation",
      description: "Automate routine tasks and streamline workflows",
      features: ["Workflow automation", "Smart routing", "Error reduction"],
      badge: "Efficiency"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              AI-Powered Tools for Waste Management
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover how artificial intelligence transforms waste management operations with cutting-edge tools designed for efficiency, accuracy, and compliance.
            </p>
          </div>

          <Tabs defaultValue="overview" className="mb-16">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto gap-1 p-1">
              <TabsTrigger value="overview" className="py-2.5">Overview</TabsTrigger>
              <TabsTrigger value="analyzer" className="py-2.5">Image Analysis</TabsTrigger>
              <TabsTrigger value="voice" className="py-2.5">Voice AI</TabsTrigger>
              <TabsTrigger value="chatbot" className="py-2.5">AI Assistant</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-8">
              {/* Hero Visual Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <Card className="relative overflow-hidden group">
                  <div className="relative h-40">
                    <img 
                      src={imageAnalysisImage} 
                      alt="Revolutionary Image Analysis" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent"></div>
                  </div>
                  <CardHeader className="absolute bottom-0 left-0 right-0">
                    <Badge className="w-fit mb-2 bg-primary">Revolutionary</Badge>
                    <CardTitle className="text-lg text-foreground">Image Analysis</CardTitle>
                    <CardDescription className="text-foreground/80 text-sm">
                      Batch photo processing with AI
                    </CardDescription>
                  </CardHeader>
                </Card>
                
                <Card className="relative overflow-hidden group">
                  <div className="relative h-40">
                    <img 
                      src={voiceInterfaceImage} 
                      alt="Voice AI Assistant" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent"></div>
                  </div>
                  <CardHeader className="absolute bottom-0 left-0 right-0">
                    <Badge className="w-fit mb-2 bg-accent">Game Changer</Badge>
                    <CardTitle className="text-lg text-foreground">Voice AI</CardTitle>
                    <CardDescription className="text-foreground/80 text-sm">
                      Talk to AI for instant quotes
                    </CardDescription>
                  </CardHeader>
                </Card>
                
                <Card className="relative overflow-hidden group">
                  <div className="relative h-40">
                    <img 
                      src={aiChatbotImage} 
                      alt="AI Assistant" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent"></div>
                  </div>
                  <CardHeader className="absolute bottom-0 left-0 right-0">
                    <Badge className="w-fit mb-2 bg-primary/80">Enhanced</Badge>
                    <CardTitle className="text-lg text-foreground">AI Assistant</CardTitle>
                    <CardDescription className="text-foreground/80 text-sm">
                      Expert knowledge & tool integration
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {tools.map((tool, index) => (
                  <Card key={index} className="h-full hover:shadow-elegant transition-all duration-300 group">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-primary/10 rounded-xl text-primary group-hover:bg-primary/20 transition-colors duration-300">
                            {tool.icon}
                          </div>
                          <div>
                            <CardTitle className="text-xl">{tool.title}</CardTitle>
                            <Badge variant={tool.badge === "Revolutionary" || tool.badge === "Game Changer" ? "default" : "secondary"} className="mt-1">
                              {tool.badge}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <CardDescription className="text-base mt-3">
                        {tool.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {tool.features.map((feature, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="analyzer" className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-4">Revolutionary Image Analysis Engine</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Upload multiple images for AI-powered batch analysis with advanced risk assessment and visual mapping capabilities.
                </p>
              </div>
              <RevolutionaryImageAnalyzer />
            </TabsContent>

            <TabsContent value="voice" className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-4">Voice AI Assistant</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Experience hands-free waste management with our revolutionary voice AI that handles quotes, classifications, and bookings.
                </p>
              </div>
              <div className="max-w-2xl mx-auto">
                <VoiceInterface 
                  onSpeakingChange={(speaking) => console.log('Speaking:', speaking)}
                  onQuoteGenerated={(quote) => console.log('Quote generated:', quote)}
                />
              </div>
            </TabsContent>

            <TabsContent value="chatbot" className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-4">Super-Intelligent AI Assistant</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Chat with our enhanced AI assistant equipped with complete waste management expertise and advanced tool calling capabilities.
                </p>
              </div>
              <div className="max-w-2xl mx-auto">
                <SmartChatbot />
              </div>
            </TabsContent>
          </Tabs>

          <div className="bg-muted/50 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-semibold mb-4">Ready to Transform Your Operations?</h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Our AI tools are designed to integrate seamlessly with your existing workflows, 
              providing immediate value while ensuring compliance with industry regulations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="action" size="lg" asChild>
                <Link to="/subscribe">Start Free Trial</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/contact">Schedule Demo</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AITools;