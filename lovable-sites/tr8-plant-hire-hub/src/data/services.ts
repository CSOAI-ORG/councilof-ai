import { Hammer, Truck, Shield, Wrench, HardHat, Shovel } from "lucide-react";

export interface Service {
  id: string;
  title: string;
  shortDescription: string;
  description: string;
  icon: typeof Hammer;
  href: string;
  features: string[];
  image?: string;
}

export const services: Service[] = [
  {
    id: "plant-hire",
    title: "Plant Hire",
    shortDescription: "Quality machinery for any project, from mini diggers to tracked dumpers.",
    description: "Our comprehensive plant hire service provides top-quality machinery for projects of all sizes. Whether you need a compact mini excavator for a garden project or heavy-duty equipment for commercial work, we have the fleet to match your requirements.",
    icon: Truck,
    href: "/services/plant-hire",
    features: [
      "Wide range of excavators (0.8T to 8T)",
      "Tracked dumpers and carriers",
      "Cement mixers and compactors",
      "Flexible hire periods",
      "Competitive rates",
      "Delivery and collection included"
    ]
  },
  {
    id: "demolition",
    title: "Demolition",
    shortDescription: "Specialist demolition services with Brokk robots for precision work.",
    description: "We specialise in controlled demolition using state-of-the-art Brokk demolition robots. This allows us to work in confined spaces and sensitive environments with precision and safety that traditional methods cannot match.",
    icon: Hammer,
    href: "/services/demolition",
    features: [
      "Brokk robotic demolition",
      "Internal strip-outs",
      "Structural demolition",
      "Confined space specialists",
      "Fully insured and certified",
      "Waste management included"
    ]
  },
  {
    id: "asbestos-removal",
    title: "Asbestos Removal",
    shortDescription: "Licensed and certified safe removal and disposal of asbestos materials.",
    description: "Our licensed asbestos removal team handles all types of asbestos-containing materials safely and in full compliance with regulations. We provide surveys, removal, and proper disposal to protect your health and property.",
    icon: Shield,
    href: "/services/asbestos-removal",
    features: [
      "Licensed removal contractors",
      "Full surveys and testing",
      "Safe disposal certification",
      "Compliance with all regulations",
      "Residential and commercial",
      "Emergency callout available"
    ]
  },
  {
    id: "equipment-hire",
    title: "Equipment Hire",
    shortDescription: "Self-drive equipment hire with delivery across the region.",
    description: "Hire our well-maintained equipment for your DIY or professional projects. All machinery is serviced regularly and comes with full operating instructions. We offer flexible hire periods to suit your needs.",
    icon: Wrench,
    href: "/equipment-hire",
    features: [
      "Self-drive options available",
      "Full training provided",
      "Daily, weekly, and monthly rates",
      "Well-maintained machinery",
      "Quick delivery service",
      "Technical support included"
    ]
  },
  {
    id: "operated-hire",
    title: "Operated Hire",
    shortDescription: "Experienced operators supplied with all machinery for peace of mind.",
    description: "Take the stress out of your project with our operated hire service. Our experienced and qualified operators work with you to get the job done efficiently and safely, whether it's excavation, demolition, or groundworks.",
    icon: HardHat,
    href: "/services/operated-hire",
    features: [
      "Skilled CPCS operators",
      "All certifications included",
      "Flexible scheduling",
      "Project management support",
      "Health & safety compliant",
      "All machinery types covered"
    ]
  },
  {
    id: "groundworks",
    title: "Groundworks",
    shortDescription: "Complete groundworks solutions from site clearance to foundations.",
    description: "From initial site clearance to finished foundations, our groundworks team handles all aspects of your project. We work on residential extensions, new builds, and commercial developments with the same attention to detail.",
    icon: Shovel,
    href: "/services/groundworks",
    features: [
      "Site clearance",
      "Excavation and earthworks",
      "Foundations and footings",
      "Drainage installation",
      "Hard landscaping",
      "Driveways and patios"
    ]
  }
];

export const getServiceById = (id: string): Service | undefined => {
  return services.find(service => service.id === id);
};
