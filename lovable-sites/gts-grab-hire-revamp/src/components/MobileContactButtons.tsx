import React from 'react';
import { Button } from "@/components/ui/button";
import { Phone, MessageCircle, Mail } from "lucide-react";

const MobileContactButtons = () => {
  return (
    <div className="fixed bottom-4 right-4 z-50 md:hidden flex flex-col gap-2">
      {/* Emergency Contact */}
      <Button 
        asChild 
        size="sm" 
        className="bg-red-600 hover:bg-red-700 text-white shadow-lg"
      >
        <a href="tel:07956222691" className="flex items-center gap-2">
          <Phone className="w-4 h-4" />
          Emergency
        </a>
      </Button>
      
      {/* WhatsApp */}
      <Button 
        asChild 
        size="sm" 
        variant="cta"
        className="shadow-lg"
      >
        <a href="https://wa.me/447956222691" className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4" />
          WhatsApp
        </a>
      </Button>
      
      {/* Call for Quote */}
      <Button 
        asChild 
        size="sm" 
        variant="outline"
        className="bg-white shadow-lg border-[hsl(var(--gts-yellow))] border-2"
      >
        <a href="tel:07958710548" className="flex items-center gap-2">
          <Phone className="w-4 h-4" />
          Quote
        </a>
      </Button>
      
      {/* Email */}
      <Button 
        asChild 
        size="sm" 
        variant="ghost"
        className="bg-white/90 shadow-lg"
      >
        <a href="mailto:contact@gtsgrabhire.co.uk" className="flex items-center gap-2">
          <Mail className="w-4 h-4" />
          Email
        </a>
      </Button>
    </div>
  );
};

export default MobileContactButtons;