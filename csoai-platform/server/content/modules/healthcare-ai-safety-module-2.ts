import type { QuizQuestion } from '@/types/quiz';

export const healthcareAiSafetyModule2Quiz: QuizQuestion[] = [
  {
    id: 1,
    question: 'What is the EU MDR (Medical Device Regulation) approach to AI medical devices?',
    options: [
      'AI devices are exempt from MDR',
      'AI medical devices must comply with MDR requirements including risk classification and conformity assessment',
      'Only hardware devices are regulated',
      'AI regulation is separate from MDR',
    ],
    correctAnswer: 1,
    explanation: 'Under EU MDR, AI-based medical devices must comply with risk classification, conformity assessment, clinical evaluation, and post-market surveillance requirements like other medical devices.',
  },
  {
    id: 2,
    question: 'What is "intended use" in healthcare AI regulation?',
    options: [
      'How developers intend to profit from the AI',
      'The objective, specific medical purpose for which the AI device is designed',
      'Intended users of the system',
      'The intended lifespan of the device',
    ],
    correctAnswer: 1,
    explanation: 'Intended use defines the objective, specific medical purpose for which an AI device is designed, and is fundamental to determining regulatory classification and compliance requirements.',
  },
  {
    id: 3,
    question: 'What is "post-market surveillance" for healthcare AI?',
    options: [
      'Surveillance cameras in hospitals',
      'Ongoing monitoring of AI device safety and performance after market release',
      'Market research after product launch',
      'Tracking device sales',
    ],
    correctAnswer: 1,
    explanation: 'Post-market surveillance involves ongoing, systematic collection and analysis of data on AI device safety and performance after market release, including adverse event monitoring and performance tracking.',
  },
  {
    id: 4,
    question: 'What is the significance of "training data diversity" in healthcare AI?',
    options: [
      'Using diverse programming languages',
      'Ensuring AI is trained on data representing diverse patient populations to ensure equitable performance',
      'Diversity in the AI development team',
      'Using data from diverse hospitals only',
    ],
    correctAnswer: 1,
    explanation: 'Training data diversity is crucial for ensuring healthcare AI performs equitably across different patient populations, reducing bias related to race, ethnicity, gender, age, and other factors.',
  },
  {
    id: 5,
    question: 'What is an "adverse event" in the context of healthcare AI?',
    options: [
      'Negative publicity about AI',
      'Any incident where an AI device may have caused or contributed to patient harm',
      'System downtime',
      'Negative user feedback',
    ],
    correctAnswer: 1,
    explanation: 'An adverse event is any incident where an AI medical device may have caused or contributed to death, serious injury, or could potentially cause harm, requiring reporting to regulatory authorities.',
  },
  {
    id: 6,
    question: 'What is "explainability" in healthcare AI systems?',
    options: [
      'Explaining AI to hospital administrators',
      'The ability to understand and communicate how AI reaches clinical recommendations',
      'Explaining costs to patients',
      'Documentation for regulators only',
    ],
    correctAnswer: 1,
    explanation: 'Explainability in healthcare AI refers to the ability to understand and communicate how the AI system reaches its clinical recommendations or diagnoses, enabling clinicians to appropriately evaluate and apply AI outputs.',
  },
  {
    id: 7,
    question: 'What is the "total product lifecycle" approach to AI regulation?',
    options: [
      'Only regulating the manufacturing phase',
      'Regulating AI devices throughout design, development, deployment, monitoring, and decommissioning',
      'Lifecycle of the company making AI',
      'Product warranty period',
    ],
    correctAnswer: 1,
    explanation: 'The total product lifecycle approach regulates AI medical devices throughout their entire lifecycle, from initial design and development through deployment, ongoing monitoring, updates, and eventual decommissioning.',
  },
  {
    id: 8,
    question: 'What is "analytical validation" for healthcare AI?',
    options: [
      'Validating the financial analysis of AI investment',
      'Demonstrating that an AI accurately and reliably performs its analytical functions',
      'Analyzing validation documents',
      'Validating analytics dashboards',
    ],
    correctAnswer: 1,
    explanation: 'Analytical validation demonstrates that an AI system accurately and reliably performs its intended analytical functions, such as correctly measuring, detecting, or classifying the target clinical condition.',
  },
  {
    id: 9,
    question: 'How does the EU AI Act interact with medical device regulations?',
    options: [
      'They are completely separate',
      'High-risk medical AI must comply with both EU AI Act and MDR/IVDR requirements',
      'EU AI Act replaces medical device regulations',
      'Medical AI is exempt from EU AI Act',
    ],
    correctAnswer: 1,
    explanation: 'High-risk AI used in medical devices must comply with both the EU AI Act and Medical Device Regulation (MDR) or In Vitro Diagnostic Regulation (IVDR), creating overlapping compliance requirements.',
  },
  {
    id: 10,
    question: 'What is "real-world evidence" in healthcare AI validation?',
    options: [
      'Evidence from the real world vs. digital world',
      'Data from routine clinical practice used to evaluate AI performance outside controlled trials',
      'Evidence that AI exists in reality',
      'World health statistics',
    ],
    correctAnswer: 1,
    explanation: 'Real-world evidence comes from routine clinical practice and healthcare delivery, used to evaluate how AI systems perform outside the controlled conditions of clinical trials.',
  },
];
