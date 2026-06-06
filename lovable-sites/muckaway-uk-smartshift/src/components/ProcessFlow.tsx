import { Camera, Brain, FileText, Truck, CheckCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

const steps = [
  {
    icon: Camera,
    title: "Upload Photo",
    description: "Take a photo of your spoil or waste material from your phone or site",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: Brain,
    title: "AI Classifies",
    description: "Our AI identifies material type, contamination risk, and EWC code automatically",
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    icon: FileText,
    title: "Instant Quote",
    description: "Get transparent pricing with disposal costs, haulage, and landfill tax breakdown",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: Truck,
    title: "Book Collection",
    description: "Schedule your muck away with compliant documentation generated automatically",
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    icon: CheckCircle,
    title: "Job Complete",
    description: "Track to completion with digital records for audit and compliance",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
];

export const ProcessFlow = () => {
  const { t } = useTranslation();

  return (
    <section className="py-20 bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            How It Works
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            From site photo to job completion in 5 simple steps. No paperwork, no confusion.
          </p>
        </div>

        <div className="relative max-w-5xl mx-auto">
          {/* Connection Line */}
          <div className="absolute top-16 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-accent to-green-500 hidden lg:block" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative group">
                {/* Step Number Badge */}
                <div className="absolute -top-3 -left-3 w-8 h-8 bg-foreground text-background rounded-full flex items-center justify-center font-bold text-sm z-10">
                  {index + 1}
                </div>

                <div className="bg-card border border-border rounded-xl p-6 h-full hover:shadow-elegant transition-all duration-300 hover:scale-105">
                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-xl ${step.bgColor} flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-300`}>
                    <step.icon className={`h-7 w-7 ${step.color}`} />
                  </div>

                  {/* Content */}
                  <h3 className="text-lg font-semibold text-foreground mb-2 text-center">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground text-center">
                    {step.description}
                  </p>
                </div>

                {/* Arrow for mobile */}
                {index < steps.length - 1 && (
                  <div className="flex justify-center my-4 lg:hidden">
                    <div className="w-0.5 h-8 bg-gradient-to-b from-primary to-accent" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
