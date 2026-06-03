export interface Testimonial {
  name: string;
  company: string;
  role: string;
  content: string;
  rating: number;
  project: string;
  avatar?: string;
}

// Using fictional/anonymized company names to avoid implying partnerships
export const REGIONAL_TESTIMONIALS: Record<string, Testimonial[]> = {
  UK: [
    {
      name: "James P.",
      company: "Regional Construction Ltd",
      role: "Managing Director",
      content: "MuckAway.ai has transformed how we handle spoil removal. The AI classification saves us hours of paperwork and the DWT integration means we're always compliant.",
      rating: 5,
      project: "Thames Development"
    },
    {
      name: "Sarah M.",
      company: "Earthworks Services Co",
      role: "Operations Manager",
      content: "The instant pricing and automated waste transfer notes have cut our admin time in half. Brilliant for busy sites.",
      rating: 5,
      project: "Infrastructure Works"
    },
    {
      name: "David T.",
      company: "Northern Groundworks Ltd",
      role: "Site Manager",
      content: "Finally, a platform that understands the muck away business. The mobile app is perfect for our drivers.",
      rating: 5,
      project: "Airport Extension"
    }
  ],
  US: [
    {
      name: "Mike R.",
      company: "Excavation Services Inc",
      role: "President",
      content: "MuckAway.ai handles all our RCRA compliance paperwork automatically. The EPA manifest integration is a game-changer for our hazmat jobs.",
      rating: 5,
      project: "Metro Extension"
    },
    {
      name: "Jennifer W.",
      company: "Heavy Civil Contractors",
      role: "Project Manager",
      content: "We've reduced our disposal costs significantly since switching to MuckAway. The AI identifies recycling opportunities we were missing.",
      rating: 5,
      project: "Commercial Development"
    },
    {
      name: "Tom B.",
      company: "Hauling Services LLC",
      role: "Owner",
      content: "The instant quotes feature lets us bid on jobs faster than any competitor. We've grown substantially this year.",
      rating: 5,
      project: "Airport Runway"
    }
  ],
  AU: [
    {
      name: "Steve O.",
      company: "Civil Contractors Pty Ltd",
      role: "Director",
      content: "MuckAway.ai understands Australian waste levies and state EPA requirements. It's saved us from costly compliance mistakes.",
      rating: 5,
      project: "Metro West"
    },
    {
      name: "Michelle C.",
      company: "Excavations & Earthmoving",
      role: "Operations Director",
      content: "The chain of responsibility tracking gives us peace of mind. Every load is documented from site to tip.",
      rating: 5,
      project: "Airport Rail"
    },
    {
      name: "Bruce W.",
      company: "Earthmoving Solutions",
      role: "Managing Director",
      content: "Best investment we've made. The AI classification is spot-on for identifying contaminated material.",
      rating: 5,
      project: "Cross River Rail"
    }
  ],
  CA: [
    {
      name: "Pierre L.",
      company: "Excavation Services",
      role: "President",
      content: "MuckAway.ai handles both provincial and federal requirements seamlessly. The bilingual support is excellent.",
      rating: 5,
      project: "Transit Extension"
    },
    {
      name: "Karen M.",
      company: "Heavy Industries Inc",
      role: "VP Operations",
      content: "The carbon tax reporting integration saves us weeks of work each quarter. Highly recommended.",
      rating: 5,
      project: "Transit Expansion"
    },
    {
      name: "Ryan S.",
      company: "Demolition Services",
      role: "Owner",
      content: "From demolition debris to clean fill, MuckAway classifies everything correctly. No more guessing games.",
      rating: 5,
      project: "Rapid Transit"
    }
  ],
  NZ: [
    {
      name: "Grant T.",
      company: "Civil Contractors Ltd",
      role: "Director",
      content: "MuckAway.ai understands NZ waste minimisation requirements. The RMA consent tracking is invaluable.",
      rating: 5,
      project: "City Rail Link"
    },
    {
      name: "Emma W.",
      company: "Contractors Ltd",
      role: "Operations Manager",
      content: "Simple, effective, and built for Kiwi conditions. The regional council compliance is spot on.",
      rating: 5,
      project: "City Rebuild"
    }
  ],
  EU: [
    {
      name: "Hans W.",
      company: "Bau GmbH",
      role: "Geschäftsführer",
      content: "MuckAway.ai handles cross-border waste shipments within the EU flawlessly. Essential for our European projects.",
      rating: 5,
      project: "Airport Expansion"
    },
    {
      name: "Marie D.",
      company: "Travaux Publics SA",
      role: "Directrice",
      content: "La gestion des TGAP et la conformité environnementale sont parfaitement automatisées. Excellent!",
      rating: 5,
      project: "Grand Paris Express"
    },
    {
      name: "Carlos M.",
      company: "Construcciones SL",
      role: "Director General",
      content: "El sistema entiende las regulaciones españolas y europeas. Muy recomendable para grandes proyectos.",
      rating: 5,
      project: "Metro Extension"
    }
  ],
  BR: [
    {
      name: "Ricardo S.",
      company: "Construções Brasil Ltda",
      role: "Diretor de Operações",
      content: "MuckAway.ai entende as regulamentações do CONAMA e MTR. A gestão de resíduos da construção nunca foi tão simples.",
      rating: 5,
      project: "Linha 6 do Metrô SP"
    },
    {
      name: "Ana Paula M.",
      company: "Terraplanagem Nacional",
      role: "Gerente de Projetos",
      content: "A classificação automática de entulho nos ajuda a cumprir todas as normas ambientais. Excelente para grandes obras.",
      rating: 5,
      project: "Porto de Santos"
    },
    {
      name: "Carlos Eduardo L.",
      company: "Obras Civis SA",
      role: "Engenheiro Ambiental",
      content: "O sistema rastreia cada carga desde o canteiro até o destino final. Perfeito para a gestão de resíduos classe A e B.",
      rating: 5,
      project: "Complexo Viário RJ"
    }
  ],
  IN: [
    {
      name: "Rajesh K.",
      company: "National Infrastructure Ltd",
      role: "Project Director",
      content: "MuckAway.ai handles CPCB compliance seamlessly. Essential for our metro and highway projects across India.",
      rating: 5,
      project: "Mumbai Metro Line 3"
    },
    {
      name: "Priya S.",
      company: "Civil Works India Pvt Ltd",
      role: "Operations Head",
      content: "The debris classification and municipal compliance tracking save us countless hours. Perfect for Indian regulations.",
      rating: 5,
      project: "Delhi-Mumbai Expressway"
    },
    {
      name: "Amit P.",
      company: "Construction Solutions",
      role: "Site Manager",
      content: "From C&D waste to excavation spoil, the AI classifies everything correctly for Indian waste categories.",
      rating: 5,
      project: "Bangalore Airport Expansion"
    }
  ],
  SG: [
    {
      name: "David Tan",
      company: "Singapore Civil Engineering Pte Ltd",
      role: "Managing Director",
      content: "MuckAway.ai integrates perfectly with NEA requirements. The BCA compliance tracking is exactly what we needed.",
      rating: 5,
      project: "Cross Island Line"
    },
    {
      name: "Michelle Lee",
      company: "Jurong Construction",
      role: "Environmental Manager",
      content: "The system understands Singapore's strict waste disposal regulations. Essential for any construction project here.",
      rating: 5,
      project: "Tuas Mega Port"
    },
    {
      name: "Kevin Wong",
      company: "Infrastructure Pte Ltd",
      role: "Project Manager",
      content: "Zero waste to landfill tracking has helped us meet our sustainability targets. Highly recommended.",
      rating: 5,
      project: "Changi T5"
    }
  ],
  AE: [
    {
      name: "Mohammed Al-Rashid",
      company: "Emirates Construction LLC",
      role: "General Manager",
      content: "MuckAway.ai handles Dubai Municipality requirements perfectly. The Arabic interface is excellent for our teams.",
      rating: 5,
      project: "Dubai Creek Harbour"
    },
    {
      name: "Fatima Hassan",
      company: "Abu Dhabi Civil Works",
      role: "Sustainability Director",
      content: "The system tracks Estidama compliance and helps us achieve Pearl rating requirements for waste management.",
      rating: 5,
      project: "Yas Island Development"
    },
    {
      name: "James Mitchell",
      company: "Gulf Infrastructure Group",
      role: "Operations Director",
      content: "Managing construction waste across multiple emirates is simple with MuckAway. Each emirate's requirements are handled.",
      rating: 5,
      project: "NEOM Support Works"
    }
  ],
  ZA: [
    {
      name: "Thabo Molefe",
      company: "Johannesburg Civils Pty Ltd",
      role: "Managing Director",
      content: "MuckAway.ai understands NEMWA requirements and provincial waste regulations. Essential for large SA projects.",
      rating: 5,
      project: "Gautrain Extension"
    },
    {
      name: "Sarah van der Berg",
      company: "Cape Construction",
      role: "Environmental Compliance Officer",
      content: "The system helps us meet SAWIC requirements and track rubble from demolition to recycling facility.",
      rating: 5,
      project: "Cape Town Foreshore"
    },
    {
      name: "Sipho Ndlovu",
      company: "Durban Earthmovers",
      role: "Operations Manager",
      content: "Simple and effective for managing construction and demolition waste. The municipal compliance tracking is spot on.",
      rating: 5,
      project: "Durban Point Development"
    }
  ],
  MY: [
    {
      name: "Ahmad Razak",
      company: "KL Construction Sdn Bhd",
      role: "Managing Director",
      content: "MuckAway.ai understands DOE requirements perfectly. The scheduled waste tracking helps us stay compliant across all our projects.",
      rating: 5,
      project: "ECRL Phase 2"
    },
    {
      name: "Lim Wei Chen",
      company: "Selangor Earthworks",
      role: "Operations Director",
      content: "Managing construction waste across Klang Valley is now seamless. The system integrates with local council requirements.",
      rating: 5,
      project: "MRT3 Circle Line"
    }
  ],
  ID: [
    {
      name: "Budi Santoso",
      company: "PT Konstruksi Nusantara",
      role: "Direktur Operasi",
      content: "MuckAway.ai memahami peraturan KLHK dengan baik. Pelacakan limbah B3 sangat membantu untuk kepatuhan lingkungan.",
      rating: 5,
      project: "Jakarta-Bandung HSR"
    },
    {
      name: "Dewi Kusuma",
      company: "PT Pembangunan Jaya",
      role: "Environmental Manager",
      content: "Sistem ini membantu kami memenuhi standar AMDAL dan mengelola limbah konstruksi secara efisien.",
      rating: 5,
      project: "IKN Nusantara"
    }
  ],
  PH: [
    {
      name: "Jose Antonio Reyes",
      company: "Metro Manila Builders Inc",
      role: "President",
      content: "MuckAway.ai helps us comply with RA 9003 requirements. The DENR-EMB integration saves us hours of paperwork.",
      rating: 5,
      project: "NSCR Rail"
    },
    {
      name: "Maria Santos",
      company: "Cebu Construction Corp",
      role: "Operations Manager",
      content: "Managing construction debris across Visayas is now simple. LGU compliance tracking is exactly what we needed.",
      rating: 5,
      project: "Cebu-Cordova Bridge"
    }
  ],
  TH: [
    {
      name: "Somchai Prasert",
      company: "Bangkok Construction Co Ltd",
      role: "General Manager",
      content: "MuckAway.ai เข้าใจกฎระเบียบของกรมควบคุมมลพิษได้อย่างดี ระบบนี้ช่วยให้เราปฏิบัติตามกฎหมายสิ่งแวดล้อมได้ง่าย",
      rating: 5,
      project: "Orange Line MRT"
    },
    {
      name: "Napat Wongcharoen",
      company: "Eastern Seaboard Contractors",
      role: "Site Director",
      content: "Essential for managing waste at our EEC industrial projects. DIW compliance tracking is comprehensive.",
      rating: 5,
      project: "EEC Industrial Estate"
    }
  ],
  VN: [
    {
      name: "Nguyen Van Minh",
      company: "Saigon Civil Engineering JSC",
      role: "Tổng Giám Đốc",
      content: "MuckAway.ai giúp chúng tôi tuân thủ Luật Bảo vệ Môi trường 2020. Hệ thống quản lý chất thải xây dựng rất hiệu quả.",
      rating: 5,
      project: "Metro Line 2 HCMC"
    },
    {
      name: "Tran Thi Lan",
      company: "Hanoi Infrastructure Corp",
      role: "Environmental Director",
      content: "Tracking construction waste from site to disposal has never been easier. MONRE compliance is handled automatically.",
      rating: 5,
      project: "Long Bien Bridge Renovation"
    }
  ],
  SA: [
    {
      name: "Abdullah Al-Rashid",
      company: "Saudi Construction Company",
      role: "CEO",
      content: "MuckAway.ai يفهم متطلبات البلدية والبيئة السعودية. نظام ممتاز لإدارة مخلفات البناء في مشاريعنا الكبرى.",
      rating: 5,
      project: "NEOM Infrastructure"
    },
    {
      name: "Khalid Al-Mutairi",
      company: "Riyadh Civil Works",
      role: "Operations Director",
      content: "Essential for Vision 2030 mega-projects. The system handles MEWA regulations and municipality requirements seamlessly.",
      rating: 5,
      project: "Riyadh Metro"
    },
    {
      name: "Fahad Al-Qahtani",
      company: "Jeddah Contractors LLC",
      role: "Project Manager",
      content: "Managing construction waste across multiple Saudi regions is now simple. Full compliance with Saudi Building Code.",
      rating: 5,
      project: "Red Sea Project"
    }
  ],
  DEFAULT: [
    {
      name: "Construction Professional",
      company: "International Projects Ltd",
      role: "Project Director",
      content: "MuckAway.ai adapts to local regulations wherever we work. It's become essential for our international operations.",
      rating: 5,
      project: "Multi-Region Development"
    }
  ]
};

export const getTestimonialsForRegion = (countryCode: string): Testimonial[] => {
  const upperCode = countryCode?.toUpperCase();
  
  const countryToRegion: Record<string, string> = {
    'GB': 'UK', 'UK': 'UK',
    'US': 'US', 'USA': 'US',
    'AU': 'AU', 'AUS': 'AU',
    'CA': 'CA', 'CAN': 'CA',
    'NZ': 'NZ', 'NZL': 'NZ',
    'DE': 'EU', 'FR': 'EU', 'NL': 'EU', 'BE': 'EU', 'IE': 'EU', 'ES': 'EU', 'IT': 'EU', 'AT': 'EU', 'PT': 'EU',
    'BR': 'BR', 'BRA': 'BR',
    'IN': 'IN', 'IND': 'IN',
    'SG': 'SG', 'SGP': 'SG',
    'AE': 'AE', 'ARE': 'AE',
    'ZA': 'ZA', 'ZAF': 'ZA',
    'MY': 'MY', 'MYS': 'MY',
    'ID': 'ID', 'IDN': 'ID',
    'PH': 'PH', 'PHL': 'PH',
    'TH': 'TH', 'THA': 'TH',
    'VN': 'VN', 'VNM': 'VN',
    'SA': 'SA', 'SAU': 'SA',
  };

  const regionCode = countryToRegion[upperCode] || 'DEFAULT';
  return REGIONAL_TESTIMONIALS[regionCode] || REGIONAL_TESTIMONIALS['DEFAULT'];
};
