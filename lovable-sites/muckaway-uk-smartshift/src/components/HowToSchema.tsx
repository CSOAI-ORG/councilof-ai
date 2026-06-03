import { Helmet } from "react-helmet-async";

interface HowToStep {
  name: string;
  text: string;
  image?: string;
  url?: string;
}

interface HowToSchemaProps {
  name: string;
  description: string;
  totalTime?: string; // ISO 8601 duration format, e.g., "PT15M" for 15 minutes
  estimatedCost?: {
    currency: string;
    value: string;
  };
  supply?: string[];
  tool?: string[];
  steps: HowToStep[];
  image?: string;
}

export const HowToSchema = ({
  name,
  description,
  totalTime = "PT5M",
  estimatedCost,
  supply,
  tool,
  steps,
  image
}: HowToSchemaProps) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": name,
    "description": description,
    "totalTime": totalTime,
    ...(image && { "image": { "@type": "ImageObject", "url": image } }),
    ...(estimatedCost && {
      "estimatedCost": {
        "@type": "MonetaryAmount",
        "currency": estimatedCost.currency,
        "value": estimatedCost.value
      }
    }),
    ...(supply && {
      "supply": supply.map(item => ({
        "@type": "HowToSupply",
        "name": item
      }))
    }),
    ...(tool && {
      "tool": tool.map(item => ({
        "@type": "HowToTool",
        "name": item
      }))
    }),
    "step": steps.map((step, index) => ({
      "@type": "HowToStep",
      "position": index + 1,
      "name": step.name,
      "text": step.text,
      ...(step.image && { "image": step.image }),
      ...(step.url && { "url": step.url })
    }))
  };

  // Speakable schema for voice search optimization
  const speakableSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "speakable": {
      "@type": "SpeakableSpecification",
      "cssSelector": [".speakable-content", "h1", ".how-to-step"]
    }
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(speakableSchema)}
      </script>
    </Helmet>
  );
};

// Pre-built schema for the main how-to flow
export const MuckAwayHowToSchema = () => (
  <HowToSchema
    name="How to Get an Instant Muck Away Quote with AI"
    description="Learn how to use MuckAway.ai's AI-powered platform to classify waste, get instant quotes, and generate compliant waste transfer notes in under 5 minutes."
    totalTime="PT5M"
    estimatedCost={{ currency: "GBP", value: "0" }}
    tool={[
      "Smartphone or computer",
      "Camera for waste photos",
      "MuckAway.ai account (free)"
    ]}
    supply={[
      "Photo of waste material",
      "Site address or postcode",
      "Estimated volume (optional - AI can estimate)"
    ]}
    steps={[
      {
        name: "Upload Photo of Waste",
        text: "Take a clear photo of your waste material and upload it to MuckAway.ai. Our AI will automatically identify the spoil type, contamination level, and EWC code.",
        url: "https://muckaway.ai/ai-tools"
      },
      {
        name: "AI Classification",
        text: "Within seconds, our AI analyzes your image and provides waste classification including soil type (clay, topsoil, hardcore, etc.), hazard level, and disposal requirements.",
        url: "https://muckaway.ai/ai-tools"
      },
      {
        name: "Get Instant Quote",
        text: "Based on the AI classification, volume, and your location, receive an instant quote including haulage, disposal fees, and any applicable landfill tax.",
        url: "https://muckaway.ai/pricing"
      },
      {
        name: "Generate Compliant WTN",
        text: "Automatically generate a legally compliant Waste Transfer Note with all required fields pre-filled, ready for digital signature.",
        url: "https://muckaway.ai/software"
      },
      {
        name: "Book Collection",
        text: "Select your preferred collection date and confirm the booking. Track your waste from collection to final disposal with real-time updates.",
        url: "https://muckaway.ai/dashboard"
      }
    ]}
    image="https://muckaway.ai/og-image.png"
  />
);
