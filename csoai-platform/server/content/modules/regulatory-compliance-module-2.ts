import type { QuizQuestion } from '@/types/quiz';

export const regulatoryComplianceModule2Quiz: QuizQuestion[] = [
  {
    id: 1,
    question: 'What is a "notified body" in the context of AI regulation?',
    options: [
      'An organization that receives notifications about AI incidents',
      'A third-party organization authorized to perform conformity assessments',
      'A government body that notifies companies of violations',
      'An AI system that sends notifications',
    ],
    correctAnswer: 1,
    explanation: 'A notified body is an independent third-party organization designated by authorities to assess whether high-risk AI systems meet regulatory requirements through conformity assessment procedures.',
  },
  {
    id: 2,
    question: 'What documentation is typically required for high-risk AI system compliance?',
    options: [
      'Only the user manual',
      'Technical documentation, risk assessment, quality management records, and instructions for use',
      'Marketing materials only',
      'Source code only',
    ],
    correctAnswer: 1,
    explanation: 'High-risk AI compliance typically requires comprehensive documentation including technical specifications, risk management records, quality management procedures, training data information, and usage instructions.',
  },
  {
    id: 3,
    question: 'What is "post-market monitoring" in AI regulation?',
    options: [
      'Monitoring AI marketing campaigns',
      'Ongoing surveillance of AI system performance and safety after deployment',
      'Monitoring AI system sales',
      'Post-purchase customer surveys',
    ],
    correctAnswer: 1,
    explanation: 'Post-market monitoring involves continuous surveillance of AI system performance, safety, and compliance after deployment, including collecting feedback, monitoring incidents, and updating risk assessments.',
  },
  {
    id: 4,
    question: 'What is the purpose of an "AI registry" or database under regulations?',
    options: [
      'To store AI training data',
      'To maintain a public record of high-risk AI systems for transparency and oversight',
      'To register AI developers',
      'To track AI hardware inventory',
    ],
    correctAnswer: 1,
    explanation: 'AI registries maintain public records of high-risk AI systems, enabling transparency, oversight, and public awareness of AI systems deployed in high-stakes applications.',
  },
  {
    id: 5,
    question: 'What are "harmonized standards" in EU AI regulation?',
    options: [
      'Musical standards for AI audio processing',
      'Technical standards that, if followed, create a presumption of conformity with legal requirements',
      'Standards for harmonizing different AI systems',
      'Agreement standards between companies',
    ],
    correctAnswer: 1,
    explanation: 'Harmonized standards are technical standards developed by recognized bodies that, when followed, create a presumption that the AI system complies with the relevant regulatory requirements.',
  },
  {
    id: 6,
    question: 'What is "regulatory sandboxing" for AI?',
    options: [
      'Isolating AI systems from regulations',
      'A controlled environment to test innovative AI under regulatory supervision',
      'Sandbox testing environments for AI software',
      'Regulating AI in beach areas only',
    ],
    correctAnswer: 1,
    explanation: 'Regulatory sandboxes are controlled environments established by regulators where innovative AI systems can be developed and tested under supervision, helping understand real-world implications before full deployment.',
  },
  {
    id: 7,
    question: 'What is "CE marking" for AI products in the EU?',
    options: [
      'A certification for Chinese exports',
      'A marking indicating the product meets EU safety and compliance requirements',
      'A trademark for European AI companies',
      'A customer experience rating',
    ],
    correctAnswer: 1,
    explanation: 'CE marking indicates that a product, including AI systems, meets EU safety, health, and environmental protection requirements. For high-risk AI, it confirms successful conformity assessment.',
  },
  {
    id: 8,
    question: 'What penalties can organizations face for non-compliance with the EU AI Act?',
    options: [
      'Only warnings and recommendations',
      'Fines up to 35 million euros or 7% of global turnover for the most serious violations',
      'Maximum fine of 10,000 euros',
      'No financial penalties, only operational restrictions',
    ],
    correctAnswer: 1,
    explanation: 'The EU AI Act includes significant penalties: up to 35 million euros or 7% of global annual turnover for prohibited AI practices, with lower but still substantial fines for other violations.',
  },
  {
    id: 9,
    question: 'What is a "compliance gap analysis" for AI systems?',
    options: [
      'Analyzing gaps in AI performance',
      'Systematic assessment of differences between current practices and regulatory requirements',
      'Finding gaps in AI training data',
      'Measuring time gaps in AI processing',
    ],
    correctAnswer: 1,
    explanation: 'A compliance gap analysis systematically identifies differences between an organization\'s current AI practices and applicable regulatory requirements, forming the basis for a compliance roadmap.',
  },
  {
    id: 10,
    question: 'What is the "right to explanation" in AI regulation?',
    options: [
      'The right of AI developers to explain their technology',
      'The right of individuals to receive meaningful information about AI decisions affecting them',
      'The right to explain AI failures',
      'The requirement for AI to explain itself automatically',
    ],
    correctAnswer: 1,
    explanation: 'The right to explanation (appearing in GDPR and other regulations) gives individuals the right to receive meaningful information about the logic involved in AI decisions that significantly affect them.',
  },
];
