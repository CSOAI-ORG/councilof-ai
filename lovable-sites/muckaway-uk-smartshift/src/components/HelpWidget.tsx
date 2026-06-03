import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, ChevronDown, MessageCircle, Book, Video } from "lucide-react";

interface HelpItem {
  question: string;
  answer: string;
  category: string;
}

interface HelpWidgetProps {
  title?: string;
  contextualHelp?: HelpItem[];
  position?: "bottom-right" | "bottom-left" | "inline";
}

const defaultHelp: HelpItem[] = [
  {
    question: "How do I upload waste images?",
    answer: "Click the upload area or drag and drop images directly. Our AI analyzes them instantly.",
    category: "ai-tools"
  },
  {
    question: "What information do I need for a quote?",
    answer: "Just the location and waste type. Our AI can identify waste from photos if you're unsure.",
    category: "getting-started"
  },
  {
    question: "Is my data secure?",
    answer: "Yes, all data is encrypted and we're fully GDPR compliant with Environment Agency approval.",
    category: "compliance"
  }
];

const HelpWidget = ({ 
  title = "Quick Help", 
  contextualHelp = defaultHelp,
  position = "inline"
}: HelpWidgetProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleItem = (question: string) => {
    setExpandedItems(prev => 
      prev.includes(question) 
        ? prev.filter(item => item !== question)
        : [...prev, question]
    );
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "ai-tools": return "bg-emerald-500";
      case "getting-started": return "bg-blue-500";
      case "compliance": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const baseClasses = position === "inline" 
    ? "w-full" 
    : `fixed ${position === "bottom-right" ? "bottom-4 right-4" : "bottom-4 left-4"} w-80 z-50`;

  if (position !== "inline") {
    return (
      <div className={baseClasses}>
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="mb-2 rounded-full w-12 h-12 shadow-lg"
          size="icon"
        >
          <HelpCircle className="h-6 w-6" />
        </Button>
        
        {isOpen && (
          <Card className="shadow-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <HelpCircle className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{title}</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-6 w-6 p-0"
                >
                  ×
                </Button>
              </div>
              <CardDescription>
                Common questions and quick answers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 max-h-60 overflow-y-auto">
              {contextualHelp.map((item, index) => (
                <Collapsible key={index}>
                  <CollapsibleTrigger
                    onClick={() => toggleItem(item.question)}
                    className="flex items-center justify-between w-full p-2 text-left rounded hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center space-x-2 flex-1">
                      <div className={`w-2 h-2 rounded-full ${getCategoryColor(item.category)}`} />
                      <span className="text-sm font-medium">{item.question}</span>
                    </div>
                    <ChevronDown className={`h-4 w-4 transition-transform ${
                      expandedItems.includes(item.question) ? "rotate-180" : ""
                    }`} />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="px-4 pb-2">
                    <p className="text-sm text-muted-foreground">{item.answer}</p>
                  </CollapsibleContent>
                </Collapsible>
              ))}
              
              <div className="pt-2 border-t space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Chat with AI Support
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Book className="h-4 w-4 mr-2" />
                  View Full FAQ
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <Card className={baseClasses}>
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-2">
          <HelpCircle className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
        <CardDescription>
          Common questions for this section
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {contextualHelp.slice(0, 3).map((item, index) => (
          <Collapsible key={index}>
            <CollapsibleTrigger
              onClick={() => toggleItem(item.question)}
              className="flex items-center justify-between w-full p-2 text-left rounded hover:bg-muted transition-colors"
            >
              <div className="flex items-center space-x-2 flex-1">
                <Badge variant="secondary" className="text-xs">
                  {item.category.replace("-", " ")}
                </Badge>
                <span className="text-sm font-medium">{item.question}</span>
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform ${
                expandedItems.includes(item.question) ? "rotate-180" : ""
              }`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="px-2 pb-2">
              <p className="text-sm text-muted-foreground">{item.answer}</p>
            </CollapsibleContent>
          </Collapsible>
        ))}
        
        <div className="pt-2 border-t">
          <Button variant="outline" size="sm" className="w-full">
            <Book className="h-4 w-4 mr-2" />
            View All FAQs
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default HelpWidget;