import { drizzle } from "drizzle-orm/mysql2";
import { jobPostings } from "../drizzle/schema.ts";

const db = drizzle(process.env.DATABASE_URL);

const sampleJobs = [
  {
    title: "AI Safety Analyst - Entry Level",
    company: "TechCorp AI",
    location: "Remote",
    locationType: "remote",
    country: "United States",
    payRate: 4500, // $45/hr in cents
    payRateMax: 6500, // $65/hr
    payCurrency: "USD",
    experienceLevel: "entry",
    employmentType: "full_time",
    description: "Join our AI Safety team to help ensure responsible AI deployment across our product line. Perfect for recent graduates with CSOAI certification.",
    responsibilities: "Monitor AI system compliance\nConduct risk assessments\nDocument safety incidents\nCollaborate with engineering teams",
    requirements: "CSOAI Foundation Certification\nStrong analytical skills\nExcellent written communication\nFamiliarity with AI ethics frameworks",
    requiredCertifications: "CSOAI Foundation",
    preferredCertifications: "NIST AI RMF, EU AI Act Compliance",
    benefits: "Health insurance\n401(k) matching\nRemote work\nProfessional development budget",
    contactEmail: "careers@techcorp.ai",
    status: "active",
    viewCount: 127,
    applicationCount: 15,
  },
  {
    title: "Senior AI Compliance Officer",
    company: "FinanceAI Solutions",
    location: "New York, NY",
    locationType: "hybrid",
    country: "United States",
    payRate: 8500, // $85/hr
    payRateMax: 12000, // $120/hr
    payCurrency: "USD",
    experienceLevel: "senior",
    employmentType: "full_time",
    description: "Lead our AI compliance program for financial services. Ensure all AI systems meet regulatory requirements including EU AI Act and US financial regulations.",
    responsibilities: "Develop compliance frameworks\nLead audit processes\nTrain junior analysts\nInterface with regulators\nManage compliance documentation",
    requirements: "5+ years AI safety experience\nCSOAI Professional Certification\nFinancial services background\nRegulatory compliance expertise",
    requiredCertifications: "CSOAI Professional, ISO 42001",
    preferredCertifications: "TC260, EU AI Act Specialist",
    benefits: "Competitive salary\nStock options\nHealth & dental\nFlexible schedule\nRemote Fridays",
    contactEmail: "hr@financeai.com",
    status: "active",
    viewCount: 89,
    applicationCount: 8,
  },
  {
    title: "AI Ethics Researcher",
    company: "Global AI Institute",
    location: "Remote",
    locationType: "remote",
    country: "United Kingdom",
    payRate: 5500, // £55/hr equivalent
    payRateMax: 7500,
    payCurrency: "GBP",
    experienceLevel: "mid",
    employmentType: "contract",
    description: "Research position focusing on AI ethics, bias detection, and fairness in machine learning systems. 6-month contract with possibility of extension.",
    responsibilities: "Conduct ethics research\nPublish findings\nDevelop bias detection tools\nCollaborate with academic partners",
    requirements: "Master's degree in related field\nResearch experience\nCSOAI certification\nPublished papers preferred",
    requiredCertifications: "CSOAI Foundation",
    preferredCertifications: "CSOAI Professional, Academic credentials",
    benefits: "Flexible hours\nConference attendance\nPublication support\nRemote work",
    contactEmail: "research@globalai.org",
    status: "active",
    viewCount: 203,
    applicationCount: 31,
  },
  {
    title: "AI Safety Consultant - Healthcare",
    company: "MedTech Innovations",
    location: "San Francisco, CA",
    locationType: "onsite",
    country: "United States",
    payRate: 7000, // $70/hr
    payRateMax: 9500,
    payCurrency: "USD",
    experienceLevel: "mid",
    employmentType: "full_time",
    description: "Ensure AI safety and compliance for healthcare AI products. Work with medical device teams to meet FDA and EU MDR requirements.",
    responsibilities: "Healthcare AI compliance\nRisk management\nClinical validation support\nRegulatory submissions",
    requirements: "Healthcare AI experience\nCSOAI certification\nFDA/MDR knowledge\n3+ years relevant experience",
    requiredCertifications: "CSOAI Professional",
    preferredCertifications: "ISO 13485, ISO 42001",
    benefits: "Health insurance\nStock options\nGym membership\nCatered lunches\nLearning budget",
    contactEmail: "jobs@medtechinnovations.com",
    status: "active",
    viewCount: 156,
    applicationCount: 22,
  },
  {
    title: "Junior AI Auditor",
    company: "Compliance Partners LLC",
    location: "Remote",
    locationType: "remote",
    country: "Canada",
    payRate: 3500, // $35/hr CAD
    payRateMax: 5000,
    payCurrency: "CAD",
    experienceLevel: "entry",
    employmentType: "part_time",
    description: "Part-time position for certified AI safety analysts. Conduct audits of client AI systems and prepare compliance reports.",
    responsibilities: "Conduct AI system audits\nPrepare audit reports\nClient communication\nDocumentation review",
    requirements: "CSOAI Foundation Certification\nAttention to detail\nReport writing skills\nAvailable 20 hours/week",
    requiredCertifications: "CSOAI Foundation",
    preferredCertifications: "CSOAI Professional",
    benefits: "Flexible schedule\nRemote work\nProfessional development\nPerformance bonuses",
    contactEmail: "hiring@compliancepartners.ca",
    status: "active",
    viewCount: 94,
    applicationCount: 18,
  },
  {
    title: "Lead AI Risk Manager",
    company: "AutoDrive Systems",
    location: "Munich, Germany",
    locationType: "hybrid",
    country: "Germany",
    payRate: 9000, // €90/hr
    payRateMax: 13000,
    payCurrency: "EUR",
    experienceLevel: "lead",
    employmentType: "full_time",
    description: "Lead our AI risk management team for autonomous vehicle systems. Ensure compliance with EU AI Act high-risk requirements.",
    responsibilities: "Lead risk management\nEU AI Act compliance\nTeam management\nStakeholder communication\nSafety case development",
    requirements: "7+ years AI safety experience\nAutonomous systems background\nEU AI Act expertise\nTeam leadership experience",
    requiredCertifications: "CSOAI Professional, EU AI Act Specialist",
    preferredCertifications: "ISO 26262, TC260",
    benefits: "Competitive salary\nCompany car\nRelocation assistance\nHealth insurance\n30 days vacation",
    contactEmail: "careers@autodrive.de",
    status: "active",
    viewCount: 67,
    applicationCount: 5,
  },
  {
    title: "AI Safety Analyst - E-commerce",
    company: "ShopSmart AI",
    location: "Remote",
    locationType: "remote",
    country: "Singapore",
    payRate: 5000, // $50/hr SGD
    payRateMax: 7000,
    payCurrency: "SGD",
    experienceLevel: "mid",
    employmentType: "full_time",
    description: "Ensure AI safety for our recommendation and personalization systems. Focus on bias detection and fairness in e-commerce AI.",
    responsibilities: "Monitor recommendation systems\nBias detection and mitigation\nCompliance reporting\nCross-functional collaboration",
    requirements: "2+ years AI safety experience\nCSOAI certification\nE-commerce background helpful\nData analysis skills",
    requiredCertifications: "CSOAI Foundation",
    preferredCertifications: "CSOAI Professional, Data Science certifications",
    benefits: "Competitive salary\nRemote work\nHealth insurance\nAnnual bonus\nLearning stipend",
    contactEmail: "hr@shopsmart.sg",
    status: "active",
    viewCount: 112,
    applicationCount: 19,
  },
  {
    title: "Freelance AI Compliance Consultant",
    company: "Independent Contractors Network",
    location: "Remote",
    locationType: "remote",
    country: "Worldwide",
    payRate: 6000, // $60/hr
    payRateMax: 15000, // $150/hr
    payCurrency: "USD",
    experienceLevel: "senior",
    employmentType: "freelance",
    description: "Join our network of AI compliance consultants. Work on diverse projects across industries. Set your own schedule and rates.",
    responsibilities: "Client AI assessments\nCompliance consulting\nReport writing\nBest practices recommendations",
    requirements: "CSOAI Professional Certification\n3+ years experience\nStrong communication\nSelf-motivated",
    requiredCertifications: "CSOAI Professional",
    preferredCertifications: "Multiple framework certifications",
    benefits: "Flexible schedule\nChoose your projects\nCompetitive rates\nGlobal client base",
    contactEmail: "network@aicontractors.com",
    status: "active",
    viewCount: 245,
    applicationCount: 47,
  },
];

async function seedJobs() {
  console.log("🌱 Seeding job postings...");

  try {
    for (const job of sampleJobs) {
      await db.insert(jobPostings).values(job);
      console.log(`✅ Created job: ${job.title} at ${job.company}`);
    }

    console.log(`\n✅ Successfully seeded ${sampleJobs.length} job postings!`);
  } catch (error) {
    console.error("❌ Error seeding jobs:", error);
    process.exit(1);
  }

  process.exit(0);
}

seedJobs();
