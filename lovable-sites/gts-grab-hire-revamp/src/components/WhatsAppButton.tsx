import React from 'react';
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

interface WhatsAppButtonProps {
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "cta";
}

const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({ 
  className = "", 
  size = "default",
  variant = "cta"
}) => {
  return (
    <Button 
      asChild 
      size={size} 
      variant={variant}
      className={`${className} shadow-lg`}
    >
      <a 
        href="https://wa.me/447956222691" 
        className="flex items-center gap-2"
        target="_blank"
        rel="noopener noreferrer"
      >
        <MessageCircle className="w-4 h-4" />
        WhatsApp
      </a>
    </Button>
  );
};

export default WhatsAppButton;