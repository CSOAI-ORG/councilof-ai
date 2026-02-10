import type { QuizQuestion } from '@/types/quiz';

export const euAiActModule5Quiz: QuizQuestion[] = [
  {
    id: 1,
    question: 'What is the role of national competent authorities in EU AI Act enforcement?',
    options: [
      'They have no role; only the European Commission enforces the EU AI Act',
      'They are responsible for market surveillance, investigation, and enforcement within their member states',
      'They can only provide advisory guidance with no enforcement power',
      'They enforce only in the financial sector, not AI regulations'
    ],
    correctAnswer: 1,
    explanation: 'National competent authorities designated by each EU member state are responsible for market surveillance, investigation of violations, enforcement actions, and penalization within their territories. They work alongside the European AI Board to coordinate EU-wide enforcement.'
  },
  {
    id: 2,
    question: 'What is market surveillance under the EU AI Act?',
    options: [
      'Monitoring the financial performance of AI companies',
      'Systematic oversight of AI systems in the market to ensure compliance with EU AI Act requirements',
      'Tracking which countries purchase the most AI systems',
      'Counting the number of AI companies operating in the EU'
    ],
    correctAnswer: 1,
    explanation: 'Market surveillance involves continuous monitoring of AI systems available in the EU market to verify compliance with legal requirements. National authorities conduct inspections, request documentation, and test compliance to protect consumers and fundamental rights.'
  },
  {
    id: 3,
    question: 'What is the maximum fine for violations of prohibited AI practices (Article 5) under the EU AI Act?',
    options: [
      'EUR 10 million or 2% of global revenue',
      'EUR 30 million or 6% of global annual revenue',
      'EUR 50 million or 10% of global annual revenue',
      'EUR 15 million or 3% of global annual revenue'
    ],
    correctAnswer: 1,
    explanation: 'Article 71 establishes fines for prohibited practices of up to EUR 30 million or 6% of global annual revenue (whichever is higher). This is the highest penalty tier, reflecting the serious nature of banned AI practices that threaten fundamental rights.'
  },
  {
    id: 4,
    question: 'What fine tier applies to violations of high-risk AI system requirements?',
    options: [
      'EUR 30 million or 6% of global revenue',
      'EUR 15 million or 3% of global annual revenue',
      'EUR 7.5 million or 1.5% of global annual revenue',
      'EUR 5 million or 1% of global annual revenue'
    ],
    correctAnswer: 1,
    explanation: 'Violations of high-risk AI system requirements (Articles 6-15, including conformity assessment and technical documentation) carry fines up to EUR 15 million or 3% of global annual revenue. This tier recognizes the importance of compliance for systems affecting fundamental rights.'
  },
  {
    id: 5,
    question: 'What is the penalty for violating transparency and record-keeping requirements under the EU AI Act?',
    options: [
      'EUR 30 million or 6% of global revenue',
      'EUR 15 million or 3% of global annual revenue',
      'EUR 7.5 million or 1.5% of global annual revenue',
      'EUR 10 million or 2% of global annual revenue'
    ],
    correctAnswer: 2,
    explanation: 'Violations of transparency obligations, record-keeping, and limited-risk AI system requirements carry fines up to EUR 7.5 million or 1.5% of global annual revenue. These administrative penalties encourage compliance with informational and procedural obligations.'
  },
  {
    id: 6,
    question: 'What is the European AI Board\'s primary function?',
    options: [
      'To replace national competent authorities in all enforcement decisions',
      'To coordinate enforcement, provide guidance, and ensure consistent application of the EU AI Act across member states',
      'To approve all AI systems before they enter the EU market',
      'To solely focus on charging high fines to AI companies'
    ],
    correctAnswer: 1,
    explanation: 'The European AI Board, composed of representatives from member states and the European Commission, coordinates enforcement efforts, develops guidance, handles cross-border disputes, and ensures consistent application of the EU AI Act throughout the EU.'
  },
  {
    id: 7,
    question: 'How does the concept of "global annual revenue" in EU AI Act penalties apply to smaller companies?',
    options: [
      'Small companies are always exempt from fines',
      'The percentage-based penalties (% of global revenue) are adjusted for smaller companies to remain proportionate',
      'Small companies pay the full penalty regardless of size',
      'The EU AI Act does not distinguish between company sizes for penalties'
    ],
    correctAnswer: 1,
    explanation: 'The EU AI Act\'s percentage-based penalty calculation (6%, 3%, 1.5% of global revenue) applies proportionally across company sizes. For smaller companies, these percentages may result in proportionally lower absolute fines while maintaining the regulatory standard.'
  },
  {
    id: 8,
    question: 'What enforcement powers do national competent authorities have regarding non-compliant AI systems?',
    options: [
      'They can only issue warnings with no binding effect',
      'They can mandate market withdrawal, issue fines, conduct inspections, and require corrective actions',
      'They have no enforcement powers; only courts can take action',
      'They can only assess fines but cannot remove systems from the market'
    ],
    correctAnswer: 1,
    explanation: 'National authorities have broad enforcement powers including market withdrawal orders, corrective action requirements, fines, administrative penalties, and inspection authority. They can act decisively to remove non-compliant AI systems from circulation.'
  },
  {
    id: 9,
    question: 'How are penalties calculated when a company violates multiple articles of the EU AI Act?',
    options: [
      'The company pays the penalty for only the most serious violation',
      'Each violation results in separate penalties, potentially combining to substantially higher total fines',
      'Violations are combined and penalties never exceed the highest single violation tier',
      'The EU AI Act does not address multiple violations'
    ],
    correctAnswer: 1,
    explanation: 'Multiple violations can result in cumulative penalties. If a company violates prohibited practices AND high-risk requirements, it may face fines stacking multiple tiers, though authorities consider proportionality and overall context.'
  },
  {
    id: 10,
    question: 'What role does the European Commission play in EU AI Act enforcement beyond the national level?',
    options: [
      'The Commission enforces only against EU institutions and agencies',
      'The Commission investigates systemic breaches, coordinates with member states, and can directly enforce against large systematic violations',
      'The Commission has no enforcement role whatsoever',
      'The Commission only provides voluntary guidance to AI companies'
    ],
    correctAnswer: 1,
    explanation: 'The European Commission directly enforces the EU AI Act for providers with significant EU-wide market presence, investigates systemic breaches, coordinates enforcement with member states, and ensures consistent application of the regulation across the EU.'
  }
];
