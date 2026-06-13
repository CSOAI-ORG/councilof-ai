/**
 * Static course data for the CSOAI platform
 * This data is used when the backend API is not available
 */

export interface CourseModule {
  title: string;
  description: string;
  durationMinutes: number;
}

export interface Course {
  id: number;
  title: string;
  description: string;
  framework: string;
  level: 'fundamentals' | 'advanced' | 'specialist';
  durationHours: number;
  modules: CourseModule[];
  pricing: {
    oneTime: number;
    threeMonth?: number;
    sixMonth?: number;
    twelveMonth?: number;
  };
  regionId: number;
}

export interface Region {
  id: number;
  name: string;
  code: string;
}

// Regions data
export const regions: Region[] = [
  { id: 1, name: 'European Union', code: 'EU' },
  { id: 2, name: 'United States', code: 'US' },
  { id: 3, name: 'United Kingdom', code: 'UK' },
  { id: 4, name: 'China', code: 'CN' },
  { id: 5, name: 'Canada', code: 'CA' },
  { id: 6, name: 'Australia', code: 'AU' },
  { id: 7, name: 'Global', code: 'GLOBAL' },
];

// Comprehensive course catalog
export const courses: Course[] = [
  {
    id: 1,
    title: 'EU AI Act Compliance Fundamentals',
    description: 'Master the requirements of the EU AI Act (Regulation 2024/1689) and prepare your organization for compliance. This comprehensive course covers all 113 articles, risk classification, prohibited practices, and implementation timelines.',
    framework: 'EU AI Act',
    level: 'fundamentals',
    durationHours: 8,
    regionId: 1,
    modules: [
      { title: 'Introduction to the EU AI Act', description: 'Overview, purpose, scope, and risk-based approach', durationMinutes: 60 },
      { title: 'Risk Classification System', description: 'Understanding the four-tier risk system', durationMinutes: 60 },
      { title: 'Prohibited AI Practices', description: 'Article 5 prohibitions and exceptions', durationMinutes: 60 },
      { title: 'High-Risk AI Systems', description: 'Requirements for high-risk AI deployment', durationMinutes: 60 },
      { title: 'Transparency Requirements', description: 'Disclosure obligations for AI systems', durationMinutes: 60 },
      { title: 'Conformity Assessment', description: 'CE marking and compliance procedures', durationMinutes: 60 },
      { title: 'Governance & Enforcement', description: 'Supervisory authorities and penalties', durationMinutes: 60 },
      { title: 'Implementation Timeline', description: 'Phased compliance deadlines', durationMinutes: 60 },
    ],
    pricing: {
      oneTime: 19900,
      threeMonth: 22900,
      sixMonth: 24900,
      twelveMonth: 26900,
    },
  },
  {
    id: 2,
    title: 'NIST AI Risk Management Framework',
    description: 'Comprehensive training on the NIST AI RMF, covering trustworthy AI characteristics, the four core functions (GOVERN, MAP, MEASURE, MANAGE), and implementation strategies for building responsible AI systems.',
    framework: 'NIST AI RMF',
    level: 'advanced',
    durationHours: 12,
    regionId: 2,
    modules: [
      { title: 'Introduction to NIST AI RMF', description: 'Framework overview and objectives', durationMinutes: 90 },
      { title: 'Trustworthy AI Characteristics', description: 'Seven characteristics of trustworthy AI', durationMinutes: 90 },
      { title: 'GOVERN Function', description: 'Organizational governance and culture', durationMinutes: 90 },
      { title: 'MAP Function', description: 'Risk identification and contextualization', durationMinutes: 90 },
      { title: 'MEASURE Function', description: 'Risk assessment and measurement', durationMinutes: 90 },
      { title: 'MANAGE Function', description: 'Risk treatment and response', durationMinutes: 90 },
      { title: 'AI Lifecycle Integration', description: 'Applying RMF across AI lifecycle', durationMinutes: 90 },
      { title: 'Implementation Strategies', description: 'Practical deployment guidance', durationMinutes: 90 },
    ],
    pricing: {
      oneTime: 24900,
      threeMonth: 28900,
      sixMonth: 31900,
      twelveMonth: 34900,
    },
  },
  {
    id: 3,
    title: 'ISO/IEC 42001: AI Management System',
    description: 'Complete guide to ISO 42001 certification, covering the AI Management System (AIMS) structure, context and leadership requirements, planning and risk management, operational controls, and continuous improvement.',
    framework: 'ISO/IEC 42001',
    level: 'specialist',
    durationHours: 14,
    regionId: 7,
    modules: [
      { title: 'AIMS Framework Overview', description: 'AI Management System structure', durationMinutes: 105 },
      { title: 'Context of the Organization', description: 'Internal/external factors and stakeholders', durationMinutes: 105 },
      { title: 'Leadership & Commitment', description: 'Top management responsibilities', durationMinutes: 105 },
      { title: 'Planning for AIMS', description: 'Risk assessment and objectives', durationMinutes: 105 },
      { title: 'Support & Resources', description: 'Competence and documentation', durationMinutes: 105 },
      { title: 'Operational Controls', description: 'AI development and deployment controls', durationMinutes: 105 },
      { title: 'Performance Evaluation', description: 'Monitoring, measurement, and audit', durationMinutes: 105 },
      { title: 'Continual Improvement', description: 'Nonconformity and corrective action', durationMinutes: 105 },
    ],
    pricing: {
      oneTime: 29900,
      threeMonth: 34900,
      sixMonth: 38900,
      twelveMonth: 42900,
    },
  },
];

// Course bundles
export interface CourseBundle {
  id: number;
  name: string;
  description: string;
  courseIds: number[];
  regularPrice: number;
  pricing: {
    oneTime: number;
    threeMonth?: number;
  };
  savings: number;
}

export const bundles: CourseBundle[] = [
  {
    id: 1,
    name: 'Global AI Compliance Master Bundle',
    description: 'Complete training on EU AI Act, NIST AI RMF, and ISO 42001 - everything you need for global AI compliance leadership.',
    courseIds: [1, 2, 3],
    regularPrice: 74700,
    pricing: {
      oneTime: 59900,
      threeMonth: 69900,
    },
    savings: 14800,
  },
];
