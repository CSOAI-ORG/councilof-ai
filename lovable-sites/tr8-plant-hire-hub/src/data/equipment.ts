import miniExcavatorSite from "@/assets/mini-excavator-site.jpg";
import excavatorAction from "@/assets/excavator-action.jpg";
import diggerGroundwork from "@/assets/digger-groundwork.jpg";
import miniDiggerWork from "@/assets/mini-digger-work.jpg";
import brokkDemolition from "@/assets/brokk-demolition.jpg";
import plateCompactor from "@/assets/plate-compactor.jpg";
import cementMixer from "@/assets/cement-mixer.jpg";
import trackedDumper from "@/assets/tracked-dumper.jpg";
import excavatorTransport from "@/assets/excavator-transport.jpg";
import plantDelivery from "@/assets/plant-delivery.jpg";

export interface Equipment {
  id: string;
  name: string;
  category: string;
  image: string;
  description: string;
  specs: string[];
  priceFrom?: string;
}

export const equipmentCategories = [
  { id: "all", label: "All Equipment" },
  { id: "excavators", label: "Excavators & Diggers" },
  { id: "demolition", label: "Demolition" },
  { id: "compaction", label: "Compaction" },
  { id: "site-equipment", label: "Site Equipment" },
  { id: "transport", label: "Transport & Delivery" },
];

export const equipmentList: Equipment[] = [
  {
    id: "mini-excavator-1.5t",
    name: "Mini Excavator 1.5 Tonne",
    category: "excavators",
    image: miniExcavatorSite,
    description: "Compact and powerful micro digger, ideal for tight access sites and domestic groundworks.",
    specs: ["1.5t operating weight", "Expandable tracks", "Zero tail swing", "Rubber tracks available"],
    priceFrom: "From £100/day",
  },
  {
    id: "mini-excavator-3t",
    name: "Mini Excavator 3 Tonne",
    category: "excavators",
    image: excavatorAction,
    description: "Versatile mid-size excavator perfect for driveways, foundations, and landscaping projects.",
    specs: ["3t operating weight", "Quick hitch", "Multiple buckets available", "Cab or canopy"],
    priceFrom: "From £150/day",
  },
  {
    id: "micro-digger",
    name: "Micro Digger 0.8 Tonne",
    category: "excavators",
    image: diggerGroundwork,
    description: "Ultra-compact digger for extremely tight access work - fits through standard doorways.",
    specs: ["0.8t operating weight", "800mm width", "Retractable tracks", "Indoor use suitable"],
    priceFrom: "From £80/day",
  },
  {
    id: "mini-digger-2t",
    name: "Mini Digger 2 Tonne",
    category: "excavators",
    image: miniDiggerWork,
    description: "Popular choice for garden projects, drainage work, and small construction sites.",
    specs: ["2t operating weight", "Expandable undercarriage", "Dozer blade", "Quick coupler"],
    priceFrom: "From £120/day",
  },
  {
    id: "brokk-demolition",
    name: "Brokk Demolition Robot",
    category: "demolition",
    image: brokkDemolition,
    description: "Remote-controlled demolition machine for safe and precise internal demolition work.",
    specs: ["Remote controlled", "Hydraulic breaker", "Dust suppression", "Low vibration"],
    priceFrom: "POA",
  },
  {
    id: "plate-compactor",
    name: "Plate Compactor",
    category: "compaction",
    image: plateCompactor,
    description: "Essential for compacting sub-bases, driveways, and paving preparation.",
    specs: ["Wacker Neuson", "Forward & reversible", "Various sizes", "Low hand-arm vibration"],
    priceFrom: "From £40/day",
  },
  {
    id: "cement-mixer",
    name: "Cement Mixer",
    category: "site-equipment",
    image: cementMixer,
    description: "Reliable electric and petrol cement mixers for all mixing requirements.",
    specs: ["Electric or petrol", "Various drum sizes", "Tip-up mechanism", "Easy transport"],
    priceFrom: "From £25/day",
  },
  {
    id: "tracked-dumper",
    name: "Tracked Dumper",
    category: "site-equipment",
    image: trackedDumper,
    description: "High-tip tracked dumper for efficient material movement on site.",
    specs: ["500kg - 1 tonne capacity", "Tracked for stability", "Swivel skip option", "Low ground pressure"],
    priceFrom: "From £90/day",
  },
  {
    id: "equipment-transport",
    name: "Equipment Transport",
    category: "transport",
    image: excavatorTransport,
    description: "Professional delivery and collection service for all plant hire equipment.",
    specs: ["Local & nationwide", "Flexible scheduling", "Experienced operators", "Fully insured"],
    priceFrom: "From £50",
  },
  {
    id: "plant-delivery",
    name: "Plant Hire Delivery",
    category: "transport",
    image: plantDelivery,
    description: "Complete delivery service with our modern fleet of plant transporters.",
    specs: ["Same-day available", "Weekend delivery", "Site access assessment", "Professional drivers"],
    priceFrom: "From £50",
  },
];
